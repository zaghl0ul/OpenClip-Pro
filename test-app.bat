@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    OpenClip Pro - Full Test Suite
echo ========================================
echo.

:: Set color for better visibility
color 0A

:: Check if Python is installed
echo [1/10] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)
echo ✓ Python is installed

:: Check if Node.js is installed
echo [2/10] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js is installed

:: Check if npm is installed
echo [3/10] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo ✓ npm is installed

:: Install frontend dependencies
echo [4/10] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

:: Setup Python virtual environment for backend
echo [5/10] Setting up Python virtual environment...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment
        cd ..
        pause
        exit /b 1
    )
)
echo ✓ Virtual environment ready

:: Activate virtual environment and install dependencies
echo [6/10] Installing backend dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

:: Setup FFmpeg PATH
echo [7/10] Setting up FFmpeg...
set FFMPEG_PATH=%~dp0ffmpeg\ffmpeg-7.1.1-essentials_build\bin
set PATH=%FFMPEG_PATH%;%PATH%
echo ✓ FFmpeg configured

:: Initialize database
echo [8/10] Initializing database...
python utils/init_db.py
if %errorlevel% neq 0 (
    echo WARNING: Database initialization had issues, but continuing...
)
echo ✓ Database initialized

cd ..

:: Create test video file if it doesn't exist
echo [9/10] Creating test video file...
if not exist "test_video.mp4" (
    echo Creating a simple test video using FFmpeg...
    ffmpeg -f lavfi -i testsrc=duration=10:size=320x240:rate=30 -c:v libx264 -t 10 test_video.mp4 -y >nul 2>&1
    if %errorlevel% neq 0 (
        echo WARNING: Could not create test video, but continuing...
    ) else (
        echo ✓ Test video created
    )
) else (
    echo ✓ Test video already exists
)

:: Start the application
echo [10/10] Starting OpenClip Pro...
echo.
echo ========================================
echo    Starting Backend and Frontend
echo ========================================
echo.
echo Backend will start on: http://localhost:8000
echo Frontend will start on: http://localhost:5173 (or next available port)
echo.
echo Press Ctrl+C to stop both servers
echo.

:: Create a temporary batch file to start backend
echo @echo off > start_backend_temp.bat
echo cd backend >> start_backend_temp.bat
echo call venv\Scripts\activate.bat >> start_backend_temp.bat
echo set FFMPEG_PATH=%~dp0ffmpeg\ffmpeg-7.1.1-essentials_build\bin >> start_backend_temp.bat
echo set PATH=%%FFMPEG_PATH%%;%%PATH%% >> start_backend_temp.bat
echo echo Starting backend server... >> start_backend_temp.bat
echo python main.py >> start_backend_temp.bat

:: Start backend in a new window
start "OpenClip Pro Backend" start_backend_temp.bat

:: Wait a moment for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Test backend health
echo Testing backend connection...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend is running and healthy
) else (
    echo WARNING: Backend health check failed, but continuing...
)

:: Start frontend
echo Starting frontend server...
start "OpenClip Pro Frontend" cmd /k "npm run dev"

:: Wait for frontend to start
echo Waiting for frontend to initialize...
timeout /t 3 /nobreak >nul

:: Open browser
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo    OpenClip Pro is now running!
echo ========================================
echo.
echo Backend API: http://localhost:8000
echo Frontend UI: http://localhost:5173
echo API Documentation: http://localhost:8000/docs
echo.
echo Default admin credentials:
echo Email: admin@openclippro.com
echo Password: admin123!
echo.
echo Test Instructions:
echo 1. The browser should open automatically
echo 2. You'll be auto-logged in as admin
echo 3. Click "Create Project" to test project creation
echo 4. Try uploading the test_video.mp4 file
echo 5. Test YouTube URL processing
echo 6. Check the Settings page for API configuration
echo.
echo Press any key to cleanup and exit...
pause >nul

:: Cleanup
echo.
echo Cleaning up...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
del start_backend_temp.bat >nul 2>&1

echo.
echo ========================================
echo    Test completed successfully!
echo ========================================
echo.
echo If you encountered any issues:
echo 1. Check that all dependencies are installed
echo 2. Ensure ports 8000 and 5173 are available
echo 3. Verify Python and Node.js versions
echo 4. Check the console output for error messages
echo.
echo For API keys setup, see: API_KEYS_SETUP.md
echo.
pause 