import React from 'react';
import useSimStore from '../stores/useSimStore';
import { formatTime, formatDistance } from '../utils/format';

export default function StatusBar() {
  const gps = useSimStore(s => s.gps);
  const speed = useSimStore(s => s.roverSpeed);
  const distance = useSimStore(s => s.roverDistance);
  const surveyTime = useSimStore(s => s.surveyTime);
  const heading = useSimStore(s => s.roverHeading);
  const risk = useSimStore(s => s.currentRisk);

  return (
    <div className="w-[500px] bg-[#0e1116] p-3 flex items-center gap-6 overflow-hidden">
      <div className="flex flex-col text-xs font-mono">
        <span className="text-gray-500 uppercase">GPS</span>
        <span className="text-gray-300">{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</span>
      </div>
      <div className="flex flex-col text-xs font-mono">
        <span className="text-gray-500 uppercase">SPD</span>
        <span className="text-gray-300">{speed.toFixed(1)} m/s</span>
      </div>
      <div className="flex flex-col text-xs font-mono">
        <span className="text-gray-500 uppercase">DST</span>
        <span className="text-gray-300">{formatDistance(distance)}</span>
      </div>
      <div className="flex flex-col text-xs font-mono">
        <span className="text-gray-500 uppercase">TIME</span>
        <span className="text-gray-300">{formatTime(surveyTime)}</span>
      </div>
      <div className="flex flex-col text-xs font-mono">
        <span className="text-gray-500 uppercase">HDG</span>
        <span className="text-gray-300">{(heading * (180/Math.PI)).toFixed(0)}°</span>
      </div>
      <div className="flex flex-col text-xs font-mono">
        <span className="text-gray-500 uppercase">RISK</span>
        <div className="flex items-center gap-1 text-gray-300">
          <span className={`w-2 h-2 rounded-full ${risk.severity === 'CALM' ? 'bg-[#5f7d64]' : risk.severity === 'WATCH' ? 'bg-[#94875f]' : 'bg-[#a06262]'}`} />
          {risk.riskScore.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
