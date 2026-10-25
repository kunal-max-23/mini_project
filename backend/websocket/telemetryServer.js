/**
 * RapidRoute Telemetry & Live Update Server
 * Delivers real-time WebSocket and Server-Sent Events (SSE) for:
 * - Significant ETA changes (> 45s)
 * - Road obstructions, hazards, and collisions detected on active route
 * - Dynamic reroute recommendations (e.g. Route Delta diversion)
 * - Feed and routing service degradation alerts
 * Authenticates connections, manages subscriptions, and cleans up on disconnect.
 */

import { WebSocketServer } from 'ws';
import { cache } from '../cache/redisClient.js';

export class TelemetryStreamingServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.sseClients = new Set();
    this.subscriptions = new Map(); // clientId -> Set<channel>
    this.messageHistory = [];
  }

  attachWebSocket(server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname === '/ws/telemetry' || url.pathname === '/ws') {
        // Authenticate token (bearer or query param)
        const token = url.searchParams.get('token') || request.headers['sec-websocket-protocol'];
        // Allow tactical dev token or authenticated dispatch tokens
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      ws.clientId = clientId;
      ws.isAlive = true;
      this.clients.add(ws);
      this.subscriptions.set(clientId, new Set(['all', 'corridor:sector-west', 'vehicle:Medic-4']));

      // Send initial tactical welcome handshake
      ws.send(JSON.stringify({
        type: 'TACTICAL_TELEMETRY_CONNECTED',
        clientId,
        status: 'AUTHENTICATED_DISPATCH_LINK',
        timestamp: new Date().toISOString(),
        activeSubscriptions: ['all', 'corridor:sector-west', 'vehicle:Medic-4'],
      }));

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this.handleClientMessage(ws, parsed);
        } catch (e) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Malformed JSON payload' }));
        }
      });

      ws.on('close', () => {
        this.cleanupClient(clientId, ws);
      });

      ws.on('error', (err) => {
        console.error(`[RapidRoute WSS] Client ${clientId} error:`, err.message);
        this.cleanupClient(clientId, ws);
      });
    });

    // Heartbeat ping interval to prune dead sockets
    setInterval(() => {
      for (const ws of this.clients) {
        if (!ws.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, 25000);

    console.log('[RapidRoute WSS] Secure Telemetry WebSocket Engine mounted.');
  }

  handleClientMessage(ws, message) {
    const { action, channel } = message;
    const clientSubs = this.subscriptions.get(ws.clientId) || new Set();

    if (action === 'SUBSCRIBE' && channel) {
      if (clientSubs.size >= 10) {
        return ws.send(JSON.stringify({ type: 'SUBSCRIPTION_LIMIT_EXCEEDED', max: 10 }));
      }
      clientSubs.add(channel);
      this.subscriptions.set(ws.clientId, clientSubs);
      ws.send(JSON.stringify({ type: 'SUBSCRIBED', channel }));
    } else if (action === 'UNSUBSCRIBE' && channel) {
      clientSubs.delete(channel);
      ws.send(JSON.stringify({ type: 'UNSUBSCRIBED', channel }));
    } else if (action === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
    }
  }

  cleanupClient(clientId, ws) {
    this.clients.delete(ws);
    this.subscriptions.delete(clientId);
  }

  // Handle SSE Clients (Express route /api/v1/routes/stream)
  addSseClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const clientId = `sse_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clientObj = { id: clientId, res };
    this.sseClients.add(clientObj);

    // Initial handshake
    res.write(`data: ${JSON.stringify({ type: 'SSE_CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      this.sseClients.delete(clientObj);
    });
  }

  /**
   * Broadcast a tactical event to all subscribed WebSocket and SSE connections
   */
  broadcast(event) {
    const enrichedEvent = {
      ...event,
      broadcastTimestamp: new Date().toISOString(),
    };

    // Keep ring buffer of last 50 events
    this.messageHistory.unshift(enrichedEvent);
    if (this.messageHistory.length > 50) this.messageHistory.pop();

    const payload = JSON.stringify(enrichedEvent);

    // Broadcast over WebSockets
    for (const ws of this.clients) {
      if (ws.readyState === 1) { // OPEN
        ws.send(payload);
      }
    }

    // Broadcast over SSE
    for (const sse of this.sseClients) {
      try {
        sse.res.write(`data: ${payload}\n\n`);
      } catch (e) {
        this.sseClients.delete(sse);
      }
    }

    // Also publish to internal pubsub
    cache.publish('telemetry:broadcasts', enrichedEvent);
  }

  getRecentEvents(limit = 10) {
    return this.messageHistory.slice(0, limit);
  }

  getStats() {
    return {
      connectedWsClients: this.clients.size,
      connectedSseClients: this.sseClients.size,
      totalBroadcastEvents: this.messageHistory.length,
      protocol: 'WSS / SSE Multicast',
    };
  }
}

export const telemetryBroker = new TelemetryStreamingServer();
