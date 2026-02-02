/**
 * DetailedAnalysisModal_FULL.tsx
 * 
 * Componente separado para el modal de análisis detallado
 * FASE 5 REFACTORING - Incluye toda la lógica del modal original
 * 
 * Este componente encapsula:
 * - Selección de métricas con sidebar
 * - Visualización de gráficos de líneas interactivos
 * - Comparación de nodos
 * - Configuración de ejes Y dinámicos
 * - Visualización y edición de umbrales
 * - Leyenda de series y tipos de sensores
 */

import React, { useState, useEffect, useMemo } from "react"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Legend } from "recharts"
import type { MedicionData, MetricConfig } from "../types"
import type { Nodo, Tipo } from "../../../types"
import { getMetricIdFromDataKey } from "../utils/metricUtils"
import DetailedChartJs from "./DetailedChartJs"

export interface DetailedAnalysisModalProps {
  isOpen: boolean
  selectedNode: Nodo | null
  selectedMetricForAnalysis: MetricConfig | null
  selectedDetailedMetric: string
  detailedMediciones: MedicionData[]
  comparisonNode: Nodo | null
  comparisonMediciones: MedicionData[]
  mediciones: MedicionData[]
  availableMetrics: MetricConfig[]
  availableNodes: Nodo[]
  tipos: Tipo[]
  sensores: any[]
  loadingDetailedData: boolean
  loadingComparisonData: boolean
  detailedStartDate: string
  detailedEndDate: string
  isModalExpanded: boolean
  visibleTipos: Set<string>
  memoizedDetailedChartData: { [key: string]: any[] }
  umbralesDisponibles: { [key: number]: { minimo: number; maximo: number } }
  localizacionesPorNodo: Map<number, string[]>
  yAxisDomain: { min: number | null; max: number | null }

  // Callbacks
  onClose: () => void
  onMetricChange: (metric: string) => void
  onComparisonNodeChange: (node: Nodo | null) => void
  onDateRangeChange: (startDate: string, endDate: string) => void
  onYAxisDomainChange: (domain: { min: number | null; max: number | null }) => void
  onVisibleTiposChange: (tipos: Set<string>) => void
  onToggleExpand: () => void
  onAnalyzeFluctuation: () => void
  onLoadComparisonData: (node: Nodo) => void
  getSeriesLabel: (medicion: MedicionData) => string
}

/**
 * Modal de Análisis Detallado - Versión COMPLETA
 * Replica exactamente la funcionalidad del modal original en ModernDashboard
 */
export const DetailedAnalysisModal: React.FC<DetailedAnalysisModalProps> = ({
  isOpen,
  selectedNode,
  selectedMetricForAnalysis,
  selectedDetailedMetric,
  detailedMediciones,
  comparisonNode,
  comparisonMediciones,
  mediciones,
  availableMetrics,
  availableNodes,
  tipos,
  sensores,
  loadingDetailedData,
  loadingComparisonData,
  detailedStartDate,
  detailedEndDate,
  isModalExpanded,
  visibleTipos,
  memoizedDetailedChartData,
  umbralesDisponibles,
  localizacionesPorNodo,
  yAxisDomain,
  onClose,
  onMetricChange,
  onComparisonNodeChange,
  onDateRangeChange,
  onYAxisDomainChange,
  onVisibleTiposChange,
  onToggleExpand,
  onAnalyzeFluctuation,
  onLoadComparisonData,
  getSeriesLabel
}) => {
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')

  // Calcular dominio del eje Y - pasarlo directamente a DetailedChartJs
  const calculateYAxisDomain = (): { min: number | null; max: number | null } => {
    return yAxisDomain
  }

  // Obtener el chartData correctamente
  const chartData = useMemo(() => {
    return memoizedDetailedChartData[selectedDetailedMetric] || []
  }, [memoizedDetailedChartData, selectedDetailedMetric])

  // Obtener líneas para renderizar - DESDE LAS CLAVES DEL CHARTDATA, no de las mediciones
  const visibleLines = useMemo(() => {
    if (chartData.length === 0) return []
    
    // Obtener todas las claves del primer punto (excluyendo 'time')
    const allLabels = Object.keys(chartData[0] || {}).filter(k => k !== 'time')
    return allLabels
  }, [chartData])

  // AHORA SÍ, después de todos los hooks, podemos hacer el return condicional
  if (!isOpen || !selectedMetricForAnalysis) {
    return null
  }

  const metricId = getMetricIdFromDataKey(selectedDetailedMetric)

  // DEBUG
  console.log('[DetailedAnalysisModal] isOpen:', isOpen, 'selectedMetricForAnalysis:', selectedMetricForAnalysis?.title)
  console.log('[DetailedAnalysisModal] chartData:', chartData.length, 'selectedDetailedMetric:', selectedDetailedMetric)
  console.log('[DetailedAnalysisModal] visibleLines:', visibleLines.length, visibleLines.slice(0, 2))
  if (chartData.length > 0) {
    console.log('[DetailedAnalysisModal] Sample chartData point:', chartData[0])
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full ${isModalExpanded ? 'max-w-[95vw]' : 'max-w-7xl'} max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300`}>
        
        {/* Contenido con sidebar */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar izquierdo */}
          <div className="w-48 border-r border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex flex-col py-4 overflow-y-auto">
            
            {/* Pestañas de métricas */}
            <div className="flex flex-col space-y-2 px-2">
              {availableMetrics.length > 0 ? (
                availableMetrics.map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => onMetricChange(metric.dataKey)}
                    disabled={loadingDetailedData}
                    className={`relative px-4 py-3 font-mono tracking-wider transition-all duration-200 text-sm text-left ${
                      selectedDetailedMetric === metric.dataKey
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                    } ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      clipPath: selectedDetailedMetric === metric.dataKey 
                        ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                        : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                    }}
                  >
                    <span className="truncate block">{metric.title}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-500 dark:text-neutral-400 font-mono text-center">
                  No hay métricas disponibles
                </div>
              )}
            </div>

            {/* Información del nodo */}
            {selectedNode && (
              <div className="mt-4 px-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                <div className="text-xs font-mono space-y-1.5 text-gray-700 dark:text-neutral-300">
                  <div className="truncate pl-2">
                    <span className="text-gray-500 dark:text-neutral-500">Nodo:</span> {selectedNode.nodo}
                  </div>
                  {selectedNode.ubicacion && (
                    <div className="truncate pl-2">
                      <span className="text-gray-500 dark:text-neutral-500">Ubicación:</span> {selectedNode.ubicacion.ubicacion}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900">
            <div className="p-6">
            
              {/* Barra de controles */}
              <div className="mb-6 bg-gray-200 dark:bg-neutral-700 rounded-lg p-4 flex items-center gap-4 overflow-x-auto">
                
                {/* Selector de fechas */}
                <div className="flex flex-col flex-shrink-0">
                  <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2">
                    Rango de Fechas:
                  </label>
                  <div className="flex items-center gap-2 h-8">
                    <input
                      type="date"
                      value={tempStartDate || detailedStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      disabled={loadingDetailedData}
                      className="h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-xs"
                    />
                    <span className="text-gray-600 dark:text-neutral-400">-</span>
                    <input
                      type="date"
                      value={tempEndDate || detailedEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      disabled={loadingDetailedData}
                      className="h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-xs"
                    />
                    {(tempStartDate || tempEndDate) && (
                      <button
                        onClick={() => {
                          onDateRangeChange(tempStartDate || detailedStartDate, tempEndDate || detailedEndDate)
                          setTempStartDate('')
                          setTempEndDate('')
                        }}
                        className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-mono"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 flex-shrink-0"></div>

                {/* Botón análisis */}
                <button
                  onClick={onAnalyzeFluctuation}
                  disabled={loadingDetailedData}
                  className="h-8 px-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded font-mono text-sm flex-shrink-0"
                >
                  Umbrales
                </button>

                <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 flex-shrink-0"></div>

                {/* Comparación */}
                <div className="flex flex-col flex-shrink-0">
                  <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">
                    Comparar:
                  </label>
                  <select
                    value={comparisonNode?.nodoid || ''}
                    onChange={(e) => {
                      const nodeId = parseInt(e.target.value)
                      if (nodeId && nodeId !== selectedNode?.nodoid) {
                        const node = availableNodes.find(n => n.nodoid === nodeId)
                        if (node) {
                          onComparisonNodeChange(node)
                          onLoadComparisonData(node)
                        }
                      } else {
                        onComparisonNodeChange(null)
                      }
                    }}
                    disabled={loadingComparisonData}
                    className="h-8 px-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white font-mono text-xs"
                  >
                    <option value="" disabled hidden>Ninguno</option>
                    {availableNodes
                      .filter(n => n.nodoid !== selectedNode?.nodoid)
                      .map(node => (
                        <option key={node.nodoid} value={node.nodoid}>
                          {node.nodo}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Área del gráfico */}
              <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6">
                {loadingDetailedData ? (
                  <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <div className="text-gray-600 dark:text-neutral-400 font-mono">
                        Cargando datos...
                      </div>
                    </div>
                  </div>
                ) : chartData && chartData.length > 0 ? (
                  <DetailedChartJs 
                    data={chartData}
                    visibleLines={visibleLines}
                    yAxisDomain={yAxisDomain}
                    visibleTipos={visibleTipos}
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📊</div>
                      <div className="text-gray-600 dark:text-neutral-400 font-mono">
                        No hay datos disponibles para la métrica seleccionada
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de control */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={onToggleExpand}
            className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetailedAnalysisModal
