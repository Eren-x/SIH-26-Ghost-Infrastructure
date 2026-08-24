import React, { useState } from 'react';
import useSimStore from '../stores/useSimStore';

const MAX_GAUGE_SPEED = 15;   // dial ceiling (m/s)
const STEER_VIS_DEG = 35;     // steering glyph deflection at full lock

function BatteryGauge({ battery }) {
  const color = battery > 40 ? '#22c55e' : battery > 20 ? '#eab308' : '#ef4444';
  const pulsing = battery <= 20 ? 'animate-pulse' : '';
  return (
    <div className={`flex flex-col gap-1 w-28 ${pulsing}`}>
      <div className="flex justify-between text-[9px] font-mono uppercase text-gray-500">
        <span>Battery</span>
        <span style={{ color }}>{battery.toFixed(0)}%</span>
      </div>
      {/* battery body with nub */}
      <div className="flex items-center">
        <div className="flex-1 h-2.5 border border-gray-600 rounded-sm p-[1px] bg-black/40">
          <div
            className="h-full rounded-[1px] transition-all duration-500"
            style={{ width: `${battery}%`, backgroundColor: color }}
          />
        </div>
        <div className="w-0.5 h-1.5 bg-gray-600 rounded-r-sm ml-[1px]" />
      </div>
    </div>
  );
}

export default function DriverHUD() {
  const [collapsed, setCollapsed] = useState(false);
  const speed = useSimStore(s => s.roverSpeed);
  const throttle = useSimStore(s => s.inputThrottle);
  const steer = useSimStore(s => s.inputSteer);
  const battery = useSimStore(s => s.battery);

  const absSpeed = Math.abs(speed);
  const gear = speed > 0.05 ? 'F' : speed < -0.05 ? 'R' : 'N';
  const braking = throttle < 0 && speed > 0.1;
  const reversing = throttle < 0 && !braking;

  // Speed dial geometry (180° arc, needle from -90° to +90°)
  const speedFrac = Math.min(absSpeed / MAX_GAUGE_SPEED, 1);
  const needleDeg = -90 + speedFrac * 180;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none">
      <div className="bg-[#121820]/90 backdrop-blur border border-[#1a202c] rounded-xl shadow-2xl px-5 py-3 flex items-end gap-6">

        {collapsed ? (
          /* ── Compact: speed + gear only ── */
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="text-3xl font-mono font-bold text-white leading-none">{absSpeed.toFixed(1)}</div>
            <div className={`text-xs font-mono font-bold px-1.5 py-1 rounded border ${
              gear === 'R' ? 'border-amber-500 text-amber-400' :
              gear === 'F' ? 'border-green-500 text-green-400' : 'border-gray-600 text-gray-400'
            }`}>{gear}</div>
            <button onClick={() => setCollapsed(false)}
              className="text-gray-500 hover:text-white text-xs border border-[#1a202c] rounded px-1.5 py-0.5">▲</button>
          </div>
        ) : (
          <>
            {/* ── Speed dial ── */}
            <div className="relative w-[110px] h-[62px] overflow-hidden">
              <svg viewBox="0 0 110 62" className="w-full h-full">
                {/* arc track */}
                <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke="#1a202c" strokeWidth="6" strokeLinecap="round" />
                {/* arc fill */}
                <path
                  d="M 10 55 A 45 45 0 0 1 100 55"
                  fill="none"
                  stroke={speedFrac > 0.85 ? '#ef4444' : '#22d3ee'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="141"
                  strokeDashoffset={141 * (1 - speedFrac)}
                />
                {/* ticks */}
                {[0, .25, .5, .75, 1].map(t => {
                  const a = Math.PI * t;
                  const x1 = 55 + 36 * -Math.cos(a);
                  const y1 = 55 - 36 * Math.sin(a);
                  const x2 = 55 + 41 * -Math.cos(a);
                  const y2 = 55 - 41 * Math.sin(a);
                  return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="1.5" />;
                })}
                {/* needle */}
                <line
                  x1="55" y1="55"
                  x2={55 + 34 * -Math.cos((needleDeg + 90) * Math.PI / 180)}
                  y2={55 - 34 * Math.sin((needleDeg + 90) * Math.PI / 180)}
                  stroke="#e5e7eb" strokeWidth="2.5" strokeLinecap="round"
                />
                <circle cx="55" cy="55" r="4" fill="#e5e7eb" />
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center leading-none">
                <span className="text-lg font-mono font-bold text-white">{absSpeed.toFixed(1)}</span>
                <span className="text-[8px] text-gray-500 ml-0.5 font-mono">m/s</span>
              </div>
            </div>

            {/* ── Gear + bars ── */}
            <div className="flex items-end gap-4 pb-0.5">
              <div className="flex flex-col items-center gap-1">
                <div className={`text-sm font-mono font-bold w-8 h-8 flex items-center justify-center rounded border ${
                  gear === 'R' ? 'bg-amber-900/40 border-amber-500 text-amber-400' :
                  gear === 'F' ? 'bg-green-900/40 border-green-500 text-green-400' :
                  'bg-black/30 border-gray-600 text-gray-500'
                }`}>{gear}</div>
                <span className="text-[8px] font-mono uppercase text-gray-500 tracking-wider">gear</span>
              </div>

              <div className="flex flex-col gap-1.5 w-20">
                <div>
                  <div className="text-[8px] font-mono uppercase text-gray-500 mb-0.5">
                    {braking ? <span className="text-red-400">brake</span> : reversing ? <span className="text-amber-400">reverse</span> : 'throttle'}
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-[#1a202c]">
                    <div
                      className={`h-full transition-all duration-100 ${
                        braking ? 'bg-red-500' : reversing ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.abs(throttle) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Steering indicator */}
                <div>
                  <div className="text-[8px] font-mono uppercase text-gray-500 mb-0.5">steer</div>
                  <div className="relative h-4 bg-black/40 rounded border border-[#1a202c] overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-700" />
                    {/* center tick marks */}
                    <div className="absolute inset-x-2 top-1/2 h-px bg-gray-800" />
                    {/* moving indicator */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-3 rounded-sm bg-cyan-400 transition-transform duration-75"
                      style={{ left: `${50 + steer * 42}%` }}
                    />
                  </div>
                </div>
              </div>

              <BatteryGauge battery={battery} />
            </div>

            <button onClick={() => setCollapsed(true)}
              className="pointer-events-auto self-start text-gray-500 hover:text-white text-xs border border-[#1a202c] rounded px-1.5 py-0.5">▼</button>
          </>
        )}
      </div>
    </div>
  );
}
