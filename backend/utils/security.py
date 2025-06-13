"""
Security utilities for encryption, API key management, and validation.
Implements enterprise-grade security practices with proper encryption.
"""

import os
import base64
import logging
import hashlib
import secrets
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, status
import re

from config import settings

logger = logging.getLogger(__name__)

class SecurityManager:
    """
    Handles encryption/decryption of sensitive data using Fernet symmetric encryption.
    Implements proper key derivation and secure storage practices.
    """
    
    def __init__(self):
        self.cipher_suite = self._initialize_cipher()
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
    def _initialize_cipher(self) -> Fernet:
        """
        Initialize Fernet cipher with derived key from secret.
        Uses PBKDF2 for key derivation from the secret key.
        """
        # Use the secret key as password for key derivation
        password = settings.SECRET_KEY.encode()
        
        # Salt should be stored, but for simplicity we use a fixed salt
        # In production, use a random salt per encryption
        salt = b'openclip_pro_salt_v1'
        
        # Derive a key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        
        return Fernet(key)
    
    def encrypt_value(self, plaintext: str) -> str:
        """
        Encrypt a string value.
        Returns base64 encoded encrypted value.
        """
        try:
            encrypted = self.cipher_suite.encrypt(plaintext.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt_value(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted string value.
        Expects base64 encoded input.
        """
        try:
            decoded = base64.urlsafe_b64decode(ciphertext)
            decrypted = self.cipher_suite.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def hash_api_key(self, api_key: str) -> str:
        """
        Create a one-way hash of an API key for storage.
        Uses SHA256 for consistent hashing.
        """
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def get_api_key_prefix(self, api_key: str) -> str:
        """Get the first 8 characters of an API key for identification."""
        return api_key[:8] if len(api_key) >= 8 else api_key
    
    def generate_api_key(self) -> str:
        """
        Generate a new secure API key.
        Format: ocpro_[32 random characters]
        """
        return f"ocpro_{secrets.token_urlsafe(32)}"
    
    def generate_share_token(self) -> str:
        """Generate a secure share token for projects."""
        return secrets.token_urlsafe(16)
    
    def verify_api_key(self, provided_key: str, stored_hash: str) -> bool:
        """Verify an API key against its stored hash."""
        return self.hash_api_key(provided_key) == stored_hash
    
    def get_api_key(self, provider: str, db_session, settings_repo) -> Optional[str]:
        """
        Get and decrypt an API key for a provider.
        Compatible with the existing codebase interface.
        """
        try:
            # Get the setting from database
            setting = settings_repo.get_setting(db_session, "api_keys", f"{provider}_key")
            if not setting or not setting.value:
                return None
            
            # Check if it's encrypted
            if setting.is_encrypted:
                return self.decrypt_value(setting.value)
            else:
                # Legacy support - encrypt on read
                encrypted = self.encrypt_value(setting.value)
                settings_repo.create_or_update_setting(
                    db_session,
                    "api_keys",
                    f"{provider}_key",
                    encrypted
                )
                # Update the is_encrypted flag
                setting.is_encrypted = True
                db_session.commit()
                return setting.value
                
        except Exception as e:
            logger.error(f"Failed to get API key for {provider}: {e}")
            return None
    
    def store_api_key(self, provider: str, api_key: str, db_session, settings_repo) -> bool:
        """
        Encrypt and store an API key.
        Compatible with the existing codebase interface.
        """
        try:
            # Encrypt the API key
            encrypted_key = self.encrypt_value(api_key)
            
            # Store in database with encryption flag
            setting = settings_repo.create_or_update_setting(
                db_session,
                "api_keys",
                f"{provider}_key",
                encrypted_key
            )
            setting.is_encrypted = True
            db_session.commit()
            
            return True
        except Exception as e:
            logger.error(f"Failed to store API key for {provider}: {e}")
            return False
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize a filename to prevent directory traversal attacks"""
        # Remove any path separators and dangerous characters
        sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
        sanitized = sanitized.replace('..', '_')
        return sanitized[:255]  # Limit length
    
    def validate_file_type(self, filename: str, allowed_extensions: list) -> bool:
        """Validate file type based on extension"""
        if not filename:
            return False
        
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        return f".{extension}" in [ext.lower() for ext in allowed_extensions]
    
    def generate_secure_filename(self, original_filename: str) -> str:
        """Generate a secure filename with timestamp and hash"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_hash = hashlib.md5(original_filename.encode()).hexdigest()[:8]
        
        # Extract extension
        if '.' in original_filename:
            name, ext = original_filename.rsplit('.', 1)
            return f"{timestamp}_{file_hash}.{ext}"
        else:
            return f"{timestamp}_{file_hash}"
    
    def validate_request_size(self, content_length: Optional[int], max_size_mb: int = 100) -> bool:
        """Validate request content size"""
        if content_length is None:
            return True  # Let it through, will be caught later if too large
        
        max_size_bytes = max_size_mb * 1024 * 1024
        return content_length <= max_size_bytes
    
    def log_security_event(self, event_type: str, details: Dict[str, Any], severity: str = "INFO"):
        """Log security-related events"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "severity": severity,
            "details": details
        }
        
        if severity == "WARNING":
            logger.warning(f"Security Event: {event_type} - {details}")
        elif severity == "ERROR":
            logger.error(f"Security Event: {event_type} - {details}")
        else:
            logger.info(f"Security Event: {event_type} - {details}")
    
    def validate_password_strength(self, password: str) -> tuple[bool, Optional[str]]:
        """
        Validate password against security requirements.
        Returns (is_valid, error_message)
        """
        if len(password) < settings.PASSWORD_MIN_LENGTH:
            return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
        
        if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if settings.PASSWORD_REQUIRE_NUMBERS and not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        
        if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        
        return True, None
    
    def generate_2fa_secret(self) -> str:
        """Generate a secret for 2FA (TOTP)"""
        import pyotp
        return pyotp.random_base32()
    
    def verify_2fa_token(self, secret: str, token: str) -> bool:
        """Verify a 2FA TOTP token"""
        import pyotp
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    
    def get_2fa_provisioning_uri(self, secret: str, email: str) -> str:
        """Get the provisioning URI for 2FA setup"""
        import pyotp
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=email,
            issuer_name=settings.APP_NAME
        )

# Singleton instance
security_manager = SecurityManager()
