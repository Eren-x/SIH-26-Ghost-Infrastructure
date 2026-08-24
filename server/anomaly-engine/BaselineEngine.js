import { BASELINE_WINDOW, MIN_BASELINE_SAMPLES } from '../../shared/constants.js';

export class BaselineEngine {
  constructor(windowSize = BASELINE_WINDOW) {
    this.windowSize = windowSize;
  }

  computeBaseline(buffer, currentIndex) {
    const sensors = ['vibration', 'acoustic', 'temperature', 'humidity'];
    const startIndex = Math.max(0, currentIndex - this.windowSize);
    const samples = buffer.slice(startIndex, currentIndex);

    // Not enough history for a statistically meaningful baseline —
    // report neutral values so nothing can trigger yet.
    if (samples.length < MIN_BASELINE_SAMPLES) {
      return {
        means: { vibration: 0, acoustic: 0, temperature: 0, humidity: 0 },
        stddevs: { vibration: 1, acoustic: 1, temperature: 1, humidity: 1 },
        zScores: { vibration: 0, acoustic: 0, temperature: 0, humidity: 0 }
      };
    }

    const currentSample = buffer[currentIndex];
    
    let means = {};
    let stddevs = {};
    let zScores = {};

    sensors.forEach(sensor => {
      const sum = samples.reduce((acc, val) => acc + val[sensor], 0);
      const mean = sum / samples.length;
      
      const sqDiffSum = samples.reduce((acc, val) => acc + Math.pow(val[sensor] - mean, 2), 0);
      const stddev = Math.sqrt(sqDiffSum / samples.length);
      
      means[sensor] = mean;
      stddevs[sensor] = stddev;
      
      if (stddev < 0.0001) {
        zScores[sensor] = 0;
      } else {
        zScores[sensor] = (currentSample[sensor] - mean) / stddev;
      }
    });

    return { means, stddevs, zScores };
  }

  setWindowSize(n) {
    this.windowSize = n;
  }
}
