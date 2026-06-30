import React, { useMemo } from 'react';
import { WeatherTrend24h } from './WeatherTrend24h';
import { MetricWeekSeries } from '../../hooks/useWeatherResumenData';
import { isProprietaryStation, WIND_DIRECTION_MAP, WIND_LEVEL_MAP } from '../../../hooks/useWeatherData';

interface WeatherMetricWeekChartProps {
  series: MetricWeekSeries;
  weekRange: string;
  stationName?: string;
}

export const WeatherMetricWeekChart: React.FC<WeatherMetricWeekChartProps> = ({
  series,
  weekRange,
  stationName,
}) => {
  const hasWeekData = series.weekPoints.some((p) => p.value !== null);

  const isWindDir = series.metricName === 'wind_dir';
  const isPropSpeed = isProprietaryStation(stationName ?? '') && series.metricName === 'wind_speed_10_min_avg';

  const yAxisLabelFormatter = isWindDir
    ? (v: number) => WIND_DIRECTION_MAP[v]?.short ?? String(Math.round(v))
    : undefined;

  const tooltipValueFormatter = isWindDir
    ? (v: number) => `${WIND_DIRECTION_MAP[v]?.description ?? v} (${v}°)`
    : isPropSpeed
      ? (v: number) => `${v.toFixed(2)} - ${WIND_LEVEL_MAP[Math.round(v)] || 'Desconocido'}`
      : undefined;

  const yAxisMin = isWindDir ? 0 : undefined;
  const yAxisMax = isWindDir ? 7 : undefined;
  const yAxisInterval = isWindDir ? 1 : undefined;
  const hasAccumData =
    series.cumulativePoints &&
    series.cumulativePoints.some((p) => p.value !== null);

  // Calcular altura dinámica de los gráficos
  const chartHeight = useMemo(() => {
    if (hasAccumData) {
      return 'calc(50% - 20px)'; // 50% menos espacio para labels y gap
    }
    return '100%';
  }, [hasAccumData]);

  if (!hasWeekData) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {series.label}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
            Semana: {weekRange}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          Sin datos para esta semana
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 flex flex-col flex-1 min-h-0">
      {/* Header con información */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {series.label}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
          Semana: {weekRange}
        </p>
      </div>

      {/* Contenedor de gráficos que ocupa el espacio restante */}
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {/* Gráfico semana */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono flex-shrink-0">
            Semana seleccionada
          </div>
          <div className="flex-1 min-h-0">
            <WeatherTrend24h
              data={series.weekPoints.map((p) => ({
                time: `${p.date} ${p.time}`,
                value: p.value ?? 0,
              }))}
              metric={series.label}
              unit={series.unit}
              color={series.color}
              yAxisLabelFormatter={yAxisLabelFormatter}
              tooltipValueFormatter={tooltipValueFormatter}
              yAxisMin={yAxisMin}
              yAxisMax={yAxisMax}
              yAxisInterval={yAxisInterval}
            />
          </div>
        </div>

        {/* Gráfico acumulado/media móvil */}
        {hasAccumData && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono flex-shrink-0">
              {series.accumType === 'cumsum'
                ? 'Acumulado semanal'
                : series.accumType === 'moving_avg'
                  ? 'Media móvil (24h)'
                  : 'Tendencia'}
            </div>
            <div className="flex-1 min-h-0">
              <WeatherTrend24h
                data={series.cumulativePoints!.map((p) => ({
                  time: `${p.date} ${p.time}`,
                  value: p.value ?? 0,
                }))}
                metric={`${series.label} ${
                  series.accumType === 'cumsum'
                    ? '(Acumulado)'
                    : '(Media móvil)'
                }`}
                unit={series.unit}
                color={series.color}
                yAxisLabelFormatter={yAxisLabelFormatter}
                tooltipValueFormatter={tooltipValueFormatter}
                yAxisMin={yAxisMin}
                yAxisMax={yAxisMax}
                yAxisInterval={yAxisInterval}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
