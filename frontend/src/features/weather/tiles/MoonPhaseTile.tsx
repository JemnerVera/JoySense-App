import React from 'react';

interface MoonPhaseTileProps {
  phase: string;
  icon: string;
  name: string;
}

export const MoonPhaseTile: React.FC<MoonPhaseTileProps> = ({ phase, icon, name }) => {
  return (
    <div className="weather-tile">
      <div className="weather-tile-header">Fase Lunar</div>
      
      <div className="flex justify-center mb-3">
        <span className="text-4xl">{icon}</span>
      </div>

      <div className="text-center mb-2">
        <span className="text-base font-bold font-mono text-gray-800 dark:text-gray-200">{name}</span>
      </div>

      <div className="text-center text-xs font-mono text-gray-500">
        Día {phase} lunación
      </div>
    </div>
  );
};

export default MoonPhaseTile;