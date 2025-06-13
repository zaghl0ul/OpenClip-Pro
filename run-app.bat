@echo off
echo OpenClip Redux - Quick Start
echo ==========================

REM Check if node_modules exists
if not exist "node_modules\." (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install npm dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)

REM Check if backend venv exists
if not exist "backend\venv\Scripts\python.exe" (
    echo Creating Python virtual environment...
    cd backend
    py -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    
    echo Installing backend dependencies...
    call venv\Scripts\activate && pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies
        pause
        exit /b 1
    )
    cd ..
) else (
    echo Backend virtual environment already exists
)

echo.
echo Starting OpenClip Redux...
echo =========================
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/api/docs
echo.

REM Start backend and frontend concurrently
start "OpenClip Backend" cmd /k "cd backend && venv\Scripts\activate && py main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
start "OpenClip Frontend" cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak > nul

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo Application is starting up...
echo Press Ctrl+C in both windows to stop the servers
echo.
pause
