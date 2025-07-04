import os
import asyncio
import subprocess
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import tempfile
import shutil
from datetime import datetime
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from services.video_processor import VideoProcessor
from services.ai_analyzer import AIAnalyzer
from models.project import Clip

logger = logging.getLogger(__name__)

class VideoEditor:
    """AI-powered video editing service"""
    
    def __init__(self, ai_analyzer: Optional[AIAnalyzer] = None):
        self.video_processor = VideoProcessor()
        self.ai_analyzer = ai_analyzer
        self.temp_dir = Path(tempfile.gettempdir()) / "openclip_editor"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Supported output formats
        self.supported_output_formats = {
            'mp4': 'libx264',
            'webm': 'libvpx-vp9',
            'avi': 'libx264',
            'mov': 'libx264'
        }
        
        # Default editing presets
        self.editing_presets = {
            'social_media': {
                'resolution': '1080x1920',  # Vertical for TikTok/Reels
                'duration': 60,
                'format': 'mp4',
                'bitrate': '2M'
            },
            'youtube_short': {
                'resolution': '1080x1920',
                'duration': 60,
                'format': 'mp4',
                'bitrate': '4M'
            },
            'instagram': {
                'resolution': '1080x1080',  # Square for Instagram
                'duration': 30,
                'format': 'mp4',
                'bitrate': '2M'
            },
            'twitter': {
                'resolution': '1280x720',  # Landscape for Twitter
                'duration': 140,
                'format': 'mp4',
                'bitrate': '2M'
            }
        }
    
    async def create_ai_clip(self, video_path: str, analysis_prompt: str, 
                           preset: str = 'social_media', custom_settings: Optional[Dict] = None) -> Dict[str, Any]:
        """Create an AI-powered clip based on analysis prompt"""
        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            # Get video metadata
            metadata = await self.video_processor.extract_metadata(video_path)
            
            # Analyze video with AI
            if self.ai_analyzer:
                analysis_result = await self.ai_analyzer.analyze_video(
                    video_path, 
                    ['content_analysis', 'highlight_detection', 'clip_recommendations']
                )
                
                # Get AI recommendations
                ai_clips = await self._get_ai_clip_recommendations(
                    video_path, analysis_prompt, analysis_result
                )
            else:
                # Fallback to basic clip generation
                ai_clips = await self._generate_basic_clips(video_path, metadata)
            
            if not ai_clips:
                raise Exception("No suitable clips found")
            
            # Select best clip based on prompt
            selected_clip = self._select_best_clip(ai_clips, analysis_prompt)
            
            # Get editing preset
            preset_settings = self.editing_presets.get(preset, self.editing_presets['social_media'])
            if custom_settings:
                preset_settings.update(custom_settings)
            
            # Create the clip
            output_path = await self._create_clip(
                video_path, selected_clip, preset_settings
            )
            
            return {
                'clip_path': output_path,
                'clip_info': selected_clip,
                'preset_used': preset,
                'settings': preset_settings,
                'analysis_result': analysis_result if self.ai_analyzer else None
            }
            
        except Exception as e:
            logger.error(f"Error creating AI clip: {e}")
            return {
                'error': str(e),
                'status': 'failed'
            }
    
    async def _get_ai_clip_recommendations(self, video_path: str, prompt: str, 
                                         analysis_result: Dict) -> List[Dict[str, Any]]:
        """Get AI-powered clip recommendations"""
        try:
            # Use AI to analyze the prompt and find relevant clips
            if self.ai_analyzer:
                # Try different AI providers for clip recommendations
                clips = []
                
                # Try OpenAI
                if hasattr(self.ai_analyzer, '_analyze_with_openai'):
                    try:
                        openai_clips = await self.ai_analyzer._analyze_with_openai(
                            video_path, prompt, self.ai_analyzer.api_keys.get('openai', '')
                        )
                        clips.extend(openai_clips)
                    except Exception as e:
                        logger.warning(f"OpenAI clip analysis failed: {e}")
                
                # Try LM Studio
                try:
                    lmstudio_clips = await self.ai_analyzer._analyze_with_lmstudio(
                        video_path, prompt, 'local-model'
                    )
                    clips.extend(lmstudio_clips)
                except Exception as e:
                    logger.warning(f"LM Studio clip analysis failed: {e}")
                
                # If no AI clips, fall back to analysis-based recommendations
                if not clips and 'analyses' in analysis_result:
                    clip_analysis = analysis_result['analyses'].get('clip_recommendations', {})
                    clips = clip_analysis.get('clip_recommendations', [])
                
                return clips
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting AI clip recommendations: {e}")
            return []
    
    async def _generate_basic_clips(self, video_path: str, metadata: Dict) -> List[Dict[str, Any]]:
        """Generate basic clips when AI is not available"""
        try:
            duration = metadata.get('duration', 0)
            clips = []
            
            if duration > 60:  # Only for videos longer than 1 minute
                # Generate clips at different points
                clip_points = [0.2, 0.4, 0.6, 0.8]  # 20%, 40%, 60%, 80%
                
                for i, point in enumerate(clip_points):
                    start_time = duration * point
                    if start_time < duration - 30:  # Ensure 30s clip fits
                        clips.append({
                            'title': f'Clip {i+1}',
                            'start_time': start_time,
                            'end_time': min(start_time + 30, duration),
                            'duration': 30,
                            'score': 0.7 - (i * 0.1),  # Decreasing score
                            'explanation': f'Generated clip at {point*100:.0f}% of video'
                        })
            
            return clips
            
        except Exception as e:
            logger.error(f"Error generating basic clips: {e}")
            return []
    
    def _select_best_clip(self, clips: List[Dict], prompt: str) -> Dict[str, Any]:
        """Select the best clip based on prompt and scores"""
        if not clips:
            raise Exception("No clips available")
        
        # Sort by score (highest first)
        sorted_clips = sorted(clips, key=lambda x: x.get('score', 0), reverse=True)
        
        # Return the highest scoring clip
        return sorted_clips[0]
    
    async def _create_clip(self, video_path: str, clip_info: Dict, 
                          settings: Dict) -> str:
        """Create the actual video clip"""
        try:
            start_time = clip_info.get('start_time', 0)
            end_time = clip_info.get('end_time', start_time + 30)
            duration = end_time - start_time
            
            # Create output filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"clip_{timestamp}.{settings.get('format', 'mp4')}"
            output_path = os.path.join(self.temp_dir, output_filename)
            
            # Build FFmpeg command
            cmd = [
                self.video_processor.ffmpeg_path or 'ffmpeg',
                '-i', video_path,
                '-ss', str(start_time),
                '-t', str(duration),
                '-c:v', settings.get('video_codec', 'libx264'),
                '-c:a', settings.get('audio_codec', 'aac'),
                '-b:v', settings.get('bitrate', '2M'),
                '-preset', settings.get('preset', 'fast'),
                '-y',  # Overwrite output
                output_path
            ]
            
            # Add resolution scaling if specified
            if 'resolution' in settings:
                cmd.extend(['-vf', f'scale={settings["resolution"]}'])
            
            # Run FFmpeg
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg failed: {stderr.decode()}")
            
            if not os.path.exists(output_path):
                raise Exception("Output file was not created")
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error creating clip: {e}")
            raise
    
    async def add_subtitles(self, video_path: str, transcription: str, 
                           output_path: Optional[str] = None) -> str:
        """Add subtitles to video"""
        try:
            if not output_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_path = os.path.join(self.temp_dir, f"subtitled_{timestamp}.mp4")
            
            # Create subtitle file
            subtitle_path = os.path.join(self.temp_dir, f"subtitles_{timestamp}.srt")
            await self._create_srt_file(subtitle_path, transcription)
            
            # Add subtitles using FFmpeg
            cmd = [
                self.video_processor.ffmpeg_path or 'ffmpeg',
                '-i', video_path,
                '-vf', f'subtitles={subtitle_path}',
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg subtitle addition failed: {stderr.decode()}")
            
            # Clean up subtitle file
            if os.path.exists(subtitle_path):
                os.remove(subtitle_path)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error adding subtitles: {e}")
            raise
    
    async def _create_srt_file(self, subtitle_path: str, transcription: str):
        """Create SRT subtitle file from transcription"""
        try:
            # Simple subtitle creation - split transcription into chunks
            words = transcription.split()
            chunks = []
            current_chunk = []
            word_count = 0
            
            for word in words:
                current_chunk.append(word)
                word_count += 1
                
                if word_count >= 5:  # 5 words per subtitle
                    chunks.append(' '.join(current_chunk))
                    current_chunk = []
                    word_count = 0
            
            if current_chunk:
                chunks.append(' '.join(current_chunk))
            
            # Write SRT file
            with open(subtitle_path, 'w', encoding='utf-8') as f:
                for i, chunk in enumerate(chunks, 1):
                    start_time = i * 3  # 3 seconds per subtitle
                    end_time = start_time + 3
                    
                    f.write(f"{i}\n")
                    f.write(f"{self._format_time(start_time)} --> {self._format_time(end_time)}\n")
                    f.write(f"{chunk}\n\n")
                    
        except Exception as e:
            logger.error(f"Error creating SRT file: {e}")
            raise
    
    def _format_time(self, seconds: float) -> str:
        """Format time for SRT file"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millisecs = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"
    
    async def add_watermark(self, video_path: str, watermark_text: str = "OpenClip Pro",
                          output_path: Optional[str] = None) -> str:
        """Add watermark to video"""
        try:
            if not output_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_path = os.path.join(self.temp_dir, f"watermarked_{timestamp}.mp4")
            
            # Create watermark image
            watermark_path = os.path.join(self.temp_dir, f"watermark_{timestamp}.png")
            await self._create_watermark_image(watermark_path, watermark_text)
            
            # Add watermark using FFmpeg
            cmd = [
                self.video_processor.ffmpeg_path or 'ffmpeg',
                '-i', video_path,
                '-i', watermark_path,
                '-filter_complex', 'overlay=10:10',  # Position at top-left
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg watermark addition failed: {stderr.decode()}")
            
            # Clean up watermark image
            if os.path.exists(watermark_path):
                os.remove(watermark_path)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error adding watermark: {e}")
            raise
    
    async def _create_watermark_image(self, watermark_path: str, text: str):
        """Create watermark image with text"""
        try:
            # Create a transparent image
            img = Image.new('RGBA', (200, 50), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Try to use a default font, fallback to basic
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()
            
            # Draw text with semi-transparent background
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = int(bbox[2] - bbox[0])
            text_height = int(bbox[3] - bbox[1])
            
            # Resize image to fit text
            img = Image.new('RGBA', (text_width + 20, text_height + 10), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Draw background rectangle
            draw.rectangle([0, 0, text_width + 20, text_height + 10], 
                         fill=(0, 0, 0, 128))
            
            # Draw text
            draw.text((10, 5), text, fill=(255, 255, 255, 255), font=font)
            
            img.save(watermark_path)
            
        except Exception as e:
            logger.error(f"Error creating watermark image: {e}")
            raise
    
    async def optimize_for_platform(self, video_path: str, platform: str) -> str:
        """Optimize video for specific platform"""
        try:
            preset = self._get_platform_preset(platform)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(self.temp_dir, f"optimized_{platform}_{timestamp}.mp4")
            
            # Get video metadata
            metadata = await self.video_processor.extract_metadata(video_path)
            
            # Build optimization command
            cmd = [
                self.video_processor.ffmpeg_path or 'ffmpeg',
                '-i', video_path,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-b:v', preset['bitrate'],
                '-preset', 'fast',
                '-crf', '23',  # Good quality
                '-y',
                output_path
            ]
            
            # Add resolution scaling if needed
            if 'resolution' in preset:
                cmd.extend(['-vf', f'scale={preset["resolution"]}'])
            
            # Platform-specific optimizations
            if platform == 'instagram':
                cmd.extend(['-pix_fmt', 'yuv420p'])  # Instagram requirement
            elif platform == 'tiktok':
                cmd.extend(['-movflags', '+faststart'])  # Fast start for mobile
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg optimization failed: {stderr.decode()}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error optimizing for platform: {e}")
            raise
    
    def _get_platform_preset(self, platform: str) -> Dict[str, Any]:
        """Get optimization preset for platform"""
        platform_presets = {
            'instagram': {
                'resolution': '1080x1080',
                'bitrate': '2M',
                'duration': 30
            },
            'tiktok': {
                'resolution': '1080x1920',
                'bitrate': '2M',
                'duration': 60
            },
            'youtube': {
                'resolution': '1920x1080',
                'bitrate': '4M',
                'duration': 60
            },
            'twitter': {
                'resolution': '1280x720',
                'bitrate': '2M',
                'duration': 140
            }
        }
        
        return platform_presets.get(platform, platform_presets['instagram'])
    
    async def batch_create_clips(self, video_path: str, clip_configs: List[Dict]) -> List[Dict[str, Any]]:
        """Create multiple clips from a single video"""
        try:
            results = []
            
            for i, config in enumerate(clip_configs):
                try:
                    # Create clip with specific configuration
                    result = await self.create_ai_clip(
                        video_path,
                        config.get('prompt', 'Create engaging clip'),
                        config.get('preset', 'social_media'),
                        config.get('settings', {})
                    )
                    
                    result['config_index'] = i
                    results.append(result)
                    
                except Exception as e:
                    logger.error(f"Error creating clip {i}: {e}")
                    results.append({
                        'error': str(e),
                        'config_index': i,
                        'status': 'failed'
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch clip creation: {e}")
            return [{'error': str(e), 'status': 'failed'}]
    
    def cleanup_temp_files(self, max_age_hours: int = 24):
        """Clean up temporary files"""
        try:
            current_time = datetime.now()
            
            for file_path in self.temp_dir.iterdir():
                if file_path.is_file():
                    file_age = current_time - datetime.fromtimestamp(file_path.stat().st_mtime)
                    
                    if file_age.total_seconds() > max_age_hours * 3600:
                        file_path.unlink()
                        logger.info(f"Cleaned up temp file: {file_path}")
                        
        except Exception as e:
            logger.error(f"Error cleaning up temp files: {e}")
