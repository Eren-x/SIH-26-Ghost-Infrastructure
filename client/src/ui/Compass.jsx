import React, { useRef, useEffect } from 'react';
import useSimStore from '../stores/useSimStore';

const WIDTH = 360;
const HEIGHT = 34;
const PX_PER_DEG = 3;         // ribbon scroll speed
const CARDINALS = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };

export default function Compass() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const draw = () => {
      const headingDeg = ((useSimStore.getState().roverHeading * 180 / Math.PI) % 360 + 360) % 360;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'rgba(18, 24, 32, 0.85)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Ticks + labels — center of ribbon is current heading
      ctx.textAlign = 'center';
      const startDeg = Math.floor((headingDeg - WIDTH / 2 / PX_PER_DEG) / 15) * 15;
      for (let d = startDeg; d <= headingDeg + WIDTH / 2 / PX_PER_DEG + 15; d += 15) {
        const x = WIDTH / 2 + (d - headingDeg) * PX_PER_DEG;
        if (x < -20 || x > WIDTH + 20) continue;
        const norm = ((d % 360) + 360) % 360;
        const major = CARDINALS[norm] !== undefined;

        ctx.strokeStyle = major ? '#9ca3af' : '#374151';
        ctx.lineWidth = major ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, HEIGHT);
        ctx.lineTo(x, HEIGHT - (major ? 10 : 5));
        ctx.stroke();

        if (major) {
          ctx.fillStyle = norm === 0 ? '#ef4444' : '#d1d5db';
          ctx.font = `${norm % 90 === 0 ? 'bold ' : ''}9px monospace`;
          ctx.fillText(CARDINALS[norm], x, HEIGHT - 14);
        }
      }

      // Center marker
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, HEIGHT - 1);
      ctx.lineTo(WIDTH / 2 - 5, HEIGHT + 4);
      ctx.lineTo(WIDTH / 2 + 5, HEIGHT + 4);
      ctx.closePath();
      ctx.fill();

      // Heading readout box
      ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.fillRect(WIDTH / 2 - 26, 0, 52, 13);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1;
      ctx.strokeRect(WIDTH / 2 - 26, 0.5, 52, 13);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${headingDeg.toFixed(0)}°`, WIDTH / 2, 11);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="rounded-md border border-[#1a202c] shadow-lg overflow-hidden"
        style={{ clipPath: 'inset(0 0 6px 0)' }}
      />
    </div>
  );
}
