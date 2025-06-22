# OpenClip Pro Backend

A simplified, working backend for the OpenClip Pro video processing application.

## Quick Start

```bash
cd backend
python app.py
```

The server will start at http://localhost:8000

## Features

✅ **No Authentication Required** - Just works out of the box  
✅ **Real Video Upload** - Actual file storage and processing  
✅ **Real Database** - SQLite for persistent data storage  
✅ **Video Streaming** - Proper range request support  
✅ **Project Management** - Full CRUD operations  
✅ **File Management** - Automatic cleanup and organization  

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get specific project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Video Endpoints
- `POST /api/projects/{id}/upload` - Upload video file
- `GET /api/projects/{id}/stream` - Stream video (supports range requests)
- `GET /api/videos/{file_id}/download` - Download video file

### Utility Endpoints
- `GET /api/providers` - Available AI providers
- `GET /api/settings` - Application settings  
- `GET /api/stats` - Usage statistics

## File Structure

```
backend/
├── app.py              # Main application (THE ONLY BACKEND FILE)
├── app.db              # SQLite database
├── uploads/            # File storage
│   ├── videos/         # Uploaded video files  
│   └── thumbnails/     # Generated thumbnails
├── auth/               # Authentication modules (unused)
├── services/           # Service modules (available for extension)
├── models/             # Data models (unused in simplified version)
└── utils/              # Utility functions (unused in simplified version)
```

## Database Schema

### Projects Table
- `id` - Unique project identifier
- `name` - Project name
- `description` - Project description  
- `type` - Project type (upload/youtube)
- `status` - Current status
- `video_data` - JSON blob with video metadata
- `file_size` - Video file size
- `created_at/updated_at` - Timestamps

### Video Files Table
- `id` - Unique file identifier
- `project_id` - Reference to project
- `filename` - Original filename
- `file_path` - Path to stored file
- `file_size` - File size in bytes
- `upload_time` - Upload timestamp

## Why This Approach?

The previous backend had multiple confusing files:
- ❌ `main.py` - Complex auth, many dependencies
- ❌ `real_main.py` - Import errors, unstable  
- ❌ `simple_main.py` - Mock data, not persistent
- ❌ `enhanced_main.py` - Another variant
- ❌ `video_main.py` - Yet another variant

This new `app.py` provides:
- ✅ **One file to rule them all**
- ✅ **No authentication complexity** 
- ✅ **Real functionality** without the pain
- ✅ **Easy to understand and modify**
- ✅ **Production-ready** for basic use cases

## Frontend Integration

The frontend should work immediately with this backend. No authentication setup required.

Just make sure your frontend is pointing to:
```
http://localhost:8000
```

## Extending

To add features like AI analysis or authentication:
1. Keep `app.py` as the main entry point
2. Add new endpoints as needed
3. Use the `services/` directory for complex logic
4. Keep it simple and avoid multiple backend files

## Development

```bash
# Install dependencies
pip install fastapi uvicorn python-multipart

# Run the server  
python app.py

# View API docs
open http://localhost:8000/docs
```
