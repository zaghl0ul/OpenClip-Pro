#!/bin/bash

echo "🚀 OpenClipREDUX - Setting up for testing..."
echo "================================================"
echo ""

# Check if we're on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows environment"
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo "Detected Unix-like environment"
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
fi

echo "Step 1: Setting up Python backend..."
echo "-----------------------------------"

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
echo "Installing Python dependencies..."
$PIP_CMD install -r requirements.txt

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your API keys before running!"
fi

# Initialize database
echo "Initializing database..."
$PYTHON_CMD -c "
from utils.db_manager import init_db
try:
    init_db()
    print('✅ Database initialized successfully')
except Exception as e:
    print(f'❌ Database initialization failed: {e}')
"

cd ..

echo ""
echo "Step 2: Setting up React frontend..."
echo "-----------------------------------"

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Navigate to frontend directory
cd frontend

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

cd ..

echo ""
echo "Step 3: Creating launch scripts..."
echo "---------------------------------"

# Create Windows batch file for easy launching
cat > launch-app.bat << 'EOF'
@echo off
title OpenClipREDUX - Launching Application
echo.
echo 🚀 Starting OpenClipREDUX for testing...
echo ========================================
echo.

echo Starting backend server...
start "Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting frontend server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers should now be starting!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/api/docs
echo.
echo Press any key to exit this launcher...
pause > nul
EOF

# Create Unix shell script for easy launching
cat > launch-app.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting OpenClipREDUX for testing..."
echo "========================================"
echo ""

# Function to start backend
start_backend() {
    echo "Starting backend server..."
    cd backend
    source venv/bin/activate
    python main.py &
    BACKEND_PID=$!
    cd ..
    echo "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo "Frontend started with PID: $FRONTEND_PID"
}

# Start both servers
start_backend
sleep 5
start_frontend

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"  
echo "📚 API Docs: http://localhost:8000/api/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF

chmod +x launch-app.sh

echo ""
echo "Step 4: Creating testing documentation..."
echo "----------------------------------------"

# Create testing guide
cat > TESTING_GUIDE.md << 'EOF'
# 🧪 OpenClipREDUX Testing Guide

Welcome testers! This guide will help you test the OpenClipREDUX application.

## 🚀 Quick Start

### For Windows Users:
1. Double-click `launch-app.bat`
2. Wait for both servers to start
3. Open http://localhost:5173 in your browser

### For Mac/Linux Users:
1. Run `./launch-app.sh` in terminal
2. Wait for both servers to start  
3. Open http://localhost:5173 in your browser

## 🔑 First Time Setup

1. **Create Account**: Register with your email
2. **Add API Keys**: Go to Settings and add your AI provider API keys:
   - OpenAI API Key (recommended)
   - Google Gemini API Key (optional)
   - Anthropic API Key (optional)

## 🎬 Testing Workflow

### Test 1: Basic Video Upload
1. Create a new project
2. Upload a short video file (MP4, MOV, AVI)
3. Verify video information is displayed correctly

### Test 2: AI Analysis
1. Add a custom analysis prompt like:
   - "Find the most engaging 30-second clips"
   - "Identify moments with high energy or emotion"
   - "Extract clips suitable for social media"
2. Select your AI provider and model
3. Start analysis and wait for results

### Test 3: YouTube Processing
1. Create a YouTube project
2. Paste a YouTube URL
3. Test analysis on downloaded content

### Test 4: Clip Management
1. Review generated clips
2. Play clips in the interface
3. Export or download clips

## 🐛 What to Test For

### Functionality
- [ ] Account registration and login
- [ ] Video upload and processing
- [ ] AI analysis with different prompts
- [ ] YouTube URL processing
- [ ] Clip generation and playback
- [ ] Settings and API key management

### User Experience
- [ ] Interface responsiveness
- [ ] Clear error messages
- [ ] Loading states and progress indicators
- [ ] Mobile responsiveness
- [ ] Navigation flow

### Performance
- [ ] Upload speed for different file sizes
- [ ] Analysis processing time
- [ ] Frontend rendering performance
- [ ] Memory usage during processing

## 🚨 Known Limitations

- Free tier limits: 10 projects, 1000 API calls, 5GB storage
- Large video files may take longer to process
- AI analysis quality depends on the provider and model selected
- Some video formats may require conversion

## 🔧 Troubleshooting

### Backend Issues
- Check `backend/.env` has valid API keys
- Ensure port 8000 is not in use
- Check console output for Python errors

### Frontend Issues  
- Ensure port 5173 is not in use
- Clear browser cache if styling looks broken
- Check browser console for JavaScript errors

### API Key Issues
- Verify API keys are valid and have sufficient credits
- Check provider-specific rate limits
- Ensure correct model names are used

## 📊 Testing Data

Use these sample prompts for consistent testing:

**For Educational Content:**
"Find segments where complex concepts are explained clearly with visual aids"

**For Entertainment:**
"Identify the funniest moments or unexpected reactions"

**For Marketing:**
"Extract clips with strong emotional impact and clear value propositions" 

**For Social Media:**
"Find 15-30 second clips with high engagement potential"

## ✅ Success Criteria

The app is ready for broader release if:
- [ ] All core workflows complete without errors
- [ ] Performance is acceptable for typical use cases
- [ ] User interface is intuitive and responsive
- [ ] Error handling provides helpful feedback
- [ ] API integrations work reliably

## 📝 Feedback

Please document:
1. **Bugs**: What broke and how to reproduce it
2. **UX Issues**: What was confusing or frustrating
3. **Performance**: What felt slow or unresponsive
4. **Features**: What's missing or could be improved
5. **Overall**: Would you use this product?

Thank you for testing! 🚀
EOF

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "🎯 Next Steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Run launch-app.bat (Windows) or ./launch-app.sh (Mac/Linux)"
echo "3. Open http://localhost:5173 in your browser"
echo "4. Share TESTING_GUIDE.md with your testers"
echo ""
echo "📚 Files created:"
echo "- launch-app.bat (Windows launcher)"
echo "- launch-app.sh (Mac/Linux launcher)"  
echo "- TESTING_GUIDE.md (Testing instructions)"
echo ""
echo "🔗 Useful URLs:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:8000"
echo "- API Documentation: http://localhost:8000/api/docs"
echo ""
