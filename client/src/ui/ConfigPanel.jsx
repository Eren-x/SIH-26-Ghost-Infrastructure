import React from 'react';
import useSimStore from '../stores/useSimStore';
import { socket } from '../socket';

export default function ConfigPanel() {
  const config = useSimStore(s => s.config);
  const updateConfig = useSimStore(s => s.updateConfig);
  const setShowConfig = useSimStore(s => s.setShowConfig);

  const handleChange = (key, value) => {
    const newConfig = { [key]: value };
    updateConfig(newConfig);
    socket.emit('config:update', newConfig);
  };

  return (
    <div className="absolute right-0 top-12 bottom-0 w-80 bg-[#121820] border-l border-[#1a202c] p-5 z-40 overflow-y-auto slide-in shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Configuration</h3>
        <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-mono uppercase text-gray-500">Sensor Noise</label>
            <span className="text-xs text-white font-mono">{config.sensorNoise.toFixed(1)}</span>
          </div>
          <input type="range" min="0.1" max="3.0" step="0.1" value={config.sensorNoise} onChange={(e) => handleChange('sensorNoise', parseFloat(e.target.value))} className="w-full accent-cyan-500" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-mono uppercase text-gray-500">Detection Threshold</label>
            <span className="text-xs text-white font-mono">{config.detectionThreshold.toFixed(1)}</span>
          </div>
          <input type="range" min="0.5" max="3.0" step="0.1" value={config.detectionThreshold} onChange={(e) => handleChange('detectionThreshold', parseFloat(e.target.value))} className="w-full accent-cyan-500" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-mono uppercase text-gray-500">Baseline Window</label>
            <span className="text-xs text-white font-mono">{config.baselineWindow}</span>
          </div>
          <input type="range" min="5" max="30" step="1" value={config.baselineWindow} onChange={(e) => handleChange('baselineWindow', parseInt(e.target.value))} className="w-full accent-cyan-500" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-mono uppercase text-gray-500">Rover Max Speed</label>
            <span className="text-xs text-white font-mono">{config.roverMaxSpeed}</span>
          </div>
          <input type="range" min="2" max="15" step="1" value={config.roverMaxSpeed} onChange={(e) => handleChange('roverMaxSpeed', parseInt(e.target.value))} className="w-full accent-cyan-500" />
        </div>

        <div className="h-px bg-white/10 my-4"></div>

        <div className="space-y-3">
          {[
            { key: 'showRoute', label: 'Show Route' },
            { key: 'showGPS', label: 'Show GPS' },
            { key: 'showUnderground', label: 'Show Underground Anomalies' },
            { key: 'showGrid', label: 'Show Grid' },
            { key: 'showBaseline', label: 'Show Baseline on Charts' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={config[key]} onChange={(e) => handleChange(key, e.target.checked)} className="accent-cyan-500 w-4 h-4 rounded bg-gray-800 border-gray-600" />
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
