@echo off
cls
echo ╔═══════════════════════════════════════════════════════╗
echo ║           OpenClip Redux - Complete Setup             ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Step 1: Run cleanup
echo [1/4] Cleaning up redundant files...
if exist "cleanup.bat" (
    call cleanup.bat
) else (
    REM Direct cleanup if cleanup.bat doesn't exist
    for %%f in (
        "ULTIMATE-SETUP.bat" "ULTIMATE-SETUP-PY.bat" "quick-setup-py.bat"
        "setup-for-testing.bat" "setup-github.bat" "complete-setup.bat"
        "FIXED-LAUNCHER.bat" "launch.bat" "test_start.bat" "quick-test.bat"
        "ready-check.bat" "deployment.log" "setup.log" "New Text Document.txt"
        "deploy.bat" "push-to-existing.bat" "debug-and-fix.bat"
        "setup-complete.sh" "setup-for-testing.sh"
    ) do (
        if exist %%f move %%f ".archived\" >nul 2>&1
    )
)
echo ✓ Cleanup completed

REM Step 2: Install dependencies
echo.
echo [2/4] Checking dependencies...

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not found! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo ✗ Python not found! Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

REM Install frontend dependencies
if not exist "node_modules\." (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ✗ Failed to install npm dependencies
        pause
        exit /b 1
    )
) else (
    echo ✓ Frontend dependencies OK
)

REM Setup backend
if not exist "backend\venv\Scripts\python.exe" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    echo Installing backend dependencies...
    call venv\Scripts\activate && pip install -r requirements.txt
    cd ..
) else (
    echo ✓ Backend environment OK
)

REM Step 3: Database initialization
echo.
echo [3/4] Initializing database...
cd backend
if not exist "openclip.db" (
    echo Creating database...
    call venv\Scripts\activate && python -c "from utils.db_manager import init_db; init_db()"
)
cd ..
echo ✓ Database ready

REM Step 4: Launch application
echo.
echo [4/4] Starting OpenClip Redux...
echo ═══════════════════════════════════════════════════════
echo.
echo   Frontend URL: http://localhost:5173
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/api/docs
echo.
echo   Default Admin Login:
echo   Email: admin@openclippro.com
echo   Password: admin123!
echo.
echo ═══════════════════════════════════════════════════════

REM Start servers
start "OpenClip Backend" /min cmd /k "cd backend && venv\Scripts\activate && python main.py"
timeout /t 3 /nobreak >nul

start "OpenClip Frontend" /min cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

REM Open browser
start http://localhost:5173

echo.
echo ✓ Application launched successfully!
echo.
echo Press any key to view logs or Ctrl+C to exit...
pause >nul

REM Show both console windows
start "OpenClip Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"
start "OpenClip Frontend" cmd /k "npm run dev"
