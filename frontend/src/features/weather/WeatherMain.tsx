import React, { useState } from 'react';
import { useWeatherData, WEATHER_STATIONS, METRIC_DISPLAY_NAMES, METRIC_ICONS } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import { WeatherMetricCard } from './WeatherMetricCard';

type WeatherTab = 'current' | 'historical';

const WeatherCurrentView: React.FC<{
  currentData: Record<string, { value: number | null; unit: string; timestamp: string | null }>;
  loading: boolean;
}> = ({ currentData, loading }) => {
  const displayMetrics = [
    { key: 'temp_out', label: 'Temperatura', unit: '°C' },
    { key: 'hum_out', label: 'Humedad', unit: '%' },
    { key: 'dew_point', label: 'Punto de rocío', unit: '°C' },
    { key: 'wind_speed_10_min_avg', label: 'Viento avg', unit: 'm/s' },
    { key: 'wind_dir', label: 'Dirección', unit: '°' },
    { key: 'wind_gust_10_min', label: 'Ráfaga', unit: 'm/s' },
    { key: 'rain_day_mm', label: 'Lluvia día', unit: 'mm' },
    { key: 'rain_rate_mm', label: 'Intensidad', unit: 'mm/h' },
    { key: 'solar_rad', label: 'Radiación solar', unit: 'W/m²' },
    { key: 'bar', label: 'Presión', unit: 'hPa' },
    { key: 'heat_index', label: 'Índice calor', unit: '°C' },
    { key: 'wind_chill', label: 'Sensación térmica', unit: '°C' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const lastUpdate = Object.values(currentData)[0]?.timestamp 
    ? new Date(Object.values(currentData)[0].timestamp!).toLocaleString('es-PE', { 
        timeZone: 'America/Lima',
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : null;

  return (
    <div className="space-y-4">
      {lastUpdate && (
        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          Última actualización: {lastUpdate}
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayMetrics.map(({ key, label, unit }) => {
          const data = currentData[key];
          return (
            <WeatherMetricCard
              key={key}
              label={label}
              value={data?.value ?? null}
              unit={unit}
              icon={METRIC_ICONS[key.split('_')[0] || 'temperature']}
            />
          );
        })}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Interior</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['temp_in', 'hum_in'].map(key => {
            const data = currentData[key];
            const altKey = key === 'temp_in' ? 'temp_in' : 'hum_in';
            const displayKey = key === 'temp_in' ? 'temp_in' : 'hum_in';
            const label = key === 'temp_in' ? 'Temperatura' : 'Humedad';
            const u = key === 'temp_in' ? '°C' : '%';
            return (
              <WeatherMetricCard
                key={key}
                label={label}
                value={data?.value ?? null}
                unit={u}
                variant="secondary"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const WeatherHistoricalView: React.FC<{
  selectedStation: { nodoid: number; name: string } | null;
  loading: boolean;
  onDateRangeChange: (range: 'today' | 'yesterday' | '7days') => void;
  dateRange: 'today' | 'yesterday' | '7days';
}> = ({ selectedStation, loading, onDateRangeChange, dateRange }) => {
  if (!selectedStation) {
    return (
      <div className="text-center py-12 text-gray-500">
        Selecciona una estación para ver datos históricos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['today', 'yesterday', '7days'] as const).map((range) => (
          <button
            key={range}
            onClick={() => onDateRangeChange(range)}
            className={`px-4 py-2 rounded font-mono text-sm ${
              dateRange === range
                ? 'bg-gray-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {range === 'today' ? 'Hoy' : range === 'yesterday' ? 'Ayer' : '7 días'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Estación: {selectedStation.name}</p>
          <p className="mt-2">Gráficos históricos en desarrollo</p>
        </div>
      )}
    </div>
  );
};

export const WeatherMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WeatherTab>('current');
  const {
    stations,
    selectedStation,
    setSelectedStation,
    currentData,
    loading,
    error,
    refreshCurrent,
    dateRange,
    setDateRange,
  } = useWeatherData();

  const handleRefresh = () => {
    refreshCurrent();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <WeatherStationSelector
            stations={stations}
            selectedStation={selectedStation}
            onSelect={setSelectedStation}
          />
          
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

      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-3 px-1 border-b-2 font-mono text-sm ${
              activeTab === 'current'
                ? 'border-gray-800 dark:border-gray-300 text-gray-800 dark:text-gray-200'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Condiciones Actuales
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`py-3 px-1 border-b-2 font-mono text-sm ${
              activeTab === 'historical'
                ? 'border-gray-800 dark:border-gray-300 text-gray-800 dark:text-gray-200'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Histórico
          </button>
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === 'current' ? (
          <WeatherCurrentView currentData={currentData} loading={loading} />
        ) : (
          <WeatherHistoricalView
            selectedStation={selectedStation}
            loading={loading}
            onDateRangeChange={setDateRange}
            dateRange={dateRange}
          />
        )}
      </div>
    </div>
  );
};

export default WeatherMain;