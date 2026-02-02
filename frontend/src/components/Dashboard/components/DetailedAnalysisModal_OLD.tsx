/**
 * DetailedAnalysisModal.tsx
 * 
 * Componente separado para el modal de análisis detallado
 * FASE 3 del refactoring de ModernDashboard
 * 
 * Este componente encapsula toda la lógica del análisis detallado:
 * - Selección de métricas
 * - Visualización de gráficos
 * - Comparación de nodos
 * - Configuración de ejes
 * - Visualización de umbrales
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Legend } from "recharts"
import type { MedicionData, MetricConfig } from "../types"
import type { Nodo, Tipo } from "../../../types"
import { useChartDataProcessing, useComparisonLogic, useAxisConfiguration } from "../hooks"

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
 * Modal de Análisis Detallado
 * Proporciona visualización detallada de métricas con opciones de comparación
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
  const chartDataProcessing = useChartDataProcessing()
  const comparisonLogic = useComparisonLogic()
  const axisConfig = useAxisConfiguration()

  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  const [umbralNodoSeleccionado, setUmbralNodoSeleccionado] = useState<number | null>(null)
  const [umbralTipoSeleccionado, setUmbralTipoSeleccionado] = useState<number | null>(null)
  const [umbralTiposSeleccionados, setUmbralTiposSeleccionados] = useState<number[]>([])
  const [umbralData, setUmbralData] = useState<{ minimo: number; maximo: number } | null>(null)
  const [umbralAplicado, setUmbralAplicado] = useState(false)
  const [tipoSensorDropdownOpen, setTipoSensorDropdownOpen] = useState(false)

  if (!isOpen || !selectedMetricForAnalysis) {
    return null
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
                      borderTopRightRadius: selectedDetailedMetric === metric.dataKey ? '0.5rem' : '0',
                      borderBottomRightRadius: selectedDetailedMetric === metric.dataKey ? '0.5rem' : '0',
                      marginRight: selectedDetailedMetric === metric.dataKey ? '-1px' : '0',
                      zIndex: selectedDetailedMetric === metric.dataKey ? '10' : '1'
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
                    <div className="truncate pl-2" title={`Ubicación: ${selectedNode.ubicacion.ubicacion}`}>
                      <span className="text-gray-500 dark:text-neutral-500">Ubicación:</span> {selectedNode.ubicacion.ubicacion}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de controles superior */}
            <div className="border-b border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex items-center gap-4 overflow-x-auto flex-shrink-0">
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
                    className="h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                  <span className="text-gray-600 dark:text-neutral-400">-</span>
                  <input
                    type="date"
                    value={tempEndDate || detailedEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    disabled={loadingDetailedData}
                    className="h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

              {/* Botón de análisis */}
              <div className="flex flex-col flex-shrink-0">
                <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">
                  Analizar:
                </label>
                <button
                  onClick={onAnalyzeFluctuation}
                  disabled={loadingDetailedData}
                  className="h-8 px-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded font-mono text-sm transition-colors"
                >
                  Umbrales
                </button>
              </div>

              <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

              {/* Comparación con otro nodo */}
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
                  className="h-8 px-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono text-xs min-w-[150px]"
                >
                  <option value="" disabled hidden>Ninguno</option>
                  {availableNodes
                    .filter(n => n.nodoid !== selectedNode?.nodoid)
                    .map(node => (
                      <option key={node.nodoid} value={node.nodoid} title={node.nodo}>
                        {node.nodo.length > 12 ? `${node.nodo.substring(0, 12)}...` : node.nodo}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Área del gráfico */}
            <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-6 overflow-auto">
              {loadingDetailedData ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-gray-600 dark:text-neutral-400 font-mono">
                      Cargando datos...
                    </div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <LineChart data={memoizedDetailedChartData[selectedDetailedMetric] || []}>
                    <XAxis dataKey="time" />
                    <YAxis domain={axisConfig.getYAxisDomain(detailedMediciones)} />
                    <Tooltip />
                    <Legend />
                    {/* Renderizar líneas para cada serie visible */}
                    {Array.from(new Set(
                      [...detailedMediciones, ...comparisonMediciones]
                        .map(m => getSeriesLabel(m))
                    )).map((label, idx) => {
                      const isVisible = visibleTipos.size === 0 || visibleTipos.has(label)
                      if (!isVisible) return null
                      
                      const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
                      return (
                        <Line
                          key={label}
                          type="monotone"
                          dataKey={label}
                          stroke={colors[idx % colors.length]}
                          dot={false}
                          isAnimationActive={false}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Botones de control (cerrar y expandir) */}
        <div className="flex gap-2 absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={onToggleExpand}
            className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
            title={isModalExpanded ? "Contraer" : "Expandir"}
          >
            {isModalExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetailedAnalysisModal
