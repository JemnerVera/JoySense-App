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

// Función para calcular el rango de fechas en días
function calculateDateRange(xAxisData: string[]): number {
  if (xAxisData.length < 2) return 0;
  
  const firstDate = xAxisData[0]?.split(' ')[0];
  const lastDate = xAxisData[xAxisData.length - 1]?.split(' ')[0];
  
  console.log('[calculateDateRange] firstDate:', firstDate, 'lastDate:', lastDate);
  
  if (!firstDate || !lastDate) return 0;
  
  const [d1, m1] = firstDate.split('/').map(Number);
  const [d2, m2] = lastDate.split('/').map(Number);
  
  // Usar el año actual como predeterminado
  const currentYear = new Date().getFullYear();
  let y1 = currentYear;
  let y2 = currentYear;
  
  // Si el mes del final es menor que el del inicio, asumir que cambió de año
  if (m2 < m1) {
    y2 = currentYear + 1;
  }
  
  console.log('[calculateDateRange] parsed d1:', d1, 'm1:', m1, 'y1:', y1);
  console.log('[calculateDateRange] parsed d2:', d2, 'm2:', m2, 'y2:', y2);
  
  const dateFirst = new Date(y1, m1 - 1, d1);
  const dateLast = new Date(y2, m2 - 1, d2);
  
  console.log('[calculateDateRange] dateFirst:', dateFirst, 'dateLast:', dateLast);
  
  const diffTime = Math.abs(dateLast.getTime() - dateFirst.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  console.log('[calculateDateRange] RESULT:', diffDays);
  
  return diffDays;
}

// Función para determinar el intervalo de etiquetas del eje X según el rango
function calculateXAxisInterval(dateRangeDays: number): {
  showTime: boolean;
  intervalDays: number;
} {
  if (dateRangeDays <= 1) {
    // Menos de 1 día: mostrar horas cada 1-2 puntos
    return { showTime: true, intervalDays: 0 }; // 0 significa que se maneja por horas
  } else if (dateRangeDays <= 7) {
    // 1-7 días: mostrar horas cada 6 horas
    return { showTime: true, intervalDays: 0 };
  } else if (dateRangeDays <= 14) {
    // 1-2 semanas: mostrar horas pero solo cada 12 horas aprox
    return { showTime: true, intervalDays: 0 };
  } else if (dateRangeDays <= 28) {
    // 2-4 semanas: solo fechas, sin horas
    return { showTime: false, intervalDays: 1 };
  } else {
    // Más de 4 semanas: solo fechas cada 2-3 días
    return { showTime: false, intervalDays: 3 };
  }
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
    
    // Calcular rango de fechas e intervalo de etiquetas
    const dateRangeDays = calculateDateRange(xAxisData);
    const { showTime, intervalDays } = calculateXAxisInterval(dateRangeDays);
    
    // Log de todas las fechas únicas
    const uniqueDates = new Set(xAxisData.map(x => x?.split(' ')[0] || x));
    console.log(`[MedicionesAreaChart] Total puntos: ${xAxisData.length}, Fechas únicas: ${uniqueDates.size}`);
    console.log(`[MedicionesAreaChart] Rango de fechas: ${dateRangeDays} días | showTime=${showTime}, intervalDays=${intervalDays}`);
    console.log('[MedicionesAreaChart] Primeras 3 fechas:', xAxisData.slice(0, 3));
    console.log('[MedicionesAreaChart] Últimas 3 fechas:', xAxisData.slice(-3));
    
    // DEBUG: Logs para interval y labels
    if (dateRangeDays > 21) {
      const intervalValue = Math.max(1, Math.floor(xAxisData.length / 8));
      console.log(`[MedicionesAreaChart] INTERVALO CALCULADO: ${intervalValue} (para ${xAxisData.length} puntos, buscando ~8 etiquetas)`);
      console.log(`[MedicionesAreaChart] Esto significa: 1 etiqueta cada ${intervalValue} puntos`);
    }

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
          interval: (() => {
            if (dateRangeDays > 21) {
              const intervalValue = Math.max(1, Math.floor(xAxisData.length / 8));
              console.log(`[splitLine] interval SET TO: ${intervalValue}`);
              return intervalValue;
            }
            console.log(`[splitLine] using function for dateRangeDays=${dateRangeDays}`);
            return (index: number) => {
              // Para intervalos <= 21 días: mostrar línea en cada cambio de día
              if (index >= xAxisData.length - 1) return false;
              const current = xAxisData[index];
              const next = xAxisData[index + 1];
              const currentDate = current?.split(' ')[0] || current;
              const nextDate = next?.split(' ')[0] || next;
              return currentDate !== nextDate;
            }
          })()
        },
        axisLabel: {
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          interval: (() => {
            if (dateRangeDays > 21) {
              const intervalValue = Math.max(1, Math.floor(xAxisData.length / 8));
              console.log(`[axisLabel] interval SET TO: ${intervalValue}`);
              return intervalValue;
            }
            console.log(`[axisLabel] interval SET TO: 0 (dateRangeDays=${dateRangeDays})`);
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
            
            // Para rangos > 21 días: mostrar solo fechas, respetando el intervalo
            if (dateRangeDays > 21) {
              if (index === 0 || index === xAxisData.length - 1) {
                console.log(`[formatter] index=${index}, dateRangeDays=${dateRangeDays}, returning: ${currentDate}`);
              }
              return currentDate;
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
            
            // Mostrar horas para rangos cortos
            if (showTime && currentTime) {
              const hourMatch = currentTime.match(/^(\d+):/);
              if (hourMatch) {
                const hour = parseInt(hourMatch[1], 10);
                
                if (dateRangeDays <= 1) {
                  if (hour % 3 === 0) return currentTime;
                } else if (dateRangeDays <= 7) {
                  if (hour % 6 === 0) return currentTime;
                } else if (dateRangeDays <= 14) {
                  if (hour % 12 === 0) return currentTime;
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
