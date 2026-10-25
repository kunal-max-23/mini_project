/**
 * RapidRoute External Data Normalizer
 * Enforces a strict common schema across heterogeneous real-time sensor providers,
 * evaluates data quality, deduplicates incoming payloads, and detects stale feeds.
 */

import crypto from 'crypto';
import { config } from '../config.js';

export class IngestionNormalizer {
  constructor() {
    this.seenHashes = new Map(); // hash -> timestamp
    this.staleThresholdSeconds = config.routing.staleFeedThresholdSeconds;
  }

  /**
   * Normalizes an incoming provider payload into the RapidRoute Common Event Schema
   */
  normalize(rawEvent, providerName) {
    const receivedTime = new Date().toISOString();
    const observationTime = rawEvent.observationTime || rawEvent.timestamp || receivedTime;

    const obsEpoch = new Date(observationTime).getTime();
    const nowEpoch = Date.now();
    const ageSeconds = Math.max(0, Math.floor((nowEpoch - obsEpoch) / 1000));
    const isStale = ageSeconds > this.staleThresholdSeconds;

    // Content hash for deduplication
    const payloadSignature = JSON.stringify({
      provider: providerName,
      type: rawEvent.type || rawEvent.eventType,
      location: rawEvent.location || rawEvent.segmentId || rawEvent.coordinates,
      severity: rawEvent.severity,
    });
    const hash = crypto.createHash('sha256').update(payloadSignature).digest('hex').substring(0, 16);

    const isDuplicate = this.isDuplicatePayload(hash, nowEpoch);

    // Compute data quality score (0.0 - 1.0)
    let qualityScore = 1.0;
    if (isStale) qualityScore -= 0.40;
    if (rawEvent.isPartialData) qualityScore -= 0.25;
    if (!rawEvent.coordinates && !rawEvent.segmentId) qualityScore -= 0.30;
    qualityScore = Math.max(0.1, Math.min(1.0, qualityScore));

    const ttlSeconds = rawEvent.ttlSeconds || 300; // 5 min default TTL
    const expiresAt = new Date(nowEpoch + (ttlSeconds * 1000)).toISOString();

    return {
      id: rawEvent.id || `evt_${providerName.toLowerCase()}_${hash}`,
      hash,
      source: providerName,
      eventType: rawEvent.eventType || rawEvent.type || 'TELEMETRY_UPDATE',
      observationTime,
      receivedTime,
      expiresAt,
      ageSeconds,
      isStale,
      isDuplicate,
      qualityScore: Math.round(qualityScore * 100) / 100,
      geographicCoverage: rawEvent.coverage || {
        sector: 'Sector West Tactical Grid',
        coordinates: rawEvent.coordinates || null,
        segmentId: rawEvent.segmentId || null,
      },
      severity: rawEvent.severity || 'INFO',
      data: rawEvent.data || rawEvent.payload || rawEvent,
      uncertaintyPenalty: isStale ? 1.8 : (1.0 / qualityScore),
    };
  }

  isDuplicatePayload(hash, nowEpoch) {
    const lastSeen = this.seenHashes.get(hash);
    if (lastSeen && (nowEpoch - lastSeen) < 15000) { // within 15 seconds
      return true;
    }
    this.seenHashes.set(hash, nowEpoch);

    // Evict old hash entries
    if (this.seenHashes.size > 2000) {
      for (const [h, ts] of this.seenHashes.entries()) {
        if (nowEpoch - ts > 60000) {
          this.seenHashes.delete(h);
        }
      }
    }
    return false;
  }
}

export const normalizer = new IngestionNormalizer();
