"""
Advanced Cloud Storage Service with S3/GCS Support
Implements multi-cloud storage with CDN, signed URLs, and intelligent caching
"""

import os
import asyncio
import hashlib
import mimetypes
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List, BinaryIO, Tuple
from urllib.parse import urlparse, urljoin
import aiofiles
import boto3
from botocore.exceptions import ClientError
from google.cloud import storage as gcs
from google.cloud.exceptions import NotFound
import redis
from dataclasses import dataclass
from enum import Enum
import json
import logging
from concurrent.futures import ThreadPoolExecutor
import io

from ..config import settings
from ..utils.performance_monitor import monitor_performance
from ..utils.file_validator import FileValidator

logger = logging.getLogger(__name__)

class StorageProvider(str, Enum):
    """Supported storage providers"""
    S3 = "s3"
    GCS = "gcs"
    LOCAL = "local"
    HYBRID = "hybrid"  # Uses multiple providers

class StorageClass(str, Enum):
    """Storage classes for cost optimization"""
    STANDARD = "STANDARD"
    INFREQUENT_ACCESS = "STANDARD_IA"
    GLACIER = "GLACIER"
    DEEP_ARCHIVE = "DEEP_ARCHIVE"
    NEARLINE = "NEARLINE"  # GCS
    COLDLINE = "COLDLINE"  # GCS

@dataclass
class StorageConfig:
    """Storage configuration"""
    provider: StorageProvider
    bucket_name: str
    region: str = "us-east-1"
    cdn_enabled: bool = True
    cdn_domain: Optional[str] = None
    encryption_enabled: bool = True
    versioning_enabled: bool = True
    lifecycle_rules: Optional[Dict[str, Any]] = None
    cors_config: Optional[Dict[str, Any]] = None

@dataclass
class UploadResult:
    """Result of file upload operation"""
    url: str
    cdn_url: Optional[str]
    etag: str
    size: int
    content_type: str
    metadata: Dict[str, Any]
    signed_url: Optional[str] = None
    expires_at: Optional[datetime] = None

class CloudStorageService:
    """
    Advanced cloud storage service with multi-provider support
    Handles S3, GCS, and hybrid configurations with intelligent routing
    """
    
    def __init__(self, config: Optional[StorageConfig] = None):
        self.config = config or self._load_config()
        self.cache = redis.from_url(settings.REDIS_URL)
        self.executor = ThreadPoolExecutor(max_workers=10)
        
        # Initialize providers
        self._init_providers()
        
        # File validator
        self.file_validator = FileValidator()
        
        # Performance metrics
        self.metrics = {
            "uploads": 0,
            "downloads": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "total_bytes_uploaded": 0,
            "total_bytes_downloaded": 0
        }
        
        logger.info(f"CloudStorageService initialized with provider: {self.config.provider}")
    
    def _load_config(self) -> StorageConfig:
        """Load storage configuration from settings"""
        return StorageConfig(
            provider=StorageProvider(settings.STORAGE_PROVIDER),
            bucket_name=settings.STORAGE_BUCKET,
            region=settings.AWS_REGION or "us-east-1",
            cdn_enabled=settings.CDN_ENABLED,
            cdn_domain=settings.CDN_DOMAIN,
            encryption_enabled=True,
            versioning_enabled=True,
            lifecycle_rules={
                "transitions": [
                    {
                        "days": 30,
                        "storage_class": StorageClass.INFREQUENT_ACCESS
                    },
                    {
                        "days": 90,
                        "storage_class": StorageClass.GLACIER
                    }
                ],
                "expiration": {
                    "days": 365,
                    "expired_object_delete_marker": True
                }
            },
            cors_config={
                "cors_rules": [{
                    "allowed_methods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                    "allowed_origins": settings.CORS_ORIGINS,
                    "allowed_headers": ["*"],
                    "expose_headers": ["ETag"],
                    "max_age_seconds": 3600
                }]
            }
        )
    
    def _init_providers(self):
        """Initialize storage providers"""
        if self.config.provider in [StorageProvider.S3, StorageProvider.HYBRID]:
            self.s3_client = boto3.client(
                's3',
                region_name=self.config.region,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            self.s3_transfer = boto3.s3.transfer.S3Transfer(self.s3_client)
            
            # Configure bucket
            self._configure_s3_bucket()
        
        if self.config.provider in [StorageProvider.GCS, StorageProvider.HYBRID]:
            self.gcs_client = gcs.Client()
            self.gcs_bucket = self.gcs_client.bucket(self.config.bucket_name)
            
            # Configure bucket
            self._configure_gcs_bucket()
    
    def _configure_s3_bucket(self):
        """Configure S3 bucket with policies and settings"""
        try:
            # Enable versioning
            if self.config.versioning_enabled:
                self.s3_client.put_bucket_versioning(
                    Bucket=self.config.bucket_name,
                    VersioningConfiguration={'Status': 'Enabled'}
                )
            
            # Set lifecycle policy
            if self.config.lifecycle_rules:
                self.s3_client.put_bucket_lifecycle_configuration(
                    Bucket=self.config.bucket_name,
                    LifecycleConfiguration={
                        'Rules': [{
                            'ID': 'openclip-lifecycle',
                            'Status': 'Enabled',
                            'Transitions': [
                                {
                                    'Days': rule['days'],
                                    'StorageClass': rule['storage_class']
                                }
                                for rule in self.config.lifecycle_rules.get('transitions', [])
                            ],
                            'Expiration': self.config.lifecycle_rules.get('expiration', {})
                        }]
                    }
                )
            
            # Set CORS configuration
            if self.config.cors_config:
                self.s3_client.put_bucket_cors(
                    Bucket=self.config.bucket_name,
                    CORSConfiguration={
                        'CORSRules': self.config.cors_config['cors_rules']
                    }
                )
            
            # Enable server-side encryption
            if self.config.encryption_enabled:
                self.s3_client.put_bucket_encryption(
                    Bucket=self.config.bucket_name,
                    ServerSideEncryptionConfiguration={
                        'Rules': [{
                            'ApplyServerSideEncryptionByDefault': {
                                'SSEAlgorithm': 'AES256'
                            }
                        }]
                    }
                )
            
            logger.info("S3 bucket configured successfully")
            
        except ClientError as e:
            logger.warning(f"Failed to configure S3 bucket: {str(e)}")
    
    def _configure_gcs_bucket(self):
        """Configure GCS bucket with policies and settings"""
        try:
            bucket = self.gcs_bucket
            
            # Enable versioning
            if self.config.versioning_enabled:
                bucket.versioning_enabled = True
                bucket.patch()
            
            # Set lifecycle rules
            if self.config.lifecycle_rules:
                rules = []
                for transition in self.config.lifecycle_rules.get('transitions', []):
                    rule = {
                        'action': {
                            'type': 'SetStorageClass',
                            'storageClass': transition['storage_class']
                        },
                        'condition': {
                            'age': transition['days']
                        }
                    }
                    rules.append(rule)
                
                bucket.lifecycle_rules = rules
                bucket.patch()
            
            # Set CORS configuration
            if self.config.cors_config:
                bucket.cors = self.config.cors_config['cors_rules']
                bucket.patch()
            
            logger.info("GCS bucket configured successfully")
            
        except Exception as e:
            logger.warning(f"Failed to configure GCS bucket: {str(e)}")
    
    @monitor_performance
    async def upload_file(
        self,
        file_path: Path,
        key: str,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        storage_class: StorageClass = StorageClass.STANDARD,
        cache_control: Optional[str] = None,
        progress_callback: Optional[callable] = None
    ) -> UploadResult:
        """
        Upload file to cloud storage with advanced features
        Supports multipart upload, progress tracking, and metadata
        """
        # Validate file
        validation_result = await self.file_validator.validate_file(file_path)
        if not validation_result.is_valid:
            raise ValueError(f"File validation failed: {validation_result.errors}")
        
        # Determine content type
        if not content_type:
            content_type, _ = mimetypes.guess_type(str(file_path))
            content_type = content_type or 'application/octet-stream'
        
        # Prepare metadata
        file_metadata = {
            'uploaded_at': datetime.now(timezone.utc).isoformat(),
            'original_filename': file_path.name,
            'content_hash': await self._calculate_file_hash(file_path),
            **(metadata or {})
        }
        
        # Choose provider
        if self.config.provider == StorageProvider.HYBRID:
            provider = self._choose_provider(file_path.stat().st_size, storage_class)
        else:
            provider = self.config.provider
        
        # Upload based on provider
        if provider == StorageProvider.S3:
            result = await self._upload_to_s3(
                file_path, key, content_type, file_metadata, 
                storage_class, cache_control, progress_callback
            )
        elif provider == StorageProvider.GCS:
            result = await self._upload_to_gcs(
                file_path, key, content_type, file_metadata,
                storage_class, cache_control, progress_callback
            )
        else:
            result = await self._upload_to_local(
                file_path, key, content_type, file_metadata
            )
        
        # Update metrics
        self.metrics['uploads'] += 1
        self.metrics['total_bytes_uploaded'] += file_path.stat().st_size
        
        # Generate CDN URL if enabled
        if self.config.cdn_enabled and self.config.cdn_domain:
            result.cdn_url = urljoin(self.config.cdn_domain, key)
        
        # Cache metadata
        await self._cache_file_metadata(key, result)
        
        return result
    
    async def _upload_to_s3(
        self,
        file_path: Path,
        key: str,
        content_type: str,
        metadata: Dict[str, str],
        storage_class: StorageClass,
        cache_control: Optional[str],
        progress_callback: Optional[callable]
    ) -> UploadResult:
        """Upload file to S3 with multipart support"""
        file_size = file_path.stat().st_size
        
        # Use multipart upload for large files
        if file_size > 100 * 1024 * 1024:  # 100MB
            return await self._multipart_upload_s3(
                file_path, key, content_type, metadata,
                storage_class, cache_control, progress_callback
            )
        
        # Regular upload for smaller files
        extra_args = {
            'ContentType': content_type,
            'Metadata': metadata,
            'StorageClass': storage_class.value
        }
        
        if cache_control:
            extra_args['CacheControl'] = cache_control
        
        if self.config.encryption_enabled:
            extra_args['ServerSideEncryption'] = 'AES256'
        
        # Upload with progress
        def upload_callback(bytes_transferred):
            if progress_callback:
                progress = (bytes_transferred / file_size) * 100
                progress_callback(progress)
        
        await asyncio.get_event_loop().run_in_executor(
            self.executor,
            lambda: self.s3_transfer.upload_file(
                str(file_path),
                self.config.bucket_name,
                key,
                extra_args=extra_args,
                callback=upload_callback
            )
        )
        
        # Get object info
        response = self.s3_client.head_object(
            Bucket=self.config.bucket_name,
            Key=key
        )
        
        return UploadResult(
            url=f"s3://{self.config.bucket_name}/{key}",
            cdn_url=None,
            etag=response['ETag'].strip('"'),
            size=file_size,
            content_type=content_type,
            metadata=metadata
        )
    
    async def _multipart_upload_s3(
        self,
        file_path: Path,
        key: str,
        content_type: str,
        metadata: Dict[str, str],
        storage_class: StorageClass,
        cache_control: Optional[str],
        progress_callback: Optional[callable]
    ) -> UploadResult:
        """Multipart upload for large files"""
        file_size = file_path.stat().st_size
        part_size = 50 * 1024 * 1024  # 50MB parts
        
        # Initiate multipart upload
        response = self.s3_client.create_multipart_upload(
            Bucket=self.config.bucket_name,
            Key=key,
            ContentType=content_type,
            Metadata=metadata,
            StorageClass=storage_class.value
        )
        
        upload_id = response['UploadId']
        parts = []
        
        try:
            # Upload parts
            async with aiofiles.open(file_path, 'rb') as f:
                part_number = 1
                bytes_uploaded = 0
                
                while True:
                    data = await f.read(part_size)
                    if not data:
                        break
                    
                    # Upload part
                    part_response = await asyncio.get_event_loop().run_in_executor(
                        self.executor,
                        lambda: self.s3_client.upload_part(
                            Bucket=self.config.bucket_name,
                            Key=key,
                            PartNumber=part_number,
                            UploadId=upload_id,
                            Body=data
                        )
                    )
                    
                    parts.append({
                        'ETag': part_response['ETag'],
                        'PartNumber': part_number
                    })
                    
                    bytes_uploaded += len(data)
                    if progress_callback:
                        progress = (bytes_uploaded / file_size) * 100
                        progress_callback(progress)
                    
                    part_number += 1
            
            # Complete multipart upload
            response = self.s3_client.complete_multipart_upload(
                Bucket=self.config.bucket_name,
                Key=key,
                UploadId=upload_id,
                MultipartUpload={'Parts': parts}
            )
            
            return UploadResult(
                url=f"s3://{self.config.bucket_name}/{key}",
                cdn_url=None,
                etag=response['ETag'].strip('"'),
                size=file_size,
                content_type=content_type,
                metadata=metadata
            )
            
        except Exception as e:
            # Abort multipart upload on error
            self.s3_client.abort_multipart_upload(
                Bucket=self.config.bucket_name,
                Key=key,
                UploadId=upload_id
            )
            raise e
    
    async def _upload_to_gcs(
        self,
        file_path: Path,
        key: str,
        content_type: str,
        metadata: Dict[str, str],
        storage_class: StorageClass,
        cache_control: Optional[str],
        progress_callback: Optional[callable]
    ) -> UploadResult:
        """Upload file to Google Cloud Storage"""
        blob = self.gcs_bucket.blob(key)
        
        # Set metadata
        blob.metadata = metadata
        blob.content_type = content_type
        blob.storage_class = storage_class.value
        
        if cache_control:
            blob.cache_control = cache_control
        
        # Upload with resumable support for large files
        file_size = file_path.stat().st_size
        
        def upload_callback(bytes_transferred, total_bytes):
            if progress_callback:
                progress = (bytes_transferred / total_bytes) * 100
                progress_callback(progress)
        
        await asyncio.get_event_loop().run_in_executor(
            self.executor,
            lambda: blob.upload_from_filename(
                str(file_path),
                content_type=content_type,
                num_retries=3,
                if_generation_match=0 if not blob.exists() else None,
                progress_callback=upload_callback if file_size > 5 * 1024 * 1024 else None
            )
        )
        
        # Reload to get updated metadata
        blob.reload()
        
        return UploadResult(
            url=f"gs://{self.config.bucket_name}/{key}",
            cdn_url=None,
            etag=blob.etag,
            size=blob.size,
            content_type=blob.content_type,
            metadata=blob.metadata or {}
        )
    
    async def generate_signed_url(
        self,
        key: str,
        expiration: timedelta = timedelta(hours=1),
        method: str = "GET",
        response_headers: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Generate signed URL for secure temporary access
        Supports both S3 and GCS
        """
        cache_key = f"signed_url:{key}:{method}:{expiration.total_seconds()}"
        
        # Check cache
        cached_url = await self._get_from_cache(cache_key)
        if cached_url:
            return cached_url
        
        if self.config.provider == StorageProvider.S3:
            params = {
                'Bucket': self.config.bucket_name,
                'Key': key
            }
            
            if response_headers:
                params.update(response_headers)
            
            url = self.s3_client.generate_presigned_url(
                ClientMethod='get_object' if method == "GET" else 'put_object',
                Params=params,
                ExpiresIn=int(expiration.total_seconds())
            )
            
        elif self.config.provider == StorageProvider.GCS:
            blob = self.gcs_bucket.blob(key)
            
            url = blob.generate_signed_url(
                version="v4",
                expiration=datetime.now(timezone.utc) + expiration,
                method=method,
                response_disposition=response_headers.get('ResponseContentDisposition') if response_headers else None,
                response_type=response_headers.get('ResponseContentType') if response_headers else None
            )
        
        else:
            # Local storage - return direct URL
            url = f"/storage/{key}"
        
        # Cache the URL (with shorter TTL than actual expiration)
        cache_ttl = max(int(expiration.total_seconds() * 0.8), 60)
        await self._set_cache(cache_key, url, cache_ttl)
        
        return url
    
    async def download_file(
        self,
        key: str,
        destination: Path,
        progress_callback: Optional[callable] = None
    ) -> Path:
        """Download file from cloud storage"""
        # Check if file exists in cache
        cached_path = await self._get_cached_file(key)
        if cached_path and cached_path.exists():
            self.metrics['cache_hits'] += 1
            return cached_path
        
        self.metrics['cache_misses'] += 1
        
        if self.config.provider == StorageProvider.S3:
            await self._download_from_s3(key, destination, progress_callback)
        elif self.config.provider == StorageProvider.GCS:
            await self._download_from_gcs(key, destination, progress_callback)
        else:
            await self._download_from_local(key, destination)
        
        # Update metrics
        self.metrics['downloads'] += 1
        self.metrics['total_bytes_downloaded'] += destination.stat().st_size
        
        # Cache the file
        await self._cache_file(key, destination)
        
        return destination
    
    async def _download_from_s3(
        self,
        key: str,
        destination: Path,
        progress_callback: Optional[callable]
    ):
        """Download file from S3"""
        # Get object size
        response = self.s3_client.head_object(
            Bucket=self.config.bucket_name,
            Key=key
        )
        file_size = response['ContentLength']
        
        def download_callback(bytes_transferred):
            if progress_callback:
                progress = (bytes_transferred / file_size) * 100
                progress_callback(progress)
        
        await asyncio.get_event_loop().run_in_executor(
            self.executor,
            lambda: self.s3_transfer.download_file(
                self.config.bucket_name,
                key,
                str(destination),
                callback=download_callback
            )
        )
    
    async def delete_file(self, key: str, version_id: Optional[str] = None):
        """Delete file from cloud storage"""
        if self.config.provider == StorageProvider.S3:
            params = {
                'Bucket': self.config.bucket_name,
                'Key': key
            }
            if version_id:
                params['VersionId'] = version_id
            
            self.s3_client.delete_object(**params)
            
        elif self.config.provider == StorageProvider.GCS:
            blob = self.gcs_bucket.blob(key)
            if version_id:
                blob = self.gcs_bucket.blob(key, generation=version_id)
            blob.delete()
        
        # Remove from cache
        await self._invalidate_cache(key)
    
    async def list_files(
        self,
        prefix: str = "",
        delimiter: str = "/",
        max_results: int = 1000
    ) -> List[Dict[str, Any]]:
        """List files in storage with pagination support"""
        files = []
        
        if self.config.provider == StorageProvider.S3:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            
            async for page in paginator.paginate(
                Bucket=self.config.bucket_name,
                Prefix=prefix,
                Delimiter=delimiter,
                MaxKeys=max_results
            ):
                for obj in page.get('Contents', []):
                    files.append({
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'],
                        'etag': obj['ETag'].strip('"'),
                        'storage_class': obj.get('StorageClass', 'STANDARD')
                    })
        
        elif self.config.provider == StorageProvider.GCS:
            blobs = self.gcs_bucket.list_blobs(
                prefix=prefix,
                delimiter=delimiter,
                max_results=max_results
            )
            
            for blob in blobs:
                files.append({
                    'key': blob.name,
                    'size': blob.size,
                    'last_modified': blob.updated,
                    'etag': blob.etag,
                    'storage_class': blob.storage_class
                })
        
        return files
    
    async def get_file_info(self, key: str) -> Dict[str, Any]:
        """Get detailed file information"""
        # Check cache first
        cache_key = f"file_info:{key}"
        cached_info = await self._get_from_cache(cache_key)
        if cached_info:
            return json.loads(cached_info)
        
        info = {}
        
        if self.config.provider == StorageProvider.S3:
            response = self.s3_client.head_object(
                Bucket=self.config.bucket_name,
                Key=key
            )
            
            info = {
                'key': key,
                'size': response['ContentLength'],
                'content_type': response['ContentType'],
                'last_modified': response['LastModified'].isoformat(),
                'etag': response['ETag'].strip('"'),
                'metadata': response.get('Metadata', {}),
                'storage_class': response.get('StorageClass', 'STANDARD'),
                'server_side_encryption': response.get('ServerSideEncryption'),
                'version_id': response.get('VersionId')
            }
        
        elif self.config.provider == StorageProvider.GCS:
            blob = self.gcs_bucket.blob(key)
            blob.reload()
            
            info = {
                'key': key,
                'size': blob.size,
                'content_type': blob.content_type,
                'last_modified': blob.updated.isoformat() if blob.updated else None,
                'etag': blob.etag,
                'metadata': blob.metadata or {},
                'storage_class': blob.storage_class,
                'generation': blob.generation,
                'metageneration': blob.metageneration
            }
        
        # Cache the info
        await self._set_cache(cache_key, json.dumps(info), 3600)
        
        return info
    
    async def copy_file(
        self,
        source_key: str,
        destination_key: str,
        source_bucket: Optional[str] = None
    ) -> UploadResult:
        """Copy file within or between buckets"""
        source_bucket = source_bucket or self.config.bucket_name
        
        if self.config.provider == StorageProvider.S3:
            copy_source = {'Bucket': source_bucket, 'Key': source_key}
            
            response = self.s3_client.copy_object(
                CopySource=copy_source,
                Bucket=self.config.bucket_name,
                Key=destination_key
            )
            
            # Get object info
            head_response = self.s3_client.head_object(
                Bucket=self.config.bucket_name,
                Key=destination_key
            )
            
            return UploadResult(
                url=f"s3://{self.config.bucket_name}/{destination_key}",
                cdn_url=None,
                etag=response['CopyObjectResult']['ETag'].strip('"'),
                size=head_response['ContentLength'],
                content_type=head_response['ContentType'],
                metadata=head_response.get('Metadata', {})
            )
        
        elif self.config.provider == StorageProvider.GCS:
            source_bucket_obj = self.gcs_client.bucket(source_bucket)
            source_blob = source_bucket_obj.blob(source_key)
            
            destination_blob = self.gcs_bucket.blob(destination_key)
            
            # Copy the blob
            token = source_blob.generate_signed_url(
                version="v4",
                expiration=datetime.now(timezone.utc) + timedelta(minutes=15),
                method="GET"
            )
            destination_blob.upload_from_string(
                source_blob.download_as_bytes(),
                content_type=source_blob.content_type
            )
            
            # Copy metadata
            destination_blob.metadata = source_blob.metadata
            destination_blob.patch()
            
            return UploadResult(
                url=f"gs://{self.config.bucket_name}/{destination_key}",
                cdn_url=None,
                etag=destination_blob.etag,
                size=destination_blob.size,
                content_type=destination_blob.content_type,
                metadata=destination_blob.metadata or {}
            )
    
    async def create_multipart_upload(
        self,
        key: str,
        content_type: str,
        metadata: Optional[Dict[str, str]] = None
    ) -> str:
        """Initiate multipart upload for client-side uploads"""
        if self.config.provider != StorageProvider.S3:
            raise NotImplementedError("Multipart upload only supported for S3")
        
        response = self.s3_client.create_multipart_upload(
            Bucket=self.config.bucket_name,
            Key=key,
            ContentType=content_type,
            Metadata=metadata or {}
        )
        
        return response['UploadId']
    
    async def generate_upload_urls(
        self,
        key: str,
        upload_id: str,
        num_parts: int,
        expiration: timedelta = timedelta(hours=1)
    ) -> List[str]:
        """Generate presigned URLs for multipart upload parts"""
        if self.config.provider != StorageProvider.S3:
            raise NotImplementedError("Multipart upload only supported for S3")
        
        urls = []
        
        for part_number in range(1, num_parts + 1):
            url = self.s3_client.generate_presigned_url(
                ClientMethod='upload_part',
                Params={
                    'Bucket': self.config.bucket_name,
                    'Key': key,
                    'PartNumber': part_number,
                    'UploadId': upload_id
                },
                ExpiresIn=int(expiration.total_seconds())
            )
            urls.append(url)
        
        return urls
    
    async def complete_multipart_upload(
        self,
        key: str,
        upload_id: str,
        parts: List[Dict[str, Any]]
    ) -> UploadResult:
        """Complete multipart upload"""
        if self.config.provider != StorageProvider.S3:
            raise NotImplementedError("Multipart upload only supported for S3")
        
        response = self.s3_client.complete_multipart_upload(
            Bucket=self.config.bucket_name,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
        
        # Get object info
        head_response = self.s3_client.head_object(
            Bucket=self.config.bucket_name,
            Key=key
        )
        
        return UploadResult(
            url=f"s3://{self.config.bucket_name}/{key}",
            cdn_url=None,
            etag=response['ETag'].strip('"'),
            size=head_response['ContentLength'],
            content_type=head_response['ContentType'],
            metadata=head_response.get('Metadata', {})
        )
    
    # Cache management
    async def _cache_file_metadata(self, key: str, result: UploadResult):
        """Cache file metadata"""
        cache_key = f"file_metadata:{key}"
        cache_data = {
            'url': result.url,
            'cdn_url': result.cdn_url,
            'etag': result.etag,
            'size': result.size,
            'content_type': result.content_type,
            'metadata': result.metadata
        }
        await self._set_cache(cache_key, json.dumps(cache_data), 86400)  # 24 hours
    
    async def _get_from_cache(self, key: str) -> Optional[str]:
        """Get value from cache"""
        try:
            value = self.cache.get(key)
            return value.decode('utf-8') if value else None
        except Exception as e:
            logger.warning(f"Cache get error: {str(e)}")
            return None
    
    async def _set_cache(self, key: str, value: str, ttl: int):
        """Set value in cache with TTL"""
        try:
            self.cache.setex(key, ttl, value)
        except Exception as e:
            logger.warning(f"Cache set error: {str(e)}")
    
    async def _invalidate_cache(self, key: str):
        """Invalidate cache entries for a key"""
        try:
            # Delete all related cache keys
            for pattern in [
                f"file_metadata:{key}",
                f"file_info:{key}",
                f"signed_url:{key}:*",
                f"cached_file:{key}"
            ]:
                for cache_key in self.cache.scan_iter(match=pattern):
                    self.cache.delete(cache_key)
        except Exception as e:
            logger.warning(f"Cache invalidation error: {str(e)}")
    
    async def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        sha256_hash = hashlib.sha256()
        
        async with aiofiles.open(file_path, "rb") as f:
            while chunk := await f.read(8192):
                sha256_hash.update(chunk)
        
        return sha256_hash.hexdigest()
    
    def _choose_provider(self, file_size: int, storage_class: StorageClass) -> StorageProvider:
        """Choose optimal provider for hybrid storage"""
        # Example logic: Use GCS for large files, S3 for small files
        if file_size > 100 * 1024 * 1024:  # 100MB
            return StorageProvider.GCS
        else:
            return StorageProvider.S3
    
    async def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        stats = {
            'metrics': self.metrics,
            'provider': self.config.provider.value,
            'bucket': self.config.bucket_name,
            'cdn_enabled': self.config.cdn_enabled
        }
        
        # Get bucket-level stats
        if self.config.provider == StorageProvider.S3:
            # Get bucket size using CloudWatch
            # This is an example - actual implementation would use CloudWatch API
            stats['bucket_size_bytes'] = 0
            stats['object_count'] = 0
        
        elif self.config.provider == StorageProvider.GCS:
            # Get bucket size
            size = 0
            count = 0
            
            for blob in self.gcs_bucket.list_blobs():
                size += blob.size
                count += 1
            
            stats['bucket_size_bytes'] = size
            stats['object_count'] = count
        
        return stats

# Singleton instance
storage_service = CloudStorageService()
