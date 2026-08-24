// ═══════════════════════════════════════════════════════════════════
// Rover physics — COM-based Ackermann kinematics + suspension + lean.
// Pure module (no React/Three deps) so it can be unit-tested in Node.
//
// Conventions (matching Three.js world):
//   heading 0 faces −Z ("north"); x += sin(h), z -= cos(h) moves forward
//   omega > 0 turns right (toward +X / east)
//   pitch > 0 = nose down; roll > 0 = right side (+X) up
// ═══════════════════════════════════════════════════════════════════

export const PHYSICS = {
  // Geometry (matches Rover.jsx visual layout)
  WHEELBASE: 2.0,
  TRACK_WIDTH: 2.0,
  LF_RATIO: 0.5,           // COM midway between axles → neutral steering
  WHEEL_RADIUS: 0.4,
  ROVER_RADIUS: 1.0,       // bounding-circle radius for obstacle collisions

  // Steering
  MAX_STEER_ANGLE: 0.6,    // ~34° — rovers steer sharply
  STEER_SPEED: 3.5,        // rad/s toward target
  STEER_RETURN: 6.0,       // rad/s back to center
  MIN_TURN_SPEED: 0.05,    // near-full steering authority from crawl speed
  PIVOT_RATE: 0.4,         // subtle stationary pivot

  // Longitudinal
  MAX_REVERSE_SPEED: 3.0,
  ACCEL_FORCE: 4.5,
  REVERSE_ACCEL: 2.5,
  BRAKE_DECEL: 10.0,
  ROLLING_FRICTION: 3.0,
  SLOPE_G: 5.0,            // effective gravity along slope (softened for balance)

  SPEED_DEAD_ZONE: 0.03,

  // Suspension spring-damper (vertical)
  SUS_STIFFNESS: 80,
  SUS_DAMPING: 13,         // slightly under critical (√(4k)≈17.9) for a subtle bounce
  CHASSIS_OFFSET: 0.5,

  // Terrain sampling
  SAMPLE_FWD: 1.25,
  SAMPLE_BACK: 1.25,
  SAMPLE_SIDE: 0.9,
  TERRAIN_TILT_RATE: 6.0,

  // Dynamic body lean (brake dive / throttle squat / cornering roll)
  LEAN_PITCH_GAIN: 0.012,
  LEAN_ROLL_GAIN: 0.010,
  MAX_DYN_PITCH: 0.07,
  MAX_DYN_ROLL: 0.09,
  LEAN_SMOOTH_RATE: 8.0,
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const wrapAngle = (a) => {
  let r = a % (2 * Math.PI);
  if (r > Math.PI) r -= 2 * Math.PI;
  if (r < -Math.PI) r += 2 * Math.PI;
  return r;
};

export const moveToward = (cur, target, maxStep) => {
  const diff = target - cur;
  return Math.abs(diff) <= maxStep ? target : cur + Math.sign(diff) * maxStep;
};

/** Fresh physics state at origin. */
export function createRoverPhysics() {
  return {
    x: 0, z: 0, heading: 0,
    speed: 0, prevSpeed: 0,
    steerAngle: 0, slipBeta: 0,
    distance: 0, wheelRotation: 0,
    susY: 0, susVel: 0,          // suspension height + velocity
    terrainPitch: 0, terrainRoll: 0,
    dynPitch: 0, dynRoll: 0,
  };
}

/**
 * Advance physics one frame.
 * @param {object} p     mutable physics state (createRoverPhysics)
 * @param {object} input {throttle:-1..1, steerInput:-1..1}
 * @param {number} dt    seconds (clamped by caller)
 * @param {number} maxSpeed  forward speed limit (m/s)
 * @param {(x:number,z:number)=>number} terrain height sampler
 * @param {Array<{x:number,z:number,r:number}>} [colliders] circle obstacles
 */
export function stepRover(p, input, dt, maxSpeed, terrain, colliders) {
  const P = PHYSICS;
  const ROVER_RADIUS = P.ROVER_RADIUS;
  const absSpeed = Math.abs(p.speed);
  const sinH = Math.sin(p.heading);
  const cosH = Math.cos(p.heading);

  // ── Longitudinal forces ────────────────────────────────────────
  if (input.throttle > 0) {
    p.speed += (p.speed < 0 ? P.BRAKE_DECEL : P.ACCEL_FORCE) * dt;
  } else if (input.throttle < 0) {
    p.speed -= (p.speed > 0 ? P.BRAKE_DECEL : P.REVERSE_ACCEL) * dt;
  } else if (absSpeed > P.SPEED_DEAD_ZONE) {
    const f = P.ROLLING_FRICTION * dt;
    p.speed -= Math.sign(p.speed) * Math.min(f, absSpeed);
  } else {
    p.speed = 0;
  }

  // Slope gravity — climbs bleed speed, descents add it
  const hAhead = terrain(p.x + sinH * P.SAMPLE_FWD, p.z - cosH * P.SAMPLE_FWD);
  const hBehind = terrain(p.x - sinH * P.SAMPLE_BACK, p.z + cosH * P.SAMPLE_BACK);
  const slopeAngle = Math.atan2(hAhead - hBehind, P.SAMPLE_FWD + P.SAMPLE_BACK);
  p.speed -= P.SLOPE_G * Math.sin(slopeAngle) * Math.cos(p.slipBeta) * dt;

  p.speed = clamp(p.speed, -P.MAX_REVERSE_SPEED, maxSpeed);

  // ── Steering actuator ──────────────────────────────────────────
  const targetSteer = input.steerInput * P.MAX_STEER_ANGLE;
  p.steerAngle = input.steerInput !== 0
    ? moveToward(p.steerAngle, targetSteer, P.STEER_SPEED * dt)
    : moveToward(p.steerAngle, 0, P.STEER_RETURN * dt);

  // ── COM Ackermann kinematics ───────────────────────────────────
  const steerScale = clamp(absSpeed / P.MIN_TURN_SPEED, 0, 1);
  const delta = p.steerAngle * steerScale;
  let omega = 0;

  if (Math.abs(delta) > 1e-4 && absSpeed > P.SPEED_DEAD_ZONE) {
    const beta = Math.atan(P.LF_RATIO * Math.tan(delta));
    p.slipBeta = beta;
    omega = (p.speed / P.WHEELBASE) * Math.tan(delta) * Math.cos(beta);
  } else {
    p.slipBeta *= Math.max(0, 1 - 8 * dt);
    if (absSpeed > P.SPEED_DEAD_ZONE && Math.abs(p.steerAngle) > 0.01) {
      omega = Math.sign(p.speed) * Math.sign(p.steerAngle)
            * P.PIVOT_RATE * clamp(absSpeed / 0.2, 0, 1);
    }
  }

  p.heading = wrapAngle(p.heading + omega * dt);

  const velDir = p.heading + p.slipBeta;
  p.x = clamp(p.x + Math.sin(velDir) * p.speed * dt, -95, 95);
  p.z = clamp(p.z + -Math.cos(velDir) * p.speed * dt, -95, 95);

  // ── Obstacle collision — soft slide ────────────────────────────
  let impact = 0;
  if (colliders && colliders.length) {
    for (let i = 0; i < colliders.length; i++) {
      const o = colliders[i];
      const dx = p.x - o.x;
      const dz = p.z - o.z;
      const minD = o.r + ROVER_RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 >= minD * minD || d2 < 1e-9) continue;

      const d = Math.sqrt(d2);
      const nx = dx / d;              // contact normal (obstacle → rover)
      const nz = dz / d;

      // Push out of penetration
      p.x = o.x + nx * minD;
      p.z = o.z + nz * minD;

      // Kill the into-obstacle velocity component (soft slide)
      const vdx = Math.sin(velDir);
      const vdz = -Math.cos(velDir);
      const into = -(vdx * nx + vdz * nz);   // >0 when driving into it
      if (into > 0) {
        p.speed *= 1 - Math.min(into, 1) * 0.8;
        p.slipBeta *= 0.5;
        impact = Math.max(impact, into);
      }
    }
  }

  // ── Ackermann-correct per-wheel angles [FL, FR, RL, RR] ────────
  let fl = 0, fr = 0;
  if (Math.abs(delta) > 1e-4) {
    const d = Math.abs(delta);
    const R = P.WHEELBASE / Math.tan(d);
    const inner = Math.atan(P.WHEELBASE / Math.max(R - P.TRACK_WIDTH / 2, 0.1));
    const outer = Math.atan(P.WHEELBASE / (R + P.TRACK_WIDTH / 2));
    fl = delta > 0 ? inner : outer;   // left turn → FL is inner
    fr = delta > 0 ? outer : inner;   // right turn → FR is inner
  }

  // ── Terrain attitude (3-point sampling, smoothed) ──────────────
  const hRL = terrain(p.x - sinH * P.SAMPLE_BACK - cosH * P.SAMPLE_SIDE,
                      p.z + cosH * P.SAMPLE_BACK - sinH * P.SAMPLE_SIDE);
  const hRR = terrain(p.x - sinH * P.SAMPLE_BACK + cosH * P.SAMPLE_SIDE,
                      p.z + cosH * P.SAMPLE_BACK + sinH * P.SAMPLE_SIDE);
  const hCenter = terrain(p.x, p.z);
  const hRearAvg = (hRL + hRR) / 2;

  const tgtTerrainPitch = -Math.atan2(hAhead - hRearAvg, P.SAMPLE_FWD + P.SAMPLE_BACK);
  const tgtTerrainRoll = Math.atan2(hRR - hRL, P.SAMPLE_SIDE * 2);
  const tiltAlpha = 1 - Math.exp(-P.TERRAIN_TILT_RATE * dt);
  p.terrainPitch += (tgtTerrainPitch - p.terrainPitch) * tiltAlpha;
  p.terrainRoll += (tgtTerrainRoll - p.terrainRoll) * tiltAlpha;

  // ── Suspension spring-damper ───────────────────────────────────
  const susAccel = (hCenter - p.susY) * P.SUS_STIFFNESS - p.susVel * P.SUS_DAMPING;
  p.susVel += susAccel * dt;
  p.susY += p.susVel * dt;

  // ── Dynamic lean ───────────────────────────────────────────────
  const longAccel = dt > 0 ? (p.speed - p.prevSpeed) / dt : 0;
  p.prevSpeed = p.speed;
  const latAccel = p.speed * omega;

  const tgtDynPitch = clamp(-longAccel * P.LEAN_PITCH_GAIN, -P.MAX_DYN_PITCH, P.MAX_DYN_PITCH);
  const tgtDynRoll = clamp(latAccel * P.LEAN_ROLL_GAIN, -P.MAX_DYN_ROLL, P.MAX_DYN_ROLL);
  const leanAlpha = 1 - Math.exp(-P.LEAN_SMOOTH_RATE * dt);
  p.dynPitch += (tgtDynPitch - p.dynPitch) * leanAlpha;
  p.dynRoll += (tgtDynRoll - p.dynRoll) * leanAlpha;

  // ── Accumulators ───────────────────────────────────────────────
  p.wheelRotation += (p.speed / P.WHEEL_RADIUS) * dt;
  p.distance += absSpeed * dt;

  return {
    x: p.x,
    y: p.susY + P.CHASSIS_OFFSET,
    z: p.z,
    heading: p.heading,
    pitch: p.terrainPitch + p.dynPitch,
    roll: p.terrainRoll + p.dynRoll,
    steerAngles: [fl, fr, 0, 0],
    wheelRotation: p.wheelRotation,
    speed: p.speed,
    distance: p.distance,
    omega,
    slopeAngle,
    impact,
  };
}

/**
 * DEMO autopilot input: proportional pursuit of the current waypoint.
 * @returns {{throttle:number, steerInput:number, reached:boolean}}
 */
export function demoAutopilotInput(p, waypoints, waypointIndex, cruiseSpeed, wpRadius = 3.0, steerGain = 3.0) {
  const wp = waypoints?.[waypointIndex];
  if (!wp) return { throttle: 0, steerInput: 0, reached: false };

  const dx = wp.x - p.x;
  const dz = wp.z - p.z;
  const dist = Math.hypot(dx, dz);

  if (dist < wpRadius) return { throttle: 0, steerInput: 0, reached: true };

  const target = Math.atan2(dx, -dz);
  const err = wrapAngle(target - p.heading);
  return { throttle: 1, steerInput: clamp(err * steerGain, -1, 1), reached: false };
}
