import React from 'react';
import { getMetricConfig } from '../utils/metricChartConfig';

export interface ResumenSemanalRow {
  dia: string;
  temp_max: number | null;
  temp_min: number | null;
  temp_avg: number | null;
  hr_max: number | null;
  hr_min: number | null;
  wind_max: number | null;
  wind_avg: number | null;
  rad_avg: number | null;
  lluvia: number | null;
  etc: number | null;
  fluctuacion: number | null;
}

interface WeatherMensualTableProps {
  data: ResumenSemanalRow[];
  loading?: boolean;
  stationName?: string;
}

const METRIC_COLUMNS: Array<{ key: keyof ResumenSemanalRow; label: string; configMetricName: string }> = [
  { key: 'temp_max', label: 'Temp Máx', configMetricName: 'temp_out' },
  { key: 'temp_min', label: 'Temp Mín', configMetricName: 'temp_out' },
  { key: 'temp_avg', label: 'Temp Prom', configMetricName: 'temp_out' },
  { key: 'hr_max', label: 'HR Máx', configMetricName: 'hum_out' },
  { key: 'hr_min', label: 'HR Mín', configMetricName: 'hum_out' },
  { key: 'wind_max', label: 'Viento Máx', configMetricName: 'wind_speed_10_min_avg' },
  { key: 'wind_avg', label: 'Viento Prom', configMetricName: 'wind_speed_10_min_avg' },
  { key: 'rad_avg', label: 'Rad Prom', configMetricName: 'solar_rad' },
  { key: 'lluvia', label: 'Lluvia', configMetricName: 'rain_day_mm' },
  { key: 'etc', label: 'ETC', configMetricName: 'et_day' },
  { key: 'fluctuacion', label: 'Fluctuación', configMetricName: 'temp_out' },
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatDayLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  const dayName = DAY_NAMES[d.getDay()];
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayName} ${day}/${month}`;
}

export const WeatherMensualTable: React.FC<WeatherMensualTableProps> = ({ data, loading, stationName }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center flex-1 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          No hay datos disponibles para la semana seleccionada
        </p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.dia.localeCompare(b.dia));

  return (
    <div className="flex-1 overflow-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Métrica
              </th>
              {sorted.map((row) => (
                <th
                  key={row.dia}
                  className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 text-center whitespace-nowrap"
                >
                  {formatDayLabel(row.dia)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_COLUMNS.map((col) => {
              const config = getMetricConfig(col.configMetricName);
              return (
                <tr
                  key={col.key}
                  className="border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-750 transition-colors"
                >
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                    {col.label}
                    <span className="text-gray-400 dark:text-gray-500 ml-1 text-xs">
                      ({config.unit})
                    </span>
                  </td>
                  {sorted.map((row) => {
                    const val = row[col.key];
                    const displayVal =
                      val !== null && val !== undefined
                        ? val.toFixed(config.decimals)
                        : '—';
                    return (
                      <td
                        key={row.dia}
                        className={`px-3 py-2.5 text-center whitespace-nowrap tabular-nums ${
                          val !== null && val !== undefined
                            ? 'text-gray-800 dark:text-gray-200'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
