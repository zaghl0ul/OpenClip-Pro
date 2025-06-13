@echo off
title OpenClipREDUX - Setup for Testing
color 0A

echo.
echo 🚀 OpenClipREDUX - Setting up for testing...
echo ================================================
echo.

echo Step 1: Setting up Python backend...
echo -----------------------------------

cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment. Make sure Python is installed.
        pause
        exit /b 1
    )
)

REM Activate virtual environment and install dependencies
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies. Check your internet connection.
    pause
    exit /b 1
)

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please edit backend\.env with your API keys before running!
    echo.
)

REM Initialize database
echo Initializing database...
python -c "from utils.db_manager import init_db; init_db(); print('✅ Database initialized successfully')" 2>nul
if errorlevel 1 (
    echo ⚠️  Database initialization had issues, but continuing...
)

cd ..

echo.
echo Step 2: Setting up React frontend...
echo -----------------------------------

REM Check if node_modules exists in root
if not exist "node_modules" (
    echo Installing root dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install root dependencies. Make sure Node.js is installed.
        pause
        exit /b 1
    )
)

REM Navigate to frontend directory
cd frontend

REM Install frontend dependencies
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)

cd ..

echo.
echo Step 3: Creating launch scripts...
echo ---------------------------------

REM Create launch script
echo @echo off > launch-app.bat
echo title OpenClipREDUX - Application Launcher >> launch-app.bat
echo color 0B >> launch-app.bat
echo echo. >> launch-app.bat
echo echo 🚀 Starting OpenClipREDUX for testing... >> launch-app.bat
echo echo ======================================== >> launch-app.bat
echo echo. >> launch-app.bat
echo echo Starting backend server... >> launch-app.bat
echo start "OpenClipREDUX Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py" >> launch-app.bat
echo echo. >> launch-app.bat
echo echo Waiting for backend to start... >> launch-app.bat
echo timeout /t 5 /nobreak ^> nul >> launch-app.bat
echo echo. >> launch-app.bat
echo echo Starting frontend server... >> launch-app.bat
echo start "OpenClipREDUX Frontend" cmd /k "cd frontend && npm run dev" >> launch-app.bat
echo echo. >> launch-app.bat
echo echo ✅ Both servers should now be starting! >> launch-app.bat
echo echo. >> launch-app.bat
echo echo 📱 Frontend: http://localhost:5173 >> launch-app.bat
echo echo 🔧 Backend API: http://localhost:8000 >> launch-app.bat
echo echo 📚 API Docs: http://localhost:8000/api/docs >> launch-app.bat
echo echo. >> launch-app.bat
echo echo Press any key to exit this launcher... >> launch-app.bat
echo pause ^> nul >> launch-app.bat

REM Create quick test script
echo @echo off > quick-test.bat
echo title OpenClipREDUX - Quick Test >> quick-test.bat
echo echo. >> quick-test.bat
echo echo 🧪 OpenClipREDUX Quick Test >> quick-test.bat
echo echo ======================= >> quick-test.bat
echo echo. >> quick-test.bat
echo echo Testing backend health... >> quick-test.bat
echo curl -s http://localhost:8000/health ^| python -m json.tool >> quick-test.bat
echo echo. >> quick-test.bat
echo echo Opening application in browser... >> quick-test.bat
echo start http://localhost:5173 >> quick-test.bat
echo echo. >> quick-test.bat
echo pause >> quick-test.bat

echo.
echo Step 4: Creating testing documentation...
echo ----------------------------------------

REM Create comprehensive testing guide
(
echo # 🧪 OpenClipREDUX Testing Guide
echo.
echo Welcome testers! This guide will help you test the OpenClipREDUX application.
echo.
echo ## 🚀 Quick Start
echo.
echo 1. **Double-click `launch-app.bat`** - This starts both backend and frontend
echo 2. **Wait for both servers to start** - You'll see two command windows
echo 3. **Open http://localhost:5173** in your browser
echo.
echo ## 🔑 First Time Setup
echo.
echo ### 1. Configure API Keys
echo Before testing, you MUST add your AI provider API keys:
echo.
echo 1. Open `backend\.env` file in a text editor
echo 2. Add your API keys:
echo    ```
echo    OPENAI_API_KEY=your-openai-api-key-here
echo    GEMINI_API_KEY=your-google-api-key-here
echo    ANTHROPIC_API_KEY=your-anthropic-api-key-here
echo    ```
echo.
echo ### 2. Get API Keys
echo - **OpenAI**: https://platform.openai.com/api-keys
echo - **Google Gemini**: https://makersuite.google.com/app/apikey  
echo - **Anthropic**: https://console.anthropic.com/
echo.
echo ### 3. Register Account
echo 1. Go to the app homepage
echo 2. Click "Sign Up" 
echo 3. Create an account
echo 4. Go to Settings to add your API keys
echo.
echo ## 🎬 Testing Workflows
echo.
echo ### Test 1: Video Upload and Analysis
echo 1. **Create New Project**
echo    - Click "New Project"
echo    - Give it a name and description
echo    - Choose "Upload Video"
echo.
echo 2. **Upload Video**
echo    - Drag and drop a video file ^(MP4, MOV, AVI^)
echo    - Wait for upload to complete
echo    - Verify video details are shown
echo.
echo 3. **Run AI Analysis**
echo    - Enter a custom prompt like:
echo      - "Find the most engaging 30-second clips"
echo      - "Identify moments with high energy"
echo      - "Extract clips for social media"
echo    - Select AI provider ^(OpenAI recommended^)
echo    - Click "Analyze"
echo    - Wait for clips to be generated
echo.
echo 4. **Review Results**
echo    - Check generated clips
echo    - Play clips in the interface
echo    - Verify clip timing and descriptions
echo.
echo ### Test 2: YouTube Processing
echo 1. Create a new "YouTube" project
echo 2. Paste a YouTube URL
echo 3. Test analysis on downloaded content
echo 4. Verify clips are extracted properly
echo.
echo ### Test 3: Settings and Management
echo 1. Test API key management
echo 2. Check project limits and usage
echo 3. Verify user profile settings
echo 4. Test project deletion
echo.
echo ## 🐛 What to Look For
echo.
echo ### ✅ Expected Behavior
echo - Smooth video upload process
echo - Clear progress indicators
echo - Accurate AI analysis results
echo - Responsive user interface
echo - Proper error handling
echo.
echo ### ❌ Issues to Report
echo - Upload failures or errors
echo - Analysis not working
echo - Interface bugs or crashes
echo - Slow performance
echo - Confusing user experience
echo.
echo ## 📊 Test with Different Content
echo.
echo ### Video Types to Test
echo - **Short clips** ^(1-2 minutes^) - Basic functionality
echo - **Medium videos** ^(5-10 minutes^) - Standard use case  
echo - **Long content** ^(20+ minutes^) - Performance testing
echo - **Different formats** - MP4, MOV, AVI compatibility
echo.
echo ### Analysis Prompts to Try
echo - "Find funny moments and reactions"
echo - "Extract educational segments with clear explanations"
echo - "Identify highlights for sports content"
echo - "Create clips for social media marketing"
echo - "Find emotional or impactful moments"
echo.
echo ## 🔧 Troubleshooting
echo.
echo ### Common Issues
echo.
echo **"No API key configured"**
echo - Edit `backend\.env` with your API keys
echo - Restart the backend server
echo - Add keys in the app settings
echo.
echo **"Upload failed"**
echo - Check video file size ^(max 5GB^)
echo - Verify video format is supported
echo - Check internet connection
echo.
echo **"Analysis not working"**
echo - Verify API key is valid
echo - Check API provider rate limits
echo - Try a different AI model
echo.
echo **"Can't access app"**
echo - Ensure both servers are running
echo - Check ports 8000 and 5173 are not blocked
echo - Try refreshing the browser
echo.
echo ## 📝 Feedback Template
echo.
echo When reporting issues, please include:
echo.
echo **Bug Reports:**
echo - What you were trying to do
echo - What happened instead
echo - Steps to reproduce the issue
echo - Error messages or screenshots
echo.
echo **Feature Feedback:**
echo - What worked well
echo - What was confusing
echo - What features are missing
echo - Overall user experience rating
echo.
echo ## 🎯 Success Metrics
echo.
echo The app is ready for release if:
echo - [ ] Video upload works reliably
echo - [ ] AI analysis produces good results
echo - [ ] Interface is intuitive to use
echo - [ ] Performance is acceptable
echo - [ ] Errors are handled gracefully
echo.
echo ## 📞 Support
echo.
echo If you need help:
echo 1. Check this guide first
echo 2. Look at the console output in the command windows
echo 3. Check the browser developer console ^(F12^)
echo 4. Contact the development team
echo.
echo ---
echo.
echo **Thank you for testing OpenClipREDUX! 🚀**
echo.
echo Your feedback helps make this app better for everyone.
) > TESTING_GUIDE.md

REM Create environment setup reminder
(
echo # ⚠️ IMPORTANT: API Keys Required
echo.
echo Before testing, you MUST configure your API keys:
echo.
echo 1. Open `backend\.env` in a text editor
echo 2. Add your API keys:
echo.
echo ```
echo # Replace with your actual API keys
echo OPENAI_API_KEY=sk-your-openai-key-here
echo GEMINI_API_KEY=your-google-gemini-key-here  
echo ANTHROPIC_API_KEY=your-anthropic-key-here
echo ```
echo.
echo ## Get API Keys:
echo - OpenAI: https://platform.openai.com/api-keys
echo - Google: https://makersuite.google.com/app/apikey
echo - Anthropic: https://console.anthropic.com/
echo.
echo ## Then run: `launch-app.bat`
) > API_KEYS_SETUP.md

echo.
echo ✅ Setup Complete!
echo ==================
echo.
echo 🎯 Next Steps:
echo 1. ⚠️  Edit backend\.env with your API keys ^(REQUIRED!^)
echo 2. Run launch-app.bat to start the application
echo 3. Open http://localhost:5173 in your browser
echo 4. Share TESTING_GUIDE.md with your testers
echo.
echo 📚 Files created:
echo - launch-app.bat ^(Start the application^)
echo - quick-test.bat ^(Quick health check^)
echo - TESTING_GUIDE.md ^(Complete testing instructions^)
echo - API_KEYS_SETUP.md ^(API key setup reminder^)
echo.
echo 🔗 When running:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000  
echo - API Docs: http://localhost:8000/api/docs
echo.
echo 🚨 REMEMBER: Add your API keys to backend\.env first!
echo.
echo Press any key to continue...
pause > nul
