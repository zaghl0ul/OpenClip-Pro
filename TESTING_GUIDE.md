# 🧪 OpenClipREDUX Testing Guide

Welcome testers! This guide will help you test the OpenClipREDUX application.

## 🚀 Quick Start

1. **Double-click `launch-app.bat`** - This starts both backend and frontend
2. **Wait for both servers to start** - You'll see two command windows
3. **Open http://localhost:5173** in your browser

## 🔑 First Time Setup

### 1. Configure API Keys
Before testing, you MUST add your AI provider API keys:

1. Open `backend\.env` file in a text editor
2. Add your API keys:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   GEMINI_API_KEY=your-google-api-key-here
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```

### 2. Get API Keys
- **OpenAI**: https://platform.openai.com/api-keys
- **Google Gemini**: https://makersuite.google.com/app/apikey  
- **Anthropic**: https://console.anthropic.com/

### 3. Register Account
1. Go to the app homepage
2. Click "Sign Up" 
3. Create an account
4. Go to Settings to add your API keys

## 🎬 Testing Workflows

### Test 1: Video Upload and Analysis
1. **Create New Project**
   - Click "New Project"
   - Give it a name and description
   - Choose "Upload Video"

2. **Upload Video**
   - Drag and drop a video file (MP4, MOV, AVI)
   - Wait for upload to complete
   - Verify video details are shown

3. **Run AI Analysis**
   - Enter a custom prompt like:
     - "Find the most engaging 30-second clips"
     - "Identify moments with high energy"
     - "Extract clips for social media"
   - Select AI provider (OpenAI recommended)
   - Click "Analyze"
   - Wait for clips to be generated

4. **Review Results**
   - Check generated clips
   - Play clips in the interface
   - Verify clip timing and descriptions

### Test 2: YouTube Processing
1. Create a new "YouTube" project
2. Paste a YouTube URL
3. Test analysis on downloaded content
4. Verify clips are extracted properly

### Test 3: Settings and Management
1. Test API key management
2. Check project limits and usage
3. Verify user profile settings
4. Test project deletion

## 🐛 What to Look For

### ✅ Expected Behavior
- Smooth video upload process
- Clear progress indicators
- Accurate AI analysis results
- Responsive user interface
- Proper error handling

### ❌ Issues to Report
- Upload failures or errors
- Analysis not working
- Interface bugs or crashes
- Slow performance
- Confusing user experience

## 📊 Test with Different Content

### Video Types to Test
- **Short clips** (1-2 minutes) - Basic functionality
- **Medium videos** (5-10 minutes) - Standard use case  
- **Long content** (20+ minutes) - Performance testing
- **Different formats** - MP4, MOV, AVI compatibility

### Analysis Prompts to Try
- "Find funny moments and reactions"
- "Extract educational segments with clear explanations"
- "Identify highlights for sports content"
- "Create clips for social media marketing"
- "Find emotional or impactful moments"

## 🔧 Troubleshooting

### Common Issues

**"No API key configured"**
- Edit `backend\.env` with your API keys
- Restart the backend server
- Add keys in the app settings

**"Upload failed"**
- Check video file size (max 5GB)
- Verify video format is supported
- Check internet connection

**"Analysis not working"**
- Verify API key is valid
- Check API provider rate limits
- Try a different AI model

**"Can't access app"**
- Ensure both servers are running
- Check ports 8000 and 5173 are not blocked
- Try refreshing the browser

## 📝 Feedback Template

When reporting issues, please include:

**Bug Reports:**
- What you were trying to do
- What happened instead
- Steps to reproduce the issue
- Error messages or screenshots

**Feature Feedback:**
- What worked well
- What was confusing
- What features are missing
- Overall user experience rating

## 🎯 Success Metrics

The app is ready for release if:
- [ ] Video upload works reliably
- [ ] AI analysis produces good results
- [ ] Interface is intuitive to use
- [ ] Performance is acceptable
- [ ] Errors are handled gracefully

## 📞 Support

If you need help:
1. Check this guide first
2. Look at the console output in the command windows
3. Check the browser developer console (F12)
4. Contact the development team

---

**Thank you for testing OpenClipREDUX! 🚀**

Your feedback helps make this app better for everyone.
