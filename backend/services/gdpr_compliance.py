"""
GDPR Compliance Service
Implements comprehensive GDPR compliance features for user data protection
"""

import os
import json
import hashlib
import zipfile
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Set
from pathlib import Path
import asyncio
from dataclasses import dataclass, field
from enum import Enum
import aiofiles
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from sqlalchemy import select, update, delete
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.base import Base
from ..config import settings, get_db
from ..services.email_service import EmailService
from ..services.storage_service import storage_service
from ..utils.encryption import encrypt_data, decrypt_data

class LawfulBasis(str, Enum):
    """Lawful basis for data processing under GDPR"""
    CONSENT = "consent"
    CONTRACT = "contract"
    LEGAL_OBLIGATION = "legal_obligation"
    VITAL_INTERESTS = "vital_interests"
    PUBLIC_TASK = "public_task"
    LEGITIMATE_INTERESTS = "legitimate_interests"

class DataCategory(str, Enum):
    """Categories of personal data"""
    BASIC_IDENTITY = "basic_identity"  # Name, email
    CONTACT = "contact"  # Address, phone
    FINANCIAL = "financial"  # Payment info
    BEHAVIORAL = "behavioral"  # Usage patterns
    CONTENT = "content"  # User-generated content
    TECHNICAL = "technical"  # IP addresses, device info
    PREFERENCES = "preferences"  # Settings, preferences

@dataclass
class ConsentRecord:
    """Record of user consent"""
    user_id: int
    purpose: str
    lawful_basis: LawfulBasis
    data_categories: List[DataCategory]
    granted_at: datetime
    expires_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    version: str = "1.0"
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

@dataclass
class DataProcessingActivity:
    """Record of data processing activities (Article 30)"""
    activity_id: str
    name: str
    purpose: str
    lawful_basis: LawfulBasis
    data_categories: List[DataCategory]
    data_subjects: List[str]  # Types of data subjects
    recipients: List[str]  # Who receives the data
    retention_period: timedelta
    security_measures: List[str]
    third_country_transfers: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

@dataclass
class DataBreachRecord:
    """Record of data breach (Article 33)"""
    breach_id: str
    discovered_at: datetime
    reported_at: Optional[datetime]
    description: str
    data_categories_affected: List[DataCategory]
    estimated_affected_users: int
    risk_level: str  # low, medium, high
    measures_taken: List[str]
    dpa_notified: bool = False
    users_notified: bool = False

class GDPRComplianceService:
    """
    Comprehensive GDPR compliance service
    Implements all major GDPR requirements for user data protection
    """
    
    def __init__(self):
        self.encryption_key = self._generate_encryption_key()
        self.consent_records: Dict[int, List[ConsentRecord]] = {}
        self.processing_activities: List[DataProcessingActivity] = []
        self.breach_records: List[DataBreachRecord] = []
        self.email_service = EmailService()
        
        # Initialize processing activities registry
        self._initialize_processing_activities()
    
    def _generate_encryption_key(self) -> bytes:
        """Generate encryption key from settings"""
        password = settings.SECRET_KEY.encode()
        salt = b'gdpr_encryption_salt'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def _initialize_processing_activities(self):
        """Initialize registry of processing activities"""
        self.processing_activities = [
            DataProcessingActivity(
                activity_id="user_registration",
                name="User Registration and Authentication",
                purpose="Account creation and access management",
                lawful_basis=LawfulBasis.CONTRACT,
                data_categories=[DataCategory.BASIC_IDENTITY, DataCategory.CONTACT],
                data_subjects=["users", "customers"],
                recipients=["internal_staff", "email_service_provider"],
                retention_period=timedelta(days=365 * 3),  # 3 years
                security_measures=["encryption", "access_control", "audit_logging"]
            ),
            DataProcessingActivity(
                activity_id="video_processing",
                name="Video Processing and Analysis",
                purpose="Provide video editing and AI analysis services",
                lawful_basis=LawfulBasis.CONTRACT,
                data_categories=[DataCategory.CONTENT, DataCategory.BEHAVIORAL],
                data_subjects=["users"],
                recipients=["ai_providers", "storage_providers"],
                retention_period=timedelta(days=90),  # 90 days
                security_measures=["encryption", "secure_transfer", "access_control"],
                third_country_transfers=True  # AI providers may be outside EU
            ),
            DataProcessingActivity(
                activity_id="analytics",
                name="Usage Analytics",
                purpose="Improve service quality and user experience",
                lawful_basis=LawfulBasis.LEGITIMATE_INTERESTS,
                data_categories=[DataCategory.BEHAVIORAL, DataCategory.TECHNICAL],
                data_subjects=["users", "visitors"],
                recipients=["internal_staff"],
                retention_period=timedelta(days=365),  # 1 year
                security_measures=["pseudonymization", "aggregation", "access_control"]
            ),
            DataProcessingActivity(
                activity_id="marketing",
                name="Marketing Communications",
                purpose="Send promotional materials and updates",
                lawful_basis=LawfulBasis.CONSENT,
                data_categories=[DataCategory.BASIC_IDENTITY, DataCategory.PREFERENCES],
                data_subjects=["users", "subscribers"],
                recipients=["email_service_provider"],
                retention_period=timedelta(days=365 * 2),  # 2 years
                security_measures=["encryption", "unsubscribe_mechanism"]
            )
        ]
    
    async def record_consent(
        self,
        user_id: int,
        purpose: str,
        lawful_basis: LawfulBasis,
        data_categories: List[DataCategory],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        duration: Optional[timedelta] = None
    ) -> ConsentRecord:
        """Record user consent for data processing"""
        consent = ConsentRecord(
            user_id=user_id,
            purpose=purpose,
            lawful_basis=lawful_basis,
            data_categories=data_categories,
            granted_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + duration if duration else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if user_id not in self.consent_records:
            self.consent_records[user_id] = []
        
        self.consent_records[user_id].append(consent)
        
        # Store in database
        async with get_db() as db:
            db.add(ConsentRecordModel(
                user_id=user_id,
                purpose=purpose,
                lawful_basis=lawful_basis.value,
                data_categories=json.dumps([cat.value for cat in data_categories]),
                granted_at=consent.granted_at,
                expires_at=consent.expires_at,
                ip_address=ip_address,
                user_agent=user_agent
            ))
            await db.commit()
        
        return consent
    
    async def withdraw_consent(
        self,
        user_id: int,
        purpose: str
    ) -> bool:
        """Withdraw consent for specific purpose"""
        if user_id in self.consent_records:
            for consent in self.consent_records[user_id]:
                if consent.purpose == purpose and consent.withdrawn_at is None:
                    consent.withdrawn_at = datetime.now(timezone.utc)
                    
                    # Update in database
                    async with get_db() as db:
                        await db.execute(
                            update(ConsentRecordModel)
                            .where(
                                ConsentRecordModel.user_id == user_id,
                                ConsentRecordModel.purpose == purpose,
                                ConsentRecordModel.withdrawn_at.is_(None)
                            )
                            .values(withdrawn_at=consent.withdrawn_at)
                        )
                        await db.commit()
                    
                    # Process withdrawal implications
                    await self._process_consent_withdrawal(user_id, purpose)
                    
                    return True
        
        return False
    
    async def _process_consent_withdrawal(self, user_id: int, purpose: str):
        """Process implications of consent withdrawal"""
        # Stop processing for withdrawn purpose
        if purpose == "marketing":
            # Unsubscribe from marketing
            async with get_db() as db:
                user = await db.get(User, user_id)
                if user:
                    user.marketing_consent = False
                    await db.commit()
        
        elif purpose == "analytics":
            # Anonymize analytics data
            await self.anonymize_user_data(user_id, [DataCategory.BEHAVIORAL])
    
    async def get_user_data(self, user_id: int) -> Dict[str, Any]:
        """
        Get all user data for data portability (Article 20)
        Returns data in machine-readable format
        """
        user_data = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "data_categories": {}
        }
        
        async with get_db() as db:
            # Get user profile data
            user = await db.get(User, user_id)
            if not user:
                raise ValueError("User not found")
            
            # Basic identity data
            user_data["data_categories"]["basic_identity"] = {
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "created_at": user.created_at.isoformat()
            }
            
            # Contact data
            user_data["data_categories"]["contact"] = {
                "location": user.location,
                "timezone": user.timezone
            }
            
            # Preferences
            user_data["data_categories"]["preferences"] = {
                "language": user.language,
                "notifications_enabled": getattr(user, "notifications_enabled", True),
                "theme": getattr(user, "theme", "light")
            }
            
            # Projects and content
            projects = await db.execute(
                select(Project).where(Project.user_id == user_id)
            )
            user_data["data_categories"]["content"] = {
                "projects": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "created_at": p.created_at.isoformat(),
                        "clips_count": len(p.clips)
                    }
                    for p in projects.scalars()
                ]
            }
            
            # Activity logs (anonymized)
            user_data["data_categories"]["behavioral"] = {
                "total_projects": len(user_data["data_categories"]["content"]["projects"]),
                "account_age_days": (datetime.now(timezone.utc) - user.created_at).days
            }
            
            # Consent records
            consents = await db.execute(
                select(ConsentRecordModel).where(ConsentRecordModel.user_id == user_id)
            )
            user_data["consent_records"] = [
                {
                    "purpose": c.purpose,
                    "granted_at": c.granted_at.isoformat(),
                    "withdrawn_at": c.withdrawn_at.isoformat() if c.withdrawn_at else None
                }
                for c in consents.scalars()
            ]
        
        return user_data
    
    async def export_user_data(
        self,
        user_id: int,
        include_files: bool = False
    ) -> str:
        """
        Export user data in portable format (ZIP file)
        Returns path to export file
        """
        # Get user data
        user_data = await self.get_user_data(user_id)
        
        # Create export directory
        export_dir = Path(f"/tmp/gdpr_export_{user_id}_{datetime.now().timestamp()}")
        export_dir.mkdir(exist_ok=True)
        
        # Save data as JSON
        data_file = export_dir / "user_data.json"
        async with aiofiles.open(data_file, "w") as f:
            await f.write(json.dumps(user_data, indent=2))
        
        # Include user files if requested
        if include_files:
            files_dir = export_dir / "files"
            files_dir.mkdir(exist_ok=True)
            
            # Download user's video files
            async with get_db() as db:
                projects = await db.execute(
                    select(Project).where(Project.user_id == user_id)
                )
                for project in projects.scalars():
                    if project.video_url:
                        # Download file from storage
                        local_path = await storage_service.download_file(
                            project.video_url,
                            files_dir / f"project_{project.id}_video"
                        )
        
        # Create ZIP archive
        zip_path = f"/tmp/gdpr_export_{user_id}_{datetime.now().timestamp()}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file_path in export_dir.rglob("*"):
                if file_path.is_file():
                    zipf.write(file_path, file_path.relative_to(export_dir))
        
        # Clean up temporary directory
        import shutil
        shutil.rmtree(export_dir)
        
        return zip_path
    
    async def delete_user_data(
        self,
        user_id: int,
        data_categories: Optional[List[DataCategory]] = None
    ) -> Dict[str, Any]:
        """
        Delete user data (Right to Erasure - Article 17)
        Returns summary of deleted data
        """
        deletion_summary = {
            "user_id": user_id,
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "data_categories": {}
        }
        
        async with get_db() as db:
            user = await db.get(User, user_id)
            if not user:
                raise ValueError("User not found")
            
            # If no specific categories, delete all
            if not data_categories:
                data_categories = list(DataCategory)
            
            for category in data_categories:
                if category == DataCategory.BASIC_IDENTITY:
                    # Pseudonymize instead of delete (for audit trail)
                    user.email = f"deleted_user_{user_id}@deleted.local"
                    user.username = f"deleted_user_{user_id}"
                    user.full_name = "Deleted User"
                    deletion_summary["data_categories"]["basic_identity"] = "pseudonymized"
                
                elif category == DataCategory.CONTENT:
                    # Delete all user content
                    projects = await db.execute(
                        select(Project).where(Project.user_id == user_id)
                    )
                    project_count = 0
                    for project in projects.scalars():
                        # Delete files from storage
                        if project.video_url:
                            await storage_service.delete_file(project.video_url)
                        
                        # Delete project
                        await db.delete(project)
                        project_count += 1
                    
                    deletion_summary["data_categories"]["content"] = f"{project_count} projects deleted"
                
                elif category == DataCategory.BEHAVIORAL:
                    # Delete activity logs
                    await db.execute(
                        delete(ActivityLog).where(ActivityLog.user_id == user_id)
                    )
                    deletion_summary["data_categories"]["behavioral"] = "activity logs deleted"
                
                elif category == DataCategory.TECHNICAL:
                    # Clear technical data
                    user.last_ip_address = None
                    user.login_history = []
                    deletion_summary["data_categories"]["technical"] = "technical data cleared"
            
            # Mark account as deleted
            user.is_active = False
            user.deleted_at = datetime.now(timezone.utc)
            
            await db.commit()
        
        # Send confirmation email
        await self.email_service.send_deletion_confirmation(user.email, deletion_summary)
        
        return deletion_summary
    
    async def anonymize_user_data(
        self,
        user_id: int,
        data_categories: List[DataCategory]
    ) -> Dict[str, Any]:
        """
        Anonymize user data instead of deletion
        Useful for maintaining statistics while protecting privacy
        """
        anonymization_summary = {
            "user_id": user_id,
            "anonymized_at": datetime.now(timezone.utc).isoformat(),
            "data_categories": {}
        }
        
        async with get_db() as db:
            if DataCategory.BEHAVIORAL in data_categories:
                # Anonymize activity logs
                await db.execute(
                    update(ActivityLog)
                    .where(ActivityLog.user_id == user_id)
                    .values(
                        user_id=None,
                        ip_address="0.0.0.0",
                        user_agent="anonymized"
                    )
                )
                anonymization_summary["data_categories"]["behavioral"] = "anonymized"
            
            if DataCategory.TECHNICAL in data_categories:
                # Hash IP addresses
                user = await db.get(User, user_id)
                if user and user.last_ip_address:
                    user.last_ip_address = hashlib.sha256(
                        user.last_ip_address.encode()
                    ).hexdigest()[:16]
                    anonymization_summary["data_categories"]["technical"] = "hashed"
            
            await db.commit()
        
        return anonymization_summary
    
    async def record_data_breach(
        self,
        description: str,
        data_categories_affected: List[DataCategory],
        estimated_affected_users: int,
        risk_level: str = "medium"
    ) -> DataBreachRecord:
        """
        Record a data breach (Article 33)
        Must notify DPA within 72 hours
        """
        breach = DataBreachRecord(
            breach_id=hashlib.sha256(
                f"{datetime.now().isoformat()}{description}".encode()
            ).hexdigest()[:16],
            discovered_at=datetime.now(timezone.utc),
            reported_at=None,
            description=description,
            data_categories_affected=data_categories_affected,
            estimated_affected_users=estimated_affected_users,
            risk_level=risk_level,
            measures_taken=[]
        )
        
        self.breach_records.append(breach)
        
        # Store in database
        async with get_db() as db:
            db.add(DataBreachRecordModel(
                breach_id=breach.breach_id,
                discovered_at=breach.discovered_at,
                description=description,
                data_categories=json.dumps([cat.value for cat in data_categories_affected]),
                estimated_affected_users=estimated_affected_users,
                risk_level=risk_level
            ))
            await db.commit()
        
        # Schedule DPA notification (within 72 hours)
        asyncio.create_task(self._schedule_dpa_notification(breach))
        
        # If high risk, notify users immediately
        if risk_level == "high":
            asyncio.create_task(self._notify_affected_users(breach))
        
        return breach
    
    async def _schedule_dpa_notification(self, breach: DataBreachRecord):
        """Schedule notification to Data Protection Authority"""
        # Wait 1 hour to gather more information
        await asyncio.sleep(3600)
        
        # Send notification to DPA
        notification_data = {
            "breach_id": breach.breach_id,
            "discovered_at": breach.discovered_at.isoformat(),
            "description": breach.description,
            "data_categories": [cat.value for cat in breach.data_categories_affected],
            "estimated_affected_users": breach.estimated_affected_users,
            "risk_level": breach.risk_level,
            "measures_taken": breach.measures_taken,
            "contact": {
                "name": "Data Protection Officer",
                "email": settings.DPO_EMAIL or "dpo@openclip.pro",
                "phone": settings.DPO_PHONE or "+1-555-0123"
            }
        }
        
        # In production, this would send to actual DPA API
        print(f"DPA Notification: {json.dumps(notification_data, indent=2)}")
        
        breach.dpa_notified = True
        breach.reported_at = datetime.now(timezone.utc)
    
    async def _notify_affected_users(self, breach: DataBreachRecord):
        """Notify users affected by data breach"""
        # Get affected users
        async with get_db() as db:
            # In real implementation, determine affected users based on breach details
            users = await db.execute(
                select(User).where(User.is_active == True).limit(breach.estimated_affected_users)
            )
            
            for user in users.scalars():
                await self.email_service.send_breach_notification(
                    user.email,
                    breach.description,
                    breach.risk_level,
                    breach.measures_taken
                )
        
        breach.users_notified = True
    
    def generate_privacy_policy(self) -> str:
        """Generate privacy policy based on processing activities"""
        policy = f"""
# Privacy Policy

**Last Updated:** {datetime.now().strftime('%Y-%m-%d')}

## 1. Data Controller

OpenClip Pro
Email: {settings.SUPPORT_EMAIL or 'privacy@openclip.pro'}
Data Protection Officer: {settings.DPO_EMAIL or 'dpo@openclip.pro'}

## 2. Data We Collect

We collect the following categories of personal data:

"""
        
        # List data categories
        categories_collected = set()
        for activity in self.processing_activities:
            categories_collected.update(activity.data_categories)
        
        for category in categories_collected:
            policy += f"- **{category.value.replace('_', ' ').title()}**: "
            
            if category == DataCategory.BASIC_IDENTITY:
                policy += "Name, email address, username\n"
            elif category == DataCategory.CONTACT:
                policy += "Address, phone number\n"
            elif category == DataCategory.BEHAVIORAL:
                policy += "Usage patterns, preferences\n"
            elif category == DataCategory.CONTENT:
                policy += "Videos, projects, generated clips\n"
            elif category == DataCategory.TECHNICAL:
                policy += "IP address, device information\n"
            elif category == DataCategory.PREFERENCES:
                policy += "Settings, communication preferences\n"
        
        policy += """
## 3. Legal Basis for Processing

We process your data based on the following legal grounds:

"""
        
        # List processing activities
        for activity in self.processing_activities:
            policy += f"### {activity.name}\n"
            policy += f"- **Purpose:** {activity.purpose}\n"
            policy += f"- **Legal Basis:** {activity.lawful_basis.value.replace('_', ' ').title()}\n"
            policy += f"- **Retention Period:** {activity.retention_period.days} days\n\n"
        
        policy += """
## 4. Your Rights

Under GDPR, you have the following rights:

- **Right to Access:** Request a copy of your personal data
- **Right to Rectification:** Correct inaccurate personal data
- **Right to Erasure:** Request deletion of your personal data
- **Right to Restrict Processing:** Limit how we use your data
- **Right to Data Portability:** Receive your data in machine-readable format
- **Right to Object:** Object to certain types of processing
- **Right to Withdraw Consent:** Withdraw consent at any time

To exercise these rights, contact us at privacy@openclip.pro

## 5. Data Security

We implement appropriate technical and organizational measures to protect your data:

- Encryption of data at rest and in transit
- Access controls and authentication
- Regular security audits
- Employee training on data protection

## 6. International Transfers

Some of our service providers are located outside the EU. We ensure appropriate safeguards are in place:

- Standard Contractual Clauses
- Adequacy decisions
- Privacy Shield certification (where applicable)

## 7. Contact Us

For any privacy concerns or to exercise your rights:

Email: privacy@openclip.pro
Data Protection Officer: dpo@openclip.pro

You also have the right to lodge a complaint with your local supervisory authority.
"""
        
        return policy
    
    async def generate_consent_form(
        self,
        purposes: List[str],
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate consent form for user"""
        consent_form = {
            "version": "1.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "purposes": []
        }
        
        for purpose in purposes:
            # Find matching processing activity
            activity = next(
                (a for a in self.processing_activities if a.activity_id == purpose),
                None
            )
            
            if activity:
                consent_form["purposes"].append({
                    "id": activity.activity_id,
                    "name": activity.name,
                    "description": activity.purpose,
                    "data_categories": [cat.value for cat in activity.data_categories],
                    "retention_period_days": activity.retention_period.days,
                    "required": activity.lawful_basis != LawfulBasis.CONSENT
                })
        
        # Check existing consents if user_id provided
        if user_id and user_id in self.consent_records:
            consent_form["existing_consents"] = [
                {
                    "purpose": c.purpose,
                    "granted_at": c.granted_at.isoformat(),
                    "active": c.withdrawn_at is None
                }
                for c in self.consent_records[user_id]
            ]
        
        return consent_form
    
    async def verify_gdpr_compliance(self) -> Dict[str, Any]:
        """Verify GDPR compliance status"""
        compliance_report = {
            "compliant": True,
            "last_check": datetime.now(timezone.utc).isoformat(),
            "issues": [],
            "recommendations": []
        }
        
        # Check privacy policy exists and is up to date
        privacy_policy_path = Path("public/privacy-policy.html")
        if not privacy_policy_path.exists():
            compliance_report["compliant"] = False
            compliance_report["issues"].append("Privacy policy not found")
            compliance_report["recommendations"].append("Generate and publish privacy policy")
        
        # Check DPO appointment
        if not settings.DPO_EMAIL:
            compliance_report["issues"].append("Data Protection Officer not appointed")
            compliance_report["recommendations"].append("Appoint a DPO and update settings")
        
        # Check consent mechanisms
        if not self.consent_records:
            compliance_report["issues"].append("No consent records found")
            compliance_report["recommendations"].append("Implement consent tracking")
        
        # Check data breach procedures
        if not hasattr(self, '_breach_notification_procedure'):
            compliance_report["issues"].append("Data breach notification procedure not documented")
            compliance_report["recommendations"].append("Document breach notification procedure")
        
        # Check encryption
        try:
            # Test encryption
            test_data = "test"
            encrypted = encrypt_data(test_data)
            decrypted = decrypt_data(encrypted)
            if decrypted != test_data:
                raise ValueError("Encryption test failed")
        except Exception:
            compliance_report["compliant"] = False
            compliance_report["issues"].append("Data encryption not properly configured")
            compliance_report["recommendations"].append("Configure encryption for personal data")
        
        # Check retention policies
        for activity in self.processing_activities:
            if activity.retention_period.days > 365 * 5:  # 5 years
                compliance_report["issues"].append(
                    f"Long retention period for {activity.name}: {activity.retention_period.days} days"
                )
                compliance_report["recommendations"].append(
                    f"Review retention period for {activity.name}"
                )
        
        return compliance_report

# Database models for GDPR records
from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship

class ConsentRecordModel(Base):
    """Database model for consent records"""
    __tablename__ = "gdpr_consent_records"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    purpose = Column(String(100), nullable=False)
    lawful_basis = Column(String(50), nullable=False)
    data_categories = Column(JSON, nullable=False)
    granted_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)
    version = Column(String(10), default="1.0")
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    user = relationship("User", back_populates="consent_records")

class DataBreachRecordModel(Base):
    """Database model for data breach records"""
    __tablename__ = "gdpr_data_breaches"
    
    id = Column(Integer, primary_key=True)
    breach_id = Column(String(50), unique=True, nullable=False)
    discovered_at = Column(DateTime(timezone=True), nullable=False)
    reported_at = Column(DateTime(timezone=True), nullable=True)
    description = Column(String(1000), nullable=False)
    data_categories = Column(JSON, nullable=False)
    estimated_affected_users = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)
    measures_taken = Column(JSON, default=list)
    dpa_notified = Column(Boolean, default=False)
    users_notified = Column(Boolean, default=False)

class ActivityLog(Base):
    """Database model for activity logs"""
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details = Column(JSON, nullable=True)

# Global GDPR compliance instance
gdpr_service = GDPRComplianceService()

# API endpoints for GDPR compliance
from fastapi import APIRouter, Depends, HTTPException, status
from ..middleware.auth_middleware import get_current_user

gdpr_router = APIRouter(prefix="/gdpr", tags=["GDPR Compliance"])

@gdpr_router.get("/privacy-policy")
async def get_privacy_policy():
    """Get current privacy policy"""
    return {
        "policy": gdpr_service.generate_privacy_policy(),
        "version": "1.0",
        "last_updated": datetime.now().isoformat()
    }

@gdpr_router.post("/consent")
async def grant_consent(
    purpose: str,
    data_categories: List[str],
    current_user: User = Depends(get_current_user)
):
    """Grant consent for data processing"""
    categories = [DataCategory(cat) for cat in data_categories]
    
    consent = await gdpr_service.record_consent(
        user_id=current_user.id,
        purpose=purpose,
        lawful_basis=LawfulBasis.CONSENT,
        data_categories=categories
    )
    
    return {
        "success": True,
        "consent_id": f"{consent.user_id}_{consent.purpose}_{consent.granted_at.timestamp()}"
    }

@gdpr_router.delete("/consent/{purpose}")
async def withdraw_consent(
    purpose: str,
    current_user: User = Depends(get_current_user)
):
    """Withdraw consent for specific purpose"""
    success = await gdpr_service.withdraw_consent(current_user.id, purpose)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consent record not found"
        )
    
    return {"success": True, "message": "Consent withdrawn successfully"}

@gdpr_router.get("/my-data")
async def get_my_data(
    current_user: User = Depends(get_current_user)
):
    """Get all user data (data portability)"""
    data = await gdpr_service.get_user_data(current_user.id)
    return data

@gdpr_router.post("/export-data")
async def export_my_data(
    include_files: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Export user data in portable format"""
    export_path = await gdpr_service.export_user_data(
        current_user.id,
        include_files=include_files
    )
    
    # In production, this would return a download URL
    return {
        "success": True,
        "message": "Data export prepared",
        "download_url": f"/download/gdpr-export/{Path(export_path).name}"
    }

@gdpr_router.delete("/my-data")
async def delete_my_data(
    data_categories: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user)
):
    """Delete user data (right to erasure)"""
    categories = [DataCategory(cat) for cat in data_categories] if data_categories else None
    
    summary = await gdpr_service.delete_user_data(
        current_user.id,
        data_categories=categories
    )
    
    return {
        "success": True,
        "deletion_summary": summary
    }

@gdpr_router.post("/anonymize")
async def anonymize_my_data(
    data_categories: List[str],
    current_user: User = Depends(get_current_user)
):
    """Anonymize user data instead of deletion"""
    categories = [DataCategory(cat) for cat in data_categories]
    
    summary = await gdpr_service.anonymize_user_data(
        current_user.id,
        categories
    )
    
    return {
        "success": True,
        "anonymization_summary": summary
    }

@gdpr_router.get("/compliance-status")
async def get_compliance_status(
    current_user: User = Depends(get_current_user)
):
    """Get GDPR compliance status (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return await gdpr_service.verify_gdpr_compliance()
