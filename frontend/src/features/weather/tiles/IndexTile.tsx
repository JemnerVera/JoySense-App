import React from 'react';
import { WeatherGauge } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface IndexTileProps {
  label: string;
  value: WeatherSummary | null;
  unit?: string;
}

export const IndexTile: React.FC<IndexTileProps> = ({ label, value, unit = '°C' }) => {
  const current = value?.current ?? null;
  const min = value?.min ?? null;
  const max = value?.max ?? null;

  const getDescription = () => {
    if (label === 'THW') return 'Temp + Hum + Viento';
    if (label === 'THSW') return 'Temp + Hum + Viento + Sol';
    return label;
  };

  const getThresholds = () => {
    if (label === 'THW') return { min: 10, max: 30 };
    if (label === 'THSW') return { min: 10, max: 35 };
    return { min: 10, max: 30 };
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        {label}
      </div>
      
      <div className="text-[10px] text-gray-500 text-center mb-1">{getDescription()}</div>
      
      <div className="flex justify-center mb-2">
        <WeatherGauge
          value={current}
          min={0}
          max={40}
          label=""
          unit={unit}
          thresholds={getThresholds()}
          height={80}
        />
      </div>

      <div className="text-center mb-2">
<span className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">
            {current !== null ? current.toFixed(2) : '--'}
          </span>
        <span className="text-sm font-mono text-gray-500 ml-1">{unit}</span>
      </div>

      <div className="flex justify-between text-xs font-mono px-2">
        <span className="text-blue-600">▼{min !== null ? min.toFixed(1) : '--'}{unit}</span>
        <span className="text-red-600">▲{max !== null ? max.toFixed(1) : '--'}{unit}</span>
      </div>
    </div>
  );
};

export default IndexTile;