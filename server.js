/**
 * RapidRoute Unified Server Entry Point
 * Runs modular Express backend, mounts WebSocket telemetry broker,
 * and attaches Vite development middlewares in dev mode.
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { config } from './backend/config.js';
import { createApp } from './backend/app.js';
import { telemetryBroker } from './backend/websocket/telemetryServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  // Attach WebSocket server for real-time telemetry streaming
  telemetryBroker.attachWebSocket(server);

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Dynamic Vite middleware integration for AI Studio development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[RapidRoute] Vite development middlewares mounted.');
  } else {
    // Production static asset serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[RapidRoute] Serving production build from dist/.');
  }

  server.listen(config.port, config.host, () => {
    console.log(`========================================================`);
    console.log(`  RAPIDROUTE TACTICAL EMERGENCY ROUTING PLATFORM        `);
    console.log(`  API & ML Engine: http://${config.host}:${config.port}`);
    console.log(`  WebSocket Bus:   ws://${config.host}:${config.port}/ws/telemetry`);
    console.log(`  Environment:     ${config.env} | Node.js ${process.version}`);
    console.log(`========================================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[RapidRoute] Initiating graceful tactical shutdown...');
    server.close(() => {
      console.log('[RapidRoute] HTTP and WebSocket listeners closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[RapidRoute FATAL] Failed to start server:', err);
  process.exit(1);
});
