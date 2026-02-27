import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface ChartDataPoint {
  fecha: string;
  fechaFormatted: string;
  [key: string]: string | number | null | undefined;
}

interface MetricaPorLoteChartProps {
  chartData: ChartDataPoint[];
  tipoKeys: string[];
  comparisonKeys: string[];
  colors: string[];
  comparisonColors: string[];
  yAxisDomain: { min: number | null; max: number | null };
  visibleTipos: Set<string>;
  localizacionNombre: string;
  comparisonLote: any | null;
  metricUnit: string;
}

export function MetricaPorLoteChart({
  chartData,
  tipoKeys,
  comparisonKeys,
  colors,
  comparisonColors,
  yAxisDomain,
  visibleTipos,
  localizacionNombre,
  comparisonLote,
  metricUnit
}: MetricaPorLoteChartProps) {
  const option = useMemo<any>(() => {
    if (!chartData || chartData.length === 0) {
      return { xAxis: { data: [] }, yAxis: {}, series: [] };
    }

    const xAxisData = chartData.map(d => d.fechaFormatted || d.fecha || d.time) as string[];

    const series: any[] = [];

    tipoKeys
      .filter(tipoKey => visibleTipos.has(tipoKey))
      .forEach((tipoKey, index) => {
        series.push({
          name: comparisonLote ? `${tipoKey} (${localizacionNombre})` : tipoKey,
          type: 'line' as const,
          symbol: 'circle' as const,
          symbolSize: 6,
          sampling: 'lttb' as const,
          connectNulls: true,
          itemStyle: {
            color: colors[index % colors.length]
          },
          lineStyle: {
            color: colors[index % colors.length],
            width: 3
          },
          data: chartData.map(d => {
            const val = d[tipoKey];
            return typeof val === 'number' && !isNaN(val) ? val : null;
          }) as (number | null)[]
        });
      });

    comparisonKeys
      .filter(compKey => {
        const originalKey = compKey.replace('comp_', '');
        return visibleTipos.has(originalKey);
      })
      .forEach((compKey, index) => {
        const originalKey = compKey.replace('comp_', '');
        let tipoIndex = tipoKeys.indexOf(originalKey);
        if (tipoIndex === -1) {
          tipoIndex = index;
        }
        const strokeColor = comparisonColors[tipoIndex % comparisonColors.length];

        series.push({
          name: `${originalKey} (${comparisonLote?.localizacion || 'Comparación'})`,
          type: 'line' as const,
          symbol: 'circle' as const,
          symbolSize: 5,
          sampling: 'lttb' as const,
          connectNulls: true,
          itemStyle: {
            color: strokeColor
          },
          lineStyle: {
            color: strokeColor,
            width: 2,
            type: 'dashed' as const
          },
          data: chartData.map(d => {
            const val = d[compKey];
            return typeof val === 'number' && !isNaN(val) ? val : null;
          }) as (number | null)[]
        });
      });

    let yAxisConfig: any = {
      type: 'value' as const,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
          type: 'solid' as const
        }
      },
      axisLabel: {
        color: '#9ca3af',
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        formatter: (value: number) => {
          if (Math.abs(value) >= 1) {
            return Math.round(value).toString();
          }
          return value.toFixed(1);
        }
      }
    };

    if (yAxisDomain.min !== null || yAxisDomain.max !== null) {
      yAxisConfig.min = yAxisDomain.min;
      yAxisConfig.max = yAxisDomain.max;
    }

    const interval = (() => {
      if (chartData.length <= 8) return 0;
      if (chartData.length <= 20) return 1;
      return Math.floor(chartData.length / 6);
    })();

    return {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        borderColor: '#374151',
        borderRadius: 8,
        textStyle: {
          color: '#ffffff',
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: 14
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          
          const dateLabel = params[0]?.axisValue || '';
          const isDate = dateLabel.includes('/');
          let header = '';
          if (isDate) {
            const year = new Date().getFullYear();
            header = dateLabel.includes(' ') 
              ? `Fecha: ${dateLabel}` 
              : `Fecha: ${dateLabel}/${year}`;
          } else {
            header = `Hora: ${dateLabel}`;
          }

          const lines: string[] = [header];
          params.forEach((p: any) => {
            const val = p.value;
            const display = typeof val === 'number' && !isNaN(val) 
              ? `${val.toFixed(1)} ${metricUnit}` 
              : '--';
            lines.push(`${p.marker} ${p.seriesName}: ${display}`);
          });
          
          return lines.join('<br/>');
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
        data: xAxisData,
        axisLine: {
          show: false
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: { color: '#666' }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)',
            type: 'solid' as const
          },
          interval
        },
        axisLabel: {
          color: '#9ca3af',
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: 12,
          rotate: 45,
          interval,
          formatter: (value: string) => value
        }
      },
      yAxis: yAxisConfig,
      legend: {
        data: series.map(s => s.name),
        bottom: 0,
        textStyle: {
          color: '#9ca3af',
          fontSize: 12,
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
        },
        type: 'scroll' as const,
        orient: 'horizontal' as const
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
          height: 25,
          bottom: '5px',
          textStyle: {
            color: '#999'
          }
        }
      ],
      series
    };
  }, [
    chartData,
    tipoKeys,
    comparisonKeys,
    colors,
    comparisonColors,
    yAxisDomain,
    visibleTipos,
    localizacionNombre,
    comparisonLote,
    metricUnit
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

export default MetricaPorLoteChart;
