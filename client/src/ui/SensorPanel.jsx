import React from 'react';
import SensorCard from './SensorCard';

export default function SensorPanel() {
  return (
    <div className="w-[280px] bg-[#0e1116] border-r border-[#151920] p-3 flex flex-col gap-3 overflow-y-auto">
      <div className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1">SENSOR TELEMETRY</div>
      <SensorCard sensorKey="vibration" />
      <SensorCard sensorKey="acoustic" />
      <SensorCard sensorKey="temperature" />
      <SensorCard sensorKey="humidity" />
    </div>
  );
}
