import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useEChartsReady } from 'hooks/useEChartsReady';

interface WindRoseTileProps {
  windDir: number[];
  windSpeed: number[];
}

export const WindRoseTile: React.FC<WindRoseTileProps> = ({ windDir, windSpeed }) => {
  const { isReady, containerRef, chartRef } = useEChartsReady();
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const dirAngles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
  
  const calcFrequency = (): number[] => {
    const freq = new Array(16).fill(0);
    if (!windDir || windDir.length === 0) return freq;
    
    windDir.forEach((dir, i) => {
      if (dir !== null) {
        const idx = Math.round(dir / 22.5) % 16;
        freq[idx] += (windSpeed[i] || 1);
      }
    });
    
    const max = Math.max(...freq);
    return freq.map(f => max > 0 ? (f / max) * 100 : 0);
  };

  const freq = calcFrequency();

  const option = {
    polar: {},
    angleAxis: {
      type: 'category',
      data: directions,
      startAngle: 90,
      axisLine: { lineStyle: { color: '#9ca3af' } },
      axisLabel: { fontSize: 10, fontFamily: 'monospace', color: '#6b7280' },
    },
    radiusAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: '#e5e7eb' } },
    },
    series: [
      {
        type: 'bar',
        data: freq,
        coordinateSystem: 'polar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#60a5fa' },
              { offset: 1, color: '#1d4ed8' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="weather-tile">
      <div className="weather-tile-header">Rosa de Vientos</div>
      <div ref={containerRef} style={{ height: 120, width: '100%' }}>
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

export default WindRoseTile;