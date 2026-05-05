import React from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import { 
  TemperatureTile, 
  HumidityTile, 
  WindTile, 
  RainTile, 
  PressureTile, 
  SolarTile, 
  IndoorTile,
  SunTimesTile,
  ForecastTile,
  MoonPhaseTile,
  WindRoseTile,
  IndexTile,
  TempBarChartTile
} from './tiles';

export const WeatherMain: React.FC = () => {
  const {
    stations,
    stationsLoading,
    selectedStation,
    setSelectedStation,
    summaryData,
    openMeteoData,
    moonPhase,
    loading,
    error,
    refreshCurrent,
    refreshSummary,
    refreshOpenMeteo,
  } = useWeatherData();

  const handleRefresh = () => {
    refreshCurrent();
    refreshSummary();
    refreshOpenMeteo();
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

  if (loading && !summaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <TemperatureTile temp={summaryData?.temp_out ?? null} />
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
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <RainTile
          today={summaryData?.rain_day_mm ?? null}
          rate={summaryData?.rain_rate_mm ?? null}
          et={summaryData?.et_day ?? null}
        />
        <SolarTile radiation={summaryData?.solar_rad ?? null} />
        <IndoorTile
          tempIn={summaryData?.temp_in ?? null}
          humIn={summaryData?.hum_in ?? null}
        />
        <SunTimesTile 
          sunrise={openMeteoData?.sunrise ?? ''} 
          sunset={openMeteoData?.sunset ?? ''} 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <IndexTile label="THW" value={summaryData?.thw_index ?? null} />
        <IndexTile label="THSW" value={summaryData?.thsw_index ?? null} />
        <ForecastTile 
          weatherCode={openMeteoData?.weatherCode ?? 0}
          tempMax={openMeteoData?.tempMax ?? null}
          tempMin={openMeteoData?.tempMin ?? null}
        />
        <MoonPhaseTile 
          phase={moonPhase.phase}
          icon={moonPhase.icon}
          name={moonPhase.name}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <WindRoseTile 
          windDir={openMeteoData?.hourlyWindDir ?? []}
          windSpeed={openMeteoData?.hourlyWindSpeed ?? []}
        />
        <TempBarChartTile 
          tempOutTrend={summaryData?.temp_out?.trend ?? []}
          tempInTrend={summaryData?.temp_in?.trend ?? []}
          dewPointTrend={summaryData?.dew_point?.trend ?? []}
        />
      </div>
    </div>
  );
};

export default WeatherMain;