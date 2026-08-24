import React from 'react';
import useSimStore from '../stores/useSimStore';
import { socket } from '../socket';

export default function Header() {
  const surveyState = useSimStore(s => s.surveyState);
  const demoMode = useSimStore(s => s.demoMode);
  const cameraMode = useSimStore(s => s.cameraMode);
  
  const handleStart = () => socket.emit('survey:start');
  const handleComplete = () => socket.emit('survey:complete');
  const handleReset = () => {
    socket.emit('survey:reset');
    useSimStore.getState().resetSurvey();
  };
  
  const toggleDemo = () => {
    const newDemo = !demoMode;
    useSimStore.getState().setDemoMode(newDemo);
    if (newDemo && surveyState === 'idle') {
      socket.emit('survey:start');
    }
  };
  
  const toggleCamera = () => {
    useSimStore.getState().setCameraMode(cameraMode === 'chase' ? 'free' : 'chase');
  };
  
  const toggleConfig = () => {
    useSimStore.getState().setShowConfig(!useSimStore.getState().showConfig);
  };
  
  return (
    <div className="h-12 bg-[#121820] border-b border-[#1a202c] flex items-center px-4 justify-between">
      <div>
        <div className="font-bold tracking-wider text-sm uppercase">GHOST INFRASTRUCTURE</div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">SCOUT ROVER</div>
      </div>
      
      <div>
        {surveyState === 'idle' && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">IDLE</span>}
        {surveyState === 'active' && <span className="text-xs bg-green-900/50 border border-green-500 px-2 py-1 rounded text-green-400 animate-pulse">SCANNING</span>}
        {surveyState === 'complete' && <span className="text-xs bg-blue-900/50 border border-blue-500 px-2 py-1 rounded text-blue-400">COMPLETE</span>}
      </div>
      
      <div className="flex gap-2">
        {surveyState === 'idle' ? (
          <button onClick={handleStart} className="px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1a202c] hover:bg-[#1a202c] transition text-green-400">START SCAN</button>
        ) : (
          <button onClick={handleComplete} className="px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1a202c] hover:bg-[#1a202c] transition text-yellow-400">COMPLETE SURVEY</button>
        )}
        
        <button onClick={toggleDemo} className={`px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1a202c] transition ${demoMode ? 'bg-[#1a202c] text-white' : 'hover:bg-[#1a202c]'}`}>DEMO</button>
        <button onClick={toggleCamera} className="px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1a202c] hover:bg-[#1a202c] transition">CAM: {cameraMode}</button>
        <button onClick={handleReset} className="px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1a202c] hover:bg-[#1a202c] transition">RESET</button>
        <button onClick={toggleConfig} className="px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1a202c] hover:bg-[#1a202c] transition">⚙</button>
      </div>
    </div>
  );
}
