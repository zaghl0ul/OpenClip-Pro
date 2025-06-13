@echo off
title OpenClipREDUX - Complete Setup and Testing Preparation
color 0A

echo.
echo 🚀 OpenClipREDUX - Complete Setup for Testing
echo ===============================================
echo.
echo This will set up your app for testing by friends!
echo.

REM Check prerequisites
echo Step 1: Checking prerequisites...
echo ---------------------------------

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Python and Node.js are installed

echo.
echo Step 2: Setting up backend...
echo -----------------------------

cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate and install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
)

REM Setup environment file
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    
    echo.
    echo ⚠️  CRITICAL: You must add your API keys to backend\.env
    echo.
    echo Open backend\.env and add:
    echo OPENAI_API_KEY=your-openai-key-here
    echo GEMINI_API_KEY=your-google-key-here
    echo.
)

REM Initialize database
echo Initializing database...
python -c "
try:
    from utils.db_manager import init_db
    init_db()
    print('✅ Database initialized')
except Exception as e:
    print(f'⚠️  Database setup issue: {e}')
    print('Will try to continue...')
"

cd ..

echo.
echo Step 3: Setting up frontend...
echo ------------------------------

REM Install root dependencies
echo Installing root dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

REM The frontend dependencies are in the frontend folder, but we'll use root
REM Update root dependencies to include all necessary packages
echo Installing missing frontend dependencies...
npm install react-router-dom framer-motion react-hot-toast axios zustand @headlessui/react @heroicons/react lucide-react clsx tailwind-merge react-dropzone react-player

REM Create frontend environment
if not exist ".env" (
    echo Creating frontend .env...
    (
        echo VITE_API_BASE_URL=http://localhost:8000
        echo VITE_APP_NAME=OpenClip Pro
        echo VITE_APP_VERSION=1.0.0
        echo VITE_ENVIRONMENT=development
    ) > .env
)

echo.
echo Step 4: Creating launch scripts...
echo ----------------------------------

REM Create production-ready launch script
(
echo @echo off
echo title OpenClipREDUX - Application
echo color 0B
echo echo.
echo echo 🚀 Starting OpenClipREDUX...
echo echo ========================
echo echo.
echo echo 🔧 Starting Backend Server...
echo start "OpenClipREDUX Backend" cmd /k "echo Starting backend... && cd backend && call venv\Scripts\activate && python main.py"
echo echo.
echo echo ⏳ Waiting for backend to initialize...
echo timeout /t 8 /nobreak ^> nul
echo echo.
echo echo 🎨 Starting Frontend Server...
echo start "OpenClipREDUX Frontend" cmd /k "echo Starting frontend... && npm run dev"
echo echo.
echo echo ✅ OpenClipREDUX is starting!
echo echo.
echo echo 🌐 Open these URLs in your browser:
echo echo    Frontend: http://localhost:5173
echo echo    Backend:  http://localhost:8000
echo echo    API Docs: http://localhost:8000/api/docs
echo echo.
echo echo 📱 For mobile testing, use your computer's IP:
echo for /f "tokens=2 delims=:" %%%%i in ^('ipconfig ^| find "IPv4"'^) do echo    http:%%%%i:5173
echo echo.
echo echo ⚠️  Make sure you've added API keys to backend\.env!
echo echo.
echo echo Press any key to close this launcher...
echo pause ^> nul
) > launch-for-testing.bat

REM Create quick setup checker
(
echo @echo off
echo title OpenClipREDUX - Setup Checker
echo echo.
echo echo 🔍 Checking OpenClipREDUX Setup...
echo echo ===============================
echo echo.
echo echo Backend Environment:
echo if exist "backend\.env" ^(
echo    echo ✅ .env file exists
echo    findstr /C:"OPENAI_API_KEY=" backend\.env ^> nul ^&^& echo ✅ OpenAI key configured ^|^| echo ❌ OpenAI key missing
echo    findstr /C:"GEMINI_API_KEY=" backend\.env ^> nul ^&^& echo ✅ Gemini key configured ^|^| echo ⚠️  Gemini key missing ^(optional^)
echo ^) else ^(
echo    echo ❌ .env file missing
echo ^)
echo echo.
echo echo Dependencies:
echo if exist "backend\venv" ^(
echo    echo ✅ Python virtual environment
echo ^) else ^(
echo    echo ❌ Python virtual environment missing
echo ^)
echo if exist "node_modules" ^(
echo    echo ✅ Node.js dependencies
echo ^) else ^(
echo    echo ❌ Node.js dependencies missing
echo ^)
echo echo.
echo echo Database:
echo if exist "backend\openclip.db" ^(
echo    echo ✅ Database file exists
echo ^) else ^(
echo    echo ⚠️  Database file missing ^(will be created on first run^)
echo ^)
echo echo.
echo echo 🎯 Ready to test? Run launch-for-testing.bat!
echo echo.
echo pause
) > check-setup.bat

REM Create tester instructions
(
echo # 🧪 OpenClipREDUX - Quick Testing Guide
echo.
echo ## 🚀 Getting Started ^(For Testers^)
echo.
echo 1. **Double-click `launch-for-testing.bat`**
echo 2. **Wait for both servers to start** ^(two command windows will open^)
echo 3. **Open http://localhost:5173** in your browser
echo 4. **Create an account** or use: admin@openclippro.com / admin123!
echo.
echo ## 🎬 What to Test
echo.
echo ### Quick Test Flow:
echo 1. **Register/Login** - Create your account
echo 2. **Add API Keys** - Go to Settings, add your OpenAI API key
echo 3. **Create Project** - Click "New Project", name it
echo 4. **Upload Video** - Drag a short video file ^(MP4, MOV^)
echo 5. **Run Analysis** - Enter prompt like "Find the best 30-second clips"
echo 6. **Review Results** - Check the generated clips
echo.
echo ### Test Prompts to Try:
echo - "Find the most engaging moments"
echo - "Extract clips suitable for social media"
echo - "Identify highlights and key points"
echo - "Find moments with high energy"
echo.
echo ## 🔑 API Keys Needed
echo.
echo You'll need at least one:
echo - **OpenAI**: https://platform.openai.com/api-keys ^(Recommended^)
echo - **Google Gemini**: https://makersuite.google.com/app/apikey
echo - **Anthropic**: https://console.anthropic.com/
echo.
echo ## 🐛 Common Issues
echo.
echo **"Can't connect"** → Make sure both servers are running
echo **"No API key"** → Add your AI provider API key in Settings
echo **"Upload failed"** → Try smaller video files first
echo **"Analysis stuck"** → Check your API key has credits
echo.
echo ## 📱 Mobile Testing
echo.
echo To test on mobile devices:
echo 1. Connect to same WiFi as your computer
echo 2. Use your computer's IP address: http://YOUR-IP:5173
echo 3. ^(The launch script will show your IP^)
echo.
echo ## ✅ What Good Results Look Like
echo.
echo - Upload completes quickly
echo - Video plays in the interface  
echo - Analysis generates multiple clips
echo - Clips have accurate timing and descriptions
echo - Interface is responsive and intuitive
echo.
echo ## 📝 Feedback to Collect
echo.
echo **Bugs:**
echo - What broke and how?
echo - Error messages or screenshots
echo.
echo **User Experience:**
echo - What was confusing?
echo - What felt slow?
echo - What would improve the workflow?
echo.
echo **Overall:**
echo - Would you use this tool?
echo - What features are missing?
echo - Performance rating 1-10?
echo.
echo ---
echo **Happy Testing! 🚀**
) > TESTER_GUIDE.md

echo.
echo Step 5: Final verification...
echo -----------------------------

echo Checking setup...
if exist "backend\.env" (
    echo ✅ Backend environment configured
) else (
    echo ❌ Backend .env missing
)

if exist "backend\venv" (
    echo ✅ Python virtual environment ready
) else (
    echo ❌ Python environment failed
)

if exist "node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies failed
)

echo.
echo 🎉 Setup Complete!
echo =================
echo.
echo 📋 Next Steps:
echo 1. ⚠️  IMPORTANT: Add your API keys to backend\.env
echo 2. Run launch-for-testing.bat to start the app
echo 3. Share TESTER_GUIDE.md with your friends
echo.
echo 📁 Files Created:
echo - launch-for-testing.bat ^(Start the app^)
echo - check-setup.bat ^(Verify setup^)
echo - TESTER_GUIDE.md ^(Instructions for testers^)
echo.
echo 🔗 URLs ^(when running^):
echo - App: http://localhost:5173
echo - API: http://localhost:8000
echo - Docs: http://localhost:8000/api/docs
echo.
echo 🚨 BEFORE TESTING: Edit backend\.env with your API keys!
echo.
echo Press any key to finish...
pause > nul

echo.
echo 🎯 Ready for testing! Share this folder with your friends.
echo They just need to run launch-for-testing.bat
echo.
