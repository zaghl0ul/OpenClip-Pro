@echo off
title OpenClipREDUX - Deployment
color 0A
echo.
echo ======================================
echo    OpenClipREDUX - Deployment
echo ======================================
echo.

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
echo Starting backend server...
start "OpenClipREDUX Backend" cmd /k "cd backend && venv\Scripts\activate && py main.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "OpenClipREDUX Frontend" cmd /k "npm run dev"

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

echo.
echo ======================================
echo    Deployment Complete!
echo ======================================
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/api/docs
echo.
echo Opening application in browser...
start http://localhost:5173
echo.
echo Press any key to exit this launcher...
pause > nul 