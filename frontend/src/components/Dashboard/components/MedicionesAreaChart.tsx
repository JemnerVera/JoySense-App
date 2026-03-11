import React, { useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { hexToRgba, calculateDateRange, calculateXAxisInterval, calculateNiceInterval } from '../../../utils/chartUtils';

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
  comparisonChartData?: ChartDataPoint[];
  comparisonSeries?: string[];
  comparisonUnit?: string;
  comparisonYAxisDomain?: { min: number | null; max: number | null };
  isComparisonMode?: boolean;
}

function MedicionesAreaChartComponent({
  chartData,
  allSeries,
  selectedMetricUnit,
  yAxisDomain,
  colors,
  comparisonChartData = [],
  comparisonSeries = [],
  comparisonUnit = '',
  comparisonYAxisDomain = { min: null, max: null },
  isComparisonMode = false
}: MedicionesAreaChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const xAxisData = chartData.map(d => d.fecha);
    
    // Calcular rango de fechas e intervalo de etiquetas
    const dateRangeDays = calculateDateRange(xAxisData);
    const { showTime, intervalDays } = calculateXAxisInterval(dateRangeDays);

    const series = allSeries.map((name, idx) => {
      const color = colors[idx % colors.length];
      return {
        name,
        type: 'line' as const,
        symbol: 'none' as const,
        sampling: 'lttb' as const,
        connectNulls: true,
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

    // Generar series de comparación (líneas punteadas en eje Y derecho)
    const comparisonSeriesData = comparisonSeries.map((name, idx) => {
      const color = colors[idx % colors.length];
      return {
        name,
        type: 'line' as const,
        symbol: 'none' as const,
        sampling: 'lttb' as const,
        connectNulls: true,
        yAxisIndex: 1,
        itemStyle: {
          color
        },
        lineStyle: {
          type: 'dashed' as const,
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, 0.3) },
            { offset: 1, color: hexToRgba(color, 0.05) }
          ])
        },
        data: comparisonChartData.map(d => {
          const val = d[name];
          return typeof val === 'number' && !isNaN(val) ? val : null;
        })
      };
    });

    // Combinar todas las series
    const allSeriesCombined = [...series, ...comparisonSeriesData];

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

    // Configuración del segundo eje Y (derecho) para comparación
    let comparisonYAxisConfig: any = {
      type: 'value' as const,
      boundaryGap: [0, '100%'] as [number, string],
      position: 'right' as const,
      offset: 0,
      name: comparisonUnit ? ` (${comparisonUnit})` : '',
      nameLocation: 'end' as const,
      nameGap: 40,
      nameTextStyle: {
        color: '#dcdcdc',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14
      },
      splitLine: {
        show: false
      },
      axisLabel: {
        color: '#dcdcdc',
        fontFamily: 'Inter, sans-serif'
      }
    };

    if (
      comparisonYAxisDomain.min !== null && !isNaN(comparisonYAxisDomain.min) &&
      comparisonYAxisDomain.max !== null && !isNaN(comparisonYAxisDomain.max)
    ) {
      const { min: niceMin, max: niceMax, interval } = calculateNiceInterval(
        comparisonYAxisDomain.min,
        comparisonYAxisDomain.max
      );
      comparisonYAxisConfig.min = niceMin;
      comparisonYAxisConfig.max = niceMax;
      comparisonYAxisConfig.interval = interval;
    }

    // Determinar si hay modo comparación activo
    const hasComparison = isComparisonMode && comparisonSeries.length > 0;

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
            const isComparisonSeries = p.seriesIndex >= allSeries.length;
            const unit = isComparisonSeries ? comparisonUnit : selectedMetricUnit;
            const display =
              typeof val === 'number' && !isNaN(val) ? `${val.toFixed(2)} ${unit}` : '-';
            const style = isComparisonSeries ? 'font-style: italic;' : '';
            lines.push(`${p.marker} <span style="${style}">${p.seriesName}: ${display}</span>`);
          });
          const date = params[0]?.axisValue || '';
          return `${date}<br/>${lines.join('<br/>')}`;
        }
      },
      toolbox: {
        right: hasComparison ? '6%' : '4%',
        feature: {
          dataZoom: {
            yAxisIndex: hasComparison ? [0, 1] as [number, number] : 'none' as const
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
        name: 'Tiempo',
        nameLocation: 'end' as const,
        nameTextStyle: {
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#666'
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.3)',
            type: 'solid' as const,
            width: 1
          },
          interval: dateRangeDays > 7 
            ? Math.max(1, Math.floor(xAxisData.length / 8))  // Mantener ~8 líneas de división
            : (index: number) => {
              // Para intervalos <= 7 días: mostrar línea en cada cambio de día
              if (index >= xAxisData.length - 1) return false;
              const current = xAxisData[index];
              const next = xAxisData[index + 1];
              const currentDate = current?.split(' ')[0] || current;
              const nextDate = next?.split(' ')[0] || next;
              return currentDate !== nextDate;
            }
        },
        axisLabel: {
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          interval: (() => {
            // Para > 7 días: mantener ~8 etiquetas constantes
            if (dateRangeDays > 7) {
              return Math.max(1, Math.floor(xAxisData.length / 8));
            }
            // Para todos los demás casos: dejar interval=0 y dejar que el formatter controle
            return 0;
          })(),
          formatter: (value: string, index: number) => {
            const parts = value.split(' ');
            const current = xAxisData[index];
            const prev = xAxisData[index - 1];
            
            if (!parts || parts.length === 0) return '';
            
            const currentDate = parts[0];
            const currentTime = parts[1];
            const prevDate = prev?.split(' ')[0];
            
            // Para rangos > 7 días: mostrar solo fechas, respetando el intervalo
            if (dateRangeDays > 7) {
              return currentDate;
            }
            
            // Para 1 día: mostrar horas cada 3 horas (00:00, 03:00, 06:00, etc.)
            if (dateRangeDays <= 1) {
              if (!currentTime) {
                return '';
              }
              // Solo mostrar si termina en :00
              if (currentTime.endsWith(':00')) {
                const hourMatch = currentTime.match(/^(\d+):/);
                if (hourMatch) {
                  const hour = parseInt(hourMatch[1], 10);
                  // Mostrar cada 3 horas (0, 3, 6, 9, 12, 15, 18, 21)
                  if (hour % 3 === 0) return currentTime;
                }
              }
              return '';
            }
            
            if (index === 0) {
              if (showTime && currentTime) {
                return `${currentTime}\n${currentDate}`;
              }
              return currentDate;
            }
            
            // Cambio de día: siempre mostrar la fecha
            if (prevDate !== currentDate) {
              if (showTime && currentTime) {
                return `${currentTime}\n${currentDate}`;
              }
              return currentDate;
            }
            
            // Mostrar horas para rangos cortos (1-7 días)
            if (showTime && currentTime) {
              const hourMatch = currentTime.match(/^(\d+):/);
              if (hourMatch) {
                const hour = parseInt(hourMatch[1], 10);
                
                if (dateRangeDays <= 7) {
                  if (hour % 6 === 0) return currentTime;
                }
              }
            }
            
            return '';
          }
        }
      },
      yAxis: [
        {
          ...yAxisConfig,
          name: selectedMetricUnit ? `Valor (${selectedMetricUnit})` : 'Valor',
          nameLocation: 'end' as const,
          nameGap: 30,
          nameTextStyle: {
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.25)',
              type: 'solid' as const,
              width: 1
            }
          },
          axisLabel: {
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif'
          }
        },
        hasComparison ? comparisonYAxisConfig : {}
      ].filter(Boolean) as any[],
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
        data: [...allSeries, ...comparisonSeries],
        top: 0,
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif'
        }
      },
      series: allSeriesCombined
    };
  }, [
    chartData,
    allSeries,
    selectedMetricUnit,
    yAxisDomain.min,
    yAxisDomain.max,
    colors,
    comparisonChartData,
    comparisonSeries,
    comparisonUnit,
    comparisonYAxisDomain.min,
    comparisonYAxisDomain.max,
    isComparisonMode
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

// Custom comparator para React.memo que compara contenido en lugar de referencias
const arePropsEqual = (prevProps: MedicionesAreaChartProps, nextProps: MedicionesAreaChartProps): boolean => {
  // Comparar chartData por contenido (primera y última fila)
  if (prevProps.chartData.length !== nextProps.chartData.length) return false;
  if (prevProps.chartData.length > 0) {
    const prevFirst = JSON.stringify(prevProps.chartData[0]);
    const nextFirst = JSON.stringify(nextProps.chartData[0]);
    if (prevFirst !== nextFirst) return false;
    
    const prevLast = JSON.stringify(prevProps.chartData[prevProps.chartData.length - 1]);
    const nextLast = JSON.stringify(nextProps.chartData[nextProps.chartData.length - 1]);
    if (prevLast !== nextLast) return false;
  }

  // Comparar allSeries por contenido
  if (prevProps.allSeries.length !== nextProps.allSeries.length) return false;
  if (prevProps.allSeries.some((s, i) => s !== nextProps.allSeries[i])) return false;

  // Comparar selectedMetricUnit
  if (prevProps.selectedMetricUnit !== nextProps.selectedMetricUnit) return false;

  // Comparar yAxisDomain por contenido
  if (prevProps.yAxisDomain.min !== nextProps.yAxisDomain.min || 
      prevProps.yAxisDomain.max !== nextProps.yAxisDomain.max) return false;

  // Comparar colors por contenido
  if (prevProps.colors.length !== nextProps.colors.length) return false;
  if (prevProps.colors.some((c, i) => c !== nextProps.colors[i])) return false;

  // Comparar comparisonChartData por contenido
  const prevCompData = prevProps.comparisonChartData || [];
  const nextCompData = nextProps.comparisonChartData || [];
  const prevCompDataLen = prevCompData.length;
  const nextCompDataLen = nextCompData.length;
  if (prevCompDataLen !== nextCompDataLen) return false;
  if (prevCompDataLen > 0) {
    const prevCompFirst = JSON.stringify(prevCompData[0]);
    const nextCompFirst = JSON.stringify(nextCompData[0]);
    if (prevCompFirst !== nextCompFirst) return false;
    const prevCompLast = JSON.stringify(prevCompData[prevCompDataLen - 1]);
    const nextCompLast = JSON.stringify(nextCompData[nextCompDataLen - 1]);
    if (prevCompLast !== nextCompLast) return false;
  }

  // Comparar comparisonSeries por contenido
  const prevCompSeriesLen = prevProps.comparisonSeries?.length || 0;
  const nextCompSeriesLen = nextProps.comparisonSeries?.length || 0;
  if (prevCompSeriesLen !== nextCompSeriesLen) return false;
  if (prevCompSeriesLen > 0 && prevProps.comparisonSeries?.some((s, i) => s !== nextProps.comparisonSeries?.[i])) return false;

  // Comparar comparisonUnit
  if (prevProps.comparisonUnit !== nextProps.comparisonUnit) return false;

  // Comparar comparisonYAxisDomain por contenido
  if (prevProps.comparisonYAxisDomain?.min !== nextProps.comparisonYAxisDomain?.min || 
      prevProps.comparisonYAxisDomain?.max !== nextProps.comparisonYAxisDomain?.max) return false;

  // Comparar isComparisonMode
  if (prevProps.isComparisonMode !== nextProps.isComparisonMode) return false;

  // Si todo es igual, no actualizar
  return true;
};

// Memoizar el componente con comparador personalizado
export const MedicionesAreaChart = memo(MedicionesAreaChartComponent, arePropsEqual);
