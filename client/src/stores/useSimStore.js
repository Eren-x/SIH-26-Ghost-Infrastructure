import { create } from 'zustand';

const MAX_ROUTE_POINTS = 10000;  // ~14km of travel; keeps memory bounded on long surveys
const MAX_EVENT_LOG = 200;       // EventLog UI only shows a scrolling tail

const useSimStore = create((set) => ({
  // Rover
  roverPosition: { x: 0, y: 0, z: 0 },
  roverHeading: 0,
  roverSpeed: 0,
  roverDistance: 0,
  
  // Survey
  surveyState: 'idle',  // 'idle' | 'active' | 'complete'
  surveyTime: 0,
  surveyStats: null,
  
  // Telemetry
  sensorData: {
    vibration: { value: 0, history: [], mean: 0, zScore: 0 },
    acoustic: { value: 0, history: [], mean: 0, zScore: 0 },
    temperature: { value: 0, history: [], mean: 0, zScore: 0 },
    humidity: { value: 0, history: [], mean: 0, zScore: 0 },
  },
  gps: { lat: 12.9716, lng: 77.5946 },
  currentRisk: { riskScore: 0, severity: 'CALM', confidence: 0 },
  
  // Anomalies
  detectedAnomalies: [],
  activeAlert: null,
  
  // Route
  routePoints: [],
  
  // Event log
  eventLog: [],
  
  // Camera
  cameraMode: 'chase',
  
  // Demo
  demoMode: false,
  
  // Config
  config: {
    sensorNoise: 1.0,
    detectionThreshold: 1.0,
    baselineWindow: 12,
    roverMaxSpeed: 8,
    showRoute: true,
    showGPS: true,
    showUnderground: true,
    showGrid: true,
    showBaseline: true,
  },
  showConfig: false,
  
  // Actions
  setRoverState: (state) => set((s) => ({
    roverPosition: { x: state.x, y: state.y, z: state.z },
    roverHeading: state.heading,
    roverSpeed: state.speed,
    roverDistance: state.distance,
  })),
  
  setSurveyTime: (time) => set({ surveyTime: time }),
  
  setSurveyState: (state) => set({ surveyState: state }),
  
  updateTelemetry: (data) => set((s) => {
    const newSensorData = { ...s.sensorData };
    for (const key of ['vibration', 'acoustic', 'temperature', 'humidity']) {
      const history = [...s.sensorData[key].history, data[key]].slice(-60);
      newSensorData[key] = {
        value: data[key],
        history,
        mean: data.baseline?.means?.[key] ?? s.sensorData[key].mean,
        zScore: data.baseline?.zScores?.[key] ?? s.sensorData[key].zScore,
      };
    }
    return {
      sensorData: newSensorData,
      gps: data.gps || s.gps,
      currentRisk: {
        riskScore: data.riskScore ?? s.currentRisk.riskScore,
        severity: data.severity ?? s.currentRisk.severity,
        confidence: data.confidence ?? s.currentRisk.confidence,
      },
    };
  }),
  
  addAnomaly: (anomaly) => set((s) => ({
    detectedAnomalies: [...s.detectedAnomalies, anomaly],
    activeAlert: anomaly,
  })),
  
  dismissAlert: () => set({ activeAlert: null }),
  
  addRoutePoint: (point) => set((s) => {
    const next = [...s.routePoints, point];
    return { routePoints: next.length > MAX_ROUTE_POINTS ? next.slice(-MAX_ROUTE_POINTS) : next };
  }),
  
  addEventLog: (entry) => set((s) => {
    const next = [...s.eventLog, { ...entry, id: Date.now() + Math.random() }];
    return { eventLog: next.length > MAX_EVENT_LOG ? next.slice(-MAX_EVENT_LOG) : next };
  }),
  
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setDemoMode: (on) => set({ demoMode: on }),
  setShowConfig: (show) => set({ showConfig: show }),
  setSurveyStats: (stats) => set({ surveyStats: stats }),
  
  updateConfig: (partial) => set((s) => ({
    config: { ...s.config, ...partial },
  })),
  
  resetSurvey: () => set({
    roverPosition: { x: 0, y: 0, z: 0 },
    roverHeading: 0,
    roverSpeed: 0,
    roverDistance: 0,
    surveyState: 'idle',
    surveyTime: 0,
    surveyStats: null,
    sensorData: {
      vibration: { value: 0, history: [], mean: 0, zScore: 0 },
      acoustic: { value: 0, history: [], mean: 0, zScore: 0 },
      temperature: { value: 0, history: [], mean: 0, zScore: 0 },
      humidity: { value: 0, history: [], mean: 0, zScore: 0 },
    },
    gps: { lat: 12.9716, lng: 77.5946 },
    currentRisk: { riskScore: 0, severity: 'CALM', confidence: 0 },
    detectedAnomalies: [],
    activeAlert: null,
    routePoints: [],
    eventLog: [],
  }),
}));

export default useSimStore;
