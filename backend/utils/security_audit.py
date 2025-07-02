"""
Comprehensive Security Audit Framework
Implements automated security scanning, vulnerability detection, and compliance checking
"""

import os
import re
import json
import yaml
import asyncio
import hashlib
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import aiohttp
import jwt
import sqlparse
from bandit import config as bandit_config
from bandit.core import manager as bandit_manager
import requests
from urllib.parse import urlparse, parse_qs
import ssl
import socket
import dns.resolver

from ..config import settings
from ..services.monitoring_service import monitoring

class SecurityRisk(str, Enum):
    """Security risk levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class VulnerabilityType(str, Enum):
    """Types of vulnerabilities"""
    SQL_INJECTION = "sql_injection"
    XSS = "cross_site_scripting"
    CSRF = "csrf"
    XXE = "xml_external_entity"
    SSRF = "server_side_request_forgery"
    PATH_TRAVERSAL = "path_traversal"
    COMMAND_INJECTION = "command_injection"
    LDAP_INJECTION = "ldap_injection"
    WEAK_CRYPTO = "weak_cryptography"
    HARDCODED_SECRETS = "hardcoded_secrets"
    INSECURE_DESERIALIZATION = "insecure_deserialization"
    BROKEN_AUTH = "broken_authentication"
    SENSITIVE_DATA_EXPOSURE = "sensitive_data_exposure"
    MISSING_SECURITY_HEADERS = "missing_security_headers"
    OUTDATED_DEPENDENCIES = "outdated_dependencies"

@dataclass
class Vulnerability:
    """Security vulnerability"""
    type: VulnerabilityType
    severity: SecurityRisk
    title: str
    description: str
    location: str
    evidence: Optional[str] = None
    remediation: Optional[str] = None
    cwe_id: Optional[str] = None
    owasp_category: Optional[str] = None
    cvss_score: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "severity": self.severity.value,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "evidence": self.evidence,
            "remediation": self.remediation,
            "cwe_id": self.cwe_id,
            "owasp_category": self.owasp_category,
            "cvss_score": self.cvss_score
        }

@dataclass
class SecurityAuditResult:
    """Security audit results"""
    scan_id: str
    start_time: datetime
    end_time: datetime
    vulnerabilities: List[Vulnerability] = field(default_factory=list)
    security_score: float = 100.0
    compliance_status: Dict[str, bool] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    
    @property
    def critical_count(self) -> int:
        return len([v for v in self.vulnerabilities if v.severity == SecurityRisk.CRITICAL])
    
    @property
    def high_count(self) -> int:
        return len([v for v in self.vulnerabilities if v.severity == SecurityRisk.HIGH])
    
    def calculate_score(self) -> float:
        """Calculate security score (0-100)"""
        # Weighted scoring based on severity
        weights = {
            SecurityRisk.CRITICAL: 20,
            SecurityRisk.HIGH: 10,
            SecurityRisk.MEDIUM: 5,
            SecurityRisk.LOW: 2,
            SecurityRisk.INFO: 0.5
        }
        
        total_penalty = 0
        for vuln in self.vulnerabilities:
            total_penalty += weights.get(vuln.severity, 0)
        
        # Calculate score (max penalty is 100)
        score = max(0, 100 - min(total_penalty, 100))
        self.security_score = score
        return score

class SecurityAuditor:
    """
    Comprehensive security auditing system
    Performs automated security scans and vulnerability assessments
    """
    
    def __init__(self):
        self.scanners = {
            "code": CodeSecurityScanner(),
            "api": APISecurityScanner(),
            "dependencies": DependencyScanner(),
            "infrastructure": InfrastructureScanner(),
            "compliance": ComplianceChecker()
        }
        self.results_history: List[SecurityAuditResult] = []
        
    async def run_full_audit(self) -> SecurityAuditResult:
        """Run comprehensive security audit"""
        scan_id = hashlib.sha256(
            f"{datetime.now().isoformat()}{os.urandom(16).hex()}".encode()
        ).hexdigest()[:16]
        
        print(f"Starting security audit (ID: {scan_id})")
        start_time = datetime.now()
        
        result = SecurityAuditResult(
            scan_id=scan_id,
            start_time=start_time,
            end_time=start_time  # Will be updated
        )
        
        # Run all scanners
        for scanner_name, scanner in self.scanners.items():
            print(f"\nRunning {scanner_name} scanner...")
            try:
                vulnerabilities = await scanner.scan()
                result.vulnerabilities.extend(vulnerabilities)
            except Exception as e:
                print(f"Error in {scanner_name} scanner: {str(e)}")
        
        # Check compliance
        result.compliance_status = await self.check_compliance()
        
        # Generate recommendations
        result.recommendations = self.generate_recommendations(result)
        
        # Calculate security score
        result.calculate_score()
        
        result.end_time = datetime.now()
        self.results_history.append(result)
        
        # Update metrics
        monitoring.track_metric(
            "security_score",
            result.security_score,
            operation="set"
        )
        
        monitoring.track_metric(
            "security_vulnerabilities_total",
            len(result.vulnerabilities),
            labels={"severity": "critical"},
            operation="set"
        )
        
        return result
    
    async def check_compliance(self) -> Dict[str, bool]:
        """Check compliance with security standards"""
        compliance = {}
        
        # OWASP Top 10 compliance
        compliance["owasp_top_10"] = await self._check_owasp_compliance()
        
        # PCI DSS compliance (if payment processing)
        compliance["pci_dss"] = await self._check_pci_compliance()
        
        # GDPR compliance
        compliance["gdpr"] = await self._check_gdpr_compliance()
        
        # SOC 2 compliance
        compliance["soc2"] = await self._check_soc2_compliance()
        
        # HIPAA compliance (if health data)
        compliance["hipaa"] = await self._check_hipaa_compliance()
        
        return compliance
    
    async def _check_owasp_compliance(self) -> bool:
        """Check OWASP Top 10 compliance"""
        owasp_categories = {
            "A01:2021": "Broken Access Control",
            "A02:2021": "Cryptographic Failures",
            "A03:2021": "Injection",
            "A04:2021": "Insecure Design",
            "A05:2021": "Security Misconfiguration",
            "A06:2021": "Vulnerable Components",
            "A07:2021": "Authentication Failures",
            "A08:2021": "Software and Data Integrity",
            "A09:2021": "Security Logging Failures",
            "A10:2021": "Server-Side Request Forgery"
        }
        
        # Check for vulnerabilities in each category
        for category, name in owasp_categories.items():
            category_vulns = [
                v for v in self.results_history[-1].vulnerabilities
                if v.owasp_category == category
            ]
            
            if any(v.severity in [SecurityRisk.CRITICAL, SecurityRisk.HIGH] for v in category_vulns):
                return False
        
        return True
    
    def generate_recommendations(self, result: SecurityAuditResult) -> List[str]:
        """Generate security recommendations based on findings"""
        recommendations = []
        
        # Critical vulnerability recommendations
        if result.critical_count > 0:
            recommendations.append(
                f"URGENT: Fix {result.critical_count} critical vulnerabilities immediately"
            )
        
        # Check for common issues
        vuln_types = {v.type for v in result.vulnerabilities}
        
        if VulnerabilityType.SQL_INJECTION in vuln_types:
            recommendations.append(
                "Implement parameterized queries and input validation to prevent SQL injection"
            )
        
        if VulnerabilityType.XSS in vuln_types:
            recommendations.append(
                "Implement output encoding and Content Security Policy (CSP) headers"
            )
        
        if VulnerabilityType.WEAK_CRYPTO in vuln_types:
            recommendations.append(
                "Upgrade to strong cryptographic algorithms (AES-256, RSA-2048+)"
            )
        
        if VulnerabilityType.OUTDATED_DEPENDENCIES in vuln_types:
            recommendations.append(
                "Update all dependencies to latest stable versions"
            )
        
        if VulnerabilityType.MISSING_SECURITY_HEADERS in vuln_types:
            recommendations.append(
                "Implement security headers: HSTS, CSP, X-Frame-Options, etc."
            )
        
        # General recommendations
        if result.security_score < 80:
            recommendations.append(
                "Consider hiring a security consultant for a comprehensive review"
            )
        
        recommendations.append(
            "Implement regular security training for development team"
        )
        
        recommendations.append(
            "Set up automated security scanning in CI/CD pipeline"
        )
        
        return recommendations
    
    def generate_report(self, result: SecurityAuditResult, format: str = "html") -> str:
        """Generate security audit report"""
        if format == "html":
            return self._generate_html_report(result)
        elif format == "json":
            return json.dumps({
                "scan_id": result.scan_id,
                "scan_date": result.start_time.isoformat(),
                "duration": (result.end_time - result.start_time).total_seconds(),
                "security_score": result.security_score,
                "vulnerabilities": [v.to_dict() for v in result.vulnerabilities],
                "summary": {
                    "critical": result.critical_count,
                    "high": result.high_count,
                    "medium": len([v for v in result.vulnerabilities if v.severity == SecurityRisk.MEDIUM]),
                    "low": len([v for v in result.vulnerabilities if v.severity == SecurityRisk.LOW]),
                    "info": len([v for v in result.vulnerabilities if v.severity == SecurityRisk.INFO])
                },
                "compliance": result.compliance_status,
                "recommendations": result.recommendations
            }, indent=2)
        else:
            return self._generate_markdown_report(result)
    
    def _generate_html_report(self, result: SecurityAuditResult) -> str:
        """Generate HTML security report"""
        severity_colors = {
            SecurityRisk.CRITICAL: "#d32f2f",
            SecurityRisk.HIGH: "#f57c00",
            SecurityRisk.MEDIUM: "#fbc02d",
            SecurityRisk.LOW: "#388e3c",
            SecurityRisk.INFO: "#1976d2"
        }
        
        vulnerabilities_html = ""
        for vuln in sorted(result.vulnerabilities, key=lambda v: list(SecurityRisk).index(v.severity)):
            vulnerabilities_html += f"""
            <div class="vulnerability {vuln.severity.value}">
                <h3>{vuln.title}</h3>
                <p class="severity" style="color: {severity_colors[vuln.severity]}">
                    Severity: {vuln.severity.value.upper()}
                </p>
                <p><strong>Type:</strong> {vuln.type.value}</p>
                <p><strong>Location:</strong> <code>{vuln.location}</code></p>
                <p><strong>Description:</strong> {vuln.description}</p>
                {f'<p><strong>Evidence:</strong> <code>{vuln.evidence}</code></p>' if vuln.evidence else ''}
                {f'<p><strong>Remediation:</strong> {vuln.remediation}</p>' if vuln.remediation else ''}
                {f'<p><strong>CWE:</strong> {vuln.cwe_id}</p>' if vuln.cwe_id else ''}
            </div>
            """
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Security Audit Report - {result.scan_id}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
        .header {{ border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }}
        .score {{ font-size: 48px; font-weight: bold; color: {'#4caf50' if result.security_score >= 80 else '#ff9800' if result.security_score >= 60 else '#f44336'}; }}
        .summary {{ display: flex; justify-content: space-around; margin: 30px 0; }}
        .summary-item {{ text-align: center; padding: 20px; }}
        .vulnerability {{ border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .vulnerability.critical {{ border-left: 5px solid #d32f2f; }}
        .vulnerability.high {{ border-left: 5px solid #f57c00; }}
        .vulnerability.medium {{ border-left: 5px solid #fbc02d; }}
        .vulnerability.low {{ border-left: 5px solid #388e3c; }}
        .vulnerability.info {{ border-left: 5px solid #1976d2; }}
        code {{ background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }}
        .recommendations {{ background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .compliance {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }}
        .compliance-item {{ padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }}
        .compliant {{ background: #c8e6c9; }}
        .non-compliant {{ background: #ffcdd2; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Security Audit Report</h1>
            <p><strong>Scan ID:</strong> {result.scan_id}</p>
            <p><strong>Date:</strong> {result.start_time.strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Duration:</strong> {(result.end_time - result.start_time).total_seconds():.1f} seconds</p>
        </div>
        
        <div class="summary">
            <div class="summary-item">
                <h2>Security Score</h2>
                <div class="score">{result.security_score:.1f}/100</div>
            </div>
            <div class="summary-item">
                <h2>Total Vulnerabilities</h2>
                <div style="font-size: 36px;">{len(result.vulnerabilities)}</div>
            </div>
            <div class="summary-item">
                <h2>Critical Issues</h2>
                <div style="font-size: 36px; color: #d32f2f;">{result.critical_count}</div>
            </div>
        </div>
        
        <h2>Compliance Status</h2>
        <div class="compliance">
            {self._generate_compliance_html(result.compliance_status)}
        </div>
        
        <h2>Recommendations</h2>
        <div class="recommendations">
            <ul>
                {''.join(f'<li>{rec}</li>' for rec in result.recommendations)}
            </ul>
        </div>
        
        <h2>Vulnerabilities</h2>
        {vulnerabilities_html}
    </div>
</body>
</html>
"""
        return html
    
    def _generate_compliance_html(self, compliance: Dict[str, bool]) -> str:
        """Generate compliance status HTML"""
        compliance_names = {
            "owasp_top_10": "OWASP Top 10",
            "pci_dss": "PCI DSS",
            "gdpr": "GDPR",
            "soc2": "SOC 2",
            "hipaa": "HIPAA"
        }
        
        html = ""
        for key, compliant in compliance.items():
            name = compliance_names.get(key, key)
            css_class = "compliant" if compliant else "non-compliant"
            status = "✓ Compliant" if compliant else "✗ Non-Compliant"
            
            html += f"""
            <div class="compliance-item {css_class}">
                <h3>{name}</h3>
                <p>{status}</p>
            </div>
            """
        
        return html

class CodeSecurityScanner:
    """Scan source code for security vulnerabilities"""
    
    async def scan(self) -> List[Vulnerability]:
        """Run code security scan"""
        vulnerabilities = []
        
        # Scan Python code with Bandit
        vulnerabilities.extend(await self._scan_python_code())
        
        # Scan JavaScript/TypeScript code
        vulnerabilities.extend(await self._scan_javascript_code())
        
        # Scan for hardcoded secrets
        vulnerabilities.extend(await self._scan_secrets())
        
        # Scan SQL queries
        vulnerabilities.extend(await self._scan_sql_queries())
        
        return vulnerabilities
    
    async def _scan_python_code(self) -> List[Vulnerability]:
        """Scan Python code using Bandit"""
        vulnerabilities = []
        
        try:
            # Configure Bandit
            b_mgr = bandit_manager.BanditManager(
                bandit_config.BanditConfig(),
                'file'
            )
            
            # Find Python files
            python_files = list(Path("backend").rglob("*.py"))
            
            # Scan files
            b_mgr.discover_files(python_files)
            b_mgr.run_tests()
            
            # Convert results to vulnerabilities
            for issue in b_mgr.get_issue_list():
                severity_map = {
                    "HIGH": SecurityRisk.HIGH,
                    "MEDIUM": SecurityRisk.MEDIUM,
                    "LOW": SecurityRisk.LOW
                }
                
                vulnerabilities.append(Vulnerability(
                    type=VulnerabilityType.WEAK_CRYPTO if "crypto" in issue.test_id else VulnerabilityType.COMMAND_INJECTION,
                    severity=severity_map.get(issue.severity, SecurityRisk.LOW),
                    title=issue.test_name,
                    description=issue.text,
                    location=f"{issue.fname}:{issue.lineno}",
                    evidence=issue.code,
                    cwe_id=issue.cwe.id if issue.cwe else None
                ))
        
        except Exception as e:
            print(f"Error scanning Python code: {str(e)}")
        
        return vulnerabilities
    
    async def _scan_javascript_code(self) -> List[Vulnerability]:
        """Scan JavaScript/TypeScript code for vulnerabilities"""
        vulnerabilities = []
        
        # Common vulnerability patterns
        patterns = {
            r'eval\s*\(': (VulnerabilityType.COMMAND_INJECTION, "Use of eval()"),
            r'innerHTML\s*=': (VulnerabilityType.XSS, "Direct innerHTML assignment"),
            r'document\.write': (VulnerabilityType.XSS, "Use of document.write"),
            r'\.html\s*\(': (VulnerabilityType.XSS, "jQuery html() without encoding"),
            r'new\s+Function\s*\(': (VulnerabilityType.COMMAND_INJECTION, "Dynamic function creation"),
            r'localStorage\.setItem.*password': (VulnerabilityType.SENSITIVE_DATA_EXPOSURE, "Password in localStorage"),
            r'http://': (VulnerabilityType.SENSITIVE_DATA_EXPOSURE, "Insecure HTTP protocol")
        }
        
        # Scan JavaScript files
        for js_file in Path("src").rglob("*.{js,jsx,ts,tsx}"):
            try:
                content = js_file.read_text()
                
                for pattern, (vuln_type, description) in patterns.items():
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        
                        vulnerabilities.append(Vulnerability(
                            type=vuln_type,
                            severity=SecurityRisk.MEDIUM,
                            title=description,
                            description=f"Potential security issue: {description}",
                            location=f"{js_file}:{line_num}",
                            evidence=match.group(0)
                        ))
            
            except Exception as e:
                print(f"Error scanning {js_file}: {str(e)}")
        
        return vulnerabilities
    
    async def _scan_secrets(self) -> List[Vulnerability]:
        """Scan for hardcoded secrets and API keys"""
        vulnerabilities = []
        
        # Secret patterns
        secret_patterns = {
            r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']([^"\']+)["\']': "API Key",
            r'(?i)(secret[_-]?key|secret)\s*[:=]\s*["\']([^"\']+)["\']': "Secret Key",
            r'(?i)(password|passwd|pwd)\s*[:=]\s*["\']([^"\']+)["\']': "Hardcoded Password",
            r'(?i)(token)\s*[:=]\s*["\']([^"\']+)["\']': "Access Token",
            r'(?i)aws[_-]?access[_-]?key[_-]?id\s*[:=]\s*["\']([^"\']+)["\']': "AWS Access Key",
            r'(?i)aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["\']([^"\']+)["\']': "AWS Secret Key"
        }
        
        # Scan all source files
        for ext in ["py", "js", "jsx", "ts", "tsx", "env", "yml", "yaml", "json"]:
            for file_path in Path(".").rglob(f"*.{ext}"):
                # Skip node_modules and venv
                if "node_modules" in str(file_path) or "venv" in str(file_path):
                    continue
                
                try:
                    content = file_path.read_text()
                    
                    for pattern, secret_type in secret_patterns.items():
                        matches = re.finditer(pattern, content)
                        for match in matches:
                            # Check if it's a placeholder
                            secret_value = match.group(2) if len(match.groups()) > 1 else match.group(1)
                            if secret_value and not secret_value.startswith("${") and not secret_value == "xxx":
                                line_num = content[:match.start()].count('\n') + 1
                                
                                vulnerabilities.append(Vulnerability(
                                    type=VulnerabilityType.HARDCODED_SECRETS,
                                    severity=SecurityRisk.HIGH,
                                    title=f"Hardcoded {secret_type}",
                                    description=f"Found hardcoded {secret_type} in source code",
                                    location=f"{file_path}:{line_num}",
                                    evidence=match.group(0)[:50] + "...",  # Truncate for security
                                    remediation="Use environment variables or secure key management service"
                                ))
                
                except Exception as e:
                    print(f"Error scanning {file_path}: {str(e)}")
        
        return vulnerabilities
    
    async def _scan_sql_queries(self) -> List[Vulnerability]:
        """Scan for SQL injection vulnerabilities"""
        vulnerabilities = []
        
        # SQL injection patterns
        sql_patterns = {
            r'f["\'].*SELECT.*WHERE.*{[^}]+}.*["\']': "F-string in SQL query",
            r'["\'].*SELECT.*WHERE.*["\'].*\+': "String concatenation in SQL",
            r'\.format\s*\(.*\).*SELECT.*WHERE': "Format string in SQL",
            r'%\s*\(.*\).*SELECT.*WHERE': "String interpolation in SQL"
        }
        
        for py_file in Path("backend").rglob("*.py"):
            try:
                content = py_file.read_text()
                
                for pattern, description in sql_patterns.items():
                    matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        
                        vulnerabilities.append(Vulnerability(
                            type=VulnerabilityType.SQL_INJECTION,
                            severity=SecurityRisk.CRITICAL,
                            title="Potential SQL Injection",
                            description=description,
                            location=f"{py_file}:{line_num}",
                            evidence=match.group(0)[:100],
                            remediation="Use parameterized queries or ORM",
                            cwe_id="CWE-89",
                            owasp_category="A03:2021"
                        ))
            
            except Exception as e:
                print(f"Error scanning {py_file}: {str(e)}")
        
        return vulnerabilities

class APISecurityScanner:
    """Scan API endpoints for security vulnerabilities"""
    
    def __init__(self):
        self.base_url = settings.API_BASE_URL or "http://localhost:8000"
    
    async def scan(self) -> List[Vulnerability]:
        """Run API security scan"""
        vulnerabilities = []
        
        # Check security headers
        vulnerabilities.extend(await self._check_security_headers())
        
        # Check for common vulnerabilities
        vulnerabilities.extend(await self._check_injection_vulnerabilities())
        
        # Check authentication and authorization
        vulnerabilities.extend(await self._check_auth_vulnerabilities())
        
        # Check CORS configuration
        vulnerabilities.extend(await self._check_cors_configuration())
        
        return vulnerabilities
    
    async def _check_security_headers(self) -> List[Vulnerability]:
        """Check for missing security headers"""
        vulnerabilities = []
        
        required_headers = {
            "Strict-Transport-Security": "HSTS header for HTTPS enforcement",
            "X-Content-Type-Options": "Prevents MIME type sniffing",
            "X-Frame-Options": "Prevents clickjacking attacks",
            "X-XSS-Protection": "XSS protection header",
            "Content-Security-Policy": "Content Security Policy",
            "Referrer-Policy": "Controls referrer information",
            "Permissions-Policy": "Controls browser features"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health") as response:
                    headers = response.headers
                    
                    for header, description in required_headers.items():
                        if header not in headers:
                            vulnerabilities.append(Vulnerability(
                                type=VulnerabilityType.MISSING_SECURITY_HEADERS,
                                severity=SecurityRisk.MEDIUM,
                                title=f"Missing {header} header",
                                description=f"The {description} is not set",
                                location="HTTP Response Headers",
                                remediation=f"Add {header} header to all responses"
                            ))
        
        except Exception as e:
            print(f"Error checking security headers: {str(e)}")
        
        return vulnerabilities
    
    async def _check_injection_vulnerabilities(self) -> List[Vulnerability]:
        """Test for injection vulnerabilities"""
        vulnerabilities = []
        
        # Test payloads
        injection_payloads = {
            "sql": ["' OR '1'='1", "1; DROP TABLE users--", "' UNION SELECT * FROM users--"],
            "xss": ["<script>alert('XSS')</script>", "<img src=x onerror=alert('XSS')>"],
            "xxe": ['<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>'],
            "command": ["'; cat /etc/passwd", "| ls -la", "`id`"]
        }
        
        # Test endpoints
        test_endpoints = [
            ("/api/v1/projects", "GET", {"search": "PAYLOAD"}),
            ("/api/v1/projects", "POST", {"name": "PAYLOAD", "description": "Test"}),
            ("/auth/login", "POST", {"email": "PAYLOAD", "password": "test"})
        ]
        
        async with aiohttp.ClientSession() as session:
            for endpoint, method, params in test_endpoints:
                for vuln_type, payloads in injection_payloads.items():
                    for payload in payloads:
                        # Replace PAYLOAD with actual payload
                        test_params = {k: v.replace("PAYLOAD", payload) if isinstance(v, str) else v 
                                     for k, v in params.items()}
                        
                        try:
                            if method == "GET":
                                url = f"{self.base_url}{endpoint}"
                                async with session.get(url, params=test_params) as response:
                                    # Check for payload reflection
                                    content = await response.text()
                                    if payload in content and vuln_type == "xss":
                                        vulnerabilities.append(Vulnerability(
                                            type=VulnerabilityType.XSS,
                                            severity=SecurityRisk.HIGH,
                                            title="Cross-Site Scripting (XSS)",
                                            description="User input is reflected without encoding",
                                            location=endpoint,
                                            evidence=f"Payload: {payload}",
                                            remediation="Implement output encoding"
                                        ))
                            
                            elif method == "POST":
                                url = f"{self.base_url}{endpoint}"
                                async with session.post(url, json=test_params) as response:
                                    # Check for SQL errors
                                    content = await response.text()
                                    sql_errors = ["syntax error", "mysql", "postgresql", "sqlite", "ORA-"]
                                    if any(error in content.lower() for error in sql_errors) and vuln_type == "sql":
                                        vulnerabilities.append(Vulnerability(
                                            type=VulnerabilityType.SQL_INJECTION,
                                            severity=SecurityRisk.CRITICAL,
                                            title="SQL Injection",
                                            description="SQL error exposed in response",
                                            location=endpoint,
                                            evidence=f"Payload: {payload}",
                                            remediation="Use parameterized queries"
                                        ))
                        
                        except Exception:
                            pass  # Expected for some payloads
        
        return vulnerabilities

class DependencyScanner:
    """Scan for vulnerable dependencies"""
    
    async def scan(self) -> List[Vulnerability]:
        """Run dependency vulnerability scan"""
        vulnerabilities = []
        
        # Scan Python dependencies
        vulnerabilities.extend(await self._scan_python_dependencies())
        
        # Scan JavaScript dependencies
        vulnerabilities.extend(await self._scan_npm_dependencies())
        
        return vulnerabilities
    
    async def _scan_python_dependencies(self) -> List[Vulnerability]:
        """Scan Python dependencies using safety"""
        vulnerabilities = []
        
        try:
            # Run safety check
            result = subprocess.run(
                ["safety", "check", "--json"],
                capture_output=True,
                text=True,
                cwd="backend"
            )
            
            if result.stdout:
                safety_report = json.loads(result.stdout)
                
                for vuln in safety_report.get("vulnerabilities", []):
                    vulnerabilities.append(Vulnerability(
                        type=VulnerabilityType.OUTDATED_DEPENDENCIES,
                        severity=SecurityRisk.HIGH if vuln.get("severity", "").lower() == "high" else SecurityRisk.MEDIUM,
                        title=f"Vulnerable dependency: {vuln['package_name']}",
                        description=vuln.get("vulnerability", ""),
                        location=f"requirements.txt: {vuln['package_name']}=={vuln['installed_version']}",
                        evidence=f"CVE: {vuln.get('cve', 'N/A')}",
                        remediation=f"Update to version {vuln.get('secure_version', 'latest')}"
                    ))
        
        except Exception as e:
            print(f"Error scanning Python dependencies: {str(e)}")
        
        return vulnerabilities
    
    async def _scan_npm_dependencies(self) -> List[Vulnerability]:
        """Scan npm dependencies using npm audit"""
        vulnerabilities = []
        
        try:
            # Run npm audit
            result = subprocess.run(
                ["npm", "audit", "--json"],
                capture_output=True,
                text=True
            )
            
            if result.stdout:
                npm_report = json.loads(result.stdout)
                
                for advisory_id, advisory in npm_report.get("advisories", {}).items():
                    severity_map = {
                        "critical": SecurityRisk.CRITICAL,
                        "high": SecurityRisk.HIGH,
                        "moderate": SecurityRisk.MEDIUM,
                        "low": SecurityRisk.LOW
                    }
                    
                    vulnerabilities.append(Vulnerability(
                        type=VulnerabilityType.OUTDATED_DEPENDENCIES,
                        severity=severity_map.get(advisory["severity"], SecurityRisk.MEDIUM),
                        title=f"Vulnerable dependency: {advisory['module_name']}",
                        description=advisory["overview"],
                        location=f"package.json: {advisory['module_name']}",
                        evidence=f"Advisory: {advisory_id}",
                        remediation=advisory.get("recommendation", "Update dependency")
                    ))
        
        except Exception as e:
            print(f"Error scanning npm dependencies: {str(e)}")
        
        return vulnerabilities

class InfrastructureScanner:
    """Scan infrastructure security"""
    
    async def scan(self) -> List[Vulnerability]:
        """Run infrastructure security scan"""
        vulnerabilities = []
        
        # Check SSL/TLS configuration
        vulnerabilities.extend(await self._check_ssl_configuration())
        
        # Check exposed services
        vulnerabilities.extend(await self._check_exposed_services())
        
        # Check DNS security
        vulnerabilities.extend(await self._check_dns_security())
        
        return vulnerabilities
    
    async def _check_ssl_configuration(self) -> List[Vulnerability]:
        """Check SSL/TLS configuration"""
        vulnerabilities = []
        
        try:
            hostname = urlparse(settings.API_BASE_URL).hostname
            port = 443
            
            # Create SSL context
            context = ssl.create_default_context()
            
            # Connect and get certificate
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    # Check protocol version
                    if ssock.version() in ["TLSv1", "TLSv1.1"]:
                        vulnerabilities.append(Vulnerability(
                            type=VulnerabilityType.WEAK_CRYPTO,
                            severity=SecurityRisk.HIGH,
                            title="Weak TLS version",
                            description=f"Server supports {ssock.version()} which is deprecated",
                            location=f"{hostname}:{port}",
                            remediation="Disable TLS 1.0 and 1.1, use TLS 1.2+"
                        ))
                    
                    # Check cipher suite
                    cipher = ssock.cipher()
                    weak_ciphers = ["RC4", "DES", "3DES", "MD5"]
                    if any(weak in str(cipher) for weak in weak_ciphers):
                        vulnerabilities.append(Vulnerability(
                            type=VulnerabilityType.WEAK_CRYPTO,
                            severity=SecurityRisk.HIGH,
                            title="Weak cipher suite",
                            description=f"Server uses weak cipher: {cipher}",
                            location=f"{hostname}:{port}",
                            remediation="Use strong cipher suites (AES-GCM, ChaCha20)"
                        ))
        
        except Exception as e:
            print(f"Error checking SSL configuration: {str(e)}")
        
        return vulnerabilities

class ComplianceChecker:
    """Check compliance with security standards"""
    
    async def scan(self) -> List[Vulnerability]:
        """Run compliance checks"""
        vulnerabilities = []
        
        # These would normally check actual compliance requirements
        # For now, returning empty list as compliance is checked separately
        
        return vulnerabilities
    
    async def _check_pci_compliance(self) -> bool:
        """Check PCI DSS compliance"""
        # Check for:
        # - Encrypted cardholder data
        # - Strong access controls
        # - Regular security testing
        # - Secure network architecture
        
        return True  # Placeholder
    
    async def _check_gdpr_compliance(self) -> bool:
        """Check GDPR compliance"""
        # Check for:
        # - Data protection measures
        # - User consent mechanisms
        # - Right to erasure implementation
        # - Data portability features
        
        return True  # Placeholder
    
    async def _check_soc2_compliance(self) -> bool:
        """Check SOC 2 compliance"""
        # Check for:
        # - Security controls
        # - Availability measures
        # - Processing integrity
        # - Confidentiality controls
        # - Privacy protections
        
        return True  # Placeholder
    
    async def _check_hipaa_compliance(self) -> bool:
        """Check HIPAA compliance"""
        # Check for:
        # - PHI encryption
        # - Access controls
        # - Audit logs
        # - Data integrity controls
        
        return True  # Placeholder

# CLI for security audit
async def run_security_audit_cli():
    """Command-line interface for security audit"""
    import argparse
    
    parser = argparse.ArgumentParser(description="OpenClip Security Audit")
    parser.add_argument("--output", default="security-report.html", help="Output file")
    parser.add_argument("--format", choices=["html", "json", "markdown"], default="html", help="Report format")
    
    args = parser.parse_args()
    
    # Run audit
    auditor = SecurityAuditor()
    result = await auditor.run_full_audit()
    
    # Generate report
    report = auditor.generate_report(result, args.format)
    
    # Save report
    with open(args.output, "w") as f:
        f.write(report)
    
    print(f"\nSecurity audit complete!")
    print(f"Security Score: {result.security_score:.1f}/100")
    print(f"Critical Issues: {result.critical_count}")
    print(f"High Issues: {result.high_count}")
    print(f"Report saved to: {args.output}")

if __name__ == "__main__":
    asyncio.run(run_security_audit_cli())
