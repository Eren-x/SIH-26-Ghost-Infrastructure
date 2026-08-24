import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import useSimStore from '../stores/useSimStore';
import { socket } from '../socket';
import { DEMO_WAYPOINTS } from '../../../shared/constants.js';
import { getTerrainHeight } from './Terrain';
import Rover from './Rover';
import {
  PHYSICS,
  createRoverPhysics,
  stepRover,
  demoAutopilotInput,
} from './roverPhysics';

// ── Demo autopilot tuning (against the new COM kinematics) ───────
const DEMO_CRUISE = 4.5;     // target cruise speed in demo
const DEMO_STEER_GAIN = 2.2; // proportional steering gain (COM model is more responsive)
const DEMO_WP_RADIUS = 3.0;  // waypoint arrival radius

// ── Battery drain model (%/s) ────────────────────────────────────
const BATTERY_BASE_DRAIN = 0.05;   // idle electronics while surveying
const BATTERY_SPEED_DRAIN = 0.02;  // extra %/s per m/s of |speed|

const RoverController = () => {
  // ── Refs ───────────────────────────────────────────────────────
  const keys = useRef({
    w: false, a: false, s: false, d: false,
    up: false, left: false, down: false, right: false,
  });

  const phys = useRef(createRoverPhysics());
  const currentWaypoint = useRef(0);
  const elapsedTime = useRef(0);
  const lastSocketSend = useRef(0);
  const lastBatterySend = useRef(0);
  const roverGroupRef = useRef();       // Three.js Group — imperative transform
  const wheelDataRef = useRef({ wheelRotation: 0, steerAngles: [0, 0, 0, 0] });

  // ── Store selectors ────────────────────────────────────────────
  const setRoverState = useSimStore(s => s.setRoverState);
  const setSurveyTime = useSimStore(s => s.setSurveyTime);
  const demoMode = useSimStore(s => s.demoMode);
  const surveyState = useSimStore(s => s.surveyState);
  const currentRisk = useSimStore(s => s.currentRisk);

  // Re-create physics state when survey resets
  useEffect(() => {
    if (surveyState === 'idle') {
      phys.current = createRoverPhysics();
      currentWaypoint.current = 0;
      elapsedTime.current = 0;
    }
  }, [surveyState]);

  // ── Keyboard listeners ─────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = true;
      if (e.key === 'ArrowUp') keys.current.up = true;
      if (e.key === 'ArrowDown') keys.current.down = true;
      if (e.key === 'ArrowLeft') keys.current.left = true;
      if (e.key === 'ArrowRight') keys.current.right = true;
    };
    const onUp = (e) => {
      const k = e.key.toLowerCase();
      if (k in keys.current) keys.current[k] = false;
      if (e.key === 'ArrowUp') keys.current.up = false;
      if (e.key === 'ArrowDown') keys.current.down = false;
      if (e.key === 'ArrowLeft') keys.current.left = false;
      if (e.key === 'ArrowRight') keys.current.right = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // ── Physics tick (runs every frame) ────────────────────────────
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = phys.current;

    // Survey timer
    if (surveyState === 'active') {
      elapsedTime.current += dt;
      setSurveyTime(elapsedTime.current);
    }

    const maxSpeed = useSimStore.getState().config.roverMaxSpeed || PHYSICS.ACCEL_FORCE;

    // ── Input ────────────────────────────────────────────────────
    let throttle = 0;   // +1 forward, -1 reverse
    let steerInput = 0; // +1 left, -1 right

    if (demoMode && surveyState === 'active' && DEMO_WAYPOINTS?.[currentWaypoint.current]) {
      const result = demoAutopilotInput(
        p, DEMO_WAYPOINTS, currentWaypoint.current,
        DEMO_CRUISE, DEMO_WP_RADIUS, DEMO_STEER_GAIN
      );
      if (result.reached) {
        currentWaypoint.current++;
        if (currentWaypoint.current >= DEMO_WAYPOINTS.length) {
          socket.emit('survey:complete');
          return;
        }
      } else {
        throttle = result.throttle;
        steerInput = result.steerInput;
      }
    } else {
      if (keys.current.w || keys.current.up) throttle = 1;
      if (keys.current.s || keys.current.down) throttle = -1;
      if (keys.current.a || keys.current.left) steerInput = 1;
      if (keys.current.d || keys.current.right) steerInput = -1;
    }

    // ── Physics step ─────────────────────────────────────────────
    const maxFwd = demoMode ? Math.min(DEMO_CRUISE, maxSpeed) : maxSpeed;
    const out = stepRover(p, { throttle, steerInput }, dt, maxFwd, getTerrainHeight);

    // ── Imperative Three.js updates (smooth 60fps) ───────────────
    const grp = roverGroupRef.current;
    if (grp) {
      grp.position.set(out.x, out.y, out.z);
      grp.rotation.set(out.pitch, out.heading, out.roll, 'YXZ');
    }

    // Share wheel data with Rover's own useFrame
    wheelDataRef.current.wheelRotation = out.wheelRotation;
    wheelDataRef.current.steerAngles = out.steerAngles;

    // ── Store update (HUD, camera, minimap) — single batched write ─
    setRoverState({
      x: out.x, y: out.y, z: out.z,
      heading: out.heading, speed: out.speed, distance: out.distance,
      throttle, steerInput,
    });

    // ── Battery drain @ ~2 Hz ────────────────────────────────────
    const now = Date.now();
    if (surveyState === 'active' && now - lastBatterySend.current > 500) {
      const drain = (BATTERY_BASE_DRAIN + BATTERY_SPEED_DRAIN * Math.abs(out.speed)) * 0.5;
      useSimStore.getState().drainBattery(drain);
      lastBatterySend.current = now;
    }

    // ── Backend socket at ~10 Hz ─────────────────────────────────
    if (now - lastSocketSend.current > 100 && surveyState === 'active') {
      socket.emit('rover:update', {
        x: out.x, y: out.y, z: out.z,
        heading: out.heading, speed: out.speed,
        distance: out.distance, time: elapsedTime.current,
      });
      lastSocketSend.current = now;
    }
  });

  // ── Status LED color ───────────────────────────────────────────
  let statusColor = '#22c55e';
  if (currentRisk?.severity === 'WATCH') statusColor = '#eab308';
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
