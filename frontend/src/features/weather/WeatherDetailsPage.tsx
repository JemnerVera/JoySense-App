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
            className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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