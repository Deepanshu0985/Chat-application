const redis = require("redis")
require('dotenv').config()

// Get Redis URL from environment variable or use default
// For local development, use: redis://127.0.0.1:6379
// For production, set REDIS_URL in your .env file
const redisURL = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://127.0.0.1:6379'

// Track connection state
let isConnected = false

// Create Redis client with connection options
// Disable auto-reconnect - we'll handle reconnection manually
const client = redis.createClient({
  url: redisURL,
  socket: {
    reconnectStrategy: false, // Disable auto-reconnect - we handle it manually
    connectTimeout: 5000, // 5 seconds timeout
  }
})

// Handle Redis connection errors gracefully
client.on('error', (err) => {
  // Silently handle errors - we'll show user-friendly messages in connectToRedis
  isConnected = false
  // Don't log here to avoid spam - errors are handled in connectToRedis
})

client.on('connect', () => {
  // Connection attempt started
})

client.on('ready', () => {
  isConnected = true
})

const connectToRedis = async () => {
  // Don't attempt connection if Redis is disabled
  if (process.env.REDIS_DISABLED === 'true') {
    console.log('Redis: Connection disabled via REDIS_DISABLED environment variable')
    return false
  }

  // Mask password in URL for logging
  const maskedURL = redisURL.replace(/:([^:@]+)@/, ':****@')
  console.log(`Connecting to Redis at ${maskedURL}...`)

  try {
    if (client.isOpen) {
      isConnected = true
      console.log('Redis: Already connected')
      return true
    }

    // Set a timeout for connection
    const connectionPromise = client.connect()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    )

    await Promise.race([connectionPromise, timeoutPromise])
    isConnected = true
    console.log('✅ Connected to Redis server successfully')
    return true
    } catch (error) {
    isConnected = false
    console.error(`❌ Redis: Failed to connect`)
    console.error('Redis: The application will continue without Redis caching.')
    console.error('Redis: Some features may be limited, but the app will function normally.')
    console.error(`Redis Error: ${error.message}`)
    
    // Provide helpful error message
    if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Tip: Check your Redis URL in the .env file')
      console.error('💡 For local development, install Redis and use: redis://127.0.0.1:6379')
      console.error('💡 Or set REDIS_DISABLED=true to skip Redis connection')
      console.error('💡 Local Redis install: brew install redis (macOS) or apt-get install redis-server (Linux)\n')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Redis server is not running')
      console.error('💡 Start Redis: brew services start redis (macOS) or systemctl start redis (Linux)')
      console.error('💡 Or set REDIS_DISABLED=true to skip Redis connection\n')
    }
    
    return false
  }
}

// Helper function to check if Redis is connected
const isRedisConnected = () => {
  return isConnected && client.isOpen
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client.isOpen) {
    await client.quit()
    console.log('Redis: Connection closed')
  }
})

process.on('SIGTERM', async () => {
  if (client.isOpen) {
    await client.quit()
    console.log('Redis: Connection closed')
  }
})

module.exports = { 
  client, 
  connectToRedis, 
  isRedisConnected 
}