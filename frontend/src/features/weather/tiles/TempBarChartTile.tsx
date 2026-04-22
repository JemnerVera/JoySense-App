import React from 'react';
import ReactECharts from 'echarts-for-react';

interface TempBarChartTileProps {
  tempOutTrend: number[];
  tempInTrend: number[];
  dewPointTrend: number[];
}

export const TempBarChartTile: React.FC<TempBarChartTileProps> = ({ 
  tempOutTrend, 
  tempInTrend, 
  dewPointTrend 
}) => {
  const getStats = (data: number[]) => {
    if (!data || data.length === 0) return { current: null, min: null, max: null };
    const valid = data.filter(v => v !== null);
    if (valid.length === 0) return { current: null, min: null, max: null };
    const current = valid[valid.length - 1];
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    return { current, min, max };
  };

  const outStats = getStats(tempOutTrend);
  const inStats = getStats(tempInTrend);
  const dewStats = getStats(dewPointTrend);

  const categories = ['Temp Exterior', 'Temp Interior', 'Punto Rocío'];
  const values = [
    outStats.current, 
    inStats.current, 
    dewStats.current
  ];
  const colors = ['#ef4444', '#f97316', '#3b82f6'];

  const minVal = Math.min(
    outStats.min ?? 0, 
    inStats.min ?? 0, 
    dewStats.min ?? 0
  );
  const maxVal = Math.max(
    outStats.max ?? 40, 
    inStats.max ?? 40, 
    dewStats.max ?? 40
  );

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: '#374151',
      textStyle: { color: '#f3f4f6', fontFamily: 'monospace', fontSize: 10 },
      formatter: (params: any) => {
        const name = params.name;
        const current = params.value?.toFixed(2) ?? '--';
        
        const allStats = [
          { name: 'Temp Exterior', stats: outStats },
          { name: 'Temp Interior', stats: inStats },
          { name: 'Punto Rocío', stats: dewStats },
        ];
        const stat = allStats.find(s => s.name === name)?.stats;
        
        if (!stat) return `${name}: ${current}°C`;
        
        return `<div style="padding:2px;font-size:10px;">
          <div style="font-weight:bold;">${name}</div>
          <div>Act: ${stat.current?.toFixed(2) ?? '--'}°C</div>
          <div>Mín: ${stat.min?.toFixed(2) ?? '--'}°C</div>
          <div>Máx: ${stat.max?.toFixed(2) ?? '--'}°C</div>
        </div>`;
      },
    },
    grid: {
      left: 35,
      right: 5,
      top: 3,
      bottom: 15,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 7,
        fontFamily: 'monospace',
        color: '#9ca3af',
        interval: 0,
        rotate: 0,
      },
    },
    yAxis: {
      type: 'value',
      min: Math.floor(minVal / 5) * 5 - 5,
      max: Math.ceil(maxVal / 5) * 5 + 5,
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: {
        fontSize: 7,
        fontFamily: 'monospace',
        color: '#9ca3af',
        formatter: '{value}°',
      },
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: colors[i], borderRadius: [2, 2, 0, 0] },
        })),
        barWidth: '35%',
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => params.value?.toFixed(2) + '°',
          fontSize: 7,
          fontFamily: 'monospace',
          color: '#9ca3af',
        },
      },
    ],
  };

  return (
    <div className="weather-tile">
      <div className="weather-tile-header">Temperatura</div>
      <ReactECharts
        option={option}
        style={{ height: 80, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default TempBarChartTile;