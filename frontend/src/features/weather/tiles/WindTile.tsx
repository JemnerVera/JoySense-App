import React from 'react';
import { WeatherCompass, WeatherSparkArea, WeatherGauge } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface WindTileProps {
  speed: WeatherSummary | null;
  direction: { current: number | null; direction: string } | null;
  gust: WeatherSummary | null;
}

export const WindTile: React.FC<WindTileProps> = ({ speed, direction, gust }) => {
  const currentSpeed = speed?.current ?? null;
  const maxGust = gust?.max ?? gust?.current ?? null;
  const trend = speed?.trend ?? [];
  const avgSpeed = speed?.avg ?? null;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Viento
      </div>
      
      <div className="flex justify-center mb-2">
        <WeatherCompass
          direction={direction?.current ?? null}
          speed={currentSpeed}
          size={90}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2">
        <div className="text-center">
          <span className="text-gray-500">Ráfaga</span>
          <div className="font-semibold text-red-600">
            {maxGust !== null ? maxGust.toFixed(2) + ' m/s' : '--'}
          </div>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Avg</span>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {avgSpeed !== null ? avgSpeed.toFixed(2) + ' m/s' : '--'}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <WeatherSparkArea data={trend} color="#6b7280" height={30} />
      </div>
    </div>
  );
};

export default WindTile;