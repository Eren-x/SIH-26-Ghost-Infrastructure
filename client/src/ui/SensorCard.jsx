import React, { useRef, useEffect } from 'react';
import useSimStore from '../stores/useSimStore';
import { SENSOR_COLORS, SENSOR_ICONS } from '../utils/constants';
import { SENSOR_DEFAULTS } from '../../../shared/constants.js';

export default function SensorCard({ sensorKey }) {
  const canvasRef = useRef(null);
  const data = useSimStore(s => s.sensorData[sensorKey]);
  const config = useSimStore(s => s.config);
  const color = SENSOR_COLORS[sensorKey];
  const icon = SENSOR_ICONS[sensorKey];
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (data.history.length === 0) return;
    
    const min = Math.min(...data.history);
    const max = Math.max(...data.history);
    const range = max - min || 1;
    const padding = range * 0.1;
    const yMin = min - padding;
    const yMax = max + padding;
    
    const scaleY = (v) => height - ((v - yMin) / (yMax - yMin)) * height;
    const scaleX = (i) => (i / Math.max(1, data.history.length - 1)) * width;
    
    ctx.beginPath();
    ctx.moveTo(scaleX(0), height);
    
    data.history.forEach((val, i) => {
      ctx.lineTo(scaleX(i), scaleY(val));
    });
    
    ctx.lineTo(scaleX(data.history.length - 1), height);
    ctx.fillStyle = `${color}40`; // 25% opacity
    ctx.fill();
    
    ctx.beginPath();
    data.history.forEach((val, i) => {
      if (i === 0) ctx.moveTo(scaleX(i), scaleY(val));
      else ctx.lineTo(scaleX(i), scaleY(val));
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (config.showBaseline && data.mean) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      const meanY = scaleY(data.mean);
      ctx.moveTo(0, meanY);
      ctx.lineTo(width, meanY);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [data.history, data.mean, color, config.showBaseline]);
  
  const absZ = Math.abs(data.zScore);
  let borderClass = 'border-[#151920]';
  if (absZ > 2.5) borderClass = 'border-[#5c3a3a] pulse-red';
  else if (absZ > 1.5) borderClass = 'border-[#55492e] pulse-yellow';

  let zScoreColor = 'text-[#6b8577]';
  if (absZ > 2) zScoreColor = 'text-[#bd7a72]';
  else if (absZ > 1) zScoreColor = 'text-[#a89a6b]';

  return (
    <div className={`bg-[#12161c] rounded-lg p-3 border ${borderClass} transition-colors`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase">
          <span>{icon}</span>
          <span>{sensorKey}</span>
        </div>
        <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 ${zScoreColor}`}>
          {data.zScore > 0 ? '+' : ''}{data.zScore.toFixed(2)}z
        </div>
      </div>
      
      <div className="mb-2">
        <span className="text-2xl font-mono font-medium text-gray-300">{data.value.toFixed(2)}</span>
        <span className="text-sm text-gray-600 ml-1">{SENSOR_DEFAULTS[sensorKey]?.unit ?? ''}</span>
      </div>
      
      <canvas ref={canvasRef} width={240} height={50} className="w-full h-[50px] rounded bg-black/20" />
      
      <div className="mt-1 text-[10px] text-gray-500 font-mono text-right">
        BASE: {data.mean.toFixed(2)}
      </div>
    </div>
  );
}
