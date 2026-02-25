import React, { useMemo } from 'react';
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
    
    // Calcular rango de fechas e intervalo de etiquetas
    const dateRangeDays = calculateDateRange(xAxisData);
    const { showTime, intervalDays } = calculateXAxisInterval(dateRangeDays);
    
    // Log de todas las fechas únicas
    const uniqueDates = new Set(xAxisData.map(x => x?.split(' ')[0] || x));
    console.log(`[MedicionesAreaChart] Total puntos: ${xAxisData.length}, Fechas únicas: ${uniqueDates.size}`);
    console.log(`[MedicionesAreaChart] Rango de fechas: ${dateRangeDays} días | showTime=${showTime}, intervalDays=${intervalDays}`);
    console.log('[MedicionesAreaChart] Primeras 3 fechas:', xAxisData.slice(0, 3));
    console.log('[MedicionesAreaChart] Últimas 3 fechas:', xAxisData.slice(-3));

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
              if (index === 0 || index === xAxisData.length - 1) {
                console.log(`[formatter] dateRangeDays > 7, index=${index}, returning date: ${currentDate}`);
              }
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
      yAxis: {
        ...yAxisConfig,
        name: 'Valor',
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
          color: '#ffffff',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif'
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
