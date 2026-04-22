import React from 'react';
import ReactECharts from 'echarts-for-react';

interface DataPoint {
  time: string;
  value: number;
}

interface WeatherTrend24hProps {
  data: DataPoint[];
  metric: string;
  unit: string;
  color?: string;
  height?: number;
}

export const WeatherTrend24h: React.FC<WeatherTrend24hProps> = ({
  data,
  metric,
  unit,
  color = '#3b82f6',
  height = 200,
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded"
        style={{ height }}
      >
        <span className="text-sm text-gray-400">Sin datos</span>
      </div>
    );
  }

  const option = {
    grid: {
      left: 40,
      right: 20,
      top: 20,
      bottom: 30,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: '{b}: {c}' + unit,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time),
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisLabel: {
        fontSize: 9,
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
        fontSize: 9,
        fontFamily: 'monospace',
        color: '#9ca3af',
      },
    },
    series: [
      {
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
    <div>
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
        {metric} ({unit})
      </div>
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default WeatherTrend24h;