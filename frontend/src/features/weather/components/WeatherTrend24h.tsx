import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useEChartsReady } from 'hooks/useEChartsReady';

interface DataPoint {
  time: string;
  value: number;
}

interface WeatherTrend24hProps {
  data: DataPoint[];
  metric: string;
  unit: string;
  color?: string;
  height?: number | string;
}

export const WeatherTrend24h: React.FC<WeatherTrend24hProps> = ({
  data,
  metric,
  unit,
  color = '#3b82f6',
  height,
}) => {
  // Si no se especifica altura, usar altura flexible
  const containerHeight = height ?? '100%';
  const { isReady, containerRef, chartRef } = useEChartsReady();

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded h-full"
        style={{ height: containerHeight }}
      >
        <span className="text-sm text-gray-400">Sin datos</span>
      </div>
    );
  }

  const option = {
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 40,
    },
    tooltip: {
      trigger: 'axis' as const,
      position: (pt: [number, number]) => [pt[0], '10%'],
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderWidth: 0,
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return '';
        const lines: string[] = [];
        params.forEach((p: { value?: number; seriesName?: string; marker?: string }) => {
          const val = p.value;
          const display =
            typeof val === 'number' && !isNaN(val) ? `${val.toFixed(2)} ${unit}` : '-';
          lines.push(`${p.marker} ${p.seriesName}: ${display}`);
        });
        const date = (params[0] as { axisValue?: string })?.axisValue || '';
        return `${date}<br/>${lines.join('<br/>')}`;
      },
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time),
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisLabel: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#6b7280',
        formatter: (value: string) => value.slice(11, 16),
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#9ca3af',
      },
    },
    series: [
      {
        name: metric,
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '30' },
              { offset: 1, color: color + '05' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1 flex-shrink-0">
        {metric} ({unit})
      </div>
      <div ref={containerRef} style={{ height: containerHeight, width: '100%' }} className="flex-1">
        {isReady && (
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        )}
      </div>
    </div>
  );
};

export default WeatherTrend24h;