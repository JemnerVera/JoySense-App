import React from 'react';
import { WeatherGauge, WeatherSparkArea, WeatherMinMaxBar } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface TemperatureTileProps {
  temp: WeatherSummary | null;
}

export const TemperatureTile: React.FC<TemperatureTileProps> = ({ temp }) => {
  const current = temp?.current ?? null;
  const min = temp?.min ?? null;
  const max = temp?.max ?? null;
  const trend = temp?.trend ?? [];

return (
    <div className="weather-tile">
      <div className="weather-tile-header">Temperatura</div>
      
      <div className="flex justify-center mb-2">
        <WeatherGauge
          value={current}
          min={0}
          max={40}
          label=""
          unit="°C"
          thresholds={{ min: 10, max: 30 }}
          height={100}
        />
      </div>

      <div className="text-center mb-2">
        <span className="weather-tile-value">
          {current !== null ? current.toFixed(2) : '--'}
        </span>
        <span className="weather-tile-value-unit">°C</span>
      </div>

      <WeatherMinMaxBar
        current={current}
        min={min}
        max={max}
        unit="°C"
        label="24h"
        height={50}
      />

      <div className="mt-2">
        <WeatherSparkArea data={trend} color="#ef4444" height={30} />
      </div>
    </div>
  );
};

export default TemperatureTile;