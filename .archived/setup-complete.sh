#!/bin/bash

# OpenClip Pro - Complete Setup and Testing Script
# This script will get your app to a fully testable state

echo "🚀 OpenClip Pro - Complete Setup & Testing"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Checking project structure..."

# 1. Install frontend dependencies
print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# 2. Check backend setup
print_status "Setting up backend..."

# Navigate to backend directory
if [ -d "backend" ]; then
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    print_status "Installing backend dependencies..."
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        source venv/Scripts/activate
    else
        # Linux/Mac
        source venv/bin/activate
    fi
    
    if pip install -r requirements.txt; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your configuration"
        else
            print_warning ".env.example not found. Creating basic .env file..."
            cat > .env << EOL
# Database
DATABASE_URL=sqlite:///./openclip.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
FRONTEND_URL=http://localhost:5173

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=500000000

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@openclippro.com

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
EOL
        fi
    fi
    
    # Initialize database
    print_status "Initializing database..."
    if python -c "from utils.db_manager import init_db; init_db()" 2>/dev/null; then
        print_success "Database initialized"
    else
        print_warning "Database initialization may have failed, but continuing..."
    fi
    
    cd ..
else
    print_error "Backend directory not found"
    exit 1
fi

# 3. Create test script
print_status "Creating test utilities..."

cat > test-auth.js << 'EOL'
// Quick authentication test script
const testAuth = async () => {
    const baseUrl = 'http://localhost:8000';
    
    console.log('🔍 Testing OpenClip Pro Authentication...\n');
    
    // Test 1: Health Check
    console.log('1. Testing backend health...');
    try {
        const healthResponse = await fetch(`${baseUrl}/health`);
        if (healthResponse.ok) {
            console.log('✅ Backend is running and healthy');
        } else {
            console.log('❌ Backend health check failed');
            return;
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend. Is it running?');
        console.log('   Run: cd backend && python main.py');
        return;
    }
    
    // Test 2: Registration
    console.log('\n2. Testing user registration...');
    const testUser = {
        email: `test${Date.now()}@example.com`,
        password: 'TestPass123!',
        full_name: 'Test User'
    };
    
    try {
        const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser),
        });
        
        if (registerResponse.ok) {
            console.log('✅ User registration successful');
        } else {
            const errorData = await registerResponse.json();
            console.log('❌ Registration failed:', errorData.detail);
        }
    } catch (error) {
        console.log('❌ Registration request failed:', error.message);
    }
    
    // Test 3: Login
    console.log('\n3. Testing user login...');
    try {
        const loginData = new URLSearchParams();
        loginData.append('username', testUser.email);
        loginData.append('password', testUser.password);
        
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: loginData,
        });
        
        if (loginResponse.ok) {
            const loginResult = await loginResponse.json();
            console.log('✅ Login successful');
            console.log('   Token received:', loginResult.access_token ? 'Yes' : 'No');
            console.log('   User data:', loginResult.user ? 'Yes' : 'No');
            
            // Test 4: Protected endpoint
            console.log('\n4. Testing protected endpoint...');
            const protectedResponse = await fetch(`${baseUrl}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${loginResult.access_token}`,
                },
            });
            
            if (protectedResponse.ok) {
                console.log('✅ Protected endpoint access successful');
            } else {
                console.log('❌ Protected endpoint access failed');
            }
        } else {
            const errorData = await loginResponse.json();
            console.log('❌ Login failed:', errorData.detail);
        }
    } catch (error) {
        console.log('❌ Login request failed:', error.message);
    }
    
    // Test with demo account
    console.log('\n5. Testing demo account...');
    try {
        const demoLoginData = new URLSearchParams();
        demoLoginData.append('username', 'admin@openclippro.com');
        demoLoginData.append('password', 'admin123!');
        
        const demoLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: demoLoginData,
        });
        
        if (demoLoginResponse.ok) {
            console.log('✅ Demo account login successful');
        } else {
            console.log('❌ Demo account login failed');
        }
    } catch (error) {
        console.log('❌ Demo account test failed:', error.message);
    }
    
    console.log('\n🏁 Authentication tests completed!');
};

// Run tests if this is Node.js, otherwise export for browser
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    testAuth();
} else {
    // Browser environment
    window.testAuth = testAuth;
}
EOL

# 4. Create startup script
print_status "Creating startup scripts..."

cat > start-dev.sh << 'EOL'
#!/bin/bash

echo "🚀 Starting OpenClip Pro Development Environment"

# Function to cleanup on exit
cleanup() {
    echo "Shutting down..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 OpenClip Pro is starting up!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait
EOL

chmod +x start-dev.sh

# 5. Create Windows batch file
cat > start-dev.bat << 'EOL'
@echo off
echo 🚀 Starting OpenClip Pro Development Environment

cd backend
call venv\Scripts\activate.bat
start "Backend" python main.py
cd ..

timeout /t 3 > nul

echo Starting frontend...
start "Frontend" npm run dev

echo.
echo 🎉 OpenClip Pro is starting up!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo Close the terminal windows to stop the servers
EOL

# 6. Create testing checklist
cat > TESTING_CHECKLIST.md << 'EOL'
# OpenClip Pro - Testing Checklist

## Quick Start
1. Run `./start-dev.sh` (Linux/Mac) or `start-dev.bat` (Windows)
2. Open http://localhost:5173 in your browser
3. Try logging in with demo account: `admin@openclippro.com` / `admin123!`

## Manual Testing Steps

### Authentication Flow
- [ ] Registration with new account works
- [ ] Login with valid credentials works  
- [ ] Login with invalid credentials shows error
- [ ] Password requirements are enforced
- [ ] Logout works properly
- [ ] Token refresh works (test by waiting 30 minutes)

### Application Flow
- [ ] Dashboard loads after login
- [ ] Navigation between pages works
- [ ] User profile shows correct information
- [ ] Settings page loads and saves preferences
- [ ] Backend connection status shows correctly

### Error Handling
- [ ] Offline mode works when backend is down
- [ ] Network errors show user-friendly messages
- [ ] Form validation prevents invalid submissions
- [ ] Loading states show during operations

## Automated Tests
Run `node test-auth.js` to test authentication endpoints.

## Common Issues & Solutions

### "Cannot connect to backend"
- Ensure backend is running: `cd backend && python main.py`
- Check if port 8000 is available
- Verify .env file exists in backend directory

### "Authentication failed"
- Try creating a new account
- Check browser console for errors
- Verify backend logs for authentication errors

### "App won't load"
- Clear browser cache and localStorage
- Check browser console for JavaScript errors
- Ensure frontend dev server is running on port 5173

## Backend Endpoints to Test
- GET /health - Health check
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Logout
- POST /api/auth/refresh - Refresh token

## Frontend Features to Test
- Responsive design on different screen sizes
- Dark/light mode switching
- Form validation and error messages
- Loading states and animations
- Navigation and routing
EOL

print_success "Setup completed successfully!"
print_status "Next steps:"
echo "  1. Review and edit backend/.env if needed"
echo "  2. Run './start-dev.sh' to start both servers"
echo "  3. Open http://localhost:5173 in your browser"
echo "  4. Login with: admin@openclippro.com / admin123!"
echo "  5. Check TESTING_CHECKLIST.md for comprehensive testing"

print_warning "Note: If you encounter issues, check the backend logs and browser console for errors."
