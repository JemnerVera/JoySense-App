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
  metricUnit?: string  // Unidad de la métrica para mostrar en tooltip
  selectedNode?: any | null  // Nodo principal
  comparisonNode?: any | null  // Nodo de comparación
  mainLocalizacionLabel?: string  // Etiqueta para leyenda (ej. "LOTE T1 HILERA 6")
  comparisonLocalizacionLabel?: string  // Etiqueta para comparación
  fillHeight?: boolean  // Cuando true, el gráfico ocupa todo el espacio disponible
  showLegend?: boolean  // Cuando true, muestra la leyenda (default: true)
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
  metricUnit = '',
  selectedNode = null,
  comparisonNode = null,
  mainLocalizacionLabel,
  comparisonLocalizacionLabel,
  fillHeight = false,
  showLegend = true,
}) => {
  // Función para limpiar el label (remover "Punto XX" prefix y "comp_") - DEBE estar antes de useState
  const cleanLabel = (label: string): string => {
    // Remover prefijo "comp_" si existe
    let cleaned = label.replace(/^comp_/, '')
    // Remover patrones como "Punto 40 (Maceta - Sonda 10cm)" o "Punto XX - "
    cleaned = cleaned.replace(/^Punto\s+\d+\s*[(-]?\s*/, '').replace(/[)]/g, '').trim()
    
    // Extraer solo la parte "Maceta - Sonda XXcm" si existe
    // Buscar el patrón "Maceta - Sonda \d+cm" y extraerlo
    const macetaMatch = cleaned.match(/Maceta\s+-\s+Sonda\s+\d+cm/)
    if (macetaMatch) {
      return macetaMatch[0]
    }
    
    return cleaned
  }
  
  // Función para detectar si una línea es de comparación
  const isComparisonLine = (label: string): boolean => {
    return label.startsWith('comp_')
  }

  // Función para ordenar líneas por número de sonda (10cm, 20cm, 30cm, etc.)
  const sortBySondaNumber = (lines: string[]): string[] => {
    const sorted = [...lines].sort((a, b) => {
      const aLabel = cleanLabel(a)
      const bLabel = cleanLabel(b)
      const aMatch = aLabel.match(/Sonda\s+(\d+)cm/)
      const bMatch = bLabel.match(/Sonda\s+(\d+)cm/)
      
      console.log(`Comparing: "${aLabel}" (${aMatch?.[1]}) vs "${bLabel}" (${bMatch?.[1]})`)
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1])
      }
      
      return 0
    })
    console.log('Sorted result:', sorted)
    return sorted
  }

  // Estado local para leyenda interactiva - inicializar con TODAS las líneas visibles
  const [localVisibleTipos, setLocalVisibleTipos] = React.useState<Set<string>>(() => {
    // Inicializar con todas las líneas visibles
    const initial = new Set(visibleLines.map(line => cleanLabel(line)))
    return initial
  })
  
  // Sincronizar localVisibleTipos con la prop visibleTipos cuando cambia
  React.useEffect(() => {
    // Si visibleTipos tiene items, usarlos directamente
    if (visibleTipos.size > 0) {
      setLocalVisibleTipos(new Set(visibleTipos))
    } else {
      // Si está vacío, mostrar todas las líneas
      setLocalVisibleTipos(new Set(visibleLines.map(line => cleanLabel(line))))
    }
  }, [visibleTipos, visibleLines])

  // Generar los datos para el gráfico
  const chartData = useMemo(() => {
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
    const filtered = visibleLines.filter(lineKey => {
      const cleanedLabel = cleanLabel(lineKey)
      const isComp = lineKey.startsWith('comp_')
      const prefix = isComp ? 'comp:' : 'main:'
      const fullKey = prefix + cleanedLabel
      
      const isIncluded = Array.from(localVisibleTipos).some(vKey => vKey === cleanedLabel || vKey === fullKey)
      return isIncluded
    })
    
    return filtered
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
                  ? entry.value.toFixed(2)
                  : entry.value
              } {metricUnit}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={fillHeight ? 'flex flex-col min-h-0 flex-1' : ''}>
      {/* Leyenda con checkboxes - ARRIBA del gráfico, separada en dos grupos */}
      {showLegend && visibleLines.length > 0 && (
        <div className={`border-b border-gray-300 dark:border-neutral-600 flex-shrink-0 ${fillHeight ? 'mb-2 pb-1' : 'mb-3 pb-2'} overflow-y-auto max-h-[25vh]`}>
          {/* Obtener líneas del nodo principal y de comparación */}
          {(() => {
            const mainNodeLines = visibleLines.filter(line => !isComparisonLine(line))
            const comparisonNodeLines = sortBySondaNumber(visibleLines.filter(line => isComparisonLine(line)))
            
            console.log('=== LEGEND - DetailedChartJs ===')
            console.log('visibleLines:', visibleLines)
            console.log('mainNodeLines:', mainNodeLines)
            console.log('comparisonNodeLines (sorted):', comparisonNodeLines)
            console.log('colors:', colors)
            console.log('comparisonColors:', comparisonColors)
            
            return (
              <div className={`flex flex-col ${fillHeight ? 'gap-2' : 'gap-3'}`}>
                {/* Grupo Localización Principal */}
                {mainNodeLines.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 mb-2 px-2 font-mono">
                      LOCALIZACIÓN PRINCIPAL {mainLocalizacionLabel ? `(${mainLocalizacionLabel})` : ''}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 justify-center">
                      {mainNodeLines.map((lineKey) => {
                        // Obtener el índice original de visibleLines para mantener colores consistentes
                        const originalIndex = visibleLines.indexOf(lineKey)
                        const strokeColor = colors[originalIndex % colors.length]
                        const cleanedLabel = cleanLabel(lineKey)
                        const isVisible = localVisibleTipos.size === 0 || localVisibleTipos.has(cleanedLabel)
                        
                        return (
                          <div key={lineKey} className="flex items-center gap-1.5">
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
                
                {/* Grupo Localización Comparación */}
                {comparisonNodeLines.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 mb-2 px-2 font-mono">
                      LOCALIZACIÓN COMPARACIÓN {comparisonLocalizacionLabel ? `(${comparisonLocalizacionLabel})` : ''}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 justify-center">
                      {comparisonNodeLines.map((lineKey, comparisonIndex) => {
                        // Usar índice separado solo para líneas de comparación
                        const strokeColor = comparisonColors[comparisonIndex % comparisonColors.length]
                        const cleanedLabel = cleanLabel(lineKey)
                        const isVisible = localVisibleTipos.size === 0 || localVisibleTipos.has(cleanedLabel)
                        
                        console.log(`[LEGEND] lineKey: ${lineKey}, cleanedLabel: ${cleanedLabel}, comparisonIndex: ${comparisonIndex}, strokeColor: ${strokeColor}`)
                        
                        return (
                          <div key={lineKey} className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => handleToggleLine(lineKey)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <svg className="w-4 h-1.5" viewBox="0 0 16 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <line x1="0" y1="1.5" x2="16" y2="1.5" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="3 2" strokeLinecap="round" />
                            </svg>
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
          })()}
        </div>
      )}
      
      {/* Gráfico - ABAJO de la leyenda */}
      <div className={fillHeight ? 'flex-1 min-h-0' : 'h-96'}>
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
            {(() => {
              const mainNodeLines = visibleLines.filter(line => !isComparisonLine(line))
              const comparisonNodeLines = sortBySondaNumber(visibleLines.filter(line => isComparisonLine(line)))
              
              console.log('=== CHART RENDER - DetailedChartJs ===')
              console.log('filteredVisibleLines:', filteredVisibleLines)
              console.log('mainNodeLines:', mainNodeLines)
              console.log('comparisonNodeLines (sorted):', comparisonNodeLines)
              
              return filteredVisibleLines.length > 0 ? (
                filteredVisibleLines.map((lineKey) => {
                  const isComparison = isComparisonLine(lineKey)
                  
                  // Calcular índice separado para líneas de comparación vs principales
                  let strokeColor: string
                  if (isComparison) {
                    const comparisonIndex = comparisonNodeLines.findIndex(line => line === lineKey)
                    strokeColor = comparisonColors[comparisonIndex % comparisonColors.length]
                    console.log(`[CHART] lineKey: ${lineKey}, comparisonIndex: ${comparisonIndex}, strokeColor: ${strokeColor}`)
                  } else {
                    const mainIndex = mainNodeLines.findIndex(line => line === lineKey)
                    strokeColor = colors[mainIndex % colors.length]
                    console.log(`[CHART] lineKey: ${lineKey}, mainIndex: ${mainIndex}, strokeColor: ${strokeColor}`)
                  }
                
                return (
                  <Line
                    key={lineKey}
                    type="monotone"
                    dataKey={lineKey}
                    stroke={strokeColor}
                    strokeWidth={2}
                    strokeDasharray={isComparison ? "5 5" : "0"}  // Punteadas para comparación
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                    name={cleanLabel(lineKey)}
                    connectNulls={true}
                  />
                )
                })
              ) : null
            })()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DetailedChartJs
