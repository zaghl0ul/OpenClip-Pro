@echo off
title OpenClipREDUX - Ultimate Setup for Friend Testing
color 0A
cls

echo.
echo  ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗     ██╗██████╗ 
echo ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║     ██║██╔══██╗
echo ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║     ██║██████╔╝
echo ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║     ██║██╔═══╝ 
echo ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗███████╗██║██║     
echo  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═╝╚═╝     
echo.
echo                    🚀 ULTIMATE SETUP FOR TESTING 🚀
echo                   Ready to get your friends testing!
echo.
pause

echo.
echo 🔍 STEP 1: Prerequisites Check
echo ==============================

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found!
    echo.
    echo Please install Python 3.8+ from: https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo ✅ Python %%i detected
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo.
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version') do echo ✅ Node.js %%i detected
)

echo ✅ All prerequisites met!

echo.
echo 🐍 STEP 2: Backend Setup
echo =========================

cd backend

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

echo Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo Try running: pip install --upgrade pip
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Setup environment with user-friendly template
if not exist ".env" (
    echo Creating configuration file...
    copy .env.testing .env
    echo ✅ Configuration file created
)

echo Initializing database...
python -c "
try:
    from utils.db_manager import init_db
    init_db()
    print('✅ Database ready')
except Exception as e:
    print('⚠️  Database issue:', e)
    print('Continuing setup...')
" 2>nul

cd ..

echo.
echo 🎨 STEP 3: Frontend Setup  
echo =========================

echo Installing frontend dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Install additional required packages
echo Installing additional UI components...
npm install react-router-dom@^6.15.0 framer-motion@^10.16.4 react-hot-toast@^2.4.1 axios@^1.5.0 zustand@^4.4.1

if not exist ".env" (
    echo Creating frontend environment...
    (
        echo VITE_API_BASE_URL=http://localhost:8000
        echo VITE_APP_NAME=OpenClip Pro
        echo VITE_ENVIRONMENT=development
    ) > .env
)
echo ✅ Frontend setup complete

echo.
echo 📱 STEP 4: Creating Launch Scripts
echo ==================================

REM Create the ultimate launch script
(
echo @echo off
echo title OpenClipREDUX - Testing Environment
echo color 0B
echo cls
echo.
echo  ████████╗███████╗███████╗████████╗██╗███╗   ██╗ ██████╗ 
echo  ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██║████╗  ██║██╔════╝ 
echo     ██║   █████╗  ███████╗   ██║   ██║██╔██╗ ██║██║  ███╗
echo     ██║   ██╔══╝  ╚════██║   ██║   ██║██║╚██╗██║██║   ██║
echo     ██║   ███████╗███████║   ██║   ██║██║ ╚████║╚██████╔╝
echo     ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
echo.
echo                    🧪 TESTING ENVIRONMENT 🧪
echo.
echo 🔑 IMPORTANT: Make sure you have added your API keys!
echo    Edit backend\.env and add your OpenAI API key
echo.
echo 🚀 Starting servers...
echo.
echo.
echo ⚡ Starting Backend ^(Python/FastAPI^)...
echo start "OpenClipREDUX Backend" cmd /k "echo 🔧 Backend Server Starting... && echo. && cd backend && call venv\Scripts\activate && echo ✅ Virtual environment activated && echo ⚡ Starting FastAPI server on port 8000... && python main.py"
echo.
echo ⏳ Waiting for backend to initialize...
echo timeout /t 10 /nobreak ^> nul
echo.
echo ⚡ Starting Frontend ^(React/Vite^)...
echo start "OpenClipREDUX Frontend" cmd /k "echo 🎨 Frontend Server Starting... && echo. && echo ⚡ Starting Vite dev server on port 5173... && npm run dev"
echo.
echo timeout /t 3 /nobreak ^> nul
echo.
echo ✅ OpenClipREDUX Testing Environment Started!
echo ================================================
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000  
echo    API Docs: http://localhost:8000/api/docs
echo.
echo 📱 For mobile testing:
for /f "tokens=2 delims=:" %%i in ^('ipconfig ^| find "IPv4" ^| find /v "127.0.0.1"'^) do echo    Mobile: http:%%i:5173
echo.
echo 👥 TESTING CHECKLIST:
echo    ✓ Create account or login
echo    ✓ Add API keys in Settings
echo    ✓ Upload a test video
echo    ✓ Run AI analysis
echo    ✓ Check generated clips
echo.
echo 🎯 Test different scenarios:
echo    • Different video types ^(MP4, MOV^)
echo    • Various analysis prompts
echo    • Mobile responsiveness
echo    • Error handling
echo.
echo Press any key to open the app in your browser...
echo pause ^> nul
echo start http://localhost:5173
echo.
echo 🔄 To restart: Close both server windows and run this script again
echo 🛑 To stop: Close both server windows
echo.
echo Happy Testing! 🚀
echo.
echo Press any key to close this launcher...
echo pause ^> nul
) > START-TESTING.bat

REM Create API key setup helper
(
echo @echo off
echo title OpenClipREDUX - API Key Setup Helper
echo color 0E
echo.
echo 🔑 API Key Setup Helper
echo =====================
echo.
echo This will help you set up your AI provider API keys.
echo.
echo 📋 You need at least ONE of these:
echo.
echo 1. OpenAI API Key ^(RECOMMENDED^)
echo    • Best for general video analysis
echo    • Get it: https://platform.openai.com/api-keys
echo    • Costs: ~$0.01-0.05 per video analysis
echo.
echo 2. Google Gemini API Key ^(OPTIONAL^)
echo    • Alternative AI provider
echo    • Get it: https://makersuite.google.com/app/apikey
echo    • Often has free tier
echo.
echo 3. Anthropic Claude API Key ^(OPTIONAL^)
echo    • Another alternative provider
echo    • Get it: https://console.anthropic.com/
echo.
pause
echo.
echo 📝 Current API Key Status:
echo.
findstr /C:"OPENAI_API_KEY=" backend\.env ^> nul
if errorlevel 1 ^(
    echo ❌ OpenAI: Not configured
^) else ^(
    for /f "tokens=2 delims== " %%i in ^('findstr "OPENAI_API_KEY=" backend\.env'^) do ^(
        if "%%i"=="" ^(
            echo ❌ OpenAI: Empty
        ^) else ^(
            echo ✅ OpenAI: Configured
        ^)
    ^)
^)
echo.
echo 🛠️  To add your API keys:
echo    1. Open: backend\.env in any text editor
echo    2. Find the line: OPENAI_API_KEY=""
echo    3. Add your key: OPENAI_API_KEY="sk-your-key-here"
echo    4. Save the file
echo    5. Restart the application
echo.
echo 💡 Example:
echo    OPENAI_API_KEY="sk-proj-abc123def456..."
echo.
echo 🚨 Keep your API keys SECRET! Never share them publicly.
echo.
echo Press any key to open the config file...
pause ^> nul
start notepad backend\.env
echo.
echo ✅ Edit the file, save it, then run START-TESTING.bat
echo.
pause
) > setup-api-keys.bat

REM Create comprehensive tester guide
(
echo # 🧪 OpenClipREDUX - Ultimate Testing Guide
echo.
echo Welcome! You're about to test an AI-powered video clip generation tool. This guide will help you test it thoroughly.
echo.
echo ## 🚀 Quick Start ^(2 minutes^)
echo.
echo 1. **Run the app**: Double-click `START-TESTING.bat`
echo 2. **Wait**: Two command windows will open ^(backend + frontend^)
echo 3. **Open browser**: Go to http://localhost:5173
echo 4. **Create account**: Register with any email/password
echo 5. **Add API key**: Settings → Add your OpenAI API key
echo 6. **Test upload**: Upload a short video and analyze it
echo.
echo ## 🔑 Getting API Keys
echo.
echo ### OpenAI ^(Recommended^)
echo - **Where**: https://platform.openai.com/api-keys
echo - **Cost**: ~$0.01-0.05 per video analysis
echo - **Best for**: General video analysis
echo.
echo ### Google Gemini ^(Alternative^)
echo - **Where**: https://makersuite.google.com/app/apikey
echo - **Cost**: Often free tier available
echo - **Good for**: Basic analysis
echo.
echo ## 📋 Complete Testing Checklist
echo.
echo ### ✅ Account & Setup
echo - [ ] Register new account
echo - [ ] Login works correctly
echo - [ ] Settings page loads
echo - [ ] API key can be added
echo - [ ] User profile displays
echo.
echo ### ✅ Project Management
echo - [ ] Create new project
echo - [ ] Project appears in list
echo - [ ] Project details view
echo - [ ] Delete project works
echo.
echo ### ✅ Video Upload
echo - [ ] Small file ^(^<50MB^) uploads quickly
echo - [ ] Large file ^(^>100MB^) uploads ^(if you have one^)
echo - [ ] Different formats: MP4, MOV, AVI
echo - [ ] Progress indicator works
echo - [ ] Upload errors handled gracefully
echo - [ ] Video preview appears
echo.
echo ### ✅ AI Analysis
echo - [ ] Analysis starts correctly
echo - [ ] Progress indicator during analysis
echo - [ ] Multiple clips generated
echo - [ ] Clips have accurate timestamps
echo - [ ] Clip descriptions make sense
echo - [ ] Can play clips in interface
echo.
echo ### ✅ User Interface
echo - [ ] Mobile-responsive design
echo - [ ] Dark/light mode ^(if available^)
echo - [ ] Navigation works smoothly
echo - [ ] Loading states are clear
echo - [ ] Error messages are helpful
echo - [ ] No obvious bugs or glitches
echo.
echo ### ✅ Performance
echo - [ ] App loads quickly
echo - [ ] Video upload speed acceptable
echo - [ ] Analysis completes in reasonable time
echo - [ ] No browser crashes or freezes
echo - [ ] Memory usage reasonable
echo.
echo ## 🎬 Test Scenarios
echo.
echo ### Scenario 1: Content Creator
echo **Goal**: Extract social media clips from a longer video
echo.
echo 1. Upload a 5-10 minute video
echo 2. Use prompt: "Find the most engaging 30-60 second clips suitable for social media"
echo 3. Check if clips are actually engaging
echo 4. Verify clip lengths are appropriate
echo.
echo ### Scenario 2: Educational Content
echo **Goal**: Extract key learning moments
echo.
echo 1. Upload educational/tutorial content
echo 2. Use prompt: "Find moments where key concepts are explained clearly"
echo 3. Check if extracted clips contain complete explanations
echo 4. Verify clips have educational value
echo.
echo ### Scenario 3: Entertainment
echo **Goal**: Find funny or interesting moments
echo.
echo 1. Upload entertainment content
echo 2. Use prompt: "Find the funniest moments and unexpected reactions"
echo 3. Check if clips are actually funny/interesting
echo 4. Test different entertainment types
echo.
echo ## 🐛 Things to Watch For
echo.
echo ### 🚨 Critical Issues
echo - App crashes or won't start
echo - Cannot upload videos at all
echo - Analysis fails completely
echo - Login/registration broken
echo.
echo ### ⚠️  Important Issues  
echo - Slow upload speeds
echo - Analysis takes too long ^(^>5 minutes^)
echo - Generated clips are poor quality
echo - Interface is confusing
echo.
echo ### 💡 Enhancement Opportunities
echo - Missing features you'd expect
echo - Workflow improvements
echo - UI/UX suggestions
echo - Performance optimizations
echo.
echo ## 📊 Performance Benchmarks
echo.
echo ### Good Performance:
echo - **Upload**: 1MB/second or faster
echo - **Analysis**: 2-5 minutes for 10-minute video
echo - **Page Load**: ^<3 seconds
echo - **UI Response**: Instant clicks
echo.
echo ### Concerning Performance:
echo - **Upload**: ^<500KB/second
echo - **Analysis**: ^>10 minutes for 10-minute video  
echo - **Page Load**: ^>10 seconds
echo - **UI Response**: Laggy interactions
echo.
echo ## 📝 Feedback Template
echo.
echo When reporting issues:
echo.
echo **Bug Report:**
echo ```
echo What I was doing: [uploading video / running analysis / etc]
echo What happened: [describe the issue]
echo What I expected: [what should have happened]
echo Browser: [Chrome / Firefox / Safari / Edge]
echo Error message: [if any]
echo Can reproduce: [Yes/No]
echo ```
echo.
echo **Feature Feedback:**
echo ```
echo Overall rating: [1-10]
echo Would you use this: [Yes/No/Maybe]
echo Best feature: [what worked well]
echo Most confusing: [what was unclear]
echo Missing feature: [what you expected but didn't find]
echo Improvement idea: [how to make it better]
echo ```
echo.
echo ## 🎯 Success Criteria
echo.
echo This app is ready for wider release if:
echo.
echo ✅ **Core Features Work**
echo - Video upload is reliable
echo - AI analysis produces good results
echo - Generated clips are accurate and useful
echo.
echo ✅ **User Experience is Smooth**
echo - Interface is intuitive
echo - Performance is acceptable
echo - Errors are handled gracefully
echo.
echo ✅ **Quality Results**
echo - AI-generated clips make sense
echo - Timing is accurate
echo - Descriptions are helpful
echo.
echo ## 🆘 Getting Help
echo.
echo If you run into issues:
echo.
echo 1. **Check the command windows** - Look for error messages
echo 2. **Try refreshing the browser** - Sometimes fixes temporary issues
echo 3. **Restart the app** - Close command windows and run START-TESTING.bat again
echo 4. **Check API keys** - Run setup-api-keys.bat to verify
echo 5. **Contact support** - Share screenshots and error messages
echo.
echo ---
echo.
echo **Thank you for testing OpenClipREDUX! 🚀**
echo.
echo Your feedback is invaluable for making this tool better.
echo Test thoroughly, break things if you can, and let us know what you think!
) > ULTIMATE-TESTING-GUIDE.md

echo.
echo 🎯 STEP 5: Final Configuration
echo ==============================

echo Creating desktop shortcuts...
echo Set oWS = WScript.CreateObject("WScript.Shell"^) > create_shortcut.vbs
echo sLinkFile = "%USERPROFILE%\Desktop\OpenClipREDUX Testing.lnk" >> create_shortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile^) >> create_shortcut.vbs
echo oLink.TargetPath = "%CD%\START-TESTING.bat" >> create_shortcut.vbs
echo oLink.WorkingDirectory = "%CD%" >> create_shortcut.vbs
echo oLink.Description = "Start OpenClipREDUX Testing Environment" >> create_shortcut.vbs
echo oLink.IconLocation = "%CD%\START-TESTING.bat,0" >> create_shortcut.vbs
echo oLink.Save >> create_shortcut.vbs
cscript create_shortcut.vbs >nul 2>&1
del create_shortcut.vbs

echo Checking configuration...
if exist "backend\.env" (
    findstr /C:"OPENAI_API_KEY=" backend\.env | findstr /V /C:"OPENAI_API_KEY=\"\"" >nul
    if errorlevel 1 (
        echo ⚠️  API keys need to be configured
    ) else (
        echo ✅ API keys configured
    )
) else (
    echo ❌ Configuration file missing
)

echo.
echo 🎉 SETUP COMPLETE!
echo ==================
echo.
echo 📋 What's Ready:
echo ✅ Backend server configured
echo ✅ Frontend app prepared  
echo ✅ Database initialized
echo ✅ Launch scripts created
echo ✅ Testing guide written
echo ✅ Desktop shortcut added
echo.
echo 🔑 NEXT STEP: Configure API Keys
echo.
echo You MUST add your API keys before testing:
echo 1. Run: setup-api-keys.bat
echo 2. Add your OpenAI API key to backend\.env
echo 3. Save the file
echo.
echo 🚀 START TESTING:
echo • Run: START-TESTING.bat
echo • Or: Double-click desktop shortcut
echo • Or: Share this folder with friends
echo.
echo 📚 SHARE WITH TESTERS:
echo • Give them this entire folder
echo • Tell them to run START-TESTING.bat
echo • Share ULTIMATE-TESTING-GUIDE.md
echo.
echo 🌐 Testing URLs:
echo • App: http://localhost:5173
echo • API: http://localhost:8000
echo • Docs: http://localhost:8000/api/docs
echo.
echo 🎯 Ready to get feedback from your friends!
echo.
pause

echo.
echo 🚨 IMPORTANT REMINDER:
echo.
echo Before anyone can test:
echo 1. Add API keys using setup-api-keys.bat
echo 2. Test it yourself first with START-TESTING.bat
echo 3. Then share with friends!
echo.
echo Happy testing! 🎉
echo.
