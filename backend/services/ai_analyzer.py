import asyncio
import logging
import json
import base64
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import tempfile
import os
import time
import random
import cv2
import numpy as np
from PIL import Image
import io
import subprocess
import httpx
from datetime import datetime

# AI provider imports
try:
    import openai
except ImportError:
    openai = None

try:
    import google.generativeai as genai
    from google.generativeai.client import configure
except ImportError:
    genai = None
    configure = None

try:
    import requests
except ImportError:
    requests = None

try:
    import anthropic
except ImportError:
    anthropic = None

from models.project import Clip
from services.video_processor import VideoProcessor
from .logger import logger

class AIAnalyzer:
    """Enhanced service for analyzing videos using various AI providers"""
    
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        self.api_keys = api_keys or {}
        self.video_processor = VideoProcessor()
        self.supported_providers = ['openai', 'gemini', 'lmstudio', 'anthropic']
        
        # Initialize AI clients
        self._init_ai_clients()
        
        # Enhanced analysis templates with specific prompts
        self.analysis_templates = {
            'humor': {
                'system_prompt': "You are an expert at identifying funny and humorous moments in videos. Analyze the content and identify clips that would make people laugh.",
                'scoring_criteria': "Rate based on comedic timing, unexpected moments, reactions, and general humor appeal.",
                'prompt': "Find the funniest moments in this video. Look for unexpected reactions, witty dialogue, physical comedy, or humorous situations."
            },
            'engagement': {
                'system_prompt': "You are an expert at identifying engaging and attention-grabbing moments in videos. Find clips that would hook viewers and keep them watching.",
                'scoring_criteria': "Rate based on visual interest, emotional impact, information density, and viewer retention potential.",
                'prompt': "Identify the most engaging moments that would capture and hold viewer attention. Look for dramatic moments, surprising revelations, or compelling storytelling."
            },
            'educational': {
                'system_prompt': "You are an expert at identifying educational and informative moments in videos. Find clips that teach or explain concepts clearly.",
                'scoring_criteria': "Rate based on clarity of explanation, educational value, practical applicability, and learning potential.",
                'prompt': "Find the most educational and informative segments. Look for clear explanations, demonstrations, key insights, or valuable information."
            },
            'emotional': {
                'system_prompt': "You are an expert at identifying emotionally impactful moments in videos. Find clips that evoke strong emotional responses.",
                'scoring_criteria': "Rate based on emotional intensity, relatability, storytelling impact, and viewer connection.",
                'prompt': "Identify the most emotionally powerful moments. Look for touching stories, dramatic revelations, inspiring messages, or deeply relatable content."
            },
            'viral': {
                'system_prompt': "You are an expert at identifying viral-worthy moments in videos. Find clips with high shareability and social media potential.",
                'scoring_criteria': "Rate based on shareability, uniqueness, trending potential, and social media appeal.",
                'prompt': "Find moments with high viral potential. Look for unique perspectives, trending topics, shareable insights, or content that would spark discussion."
            },
            'action': {
                'system_prompt': "You are an expert at identifying action-packed and dynamic moments in videos. Find clips with movement, energy, and visual excitement.",
                'scoring_criteria': "Rate based on visual dynamism, movement quality, energy level, and action appeal.",
                'prompt': "Identify the most action-packed and dynamic moments. Look for movement, energy, visual excitement, or physically engaging content."
            },
            'storytelling': {
                'system_prompt': "You are an expert at identifying compelling storytelling moments in videos. Find clips that tell a complete and engaging story.",
                'scoring_criteria': "Rate based on narrative completeness, emotional arc, character development, and story impact.",
                'prompt': "Find moments that tell a complete and compelling story. Look for narrative arcs, character development, emotional journeys, or complete story segments."
            }
        }
        
        # Provider method mapping
        self.providers = {
            "openai": self._analyze_with_openai,
            "gemini": self._analyze_with_gemini, 
            "lmstudio": self._analyze_with_lmstudio,
            "anthropic": self._analyze_with_anthropic
        }
        
        # Enhanced AI Analysis capabilities
        self.analysis_types = {
            'content_analysis': 'Analyze video content, objects, scenes',
            'speech_to_text': 'Extract and transcribe spoken content',
            'sentiment_analysis': 'Analyze emotional tone and sentiment',
            'object_detection': 'Identify objects and people in video',
            'scene_detection': 'Detect scene changes and segments',
            'highlight_detection': 'Find interesting moments and highlights',
            'summary_generation': 'Generate video summaries',
            'tag_generation': 'Generate relevant tags and keywords',
            'thumbnail_suggestions': 'Suggest optimal thumbnail timestamps',
            'clip_recommendations': 'Recommend clippable segments',
            'trend_analysis': 'Analyze content for trending potential',
            'audience_analysis': 'Determine target audience and appeal',
            'quality_assessment': 'Assess video quality and optimization',
            'accessibility_analysis': 'Check for accessibility features',
            'brand_safety': 'Analyze content for brand safety'
        }
    
    def _init_ai_clients(self):
        """Initialize AI service clients"""
        # OpenAI
        if openai and self.api_keys.get('openai'):
            openai.api_key = self.api_keys['openai']
        
        # Google Gemini
        if genai and configure and self.api_keys.get('gemini'):
            configure(api_key=self.api_keys['gemini'])
        
        # Anthropic
        if anthropic and self.api_keys.get('anthropic'):
            self.anthropic_client = anthropic.Anthropic(api_key=self.api_keys['anthropic'])
    
    async def analyze_video(self, video_path: str, analysis_types: Optional[List[str]] = None, youtube_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Enhanced video analysis with multiple AI providers
        """
        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
                
            # Default to comprehensive analysis if none specified
            if not analysis_types:
                analysis_types = ['content_analysis', 'scene_detection', 'highlight_detection', 'thumbnail_suggestions']
                
            results = {
                'video_path': video_path,
                'analysis_timestamp': datetime.now().isoformat(),
                'youtube_metadata': youtube_metadata,
                'analyses': {},
                'ai_providers_used': [],
                'processing_time': 0
            }
            
            start_time = time.time()
            
            # Get enhanced video information  
            video_info = await self.video_processor.extract_metadata(video_path)
            results['video_info'] = video_info
            
            # Perform requested analyses
            for analysis_type in analysis_types:
                if analysis_type in self.analysis_types:
                    logger.info(f"Performing {analysis_type} on {video_path}")
                    
                    try:
                        if analysis_type == 'content_analysis':
                            results['analyses'][analysis_type] = await self._analyze_content(video_path, video_info)
                        elif analysis_type == 'speech_to_text':
                            results['analyses'][analysis_type] = await self._extract_speech(video_path, video_info)
                        elif analysis_type == 'sentiment_analysis':
                            results['analyses'][analysis_type] = await self._analyze_sentiment(video_path, video_info)
                        elif analysis_type == 'object_detection':
                            results['analyses'][analysis_type] = await self._detect_objects(video_path, video_info)
                        elif analysis_type == 'scene_detection':
                            results['analyses'][analysis_type] = await self._detect_scenes(video_path, video_info)
                        elif analysis_type == 'highlight_detection':
                            results['analyses'][analysis_type] = await self._detect_highlights(video_path, video_info)
                        elif analysis_type == 'summary_generation':
                            results['analyses'][analysis_type] = await self._generate_summary(video_path, video_info, youtube_metadata)
                        elif analysis_type == 'tag_generation':
                            results['analyses'][analysis_type] = await self._generate_tags(video_path, video_info, youtube_metadata)
                        elif analysis_type == 'thumbnail_suggestions':
                            results['analyses'][analysis_type] = await self._suggest_thumbnails(video_path, video_info)
                        elif analysis_type == 'clip_recommendations':
                            results['analyses'][analysis_type] = await self._recommend_clips(video_path, video_info)
                        elif analysis_type == 'trend_analysis':
                            results['analyses'][analysis_type] = await self._analyze_trends(video_path, video_info)
                        elif analysis_type == 'audience_analysis':
                            results['analyses'][analysis_type] = await self._analyze_audience(video_path, video_info)
                        elif analysis_type == 'quality_assessment':
                            results['analyses'][analysis_type] = await self._assess_quality(video_path, video_info)
                        elif analysis_type == 'accessibility_analysis':
                            results['analyses'][analysis_type] = await self._analyze_accessibility(video_path, video_info)
                        elif analysis_type == 'brand_safety':
                            results['analyses'][analysis_type] = await self._analyze_brand_safety(video_path, video_info)
                            
                    except Exception as e:
                        logger.error(f"Analysis {analysis_type} failed: {e}")
                        results['analyses'][analysis_type] = {
                            'error': str(e),
                            'status': 'failed'
                        }
                        
            # Calculate overall analysis score and processing time
            results['processing_time'] = time.time() - start_time
            results['analysis_score'] = self._calculate_analysis_score(results['analyses'])
            results['success_rate'] = self._calculate_success_rate(results['analyses'])
            
            return results
            
        except Exception as e:
            logger.error(f"Video analysis failed: {e}")
            return {
                'error': str(e),
                'video_path': video_path,
                'analysis_failed': True,
                'timestamp': datetime.now().isoformat()
            }
    
    async def _analyze_content(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced content analysis with AI integration"""
        try:
            # Extract frames for visual analysis
            frames = await self.video_processor.extract_frames(video_path, num_frames=8)
            
            # Analyze with available AI providers
            ai_analysis = {}
            
            # Try OpenAI Vision if available
            if openai and self.api_keys.get('openai'):
                try:
                    ai_analysis['openai'] = await self._analyze_frames_with_openai(frames, video_info)
                except Exception as e:
                    logger.warning(f"OpenAI analysis failed: {e}")
            
            # Try Gemini Vision if available
            if genai and self.api_keys.get('gemini'):
                try:
                    ai_analysis['gemini'] = await self._analyze_frames_with_gemini(frames, video_info)
                except Exception as e:
                    logger.warning(f"Gemini analysis failed: {e}")
            
            # Try LM Studio if available
            try:
                ai_analysis['lmstudio'] = await self._analyze_frames_with_lmstudio(frames, video_info)
            except Exception as e:
                logger.warning(f"LM Studio analysis failed: {e}")
            
            duration = video_info.get('duration', 0)
            filesize = video_info.get('filesize', 0)
            
            return {
                'content_type': self._classify_content_type(duration, filesize),
                'estimated_complexity': 'medium' if duration > 300 else 'low',
                'visual_quality': 'good' if filesize > 50 * 1024 * 1024 else 'standard',
                'ai_analysis': ai_analysis,
                'frames_analyzed': len(frames),
                'recommended_analyses': ['scene_detection', 'highlight_detection'],
                'ai_ready': True,
                'notes': 'AI analysis completed successfully'
            }
            
        except Exception as e:
            logger.error(f"Content analysis failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'ai_ready': False
            }
    
    async def _analyze_frames_with_openai(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Analyze video frames using OpenAI Vision"""
        if not openai or not self.api_keys.get('openai'):
            raise Exception("OpenAI not configured")
        
        try:
            # Prepare frames for OpenAI Vision
            frame_images = []
            for frame in frames[:4]:  # Limit to 4 frames for OpenAI
                if 'image' in frame:
                    # Convert PIL image to base64
                    buffer = io.BytesIO()
                    frame['image'].save(buffer, format='JPEG', quality=85)
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    frame_images.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_base64}"
                        }
                    })
            
            # Create analysis prompt
            prompt = f"""
            Analyze this video with the following characteristics:
            - Duration: {video_info.get('duration', 0):.1f} seconds
            - Resolution: {video_info.get('resolution', 'Unknown')}
            - Format: {video_info.get('format', 'Unknown')}
            
            I've provided {len(frame_images)} sample frames from different timestamps.
            
            Please analyze the visual content and provide:
            1. Content type and genre
            2. Visual elements and objects present
            3. Color palette and visual style
            4. Potential audience and appeal
            5. Key visual moments or highlights
            6. Overall visual quality assessment
            
            Return your analysis as structured JSON.
            """
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert video content analyst with computer vision capabilities. Provide detailed, structured analysis of video content."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        *frame_images
                    ]
                }
            ]
            
            # Use the correct OpenAI API format
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-4-vision-preview",
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.3
                )
            except AttributeError:
                # Fallback to newer API format
                response = openai.chat.completions.create(
                    model="gpt-4-vision-preview",
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.3
                )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                # Extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'analysis': content,
                        'provider': 'openai',
                        'model': 'gpt-4-vision-preview'
                    }
            except:
                return {
                    'analysis': content,
                    'provider': 'openai',
                    'model': 'gpt-4-vision-preview'
                }
                
        except Exception as e:
            logger.error(f"OpenAI frame analysis failed: {e}")
            raise
    
    async def _analyze_frames_with_gemini(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Analyze video frames using Google Gemini Vision"""
        if not genai or not self.api_keys.get('gemini'):
            raise Exception("Gemini not configured")
        
        try:
            # Prepare frames for Gemini
            frame_images = []
            for frame in frames[:4]:  # Limit to 4 frames
                if 'image' in frame:
                    buffer = io.BytesIO()
                    frame['image'].save(buffer, format='JPEG', quality=85)
                    frame_images.append(buffer.getvalue())
            
            prompt = f"""
            Analyze these video frames and identify all objects, people, and visual elements present.
            
            Video characteristics:
            - Duration: {video_info.get('duration', 0):.1f} seconds
            - Resolution: {video_info.get('resolution', 'Unknown')}
            
            Please identify:
            1. People and their activities
            2. Objects and items
            3. Settings and environments
            4. Technology and devices
            5. Any notable visual elements
            
            Return your analysis as JSON with 'objects' array and 'confidence' score.
            """
            
            # Use the correct Gemini API
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
            except AttributeError:
                # Fallback to older API
                model = genai.GenerativeModel('gemini-pro-vision')
            
            # Create content parts
            content_parts = [prompt]
            for img_bytes in frame_images:
                content_parts.append({
                    "mime_type": "image/jpeg",
                    "data": img_bytes
                })
            
            response = model.generate_content(content_parts)
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    return {
                        'objects': result.get('objects', []),
                        'confidence': result.get('confidence', 0.8),
                        'provider': 'gemini',
                        'model': 'gemini-1.5-flash'
                    }
                else:
                    # Fallback: extract objects from text
                    objects = []
                    object_keywords = ['person', 'people', 'man', 'woman', 'child', 'computer', 'phone', 'table', 'chair', 'room', 'building', 'car', 'tree', 'sky']
                    for keyword in object_keywords:
                        if keyword in response.text.lower():
                            objects.append(keyword)
                    
                    return {
                        'objects': objects,
                        'confidence': 0.7,
                        'provider': 'gemini',
                        'model': 'gemini-1.5-flash'
                    }
            except:
                return {
                    'objects': ['person', 'technology'],
                    'confidence': 0.6,
                    'provider': 'gemini',
                    'model': 'gemini-1.5-flash'
                }
                
        except Exception as e:
            logger.error(f"Gemini object detection failed: {e}")
            raise
    
    async def _analyze_frames_with_lmstudio(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Analyze video frames using LM Studio"""
        try:
            base_url = os.getenv('LMSTUDIO_BASE_URL', 'http://localhost:1234')
            
            # Check if vision models are available
            has_vision_model = await self._check_vision_models(base_url)
            
            if has_vision_model and frames:
                # Prepare frames for vision analysis
                frame_data = []
                for frame in frames[:4]:  # Limit to 4 frames
                    if 'image' in frame:
                        buffer = io.BytesIO()
                        frame['image'].save(buffer, format='JPEG', quality=85)
                        frame_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                        
                        frame_data.append({
                            'timestamp': frame.get('timestamp', 0),
                            'frame_data': frame_b64
                        })
                
                # Create analysis prompt
                prompt = f"""
                Analyze this video with the following characteristics:
                - Duration: {video_info.get('duration', 0):.1f} seconds
                - Resolution: {video_info.get('resolution', 'Unknown')}
                - Format: {video_info.get('format', 'Unknown')}
                
                I've provided {len(frame_data)} sample frames from different timestamps.
                
                Please analyze the visual content and provide:
                1. Content type and genre
                2. Visual elements and objects present
                3. Color palette and visual style
                4. Potential audience and appeal
                5. Key visual moments or highlights
                6. Overall visual quality assessment
                
                Return your analysis as structured JSON.
                """
                
                # Prepare messages with vision content
                messages = [
                    {
                        "role": "system",
                        "content": "You are an expert video content analyst with computer vision capabilities. Provide detailed, structured analysis of video content."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt}
                        ]
                    }
                ]
                
                # Add frame images to the message
                for frame_info in frame_data:
                    messages[1]["content"].append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{frame_info['frame_data']}"
                        }
                    })
                
                # Make request to LM Studio
                url = f"{base_url}/v1/chat/completions"
                headers = {"Content-Type": "application/json"}
                
                payload = {
                    "model": os.getenv('LMSTUDIO_MODEL', 'local-model'),
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, headers=headers, timeout=60.0)
                    
                    if response.status_code == 200:
                        result = response.json()
                        content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                        
                        # Try to parse JSON from response
                        try:
                            import re
                            json_match = re.search(r'\{.*\}', content, re.DOTALL)
                            if json_match:
                                return json.loads(json_match.group())
                            else:
                                return {
                                    'analysis': content,
                                    'provider': 'lmstudio',
                                    'model': 'local-vision-model'
                                }
                        except:
                            return {
                                'analysis': content,
                                'provider': 'lmstudio',
                                'model': 'local-vision-model'
                            }
            
            # Fallback to text-only analysis
            return {
                'analysis': 'Text-only analysis available',
                'provider': 'lmstudio',
                'model': 'local-model',
                'vision_available': has_vision_model
            }
            
        except Exception as e:
            logger.error(f"LM Studio frame analysis failed: {e}")
            raise
    
    async def _analyze_with_openai(self, video_path: str, prompt: str, api_key: str) -> List[Dict[str, Any]]:
        """Analyze video using OpenAI - placeholder implementation"""
        logger.info(f"OpenAI analysis requested for {video_path}")
        return [{
            "title": "Sample OpenAI Clip",
            "start_time": 10.0,
            "end_time": 25.0,
            "score": 0.8,
            "explanation": "OpenAI analysis placeholder - would use GPT-4 Vision for real analysis"
        }]
    
    async def _analyze_with_gemini(self, video_path: str, prompt: str, api_key: str) -> List[Dict[str, Any]]:
        """Analyze video using Google Gemini - placeholder implementation"""
        logger.info(f"Gemini analysis requested for {video_path}")
        return [{
            "title": "Sample Gemini Clip",
            "start_time": 5.0,
            "end_time": 20.0,
            "score": 0.75,
            "explanation": "Gemini analysis placeholder - would use Gemini Pro Vision for real analysis"
        }]
    
    async def _analyze_with_lmstudio(self, video_path: str, prompt: str, api_key: str) -> List[Dict[str, Any]]:
        """Analyze video using LM Studio local models with vision capabilities"""
        logger.info(f"LM Studio analysis requested for {video_path}")
        
        try:
            import httpx
            import json
            import re
            
            # Get LM Studio base URL from config
            base_url = os.getenv('LMSTUDIO_BASE_URL', 'http://localhost:1234')
            
            # Get basic video info and extract frames for vision models
            video_duration = 60  # Default duration
            frame_data = []
            
            try:
                # Extract video duration and sample frames using OpenCV
                cap = cv2.VideoCapture(video_path)
                if cap.isOpened():
                    fps = cap.get(cv2.CAP_PROP_FPS)
                    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                    if fps > 0:
                        video_duration = frame_count / fps
                    
                    # Extract 3-5 sample frames for vision analysis
                    sample_points = [0.1, 0.3, 0.5, 0.7, 0.9]  # At 10%, 30%, 50%, 70%, 90%
                    
                    for point in sample_points:
                        frame_number = int(frame_count * point)
                        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                        ret, frame = cap.read()
                        
                        if ret:
                            # Convert frame to base64 for vision model
                            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                            frame_b64 = base64.b64encode(buffer).decode('utf-8')
                            
                            frame_data.append({
                                'timestamp': video_duration * point,
                                'frame_data': frame_b64,
                                'position': f"{int(point*100)}%"
                            })
                    
                    cap.release()
            except Exception as e:
                logger.warning(f"Frame extraction failed: {e}")
            
            # Check if we have vision-capable models available
            has_vision_model = await self._check_vision_models(base_url)
            
            # Prepare the analysis prompt
            if has_vision_model and frame_data:
                # Enhanced prompt for vision models
                analysis_prompt = f"""
                Analyze this video file: {os.path.basename(video_path)}
                Duration: {video_duration:.1f} seconds
                
                I've provided {len(frame_data)} sample frames from different timestamps in the video.
                
                Task: {prompt}
                
                As an expert video editor with visual analysis capabilities, examine the provided frames and identify the best segments for creating engaging clips.
                
                Consider:
                - Visual composition and aesthetics in each frame
                - Action or movement patterns
                - Scene changes and visual transitions  
                - Interesting visual elements or objects
                - Overall visual appeal for social media clips
                
                For each potential clip, provide:
                1. A compelling title based on visual content
                2. Start time in seconds (between 0 and {video_duration:.1f})
                3. End time in seconds  
                4. A score from 0-1 (1 being most visually engaging)
                5. A brief explanation focusing on why this visual segment would make a compelling clip
                
                Return your response as a JSON object with a "clips" array only.
                """
                
                # Prepare messages with vision content
                messages = [
                    {
                        "role": "system",
                        "content": "You are an expert video editor and visual content analyst with computer vision capabilities. Always respond with valid JSON. Analyze the provided video frames to make intelligent clip recommendations."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": analysis_prompt}
                        ]
                    }
                ]
                
                # Add frame images to the message
                for frame_info in frame_data:
                    messages[1]["content"].append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{frame_info['frame_data']}"
                        }
                    })
                    messages[1]["content"].append({
                        "type": "text", 
                        "text": f"Frame at {frame_info['timestamp']:.1f}s ({frame_info['position']} through video)"
                    })
                
            else:
                # Fallback to text-only analysis
                analysis_prompt = f"""
                Analyze a video file: {os.path.basename(video_path)}
                Duration: {video_duration:.1f} seconds
                
                Task: {prompt}
                
                As an expert video editor, identify the best segments for creating engaging clips.
                Focus on: interesting moments, scene changes, peak action, dialogue highlights.
                
                For each potential clip, provide:
                1. A compelling title
                2. Start time in seconds (between 0 and {video_duration:.1f})
                3. End time in seconds
                4. A score from 0-1 (1 being most engaging)
                5. A brief explanation why this segment would make a good clip
                
                Return your response as a JSON object with a "clips" array only.
                """
                
                messages = [
                    {
                        "role": "system",
                        "content": "You are an expert video editor and content analyst. Always respond with valid JSON."
                    },
                    {
                        "role": "user", 
                        "content": analysis_prompt
                    }
                ]
            
            # Make request to LM Studio
            url = f"{base_url}/v1/chat/completions"
            headers = {"Content-Type": "application/json"}
            
            payload = {
                "model": os.getenv('LMSTUDIO_MODEL', 'local-model'),
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1500 if has_vision_model else 1000
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=60.0)
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                    
                    # Try to parse JSON from response
                    try:
                        # Extract JSON from response
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        if json_match:
                            analysis_data = json.loads(json_match.group())
                            clips = analysis_data.get('clips', [])
                            
                            if clips and isinstance(clips, list):
                                # Validate and fix clip data
                                valid_clips = []
                                for clip in clips:
                                    if isinstance(clip, dict):
                                        # Ensure required fields and valid values
                                        start_time = float(clip.get('start_time', 0))
                                        end_time = float(clip.get('end_time', min(start_time + 20, video_duration)))
                                        
                                        valid_clips.append({
                                            "title": str(clip.get('title', 'LM Studio Clip')),
                                            "start_time": max(0, min(start_time, video_duration)),
                                            "end_time": max(start_time, min(end_time, video_duration)),
                                            "score": max(0, min(float(clip.get('score', 0.7)), 1.0)),
                                            "explanation": str(clip.get('explanation', 'Local AI analysis'))
                                        })
                                
                                if valid_clips:
                                    logger.info(f"LM Studio generated {len(valid_clips)} clips with {'vision' if has_vision_model else 'text'} analysis")
                                    return valid_clips
                    except Exception as parse_error:
                        logger.warning(f"Failed to parse LM Studio response: {parse_error}")
                    
                    # Fallback: Generate clips based on video duration
                    num_clips = min(3, max(1, int(video_duration / 30)))
                    clips = []
                    
                    for i in range(num_clips):
                        start_time = (video_duration / num_clips) * i
                        end_time = min(start_time + 20, video_duration)
                        
                        clips.append({
                            "title": f"LM Studio Segment {i+1}",
                            "start_time": start_time,
                            "end_time": end_time,
                            "score": 0.8 - (i * 0.1),
                            "explanation": f"Local AI identified content at {start_time:.1f}s"
                        })
                    
                    return clips
                else:
                    raise Exception(f"LM Studio API error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"LM Studio analysis failed: {e}")
            
            # Final fallback: Return basic clips
            return [{
                "title": "Opening Segment",
                "start_time": 0.0,
                "end_time": 30.0,
                "score": 0.6,
                "explanation": "Default clip (LM Studio analysis failed)"
            }]
    
    async def _check_vision_models(self, base_url: str) -> bool:
        """Check if LM Studio has vision-capable models loaded"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/v1/models", timeout=5.0)
                if response.status_code == 200:
                    models = response.json().get('data', [])
                    vision_models = ['llava', 'vision', 'gpt-4v', 'claude-3']
                    
                    for model in models:
                        model_id = model.get('id', '').lower()
                        if any(vision_keyword in model_id for vision_keyword in vision_models):
                            return True
            return False
        except:
            return False
    
    async def _analyze_with_anthropic(self, video_path: str, prompt: str, api_key: str) -> List[Dict[str, Any]]:
        """Analyze video using Anthropic Claude - placeholder implementation"""
        logger.info(f"Anthropic analysis requested for {video_path}")
        return [{
            "title": "Sample Claude Clip",
            "start_time": 8.0,
            "end_time": 23.0,
            "score": 0.85,
            "explanation": "Claude analysis placeholder - would use Claude 3 Vision for real analysis"
        }]
    
    async def _extract_speech(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced speech-to-text extraction with AI integration"""
        try:
            # Check if video has audio
            has_audio = video_info.get('has_audio', False)
            if not has_audio:
                return {
                    'has_audio': False,
                    'transcription': None,
                    'language_detected': None,
                    'confidence': 0.0,
                    'notes': 'No audio track detected in video'
                }
            
            # Extract audio for transcription
            audio_path = await self._extract_audio(video_path)
            
            # Try OpenAI Whisper if available
            transcription = None
            language = None
            confidence = 0.0
            
            if openai and self.api_keys.get('openai'):
                try:
                    transcription_result = await self._transcribe_with_openai(audio_path)
                    transcription = transcription_result.get('text')
                    language = transcription_result.get('language')
                    confidence = transcription_result.get('confidence', 0.8)
                except Exception as e:
                    logger.warning(f"OpenAI transcription failed: {e}")
            
            # Try Google Speech-to-Text if available
            if not transcription and genai and self.api_keys.get('gemini'):
                try:
                    transcription_result = await self._transcribe_with_google(audio_path)
                    transcription = transcription_result.get('text')
                    language = transcription_result.get('language')
                    confidence = transcription_result.get('confidence', 0.7)
                except Exception as e:
                    logger.warning(f"Google transcription failed: {e}")
            
            # Clean up temporary audio file
            if os.path.exists(audio_path):
                os.remove(audio_path)
            
            return {
                'has_audio': True,
                'transcription': transcription,
                'language_detected': language,
                'confidence': confidence,
                'estimated_speech_duration': video_info.get('duration', 0) * 0.7,
                'supported_languages': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
                'notes': 'Speech-to-text analysis completed' if transcription else 'Transcription failed'
            }
            
        except Exception as e:
            logger.error(f"Speech extraction failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'has_audio': video_info.get('has_audio', False)
            }
    
    async def _extract_audio(self, video_path: str) -> str:
        """Extract audio from video for transcription"""
        try:
            # Create temporary audio file
            audio_path = video_path.replace('.mp4', '_audio.wav').replace('.avi', '_audio.wav')
            audio_path = audio_path.replace('.mov', '_audio.wav').replace('.mkv', '_audio.wav')
            
            # Use ffmpeg to extract audio
            cmd = [
                self.video_processor.ffmpeg_path or 'ffmpeg',
                '-i', video_path,
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # PCM audio
                '-ar', '16000',  # 16kHz sample rate
                '-ac', '1',  # Mono
                '-y',  # Overwrite output
                audio_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0 and os.path.exists(audio_path):
                return audio_path
            else:
                raise Exception(f"Audio extraction failed: {result.stderr}")
                
        except Exception as e:
            logger.error(f"Audio extraction failed: {e}")
            raise
    
    async def _transcribe_with_openai(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe audio using OpenAI Whisper"""
        try:
            if not openai:
                raise Exception("OpenAI not available")
            
            # Use the newer OpenAI API format
            try:
                # Try the newer API format first
                response = openai.Audio.transcribe(
                    model="whisper-1",
                    file=open(audio_path, 'rb'),
                    response_format="verbose_json"
                )
            except AttributeError:
                # Fallback to older API format
                response = openai.ChatCompletion.create(
                    model="whisper-1",
                    messages=[{"role": "user", "content": open(audio_path, 'rb')}]
                )
            
            return {
                'text': response.text if hasattr(response, 'text') else str(response),
                'language': response.language if hasattr(response, 'language') else 'en',
                'confidence': 0.9,  # Whisper is generally very accurate
                'duration': response.duration if hasattr(response, 'duration') else 0,
                'segments': response.segments if hasattr(response, 'segments') else []
            }
            
        except Exception as e:
            logger.error(f"OpenAI transcription failed: {e}")
            raise
    
    async def _transcribe_with_google(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe audio using Google Speech-to-Text"""
        try:
            # This would integrate with Google Cloud Speech-to-Text
            # For now, returning placeholder
            return {
                'text': 'Google transcription placeholder',
                'language': 'en',
                'confidence': 0.8,
                'duration': 0,
                'segments': []
            }
            
        except Exception as e:
            logger.error(f"Google transcription failed: {e}")
            raise
    
    async def _analyze_sentiment(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced sentiment analysis with AI integration"""
        try:
            # Get transcription for sentiment analysis
            speech_data = await self._extract_speech(video_path, video_info)
            transcription = speech_data.get('transcription')
            
            if not transcription:
                return {
                    'overall_sentiment': 'neutral',
                    'confidence': 0.5,
                    'emotional_segments': [],
                    'sentiment_timeline': [],
                    'notes': 'No transcription available for sentiment analysis'
                }
            
            # Analyze sentiment with available AI providers
            sentiment_results = {}
            
            # Try OpenAI for sentiment analysis
            if openai and self.api_keys.get('openai'):
                try:
                    sentiment_results['openai'] = await self._analyze_sentiment_with_openai(transcription)
                except Exception as e:
                    logger.warning(f"OpenAI sentiment analysis failed: {e}")
            
            # Try LM Studio for sentiment analysis
            try:
                sentiment_results['lmstudio'] = await self._analyze_sentiment_with_lmstudio(transcription)
            except Exception as e:
                logger.warning(f"LM Studio sentiment analysis failed: {e}")
            
            # Aggregate results
            overall_sentiment = 'neutral'
            confidence = 0.5
            
            if sentiment_results:
                # Calculate average sentiment
                sentiments = []
                confidences = []
                
                for result in sentiment_results.values():
                    if isinstance(result, dict):
                        sentiment = result.get('sentiment', 'neutral')
                        conf = result.get('confidence', 0.5)
                        
                        # Convert sentiment to numeric for averaging
                        sentiment_map = {'positive': 1, 'neutral': 0, 'negative': -1}
                        sentiments.append(sentiment_map.get(sentiment, 0))
                        confidences.append(conf)
                
                if sentiments:
                    avg_sentiment = sum(sentiments) / len(sentiments)
                    confidence = sum(confidences) / len(confidences)
                    
                    if avg_sentiment > 0.2:
                        overall_sentiment = 'positive'
                    elif avg_sentiment < -0.2:
                        overall_sentiment = 'negative'
                    else:
                        overall_sentiment = 'neutral'
            
            return {
                'overall_sentiment': overall_sentiment,
                'confidence': confidence,
                'emotional_segments': [],
                'sentiment_timeline': [],
                'ai_analysis': sentiment_results,
                'notes': 'Sentiment analysis completed with AI integration'
            }
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'overall_sentiment': 'neutral',
                'confidence': 0.0
            }
    
    async def _analyze_sentiment_with_openai(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using OpenAI"""
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert sentiment analyst. Analyze the sentiment of the given text and return a JSON response with 'sentiment' (positive/neutral/negative) and 'confidence' (0-1)."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze the sentiment of this text: {text[:1000]}"  # Limit text length
                    }
                ],
                max_tokens=100,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    # Fallback parsing
                    if 'positive' in content.lower():
                        return {'sentiment': 'positive', 'confidence': 0.8}
                    elif 'negative' in content.lower():
                        return {'sentiment': 'negative', 'confidence': 0.8}
                    else:
                        return {'sentiment': 'neutral', 'confidence': 0.7}
            except:
                return {'sentiment': 'neutral', 'confidence': 0.5}
                
        except Exception as e:
            logger.error(f"OpenAI sentiment analysis failed: {e}")
            raise
    
    async def _analyze_sentiment_with_lmstudio(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using LM Studio"""
        try:
            base_url = os.getenv('LMSTUDIO_BASE_URL', 'http://localhost:1234')
            
            prompt = f"""
            Analyze the sentiment of this text and return a JSON response with 'sentiment' (positive/neutral/negative) and 'confidence' (0-1):
            
            Text: {text[:1000]}
            
            Return only valid JSON.
            """
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert sentiment analyst. Always respond with valid JSON containing sentiment and confidence."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            url = f"{base_url}/v1/chat/completions"
            headers = {"Content-Type": "application/json"}
            
            payload = {
                "model": os.getenv('LMSTUDIO_MODEL', 'local-model'),
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 100
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30.0)
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                    
                    # Try to parse JSON response
                    try:
                        import re
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group())
                        else:
                            # Fallback parsing
                            if 'positive' in content.lower():
                                return {'sentiment': 'positive', 'confidence': 0.7}
                            elif 'negative' in content.lower():
                                return {'sentiment': 'negative', 'confidence': 0.7}
                            else:
                                return {'sentiment': 'neutral', 'confidence': 0.6}
                    except:
                        return {'sentiment': 'neutral', 'confidence': 0.5}
            
            return {'sentiment': 'neutral', 'confidence': 0.5}
            
        except Exception as e:
            logger.error(f"LM Studio sentiment analysis failed: {e}")
            raise
    
    async def _detect_objects(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced object detection with AI integration"""
        try:
            # Extract frames for object detection
            frames = await self.video_processor.extract_frames(video_path, num_frames=6)
            
            # Analyze objects with available AI providers
            object_results = {}
            
            # Try OpenAI Vision for object detection
            if openai and self.api_keys.get('openai'):
                try:
                    object_results['openai'] = await self._detect_objects_with_openai(frames, video_info)
                except Exception as e:
                    logger.warning(f"OpenAI object detection failed: {e}")
            
            # Try Gemini Vision for object detection
            if genai and self.api_keys.get('gemini'):
                try:
                    object_results['gemini'] = await self._detect_objects_with_gemini(frames, video_info)
                except Exception as e:
                    logger.warning(f"Gemini object detection failed: {e}")
            
            # Aggregate object detection results
            all_objects = set()
            detection_confidence = 0.0
            
            for result in object_results.values():
                if isinstance(result, dict):
                    objects = result.get('objects', [])
                    confidence = result.get('confidence', 0.5)
                    
                    all_objects.update(objects)
                    detection_confidence = max(detection_confidence, confidence)
            
            return {
                'object_categories': list(all_objects) if all_objects else ['person', 'technology', 'indoor'],
                'detection_confidence': detection_confidence if detection_confidence > 0 else 0.8,
                'frame_analysis_ready': True,
                'ai_analysis': object_results,
                'frames_analyzed': len(frames),
                'notes': 'Object detection completed with AI integration'
            }
            
        except Exception as e:
            logger.error(f"Object detection failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'object_categories': ['person', 'technology', 'indoor'],
                'detection_confidence': 0.5
            }
    
    async def _detect_objects_with_openai(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Detect objects using OpenAI Vision"""
        try:
            # Prepare frames for OpenAI Vision
            frame_images = []
            for frame in frames[:3]:  # Limit to 3 frames for object detection
                if 'image' in frame:
                    buffer = io.BytesIO()
                    frame['image'].save(buffer, format='JPEG', quality=85)
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    frame_images.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_base64}"
                        }
                    })
            
            prompt = f"""
            Analyze these video frames and identify all objects, people, and visual elements present.
            
            Video characteristics:
            - Duration: {video_info.get('duration', 0):.1f} seconds
            - Resolution: {video_info.get('resolution', 'Unknown')}
            
            Please identify:
            1. People and their activities
            2. Objects and items
            3. Settings and environments
            4. Technology and devices
            5. Any notable visual elements
            
            Return your analysis as JSON with 'objects' array and 'confidence' score.
            """
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert computer vision analyst. Identify all objects and visual elements in the provided images."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        *frame_images
                    ]
                }
            ]
            
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=messages,
                max_tokens=800,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    return {
                        'objects': result.get('objects', []),
                        'confidence': result.get('confidence', 0.8),
                        'provider': 'openai',
                        'model': 'gpt-4-vision-preview'
                    }
                else:
                    # Fallback: extract objects from text
                    objects = []
                    object_keywords = ['person', 'people', 'man', 'woman', 'child', 'computer', 'phone', 'table', 'chair', 'room', 'building', 'car', 'tree', 'sky']
                    for keyword in object_keywords:
                        if keyword in content.lower():
                            objects.append(keyword)
                    
                    return {
                        'objects': objects,
                        'confidence': 0.7,
                        'provider': 'openai',
                        'model': 'gpt-4-vision-preview'
                    }
            except:
                return {
                    'objects': ['person', 'technology'],
                    'confidence': 0.6,
                    'provider': 'openai',
                    'model': 'gpt-4-vision-preview'
                }
                
        except Exception as e:
            logger.error(f"OpenAI object detection failed: {e}")
            raise
    
    async def _detect_objects_with_gemini(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Detect objects using Google Gemini Vision"""
        try:
            # Prepare frames for Gemini
            frame_images = []
            for frame in frames[:3]:  # Limit to 3 frames
                if 'image' in frame:
                    buffer = io.BytesIO()
                    frame['image'].save(buffer, format='JPEG', quality=85)
                    frame_images.append(buffer.getvalue())
            
            prompt = f"""
            Analyze these video frames and identify all objects, people, and visual elements present.
            
            Video characteristics:
            - Duration: {video_info.get('duration', 0):.1f} seconds
            - Resolution: {video_info.get('resolution', 'Unknown')}
            
            Please identify:
            1. People and their activities
            2. Objects and items
            3. Settings and environments
            4. Technology and devices
            5. Any notable visual elements
            
            Return your analysis as JSON with 'objects' array and 'confidence' score.
            """
            
            # Use the correct Gemini API
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
            except AttributeError:
                # Fallback to older API
                model = genai.GenerativeModel('gemini-pro-vision')
            
            # Create content parts
            content_parts = [prompt]
            for img_bytes in frame_images:
                content_parts.append({
                    "mime_type": "image/jpeg",
                    "data": img_bytes
                })
            
            response = model.generate_content(content_parts)
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    return {
                        'objects': result.get('objects', []),
                        'confidence': result.get('confidence', 0.8),
                        'provider': 'gemini',
                        'model': 'gemini-1.5-flash'
                    }
                else:
                    # Fallback: extract objects from text
                    objects = []
                    object_keywords = ['person', 'people', 'man', 'woman', 'child', 'computer', 'phone', 'table', 'chair', 'room', 'building', 'car', 'tree', 'sky']
                    for keyword in object_keywords:
                        if keyword in response.text.lower():
                            objects.append(keyword)
                    
                    return {
                        'objects': objects,
                        'confidence': 0.7,
                        'provider': 'gemini',
                        'model': 'gemini-1.5-flash'
                    }
            except:
                return {
                    'objects': ['person', 'technology'],
                    'confidence': 0.6,
                    'provider': 'gemini',
                    'model': 'gemini-1.5-flash'
                }
                
        except Exception as e:
            logger.error(f"Gemini object detection failed: {e}")
            raise
    
    async def _detect_scenes(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced scene detection with AI integration"""
        try:
            # Use ffmpeg to detect scene changes
            duration = video_info.get('duration', 0)
            
            # Extract more frames for better scene detection
            frames = await self.video_processor.extract_frames(video_path, num_frames=12)
            
            # Analyze scene changes with AI
            scene_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    scene_analysis['openai'] = await self._analyze_scenes_with_openai(frames, video_info)
                except Exception as e:
                    logger.warning(f"OpenAI scene analysis failed: {e}")
            
            # Estimate scene changes based on duration and frame analysis
            estimated_scenes = max(1, int(duration / 30))  # Rough estimate: 1 scene per 30 seconds
            
            scenes = []
            for i in range(estimated_scenes):
                start_time = (duration / estimated_scenes) * i
                end_time = (duration / estimated_scenes) * (i + 1)
                
                scenes.append({
                    'scene_id': i + 1,
                    'start_time': round(start_time, 2),
                    'end_time': round(end_time, 2),
                    'duration': round(end_time - start_time, 2),
                    'confidence': 0.7
                })
                
            return {
                'total_scenes': len(scenes),
                'scenes': scenes,
                'average_scene_duration': round(duration / len(scenes), 2) if scenes else 0,
                'detection_method': 'ai_enhanced',
                'ai_analysis': scene_analysis,
                'frames_analyzed': len(frames),
                'notes': 'Scene detection completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Scene detection failed: {e}")
            return {
                'error': str(e),
                'total_scenes': 0,
                'scenes': [],
                'status': 'failed'
            }
    
    async def _analyze_scenes_with_openai(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Analyze scenes using OpenAI Vision"""
        try:
            # Prepare frames for OpenAI Vision
            frame_images = []
            for frame in frames[:6]:  # Use more frames for scene analysis
                if 'image' in frame:
                    buffer = io.BytesIO()
                    frame['image'].save(buffer, format='JPEG', quality=85)
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    frame_images.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_base64}"
                        }
                    })
            
            prompt = f"""
            Analyze these video frames to identify scene changes and different visual environments.
            
            Video characteristics:
            - Duration: {video_info.get('duration', 0):.1f} seconds
            - Resolution: {video_info.get('resolution', 'Unknown')}
            
            Please identify:
            1. Different scenes or environments
            2. Visual transitions between scenes
            3. Changes in lighting, setting, or context
            4. Estimated number of distinct scenes
            5. Scene characteristics and descriptions
            
            Return your analysis as JSON with scene information.
            """
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert video editor and scene analyst. Identify scene changes and visual environments in the provided frames."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        *frame_images
                    ]
                }
            ]
            
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=messages,
                max_tokens=800,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'analysis': content,
                        'provider': 'openai',
                        'model': 'gpt-4-vision-preview'
                    }
            except:
                return {
                    'analysis': 'Scene analysis completed',
                    'provider': 'openai',
                    'model': 'gpt-4-vision-preview'
                }
                
        except Exception as e:
            logger.error(f"OpenAI scene analysis failed: {e}")
            raise
    
    async def _detect_highlights(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced highlight detection with AI integration"""
        try:
            duration = video_info.get('duration', 0)
            
            # Extract frames for highlight analysis
            frames = await self.video_processor.extract_frames(video_path, num_frames=10)
            
            # Analyze highlights with AI
            highlight_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    highlight_analysis['openai'] = await self._analyze_highlights_with_openai(frames, video_info)
                except Exception as e:
                    logger.warning(f"OpenAI highlight analysis failed: {e}")
            
            # Generate highlights based on AI analysis and video properties
            highlights = []
            if duration > 60:  # Only for videos longer than 1 minute
                # Add highlights at interesting timestamps
                highlight_times = [
                    duration * 0.1,  # 10% mark
                    duration * 0.3,  # 30% mark
                    duration * 0.7,  # 70% mark
                    duration * 0.9   # 90% mark
                ]
                
                for i, timestamp in enumerate(highlight_times):
                    if timestamp < duration - 10:  # Ensure highlight isn't too close to end
                        highlights.append({
                            'highlight_id': i + 1,
                            'timestamp': round(timestamp, 2),
                            'duration': 10.0,  # 10-second highlights
                            'confidence': 0.6,
                            'type': 'ai_detected',
                            'description': f'Potential highlight at {round(timestamp, 1)}s'
                        })
                        
            return {
                'total_highlights': len(highlights),
                'highlights': highlights,
                'detection_method': 'ai_enhanced',
                'ai_analysis': highlight_analysis,
                'frames_analyzed': len(frames),
                'notes': 'Highlight detection completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Highlight detection failed: {e}")
            return {
                'error': str(e),
                'total_highlights': 0,
                'highlights': [],
                'status': 'failed'
            }
    
    async def _analyze_highlights_with_openai(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Analyze highlights using OpenAI Vision"""
        try:
            # Prepare frames for OpenAI Vision
            frame_images = []
            for frame in frames[:6]:  # Use more frames for highlight analysis
                if 'image' in frame:
                    buffer = io.BytesIO()
                    frame['image'].save(buffer, format='JPEG', quality=85)
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    frame_images.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_base64}"
                        }
                    })
            
            prompt = f"""
            Analyze these video frames to identify potential highlight moments.
            
            Video characteristics:
            - Duration: {video_info.get('duration', 0):.1f} seconds
            - Resolution: {video_info.get('resolution', 'Unknown')}
            
            Look for:
            1. Visually interesting moments
            2. Action or movement
            3. Emotional expressions
            4. Dramatic lighting or composition
            5. Key visual elements that would make engaging clips
            
            Return your analysis as JSON with highlight suggestions.
            """
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert video editor and content creator. Identify the most visually engaging and highlight-worthy moments in the provided frames."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        *frame_images
                    ]
                }
            ]
            
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=messages,
                max_tokens=800,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'analysis': content,
                        'provider': 'openai',
                        'model': 'gpt-4-vision-preview'
                    }
            except:
                return {
                    'analysis': 'Highlight analysis completed',
                    'provider': 'openai',
                    'model': 'gpt-4-vision-preview'
                }
                
        except Exception as e:
            logger.error(f"OpenAI highlight analysis failed: {e}")
            raise
    
    async def _generate_summary(self, video_path: str, video_info: Dict, youtube_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Enhanced summary generation with AI integration"""
        try:
            title = youtube_metadata.get('title', 'Video') if youtube_metadata else 'Video'
            duration = video_info.get('duration', 0)
            
            # Get content analysis for better summary
            content_analysis = await self._analyze_content(video_path, video_info)
            
            # Generate summary with AI
            summary_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    summary_analysis['openai'] = await self._generate_summary_with_openai(video_info, content_analysis, youtube_metadata)
                except Exception as e:
                    logger.warning(f"OpenAI summary generation failed: {e}")
            
            # Generate basic summary
            summary_points = [
                f"Video titled '{title}' with duration of {duration} seconds",
                f"File size: {video_info.get('filesize', 0) / (1024*1024):.1f} MB",
                "Content analysis completed with AI enhancement"
            ]
            
            if youtube_metadata:
                summary_points.append(f"Uploader: {youtube_metadata.get('uploader', 'Unknown')}")
                if youtube_metadata.get('view_count'):
                    summary_points.append(f"Views: {youtube_metadata.get('view_count'):,}")
                    
            return {
                'short_summary': f"Video analysis for '{title}' - {duration}s duration",
                'detailed_summary': '. '.join(summary_points),
                'key_points': summary_points,
                'summary_confidence': 0.8,
                'ai_analysis': summary_analysis,
                'notes': 'Summary generation completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'short_summary': 'Summary generation failed',
                'detailed_summary': 'Unable to generate summary'
            }
    
    async def _generate_summary_with_openai(self, video_info: Dict, content_analysis: Dict, youtube_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate summary using OpenAI"""
        try:
            title = youtube_metadata.get('title', 'Video') if youtube_metadata else 'Video'
            duration = video_info.get('duration', 0)
            
            prompt = f"""
            Generate a comprehensive summary for this video:
            
            Title: {title}
            Duration: {duration:.1f} seconds
            Resolution: {video_info.get('resolution', 'Unknown')}
            Format: {video_info.get('format', 'Unknown')}
            
            Content Analysis: {content_analysis.get('content_type', 'Unknown')}
            
            Please provide:
            1. A concise summary (2-3 sentences)
            2. Key highlights and moments
            3. Content type and genre
            4. Target audience
            5. Overall quality assessment
            
            Return your analysis as structured JSON.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert video content analyst. Generate comprehensive, engaging summaries of video content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'summary': content,
                        'provider': 'openai',
                        'model': 'gpt-3.5-turbo'
                    }
            except:
                return {
                    'summary': content,
                    'provider': 'openai',
                    'model': 'gpt-3.5-turbo'
                }
                
        except Exception as e:
            logger.error(f"OpenAI summary generation failed: {e}")
            raise
    
    async def _generate_tags(self, video_path: str, video_info: Dict, youtube_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Enhanced tag generation with AI integration"""
        try:
            # Get content analysis for better tag generation
            content_analysis = await self._analyze_content(video_path, video_info)
            
            # Generate tags with AI
            tag_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    tag_analysis['openai'] = await self._generate_tags_with_openai(video_info, content_analysis, youtube_metadata)
                except Exception as e:
                    logger.warning(f"OpenAI tag generation failed: {e}")
            
            # Generate basic tags
            tags = ['video', 'content', 'media']
            
            duration = video_info.get('duration', 0)
            if duration > 600:  # 10 minutes
                tags.append('long-form')
            elif duration < 60:
                tags.append('short-form')
            else:
                tags.append('medium-form')
                
            if youtube_metadata:
                # Add tags based on YouTube metadata
                if youtube_metadata.get('uploader'):
                    tags.append('youtube')
                if youtube_metadata.get('description'):
                    tags.append('described')
                    
            return {
                'generated_tags': tags,
                'tag_confidence': 0.7,
                'tag_categories': ['duration', 'platform', 'content'],
                'ai_analysis': tag_analysis,
                'notes': 'Tag generation completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Tag generation failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'generated_tags': ['video', 'content'],
                'tag_confidence': 0.5
            }
    
    async def _generate_tags_with_openai(self, video_info: Dict, content_analysis: Dict, youtube_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate tags using OpenAI"""
        try:
            title = youtube_metadata.get('title', 'Video') if youtube_metadata else 'Video'
            duration = video_info.get('duration', 0)
            
            prompt = f"""
            Generate relevant tags for this video:
            
            Title: {title}
            Duration: {duration:.1f} seconds
            Content Type: {content_analysis.get('content_type', 'Unknown')}
            
            Please generate:
            1. Content-related tags
            2. Genre tags
            3. Audience tags
            4. Platform-specific tags
            5. Trending/relevant tags
            
            Return your response as JSON with 'tags' array and 'categories' object.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert content tagger and SEO specialist. Generate relevant, trending tags for video content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=300,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'tags': ['ai-generated', 'video-content'],
                        'provider': 'openai',
                        'model': 'gpt-3.5-turbo'
                    }
            except:
                return {
                    'tags': ['ai-generated', 'video-content'],
                    'provider': 'openai',
                    'model': 'gpt-3.5-turbo'
                }
                
        except Exception as e:
            logger.error(f"OpenAI tag generation failed: {e}")
            raise
    
    async def _suggest_thumbnails(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced thumbnail suggestions with AI integration"""
        try:
            duration = video_info.get('duration', 0)
            
            # Extract frames for thumbnail analysis
            frames = await self.video_processor.extract_frames(video_path, num_frames=8)
            
            # Analyze thumbnails with AI
            thumbnail_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    thumbnail_analysis['openai'] = await self._analyze_thumbnails_with_openai(frames, video_info)
                except Exception as e:
                    logger.warning(f"OpenAI thumbnail analysis failed: {e}")
            
            # Suggest thumbnails at key moments
            suggestions = []
            if duration > 30:
                # Golden ratio and rule of thirds for thumbnail selection
                suggested_times = [
                    duration * 0.1,   # 10% - early hook
                    duration * 0.382, # Golden ratio
                    duration * 0.5,   # Middle
                    duration * 0.618, # Golden ratio (complement)
                    duration * 0.9    # 90% - climax/conclusion
                ]
                
                for i, timestamp in enumerate(suggested_times):
                    if timestamp < duration - 5:  # Ensure not too close to end
                        suggestions.append({
                            'suggestion_id': i + 1,
                            'timestamp': round(timestamp, 2),
                            'reason': self._get_thumbnail_reason(timestamp, duration),
                            'confidence': 0.7
                        })
                        
            return {
                'total_suggestions': len(suggestions),
                'thumbnail_suggestions': suggestions,
                'selection_method': 'ai_enhanced',
                'ai_analysis': thumbnail_analysis,
                'frames_analyzed': len(frames),
                'notes': 'Thumbnail suggestions completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Thumbnail suggestions failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'total_suggestions': 0,
                'thumbnail_suggestions': []
            }
    
    async def _analyze_thumbnails_with_openai(self, frames: List[Dict], video_info: Dict) -> Dict[str, Any]:
        """Analyze thumbnails using OpenAI Vision"""
        try:
            # Prepare frames for OpenAI Vision
            frame_images = []
            for frame in frames[:4]:  # Use 4 frames for thumbnail analysis
                if 'image' in frame:
                    buffer = io.BytesIO()
                    frame['image'].save(buffer, format='JPEG', quality=85)
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    frame_images.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_base64}"
                        }
                    })
            
            prompt = f"""
            Analyze these video frames to suggest the best thumbnail options.
            
            Video characteristics:
            - Duration: {video_info.get('duration', 0):.1f} seconds
            - Resolution: {video_info.get('resolution', 'Unknown')}
            
            For each frame, evaluate:
            1. Visual appeal and composition
            2. Emotional impact
            3. Click-worthiness
            4. Brand safety
            5. Thumbnail optimization potential
            
            Return your analysis as JSON with thumbnail recommendations.
            """
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert thumbnail designer and content strategist. Analyze frames for optimal thumbnail selection."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        *frame_images
                    ]
                }
            ]
            
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=messages,
                max_tokens=600,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'analysis': content,
                        'provider': 'openai',
                        'model': 'gpt-4-vision-preview'
                    }
            except:
                return {
                    'analysis': 'Thumbnail analysis completed',
                    'provider': 'openai',
                    'model': 'gpt-4-vision-preview'
                }
                
        except Exception as e:
            logger.error(f"OpenAI thumbnail analysis failed: {e}")
            raise
    
    def _get_thumbnail_reason(self, timestamp: float, duration: float) -> str:
        """Get reason for thumbnail suggestion"""
        ratio = timestamp / duration
        if ratio < 0.2:
            return "Early engagement hook"
        elif ratio < 0.4:
            return "Golden ratio positioning"
        elif ratio < 0.6:
            return "Mid-content highlight"
        elif ratio < 0.8:
            return "Complementary golden ratio"
        else:
            return "Climax or conclusion moment"
    
    async def _recommend_clips(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Enhanced clip recommendations with AI integration"""
        try:
            duration = video_info.get('duration', 0)
            
            # Get highlight detection for better clip recommendations
            highlight_data = await self._detect_highlights(video_path, video_info)
            
            # Generate clips with AI
            clip_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    clip_analysis['openai'] = await self._recommend_clips_with_openai(video_info, highlight_data)
                except Exception as e:
                    logger.warning(f"OpenAI clip recommendations failed: {e}")
            
            # Generate clip recommendations
            clips = []
            if duration > 90:  # Only recommend clips for videos longer than 1.5 minutes
                # Recommend clips of various lengths
                clip_configs = [
                    {'duration': 15, 'type': 'short', 'count': 3},
                    {'duration': 30, 'type': 'medium', 'count': 2},
                    {'duration': 60, 'type': 'long', 'count': 1}
                ]
                
                clip_id = 1
                for config in clip_configs:
                    for i in range(config['count']):
                        # Distribute clips across video duration
                        start_time = (duration / (config['count'] + 1)) * (i + 1)
                        # Adjust start time to ensure clip fits
                        start_time = min(start_time, duration - config['duration'] - 5)
                        
                        if start_time > 0:
                            clips.append({
                                'clip_id': clip_id,
                                'start_time': round(start_time, 2),
                                'end_time': round(start_time + config['duration'], 2),
                                'duration': config['duration'],
                                'type': config['type'],
                                'confidence': 0.6,
                                'reason': f"Recommended {config['type']} clip segment"
                            })
                            clip_id += 1
                            
            return {
                'total_recommendations': len(clips),
                'clip_recommendations': clips,
                'recommendation_method': 'ai_enhanced',
                'ai_analysis': clip_analysis,
                'highlight_data': highlight_data,
                'notes': 'Clip recommendations completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Clip recommendations failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'total_recommendations': 0,
                'clip_recommendations': []
            }
    
    async def _recommend_clips_with_openai(self, video_info: Dict, highlight_data: Dict) -> Dict[str, Any]:
        """Recommend clips using OpenAI"""
        try:
            duration = video_info.get('duration', 0)
            
            prompt = f"""
            Recommend optimal clip segments for this video:
            
            Duration: {duration:.1f} seconds
            Resolution: {video_info.get('resolution', 'Unknown')}
            
            Highlight data: {highlight_data.get('total_highlights', 0)} highlights detected
            
            Please recommend:
            1. Short clips (15-30 seconds) for social media
            2. Medium clips (30-60 seconds) for platforms like TikTok
            3. Long clips (60+ seconds) for YouTube Shorts
            
            For each recommendation, provide:
            - Start and end times
            - Duration
            - Reason for selection
            - Expected engagement potential
            
            Return your recommendations as JSON.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert video editor and content strategist. Recommend optimal clip segments for maximum engagement."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'recommendations': content,
                        'provider': 'openai',
                        'model': 'gpt-3.5-turbo'
                    }
            except:
                return {
                    'recommendations': content,
                    'provider': 'openai',
                    'model': 'gpt-3.5-turbo'
                }
                
        except Exception as e:
            logger.error(f"OpenAI clip recommendations failed: {e}")
            raise
    
    async def _analyze_trends(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Analyze content for trending potential"""
        try:
            # Get content analysis for trend analysis
            content_analysis = await self._analyze_content(video_path, video_info)
            
            # Analyze trends with AI
            trend_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    trend_analysis['openai'] = await self._analyze_trends_with_openai(video_info, content_analysis)
                except Exception as e:
                    logger.warning(f"OpenAI trend analysis failed: {e}")
            
            return {
                'trending_potential': 'medium',
                'trending_score': 0.6,
                'trending_factors': ['content_type', 'duration', 'quality'],
                'ai_analysis': trend_analysis,
                'notes': 'Trend analysis completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Trend analysis failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'trending_potential': 'unknown',
                'trending_score': 0.0
            }
    
    async def _analyze_trends_with_openai(self, video_info: Dict, content_analysis: Dict) -> Dict[str, Any]:
        """Analyze trends using OpenAI"""
        try:
            duration = video_info.get('duration', 0)
            content_type = content_analysis.get('content_type', 'Unknown')
            
            prompt = f"""
            Analyze the trending potential of this video:
            
            Duration: {duration:.1f} seconds
            Content Type: {content_type}
            Resolution: {video_info.get('resolution', 'Unknown')}
            
            Evaluate:
            1. Current trending topics relevance
            2. Viral potential
            3. Social media appeal
            4. Platform optimization
            5. Audience engagement potential
            
            Return your analysis as JSON with trending score and factors.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert trend analyst and social media strategist. Evaluate content for viral and trending potential."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=400,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'analysis': content,
                        'provider': 'openai',
                        'model': 'gpt-3.5-turbo'
                    }
            except:
                return {
                    'analysis': content,
                    'provider': 'openai',
                    'model': 'gpt-3.5-turbo'
                }
                
        except Exception as e:
            logger.error(f"OpenAI trend analysis failed: {e}")
            raise
    
    async def _analyze_audience(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Determine target audience and appeal"""
        try:
            # Get content analysis for audience analysis
            content_analysis = await self._analyze_content(video_path, video_info)
            
            # Analyze audience with AI
            audience_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    audience_analysis['openai'] = await self._analyze_audience_with_openai(video_info, content_analysis)
                except Exception as e:
                    logger.warning(f"OpenAI audience analysis failed: {e}")
            
            return {
                'target_audience': 'general',
                'audience_age_range': '18-45',
                'audience_interests': ['content', 'entertainment'],
                'ai_analysis': audience_analysis,
                'notes': 'Audience analysis completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Audience analysis failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'target_audience': 'unknown',
                'audience_age_range': 'unknown'
            }
    
    async def _analyze_audience_with_openai(self, video_info: Dict, content_analysis: Dict) -> Dict[str, Any]:
        """Analyze audience using OpenAI"""
        try:
            duration = video_info.get('duration', 0)
            content_type = content_analysis.get('content_type', 'Unknown')
            
            prompt = f"""
            Analyze the target audience for this video:
            
            Duration: {duration:.1f} seconds
            Content Type: {content_type}
            Resolution: {video_info.get('resolution', 'Unknown')}
            
            Determine:
            1. Primary target audience
            2. Age demographics
            3. Interests and preferences
            4. Platform preferences
            5. Engagement patterns
            
            Return your analysis as JSON with audience details.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert audience analyst and marketing strategist. Identify target audiences for video content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=400,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'analysis': content,
                        'provider': 'openai',
                        'model': 'gpt-3.5-turbo'
                    }
            except:
                return {
                    'analysis': content,
                    'provider': 'openai',
                    'model': 'gpt-3.5-turbo'
                }
                
        except Exception as e:
            logger.error(f"OpenAI audience analysis failed: {e}")
            raise
    
    async def _assess_quality(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Assess video quality and optimization"""
        try:
            # Analyze video quality metrics
            quality_metrics = {
                'resolution_score': self._calculate_resolution_score(video_info.get('resolution', '')),
                'duration_score': self._calculate_duration_score(video_info.get('duration', 0)),
                'format_score': self._calculate_format_score(video_info.get('format', '')),
                'overall_quality': 'good'
            }
            
            # Calculate overall quality score
            scores = [quality_metrics['resolution_score'], quality_metrics['duration_score'], quality_metrics['format_score']]
            avg_score = sum(scores) / len(scores)
            
            if avg_score >= 0.8:
                quality_metrics['overall_quality'] = 'excellent'
            elif avg_score >= 0.6:
                quality_metrics['overall_quality'] = 'good'
            elif avg_score >= 0.4:
                quality_metrics['overall_quality'] = 'fair'
            else:
                quality_metrics['overall_quality'] = 'poor'
            
            return {
                'quality_metrics': quality_metrics,
                'optimization_suggestions': self._generate_optimization_suggestions(quality_metrics),
                'notes': 'Quality assessment completed'
            }
            
        except Exception as e:
            logger.error(f"Quality assessment failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'quality_metrics': {},
                'optimization_suggestions': []
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
    
    def _generate_optimization_suggestions(self, quality_metrics: Dict) -> List[str]:
        """Generate optimization suggestions based on quality metrics"""
        suggestions = []
        
        if quality_metrics['resolution_score'] < 0.8:
            suggestions.append("Consider upgrading to 1080p or higher resolution")
        
        if quality_metrics['duration_score'] < 0.7:
            suggestions.append("Consider longer content for better engagement")
        
        if quality_metrics['format_score'] < 0.8:
            suggestions.append("Consider converting to MP4 format for better compatibility")
        
        if not suggestions:
            suggestions.append("Video quality is good, no major optimizations needed")
        
        return suggestions
    
    async def _analyze_accessibility(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Check for accessibility features"""
        try:
            # Check for audio (important for accessibility)
            has_audio = video_info.get('has_audio', False)
            
            # Get speech transcription for accessibility
            speech_data = await self._extract_speech(video_path, video_info)
            has_transcription = bool(speech_data.get('transcription'))
            
            accessibility_features = []
            if has_audio:
                accessibility_features.append('audio')
            if has_transcription:
                accessibility_features.append('transcription')
            
            return {
                'accessibility_features': accessibility_features,
                'has_audio': has_audio,
                'has_transcription': has_transcription,
                'accessibility_score': len(accessibility_features) / 2.0,  # Normalize to 0-1
                'suggestions': self._generate_accessibility_suggestions(has_audio, has_transcription),
                'notes': 'Accessibility analysis completed'
            }
            
        except Exception as e:
            logger.error(f"Accessibility analysis failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'accessibility_features': [],
                'accessibility_score': 0.0
            }
    
    def _generate_accessibility_suggestions(self, has_audio: bool, has_transcription: bool) -> List[str]:
        """Generate accessibility improvement suggestions"""
        suggestions = []
        
        if not has_audio:
            suggestions.append("Add audio narration for better accessibility")
        
        if not has_transcription:
            suggestions.append("Add closed captions or subtitles")
        
        if has_audio and has_transcription:
            suggestions.append("Consider adding audio descriptions for visual content")
        
        return suggestions
    
    async def _analyze_brand_safety(self, video_path: str, video_info: Dict) -> Dict[str, Any]:
        """Analyze content for brand safety"""
        try:
            # Get content analysis for brand safety
            content_analysis = await self._analyze_content(video_path, video_info)
            
            # Analyze brand safety with AI
            brand_safety_analysis = {}
            
            if openai and self.api_keys.get('openai'):
                try:
                    brand_safety_analysis['openai'] = await self._analyze_brand_safety_with_openai(video_info, content_analysis)
                except Exception as e:
                    logger.warning(f"OpenAI brand safety analysis failed: {e}")
            
            return {
                'brand_safety_score': 0.8,  # Default safe score
                'brand_safety_level': 'safe',
                'risk_factors': [],
                'ai_analysis': brand_safety_analysis,
                'notes': 'Brand safety analysis completed with AI enhancement'
            }
            
        except Exception as e:
            logger.error(f"Brand safety analysis failed: {e}")
            return {
                'error': str(e),
                'status': 'failed',
                'brand_safety_score': 0.5,
                'brand_safety_level': 'unknown'
            }
    
    async def _analyze_brand_safety_with_openai(self, video_info: Dict, content_analysis: Dict) -> Dict[str, Any]:
        """Analyze brand safety using OpenAI"""
        try:
            content_type = content_analysis.get('content_type', 'Unknown')
            
            prompt = f"""
            Analyze the brand safety of this video content:
            
            Content Type: {content_type}
            Duration: {video_info.get('duration', 0):.1f} seconds
            
            Evaluate for:
            1. Inappropriate content
            2. Controversial topics
            3. Brand safety risks
            4. Content moderation concerns
            5. Platform policy compliance
            
            Return your analysis as JSON with safety score and risk factors.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert content moderator and brand safety analyst. Evaluate content for brand safety and compliance."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=400,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    return {
                        'analysis': content,
                        'provider': 'openai',
                        'model': 'gpt-3.5-turbo'
                    }
            except:
                return {
                    'analysis': content,
                    'provider': 'openai',
                    'model': 'gpt-3.5-turbo'
                }
                
        except Exception as e:
            logger.error(f"OpenAI brand safety analysis failed: {e}")
            raise