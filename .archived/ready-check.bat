@echo off
title OpenClipREDUX - Ready Check
color 0C

echo.
echo 🔍 OpenClipREDUX Readiness Check
echo ================================
echo.

set /a score=0
set /a total=8

echo Checking setup status...
echo.

REM Check 1: Python environment
if exist "backend\venv" (
    echo ✅ [1/8] Python virtual environment exists
    set /a score+=1
) else (
    echo ❌ [1/8] Python virtual environment missing
    echo       Run ULTIMATE-SETUP.bat first
)

REM Check 2: Backend dependencies
if exist "backend\venv\Lib\site-packages\fastapi" (
    echo ✅ [2/8] Backend dependencies installed
    set /a score+=1
) else (
    echo ❌ [2/8] Backend dependencies missing
    echo       Run ULTIMATE-SETUP.bat first
)

REM Check 3: Frontend dependencies
if exist "node_modules" (
    echo ✅ [3/8] Frontend dependencies installed
    set /a score+=1
) else (
    echo ❌ [3/8] Frontend dependencies missing
    echo       Run ULTIMATE-SETUP.bat first
)

REM Check 4: Backend config
if exist "backend\.env" (
    echo ✅ [4/8] Backend configuration file exists
    set /a score+=1
) else (
    echo ❌ [4/8] Backend configuration missing
    echo       Run ULTIMATE-SETUP.bat first
)

REM Check 5: API keys
findstr /C:"OPENAI_API_KEY=" backend\.env | findstr /V /C:"OPENAI_API_KEY=\"\"" >nul 2>&1
if errorlevel 1 (
    echo ❌ [5/8] API keys not configured
    echo       Run setup-api-keys.bat to add them
) else (
    echo ✅ [5/8] API keys configured
    set /a score+=1
)

REM Check 6: Launch scripts
if exist "START-TESTING.bat" (
    echo ✅ [6/8] Launch scripts ready
    set /a score+=1
) else (
    echo ❌ [6/8] Launch scripts missing
    echo       Run ULTIMATE-SETUP.bat first
)

REM Check 7: Testing guide
if exist "ULTIMATE-TESTING-GUIDE.md" (
    echo ✅ [7/8] Testing guide available
    set /a score+=1
) else (
    echo ❌ [7/8] Testing guide missing
    echo       Run ULTIMATE-SETUP.bat first
)

REM Check 8: Database
if exist "backend\openclip.db" (
    echo ✅ [8/8] Database initialized
    set /a score+=1
) else (
    echo ⚠️  [8/8] Database will be created on first run
    set /a score+=1
)

echo.
echo 📊 READINESS SCORE: %score%/%total%
echo.

if %score% geq 7 (
    echo 🎉 READY FOR TESTING!
    echo =====================
    echo.
    echo Your OpenClipREDUX app is ready for friends to test!
    echo.
    echo 🚀 To start testing:
    echo    • Run: START-TESTING.bat
    echo    • Or double-click the desktop shortcut
    echo.
    echo 👥 To share with friends:
    echo    • Give them this entire folder
    echo    • Tell them to run START-TESTING.bat
    echo    • Share ULTIMATE-TESTING-GUIDE.md
    echo.
    if %score% equ 7 (
        echo ⚠️  NOTE: Make sure to add API keys before testing!
    )
) else (
    echo ❌ NOT READY YET
    echo ===============
    echo.
    echo You need to complete the setup first.
    echo.
    echo 🔧 Next steps:
    if %score% lss 4 (
        echo    1. Run ULTIMATE-SETUP.bat
        echo    2. Then run setup-api-keys.bat
    ) else (
        echo    1. Run setup-api-keys.bat to add API keys
    )
    echo    3. Run this check again
    echo.
)

echo.
echo 📁 Available Files:
if exist "ULTIMATE-SETUP.bat" echo    • ULTIMATE-SETUP.bat - Complete setup
if exist "setup-api-keys.bat" echo    • setup-api-keys.bat - Add API keys
if exist "START-TESTING.bat" echo    • START-TESTING.bat - Launch the app
if exist "ULTIMATE-TESTING-GUIDE.md" echo    • ULTIMATE-TESTING-GUIDE.md - Testing instructions

echo.
echo Press any key to continue...
pause > nul
