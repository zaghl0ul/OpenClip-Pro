"""
SSL Certificate Management Service
Implements automated certificate provisioning, renewal, and monitoring
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import ssl
import socket
from dataclasses import dataclass
from enum import Enum

import certbot.main
import OpenSSL.crypto
from acme import client as acme_client
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import aiohttp
import boto3
from botocore.exceptions import ClientError

from ..config import settings
from ..services.monitoring_service import monitoring, errors_total
from ..utils.notification_service import NotificationService

logger = logging.getLogger(__name__)

class CertificateProvider(str, Enum):
    """Certificate providers"""
    LETSENCRYPT = "letsencrypt"
    AWS_ACM = "aws_acm"
    CUSTOM = "custom"

class CertificateStatus(str, Enum):
    """Certificate status"""
    ACTIVE = "active"
    EXPIRED = "expired"
    EXPIRING_SOON = "expiring_soon"
    RENEWAL_NEEDED = "renewal_needed"
    INVALID = "invalid"

@dataclass
class Certificate:
    """SSL Certificate information"""
    domain: str
    common_name: str
    san_domains: List[str]
    issuer: str
    serial_number: str
    not_before: datetime
    not_after: datetime
    fingerprint: str
    public_key: str
    private_key_path: Optional[str] = None
    certificate_path: Optional[str] = None
    chain_path: Optional[str] = None
    provider: CertificateProvider = CertificateProvider.LETSENCRYPT
    
    @property
    def days_until_expiry(self) -> int:
        """Calculate days until certificate expires"""
        return (self.not_after - datetime.now(timezone.utc)).days
    
    @property
    def status(self) -> CertificateStatus:
        """Get certificate status"""
        days_left = self.days_until_expiry
        
        if days_left < 0:
            return CertificateStatus.EXPIRED
        elif days_left < 30:
            return CertificateStatus.EXPIRING_SOON
        elif days_left < 60:
            return CertificateStatus.RENEWAL_NEEDED
        else:
            return CertificateStatus.ACTIVE
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "domain": self.domain,
            "common_name": self.common_name,
            "san_domains": self.san_domains,
            "issuer": self.issuer,
            "serial_number": self.serial_number,
            "not_before": self.not_before.isoformat(),
            "not_after": self.not_after.isoformat(),
            "fingerprint": self.fingerprint,
            "days_until_expiry": self.days_until_expiry,
            "status": self.status.value,
            "provider": self.provider.value
        }

class SSLCertificateManager:
    """
    Comprehensive SSL certificate management
    Handles provisioning, renewal, and monitoring
    """
    
    def __init__(self):
        self.certificates: Dict[str, Certificate] = {}
        self.config = self._load_config()
        self.notification_service = NotificationService()
        self._monitoring_task: Optional[asyncio.Task] = None
        
        # Certificate storage paths
        self.cert_dir = Path(settings.SSL_CERT_DIR or "/etc/ssl/certs/openclip")
        self.cert_dir.mkdir(parents=True, exist_ok=True)
        
        # AWS ACM client for AWS certificates
        if settings.AWS_ACCESS_KEY_ID:
            self.acm_client = boto3.client('acm', region_name=settings.AWS_REGION)
            self.route53_client = boto3.client('route53', region_name=settings.AWS_REGION)
        
        logger.info("SSLCertificateManager initialized")
    
    def _load_config(self) -> Dict[str, Any]:
        """Load SSL configuration"""
        return {
            "primary_domain": settings.PRIMARY_DOMAIN or "openclip.pro",
            "domains": [
                settings.PRIMARY_DOMAIN or "openclip.pro",
                f"www.{settings.PRIMARY_DOMAIN or 'openclip.pro'}",
                f"api.{settings.PRIMARY_DOMAIN or 'openclip.pro'}",
                f"cdn.{settings.PRIMARY_DOMAIN or 'openclip.pro'}"
            ],
            "email": settings.SSL_EMAIL or "ssl@openclip.pro",
            "provider": CertificateProvider(settings.SSL_PROVIDER or "letsencrypt"),
            "staging": settings.ENVIRONMENT != "production",
            "key_size": 4096,
            "renewal_days_before_expiry": 30,
            "dns_provider": settings.DNS_PROVIDER or "route53"
        }
    
    async def initialize(self):
        """Initialize certificate manager"""
        # Load existing certificates
        await self._load_existing_certificates()
        
        # Start monitoring
        self._monitoring_task = asyncio.create_task(self._monitor_certificates())
        
        # Check and provision missing certificates
        await self._provision_missing_certificates()
        
        logger.info(f"Certificate manager initialized with {len(self.certificates)} certificates")
    
    async def _load_existing_certificates(self):
        """Load existing certificates from disk and cloud providers"""
        # Load from local storage
        for cert_file in self.cert_dir.glob("*.crt"):
            try:
                cert = await self._load_certificate_from_file(cert_file)
                if cert:
                    self.certificates[cert.domain] = cert
                    logger.info(f"Loaded certificate for {cert.domain}")
            except Exception as e:
                logger.error(f"Failed to load certificate {cert_file}: {str(e)}")
        
        # Load from AWS ACM if configured
        if hasattr(self, 'acm_client'):
            await self._load_acm_certificates()
    
    async def _load_certificate_from_file(self, cert_path: Path) -> Optional[Certificate]:
        """Load certificate from file"""
        try:
            with open(cert_path, 'rb') as f:
                cert_data = f.read()
            
            # Parse certificate
            cert = x509.load_pem_x509_certificate(cert_data, default_backend())
            
            # Extract information
            common_name = None
            san_domains = []
            
            for attribute in cert.subject:
                if attribute.oid._name == 'commonName':
                    common_name = attribute.value
            
            try:
                san_ext = cert.extensions.get_extension_for_oid(
                    x509.oid.ExtensionOID.SUBJECT_ALTERNATIVE_NAME
                )
                san_domains = [name.value for name in san_ext.value]
            except x509.ExtensionNotFound:
                pass
            
            # Get issuer
            issuer = cert.issuer.rfc4514_string()
            
            # Create certificate object
            return Certificate(
                domain=common_name or san_domains[0] if san_domains else "unknown",
                common_name=common_name or "",
                san_domains=san_domains,
                issuer=issuer,
                serial_number=str(cert.serial_number),
                not_before=cert.not_valid_before.replace(tzinfo=timezone.utc),
                not_after=cert.not_valid_after.replace(tzinfo=timezone.utc),
                fingerprint=cert.fingerprint(hashes.SHA256()).hex(),
                public_key=cert.public_key().public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ).decode(),
                certificate_path=str(cert_path),
                chain_path=str(cert_path.with_suffix('.chain')),
                private_key_path=str(cert_path.with_suffix('.key'))
            )
            
        except Exception as e:
            logger.error(f"Error parsing certificate {cert_path}: {str(e)}")
            return None
    
    async def _load_acm_certificates(self):
        """Load certificates from AWS ACM"""
        try:
            paginator = self.acm_client.get_paginator('list_certificates')
            
            for page in paginator.paginate():
                for cert_summary in page['CertificateSummaryList']:
                    cert_arn = cert_summary['CertificateArn']
                    
                    # Get certificate details
                    cert_details = self.acm_client.describe_certificate(
                        CertificateArn=cert_arn
                    )['Certificate']
                    
                    # Create certificate object
                    cert = Certificate(
                        domain=cert_details['DomainName'],
                        common_name=cert_details['DomainName'],
                        san_domains=cert_details.get('SubjectAlternativeNames', []),
                        issuer=cert_details.get('Issuer', 'AWS ACM'),
                        serial_number=cert_details.get('Serial', ''),
                        not_before=cert_details['CreatedAt'],
                        not_after=cert_details['NotAfter'],
                        fingerprint=cert_arn,  # Use ARN as fingerprint
                        public_key="",  # Not available from ACM
                        provider=CertificateProvider.AWS_ACM
                    )
                    
                    self.certificates[cert.domain] = cert
                    
        except Exception as e:
            logger.error(f"Failed to load ACM certificates: {str(e)}")
    
    async def provision_certificate(
        self,
        domain: str,
        san_domains: Optional[List[str]] = None,
        provider: Optional[CertificateProvider] = None
    ) -> Certificate:
        """Provision a new SSL certificate"""
        provider = provider or self.config["provider"]
        san_domains = san_domains or []
        
        logger.info(f"Provisioning certificate for {domain} using {provider.value}")
        
        try:
            if provider == CertificateProvider.LETSENCRYPT:
                cert = await self._provision_letsencrypt(domain, san_domains)
            elif provider == CertificateProvider.AWS_ACM:
                cert = await self._provision_acm(domain, san_domains)
            else:
                cert = await self._provision_custom(domain, san_domains)
            
            # Store certificate
            self.certificates[domain] = cert
            
            # Send notification
            await self.notification_service.send(
                "ssl_certificate_provisioned",
                {
                    "domain": domain,
                    "provider": provider.value,
                    "expiry": cert.not_after.isoformat()
                }
            )
            
            return cert
            
        except Exception as e:
            logger.error(f"Failed to provision certificate for {domain}: {str(e)}")
            errors_total.labels(
                type='ssl_provisioning',
                severity='critical',
                component='ssl'
            ).inc()
            raise
    
    async def _provision_letsencrypt(
        self,
        domain: str,
        san_domains: List[str]
    ) -> Certificate:
        """Provision Let's Encrypt certificate using Certbot"""
        domains = [domain] + san_domains
        
        # Prepare Certbot arguments
        args = [
            'certonly',
            '--non-interactive',
            '--agree-tos',
            '--email', self.config["email"],
            '--webroot',
            '--webroot-path', '/var/www/certbot',
            '-d', ','.join(domains),
            '--key-type', 'rsa',
            '--rsa-key-size', str(self.config["key_size"])
        ]
        
        if self.config["staging"]:
            args.append('--staging')
        
        # Run Certbot
        result = await asyncio.create_subprocess_exec(
            'certbot',
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await result.communicate()
        
        if result.returncode != 0:
            raise Exception(f"Certbot failed: {stderr.decode()}")
        
        # Load the provisioned certificate
        cert_path = Path(f"/etc/letsencrypt/live/{domain}/fullchain.pem")
        key_path = Path(f"/etc/letsencrypt/live/{domain}/privkey.pem")
        
        # Copy to our certificate directory
        import shutil
        shutil.copy(cert_path, self.cert_dir / f"{domain}.crt")
        shutil.copy(key_path, self.cert_dir / f"{domain}.key")
        shutil.copy(
            Path(f"/etc/letsencrypt/live/{domain}/chain.pem"),
            self.cert_dir / f"{domain}.chain"
        )
        
        # Load and return certificate
        return await self._load_certificate_from_file(self.cert_dir / f"{domain}.crt")
    
    async def _provision_acm(
        self,
        domain: str,
        san_domains: List[str]
    ) -> Certificate:
        """Provision certificate using AWS ACM"""
        domains = [domain] + san_domains
        
        # Request certificate
        response = self.acm_client.request_certificate(
            DomainName=domain,
            SubjectAlternativeNames=domains,
            ValidationMethod='DNS',
            Tags=[
                {
                    'Key': 'Environment',
                    'Value': settings.ENVIRONMENT
                },
                {
                    'Key': 'ManagedBy',
                    'Value': 'OpenClipPro'
                }
            ]
        )
        
        cert_arn = response['CertificateArn']
        
        # Wait for validation records
        await asyncio.sleep(10)
        
        # Get validation records
        cert_details = self.acm_client.describe_certificate(
            CertificateArn=cert_arn
        )['Certificate']
        
        # Create DNS validation records
        for validation in cert_details['DomainValidationOptions']:
            if validation['ValidationMethod'] == 'DNS':
                record = validation['ResourceRecord']
                
                # Create Route53 record
                await self._create_route53_record(
                    validation['DomainName'],
                    record['Name'],
                    record['Value'],
                    record['Type']
                )
        
        # Wait for validation
        waiter = self.acm_client.get_waiter('certificate_validated')
        await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: waiter.wait(
                CertificateArn=cert_arn,
                WaiterConfig={'Delay': 30, 'MaxAttempts': 60}
            )
        )
        
        # Get final certificate details
        cert_details = self.acm_client.describe_certificate(
            CertificateArn=cert_arn
        )['Certificate']
        
        return Certificate(
            domain=domain,
            common_name=domain,
            san_domains=domains,
            issuer='Amazon',
            serial_number=cert_details.get('Serial', ''),
            not_before=cert_details['CreatedAt'],
            not_after=cert_details['NotAfter'],
            fingerprint=cert_arn,
            public_key="",
            provider=CertificateProvider.AWS_ACM
        )
    
    async def renew_certificate(self, domain: str) -> Certificate:
        """Renew an existing certificate"""
        cert = self.certificates.get(domain)
        if not cert:
            raise ValueError(f"No certificate found for {domain}")
        
        logger.info(f"Renewing certificate for {domain}")
        
        # Check if renewal is needed
        if cert.days_until_expiry > self.config["renewal_days_before_expiry"]:
            logger.info(f"Certificate for {domain} does not need renewal yet")
            return cert
        
        # Provision new certificate
        new_cert = await self.provision_certificate(
            domain,
            cert.san_domains,
            cert.provider
        )
        
        # Backup old certificate
        if cert.certificate_path:
            backup_path = Path(cert.certificate_path).with_suffix('.backup')
            import shutil
            shutil.copy(cert.certificate_path, backup_path)
        
        return new_cert
    
    async def _monitor_certificates(self):
        """Monitor certificates for expiration and renewal"""
        while True:
            try:
                for domain, cert in self.certificates.items():
                    # Check certificate status
                    if cert.status == CertificateStatus.EXPIRED:
                        logger.error(f"Certificate for {domain} has expired!")
                        await self.notification_service.send_critical(
                            "ssl_certificate_expired",
                            {"domain": domain, "expired_at": cert.not_after.isoformat()}
                        )
                    
                    elif cert.status == CertificateStatus.EXPIRING_SOON:
                        logger.warning(f"Certificate for {domain} expiring in {cert.days_until_expiry} days")
                        
                        # Attempt automatic renewal
                        try:
                            await self.renew_certificate(domain)
                            logger.info(f"Successfully renewed certificate for {domain}")
                        except Exception as e:
                            logger.error(f"Failed to renew certificate for {domain}: {str(e)}")
                            await self.notification_service.send_critical(
                                "ssl_certificate_renewal_failed",
                                {
                                    "domain": domain,
                                    "error": str(e),
                                    "days_until_expiry": cert.days_until_expiry
                                }
                            )
                    
                    elif cert.status == CertificateStatus.RENEWAL_NEEDED:
                        logger.info(f"Certificate for {domain} needs renewal ({cert.days_until_expiry} days left)")
                
                # Update metrics
                monitoring.track_metric(
                    "ssl_certificates_total",
                    len(self.certificates),
                    operation="set"
                )
                
                expiring_count = sum(
                    1 for cert in self.certificates.values()
                    if cert.status in [CertificateStatus.EXPIRING_SOON, CertificateStatus.EXPIRED]
                )
                
                monitoring.track_metric(
                    "ssl_certificates_expiring",
                    expiring_count,
                    operation="set"
                )
                
                # Check every hour
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Certificate monitoring error: {str(e)}")
                await asyncio.sleep(300)  # Retry in 5 minutes
    
    async def _provision_missing_certificates(self):
        """Provision certificates for configured domains"""
        for domain in self.config["domains"]:
            if domain not in self.certificates:
                try:
                    logger.info(f"Provisioning missing certificate for {domain}")
                    await self.provision_certificate(domain)
                except Exception as e:
                    logger.error(f"Failed to provision certificate for {domain}: {str(e)}")
    
    async def _create_route53_record(
        self,
        domain: str,
        name: str,
        value: str,
        record_type: str
    ):
        """Create Route53 DNS record for validation"""
        # Find hosted zone
        zones = self.route53_client.list_hosted_zones_by_name(
            DNSName=domain
        )['HostedZones']
        
        if not zones:
            raise ValueError(f"No hosted zone found for {domain}")
        
        zone_id = zones[0]['Id']
        
        # Create record
        self.route53_client.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': name,
                        'Type': record_type,
                        'TTL': 300,
                        'ResourceRecords': [{'Value': value}]
                    }
                }]
            }
        )
    
    def verify_certificate_chain(self, cert_path: str, chain_path: str) -> bool:
        """Verify certificate chain validity"""
        try:
            # Load certificate and chain
            with open(cert_path, 'r') as f:
                cert_pem = f.read()
            
            with open(chain_path, 'r') as f:
                chain_pem = f.read()
            
            # Create SSL context
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_REQUIRED
            
            # Load certificate chain
            context.load_cert_chain(cert_path, chain_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Certificate chain verification failed: {str(e)}")
            return False
    
    async def get_certificate_info(self, domain: str) -> Optional[Dict[str, Any]]:
        """Get certificate information for a domain"""
        cert = self.certificates.get(domain)
        if cert:
            return cert.to_dict()
        
        return None
    
    async def export_certificates(self, format: str = "pem") -> Dict[str, str]:
        """Export all certificates in specified format"""
        exports = {}
        
        for domain, cert in self.certificates.items():
            if cert.certificate_path:
                with open(cert.certificate_path, 'r') as f:
                    exports[domain] = f.read()
        
        return exports
    
    async def cleanup(self):
        """Clean up certificate manager"""
        if self._monitoring_task:
            self._monitoring_task.cancel()
            await asyncio.gather(self._monitoring_task, return_exceptions=True)

# Global certificate manager instance
ssl_manager = SSLCertificateManager()
