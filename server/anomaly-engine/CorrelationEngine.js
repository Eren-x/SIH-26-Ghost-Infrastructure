import { CORRELATION_RULES } from '../../shared/constants.js';

export class CorrelationEngine {
  constructor() {
    this.detectedZones = new Set();
    this.rules = CORRELATION_RULES;
    this.thresholdMultiplier = 1.0;   // scales all z-score thresholds (detection sensitivity)
  }

  evaluate(zScores, worldPos, zones) {
    let type = null;
    const m = this.thresholdMultiplier;

    if (zScores.vibration > this.rules.cavity.vibration.zThreshold * m && 
        zScores.acoustic < -this.rules.cavity.acoustic.zThreshold * m) {
      type = 'cavity';
    } else if (zScores.humidity > this.rules.leak.humidity.zThreshold * m && 
               zScores.temperature < -this.rules.leak.temperature.zThreshold * m) {
      type = 'leak';
    }

    if (!type) return null;

    let nearestZone = null;
    let minDistance = Infinity;

    zones.forEach(zone => {
      if (zone.type === type) {
        const dx = worldPos.x - zone.x;
        const dz = worldPos.z - zone.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < minDistance) {
          minDistance = distance;
          nearestZone = zone;
        }
      }
    });

    if (nearestZone) {
      if (this.detectedZones.has(nearestZone.id)) {
        return null;
      }
      this.detectedZones.add(nearestZone.id);
      return { type, matchedZone: nearestZone, zScores };
    }

    return null;
  }

  reset() {
    this.detectedZones.clear();
  }

  setThresholdMultiplier(multiplier) {
    if (typeof multiplier === 'number' && multiplier > 0) this.thresholdMultiplier = multiplier;
  }

  updateThresholds(newRules) {
    this.rules = newRules;
  }
}
