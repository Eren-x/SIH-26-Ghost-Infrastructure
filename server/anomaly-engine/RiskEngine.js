import { RISK_LEVELS } from '../../shared/constants.js';

export class RiskEngine {
  computeRisk(correlationResult, zScores) {
    let riskScore = 0;
    let confidence = 0;

    const absZ = {
      vibration: Math.abs(zScores.vibration || 0),
      acoustic: Math.abs(zScores.acoustic || 0),
      temperature: Math.abs(zScores.temperature || 0),
      humidity: Math.abs(zScores.humidity || 0),
    };

    const maxAbsZ = Math.max(absZ.vibration, absZ.acoustic, absZ.temperature, absZ.humidity);

    if (!correlationResult) {
      // Background risk from max deviation
      riskScore = Math.min(100, Math.max(0, maxAbsZ * 15));
      confidence = Math.min(50, maxAbsZ * 20);
    } else {
      let sumOfAbsZ = 0;
      if (correlationResult.type === 'cavity') {
        riskScore = (absZ.vibration * 1.5 + absZ.acoustic * 1.2) * 18;
        sumOfAbsZ = absZ.vibration + absZ.acoustic;
      } else if (correlationResult.type === 'leak') {
        riskScore = (absZ.humidity * 1.5 + absZ.temperature * 1.2) * 18;
        sumOfAbsZ = absZ.humidity + absZ.temperature;
      }
      
      riskScore = Math.min(100, Math.max(0, riskScore));
      confidence = Math.min(95, 60 + sumOfAbsZ * 8);
    }

    // Determine severity from RISK_LEVELS thresholds
    let severity = 'CALM';
    if (riskScore >= RISK_LEVELS.INSPECT.min) {
      severity = 'INSPECT';
    } else if (riskScore >= RISK_LEVELS.WATCH.min) {
      severity = 'WATCH';
    } else {
      severity = 'CALM';
    }

    return { riskScore, severity, confidence };
  }
}
