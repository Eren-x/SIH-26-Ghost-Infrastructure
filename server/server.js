import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SensorEngine } from './sensor-engine/SensorEngine.js';
import { BaselineEngine } from './anomaly-engine/BaselineEngine.js';
import { CorrelationEngine } from './anomaly-engine/CorrelationEngine.js';
import { RiskEngine } from './anomaly-engine/RiskEngine.js';
import { registerHandlers } from './websocket/handlers.js';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const sensorEngine = new SensorEngine();
const baselineEngine = new BaselineEngine();
const correlationEngine = new CorrelationEngine();
const riskEngine = new RiskEngine();

registerHandlers(io, sensorEngine, baselineEngine, correlationEngine, riskEngine);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Ghost Rover server running on port ${PORT}`);
});
