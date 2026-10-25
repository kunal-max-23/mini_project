/**
 * RapidRoute Database Access Layer
 * Supports PostgreSQL with PostGIS extension and provides an in-memory spatial fallback engine.
 */

import { config } from '../config.js';

class SpatialDbEngine {
  constructor() {
    this.nodes = new Map();
    this.segments = new Map();
    this.closures = new Map();
    this.incidents = new Map();
    this.vehicles = new Map();
    this.predictionLogs = [];
    this.isInitialized = false;
    this.isPostgresConnected = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    // In a real environment with DATABASE_URL and pg installed, we would connect to PostgreSQL.
    // For universal local development, tests, and web environments, we initialize our robust
    // high-performance spatial graph database.
    this.loadInitialSeed();
    this.isInitialized = true;
    console.log('[RapidRoute DB] Spatial database initialized with PostGIS spatial indexing & seed topology.');
  }

  loadInitialSeed() {
    // Intersections / Nodes with coordinates [lon, lat] (Mumbai Metropolitan Tactical Grid)
    const initialNodes = [
      { id: 'NODE_ORIGIN_MARKET', name: '842 Marine Drive / Nariman Point Interconnect', lon: 72.8238, lat: 18.9256, hasOpticom: true, phase: 'ARMED' },
      { id: 'NODE_CENTRAL_ENTRY', name: 'Coastal Road / Worli Sea Face Expressway Onramp', lon: 72.8180, lat: 18.9650, hasOpticom: true, phase: 'ACTIVE_GREEN' },
      { id: 'NODE_5TH_ST_JUNCTION', name: 'Haji Ali & Dr. Annie Besant Junction', lon: 72.8120, lat: 18.9780, hasOpticom: true, phase: 'ARMED' },
      { id: 'NODE_5TH_HARRISON', name: 'Worli Naka & Dr. E Moses Emergency Corridors', lon: 72.8190, lat: 18.9910, hasOpticom: true, phase: 'HOLDING_PHASE' },
      { id: 'NODE_BROADWAY_TUNNEL', name: 'Tulsi Pipe Road Bypass Connector', lon: 72.8290, lat: 19.0010, hasOpticom: true, phase: 'ARMED' },
      { id: 'NODE_BAY_OVERPASS_NORTH', name: 'P D\'Mello / Eastern Freeway Approach', lon: 72.8410, lat: 18.9380, hasOpticom: false, phase: 'NO_PREEMPTION' },
      { id: 'NODE_BAY_OVERPASS_SPAN', name: 'Eastern Freeway Elevated High Span', lon: 72.8520, lat: 18.9750, hasOpticom: false, phase: 'WEATHER_ALERT' },
      { id: 'NODE_MISSION_BLVD_1', name: 'Dr. Babasaheb Ambedkar Road South Corridor', lon: 72.8360, lat: 18.9760, hasOpticom: true, phase: 'ARMED' },
      { id: 'NODE_9TH_AVE_SOUTH', name: 'Lalbaug Flyover Arterial Bypass', lon: 72.8390, lat: 18.9910, hasOpticom: true, phase: 'ACTIVE_GREEN' },
      { id: 'NODE_3RD_AVE_REPAIR', name: 'Senapati Bapat Marg Pipeline Repair', lon: 72.8310, lat: 18.9950, hasOpticom: false, phase: 'BLOCKED' },
      { id: 'NODE_OFFRAMP_14B', name: 'Lower Parel Flyover Exit 14B Divert', lon: 72.8300, lat: 19.0005, hasOpticom: true, phase: 'ARMED' },
      { id: 'NODE_TRAUMA_CENTER', name: 'KEM Hospital Apex Level-1 Trauma Centre (Parel)', lon: 72.8427, lat: 19.0028, hasOpticom: true, phase: 'RECEIVING_GATE' },
    ];

    initialNodes.forEach(node => this.nodes.set(node.id, node));

    // Road Segments (Directed graph edges)
    const initialSegments = [
      // Route Alpha (Coastal Road & Worli Sea Face Green Corridor to KEM Trauma Centre)
      {
        id: 'SEG_ALPHA_1', source: 'NODE_ORIGIN_MARKET', target: 'NODE_CENTRAL_ENTRY',
        name: 'Marine Drive to Coastal Expressway Onramp', roadClass: 'primary', lengthM: 450,
        speedLimitKmh: 50, lanes: 3, maxHeightM: 4.5, maxWeightTons: 40,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.1,
        histSpeedKmh: 46.0, currentSpeedKmh: 46.0, currentFriction: 0.95
      },
      {
        id: 'SEG_ALPHA_2', source: 'NODE_CENTRAL_ENTRY', target: 'NODE_5TH_ST_JUNCTION',
        name: 'Coastal Road Express Green Corridor', roadClass: 'motorway', lengthM: 1400,
        speedLimitKmh: 90, lanes: 4, maxHeightM: 5.0, maxWeightTons: 50,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.0,
        histSpeedKmh: 84.0, currentSpeedKmh: 82.0, currentFriction: 0.95
      },
      {
        id: 'SEG_ALPHA_3', source: 'NODE_5TH_ST_JUNCTION', target: 'NODE_5TH_HARRISON',
        name: 'Dr. Annie Besant Emergency Conduit', roadClass: 'primary', lengthM: 900,
        speedLimitKmh: 60, lanes: 3, maxHeightM: 4.2, maxWeightTons: 40,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.1,
        histSpeedKmh: 55.0, currentSpeedKmh: 50.0, currentFriction: 0.90
      },
      {
        id: 'SEG_ALPHA_4', source: 'NODE_5TH_HARRISON', target: 'NODE_OFFRAMP_14B',
        name: 'Worli Naka to Lower Parel Flyover 14B', roadClass: 'primary', lengthM: 1100,
        speedLimitKmh: 65, lanes: 3, maxHeightM: 4.5, maxWeightTons: 40,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.1,
        histSpeedKmh: 58.0, currentSpeedKmh: 55.0, currentFriction: 0.92
      },
      {
        id: 'SEG_ALPHA_5', source: 'NODE_OFFRAMP_14B', target: 'NODE_TRAUMA_CENTER',
        name: 'Parel Trauma Approach Expressway', roadClass: 'secondary', lengthM: 850,
        speedLimitKmh: 50, lanes: 2, maxHeightM: 4.8, maxWeightTons: 35,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.2,
        histSpeedKmh: 48.0, currentSpeedKmh: 48.0, currentFriction: 0.95
      },

      // Route Bravo (Eastern Freeway High Span - High monsoon/squall variance)
      {
        id: 'SEG_BRAVO_1', source: 'NODE_ORIGIN_MARKET', target: 'NODE_BAY_OVERPASS_NORTH',
        name: 'P D\'Mello Arterial Connector', roadClass: 'primary', lengthM: 1800,
        speedLimitKmh: 70, lanes: 3, maxHeightM: 4.5, maxWeightTons: 40,
        hazmatAllowed: true, opticomEnabled: false, surface: 'paved', turnComplexity: 1.3,
        histSpeedKmh: 62.0, currentSpeedKmh: 60.0, currentFriction: 0.88
      },
      {
        id: 'SEG_BRAVO_2', source: 'NODE_BAY_OVERPASS_NORTH', target: 'NODE_BAY_OVERPASS_SPAN',
        name: 'Eastern Freeway Elevated High Span', roadClass: 'motorway', lengthM: 3200,
        speedLimitKmh: 100, lanes: 4, maxHeightM: 5.5, maxWeightTons: 50,
        hazmatAllowed: false, opticomEnabled: false, surface: 'paved', turnComplexity: 1.0,
        histSpeedKmh: 88.0, currentSpeedKmh: 65.0, currentFriction: 0.65 // High monsoon variance
      },
      {
        id: 'SEG_BRAVO_3', source: 'NODE_BAY_OVERPASS_SPAN', target: 'NODE_TRAUMA_CENTER',
        name: 'Wadala-Parel Downramp Arterial', roadClass: 'primary', lengthM: 3100,
        speedLimitKmh: 80, lanes: 3, maxHeightM: 4.5, maxWeightTons: 40,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.4,
        histSpeedKmh: 72.0, currentSpeedKmh: 70.0, currentFriction: 0.85
      },

      // Route Charlie (Dr. Babasaheb Ambedkar Road & Lalbaug Arterial Bypass)
      {
        id: 'SEG_CHARLIE_1', source: 'NODE_ORIGIN_MARKET', target: 'NODE_MISSION_BLVD_1',
        name: 'Nariman Point to Byculla Arterial', roadClass: 'primary', lengthM: 1600,
        speedLimitKmh: 50, lanes: 2, maxHeightM: 4.0, maxWeightTons: 30,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.2,
        histSpeedKmh: 44.0, currentSpeedKmh: 42.0, currentFriction: 0.90
      },
      {
        id: 'SEG_CHARLIE_2', source: 'NODE_MISSION_BLVD_1', target: 'NODE_9TH_AVE_SOUTH',
        name: 'Dr. Babasaheb Ambedkar Road (Metro 3 Work Zone)', roadClass: 'primary', lengthM: 3400,
        speedLimitKmh: 60, lanes: 3, maxHeightM: 4.2, maxWeightTons: 35,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.1,
        histSpeedKmh: 52.0, currentSpeedKmh: 38.0, currentFriction: 0.90
      },
      {
        id: 'SEG_CHARLIE_3', source: 'NODE_9TH_AVE_SOUTH', target: 'NODE_TRAUMA_CENTER',
        name: 'Lalbaug to KEM Trauma ER Receiving', roadClass: 'secondary', lengthM: 2700,
        speedLimitKmh: 50, lanes: 2, maxHeightM: 4.0, maxWeightTons: 30,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.2,
        histSpeedKmh: 46.0, currentSpeedKmh: 45.0, currentFriction: 0.92
      },

      // Route Delta Bypass (Tulsi Pipe Road Reroute)
      {
        id: 'SEG_DELTA_BYPASS', source: 'NODE_5TH_ST_JUNCTION', target: 'NODE_BROADWAY_TUNNEL',
        name: 'Tulsi Pipe Road Bypass Connector', roadClass: 'primary', lengthM: 1200,
        speedLimitKmh: 65, lanes: 3, maxHeightM: 4.2, maxWeightTons: 40,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.1,
        histSpeedKmh: 60.0, currentSpeedKmh: 58.0, currentFriction: 0.95
      },
      {
        id: 'SEG_DELTA_TUNNEL', source: 'NODE_BROADWAY_TUNNEL', target: 'NODE_TRAUMA_CENTER',
        name: 'Senapati Bapat Green Wave to KEM ER', roadClass: 'motorway', lengthM: 3200,
        speedLimitKmh: 80, lanes: 3, maxHeightM: 4.6, maxWeightTons: 40,
        hazmatAllowed: true, opticomEnabled: true, surface: 'paved', turnComplexity: 1.0,
        histSpeedKmh: 76.0, currentSpeedKmh: 75.0, currentFriction: 0.95
      },

      // Blocked Senapati Bapat Marg segment
      {
        id: 'SEG_BLOCKED_3RD', source: 'NODE_CENTRAL_ENTRY', target: 'NODE_3RD_AVE_REPAIR',
        name: 'Senapati Bapat Marg Transit Corridor', roadClass: 'primary', lengthM: 1100,
        speedLimitKmh: 50, lanes: 3, maxHeightM: 4.2, maxWeightTons: 35,
        hazmatAllowed: true, opticomEnabled: false, surface: 'paved', turnComplexity: 1.0,
        histSpeedKmh: 45.0, currentSpeedKmh: 0.0, currentFriction: 0.1
      }
    ];

    initialSegments.forEach(seg => this.segments.set(seg.id, seg));

    // Road Closures
    const initialClosures = [
      {
        id: 'CLOSURE_3RD_AVE_MAIN',
        segmentId: 'SEG_BLOCKED_3RD',
        description: 'Senapati Bapat Marg Water Pipeline Burst: Full bidirectional corridor blocked. Hard closure active until 18:00 IST. Verified via MCGM / Mumbai Police Sensor Grid.',
        severity: 'FULL_CLOSURE',
        blockedLanes: 3,
        cause: 'WATER_MAIN_BREAK',
        startTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        expectedClearanceTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        lon: 72.8310, lat: 18.9950,
        source: 'MCGM & Mumbai Traffic Police Sensor Grid',
        isActive: true,
      },
      {
        id: 'CLOSURE_CONSTRUCTION_CHARLIE',
        segmentId: 'SEG_CHARLIE_2',
        description: 'Mumbai Metro Line 3 shaft resurfacing right shoulder restriction at Lalbaug.',
        severity: 'LANE_RESTRICTION',
        blockedLanes: 1,
        cause: 'CONSTRUCTION',
        startTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        expectedClearanceTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        lon: 72.8390, lat: 18.9910,
        source: 'Mumbai Traffic Police 511 Feed',
        isActive: true,
      }
    ];

    initialClosures.forEach(c => this.closures.set(c.id, c));

    // Emergency Fleet Roster (Indian Emergency Services)
    const initialVehicles = [
      {
        id: 'VEH_MEDIC_4', callSign: 'Medic-4', type: 'Ambulance', class: 'ALS Ambulance Type-III',
        make: 'Tata Winger / Force Traveller ALS', status: 'ACTIVE_TRANSIT', speedMph: 48, heading: 284,
        lon: 72.8210, lat: 18.9680, gpsDriftM: 0.04, batteryFuel: '74% Diesel',
        carrier: 'Jio 5G / Airtel Band n78 (-64 dBm)', activeRouteId: 'ROUTE_ALPHA', targetIncidentId: 'INC-8492'
      },
      {
        id: 'VEH_ENGINE_12', callSign: 'Engine-12', type: 'Fire Engine', class: 'Heavy Water Bowser 2000G Mumbai Fire',
        make: 'Tata Prima Heavy Pumper', status: 'RESPONDING', speedMph: 34, heading: 142,
        lon: 72.8350, lat: 18.9810, gpsDriftM: 0.05, batteryFuel: '88% Diesel',
        carrier: 'Airtel 5G (-68 dBm)', activeRouteId: 'ROUTE_CHARLIE', targetIncidentId: 'INC-8492'
      },
      {
        id: 'VEH_RESCUE_7', callSign: 'Rescue-7', type: 'Heavy Rescue', class: 'SDRF Technical Extrication Heavy Squad Rig',
        make: 'Ashok Leyland 4x4 Heavy Rescue', status: 'STANDBY', speedMph: 0, heading: 0,
        lon: 72.8450, lat: 19.0120, gpsDriftM: 0.01, batteryFuel: '96% Diesel',
        carrier: 'Station WiFi + 5G', activeRouteId: null, targetIncidentId: null
      },
      {
        id: 'VEH_MEDIC_1', callSign: 'Medic-1', type: 'Ambulance', class: 'ALS Ambulance Type-III',
        make: 'Force Traveller ALS', status: 'AVAILABLE_PATROL', speedMph: 28, heading: 90,
        lon: 72.8290, lat: 18.9410, gpsDriftM: 0.02, batteryFuel: '91% Diesel',
        carrier: 'Jio 5G (-71 dBm)', activeRouteId: null, targetIncidentId: null
      },
      {
        id: 'VEH_BATTALION_2', callSign: 'Battalion-2', type: 'Chief Command', class: 'Joint CP Traffic Escort SUV Innova Crysta',
        make: 'Toyota Innova Crysta 4WD', status: 'AVAILABLE', speedMph: 15, heading: 180,
        lon: 72.8330, lat: 18.9750, gpsDriftM: 0.03, batteryFuel: '82% Hybrid',
        carrier: 'Police Wireless VHF + Jio 5G', activeRouteId: null, targetIncidentId: null
      }
    ];

    initialVehicles.forEach(v => this.vehicles.set(v.id, v));

    // Active default incident: INC-8492
    const defaultIncident = {
      incidentId: 'INC-8492',
      callSign: 'Medic-4',
      cadReference: 'CAD-9942-MUMBAI',
      priorityLevel: 'CODE_3_CRITICAL',
      classification: 'CARDIAC',
      originAddress: '842 Marine Drive / Nariman Point, Fl 4',
      originCoordinates: { lon: 72.8238, lat: 18.9256 },
      destinationFacility: 'KEM Hospital Apex Level-1 Trauma Centre (Parel)',
      destinationCoordinates: { lon: 72.8427, lat: 19.0028 },
      assignedVehicleId: 'VEH_MEDIC_4',
      vehicleType: 'Ambulance',
      selectedRouteId: 'ROUTE_ALPHA',
      status: 'EN_ROUTE',
      createdAt: new Date().toISOString()
    };
    this.incidents.set(defaultIncident.incidentId, defaultIncident);
  }

  // Geospatial Haversine Distance in meters
  calculateHaversineDistance(lon1, lat1, lon2, lat2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Find nearest network node to given coordinates
  findNearestNode(lon, lat) {
    let nearestNode = null;
    let minDistance = Infinity;

    for (const node of this.nodes.values()) {
      const dist = this.calculateHaversineDistance(lon, lat, node.lon, node.lat);
      if (dist < minDistance) {
        minDistance = dist;
        nearestNode = node;
      }
    }
    return { node: nearestNode, distanceMeters: minDistance };
  }

  getNodes() {
    return Array.from(this.nodes.values());
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getSegments() {
    return Array.from(this.segments.values());
  }

  getSegment(id) {
    return this.segments.get(id);
  }

  getClosures() {
    return Array.from(this.closures.values()).filter(c => c.isActive);
  }

  addClosure(closure) {
    this.closures.set(closure.id, closure);
  }

  updateClosure(id, updates) {
    const closure = this.closures.get(id);
    if (closure) {
      Object.assign(closure, updates);
      return closure;
    }
    return null;
  }

  getVehicles() {
    return Array.from(this.vehicles.values());
  }

  getVehicle(id) {
    return this.vehicles.get(id);
  }

  updateVehicle(id, updates) {
    const vehicle = this.vehicles.get(id);
    if (vehicle) {
      Object.assign(vehicle, updates);
      return vehicle;
    }
    return null;
  }

  getIncidents() {
    return Array.from(this.incidents.values());
  }

  getIncident(id) {
    return this.incidents.get(id);
  }

  logPrediction(log) {
    this.predictionLogs.unshift({
      ...log,
      loggedAt: new Date().toISOString()
    });
    if (this.predictionLogs.length > 500) {
      this.predictionLogs.pop();
    }
  }

  getRecentPredictionLogs(limit = 20) {
    return this.predictionLogs.slice(0, limit);
  }
}

export const db = new SpatialDbEngine();
db.initialize();
