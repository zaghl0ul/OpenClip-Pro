# OpenClip Pro - Setup Instructions

This guide provides instructions for setting up and running OpenClip Pro.

## Quick Start Options

OpenClip Pro offers two startup options depending on your needs:

### Option 1: Full-Featured Backend (Recommended)

For the complete experience with all features:

```
.\start_openclip_pro.bat
```

This starts the full backend (`app.py`) with:
- Real video processing and streaming
- Multiple AI providers (OpenAI, Google Gemini, Anthropic Claude)
- SQLite database storage
- YouTube video downloading

### Option 2: Simple Backend

For basic testing and development with minimal dependencies:

```
.\start_servers.bat
```

This starts the simple backend (`simple_server.py`) with:
- Basic file uploads
- JSON file storage
- Real video analysis with FFmpeg scene detection
- Automatic thumbnail generation
- Minimal dependencies

## Video Analysis Features

OpenClip Pro uses real video analysis instead of mock data:

### Simple Backend Analysis
- Uses FFmpeg for scene detection
- Automatically identifies scene changes in videos
- Generates thumbnails from video frames
- Creates clips based on actual video content
- Saves analysis results to persistent storage

### Full Backend Analysis
- All features of the simple backend
- Additional AI-powered content analysis
- Multiple AI provider options
- More detailed scene descriptions
- Advanced metadata extraction

## Manual Setup

If you prefer to start the servers manually:

### Backend (Full)

```
cd backend
pip install -r requirements.txt
python app.py
```

### Backend (Simple)

```
cd backend
pip install fastapi uvicorn python-multipart pydantic
python simple_server.py
```

### Frontend

```
npm install
npm run dev
```

## Troubleshooting

If you encounter issues with the full backend:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues and solutions
2. Try the simplified backend with `.\start_servers.bat`
3. Look for error messages in the console output

## Directory Structure

- `backend/uploads/` - Uploaded video files
- `backend/data/` - JSON data storage (simple backend)
- `backend/data/analysis/` - Analysis results
- `backend/uploads/thumbnails/` - Generated video thumbnails
- `src/` - Frontend source code

## Real Data Policy

OpenClip Pro is designed to work with real data only. All components connect to real backend APIs:

- Video uploads are stored on the server in the `backend/uploads` directory
- Project metadata is stored in `backend/data/projects.json`
- Analysis results are stored in `backend/data/analysis`
- All data is persisted between sessions

## Data Storage

The backend server stores data in the following locations:

- `backend/uploads/{project_id}/{filename}` - Video files
- `backend/data/projects.json` - Project metadata
- `backend/data/analysis/{project_id}.json` - Analysis results

This ensures that all data is real and persisted between sessions.

## Development Notes

- The backend server uses FastAPI for real API endpoints
- All data is stored on the server, not in mock objects
- The application uses a sleek, minimal glassmorphism design for the UI 