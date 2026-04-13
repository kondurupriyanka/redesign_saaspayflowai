// ============= LOGGING MIDDLEWARE =============

import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
}

const logs: RequestLog[] = [];

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log request
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  };

  // Monitor response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    log.statusCode = res.statusCode;
    log.duration = duration;

    // Store log
    logs.push(log);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const statusColor =
        res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      console.log(
        `${statusColor}[${log.method}] ${log.path} ${log.statusCode} ${log.duration}ms${reset}`
      );
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Get all request logs
 */
export function getLogs() {
  return logs;
}

/**
 * Clear logs
 */
export function clearLogs() {
  logs.length = 0;
}
