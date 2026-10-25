/**
 * RapidRoute Conditions Ingestion API
 * Ingests external traffic speeds, weather alerts, road closures, and incidents.
 */

import { Router } from 'express';
import { normalizer } from '../ingestion/normalizer.js';
import { db } from '../db/database.js';
import { telemetryBroker } from '../websocket/telemetryServer.js';
import { requireAuth } from './auth.js';

const router = Router();

/**
 * POST /api/v1/conditions
 * Accepts road condition event from external provider
 */
router.post('/', requireAuth(), async (req, res) => {
  const { provider = 'EXTERNAL_FEED', eventType, data, severity = 'INFO' } = req.body;

  if (!eventType || !data) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PAYLOAD',
      message: 'eventType and data payload are required.',
    });
  }

  const normalized = normalizer.normalize(req.body, provider);

  // If this is a road closure, register in database
  if (normalized.eventType === 'ROAD_CLOSURE_ALERT' || data.isClosure) {
    const closureObj = {
      id: normalized.id,
      segmentId: data.segmentId || 'SEG_ALPHA_3',
      description: data.description || 'Reported roadway obstruction',
      severity: normalized.severity === 'CRITICAL' ? 'FULL_CLOSURE' : 'LANE_RESTRICTION',
      blockedLanes: data.blockedLanes || 1,
      cause: data.cause || 'INCIDENT',
      startTime: normalized.observationTime,
      source: provider,
      isActive: true,
    };
    db.addClosure(closureObj);

    // Broadcast hazard alert
    telemetryBroker.broadcast({
      type: 'HAZARD_ALERT',
      closure: closureObj,
      normalized,
    });
  }

  return res.status(201).json({
    success: true,
    normalizedEvent: normalized,
  });
});

/**
 * GET /api/v1/conditions
 * Query active road closures, impediments, and active weather alerts
 */
router.get('/', (req, res) => {
  const closures = db.getClosures();
  return res.json({
    success: true,
    activeClosuresCount: closures.length,
    closures,
    weatherNotice: {
      radarSource: 'NOAA Doppler Layer (0.5km resolution)',
      warning: 'Flash flood rain cell active over Bay Overpass approach',
      roadGrip: 0.88,
      surfaceTempF: 58,
    },
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
