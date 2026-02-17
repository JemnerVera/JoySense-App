import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { MetricConfig } from '../types'

interface MetricMiniChartProps {
  metric: MetricConfig
  chartData: any[]
  currentValue: number
  hasData: boolean
  onOpenAnalysis: (metric: MetricConfig) => void
  t: any
}

/**
 * Componente memoizado para renderizar un minigráfico de métrica
 * Usa ECharts con lógica sofisticada del eje X similar a MedicionesAreaChart
 */
function MetricMiniChartComponent({
  metric,
  chartData,
  currentValue,
  hasData,
  onOpenAnalysis,
  t
}: MetricMiniChartProps) {
  // Memoizar el cálculo de series keys para evitar recálculos
  const seriesKeys = useMemo(() => {
    if (!chartData || chartData.length === 0) return []
    
    // Obtener keys únicas y mantener orden ascendente
    const uniqueKeys = Array.from(
      new Set(
        chartData.flatMap(item => Object.keys(item).filter(key => key !== 'time'))
      )
    )
    
    // Ordenar alfabéticamente para consistencia
    return uniqueKeys.sort()
  }, [chartData])

  // Mapeo de etiquetas completas a etiquetas simples (solo sensor)
  // Extrae "Suelo - Sonda 20cm" de "LOTE 124 HILERA 56 (Suelo - Sonda 20cm)"
  const labelSimplification = useMemo(() => {
    const map: { [key: string]: string } = {}
    seriesKeys.forEach(key => {
      // Extraer la parte dentro de paréntesis si existe
      const match = key.match(/\(([^)]+)\)/)
      map[key] = match ? match[1] : key
    })
    return map
  }, [seriesKeys])

  const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#10b981']

  // Función para calcular el rango de fechas en días
  const calculateDateRange = (xAxisData: string[]): number => {
    if (xAxisData.length < 2) return 0;
    
    const firstDate = xAxisData[0]?.split(' ')[0];
    const lastDate = xAxisData[xAxisData.length - 1]?.split(' ')[0];
    
    if (!firstDate || !lastDate) return 0;
    
    const [d1, m1, y1] = firstDate.split('/').map(Number);
    const [d2, m2, y2] = lastDate.split('/').map(Number);
    
    const dateFirst = new Date(y1 || new Date().getFullYear(), m1 - 1, d1);
    const dateLast = new Date(y2 || new Date().getFullYear(), m2 - 1, d2);
    
    const diffTime = Math.abs(dateLast.getTime() - dateFirst.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  // Función para determinar el intervalo de etiquetas del eje X según el rango
  // SINCRONIZADO con MedicionesAreaChart.tsx
  const calculateXAxisInterval = (dateRangeDays: number): { showTime: boolean; intervalDays: number } => {
    if (dateRangeDays <= 1) {
      return { showTime: true, intervalDays: 0 };
    } else if (dateRangeDays <= 7) {
      return { showTime: true, intervalDays: 0 };
    } else if (dateRangeDays <= 21) {
      return { showTime: true, intervalDays: 0 };
    } else if (dateRangeDays <= 28) {
      return { showTime: false, intervalDays: 1 };
    } else {
      return { showTime: false, intervalDays: 3 };
    }
  };

  // Crear opción de ECharts
  const option = useMemo<EChartsOption>(() => {
    if (!chartData || chartData.length === 0) {
      return { xAxis: { data: [] }, yAxis: {}, series: [] };
    }

    const xAxisData = chartData.map(d => d.time || '');
    
    // Calcular rango de fechas e intervalo de etiquetas
    const dateRangeDays = calculateDateRange(xAxisData);
    const { showTime, intervalDays } = calculateXAxisInterval(dateRangeDays);

    // Crear series
    const series = seriesKeys.map((seriesKey, idx) => ({
      name: labelSimplification[seriesKey],
      type: 'line' as const,
      symbol: 'none' as const,
      sampling: 'lttb' as const,
      itemStyle: {
        color: colors[idx % colors.length]
      },
      lineStyle: {
        color: colors[idx % colors.length],
        width: 2
      },
      data: chartData.map(d => {
        const val = d[seriesKey];
        return typeof val === 'number' && !isNaN(val) ? val : null;
      })
    }));

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
              typeof val === 'number' && !isNaN(val) ? `${val.toFixed(1)} ${metric.unit}` : '-';
            lines.push(`${p.marker} ${p.seriesName}: ${display}`);
          });
          const date = params[0]?.axisValue || '';
          return `${date}<br/>${lines.join('<br/>')}`;
        }
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '8%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category' as const,
        boundaryGap: false,
        data: xAxisData,
        axisLine: {
          show: true,
          lineStyle: { color: '#666' }
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: { color: '#666' }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)',
            type: 'solid' as const,
            width: 1
          },
          interval: dateRangeDays > 7 
            ? Math.max(1, Math.floor(xAxisData.length / 4))  // ~4 líneas para minigráfico
            : (index: number) => {
              if (index >= xAxisData.length - 1) return false;
              const current = xAxisData[index];
              const next = xAxisData[index + 1];
              const currentDate = current?.split(' ')[0] || current;
              const nextDate = next?.split(' ')[0] || next;
              return currentDate !== nextDate;
            }
        },
        axisLabel: {
          color: '#9ca3af',
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: 10,
          interval: (() => {
            if (dateRangeDays > 7) {
              return Math.max(1, Math.floor(xAxisData.length / 4));
            }
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
            
            // Para rangos > 7 días: mostrar solo fechas
            if (dateRangeDays > 7) {
              return currentDate;
            }
            
            // Para 1 día: mostrar horas cada 3 horas
            if (dateRangeDays <= 1) {
              if (!currentTime) return '';
              if (currentTime.endsWith(':00')) {
                const hourMatch = currentTime.match(/^(\d+):/);
                if (hourMatch) {
                  const hour = parseInt(hourMatch[1], 10);
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
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#9ca3af',
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: 10
        }
      },
      legend: {
        show: seriesKeys.length > 1,
        bottom: 0,
        textStyle: {
          color: '#9ca3af',
          fontSize: 9,
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
        }
      },
      series
    };
  }, [chartData, seriesKeys, labelSimplification, metric.unit]);

  return (
    <div
      className={`bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-500/20 p-6 group ${
        !hasData ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl text-gray-800 dark:text-white">
            {metric.id === 'temperatura' ? '🌡' : metric.id === 'humedad' ? '💧' : '⚡'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white font-mono tracking-wider">
              {metric.title}
            </h3>
          </div>
        </div>
        {!hasData && (
          <span className="px-2 py-1 text-xs font-bold rounded-full border bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 font-mono tracking-wider">
            NODO OBSERVADO
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-end space-x-2 mb-4">
        <span className="text-3xl font-bold text-blue-500 font-mono">
          {hasData && typeof currentValue === 'number' ? currentValue.toFixed(1) : '--'}
        </span>
        <span className="text-sm text-neutral-400 font-mono">{metric.unit}</span>
      </div>

      <div className="h-32 mb-4">
        {hasData ? (
          <div style={{ width: '100%', height: '100%' }}>
            <ReactECharts
              option={option}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="text-center text-blue-700 dark:text-blue-400 mb-3">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-xs font-mono">Sin datos en las últimas 3 horas</p>
            </div>
          </div>
        )}
      </div>

      {hasData && (
        <button
          onClick={() => onOpenAnalysis(metric)}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm font-mono"
        >
          📈 Análisis Detallado
        </button>
      )}
    </div>
  )
}

export const MetricMiniChart = React.memo(MetricMiniChartComponent, (prevProps, nextProps) => {
  // Comparación personalizada para memoización
  // Re-renderizar solo si estos props cambian
  return (
    prevProps.metric.id === nextProps.metric.id &&
    prevProps.chartData === nextProps.chartData &&
    prevProps.currentValue === nextProps.currentValue &&
    prevProps.hasData === nextProps.hasData
  )
})

MetricMiniChart.displayName = 'MetricMiniChart'
