import { RedisCacheService } from './redis-cache.service';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitStatus {
  limited: boolean;
  remainingAttempts: number;
  remainingTime: number;
}

export class RedisRateLimiter {
  public config: RateLimitConfig;
  private redis: RedisCacheService;

  constructor(redis: RedisCacheService, config: Partial<RateLimitConfig> = {}) {
    this.redis = redis;
    this.config = {
      maxAttempts: config.maxAttempts || 10,
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
      blockDurationMs: config.blockDurationMs || 24 * 60 * 60 * 1000, // 24 hours
    };
  }

  private getKey(identifier: string, type: 'attempts' | 'blocked'): string {
    return `rate_limit:${type}:${identifier}`;
  }

  async isRateLimited(identifier: string): Promise<RateLimitStatus> {
    try {
      const now = Date.now();
      
      // Check if identifier is blocked
      const blockedKey = this.getKey(identifier, 'blocked');
      const blockedUntil = await this.redis.get(blockedKey);
      
      if (blockedUntil && blockedUntil > now) {
        return {
          limited: true,
          remainingAttempts: 0,
          remainingTime: blockedUntil - now
        };
      }

      // Check attempts within the current window
      const attemptsKey = this.getKey(identifier, 'attempts');
      const attemptsData = await this.redis.get(attemptsKey);
      
      if (!attemptsData) {
        return {
          limited: false,
          remainingAttempts: this.config.maxAttempts,
          remainingTime: 0
        };
      }

      // Check if window has expired
      if (now - attemptsData.firstAttempt > this.config.windowMs) {
        await this.redis.del(attemptsKey);
        return {
          limited: false,
          remainingAttempts: this.config.maxAttempts,
          remainingTime: 0
        };
      }

      const remainingAttempts = Math.max(0, this.config.maxAttempts - attemptsData.count);
      const limited = remainingAttempts === 0;

      return {
        limited,
        remainingAttempts,
        remainingTime: 0
      };
    } catch (error) {
      console.error(`Error checking rate limit for ${identifier}:`, error);
      return {
        limited: false,
        remainingAttempts: this.config.maxAttempts,
        remainingTime: 0
      };
    }
  }

  async recordAttempt(identifier: string): Promise<RateLimitStatus> {
    try {
      const now = Date.now();
      
      // Check if identifier is blocked
      const blockedKey = this.getKey(identifier, 'blocked');
      const blockedUntil = await this.redis.get(blockedKey);
      
      if (blockedUntil && blockedUntil > now) {
        return {
          limited: true,
          remainingAttempts: 0,
          remainingTime: blockedUntil - now
        };
      }

      // Get or create attempts data
      const attemptsKey = this.getKey(identifier, 'attempts');
      let attemptsData = await this.redis.get(attemptsKey);
      
      if (!attemptsData) {
        attemptsData = {
          count: 1,
          firstAttempt: now
        };
        
        const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
        await this.redis.set(attemptsKey, attemptsData, ttlSeconds);
        
        return {
          limited: false,
          remainingAttempts: this.config.maxAttempts - 1,
          remainingTime: 0
        };
      }

      // Check if window has expired
      if (now - attemptsData.firstAttempt > this.config.windowMs) {
        attemptsData = {
          count: 1,
          firstAttempt: now
        };
        
        const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
        await this.redis.set(attemptsKey, attemptsData, ttlSeconds);
        
        return {
          limited: false,
          remainingAttempts: this.config.maxAttempts - 1,
          remainingTime: 0
        };
      }

      // Increment attempt count
      attemptsData.count++;
      
      const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
      await this.redis.set(attemptsKey, attemptsData, ttlSeconds);

      if (attemptsData.count > this.config.maxAttempts) {
        const blockTTLSeconds = Math.ceil(this.config.blockDurationMs / 1000);
        await this.redis.set(blockedKey, now + this.config.blockDurationMs, blockTTLSeconds);
        
        return {
          limited: true,
          remainingAttempts: 0,
          remainingTime: this.config.blockDurationMs
        };
      }

      return {
        limited: false,
        remainingAttempts: this.config.maxAttempts - attemptsData.count,
        remainingTime: 0
      };
    } catch (error) {
      console.error(`Error recording attempt for ${identifier}:`, error);
      return {
        limited: false,
        remainingAttempts: this.config.maxAttempts - 1,
        remainingTime: 0
      };
    }
  }

  async resetAttempts(identifier: string): Promise<void> {
    try {
      const attemptsKey = this.getKey(identifier, 'attempts');
      const blockedKey = this.getKey(identifier, 'blocked');
      
      await Promise.all([
        this.redis.del(attemptsKey),
        this.redis.del(blockedKey)
      ]);
    } catch (error) {
      console.error(`Error resetting rate limit for ${identifier}:`, error);
    }
  }

  formatRemainingTime(ms: number): string {
    if (ms === 0) return '0 seconds';
    
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}

