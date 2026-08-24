import React, { useRef, useEffect } from 'react';
import useSimStore from '../stores/useSimStore';

export default function SurveyMap() {
  const canvasRef = useRef(null);
  const routePoints = useSimStore(s => s.routePoints);
  const anomalies = useSimStore(s => s.detectedAnomalies);
  const roverPos = useSimStore(s => s.roverPosition);
  const roverHeading = useSimStore(s => s.roverHeading);
  const gps = useSimStore(s => s.gps);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, w, h);
    
    // Grid
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1;
    const gridSize = 20;
    const scale = w / 200; // fit 200 units into canvas
    
    for (let x = 0; x < 200; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x * scale, 0); ctx.lineTo(x * scale, h); ctx.stroke();
    }
    for (let y = 0; y < 200; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y * scale); ctx.lineTo(w, y * scale); ctx.stroke();
    }
    
    // Transform coordinates: origin at center
    const toCanvasX = (x) => (x + 100) * scale;
    const toCanvasY = (z) => (z + 100) * scale;
    
    // Route (color-coded by risk)
    if (routePoints.length > 1) {
      for (let i = 1; i < routePoints.length; i++) {
        const p = routePoints[i];
        const prev = routePoints[i - 1];
        let hex = '#22c55e';
        if (p.risk === 'WATCH') hex = '#eab308';
        if (p.risk === 'INSPECT') hex = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(toCanvasX(prev.x), toCanvasY(prev.z));
        ctx.lineTo(toCanvasX(p.x), toCanvasY(p.z));
        ctx.strokeStyle = hex;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // Anomalies
    anomalies.forEach(a => {
      const ax = a.worldPos?.x ?? 0;
      const az = a.worldPos?.z ?? 0;
      ctx.beginPath();
      ctx.arc(toCanvasX(ax), toCanvasY(az), 6, 0, Math.PI * 2);
      ctx.fillStyle = a.type === 'cavity' ? '#ef4444' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.fillText(a.type.toUpperCase(), toCanvasX(ax) + 8, toCanvasY(az) + 3);
    });
    
    // Rover
    ctx.save();
    ctx.translate(toCanvasX(roverPos.x), toCanvasY(roverPos.z));
    ctx.rotate(-roverHeading);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    
    // GPS Text next to rover
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.fillText(`${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`, toCanvasX(roverPos.x) + 8, toCanvasY(roverPos.z) + 4);
    
  }, [routePoints, anomalies, roverPos, roverHeading, gps]);

  return (
    <div className="w-[300px] bg-[#121820] border-l border-[#1a202c] p-3 flex flex-col">
      <div className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">SURVEY MAP</div>
      <div className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} width={274} height={274} className="w-full h-full object-contain rounded bg-[#0f1419]" />
      </div>
      <div className="mt-3">
        <div className="text-xs font-mono text-gray-400">GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</div>
        <div className="text-xs font-mono text-gray-400 mt-1">ANOMALIES: {anomalies.length}</div>
      </div>
    </div>
  );
}
