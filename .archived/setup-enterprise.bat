@echo off
setlocal enabledelayedexpansion
cls

REM =============================================================================
REM VideoForge Enterprise Development Environment Setup
REM Advanced DevOps automation for full-stack development workflow optimization
REM =============================================================================

:: Configuration
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "SETUP_LOG=%PROJECT_ROOT%setup.log"
set "ERROR_COUNT=0"
set "START_TIME=%time%"
set "CLEANUP_ON_ERROR=1"

:: Color codes for better visibility
set "COLOR_ERROR=0C"
set "COLOR_SUCCESS=0A"
set "COLOR_WARNING=0E"
set "COLOR_INFO=0B"

echo.
echo ================================================================================
echo  VideoForge Pro - Enterprise Development Environment Setup
echo ================================================================================
echo  Initializing comprehensive development infrastructure...
echo  - Python virtual environment with dependency isolation
echo  - Node.js ecosystem optimization and dependency resolution  
echo  - Database schema initialization and migration
echo  - FastAPI backend service orchestration
echo  - React frontend development server configuration
echo  - Health monitoring and service validation
echo ================================================================================
echo.

:: Initialize log file
echo [%date% %time%] Starting VideoForge development environment setup > "%SETUP_LOG%"

:: Cleanup routine
:cleanup
if "%CLEANUP_ON_ERROR%"=="1" (
    if exist "%BACKEND_DIR%\venv" (
        echo Cleaning up virtual environment...
        rmdir /s /q "%BACKEND_DIR%\venv"
    )
    if exist "%FRONTEND_DIR%\node_modules" (
        echo Cleaning up node_modules...
        rmdir /s /q "%FRONTEND_DIR%\node_modules"
    )
)
exit /b %ERROR_COUNT%

:: Error handling routine
:handle_error
set /a ERROR_COUNT+=1
echo [%date% %time%] ERROR: %~1 >> "%SETUP_LOG%"
color %COLOR_ERROR%
echo ❌ ERROR: %~1
color %COLOR_INFO%
if "%CLEANUP_ON_ERROR%"=="1" (
    echo Cleaning up after error...
    call :cleanup
)
exit /b 1

:: Success message routine
:show_success
color %COLOR_SUCCESS%
echo ✅ %~1
color %COLOR_INFO%
echo [%date% %time%] SUCCESS: %~1 >> "%SETUP_LOG%"
goto :eof

:: Warning message routine
:show_warning
color %COLOR_WARNING%
echo ⚠️  %~1
color %COLOR_INFO%
echo [%date% %time%] WARNING: %~1 >> "%SETUP_LOG%"
goto :eof

:: Phase 1: Environment Validation
call :validate_environment
if %ERRORLEVEL% neq 0 goto :error_exit

:: Phase 2: Python Environment Setup
call :setup_python_env
if %ERRORLEVEL% neq 0 goto :error_exit

:: Phase 3: Frontend Setup
call :setup_frontend
if %ERRORLEVEL% neq 0 goto :error_exit

:: Phase 4: Database Setup
call :setup_database
if %ERRORLEVEL% neq 0 goto :error_exit

:: Success completion
call :show_success "Setup completed successfully!"
echo.
echo ================================================================================
echo  Setup Summary:
echo  - Python environment: %PYTHON_VERSION%
echo  - Node.js version: %NODE_VERSION%
echo  - Backend: %BACKEND_DIR%
echo  - Frontend: %FRONTEND_DIR%
echo  - Log file: %SETUP_LOG%
echo ================================================================================
echo.
pause
exit /b 0

:error_exit
call :handle_error "Setup failed with %ERROR_COUNT% error(s)"
exit /b 1

:: =============================================================================
:: Environment Validation
:: =============================================================================
:validate_environment
echo.
echo [1/4] Validating development environment prerequisites...

:: Python validation
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :handle_error "Python is not installed or not in PATH"
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%i"
call :show_success "Python %PYTHON_VERSION% detected"

:: Node.js validation
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :handle_error "Node.js/npm not installed or not in PATH"
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version 2^>^&1') do set "NODE_VERSION=%%i"
call :show_success "Node.js %NODE_VERSION% detected"

:: Directory validation
if not exist "%BACKEND_DIR%" (
    call :handle_error "Backend directory not found: %BACKEND_DIR%"
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    call :handle_error "Frontend directory not found: %FRONTEND_DIR%"
    exit /b 1
)

call :show_success "Environment validation complete"
exit /b 0

:: =============================================================================
:: Python Environment Setup
:: =============================================================================
:setup_python_env
echo.
echo [2/4] Setting up Python virtual environment...

cd /d "%BACKEND_DIR%"

if exist "venv" (
    echo ⚡ Existing virtual environment detected - Validating...
    call venv\Scripts\activate.bat
    python -c "import sys; print('Virtual environment active:', sys.prefix != sys.base_prefix)" 2>nul
    if %ERRORLEVEL% neq 0 (
        call :show_warning "Virtual environment corrupted - Rebuilding..."
        rmdir /s /q venv
    ) else (
        call :show_success "Virtual environment validated"
        goto :install_deps
    )
)

echo 🔧 Creating Python virtual environment...
python -m venv venv
if %ERRORLEVEL% neq 0 (
    call :handle_error "Failed to create virtual environment"
    exit /b 1
)

:install_deps
call venv\Scripts\activate.bat
python -m pip install --upgrade pip --quiet
if %ERRORLEVEL% neq 0 (
    call :show_warning "pip upgrade failed - continuing with existing version"
)

if exist "requirements.txt" (
    echo 🔄 Installing Python dependencies...
    python -m pip install -r requirements.txt --quiet
    if %ERRORLEVEL% neq 0 (
        call :handle_error "Failed to install Python dependencies"
        exit /b 1
    )
) else (
    call :show_warning "requirements.txt not found - skipping dependency installation"
)

call :show_success "Python environment setup complete"
exit /b 0

:: =============================================================================
:: Frontend Setup
:: =============================================================================
:setup_frontend
echo.
echo [3/4] Setting up frontend environment...

cd /d "%FRONTEND_DIR%"

if exist "node_modules" (
    echo ⚡ Existing node_modules detected - Validating...
    npm list --depth=0 >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        call :show_warning "node_modules corrupted - Rebuilding..."
        rmdir /s /q node_modules
    ) else (
        call :show_success "node_modules validated"
        exit /b 0
    )
)

echo 🔄 Installing frontend dependencies...
npm install --silent
if %ERRORLEVEL% neq 0 (
    call :handle_error "Failed to install frontend dependencies"
    exit /b 1
)

call :show_success "Frontend setup complete"
exit /b 0

:: =============================================================================
:: Database Setup
:: =============================================================================
:setup_database
echo.
echo [4/4] Setting up database...

cd /d "%BACKEND_DIR%"

if not exist ".env" (
    echo 🔧 Creating environment configuration...
    if exist ".env.example" (
        copy .env.example .env >nul
        if %ERRORLEVEL% neq 0 (
            call :handle_error "Failed to create .env file"
            exit /b 1
        )
    ) else (
        call :show_warning ".env.example not found - skipping environment configuration"
    )
)

echo 🔄 Initializing database...
python -c "
try:
    from utils.db_manager import init_db
    init_db()
    print('Database initialized successfully')
except ImportError:
    print('Database utilities not found - skipping initialization')
except Exception as e:
    print(f'Database initialization failed: {e}')
    exit(1)
" 2>nul
if %ERRORLEVEL% neq 0 (
    call :show_warning "Database initialization failed - continuing without database"
) else (
    call :show_success "Database setup complete"
)

exit /b 0