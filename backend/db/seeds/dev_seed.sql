-- RapidRoute Synthetic Development Seed Data
-- Mumbai Metropolitan Tactical Grid dataset (Nariman Point / Coastal Road to KEM Hospital Parel)

-- Clear existing development data
TRUNCATE TABLE turn_restrictions CASCADE;
TRUNCATE TABLE road_closures CASCADE;
TRUNCATE TABLE segment_telemetry CASCADE;
TRUNCATE TABLE route_prediction_logs CASCADE;
TRUNCATE TABLE vehicle_locations CASCADE;
TRUNCATE TABLE emergency_incidents CASCADE;
TRUNCATE TABLE road_segments CASCADE;
TRUNCATE TABLE network_nodes CASCADE;

-- Insert Intersections / Nodes (Coordinates based on Mumbai Metropolitan Tactical Grid, EPSG:4326)
INSERT INTO network_nodes (node_id, name, geom, has_opticom_emitter, opticom_phase_status) VALUES
('NODE_ORIGIN_MARKET', '842 Marine Drive / Nariman Point Interconnect', ST_SetSRID(ST_MakePoint(72.8238, 18.9256), 4326), TRUE, 'ARMED'),
('NODE_CENTRAL_ENTRY', 'Coastal Road / Worli Sea Face Expressway Onramp', ST_SetSRID(ST_MakePoint(72.8180, 18.9650), 4326), TRUE, 'ACTIVE_GREEN'),
('NODE_5TH_ST_JUNCTION', 'Haji Ali & Dr. Annie Besant Junction', ST_SetSRID(ST_MakePoint(72.8120, 18.9780), 4326), TRUE, 'ARMED'),
('NODE_5TH_HARRISON', 'Worli Naka & Dr. E Moses Emergency Corridors', ST_SetSRID(ST_MakePoint(72.8190, 18.9910), 4326), TRUE, 'HOLDING_PHASE'),
('NODE_BROADWAY_TUNNEL', 'Tulsi Pipe Road Bypass Connector', ST_SetSRID(ST_MakePoint(72.8290, 19.0010), 4326), TRUE, 'ARMED'),
('NODE_BAY_OVERPASS_NORTH', 'P D''Mello / Eastern Freeway Approach', ST_SetSRID(ST_MakePoint(72.8410, 18.9380), 4326), FALSE, 'NO_PREEMPTION'),
('NODE_BAY_OVERPASS_SPAN', 'Eastern Freeway Elevated High Span', ST_SetSRID(ST_MakePoint(72.8520, 18.9750), 4326), FALSE, 'WEATHER_ALERT'),
('NODE_MISSION_BLVD_1', 'Dr. Babasaheb Ambedkar Road South Corridor', ST_SetSRID(ST_MakePoint(72.8360, 18.9760), 4326), TRUE, 'ARMED'),
('NODE_9TH_AVE_SOUTH', 'Lalbaug Flyover Arterial Bypass', ST_SetSRID(ST_MakePoint(72.8390, 18.9910), 4326), TRUE, 'ACTIVE_GREEN'),
('NODE_3RD_AVE_REPAIR', 'Senapati Bapat Marg Pipeline Repair', ST_SetSRID(ST_MakePoint(72.8310, 18.9950), 4326), FALSE, 'BLOCKED'),
('NODE_OFFRAMP_14B', 'Lower Parel Flyover Exit 14B Divert', ST_SetSRID(ST_MakePoint(72.8300, 19.0005), 4326), TRUE, 'ARMED'),
('NODE_TRAUMA_CENTER', 'KEM Hospital Apex Level-1 Trauma Centre (Parel)', ST_SetSRID(ST_MakePoint(72.8427, 19.0028), 4326), TRUE, 'RECEIVING_GATE');

-- Insert Directed Road Segments
-- Route Alpha Corridor: Coastal Road & Worli Sea Face Green Corridor to KEM Trauma Centre
INSERT INTO road_segments (segment_id, source_node_id, target_node_id, name, road_class, length_meters, speed_limit_kmh, lanes, max_height_meters, max_weight_tons, hazmat_allowed, opticom_enabled, surface_type, turn_complexity, geom, historical_avg_speed_kmh) VALUES
('SEG_ALPHA_1', 'NODE_ORIGIN_MARKET', 'NODE_CENTRAL_ENTRY', 'Marine Drive to Coastal Expressway Onramp', 'primary', 450.0, 50, 3, 4.5, 40.0, TRUE, TRUE, 'paved', 1.1, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8238, 18.9256), ST_MakePoint(72.8180, 18.9650)), 4326), 46.0),
('SEG_ALPHA_2', 'NODE_CENTRAL_ENTRY', 'NODE_5TH_ST_JUNCTION', 'Coastal Road Express Green Corridor', 'motorway', 1400.0, 90, 4, 5.0, 50.0, TRUE, TRUE, 'paved', 1.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8180, 18.9650), ST_MakePoint(72.8120, 18.9780)), 4326), 84.0),
('SEG_ALPHA_3', 'NODE_5TH_ST_JUNCTION', 'NODE_5TH_HARRISON', 'Dr. Annie Besant Emergency Conduit', 'primary', 900.0, 60, 3, 4.2, 40.0, TRUE, TRUE, 'paved', 1.1, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8120, 18.9780), ST_MakePoint(72.8190, 18.9910)), 4326), 55.0),
('SEG_ALPHA_4', 'NODE_5TH_HARRISON', 'NODE_OFFRAMP_14B', 'Worli Naka to Lower Parel Flyover 14B', 'primary', 1100.0, 65, 3, 4.5, 40.0, TRUE, TRUE, 'paved', 1.1, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8190, 18.9910), ST_MakePoint(72.8300, 19.0005)), 4326), 58.0),
('SEG_ALPHA_5', 'NODE_OFFRAMP_14B', 'NODE_TRAUMA_CENTER', 'Parel Trauma Approach Expressway', 'secondary', 850.0, 50, 2, 4.8, 35.0, TRUE, TRUE, 'paved', 1.2, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8300, 19.0005), ST_MakePoint(72.8427, 19.0028)), 4326), 48.0);

-- Route Bravo Corridor: Eastern Freeway High Span (Fast raw speed, high IMD monsoon squall variance)
INSERT INTO road_segments (segment_id, source_node_id, target_node_id, name, road_class, length_meters, speed_limit_kmh, lanes, max_height_meters, max_weight_tons, hazmat_allowed, opticom_enabled, surface_type, turn_complexity, geom, historical_avg_speed_kmh) VALUES
('SEG_BRAVO_1', 'NODE_ORIGIN_MARKET', 'NODE_BAY_OVERPASS_NORTH', 'P D''Mello Arterial Connector', 'primary', 1800.0, 70, 3, 4.5, 40.0, TRUE, FALSE, 'paved', 1.3, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8238, 18.9256), ST_MakePoint(72.8410, 18.9380)), 4326), 62.0),
('SEG_BRAVO_2', 'NODE_BAY_OVERPASS_NORTH', 'NODE_BAY_OVERPASS_SPAN', 'Eastern Freeway Elevated High Span', 'motorway', 3200.0, 100, 4, 5.5, 50.0, FALSE, FALSE, 'paved', 1.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8410, 18.9380), ST_MakePoint(72.8520, 18.9750)), 4326), 88.0),
('SEG_BRAVO_3', 'NODE_BAY_OVERPASS_SPAN', 'NODE_TRAUMA_CENTER', 'Wadala-Parel Downramp Arterial', 'primary', 3100.0, 80, 3, 4.5, 40.0, TRUE, TRUE, 'paved', 1.4, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8520, 18.9750), ST_MakePoint(72.8427, 19.0028)), 4326), 72.0);

-- Route Charlie Corridor: Dr. Babasaheb Ambedkar Road & Lalbaug Arterial Bypass
INSERT INTO road_segments (segment_id, source_node_id, target_node_id, name, road_class, length_meters, speed_limit_kmh, lanes, max_height_meters, max_weight_tons, hazmat_allowed, opticom_enabled, surface_type, turn_complexity, geom, historical_avg_speed_kmh) VALUES
('SEG_CHARLIE_1', 'NODE_ORIGIN_MARKET', 'NODE_MISSION_BLVD_1', 'Nariman Point to Byculla Arterial', 'primary', 1600.0, 50, 2, 4.0, 30.0, TRUE, TRUE, 'paved', 1.2, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8238, 18.9256), ST_MakePoint(72.8360, 18.9760)), 4326), 44.0),
('SEG_CHARLIE_2', 'NODE_MISSION_BLVD_1', 'NODE_9TH_AVE_SOUTH', 'Dr. Babasaheb Ambedkar Road (Metro 3 Work Zone)', 'primary', 3400.0, 60, 3, 4.2, 35.0, TRUE, TRUE, 'paved', 1.1, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8360, 18.9760), ST_MakePoint(72.8390, 18.9910)), 4326), 52.0),
('SEG_CHARLIE_3', 'NODE_9TH_AVE_SOUTH', 'NODE_TRAUMA_CENTER', 'Lalbaug to KEM Trauma ER Receiving', 'secondary', 2700.0, 50, 2, 4.0, 30.0, TRUE, TRUE, 'paved', 1.2, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8390, 18.9910), ST_MakePoint(72.8427, 19.0028)), 4326), 46.0);

-- Route Delta Divert Segment (Tulsi Pipe Road Bypass when Worli Naka / Senapati Bapat is obstructed)
INSERT INTO road_segments (segment_id, source_node_id, target_node_id, name, road_class, length_meters, speed_limit_kmh, lanes, max_height_meters, max_weight_tons, hazmat_allowed, opticom_enabled, surface_type, turn_complexity, geom, historical_avg_speed_kmh) VALUES
('SEG_DELTA_BYPASS', 'NODE_5TH_ST_JUNCTION', 'NODE_BROADWAY_TUNNEL', 'Tulsi Pipe Road Bypass Connector', 'primary', 1200.0, 65, 3, 4.2, 40.0, TRUE, TRUE, 'paved', 1.1, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8120, 18.9780), ST_MakePoint(72.8290, 19.0010)), 4326), 60.0),
('SEG_DELTA_TUNNEL', 'NODE_BROADWAY_TUNNEL', 'NODE_TRAUMA_CENTER', 'Senapati Bapat Green Wave to KEM ER', 'motorway', 3200.0, 80, 3, 4.6, 40.0, TRUE, TRUE, 'paved', 1.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8290, 19.0010), ST_MakePoint(72.8427, 19.0028)), 4326), 76.0);

-- Blocked Segment (Senapati Bapat Marg Pipeline Repair)
INSERT INTO road_segments (segment_id, source_node_id, target_node_id, name, road_class, length_meters, speed_limit_kmh, lanes, max_height_meters, max_weight_tons, hazmat_allowed, opticom_enabled, surface_type, turn_complexity, geom, historical_avg_speed_kmh) VALUES
('SEG_BLOCKED_3RD', 'NODE_CENTRAL_ENTRY', 'NODE_3RD_AVE_REPAIR', 'Senapati Bapat Marg Transit Corridor', 'primary', 1100.0, 50, 3, 4.2, 35.0, TRUE, FALSE, 'paved', 1.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(72.8180, 18.9650), ST_MakePoint(72.8310, 18.9950)), 4326), 45.0);

-- Insert Active Road Closures
INSERT INTO road_closures (closure_id, segment_id, description, severity, blocked_lanes, cause, start_time, expected_clearance_time, geom, source_feed, is_active) VALUES
('CLOSURE_3RD_AVE_MAIN', 'SEG_BLOCKED_3RD', 'Senapati Bapat Marg Water Pipeline Burst: Full bidirectional corridor blocked. Hard closure active until 18:00 IST.', 'FULL_CLOSURE', 3, 'WATER_MAIN_BREAK', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '4 hours', ST_SetSRID(ST_MakePoint(72.8310, 18.9950), 4326), 'MCGM_SENSOR_GRID', TRUE),
('CLOSURE_CONSTRUCTION_CHARLIE', 'SEG_CHARLIE_2', 'Metro 3 utility tunneling right shoulder restriction at Lalbaug', 'LANE_RESTRICTION', 1, 'CONSTRUCTION', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', ST_SetSRID(ST_MakePoint(72.8380, 18.9850), 4326), 'MTP_TRAFFIC_FEED', TRUE);

-- Insert Live Emergency Fleet Roster (MH Registration, NavIC GNSS)
INSERT INTO vehicle_locations (vehicle_id, call_sign, current_geom, heading_deg, speed_mph, gps_drift_meters, firstnet_rsrp_dbm, active_route_id) VALUES
('VEH_MEDIC_4', 'Medic-4 (MH-01-EMS-4)', ST_SetSRID(ST_MakePoint(72.8190, 18.9800), 4326), 24.0, 52.0, 0.04, -64, 'ROUTE_ALPHA'),
('VEH_ENGINE_12', 'Engine-12 (MH-02-ENG-12)', ST_SetSRID(ST_MakePoint(72.8350, 18.9720), 4326), 142.0, 38.0, 0.05, -68, 'ROUTE_CHARLIE'),
('VEH_RESCUE_7', 'Rescue-7 (MH-01-SDRF-7)', ST_SetSRID(ST_MakePoint(72.8400, 18.9990), 4326), 0.0, 0.0, 0.01, -62, NULL),
('VEH_MEDIC_1', 'Medic-1 (MH-01-EMS-1)', ST_SetSRID(ST_MakePoint(72.8250, 18.9300), 4326), 90.0, 32.0, 0.02, -71, NULL),
('VEH_BATTALION_2', 'Battalion-2 (MH-01-CP-2)', ST_SetSRID(ST_MakePoint(72.8220, 18.9950), 4326), 180.0, 20.0, 0.03, -59, NULL);
