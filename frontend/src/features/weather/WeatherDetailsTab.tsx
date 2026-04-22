import React, { useMemo } from 'react';
import { WeatherMedicionData, WeatherStation } from '../../hooks/useWeatherData';

interface WeatherDetailsTabProps {
  historicalData: WeatherMedicionData[];
  loading: boolean;
}

interface DayStat {
  actual: number | null;
  max: number | null;
  maxTime: string | null;
  min: number | null;
  minTime: string | null;
}

interface TableMetric {
  key: string;
  label: string;
  unit: string;
}

interface GroupData {
  title: string;
  metrics: TableMetric[];
}

const formatTime = (isoString: string | null): string => {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '--';
  }
};

const formatValue = (value: number | null, decimals: number = 2): string => {
  if (value === null) return '--';
  return value.toFixed(decimals);
};

export const WeatherDetailsTab: React.FC<WeatherDetailsTabProps> = ({
  historicalData,
  loading,
}) => {
  const today = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const getDayStats = (metricName: string): DayStat => {
    const todayData = historicalData.filter(
      d => d.metrica_nombre === metricName && d.fecha?.startsWith(today)
    );

    if (todayData.length === 0) {
      return { actual: null, max: null, maxTime: null, min: null, minTime: null };
    }

    const values = todayData.map(d => ({ value: d.medicion, time: d.fecha }));
    const actual = values[values.length - 1]?.value ?? null;

    let max = values[0]?.value ?? null;
    let maxTime = values[0]?.time ?? null;
    let min = values[0]?.value ?? null;
    let minTime = values[0]?.time ?? null;

    values.forEach(v => {
      if (v.value !== null) {
        if (max === null || v.value > max) {
          max = v.value;
          maxTime = v.time;
        }
        if (min === null || v.value < min) {
          min = v.value;
          minTime = v.time;
        }
      }
    });

    return { actual, max, maxTime, min, minTime };
  };

  const groups: GroupData[] = [
    {
      title: 'INTERIOR',
      metrics: [
        { key: 'bar', label: 'Barómetro', unit: 'hPa' },
        { key: 'temp_in', label: 'Temperatura', unit: '°C' },
        { key: 'hum_in', label: 'Humedad', unit: '%' },
      ],
    },
    {
      title: 'EXTERIOR',
      metrics: [
        { key: 'temp_out', label: 'Temperatura', unit: '°C' },
        { key: 'hum_out', label: 'Humedad', unit: '%' },
        { key: 'heat_index', label: 'Índice calorífico', unit: '°C' },
        { key: 'thsw_index', label: 'THSW', unit: '°C' },
        { key: 'wind_chill', label: 'Viento frío', unit: '°C' },
        { key: 'dew_point', label: 'Punto rocío', unit: '°C' },
        { key: 'wind_speed_10_min_avg', label: 'Viento', unit: 'km/h' },
        { key: 'wind_dir', label: 'Dirección', unit: '°' },
        { key: 'solar_rad', label: 'Radiación solar', unit: 'W/m²' },
      ],
    },
    {
      title: 'VIENTO',
      metrics: [
        { key: 'wind_speed_10_min_avg', label: 'Viento 10 min', unit: 'km/h' },
        { key: 'wind_gust_10_min', label: 'Ráfaga 10 min', unit: 'km/h' },
      ],
    },
  ];

  const groups4 = {
    title: 'LLUVIA Y ET',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
        Última actualización: {new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}
      </div>

      {groups.map((group) => (
        <div key={group.title} className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
            <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">
              {group.title}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2 text-left w-1/4">Métrica</th>
                  <th className="px-3 py-2 text-right">Actual</th>
                  <th className="px-3 py-2 text-right">Máx</th>
                  <th className="px-3 py-2 text-center">Hora máx</th>
                  <th className="px-3 py-2 text-right">Mín</th>
                  <th className="px-3 py-2 text-center">Hora mín</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {group.metrics.map((metric) => {
                  const stats = getDayStats(metric.key);
                  const isTemperature = metric.unit === '°C';
                  const decimals = isTemperature ? 1 : metric.key === 'wind_dir' ? 0 : 1;
                  
                  return (
                    <tr key={metric.key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{metric.label}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {formatValue(stats.actual, decimals)}{metric.unit}
                      </td>
                      <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                        {formatValue(stats.max, decimals)}{metric.unit}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-500">
                        {formatTime(stats.maxTime)}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400">
                        {formatValue(stats.min, decimals)}{metric.unit}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-500">
                        {formatTime(stats.minTime)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
          <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">
            {groups4.title}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <th className="px-3 py-2 text-left w-1/4">Métrica</th>
                <th className="px-3 py-2 text-right">Tasa</th>
                <th className="px-3 py-2 text-right">Día</th>
                <th className="px-3 py-2 text-right">Mes</th>
                <th className="px-3 py-2 text-right">Año</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">Lluvia</td>
                <td className="px-3 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                  {formatValue(getDayStats('rain_rate_mm').actual, 2)} mm/h
                </td>
                <td className="px-3 py-2 text-right font-semibold text-gray-800 dark:text-gray-200">
                  {formatValue(getDayStats('rain_day_mm').actual, 2)} mm
                </td>
                <td className="px-3 py-2 text-right text-gray-500">-- mm</td>
                <td className="px-3 py-2 text-right text-gray-500">-- mm</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">ET</td>
                <td className="px-3 py-2 text-right text-gray-500">--</td>
                <td className="px-3 py-2 text-right font-semibold text-gray-800 dark:text-gray-200">
                  {formatValue(getDayStats('et_day').actual, 2)} mm
                </td>
                <td className="px-3 py-2 text-right text-gray-500">-- mm</td>
                <td className="px-3 py-2 text-right text-gray-500">-- mm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeatherDetailsTab;