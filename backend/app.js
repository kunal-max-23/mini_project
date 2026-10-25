/**
 * RapidRoute Modular Express Application Factory
 * Integrates security headers, CORS, rate limiting, request validation,
 * structured audit logging, and domain route handlers.
 */

import express from 'express';
import crypto from 'crypto';
import { config } from './config.js';
import { cache } from './cache/redisClient.js';
import routesRouter from './routes/routes.js';
import conditionsRouter from './routes/conditions.js';
import telemetryRouter from './routes/telemetry.js';

export function createApp() {
  const app = express();

  // 1. Request ID & Structured Timing Middleware
  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    res.setHeader('X-Request-ID', req.id);
    req.startTime = Date.now();
    next();
  });

  // 2. Tactical Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(self)');
    next();
  });

  // 3. CORS Policy
  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // 4. Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Rate Limiting Middleware
  app.use(async (req, res, next) => {
    // Exclude health and metrics from rate limits
    if (req.path === '/healthz' || req.path === '/readyz' || req.path === '/metrics') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const rateCheck = await cache.checkRateLimit(ip);

    res.setHeader('X-RateLimit-Limit', config.security.rateLimitMax);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateCheck.resetTime / 1000));

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Tactical request burst threshold exceeded. Please throttle transmission.',
        requestId: req.id,
      });
    }
    next();
  });

  // 6. Structured Operational Audit Logging
  app.use((req, res, next) => {
    res.on('finish', () => {
      const durationMs = Date.now() - req.startTime;
      if (req.path !== '/healthz' && req.path !== '/metrics') {
        const logEntry = {
          timestamp: new Date().toISOString(),
          requestId: req.id,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs,
          user: req.user ? req.user.sub : 'anonymous',
        };
        // Avoid logging incident PII
        if (durationMs > 250) {
          console.warn('[RapidRoute SLOW_REQUEST]', JSON.stringify(logEntry));
        }
      }
    });
    next();
  });

  // 7. Route Handlers
  app.use('/', telemetryRouter); // /healthz, /readyz, /metrics
  app.use('/api/v1/routes', routesRouter);
  app.use('/api/v1/conditions', conditionsRouter);
  app.use('/api/v1/telemetry', telemetryRouter);

  // 8. 404 Handler for API
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} does not exist in RapidRoute API v1.`,
      requestId: req.id,
    });
  });

  // 9. Global Error Handler
  app.use((err, req, res, next) => {
    console.error(`[RapidRoute UNHANDLED_ERROR] ${req.id}:`, err);
    res.status(err.status || 500).json({
      success: false,
      error: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected failure occurred in the emergency routing platform.',
      requestId: req.id,
    });
  });

  return app;
}
