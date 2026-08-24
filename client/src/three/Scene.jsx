import React from 'react';
import { Canvas } from '@react-three/fiber';
import Terrain from './Terrain';
import RoverController from './RoverController';
import RouteTrail from './RouteTrail';
import AnomalyMarkers from './AnomalyMarkers';
import SurveyGrid from './SurveyGrid';
import CameraRig from './CameraRig';

const Scene = () => {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ position: [0, 15, 20], fov: 55 }}>
        <fog attach="fog" args={['#1a1a2e', 50, 180]} />
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[50, 50, 25]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-camera-far={200} 
          shadow-camera-left={-100} 
          shadow-camera-right={100} 
          shadow-camera-top={100} 
          shadow-camera-bottom={-100} 
        />
        <color attach="background" args={['#0a0e14']} />
        <Terrain />
        <RoverController />
        <RouteTrail />
        <AnomalyMarkers />
        <SurveyGrid />
        <CameraRig />
      </Canvas>
    </div>
  );
};

export default Scene;
