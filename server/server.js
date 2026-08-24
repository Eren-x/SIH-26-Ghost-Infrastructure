import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import { SensorEngine } from './sensor-engine/SensorEngine.js';
import { BaselineEngine } from './anomaly-engine/BaselineEngine.js';
import { CorrelationEngine } from './anomaly-engine/CorrelationEngine.js';
import { RiskEngine } from './anomaly-engine/RiskEngine.js';
import { registerHandlers } from './websocket/handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());

// Serve the built client (production) — same origin as Socket.IO
const distDir = path.join(__dirname, '../client/dist');
app.use(express.static(distDir));

// SPA fallback for client-side routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const sensorEngine = new SensorEngine();
const baselineEngine = new BaselineEngine();
const correlationEngine = new CorrelationEngine();
const riskEngine = new RiskEngine();

registerHandlers(io, sensorEngine, baselineEngine, correlationEngine, riskEngine);

// Hosting platforms (Railway/Render/Fly) inject PORT
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ghost Rover server running on port ${PORT}`);
});
