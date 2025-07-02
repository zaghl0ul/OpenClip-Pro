@echo off
REM Kill any running node, python, or uvicorn processes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1

REM Kill all python and node processes (optional, more aggressive)
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM uvicorn.exe >nul 2>&1

REM Start backend (Uvicorn FastAPI)
start "OpenClip Backend" cmd /k "cd backend && python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

REM Start frontend (Vite)
start "OpenClip Frontend" cmd /k "npm run dev"

echo Both backend and frontend are starting in new windows.
pause 