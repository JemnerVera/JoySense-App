/**
 * DetailedChartJs.tsx
 * 
 * Componente usando Recharts para mantener consistencia visual con v2
 */

import React, { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts'

export interface DetailedChartJsProps {
  data: any[]
  visibleLines: string[]
  yAxisDomain?: { min: number | null; max: number | null }
  loading?: boolean
  visibleTipos?: Set<string>
  onVisibleTiposChange?: (tipos: Set<string>) => void
}

/**
 * Gráfico detallado usando Recharts
 * Mantiene consistencia visual con v2
 */
export const DetailedChartJs: React.FC<DetailedChartJsProps> = ({
  data,
  visibleLines,
  yAxisDomain = { min: null, max: null },
  loading = false,
  visibleTipos = new Set(),
  onVisibleTiposChange,
}) => {
  console.log('[DetailedChartJs] Rendering with data:', data.length, 'visibleLines:', visibleLines.length, 'loading:', loading)

  // Función para limpiar el label (remover "Punto XX" prefix) - DEBE estar antes de useState
  const cleanLabel = (label: string): string => {
    // Remover patrones como "Punto 40 (Maceta - Sonda 10cm)" o "Punto XX - "
    return label.replace(/^Punto\s+\d+\s*[(-]?\s*/, '').replace(/[)]/g, '').trim()
  }

  // Estado local para leyenda interactiva - inicializar con TODAS las líneas visibles
  const [localVisibleTipos, setLocalVisibleTipos] = React.useState<Set<string>>(() => {
    // Inicializar con todas las líneas visibles
    return new Set(visibleLines.map(line => cleanLabel(line)))
  })

  // Generar los datos para el gráfico
  const chartData = useMemo(() => {
    console.log('[DetailedChartJs] chartData useMemo: creating datasets for', visibleLines.length, 'lines')
    return data
  }, [data])

  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
  const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4']

  // Filtrar líneas visibles basadas en checkboxes
  const filteredVisibleLines = useMemo(() => {
    if (localVisibleTipos.size === 0) {
      // Si no hay nada seleccionado, mostrar todas las líneas
      return visibleLines
    }
    
    // Filtrar por lo que está seleccionado
    return visibleLines.filter(lineKey => {
      const cleanedLabel = cleanLabel(lineKey)
      return Array.from(localVisibleTipos).some(vKey => 
        cleanedLabel.includes(vKey) || vKey === cleanedLabel
      )
    })
  }, [visibleLines, localVisibleTipos])

  const handleToggleLine = (lineKey: string) => {
    const cleanedLabel = cleanLabel(lineKey)
    const newVisible = new Set(localVisibleTipos)
    
    if (newVisible.has(cleanedLabel)) {
      newVisible.delete(cleanedLabel)
    } else {
      newVisible.add(cleanedLabel)
    }
    
    setLocalVisibleTipos(newVisible)
    if (onVisibleTiposChange) {
      onVisibleTiposChange(newVisible)
    }
  }

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

  // Calcular el dominio del eje Y
  const calculatedDomain = (() => {
    if (yAxisDomain.min !== null && !isNaN(yAxisDomain.min) && yAxisDomain.max !== null && !isNaN(yAxisDomain.max)) {
      return [yAxisDomain.min, yAxisDomain.max]
    }
    if (yAxisDomain.min !== null && !isNaN(yAxisDomain.min)) {
      const allValues: number[] = []
      chartData.forEach(point => {
        Object.keys(point).forEach(key => {
          if (key !== 'time' && typeof point[key] === 'number' && !isNaN(point[key])) {
            allValues.push(point[key])
          }
        })
      })
      const dataMax = allValues.length > 0 ? Math.max(...allValues) : yAxisDomain.min + 10
      return [yAxisDomain.min, dataMax]
    }
    if (yAxisDomain.max !== null && !isNaN(yAxisDomain.max)) {
      const allValues: number[] = []
      chartData.forEach(point => {
        Object.keys(point).forEach(key => {
          if (key !== 'time' && typeof point[key] === 'number' && !isNaN(point[key])) {
            allValues.push(point[key])
          }
        })
      })
      const dataMin = allValues.length > 0 ? Math.min(...allValues) : yAxisDomain.max - 10
      return [dataMin, yAxisDomain.max]
    }
    return ['auto', 'auto']
  })()

  // Componente personalizado para el tooltip
  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props
    
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          padding: '8px',
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: '12px',
        }}>
          <p style={{ color: '#fff', margin: '0 0 4px 0', fontWeight: 'bold' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color, margin: '2px 0' }}>
              {cleanLabel(entry.name)}: {
                typeof entry.value === 'number' 
                  ? Math.abs(entry.value) >= 1 
                    ? Math.round(entry.value).toString()
                    : entry.value.toFixed(2)
                  : entry.value
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.2} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
              interval={(() => {
                // Lógica mejorada para calcular intervalo
                // En 1 semana con datos cada 15 minutos: ~670 puntos
                // Necesitamos mostrar máximo 10-15 etiquetas
                const pointCount = chartData.length
                
                if (pointCount <= 8) return 0  // Mostrar todas
                if (pointCount <= 12) return 0  // Mostrar todas
                if (pointCount <= 24) return 1  // Mostrar cada 2a
                if (pointCount <= 48) return 2  // Mostrar cada 3a
                if (pointCount <= 96) return Math.max(2, Math.floor(pointCount / 10))
                if (pointCount <= 336) return Math.max(3, Math.floor(pointCount / 12))  // 1 semana
                return Math.max(4, Math.floor(pointCount / 10))  // Más de 1 semana
              })()}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
              domain={calculatedDomain as any}
              allowDataOverflow={false}
              allowDecimals={true}
              type="number"
              tickFormatter={(value) => {
                if (Math.abs(value) >= 1) {
                  return Math.round(value).toString()
                } else {
                  return value.toFixed(1)
                }
              }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }}
            />
            {filteredVisibleLines.length > 0 ? (
              filteredVisibleLines.map((lineKey, index) => {
                const isComparison = lineKey.startsWith('comp_')
                const strokeColor = isComparison 
                  ? comparisonColors[index % comparisonColors.length]
                  : colors[index % colors.length]
                
                return (
                  <Line
                    key={lineKey}
                    type="monotone"
                    dataKey={lineKey}
                    stroke={strokeColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                    name={cleanLabel(lineKey)}
                    connectNulls={true}
                  />
                )
              })
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Leyenda con checkboxes */}
      {visibleLines.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
          <div className="flex flex-wrap items-center gap-6 justify-center">
            {visibleLines.map((lineKey, index) => {
              const isComparison = lineKey.startsWith('comp_')
              const strokeColor = isComparison 
                ? comparisonColors[index % comparisonColors.length]
                : colors[index % colors.length]
              const cleanedLabel = cleanLabel(lineKey)
              const isVisible = localVisibleTipos.size === 0 || localVisibleTipos.has(cleanedLabel)
              
              return (
                <div key={lineKey} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => handleToggleLine(lineKey)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div 
                    className="w-4 h-1 rounded-full" 
                    style={{ backgroundColor: strokeColor }}
                  />
                  <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono font-bold">
                    {cleanedLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DetailedChartJs
