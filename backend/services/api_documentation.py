"""
Comprehensive API Documentation Configuration
Implements OpenAPI/Swagger documentation with custom extensions
"""

from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Request
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import HTMLResponse, JSONResponse
import json
import yaml
from pathlib import Path

from ..config import settings

class APIDocumentation:
    """
    Advanced API documentation with OpenAPI/Swagger
    Includes custom schemas, examples, and interactive documentation
    """
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.title = "OpenClip Pro API"
        self.version = settings.APP_VERSION or "1.0.0"
        self.description = self._load_description()
        self.servers = self._get_servers()
        self.tags_metadata = self._get_tags_metadata()
        
    def _load_description(self) -> str:
        """Load API description from markdown file"""
        desc_file = Path(__file__).parent.parent / "docs" / "api_description.md"
        if desc_file.exists():
            return desc_file.read_text()
        
        return """
# OpenClip Pro API

Advanced AI-powered video clipping platform API.

## Features

- 🎥 **Video Processing**: Upload and process videos from multiple sources
- 🤖 **AI Analysis**: Intelligent scene detection and highlight extraction
- ✂️ **Smart Clipping**: Generate clips based on AI recommendations
- 📊 **Analytics**: Comprehensive analytics and insights
- 🔐 **Security**: Enterprise-grade security with JWT authentication

## Authentication

This API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Rate Limiting

API requests are rate-limited based on your subscription tier:

- **Trial**: 20 requests/minute, 5 video uploads/day
- **Standard**: 60 requests/minute, 20 video uploads/day
- **Pro**: 200 requests/minute, 100 video uploads/day

## Error Handling

The API returns standardized error responses:

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid input data",
    "details": {...}
  }
}
```

## Support

For API support, contact: api-support@openclip.pro
"""

    def _get_servers(self) -> List[Dict[str, str]]:
        """Get API server configurations"""
        servers = []
        
        if settings.ENVIRONMENT == "production":
            servers.append({
                "url": "https://api.openclip.pro",
                "description": "Production server"
            })
        
        if settings.ENVIRONMENT in ["staging", "production"]:
            servers.append({
                "url": "https://staging-api.openclip.pro",
                "description": "Staging server"
            })
        
        servers.append({
            "url": "http://localhost:8000",
            "description": "Local development server"
        })
        
        return servers
    
    def _get_tags_metadata(self) -> List[Dict[str, Any]]:
        """Get tags metadata for grouping endpoints"""
        return [
            {
                "name": "Authentication",
                "description": "User authentication and authorization endpoints",
                "externalDocs": {
                    "description": "Authentication guide",
                    "url": "https://docs.openclip.pro/authentication"
                }
            },
            {
                "name": "Projects",
                "description": "Video project management",
                "externalDocs": {
                    "description": "Projects guide",
                    "url": "https://docs.openclip.pro/projects"
                }
            },
            {
                "name": "Video Processing",
                "description": "Video upload and processing operations",
            },
            {
                "name": "AI Analysis",
                "description": "AI-powered video analysis endpoints",
            },
            {
                "name": "Clips",
                "description": "Video clip generation and management",
            },
            {
                "name": "Analytics",
                "description": "Analytics and reporting endpoints",
            },
            {
                "name": "Settings",
                "description": "User and application settings",
            },
            {
                "name": "Admin",
                "description": "Administrative endpoints (requires admin role)",
            }
        ]
    
    def custom_openapi(self) -> Dict[str, Any]:
        """Generate custom OpenAPI schema"""
        if self.app.openapi_schema:
            return self.app.openapi_schema
        
        openapi_schema = get_openapi(
            title=self.title,
            version=self.version,
            description=self.description,
            routes=self.app.routes,
            servers=self.servers,
            tags=self.tags_metadata
        )
        
        # Add security schemes
        openapi_schema["components"]["securitySchemes"] = {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT authentication token"
            },
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API key for programmatic access"
            }
        }
        
        # Add global security requirement
        openapi_schema["security"] = [
            {"BearerAuth": []},
            {"ApiKeyAuth": []}
        ]
        
        # Add custom components
        openapi_schema["components"]["schemas"].update(self._get_custom_schemas())
        
        # Add examples
        openapi_schema["components"]["examples"] = self._get_examples()
        
        # Add webhooks
        openapi_schema["webhooks"] = self._get_webhooks()
        
        # Add external documentation
        openapi_schema["externalDocs"] = {
            "description": "Full API documentation",
            "url": "https://docs.openclip.pro/api"
        }
        
        # Cache the schema
        self.app.openapi_schema = openapi_schema
        return openapi_schema
    
    def _get_custom_schemas(self) -> Dict[str, Any]:
        """Get custom schema definitions"""
        return {
            "Error": {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "message": {"type": "string"},
                            "details": {"type": "object"},
                            "tracking_id": {"type": "string"}
                        },
                        "required": ["type", "message"]
                    }
                },
                "required": ["error"]
            },
            "PaginatedResponse": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "items": {}
                    },
                    "total": {"type": "integer"},
                    "page": {"type": "integer"},
                    "per_page": {"type": "integer"},
                    "pages": {"type": "integer"},
                    "has_next": {"type": "boolean"},
                    "has_prev": {"type": "boolean"}
                },
                "required": ["items", "total", "page", "per_page"]
            },
            "VideoAnalysisRequest": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "Analysis prompt or instructions"
                    },
                    "provider": {
                        "type": "string",
                        "enum": ["openai", "gemini", "anthropic", "lmstudio"],
                        "default": "openai"
                    },
                    "model": {
                        "type": "string",
                        "description": "Specific model to use"
                    },
                    "analysis_type": {
                        "type": "string",
                        "enum": ["highlights", "scenes", "transcript", "custom"],
                        "default": "highlights"
                    },
                    "options": {
                        "type": "object",
                        "properties": {
                            "max_clips": {"type": "integer", "default": 10},
                            "min_clip_duration": {"type": "number", "default": 5},
                            "max_clip_duration": {"type": "number", "default": 60},
                            "confidence_threshold": {"type": "number", "default": 0.7}
                        }
                    }
                },
                "required": ["prompt"]
            }
        }
    
    def _get_examples(self) -> Dict[str, Any]:
        """Get request/response examples"""
        return {
            "UserLoginExample": {
                "summary": "Standard user login",
                "value": {
                    "email": "user@example.com",
                    "password": "SecurePassword123!"
                }
            },
            "UserRegisterExample": {
                "summary": "New user registration",
                "value": {
                    "email": "newuser@example.com",
                    "password": "SecurePassword123!",
                    "full_name": "John Doe",
                    "username": "johndoe"
                }
            },
            "ProjectCreateExample": {
                "summary": "Create project with YouTube URL",
                "value": {
                    "name": "My Awesome Video",
                    "description": "Tutorial on advanced techniques",
                    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "tags": ["tutorial", "educational"]
                }
            },
            "VideoAnalysisExample": {
                "summary": "AI video analysis request",
                "value": {
                    "prompt": "Find the most engaging moments for social media",
                    "provider": "openai",
                    "model": "gpt-4-vision-preview",
                    "analysis_type": "highlights",
                    "options": {
                        "max_clips": 5,
                        "min_clip_duration": 15,
                        "max_clip_duration": 60
                    }
                }
            },
            "ErrorResponseExample": {
                "summary": "Error response",
                "value": {
                    "error": {
                        "type": "ValidationError",
                        "message": "Invalid input data",
                        "details": {
                            "field": "email",
                            "error": "Invalid email format"
                        },
                        "tracking_id": "err_123456"
                    }
                }
            }
        }
    
    def _get_webhooks(self) -> Dict[str, Any]:
        """Get webhook definitions"""
        return {
            "videoProcessed": {
                "post": {
                    "description": "Webhook triggered when video processing is complete",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "event": {"type": "string", "enum": ["video.processed"]},
                                        "project_id": {"type": "string"},
                                        "status": {"type": "string", "enum": ["success", "failure"]},
                                        "clips_generated": {"type": "integer"},
                                        "processing_time": {"type": "number"},
                                        "timestamp": {"type": "string", "format": "date-time"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {"description": "Webhook processed successfully"}
                    }
                }
            },
            "analysisComplete": {
                "post": {
                    "description": "Webhook triggered when AI analysis is complete",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "event": {"type": "string", "enum": ["analysis.complete"]},
                                        "project_id": {"type": "string"},
                                        "analysis_id": {"type": "string"},
                                        "provider": {"type": "string"},
                                        "results": {"type": "object"},
                                        "timestamp": {"type": "string", "format": "date-time"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {"description": "Webhook processed successfully"}
                    }
                }
            }
        }
    
    def setup_documentation(self):
        """Set up documentation endpoints"""
        # Override default OpenAPI endpoint
        @self.app.get("/openapi.json", include_in_schema=False)
        async def get_openapi_json():
            return JSONResponse(self.custom_openapi())
        
        # Custom Swagger UI
        @self.app.get("/docs", include_in_schema=False)
        async def custom_swagger_ui_html(req: Request):
            openapi_url = str(req.url_for("get_openapi_json"))
            return get_swagger_ui_html(
                openapi_url=openapi_url,
                title=f"{self.title} - Swagger UI",
                oauth2_redirect_url=str(req.url_for("swagger_ui_redirect")),
                swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
                swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
                swagger_ui_parameters={
                    "persistAuthorization": True,
                    "displayRequestDuration": True,
                    "filter": True,
                    "showExtensions": True,
                    "showCommonExtensions": True,
                    "displayOperationId": True,
                    "defaultModelsExpandDepth": 2,
                    "defaultModelExpandDepth": 2,
                    "tryItOutEnabled": True
                }
            )
        
        @self.app.get("/swagger-ui-redirect", include_in_schema=False)
        async def swagger_ui_redirect():
            return get_swagger_ui_oauth2_redirect_html()
        
        # Custom ReDoc
        @self.app.get("/redoc", include_in_schema=False)
        async def redoc_html(req: Request):
            openapi_url = str(req.url_for("get_openapi_json"))
            return get_redoc_html(
                openapi_url=openapi_url,
                title=f"{self.title} - ReDoc",
                redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
            )
        
        # API specification in YAML format
        @self.app.get("/openapi.yaml", include_in_schema=False)
        async def get_openapi_yaml():
            content = yaml.dump(self.custom_openapi(), sort_keys=False)
            return Response(content=content, media_type="application/x-yaml")
        
        # Postman collection export
        @self.app.get("/postman-collection.json", include_in_schema=False)
        async def get_postman_collection():
            collection = self._generate_postman_collection()
            return JSONResponse(collection)
        
        # AsyncAPI for websockets
        @self.app.get("/asyncapi.json", include_in_schema=False)
        async def get_asyncapi():
            asyncapi = self._generate_asyncapi_spec()
            return JSONResponse(asyncapi)
    
    def _generate_postman_collection(self) -> Dict[str, Any]:
        """Generate Postman collection from OpenAPI spec"""
        openapi = self.custom_openapi()
        
        collection = {
            "info": {
                "name": self.title,
                "description": self.description,
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            "auth": {
                "type": "bearer",
                "bearer": [
                    {
                        "key": "token",
                        "value": "{{access_token}}",
                        "type": "string"
                    }
                ]
            },
            "variable": [
                {
                    "key": "base_url",
                    "value": openapi["servers"][0]["url"] if openapi["servers"] else "http://localhost:8000"
                },
                {
                    "key": "access_token",
                    "value": "",
                    "type": "string"
                }
            ],
            "item": []
        }
        
        # Group by tags
        tag_groups = {}
        
        for path, methods in openapi["paths"].items():
            for method, operation in methods.items():
                if method in ["get", "post", "put", "delete", "patch"]:
                    tags = operation.get("tags", ["Other"])
                    tag = tags[0] if tags else "Other"
                    
                    if tag not in tag_groups:
                        tag_groups[tag] = {
                            "name": tag,
                            "item": []
                        }
                    
                    # Create Postman request
                    request = {
                        "name": operation.get("summary", f"{method.upper()} {path}"),
                        "request": {
                            "method": method.upper(),
                            "header": [],
                            "url": {
                                "raw": "{{base_url}}" + path,
                                "host": ["{{base_url}}"],
                                "path": path.strip("/").split("/")
                            },
                            "description": operation.get("description", "")
                        }
                    }
                    
                    # Add request body if present
                    if "requestBody" in operation:
                        content = operation["requestBody"].get("content", {})
                        if "application/json" in content:
                            request["request"]["body"] = {
                                "mode": "raw",
                                "raw": json.dumps(
                                    content["application/json"].get("example", {}),
                                    indent=2
                                ),
                                "options": {
                                    "raw": {
                                        "language": "json"
                                    }
                                }
                            }
                    
                    tag_groups[tag]["item"].append(request)
        
        collection["item"] = list(tag_groups.values())
        
        return collection
    
    def _generate_asyncapi_spec(self) -> Dict[str, Any]:
        """Generate AsyncAPI specification for WebSocket endpoints"""
        return {
            "asyncapi": "2.6.0",
            "info": {
                "title": f"{self.title} WebSocket API",
                "version": self.version,
                "description": "Real-time WebSocket API for OpenClip Pro"
            },
            "servers": {
                "production": {
                    "url": "wss://api.openclip.pro/ws",
                    "protocol": "wss",
                    "description": "Production WebSocket server"
                },
                "development": {
                    "url": "ws://localhost:8000/ws",
                    "protocol": "ws",
                    "description": "Development WebSocket server"
                }
            },
            "channels": {
                "processing-updates": {
                    "description": "Real-time video processing updates",
                    "subscribe": {
                        "message": {
                            "payload": {
                                "type": "object",
                                "properties": {
                                    "type": {"type": "string", "enum": ["progress", "complete", "error"]},
                                    "project_id": {"type": "string"},
                                    "progress": {"type": "number", "minimum": 0, "maximum": 100},
                                    "status": {"type": "string"},
                                    "data": {"type": "object"}
                                }
                            }
                        }
                    }
                },
                "analysis-updates": {
                    "description": "Real-time AI analysis updates",
                    "subscribe": {
                        "message": {
                            "payload": {
                                "type": "object",
                                "properties": {
                                    "type": {"type": "string", "enum": ["started", "progress", "result", "error"]},
                                    "analysis_id": {"type": "string"},
                                    "provider": {"type": "string"},
                                    "progress": {"type": "number"},
                                    "result": {"type": "object"}
                                }
                            }
                        }
                    }
                }
            }
        }

def setup_api_documentation(app: FastAPI):
    """Set up API documentation for FastAPI app"""
    docs = APIDocumentation(app)
    docs.setup_documentation()
    
    # Set custom OpenAPI schema generator
    app.openapi = docs.custom_openapi
