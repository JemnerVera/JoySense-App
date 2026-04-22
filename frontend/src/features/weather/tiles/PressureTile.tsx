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
    <div className="weather-tile">
      <div className="weather-tile-header">Presión</div>
      
      <div className="flex justify-center mb-2">
        <WeatherGauge
          value={current}
          min={980}
          max={1040}
          label=""
          unit="hPa"
          thresholds={{ min: 1000, max: 1020 }}
          height={100}
        />
      </div>

      <div className="text-center mb-2">
        <span className="weather-tile-value">
          {current !== null ? current.toFixed(0) : '--'}
        </span>
        <span className="weather-tile-value-unit">hPa</span>
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