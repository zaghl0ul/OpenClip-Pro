@echo off
title OpenClipREDUX - Quick Setup (py command)
color 0A

echo.
echo 🚀 OpenClipREDUX Quick Setup
echo ============================
echo (Using 'py' command for Python)
echo.

REM Check prerequisites
echo Checking Python...
py --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Install from https://python.org
    pause
    exit /b 1
)
echo ✅ Python found

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Install from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo 🔧 Setting up backend...
cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    py -m venv venv
)

REM Install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
py -m pip install --upgrade pip
pip install -r requirements.txt

REM Setup config
if not exist ".env" (
    echo Creating config file...
    copy .env.example .env
)

echo Initializing database...
py -c "
try:
    from utils.db_manager import init_db
    init_db()
    print('Database ready!')
except:
    print('Database will be created on first run')
"

cd ..

echo.
echo 🎨 Setting up frontend...
npm install

echo.
echo 📱 Creating launch script...
(
echo @echo off
echo title OpenClipREDUX - App Launcher
echo echo 🚀 Starting OpenClipREDUX...
echo start "Backend" cmd /k "cd backend && venv\Scripts\activate && py main.py"
echo timeout /t 5 /nobreak ^> nul
echo start "Frontend" cmd /k "npm run dev"
echo echo ✅ Starting! Open http://localhost:5173
echo timeout /t 3 /nobreak ^> nul
echo start http://localhost:5173
) > RUN-APP.bat

echo.
echo ✅ Setup Complete!
echo =================
echo.
echo 🔑 IMPORTANT: Add your API keys to backend\.env
echo.
echo 🚀 To run the app: Double-click RUN-APP.bat
echo.
echo 📝 Files created:
echo • RUN-APP.bat - Launch the application
echo • backend\.env - Add your API keys here
echo.
pause
