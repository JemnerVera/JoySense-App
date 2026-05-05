import React, { useRef } from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import { WeatherDetailsTab } from './WeatherDetailsTab';
import { useExportPDF } from '../../hooks/useExportPDF';

export const WeatherDetailsPage: React.FC = () => {
  const {
    stations,
    stationsLoading,
    selectedStation,
    setSelectedStation,
    historical24h,
    loading,
    error,
    refreshSummary,
  } = useWeatherData();

  const contentRef = useRef<HTMLDivElement>(null);
  const stationName = selectedStation?.name || 'Estacion';
  
  const { exportToPDF, exportToImage, exporting } = useExportPDF({ stationName });

  const handleRefresh = () => {
    refreshSummary();
  };

  if (stationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">Cargando estaciones...</span>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No hay estaciones meteorológicas configuradas</p>
      </div>
    );
  }

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
          
          <button
            onClick={() => contentRef.current && exportToPDF(contentRef, { title: `Meteorología - ${stationName}` })}
            disabled={exporting}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
            title="Exportar PDF"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={() => contentRef.current && exportToImage(contentRef)}
            disabled={exporting}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
            title="Exportar Imagen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div ref={contentRef}>
        <WeatherDetailsTab 
          historicalData={historical24h}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default WeatherDetailsPage;