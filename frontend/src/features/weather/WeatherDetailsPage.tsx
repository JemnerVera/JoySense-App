import React from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import { WeatherDetailsTab } from './WeatherDetailsTab';

export const WeatherDetailsPage: React.FC = () => {
  const {
    stations,
    selectedStation,
    setSelectedStation,
    historical24h,
    loading,
    error,
    refreshSummary,
  } = useWeatherData();

  const handleRefresh = () => {
    refreshSummary();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <WeatherStationSelector
          stations={stations}
          selectedStation={selectedStation}
          onSelect={setSelectedStation}
        />
        
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-mono text-sm disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <WeatherDetailsTab 
        historicalData={historical24h}
        loading={loading}
      />
    </div>
  );
};

export default WeatherDetailsPage;