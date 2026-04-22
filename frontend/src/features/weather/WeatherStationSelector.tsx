import React from 'react';
import type { WeatherStation } from '../../hooks/useWeatherData';

interface WeatherStationSelectorProps {
  stations: WeatherStation[];
  selectedStation: WeatherStation | null;
  onSelect: (station: WeatherStation | null) => void;
}

export const WeatherStationSelector: React.FC<WeatherStationSelectorProps> = ({
  stations,
  selectedStation,
  onSelect,
}) => {
  return (
    <select
      value={selectedStation?.id || ''}
      onChange={(e) => {
        const station = stations.find(s => s.id === e.target.value) || null;
        onSelect(station);
      }}
      className="h-10 px-3 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 dark:text-white font-mono text-sm hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
    >
      {stations.map((station) => (
        <option key={station.id} value={station.id}>
          {station.name} {station.hasHistoric ? '(+Hist)' : ''}
        </option>
      ))}
    </select>
  );
};