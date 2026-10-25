/**
 * RapidRoute Directed Road Network Graph
 * Represents nodes (intersections), directed edges (segments), turn restrictions,
 * and emergency vehicle access constraints (height clearance, hazmat, paved corridors).
 */

import { db } from '../db/database.js';

export class RoadNetworkGraph {
  constructor() {
    this.adjacency = new Map(); // nodeId -> Map<targetNodeId, edge>
    this.turnRestrictions = new Set(); // key: "fromSegmentId:toSegmentId"
    this.buildGraph();
  }

  buildGraph() {
    this.adjacency.clear();
    const nodes = db.getNodes();
    const segments = db.getSegments();

    for (const node of nodes) {
      this.adjacency.set(node.id, []);
    }

    for (const seg of segments) {
      if (!this.adjacency.has(seg.source)) {
        this.adjacency.set(seg.source, []);
      }
      this.adjacency.get(seg.source).push(seg);
    }
  }

  getOutEdges(nodeId, constraints = {}) {
    const rawEdges = this.adjacency.get(nodeId) || [];
    const activeClosures = db.getClosures();
    const blockedSegmentIds = new Set(
      activeClosures
        .filter(c => c.severity === 'FULL_CLOSURE' && c.isActive)
        .map(c => c.segmentId)
    );

    return rawEdges.filter(edge => {
      // 1. Hard closure check
      if (blockedSegmentIds.has(edge.id)) {
        return false;
      }

      // 2. Low clearance restriction (e.g. 11' 6" = 3.51m)
      if (constraints.lowClearanceRestricted && edge.maxHeightM < 3.51) {
        return false;
      }

      // 3. Paved only restriction
      if (constraints.pavedCorridorsOnly && edge.surface !== 'paved') {
        return false;
      }

      // 4. Hazmat clearance
      if (constraints.hazmatClass9 && !edge.hazmatAllowed) {
        return false;
      }

      return true;
    });
  }

  getNode(nodeId) {
    return db.getNode(nodeId);
  }

  getSegment(segmentId) {
    return db.getSegment(segmentId);
  }
}

export const roadGraph = new RoadNetworkGraph();
