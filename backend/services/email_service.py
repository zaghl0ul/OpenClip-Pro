import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config import settings

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html_body: Optional[str] = None
    ) -> bool:
        """Send email"""
        if not all([self.smtp_host, self.smtp_username, self.smtp_password]):
            print("SMTP settings not configured, skipping email send")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Add text and HTML parts
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    async def send_beta_welcome_email(self, email: str, name: str) -> bool:
        """Send welcome email to beta signup"""
        subject = "Welcome to OpenClip Pro Beta!"
        
        body = f"""
        Hi {name},
        
        Thank you for signing up for the OpenClip Pro beta! We're excited to have you on board.
        
        We'll be in touch soon with access to the beta platform and updates on new features.
        
        Best regards,
        The OpenClip Pro Team
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Welcome to OpenClip Pro Beta!</h2>
            <p>Hi {name},</p>
            <p>Thank you for signing up for the OpenClip Pro beta! We're excited to have you on board.</p>
            <p>We'll be in touch soon with access to the beta platform and updates on new features.</p>
            <br>
            <p>Best regards,<br>The OpenClip Pro Team</p>
        </body>
        </html>
        """
        
        return await self.send_email(email, subject, body, html_body)
    
    async def send_feedback_notification(self, feedback_data) -> bool:
        """Send feedback notification to admin"""
        subject = f"New Feedback: {feedback_data.type}"
        
        body = f"""
        New feedback received:
        
        Type: {feedback_data.type}
        Rating: {feedback_data.rating}/5
        Page: {feedback_data.page}
        Message: {feedback_data.message}
        
        User Agent: {feedback_data.userAgent or 'Not provided'}
        Timestamp: {feedback_data.timestamp or 'Not provided'}
        """
        
        # Send to admin email (configure in settings)
        admin_email = "admin@openclippro.com"  # TODO: Add to settings
        return await self.send_email(admin_email, subject, body) 