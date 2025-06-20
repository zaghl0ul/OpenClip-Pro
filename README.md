# OpenClip Pro

�� **AI-Powered Video Clipping Studio** - Transform your videos into engaging clips automatically using advanced AI technology with a beautiful, modern interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

## 🌟 Overview

OpenClip Pro is a comprehensive video processing platform that leverages artificial intelligence to automatically generate engaging video clips from longer content. Whether you're a content creator, marketer, or educator, OpenClip Pro helps you extract the most compelling moments from your videos with minimal effort.

## 🎨 Multiple Stunning Themes

Choose from a variety of beautiful themes to match your style and workflow:

![Screenshot 2025-06-19 215504](https://github.com/user-attachments/assets/efaec52e-d265-4613-a24d-494110b89ef5)
![Screenshot 2025-06-19 215454](https://github.com/user-attachments/assets/ff36e6d1-4067-4245-b1c7-9d4e82f0836a)
![Screenshot 2025-06-19 215445](https://github.com/user-attachments/assets/72bb90b9-9660-4461-b4f4-58703b87b9e6)
![Screenshot 2025-06-19 215429](https://github.com/user-attachments/assets/efcbf557-552c-4532-9659-280ad6e27566)
![Screenshot 2025-06-19 215415](https://github.com/user-attachments/assets/4e315a30-84b0-4777-8dbc-69a572a493b1)
![Screenshot 2025-06-19 214928](https://github.com/user-attachments/assets/ae5558fc-d9d9-4f82-8086-71464b1b2a9a)
![Screenshot 2025-06-19 214916](https://github.com/user-attachments/assets/d4f995af-30dc-4511-acb2-d329d8586818)
![Screenshot 2025-06-19 204216](https://github.com/user-attachments/assets/7bb7ade3-2d99-4dc6-b84f-275840b70dd9)



- **🌙 Midnight** - Sleek dark theme with blue accents
- **☀️ Daylight** - Clean, bright interface for daytime work  
- **🌈 Cyberpunk** - Neon dreams with vibrant colors
- **🌌 Aurora** - Northern lights inspired gradients
- **🌊 Deep Ocean** - Calming blue depths
- **🌅 Sunset Glow** - Warm oranges and pinks
- **🌲 Enchanted Forest** - Natural greens and earth tones
- **⭐ Cosmic Void** - Space-inspired dark theme
- **⚫ Monochrome** - Pure black and white minimalism
- **🖥️ Windows 98** - Nostalgic retro theme with authentic 90s styling

### ✨ Key Features

- **🤖 AI-Powered Analysis**: Advanced AI models analyze your videos to identify key moments, emotions, and engaging content
- **🎯 Smart Clip Generation**: Automatically generate clips based on content analysis, trending topics, or custom criteria
- **🔄 Multi-Provider Support**: Integrate with OpenAI GPT-4 Vision, Google Gemini, and Anthropic Claude
- **📱 Modern Web Interface**: Responsive, accessible React application with real-time progress tracking
- **🎨 Beautiful Themes**: 10 stunning themes including a nostalgic Windows 98 retro mode
- **⚡ High Performance**: Optimized video processing with FFmpeg and efficient file handling
- **🔒 Secure & Private**: Enterprise-grade security with encrypted API keys and secure file handling
- **🌐 YouTube Integration**: Direct processing of YouTube videos via URL
- **📊 Analytics Dashboard**: Track processing history, costs, and performance metrics
- **🎬 Professional Export**: Multiple export formats and quality options

## 🚀 Quick Start

### 🎯 One-Click Launcher (Windows)

The fastest way to start both frontend and backend:

```bash
# Simply double-click the launcher script!
start-app.bat
```

This will:
- ✅ Check Python and Node.js dependencies
- ✅ Set up FFmpeg for video processing  
- ✅ Start backend API server (http://localhost:8000)
- ✅ Start frontend dev server (http://localhost:5173)
- ✅ Open the application in your browser
- ✅ Show helpful URLs and status

### Manual Setup

#### Prerequisites

- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Git** for version control

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zaghl0ul/OpenClip-Pro.git
   cd OpenClip-Pro
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   # From the project root
   npm install
   ```

4. **Start the development servers**
   
   **Option A: Use the launcher script**
   ```bash
   # Windows
   start-app.bat
   ```
   
   **Option B: Manual start**
   
   Backend (Terminal 1):
   ```bash
   cd backend
   python main.py
   ```
   
   Frontend (Terminal 2):
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🏗️ Project Structure

```
OpenClip Pro/
├── backend/                 # FastAPI Python backend
│   ├── auth/               # Authentication system
│   ├── services/           # Core business logic
│   ├── models/             # Database models
│   ├── utils/              # Utility functions
│   └── main.py             # FastAPI application
├── src/                    # React frontend application
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application pages
│   ├── stores/             # Zustand state management
│   ├── config/             # Theme configuration
│   └── utils/              # Frontend utilities
├── ffmpeg/                 # FFmpeg binaries (Windows)
├── start-app.bat           # One-click launcher
└── README.md               # This file
```

## 🔧 Configuration

### AI Provider Setup

Configure your AI providers in the Settings page of the application:

#### OpenAI
1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Enter in Settings → API Keys
3. Test connection and save

#### Google Gemini
1. Get your API key from [Google AI Studio](https://makersuite.google.com/)
2. Enter in Settings → API Keys  
3. Test connection and save

#### Anthropic Claude
1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Enter in Settings → API Keys
3. Test connection and save

## 📖 Usage

### Basic Workflow

1. **Choose Your Theme**
   - Click the theme selector in the header
   - Choose from 10 beautiful themes
   - Settings are saved automatically

2. **Create a Project**
   - Navigate to the dashboard
   - Click "Create Project"
   - Enter project details

3. **Upload Video**
   - Drag and drop video files
   - Or paste YouTube URL
   - Wait for processing to complete

4. **Configure AI Analysis**
   - Select AI provider and model
   - Enter your analysis prompt
   - Start the analysis

5. **Review and Export**
   - Review generated clips
   - Edit clip details if needed
   - Export individual clips or all at once

### Windows 98 Retro Theme

Experience authentic 90s nostalgia with our Windows 98 theme:
- **Chunky 3D borders** with realistic bevel effects
- **Classic scrollbars** with proper button styling
- **Retro fonts** (MS Sans Serif/Tahoma)
- **16x16 pixel art icons**
- **Authentic dialog boxes** with title bars
- **Win98 progress bars** for that nostalgic feel

Perfect for content creators making retro-themed videos or anyone who misses the classic Windows experience!

## 🎨 Theme System

The application features a powerful theme system with:

- **Real-time switching** - No page reload required
- **Persistent preferences** - Your theme choice is remembered
- **Responsive design** - All themes work on mobile and desktop
- **Accessibility** - Proper contrast ratios and ARIA labels
- **Custom CSS variables** - Easy to modify and extend

### Theme Categories

- **Modern Themes**: Midnight, Daylight, Aurora, Ocean
- **Vibrant Themes**: Cyberpunk, Sunset Glow, Cosmic Void
- **Nature Themes**: Enchanted Forest
- **Minimal Themes**: Monochrome
- **Retro Themes**: Windows 98

## 🛠️ Development

### Adding New Themes

1. Edit `src/config/themes.js`
2. Add your theme configuration
3. Update the theme selector component
4. Test across all components

### Backend Development

The FastAPI backend provides:
- **RESTful API** with automatic documentation
- **Authentication** with JWT tokens
- **File upload** handling with security
- **AI integration** with multiple providers
- **Database** management with SQLAlchemy

### Frontend Development

The React frontend features:
- **Modern hooks** and functional components
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Start backend in production
cd backend
python main.py
```

### Environment Variables

Set these in production:

**Backend**:
- `SECRET_KEY` - JWT signing key
- `DATABASE_URL` - Database connection string
- `ENVIRONMENT` - Set to "production"

**Frontend**:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style

- **Backend**: Follow PEP 8, use Black for formatting
- **Frontend**: Use ESLint and Prettier
- **Commits**: Use descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - Frontend library
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [OpenAI](https://openai.com/) - AI models and APIs
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/zaghl0ul/OpenClip-Pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zaghl0ul/OpenClip-Pro/discussions)

---

**Made with ❤️ by zaghl0ul**

*Transform your videos into engaging content with the power of AI and beautiful themes.*
