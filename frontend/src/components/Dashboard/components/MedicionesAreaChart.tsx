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

// Función para calcular un intervalo limpio para el eje Y
function calculateNiceInterval(min: number, max: number): { min: number; max: number; interval: number } {
  if (min === null || max === null || min === undefined || max === undefined) {
    return { min: undefined as any, max: undefined as any, interval: undefined as any };
  }

  const range = max - min;
  
  // Calcular la magnitud del rango
  const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
  
  // Dividir por magnitud para normalizar
  const normalizedRange = range / magnitude;
  
  // Encontrar un intervalo "limpio" (1, 2, 5, 10, etc.)
  let interval: number;
  if (normalizedRange <= 1) {
    interval = 0.1 * magnitude;
  } else if (normalizedRange <= 2) {
    interval = 0.2 * magnitude;
  } else if (normalizedRange <= 5) {
    interval = 0.5 * magnitude;
  } else {
    interval = magnitude;
  }
  
  // Redondear min hacia abajo y max hacia arriba según el intervalo
  // Si el mínimo es positivo, asegurar que nunca sea negativo
  let roundedMin: number;
  if (min > 0) {
    // Para datos positivos, redondear hacia abajo pero nunca menos que 0
    roundedMin = Math.max(0, Math.floor(min / interval) * interval);
  } else {
    // Para datos negativos, redondear normalmente
    roundedMin = Math.floor(min / interval) * interval;
  }
  
  const roundedMax = Math.ceil(max / interval) * interval;
  
  return {
    min: roundedMin,
    max: roundedMax,
    interval
  };
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

    let yAxisConfig: any = {
      type: 'value' as const,
      boundaryGap: [0, '100%'] as [number, string]
    };

    // Si tenemos min/max definidos, calcular intervalos limpios
    if (
      yAxisDomain.min !== null && !isNaN(yAxisDomain.min) &&
      yAxisDomain.max !== null && !isNaN(yAxisDomain.max)
    ) {
      const { min: niceMin, max: niceMax, interval } = calculateNiceInterval(
        yAxisDomain.min,
        yAxisDomain.max
      );
      yAxisConfig.min = niceMin;
      yAxisConfig.max = niceMax;
      yAxisConfig.interval = interval;
    }

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
        bottom: '60px',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category' as const,
        boundaryGap: false,
        data: xAxisData,
        gridIndex: 0,
        axisLabel: {
          color: '#ffffff'
        }
      },
      yAxis: {
        ...yAxisConfig,
        axisLabel: {
          color: '#ffffff'
        }
      },
      dataZoom: [
        {
          type: 'inside' as const,
          start: 0,
          end: 100,
          xAxisIndex: 0
        },
        {
          type: 'slider' as const,
          start: 0,
          end: 100,
          xAxisIndex: 0,
          height: 30,
          bottom: '5px',
          textStyle: {
            color: '#999'
          }
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
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  );
}
