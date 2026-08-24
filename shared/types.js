/**
 * @typedef {Object} RoverState
 * @property {number} x        - World X position
 * @property {number} z        - World Z position
 * @property {number} y        - World Y position (terrain height)
 * @property {number} heading  - Rotation in radians
 * @property {number} speed    - Current speed (units/s)
 * @property {number} distance - Total distance travelled
 * @property {number} time     - Survey elapsed time (seconds)
 */

/**
 * @typedef {Object} TelemetrySample
 * @property {number} timestamp    - Server timestamp (ms)
 * @property {number} surveyTime   - Seconds since survey start
 * @property {number} vibration    - Vibration reading (g)
 * @property {number} acoustic     - Acoustic reading (dB)
 * @property {number} temperature  - Temperature reading (°C)
 * @property {number} humidity     - Humidity reading (%)
 * @property {{ lat: number, lng: number }} gps
 * @property {{ x: number, z: number }} worldPos
 * @property {number} speed
 * @property {number} distance
 */

/**
 * @typedef {Object} BaselineResult
 * @property {Object<string, number>} means   - Per-sensor local mean
 * @property {Object<string, number>} stddevs - Per-sensor local stddev
 * @property {Object<string, number>} zScores - Per-sensor z-score
 */

/**
 * @typedef {Object} AnomalyEvent
 * @property {string}  id          - Unique event ID
 * @property {string}  type        - 'cavity' | 'leak'
 * @property {number}  riskScore   - 0–100
 * @property {string}  severity    - 'CALM' | 'WATCH' | 'INSPECT'
 * @property {number}  confidence  - 0–100
 * @property {Object<string, number>} zScores - Contributing z-scores
 * @property {{ lat: number, lng: number }} gps
 * @property {{ x: number, z: number }} worldPos
 * @property {number}  surveyTime  - Detection time
 * @property {string}  zoneId      - Matched zone ID (if any)
 * @property {string}  label       - Human-readable description
 */

/**
 * @typedef {Object} SurveyStats
 * @property {number} distance
 * @property {number} duration
 * @property {number} samples
 * @property {number} anomalies
 * @property {number} cavities
 * @property {number} leaks
 * @property {number} calmPercent
 * @property {number} watchPercent
 * @property {number} inspectPercent
 */

/**
 * @typedef {Object} EventLogEntry
 * @property {number} surveyTime
 * @property {'info'|'warning'|'alert'|'success'} level
 * @property {string} message
 */

export {};
