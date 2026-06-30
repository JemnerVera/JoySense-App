import React from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useWeatherResumenData } from '../../hooks/useWeatherResumenData';
import { WeatherWeekYearSlicer } from './components/WeatherWeekYearSlicer';
import { WeatherMetricWeekChart } from './components/WeatherMetricWeekChart';

export const WeatherResumen: React.FC = () => {
  const {
    stations,
    stationsLoading,
    selectedStation,
    setSelectedStation,
  } = useWeatherData();

  const {
    availableMetrics,
    selectedMetricName,
    setSelectedMetricName,
    selectedYear,
    setSelectedYear,
    selectedWeek,
    setSelectedWeek,
    selectedSeries,
    loading,
    error,
    dateRange,
    availableYearsWithData,
    availableWeeksWithData,
    availabilityLoading,
  } = useWeatherResumenData();

  return (
    <div className="w-full flex flex-col bg-gray-50 dark:bg-black" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WeatherWeekYearSlicer
          stations={stations}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
          stationsLoading={stationsLoading}
          availableMetrics={availableMetrics}
          selectedMetricName={selectedMetricName}
          onMetricChange={setSelectedMetricName}
          selectedYear={selectedYear}
          selectedWeek={selectedWeek}
          onYearChange={setSelectedYear}
          onWeekChange={setSelectedWeek}
          availableYearsWithData={availableYearsWithData}
          availableWeeksWithData={availableWeeksWithData}
          availabilityLoading={availabilityLoading}
        />

        <div className="flex-1 min-h-0 min-w-0 flex flex-col mx-6 mb-6 mt-6">
          {loading && (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && !selectedStation && (
            <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center flex-1 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona una estación del panel izquierdo
              </p>
            </div>
          )}

          {!loading && !error && selectedStation && !selectedMetricName && (
            <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center flex-1 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona una métrica del panel izquierdo
              </p>
            </div>
          )}

          {!loading && !error && selectedStation && selectedMetricName && !selectedSeries && (
            <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center flex-1 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">
                No hay datos disponibles para la semana seleccionada
              </p>
            </div>
          )}

          {!loading && selectedSeries && (
            <WeatherMetricWeekChart
              series={selectedSeries}
              weekRange={dateRange.formatted}
              stationName={selectedStation?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};
