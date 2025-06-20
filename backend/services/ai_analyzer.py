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

# AI provider imports
try:
    import openai
except ImportError:
    openai = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

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

logger = logging.getLogger(__name__)

class AIAnalyzer:
    """Service for analyzing videos using various AI providers"""
    
    def __init__(self):
        self.video_processor = VideoProcessor()
        self.supported_providers = ['openai', 'gemini', 'lmstudio', 'anthropic']
        
        # Analysis templates
        self.analysis_templates = {
            'humor': {
                'system_prompt': "You are an expert at identifying funny and humorous moments in videos. Analyze the content and identify clips that would make people laugh.",
                'scoring_criteria': "Rate based on comedic timing, unexpected moments, reactions, and general humor appeal."
            },
            'engagement': {
                'system_prompt': "You are an expert at identifying engaging and attention-grabbing moments in videos. Find clips that would hook viewers and keep them watching.",
                'scoring_criteria': "Rate based on visual interest, emotional impact, information density, and viewer retention potential."
            },
            'educational': {
                'system_prompt': "You are an expert at identifying educational and informative moments in videos. Find clips that teach or explain concepts clearly.",
                'scoring_criteria': "Rate based on clarity of explanation, educational value, practical applicability, and learning potential."
            },
            'emotional': {
                'system_prompt': "You are an expert at identifying emotionally impactful moments in videos. Find clips that evoke strong emotional responses.",
                'scoring_criteria': "Rate based on emotional intensity, relatability, storytelling impact, and viewer connection."
            },
            'viral': {
                'system_prompt': "You are an expert at identifying viral-worthy moments in videos. Find clips with high shareability and social media potential.",
                'scoring_criteria': "Rate based on shareability, uniqueness, trending potential, and social media appeal."
            }
        }
        
        self.providers = {
            "openai": self._analyze_with_openai,
            "gemini": self._analyze_with_gemini,
            "lmstudio": self._analyze_with_lmstudio,
            "anthropic": self._analyze_with_anthropic
        }
    
    async def analyze_video(self, video_path: str, prompt: str, provider: str, api_key: str, 
                           model_settings: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Analyze a video using the specified AI provider"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        logger.info(f"Analyzing video with {provider}: {video_path}")
        
        if provider not in self.providers:
            raise ValueError(f"Unknown provider: {provider}")
        
        try:
            # Call the appropriate provider's analysis method
            analysis_func = self.providers[provider]
            return await analysis_func(video_path, prompt, api_key, model_settings)
        except Exception as e:
            logger.error(f"Error analyzing video with {provider}: {e}")
            raise
    
    async def _extract_frames_for_analysis(self, video_path: str, num_frames: int = 10) -> List[str]:
        """Extract key frames from video for analysis"""
        frames_base64 = []
        
        try:
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            
            # Calculate frame intervals
            interval = total_frames // num_frames if num_frames < total_frames else 1
            
            for i in range(0, total_frames, interval):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                
                if ret:
                    # Convert frame to base64
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    frames_base64.append({
                        'data': frame_base64,
                        'timestamp': i / fps if fps > 0 else 0,
                        'frame_number': i
                    })
                
                if len(frames_base64) >= num_frames:
                    break
            
            cap.release()
            return frames_base64
            
        except Exception as e:
            logger.error(f"Error extracting frames: {e}")
            return []
    
    async def _analyze_with_openai(self, video_path: str, prompt: str, api_key: str,
                                model_settings: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Analyze video using OpenAI GPT-4 Vision"""
        if not openai:
            raise ImportError("OpenAI library not installed")
        
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
        # Extract frames from video
        frames = await self._extract_frames_for_analysis(video_path, num_frames=15)
        if not frames:
            raise ValueError("Could not extract frames from video")
        
        # Get video metadata
        metadata = await self.video_processor.extract_metadata(video_path)
        duration = metadata.get('duration', 0)
        
        # Prepare the analysis prompt
        template = self._get_template_for_prompt(prompt)
        
        messages = [
            {
                "role": "system",
                "content": template['system_prompt']
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""Analyze this video and identify the best clips based on the following request: {prompt}

Video Duration: {duration:.1f} seconds
Total Frames Analyzed: {len(frames)}

For each recommended clip, provide:
1. Exact start and end times (in seconds)
2. A catchy title (max 50 characters)
3. A score from 0-100 based on: {template['scoring_criteria']}
4. A brief explanation (1-2 sentences) of why this clip is valuable

Return your response as a JSON object with this structure:
{{
  "clips": [
    {{
      "title": "Clip title",
      "start_time": 0.0,
      "end_time": 15.0,
      "score": 85,
      "explanation": "Brief explanation"
    }}
  ]
}}

Provide 3-8 clips focusing on the highest quality moments."""
                    }
                ]
            }
        ]
        
        # Add frame images to the message
        for i, frame in enumerate(frames):
            messages[1]["content"].append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{frame['data']}",
                    "detail": "low"  # Use low detail to save tokens
                }
            })
            
            # Add timestamp context
            messages[1]["content"].append({
                "type": "text",
                "text": f"Frame {i+1} at {frame['timestamp']:.1f}s"
            })
        
        try:
            # Make API call
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model=model_settings.get('model', 'gpt-4-vision-preview'),
                messages=messages,
                max_tokens=model_settings.get('max_tokens', 2000),
                temperature=model_settings.get('temperature', 0.7)
            )
            
            # Parse response
            content = response.choices[0].message.content
            clips = self._parse_ai_response(content)
            
            # Add unique IDs to clips
            for i, clip in enumerate(clips):
                clip['id'] = f"clip_{int(time.time())}_{i}"
            
            return clips
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def _analyze_with_gemini(self, video_path: str, prompt: str, api_key: str,
                                model_settings: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Analyze video using Google Gemini Pro Vision"""
        if not genai:
            raise ImportError("Google Generative AI library not installed")
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Extract frames
        frames = await self._extract_frames_for_analysis(video_path, num_frames=12)
        if not frames:
            raise ValueError("Could not extract frames from video")
        
        # Get video metadata
        metadata = await self.video_processor.extract_metadata(video_path)
        duration = metadata.get('duration', 0)
        
        # Prepare images for Gemini
        images = []
        for frame in frames:
            img_data = base64.b64decode(frame['data'])
            img = Image.open(io.BytesIO(img_data))
            images.append(img)
        
        # Get template
        template = self._get_template_for_prompt(prompt)
        
        # Create the prompt
        analysis_prompt = f"""You are analyzing a video to identify the best clips.

{template['system_prompt']}

Video Duration: {duration:.1f} seconds
User Request: {prompt}
Scoring Criteria: {template['scoring_criteria']}

Analyze the provided frames and identify 3-8 high-quality clips that match the user's request.

For each clip, provide:
1. Exact start and end times (in seconds)
2. A catchy title (max 50 characters)  
3. A score from 0-100
4. A brief explanation (1-2 sentences)

Format your response as JSON:
{{
  "clips": [
    {{
      "title": "Clip title",
      "start_time": 0.0,
      "end_time": 15.0,
      "score": 85,
      "explanation": "Brief explanation"
    }}
  ]
}}"""

        try:
            # Use Gemini Pro Vision model
            model = genai.GenerativeModel('gemini-pro-vision')
            
            # Generate content with images and prompt
            response = await asyncio.to_thread(
                model.generate_content,
                [analysis_prompt] + images
            )
            
            # Parse response
            clips = self._parse_ai_response(response.text)
            
            # Add unique IDs
            for i, clip in enumerate(clips):
                clip['id'] = f"clip_{int(time.time())}_{i}"
            
            return clips
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise
    
    async def _analyze_with_lmstudio(self, video_path: str, prompt: str, api_key: str,
                                   model_settings: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Analyze video using LM Studio local models"""
        if not requests:
            raise ImportError("Requests library not installed")
        
        # LM Studio doesn't support vision models directly, so we'll analyze based on metadata
        # and use scene detection to identify potential clips
        
        # Get video metadata
        metadata = await self.video_processor.extract_metadata(video_path)
        duration = metadata.get('duration', 0)
        
        # Perform scene detection to identify potential clip boundaries
        scenes = await self._detect_scenes(video_path)
        
        # Get template
        template = self._get_template_for_prompt(prompt)
        
        # Create analysis prompt with scene information
        scene_descriptions = []
        for i, scene in enumerate(scenes[:20]):  # Limit to 20 scenes
            scene_descriptions.append(
                f"Scene {i+1}: {scene['start']:.1f}s - {scene['end']:.1f}s "
                f"(duration: {scene['duration']:.1f}s, change score: {scene['score']:.2f})"
            )
        
        analysis_prompt = f"""{template['system_prompt']}

Video Duration: {duration:.1f} seconds
User Request: {prompt}
Scoring Criteria: {template['scoring_criteria']}

I've detected {len(scenes)} scenes in the video. Here are the most significant ones:

{chr(10).join(scene_descriptions)}

Based on these scenes and the user's request, identify 3-8 high-quality clips.
Consider scene boundaries, duration, and change scores when selecting clips.

For each clip, provide:
1. Exact start and end times (in seconds)
2. A catchy title (max 50 characters)
3. A score from 0-100
4. A brief explanation (1-2 sentences)

Format your response as JSON:
{{
  "clips": [
    {{
      "title": "Clip title",
      "start_time": 0.0,
      "end_time": 15.0,
      "score": 85,
      "explanation": "Brief explanation"
    }}
  ]
}}"""

        # Prepare request for LM Studio
        base_url = model_settings.get('lmstudio_url', 'http://localhost:1234')
        
        payload = {
            "model": model_settings.get('model', 'local-model'),
            "messages": [
                {"role": "system", "content": template['system_prompt']},
                {"role": "user", "content": analysis_prompt}
            ],
            "temperature": model_settings.get('temperature', 0.7),
            "max_tokens": model_settings.get('max_tokens', 2000)
        }
        
        try:
            # Make request to LM Studio
            response = requests.post(
                f"{base_url}/v1/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120
            )
            
            if response.status_code != 200:
                raise Exception(f"LM Studio API error: {response.status_code} - {response.text}")
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # Parse response
            clips = self._parse_ai_response(content)
            
            # Add unique IDs
            for i, clip in enumerate(clips):
                clip['id'] = f"clip_{int(time.time())}_{i}"
            
            return clips
            
        except Exception as e:
            logger.error(f"LM Studio error: {e}")
            raise
    
    async def _analyze_with_anthropic(self, video_path: str, prompt: str, api_key: str,
                                   model_settings: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Analyze video using Anthropic Claude"""
        if not anthropic:
            raise ImportError("Anthropic library not installed")
        
        # Initialize Anthropic client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Extract frames
        frames = await self._extract_frames_for_analysis(video_path, num_frames=10)
        if not frames:
            raise ValueError("Could not extract frames from video")
        
        # Get video metadata
        metadata = await self.video_processor.extract_metadata(video_path)
        duration = metadata.get('duration', 0)
        
        # Get template
        template = self._get_template_for_prompt(prompt)
        
        # Prepare the message with images
        message_content = [
            {
                "type": "text",
                "text": f"""{template['system_prompt']}

Video Duration: {duration:.1f} seconds
User Request: {prompt}
Scoring Criteria: {template['scoring_criteria']}

Analyze the provided video frames and identify 3-8 high-quality clips that match the user's request.

For each clip, provide:
1. Exact start and end times (in seconds)
2. A catchy title (max 50 characters)
3. A score from 0-100
4. A brief explanation (1-2 sentences)

Format your response as JSON:
{{
  "clips": [
    {{
      "title": "Clip title",
      "start_time": 0.0,
      "end_time": 15.0,
      "score": 85,
      "explanation": "Brief explanation"
    }}
  ]
}}"""
            }
        ]
        
        # Add frames as images
        for i, frame in enumerate(frames):
            message_content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": frame['data']
                }
            })
            message_content.append({
                "type": "text",
                "text": f"Frame {i+1} at {frame['timestamp']:.1f}s"
            })
        
        try:
            # Make API call
            response = await asyncio.to_thread(
                client.messages.create,
                model=model_settings.get('model', 'claude-3-opus-20240229'),
                max_tokens=model_settings.get('max_tokens', 2000),
                temperature=model_settings.get('temperature', 0.7),
                messages=[{
                    "role": "user",
                    "content": message_content
                }]
            )
            
            # Parse response
            clips = self._parse_ai_response(response.content[0].text)
            
            # Add unique IDs
            for i, clip in enumerate(clips):
                clip['id'] = f"clip_{int(time.time())}_{i}"
            
            return clips
            
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def _detect_scenes(self, video_path: str) -> List[Dict[str, Any]]:
        """Detect scene changes in video using OpenCV"""
        scenes = []
        
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            prev_frame = None
            scene_start = 0
            frame_count = 0
            threshold = 30  # Scene change threshold
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert to grayscale for comparison
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                if prev_frame is not None:
                    # Calculate frame difference
                    diff = cv2.absdiff(prev_frame, gray)
                    score = np.mean(diff)
                    
                    # Detect scene change
                    if score > threshold:
                        timestamp = frame_count / fps
                        scenes.append({
                            'start': scene_start,
                            'end': timestamp,
                            'duration': timestamp - scene_start,
                            'score': score
                        })
                        scene_start = timestamp
                
                prev_frame = gray
                frame_count += 1
            
            # Add final scene
            if scene_start < frame_count / fps:
                scenes.append({
                    'start': scene_start,
                    'end': frame_count / fps,
                    'duration': (frame_count / fps) - scene_start,
                    'score': 0
                })
            
            cap.release()
            
            # Filter out very short scenes
            scenes = [s for s in scenes if s['duration'] > 1.0]
            
            return scenes
            
        except Exception as e:
            logger.error(f"Scene detection error: {e}")
            return []
    
    def _get_template_for_prompt(self, prompt: str) -> Dict[str, str]:
        """Get the appropriate analysis template based on the prompt"""
        prompt_lower = prompt.lower()
        
        # Check for keywords to determine template
        for key, template in self.analysis_templates.items():
            if key in prompt_lower:
                return template
        
        # Default to engagement template
        return self.analysis_templates['engagement']
    
    def _parse_ai_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse AI response and extract clip data"""
        try:
            # Try to extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in response")
            
            json_text = response_text[json_start:json_end]
            data = json.loads(json_text)
            
            clips = []
            for i, clip_data in enumerate(data.get('clips', [])):
                try:
                    clip = {
                        "title": clip_data.get('title', f"Clip {i+1}"),
                        "start_time": float(clip_data.get('start_time', 0)),
                        "end_time": float(clip_data.get('end_time', 30)),
                        "score": int(clip_data.get('score', 50)),
                        "explanation": clip_data.get('explanation', 'AI-generated clip')
                    }
                    
                    # Validate clip
                    if clip["end_time"] > clip["start_time"] and clip["score"] >= 0 and clip["score"] <= 100:
                        clips.append(clip)
                    
                except Exception as e:
                    logger.warning(f"Error parsing clip {i}: {e}")
                    continue
            
            return clips
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            raise ValueError(f"Failed to parse AI response: {str(e)}")
    
    async def test_api_connection(self, provider: str, api_key: str, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Test API connection for a provider"""
        try:
            if provider == 'openai':
                return await self._test_openai_connection(api_key)
            elif provider == 'gemini':
                return await self._test_gemini_connection(api_key)
            elif provider == 'lmstudio':
                return await self._test_lmstudio_connection(api_key, settings)
            elif provider == 'anthropic':
                return await self._test_anthropic_connection(api_key)
            else:
                return {"success": False, "message": f"Unknown provider: {provider}"}
                
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def _test_openai_connection(self, api_key: str) -> Dict[str, Any]:
        """Test OpenAI connection"""
        if not openai:
            return {"success": False, "message": "OpenAI library not installed"}
        
        try:
            client = openai.OpenAI(api_key=api_key)
            # Try to list models
            models = await asyncio.to_thread(client.models.list)
            return {"success": True, "message": "OpenAI connection successful"}
        except Exception as e:
            return {"success": False, "message": f"OpenAI connection failed: {str(e)}"}
    
    async def _test_gemini_connection(self, api_key: str) -> Dict[str, Any]:
        """Test Gemini connection"""
        if not genai:
            return {"success": False, "message": "Google Generative AI library not installed"}
        
        try:
            genai.configure(api_key=api_key)
            # Try to list models
            models = await asyncio.to_thread(genai.list_models)
            return {"success": True, "message": "Gemini connection successful"}
        except Exception as e:
            return {"success": False, "message": f"Gemini connection failed: {str(e)}"}
    
    async def _test_lmstudio_connection(self, api_key: str, settings: Dict) -> Dict[str, Any]:
        """Test LM Studio connection"""
        if not requests:
            return {"success": False, "message": "Requests library not installed"}
        
        try:
            base_url = settings.get('lmstudio_url', 'http://localhost:1234')
            response = requests.get(f"{base_url}/v1/models", timeout=10)
            
            if response.status_code == 200:
                return {"success": True, "message": "LM Studio connection successful"}
            else:
                return {"success": False, "message": f"LM Studio returned status {response.status_code}"}
        except Exception as e:
            return {"success": False, "message": f"LM Studio connection failed: {str(e)}"}
    
    async def _test_anthropic_connection(self, api_key: str) -> Dict[str, Any]:
        """Test Anthropic connection"""
        if not anthropic:
            return {"success": False, "message": "Anthropic library not installed"}
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            # Try a simple completion
            response = await asyncio.to_thread(
                client.messages.create,
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "Hi"}]
            )
            return {"success": True, "message": "Anthropic connection successful"}
        except Exception as e:
            return {"success": False, "message": f"Anthropic connection failed: {str(e)}"}
    
    async def get_available_models(self, provider: str, api_key: str) -> List[Dict[str, Any]]:
        """Get available models for a provider"""
        try:
            if provider == 'openai':
                return await self._get_openai_models(api_key)
            elif provider == 'gemini':
                return await self._get_gemini_models(api_key)
            elif provider == 'lmstudio':
                return await self._get_lmstudio_models(api_key)
            elif provider == 'anthropic':
                return await self._get_anthropic_models(api_key)
            else:
                return []
                
        except Exception as e:
            logger.error(f"Error getting models for {provider}: {e}")
            return []
    
    async def _get_openai_models(self, api_key: str) -> List[Dict[str, Any]]:
        """Get OpenAI models"""
        if not openai:
            return []
        
        try:
            client = openai.OpenAI(api_key=api_key)
            models = await asyncio.to_thread(client.models.list)
            
            # Filter for relevant models
            relevant_models = []
            for model in models.data:
                if 'gpt' in model.id:
                    relevant_models.append({
                        "id": model.id,
                        "name": model.id.upper().replace('-', ' '),
                        "description": "OpenAI language model",
                        "max_tokens": 128000 if 'gpt-4' in model.id else 16000
                    })
            
            return relevant_models
        except:
            # Fallback to common models
            return [
                {"id": "gpt-4-vision-preview", "name": "GPT-4 Vision", "description": "Most capable vision model", "max_tokens": 128000},
                {"id": "gpt-4-turbo-preview", "name": "GPT-4 Turbo", "description": "Fast and capable", "max_tokens": 128000},
                {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "description": "Fast and efficient", "max_tokens": 16000}
            ]
    
    async def _get_gemini_models(self, api_key: str) -> List[Dict[str, Any]]:
        """Get Gemini models"""
        if not genai:
            return []
        
        try:
            genai.configure(api_key=api_key)
            models = await asyncio.to_thread(genai.list_models)
            
            relevant_models = []
            for model in models:
                if 'gemini' in model.name:
                    relevant_models.append({
                        "id": model.name.split('/')[-1],
                        "name": model.display_name,
                        "description": model.description,
                        "max_tokens": 32000
                    })
            
            return relevant_models
        except:
            # Fallback
            return [
                {"id": "gemini-pro-vision", "name": "Gemini Pro Vision", "description": "Multimodal understanding", "max_tokens": 32000},
                {"id": "gemini-pro", "name": "Gemini Pro", "description": "Best for text tasks", "max_tokens": 32000}
            ]
    
    async def _get_lmstudio_models(self, api_key: str) -> List[Dict[str, Any]]:
        """Get LM Studio models"""
        if not requests:
            return []
        
        try:
            base_url = 'http://localhost:1234'
            response = requests.get(f"{base_url}/v1/models", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                models = []
                for model in data.get('data', []):
                    models.append({
                        "id": model['id'],
                        "name": model['id'],
                        "description": "Local LM Studio model",
                        "max_tokens": 4096
                    })
                return models
        except:
            pass
        
        return [{"id": "local-model", "name": "Local Model", "description": "LM Studio local model", "max_tokens": 4096}]
    
    async def _get_anthropic_models(self, api_key: str) -> List[Dict[str, Any]]:
        """Get Anthropic models"""
        return [
            {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "description": "Most capable model", "max_tokens": 200000},
            {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "description": "Balanced performance", "max_tokens": 200000},
            {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "description": "Fast and efficient", "max_tokens": 200000}
        ]