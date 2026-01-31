const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Override res.json to measure response time
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    const responseTime = endTime - startTime;
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB

    // Add performance headers
    res.set({
      'X-Response-Time': `${responseTime}ms`,
      'X-Memory-Delta': `${memoryDelta.toFixed(2)}MB`
    });

    // Log slow requests
    if (responseTime > 2000) { // > 2 seconds
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Log high memory usage
    if (memoryDelta > 50) { // > 50MB
      console.warn(`🧠 High memory request: ${req.method} ${req.path} - ${memoryDelta.toFixed(2)}MB`);
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

module.exports = performanceMiddleware;