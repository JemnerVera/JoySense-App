/**
 * DetailedEChart.tsx
 * 
 * Componente usando ECharts (como MedicionesDashboard)
 * Reemplaza DetailedChartJs para mejorar el rendimiento y funcionalidad
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

export interface DetailedEChartProps {
  data: any[];
  visibleLines: string[];
  yAxisDomain?: { min: number | null; max: number | null };
  loading?: boolean;
  visibleTipos?: Set<string>;
  onVisibleTiposChange?: (tipos: Set<string>) => void;
  metricUnit?: string;
  selectedNode?: any | null;
  comparisonNode?: any | null;
  mainLocalizacionLabel?: string;
  comparisonLocalizacionLabel?: string;
  fillHeight?: boolean;
  showLegend?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function calculateNiceInterval(min: number, max: number): { min: number; max: number; interval: number } {
  if (min === null || max === null || min === undefined || max === undefined) {
    return { min: undefined as any, max: undefined as any, interval: undefined as any };
  }

  const range = max - min;
  const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
  const normalizedRange = range / magnitude;

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

  let roundedMin: number;
  if (min > 0) {
    roundedMin = Math.max(0, Math.floor(min / interval) * interval);
  } else {
    roundedMin = Math.floor(min / interval) * interval;
  }

  const roundedMax = Math.ceil(max / interval) * interval;

  return {
    min: roundedMin,
    max: roundedMax,
    interval
  };
}

// Función para calcular el rango de fechas en días
function calculateDateRange(xAxisData: string[]): number {
  if (xAxisData.length < 2) return 0;
  
  const firstDate = xAxisData[0]?.split(' ')[0];
  const lastDate = xAxisData[xAxisData.length - 1]?.split(' ')[0];
  
  if (!firstDate || !lastDate) return 0;
  
  const [d1, m1, y1] = firstDate.split('/').map(Number);
  const [d2, m2, y2] = lastDate.split('/').map(Number);
  
  const dateFirst = new Date(y1, m1 - 1, d1);
  const dateLast = new Date(y2, m2 - 1, d2);
  
  const diffTime = Math.abs(dateLast.getTime() - dateFirst.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays;
}

// Función para determinar el intervalo de etiquetas del eje X según el rango
// SINCRONIZADO con MedicionesAreaChart.tsx
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
  } else if (dateRangeDays <= 21) {
    // 1-3 semanas: mostrar horas (más detalle como si fuera > 3 semanas)
    return { showTime: true, intervalDays: 0 };
  } else if (dateRangeDays <= 28) {
    // 3-4 semanas: solo fechas, sin horas
    return { showTime: false, intervalDays: 1 };
  } else {
    // Más de 4 semanas: solo fechas cada 2-3 días
    return { showTime: false, intervalDays: 3 };
  }
}

function cleanLabel(label: string): string {
  let cleaned = label.replace(/^comp_/, '');
  cleaned = cleaned.replace(/^Punto\s+\d+\s*[(-]?\s*/, '').replace(/[)]/g, '').trim();
  
  const macetaMatch = cleaned.match(/Maceta\s+-\s+Sonda\s+\d+cm/);
  if (macetaMatch) {
    return macetaMatch[0];
  }
  
  const sueloMatch = cleaned.match(/Suelo\s+-\s+Sonda\s+\d+cm/);
  if (sueloMatch) {
    return sueloMatch[0];
  }
  
  return cleaned;
}

export const DetailedEChart: React.FC<DetailedEChartProps> = ({
  data,
  visibleLines,
  yAxisDomain = { min: null, max: null },
  loading = false,
  visibleTipos = new Set(),
  onVisibleTiposChange,
  metricUnit = '',
  selectedNode = null,
  comparisonNode = null,
  mainLocalizacionLabel,
  comparisonLocalizacionLabel,
  fillHeight = false,
  showLegend = true,
}) => {
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
  const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4'];

  const isComparisonLine = (label: string): boolean => label.startsWith('comp_');

  const sortBySondaNumber = (lines: string[]): string[] => {
    return [...lines].sort((a, b) => {
      const aLabel = cleanLabel(a);
      const bLabel = cleanLabel(b);
      const aMatch = aLabel.match(/Sonda\s+(\d+)cm/);
      const bMatch = bLabel.match(/Sonda\s+(\d+)cm/);
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      return 0;
    });
  };

  // Filtrar líneas visibles
  const filteredVisibleLines = useMemo(() => {
    if (visibleTipos.size === 0) {
      return visibleLines;
    }
    
    return visibleLines.filter(lineKey => {
      const cleanedLabel = cleanLabel(lineKey);
      const isComp = isComparisonLine(lineKey);
      const prefix = isComp ? 'comp:' : 'main:';
      const fullKey = prefix + cleanedLabel;
      
      return Array.from(visibleTipos).some(vKey => vKey === cleanedLabel || vKey === fullKey);
    });
  }, [visibleLines, visibleTipos]);

  const option = useMemo<EChartsOption>(() => {
    const xAxisData = data.map(d => d.time || d.fecha || '');
    
    // Calcular rango de fechas e intervalo de etiquetas
    const dateRangeDays = calculateDateRange(xAxisData);
    const { showTime, intervalDays } = calculateXAxisInterval(dateRangeDays);

    // Crear series solo para líneas visibles
    const series = filteredVisibleLines.map((lineKey, idx) => {
      const isComp = isComparisonLine(lineKey);
      const mainNodeLines = visibleLines.filter(line => !isComparisonLine(line));
      const comparisonNodeLines = sortBySondaNumber(visibleLines.filter(line => isComparisonLine(line)));
      
      let colorIndex: number;
      let colorArray: string[];
      
      if (isComp) {
        colorIndex = comparisonNodeLines.findIndex(line => line === lineKey);
        colorArray = comparisonColors;
      } else {
        colorIndex = mainNodeLines.findIndex(line => line === lineKey);
        colorArray = colors;
      }
      
      const color = colorArray[colorIndex % colorArray.length];

      return {
        name: cleanLabel(lineKey),
        type: 'line' as const,
        symbol: 'none' as const,
        sampling: 'lttb' as const,
        itemStyle: {
          color
        },
        lineStyle: {
          type: isComp ? 'dashed' : 'solid' as any,
          dashOffset: 0
        },
        areaStyle: isComp ? undefined : {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, 0.3) },
            { offset: 1, color: hexToRgba(color, 0.05) }
          ])
        },
        data: data.map(d => {
          const val = d[lineKey];
          return typeof val === 'number' && !isNaN(val) ? val : null;
        })
      };
    });

    let yAxisConfig: any = {
      type: 'value' as const,
      boundaryGap: [0, '100%'] as [number, string]
    };

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
              typeof val === 'number' && !isNaN(val) ? `${val.toFixed(2)} ${metricUnit}` : '-';
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
        data: filteredVisibleLines.map(line => cleanLabel(line)),
        top: 0,
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif'
        }
      },
      series
    };
  }, [data, filteredVisibleLines, metricUnit, yAxisDomain.min, yAxisDomain.max, visibleLines, colors, comparisonColors]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-neutral-400 font-mono">
            Cargando datos...
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-gray-600 dark:text-neutral-400 font-mono">
            No hay datos disponibles
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: fillHeight ? '100%' : '400px', width: '100%' }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
      />
    </div>
  );
};

export default DetailedEChart;
