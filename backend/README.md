# OpenClip Pro Backend

🔐 **Enterprise-grade backend for AI-powered video analysis** with comprehensive authentication, security, and scalability features.

## 🏗️ Architecture Overview

The backend is built with **FastAPI** and implements:

- **JWT-based Authentication** with refresh token rotation
- **Role-based Access Control** (RBAC)
- **Encrypted API Key Storage** for third-party services
- **Rate Limiting** per user/endpoint
- **Audit Logging** for security compliance
- **Multi-tenant Support** with teams
- **Storage Quotas** and usage tracking
- **Secure File Handling** with validation

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Redis (for session management)
- FFmpeg (for video processing)
- PostgreSQL (recommended for production)

### Installation

1. **Clone and setup environment**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database**
   ```bash
   # Run migrations
   alembic upgrade head
   
   # Or use the simple init (development)
   python -c "from utils.db_manager import init_db; init_db()"
   ```

4. **Start the server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Access the application**
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/api/docs
   - Health Check: http://localhost:8000/health

## 🔑 Authentication Flow

### Registration
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

### Login
```bash
POST /api/auth/login
{
  "username": "user@example.com",  # OAuth2 spec uses 'username'
  "password": "SecurePass123!"
}
```

Returns:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "roles": ["user"]
  }
}
```

### Using Protected Endpoints
```bash
GET /api/projects
Authorization: Bearer <access_token>
```

### Token Refresh
```bash
POST /api/auth/refresh
Cookie: refresh_token=<token>
```

## 🛡️ Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting
- Authentication: 10 attempts/hour
- API calls: 100 requests/hour (configurable)
- File uploads: 50/day

### Account Security
- Email verification required
- Account lockout after 5 failed attempts
- Optional 2FA support
- Secure password reset flow

## 📊 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email/{token}` - Email verification
- `POST /api/auth/request-password-reset` - Password reset request

### Protected Endpoints (require authentication)
- `GET /api/auth/me` - Get current user
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `POST /api/projects/{id}/upload` - Upload video
- `POST /api/projects/{id}/analyze` - Start AI analysis
- `GET /api/settings` - Get user settings
- `POST /api/settings/api-key` - Store encrypted API key

### Admin Endpoints (require admin role)
- `GET /api/auth/users` - List all users
- `PUT /api/auth/users/{id}/roles` - Update user roles
- `GET /api/admin/stats` - System statistics

## 🔧 Configuration

### Environment Variables

Key variables in `.env`:

```env
# Security (MUST change in production)
SECRET_KEY="your-secret-key-here"

# Database
DATABASE_URL="postgresql://user:pass@localhost/openclip"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Email (for verification)
SMTP_HOST="smtp.gmail.com"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="app-specific-password"
```

### Default Admin User

In development, a default admin is created:
- Email: admin@openclippro.com
- Password: admin123!

**⚠️ Change immediately in production!**

## 📁 Project Structure

```
backend/
├── auth/                  # Authentication system
│   ├── auth_handler.py   # JWT & token management
│   └── auth_routes.py    # Auth endpoints
├── models/               # Database models
│   ├── database.py       # SQLAlchemy models
│   └── repositories.py   # Data access layer
├── services/             # Business logic
│   ├── ai_analyzer.py    # AI integration
│   └── video_processor.py # Video processing
├── utils/                # Utilities
│   ├── security.py       # Encryption & security
│   ├── email_service.py  # Email sending
│   └── file_manager.py   # File operations
├── alembic/              # Database migrations
├── main.py               # FastAPI application
├── config.py             # Configuration
└── requirements.txt      # Dependencies
```

## 🧪 Testing

Run tests with pytest:
```bash
# Run all tests
pytest

# With coverage
pytest --cov=. --cov-report=html

# Specific test file
pytest tests/test_auth.py -v
```

## 🚢 Production Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Setup

1. Use PostgreSQL instead of SQLite
2. Set up Redis with password
3. Configure proper SMTP server
4. Use reverse proxy (Nginx) with HTTPS
5. Set `ENVIRONMENT=production`
6. Disable debug endpoints

### Security Checklist

- [ ] Change all default passwords
- [ ] Set strong SECRET_KEY
- [ ] Enable HTTPS only
- [ ] Configure firewall rules
- [ ] Set up monitoring (Sentry)
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup strategy

## 🐛 Troubleshooting

### Common Issues

1. **"No module named 'module_name'"**
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

2. **"Connection refused" on startup**
   - Check Redis is running: `redis-cli ping`
   - Verify DATABASE_URL is correct

3. **Email not sending**
   - Check SMTP credentials
   - For Gmail, use app-specific password
   - In development, emails log to console

4. **"Invalid token" errors**
   - Check SECRET_KEY hasn't changed
   - Verify token hasn't expired
   - Clear cookies and re-login

## 📝 API Documentation

When running in development, access interactive API docs:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 🤝 Contributing

1. Create feature branch
2. Add tests for new features
3. Ensure all tests pass
4. Update documentation
5. Submit pull request

## 📄 License

MIT License - see LICENSE file

## 🆘 Support

- Documentation: [docs.openclippro.com](https://docs.openclippro.com)
- Issues: [GitHub Issues](https://github.com/openclippro/issues)
- Discord: [Join our community](https://discord.gg/openclippro)

---

Built with ❤️ using FastAPI, SQLAlchemy, and modern Python
