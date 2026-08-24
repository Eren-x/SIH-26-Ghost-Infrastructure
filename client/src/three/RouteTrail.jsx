import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useSimStore from '../stores/useSimStore';
import * as THREE from 'three';

const MAX_POINTS = 5000;          // preallocated trail capacity
const MIN_POINT_DISTANCE = 0.5;   // min rover movement (units) before a new point
const RISK_HEX = {
  CALM: '#22c55e',
  WATCH: '#eab308',
  INSPECT: '#ef4444',
};

// Pre-convert risk colors once — no per-point allocation
const RISK_RGB = Object.fromEntries(
  Object.entries(RISK_HEX).map(([k, hex]) => [k, new THREE.Color(hex)])
);

const RouteTrail = () => {
  const showRoute = useSimStore(s => s.config.showRoute);

  // Build line object + buffers exactly once
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({ vertexColors: true });
    const obj = new THREE.Line(geometry, material);
    obj.frustumCulled = false;
    return obj;
  }, []);

  const state = useRef({ count: 0, lastX: Infinity, lastY: Infinity, lastZ: Infinity });

  useFrame(() => {
    const s = state.current;
    const { surveyState } = useSimStore.getState();

    // Reset the trail when survey is reset/idle
    if (surveyState === 'idle') {
      if (s.count !== 0) {
        s.count = 0;
        line.geometry.setDrawRange(0, 0);
      }
      return;
    }
    if (surveyState !== 'active') return;

    // Read rover position imperatively — avoids re-rendering on every store update
    const roverPos = useSimStore.getState().roverPosition;
    if (!roverPos) return;

    const x = roverPos.x;
    const y = roverPos.y + 0.1;
    const z = roverPos.z;

    // Skip if we haven't moved far enough from the last recorded point
    if (s.count > 0) {
      const dx = x - s.lastX, dy = y - s.lastY, dz = z - s.lastZ;
      if (dx * dx + dy * dy + dz * dz < MIN_POINT_DISTANCE * MIN_POINT_DISTANCE) return;
    }

    // Buffer full — stop appending (longest surveys still fit comfortably)
    if (s.count >= MAX_POINTS) return;

    // Append vertex + risk color
    const sev = useSimStore.getState().currentRisk?.severity || 'CALM';
    const c = RISK_RGB[sev] || RISK_RGB.CALM;
    const i3 = s.count * 3;

    line.geometry.attributes.position.array[i3] = x;
    line.geometry.attributes.position.array[i3 + 1] = y;
    line.geometry.attributes.position.array[i3 + 2] = z;
    line.geometry.attributes.color.array[i3] = c.r;
    line.geometry.attributes.color.array[i3 + 1] = c.g;
    line.geometry.attributes.color.array[i3 + 2] = c.b;

    s.count++;
    line.geometry.setDrawRange(0, s.count);
    line.geometry.attributes.position.needsUpdate = true;
    line.geometry.attributes.color.needsUpdate = true;

    s.lastX = x;
    s.lastY = y;
    s.lastZ = z;

    // Mirror into the store for the 2D minimap
    useSimStore.getState().addRoutePoint({ x: roverPos.x, y: roverPos.y, z: roverPos.z, risk: sev });
  });

  if (!showRoute) return null;

  return <primitive object={line} />;
};

export default RouteTrail;
