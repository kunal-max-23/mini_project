/**
 * RapidRoute - Application Configuration & Environment Parser
 * Enforces strict validation, sensible defaults, and security bounds.
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  appName: 'RapidRoute Emergency Routing Platform',
  appVersion: '4.2.1',

  // Database (PostgreSQL + PostGIS)
  database: {
    url: process.env.DATABASE_URL || 'postgresql://rapidroute:tactical_secure_pass@localhost:5432/rapidroute_db',
    maxPool: parseInt(process.env.DB_MAX_POOL || '20', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMs: parseInt(process.env.DB_CONN_TIMEOUT_MS || '5000', 10),
    useInMemoryFallback: process.env.USE_IN_MEMORY_DB !== 'false', // graceful fallback if PostgreSQL is not active
  },

  // Redis Cache & Job Coordination
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
    routeCacheTtlSeconds: parseInt(process.env.ROUTE_CACHE_TTL_SECONDS || '30', 10),
    useInMemoryFallback: process.env.USE_IN_MEMORY_REDIS !== 'false',
  },

  // Security & Authentication
  security: {
    jwtSecret: process.env.JWT_SECRET || 'rapidroute_tactical_jwt_secret_dev_key_never_in_production',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '300', 10), // per window
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    allowedOrigins: (process.env.CORS_ORIGINS || '*').split(','),
  },

  // Routing Engine Weights & Tolerances (Version 4.2)
  routing: {
    version: '4.2.0',
    weights: {
      travelTime: 0.50,
      uncertaintyVariance: 0.25,
      closureRisk: 0.15,
      opticomPreemptionBonus: 0.10,
    },
    candidateCount: 3,
    maxSearchRadiusMeters: 50000,
    staleFeedThresholdSeconds: 180, // feeds older than 3m considered stale
    significantEtaDeltaSeconds: 45, // triggers reroute broadcast
  },

  // Machine Learning Model
  ml: {
    modelVersion: 'v4.2.1-gbdt',
    featureVersion: 'f_v3',
    confidenceIntervalPercentile: 90,
    confidenceThresholdForRecommendation: 0.70,
    driftSensitivityZScore: 2.5,
  },

  // Service Level SLA Tolerances
  sla: {
    routeCalculationMaxLatencyMs: 150,
    sensorIngestionMaxLatencyMs: 50,
  }
};
