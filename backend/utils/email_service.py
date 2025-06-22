"""
Email service for sending verification and notification emails.
Supports both SMTP and development console output.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from datetime import datetime, timedelta
from jose import jwt
import asyncio
from jinja2 import Template

from config import settings
from auth.auth_handler import auth_handler

logger = logging.getLogger(__name__)

# Email templates
VERIFICATION_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: #f4f4f4; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{ app_name }}!</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi {{ user_name }},</p>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <center>
                <a href="{{ verification_url }}" class="button">Verify Email</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">{{ verification_url }}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ current_year }} {{ app_name }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

PASSWORD_RESET_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: #f4f4f4; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi {{ user_name }},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <center>
                <a href="{{ reset_url }}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">{{ reset_url }}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p><strong>For security reasons, we recommend changing your password if you didn't make this request.</strong></p>
        </div>
        <div class="footer">
            <p>&copy; {{ current_year }} {{ app_name }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

class EmailService:
    """Service for sending emails"""
    
    def __init__(self):
        self.smtp_enabled = all([
            settings.SMTP_HOST,
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD
        ])
        
        if not self.smtp_enabled:
            logger.warning("SMTP not configured. Emails will be logged to console.")
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email (async wrapper for sync SMTP)"""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None, 
                self._send_email_sync, 
                to_email, 
                subject, 
                html_content, 
                text_content
            )
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def _send_email_sync(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email synchronously"""
        try:
            if not self.smtp_enabled:
                # Log to console in development
                logger.info(f"EMAIL TO: {to_email}")
                logger.info(f"SUBJECT: {subject}")
                logger.info(f"CONTENT: {text_content or 'HTML email'}")
                return True
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(message)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    async def send_verification_email(self, email: str, user_id: str, user_name: str) -> bool:
        """Send email verification link"""
        # Create verification token
        token_data = {
            "user_id": user_id,
            "email": email,
            "type": "email_verification",
            "exp": datetime.utcnow() + timedelta(days=1)
        }
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        # Generate verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        # Render template
        template = Template(VERIFICATION_EMAIL_TEMPLATE)
        html_content = template.render(
            app_name=settings.APP_NAME,
            user_name=user_name,
            verification_url=verification_url,
            current_year=datetime.now().year
        )
        
        # Send email
        return await self.send_email(
            to_email=email,
            subject=f"Verify your {settings.APP_NAME} account",
            html_content=html_content,
            text_content=f"Verify your email: {verification_url}"
        )
    
    async def send_password_reset_email(self, email: str, user_id: str, user_name: str) -> bool:
        """Send password reset link"""
        # Create reset token
        token_data = {
            "user_id": user_id,
            "email": email,
            "type": "password_reset",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        # Generate reset URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        # Render template
        template = Template(PASSWORD_RESET_EMAIL_TEMPLATE)
        html_content = template.render(
            app_name=settings.APP_NAME,
            user_name=user_name,
            reset_url=reset_url,
            current_year=datetime.now().year
        )
        
        # Send email
        return await self.send_email(
            to_email=email,
            subject=f"Reset your {settings.APP_NAME} password",
            html_content=html_content,
            text_content=f"Reset your password: {reset_url}"
        )
    
    async def send_welcome_email(self, email: str, user_name: str) -> bool:
        """Send welcome email after successful verification"""
        html_content = f"""
        <h1>Welcome to {settings.APP_NAME}!</h1>
        <p>Hi {user_name},</p>
        <p>Your account has been successfully verified. You can now start creating amazing video clips!</p>
        <p>Get started by:</p>
        <ul>
            <li>Creating your first project</li>
            <li>Uploading a video or YouTube URL</li>
            <li>Using AI to analyze and generate clips</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy clipping!</p>
        """
        
        return await self.send_email(
            to_email=email,
            subject=f"Welcome to {settings.APP_NAME}!",
            html_content=html_content
        )

# Create singleton instance
email_service = EmailService()

# Export convenience functions
async def send_verification_email(email: str, user_id: str, user_name: str = "User") -> bool:
    """Send verification email"""
    return await email_service.send_verification_email(email, user_id, user_name)

async def send_password_reset_email(email: str, user_id: str, user_name: str = "User") -> bool:
    """Send password reset email"""
    return await email_service.send_password_reset_email(email, user_id, user_name)

async def send_welcome_email(email: str, user_name: str = "User") -> bool:
    """Send welcome email"""
    return await email_service.send_welcome_email(email, user_name)
