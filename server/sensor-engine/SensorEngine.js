import { generateSensorReadings } from './generators.js';
import { getZones } from './anomalyZones.js';

export class SensorEngine {
  constructor(config = {}) {
    this.config = config;
    this.buffer = [];
    this.maxBufferSize = 200;
    this.noiseScale = 1.0;
  }

  setNoiseScale(scale) {
    if (typeof scale === 'number' && scale > 0) this.noiseScale = scale;
  }

  processTick(roverState) {
    const zones = getZones();
    const readings = generateSensorReadings(roverState, zones, this.noiseScale);
    
    const sample = {
      timestamp: Date.now(),
      surveyTime: roverState.time,
      vibration: readings.vibration,
      acoustic: readings.acoustic,
      temperature: readings.temperature,
      humidity: readings.humidity,
      gps: readings.gps,
      worldPos: { x: roverState.x, y: roverState.y, z: roverState.z },
      speed: roverState.speed,
      distance: roverState.distance,
      heading: roverState.heading
    };

    this.buffer.push(sample);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    return sample;
  }

  getBuffer() {
    return this.buffer;
  }

  reset() {
    this.buffer = [];
  }
}
