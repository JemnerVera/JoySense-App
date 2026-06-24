import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { MetricConfig } from '../types'
import { useEChartsReady } from 'hooks/useEChartsReady'

interface StatusMiniChartProps {
  metric: MetricConfig
  chartData: any[]
  currentValue: number
  hasData: boolean
  onOpenAnalysis: (metric: MetricConfig) => void
  t: any
}

function StatusMiniChartComponent({
  metric,
  chartData,
  currentValue,
  hasData,
  onOpenAnalysis,
  t
}: StatusMiniChartProps) {
  const { isReady, containerRef, chartRef } = useEChartsReady();

  const isActive = currentValue === 1;

  const statusText = isActive ? 'ACTIVO' : 'INACTIVO';
  const statusColor = isActive ? 'text-green-400' : 'text-red-400';
  const statusDot = isActive ? '🟢' : '🔴';

  const sparklineData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const keys = Object.keys(chartData[0]).filter(k => k !== 'time');
    if (keys.length === 0) return [];
    return chartData.map(d => {
      const val = d[keys[0]];
      return typeof val === 'number' && !isNaN(val) ? val : null;
    }).filter(v => v !== null) as number[];
  }, [chartData]);

  const sparklineOption = useMemo<EChartsOption>(() => ({
    grid: { left: 0, right: 0, top: 2, bottom: 0 },
    xAxis: { type: 'category', show: false, data: sparklineData.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: -0.2, max: 1.2 },
    series: [{
      type: 'line',
      data: sparklineData,
      symbol: 'none',
      lineStyle: { color: isActive ? '#4ade80' : '#f87171', width: 2 },
      step: 'end',
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isActive ? '#4ade8040' : '#f8717140' },
            { offset: 1, color: isActive ? '#4ade8005' : '#f8717105' },
          ],
        },
      },
      animation: false,
    }],
  }), [sparklineData, isActive]);

  return (
    <div
      className={`bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-500/20 p-2 group ${
        !hasData ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1">
          <div className="text-sm text-gray-800 dark:text-white">⚡</div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white font-mono tracking-wider">
            {metric.title}
          </h3>
        </div>
      </div>

      {hasData ? (
        <div className="text-center py-2">
          <span className={`inline-flex items-center gap-2 text-2xl font-bold font-mono ${statusColor}`}>
            <span>{statusDot}</span>
            <span>{statusText}</span>
          </span>
        </div>
      ) : (
        <span className="px-2 py-0.5 text-xs font-bold rounded-full border bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 font-mono tracking-wider mb-1">
          NODO OBSERVADO
        </span>
      )}

      <div className="h-10 mb-1">
        {hasData && sparklineData.length > 1 ? (
          <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            {isReady && (
              <ReactECharts
                ref={chartRef}
                option={sparklineOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            )}
          </div>
        ) : hasData ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-gray-400 font-mono">Sin historial</span>
          </div>
        ) : null}
      </div>

      {hasData && (
        <button
          onClick={() => onOpenAnalysis(metric)}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors duration-200 text-xs font-mono mx-auto block"
        >
          📈 Análisis
        </button>
      )}
    </div>
  )
}

export const StatusMiniChart = React.memo(StatusMiniChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.metric.id === nextProps.metric.id &&
    prevProps.chartData === nextProps.chartData &&
    prevProps.currentValue === nextProps.currentValue &&
    prevProps.hasData === nextProps.hasData
  )
});

StatusMiniChart.displayName = 'StatusMiniChart';
