import React, { useState } from 'react';
import useSimStore from '../stores/useSimStore';

const STEEL = '#7d93ab';
const STEEL_DIM = '#3d4a5a';

function BatteryGauge({ battery }) {
  const color = battery > 40 ? '#5f7d64' : battery > 20 ? '#8f8054' : '#a06262';
  return (
    <div className="flex flex-col gap-1 w-24">
      <div className="flex justify-between text-[9px] font-mono uppercase text-gray-600">
        <span>Battery</span>
        <span style={{ color }}>{battery.toFixed(0)}%</span>
      </div>
      <div className="flex items-center">
        <div className="flex-1 h-1.5 border border-[#1c222b] rounded-sm p-[1px] bg-black/40">
          <div
            className="h-full rounded-[1px]"
            style={{
              width: `${battery}%`,
              backgroundColor: color,
              transition: 'width 500ms cubic-bezier(0.22, 1, 0.36, 1), background-color 500ms',
            }}
          />
        </div>
        <div className="w-0.5 h-1 bg-[#262d38] rounded-r-sm ml-[1px]" />
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
  const maxSpeedCfg = useSimStore(s => s.config.roverMaxSpeed);

  const absSpeed = Math.abs(speed);
  const gear = speed > 0.05 ? 'F' : speed < -0.05 ? 'R' : 'N';
  const braking = throttle < 0 && speed > 0.1;
  const reversing = throttle < 0 && !braking;

  const barPct = Math.min(absSpeed / maxSpeedCfg, 1) * 100;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none">
      <div className="bg-[#0e1116]/90 backdrop-blur border border-[#151920] rounded-lg shadow-xl px-5 py-3 flex items-end gap-6">

        {collapsed ? (
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="text-xl font-mono font-medium text-gray-300 leading-none">{absSpeed.toFixed(1)}<span className="text-[10px] text-gray-600 ml-1">m/s</span></div>
            <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
              gear === 'R' ? 'border-[#4a4436] text-[#b3a37e]' :
              gear === 'F' ? 'border-[#33413a] text-[#7da892]' : 'border-[#1c222b] text-gray-600'
            }`}>{gear}</div>
            <button onClick={() => setCollapsed(false)}
              className="fluid-fast text-gray-600 hover:text-gray-400 text-xs border border-[#1c222b] rounded px-1.5 py-0.5">▲</button>
          </div>
        ) : (
          <>
            {/* ── Speed: digits + slim track ── */}
            <div className="flex flex-col gap-1.5 w-40">
              <div className="flex items-baseline gap-2 leading-none">
                <span
                  className="text-3xl font-mono font-medium"
                  style={{ color: '#cdd6e0', transition: 'color 350ms cubic-bezier(0.22,1,0.36,1)' }}
                >{absSpeed.toFixed(1)}</span>
                <span className="text-[10px] text-gray-600 font-mono">m/s</span>
                <span className={`ml-auto text-xs font-mono px-1.5 py-0.5 rounded-sm border ${
                  gear === 'R' ? 'bg-[#171512] border-[#4a4436] text-[#b3a37e]' :
                  gear === 'F' ? 'bg-[#12171a] border-[#33413a] text-[#7da892]' :
                  'bg-black/30 border-[#1c222b] text-gray-600'
                }`}>{gear}</span>
              </div>

              {/* velocity track */}
              <div className="relative h-1 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-full"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: absSpeed > maxSpeedCfg * 0.85 ? '#8f6a62' : STEEL_DIM,
                    transition: 'width 250ms cubic-bezier(0.22, 1, 0.36, 1), background-color 350ms',
                  }}
                />
                {/* max-speed tick */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-[#262d38]" />
              </div>

              {/* throttle / brake trace */}
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-mono uppercase tracking-wider w-10 ${
                  braking ? 'text-[#a06262]' : reversing ? 'text-[#b3a37e]' : 'text-gray-600'
                }`}>
                  {braking ? 'brake' : reversing ? 'reverse' : 'throttle'}
                </span>
                <div className="flex-1 h-[3px] bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.abs(throttle) * 100}%`,
                      backgroundColor: braking ? '#8f5f5f' : reversing ? '#94875f' : STEEL,
                      transition: 'width 200ms cubic-bezier(0.22, 1, 0.36, 1), background-color 300ms',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Steering indicator ── */}
            <div className="flex flex-col gap-1 w-24 pb-0.5">
              <div className="text-[8px] font-mono uppercase tracking-wider text-gray-600">steer</div>
              <div className="relative h-1 bg-black/50 rounded-full overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#262d38]" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2.5 rounded-sm"
                  style={{
                    left: `${50 + steer * 42}%`,
                    backgroundColor: STEEL,
                    transition: 'left 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              </div>
            </div>

            <BatteryGauge battery={battery} />

            <button onClick={() => setCollapsed(true)}
              className="pointer-events-auto self-start text-gray-600 hover:text-gray-400 text-xs border border-[#1c222b] rounded px-1.5 py-0.5 fluid-fast">▼</button>
          </>
        )}
      </div>
    </div>
  );
}
