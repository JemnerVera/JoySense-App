import React from 'react';
import { WeatherGauge, WeatherSparkArea, WeatherMinMaxBar } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface TemperatureTileProps {
  temp: WeatherSummary | null;
  thw: WeatherSummary | null;
  thsw: WeatherSummary | null;
}

export const TemperatureTile: React.FC<TemperatureTileProps> = ({
  temp,
  thw,
  thsw,
}) => {
  const current = temp?.current ?? null;
  const min = temp?.min ?? null;
  const max = temp?.max ?? null;
  const trend = temp?.trend ?? [];
  const thwVal = thw?.current ?? null;
  const thswVal = thsw?.current ?? null;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Temperatura
      </div>
      
      <div className="flex justify-center mb-2">
        <WeatherGauge
          value={current}
          min={0}
          max={40}
          label=" temperatura"
          unit="°C"
          thresholds={{ min: 10, max: 30 }}
          height={100}
        />
      </div>

      <div className="text-center mb-2">
        <span className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">
          {current !== null ? current.toFixed(1) : '--'}
        </span>
        <span className="text-sm font-mono text-gray-500 ml-1">°C</span>
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

      <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
        <div className="text-center">
          <span className="text-gray-500">THW</span>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {thwVal !== null ? thwVal.toFixed(1) + '°C' : '--'}
          </div>
        </div>
        <div className="text-center">
          <span className="text-gray-500">THSW</span>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {thswVal !== null ? thswVal.toFixed(1) + '°C' : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureTile;