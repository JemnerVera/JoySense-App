import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useEChartsReady } from 'hooks/useEChartsReady';

interface WeatherGaugeProps {
  value: number | null;
  min?: number;
  max?: number;
  label: string;
  unit: string;
  thresholds?: { min: number; max: number };
  height?: number;
}

export const WeatherGauge: React.FC<WeatherGaugeProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  unit,
  thresholds,
  height = 120,
}) => {
  const { isReady, containerRef, chartRef } = useEChartsReady();
  const getColor = () => {
    if (value === null) return '#9ca3af';
    if (thresholds) {
      if (value < thresholds.min) return '#3b82f6';
      if (value > thresholds.max) return '#ef4444';
    }
    return '#22c55e';
  };

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: min,
        max: max,
        splitNumber: 4,
        radius: '90%',
        center: ['50%', '70%'],
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [(max - min) / 4 / (max - min), '#3b82f6'],
              [1, '#22c55e'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '60%',
          width: 8,
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: getColor(),
          },
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 1,
          },
        },
        splitLine: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2,
          },
        },
        axisLabel: {
          show: false,
        },
        title: {
          show: false,
        },
        detail: {
          show: false,
        },
      },
    ],
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} style={{ height: height, width: '100%' }}>
        {isReady && (
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        )}
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-[-10px]">
        {label}
      </span>
    </div>
  );
};

export default WeatherGauge;