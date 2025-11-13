/**
 * Simple script to test Redis connection
 * Usage: npx ts-node test-redis-connection.ts
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('🔍 Testing Redis Connection...');
console.log(`📍 Redis URL: ${REDIS_URL.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs

// Check if URL is for Upstash (contains 'upstash' or uses 'rediss://')
const isUpstash = 
  REDIS_URL.toLowerCase().includes('upstash') || 
  REDIS_URL.startsWith('rediss://');

// Normalize URL: if Upstash but using redis://, convert to rediss://
let redisUrl = REDIS_URL;
if (isUpstash && redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
  redisUrl = redisUrl.replace('redis://', 'rediss://');
  console.log('🔒 Converted Redis URL to use TLS (rediss://) for Upstash');
}

console.log(`🔐 Upstash detected: ${isUpstash}`);
console.log(`🔒 TLS enabled: ${isUpstash}`);

const redisClient = createClient({
  url: redisUrl,
  socket: {
    keepAlive: 30000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000,
    // Enable TLS for Upstash Redis
    ...(isUpstash && {
      tls: true,
      rejectUnauthorized: true,
    }),
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
  console.error('   Stack:', err.stack);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

redisClient.on('end', () => {
  console.log('⚠️  Redis connection ended');
});

async function testConnection() {
  try {
    console.log('\n📡 Attempting to connect...');
    await redisClient.connect();
    
    console.log('\n🧪 Testing basic operations...');
    
    // Test SET
    await redisClient.set('test:connection', 'success', { EX: 10 });
    console.log('✅ SET operation successful');
    
    // Test GET
    const value = await redisClient.get('test:connection');
    console.log(`✅ GET operation successful: ${value}`);
    
    // Test PING
    const pong = await redisClient.ping();
    console.log(`✅ PING successful: ${pong}`);
    
    // Test INFO
    const info = await redisClient.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    if (versionMatch) {
      console.log(`✅ Redis version: ${versionMatch[1].trim()}`);
    }
    
    console.log('\n🎉 All tests passed! Redis connection is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('   Unknown error:', error);
    }
    
    // Provide helpful suggestions
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check if REDIS_URL is set correctly in .env file');
    console.log('   2. For Upstash, ensure URL starts with "rediss://" or contains "upstash.io"');
    console.log('   3. Verify your Upstash credentials are correct');
    console.log('   4. Check if your network allows outbound connections');
    console.log('   5. Ensure Upstash Redis instance is active');
    
    process.exit(1);
  } finally {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
      console.log('\n🔌 Disconnected from Redis');
    }
  }
}

// Run the test
testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

