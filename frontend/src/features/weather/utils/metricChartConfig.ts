export type AccumType = 'cumsum' | 'moving_avg' | null;

export interface MetricChartConfig {
  label: string;
  unit: string;
  color: string;
  decimals: number;
  accumType: AccumType;
}

export const METRIC_CHART_CONFIG: Record<string, MetricChartConfig> = {
  // Acumulado (cumsum): lluvia, ET, energía solar
  rain_day_mm: {
    label: 'Lluvia',
    unit: 'mm',
    color: '#3b82f6',
    decimals: 2,
    accumType: 'cumsum',
  },
  rainfall_mm: {
    label: 'Lluvia',
    unit: 'mm',
    color: '#3b82f6',
    decimals: 2,
    accumType: 'cumsum',
  },
  et_day: {
    label: 'ET',
    unit: 'mm',
    color: '#22c55e',
    decimals: 2,
    accumType: 'cumsum',
  },
  solar_energy: {
    label: 'Energía Solar',
    unit: 'MJ/m²',
    color: '#eab308',
    decimals: 2,
    accumType: 'cumsum',
  },
  deg_days_heat: {
    label: 'Grados-día Calor',
    unit: '°C',
    color: '#ef4444',
    decimals: 1,
    accumType: 'cumsum',
  },
  deg_days_cool: {
    label: 'Grados-día Frío',
    unit: '°C',
    color: '#0ea5e9',
    decimals: 1,
    accumType: 'cumsum',
  },
  gdd: {
    label: 'GDD',
    unit: '°C·día',
    color: '#e67e22',
    decimals: 1,
    accumType: 'cumsum',
  },

  // Media móvil: temperatura, índices de confort, presión
  temp_out: {
    label: 'Temperatura Exterior',
    unit: '°C',
    color: '#ef4444',
    decimals: 1,
    accumType: 'moving_avg',
  },
  temp_in: {
    label: 'Temperatura Interior',
    unit: '°C',
    color: '#f97316',
    decimals: 1,
    accumType: 'moving_avg',
  },
  temp_out_avg: {
    label: 'Temperatura Promedio',
    unit: '°C',
    color: '#ea580c',
    decimals: 1,
    accumType: 'moving_avg',
  },
  dew_point: {
    label: 'Punto Rocío',
    unit: '°C',
    color: '#06b6d4',
    decimals: 1,
    accumType: 'moving_avg',
  },
  wind_chill: {
    label: 'Wind Chill',
    unit: '°C',
    color: '#60a5fa',
    decimals: 1,
    accumType: 'moving_avg',
  },
  heat_index: {
    label: 'Heat Index',
    unit: '°C',
    color: '#f87171',
    decimals: 1,
    accumType: 'moving_avg',
  },
  thw_index: {
    label: 'THW',
    unit: '°C',
    color: '#a855f7',
    decimals: 1,
    accumType: 'moving_avg',
  },
  thsw_index: {
    label: 'THSW',
    unit: '°C',
    color: '#ec4899',
    decimals: 1,
    accumType: 'moving_avg',
  },
  bar: {
    label: 'Presión',
    unit: 'hPa',
    color: '#9333ea',
    decimals: 0,
    accumType: 'moving_avg',
  },

  // Sin segundo gráfico (null)
  hum_out: {
    label: 'Humedad Exterior',
    unit: '%',
    color: '#0ea5e9',
    decimals: 0,
    accumType: null,
  },
  hum_in: {
    label: 'Humedad Interior',
    unit: '%',
    color: '#06b6d4',
    decimals: 0,
    accumType: null,
  },
  wind_speed_10_min_avg: {
    label: 'Velocidad Viento',
    unit: 'km/h',
    color: '#64748b',
    decimals: 1,
    accumType: null,
  },
  wind_dir: {
    label: 'Dirección Viento',
    unit: '°',
    color: '#475569',
    decimals: 0,
    accumType: null,
  },
  solar_rad: {
    label: 'Radiación Solar',
    unit: 'W/m²',
    color: '#fbbf24',
    decimals: 0,
    accumType: null,
  },
  rain_rate_mm: {
    label: 'Tasa Lluvia',
    unit: 'mm/h',
    color: '#3b82f6',
    decimals: 2,
    accumType: null,
  },
  uv_index: {
    label: 'Índice UV',
    unit: '',
    color: '#fb923c',
    decimals: 1,
    accumType: null,
  },
  luminosidad_lux: {
    label: 'Luminosidad',
    unit: 'lux',
    color: '#facc15',
    decimals: 0,
    accumType: null,
  },
  nivel_viento: {
    label: 'Nivel Viento',
    unit: 'nivel',
    color: '#94a3b8',
    decimals: 0,
    accumType: null,
  },
  pm10_ugm: {
    label: 'PM10',
    unit: 'µg/m³',
    color: '#78716c',
    decimals: 1,
    accumType: null,
  },
  pm25_ugm: {
    label: 'PM2.5',
    unit: 'µg/m³',
    color: '#57534e',
    decimals: 1,
    accumType: null,
  },
  ruido_db: {
    label: 'Ruido',
    unit: 'dB',
    color: '#6366f1',
    decimals: 1,
    accumType: null,
  },
};

export function getMetricConfig(metricName: string): MetricChartConfig {
  return (
    METRIC_CHART_CONFIG[metricName] || {
      label: metricName,
      unit: '',
      color: '#6b7280',
      decimals: 1,
      accumType: null,
    }
  );
}
