# OpenClip Pro Backend - Authentication & Security Setup

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# IMPORTANT: Change SECRET_KEY in production!
```

### 3. Initialize Database

```bash
# Run migrations
alembic upgrade head

# Or run the backend which will auto-initialize
python main.py
```

### 4. Start the Backend

```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🔒 Security Features Implemented

### Authentication System
- **JWT-based authentication** with access and refresh tokens
- **Refresh token rotation** for enhanced security
- **Password hashing** with bcrypt (cost factor 12)
- **Account lockout** after failed login attempts
- **Email verification** for new accounts
- **Password reset** functionality

### Authorization & Access Control
- **Role-based access control** (RBAC) with user roles
- **User ownership** validation for resources
- **API key authentication** for programmatic access
- **Rate limiting** on sensitive endpoints

### Security Measures
- **HTTPS enforcement** in production
- **CORS configuration** with whitelist
- **Request size limits** to prevent DoS
- **Input validation** and sanitization
- **SQL injection protection** via SQLAlchemy ORM
- **XSS prevention** through proper encoding

### Audit & Monitoring
- **Comprehensive audit logging** for all actions
- **Failed login tracking** with IP logging
- **Security event monitoring**
- **Usage tracking** for rate limiting

## 📁 Project Structure

```
backend/
├── auth/                   # Authentication module
│   ├── auth_handler.py     # JWT & auth logic
│   └── auth_routes.py      # Auth API endpoints
├── models/                 # Database models
│   ├── database.py         # SQLAlchemy models
│   └── repositories.py     # Data access layer
├── services/               # Business logic
│   ├── ai_analyzer.py      # AI integration
│   └── video_processor.py  # Video processing
├── utils/                  # Utilities
│   ├── security.py         # Encryption & security
│   ├── email_service.py    # Email sending
│   └── db_manager.py       # Database management
├── alembic/                # Database migrations
├── main.py                 # FastAPI application
├── config.py               # Configuration
└── requirements.txt        # Dependencies
```

## 🔑 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get tokens | No |
| POST | `/api/auth/refresh` | Refresh access token | No (uses cookie) |
| POST | `/api/auth/logout` | Logout and revoke tokens | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/verify-email/{token}` | Verify email address | No |
| POST | `/api/auth/request-password-reset` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| POST | `/api/auth/change-password` | Change password | Yes |

### Protected Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get user's projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/{id}` | Get project details |
| DELETE | `/api/projects/{id}` | Delete project |
| POST | `/api/projects/{id}/upload` | Upload video |
| POST | `/api/projects/{id}/analyze` | Start AI analysis |
| GET | `/api/settings` | Get user settings |
| POST | `/api/settings/api-key` | Store AI provider API key |

### Admin Endpoints (Require Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/users` | List all users |
| PUT | `/api/auth/users/{id}/roles` | Update user roles |
| GET | `/api/admin/stats` | Get system statistics |

## 🔐 Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Management
- Access tokens expire in 30 minutes
- Refresh tokens expire in 30 days
- Refresh tokens rotate on each use
- Tokens are revoked on logout

### API Keys
- Stored encrypted in database
- Unique per user per provider
- Can be revoked anytime
- Rate limited by default

## 🚧 Development Tips

### Testing Authentication
```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!", "full_name": "Test User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=Test123!"

# Use the access token for protected endpoints
curl -X GET http://localhost:8000/api/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Database Management
```bash
# Create a new migration
alembic revision -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### Environment Variables
Critical variables for production:
- `SECRET_KEY`: Must be a strong random string
- `DATABASE_URL`: PostgreSQL recommended for production
- `REDIS_URL`: Required for rate limiting
- `SMTP_*`: Required for email functionality

## 🐛 Troubleshooting

### Common Issues

1. **"Token has expired"**
   - Use the refresh endpoint to get a new access token
   - Ensure your client properly handles token refresh

2. **"Account locked"**
   - Wait 30 minutes or contact admin
   - Check for correct password

3. **"Email not verified"**
   - Check spam folder for verification email
   - Request new verification email

4. **Database errors**
   - Ensure migrations are applied: `alembic upgrade head`
   - Check database connection string

## 📞 Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Enable debug mode in `.env` for detailed errors
3. Review the API documentation at `/api/docs`

## 🔄 Next Steps

1. **Configure Email**: Set up SMTP settings for email verification
2. **Set Up Redis**: Install Redis for rate limiting and caching
3. **Configure AI Providers**: Add your API keys through the settings endpoint
4. **Enable HTTPS**: Use a reverse proxy like Nginx for production
5. **Set Up Monitoring**: Configure Sentry for error tracking

---

**Security Note**: This implementation follows OWASP best practices for authentication and authorization. Always review and update security measures based on your specific requirements and threat model.
