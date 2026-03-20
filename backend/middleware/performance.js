const { randomUUID } = require("crypto");

function formatMilliseconds(nsDuration) {
  return (Number(nsDuration) / 1e6).toFixed(2);
}

function formatMegabytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

module.exports = function performanceMiddleware(req, res, next) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage().heapUsed;
  const requestId = randomUUID();

  res.locals.requestId = requestId;

  const originalEnd = res.end;
  res.end = function patchedEnd(...args) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;

    const responseTimeMs = formatMilliseconds(endTime - startTime);
    const memoryDeltaBytes = endMemory - startMemory;

    if (!res.headersSent) {
      res.setHeader("X-Request-Id", requestId);
      res.setHeader("X-Response-Time", `${responseTimeMs}ms`);
      res.setHeader("X-Response-Time-Ms", responseTimeMs);
      res.setHeader("X-Memory-Delta", `${memoryDeltaBytes}`);
      res.setHeader("X-Memory-Used-MB", formatMegabytes(endMemory));
    }

    console.log(
      `[Perf] ${req.method} ${req.originalUrl} ${res.statusCode} ${responseTimeMs}ms Δmem=${memoryDeltaBytes}B reqId=${requestId}`,
    );

    return originalEnd.apply(this, args);
  };

  next();
};
