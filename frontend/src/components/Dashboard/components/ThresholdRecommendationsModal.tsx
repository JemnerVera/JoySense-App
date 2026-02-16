import React from 'react'
import type { MetricConfig } from '../types'

interface ThresholdRecommendation {
  min: number
  max: number
  avg: number
  stdDev: number
}

interface NodeRecommendations {
  [label: string]: ThresholdRecommendation
}

interface AllRecommendations {
  [nodeId: string]: NodeRecommendations
}

interface ThresholdRecommendationsModalProps {
  isOpen: boolean
  recommendations: AllRecommendations | null
  selectedNode: any
  comparisonNode: any
  selectedDetailedMetric: string
  metricsConfig: MetricConfig[]
  onClose: () => void
}

export const ThresholdRecommendationsModal: React.FC<ThresholdRecommendationsModalProps> = ({
  isOpen,
  recommendations,
  selectedNode,
  comparisonNode,
  selectedDetailedMetric,
  metricsConfig,
  onClose
}) => {
  if (!isOpen || !recommendations) {
    return null
  }

  const getUnit = () => {
    return metricsConfig.find(m => m.dataKey === selectedDetailedMetric)?.unit || ''
  }

  // Función para limpiar el label (remover "Punto XX" prefix, "comp_" y "LOTE XX HILERA XX")
  const cleanLabel = (label: string): string => {
    // Remover prefijo "comp_" si existe
    let cleaned = label.replace(/^comp_/, '')
    // Remover patrones como "Punto 40 (Maceta - Sonda 10cm)" o "LOTE T2 HILERA 40 (Maceta - Sonda 10cm)"
    cleaned = cleaned.replace(/^Punto\s+\d+\s*[(-]?\s*/, '').replace(/^[A-Z\d\s]+\s*[(-]?\s*/, '').replace(/[)]/g, '').trim()
    
    // Extraer solo la parte "Maceta - Sonda XXcm" si existe
    const macetaMatch = cleaned.match(/Maceta\s+-\s+Sonda\s+\d+cm/)
    if (macetaMatch) {
      return macetaMatch[0]
    }
    
    // Extraer solo la parte "Suelo - Sonda XXcm" si existe
    const sueloMatch = cleaned.match(/Suelo\s+-\s+Sonda\s+\d+cm/)
    if (sueloMatch) {
      return sueloMatch[0]
    }
    
    return cleaned
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white font-mono tracking-wider">
            Recomendaciones de Umbrales
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 text-sm text-gray-600 dark:text-neutral-400 font-mono">
            <p className="mb-2">
              Basado en el análisis de fluctuación de los datos en el intervalo seleccionado, se recomiendan los siguientes umbrales para cada tipo de sensor:
            </p>
            <p className="text-xs">
              Los umbrales se calculan usando percentiles (5% y 95%) con un margen de seguridad basado en la desviación estándar.
            </p>
          </div>

          <div className="space-y-6">
            {Object.keys(recommendations).map(nodeId => {
              const nodeRecommendations = recommendations[nodeId]
              const isMainNode = nodeId.startsWith(`node_${selectedNode?.nodoid || 'main'}`)
              const nodeName = isMainNode 
                ? (selectedNode?.nodo || 'Nodo Principal')
                : (comparisonNode?.nodo || 'Nodo de Comparación')
              
              return (
                <div key={nodeId} className="space-y-4">
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono border-b border-gray-300 dark:border-neutral-700 pb-2">
                    {nodeName}
                  </h3>
                  {Object.keys(nodeRecommendations).map(label => {
                    const rec = nodeRecommendations[label]
                    
                    if (!rec) return null
                    
                    const unit = getUnit()
                    
                    return (
                      <div
                        key={`${nodeId}_${label}`}
                        className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 border border-gray-300 dark:border-neutral-700"
                      >
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white font-mono mb-3">
                          {cleanLabel(label)}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Umbral Mínimo Recomendado</label>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                              {rec.min.toFixed(2)} {unit}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Umbral Máximo Recomendado</label>
                            <div className="text-lg font-bold text-red-600 dark:text-red-400 font-mono">
                              {rec.max.toFixed(2)} {unit}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Promedio</label>
                            <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                              {rec.avg.toFixed(2)} {unit}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Desviación Estándar</label>
                            <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                              {rec.stdDev.toFixed(2)} {unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
