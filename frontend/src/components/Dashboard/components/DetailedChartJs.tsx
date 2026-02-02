/**
 * DetailedChartJs.tsx
 * 
 * Componente alternativo usando Chart.js en lugar de Recharts
 * Más robusto y predecible para renderizar gráficos complejos
 */

import React, { useEffect, useRef, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Chart,
  LineController,
} from 'chart.js'

// Registrar componentes de ChartJS
ChartJS.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export interface DetailedChartJsProps {
  data: any[]
  visibleLines: string[]
  yAxisDomain?: { min: number | null; max: number | null }
  loading?: boolean
  visibleTipos?: Set<string>
}

/**
 * Gráfico detallado usando Chart.js
 * Alternativa más robusta a Recharts
 */
export const DetailedChartJs: React.FC<DetailedChartJsProps> = ({
  data,
  visibleLines,
  yAxisDomain = { min: null, max: null },
  loading = false,
  visibleTipos = new Set(),
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart<'line', any[], string> | null>(null)

  console.log('[DetailedChartJs] Rendering with data:', data.length, 'visibleLines:', visibleLines.length, 'loading:', loading)

  // Generar los datos para el gráfico
  // IMPORTANTE: Renderizar TODAS las líneas disponibles, sin filtrar por visibleTipos
  // visibleTipos es para otro propósito (toggle de series en la UI)
  const chartData = useMemo(() => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
    
    console.log('[DetailedChartJs] chartData useMemo: creating datasets for', visibleLines.length, 'lines')
    
    // Renderizar TODAS las líneas sin filtrar
    const datasets = visibleLines.map((line, idx) => ({
      label: line,
      data: data.map((point: any) => point[line] ?? null),
      borderColor: colors[idx % colors.length],
      backgroundColor: `${colors[idx % colors.length]}20`,
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      spanGaps: true,
    }))

    console.log('[DetailedChartJs] Created', datasets.length, 'datasets')

    return {
      labels: data.map((point: any) => point.time || ''),
      datasets,
    }
  }, [data, visibleLines])

  // Crear el gráfico con Chart.js
  useEffect(() => {
    console.log('[DetailedChartJs] useEffect: canvasRef.current:', !!canvasRef.current, 'data.length:', data.length)
    if (!canvasRef.current || !data || data.length === 0) {
      console.log('[DetailedChartJs] useEffect: Returning early')
      return
    }

    // Destruir gráfico anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    try {
      const ctx = canvasRef.current.getContext('2d')
      console.log('[DetailedChartJs] Got 2d context:', !!ctx)
      if (!ctx) return

      console.log('[DetailedChartJs] Creating chart with', chartData.datasets.length, 'datasets')
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top' as const,
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            x: {
              display: true,
              grid: {
                display: false,
              },
              ticks: {
                maxRotation: 45,
                minRotation: 0,
                maxTicksLimit: 8,
              },
            },
            y: {
              display: true,
              beginAtZero: false,
              min: yAxisDomain.min ?? undefined,
              max: yAxisDomain.max ?? undefined,
              ticks: {
                callback: function(value) {
                  if (typeof value === 'number') {
                    if (Math.abs(value) >= 1) {
                      return Math.round(value).toString()
                    } else {
                      return value.toFixed(1)
                    }
                  }
                  return value.toString()
                },
              },
            },
          },
        } as ChartOptions<'line'>,
      })
      console.log('[DetailedChartJs] Chart created successfully')
    } catch (error) {
      console.error('[DetailedChartJs] Error creating chart:', error)
    }

    return () => {
      console.log('[DetailedChartJs] Cleanup: destroying chart')
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [chartData, yAxisDomain])

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
    )
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
    )
  }

  return (
    <div style={{ height: '400px', position: 'relative', width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default DetailedChartJs
