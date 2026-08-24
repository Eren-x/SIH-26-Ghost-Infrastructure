import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useSimStore from '../stores/useSimStore';
import * as THREE from 'three';

const CameraRig = () => {
  const cameraMode = useSimStore(s => s.cameraMode) || 'chase';
  const { x, y, z } = useSimStore(s => s.roverPosition) || { x: 0, y: 0, z: 0 };
  const roverHeading = useSimStore(s => s.roverHeading) || 0;
  
  const { camera } = useThree();
  // Reusable vectors — avoids allocating new Vector3s every frame
  const targetPos = useRef(new THREE.Vector3());
  const lookAtPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const dist = useRef(10);
  
  useFrame((state, delta) => {
    if (cameraMode === 'chase') {
      const dt = Math.min(delta, 0.1);
      const camX = x - Math.sin(roverHeading) * dist.current;
      const camZ = z + Math.cos(roverHeading) * dist.current;
      const camY = y + 7;
      
      targetPos.current.set(camX, camY, camZ);
      lookAtPos.current.set(x, y + 1, z);
      
      // Frame-rate independent smoothing: 1 - exp(-speed * dt)
      const posAlpha = 1 - Math.exp(-3.0 * dt);
      const lookAlpha = 1 - Math.exp(-5.0 * dt);
      
      camera.position.lerp(targetPos.current, posAlpha);
      
      currentLookAt.current.set(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
      currentLookAt.current.lerp(lookAtPos.current, lookAlpha);
      camera.lookAt(currentLookAt.current);
    }
  });

  useEffect(() => {
    const handleWheel = (e) => {
      if (cameraMode === 'chase') {
        dist.current += e.deltaY * 0.01;
        if (dist.current < 5) dist.current = 5;
        if (dist.current > 25) dist.current = 25;
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [cameraMode]);

  if (cameraMode === 'free') {
    return <OrbitControls target={[x, y, z]} makeDefault />;
  }

  return null;
};

export default CameraRig;
