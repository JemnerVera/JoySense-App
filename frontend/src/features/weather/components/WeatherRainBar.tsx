import React from 'react';
import ReactECharts from 'echarts-for-react';

interface WeatherRainBarProps {
  today: number | null;
  month: number | null;
  height?: number;
}

export const WeatherRainBar: React.FC<WeatherRainBarProps> = ({
  today,
  month,
  height = 120,
}) => {
  const option = {
    grid: {
      left: 30,
      right: 10,
      top: 10,
      bottom: 20,
    },
    xAxis: {
      type: 'category',
      data: ['Hoy', 'Mes'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: '#6b7280',
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        fontSize: 9,
        fontFamily: 'monospace',
        color: '#9ca3af',
      },
    },
    series: [
      {
        type: 'bar',
        data: [
          { value: today ?? 0, itemStyle: { color: '#3b82f6' } },
          { value: month ?? 0, itemStyle: { color: '#1d4ed8' } },
        ],
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          fontFamily: 'monospace',
          formatter: (p: { value: number }) => p.value?.toFixed(1) ?? '--',
        },
      },
    ],
  };

  return (
    <div className="flex flex-col items-center">
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default WeatherRainBar;