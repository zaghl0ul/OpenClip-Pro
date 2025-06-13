@echo off
cls
echo Starting OpenClip Redux (Offline Mode)...
echo =====================================
echo.

REM Quick dependency check
if not exist "node_modules\." (
    echo Installing dependencies...
    call npm install
)

REM Start frontend only - no backend needed
echo Launching frontend on http://localhost:5173
start /min cmd /k "npm run dev"

REM Wait and open browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo App is running in offline mode!
echo All features work without backend.
exit
