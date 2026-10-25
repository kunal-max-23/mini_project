/**
 * RapidRoute Tactical Dispatch Types
 */

export interface CandidateRoute {
  id: string;
  name: string;
  key: string;
  tag: string;
  summary: string;
  corridorDescription: string;
  predictedDurationSeconds: number;
  durationFormatted: string;
  etaClockPst: string;
  distanceMiles: number;
  distanceMeters: number;
  confidencePercent: number;
  confidenceScore: number;
  spreadVariance: {
    lowerMinutes: number;
    upperMinutes: number;
    deltaMinutes: number;
    label: string;
  };
  signalPreemptions: number;
  hazards: Array<{
    type: string;
    severity: string;
    description: string;
    segmentId: string;
  }>;
  reliabilityScore: number;
  isRecommended?: boolean;
  isDegraded?: boolean;
  degradedReasons?: string[];
  waypoints: Array<{ name: string; lon: number; lat: number }>;
}

export interface IncidentRecord {
  incidentId: string;
  callSign: string;
  cadReference: string;
  priorityLevel: string;
  classification: string;
  originAddress: string;
  originCoordinates: { lon: number; lat: number };
  destinationFacility: string;
  destinationCoordinates: { lon: number; lat: number };
  assignedVehicleId: string;
  vehicleType: string;
  selectedRouteId: string | null;
  status: string;
}

export interface VehicleUnit {
  id: string;
  callSign: string;
  type: string;
  class: string;
  make: string;
  status: string;
  speedMph: number;
  heading: number;
  lon: number;
  lat: number;
  gpsDriftM: number;
  batteryFuel: string;
  carrier: string;
  activeRouteId: string | null;
}

export interface RoutingSynthesis {
  confidenceCategory: string;
  recommendedRouteId: string;
  narrative: string;
  primaryDrivers: string[];
}
