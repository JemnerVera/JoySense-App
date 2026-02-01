import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { MetricConfig } from '../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface MetricCardProps {
  metric: MetricConfig;
  hasData: boolean;
  currentValue: number;
  chartData: any[];
  onOpenAnalysis: (metric: MetricConfig) => void;
  lastMeasurementDate?: Date;
}

const METRIC_ICONS: { [key: string]: string } = {
  'temperatura': '🌡',
  'humedad': '💧',
  'conductividad': '⚡',
  'ph': '🧪',
  'luz': '💡',
  'co2': '🌱',
  'presion': '🔽'
};

const CHART_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#10b981'];

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  hasData,
  currentValue,
  chartData,
  onOpenAnalysis,
  lastMeasurementDate
}) => {
  const { t } = useLanguage();

  const allSeriesKeys = Array.from(
    new Set(
      chartData.flatMap(item => Object.keys(item).filter(key => key !== 'time'))
    )
  );

  const calculateXAxisInterval = () => {
    if (chartData.length <= 5) return 0;
    if (chartData.length <= 10) return 1;
    return Math.floor(chartData.length / 4);
  };

  return (
    <div
      className={`bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-500/20 p-6 group ${
        !hasData ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl text-gray-800 dark:text-white">
            {METRIC_ICONS[metric.id] || '📊'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-mono tracking-wider">
              {metric.title}
            </h3>
          </div>
        </div>
        {!hasData && (
          <span className="px-2 py-1 text-xs font-bold rounded-full border bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 font-mono tracking-wider">
            NODO OBSERVADO
          </span>
        )}
      </div>

      {/* Current Value */}
      <div className="flex items-baseline justify-end space-x-2 mb-4">
        <span className="text-3xl font-bold text-blue-500 font-mono">
          {hasData && typeof currentValue === 'number' ? currentValue.toFixed(1) : '--'}
        </span>
        <span className="text-sm text-neutral-400 font-mono">{metric.unit}</span>
      </div>

      {/* Chart */}
      <div className="h-32 mb-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: "ui-monospace" }}
                interval={calculateXAxisInterval()}
              />
              <YAxis hide domain={['auto', 'auto']} />
              {allSeriesKeys.map((seriesKey, index) => (
                <Line
                  key={seriesKey}
                  type="monotone"
                  dataKey={seriesKey}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: CHART_COLORS[index % CHART_COLORS.length],
                    stroke: CHART_COLORS[index % CHART_COLORS.length],
                    strokeWidth: 2
                  }}
                  strokeOpacity={0.8}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              ))}
              <Legend
                verticalAlign="bottom"
                height={20}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '9px',
                  fontFamily: 'ui-monospace',
                  paddingTop: '10px'
                }}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const isDate = label && typeof label === 'string' && label.includes('/');
                  return (
                    <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                      {isDate ? label : `${t('dashboard.tooltip.hour')} ${label}`}
                    </span>
                  );
                }}
                formatter={(value: number) => [
                  <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                    {value ? value.toFixed(1) : '--'} {metric.unit}
                  </span>
                ]}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontFamily: 'ui-monospace',
                  padding: '8px 12px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="text-center text-blue-700 dark:text-blue-400 mb-3">
              <div className="text-3xl mb-2">👁️</div>
              <div className="text-sm font-mono tracking-wider font-bold mb-1">NODO OBSERVADO</div>
              <div className="text-xs font-mono opacity-75">No disponible por el momento</div>
            </div>
            <button
              onClick={() => onOpenAnalysis(metric)}
              className="px-3 py-1.5 text-xs font-mono tracking-wider bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Ajustar Rango Manualmente
            </button>
          </div>
        )}
      </div>

      {/* Last Measurement Date */}
      {hasData && lastMeasurementDate && (
        <div className="text-xs text-neutral-400 text-center mb-3">
          {t('dashboard.last_measurement')} {lastMeasurementDate.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}

      {/* Analysis Button */}
      <div className="flex justify-center">
        <button
          onClick={() => onOpenAnalysis(metric)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            hasData
              ? 'text-neutral-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 group-hover:scale-110'
              : 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
          }`}
          title={hasData ? 'Ver análisis detallado' : 'Ajustar rango de fechas para buscar datos antiguos'}
        >
          <svg className="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
