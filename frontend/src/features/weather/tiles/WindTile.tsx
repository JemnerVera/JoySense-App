import React from 'react';
import { WeatherCompass, WeatherSparkArea, WeatherGauge } from '../components';
import { WeatherSummary, WIND_LEVEL_MAP } from '../../../hooks/useWeatherData';

interface WindTileProps {
  speed: WeatherSummary | null;
  direction: { current: number | null; direction: string } | null;
  gust: WeatherSummary | null;
  isProprietary?: boolean;
}

export const WindTile: React.FC<WindTileProps> = ({ speed, direction, gust, isProprietary }) => {
  const currentSpeed = speed?.current ?? null;
  const maxGust = gust?.max ?? gust?.current ?? null;
  const trend = speed?.trend ?? [];
  const avgSpeed = speed?.avg ?? null;

  const speedLabel = isProprietary && currentSpeed !== null && currentSpeed >= 0 && currentSpeed <= 7
    ? `${currentSpeed} - ${WIND_LEVEL_MAP[Math.round(currentSpeed)] || 'Desconocido'}`
    : undefined;

  return (
    <div className="weather-tile">
      <div className="weather-tile-header">Viento</div>
      
      <div className="flex justify-center mb-2">
        <WeatherCompass
          direction={direction?.current ?? null}
          speed={currentSpeed}
          size={90}
          speedLabel={speedLabel}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2">
        <div className="text-center">
          <span className="text-gray-500">Ráfaga</span>
          <div className="font-semibold text-red-600">
            {isProprietary ? '--' : (maxGust !== null ? maxGust.toFixed(2) + ' m/s' : '--')}
          </div>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Avg</span>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {isProprietary && avgSpeed !== null && avgSpeed >= 0 && avgSpeed <= 7
              ? `${avgSpeed.toFixed(1)} - ${WIND_LEVEL_MAP[Math.round(avgSpeed)] || 'Desconocido'}`
              : (avgSpeed !== null ? avgSpeed.toFixed(2) + ' m/s' : '--')}
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
