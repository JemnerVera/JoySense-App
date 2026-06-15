import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import SupabaseRPCService from '../services/supabase-rpc';
import {
  WeatherStation,
  WeatherCurrentData,
  WeatherSummaryData,
  WeatherMedicionData,
  OpenMeteoData,
  UseWeatherDataResult,
  calculateSummary,
  buildAvailableMetrics,
  fetchOpenMeteo,
  getMoonPhase,
} from '../hooks/useWeatherData';

const WeatherContext = createContext<UseWeatherDataResult | undefined>(undefined);

const getWindDirection = (degrees: number | null): string => {
  if (degrees === null) return '--';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getDateRangeParams = (range: 'today' | 'yesterday' | '7days') => {
  const now = new Date();
  const limaOffset = -5;
  const limaNow = new Date(now.getTime() + limaOffset * 60 * 60 * 1000);

  const startDate = new Date(limaNow);
  const endDate = new Date(limaNow);

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7days':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
};

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [currentData, setCurrentData] = useState<WeatherCurrentData>({});
  const [summaryData, setSummaryData] = useState<WeatherSummaryData | null>(null);
  const [historical24h, setHistorical24h] = useState<WeatherMedicionData[]>([]);
  const [openMeteoData, setOpenMeteoData] = useState<OpenMeteoData | null>(null);
  const [moonPhase, setMoonPhase] = useState<{ phase: string; icon: string; name: string }>({
    phase: '0',
    icon: '🌑',
    name: 'Luna Nueva',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days'>('today');

  useEffect(() => {
    const loadStations = async () => {
      try {
        setStationsLoading(true);
        const data = await SupabaseRPCService.getWeatherStations();
        setStations(data);
        if (data.length > 0) {
          setSelectedStation((prev) => prev ?? data[0]);
        }
      } catch (err) {
        console.error('[WeatherContext] Error cargando estaciones:', err);
      } finally {
        setStationsLoading(false);
      }
    };
    loadStations();
  }, []);

  const refreshCurrent = useCallback(async () => {
    if (!selectedStation) return;

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRangeParams('today');

      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedStation.nodoid,
        startDate,
        endDate,
      });

      const currentMap: WeatherCurrentData = {};

      for (const item of data) {
        const metricName = item.metrica_nombre;
        if (metricName && !currentMap[metricName]) {
          currentMap[metricName] = {
            value: item.medicion,
            unit: item.unidad,
            timestamp: item.fecha,
          };
        }
      }

      setCurrentData(currentMap);
    } catch (err: any) {
      console.error('[WeatherContext] Error refreshing current:', err);
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  const refreshSummary = useCallback(async () => {
    if (!selectedStation) return;

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRangeParams('7days');

      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedStation.nodoid,
        startDate,
        endDate,
      });

      setSummaryData({
        temp_out: calculateSummary(data, 'temp_out'),
        hum_out: calculateSummary(data, 'hum_out'),
        dew_point: calculateSummary(data, 'dew_point'),
        wind_speed_10_min_avg: calculateSummary(data, 'wind_speed_10_min_avg'),
        wind_speed_max: calculateSummary(data, 'wind_speed_max'),
        wind_dir: {
          current: data.find((d) => d.metrica_nombre === 'wind_dir')?.medicion ?? null,
          direction: getWindDirection(
            data.find((d) => d.metrica_nombre === 'wind_dir')?.medicion ?? null
          ),
        },
        wind_gust_10_min: calculateSummary(data, 'wind_gust_10_min'),
        rain_day_mm: calculateSummary(data, 'rain_day_mm'),
        rain_rate_mm: calculateSummary(data, 'rain_rate_mm'),
        solar_rad: calculateSummary(data, 'solar_rad'),
        bar: calculateSummary(data, 'bar'),
        et_day: calculateSummary(data, 'et_day'),
        thw_index: calculateSummary(data, 'thw_index'),
        thsw_index: calculateSummary(data, 'thsw_index'),
        temp_in: calculateSummary(data, 'temp_in'),
        hum_in: calculateSummary(data, 'hum_in'),
      });

      setHistorical24h(data);
    } catch (err: any) {
      console.error('[WeatherContext] Error refreshing summary:', err);
      setError(err.message || 'Error cargando resumen');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  const refreshHistorical = useCallback(async (startDate: string, endDate: string) => {
    if (!selectedStation) return;

    setLoading(true);
    setError(null);

    try {
      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedStation.nodoid,
        startDate,
        endDate,
      });

      setHistorical24h((data as WeatherMedicionData[]) || []);
    } catch (err: any) {
      console.error('[WeatherContext] Error refreshing historical:', err);
      setError(err.message || 'Error cargando datos históricos');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  const refreshOpenMeteo = useCallback(async () => {
    if (!selectedStation) return;

    try {
      const data = await fetchOpenMeteo(selectedStation.latitude, selectedStation.longitude);
      setOpenMeteoData(data);
      setMoonPhase(getMoonPhase());
    } catch (err: any) {
      console.error('[WeatherContext] Error fetching OpenMeteo:', err);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (selectedStation) {
      refreshCurrent();
      refreshSummary();
      refreshOpenMeteo();
    }
  }, [selectedStation, refreshCurrent, refreshSummary, refreshOpenMeteo]);

  const availableMetricNames = useMemo(
    () => buildAvailableMetrics(historical24h, summaryData),
    [historical24h, summaryData]
  );

  const value = useMemo<UseWeatherDataResult>(
    () => ({
      stations,
      stationsLoading,
      selectedStation,
      setSelectedStation,
      currentData,
      summaryData,
      historical24h,
      availableMetricNames,
      openMeteoData,
      moonPhase,
      loading,
      error,
      refreshCurrent,
      refreshSummary,
      refreshHistorical,
      refreshOpenMeteo,
      dateRange,
      setDateRange,
    }),
    [
      stations,
      stationsLoading,
      selectedStation,
      currentData,
      summaryData,
      historical24h,
      availableMetricNames,
      openMeteoData,
      moonPhase,
      loading,
      error,
      refreshCurrent,
      refreshSummary,
      refreshHistorical,
      refreshOpenMeteo,
      dateRange,
    ]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
};

export function useWeatherContext(): UseWeatherDataResult {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeatherContext must be used within a WeatherProvider');
  }
  return context;
}

export function useWeatherData(): UseWeatherDataResult {
  return useWeatherContext();
}
