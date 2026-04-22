import React from 'react';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface IndoorTileProps {
  tempIn: WeatherSummary | null;
  humIn: WeatherSummary | null;
}

export const IndoorTile: React.FC<IndoorTileProps> = ({ tempIn, humIn }) => {
  const temp = tempIn?.current ?? null;
  const hum = humIn?.current ?? null;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Interior
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-xs font-mono text-gray-500 mb-1">Temperatura</div>
          <div className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">
            {temp !== null ? temp.toFixed(1) : '--'}
          </div>
          <span className="text-sm font-mono text-gray-500">°C</span>
        </div>
        
        <div className="text-center">
          <div className="text-xs font-mono text-gray-500 mb-1">Humedad</div>
          <div className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">
            {hum !== null ? hum.toFixed(0) : '--'}
          </div>
          <span className="text-sm font-mono text-gray-500">%</span>
        </div>
      </div>
    </div>
  );
};

export default IndoorTile;