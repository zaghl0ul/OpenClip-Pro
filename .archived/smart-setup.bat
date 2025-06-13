@echo off
title OpenClipREDUX - Smart Setup (Auto-detects Python command)
color 0A

echo.
echo 🚀 OpenClipREDUX Smart Setup
echo ============================
echo.

REM Detect Python command
set PYTHON_CMD=
py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    echo ✅ Using 'py' command for Python
) else (
    python --version >nul 2>&1
    if not errorlevel 1 (
        set PYTHON_CMD=python
        echo ✅ Using 'python' command for Python
    ) else (
        echo ❌ Python not found!
        echo Install Python from https://python.org
        echo Make sure to check "Add Python to PATH"
        pause
        exit /b 1
    )
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo Install from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo 🐍 Setting up backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    %PYTHON_CMD% -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo Installing dependencies...
call venv\Scripts\activate.bat
%PYTHON_CMD% -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

if not exist ".env" (
    copy .env.example .env
    echo ✅ Created config file
)

echo Initializing database...
%PYTHON_CMD% -c "
try:
    from utils.db_manager import init_db
    init_db()
    print('✅ Database initialized')
except Exception as e:
    print('⚠️ Database will be created on first run')
"

cd ..

echo.
echo 🎨 Setting up frontend...
npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo 📱 Creating launcher...
(
echo @echo off
echo title OpenClipREDUX - Application
echo color 0B
echo echo.
echo echo 🚀 Starting OpenClipREDUX...
echo echo ========================
echo echo.
echo echo Starting backend server...
echo start "OpenClipREDUX Backend" cmd /k "cd backend && call venv\Scripts\activate && %PYTHON_CMD% main.py"
echo echo.
echo echo Waiting for backend...
echo timeout /t 8 /nobreak ^> nul
echo echo.
echo echo Starting frontend server...
echo start "OpenClipREDUX Frontend" cmd /k "npm run dev"
echo echo.
echo echo ✅ OpenClipREDUX is starting!
echo echo.
echo echo 🌐 URLs:
echo echo   Frontend: http://localhost:5173
echo echo   Backend:  http://localhost:8000
echo echo   API Docs: http://localhost:8000/api/docs
echo echo.
echo echo 🔑 Remember to add API keys to backend\.env!
echo echo.
echo timeout /t 5 /nobreak ^> nul
echo start http://localhost:5173
echo echo.
echo echo Press any key to close...
echo pause ^> nul
) > LAUNCH-APP.bat

echo.
echo ✅ Setup Complete!
echo =================
echo.
echo 📋 Next Steps:
echo 1. ⚠️  Add your API keys to backend\.env
echo 2. Run LAUNCH-APP.bat to start testing
echo.
echo 🔑 To add API keys:
echo • Open backend\.env in notepad
echo • Find: OPENAI_API_KEY=""
echo • Add your key: OPENAI_API_KEY="sk-your-key-here"
echo • Save the file
echo.
echo 🚀 Ready to test!
echo.
pause
