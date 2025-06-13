@echo off
title OpenClipREDUX - Fixed Launcher
color 0B

echo.
echo 🚀 Starting OpenClipREDUX (Fixed Version)
echo =========================================
echo.

REM Make sure we're in the right directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

echo 🔧 Starting Backend Server...
start "OpenClipREDUX Backend" cmd /k "echo Starting backend from: %CD%\backend && cd backend && call venv\Scripts\activate && echo Virtual environment activated && py main.py"

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 8 /nobreak > nul

echo.
echo 🎨 Starting Frontend Server (from root directory)...
start "OpenClipREDUX Frontend" cmd /k "echo Starting frontend from: %CD% && echo Running: npm run dev && npm run dev"

echo.
timeout /t 3 /nobreak > nul

echo ✅ OpenClipREDUX Starting!
echo.
echo 🌐 URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo.
echo 📁 Frontend running from: %CD%
echo 📁 Backend running from:  %CD%\backend
echo.

timeout /t 5 /nobreak > nul
start http://localhost:5173

echo.
echo If you see "Vite + React" instead of OpenClipREDUX:
echo 1. Close the frontend window
echo 2. Make sure you're in the OpenClipREDUX root folder
echo 3. Run: npm run dev manually
echo.

pause
