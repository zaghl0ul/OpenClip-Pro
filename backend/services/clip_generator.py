"""
Advanced Video Clip Generation Engine
Implements intelligent clip extraction with scene detection and optimization
"""

import os
import asyncio
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import cv2
from moviepy.editor import VideoFileClip, concatenate_videoclips, CompositeVideoClip, TextClip, ImageClip
from moviepy.video.fx import resize, fadein, fadeout
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector, AdaptiveDetector
from PIL import Image, ImageDraw, ImageFont
import whisper
import torch
from dataclasses import dataclass
from enum import Enum
import json
import hashlib
import logging

from ..config import settings
from ..models.project import Project, Clip
from ..services.storage_service import StorageService
from ..utils.video_utils import get_video_metadata, optimize_video_quality
from ..utils.performance_monitor import monitor_performance

logger = logging.getLogger(__name__)

class ClipType(str, Enum):
    """Types of clips that can be generated"""
    HIGHLIGHT = "highlight"
    SCENE = "scene"
    TRANSCRIPT = "transcript"
    CUSTOM = "custom"
    AI_SUGGESTED = "ai_suggested"
    MUSIC_SYNC = "music_sync"

class TransitionType(str, Enum):
    """Video transition types"""
    CUT = "cut"
    FADE = "fade"
    DISSOLVE = "dissolve"
    WIPE = "wipe"
    SLIDE = "slide"
    ZOOM = "zoom"

@dataclass
class ClipSegment:
    """Represents a video segment for clip generation"""
    start_time: float
    end_time: float
    clip_type: ClipType
    confidence: float = 1.0
    metadata: Dict[str, Any] = None
    transition_in: TransitionType = TransitionType.CUT
    transition_out: TransitionType = TransitionType.CUT
    
    @property
    def duration(self) -> float:
        return self.end_time - self.start_time
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.duration,
            "clip_type": self.clip_type,
            "confidence": self.confidence,
            "metadata": self.metadata or {},
            "transition_in": self.transition_in,
            "transition_out": self.transition_out
        }

class VideoClipGenerator:
    """
    Advanced video clip generation engine with AI-powered features
    Supports multiple clip types, transitions, and optimizations
    """
    
    def __init__(self):
        self.storage_service = StorageService()
        self.whisper_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.temp_dir = Path(tempfile.gettempdir()) / "openclip_processing"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Processing configuration
        self.config = {
            "max_clip_duration": settings.MAX_CLIP_DURATION or 60,  # seconds
            "min_clip_duration": settings.MIN_CLIP_DURATION or 3,
            "scene_threshold": 30.0,  # Scene detection threshold
            "audio_sample_rate": 16000,
            "target_fps": 30,
            "quality_preset": "high",  # low, medium, high, ultra
            "enable_gpu": torch.cuda.is_available()
        }
        
        logger.info(f"VideoClipGenerator initialized with device: {self.device}")
    
    async def generate_clips(
        self,
        project: Project,
        segments: List[ClipSegment],
        options: Dict[str, Any] = None
    ) -> List[Clip]:
        """
        Generate video clips from segments
        Returns list of generated clip objects
        """
        options = options or {}
        generated_clips = []
        
        try:
            # Load source video
            video_path = await self.storage_service.get_local_path(project.video_url)
            source_video = VideoFileClip(video_path)
            
            # Process each segment
            for i, segment in enumerate(segments):
                logger.info(f"Processing segment {i+1}/{len(segments)}: {segment.to_dict()}")
                
                clip = await self._process_segment(
                    source_video,
                    segment,
                    project,
                    index=i,
                    options=options
                )
                
                if clip:
                    generated_clips.append(clip)
            
            # Close source video
            source_video.close()
            
            logger.info(f"Generated {len(generated_clips)} clips successfully")
            return generated_clips
            
        except Exception as e:
            logger.error(f"Clip generation failed: {str(e)}")
            raise
    
    async def _process_segment(
        self,
        source_video: VideoFileClip,
        segment: ClipSegment,
        project: Project,
        index: int,
        options: Dict[str, Any]
    ) -> Optional[Clip]:
        """Process individual video segment"""
        try:
            # Extract clip from source
            clip = source_video.subclip(segment.start_time, segment.end_time)
            
            # Apply transitions
            clip = self._apply_transitions(clip, segment, options)
            
            # Apply effects based on clip type
            if segment.clip_type == ClipType.HIGHLIGHT:
                clip = self._enhance_highlight(clip, options)
            elif segment.clip_type == ClipType.MUSIC_SYNC:
                clip = await self._sync_to_music(clip, segment, options)
            
            # Add overlays if requested
            if options.get("add_captions"):
                clip = await self._add_captions(clip, segment, project)
            
            if options.get("add_watermark"):
                clip = self._add_watermark(clip, options)
            
            # Generate unique filename
            clip_hash = hashlib.md5(f"{project.id}_{index}_{segment.start_time}".encode()).hexdigest()[:8]
            filename = f"clip_{project.id}_{index}_{clip_hash}.mp4"
            
            # Export with optimization
            output_path = self.temp_dir / filename
            await self._export_clip(clip, output_path, options)
            
            # Upload to storage
            storage_url = await self.storage_service.upload_clip(
                output_path,
                project.id,
                filename
            )
            
            # Create clip metadata
            clip_data = Clip(
                project_id=project.id,
                title=f"Clip {index + 1}",
                start_time=segment.start_time,
                end_time=segment.end_time,
                duration=segment.duration,
                clip_type=segment.clip_type,
                file_url=storage_url,
                metadata={
                    "confidence": segment.confidence,
                    "transitions": {
                        "in": segment.transition_in,
                        "out": segment.transition_out
                    },
                    "processing_options": options,
                    **segment.metadata
                }
            )
            
            # Clean up temporary file
            output_path.unlink()
            
            return clip_data
            
        except Exception as e:
            logger.error(f"Failed to process segment: {str(e)}")
            return None
    
    def _apply_transitions(
        self,
        clip: VideoFileClip,
        segment: ClipSegment,
        options: Dict[str, Any]
    ) -> VideoFileClip:
        """Apply transitions to clip"""
        transition_duration = options.get("transition_duration", 0.5)
        
        # Apply fade in
        if segment.transition_in == TransitionType.FADE:
            clip = fadein(clip, transition_duration)
        
        # Apply fade out
        if segment.transition_out == TransitionType.FADE:
            clip = fadeout(clip, transition_duration)
        
        # Additional transition types can be implemented here
        
        return clip
    
    def _enhance_highlight(
        self,
        clip: VideoFileClip,
        options: Dict[str, Any]
    ) -> VideoFileClip:
        """Enhance highlight clips with effects"""
        # Apply color correction
        if options.get("color_enhance", True):
            clip = clip.fx(lambda gf, t: self._enhance_frame(gf(t)))
        
        # Add dynamic zoom
        if options.get("dynamic_zoom", False):
            clip = self._apply_dynamic_zoom(clip)
        
        # Speed ramping for dramatic effect
        if options.get("speed_ramp", False):
            clip = self._apply_speed_ramp(clip)
        
        return clip
    
    async def _add_captions(
        self,
        clip: VideoFileClip,
        segment: ClipSegment,
        project: Project
    ) -> VideoFileClip:
        """Add captions using speech recognition"""
        try:
            # Extract audio
            audio_path = self.temp_dir / f"temp_audio_{segment.start_time}.wav"
            clip.audio.write_audiofile(str(audio_path), logger=None)
            
            # Transcribe with Whisper
            if not self.whisper_model:
                self.whisper_model = whisper.load_model("base", device=self.device)
            
            result = self.whisper_model.transcribe(
                str(audio_path),
                language=options.get("language", "en"),
                task="transcribe"
            )
            
            # Create caption overlays
            captions = []
            for segment in result["segments"]:
                text_clip = self._create_caption_clip(
                    segment["text"],
                    segment["start"],
                    segment["end"],
                    clip.size
                )
                captions.append(text_clip)
            
            # Composite captions onto video
            final_clip = CompositeVideoClip([clip] + captions)
            
            # Clean up
            audio_path.unlink()
            
            return final_clip
            
        except Exception as e:
            logger.warning(f"Failed to add captions: {str(e)}")
            return clip
    
    def _create_caption_clip(
        self,
        text: str,
        start: float,
        end: float,
        video_size: Tuple[int, int]
    ) -> TextClip:
        """Create styled caption clip"""
        # Modern caption styling
        caption = TextClip(
            text,
            fontsize=min(video_size[1] // 20, 48),
            font="Arial-Bold",
            color="white",
            stroke_color="black",
            stroke_width=2,
            method="caption",
            size=(video_size[0] * 0.8, None),
            align="center"
        )
        
        # Position at bottom
        caption = caption.set_position(("center", video_size[1] * 0.85))
        caption = caption.set_start(start).set_end(end)
        
        # Add background box for readability
        bg = caption.on_color(
            size=(caption.w + 20, caption.h + 10),
            color=(0, 0, 0),
            pos=(caption.pos[0] - 10, caption.pos[1] - 5),
            col_opacity=0.6
        )
        
        return bg
    
    def _add_watermark(
        self,
        clip: VideoFileClip,
        options: Dict[str, Any]
    ) -> VideoFileClip:
        """Add watermark to clip"""
        watermark_path = options.get("watermark_path", "assets/watermark.png")
        
        if not os.path.exists(watermark_path):
            return clip
        
        # Load watermark
        watermark = ImageClip(watermark_path)
        
        # Resize watermark
        watermark_size = min(clip.size) * 0.15
        watermark = watermark.resize(width=watermark_size)
        
        # Position (bottom-right by default)
        position = options.get("watermark_position", "bottom-right")
        margin = 20
        
        if position == "bottom-right":
            pos = (clip.w - watermark.w - margin, clip.h - watermark.h - margin)
        elif position == "bottom-left":
            pos = (margin, clip.h - watermark.h - margin)
        elif position == "top-right":
            pos = (clip.w - watermark.w - margin, margin)
        else:  # top-left
            pos = (margin, margin)
        
        watermark = watermark.set_position(pos).set_duration(clip.duration)
        
        # Set opacity
        opacity = options.get("watermark_opacity", 0.5)
        watermark = watermark.set_opacity(opacity)
        
        return CompositeVideoClip([clip, watermark])
    
    async def _export_clip(
        self,
        clip: VideoFileClip,
        output_path: Path,
        options: Dict[str, Any]
    ):
        """Export clip with optimization"""
        # Determine quality settings
        quality_presets = {
            "low": {"bitrate": "1M", "preset": "faster"},
            "medium": {"bitrate": "2.5M", "preset": "medium"},
            "high": {"bitrate": "5M", "preset": "slow"},
            "ultra": {"bitrate": "10M", "preset": "veryslow"}
        }
        
        preset = quality_presets.get(
            options.get("quality", self.config["quality_preset"]),
            quality_presets["high"]
        )
        
        # Export with hardware acceleration if available
        codec = "h264_nvenc" if self.config["enable_gpu"] else "libx264"
        
        ffmpeg_params = [
            "-c:v", codec,
            "-preset", preset["preset"],
            "-b:v", preset["bitrate"],
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart"  # Web optimization
        ]
        
        # Add HDR support if source is HDR
        if options.get("preserve_hdr", False):
            ffmpeg_params.extend([
                "-color_primaries", "bt2020",
                "-color_trc", "smpte2084",
                "-colorspace", "bt2020nc"
            ])
        
        # Export
        clip.write_videofile(
            str(output_path),
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=str(self.temp_dir / "temp_audio.m4a"),
            remove_temp=True,
            ffmpeg_params=ffmpeg_params,
            logger=None
        )
    
    @monitor_performance
    async def detect_scenes(
        self,
        video_path: str,
        threshold: float = None
    ) -> List[ClipSegment]:
        """
        Detect scenes in video using advanced algorithms
        Returns list of scene segments
        """
        threshold = threshold or self.config["scene_threshold"]
        scenes = []
        
        try:
            # Create video manager
            video_manager = VideoManager([video_path])
            scene_manager = SceneManager()
            
            # Add detectors
            scene_manager.add_detector(ContentDetector(threshold=threshold))
            scene_manager.add_detector(AdaptiveDetector())
            
            # Detect scenes
            video_manager.start()
            scene_manager.detect_scenes(frame_source=video_manager)
            scene_list = scene_manager.get_scene_list()
            video_manager.release()
            
            # Convert to ClipSegments
            for i, (start_time, end_time) in enumerate(scene_list):
                segment = ClipSegment(
                    start_time=start_time.get_seconds(),
                    end_time=end_time.get_seconds(),
                    clip_type=ClipType.SCENE,
                    metadata={
                        "scene_index": i,
                        "detection_method": "content_adaptive"
                    }
                )
                scenes.append(segment)
            
            logger.info(f"Detected {len(scenes)} scenes")
            return scenes
            
        except Exception as e:
            logger.error(f"Scene detection failed: {str(e)}")
            return []
    
    async def generate_highlights(
        self,
        video_path: str,
        duration_target: int = 60
    ) -> List[ClipSegment]:
        """
        Generate highlight segments using AI analysis
        Identifies the most engaging parts of the video
        """
        highlights = []
        
        try:
            # Load video for analysis
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Analyze video for interesting moments
            scores = []
            frame_interval = max(1, int(fps))  # Sample every second
            
            for i in range(0, total_frames, frame_interval):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                
                if not ret:
                    break
                
                # Calculate interestingness score
                score = self._calculate_frame_score(frame)
                scores.append((i / fps, score))
            
            cap.release()
            
            # Find peaks in scores
            peak_moments = self._find_peaks(scores, duration_target)
            
            # Create highlight segments
            for start, end, score in peak_moments:
                segment = ClipSegment(
                    start_time=start,
                    end_time=end,
                    clip_type=ClipType.HIGHLIGHT,
                    confidence=score,
                    metadata={
                        "score": score,
                        "detection_method": "ai_analysis"
                    }
                )
                highlights.append(segment)
            
            return highlights
            
        except Exception as e:
            logger.error(f"Highlight generation failed: {str(e)}")
            return []
    
    def _calculate_frame_score(self, frame: np.ndarray) -> float:
        """
        Calculate interestingness score for a frame
        Uses multiple factors: motion, faces, composition
        """
        score = 0.0
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Edge detection (indicates detail/activity)
        edges = cv2.Canny(gray, 50, 150)
        edge_score = np.sum(edges) / (frame.shape[0] * frame.shape[1] * 255)
        score += edge_score * 0.3
        
        # Color vibrancy
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        saturation_score = np.mean(hsv[:, :, 1]) / 255
        score += saturation_score * 0.2
        
        # Face detection (people make content interesting)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        face_score = min(len(faces) * 0.2, 1.0)
        score += face_score * 0.5
        
        return min(score, 1.0)
    
    def _find_peaks(
        self,
        scores: List[Tuple[float, float]],
        target_duration: int
    ) -> List[Tuple[float, float, float]]:
        """Find peak moments in score timeline"""
        if not scores:
            return []
        
        # Sort by score
        sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
        
        # Select top moments
        selected_moments = []
        total_duration = 0
        
        for timestamp, score in sorted_scores:
            if total_duration >= target_duration:
                break
            
            # Create a clip around this moment
            clip_duration = min(10, target_duration - total_duration)  # 10 second clips
            start_time = max(0, timestamp - clip_duration / 2)
            end_time = start_time + clip_duration
            
            # Check for overlap with existing clips
            overlaps = False
            for existing_start, existing_end, _ in selected_moments:
                if not (end_time <= existing_start or start_time >= existing_end):
                    overlaps = True
                    break
            
            if not overlaps:
                selected_moments.append((start_time, end_time, score))
                total_duration += clip_duration
        
        # Sort by time
        selected_moments.sort(key=lambda x: x[0])
        
        return selected_moments
    
    async def extract_clips_by_transcript(
        self,
        video_path: str,
        search_terms: List[str],
        context_seconds: int = 5
    ) -> List[ClipSegment]:
        """
        Extract clips based on transcript search
        Finds moments where specific terms are mentioned
        """
        clips = []
        
        try:
            # Load whisper model
            if not self.whisper_model:
                self.whisper_model = whisper.load_model("base", device=self.device)
            
            # Transcribe video
            result = self.whisper_model.transcribe(
                video_path,
                word_timestamps=True,
                task="transcribe"
            )
            
            # Search for terms
            for segment in result["segments"]:
                text_lower = segment["text"].lower()
                
                for term in search_terms:
                    if term.lower() in text_lower:
                        # Create clip with context
                        start_time = max(0, segment["start"] - context_seconds)
                        end_time = segment["end"] + context_seconds
                        
                        clip_segment = ClipSegment(
                            start_time=start_time,
                            end_time=end_time,
                            clip_type=ClipType.TRANSCRIPT,
                            confidence=1.0,
                            metadata={
                                "search_term": term,
                                "transcript": segment["text"],
                                "original_timing": {
                                    "start": segment["start"],
                                    "end": segment["end"]
                                }
                            }
                        )
                        clips.append(clip_segment)
            
            return clips
            
        except Exception as e:
            logger.error(f"Transcript extraction failed: {str(e)}")
            return []
    
    def _enhance_frame(self, frame: np.ndarray) -> np.ndarray:
        """Apply color enhancement to frame"""
        # Convert to LAB color space
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge and convert back
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # Slight saturation boost
        hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = hsv[:, :, 1] * 1.2  # 20% saturation increase
        hsv[:, :, 1][hsv[:, :, 1] > 255] = 255
        enhanced = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        
        return enhanced
    
    def _apply_dynamic_zoom(self, clip: VideoFileClip) -> VideoFileClip:
        """Apply Ken Burns effect (dynamic zoom)"""
        duration = clip.duration
        
        def zoom_effect(gf, t):
            frame = gf(t)
            # Calculate zoom factor (1.0 to 1.2 over duration)
            zoom = 1.0 + (0.2 * t / duration)
            
            # Calculate crop area
            h, w = frame.shape[:2]
            new_h, new_w = int(h / zoom), int(w / zoom)
            
            # Center crop
            y1 = (h - new_h) // 2
            x1 = (w - new_w) // 2
            
            # Crop and resize back
            cropped = frame[y1:y1+new_h, x1:x1+new_w]
            zoomed = cv2.resize(cropped, (w, h))
            
            return zoomed
        
        return clip.fl(zoom_effect)
    
    def _apply_speed_ramp(self, clip: VideoFileClip) -> VideoFileClip:
        """Apply speed ramping effect"""
        # Create speed curve (slow-fast-slow)
        duration = clip.duration
        
        def speed_func(t):
            # Normalized time (0 to 1)
            norm_t = t / duration
            
            # Speed curve: starts at 0.5x, peaks at 2x, ends at 0.5x
            if norm_t < 0.3:
                speed = 0.5 + 1.5 * (norm_t / 0.3)
            elif norm_t < 0.7:
                speed = 2.0
            else:
                speed = 2.0 - 1.5 * ((norm_t - 0.7) / 0.3)
            
            # Map to new time
            return t * speed
        
        # Apply speed change
        return clip.fl_time(speed_func)
    
    async def cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            shutil.rmtree(self.temp_dir)
            self.temp_dir.mkdir(exist_ok=True)
        except Exception as e:
            logger.warning(f"Failed to clean temp files: {str(e)}")

# Singleton instance
clip_generator = VideoClipGenerator()
