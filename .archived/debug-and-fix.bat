@echo off
title OpenClipREDUX - Debug & Fix
color 0E

echo.
echo 🔍 OpenClipREDUX Debug & Fix
echo =============================
echo.

echo Checking directory structure...
echo.

echo Current location: %CD%
echo.

echo Checking for main app files:
if exist "src\App.jsx" (
    echo ✅ Main App.jsx found in src\
) else (
    echo ❌ Main App.jsx NOT found in src\
)

if exist "src\main.jsx" (
    echo ✅ Main main.jsx found in src\
) else (
    echo ❌ Main main.jsx NOT found in src\
)

if exist "frontend\src\App.tsx" (
    echo ⚠️  Frontend App.tsx found - this might be causing conflict
) else (
    echo ✅ No conflicting frontend App.tsx
)

echo.
echo Checking package.json scripts...
findstr "\"dev\":" package.json
echo.

echo 🔧 Let's fix this step by step:
echo.
echo 1. First, let's stop any running servers...
taskkill /f /im node.exe 2>nul
taskkill /f /im py.exe 2>nul
taskkill /f /im python.exe 2>nul

echo.
echo 2. Removing potential conflicting frontend folder...
if exist "frontend" (
    echo Moving frontend folder to frontend_backup...
    if exist "frontend_backup" rmdir /s /q frontend_backup
    move frontend frontend_backup
)

echo.
echo 3. Starting servers from correct location...
echo.

echo Starting backend...
start "Backend" cmd /k "echo Backend starting... && cd backend && call venv\Scripts\activate && py main.py"

echo.
echo Waiting 8 seconds for backend...
timeout /t 8 /nobreak > nul

echo.
echo Starting frontend from ROOT directory...
start "Frontend" cmd /k "echo Frontend starting from %CD% && npm run dev"

echo.
echo ✅ Servers should now be starting correctly!
echo.
echo 🌐 Your app should load at: http://localhost:5173
echo 📁 Running from: %CD%
echo.

timeout /t 5 /nobreak > nul
start http://localhost:5173

echo.
echo If you still see "Vite + React":
echo 1. Close both server windows
echo 2. Run this script again
echo 3. Or manually run: npm run dev from this folder
echo.

pause
