import React from 'react';
import { WeatherGauge, WeatherSparkArea } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface PressureTileProps {
  pressure: WeatherSummary | null;
}

export const PressureTile: React.FC<PressureTileProps> = ({ pressure }) => {
  const current = pressure?.current ?? null;
  const min = pressure?.min ?? null;
  const max = pressure?.max ?? null;
  const trend = pressure?.trend ?? [];

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Presión
      </div>
      
      <div className="flex justify-center mb-2">
        <WeatherGauge
          value={current}
          min={980}
          max={1040}
          label=" presión"
          unit="hPa"
          thresholds={{ min: 1000, max: 1020 }}
          height={100}
        />
      </div>

      <div className="text-center mb-2">
        <span className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">
          {current !== null ? current.toFixed(0) : '--'}
        </span>
        <span className="text-sm font-mono text-gray-500 ml-1">hPa</span>
      </div>

      <div className="flex justify-between text-xs font-mono px-2 mb-2">
        <span className="text-gray-500">▼{min !== null ? min.toFixed(0) : '--'}</span>
        <span className="text-gray-500">24h</span>
        <span className="text-gray-500">▲{max !== null ? max.toFixed(0) : '--'}</span>
      </div>

      <WeatherSparkArea data={trend} color="#8b5cf6" height={30} />
    </div>
  );
};

export default PressureTile;