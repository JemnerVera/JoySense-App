import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useEChartsReady } from 'hooks/useEChartsReady';

interface WeatherSparkAreaProps {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

export const WeatherSparkArea: React.FC<WeatherSparkAreaProps> = ({
  data,
  color = '#3b82f6',
  height = 40,
  showArea = true,
}) => {
  const { isReady, containerRef, chartRef } = useEChartsReady();
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded"
        style={{ height }}
      >
        <span className="text-xs text-gray-400">--</span>
      </div>
    );
  }

  const option = {
    grid: {
      left: 0,
      right: 0,
      top: 2,
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      show: false,
      data: data.map((_, i) => i),
    },
    yAxis: {
      type: 'value',
      show: false,
      min: 'dataMin',
      max: 'dataMax',
    },
    series: [
      {
        type: 'line',
        data: data,
        symbol: 'none',
        lineStyle: {
          color: color,
          width: 1.5,
        },
        areaStyle: showArea ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '05' },
            ],
          },
        } : undefined,
        animation: false,
      },
    ],
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      {isReady && (
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      )}
    </div>
  );
};

export default WeatherSparkArea;