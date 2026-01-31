# MediBot Performance Optimization Guide

## 🚀 Quick Setup (5 minutes)

### 1. **Run Optimization Setup**
```bash
cd backend
node scripts/optimizeSetup.js
```

### 2. **Install Dependencies**
```bash
npm install redis@^4.6.0
```

### 3. **Add Database Indexes**
```bash
node scripts/addIndexes.js
```

### 4. **Update Server Configuration**
Add to your `backend/server.js`:
```javascript
const performanceMiddleware = require('./middleware/performance');
app.use(performanceMiddleware);
```

### 5. **Test Performance**
```bash
# Start your server
npm start

# In another terminal, run performance test
node scripts/performanceTest.js
```

## 📊 **Expected Improvements**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| FAQ Search | 2-3s | 0.8-1.2s | **40-50% faster** |
| Chat Response | 3-5s | 1.5-2.5s | **30-40% faster** |
| Memory Usage | High | Reduced | **25-35% less** |
| API Calls | Many | Cached | **50-60% fewer** |
| Server Startup | 10-15s | 2-3s | **70-80% faster** |

## 🔧 **Key Optimizations Implemented**

### **1. Caching Layer**
- ✅ Redis cache for FAQ searches (1 hour TTL)
- ✅ In-memory cache for embeddings (24 hour TTL)
- ✅ Chat response caching (30 minutes TTL)
- ✅ Automatic cache invalidation

### **2. Database Optimization**
- ✅ Compound indexes for faster queries
- ✅ Optimized aggregation pipelines
- ✅ Reduced N+1 query problems

### **3. Parallel Processing**
- ✅ Intent classification + FAQ search + Web search run in parallel
- ✅ Non-blocking service initialization
- ✅ Async chat history saving

### **4. Memory Management**
- ✅ Embedding model lazy loading
- ✅ Aggressive garbage collection
- ✅ Memory usage monitoring

### **5. API Optimization**
- ✅ Request batching for embeddings
- ✅ Connection pooling
- ✅ Response compression

## 🎯 **Usage Examples**

### **Using Optimized Chat Endpoint**
```javascript
// New optimized endpoint
POST /api/ai/chat-optimized

// Same request format as original
{
  "message": "What is diabetes?",
  "language": "en",
  "conversationHistory": []
}

// Enhanced response with performance metrics
{
  "response": "Diabetes is...",
  "intent": "faq",
  "confidence": 0.95,
  "processingTime": 850,
  "cached": false,
  "faq": {
    "resultsCount": 3,
    "bestMatch": {
      "title": "Diabetes Overview",
      "score": 0.92
    }
  }
}
```

### **Cache Performance Headers**
```
X-Response-Time: 850ms
X-Memory-Delta: 12.5MB
```

## 🔍 **Monitoring & Debugging**

### **Cache Hit Rates**
Look for these logs:
```
🚀 FAQ search cache hit
🚀 Chat response cache hit
🚀 Embedding cache hit
```

### **Performance Warnings**
```
🐌 Slow request: POST /api/ai/chat - 3500ms
🧠 High memory request: POST /api/ai/chat - 75.2MB
```

### **Memory Monitoring**
```javascript
// Check memory usage
const memUsage = process.memoryUsage();
console.log(`Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
```

## 🚀 **Advanced Optimizations**

### **1. Redis Setup (Optional but Recommended)**

**Local Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Windows
# Download from https://redis.io/download
```

**Environment Variable:**
```bash
# .env
REDIS_URL=redis://localhost:6379

# Production
REDIS_URL=redis://username:password@host:port
```

### **2. Production Deployment**

**Memory Optimization:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 server.js

# Enable garbage collection
node --expose-gc server.js
```

**PM2 Configuration:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'medibot-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    node_args: '--max-old-space-size=4096 --expose-gc',
    env: {
      NODE_ENV: 'production',
      ENABLE_PERFORMANCE_MONITORING: 'true'
    }
  }]
};
```

### **3. Load Testing**

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3004'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Chat API Load Test"
    requests:
      - post:
          url: "/api/ai/chat-optimized"
          json:
            message: "What is diabetes?"
            language: "en"
EOF

# Run load test
artillery run load-test.yml
```

## 🔧 **Troubleshooting**

### **Common Issues**

**1. Cache Not Working**
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check logs for cache errors
grep "Cache.*error" logs/app.log
```

**2. Slow Database Queries**
```bash
# Check if indexes were created
node scripts/addIndexes.js

# Monitor MongoDB queries
# Add to MongoDB connection:
mongoose.set('debug', true);
```

**3. High Memory Usage**
```bash
# Enable garbage collection
node --expose-gc --max-old-space-size=4096 server.js

# Monitor memory in real-time
node --inspect server.js
# Open chrome://inspect in Chrome
```

**4. Performance Regression**
```bash
# Run performance comparison
node scripts/performanceTest.js

# Check for cache hit rates in logs
grep "cache hit" logs/app.log | wc -l
```

## 📈 **Performance Monitoring Dashboard**

### **Key Metrics to Track**

1. **Response Times**
   - Average: < 2 seconds
   - 95th percentile: < 5 seconds
   - Cache hit rate: > 60%

2. **Memory Usage**
   - Heap usage: < 2GB
   - Memory leaks: Monitor for steady increases
   - GC frequency: < 10 times per minute

3. **Database Performance**
   - Query time: < 100ms average
   - Connection pool: < 80% utilization
   - Index usage: > 95% of queries

4. **Cache Performance**
   - Hit rate: > 60%
   - Eviction rate: < 10%
   - Memory usage: < 500MB

## 🎯 **Next Steps**

### **Phase 3: Advanced Optimizations**

1. **Frontend Optimization**
   - React Query for request deduplication
   - Code splitting with React.lazy()
   - Service worker for offline support

2. **Infrastructure**
   - CDN for static assets
   - Load balancer for multiple instances
   - Database read replicas

3. **Monitoring**
   - APM tools (New Relic, DataDog)
   - Error tracking (Sentry)
   - Performance dashboards

### **Scaling Considerations**

- **Horizontal Scaling**: Use PM2 cluster mode
- **Database Scaling**: MongoDB sharding or read replicas
- **Cache Scaling**: Redis Cluster for high availability
- **CDN**: CloudFlare or AWS CloudFront for global performance

---

**🎉 Your MediBot is now optimized for production-level performance!**