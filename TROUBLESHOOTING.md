# OpenClip Pro - Troubleshooting Guide

If you're experiencing issues with the full backend setup, this guide will help you resolve common problems.

## Common Issues

### Failed to Install Backend Dependencies

This is the most common issue and typically happens because:

1. **Missing Python packages**: The full backend requires many Python packages that might not be available or compatible with your system.
2. **Conflicting dependencies**: Some packages might conflict with existing packages on your system.
3. **Installation permissions**: You might not have sufficient permissions to install the packages.

### Solutions

#### Option 1: Use the Simplified Backend (Recommended)

When the batch file asks if you want to use the simplified backend, select "Y". This will:

1. Install only the essential dependencies (fastapi, uvicorn, python-multipart)
2. Start the simplified backend (simple_server.py)
3. Provide all basic functionality needed for testing the frontend

#### Option 2: Manual Installation

If you want to try installing the full dependencies manually:

1. Create a Python virtual environment:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On macOS/Linux
   ```

2. Install the dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the backend:
   ```
   python app.py
   ```

#### Option 3: Install Only Required Packages

If you want to use specific features of the full backend but not all:

1. Install the base packages:
   ```
   pip install fastapi uvicorn python-multipart pydantic
   ```

2. Install only the packages you need:
   ```
   pip install opencv-python pillow  # For video processing
   pip install openai google-generativeai anthropic  # For AI providers
   ```

## Other Common Issues

### Port Already in Use

If you see an error like `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8001)`:

1. Stop any existing Python processes:
   ```
   taskkill /f /im python.exe  # On Windows
   pkill -f python  # On macOS/Linux
   ```

2. Change the port in the batch file (edit `start_openclip_pro.bat`):
   ```
   set PORT=8002  # Change from 8001 to 8002
   ```

### Python Not Found

If Python is not in your PATH:

1. Install Python from [python.org](https://python.org)
2. Make sure to check "Add Python to PATH" during installation
3. Restart your computer

### Node.js Not Found

If Node.js is not in your PATH:

1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Make sure to select the option to add to PATH during installation
3. Restart your computer

## Getting Help

If you're still experiencing issues:

1. Check the console output for specific error messages
2. Look for error logs in the backend console
3. Try the simplified backend with `start_servers.bat` 