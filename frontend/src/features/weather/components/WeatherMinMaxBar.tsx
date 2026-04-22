import React from 'react';
import ReactECharts from 'echarts-for-react';

interface WeatherMinMaxBarProps {
  current: number | null;
  min: number | null;
  max: number | null;
  unit: string;
  label?: string;
  height?: number;
}

export const WeatherMinMaxBar: React.FC<WeatherMinMaxBarProps> = ({
  current,
  min,
  max,
  unit,
  label,
  height = 100,
}) => {
  const hasData = current !== null && min !== null && max !== null;
  const range = hasData ? max! - min! : 1;
  const currentPos = hasData ? ((current! - min!) / range) * 100 : 50;

  const option = {
    grid: {
      left: 0,
      right: 0,
      top: 15,
      bottom: 15,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: false,
    },
    yAxis: {
      type: 'category',
      data: ['bar'],
      show: false,
    },
    series: [
      {
        type: 'bar',
        data: [
          {
            value: 100,
            itemStyle: { color: '#e5e7eb' },
          },
        ],
        barWidth: 12,
        barGap: '-100%',
        z: 0,
        label: { show: false },
      },
      {
        type: 'bar',
        data: [
          {
            value: currentPos,
            itemStyle: { color: '#3b82f6' },
          },
        ],
        barWidth: 12,
        barGap: '-100%',
        z: 1,
        label: { show: false },
      },
    ],
  };

  return (
    <div className="relative">
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
      <div className="absolute top-0 left-0 right-0 flex justify-between px-1">
        <span className="text-xs font-mono text-blue-600">
          {min !== null ? min.toFixed(1) : '--'}{unit}
        </span>
        <span className="text-xs font-mono text-gray-500">
          {label}
        </span>
        <span className="text-xs font-mono text-red-600">
          {max !== null ? max.toFixed(1) : '--'}{unit}
        </span>
      </div>
    </div>
  );
};

export default WeatherMinMaxBar;