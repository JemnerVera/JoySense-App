import React from 'react';
import { WeatherRainBar } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface RainTileProps {
  today: WeatherSummary | null;
  rate: WeatherSummary | null;
  et: WeatherSummary | null;
}

export const RainTile: React.FC<RainTileProps> = ({ today, rate, et }) => {
  const rainToday = today?.current ?? null;
  const rainRate = rate?.current ?? null;
  const rainET = et?.current ?? null;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Lluvia
      </div>
      
      <WeatherRainBar today={rainToday} month={null} height={100} />

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
        <div className="text-center">
          <span className="text-gray-500">Hoy</span>
          <div className="font-semibold text-blue-600">
            {rainToday !== null ? rainToday.toFixed(1) : '--'}
          </div>
          <span className="text-gray-400 text-xs">mm</span>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Tasa</span>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {rainRate !== null ? rainRate.toFixed(1) : '--'}
          </div>
          <span className="text-gray-400 text-xs">mm/h</span>
        </div>
        <div className="text-center">
          <span className="text-gray-500">ET</span>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {rainET !== null ? rainET.toFixed(1) : '--'}
          </div>
          <span className="text-gray-400 text-xs">mm</span>
        </div>
      </div>
    </div>
  );
};

export default RainTile;