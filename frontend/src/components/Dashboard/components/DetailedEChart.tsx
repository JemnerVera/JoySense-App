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
import { hexToRgba, calculateDateRange, calculateXAxisInterval, calculateNiceInterval } from '../../../utils/chartUtils';

export interface DetailedEChartProps {
  data: any[];
  comparisonData?: any[];
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
  comparisonData = [],
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
    // Usar solo los tiempos del dataset principal para evitar gaps en las líneas
    // Los datos de comparación se mostrarán donde coincidan los tiempos
    const xAxisData = data.map(d => d.time || d.fecha || '')
    
    // Crear mapa para acceso rápido a datos de comparación por tiempo
    const compDataMap = new Map(comparisonData.map(d => [d.time || d.fecha, d]))
    
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
        // Para comparison lines, buscar en compDataMap; para main, usar data directamente
        data: xAxisData.map(timeKey => {
          if (isComp) {
            const compData = compDataMap.get(timeKey)
            if (!compData) return null
            const val = compData[lineKey]
            return typeof val === 'number' && !isNaN(val) ? val : null
          } else {
            const d = data.find(item => (item.time || item.fecha) === timeKey)
            if (!d) return null
            const val = d[lineKey]
            return typeof val === 'number' && !isNaN(val) ? val : null
          }
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
