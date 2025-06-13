@echo off 
title OpenClipREDUX - Application Launcher 
color 0B 
echo. 
echo 🚀 Starting OpenClipREDUX for testing... 
echo ======================================== 
echo. 
echo Starting backend server... 
start "OpenClipREDUX Backend" cmd /k "cd backend && venv\Scripts\activate && py main.py" 
echo. 
echo Waiting for backend to start... 
timeout /t 5 /nobreak > nul 
echo. 
echo Starting frontend server... 
start "OpenClipREDUX Frontend" cmd /k "npm run dev" 
echo. 
echo ✅ Both servers should now be starting! 
echo. 
echo 📱 Frontend: http://localhost:5173 
echo 🔧 Backend API: http://localhost:8000 
echo 📚 API Docs: http://localhost:8000/api/docs 
echo. 
echo Press any key to exit this launcher... 
pause > nul 
