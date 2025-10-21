import { createClient, RedisClientType } from 'redis';

export interface RedisCacheOptions {
  url?: string;
  defaultTTL?: number;
}

export class RedisCacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private defaultTTL: number;

  constructor(private options: RedisCacheOptions = {}) {
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
    this.init();
  }

  private async init() {
    try {
      this.client = createClient({
        url: this.options.url || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis cache max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Cache Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Cache Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('🚀 Redis Cache Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis Cache Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to initialize Redis cache:', error);
      this.isConnected = false;
    }
  }

  private async ensureConnection() {
    if (!this.client || !this.isConnected) {
      await this.init();
    }
    return this.client && this.isConnected;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) return false;

      const serializedValue = JSON.stringify(value);
      const ttl = ttlSeconds || this.defaultTTL;
      await this.client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error(`❌ Redis cache SET error for key ${key}:`, error);
      return false;
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) return null;

      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`❌ Redis cache GET error for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) return false;

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`❌ Redis cache DEL error for key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) return 0;

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        return result;
      }
      return 0;
    } catch (error) {
      console.error(`❌ Redis cache pattern deletion error for ${pattern}:`, error);
      return 0;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) return false;

      await this.client.ping();
      return true;
    } catch (error) {
      console.error('❌ Redis cache health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

