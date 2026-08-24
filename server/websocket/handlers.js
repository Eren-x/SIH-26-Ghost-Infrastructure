import { v4 as uuidv4 } from 'uuid';
import { getZones } from '../sensor-engine/anomalyZones.js';

export function registerHandlers(io, sensorEngine, baselineEngine, correlationEngine, riskEngine) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let surveyStartTime = null;
    let riskHistory = []; // track risk levels for survey report

    socket.on('rover:update', (roverState) => {
      // Add survey time
      if (surveyStartTime) {
        roverState.time = (Date.now() - surveyStartTime) / 1000;
      } else {
        roverState.time = 0;
      }

      const sample = sensorEngine.processTick(roverState);
      const buffer = sensorEngine.getBuffer();
      const currentIndex = buffer.length - 1;

      const baseline = baselineEngine.computeBaseline(buffer, currentIndex);
      
      const zones = getZones();
      const correlationResult = correlationEngine.evaluate(baseline.zScores, sample.worldPos, zones);
      
      const { riskScore, severity, confidence } = riskEngine.computeRisk(correlationResult, baseline.zScores);

      // Track risk for report
      riskHistory.push(severity);

      // Emit telemetry — flatten sample fields for the frontend store
      socket.emit('sensor:telemetry', {
        vibration: sample.vibration,
        acoustic: sample.acoustic,
        temperature: sample.temperature,
        humidity: sample.humidity,
        gps: sample.gps,
        worldPos: sample.worldPos,
        speed: sample.speed,
        distance: sample.distance,
        surveyTime: roverState.time,
        baseline: {
          means: baseline.means,
          zScores: baseline.zScores,
        },
        riskScore,
        severity,
        confidence,
      });

      if (correlationResult) {
        const zone = correlationResult.matchedZone;
        const anomalyEvent = {
          id: uuidv4(),
          timestamp: Date.now(),
          type: correlationResult.type,
          label: zone ? zone.label : correlationResult.type.toUpperCase(),
          zoneId: zone ? zone.id : null,
          riskScore,
          severity,
          confidence,
          zScores: correlationResult.zScores,
          // Build contributingSensors array for the frontend alert
          contributingSensors: Object.entries(correlationResult.zScores)
            .filter(([, z]) => Math.abs(z) > 1.0)
            .map(([sensor, zScore]) => ({ sensor, zScore })),
          gps: sample.gps,
          worldPos: sample.worldPos,
          surveyTime: roverState.time,
        };
        socket.emit('anomaly:detected', anomalyEvent);
      }
    });

    socket.on('survey:start', () => {
      sensorEngine.reset();
      correlationEngine.reset();
      riskHistory = [];
      surveyStartTime = Date.now();
      socket.emit('survey:started');
      console.log('Survey started');
    });

    socket.on('survey:complete', () => {
      const buffer = sensorEngine.getBuffer();
      const duration = surveyStartTime ? (Date.now() - surveyStartTime) / 1000 : 0;
      
      // Compute distance from buffer
      let totalDistance = 0;
      for (let i = 1; i < buffer.length; i++) {
        const dx = buffer[i].worldPos.x - buffer[i-1].worldPos.x;
        const dz = buffer[i].worldPos.z - buffer[i-1].worldPos.z;
        totalDistance += Math.sqrt(dx * dx + dz * dz);
      }

      // Count risk levels
      const riskBreakdown = { CALM: 0, WATCH: 0, INSPECT: 0 };
      riskHistory.forEach(s => { if (riskBreakdown[s] !== undefined) riskBreakdown[s]++; });

      // Count anomalies by type
      const detectedZones = correlationEngine.detectedZones;
      const zones = getZones();
      let cavities = 0, leaks = 0;
      detectedZones.forEach(zoneId => {
        const z = zones.find(z => z.id === zoneId);
        if (z?.type === 'cavity') cavities++;
        if (z?.type === 'leak') leaks++;
      });

      socket.emit('survey:completed', {
        samples: buffer.length,
        distance: totalDistance,
        duration,
        anomalies: detectedZones.size,
        cavities,
        leaks,
        riskBreakdown,
      });
      console.log('Survey completed:', { samples: buffer.length, distance: totalDistance, duration });
    });

    socket.on('survey:reset', () => {
      sensorEngine.reset();
      correlationEngine.reset();
      riskHistory = [];
      surveyStartTime = null;
      socket.emit('survey:reset');
      console.log('Survey reset');
    });

    socket.on('config:update', (config = {}) => {
      if (config.baselineWindow) baselineEngine.setWindowSize(config.baselineWindow);
      if (config.detectionThreshold != null) correlationEngine.setThresholdMultiplier(config.detectionThreshold);
      if (config.sensorNoise != null) sensorEngine.setNoiseScale(config.sensorNoise);
      console.log('Config updated:', config);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
