"""
Advanced Rate Limiter with Redis Backend
Implements token bucket algorithm with sliding window for precise rate limiting
"""

import redis
import time
import hashlib
from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import logging

logger = logging.getLogger(__name__)

class RateLimitStrategy(Enum):
    """Rate limiting strategies"""
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    LEAKY_BUCKET = "leaky_bucket"

@dataclass
class RateLimitConfig:
    """Configuration for rate limiting"""
    requests_per_window: int
    window_seconds: int
    burst_size: Optional[int] = None
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW

class RateLimiter:
    """
    Advanced rate limiter supporting multiple strategies
    Uses Redis for distributed rate limiting across multiple instances
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.default_limits = {
            "auth": RateLimitConfig(100, 60),  # 100 requests per minute
            "api": RateLimitConfig(1000, 3600, burst_size=50),  # 1000 per hour with burst
            "upload": RateLimitConfig(10, 3600),  # 10 uploads per hour
            "ai_analysis": RateLimitConfig(20, 3600),  # 20 AI analyses per hour
            "password_reset": RateLimitConfig(3, 3600),  # 3 password resets per hour
        }
    
    def _get_key(self, identifier: str, endpoint: str) -> str:
        """Generate Redis key for rate limiting"""
        # Hash identifier for privacy
        hashed_id = hashlib.sha256(identifier.encode()).hexdigest()[:16]
        return f"rate_limit:{endpoint}:{hashed_id}"
    
    def check_rate_limit(
        self,
        identifier: str,
        endpoint: str,
        limit: Optional[int] = None,
        window: Optional[int] = None,
        strategy: Optional[RateLimitStrategy] = None
    ) -> Tuple[bool, Dict[str, any]]:
        """
        Check if request is within rate limit
        Returns (allowed, metadata) tuple
        """
        # Get configuration
        config = self.default_limits.get(endpoint, RateLimitConfig(100, 60))
        if limit:
            config.requests_per_window = limit
        if window:
            config.window_seconds = window
        if strategy:
            config.strategy = strategy
        
        key = self._get_key(identifier, endpoint)
        
        # Apply strategy
        if config.strategy == RateLimitStrategy.SLIDING_WINDOW:
            return self._sliding_window_check(key, config)
        elif config.strategy == RateLimitStrategy.TOKEN_BUCKET:
            return self._token_bucket_check(key, config)
        elif config.strategy == RateLimitStrategy.FIXED_WINDOW:
            return self._fixed_window_check(key, config)
        else:
            return self._leaky_bucket_check(key, config)
    
    def _sliding_window_check(
        self,
        key: str,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """Sliding window rate limiting with microsecond precision"""
        now = time.time()
        window_start = now - config.window_seconds
        
        # Lua script for atomic operation
        lua_script = """
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_start = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        
        -- Remove old entries
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
        
        -- Count current entries
        local current = redis.call('ZCARD', key)
        
        if current < limit then
            -- Add new entry
            redis.call('ZADD', key, now, now)
            redis.call('EXPIRE', key, ARGV[4])
            return {1, current + 1, limit}
        else
            return {0, current, limit}
        end
        """
        
        result = self.redis_client.eval(
            lua_script,
            1,
            key,
            now,
            window_start,
            config.requests_per_window,
            config.window_seconds + 1
        )
        
        allowed = bool(result[0])
        metadata = {
            "limit": config.requests_per_window,
            "remaining": max(0, config.requests_per_window - result[1]),
            "reset": int(now + config.window_seconds),
            "retry_after": None if allowed else config.window_seconds
        }
        
        return allowed, metadata
    
    def _token_bucket_check(
        self,
        key: str,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """Token bucket algorithm with configurable burst"""
        burst_size = config.burst_size or config.requests_per_window
        refill_rate = config.requests_per_window / config.window_seconds
        
        lua_script = """
        local key = KEYS[1]
        local burst_size = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local requested = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or burst_size
        local last_refill = tonumber(bucket[2]) or now
        
        -- Calculate tokens to add
        local elapsed = now - last_refill
        local new_tokens = math.min(burst_size, tokens + (elapsed * refill_rate))
        
        if new_tokens >= requested then
            -- Consume tokens
            new_tokens = new_tokens - requested
            redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
            redis.call('EXPIRE', key, ARGV[5])
            return {1, new_tokens, burst_size}
        else
            -- Not enough tokens
            redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
            redis.call('EXPIRE', key, ARGV[5])
            return {0, new_tokens, burst_size}
        end
        """
        
        result = self.redis_client.eval(
            lua_script,
            1,
            key,
            burst_size,
            refill_rate,
            time.time(),
            1,  # Tokens requested
            config.window_seconds * 2
        )
        
        allowed = bool(result[0])
        tokens_remaining = result[1]
        
        metadata = {
            "limit": config.requests_per_window,
            "burst_size": burst_size,
            "remaining": int(tokens_remaining),
            "reset": int(time.time() + config.window_seconds),
            "retry_after": None if allowed else (1 - tokens_remaining) / refill_rate
        }
        
        return allowed, metadata
    
    def _fixed_window_check(
        self,
        key: str,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """Fixed window rate limiting"""
        window_key = f"{key}:{int(time.time() // config.window_seconds)}"
        
        # Atomic increment
        current = self.redis_client.incr(window_key)
        
        if current == 1:
            # First request in window
            self.redis_client.expire(window_key, config.window_seconds)
        
        allowed = current <= config.requests_per_window
        
        metadata = {
            "limit": config.requests_per_window,
            "remaining": max(0, config.requests_per_window - current),
            "reset": int((int(time.time() // config.window_seconds) + 1) * config.window_seconds),
            "retry_after": None if allowed else config.window_seconds
        }
        
        return allowed, metadata
    
    def _leaky_bucket_check(
        self,
        key: str,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """Leaky bucket algorithm"""
        leak_rate = config.requests_per_window / config.window_seconds
        bucket_size = config.burst_size or config.requests_per_window
        
        lua_script = """
        local key = KEYS[1]
        local bucket_size = tonumber(ARGV[1])
        local leak_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local bucket = redis.call('HMGET', key, 'level', 'last_leak')
        local level = tonumber(bucket[1]) or 0
        local last_leak = tonumber(bucket[2]) or now
        
        -- Calculate leak
        local elapsed = now - last_leak
        local leaked = elapsed * leak_rate
        level = math.max(0, level - leaked)
        
        if level < bucket_size then
            -- Add to bucket
            level = level + 1
            redis.call('HMSET', key, 'level', level, 'last_leak', now)
            redis.call('EXPIRE', key, ARGV[4])
            return {1, bucket_size - level}
        else
            -- Bucket full
            redis.call('HMSET', key, 'level', level, 'last_leak', now)
            redis.call('EXPIRE', key, ARGV[4])
            return {0, 0}
        end
        """
        
        result = self.redis_client.eval(
            lua_script,
            1,
            key,
            bucket_size,
            leak_rate,
            time.time(),
            config.window_seconds * 2
        )
        
        allowed = bool(result[0])
        space_remaining = result[1]
        
        metadata = {
            "limit": config.requests_per_window,
            "remaining": int(space_remaining),
            "reset": int(time.time() + config.window_seconds),
            "retry_after": None if allowed else 1 / leak_rate
        }
        
        return allowed, metadata
    
    def reset_limit(self, identifier: str, endpoint: str):
        """Reset rate limit for specific identifier and endpoint"""
        key = self._get_key(identifier, endpoint)
        self.redis_client.delete(key)
    
    def get_usage_stats(self, identifier: str, endpoint: str) -> Dict[str, any]:
        """Get current usage statistics"""
        allowed, metadata = self.check_rate_limit(identifier, endpoint)
        return {
            "endpoint": endpoint,
            "allowed": allowed,
            **metadata
        }
    
    def set_custom_limit(
        self,
        endpoint: str,
        config: RateLimitConfig
    ):
        """Set custom rate limit for endpoint"""
        self.default_limits[endpoint] = config

# Global rate limiter instance
rate_limiter = RateLimiter()
