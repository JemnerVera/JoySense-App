import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

export interface ChartDataPoint {
  fecha: string;
  [seriesLabel: string]: string | number | undefined;
}

interface MedicionesAreaChartProps {
  chartData: ChartDataPoint[];
  allSeries: string[];
  selectedMetricUnit: string;
  yAxisDomain: { min: number | null; max: number | null };
  colors: string[];
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function MedicionesAreaChart({
  chartData,
  allSeries,
  selectedMetricUnit,
  yAxisDomain,
  colors
}: MedicionesAreaChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const xAxisData = chartData.map(d => d.fecha);

    const series = allSeries.map((name, idx) => {
      const color = colors[idx % colors.length];
      return {
        name,
        type: 'line' as const,
        symbol: 'none' as const,
        sampling: 'lttb' as const,
        itemStyle: {
          color
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, 0.5) },
            { offset: 1, color: hexToRgba(color, 0.05) }
          ])
        },
        data: chartData.map(d => {
          const val = d[name];
          return typeof val === 'number' && !isNaN(val) ? val : null;
        })
      };
    });

    const yAxisMin =
      yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? yAxisDomain.min : undefined;
    const yAxisMax =
      yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? yAxisDomain.max : undefined;

    return {
      tooltip: {
        trigger: 'axis' as const,
        position: (pt: [number, number]) => [pt[0], '10%'],
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const lines: string[] = [];
          params.forEach((p: any) => {
            const val = p.value;
            const display =
              typeof val === 'number' && !isNaN(val) ? `${val.toFixed(2)} ${selectedMetricUnit}` : '-';
            lines.push(`${p.marker} ${p.seriesName}: ${display}`);
          });
          const date = params[0]?.axisValue || '';
          return `${date}<br/>${lines.join('<br/>')}`;
        }
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none' as const
          },
          restore: {},
          saveAsImage: {}
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category' as const,
        boundaryGap: false,
        data: xAxisData
      },
      yAxis: {
        type: 'value' as const,
        boundaryGap: [0, '100%'] as [number, string],
        min: yAxisMin,
        max: yAxisMax
      },
      dataZoom: [
        {
          type: 'inside' as const,
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100
        }
      ],
      legend: {
        data: allSeries,
        top: 0,
        textStyle: {
          color: '#ffffff'
        }
      },
      series
    };
  }, [
    chartData,
    allSeries,
    selectedMetricUnit,
    yAxisDomain.min,
    yAxisDomain.max,
    colors
  ]);

  return (
    <ReactECharts
      option={option}
      style={{ height: 600, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  );
}
