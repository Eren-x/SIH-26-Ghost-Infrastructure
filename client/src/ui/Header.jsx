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
    <div className="h-12 bg-[#0e1116] border-b border-[#151920] flex items-center px-4 justify-between">
      <div>
        <div className="font-bold tracking-wider text-sm uppercase text-gray-300">GHOST INFRASTRUCTURE</div>
        <div className="text-[10px] text-gray-600 uppercase tracking-widest">SCOUT ROVER</div>
      </div>
      
      <div>
        {surveyState === 'idle' && <span className="text-xs bg-[#151a21] px-2 py-1 rounded text-gray-500">IDLE</span>}
        {surveyState === 'active' && <span className="text-xs bg-[#121c17] border border-[#2d4438] px-2 py-1 rounded text-[#7da892] animate-pulse">SCANNING</span>}
        {surveyState === 'complete' && <span className="text-xs bg-[#131922] border border-[#334156] px-2 py-1 rounded text-[#7d93ab]">COMPLETE</span>}
      </div>
      
      <div className="flex gap-2">
        {surveyState === 'idle' ? (
          <button onClick={handleStart} className="px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1c222b] hover:bg-[#151a21] transition text-[#7da892]">START SCAN</button>
        ) : (
          <button onClick={handleComplete} className="px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1c222b] hover:bg-[#151a21] transition text-[#b3a37e]">COMPLETE SURVEY</button>
        )}

        <button onClick={toggleDemo} className={`fluid-fast px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1c222b] transition ${demoMode ? 'bg-[#1a2029] text-gray-300' : 'text-gray-500 hover:bg-[#151a21]'}`}>DEMO</button>
        <button onClick={toggleCamera} className="fluid-fast px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1c222b] text-gray-400 hover:bg-[#151a21] transition">CAM: {cameraMode}</button>
        <button onClick={handleReset} className="fluid-fast px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1c222b] text-gray-400 hover:bg-[#151a21] transition">RESET</button>
        <button onClick={toggleConfig} className="fluid-fast px-3 py-1.5 rounded text-xs font-mono uppercase border border-[#1c222b] text-gray-400 hover:bg-[#151a21] transition">⚙</button>
      </div>
    </div>
  );
}
