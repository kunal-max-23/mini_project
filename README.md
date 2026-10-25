# RapidRoute — Emergency Vehicle Route Planning & ML Platform

RapidRoute is a production-ready emergency vehicle routing and machine learning system engineered for tactical command centers, 911 emergency response dispatchers, and connected emergency vehicle HUD terminals.

The platform predicts road-segment travel times using historical traffic baselines, real-time DOT congestion feeds, NOAA weather radar grids, municipal construction permits, and active lane closures. It computes multiple candidate routes and recommends corridors that optimize both raw speed and variance reliability.

---

## 1. System Architecture

```
                          ┌────────────────────────────────────────────────────────┐
                          │               INGESTION LAYER (ADAPTERS)               │
                          │  • DOT GIS Speeds         • NOAA Doppler Radar         │
                          │  • Municipal Sensor Grid  • Police CAD Incidents       │
                          │  • FirstNet RTK GNSS      • City Construction Permits  │
                          └───────────────────────────┬────────────────────────────┘
                                                      │ Normalized Common Schema
                                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             RAPIDROUTE CORE ENGINE (NODE.JS)                     │
│                                                                                  │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌───────────────────┐  │
│  │   PostGIS Spatial DB   │  │   Redis 7.2 Cache & Bus │  │  ML GBDT Forecast │  │
│  │  • network_nodes       │  │  • Route Cache (TTL 30s)│  │  • Conformal Bounds│  │
│  │  • road_segments       │  │  • Rate Limiting Windows│  │  • Drift Monitor   │  │
│  │  • road_closures       │  │  • Pub/Sub Event Broker │  │  • Baselines Comp  │  │
│  └───────────┬────────────┘  └────────────┬────────────┘  └─────────┬─────────┘  │
│              │                            │                         │            │
│              └────────────────────────────┼─────────────────────────┘            │
│                                           ▼                                      │
│                      ┌────────────────────────────────────────┐                  │
│                      │      DIRECTED GRAPH ROUTER (YEN'S K)   │                  │
│                      │  • Dynamic ML Edge Cost Evaluation     │                  │
│                      │  • Turn Restrictions & Low Clearance   │                  │
│                      │  • Opticom V2X Preemption Credit       │                  │
│                      │  • Explainable AI Synthesis Engine     │                  │
│                      └────────────────────┬───────────────────┘                  │
└───────────────────────────────────────────┼──────────────────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │   REST API (Express v4)   │                 │ WebSocket & SSE Telemetry │
       │  • POST /api/v1/routes    │                 │  • ws://localhost:3000/ws │
       │  • POST /routes/confirm   │                 │  • GET /routes/stream     │
       │  • GET  /telemetry/health │                 │  • Instant Detour Push    │
       └───────────────────────────┘                 └───────────────────────────┘
```

### Key Architectural Tenets
1. **Explainable AI Routing**: The model never returns a "black box" path. Every recommendation is accompanied by predicted duration, 90% confidence spread variance ($\pm$ minutes), active green preemption count, impediments, and a human-readable synthesis.
2. **Resilience & Degraded Operation**: Missing data is **never** treated as clear road. When external sensors fail or feeds become stale ($> 180s$), the engine automatically switches to a documented degraded mode with conservative historical costs, prominent UI warnings, and safety notices.
3. **Safety Disclaimer Gate**: Emergency routing is strictly advisory; field operators maintain operational command authority. The system never claims a route is 100% safe or guarantees arrival time.
4. **Dispatcher Confirmation Gate**: In-flight rerouting (e.g., dynamic detour via Route Delta) requires explicit operator confirmation before transmitting updates to vehicle MDT units.

---

## 2. Tech Stack & Environment

- **Runtime**: Node.js 22 LTS (pure JavaScript ES Modules, zero TypeScript in backend runtime).
- **Framework**: Express modular application with tactical security headers, CORS, sliding-window rate limiting, and structured audit logs.
- **Geospatial Database**: PostgreSQL 16 with PostGIS 3.4 for spatial indexing (`GIST`), line geometries, and spatial nearest-neighbor resolution. Includes a high-performance in-memory fallback engine for zero-dependency standalone execution.
- **Cache & Bus**: Redis 7.2 with sliding-window rate limiting, key/value caching with TTL, and pub/sub channels. Includes resilient in-memory fallback.
- **Machine Learning**: Node.js gradient-boosted decision tree ensemble with conformal uncertainty estimation ($p_{10}$, $p_{50}$, $p_{90}$ intervals), comparative baselines (free-flow and historical diurnal profile), and drift monitoring.
- **Real-Time Streaming**: Native WebSockets (`ws`) and Server-Sent Events (SSE).

---

## 3. Quick Start & Local Setup

### Option A: Local Node.js Runtime
```bash
# 1. Clone repository & install dependencies
git clone <repo-url>
cd rapidroute
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Run test verification suite
node backend/tests/runner.js

# 4. Run end-to-end dispatch demo
node backend/examples/end_to_end_dispatch.js

# 5. Start unified application (API + Tactical Dispatch Console)
npm run dev
# Access UI at http://localhost:3000
```

### Option B: Docker Compose (Full Stack with PostGIS & Redis)
```bash
# Build and start all services
docker-compose up --build -d

# Check health
curl http://localhost:3000/healthz

# Follow service logs
docker-compose logs -f rapidroute-api
```

---

## 4. API Endpoints & Contracts

RapidRoute provides an OpenAPI 3.1.0 specification located at:
- `backend/docs/openapi.json`
- `backend/docs/openapi.yaml`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/routes` | Request candidate routes with ML ETA & uncertainty | Yes (Bearer) |
| `POST` | `/api/v1/routes/confirm` | Confirm & dispatch chosen route to vehicle HUD | Yes (Bearer) |
| `POST` | `/api/v1/routes/reroute` | Trigger dynamic diversion upon unexpected blockage | Yes (Bearer) |
| `GET` | `/api/v1/routes/stream` | Server-Sent Events stream for real-time corridor updates | Optional |
| `POST` | `/api/v1/conditions` | Ingest external road condition or sensor event | Yes (Bearer) |
| `GET` | `/api/v1/conditions` | Query active closures, impediments, and weather warnings | No |
| `GET` | `/api/v1/telemetry/health` | Microservice & gateway health status matrix | No |
| `GET` | `/api/v1/telemetry/fleet` | Fleet roster, RTK telemetry, and battery/fuel status | No |
| `GET` | `/api/v1/telemetry/ml-evaluation` | Model MAE, RMSE, calibration, and drift benchmarks | No |
| `GET` | `/healthz` | Kubernetes liveness probe | No |
| `GET` | `/readyz` | Kubernetes readiness probe | No |
| `GET` | `/metrics` | Prometheus & JSON operational telemetry | No |

### Example Route Request Payload
```json
{
  "origin": { "lon": -122.4075, "lat": 37.7852, "address": "842 Market St, Fl 4" },
  "destination": { "lon": -122.4060, "lat": 37.7680, "facilityName": "Metro Trauma Center" },
  "vehicleType": "Ambulance",
  "priorityLevel": "CODE_3_CRITICAL",
  "constraints": {
    "lowClearanceRestricted": true,
    "pavedCorridorsOnly": true,
    "opticomPreemptIntersections": true,
    "hazmatClass9": false
  },
  "incidentMetadata": {
    "incidentId": "INC-8492",
    "classification": "CARDIAC"
  }
}
```

---

## 5. Machine Learning Travel-Time Forecasting

### Feature Vector
Each road segment incorporates:
1. `road_class_encoded` (Motorway=1.0, Trunk=1.5, Primary=2.0, Secondary=2.5, Residential=3.5)
2. `free_flow_time_seconds` ($L / v_{\text{limit}}$)
3. `turn_complexity` (1.0 = straight, 1.8 = acute turn)
4. `cyclic_hour_sin` / `cyclic_hour_cos` ($24\text{h}$ period)
5. `is_peak_hour` (morning 07:30–09:30, evening 16:30–18:45)
6. `precipitation_factor` & `visibility_factor`
7. `surface_grip` ($0.2$ ice/slick to $0.95$ dry)
8. `congestion_ratio` (Observed speed vs speed limit)
9. `incident_lane_blockage` (Lanes closed)
10. `vehicle_factor` (Ambulance=1.0, Fire Engine=1.25, Heavy Rescue=1.35)
11. `opticom_preempted` (Reduces signal wait latency by up to 70%)

### Conformal Prediction & Calibration
Rather than returning a single point estimate, RapidRoute outputs conformal prediction intervals:
$$[\hat{y} - q_{0.90} \cdot \sigma, \quad \hat{y} + q_{0.90} \cdot \sigma]$$
- **Target Confidence**: $90.0\%$
- **Empirical Validation Coverage**: $\ge 88.0\%$
- **Average Route Spread**: $\pm 0.9$ minutes

### Evaluation Benchmark Results
Evaluation runs on temporal splits (past 21 days training, 7 days holdout) and spatial holdouts (Sector 4 Waterfront):
- **Free-Flow Baseline MAE**: $42.6\text{s}$
- **Historical Diurnal MAE**: $28.4\text{s}$
- **RapidRoute GBDT MAE**: $14.1\text{s}$ ($50.3\%$ error reduction over historical)
- **ETA Error $\le 2$ minutes**: $94.6\%$ accuracy

---

## 6. Safety & Degraded Operation Manual

### When Degraded Mode Triggers:
1. External traffic sensor gateway times out ($> 5000\text{ms}$).
2. Feed age exceeds $180\text{s}$ (`STALE_FEED_THRESHOLD_SECONDS`).
3. External ML service boundary is unreachable.

### Operational Behavior Under Degraded Mode:
- **Fallback Costs**: Reverts to conservative historical profiles with speed limits discounted by $20\%$.
- **Explicit Labeling**: Every route response includes `"isDegraded": true` and lists specific missing sources.
- **Safety Advisory**: "EMERGENCY ROUTING IS ADVISORY. Field operators maintain absolute tactical authority. Never claim a route is safe or guarantee arrival time."

---

## 7. Security & Compliance
- **RBAC**: Enforces `dispatcher`, `administrator`, and `service_account` role tiers.
- **Audit Logging**: Structured JSON logs record request latency, route selections, and operator overrides while stripping sensitive patient or victim PII.
- **Rate Limiting**: Sliding-window token buckets prevent denial-of-service on mission infrastructure.
