// ── Sensor defaults ──────────────────────────────────────────────
export const SENSOR_DEFAULTS = {
  vibration: { base: 0.3, unit: 'g', noise: 0.08, label: 'Vibration' },
  acoustic:  { base: 45,  unit: 'dB', noise: 3.0,  label: 'Acoustic' },
  temperature: { base: 28, unit: '°C', noise: 0.5, label: 'Temperature' },
  humidity:  { base: 45,  unit: '%',  noise: 2.0,  label: 'Humidity' },
};

// ── Baseline engine ──────────────────────────────────────────────
export const BASELINE_WINDOW = 12;       // rolling sample window
export const MIN_BASELINE_SAMPLES = 5;   // minimum before scoring

// ── Correlation thresholds ───────────────────────────────────────
export const CORRELATION_RULES = {
  cavity: {
    vibration: { direction: 'above', zThreshold: 2.0 },
    acoustic:  { direction: 'below', zThreshold: 1.5 },
  },
  leak: {
    humidity:    { direction: 'above', zThreshold: 2.0 },
    temperature: { direction: 'below', zThreshold: 1.5 },
  },
};

// ── Risk scoring ─────────────────────────────────────────────────
export const RISK_LEVELS = {
  CALM:    { min: 0,  max: 39, color: '#22c55e', label: 'CALM' },
  WATCH:   { min: 40, max: 69, color: '#eab308', label: 'WATCH' },
  INSPECT: { min: 70, max: 100, color: '#ef4444', label: 'INSPECT' },
};

// ── Anomaly zone types ──────────────────────────────────────────
export const ZONE_TYPES = {
  CAVITY: 'cavity',
  LEAK:   'leak',
};

// ── Default anomaly zones (world‑space x, z) ────────────────────
export const DEFAULT_ANOMALY_ZONES = [
  { id: 'zone-a', type: 'cavity', x: 25,  z: -30, radius: 12, severity: 1.0,  label: 'Large subsurface void' },
  { id: 'zone-b', type: 'leak',   x: -15, z: -60, radius: 10, severity: 1.0,  label: 'Underground pipe leak' },
  { id: 'zone-c', type: 'cavity', x: 40,  z: -80, radius: 8,  severity: 0.85, label: 'Small near-surface cavity' },
  { id: 'zone-d', type: 'leak',   x: -30, z: -45, radius: 9,  severity: 0.7,  label: 'Minor moisture zone' },
];

// ── GPS origin (simulated) ──────────────────────────────────────
export const GPS_ORIGIN = { lat: 12.9716, lng: 77.5946 };   // Bangalore
export const METERS_PER_UNIT = 1;  // 1 Three.js unit ≈ 1 m

// ── Rover physics ────────────────────────────────────────────────
export const ROVER_PHYSICS = {
  maxSpeed: 8,
  acceleration: 2,
  friction: 0.95,
  turnRate: 1.5,
};

// ── Telemetry tick ───────────────────────────────────────────────
export const TELEMETRY_INTERVAL_MS = 100;   // 10 Hz
export const SPARKLINE_LENGTH = 60;         // history kept for UI graphs

// ── Demo‑mode waypoints (world x, z) ────────────────────────────
export const DEMO_WAYPOINTS = [
  { x: 0,   z: 0 },
  { x: 5,   z: -15 },
  { x: 18,  z: -25 },
  { x: 25,  z: -30 },   // → zone-a cavity
  { x: 30,  z: -32 },
  { x: 20,  z: -40 },
  { x: 0,   z: -48 },
  { x: -15, z: -60 },   // → zone-b leak
  { x: -10, z: -65 },
  { x: 10,  z: -72 },
  { x: 30,  z: -78 },
  { x: 40,  z: -80 },   // → zone-c cavity
  { x: 42,  z: -85 },
  { x: 35,  z: -92 },
  { x: 20,  z: -95 },
];
