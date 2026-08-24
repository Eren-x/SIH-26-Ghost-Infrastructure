import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import useSimStore from '../stores/useSimStore';
import { socket } from '../socket';
import { DEMO_WAYPOINTS } from '../../../shared/constants.js';
import { getTerrainHeight } from './Terrain';
import Rover from './Rover';

// ── Physics constants (tuned for a small 4WD survey rover) ───────
const WHEELBASE        = 2.0;      // front-to-rear axle distance
const WHEEL_RADIUS     = 0.4;      // matches Rover.jsx wheel cylinder radius
const MAX_STEER_ANGLE  = 0.5;      // ~29° max wheel deflection (rad)
const MAX_REVERSE_SPEED = 3.0;     // reverse is always slower
const ACCEL_FORCE      = 4.5;      // forward acceleration (m/s²)
const REVERSE_ACCEL    = 2.5;      // reverse acceleration (m/s²)
const BRAKE_DECEL      = 10.0;     // deceleration when opposing current direction
const ROLLING_FRICTION = 3.0;      // coast-down deceleration (m/s²)
const STEER_SPEED      = 3.0;      // how fast steering reaches target (rad/s)
const STEER_RETURN     = 5.0;      // how fast steering returns to center (rad/s)
const SPEED_DEAD_ZONE  = 0.03;     // snap to zero below this (m/s)
const STEER_FULL_SPEED = 1.5;      // speed at which steering reaches full effectiveness
const MIN_TURN_SPEED   = 0.12;     // below this, only subtle pivot allowed
const PIVOT_RATE       = 0.25;     // very slow stationary pivot (rad/s)

// ── Demo autopilot ───────────────────────────────────────────────
const DEMO_CRUISE      = 4.5;      // target cruise speed in demo
const DEMO_STEER_GAIN  = 3.0;      // proportional steering gain
const DEMO_WP_RADIUS   = 3.0;      // waypoint arrival radius

// ── Terrain conformance ──────────────────────────────────────────
const CHASSIS_OFFSET   = 0.5;      // height above ground sample
const PITCH_ROLL_RATE  = 6.0;      // smoothing speed for tilt (higher = faster)
const GROUND_Y_RATE    = 10.0;     // smoothing speed for vertical position
const SAMPLE_FWD       = 1.25;     // forward sample distance
const SAMPLE_BACK      = 1.25;     // backward sample distance
const SAMPLE_SIDE      = 0.9;      // lateral sample distance

// ── Helpers ──────────────────────────────────────────────────────

/** Frame-rate-independent lerp alpha. */
const smoothAlpha = (rate, dt) => 1 - Math.exp(-rate * dt);

/** Normalize angle to [-PI, PI]. */
const wrapAngle = (a) => {
  let r = a % (2 * Math.PI);
  if (r > Math.PI) r -= 2 * Math.PI;
  if (r < -Math.PI) r += 2 * Math.PI;
  return r;
};

/** Move value toward target by at most maxStep. */
const moveToward = (cur, target, maxStep) => {
  const diff = target - cur;
  return Math.abs(diff) <= maxStep ? target : cur + Math.sign(diff) * maxStep;
};

/** Clamp value to [min, max]. */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ═════════════════════════════════════════════════════════════════
const RoverController = () => {
  // ── Refs ───────────────────────────────────────────────────────
  const keys = useRef({
    w: false, a: false, s: false, d: false,
    up: false, left: false, down: false, right: false,
  });

  const sim = useRef({
    x: 0, z: 0, heading: 0,
    speed: 0, steerAngle: 0,
    distance: 0, wheelRotation: 0,
    currentWaypoint: 0, elapsedTime: 0,
    // Smoothed terrain
    pitch: 0, roll: 0, groundY: 0,
  });

  const lastSocketSend = useRef(0);
  const roverGroupRef  = useRef();      // Three.js Group — imperative position/rotation
  const wheelDataRef   = useRef({ wheelRotation: 0, steerAngle: 0 });

  // ── Store selectors ────────────────────────────────────────────
  const setRoverState = useSimStore(s => s.setRoverState);
  const setSurveyTime = useSimStore(s => s.setSurveyTime);
  const demoMode      = useSimStore(s => s.demoMode);
  const surveyState   = useSimStore(s => s.surveyState);
  const currentRisk   = useSimStore(s => s.currentRisk);

  // ── Keyboard listeners ─────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = true;
      if (e.key === 'ArrowUp')    keys.current.up    = true;
      if (e.key === 'ArrowDown')  keys.current.down  = true;
      if (e.key === 'ArrowLeft')  keys.current.left  = true;
      if (e.key === 'ArrowRight') keys.current.right = true;
    };
    const onUp = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = false;
      if (e.key === 'ArrowUp')    keys.current.up    = false;
      if (e.key === 'ArrowDown')  keys.current.down  = false;
      if (e.key === 'ArrowLeft')  keys.current.left  = false;
      if (e.key === 'ArrowRight') keys.current.right = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  // ── Physics tick (runs every frame) ────────────────────────────
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const s  = sim.current;

    // Survey timer
    if (surveyState === 'active') {
      s.elapsedTime += dt;
      setSurveyTime(s.elapsedTime);
    }

    const maxSpeed = useSimStore.getState().config.roverMaxSpeed || 8;

    // ── Input ────────────────────────────────────────────────────
    let throttle   = 0;  // +1 forward, -1 reverse
    let steerInput = 0;  // +1 left, -1 right

    if (demoMode && surveyState === 'active' && DEMO_WAYPOINTS?.[s.currentWaypoint]) {
      // Demo autopilot
      const wp = DEMO_WAYPOINTS[s.currentWaypoint];
      const dx = wp.x - s.x;
      const dz = wp.z - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < DEMO_WP_RADIUS) {
        s.currentWaypoint++;
        if (s.currentWaypoint >= DEMO_WAYPOINTS.length) {
          socket.emit('survey:complete');
          return;
        }
      } else {
        throttle = 1;
        const target = Math.atan2(dx, -dz);
        const err = wrapAngle(target - s.heading);
        steerInput = clamp(err * DEMO_STEER_GAIN, -1, 1);
      }
    } else {
      // Manual
      if (keys.current.w || keys.current.up)    throttle =  1;
      if (keys.current.s || keys.current.down)   throttle = -1;
      if (keys.current.a || keys.current.left)   steerInput =  1;
      if (keys.current.d || keys.current.right)  steerInput = -1;
    }

    // ── Speed ────────────────────────────────────────────────────
    const maxFwd = demoMode ? Math.min(DEMO_CRUISE, maxSpeed) : maxSpeed;

    if (throttle > 0) {
      // Forward
      if (s.speed < 0) {
        s.speed += BRAKE_DECEL * dt;            // braking from reverse
      } else {
        s.speed += ACCEL_FORCE * dt;
      }
    } else if (throttle < 0) {
      // Reverse
      if (s.speed > 0) {
        s.speed -= BRAKE_DECEL * dt;            // braking from forward
      } else {
        s.speed -= REVERSE_ACCEL * dt;
      }
    } else {
      // Coast — frame-rate-independent friction
      if (Math.abs(s.speed) > SPEED_DEAD_ZONE) {
        const friction = ROLLING_FRICTION * dt;
        s.speed -= Math.sign(s.speed) * Math.min(friction, Math.abs(s.speed));
      } else {
        s.speed = 0;
      }
    }

    s.speed = clamp(s.speed, -MAX_REVERSE_SPEED, maxFwd);

    // ── Steering ─────────────────────────────────────────────────
    const targetSteer = steerInput * MAX_STEER_ANGLE;

    if (steerInput !== 0) {
      s.steerAngle = moveToward(s.steerAngle, targetSteer, STEER_SPEED * dt);
    } else {
      s.steerAngle = moveToward(s.steerAngle, 0, STEER_RETURN * dt);
    }

    // ── Heading (bicycle-model kinematics) ───────────────────────
    const absSpeed = Math.abs(s.speed);

    if (absSpeed > MIN_TURN_SPEED) {
      // Speed-dependent steering effectiveness (full at STEER_FULL_SPEED m/s)
      const steerScale = clamp(absSpeed / STEER_FULL_SPEED, 0, 1);
      const effSteer   = s.steerAngle * steerScale;

      // Bicycle model: dHeading/dt = (v / L) * tan(steer)
      s.heading += (s.speed / WHEELBASE) * Math.tan(effSteer) * dt;

    } else if (absSpeed > SPEED_DEAD_ZONE && Math.abs(s.steerAngle) > 0.01) {
      // Subtle low-speed pivot (fades in linearly)
      const fade = absSpeed / MIN_TURN_SPEED;
      s.heading += Math.sign(s.speed) * Math.sign(s.steerAngle) * PIVOT_RATE * fade * dt;
    }

    s.heading = wrapAngle(s.heading);

    // ── Position ─────────────────────────────────────────────────
    s.x += Math.sin(s.heading) * s.speed * dt;
    s.z -= Math.cos(s.heading) * s.speed * dt;
    s.x = clamp(s.x, -95, 95);
    s.z = clamp(s.z, -95, 95);

    // ── Terrain conformance ──────────────────────────────────────
    const sinH = Math.sin(s.heading);
    const cosH = Math.cos(s.heading);

    // Three sample points: front-center, rear-left, rear-right
    const hFront = getTerrainHeight(s.x + sinH * SAMPLE_FWD, s.z - cosH * SAMPLE_FWD);
    const hRL    = getTerrainHeight(s.x - sinH * SAMPLE_BACK - cosH * SAMPLE_SIDE,
                                    s.z + cosH * SAMPLE_BACK - sinH * SAMPLE_SIDE);
    const hRR    = getTerrainHeight(s.x - sinH * SAMPLE_BACK + cosH * SAMPLE_SIDE,
                                    s.z + cosH * SAMPLE_BACK + sinH * SAMPLE_SIDE);

    const hCenter  = getTerrainHeight(s.x, s.z);       // center point for Y
    const hRearAvg = (hRL + hRR) / 2;

    const tgtPitch = -Math.atan2(hFront - hRearAvg, SAMPLE_FWD + SAMPLE_BACK);
    const tgtRoll  =  Math.atan2(hRR - hRL, SAMPLE_SIDE * 2);

    const tiltAlpha = smoothAlpha(PITCH_ROLL_RATE, dt);
    const yAlpha    = smoothAlpha(GROUND_Y_RATE, dt);

    s.pitch   += (tgtPitch - s.pitch)   * tiltAlpha;
    s.roll    += (tgtRoll  - s.roll)    * tiltAlpha;
    s.groundY += (hCenter  - s.groundY) * yAlpha;

    const y = s.groundY + CHASSIS_OFFSET;

    // ── Wheel rotation ───────────────────────────────────────────
    s.wheelRotation += (s.speed / WHEEL_RADIUS) * dt;
    s.distance      += absSpeed * dt;

    // ── Imperative Three.js updates (smooth 60fps) ───────────────
    const grp = roverGroupRef.current;
    if (grp) {
      grp.position.set(s.x, y, s.z);
      grp.rotation.set(s.pitch, s.heading, s.roll, 'YXZ');
    }

    // Share wheel data with Rover's own useFrame
    wheelDataRef.current.wheelRotation = s.wheelRotation;
    wheelDataRef.current.steerAngle    = s.steerAngle;

    // ── Store update (for camera, UI, etc.) ───────────────────────
    setRoverState({ x: s.x, y, z: s.z, heading: s.heading, speed: s.speed, distance: s.distance });

    // ── Backend socket at ~10 Hz ─────────────────────────────────
    const now = Date.now();
    if (now - lastSocketSend.current > 100 && surveyState === 'active') {
      socket.emit('rover:update', {
        x: s.x, y, z: s.z,
        heading: s.heading, speed: s.speed,
        distance: s.distance, time: s.elapsedTime,
      });
      lastSocketSend.current = now;
    }
  });

  // ── Status LED color ───────────────────────────────────────────
  let statusColor = '#22c55e';
  if (currentRisk?.severity === 'WATCH')   statusColor = '#eab308';
  if (currentRisk?.severity === 'INSPECT') statusColor = '#ef4444';

  return (
    <Rover
      ref={roverGroupRef}
      wheelDataRef={wheelDataRef}
      statusColor={statusColor}
    />
  );
};

export default RoverController;
