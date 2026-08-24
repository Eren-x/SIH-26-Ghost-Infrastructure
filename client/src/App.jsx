import { useEffect } from 'react';
import Scene from './three/Scene';
import Header from './ui/Header';
import SensorPanel from './ui/SensorPanel';
import SurveyMap from './ui/SurveyMap';
import EventLog from './ui/EventLog';
import StatusBar from './ui/StatusBar';
import AnomalyAlert from './ui/AnomalyAlert';
import SurveyReport from './ui/SurveyReport';
import ConfigPanel from './ui/ConfigPanel';
import useSimStore from './stores/useSimStore';
import { socket } from './socket';

export default function App() {
  // Socket event listeners — on mount, subscribe to server events
  useEffect(() => {
    socket.on('sensor:telemetry', (data) => {
      useSimStore.getState().updateTelemetry(data);
    });
    
    socket.on('anomaly:detected', (anomaly) => {
      useSimStore.getState().addAnomaly(anomaly);
      useSimStore.getState().addEventLog({
        surveyTime: anomaly.surveyTime,
        level: 'alert',
        message: `${anomaly.type.toUpperCase()} DETECTED — Risk ${anomaly.riskScore} — ${anomaly.label}`,
      });
    });
    
    socket.on('survey:started', () => {
      useSimStore.getState().setSurveyState('active');
      useSimStore.getState().addEventLog({
        surveyTime: 0,
        level: 'success',
        message: 'SURVEY STARTED — Sensors active',
      });
    });
    
    socket.on('survey:completed', (stats) => {
      useSimStore.getState().setSurveyState('complete');
      useSimStore.getState().setSurveyStats(stats);
      useSimStore.getState().addEventLog({
        surveyTime: stats.duration,
        level: 'success',
        message: `SURVEY COMPLETE — ${stats.anomalies} anomalies detected`,
      });
    });
    
    socket.on('survey:reset', () => {
      useSimStore.getState().resetSurvey();
    });
    
    return () => {
      socket.off('sensor:telemetry');
      socket.off('anomaly:detected');
      socket.off('survey:started');
      socket.off('survey:completed');
      socket.off('survey:reset');
    };
  }, []);
  
  const surveyState = useSimStore(s => s.surveyState);
  const showConfig = useSimStore(s => s.showConfig);
  
  return (
    <div className="w-screen h-screen flex flex-col bg-[#0a0e14] text-gray-200 font-sans overflow-hidden">
      <Header />
      <div className="flex-1 flex min-h-0">
        <SensorPanel />
        <div className="flex-1 relative">
          <Scene />
          <AnomalyAlert />
          {surveyState === 'complete' && <SurveyReport />}
        </div>
        <SurveyMap />
      </div>
      <div className="flex border-t border-[#1a202c]">
        <EventLog />
        <StatusBar />
      </div>
      {showConfig && <ConfigPanel />}
    </div>
  );
}
