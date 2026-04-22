import React from 'react';

interface MoonPhaseTileProps {
  phase: string;
  icon: string;
  name: string;
}

export const MoonPhaseTile: React.FC<MoonPhaseTileProps> = ({ phase, icon, name }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Fase Lunar
      </div>
      
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