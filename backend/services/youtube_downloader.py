import os
import yt_dlp
import asyncio
from pathlib import Path
import tempfile
import json
from typing import Dict, Any, Optional
from .logger import logger
from .file_manager import FileManager

class YouTubeDownloader:
    def __init__(self, ffmpeg_path: str = None):
        self.file_manager = FileManager()
        self.ffmpeg_path = ffmpeg_path or self._get_ffmpeg_path()
        
        # Configure yt-dlp options
        self.ydl_opts = {
            'format': 'best[height<=1080][ext=mp4]/best[ext=mp4]/best',
            'outtmpl': '%(title)s.%(ext)s',
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en', 'en-US'],
            'subtitlesformat': 'vtt',
            'ignoreerrors': True,
            'no_warnings': False,
            'extractaudio': False,
            'audioformat': 'mp3',
            'embed_subs': False,
            'writeinfojson': True,
            'writethumbnail': True,
        }
        
        if self.ffmpeg_path:
            self.ydl_opts['ffmpeg_location'] = self.ffmpeg_path
            
    def _get_ffmpeg_path(self) -> Optional[str]:
        """Get the ffmpeg path from the project structure"""
        try:
            # Check if ffmpeg is in PATH
            import shutil
            if shutil.which('ffmpeg'):
                return shutil.which('ffmpeg')
                
            # Check project ffmpeg directory
            project_root = Path(__file__).parent.parent.parent
            ffmpeg_path = project_root / "ffmpeg" / "ffmpeg-7.1.1-essentials_build" / "bin" / "ffmpeg.exe"
            
            if ffmpeg_path.exists():
                return str(ffmpeg_path)
                
        except Exception as e:
            logger.warning(f"Could not determine ffmpeg path: {e}")
            
        return None
        
    def validate_youtube_url(self, url: str) -> bool:
        """Validate if the URL is a valid YouTube URL"""
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                return info is not None
        except Exception as e:
            logger.error(f"URL validation failed: {e}")
            return False
            
    def get_video_info(self, url: str) -> Dict[str, Any]:
        """Extract video information without downloading"""
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                
                return {
                    'title': info.get('title', 'Unknown Title'),
                    'description': info.get('description', ''),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', 'Unknown'),
                    'upload_date': info.get('upload_date', ''),
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                    'thumbnail': info.get('thumbnail', ''),
                    'webpage_url': info.get('webpage_url', url),
                    'video_id': info.get('id', ''),
                    'extractor': info.get('extractor', ''),
                    'formats': len(info.get('formats', [])),
                    'resolution': self._get_best_resolution(info.get('formats', []))
                }
        except Exception as e:
            logger.error(f"Failed to extract video info: {e}")
            raise Exception(f"Failed to get video information: {str(e)}")
            
    def _get_best_resolution(self, formats: list) -> str:
        """Get the best available resolution from formats"""
        try:
            best_height = 0
            for fmt in formats:
                height = fmt.get('height', 0)
                if height and height > best_height:
                    best_height = height
            return f"{best_height}p" if best_height > 0 else "Unknown"
        except:
            return "Unknown"
            
    async def download_video(self, url: str, output_dir: str, filename_prefix: str = "") -> Dict[str, Any]:
        """Download YouTube video and return file information"""
        try:
            # Create temporary directory for download
            with tempfile.TemporaryDirectory() as temp_dir:
                # Configure output template
                if filename_prefix:
                    outtmpl = os.path.join(temp_dir, f"{filename_prefix}_%(title)s.%(ext)s")
                else:
                    outtmpl = os.path.join(temp_dir, "%(title)s.%(ext)s")
                
                # Update options for this download
                download_opts = self.ydl_opts.copy()
                download_opts['outtmpl'] = outtmpl
                
                # Download the video
                with yt_dlp.YoutubeDL(download_opts) as ydl:
                    info = ydl.extract_info(url)
                    
                    # Find the downloaded video file
                    video_files = []
                    for file in os.listdir(temp_dir):
                        if file.endswith(('.mp4', '.webm', '.mkv', '.avi')):
                            video_files.append(file)
                            
                    if not video_files:
                        raise Exception("No video file found after download")
                        
                    # Use the first (and likely only) video file
                    downloaded_file = os.path.join(temp_dir, video_files[0])
                    
                    # Generate a clean filename
                    clean_filename = self._generate_clean_filename(info.get('title', 'youtube_video'))
                    final_path = os.path.join(output_dir, f"{clean_filename}.mp4")
                    
                    # Ensure output directory exists
                    os.makedirs(output_dir, exist_ok=True)
                    
                    # Move file to final location
                    import shutil
                    shutil.move(downloaded_file, final_path)
                    
                    # Get file stats
                    file_stats = os.stat(final_path)
                    
                    # Look for additional files (subtitles, thumbnails, etc.)
                    additional_files = {}
                    for file in os.listdir(temp_dir):
                        if file.endswith(('.vtt', '.srt', '.json', '.jpg', '.png', '.webp')):
                            src_path = os.path.join(temp_dir, file)
                            dst_path = os.path.join(output_dir, f"{clean_filename}_{file}")
                            shutil.move(src_path, dst_path)
                            
                            if file.endswith(('.vtt', '.srt')):
                                additional_files['subtitles'] = dst_path
                            elif file.endswith('.json'):
                                additional_files['metadata'] = dst_path
                            elif file.endswith(('.jpg', '.png', '.webp')):
                                additional_files['thumbnail_original'] = dst_path
                    
                    return {
                        'filepath': final_path,
                        'filename': f"{clean_filename}.mp4",
                        'filesize': file_stats.st_size,
                        'title': info.get('title', 'Unknown Title'),
                        'description': info.get('description', ''),
                        'duration': info.get('duration', 0),
                        'uploader': info.get('uploader', 'Unknown'),
                        'url': url,
                        'video_id': info.get('id', ''),
                        'additional_files': additional_files,
                        'download_success': True
                    }
                    
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return {
                'download_success': False,
                'error': str(e)
            }
            
    def _generate_clean_filename(self, title: str) -> str:
        """Generate a clean filename from video title"""
        import re
        # Remove invalid characters for filesystem
        clean_title = re.sub(r'[<>:"/\\|?*]', '', title)
        # Replace spaces with underscores and limit length
        clean_title = clean_title.replace(' ', '_')[:100]
        # Remove multiple underscores
        clean_title = re.sub(r'_+', '_', clean_title)
        # Remove leading/trailing underscores
        clean_title = clean_title.strip('_')
        
        if not clean_title:
            clean_title = "youtube_video"
            
        return clean_title
        
    async def download_with_progress(self, url: str, output_dir: str, progress_callback=None):
        """Download with progress tracking"""
        def progress_hook(d):
            if progress_callback and d['status'] == 'downloading':
                progress_callback({
                    'status': 'downloading',
                    'downloaded_bytes': d.get('downloaded_bytes', 0),
                    'total_bytes': d.get('total_bytes', 0),
                    'speed': d.get('speed', 0),
                    'eta': d.get('eta', 0)
                })
            elif progress_callback and d['status'] == 'finished':
                progress_callback({
                    'status': 'finished',
                    'filename': d.get('filename', '')
                })
                
        # Add progress hook to options
        download_opts = self.ydl_opts.copy()
        download_opts['progress_hooks'] = [progress_hook]
        
        return await self.download_video(url, output_dir)
        
    def get_supported_sites(self) -> list:
        """Get list of supported sites by yt-dlp"""
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                extractors = ydl._get_supported_extractors()
                return [extractor.IE_NAME for extractor in extractors if hasattr(extractor, 'IE_NAME')][:50]  # Limit to 50 for brevity
        except Exception as e:
            logger.error(f"Failed to get supported sites: {e}")
            return ['youtube', 'vimeo', 'dailymotion', 'twitch']  # Fallback list 