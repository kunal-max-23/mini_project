/**
 * RapidRoute ML Feature Extractor
 * Transforms raw road segment, traffic, weather, and incident signals into ML feature vectors.
 */

export const ROAD_CLASS_ENCODING = {
  motorway: 1.0,
  trunk: 1.5,
  primary: 2.0,
  secondary: 2.5,
  tertiary: 3.0,
  residential: 3.5,
};

export const VEHICLE_CLASS_FACTORS = {
  Ambulance: 1.0,      // Agile, high acceleration
  'Fire Engine': 1.25, // Heavier, slower cornering
  'Heavy Rescue': 1.35, // Very heavy, strict clearance
  'Chief Command': 0.95 // Rapid SUV
};

/**
 * Extracts normalized features for a road segment
 */
export function extractSegmentFeatures(segment, context = {}) {
  const now = context.timestamp ? new Date(context.timestamp) : new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Road geometry features
  const roadClassWeight = ROAD_CLASS_ENCODING[segment.roadClass] || 2.0;
  const lengthKm = segment.lengthM / 1000.0;
  const speedLimitKmh = segment.speedLimitKmh || 50;
  const freeFlowTimeSeconds = (lengthKm / speedLimitKmh) * 3600;
  const turnComplexity = segment.turnComplexity || 1.0;

  // Cyclic time-of-day features (24h period)
  const hourSin = Math.sin((2 * Math.PI * hour) / 24);
  const hourCos = Math.cos((2 * Math.PI * hour) / 24);

  // Peak congestion indicator (Rush hours: 07:30 - 09:30 & 16:30 - 18:45)
  const isPeakHour = (!isWeekend && ((hour >= 7.5 && hour <= 9.5) || (hour >= 16.5 && hour <= 18.75))) ? 1.0 : 0.0;

  // Weather conditions (defaults to nominal if unobserved)
  const weather = context.weather || { precipitationMm: 0.0, visibilityKm: 10.0, roadGrip: 0.95 };
  const precipitationFactor = Math.min(1.0, weather.precipitationMm / 20.0);
  const visibilityFactor = Math.max(0.0, 1.0 - (weather.visibilityKm / 10.0));
  const surfaceGrip = Math.min(1.0, Math.max(0.2, weather.roadGrip || 0.95));

  // Live traffic speed factor if observed
  const currentSpeed = segment.currentSpeedKmh !== undefined ? segment.currentSpeedKmh : segment.histSpeedKmh;
  const congestionRatio = Math.max(0.1, Math.min(1.5, currentSpeed / speedLimitKmh));

  // Incident & Closure proximity
  const hasIncident = context.hasIncident ? 1.0 : 0.0;
  const blockedLanes = context.blockedLanes || 0;

  // Vehicle constraints & Opticom preemption
  const vehicleType = context.vehicleType || 'Ambulance';
  const vehicleFactor = VEHICLE_CLASS_FACTORS[vehicleType] || 1.0;
  const opticomPreempted = (context.opticomPreemptIntersections && segment.opticomEnabled) ? 1.0 : 0.0;

  return {
    segmentId: segment.id,
    freeFlowTimeSeconds,
    lengthKm,
    speedLimitKmh,
    roadClassWeight,
    turnComplexity,
    hourSin,
    hourCos,
    isWeekend: isWeekend ? 1.0 : 0.0,
    isPeakHour,
    precipitationFactor,
    visibilityFactor,
    surfaceGrip,
    congestionRatio,
    hasIncident,
    blockedLanes,
    vehicleFactor,
    opticomPreempted,
  };
}
