-- RapidRoute PostGIS Database Migration 001
-- Enables PostGIS geospatial extension and sets up tactical network tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Road Network Nodes (Intersections, Freeway ramps, Staging areas)
CREATE TABLE IF NOT EXISTS network_nodes (
    node_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    elevation_meters NUMERIC(6, 2) DEFAULT 0.0,
    has_opticom_emitter BOOLEAN DEFAULT FALSE,
    opticom_phase_status VARCHAR(32) DEFAULT 'IDLE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_nodes_geom ON network_nodes USING GIST (geom);

-- 2. Directed Road Segments (Graph Edges)
CREATE TABLE IF NOT EXISTS road_segments (
    segment_id VARCHAR(64) PRIMARY KEY,
    osm_way_id VARCHAR(64),
    source_node_id VARCHAR(64) NOT NULL REFERENCES network_nodes(node_id),
    target_node_id VARCHAR(64) NOT NULL REFERENCES network_nodes(node_id),
    name VARCHAR(255) NOT NULL,
    road_class VARCHAR(32) NOT NULL, -- 'motorway', 'primary', 'secondary', 'residential'
    length_meters NUMERIC(10, 2) NOT NULL,
    speed_limit_kmh INTEGER NOT NULL,
    lanes INTEGER DEFAULT 2,
    is_oneway BOOLEAN DEFAULT FALSE,
    max_height_meters NUMERIC(4, 2) DEFAULT 99.0, -- e.g. 3.5m clearance restriction
    max_weight_tons NUMERIC(5, 2) DEFAULT 99.0,
    hazmat_allowed BOOLEAN DEFAULT TRUE,
    opticom_enabled BOOLEAN DEFAULT FALSE,
    surface_type VARCHAR(32) DEFAULT 'paved', -- 'paved', 'dirt', 'gravel'
    turn_complexity NUMERIC(3, 2) DEFAULT 1.0, -- 1.0 = straight, 1.8 = acute turn
    geom GEOMETRY(LineString, 4326) NOT NULL,
    historical_avg_speed_kmh NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON road_segments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_segments_source ON road_segments(source_node_id);
CREATE INDEX IF NOT EXISTS idx_road_segments_target ON road_segments(target_node_id);
CREATE INDEX IF NOT EXISTS idx_road_segments_road_class ON road_segments(road_class);

-- 3. Turn Restrictions & Prohibited Movements
CREATE TABLE IF NOT EXISTS turn_restrictions (
    restriction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_segment_id VARCHAR(64) NOT NULL REFERENCES road_segments(segment_id),
    via_node_id VARCHAR(64) NOT NULL REFERENCES network_nodes(node_id),
    to_segment_id VARCHAR(64) NOT NULL REFERENCES road_segments(segment_id),
    restriction_type VARCHAR(32) NOT NULL, -- 'no_left_turn', 'no_u_turn', 'emergency_authorized_only'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Active Road Closures & Impediments
CREATE TABLE IF NOT EXISTS road_closures (
    closure_id VARCHAR(64) PRIMARY KEY,
    segment_id VARCHAR(64) REFERENCES road_segments(segment_id),
    description TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL, -- 'FULL_CLOSURE', 'LANE_RESTRICTION', 'HAZARDOUS'
    blocked_lanes INTEGER DEFAULT 0,
    cause VARCHAR(64) NOT NULL, -- 'WATER_MAIN_BREAK', 'COLLISION', 'CONSTRUCTION', 'FLOOD'
    start_time TIMESTAMPTZ NOT NULL,
    expected_clearance_time TIMESTAMPTZ,
    geom GEOMETRY(Geometry, 4326),
    source_feed VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_closures_geom ON road_closures USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_closures_segment ON road_closures(segment_id);

-- 5. Real-time Segment Speeds & Ingested Telemetry
CREATE TABLE IF NOT EXISTS segment_telemetry (
    id BIGSERIAL PRIMARY KEY,
    segment_id VARCHAR(64) NOT NULL REFERENCES road_segments(segment_id),
    speed_kmh NUMERIC(5, 2) NOT NULL,
    congestion_ratio NUMERIC(4, 2) NOT NULL, -- speed / free_flow_speed
    weather_friction NUMERIC(3, 2) DEFAULT 1.0, -- 1.0 dry, 0.65 wet/ice
    observation_time TIMESTAMPTZ NOT NULL,
    data_quality_score NUMERIC(3, 2) DEFAULT 1.0,
    source_provider VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seg_telemetry_seg_time ON segment_telemetry(segment_id, observation_time DESC);

-- 6. Emergency Incidents & CAD Dispatch Records
CREATE TABLE IF NOT EXISTS emergency_incidents (
    incident_id VARCHAR(64) PRIMARY KEY,
    call_sign VARCHAR(64) NOT NULL,
    cad_reference VARCHAR(64) NOT NULL,
    priority_level VARCHAR(32) NOT NULL, -- 'CODE_3_CRITICAL', 'CODE_2_URGENT', 'CODE_1_ROUTINE'
    classification VARCHAR(64) NOT NULL, -- 'CARDIAC', 'STRUCTURE_FIRE', 'COLLISION', 'TRAUMA'
    origin_address VARCHAR(255) NOT NULL,
    origin_geom GEOMETRY(Point, 4326) NOT NULL,
    destination_facility VARCHAR(255) NOT NULL,
    destination_geom GEOMETRY(Point, 4326) NOT NULL,
    assigned_vehicle_id VARCHAR(64) NOT NULL,
    vehicle_type VARCHAR(64) NOT NULL,
    selected_route_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'DISPATCHED', -- 'DISPATCHED', 'EN_ROUTE', 'REROUTED', 'ON_SCENE', 'RESOLVED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Route Execution & Model Prediction Audit Log
CREATE TABLE IF NOT EXISTS route_prediction_logs (
    request_id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) REFERENCES emergency_incidents(incident_id),
    model_version VARCHAR(32) NOT NULL,
    feature_version VARCHAR(32) NOT NULL,
    calculation_duration_ms INTEGER NOT NULL,
    candidate_routes_count INTEGER NOT NULL,
    recommended_route_id VARCHAR(64) NOT NULL,
    recommended_eta_seconds INTEGER NOT NULL,
    uncertainty_spread_seconds INTEGER NOT NULL,
    confidence_score NUMERIC(4, 3) NOT NULL,
    degraded_mode BOOLEAN DEFAULT FALSE,
    degraded_reason TEXT,
    recommendation_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vehicle Live Position Track (RTK Telemetry)
CREATE TABLE IF NOT EXISTS vehicle_locations (
    vehicle_id VARCHAR(64) PRIMARY KEY,
    call_sign VARCHAR(64) NOT NULL,
    current_geom GEOMETRY(Point, 4326) NOT NULL,
    heading_deg NUMERIC(5, 2) NOT NULL,
    speed_mph NUMERIC(5, 2) NOT NULL,
    gps_drift_meters NUMERIC(4, 2) DEFAULT 0.05,
    firstnet_rsrp_dbm INTEGER DEFAULT -67,
    active_route_id VARCHAR(64),
    target_incident_id VARCHAR(64) REFERENCES emergency_incidents(incident_id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
