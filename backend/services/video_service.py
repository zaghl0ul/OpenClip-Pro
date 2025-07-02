import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
import asyncio
from PIL import Image
import ffmpeg

class VideoService:
    def __init__(self):
        pass
    
    async def get_video_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Get video metadata using ffmpeg"""
        try:
            probe = ffmpeg.probe(str(file_path))
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            
            return {
                'duration': float(probe['format']['duration']),
                'resolution': f"{video_info['width']}x{video_info['height']}",
                'format': probe['format']['format_name'],
                'codec': video_info['codec_name'],
                'bitrate': int(probe['format']['bit_rate']),
                'fps': eval(video_info['r_frame_rate'])
            }
        except Exception as e:
            print(f"Error getting video metadata: {e}")
            return {}
    
    async def extract_frames(self, file_path: Path, num_frames: int = 10) -> List[Dict[str, Any]]:
        """Extract frames from video for analysis"""
        try:
            cap = cv2.VideoCapture(str(file_path))
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
                    
                    # Convert to base64
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
            print(f"Error extracting frames: {e}")
            return []
    
    async def create_thumbnail(self, file_path: Path, output_path: Path, time_offset: float = 5.0) -> bool:
        """Create a thumbnail from video at specified time offset"""
        try:
            # Use ffmpeg to extract frame
            (
                ffmpeg
                .input(str(file_path), ss=time_offset)
                .filter('scale', 320, -1)  # Scale to 320px width, maintain aspect ratio
                .output(str(output_path), vframes=1)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            return True
        except Exception as e:
            print(f"Error creating thumbnail: {e}")
            return False
    
    async def get_video_duration(self, file_path: Path) -> Optional[float]:
        """Get video duration in seconds"""
        try:
            probe = ffmpeg.probe(str(file_path))
            return float(probe['format']['duration'])
        except Exception as e:
            print(f"Error getting video duration: {e}")
            return None
    
    async def validate_video_file(self, file_path: Path) -> bool:
        """Validate if video file is readable and has video stream"""
        try:
            probe = ffmpeg.probe(str(file_path))
            video_streams = [s for s in probe['streams'] if s['codec_type'] == 'video']
            return len(video_streams) > 0
        except Exception:
            return False 