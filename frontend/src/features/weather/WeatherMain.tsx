import React, { useState } from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import { WeatherDetailsTab } from './WeatherDetailsTab';
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

type WeatherTab = 'conditions' | 'details';

export const WeatherMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WeatherTab>('conditions');
  
  const {
    stations,
    selectedStation,
    setSelectedStation,
    summaryData,
    openMeteoData,
    moonPhase,
    historical24h,
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

      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab('conditions')}
            className={`py-3 px-1 border-b-2 font-mono text-sm ${
              activeTab === 'conditions'
                ? 'border-gray-800 dark:border-gray-300 text-gray-800 dark:text-gray-200'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Condiciones
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-1 border-b-2 font-mono text-sm ${
              activeTab === 'details'
                ? 'border-gray-800 dark:border-gray-300 text-gray-800 dark:text-gray-200'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Detalles
          </button>
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === 'conditions' ? (
          <ConditionsView 
            summaryData={summaryData}
            openMeteoData={openMeteoData}
            moonPhase={moonPhase}
            loading={loading}
          />
        ) : (
          <WeatherDetailsTab 
            historicalData={historical24h}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

const ConditionsView: React.FC<{
  summaryData: ReturnType<typeof useWeatherData>['summaryData'];
  openMeteoData: ReturnType<typeof useWeatherData>['openMeteoData'];
  moonPhase: ReturnType<typeof useWeatherData>['moonPhase'];
  loading: boolean;
}> = ({ summaryData, openMeteoData, moonPhase, loading }) => {
  if (loading && !summaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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