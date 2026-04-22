import React from 'react';
import { WeatherGauge, WeatherSparkArea } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface SolarTileProps {
  radiation: WeatherSummary | null;
}

export const SolarTile: React.FC<SolarTileProps> = ({ radiation }) => {
  const current = radiation?.current ?? null;
  const max = radiation?.max ?? null;
  const trend = radiation?.trend ?? [];

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Solar
      </div>
      
      <div className="flex justify-center mb-2">
        <WeatherGauge
          value={current}
          min={0}
          max={1400}
          label=" radiación"
          unit="W/m²"
          thresholds={{ min: 0, max: 1000 }}
          height={100}
        />
      </div>

      <div className="text-center mb-2">
        <span className="text-2xl font-bold font-mono text-yellow-600">
          {current !== null ? current.toFixed(0) : '--'}
        </span>
        <span className="text-sm font-mono text-gray-500 ml-1">W/m²</span>
      </div>

      <div className="text-center text-xs font-mono text-gray-500 mb-2">
        Max: <span className="text-yellow-600">{max !== null ? max.toFixed(0) : '--'}</span> W/m²
      </div>

      <WeatherSparkArea data={trend} color="#eab308" height={30} />
    </div>
  );
};

export default SolarTile;