import React, { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
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
 * Evita re-renderizados innecesarios cuando cambian otros props
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: '#9ca3af',
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
                }}
                interval={(() => {
                  if (chartData.length <= 5) return 0
                  if (chartData.length <= 10) return 1
                  return Math.floor(chartData.length / 4)
                })()}
              />
              <YAxis hide domain={['auto', 'auto']} />
              {seriesKeys.map((seriesKey, index) => (
                <Line
                  key={seriesKey}
                  type="monotone"
                  dataKey={seriesKey}
                  name={labelSimplification[seriesKey]}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: colors[index % colors.length],
                    stroke: colors[index % colors.length],
                    strokeWidth: 2
                  }}
                  strokeOpacity={0.8}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              ))}
              <Legend
                verticalAlign="bottom"
                height={20}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '9px',
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                  paddingTop: '10px'
                }}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const isDate = label && typeof label === 'string' && label.includes('/')
                  return (
                    <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                      {isDate ? label : `${t('dashboard.tooltip.hour')} ${label}`}
                    </span>
                  )
                }}
                formatter={(value: number, name: string) => {
                  const simplifiedName = labelSimplification[name] || name
                  return [
                    <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                      {simplifiedName}: {value ? value.toFixed(1) : '--'} {metric.unit}
                    </span>
                  ]
                }}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                  padding: '8px 12px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
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
