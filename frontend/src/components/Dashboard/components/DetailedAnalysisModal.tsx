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
import { useLanguage } from "../../../contexts/LanguageContext"
import type { MedicionData, MetricConfig } from "../types"
import type { Nodo, Tipo } from "../../../types"
import { getMetricIdFromDataKey } from "../utils/metricUtils"
import DetailedChartJs from "./DetailedChartJs"

export interface DetailedAnalysisModalProps {
  isOpen: boolean
  selectedNode: any | null  // Puede ser Nodo o NodeData (NodeData tiene latitud/longitud)
  selectedMetricForAnalysis: MetricConfig | null
  selectedDetailedMetric: string
  detailedMediciones: MedicionData[]
  comparisonNode: any | null  // Puede ser Nodo o NodeData
  comparisonMediciones: MedicionData[]
  mediciones: MedicionData[]
  availableMetrics: MetricConfig[]
  availableNodes: any[]  // Puede ser Nodo[] o NodeData[]
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

  /** Cuando true, se renderiza como vista fullscreen en lugar de modal overlay (para view switch) */
  isFullscreenView?: boolean

  // Callbacks
  onClose: () => void
  onMetricChange: (metric: string) => void
  onComparisonNodeChange: (node: any | null) => void
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
  getSeriesLabel,
  isFullscreenView = false
}) => {
  const { t } = useLanguage()
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
  console.log('[DetailedAnalysisModal] selectedNode:', selectedNode, 'comparisonNode:', comparisonNode)
  if (chartData.length > 0) {
    console.log('[DetailedAnalysisModal] Sample chartData point:', chartData[0])
  }

  const contentWrapperClass = isFullscreenView
    ? 'bg-gray-50 dark:bg-neutral-900 w-full min-h-[calc(100vh-8rem)] overflow-hidden flex flex-col transition-all duration-300 relative border border-gray-300 dark:border-neutral-700 rounded-xl'
    : `bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full ${isModalExpanded ? 'max-w-[95vw]' : 'max-w-7xl'} max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300 relative`

  return (
    <div className={isFullscreenView ? 'w-full' : 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'}>
      <div className={contentWrapperClass}>
        {/* Barra "Volver al mapa" - solo en vista fullscreen */}
        {isFullscreenView && (
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 dark:bg-blue-700 border-b border-blue-500 dark:border-blue-600">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-blue-600 dark:text-blue-400 font-mono font-bold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('dashboard.back_to_map')}
            </button>
            <span className="text-white font-mono text-sm opacity-90">
              {selectedMetricForAnalysis?.title} - {selectedNode?.ubicacion?.ubicacion || selectedNode?.nodo}
            </span>
          </div>
        )}
        
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
                    <>
                      <div className="truncate pl-2">
                        <span className="text-gray-500 dark:text-neutral-500">Ubicación:</span> {selectedNode.ubicacion.ubicacion}
                      </div>
                      {selectedNode.ubicacion.fundo && (
                        <>
                          <div className="truncate pl-2">
                            <span className="text-gray-500 dark:text-neutral-500">Fundo:</span> {selectedNode.ubicacion.fundo.fundo}
                          </div>
                          {selectedNode.ubicacion.fundo.empresa && (
                            <>
                              <div className="truncate pl-2">
                                <span className="text-gray-500 dark:text-neutral-500">Empresa:</span> {selectedNode.ubicacion.fundo.empresa.empresa}
                              </div>
                              {selectedNode.ubicacion.fundo.empresa.pais && (
                                <div className="truncate pl-2">
                                  <span className="text-gray-500 dark:text-neutral-500">País:</span> {selectedNode.ubicacion.fundo.empresa.pais.pais}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {(selectedNode.latitud !== null && selectedNode.latitud !== undefined && selectedNode.longitud !== null && selectedNode.longitud !== undefined) && (
                    <div className="truncate pl-2 text-gray-600 dark:text-neutral-400">
                      <span className="text-gray-500 dark:text-neutral-500">Coordenadas:</span>
                      <div className="pl-2">{selectedNode.latitud}, {selectedNode.longitud}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900">
            <div className="p-6">
            
              {/* Barra de controles - Layout horizontal compacto como en v2 */}
              <div className="mb-6 bg-gray-200 dark:bg-neutral-700 rounded-lg p-4 flex items-start gap-4 overflow-x-auto">
                <div className="flex flex-nowrap items-center gap-4 overflow-x-hidden">
                  
                  {/* Fecha Inicio */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">Fecha Inicio:</label>
                    <input
                      type="date"
                      value={tempStartDate || detailedStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      disabled={loadingDetailedData}
                      className="h-8 w-32 pl-2 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        colorScheme: 'dark',
                        WebkitAppearance: 'none'
                      }}
                    />
                  </div>

                  {/* Fecha Fin */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">Fecha Fin:</label>
                    <input
                      type="date"
                      value={tempEndDate || detailedEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      disabled={loadingDetailedData}
                      className="h-8 w-32 pl-2 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        colorScheme: 'dark',
                        WebkitAppearance: 'none'
                      }}
                    />
                  </div>

                  {/* Botón Aplicar */}
                  {(tempStartDate || tempEndDate) && (
                    <div className="flex flex-col flex-shrink-0">
                      <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap invisible">Aplicar:</label>
                      <button
                        onClick={() => {
                          onDateRangeChange(tempStartDate || detailedStartDate, tempEndDate || detailedEndDate)
                          setTempStartDate('')
                          setTempEndDate('')
                        }}
                        className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-mono transition-colors whitespace-nowrap"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}

                  {/* Separador visual */}
                  <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

                  {/* Ajuste Eje Y */}
                  <div className="flex flex-col flex-shrink-0">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Ajuste Eje Y:</label>
                    <div className="flex items-center gap-2 h-8">
                      <input
                        type="number"
                        step="0.1"
                        min="-999999"
                        max="999999"
                        value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? yAxisDomain.min.toString() : ''}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          if (inputValue === '') {
                            onYAxisDomainChange({ ...yAxisDomain, min: null })
                            return
                          }
                          const numValue = Number(inputValue)
                          if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                            onYAxisDomainChange({ ...yAxisDomain, min: numValue })
                          }
                        }}
                        placeholder="Min"
                        className="h-8 w-16 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono"
                      />
                      <span className="text-gray-600 dark:text-neutral-400">-</span>
                      <input
                        type="number"
                        step="0.1"
                        min="-999999"
                        max="999999"
                        value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? yAxisDomain.max.toString() : ''}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          if (inputValue === '') {
                            onYAxisDomainChange({ ...yAxisDomain, max: null })
                            return
                          }
                          const numValue = Number(inputValue)
                          if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                            onYAxisDomainChange({ ...yAxisDomain, max: numValue })
                          }
                        }}
                        placeholder="Max"
                        className="h-8 w-16 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono"
                      />
                      <button
                        onClick={() => onYAxisDomainChange({ min: null, max: null })}
                        className="h-8 px-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-mono"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Separador visual */}
                  <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

                  {/* Analizar Fluctuación */}
                  <div className="flex flex-col flex-shrink-0">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Analizar Fluctuación:</label>
                    <div className="h-8 flex items-center">
                      <button
                        onClick={onAnalyzeFluctuation}
                        disabled={loadingDetailedData}
                        className="h-8 px-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Umbrales
                      </button>
                    </div>
                  </div>

                  {/* Separador visual */}
                  <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

                  {/* Comparar con Nodo */}
                  <div className="flex flex-col flex-shrink-0">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Comparar con Nodo:</label>
                    <div className="flex items-center gap-2 h-8">
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
                        className="h-8 px-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-mono text-xs min-w-[200px] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <option value="" disabled hidden>Ninguno</option>
                        {availableNodes
                          .filter(n => n.nodoid !== selectedNode?.nodoid)
                          .map(node => (
                            <option key={node.nodoid} value={node.nodoid} title={`${node.nodo}`}>
                              {node.nodo}
                            </option>
                          ))}
                      </select>
                      {comparisonNode && (
                        <button
                          onClick={() => {
                            onComparisonNodeChange(null)
                          }}
                          className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-mono flex items-center justify-center"
                          title="Cancelar comparación"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {loadingComparisonData && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Área del gráfico */}
              <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6">
                {/* Título de comparación si existe */}
                {comparisonNode && (
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                      {selectedNode?.nodo} vs. {comparisonNode.nodo}
                    </h2>
                  </div>
                )}
                
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
                    metricUnit={selectedMetricForAnalysis?.unit || ''}
                    selectedNode={selectedNode}
                    comparisonNode={comparisonNode}
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

        {/* Botones de control - Solo en modo modal (en fullscreen usamos la barra Volver al mapa) */}
        {!isFullscreenView && (
        <div className="absolute top-2 right-2 flex flex-row gap-2 z-10">
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
          <button
            onClick={onClose}
            className="text-white bg-red-500 hover:bg-red-600 transition-colors p-2 rounded-lg"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        )}
      </div>
    </div>
  )
}

export default DetailedAnalysisModal
