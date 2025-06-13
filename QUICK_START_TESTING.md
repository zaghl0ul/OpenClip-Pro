# OpenClip Pro - Quick Testing Guide

🚀 **Get your app to a testable state in 5 minutes!**

## ✅ Pre-Flight Checklist

### Required Software
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed  
- ✅ Git installed

### Quick Verification
```bash
python --version  # Should show 3.8+
node --version    # Should show 16+
npm --version     # Should show 8+
```

## 🚀 Lightning Setup (5 Minutes)

### Step 1: Backend Setup (2 minutes)
```bash
# Navigate to project directory
cd C:\Users\slimeto\Desktop\OpenClipREDUX

# Set up backend
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create basic .env file (if not exists)
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# Start backend
python main.py
```

The backend should start on `http://localhost:8000`. You'll see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 2: Frontend Setup (2 minutes)
Open a **new terminal** and run:
```bash
cd C:\Users\slimeto\Desktop\OpenClipREDUX

# Install frontend dependencies
npm install

# Start frontend development server
npm run dev
```

The frontend should start on `http://localhost:5173`.

### Step 3: Test Login (1 minute)
1. Open `http://localhost:5173` in your browser
2. Click "Sign In" 
3. Use demo credentials:
   - **Email:** `admin@openclippro.com`
   - **Password:** `admin123!`
4. Click "Sign In"

✅ **You should now be logged in and see the dashboard!**

---

## 🔧 Troubleshooting Common Issues

### "Cannot connect to backend" Error
**Problem:** Frontend can't reach the backend server.

**Solutions:**
1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy"}
   ```

2. **Check port availability:**
   ```bash
   netstat -an | findstr :8000  # Windows
   # lsof -i :8000  # Linux/Mac
   ```

3. **Restart backend:**
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   python main.py
   ```

### "Login Failed" Error
**Problem:** Authentication is not working.

**Solutions:**
1. **Check backend logs** for error messages
2. **Try creating a new account** instead of using demo account
3. **Clear browser storage:**
   - Open Developer Tools (F12)
   - Go to Application > Storage > Clear storage
   - Refresh page

### "Module not found" Error
**Problem:** Missing dependencies.

**Solutions:**
1. **Backend dependencies:**
   ```bash
   cd backend
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Frontend dependencies:**
   ```bash
   npm install
   ```

### Database Issues
**Problem:** Database connection or initialization errors.

**Solutions:**
1. **Initialize database:**
   ```bash
   cd backend
   venv\Scripts\activate
   python -c "from utils.db_manager import init_db; init_db()"
   ```

2. **Reset database (if needed):**
   ```bash
   # Delete database file
   rm openclip.db  # Linux/Mac
   del openclip.db  # Windows
   
   # Reinitialize
   python main.py
   ```

---

## 🧪 Advanced Testing

### Use Built-in Testing Panel
1. Login to the application
2. Go to **Settings** page
3. Click **Backend** tab
4. Click **"Run Authentication Tests"** button
5. Review test results

### Manual API Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","full_name":"Test User"}'

# Test login  
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@openclippro.com&password=admin123!"
```

### Browser Console Testing
Open Developer Tools (F12) and run:
```javascript
// Test authentication service
window.testAuth = async () => {
  const response = await fetch('http://localhost:8000/health');
  console.log('Backend Status:', response.ok ? 'OK' : 'Failed');
};
testAuth();
```

---

## 📝 Feature Testing Checklist

### Authentication Flow
- [ ] **Registration:** Create new account works
- [ ] **Login:** Demo account login works
- [ ] **Login:** Invalid credentials show error
- [ ] **Logout:** Logout clears session
- [ ] **Password validation:** Strong password requirements enforced

### Application Features
- [ ] **Navigation:** All menu items work
- [ ] **Dashboard:** Loads without errors
- [ ] **Settings:** Can change backend URL
- [ ] **Theme:** Dark/light mode toggle works
- [ ] **Responsive:** Works on mobile/tablet

### Backend API
- [ ] **Health check:** `/health` returns 200
- [ ] **Registration:** `/api/auth/register` works
- [ ] **Login:** `/api/auth/login` returns token
- [ ] **Protected routes:** `/api/auth/me` requires auth
- [ ] **CORS:** Frontend can make requests

---

## 🚨 Emergency Recovery

### Complete Reset
If everything is broken, start fresh:

```bash
# Stop all servers (Ctrl+C in terminals)

# Backend reset
cd backend
rm -rf venv __pycache__ *.db  # Linux/Mac
# rmdir /s venv & del *.db  # Windows (PowerShell)

python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py

# Frontend reset (new terminal)
cd ..
rm -rf node_modules package-lock.json  # Linux/Mac
# rmdir /s node_modules & del package-lock.json  # Windows

npm install
npm run dev
```

### Quick Health Check Script
Save this as `health-check.js`:

```javascript
const checkHealth = async () => {
    try {
        const health = await fetch('http://localhost:8000/health');
        const frontend = await fetch('http://localhost:5173');
        
        console.log('Backend:', health.ok ? '✅' : '❌');
        console.log('Frontend:', frontend.ok ? '✅' : '❌');
        
        if (health.ok && frontend.ok) {
            console.log('🎉 System is ready for testing!');
        }
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
    }
};

checkHealth();
```

Run with: `node health-check.js`

---

## 🎯 Success Criteria

Your app is ready for testing when:

✅ **Backend running** on http://localhost:8000  
✅ **Frontend running** on http://localhost:5173  
✅ **Login works** with demo account  
✅ **Dashboard loads** after login  
✅ **No console errors** in browser dev tools  

---

## 📞 Need Help?

### Log Locations
- **Backend logs:** Check terminal output where you ran `python main.py`
- **Frontend logs:** Browser Developer Tools > Console tab
- **Network issues:** Browser Developer Tools > Network tab

### Common Commands
```bash
# Check if ports are in use
netstat -an | findstr ":8000\|:5173"  # Windows
# lsof -i :8000,5173  # Linux/Mac

# Kill processes on ports (if needed)
taskkill /f /im python.exe  # Windows (kills all Python)
# kill $(lsof -t -i:8000)  # Linux/Mac (kills process on port 8000)

# Restart everything
# Stop servers (Ctrl+C), then:
cd backend && python main.py &
cd .. && npm run dev
```

🎉 **Happy Testing!** Your OpenClip Pro should now be fully functional and ready for comprehensive testing.
