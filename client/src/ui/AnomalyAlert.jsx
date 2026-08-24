import React, { useEffect } from 'react';
import useSimStore from '../stores/useSimStore';

export default function AnomalyAlert() {
  const alert = useSimStore(s => s.activeAlert);
  const dismiss = useSimStore(s => s.dismissAlert);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => dismiss(), 6000);
      return () => clearTimeout(timer);
    }
  }, [alert, dismiss]);

  if (!alert) return null;

  const isCavity = alert.type === 'cavity';
  const borderColor = isCavity ? 'border-[#7a4545]' : 'border-[#44598a]';
  const textColor = isCavity ? 'text-[#bd8a85]' : 'text-[#8ba0c9]';
  const typeLabel = isCavity ? 'SUBSURFACE CAVITY' : 'UNDERGROUND LEAK';

  // Build contributing sensors from zScores or contributingSensors
  const sensors = alert.contributingSensors || 
    (alert.zScores 
      ? Object.entries(alert.zScores)
          .filter(([, z]) => Math.abs(z) > 1.0)
          .map(([sensor, zScore]) => ({ sensor, zScore }))
      : []);

  const riskScore = typeof alert.riskScore === 'number' ? alert.riskScore.toFixed(0) : '—';
  const confidence = typeof alert.confidence === 'number' 
    ? (alert.confidence > 1 ? alert.confidence.toFixed(0) : (alert.confidence * 100).toFixed(0))
    : '—';

  return (
    <div className={`absolute top-4 right-4 z-50 bg-[#12161c]/95 backdrop-blur border-2 ${borderColor} rounded-xl p-5 w-80 slide-in shadow-2xl cursor-pointer`} onClick={dismiss}>
      <div className={`text-sm font-bold uppercase mb-1 ${textColor}`}>⚠ ANOMALY DETECTED</div>
      <div className="text-lg font-bold text-white mb-3">{typeLabel}</div>
      
      <div className="flex items-end gap-3 mb-2">
        <div className={`text-4xl font-bold ${textColor}`}>{riskScore}</div>
        <div className={`text-xs px-2 py-0.5 rounded uppercase font-bold mb-1 border ${
          isCavity ? 'bg-red-900/50 text-[#bd8a85] border-[#7a4545]/50' : 'bg-blue-900/50 text-[#8ba0c9] border-[#44598a]/50'
        }`}>{alert.severity || 'INSPECT'}</div>
      </div>
      
      <div className="text-sm text-gray-400 mb-4">Confidence: {confidence}%</div>
      
      <div className="h-px bg-white/10 my-3"></div>
      
      <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Contributing Sensors</div>
      <div className="space-y-1 mb-4">
        {sensors.map((s, i) => (
          <div key={s.sensor || i} className="flex justify-between text-sm">
            <span className="text-gray-300 capitalize">{s.sensor}</span>
            <span className="font-mono text-white">{s.zScore > 0 ? '+' : ''}{typeof s.zScore === 'number' ? s.zScore.toFixed(1) : '?'}σ</span>
          </div>
        ))}
      </div>
      
      {alert.gps && (
        <div className="text-xs font-mono text-gray-500 bg-black/30 p-2 rounded">
          GPS: {alert.gps.lat.toFixed(6)}, {alert.gps.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
