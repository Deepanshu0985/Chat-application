# Redis Setup Guide

## Problem Fixed

The Redis connection error (`ENOTFOUND red-cjqu2c61208c73fcnbd0`) has been fixed. The application now:

1. ✅ Uses environment variables for Redis configuration
2. ✅ Falls back to local Redis for development
3. ✅ Handles connection failures gracefully
4. ✅ Continues to work even if Redis is unavailable
5. ✅ Provides helpful error messages

## Configuration

### Option 1: Use Local Redis (Recommended for Development)

1. **Install Redis locally:**
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Linux (Ubuntu/Debian)
   sudo apt-get install redis-server
   sudo systemctl start redis

   # Windows
   # Download from https://redis.io/download
   ```

2. **Create/Update `.env` file:**
   ```env
   REDIS_URL=redis://127.0.0.1:6379
   ```

### Option 2: Use Redis Cloud/Remote Redis

1. **Get your Redis URL from your provider** (Redis Cloud, AWS ElastiCache, etc.)

2. **Update `.env` file:**
   ```env
   REDIS_URL=redis://your-redis-url:6379
   # Or if it requires authentication:
   REDIS_URL=redis://username:password@your-redis-url:6379
   ```

### Option 3: Disable Redis (App Works Without It)

If you don't have Redis and don't need caching features:

1. **Update `.env` file:**
   ```env
   REDIS_DISABLED=true
   ```

   The app will continue to work, but:
   - Chat message caching will be disabled
   - Global alerts caching will be disabled
   - Some real-time features may be limited

## Environment Variables

Create a `.env` file in the `server` directory with:

```env
# Required
ATLAS_URI_1=your_mongodb_connection_string
PROJECT_ID=your_firebase_project_id

# Redis (Optional)
REDIS_URL=redis://127.0.0.1:6379
# OR
REDIS_DISABLED=true

# Server
PORT=10000
```

## Testing Redis Connection

### Check if Redis is running locally:
```bash
redis-cli ping
# Should return: PONG
```

### Test the server:
```bash
cd server
npm start
```

You should see one of these messages:
- ✅ `Connected to Redis server successfully` - Redis is working
- ❌ `Failed to connect after 3 attempts` - Redis is not available, but app continues
- ℹ️ `Redis: Connection disabled` - Redis is intentionally disabled

## Features That Require Redis

- **Chat Message Caching**: Recent messages are cached in Redis for faster access
- **Global Alerts Caching**: Notifications are cached in Redis
- **Socket.IO Scaling**: Redis adapter allows scaling Socket.IO across multiple servers

## Features That Work Without Redis

- ✅ User authentication and management
- ✅ Room/group creation and management
- ✅ Chat messaging (stored in MongoDB)
- ✅ Real-time messaging via Socket.IO (single server)
- ✅ All database operations

## Troubleshooting

### Error: `ENOTFOUND`
- **Cause**: Redis hostname cannot be resolved
- **Solution**: Check your `REDIS_URL` in `.env` file
- **Quick Fix**: Use `REDIS_DISABLED=true` to skip Redis

### Error: `ECONNREFUSED`
- **Cause**: Redis server is not running
- **Solution**: Start Redis server (`brew services start redis` on macOS)

### Error: `NOAUTH Authentication required`
- **Cause**: Redis requires password
- **Solution**: Include password in URL: `redis://:password@host:6379`

### App Still Works Without Redis?
- **Yes!** The app is designed to work without Redis. Caching features will be disabled, but all core functionality works.

## Production Deployment

For production, use a managed Redis service:
- **Redis Cloud**: https://redis.com/cloud
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Google Cloud Memorystore**: https://cloud.google.com/memorystore
- **Azure Cache for Redis**: https://azure.microsoft.com/services/cache/

Set the `REDIS_URL` environment variable in your production environment.

