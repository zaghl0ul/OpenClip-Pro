@echo off
setlocal EnableDelayedExpansion

:: Configuration
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "PYTHON_VERSION=3.9"
set "NODE_VERSION=16"

echo ================================================================================
echo  VideoForge Platform - Automated Setup
echo ================================================================================
echo.

:: Check for Python
py --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python not found. Please install Python %PYTHON_VERSION% or later from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: Check for Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js not found. Please install Node.js %NODE_VERSION% or later from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Setup Backend
echo Setting up backend...
cd /d "%BACKEND_DIR%"

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    py -m venv venv
)

:: Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
py -m pip install --upgrade pip
pip install -r requirements.txt

:: Setup Frontend
echo Setting up frontend...
cd /d "%FRONTEND_DIR%"

:: Create React project if it doesn't exist
if not exist "package.json" (
    echo Creating React project...
    call npm create vite@latest . -- --template react-ts
    call npm install
)

:: Install frontend dependencies
echo Installing frontend dependencies...
call npm install

:: Return to project root
cd /d "%PROJECT_ROOT%"

echo.
echo ================================================================================
echo  Setup Complete!
echo ================================================================================
echo.
echo To start the development environment:
echo 1. Run 'deploy.bat' to start both frontend and backend servers
echo.
echo The application will be available at:
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:8000
echo.
pause 