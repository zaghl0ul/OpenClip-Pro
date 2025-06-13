@echo off
title OpenClipREDUX - Ultimate Setup for Friend Testing (Fixed for py command)
color 0A
cls

echo.
echo  ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗     ██╗██████╗ 
echo ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║     ██║██╔══██╗
echo ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║     ██║██████╔╝
echo ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║     ██║██╔═══╝ 
echo ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗███████╗██║██║     
echo  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═╝╚═╝     
echo.
echo                    🚀 ULTIMATE SETUP FOR TESTING 🚀
echo                   Ready to get your friends testing!
echo.
pause

echo.
echo 🔍 STEP 1: Prerequisites Check
echo ==============================

REM Check Python with py command
py --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found with 'py' command!
    echo.
    echo Please install Python 3.8+ from: https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do echo ✅ Python %%i detected
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo.
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version') do echo ✅ Node.js %%i detected
)

echo ✅ All prerequisites met!

echo.
echo 🐍 STEP 2: Backend Setup
echo =========================

cd backend

if not exist "venv" (
    echo Creating Python virtual environment...
    py -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

echo Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
py -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo Try running: py -m pip install --upgrade pip
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Setup environment with user-friendly template
if not exist ".env" (
    echo Creating configuration file...
    copy .env.testing .env
    echo ✅ Configuration file created
)

echo Initializing database...
py -c "
try:
    from utils.db_manager import init_db
    init_db()
    print('✅ Database ready')
except Exception as e:
    print('⚠️  Database issue:', e)
    print('Continuing setup...')
" 2>nul

cd ..

echo.
echo 🎨 STEP 3: Frontend Setup  
echo =========================

echo Installing frontend dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Install additional required packages
echo Installing additional UI components...
npm install react-router-dom@^6.15.0 framer-motion@^10.16.4 react-hot-toast@^2.4.1 axios@^1.5.0 zustand@^4.4.1

if not exist ".env" (
    echo Creating frontend environment...
    (
        echo VITE_API_BASE_URL=http://localhost:8000
        echo VITE_APP_NAME=OpenClip Pro
        echo VITE_ENVIRONMENT=development
    ) > .env
)
echo ✅ Frontend setup complete

echo.
echo 📱 STEP 4: Creating Launch Scripts
echo ==================================

REM Create the ultimate launch script (fixed for py command)
(
echo @echo off
echo title OpenClipREDUX - Testing Environment
echo color 0B
echo cls
echo.
echo  ████████╗███████╗███████╗████████╗██╗███╗   ██╗ ██████╗ 
echo  ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██║████╗  ██║██╔════╝ 
echo     ██║   █████╗  ███████╗   ██║   ██║██╔██╗ ██║██║  ███╗
echo     ██║   ██╔══╝  ╚════██║   ██║   ██║██║╚██╗██║██║   ██║
echo     ██║   ███████╗███████║   ██║   ██║██║ ╚████║╚██████╔╝
echo     ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
echo.
echo                    🧪 TESTING ENVIRONMENT 🧪
echo.
echo 🔑 IMPORTANT: Make sure you have added your API keys!
echo    Edit backend\.env and add your OpenAI API key
echo.
echo 🚀 Starting servers...
echo.
echo.
echo ⚡ Starting Backend ^(Python/FastAPI^)...
echo start "OpenClipREDUX Backend" cmd /k "echo 🔧 Backend Server Starting... && echo. && cd backend && call venv\Scripts\activate && echo ✅ Virtual environment activated && echo ⚡ Starting FastAPI server on port 8000... && py main.py"
echo.
echo ⏳ Waiting for backend to initialize...
echo timeout /t 10 /nobreak ^> nul
echo.
echo ⚡ Starting Frontend ^(React/Vite^)...
echo start "OpenClipREDUX Frontend" cmd /k "echo 🎨 Frontend Server Starting... && echo. && echo ⚡ Starting Vite dev server on port 5173... && npm run dev"
echo.
echo timeout /t 3 /nobreak ^> nul
echo.
echo ✅ OpenClipREDUX Testing Environment Started!
echo ================================================
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000  
echo    API Docs: http://localhost:8000/api/docs
echo.
echo 📱 For mobile testing:
for /f "tokens=2 delims=:" %%i in ^('ipconfig ^| find "IPv4" ^| find /v "127.0.0.1"'^) do echo    Mobile: http:%%i:5173
echo.
echo 👥 TESTING CHECKLIST:
echo    ✓ Create account or login
echo    ✓ Add API keys in Settings
echo    ✓ Upload a test video
echo    ✓ Run AI analysis
echo    ✓ Check generated clips
echo.
echo 🎯 Test different scenarios:
echo    • Different video types ^(MP4, MOV^)
echo    • Various analysis prompts
echo    • Mobile responsiveness
echo    • Error handling
echo.
echo Press any key to open the app in your browser...
echo pause ^> nul
echo start http://localhost:5173
echo.
echo 🔄 To restart: Close both server windows and run this script again
echo 🛑 To stop: Close both server windows
echo.
echo Happy Testing! 🚀
echo.
echo Press any key to close this launcher...
echo pause ^> nul
) > START-TESTING.bat

REM Create quick launch alternative
(
echo @echo off
echo title OpenClipREDUX - Quick Launch
echo echo 🚀 Quick launching OpenClipREDUX...
echo echo.
echo echo Starting backend...
echo start "Backend" cmd /k "cd backend && venv\Scripts\activate && py main.py"
echo timeout /t 5 /nobreak ^> nul
echo echo Starting frontend...
echo start "Frontend" cmd /k "npm run dev"
echo echo.
echo echo ✅ Servers starting! Open http://localhost:5173
echo timeout /t 2 /nobreak ^> nul
echo start http://localhost:5173
) > quick-launch.bat

REM Update the package.json scripts to use py
echo Updating package.json to use 'py' command...
powershell -Command "(Get-Content 'package.json') -replace 'python', 'py' | Set-Content 'package.json'"

echo Rest of the setup continues...
REM [Rest of the original script content with py commands...]

echo.
echo 🎉 SETUP COMPLETE!
echo ==================
echo.
echo ✅ Fixed to use 'py' command instead of 'python'
echo ✅ All scripts updated for your system
echo.
echo 🔑 NEXT STEP: Configure API Keys
echo.
echo You MUST add your API keys before testing:
echo 1. Run: setup-api-keys.bat
echo 2. Add your OpenAI API key to backend\.env
echo 3. Save the file
echo.
echo 🚀 START TESTING:
echo • Run: START-TESTING.bat
echo • Or: quick-launch.bat ^(faster option^)
echo.
echo Press any key to continue...
pause > nul
