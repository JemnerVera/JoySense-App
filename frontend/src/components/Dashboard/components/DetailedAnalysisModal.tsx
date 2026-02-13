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

  const contentWrapperClass = isFullscreenView
    ? 'bg-gray-50 dark:bg-neutral-900 w-full h-full overflow-hidden flex flex-col transition-all duration-300 relative border border-gray-300 dark:border-neutral-700 rounded-xl'
    : `bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full ${isModalExpanded ? 'max-w-[95vw]' : 'max-w-7xl'} max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300 relative`

  return (
    <div className={isFullscreenView ? 'w-full h-full' : 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'}>
      <div className={contentWrapperClass}>
        {/* Barra "Volver al mapa" + botones de métrica + leyenda - solo en vista fullscreen */}
        {isFullscreenView && (
          <div className="bg-blue-600 dark:bg-blue-700 border-b border-blue-500 dark:border-blue-600 rounded-t-xl">
            {/* Primera línea: Volver + Botones de métrica */}
            <div className="flex items-center justify-between gap-4 px-6 py-2">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-blue-600 dark:text-blue-400 font-mono font-bold rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('dashboard.back_to_map')}
              </button>
              {/* Botones de métrica en el header */}
              <div className="flex flex-wrap items-center gap-2">
                {availableMetrics.length > 0 ? (
                  availableMetrics.map((metric) => (
                    <button
                      key={metric.id}
                      onClick={() => onMetricChange(metric.dataKey)}
                      disabled={loadingDetailedData}
                      className={`relative px-3 py-1.5 font-mono tracking-wider transition-all duration-200 text-xs ${
                        selectedDetailedMetric === metric.dataKey
                          ? 'bg-white text-blue-600 dark:bg-neutral-800 dark:text-blue-400 shadow-md'
                          : 'bg-blue-500/50 text-white hover:bg-blue-500/70'
                      } rounded ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="truncate block max-w-[120px]">{metric.title}</span>
                    </button>
                  ))
                ) : null}
              </div>
            </div>
          </div>
        )}
        
        {/* Contenido - con sidebar solo en modo modal */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar izquierdo - solo en modo modal (no fullscreen) */}
          {!isFullscreenView && (
          <div className="w-48 border-r border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex flex-col py-4 overflow-y-auto">
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
            {selectedNode && (
              <div className="mt-4 px-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                <div className="text-xs font-mono space-y-1.5 text-gray-700 dark:text-neutral-300">
                  {selectedNode.ubicacion && (
                    <>
                      <div className="truncate pl-2"><span className="text-gray-500 dark:text-neutral-500">Ubicación:</span> {selectedNode.ubicacion.ubicacion}</div>
                      {selectedNode.ubicacion.fundo && (
                        <>
                          <div className="truncate pl-2"><span className="text-gray-500 dark:text-neutral-500">Fundo:</span> {selectedNode.ubicacion.fundo.fundo}</div>
                          {selectedNode.ubicacion.fundo.empresa && (
                            <div className="truncate pl-2"><span className="text-gray-500 dark:text-neutral-500">Empresa:</span> {selectedNode.ubicacion.fundo.empresa.empresa}</div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Contenido principal */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-neutral-900 min-w-0">
            <div className={`flex flex-col flex-1 min-h-0 ${isFullscreenView ? 'p-2 space-y-1' : 'p-4 space-y-3'}`}>
            
              {/* Barra de controles - Layout horizontal compacto como en v2 */}
              <div className={`flex-shrink-0 ${isFullscreenView ? 'mb-2' : 'mb-3'} border-b border-gray-300 dark:border-neutral-700 overflow-x-auto control-scrollbar`}
                style={{
                  scrollBehavior: 'smooth'
                }}
              >
                <div className="flex items-center justify-between gap-3 pb-3 min-w-max">
                <div className="flex flex-nowrap items-center gap-4 flex-1 min-w-0">
                  
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

                  {/* Comparar con Localización */}
                  <div className="flex flex-col flex-shrink-0">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Comparar con Localización:</label>
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
                          .map(node => {
                            const locLabel = node.localizacion || localizacionesPorNodo?.get(node.nodoid)?.[0] || node.ubicacion?.ubicacion || node.nodo
                            return (
                            <option key={node.nodoid} value={node.nodoid} title={locLabel}>
                              {locLabel}
                            </option>
                          )})}
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
                  
                  {/* Separador visual */}
                  <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

                  {/* Leyenda compacta DENTRO de la barra de controles - CON CHECKBOXES */}
                  {visibleLines.length > 0 && (
                    <div className="flex flex-row items-start gap-3 flex-shrink-0">
                      {(() => {
                        const mainNodeLines = visibleLines.filter(line => !line.startsWith('comp_'))
                        const comparisonNodeLines = visibleLines.filter(line => line.startsWith('comp_'))
                        
                        // Helper para limpiar label
                        const cleanLabel = (label: string): string => {
                          let cleaned = label.replace(/^comp_/, '')
                          cleaned = cleaned.replace(/^Punto\s+\d+\s*[(-]?\s*/, '').replace(/[)]/g, '').trim()
                          const macetaMatch = cleaned.match(/Maceta\s+-\s+Sonda\s+\d+cm/)
                          if (macetaMatch) {
                            return macetaMatch[0]
                          }
                          return cleaned
                        }
                        
                        const handleToggleLine = (lineKey: string, isComparison: boolean) => {
                          const cleanedLabel = cleanLabel(lineKey)
                          // El formato correcto debe incluir el prefijo main: o comp:
                          const fullKey = isComparison ? `comp:${cleanedLabel}` : `main:${cleanedLabel}`
                          const newVisible = new Set(visibleTipos)
                          
                          if (newVisible.has(fullKey)) {
                            newVisible.delete(fullKey)
                          } else {
                            newVisible.add(fullKey)
                          }
                          
                          if (onVisibleTiposChange) {
                            onVisibleTiposChange(newVisible)
                          }
                        }
                        
                        // Renderizar una sección de leyenda (actual o comparación)
                        const renderLegendSection = (lines: string[], title: string, isComparison: boolean, colors: string[]) => {
                          return (
                            <div className="flex flex-row gap-3 items-start flex-shrink-0">
                              {/* Primera columna - primeras 2 líneas */}
                              <div className="flex flex-col flex-shrink-0">
                                <label className="text-xs font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase">{title}</label>
                                <div className="flex flex-col gap-1">
                                  {lines.slice(0, 2).map((lineKey, idx) => {
                                    const cleanedLabel = cleanLabel(lineKey)
                                    const fullKey = isComparison ? `comp:${cleanedLabel}` : `main:${cleanedLabel}`
                                    const strokeColor = colors[idx % colors.length]
                                    const isVisible = visibleTipos.size === 0 || visibleTipos.has(fullKey)
                                    
                                    return (
                                      <div key={lineKey} className="flex items-center gap-1 h-6">
                                        <input
                                          type="checkbox"
                                          checked={isVisible}
                                          onChange={() => handleToggleLine(lineKey, isComparison)}
                                          className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                        />
                                        {isComparison ? (
                                          <svg className="w-2 h-0.5 flex-shrink-0" viewBox="0 0 8 1" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <line x1="0" y1="0.5" x2="8" y2="0.5" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="2 1" />
                                          </svg>
                                        ) : (
                                          <div 
                                            className="w-2 h-0.5 rounded-full flex-shrink-0" 
                                            style={{ backgroundColor: strokeColor }}
                                          />
                                        )}
                                        <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono font-bold whitespace-nowrap">
                                          {cleanedLabel}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              
                              {/* Segunda columna - líneas adicionales (si hay) */}
                              {lines.length > 2 && (
                                <div className="flex flex-col flex-shrink-0">
                                  <label className="text-xs font-bold text-transparent font-mono mb-2 whitespace-nowrap uppercase">.</label>
                                  <div className="flex flex-col gap-1">
                                    {lines.slice(2).map((lineKey, idx) => {
                                      const cleanedLabel = cleanLabel(lineKey)
                                      const fullKey = isComparison ? `comp:${cleanedLabel}` : `main:${cleanedLabel}`
                                      const strokeColor = colors[(idx + 2) % colors.length]
                                      const isVisible = visibleTipos.size === 0 || visibleTipos.has(fullKey)
                                      
                                      return (
                                        <div key={lineKey} className="flex items-center gap-1 h-6">
                                          <input
                                            type="checkbox"
                                            checked={isVisible}
                                            onChange={() => handleToggleLine(lineKey, isComparison)}
                                            className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                          />
                                          {isComparison ? (
                                            <svg className="w-2 h-0.5 flex-shrink-0" viewBox="0 0 8 1" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <line x1="0" y1="0.5" x2="8" y2="0.5" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="2 1" />
                                            </svg>
                                          ) : (
                                            <div 
                                              className="w-2 h-0.5 rounded-full flex-shrink-0" 
                                              style={{ backgroundColor: strokeColor }}
                                            />
                                          )}
                                          <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono font-bold whitespace-nowrap">
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
                        
                        const mainColors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
                        const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4']
                        
                        return (
                          <>
                            {/* Grupo Localización Principal */}
                            {mainNodeLines.length > 0 && renderLegendSection(mainNodeLines, 'Leyenda Loc. Actual:', false, mainColors)}
                            
                            {/* Separador vertical - solo cuando hay comparación */}
                            {mainNodeLines.length > 0 && comparisonNodeLines.length > 0 && (
                              <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>
                            )}
                            
                            {/* Grupo Localización Comparación */}
                            {comparisonNodeLines.length > 0 && renderLegendSection(comparisonNodeLines, 'Leyenda Loc. Comparación:', true, comparisonColors)}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
                {/* Info del nodo: Información del Nodo - al extremo derecho (solo fullscreen) */}
                {isFullscreenView && selectedNode?.ubicacion && (
                  <div className="flex-shrink-0">
                    <label className="text-xs font-bold text-blue-500 font-mono mb-0.5 whitespace-nowrap uppercase block">
                      Información del Nodo:
                    </label>
                    <div className="h-8 flex items-center gap-3 px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">Loc.:</span>
                        <span className="text-xs text-gray-800 dark:text-white font-mono">{selectedNode?.localizacion || '--'}</span>
                      </div>
                      <div className="w-px h-4 bg-gray-400 dark:bg-neutral-600"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">Ubic.:</span>
                        <span className="text-xs text-gray-800 dark:text-white font-mono">
                          {selectedNode?.ubicacion?.ubicacion || '--'}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-gray-400 dark:bg-neutral-600"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">Fundo:</span>
                        <span className="text-xs text-gray-800 dark:text-white font-mono">
                          {selectedNode?.ubicacion?.fundo?.fundo || '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Área del gráfico - flex-1 para ocupar espacio disponible */}
              <div className={`bg-gray-100 dark:bg-neutral-800 ${isFullscreenView ? 'rounded-b-xl' : 'rounded-lg'} flex flex-col flex-1 min-h-0 ${isFullscreenView ? 'p-2' : 'p-4'} shadow-sm`}>
                {/* Título de comparación si existe */}
                {comparisonNode && (
                  <div className={`text-center flex-shrink-0 ${isFullscreenView ? 'mb-1' : 'mb-2'}`}>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                      {selectedNode?.localizacion || localizacionesPorNodo?.get(selectedNode?.nodoid)?.[0] || selectedNode?.ubicacion?.ubicacion || selectedNode?.nodo} vs. {comparisonNode.localizacion || localizacionesPorNodo?.get(comparisonNode.nodoid)?.[0] || comparisonNode.ubicacion?.ubicacion || comparisonNode.nodo}
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
                    onVisibleTiposChange={onVisibleTiposChange}
                    metricUnit={selectedMetricForAnalysis?.unit || ''}
                    selectedNode={selectedNode}
                    comparisonNode={comparisonNode}
                    mainLocalizacionLabel={selectedNode?.localizacion || localizacionesPorNodo?.get(selectedNode?.nodoid)?.[0] || selectedNode?.ubicacion?.ubicacion}
                    comparisonLocalizacionLabel={comparisonNode?.localizacion || localizacionesPorNodo?.get(comparisonNode?.nodoid)?.[0] || comparisonNode?.ubicacion?.ubicacion}
                    fillHeight={isFullscreenView}
                    showLegend={false}
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
