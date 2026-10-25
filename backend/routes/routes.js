/**
 * RapidRoute Route Planning & Optimization APIs
 * Handles route requests, candidate evaluation, dispatch confirmation,
 * dynamic rerouting triggers, and SSE streaming.
 */

import { Router } from 'express';
import { routerEngine } from '../graph/router.js';
import { cache } from '../cache/redisClient.js';
import { telemetryBroker } from '../websocket/telemetryServer.js';
import { requireAuth } from './auth.js';
import { db } from '../db/database.js';

const router = Router();

/**
 * POST /api/v1/routes
 * Request candidate routes with ML travel-time forecasting, uncertainty bounds, and explainability
 */
router.post('/', requireAuth(), async (req, res) => {
  const requestId = req.id || `req_${Date.now()}`;
  try {
    const {
      origin,
      destination,
      vehicleType = 'Ambulance',
      priorityLevel = 'CODE_3_CRITICAL',
      constraints = {},
      incidentMetadata = {},
      forceDegraded = false,
    } = req.body;

    // Coordinate validation
    if (!origin || typeof origin.lon !== 'number' || typeof origin.lat !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ORIGIN_COORDINATES',
        message: 'Origin coordinates must include numerical lon and lat (WGS84).',
        requestId,
      });
    }

    if (!destination || typeof destination.lon !== 'number' || typeof destination.lat !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DESTINATION_COORDINATES',
        message: 'Destination coordinates must include numerical lon and lat (WGS84).',
        requestId,
      });
    }

    // Cache lookup for identical tactical requests
    const cacheKey = `route_plan:${origin.lon.toFixed(4)}_${origin.lat.toFixed(4)}_${destination.lon.toFixed(4)}_${destination.lat.toFixed(4)}_${vehicleType}_${JSON.stringify(constraints)}`;
    const cached = await cache.get(cacheKey);
    if (cached && !forceDegraded) {
      return res.json({
        ...cached,
        fromCache: true,
        requestId,
      });
    }

    const routeResult = await routerEngine.calculateRoutes({
      origin,
      destination,
      vehicleType,
      priorityLevel,
      constraints,
      incidentMetadata,
      forceDegraded,
    });

    // Cache for 30s
    await cache.set(cacheKey, routeResult, 30);

    return res.json({
      success: true,
      ...routeResult,
      requestId,
    });
  } catch (err) {
    console.error(`[RapidRoute] Route calculation failure (${requestId}):`, err);
    return res.status(500).json({
      success: false,
      error: 'ROUTING_ENGINE_ERROR',
      message: err.message || 'Internal failure during graph traversal and travel-time forecasting.',
      requestId,
      safetyNotice: 'Revert to tactical baseline coordinates or execute verbal radio routing.',
    });
  }
});

/**
 * POST /api/v1/routes/confirm
 * Dispatcher confirms a recommended route (e.g. Route Alpha)
 */
router.post('/confirm', requireAuth(), async (req, res) => {
  const { routeId, incidentId = 'INC-8492', vehicleId = 'VEH_MEDIC_4', callSign = 'Medic-4' } = req.body;

  if (!routeId) {
    return res.status(400).json({ success: false, error: 'MISSING_ROUTE_ID', message: 'routeId is required.' });
  }

  // Update vehicle's active route in database
  db.updateVehicle(vehicleId, {
    activeRouteId: routeId,
    status: 'ACTIVE_TRANSIT',
  });

  // Broadcast confirmation to vehicle HUD and consoles
  const eventPayload = {
    type: 'ROUTE_CONFIRMED_AND_DISPATCHED',
    incidentId,
    routeId,
    callSign,
    vehicleId,
    corridorStatus: 'OPTICOM PREEMPTION ARMED (5 INTERSECTIONS)',
    timestamp: new Date().toISOString(),
    dispatcher: req.user ? req.user.name : 'Tactical Dispatch',
  };

  telemetryBroker.broadcast(eventPayload);

  return res.json({
    success: true,
    message: `Direct MDT Uplink transmitted to ${callSign}. Opticom preemption corridor engaged.`,
    event: eventPayload,
  });
});

/**
 * POST /api/v1/routes/reroute
 * Triggers or evaluates dynamic detour when unexpected collision occurs
 */
router.post('/reroute', requireAuth(), async (req, res) => {
  const {
    incidentId = 'INC-8492',
    cause = 'Sudden 2-Car Collision reported at 5th & Harrison (Blocked 3 lanes)',
    blockedSegmentId = 'SEG_ALPHA_3',
    bypassRouteId = 'ROUTE_DELTA',
    timeSavedSeconds = 252, // 4m 12s
  } = req.body;

  const eventPayload = {
    type: 'CRITICAL_OBSTRUCTION_DETECTED',
    incidentId,
    hazard: {
      type: 'COLLISION',
      description: cause,
      sensorId: 'DOT-CAM-884',
      impact: 'HIGHWAY_BLOCKAGE_+6.4M_DELAY',
      blockedLanes: 3,
      location: '5th & Harrison',
    },
    recommendation: {
      action: 'DYNAMIC_DIVERSION',
      proposedRoute: 'Route Delta (Broadway Bypass)',
      proposedRouteId: bypassRouteId,
      etaSavedFormatted: '4m 12s',
      etaPst: '14:26:10 PST',
      safetyGate: 'REQUIRE_EXPLICIT_COMMAND_CONFIRMATION',
    },
    timestamp: new Date().toISOString(),
  };

  telemetryBroker.broadcast(eventPayload);

  return res.json({
    success: true,
    event: eventPayload,
  });
});

/**
 * GET /api/v1/routes/stream
 * Server-Sent Events endpoint for persistent live updates
 */
router.get('/stream', (req, res) => {
  telemetryBroker.addSseClient(req, res);
});

export default router;
