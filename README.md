# Ghost Infrastructure — Scout Rover

**Real-time 3D digital twin simulation of an autonomous infrastructure inspection rover.**

Drive a rover across procedural terrain, collect position-tied sensor data, detect underground anomalies through multi-sensor correlation, and generate a complete survey risk map — all in your browser.

![Stack](https://img.shields.io/badge/React-18-61dafb?logo=react) ![Stack](https://img.shields.io/badge/Three.js-R169-000?logo=threedotjs) ![Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs) ![Stack](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socketdotio) [![CI](https://github.com/Eren-x/SIH-26-Ghost-Infrastructure/actions/workflows/ci.yml/badge.svg)](https://github.com/Eren-x/SIH-26-Ghost-Infrastructure/actions/workflows/ci.yml)

> **🔴 Live demo: [sih-26-ghost-infrastructure-production.up.railway.app](https://sih-26-ghost-infrastructure-production.up.railway.app)**

---

## What This Is

A simulation prototype for the **Ghost Infrastructure Scout Rover** — a 4WD rover equipped with vibration, acoustic, temperature, humidity, and GPS sensors that performs single-pass infrastructure surveys to detect subsurface anomalies like cavities and water leaks.

This is **not** a flat dashboard or animated mockup. It is a working multi-layer web application where:

1. You drive a 3D rover through procedural terrain
2. Sensors generate readings based on the rover's actual position
3. Data flows through a backend processing pipeline via WebSocket
4. A spatial baseline engine computes rolling z-scores
5. Multi-sensor correlation detects anomaly signatures
6. The frontend visualizes detections and reveals underground anomalies in real time

### The Core Concept

The rover performs a **single-pass survey** — no historical data, no repeat passes. Detection relies on a **spatial local baseline**: as the rover moves, it builds a rolling statistical profile of the surrounding route and flags locations where multiple sensors deviate simultaneously in a correlated pattern.

```
Normal terrain     →  All sensors stable
Approaching cavity →  Vibration ↑ sharply, Acoustic ↓ (hollow resonance)
Approaching leak   →  Humidity ↑, Temperature ↓ (evaporative cooling)
Single sensor spike →  Ignored as probable noise
```

---

## Quick Start

```bash
# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run both server and client
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

Requires Node.js ≥ 18.

---

## Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Forward |
| `S` / `↓` | Reverse |
| `A` / `←` | Turn left |
| `D` / `→` | Turn right |
| Mouse wheel | Zoom camera |

### UI Controls

| Button | Action |
|--------|--------|
| **START SCAN** | Begin survey — sensors activate, route tracking starts |
| **COMPLETE SURVEY** | End survey — generates final report with stats and risk map |
| **DEMO** | Auto-pilot mode — rover navigates through all anomaly zones |
| **CAM** | Toggle chase / free orbit camera |
| **RESET** | Clear all data and return to start |
| **⚙** | Open configuration panel |

---

## How It Works

### Architecture

```
3D Rover Simulation (React Three Fiber)
        ↓
  rover:update (position, heading, speed)   @ ~10 Hz
        ↓  WebSocket
Backend Sensor Engine
  → generates readings based on distance to hidden anomaly zones
        ↓
Baseline Engine
  → rolling window of N samples → mean, stddev, z-score per sensor
        ↓
Correlation Engine
  → checks multi-sensor patterns (cavity / leak signatures)
        ↓
Risk Engine
  → 0–100 risk score → CALM / WATCH / INSPECT
        ↓  WebSocket
  sensor:telemetry + anomaly:detected
        ↓
Frontend Visualization
  → driver HUD, compass, sensor cards, risk heatmap minimap,
    route trail, anomaly markers, alerts
```

### Rover Physics

The rover uses a **center-of-mass Ackermann kinematic model** (`client/src/three/roverPhysics.js`, pure Node-testable module):

- Bicycle model referenced to the COM (`lf = lr = 1.0`) with slip-angle-corrected velocity direction
- Ackermann-correct per-wheel steering angles rendered on the front wheels
- Spring-damper suspension over terrain, plus dynamic brake dive / throttle squat / cornering body roll
- Slope gravity along the heading — climbs bleed speed, descents add it
- Soft-slide circle collisions against seeded tree/rock obstacles (`obstacles.js`, shared by renderer + physics so colliders match visuals exactly)

### Anomaly Detection Rules

**Cavity signature** — triggered when:
- Vibration z-score > +2.0 **AND**
- Acoustic z-score < −1.5

**Leak signature** — triggered when:
- Humidity z-score > +2.0 **AND**
- Temperature z-score < −1.5

Each zone fires at most once per survey. Single-sensor deviation is classified as noise.

GPS is metadata only — it never contributes to the risk score.

### Hidden Anomaly Zones

| Zone | Type | World Position (x, z) | Radius |
|------|------|----------------------|--------|
| A | Cavity | (25, −30) | 12 |
| B | Leak | (−15, −60) | 10 |
| C | Cavity | (40, −80) | 8 |
| D | Leak | (−30, −45) | 9 |

Sensor influence follows Gaussian falloff — readings change gradually as the rover approaches.

---

## On-Screen Instruments

- **Driver HUD** — digital speed readout with slim velocity track, F/N/R gear indicator, throttle/brake trace, steering indicator, functional battery gauge
- **Compass ribbon** — scrolling heading tape (canvas-driven, zero React re-renders)
- **Sensor cards** — live value, sparkline history, local mean baseline, z-score with threshold-colored borders
- **Survey map** — 2D minimap with risk-colored route, accumulated **risk heatmap** (WATCH/INSPECT cells), detected anomalies, live GPS
- **Event log & status bar** — timestamped detections plus GPS/speed/distance/time/heading/risk readouts
- **Survey report** — distance, duration, samples, cavity/leak counts, CALM/WATCH/INSPECT breakdown

---

## Project Structure

```
ghost-rover/
├── package.json                 # Root workspace (npm run dev)
├── shared/
│   ├── constants.js             # Sensor defaults, thresholds, zones, waypoints
│   └── types.js                 # JSDoc type definitions
├── server/
│   ├── server.js                # Express + Socket.IO (port 3001)
│   ├── sensor-engine/
│   │   ├── generators.js        # Position-dependent sensor readings
│   │   ├── anomalyZones.js      # Mutable zone definitions
│   │   └── SensorEngine.js      # Rolling telemetry buffer
│   ├── anomaly-engine/
│   │   ├── BaselineEngine.js    # Spatial rolling baseline + z-scores
│   │   ├── CorrelationEngine.js # Multi-sensor correlation rules
│   │   └── RiskEngine.js        # 0–100 risk scoring
│   └── websocket/
│       └── handlers.js          # Event routing + survey lifecycle
├── client/
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx              # Layout + socket event wiring
│       ├── socket.js            # Socket.IO client
│       ├── stores/
│       │   └── useSimStore.js   # Zustand state management
│       ├── three/
│       │   ├── Scene.jsx        # R3F Canvas, lights, fog
│       │   ├── Terrain.jsx      # Procedural terrain + rocks + trees
│       │   ├── roverPhysics.js  # Pure COM-Ackermann physics (Node-testable)
│       │   ├── obstacles.js     # Seeded collision circles (render + physics)
│       │   ├── Rover.jsx        # 3D rover geometry
│       │   ├── RoverController.jsx  # Input handling + demo autopilot
│       │   ├── CameraRig.jsx    # Chase / free camera
│       │   ├── RouteTrail.jsx   # Risk-colored route line
│       │   ├── AnomalyMarkers.jsx   # Surface rings + underground reveals
│       │   └── SurveyGrid.jsx   # Engineering grid overlay
│       └── ui/
│           ├── Header.jsx       # Top bar controls
│           ├── DriverHUD.jsx    # Speed/gear/throttle/steer/battery cluster
│           ├── Compass.jsx      # Scrolling heading tape
│           ├── ControlsHint.jsx # Collapsible keybinding overlay
│           ├── SensorPanel.jsx  # Left sidebar
│           ├── SensorCard.jsx   # Sensor value + sparkline + z-score
│           ├── SurveyMap.jsx    # 2D minimap + risk heatmap
│           ├── EventLog.jsx     # Scrolling event stream
│           ├── StatusBar.jsx    # GPS, speed, distance, time
│           ├── AnomalyAlert.jsx # Detection overlay
│           ├── SurveyReport.jsx # Survey completion report
│           └── ConfigPanel.jsx  # Configuration drawer
└── .github/workflows/ci.yml     # CI: syntax checks + production build
```

---

## Configuration

Open the config panel (⚙) to adjust in real time:

| Setting | Range | Default | Effect |
|---------|-------|---------|--------|
| Sensor Noise | 0.1–3.0 | 1.0 | Scales Gaussian noise amplitude (server-side) |
| Detection Threshold | 0.5–3.0 | 1.0 | Multiplier on all z-score trigger thresholds (server-side) |
| Baseline Window | 5–30 | 12 | Rolling sample window size (server-side) |
| Rover Max Speed | 2–15 | 8 | Maximum forward speed (client-side physics limit) |

Toggle visibility of: route trail, GPS coordinates, underground anomalies, grid, baseline on charts.

---

## Demo Mode

Click **DEMO** to auto-pilot the rover along a predefined route that passes through all anomaly zones:

1. Start in normal terrain
2. Approach Zone A (cavity) → vibration spikes, acoustic drops → detection
3. Continue to Zone B (leak) → humidity rises, temperature drops → detection
4. Pass Zone C (small cavity) → another detection
5. Survey completes → final report with stats and risk breakdown

The demo runs automatically in under a minute — designed for live presentations.

---

## Technology

| Component | Technology |
|-----------|-----------|
| 3D Rendering | Three.js via React Three Fiber + Drei |
| Frontend Framework | React 18 |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Backend | Node.js + Express |
| Real-time Communication | Socket.IO |
| Sensor Processing | Custom spatial baseline engine |
| Rover Physics | Custom COM-Ackermann kinematics module |

---

## Hardware Reference

This simulation models the physical Scout Rover prototype:

- **Dimensions**: ~35cm × 25cm × 22cm
- **Drive**: 4WD with DC geared motors
- **Controller**: ESP32
- **Sensors**: MPU6050 (vibration), MEMS microphone (acoustic), DHT22 (temperature/humidity), GPS NEO-6M
- **Power**: 2S Li-ion battery (7.4V)
- **Communication**: Wi-Fi → Laptop/Cloud

The detection backend is designed so that when the physical rover is built, the same `BaselineEngine → CorrelationEngine → RiskEngine` pipeline consumes real ESP32 telemetry instead of simulated telemetry — no architectural changes needed.

```
SIMULATION:                          FUTURE HARDWARE:
Synthetic Generator                  MPU6050 / DHT22 / MEMS / GPS
        ↓                                    ↓
Backend Sensor Engine    ←──────→    ESP32 via Wi-Fi
        ↓                                    ↓
Same Detection Pipeline             Same Detection Pipeline
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
