import React from 'react';
import { WeatherSparkArea } from '../components';
import { WeatherSummary } from '../../../hooks/useWeatherData';

interface IndoorTileProps {
  tempIn: WeatherSummary | null;
  humIn: WeatherSummary | null;
}

export const IndoorTile: React.FC<IndoorTileProps> = ({ tempIn, humIn }) => {
  const temp = tempIn?.current ?? null;
  const hum = humIn?.current ?? null;
  const tempTrend = tempIn?.trend ?? [];
  const humTrend = humIn?.trend ?? [];

  return (
    <div className="weather-tile">
      <div className="weather-tile-header">Interior</div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center">
          <div className="text-xs font-mono text-gray-500 mb-1">Temperatura</div>
          <div className="weather-tile-value">
            {temp !== null ? temp.toFixed(2) : '--'}
          </div>
          <span className="weather-tile-value-unit">°C</span>
        </div>
        
        <div className="text-center">
          <div className="text-xs font-mono text-gray-500 mb-1">Humedad</div>
          <div className="weather-tile-value">
            {hum !== null ? hum.toFixed(0) : '--'}
          </div>
          <span className="weather-tile-value-unit">%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <div className="text-xs font-mono text-gray-500 mb-1">Tendencia Temp</div>
          <WeatherSparkArea data={tempTrend} color="#f97316" height={25} />
        </div>
        <div className="text-center">
          <div className="text-xs font-mono text-gray-500 mb-1">Tendencia Hum</div>
          <WeatherSparkArea data={humTrend} color="#3b82f6" height={25} />
        </div>
      </div>
    </div>
  );
};

export default IndoorTile;