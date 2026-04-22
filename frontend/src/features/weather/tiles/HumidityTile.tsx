import React from 'react';
import { WeatherGauge, WeatherSparkArea } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface HumidityTileProps {
  humidity: WeatherSummary | null;
  dewPoint: WeatherSummary | null;
}

export const HumidityTile: React.FC<HumidityTileProps> = ({ humidity, dewPoint }) => {
  const current = humidity?.current ?? null;
  const min = humidity?.min ?? null;
  const max = humidity?.max ?? null;
  const trend = humidity?.trend ?? [];
  const dew = dewPoint?.current ?? null;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Humedad
      </div>
      
      <div className="flex justify-center mb-2">
        <WeatherGauge
          value={current}
          min={0}
          max={100}
          label=" humedad"
          unit="%"
          thresholds={{ min: 30, max: 80 }}
          height={100}
        />
      </div>

      <div className="text-center mb-2">
        <span className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">
          {current !== null ? current.toFixed(2) : '--'}
        </span>
        <span className="text-sm font-mono text-gray-500 ml-1">%</span>
      </div>

      <div className="flex justify-between text-xs font-mono px-2 mb-2">
        <span className="text-blue-600">▼{min !== null ? min.toFixed(0) : '--'}%</span>
        <span className="text-gray-500">24h</span>
        <span className="text-red-600">▲{max !== null ? max.toFixed(0) : '--'}%</span>
      </div>

      <WeatherSparkArea data={trend} color="#3b82f6" height={30} />

      <div className="mt-3 pt-2 border-t border-gray-300 dark:border-gray-600">
        <div className="text-xs font-mono text-gray-500 text-center mb-1">Punto de rocío</div>
        <div className="text-center">
          <span className="text-lg font-bold font-mono text-gray-700 dark:text-gray-300">
            {dew !== null ? dew.toFixed(2) : '--'}
          </span>
          <span className="text-sm font-mono text-gray-500 ml-1">°C</span>
        </div>
      </div>
    </div>
  );
};

export default HumidityTile;