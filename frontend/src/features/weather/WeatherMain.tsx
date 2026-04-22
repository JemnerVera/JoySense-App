import React from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import { TemperatureTile, HumidityTile, WindTile, RainTile, PressureTile, SolarTile, IndoorTile } from './tiles';

export const WeatherMain: React.FC = () => {
  const {
    stations,
    selectedStation,
    setSelectedStation,
    summaryData,
    loading,
    error,
    refreshCurrent,
    refreshSummary,
  } = useWeatherData();

  const handleRefresh = () => {
    refreshCurrent();
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

      {loading && !summaryData ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <TemperatureTile
              temp={summaryData?.temp_out ?? null}
              thw={summaryData?.thw_index ?? null}
              thsw={summaryData?.thsw_index ?? null}
            />
            <HumidityTile
              humidity={summaryData?.hum_out ?? null}
              dewPoint={summaryData?.dew_point ?? null}
            />
            <WindTile
              speed={summaryData?.wind_speed_10_min_avg ?? null}
              direction={summaryData?.wind_dir ?? null}
              gust={summaryData?.wind_gust_10_min ?? null}
            />
            <PressureTile pressure={summaryData?.bar ?? null} />
            <RainTile
              today={summaryData?.rain_day_mm ?? null}
              rate={summaryData?.rain_rate_mm ?? null}
              et={summaryData?.et_day ?? null}
            />
            <SolarTile radiation={summaryData?.solar_rad ?? null} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <IndoorTile
                tempIn={summaryData?.temp_in ?? null}
                humIn={summaryData?.hum_in ?? null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherMain;