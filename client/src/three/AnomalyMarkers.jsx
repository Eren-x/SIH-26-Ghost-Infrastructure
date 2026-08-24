import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import useSimStore from '../stores/useSimStore';
import { getTerrainHeight } from './Terrain';

const Marker = ({ anomaly }) => {
  const meshRef = useRef();
  const ringRef = useRef();
  const isCavity = anomaly.type === 'cavity';
  const color = isCavity ? '#ff4500' : '#3b82f6';
  const undergroundY = isCavity ? -3 : -2;
  const radius = 3;
  
  const wx = anomaly.worldPos?.x ?? 0;
  const wz = anomaly.worldPos?.z ?? 0;
  const surfaceY = getTerrainHeight(wx, wz);
  
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.4 + 0.4 * Math.sin(clock.elapsedTime * 3);
    }
    if (meshRef.current) {
      if (meshRef.current.scale.x < 1) {
        meshRef.current.scale.x += 0.02;
        meshRef.current.scale.y += 0.02;
        meshRef.current.scale.z += 0.02;
      }
    }
  });

  const showUnderground = useSimStore(s => s.config.showUnderground);

  return (
    <group position={[wx, surfaceY, wz]}>
      {/* Surface Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
        <torusGeometry args={[3, 0.15, 16, 64]} />
        <meshBasicMaterial color={color} transparent opacity={1} />
      </mesh>
      
      {/* Underground Volume */}
      {showUnderground && (
        <mesh ref={meshRef} position={[0, undergroundY, 0]} scale={[0, 0, 0]}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color={color} transparent opacity={isCavity ? 0.3 : 0.25} />
        </mesh>
      )}

      <Html position={[0, 4, 0]} center>
        <div className="bg-black/80 text-white p-2 rounded border border-gray-600 text-xs whitespace-nowrap font-mono">
          <div className="font-bold" style={{ color }}>{anomaly.type.toUpperCase()}</div>
          <div>Risk: {typeof anomaly.riskScore === 'number' ? anomaly.riskScore.toFixed(0) : '—'}</div>
        </div>
      </Html>
    </group>
  );
};

const AnomalyMarkers = () => {
  const detectedAnomalies = useSimStore(s => s.detectedAnomalies) || [];
  return (
    <group>
      {detectedAnomalies.map((a, i) => (
        <Marker key={a.id || i} anomaly={a} />
      ))}
    </group>
  );
};

export default AnomalyMarkers;
