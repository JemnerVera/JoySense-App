import { useState, useEffect, useCallback } from 'react';
import SupabaseRPCService from '../services/supabase-rpc';

export interface WeatherStation {
  id: string;
  name: string;
  nodoid: number;
  hasHistoric: boolean;
  latitude: number;
  longitude: number;
}

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
  stationsLoading: boolean;
  selectedStation: WeatherStation | null;
  setSelectedStation: (station: WeatherStation | null) => void;
  currentData: WeatherCurrentData;
  summaryData: WeatherSummaryData | null;
  historical24h: WeatherMedicionData[];
  openMeteoData: OpenMeteoData | null;
  moonPhase: { phase: string; icon: string; name: string };
  loading: boolean;
  error: string | null;
  refreshCurrent: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  refreshHistorical: (startDate: string, endDate: string) => Promise<void>;
  refreshOpenMeteo: () => Promise<void>;
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

export interface OpenMeteoData {
  sunrise: string;
  sunset: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  hourlyTemp: number[];
  hourlyHumidity: number[];
  hourlyWindSpeed: number[];
  hourlyWindDir: number[];
}

export const fetchOpenMeteo = async (latitude: number, longitude: number): Promise<OpenMeteoData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    sunrise: data.daily.sunrise[0] || '',
    sunset: data.daily.sunset[0] || '',
    weatherCode: data.daily.weather_code[0] || 0,
    tempMax: data.daily.temperature_2m_max[0] || 0,
    tempMin: data.daily.temperature_2m_min[0] || 0,
    hourlyTemp: data.hourly.temperature_2m?.slice(0, 24) || [],
    hourlyHumidity: data.hourly.relative_humidity_2m?.slice(0, 24) || [],
    hourlyWindSpeed: data.hourly.wind_speed_10m?.slice(0, 24) || [],
    hourlyWindDir: data.hourly.wind_direction_10m?.slice(0, 24) || [],
  };
};

export const getMoonPhase = (): { phase: string; icon: string; name: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  let c = 0, e = 0, jd = 0, jd1 = 0, b = 0;
  
  if (month <= 2) {
    c = year - 1;
    e = month + 12;
  } else {
    c = year;
    e = month;
  }
  
  jd = Math.floor(365.25 * (c + 4716)) + Math.floor(30.6001 * (e + 1)) + day - 1524.5;
  jd1 = Math.floor(365.25 * (c + 4716)) + Math.floor(30.6001 * (e + 1)) + 1 - 1524.5;
  b = Math.floor((jd - 2451545) / 365.25);
  
  const daysSinceNew = jd - 2451545 - (b * 365.25);
  const newMoons = daysSinceNew / 29.530588853;
  const phase = (newMoons % 1) * 29.530588853;
  
  const phases = [
    { day: 0, name: 'Luna Nueva', icon: '🌑' },
    { day: 1.85, name: 'Cuarto Creciente', icon: '🌓' },
    { day: 7.38, name: 'Luna Gibosa Creciente', icon: '🌒' },
    { day: 9.23, name: 'Luna Llena', icon: '🌕' },
    { day: 14.77, name: 'Luna Gibosa Menguante', icon: '🌖' },
    { day: 16.61, name: 'Cuarto Menguante', icon: '🌗' },
    { day: 22.14, name: 'Luna Creciente Menguante', icon: '🌘' },
    { day: 23.98, name: 'Luna Nueva', icon: '🌑' },
  ];
  
  for (let i = 0; i < phases.length - 1; i++) {
    if (phase >= phases[i].day && phase < phases[i + 1].day) {
      return { phase: phase.toFixed(1), icon: phases[i].icon, name: phases[i].name };
    }
  }
  return { phase: phase.toFixed(1), icon: '🌑', name: 'Luna Nueva' };
};

export const getWeatherDescription = (code: number): string => {
  const codes: Record<number, string> = {
    0: 'Cielo despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna densa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia fuerte',
    71: 'Nieve ligera',
    73: 'Nieve moderada',
    75: 'Nieve fuerte',
    80: 'Chubascos ligeros',
    81: 'Chubascos moderados',
    82: 'Chubascos fuertes',
    95: 'Tormenta',
    96: 'Tormenta con granizo',
    99: 'Tormenta fuerte',
  };
  return codes[code] || 'Desconocido';
};

export const getWeatherIcon = (code: number): string => {
  const icons: Record<number, string> = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌧️',
    53: '🌧️',
    55: '🌧️',
    61: '🌧️',
    63: '🌧️',
    65: '🌧️',
    71: '❄️',
    73: '❄️',
    75: '❄️',
    80: '🌦️',
    81: '🌦️',
    82: '🌦️',
    95: '⛈️',
    96: '⛈️',
    99: '⛈️',
  };
  return icons[code] || '🌡️';
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

export function useWeatherData(): UseWeatherDataResult {
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [currentData, setCurrentData] = useState<WeatherCurrentData>({});
  const [summaryData, setSummaryData] = useState<WeatherSummaryData | null>(null);
  const [historical24h, setHistorical24h] = useState<WeatherMedicionData[]>([]);
  const [openMeteoData, setOpenMeteoData] = useState<OpenMeteoData | null>(null);
  const [moonPhase, setMoonPhase] = useState<{ phase: string; icon: string; name: string }>({ phase: '0', icon: '🌑', name: 'Luna Nueva' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days'>('today');

  // Cargar estaciones dinámicamente
  useEffect(() => {
    const loadStations = async () => {
      try {
        setStationsLoading(true);
        const data = await SupabaseRPCService.getWeatherStations();
        setStations(data);
        if (data.length > 0 && !selectedStation) {
          setSelectedStation(data[0]);
        }
      } catch (err) {
        console.error('[useWeatherData] Error cargando estaciones:', err);
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

  const refreshOpenMeteo = useCallback(async () => {
    if (!selectedStation) return;
    
    try {
      const data = await fetchOpenMeteo(selectedStation.latitude, selectedStation.longitude);
      setOpenMeteoData(data);
      setMoonPhase(getMoonPhase());
    } catch (err: any) {
      console.error('[useWeatherData] Error fetching OpenMeteo:', err);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (selectedStation) {
      refreshCurrent();
      refreshSummary();
      refreshOpenMeteo();
    }
  }, [selectedStation, refreshCurrent, refreshSummary, refreshOpenMeteo]);

  return {
    stations,
    stationsLoading,
    selectedStation,
    setSelectedStation,
    currentData,
    summaryData,
    historical24h,
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
  };
}