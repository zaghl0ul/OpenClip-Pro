"""
Production Database Configuration with Advanced Features
Implements connection pooling, read replicas, automated backups, and monitoring
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Callable
from contextlib import asynccontextmanager
import asyncpg
from sqlalchemy import create_engine, event, pool, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool, QueuePool, StaticPool
import redis
from dataclasses import dataclass
from enum import Enum
import json
import boto3
from prometheus_client import Counter, Histogram, Gauge
import sentry_sdk
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from ..config import settings
from ..utils.encryption import encrypt_data, decrypt_data

logger = logging.getLogger(__name__)

# Prometheus metrics
db_connection_pool_size = Gauge('db_connection_pool_size', 'Database connection pool size')
db_active_connections = Gauge('db_active_connections', 'Active database connections')
db_query_duration = Histogram('db_query_duration_seconds', 'Database query duration', ['query_type'])
db_query_count = Counter('db_query_total', 'Total database queries', ['query_type', 'status'])
db_backup_count = Counter('db_backup_total', 'Total database backups', ['status'])
db_replica_lag = Gauge('db_replica_lag_seconds', 'Database replica lag in seconds', ['replica'])

class DatabaseType(str, Enum):
    """Supported database types"""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLITE = "sqlite"

class ReplicaRole(str, Enum):
    """Database replica roles"""
    PRIMARY = "primary"
    READ_REPLICA = "read_replica"
    ANALYTICS = "analytics"
    BACKUP = "backup"

@dataclass
class DatabaseConfig:
    """Database configuration"""
    # Connection settings
    host: str
    port: int
    database: str
    username: str
    password: str
    
    # Pool settings
    pool_size: int = 20
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 3600
    
    # Features
    ssl_enabled: bool = True
    connection_retry_attempts: int = 3
    connection_retry_delay: int = 1
    
    # Performance
    statement_timeout: int = 30000  # 30 seconds
    lock_timeout: int = 10000  # 10 seconds
    idle_in_transaction_timeout: int = 60000  # 60 seconds
    
    # Monitoring
    slow_query_threshold: int = 1000  # 1 second
    log_queries: bool = False
    
    @property
    def connection_string(self) -> str:
        """Generate connection string"""
        if self.ssl_enabled:
            ssl_params = "?sslmode=require"
        else:
            ssl_params = ""
        
        return (
            f"postgresql+asyncpg://{self.username}:{self.password}@"
            f"{self.host}:{self.port}/{self.database}{ssl_params}"
        )

class DatabaseReplica:
    """Represents a database replica"""
    
    def __init__(self, config: DatabaseConfig, role: ReplicaRole):
        self.config = config
        self.role = role
        self.engine: Optional[AsyncEngine] = None
        self.is_healthy = True
        self.last_health_check = datetime.now(timezone.utc)
        self.lag_seconds = 0.0
    
    async def connect(self):
        """Create connection to replica"""
        self.engine = create_async_engine(
            self.config.connection_string,
            pool_size=self.config.pool_size,
            max_overflow=self.config.max_overflow,
            pool_timeout=self.config.pool_timeout,
            pool_recycle=self.config.pool_recycle,
            pool_pre_ping=True,
            echo=self.config.log_queries,
            connect_args={
                "server_settings": {
                    "application_name": f"openclip_{self.role.value}",
                    "jit": "off"
                },
                "command_timeout": self.config.statement_timeout / 1000,
                "timeout": self.config.pool_timeout
            }
        )
    
    async def check_health(self) -> bool:
        """Check replica health and lag"""
        try:
            async with self.engine.connect() as conn:
                # Check basic connectivity
                result = await conn.execute(text("SELECT 1"))
                result.scalar()
                
                # Check replication lag for read replicas
                if self.role == ReplicaRole.READ_REPLICA:
                    lag_result = await conn.execute(
                        text("""
                            SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
                            AS lag_seconds
                        """)
                    )
                    self.lag_seconds = lag_result.scalar() or 0.0
                    db_replica_lag.labels(replica=self.config.host).set(self.lag_seconds)
                
                self.is_healthy = True
                self.last_health_check = datetime.now(timezone.utc)
                return True
                
        except Exception as e:
            logger.error(f"Replica health check failed for {self.config.host}: {str(e)}")
            self.is_healthy = False
            return False
    
    async def disconnect(self):
        """Disconnect from replica"""
        if self.engine:
            await self.engine.dispose()

class ProductionDatabaseManager:
    """
    Advanced database manager for production environments
    Handles connection pooling, read replicas, monitoring, and backups
    """
    
    def __init__(self):
        self.primary_config = self._load_primary_config()
        self.replicas: List[DatabaseReplica] = []
        self.primary_engine: Optional[AsyncEngine] = None
        self.session_factory: Optional[sessionmaker] = None
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.backup_client = boto3.client('s3') if settings.AWS_ACCESS_KEY_ID else None
        self._health_check_task: Optional[asyncio.Task] = None
        
        # Query cache
        self.query_cache_enabled = settings.DB_QUERY_CACHE_ENABLED
        self.query_cache_ttl = settings.DB_QUERY_CACHE_TTL or 300
        
        logger.info("ProductionDatabaseManager initialized")
    
    def _load_primary_config(self) -> DatabaseConfig:
        """Load primary database configuration"""
        return DatabaseConfig(
            host=settings.DATABASE_HOST,
            port=settings.DATABASE_PORT,
            database=settings.DATABASE_NAME,
            username=settings.DATABASE_USER,
            password=settings.DATABASE_PASSWORD,
            pool_size=settings.DATABASE_POOL_SIZE or 20,
            max_overflow=settings.DATABASE_MAX_OVERFLOW or 10,
            ssl_enabled=settings.DATABASE_SSL_ENABLED,
            slow_query_threshold=settings.DATABASE_SLOW_QUERY_THRESHOLD or 1000,
            log_queries=settings.DATABASE_LOG_QUERIES
        )
    
    async def initialize(self):
        """Initialize database connections and replicas"""
        # Connect to primary
        await self._connect_primary()
        
        # Connect to replicas
        await self._connect_replicas()
        
        # Start health monitoring
        self._health_check_task = asyncio.create_task(self._monitor_health())
        
        # Initialize Sentry integration
        if settings.SENTRY_DSN:
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                integrations=[SqlalchemyIntegration()],
                traces_sample_rate=0.1,
                profiles_sample_rate=0.1
            )
        
        logger.info("Database initialization complete")
    
    async def _connect_primary(self):
        """Connect to primary database"""
        self.primary_engine = create_async_engine(
            self.primary_config.connection_string,
            pool_size=self.primary_config.pool_size,
            max_overflow=self.primary_config.max_overflow,
            pool_timeout=self.primary_config.pool_timeout,
            pool_recycle=self.primary_config.pool_recycle,
            pool_pre_ping=True,
            echo=self.primary_config.log_queries,
            connect_args={
                "server_settings": {
                    "application_name": "openclip_primary",
                    "jit": "off"
                },
                "command_timeout": self.primary_config.statement_timeout / 1000,
                "timeout": self.primary_config.pool_timeout
            }
        )
        
        # Create session factory
        self.session_factory = sessionmaker(
            self.primary_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Set up event listeners
        self._setup_event_listeners()
        
        # Update metrics
        db_connection_pool_size.set(self.primary_config.pool_size)
    
    async def _connect_replicas(self):
        """Connect to read replicas"""
        replica_configs = self._load_replica_configs()
        
        for config, role in replica_configs:
            replica = DatabaseReplica(config, role)
            await replica.connect()
            self.replicas.append(replica)
            
            logger.info(f"Connected to {role.value} replica at {config.host}")
    
    def _load_replica_configs(self) -> List[tuple[DatabaseConfig, ReplicaRole]]:
        """Load replica configurations from environment"""
        configs = []
        
        # Read replica 1
        if settings.DATABASE_READ_REPLICA_1_HOST:
            config = DatabaseConfig(
                host=settings.DATABASE_READ_REPLICA_1_HOST,
                port=settings.DATABASE_PORT,
                database=settings.DATABASE_NAME,
                username=settings.DATABASE_USER,
                password=settings.DATABASE_PASSWORD,
                pool_size=15,  # Smaller pool for replicas
                max_overflow=5
            )
            configs.append((config, ReplicaRole.READ_REPLICA))
        
        # Analytics replica
        if settings.DATABASE_ANALYTICS_HOST:
            config = DatabaseConfig(
                host=settings.DATABASE_ANALYTICS_HOST,
                port=settings.DATABASE_PORT,
                database=settings.DATABASE_NAME,
                username=settings.DATABASE_USER,
                password=settings.DATABASE_PASSWORD,
                pool_size=10,
                max_overflow=5,
                statement_timeout=300000  # 5 minutes for analytics
            )
            configs.append((config, ReplicaRole.ANALYTICS))
        
        return configs
    
    def _setup_event_listeners(self):
        """Set up SQLAlchemy event listeners for monitoring"""
        
        @event.listens_for(self.primary_engine.sync_engine, "before_execute")
        def before_execute(conn, clauseelement, multiparams, params, execution_options):
            conn.info.setdefault('query_start_time', []).append(datetime.now())
        
        @event.listens_for(self.primary_engine.sync_engine, "after_execute")
        def after_execute(conn, clauseelement, multiparams, params, execution_options, result):
            start_time = conn.info['query_start_time'].pop()
            duration = (datetime.now() - start_time).total_seconds()
            
            # Update metrics
            query_type = self._get_query_type(str(clauseelement))
            db_query_duration.labels(query_type=query_type).observe(duration)
            db_query_count.labels(query_type=query_type, status='success').inc()
            
            # Log slow queries
            if duration * 1000 > self.primary_config.slow_query_threshold:
                logger.warning(
                    f"Slow query detected ({duration:.2f}s): {str(clauseelement)[:100]}..."
                )
    
    async def _monitor_health(self):
        """Monitor database health continuously"""
        while True:
            try:
                # Check primary health
                await self._check_primary_health()
                
                # Check replica health
                for replica in self.replicas:
                    await replica.check_health()
                
                # Update active connections metric
                if self.primary_engine:
                    pool = self.primary_engine.pool
                    db_active_connections.set(pool.size() - pool.checkedin())
                
                # Wait before next check
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Health monitoring error: {str(e)}")
                await asyncio.sleep(60)  # Back off on error
    
    async def _check_primary_health(self):
        """Check primary database health"""
        try:
            async with self.primary_engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                result.scalar()
        except Exception as e:
            logger.error(f"Primary database health check failed: {str(e)}")
            raise
    
    @asynccontextmanager
    async def get_session(self, read_only: bool = False) -> AsyncSession:
        """
        Get database session with automatic routing
        Routes read-only queries to replicas when available
        """
        if read_only and self.replicas:
            # Select healthy replica with lowest lag
            healthy_replicas = [r for r in self.replicas 
                              if r.is_healthy and r.role == ReplicaRole.READ_REPLICA]
            
            if healthy_replicas:
                # Sort by lag and select best
                replica = min(healthy_replicas, key=lambda r: r.lag_seconds)
                
                async with AsyncSession(replica.engine) as session:
                    yield session
                return
        
        # Use primary for writes or when no replicas available
        async with self.session_factory() as session:
            yield session
    
    @asynccontextmanager
    async def transaction(self, isolation_level: Optional[str] = None):
        """
        Create a database transaction with optional isolation level
        Supports SERIALIZABLE, REPEATABLE READ, READ COMMITTED, READ UNCOMMITTED
        """
        async with self.get_session() as session:
            if isolation_level:
                await session.execute(
                    text(f"SET TRANSACTION ISOLATION LEVEL {isolation_level}")
                )
            
            async with session.begin():
                yield session
    
    async def execute_query(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        read_only: bool = True,
        cache_key: Optional[str] = None,
        cache_ttl: Optional[int] = None
    ) -> Any:
        """
        Execute query with caching support
        Automatically routes to appropriate database
        """
        # Check cache if enabled
        if cache_key and self.query_cache_enabled and read_only:
            cached_result = await self._get_cached_query_result(cache_key)
            if cached_result is not None:
                return cached_result
        
        # Execute query
        async with self.get_session(read_only=read_only) as session:
            result = await session.execute(text(query), params or {})
            
            if read_only:
                data = result.fetchall()
                
                # Cache result if requested
                if cache_key and self.query_cache_enabled:
                    await self._cache_query_result(
                        cache_key, 
                        data, 
                        cache_ttl or self.query_cache_ttl
                    )
                
                return data
            else:
                await session.commit()
                return result
    
    async def bulk_insert(
        self,
        table_name: str,
        records: List[Dict[str, Any]],
        batch_size: int = 1000,
        on_conflict: Optional[str] = None
    ):
        """
        Perform bulk insert with batching
        Supports upsert operations with ON CONFLICT clause
        """
        async with self.get_session() as session:
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                
                # Build insert statement
                if records:
                    columns = list(batch[0].keys())
                    values_clause = ", ".join(
                        f"({', '.join([f':{col}_{j}' for col in columns])})"
                        for j in range(len(batch))
                    )
                    
                    query = f"""
                        INSERT INTO {table_name} ({', '.join(columns)})
                        VALUES {values_clause}
                    """
                    
                    if on_conflict:
                        query += f" {on_conflict}"
                    
                    # Prepare parameters
                    params = {}
                    for j, record in enumerate(batch):
                        for col, value in record.items():
                            params[f"{col}_{j}"] = value
                    
                    await session.execute(text(query), params)
            
            await session.commit()
    
    async def backup_database(
        self,
        backup_type: str = "full",
        compress: bool = True,
        encrypt: bool = True
    ) -> Dict[str, Any]:
        """
        Create database backup
        Supports full and incremental backups with encryption
        """
        backup_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        try:
            # For PostgreSQL, use pg_dump
            if backup_type == "full":
                backup_file = await self._create_full_backup(backup_id, compress)
            else:
                backup_file = await self._create_incremental_backup(backup_id)
            
            # Encrypt backup if requested
            if encrypt:
                backup_file = await self._encrypt_backup(backup_file)
            
            # Upload to S3
            if self.backup_client:
                s3_key = f"database-backups/{backup_id}/{backup_file.name}"
                await self._upload_backup_to_s3(backup_file, s3_key)
            
            # Update metrics
            db_backup_count.labels(status='success').inc()
            
            # Log backup details
            backup_info = {
                "backup_id": backup_id,
                "type": backup_type,
                "size_bytes": backup_file.stat().st_size,
                "compressed": compress,
                "encrypted": encrypt,
                "location": s3_key if self.backup_client else str(backup_file),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(f"Database backup completed: {backup_id}")
            return backup_info
            
        except Exception as e:
            db_backup_count.labels(status='failure').inc()
            logger.error(f"Database backup failed: {str(e)}")
            raise
    
    async def _create_full_backup(self, backup_id: str, compress: bool) -> Path:
        """Create full database backup using pg_dump"""
        from pathlib import Path
        import subprocess
        
        backup_dir = Path("/tmp/db_backups")
        backup_dir.mkdir(exist_ok=True)
        
        extension = ".sql.gz" if compress else ".sql"
        backup_file = backup_dir / f"{backup_id}_full{extension}"
        
        # Build pg_dump command
        cmd = [
            "pg_dump",
            f"--host={self.primary_config.host}",
            f"--port={self.primary_config.port}",
            f"--username={self.primary_config.username}",
            f"--dbname={self.primary_config.database}",
            "--no-password",
            "--verbose",
            "--format=custom" if compress else "--format=plain",
            f"--file={backup_file}"
        ]
        
        # Set password via environment
        env = os.environ.copy()
        env["PGPASSWORD"] = self.primary_config.password
        
        # Execute backup
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"pg_dump failed: {stderr.decode()}")
        
        return backup_file
    
    async def restore_database(
        self,
        backup_id: str,
        target_time: Optional[datetime] = None
    ):
        """
        Restore database from backup
        Supports point-in-time recovery
        """
        logger.info(f"Starting database restore from backup: {backup_id}")
        
        # Download backup from S3 if needed
        if self.backup_client:
            backup_file = await self._download_backup_from_s3(backup_id)
        else:
            backup_file = Path(f"/tmp/db_backups/{backup_id}")
        
        # Decrypt if needed
        if backup_file.suffix == ".enc":
            backup_file = await self._decrypt_backup(backup_file)
        
        # Restore using pg_restore
        await self._restore_from_backup(backup_file, target_time)
        
        logger.info("Database restore completed successfully")
    
    async def analyze_query_performance(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze query performance using EXPLAIN ANALYZE
        Returns execution plan and performance metrics
        """
        async with self.get_session() as session:
            # Run EXPLAIN ANALYZE
            explain_query = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}"
            result = await session.execute(text(explain_query), params or {})
            
            plan = result.scalar()
            
            # Extract key metrics
            execution_time = plan[0]["Execution Time"]
            planning_time = plan[0]["Planning Time"]
            
            return {
                "execution_time_ms": execution_time,
                "planning_time_ms": planning_time,
                "total_time_ms": execution_time + planning_time,
                "execution_plan": plan[0]["Plan"],
                "recommendations": self._generate_query_recommendations(plan[0]["Plan"])
            }
    
    def _generate_query_recommendations(self, plan: Dict[str, Any]) -> List[str]:
        """Generate performance recommendations based on query plan"""
        recommendations = []
        
        # Check for sequential scans on large tables
        if plan.get("Node Type") == "Seq Scan" and plan.get("Actual Rows", 0) > 1000:
            recommendations.append(
                f"Consider adding an index on {plan.get('Relation Name')} "
                f"to avoid sequential scan of {plan.get('Actual Rows')} rows"
            )
        
        # Check for missing indexes
        if "Filter" in plan and plan.get("Rows Removed by Filter", 0) > 100:
            recommendations.append(
                "High number of rows filtered - consider adding an index on filter columns"
            )
        
        # Check for slow sorts
        if plan.get("Node Type") == "Sort" and plan.get("Actual Time", [0])[0] > 100:
            recommendations.append(
                "Slow sort operation detected - consider adding an index for ORDER BY columns"
            )
        
        return recommendations
    
    async def _get_cached_query_result(self, cache_key: str) -> Optional[Any]:
        """Get cached query result"""
        try:
            cached = self.redis_client.get(f"query_cache:{cache_key}")
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Cache retrieval error: {str(e)}")
        return None
    
    async def _cache_query_result(self, cache_key: str, result: Any, ttl: int):
        """Cache query result"""
        try:
            self.redis_client.setex(
                f"query_cache:{cache_key}",
                ttl,
                json.dumps(result, default=str)
            )
        except Exception as e:
            logger.warning(f"Cache storage error: {str(e)}")
    
    def _get_query_type(self, query: str) -> str:
        """Determine query type for metrics"""
        query_upper = query.upper().strip()
        
        if query_upper.startswith("SELECT"):
            return "select"
        elif query_upper.startswith("INSERT"):
            return "insert"
        elif query_upper.startswith("UPDATE"):
            return "update"
        elif query_upper.startswith("DELETE"):
            return "delete"
        else:
            return "other"
    
    async def cleanup(self):
        """Clean up database connections"""
        # Cancel health check task
        if self._health_check_task:
            self._health_check_task.cancel()
        
        # Disconnect from replicas
        for replica in self.replicas:
            await replica.disconnect()
        
        # Disconnect from primary
        if self.primary_engine:
            await self.primary_engine.dispose()
        
        logger.info("Database connections cleaned up")

# Global instance
db_manager = ProductionDatabaseManager()

# Dependency for FastAPI
async def get_db() -> AsyncSession:
    """FastAPI dependency for database sessions"""
    async with db_manager.get_session() as session:
        yield session

async def get_read_db() -> AsyncSession:
    """FastAPI dependency for read-only database sessions"""
    async with db_manager.get_session(read_only=True) as session:
        yield session
