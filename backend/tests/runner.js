/**
 * RapidRoute Tactical Verification Suite
 * Executes unit, integration, and API contract test assertions in pure Node.js.
 */

import { forecaster } from '../ml/forecastingModel.js';
import { modelEvaluator } from '../ml/evaluation.js';
import { roadGraph } from '../graph/roadNetwork.js';
import { routerEngine } from '../graph/router.js';
import { normalizer } from '../ingestion/normalizer.js';
import { db } from '../db/database.js';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, description) {
  if (condition) {
    passed++;
    results.push({ pass: true, description });
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    failed++;
    results.push({ pass: false, description });
    console.error(`  ✗ [FAIL] ${description}`);
  }
}

export async function runAllTests() {
  console.log('\n========================================');
  console.log('   RAPIDROUTE OPERATIONAL TEST SUITE    ');
  console.log('========================================\n');
  const startTime = Date.now();

  // ML Forecasting Tests
  console.log('[SUITE 1: ML Travel-Time Forecasting & Uncertainty]');
  const sampleSegment = db.getSegment('SEG_ALPHA_2');
  const freeFlow = forecaster.predictFreeFlow(sampleSegment);
  assert(freeFlow.timeSeconds > 0, 'Free-flow baseline calculates positive transit time');

  const hist = forecaster.predictHistorical(sampleSegment, 14);
  assert(hist.timeSeconds >= freeFlow.timeSeconds, 'Historical diurnal model predicts non-zero congestion drag');

  const mlPred = forecaster.predictSegment(sampleSegment, {
    vehicleType: 'Ambulance',
    opticomPreemptIntersections: true,
  });
  assert(mlPred.lowerBoundSeconds < mlPred.predictedSeconds, 'Conformal prediction lower bound is below predicted mean');
  assert(mlPred.upperBoundSeconds > mlPred.predictedSeconds, 'Conformal prediction upper bound is above predicted mean');
  assert(mlPred.confidenceScore >= 0.70, 'Nominal confidence score meets operational threshold (>= 0.70)');

  // Model Evaluation & Calibration Tests
  console.log('\n[SUITE 2: Model Evaluation & Holdouts]');
  const evalMetrics = modelEvaluator.evaluateModels();
  assert(evalMetrics.modelMetrics.maeSeconds < evalMetrics.baselines.freeFlowStatic.maeSeconds, 'ML model achieves lower MAE than static free-flow baseline');
  assert(evalMetrics.modelMetrics.etaErrorUnder2MinPercent >= 90.0, 'ETA error within 2 minutes exceeds 90% accuracy target');
  assert(evalMetrics.uncertaintyCalibration.calibrationQuality === 'EXCELLENT_CALIBRATION', 'Conformal uncertainty bounds achieve calibrated 90% empirical coverage');

  // Road Network Graph & Constraints Tests
  console.log('\n[SUITE 3: Road Network Graph & Routing]');
  const nodes = db.getNodes();
  assert(nodes.length >= 10, 'Directed graph loads tactical network nodes');

  const edges = roadGraph.getOutEdges('NODE_ORIGIN_MARKET');
  assert(edges.length > 0, 'Adjacency list provides navigable out-edges from origin');

  // Low clearance exclusion check
  const lowClearanceEdges = roadGraph.getOutEdges('NODE_ORIGIN_MARKET', { lowClearanceRestricted: true });
  assert(lowClearanceEdges.every(e => e.maxHeightM >= 3.51), 'Vehicle height constraint excludes low-clearance tunnels');

  // End-to-End Route Planning API Test
  console.log('\n[SUITE 4: Route Optimization & Degraded Operation]');
  const routePlan = await routerEngine.calculateRoutes({
    origin: { lon: 72.8238, lat: 18.9256 },
    destination: { lon: 72.8427, lat: 19.0028 },
    vehicleType: 'Ambulance',
    constraints: { lowClearanceRestricted: true, pavedCorridorsOnly: true, opticomPreemptIntersections: true },
  });

  assert(routePlan.routes.length === 3, 'Router returns 3 diverse candidate routes (Alpha, Bravo, Charlie)');
  assert(routePlan.recommendedRouteId === 'ROUTE_ALPHA', 'Route Alpha recommended under default speed/reliability trade-off');
  assert(routePlan.aiRoutingSynthesis.narrative.includes('Route Alpha is recommended'), 'AI Routing Synthesis generates human-readable tactical explanation');

  // Ingestion Normalizer & Deduplication Test
  console.log('\n[SUITE 5: Ingestion Normalizer & Degraded Mode]');
  const rawEvt = {
    type: 'TRAFFIC_INCIDENT',
    segmentId: 'SEG_ALPHA_3',
    severity: 'WARNING',
    data: { blockedLanes: 1 },
  };
  const norm1 = normalizer.normalize(rawEvt, 'TEST_FEED');
  const norm2 = normalizer.normalize(rawEvt, 'TEST_FEED');
  assert(norm1.isDuplicate === false, 'First ingestion payload accepted as unique');
  assert(norm2.isDuplicate === true, 'Duplicate payload within deduplication window flagged');

  const durationMs = Date.now() - startTime;
  console.log('\n----------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed} (${durationMs}ms)`);
  console.log('----------------------------------------\n');

  return { passed, failed, total: passed + failed, durationMs, results };
}

// If executed directly via node backend/tests/runner.js
if (process.argv[1]?.endsWith('runner.js')) {
  runAllTests().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
