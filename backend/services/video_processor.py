import os
import asyncio
import subprocess
import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
import tempfile
import shutil
from urllib.parse import urlparse
from datetime import datetime
import cv2
import numpy as np
from PIL import Image

# For YouTube processing
try:
    import yt_dlp
except ImportError:
    yt_dlp = None

from models.project import Clip, VideoData

logger = logging.getLogger(__name__)

class VideoProcessor:
    """Enhanced service for processing video files and extracting metadata"""
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "openclip_temp"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Supported video formats
        self.supported_formats = {
            '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', 
            '.webm', '.m4v', '.3gp', '.ogv', '.ts', '.mts'
        }
        
        # FFmpeg paths (adjust for your system)
        self.ffmpeg_path = self._find_ffmpeg()
        self.ffprobe_path = self._find_ffprobe()
        
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.outputs_dir = os.path.join(self.base_dir, "outputs")
    
    def _find_ffmpeg(self) -> Optional[str]:
        """Find FFmpeg executable"""
        # Check local installation first
        local_ffmpeg = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                                   "ffmpeg", "ffmpeg-7.1.1-essentials_build", "bin", "ffmpeg.exe")
        if os.path.exists(local_ffmpeg):
            return local_ffmpeg
        
        try:
            result = subprocess.run(['ffmpeg', '-version'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                return 'ffmpeg'
        except FileNotFoundError:
            pass
        
        # Try common installation paths
        common_paths = [
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            '/usr/local/bin/ffmpeg',
            '/usr/bin/ffmpeg'
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                return path
        
        logger.warning("FFmpeg not found. Video processing will be limited.")
        return None
    
    def _find_ffprobe(self) -> Optional[str]:
        """Find FFprobe executable"""
        # Check local installation first
        local_ffprobe = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                                    "ffmpeg", "ffmpeg-7.1.1-essentials_build", "bin", "ffprobe.exe")
        if os.path.exists(local_ffprobe):
            return local_ffprobe
        
        try:
            result = subprocess.run(['ffprobe', '-version'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                return 'ffprobe'
        except FileNotFoundError:
            pass
        
        # Try common installation paths
        common_paths = [
            'C:\\ffmpeg\\bin\\ffprobe.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe',
            '/usr/local/bin/ffprobe',
            '/usr/bin/ffprobe'
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                return path
        
        logger.warning("FFprobe not found. Video metadata extraction will be limited.")
        return None
    
    async def extract_metadata(self, video_path: str) -> Dict[str, Any]:
        """Extract metadata from a video file"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        try:
            # Run ffprobe to get video information
            cmd = [
                "ffprobe", 
                "-v", "quiet", 
                "-print_format", "json", 
                "-show_format", 
                "-show_streams", 
                video_path
            ]
            
            # Run command asynchronously
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"Error extracting metadata: {stderr.decode()}")
                # Return basic info without ffmpeg data
                return {
                    "filename": os.path.basename(video_path),
                    "size": os.path.getsize(video_path),
                    "error": "Failed to extract video metadata"
                }
            
            # Parse JSON output
            data = json.loads(stdout.decode())
            
            # Extract relevant information
            metadata = {
                "filename": os.path.basename(video_path),
                "size": os.path.getsize(video_path),
                "format": data.get("format", {}).get("format_name", "unknown"),
                "duration": float(data.get("format", {}).get("duration", 0)),
                "bit_rate": int(data.get("format", {}).get("bit_rate", 0)),
            }
            
            # Find video stream
            video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
            if video_stream:
                metadata["resolution"] = f"{video_stream.get('width', 0)}x{video_stream.get('height', 0)}"
                metadata["codec"] = video_stream.get("codec_name", "unknown")
                metadata["fps"] = eval(video_stream.get("r_frame_rate", "0/1"))  # Convert fraction to float
            
            # Find audio stream
            audio_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
            if audio_stream:
                metadata["audio_codec"] = audio_stream.get("codec_name", "unknown")
                metadata["audio_channels"] = audio_stream.get("channels", 0)
                metadata["audio_sample_rate"] = audio_stream.get("sample_rate", 0)
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata from {video_path}: {e}")
            # Return basic info on error
            return {
                "filename": os.path.basename(video_path),
                "size": os.path.getsize(video_path),
                "error": str(e)
            }
    
    async def process_youtube_url(self, youtube_url: str) -> Dict[str, Any]:
        """Process a YouTube URL and download the video"""
        if not yt_dlp:
            raise ImportError("yt-dlp is not installed. Install with 'pip install yt-dlp'")
        
        logger.info(f"Processing YouTube URL: {youtube_url}")
        
        try:
            # Create a temporary directory for the download
            download_dir = os.path.join(self.base_dir, "uploads", "youtube")
            os.makedirs(download_dir, exist_ok=True)
            
            # Create a unique filename based on the URL
            url_hash = abs(hash(youtube_url)) % 10000000
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_filename = f"yt_{url_hash}_{timestamp}"
            
            # Configure yt-dlp options with local FFmpeg path
            ydl_opts = {
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'outtmpl': os.path.join(download_dir, f"{base_filename}.%(ext)s"),
                'restrictfilenames': True,
                'noplaylist': True,
                'quiet': True,
                'no_warnings': True,
                'ignoreerrors': False,
                'noprogress': True,
            }
            
            # Add FFmpeg path if available
            if self.ffmpeg_path:
                ydl_opts['ffmpeg_location'] = os.path.dirname(self.ffmpeg_path)
            
            # Download the video
            file_path = None
            video_info = None
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Get video info first
                video_info = await asyncio.to_thread(ydl.extract_info, youtube_url, download=True)
                if 'entries' in video_info:
                    # Playlist - get the first video
                    video_info = video_info['entries'][0]
                
                # Get downloaded file path
                file_path = ydl.prepare_filename(video_info)
                
                # Ensure the file exists
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"Downloaded file not found: {file_path}")
            
            # Extract metadata about the video
            metadata = await self.extract_metadata(file_path)
            
            # Combine with YouTube-specific info
            result = {
                "file_path": file_path,
                "filename": os.path.basename(file_path),
                "source": "youtube",
                "youtube_url": youtube_url,
                "youtube_title": video_info.get('title', 'Unknown'),
                "youtube_channel": video_info.get('channel', 'Unknown'),
                "youtube_upload_date": video_info.get('upload_date', 'Unknown'),
                "size": metadata.get('size', 0),
                "duration": metadata.get('duration', 0),
                "resolution": metadata.get('resolution', 'Unknown'),
                "fps": metadata.get('fps', 0),
            }
            
            return result
        
        except Exception as e:
            logger.error(f"Error processing YouTube URL {youtube_url}: {e}")
            raise
    
    async def extract_segments(self, file_path: str, segments: List[Dict]) -> List[str]:
        """Extract video segments for analysis"""
        if not self.ffmpeg_path:
            raise Exception("FFmpeg not available for segment extraction")
        
        segment_files = []
        
        try:
            for i, segment in enumerate(segments):
                start_time = segment['start']
                duration = segment['end'] - segment['start']
                
                output_file = self.temp_dir / f"segment_{i}_{start_time}_{duration}.mp4"
                
                cmd = [
                    self.ffmpeg_path,
                    '-i', file_path,
                    '-ss', str(start_time),
                    '-t', str(duration),
                    '-c', 'copy',
                    '-avoid_negative_ts', 'make_zero',
                    str(output_file)
                ]
                
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0 and output_file.exists():
                    segment_files.append(str(output_file))
                else:
                    logger.error(f"Failed to extract segment {i}: {stderr.decode()}")
            
            return segment_files
            
        except Exception as e:
            logger.error(f"Error extracting segments: {e}")
            # Clean up any partial files
            for file_path in segment_files:
                try:
                    os.remove(file_path)
                except:
                    pass
            raise
    
    async def export_clips(self, video_path: str, clips: List[Dict[str, Any]], export_settings: Dict[str, Any]) -> Dict[str, Any]:
        """Export clips from a video based on timestamps"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        # Create output directory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = os.path.join(self.outputs_dir, f"export_{timestamp}")
        os.makedirs(output_dir, exist_ok=True)
        
        results = {
            "output_dir": output_dir,
            "clips": [],
            "format": export_settings.get("format", "mp4"),
            "total_clips": len(clips)
        }
        
        # Mock export for now - in production, use ffmpeg to cut clips
        for i, clip in enumerate(clips):
            # Simulate processing
            await asyncio.sleep(1)
            
            output_filename = f"clip_{i+1}_{clip.get('title', '').replace(' ', '_')}.{export_settings.get('format', 'mp4')}"
            output_path = os.path.join(output_dir, output_filename)
            
            # In production, you would run ffmpeg here to extract the clip
            # For mock purposes, we'll just create an empty file
            with open(output_path, 'w') as f:
                f.write("")
            
            results["clips"].append({
                "index": i + 1,
                "title": clip.get("title", f"Clip {i+1}"),
                "start_time": clip.get("start_time", 0),
                "end_time": clip.get("end_time", 0),
                "duration": clip.get("end_time", 0) - clip.get("start_time", 0),
                "output_path": output_path,
                "filename": output_filename
            })
        
        logger.info(f"Exported {len(clips)} clips to {output_dir}")
        return results
    
    def _build_export_command(self, source_file: str, clip: Clip, 
                             output_file: str, settings: Dict[str, Any]) -> List[str]:
        """Build FFmpeg command for clip export"""
        cmd = [self.ffmpeg_path]
        
        # Input file
        cmd.extend(['-i', source_file])
        
        # Time range
        cmd.extend(['-ss', str(clip.start_time)])
        cmd.extend(['-t', str(clip.end_time - clip.start_time)])
        
        # Video settings
        quality = settings.get('quality', 'high')
        if quality == 'high':
            cmd.extend(['-crf', '18'])
        elif quality == 'medium':
            cmd.extend(['-crf', '23'])
        else:  # low
            cmd.extend(['-crf', '28'])
        
        # Resolution
        if 'resolution' in settings and settings['resolution']:
            cmd.extend(['-vf', f"scale={settings['resolution']}:-2"])
        
        # Frame rate
        if 'fps' in settings and settings['fps']:
            cmd.extend(['-r', str(settings['fps'])])
        
        # Audio settings
        cmd.extend(['-c:a', 'aac', '-b:a', '128k'])
        
        # Output settings
        cmd.extend(['-avoid_negative_ts', 'make_zero'])
        cmd.extend(['-y'])  # Overwrite output file
        
        # Output file
        cmd.append(output_file)
        
        return cmd
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for filesystem compatibility"""
        import re
        # Remove or replace invalid characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Limit length
        if len(filename) > 100:
            filename = filename[:100]
        return filename.strip()
    
    async def generate_thumbnail(self, file_path: str, timestamp: float) -> Optional[str]:
        """Generate thumbnail at specific timestamp"""
        if not self.ffmpeg_path:
            return None
        
        try:
            thumbnail_file = self.temp_dir / f"thumb_{timestamp}_{os.path.basename(file_path)}.jpg"
            
            cmd = [
                self.ffmpeg_path,
                '-i', file_path,
                '-ss', str(timestamp),
                '-vframes', '1',
                '-q:v', '2',
                str(thumbnail_file)
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await process.communicate()
            
            if process.returncode == 0 and thumbnail_file.exists():
                return str(thumbnail_file)
            
        except Exception as e:
            logger.error(f"Error generating thumbnail: {e}")
        
        return None
    
    def cleanup_temp_files(self, max_age_hours: int = 24):
        """Clean up old temporary files"""
        try:
            import time
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            for file_path in self.temp_dir.rglob('*'):
                if file_path.is_file():
                    file_age = current_time - file_path.stat().st_mtime
                    if file_age > max_age_seconds:
                        try:
                            file_path.unlink()
                            logger.info(f"Cleaned up old temp file: {file_path}")
                        except Exception as e:
                            logger.error(f"Error cleaning up {file_path}: {e}")
                            
        except Exception as e:
            logger.error(f"Error during temp file cleanup: {e}")
    
    def is_supported_format(self, file_path: str) -> bool:
        """Check if file format is supported"""
        return Path(file_path).suffix.lower() in self.supported_formats
    
    async def extract_frames(self, video_path: str, num_frames: int = 10) -> List[Dict[str, Any]]:
        """Extract frames from video for AI analysis"""
        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            # Use OpenCV to extract frames
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception(f"Could not open video file: {video_path}")
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            
            # Calculate frame intervals
            if total_frames <= num_frames:
                frame_indices = list(range(total_frames))
            else:
                frame_indices = [int(i * total_frames / num_frames) for i in range(num_frames)]
            
            frames = []
            for i, frame_idx in enumerate(frame_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                
                if ret:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Resize for analysis (maintain aspect ratio)
                    height, width = frame_rgb.shape[:2]
                    max_size = 512
                    if max(height, width) > max_size:
                        scale = max_size / max(height, width)
                        new_width = int(width * scale)
                        new_height = int(height * scale)
                        frame_rgb = cv2.resize(frame_rgb, (new_width, new_height))
                    
                    # Convert to PIL Image
                    pil_image = Image.fromarray(frame_rgb)
                    
                    frames.append({
                        'index': i,
                        'frame_number': frame_idx,
                        'timestamp': frame_idx / fps if fps > 0 else 0,
                        'image': pil_image,
                        'width': frame_rgb.shape[1],
                        'height': frame_rgb.shape[0]
                    })
            
            cap.release()
            return frames
            
        except Exception as e:
            logger.error(f"Error extracting frames from {video_path}: {e}")
            return []
    
    async def extract_audio_segment(self, video_path: str, start_time: float, duration: float) -> Optional[str]:
        """Extract audio segment from video for analysis"""
        try:
            if not self.ffmpeg_path:
                raise Exception("FFmpeg not available")
            
            # Create temporary audio file
            temp_audio = os.path.join(self.temp_dir, f"audio_segment_{start_time}_{duration}.wav")
            
            # Extract audio segment using FFmpeg
            cmd = [
                self.ffmpeg_path,
                '-i', video_path,
                '-ss', str(start_time),
                '-t', str(duration),
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # PCM audio
                '-ar', '16000',  # 16kHz sample rate
                '-ac', '1',  # Mono
                '-y',  # Overwrite output
                temp_audio
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0 and os.path.exists(temp_audio):
                return temp_audio
            else:
                logger.error(f"Audio extraction failed: {stderr.decode()}")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting audio segment: {e}")
            return None
    
    async def detect_scene_changes(self, video_path: str, threshold: float = 0.3) -> List[Dict[str, Any]]:
        """Detect scene changes in video using computer vision"""
        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception(f"Could not open video file: {video_path}")
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            scene_changes = []
            prev_frame = None
            frame_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert to grayscale for comparison
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                if prev_frame is not None:
                    # Calculate frame difference
                    diff = cv2.absdiff(gray, prev_frame)
                    mean_diff = np.mean(diff)
                    
                    # Normalize by frame size
                    normalized_diff = mean_diff / (gray.shape[0] * gray.shape[1])
                    
                    # Detect scene change
                    if normalized_diff > threshold:
                        timestamp = frame_count / fps if fps > 0 else 0
                        scene_changes.append({
                            'frame_number': frame_count,
                            'timestamp': timestamp,
                            'confidence': min(normalized_diff / threshold, 1.0)
                        })
                
                prev_frame = gray
                frame_count += 1
                
                # Limit processing for performance
                if frame_count > 10000:  # Process max 10k frames
                    break
            
            cap.release()
            return scene_changes
            
        except Exception as e:
            logger.error(f"Error detecting scene changes: {e}")
            return []
    
    async def analyze_video_quality(self, video_path: str) -> Dict[str, Any]:
        """Analyze video quality metrics"""
        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            # Get metadata
            metadata = await self.extract_metadata(video_path)
            
            # Extract sample frames for quality analysis
            frames = await self.extract_frames(video_path, num_frames=5)
            
            quality_metrics = {
                'resolution_score': self._calculate_resolution_score(metadata.get('resolution', '')),
                'bitrate_score': self._calculate_bitrate_score(metadata.get('bit_rate', 0)),
                'duration_score': self._calculate_duration_score(metadata.get('duration', 0)),
                'format_score': self._calculate_format_score(metadata.get('format', '')),
                'frame_quality': []
            }
            
            # Analyze frame quality
            for frame in frames:
                if 'image' in frame:
                    pil_image = frame['image']
                    # Convert to numpy array for analysis
                    img_array = np.array(pil_image)
                    
                    # Calculate sharpness (Laplacian variance)
                    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
                    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
                    
                    # Calculate brightness
                    brightness = np.mean(gray)
                    
                    # Calculate contrast
                    contrast = np.std(gray)
                    
                    quality_metrics['frame_quality'].append({
                        'timestamp': frame.get('timestamp', 0),
                        'sharpness': sharpness,
                        'brightness': brightness,
                        'contrast': contrast
                    })
            
            # Calculate overall quality score
            scores = [
                quality_metrics['resolution_score'],
                quality_metrics['bitrate_score'],
                quality_metrics['duration_score'],
                quality_metrics['format_score']
            ]
            
            avg_score = sum(scores) / len(scores)
            
            if avg_score >= 0.8:
                quality_metrics['overall_quality'] = 'excellent'
            elif avg_score >= 0.6:
                quality_metrics['overall_quality'] = 'good'
            elif avg_score >= 0.4:
                quality_metrics['overall_quality'] = 'fair'
            else:
                quality_metrics['overall_quality'] = 'poor'
            
            quality_metrics['quality_score'] = avg_score
            
            return quality_metrics
            
        except Exception as e:
            logger.error(f"Error analyzing video quality: {e}")
            return {
                'error': str(e),
                'overall_quality': 'unknown',
                'quality_score': 0.0
            }
    
    def _calculate_resolution_score(self, resolution: str) -> float:
        """Calculate resolution quality score"""
        if not resolution:
            return 0.5
        
        try:
            width, height = map(int, resolution.split('x'))
            pixels = width * height
            
            if pixels >= 2073600:  # 1920x1080 or higher
                return 1.0
            elif pixels >= 921600:  # 1280x720 or higher
                return 0.8
            elif pixels >= 480000:  # 800x600 or higher
                return 0.6
            else:
                return 0.4
        except:
            return 0.5
    
    def _calculate_bitrate_score(self, bitrate: int) -> float:
        """Calculate bitrate quality score"""
        if bitrate <= 0:
            return 0.5
        
        # Convert to Mbps
        mbps = bitrate / 1000000
        
        if mbps >= 10:
            return 1.0
        elif mbps >= 5:
            return 0.8
        elif mbps >= 2:
            return 0.6
        else:
            return 0.4
    
    def _calculate_duration_score(self, duration: float) -> float:
        """Calculate duration quality score"""
        if duration <= 0:
            return 0.0
        elif duration <= 10:
            return 0.3
        elif duration <= 60:
            return 0.7
        elif duration <= 600:
            return 1.0
        else:
            return 0.8
    
    def _calculate_format_score(self, format_name: str) -> float:
        """Calculate format quality score"""
        high_quality_formats = ['mp4', 'mov', 'avi']
        medium_quality_formats = ['mkv', 'webm', 'm4v']
        
        format_lower = format_name.lower()
        
        if any(fmt in format_lower for fmt in high_quality_formats):
            return 1.0
        elif any(fmt in format_lower for fmt in medium_quality_formats):
            return 0.8
        else:
            return 0.6