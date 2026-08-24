import React from 'react';
import useSimStore from '../stores/useSimStore';

const SurveyGrid = () => {
  const showGrid = useSimStore(s => s.config.showGrid);
  if (!showGrid) return null;
  
  return (
    <gridHelper 
      args={[200, 20, '#333333', '#222222']} 
      position={[0, 0.02, 0]} 
      material-transparent={true}
      material-opacity={0.3}
    />
  );
};

export default SurveyGrid;
