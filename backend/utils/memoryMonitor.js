class MemoryMonitor {
  constructor() {
    this.thresholds = {
      warning: 1024 * 1024 * 1024, // 1GB
      critical: 2048 * 1024 * 1024, // 2GB
      emergency: 3072 * 1024 * 1024  // 3GB
    };
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      rssMB: Math.round(usage.rss / 1024 / 1024)
    };
  }

  checkMemoryStatus() {
    const usage = this.getMemoryUsage();
    
    if (usage.heapUsed > this.thresholds.emergency) {
      return {
        status: 'emergency',
        message: `🚨 EMERGENCY: Memory usage at ${usage.heapUsedMB}MB - immediate cleanup required`,
        usage
      };
    } else if (usage.heapUsed > this.thresholds.critical) {
      return {
        status: 'critical',
        message: `🔴 CRITICAL: Memory usage at ${usage.heapUsedMB}MB - cleanup recommended`,
        usage
      };
    } else if (usage.heapUsed > this.thresholds.warning) {
      return {
        status: 'warning',
        message: `⚠️  WARNING: Memory usage at ${usage.heapUsedMB}MB - monitoring closely`,
        usage
      };
    } else {
      return {
        status: 'normal',
        message: `✅ Memory usage normal: ${usage.heapUsedMB}MB`,
        usage
      };
    }
  }

  forceCleanup() {
    console.log('🧹 Forcing memory cleanup...');
    
    if (global.gc) {
      // Multiple garbage collection cycles
      global.gc();
      global.gc();
      global.gc();
      
      const afterCleanup = this.getMemoryUsage();
      console.log(`🧹 Cleanup complete: ${afterCleanup.heapUsedMB}MB heap used`);
      return afterCleanup;
    } else {
      console.warn('⚠️  Garbage collection not available - start with --expose-gc flag');
      return this.getMemoryUsage();
    }
  }

  startMonitoring(intervalMs = 10000) {
    if (this.isMonitoring) {
      console.log('📊 Memory monitoring already active');
      return;
    }

    console.log(`📊 Starting memory monitoring (${intervalMs}ms intervals)`);
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      const status = this.checkMemoryStatus();
      
      if (status.status !== 'normal') {
        console.log(status.message);
        
        if (status.status === 'emergency') {
          this.forceCleanup();
        } else if (status.status === 'critical') {
          this.forceCleanup();
        }
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('📊 Memory monitoring stopped');
    }
  }

  logMemoryUsage(context = '') {
    const usage = this.getMemoryUsage();
    const contextStr = context ? ` [${context}]` : '';
    console.log(`📊${contextStr} Memory: ${usage.heapUsedMB}MB heap, ${usage.rssMB}MB RSS`);
    return usage;
  }

  async withMemoryMonitoring(asyncFunction, context = '') {
    const startUsage = this.logMemoryUsage(`${context} - START`);
    
    try {
      const result = await asyncFunction();
      const endUsage = this.logMemoryUsage(`${context} - END`);
      
      const memoryDiff = endUsage.heapUsedMB - startUsage.heapUsedMB;
      if (memoryDiff > 50) {
        console.warn(`⚠️  High memory increase in ${context}: +${memoryDiff}MB`);
      }
      
      return result;
    } catch (error) {
      this.logMemoryUsage(`${context} - ERROR`);
      throw error;
    }
  }
}

module.exports = new MemoryMonitor();