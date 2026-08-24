import React, { useRef, useEffect } from 'react';
import useSimStore from '../stores/useSimStore';

const HEAT_CELL = 4;          // world units per heatmap cell
const HEAT_ALPHA_BASE = 0.12;
const HEAT_ALPHA_PER = 0.15;
const HEAT_MAX_WEIGHT = 3;    // weight at which a cell saturates red

export default function SurveyMap() {
  const canvasRef = useRef(null);
  const routePoints = useSimStore(s => s.routePoints);
  const anomalies = useSimStore(s => s.detectedAnomalies);
  const roverPos = useSimStore(s => s.roverPosition);
  const roverHeading = useSimStore(s => s.roverHeading);
  const gps = useSimStore(s => s.gps);
  const surveyState = useSimStore(s => s.surveyState);

  // Risk heatmap: cell key "cx,cz" → accumulated risk weight (1=WATCH, 2=INSPECT)
  const heatRef = useRef(new Map());
  const processedPoints = useRef(0);
  const prevSurveyState = useRef('idle');

  useEffect(() => {
    // Clear heatmap on survey reset/idle
    if (surveyState === 'idle' && prevSurveyState.current !== 'idle') {
      heatRef.current.clear();
      processedPoints.current = 0;
    }
    prevSurveyState.current = surveyState;
  }, [surveyState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, w, h);
    
    // Grid
    ctx.strokeStyle = '#141920';
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

    // ── Accumulate new route points into the heatmap ──
    const heat = heatRef.current;
    // Defensive resync if the capped store array was trimmed
    if (processedPoints.current > routePoints.length) processedPoints.current = routePoints.length;
    for (; processedPoints.current < routePoints.length; processedPoints.current++) {
      const p = routePoints[processedPoints.current];
      const weight = p.risk === 'INSPECT' ? 2 : p.risk === 'WATCH' ? 1 : 0;
      if (weight > 0) {
        const key = `${Math.floor(p.x / HEAT_CELL)},${Math.floor(p.z / HEAT_CELL)}`;
        heat.set(key, Math.min((heat.get(key) || 0) + weight, HEAT_MAX_WEIGHT));
      }
    }

    // ── Draw heatmap cells (under route) ──
    heat.forEach((weight, key) => {
      const [cx, cz] = key.split(',').map(Number);
      const wx = cx * HEAT_CELL;
      const wz = cz * HEAT_CELL;
      const saturated = weight >= HEAT_MAX_WEIGHT;
      ctx.fillStyle = saturated ? '#ef4444' : '#eab308';
      ctx.globalAlpha = Math.min(0.55, HEAT_ALPHA_BASE + HEAT_ALPHA_PER * weight);
      ctx.fillRect(toCanvasX(wx), toCanvasY(wz), HEAT_CELL * scale + 0.5, HEAT_CELL * scale + 0.5);
    });
    ctx.globalAlpha = 1;
    
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
    
    // Rover — canvas rotate() is clockwise-positive, matching heading increase
    ctx.save();
    ctx.translate(toCanvasX(roverPos.x), toCanvasY(roverPos.z));
    ctx.rotate(roverHeading);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = '#c9d4e0';
    ctx.fill();
    ctx.restore();
    
    // GPS Text next to rover
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText(`${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`, toCanvasX(roverPos.x) + 8, toCanvasY(roverPos.z) + 4);
    
  }, [routePoints, anomalies, roverPos, roverHeading, gps, surveyState]);

  return (
    <div className="w-[300px] bg-[#0e1116] border-l border-[#151920] p-3 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-mono uppercase tracking-wider text-gray-500">SURVEY MAP</div>
        <div className="flex items-center gap-2 text-[8px] font-mono uppercase text-gray-600">
          <span className="inline-block w-2 h-2 rounded-sm bg-[#eab308]/60" /> watch
          <span className="inline-block w-2 h-2 rounded-sm bg-[#ef4444]/70" /> inspect
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} width={274} height={274} className="w-full h-full object-contain rounded bg-[#0b0e12]" />
      </div>
      <div className="mt-3">
        <div className="text-xs font-mono text-gray-400">GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</div>
        <div className="text-xs font-mono text-gray-400 mt-1">ANOMALIES: {anomalies.length}</div>
      </div>
    </div>
  );
}
