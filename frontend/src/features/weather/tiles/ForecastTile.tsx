import React from 'react';
import { getWeatherDescription, getWeatherIcon } from '../../../hooks/useWeatherData';

interface ForecastTileProps {
  weatherCode: number;
  tempMax: number | null;
  tempMin: number | null;
}

export const ForecastTile: React.FC<ForecastTileProps> = ({ weatherCode, tempMax, tempMin }) => {
  const icon = getWeatherIcon(weatherCode);
  const description = getWeatherDescription(weatherCode);
  
  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Pronóstico
      </div>
      
      <div className="flex justify-center mb-3">
        <span className="text-4xl">{icon}</span>
      </div>

      <div className="text-center mb-2">
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{description}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="text-center">
          <span className="text-gray-500">Máx</span>
          <div className="font-semibold text-red-600">
            {tempMax !== null ? `${tempMax.toFixed(0)}°` : '--'}
          </div>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Mín</span>
          <div className="font-semibold text-blue-600">
            {tempMin !== null ? `${tempMin.toFixed(0)}°` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastTile;