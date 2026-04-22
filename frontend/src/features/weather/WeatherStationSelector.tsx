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
      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
      {stations.map((station) => (
        <option key={station.id} value={station.id}>
          {station.name} {station.hasHistoric ? '(+Hist)' : ''}
        </option>
      ))}
    </select>
  );
};