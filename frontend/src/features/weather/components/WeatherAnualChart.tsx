import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface SemanaMetricaRow {
  iso_anual: number;
  semana_iso: number;
  valor_min: number | null;
  valor_max: number | null;
  valor_avg: number | null;
  cantidad_mediciones: number;
}

interface MetricSeries {
  metricaid: number;
  metricName: string;
  label: string;
  unit: string;
  color: string;
  decimals: number;
  data: SemanaMetricaRow[];
}

interface WeatherAnualChartProps {
  series: MetricSeries[];
  year: number;
  loading?: boolean;
}

const METRIC_LINES = [
  { dataKey: 'valor_avg', label: 'Promedio', strokeDasharray: '' },
  { dataKey: 'valor_min', label: 'Mínimo', strokeDasharray: '3 3' },
  { dataKey: 'valor_max', label: 'Máximo', strokeDasharray: '5 5' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Semana {label}
      </p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="tabular-nums">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : '—'}
        </p>
      ))}
    </div>
  );
};

const MetricChart: React.FC<{ series: MetricSeries }> = ({ series }) => {
  const chartData = series.data
    .map((row) => ({
      semana: row.semana_iso,
      valor_min: row.valor_min,
      valor_max: row.valor_max,
      valor_avg: row.valor_avg,
    }))
    .sort((a, b) => a.semana - b.semana);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3" style={{ color: series.color }}>
        {series.label} ({series.unit})
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="semana"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{ value: 'Semana', position: 'insideBottomRight', offset: -5, style: { fontSize: 12, fill: '#9ca3af' } }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{ value: series.unit, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {METRIC_LINES.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.label}
              stroke={series.color}
              strokeDasharray={line.strokeDasharray}
              strokeWidth={line.dataKey === 'valor_avg' ? 2 : 1}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WeatherAnualChart: React.FC<WeatherAnualChartProps> = ({ series, year, loading }) => {
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

  if (!series || series.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center flex-1 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          No hay datos disponibles para el año seleccionado
        </p>
      </div>
    );
  }

  const sameUnit = series.length > 1 && series[0].unit === series[1].unit;

  if (series.length === 1 || (series.length === 2 && sameUnit)) {
    const combinedData = series[0].data
      .map((row) => ({
        semana: row.semana_iso,
        ...series.reduce((acc, s, idx) => ({
          ...acc,
          [`${s.metricName}_min`]: series[idx].data.find((d) => d.semana_iso === row.semana_iso)?.valor_min ?? null,
          [`${s.metricName}_max`]: series[idx].data.find((d) => d.semana_iso === row.semana_iso)?.valor_max ?? null,
          [`${s.metricName}_avg`]: series[idx].data.find((d) => d.semana_iso === row.semana_iso)?.valor_avg ?? null,
        }), {} as Record<string, number | null>),
      }))
      .sort((a, b) => a.semana - b.semana);

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {series.map((s) => s.label).join(' + ')} ({series[0].unit})
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="semana" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {series.flatMap((s) =>
              METRIC_LINES.map((line) => (
                <Line
                  key={`${s.metricName}_${line.dataKey}`}
                  type="monotone"
                  dataKey={`${s.metricName}_${line.dataKey}`}
                  name={`${s.label} ${line.label}`}
                  stroke={s.color}
                  strokeDasharray={line.strokeDasharray}
                  strokeWidth={line.dataKey === 'valor_avg' ? 2 : 1}
                  dot={false}
                  connectNulls
                />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {series.map((s) => (
        <MetricChart key={s.metricName} series={s} />
      ))}
    </div>
  );
};
