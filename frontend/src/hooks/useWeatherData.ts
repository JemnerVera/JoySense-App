import { useState, useEffect, useCallback } from 'react';
import SupabaseRPCService from '../services/supabase-rpc';

export interface WeatherStation {
  id: string;
  name: string;
  nodoid: number;
  localizacionStart: number;
  localizacionEnd: number;
  hasHistoric: boolean;
}

export interface WeatherMetric {
  id: number;
  name: string;
  unit: string;
  localizacionid: number;
  category: 'temperature' | 'humidity' | 'wind' | 'rain' | 'solar' | 'pressure' | 'index';
}

export const WEATHER_STATIONS: WeatherStation[] = [
  { id: '34651', name: 'D3 FUNDO CALIFORNIA', nodoid: 848, localizacionStart: 2027, localizacionEnd: 2055, hasHistoric: true },
  { id: '91399', name: 'D2 FUNDO CALIFORNIA', nodoid: 849, localizacionStart: 2056, localizacionEnd: 2070, hasHistoric: false },
  { id: '94218', name: 'D1 FUNDO CALIFORNIA', nodoid: 850, localizacionStart: 2071, localizacionEnd: 2085, hasHistoric: false },
  { id: '219179', name: 'ARENUVA Home', nodoid: 851, localizacionStart: 2086, localizacionEnd: 2126, hasHistoric: true },
];

export const WEATHER_METRICS: WeatherMetric[] = [
  { id: 14, name: 'temp_out', unit: '°C', localizacionid: 2027, category: 'temperature' },
  { id: 15, name: 'hum_out', unit: '%', localizacionid: 2028, category: 'humidity' },
  { id: 16, name: 'dew_point', unit: '°C', localizacionid: 2029, category: 'temperature' },
  { id: 26, name: 'temp_in', unit: '°C', localizacionid: 2030, category: 'temperature' },
  { id: 27, name: 'hum_in', unit: '%', localizacionid: 2031, category: 'humidity' },
  { id: 17, name: 'wind_speed_10_min_avg', unit: 'm/s', localizacionid: 2032, category: 'wind' },
  { id: 18, name: 'wind_dir', unit: '°', localizacionid: 2033, category: 'wind' },
  { id: 19, name: 'wind_gust_10_min', unit: 'm/s', localizacionid: 2034, category: 'wind' },
  { id: 23, name: 'rain_day_mm', unit: 'mm', localizacionid: 2035, category: 'rain' },
  { id: 24, name: 'rain_rate_mm', unit: 'mm/h', localizacionid: 2036, category: 'rain' },
  { id: 25, name: 'solar_rad', unit: 'W/m²', localizacionid: 2037, category: 'solar' },
  { id: 22, name: 'bar', unit: 'hPa', localizacionid: 2038, category: 'pressure' },
  { id: 28, name: 'et_day', unit: 'mm', localizacionid: 2039, category: 'rain' },
  { id: 20, name: 'wind_chill', unit: '°C', localizacionid: 2040, category: 'index' },
  { id: 21, name: 'heat_index', unit: '°C', localizacionid: 2041, category: 'index' },
  { id: 34, name: 'thw_index', unit: '°C', localizacionid: 2042, category: 'index' },
  { id: 35, name: 'thsw_index', unit: '°C', localizacionid: 2043, category: 'index' },
];

export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  temp_out: 'Temperatura',
  hum_out: 'Humedad',
  dew_point: 'Punto de rocío',
  temp_in: 'Temperatura interior',
  hum_in: 'Humedad interior',
  wind_speed_10_min_avg: 'Velocidad viento',
  wind_dir: 'Dirección viento',
  wind_gust_10_min: 'Ráfaga viento',
  rain_day_mm: 'Lluvia día',
  rain_rate_mm: 'Intensidad lluvia',
  solar_rad: 'Radiación solar',
  bar: 'Presión atmosférica',
  et_day: 'ET día',
  wind_chill: 'Sensación térmica',
  heat_index: 'Índice de calor',
  thw_index: 'Índice THW',
  thsw_index: 'Índice THSW',
};

export const METRIC_ICONS: Record<string, string> = {
  temperature: '🌡️',
  humidity: '💧',
  wind: '💨',
  rain: '🌧️',
  solar: '☀️',
  pressure: '📊',
  index: '📈',
};

export interface UseWeatherDataResult {
  stations: WeatherStation[];
  selectedStation: WeatherStation | null;
  setSelectedStation: (station: WeatherStation | null) => void;
  currentData: WeatherCurrentData;
  summaryData: WeatherSummaryData | null;
  historical24h: WeatherMedicionData[];
  loading: boolean;
  error: string | null;
  refreshCurrent: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  refreshHistorical: (startDate: string, endDate: string) => Promise<void>;
  dateRange: 'today' | 'yesterday' | '7days';
  setDateRange: (range: 'today' | 'yesterday' | '7days') => void;
}

const getWindDirection = (degrees: number | null): string => {
  if (degrees === null) return '--';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const calculateSummary = (data: WeatherMedicionData[], metricName: string): WeatherSummary => {
  const values = data
    .filter(d => d.metrica_nombre === metricName && d.medicion !== null)
    .map(d => d.medicion)
    .filter(v => v !== null) as number[];

  if (values.length === 0) {
    return { current: null, min: null, max: null, avg: null, trend: [] };
  }

  const current = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const trend = values.slice(-24); // últimos 24 puntos

  return { current, min, max, avg, trend };
};

export const calculateWindSummary = (data: WeatherMedicionData[]): { speed: WeatherSummary; dir: { current: number | null; direction: string }; gust: WeatherSummary } => {
  const speedData = calculateSummary(data, 'wind_speed_10_min_avg');
  const gustData = calculateSummary(data, 'wind_gust_10_min');
  
  const dirValues = data
    .filter(d => d.metrica_nombre === 'wind_dir' && d.medicion !== null)
    .map(d => d.medicion);
  const dirCurrent = dirValues.length > 0 ? dirValues[dirValues.length - 1] : null;

  return {
    speed: speedData,
    dir: { current: dirCurrent, direction: getWindDirection(dirCurrent) },
    gust: gustData,
  };
};

export interface WeatherCurrentData {
  [metricName: string]: {
    value: number | null;
    unit: string;
    timestamp: string | null;
  };
}

export interface WeatherSummary {
  current: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  trend: number[];
}

export interface WeatherSummaryData {
  temp_out: WeatherSummary;
  hum_out: WeatherSummary;
  dew_point: WeatherSummary;
  wind_speed_10_min_avg: WeatherSummary;
  wind_speed_max: WeatherSummary;
  wind_dir: { current: number | null; direction: string };
  wind_gust_10_min: WeatherSummary;
  rain_day_mm: WeatherSummary;
  rain_rate_mm: WeatherSummary;
  solar_rad: WeatherSummary;
  bar: WeatherSummary;
  et_day: WeatherSummary;
  thw_index: WeatherSummary;
  thsw_index: WeatherSummary;
  temp_in: WeatherSummary;
  hum_in: WeatherSummary;
}

export interface WeatherMedicionData {
  medicionid: number;
  localizacionid: number;
  localizacion_nombre: string;
  fecha: string;
  medicion: number;
  es_agregada: boolean;
  metricaid: number;
  metrica_nombre: string;
  unidad: string;
  sensorid: number;
  sensor_nombre: string;
  tipoid: number;
  tipo_nombre: string;
}

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

export function useWeatherData(): UseWeatherDataResult {
  const [stations] = useState<WeatherStation[]>(WEATHER_STATIONS);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(WEATHER_STATIONS[0]);
  const [currentData, setCurrentData] = useState<WeatherCurrentData>({});
  const [summaryData, setSummaryData] = useState<WeatherSummaryData | null>(null);
  const [historical24h, setHistorical24h] = useState<WeatherMedicionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days'>('today');

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
      console.error('[useWeatherData] Error refreshing current:', err);
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
          current: data.find(d => d.metrica_nombre === 'wind_dir')?.medicion ?? null,
          direction: getWindDirection(data.find(d => d.metrica_nombre === 'wind_dir')?.medicion ?? null)
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
      console.error('[useWeatherData] Error refreshing summary:', err);
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
      
      setHistorical24h(data as WeatherMedicionData[] || []);
    } catch (err: any) {
      console.error('[useWeatherData] Error refreshing historical:', err);
      setError(err.message || 'Error cargando datos históricos');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (selectedStation) {
      refreshCurrent();
      refreshSummary();
    }
  }, [selectedStation, refreshCurrent, refreshSummary]);

  return {
    stations,
    selectedStation,
    setSelectedStation,
    currentData,
    summaryData,
    historical24h,
    loading,
    error,
    refreshCurrent,
    refreshSummary,
    refreshHistorical,
    dateRange,
    setDateRange,
  };
}