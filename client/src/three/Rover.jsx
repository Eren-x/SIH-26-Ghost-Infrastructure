import React, { useRef, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';

const WHEEL_POSITIONS = [
  [-1, 0.4, 1],   // front-left
  [1, 0.4, 1],    // front-right
  [-1, 0.4, -1],  // rear-left
  [1, 0.4, -1],   // rear-right
];

const Rover = forwardRef(({ wheelDataRef, statusColor = '#00ff00' }, ref) => {
  // Refs for imperative wheel updates every frame
  const steerGroupRefs = useRef([]);
  const spinGroupRefs  = useRef([]);

  // Update wheel rotations imperatively at 60fps
  useFrame(() => {
    if (!wheelDataRef?.current) return;
    const { wheelRotation, steerAngles } = wheelDataRef.current;

    for (let i = 0; i < 4; i++) {
      // Steering: front wheels only (indices 0, 1), Ackermann-correct per wheel.
      // Visual Y-angle is negated: kinematic delta>0 turns toward +X, while a
      // wheel mesh with rotation.y=+δ points toward −X.
      const steerGroup = steerGroupRefs.current[i];
      if (steerGroup) {
        steerGroup.rotation.y = i < 2 ? -(steerAngles?.[i] ?? 0) : 0;
      }
      // Spin: all wheels
      const spinGroup = spinGroupRefs.current[i];
      if (spinGroup) {
        spinGroup.rotation.x = wheelRotation;
      }
    }
  });

  return (
    <group ref={ref}>
      {/* Chassis */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.8, 0.4, 2.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Waterproof Enclosure */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 1.6]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      {/* Sensor Pod */}
      <group position={[0, 1.75, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.3, 0.6]} />
          <meshStandardMaterial color="#ddd" />
        </mesh>
        {/* Internal components */}
        <mesh position={[-0.2, 0.15, 0]}><boxGeometry args={[0.15, 0.05, 0.2]} /><meshStandardMaterial color="green" /></mesh> {/* ESP32 */}
        <mesh position={[0, 0.15, -0.1]}><boxGeometry args={[0.1, 0.05, 0.1]} /><meshStandardMaterial color="blue" /></mesh> {/* MPU6050 */}
        <mesh position={[0.2, 0.15, 0]}><boxGeometry args={[0.12, 0.05, 0.15]} /><meshStandardMaterial color="orange" /></mesh> {/* GPS */}
        <mesh position={[0, 0.15, 0.2]}><cylinderGeometry args={[0.05, 0.05, 0.1]} /><meshStandardMaterial color="red" /></mesh> {/* Mic */}
        <mesh position={[0.2, 0.15, 0.2]}><boxGeometry args={[0.1, 0.05, 0.12]} /><meshStandardMaterial color="yellow" /></mesh> {/* DHT22 */}
        <mesh position={[-0.2, 0.15, -0.2]}><boxGeometry args={[0.08, 0.03, 0.1]} /><meshStandardMaterial color="grey" /></mesh> {/* MicroSD */}
      </group>

      {/* 4 Wheels — nested groups for independent steering + spinning */}
      {WHEEL_POSITIONS.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Steering group (Y-rotation, front wheels only) */}
          <group ref={el => steerGroupRefs.current[i] = el}>
            {/* Spin group (X-rotation, all wheels) */}
            <group ref={el => spinGroupRefs.current[i] = el}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#222" />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]} position={[pos[0] > 0 ? 0.16 : -0.16, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          </group>
        </group>
      ))}

      {/* GPS Antenna */}
      <group position={[0.5, 1.85, -0.5]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.5]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      {/* Front Microphone */}
      <mesh position={[0, 1.2, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.15]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Status LED */}
      <mesh position={[0.5, 1.65, 0.6]}>
        <sphereGeometry args={[0.06]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.45} />
        <pointLight color={statusColor} intensity={0.3} distance={2} />
      </mesh>

      {/* Power Switch */}
      <mesh position={[0.72, 1.2, 0]}>
        <boxGeometry args={[0.05, 0.15, 0.2]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
    </group>
  );
});

export default Rover;
