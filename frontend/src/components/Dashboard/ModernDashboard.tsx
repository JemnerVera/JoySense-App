import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { flushSync } from "react-dom"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Legend } from "recharts"
import { JoySenseService } from "../../services/backend-api"
import SupabaseRPCService from "../../services/supabase-rpc"
import { NodeSelector } from "./NodeSelector"
import { useLanguage } from "../../contexts/LanguageContext"
import { useToast } from "../../contexts/ToastContext"
import { useFilters } from "../../contexts/FilterContext"
import { filterNodesByGlobalFilters } from "../../utils/filterNodesUtils"
import { useMedicionesLoader, useSystemData } from "./hooks"
import { ErrorAlert, LoadingState, ThresholdRecommendationsModal, DetailedAnalysisModal } from "./components"
import { MetricMiniChart } from "./components/MetricMiniChart"
import {
  DATA_LIMITS,
  getMetricColor,
  getMetricRanges,
  normalizeMetricDataKey,
  getMetricIdFromDataKey,
  getMetricInfoFromId,
  matchesMetricId
} from "./utils/metricUtils"
import {
  hasMetricData as hasMetricDataHelper,
  getCurrentValue as getCurrentValueHelper,
  getStatus as getStatusHelper,
  hasRecentData as hasRecentDataHelper,
  getSeriesLabel as getSeriesLabelHelper,
  getSensorLabel as getSensorLabelHelper,
  createOptimizedMetricHelper
} from "./utils/dashboardHelpers"
import type { MedicionData, MetricConfig, ModernDashboardProps } from "./types"
import { NodeData } from "../../types/NodeData"
import { useOptimizedChartData } from "./hooks/useOptimizedChartData"
import { useMetricCache } from "./hooks/useMetricCache"

// Helper para transformar datos del backend al formato MedicionData con campos legacy
function transformMedicionData(data: any[]): MedicionData[] {
  return data.map(m => {
    // CRÍTICO: Manejar el caso donde localizacion puede ser un array (resultado de Supabase)
    const localizacion = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null
    const sensor = localizacion?.sensor ? (Array.isArray(localizacion.sensor) ? localizacion.sensor[0] : localizacion.sensor) : null
    
    return {
      ...m,
      // Normalizar localizacion para que no sea un array
      localizacion: localizacion ? {
        ...localizacion,
        sensor: sensor
      } : null,
      // Extraer campos desde localizacion si existen
      metricaid: Number(m.metricaid ?? localizacion?.metricaid ?? 0),
      nodoid: Number(m.nodoid ?? localizacion?.nodoid ?? 0),
      sensorid: Number(m.sensorid ?? localizacion?.sensorid ?? 0),
      tipoid: Number(m.tipoid ?? sensor?.tipoid ?? localizacion?.sensor?.tipoid ?? 0),
      ubicacionid: Number(m.ubicacionid ?? localizacion?.nodo?.ubicacionid ?? 0)
    }
  })
}

// Mapeo de colores por nombre de métrica (puede extenderse por empresa)
const METRIC_COLOR_MAP: { [key: string]: string } = {
  'temperatura': '#f59e0b',      // Ámbar
  'temp': '#f59e0b',
  'humedad': '#3b82f6',           // Azul
  'humidity': '#3b82f6',
  'conductividad': '#10b981',     // Verde
  'electroconductividad': '#10b981',
  'conductivity': '#10b981',
  'ph': '#ef4444',                // Rojo
  'luz': '#fbbf24',               // Amarillo
  'light': '#fbbf24',
  'co2': '#6366f1',               // Índigo
  'presion': '#8b5cf6',           // Púrpura
  'pressure': '#8b5cf6',
};

// Rangos por defecto por nombre de métrica
const METRIC_RANGES_MAP: { [key: string]: { min: number; max: number; optimal: [number, number] } } = {
  'temperatura': { min: 15, max: 35, optimal: [20, 28] },
  'temp': { min: 15, max: 35, optimal: [20, 28] },
  'humedad': { min: 40, max: 90, optimal: [60, 75] },
  'humidity': { min: 40, max: 90, optimal: [60, 75] },
  'conductividad': { min: 0.5, max: 2.5, optimal: [1.0, 1.8] },
  'electroconductividad': { min: 0.5, max: 2.5, optimal: [1.0, 1.8] },
  'conductivity': { min: 0.5, max: 2.5, optimal: [1.0, 1.8] },
  'ph': { min: 6, max: 8, optimal: [6.5, 7.5] },
  'luz': { min: 0, max: 100000, optimal: [20000, 50000] },
  'light': { min: 0, max: 100000, optimal: [20000, 50000] },
  'co2': { min: 300, max: 2000, optimal: [800, 1200] },
  'presion': { min: 900, max: 1100, optimal: [1000, 1020] },
  'pressure': { min: 900, max: 1100, optimal: [1000, 1020] },
};

// Función pura: convertir Metrica del backend a MetricConfig
function transformBackendMetricaToConfig(metrica: any, t: any): MetricConfig {
  const normalizedDataKey = normalizeMetricDataKey(metrica.metrica);
  
  return {
    id: normalizedDataKey,
    title: metrica.metrica || 'Métrica Desconocida',
    color: getMetricColor(metrica.metrica),
    unit: metrica.unidad || '',
    dataKey: normalizedDataKey,
    description: `Medición de ${metrica.metrica}`,
    ranges: getMetricRanges(metrica.metrica),
  };
}

export function ModernDashboard({ filters, onFiltersChange, onEntidadChange, onUbicacionChange }: ModernDashboardProps) {
  const { t } = useLanguage()
  const { showWarning, showError } = useToast()
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado, setShowDetailedAnalysis: setContextShowDetailedAnalysis } = useFilters()
  
  // Estados para datos del sistema
  const [metricas, setMetricas] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [sensores, setSensores] = useState<any[]>([])
  const [entidades, setEntidades] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  
  // Estados para mediciones
  const [mediciones, setMediciones] = useState<MedicionData[]>([])
  const [detailedMediciones, setDetailedMediciones] = useState<MedicionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para UI
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [isModalExpanded, setIsModalExpanded] = useState(false)
  const [showReturnToMapModal, setShowReturnToMapModal] = useState(false)  // ← Nuevo
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null)
  const [selectedMetricForAnalysis, setSelectedMetricForAnalysis] = useState<MetricConfig | null>(null)
  const [selectedDetailedMetric, setSelectedDetailedMetric] = useState<string>('temperatura')
  const [detailedStartDate, setDetailedStartDate] = useState<string>('')
  const [detailedEndDate, setDetailedEndDate] = useState<string>('')
  const [tempStartDate, setTempStartDate] = useState<string>('') // Estado temporal para evitar carga automática
  const [tempEndDate, setTempEndDate] = useState<string>('') // Estado temporal para evitar carga automática
  const [selectedNode, setSelectedNode] = useState<any>(null)
  
  // Sincronizar showDetailedAnalysis con el contexto de filtros
  useEffect(() => {
    setContextShowDetailedAnalysis(showDetailedAnalysis);
  }, [showDetailedAnalysis]);
  
  // Generar métricas dinámicamente desde los datos cargados del backend
  // Si no hay métricas cargadas, usar un conjunto mínimo por defecto
  const getTranslatedMetrics = useMemo((): MetricConfig[] => {
    if (!metricas || metricas.length === 0) {
      // Fallback a métricas por defecto si no se cargaron del backend
      return [
        {
          id: "temperatura",
          title: t('dashboard.metrics.temperature') || 'Temperatura',
          color: "#f59e0b",
          unit: "°C",
          dataKey: "temperatura",
          description: "Temperatura del suelo/sustrato",
          ranges: { min: 15, max: 35, optimal: [20, 28] }
        },
        {
          id: "humedad",
          title: t('dashboard.metrics.humidity') || 'Humedad',
          color: "#3b82f6",
          unit: "%",
          dataKey: "humedad",
          description: "Humedad relativa del suelo",
          ranges: { min: 40, max: 90, optimal: [60, 75] }
        },
        {
          id: "conductividad",
          title: t('dashboard.metrics.electroconductivity') || 'Electroconductividad',
          color: "#10b981",
          unit: "uS/cm",
          dataKey: "conductividad",
          description: "Conductividad eléctrica del sustrato",
          ranges: { min: 0.5, max: 2.5, optimal: [1.0, 1.8] }
        }
      ];
    }

    // Transformar métricas del backend a formato MetricConfig
    return metricas
      .filter((m: any) => m.statusid === 1) // Solo métricas activas
      .map((m: any) => transformBackendMetricaToConfig(m, t));
  }, [metricas, t])
  
  // Helper para obtener etiqueta de serie de datos (agrupación inteligente)
  const getSeriesLabel = useCallback((medicion: MedicionData) => {
    return getSeriesLabelHelper(medicion, sensores, tipos)
  }, [tipos, sensores])
  
  // ========== OPTIMIZACIONES DE CACHÉ DE MÉTRICAS ==========
  // Hook para crear un cache de métricas optimizado que evita recálculos repetidos
  const { hasData: hasMetricDataOptimized, getCurrentValue: getCurrentValueOptimized } = useMetricCache(mediciones, selectedNode)
  
  const [loadingDetailedData, setLoadingDetailedData] = useState(false)
  
  // Estados para nuevas funcionalidades del análisis detallado
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null }) // Ajuste del eje Y
  const [comparisonNode, setComparisonNode] = useState<any>(null) // Nodo para comparación
  const [comparisonMediciones, setComparisonMediciones] = useState<MedicionData[]>([]) // Mediciones del nodo de comparación
  const [loadingComparisonData, setLoadingComparisonData] = useState(false) // Loading para datos de comparación
  const [thresholdRecommendations, setThresholdRecommendations] = useState<{ [nodeId: string]: { [label: string]: { min: number; max: number; avg: number; stdDev: number } } } | null>(null) // Recomendaciones de umbrales por nodo
  const [showThresholdModal, setShowThresholdModal] = useState(false) // Modal para mostrar recomendaciones
  const [availableNodes, setAvailableNodes] = useState<any[]>([]) // Lista de nodos disponibles para comparación
  const [localizacionesPorNodo, setLocalizacionesPorNodo] = useState<Map<number, string[]>>(new Map()) // Localizaciones por nodo
  const [visibleTipos, setVisibleTipos] = useState<Set<string>>(new Set()) // Tipos de sensores visibles en el gráfico
  const [umbralNodoSeleccionado, setUmbralNodoSeleccionado] = useState<number | null>(null) // Nodo seleccionado para visualizar umbral
  const [umbralTipoSeleccionado, setUmbralTipoSeleccionado] = useState<number | null>(null) // Tipo de sensor seleccionado para visualizar umbral (legacy, para compatibilidad)
  const [umbralTiposSeleccionados, setUmbralTiposSeleccionados] = useState<number[]>([]) // Tipos de sensor seleccionados para visualizar umbral (múltiples)
  const [umbralData, setUmbralData] = useState<{ minimo: number; maximo: number } | null>(null) // Datos del umbral seleccionado
  const [umbralesDisponibles, setUmbralesDisponibles] = useState<{ [tipoid: number]: { minimo: number; maximo: number } }>({}) // Todos los umbrales disponibles para el nodo
  const [tiposDisponibles, setTiposDisponibles] = useState<any[]>([]) // Tipos de sensores disponibles
  const [umbralAplicado, setUmbralAplicado] = useState(false) // Controla si los umbrales están aplicados y visibles
  const [tipoSensorDropdownOpen, setTipoSensorDropdownOpen] = useState(false) // Controla si el dropdown de tipos está abierto

  // Refs para cancelar requests y debouncing
  const loadMedicionesAbortControllerRef = useRef<AbortController | null>(null)
  const loadMedicionesTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadDetailedAnalysisAbortControllerRef = useRef<AbortController | null>(null)
  const loadDetailedAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Ref para rastrear el nodo actual de la petición en curso
  const currentRequestNodeIdRef = useRef<number | null>(null)
  const currentRequestKeyRef = useRef<string | null>(null)
  
  // OPTIMIZACIÓN: Caché de mediciones por nodoid + rango de fechas
  const medicionesCacheRef = useRef<Map<string, { data: MedicionData[]; timestamp: number }>>(new Map())
  const CACHE_TTL_MEDICIONES = 60000 // 60 segundos

  // Función para cargar mediciones (declarada antes del useEffect que la usa)
  const loadMediciones = useCallback(async (requestKey?: string, expectedNodeId?: number | null) => {

    // Si hay un nodo seleccionado, no requerir filtros (podemos usar nodoid directamente)
    // Si no hay nodo seleccionado, requerir ambos filtros
    const requiresUbicacionId = !selectedNode
    const hasRequiredFilters = selectedNode ? true : (filters.entidadId && (requiresUbicacionId ? filters.ubicacionId : true))

    if (!hasRequiredFilters) {
      setMediciones([])
      setLoading(false)
      return
    }
    
    // OPTIMIZACIÓN: Crear clave de caché basada en nodoid + rango de fechas
    const cacheKey = selectedNode 
      ? `node_${selectedNode.nodoid}_${filters.startDate || 'no-date'}_${filters.endDate || 'no-date'}`
      : `ent_${filters.entidadId}_ubic_${filters.ubicacionId || 'none'}`
    
    // Verificar caché antes de hacer la petición
    const cached = medicionesCacheRef.current.get(cacheKey)
    const now = Date.now()
    if (cached && (now - cached.timestamp) < CACHE_TTL_MEDICIONES) {
      setMediciones(cached.data)
      setLoading(false)
      return
    }
    
    // Crear una clave única para esta petición
    const thisRequestKey = requestKey || `${filters.entidadId}-${filters.ubicacionId}-${selectedNode?.nodoid || 'none'}-${Date.now()}`
    const thisNodeId = expectedNodeId !== undefined ? expectedNodeId : selectedNode?.nodoid || null
    
    // Verificar si esta petición ya fue invalidada por una nueva selección
    if (currentRequestKeyRef.current !== null && currentRequestKeyRef.current !== thisRequestKey) {
      return
    }

    // Verificar si el nodo cambió mientras se estaba cargando
    if (thisNodeId !== null && Number(selectedNode?.nodoid) !== Number(thisNodeId)) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    // Marcar esta petición como la actual
    currentRequestKeyRef.current = thisRequestKey
    currentRequestNodeIdRef.current = thisNodeId

    try {
      // Si hay un nodo seleccionado, buscar todas las mediciones disponibles para ese nodo
      // Si no hay nodo seleccionado, limitar a las últimas 6 horas
      let allData: any[] = []
      
      if (selectedNode) {
        const formatDate = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const seconds = String(date.getSeconds()).padStart(2, '0')
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        }

        // 1. INTENTAR PRIMERO CON LOS FILTROS GLOBALES DE FECHA SI EXISTEN
        if (filters.startDate && filters.endDate) {
          const startDateFormatted = `${filters.startDate} 00:00:00`
          const endDateFormatted = `${filters.endDate} 23:59:59`
          
          try {
            const data = await JoySenseService.getMediciones({
              nodoid: selectedNode.nodoid,
              startDate: startDateFormatted,
              endDate: endDateFormatted,
              limit: DATA_LIMITS.RANGE_SELECTED
            })
            
            const dataArray = Array.isArray(data) ? data : (data ? [data] : [])
            if (dataArray.length > 0) {
              allData = dataArray
            }
          } catch (error: any) {
            // Fallback a estrategia progresiva si hay error de timeout/500
          }
        }

        // 2. ESTRATEGIA PROGRESIVA: Solo si no se obtuvieron datos con los filtros globales
        if (allData.length === 0) {
          
          // ESTRATEGIA PROGRESIVA: Empezar con rango pequeño y expandir si no hay datos
          // Esto evita timeouts en el backend cuando hay muchos datos antiguos
          const now = new Date()
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) // Final del día actual
          
          // ESTRATEGIA: Intentar primero rangos pequeños (más rápidos) y luego expandir
          // Esto evita timeouts en nodos con muchos datos
          // Orden: 24 horas -> 7 días -> 14 días -> 30 días
          const ranges = [
            { days: 1, limit: DATA_LIMITS.HOURS_24, label: '24 horas' },
            { days: 7, limit: DATA_LIMITS.DAYS_7, label: '7 días' },
            { days: 14, limit: DATA_LIMITS.DAYS_14, label: '14 días' },
            { days: 30, limit: DATA_LIMITS.DAYS_30, label: '30 días' }
          ]
          
          // Intentar con rangos recientes (de menor a mayor)
          for (const range of ranges) {
            const startDate = new Date(endDate.getTime() - range.days * 24 * 60 * 60 * 1000)
            const startDateStr = formatDate(startDate)
            const endDateStr = formatDate(endDate)
            
            try {
              const data = await JoySenseService.getMediciones({
                nodoid: selectedNode.nodoid,
                startDate: startDateStr,
                endDate: endDateStr,
                limit: range.limit
              })
              
              // Asegurar que data es un array
              const dataArray = Array.isArray(data) ? data : (data ? [data] : [])
              
              if (dataArray.length > 0) {
                allData = dataArray
                break
              }
            } catch (error: any) {
              console.error(`ModernDashboard.loadMediciones: Error en rango ${range.label}:`, error)
              // Si es timeout o error 500, continuar con el siguiente rango
              const isTimeoutOr500 = error.message?.includes('timeout') || 
                                     error.code === '57014' || 
                                     error.message?.includes('500') ||
                                     error.message?.includes('HTTP error! status: 500')
              
              if (isTimeoutOr500) {
                continue
              }
              continue
            }
          }
        }
        
        // Si no encontramos datos en ningún rango, el nodo no tiene datos recientes
        // Se mostrará "NODO OBSERVADO"
        
      } else {
        // Sin nodo seleccionado: cargar resumen ligero del mapa para mostrar estado general
        // Esto evita cargar todas las mediciones de todos los nodos
        
        try {
          // Usar RPC para obtener resumen ligero del mapa
          const resumenNodos = await SupabaseRPCService.getResumenMapaNodos({
            ubicacionId: filters.ubicacionId || undefined
          });
          
          
          // Convertir resumen a formato compatible con mediciones para mostrar en el mapa
          // Usar última medición de cada nodo
          allData = resumenNodos.map((nodo: any) => ({
            nodoid: nodo.nodoid,
            fecha: nodo.ultima_medicion_fecha || new Date().toISOString(),
            medicion: 0, // No usamos el valor en resumen
            localizacion: {
              nodoid: nodo.nodoid,
              metricaid: 1 // Métrica default
            }
          }));
          
        } catch (error: any) {
          console.error('[ModernDashboard] Error loading map summary:', error);
          // Fallback: cargar últimas 6 horas si el RPC falla
          const endDate = new Date()
          const startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000) // Últimas 6 horas
          
          const formatDate = (date: Date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
          }
          
          const startDateStr = formatDate(startDate)
          const endDateStr = formatDate(endDate)

          const dataSinNodo = await JoySenseService.getMediciones({
            entidadId: filters.entidadId || undefined,
            ubicacionId: filters.ubicacionId || undefined,
            startDate: startDateStr,
            endDate: endDateStr,
            limit: 5000
          })
          
          allData = Array.isArray(dataSinNodo) ? dataSinNodo : (dataSinNodo ? [dataSinNodo] : [])
        }
      }

      // Verificar nuevamente si la petición sigue siendo válida después de la llamada async
      if (currentRequestKeyRef.current !== thisRequestKey) {
        return
      }
      
      if (thisNodeId !== null && Number(selectedNode?.nodoid) !== Number(thisNodeId)) {
        return
      }

      // Verificar que allData sea un array
      if (!Array.isArray(allData)) {
        // Solo actualizar si esta petición sigue siendo la actual
        if (currentRequestKeyRef.current === thisRequestKey) {
        setMediciones([])
        setLoading(false)
        }
        return
      }

      // Si ya se filtró por nodoid en el backend, no necesitamos filtrar de nuevo
      // El backend devuelve datos ordenados descendente (más recientes primero)
      // Ordenarlos ascendente para el procesamiento correcto
      let filteredData = allData
      
      if (filteredData.length === 0) {
        // Si no hay datos después de todos los intentos, verificar si hay datos anteriores
        // que puedan ser recientes antes de limpiar completamente
        if (currentRequestKeyRef.current === thisRequestKey) {
          // Si hay mediciones anteriores del mismo nodo, verificar si son recientes
          const previousMediciones = mediciones.filter(m => m.nodoid === selectedNode?.nodoid)
          if (previousMediciones.length > 0) {
            // Verificar si las mediciones anteriores son recientes (últimos 30 días)
            // Esto coincide con los rangos que se cargan (1, 7, 14, 30 días)
            const now = new Date()
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const hasRecentPreviousData = previousMediciones.some(m => 
              new Date(m.fecha) >= thirtyDaysAgo
            )
            
            if (hasRecentPreviousData) {
              // Hay datos recientes anteriores, mantenerlos
              setLoading(false)
              return
            }
          }
          
          // No hay datos recientes, limpiar mediciones
        setMediciones([])
        setLoading(false)
        }
        return
      }

      // Ordenar datos ascendente (más antiguos primero) para procesamiento correcto
      // Esto asegura que los datos más recientes estén al final y no se pierdan
      const sortedData = filteredData
        .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a, b) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }) => m)

      // Verificar una última vez antes de actualizar el estado
      if (currentRequestKeyRef.current !== thisRequestKey) {
        return
      }
      
      if (thisNodeId !== null && Number(selectedNode?.nodoid) !== Number(thisNodeId)) {
        return
      }

      // No filtrar por tiempo aquí - cada métrica hará su propio filtrado de 3 horas
      // Transformar datos para agregar campos legacy
      const transformed = transformMedicionData(sortedData)
      
      setMediciones(transformed)
      
      // OPTIMIZACIÓN: Guardar en caché
      medicionesCacheRef.current.set(cacheKey, {
        data: transformed,
        timestamp: now
      })
      
      // Limpiar caché antiguo (mantener solo los últimos 10)
      if (medicionesCacheRef.current.size > 10) {
        const entries = Array.from(medicionesCacheRef.current.entries())
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp) // Ordenar por timestamp descendente
        medicionesCacheRef.current.clear()
        entries.slice(0, 10).forEach(([key, value]) => {
          medicionesCacheRef.current.set(key, value)
        })
      }
      setError(null) // Limpiar cualquier error previo
    } catch (err: any) {
      // Verificar si esta petición sigue siendo válida antes de manejar el error
      if (currentRequestKeyRef.current !== thisRequestKey) {
        return
      }
      
      // Solo mostrar errores críticos, no errores temporales o de "no hay datos"
      const errorMessage = err?.message || String(err)
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')
      const isServerError = errorMessage.includes('status: 500') || errorMessage.includes('HTTP error')
      const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('Timeout')
      
      // Si es un error de servidor, red o timeout temporal, mantener datos anteriores
      if (isServerError || isNetworkError || isTimeoutError) {
        // No limpiar mediciones inmediatamente - mantener las anteriores si existen
        // Esto evita mostrar "Sin Datos" cuando hay un error temporal de red
        setError(null) // No mostrar error al usuario
      } else {
        // Error crítico no relacionado con datos, mostrar al usuario
        console.error(`❌ Error cargando mediciones:`, err)
        if (currentRequestKeyRef.current === thisRequestKey) {
          setError("Error al cargar las mediciones")
        }
      }
    } finally {
      // Solo actualizar loading si esta petición sigue siendo la actual
      if (currentRequestKeyRef.current === thisRequestKey) {
        setLoading(false)
      }
    }
  }, [filters.entidadId, filters.ubicacionId, filters.startDate, filters.endDate, selectedNode?.nodoid])

  // Crear array de dependencias estable para evitar warnings de React
  // IMPORTANTE: Cuando hay un nodo seleccionado, NO incluir ubicacionId en las dependencias
  // para evitar doble renderizado cuando ubicacionId cambia después de seleccionar el nodo
  const useEffectDependencies = useMemo(() => {
    const deps = [
      filters.entidadId, 
      filters.startDate,
      filters.endDate,
      selectedNode?.nodoid
      // CRÍTICO: NO incluir loadMediciones aquí
      // Es una función callback que cambia cuando sus dependencias cambian
      // Esto causaría un ciclo infinito
    ]
    // Solo incluir ubicacionId si NO hay nodo seleccionado
    // Cuando hay nodo, el nodoid es suficiente y ubicacionId puede cambiar sin afectar la carga
    if (!selectedNode && filters.ubicacionId) {
      deps.push(filters.ubicacionId)
    }
    return deps
  }, [filters.entidadId, filters.startDate, filters.endDate, selectedNode?.nodoid, selectedNode])

  // Cargar datos de mediciones con debouncing y cancelación mejorada
  useEffect(() => {
    // Si hay un nodo seleccionado, no requerir filtros (podemos usar nodoid directamente)
    // Si no hay nodo seleccionado, requerir ambos filtros
    const requiresUbicacionId = !selectedNode
    const hasRequiredFilters = selectedNode ? true : (filters.entidadId && (requiresUbicacionId ? filters.ubicacionId : true))
    
    if (!hasRequiredFilters) {
      // Si no hay filtros y hay un nodo seleccionado, limpiar mediciones para evitar mostrar datos del nodo anterior
      if (selectedNode) {
        setMediciones([])
        setLoading(false)
      }
      return
    }
    
    // Si cambió el nodo, limpiar mediciones inmediatamente para mostrar loading
    const previousNodeId = currentRequestNodeIdRef.current
    const currentNodeId = selectedNode?.nodoid || null
    if (previousNodeId !== null && Number(previousNodeId) !== Number(currentNodeId)) {
      setMediciones([])
      setLoading(true)
    }
    
    // Limpiar timeout anterior
    if (loadMedicionesTimeoutRef.current) {
      clearTimeout(loadMedicionesTimeoutRef.current)
    }
    
    // Crear una clave única para esta petición basada solo en el nodo (no en ubicacionId que puede cambiar)
    const requestKey = `${filters.entidadId}-${selectedNode?.nodoid || 'none'}-${Date.now()}`
    const expectedNodeId = selectedNode?.nodoid || null
    
    // Invalidar peticiones anteriores solo si el nodo cambió
    if (Number(previousNodeId) !== Number(currentNodeId)) {
      currentRequestKeyRef.current = null // Invalidar temporalmente
    }
    
    // Debounce reducido cuando hay un nodo seleccionado (más rápido)
    const debounceTime = selectedNode ? 300 : 500
    
    // Debounce: esperar antes de cargar
    loadMedicionesTimeoutRef.current = setTimeout(() => {
      // Verificar que el nodo no haya cambiado durante el debounce
      if (Number(expectedNodeId) !== Number(selectedNode?.nodoid || null)) {
        return
      }
      
      // Verificar nuevamente que los filtros requeridos estén disponibles
      const stillRequiresUbicacionId = !selectedNode
      const stillHasRequiredFilters = selectedNode ? true : (filters.entidadId && (stillRequiresUbicacionId ? filters.ubicacionId : true))
      
      if (!stillHasRequiredFilters) {
        return
      }
      
      // Marcar esta como la petición actual
      currentRequestKeyRef.current = requestKey
      currentRequestNodeIdRef.current = expectedNodeId
      
      // Cargar datos
      loadMediciones(requestKey, expectedNodeId)
    }, debounceTime)
    
    // Cleanup
    return () => {
      if (loadMedicionesTimeoutRef.current) {
        clearTimeout(loadMedicionesTimeoutRef.current)
      }
      // Solo invalidar si el nodo realmente cambió (no solo por cambio de ubicacionId)
      const cleanupNodeId = selectedNode?.nodoid || null
      if (currentRequestKeyRef.current === requestKey && Number(currentRequestNodeIdRef.current) !== Number(cleanupNodeId)) {
        currentRequestKeyRef.current = null
        currentRequestNodeIdRef.current = null
      }
    }
    // IMPORTANTE: Usar array de dependencias estable creado con useMemo
  }, useEffectDependencies)

  // Función para cargar mediciones para el análisis detallado con rango de fechas específico
  const loadMedicionesForDetailedAnalysis = useCallback(async (startDateStr: string, endDateStr: string, signal?: AbortSignal) => {
    if (!selectedNode) {
      setLoadingDetailedData(false)
      return
    }

    if (signal?.aborted) {
      setLoadingDetailedData(false)
      return
    }

    setLoadingDetailedData(true)
    // CRÍTICO: Limpiar datos detallados ANTES de cargar nuevos (evita usar datos stale)
    setDetailedMediciones([])
    
    try {

      // CRÍTICO: Cargar datos EFICIENTEMENTE usando RPC con agregación inteligente
      // La función fn_get_mediciones_nodo_detallado:
      // - Para rangos <= 7 días: retorna todos los puntos (sin agregación)
      // - Para rangos 7-30 días: retorna agregados por hora (preserva sensores)
      // - Para rangos 30-60 días: retorna agregados por 6 horas (preserva sensores)
      // Esto mantiene ALL LOS SENSORES mientras reduce la cantidad de datos para rangos grandes
      
      const detailedData = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedNode.nodoid,
        startDate: startDateStr,
        endDate: endDateStr
      });
      
      if (!Array.isArray(detailedData)) {
        setDetailedMediciones([]);
        return;
      }

      // Transformar datos de la RPC al formato MedicionData
      // fn_get_mediciones_nodo_detallado retorna metrica_nombre, sensor_nombre, tipo_nombre
      const transformedData: MedicionData[] = detailedData.map((rpcData: any) => ({
        medicionid: rpcData.medicionid || 0,
        localizacionid: rpcData.localizacionid || 0,
        fecha: rpcData.fecha,
        medicion: Number(rpcData.medicion),
        localizacion: {
          localizacionid: rpcData.localizacionid || 0,
          localizacion: rpcData.localizacion_nombre || '',
          nodoid: selectedNode.nodoid,
          metricaid: rpcData.metricaid,
          sensorid: rpcData.sensorid || 0,
          metrica: {
            metricaid: rpcData.metricaid,
            metrica: rpcData.metrica_nombre || rpcData.metrica || '',
            unidad: rpcData.unidad || ''
          },
          sensor: rpcData.sensorid ? {
            sensorid: rpcData.sensorid,
            sensor: rpcData.sensor_nombre || rpcData.sensor || '',
            nombre: rpcData.sensor_nombre || rpcData.sensor || '',
            modelo: '',
            deveui: '',
            tipoid: rpcData.tipoid || 0,
            tipo: {
              tipoid: rpcData.tipoid || 0,
              tipo: rpcData.tipo_nombre || rpcData.tipo || 'Sensor'
            }
          } : undefined
        },
        metricaid: rpcData.metricaid,
        nodoid: selectedNode.nodoid,
        sensorid: rpcData.sensorid || 0,
        tipoid: rpcData.tipoid || 0,
        ubicacionid: 0
      }));
      
      
      setDetailedMediciones(transformedData)
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        setLoadingDetailedData(false)
        return
      }
      console.error('[ModernDashboard] loadMedicionesForDetailedAnalysis error:', err)
      setError(err.message || 'Error cargando datos detallados')
      setLoadingDetailedData(false)
    } finally {
      setLoadingDetailedData(false)
    }
  }, [selectedNode])

  // Cargar localizaciones del nodo seleccionado
  useEffect(() => {
    const loadLocalizaciones = async () => {
      if (!selectedNode?.nodoid) {
        setLocalizacionesPorNodo(new Map())
        return
      }

      try {
        const localizaciones = await JoySenseService.getLocalizacionesByNodo(selectedNode.nodoid)
        // Guardar nombres de localización únicos
        const nombres = Array.from(new Set(localizaciones.map((loc: any) => loc.localizacion || '').filter((n: string) => n)))
        const map = new Map<number, string[]>()
        if (nombres.length > 0) {
          map.set(selectedNode.nodoid, nombres)
        }
        setLocalizacionesPorNodo(map)
      } catch (error) {
        console.error('Error cargando localizaciones:', error)
        setLocalizacionesPorNodo(new Map())
      }
    }

    loadLocalizaciones()
  }, [selectedNode?.nodoid])

  // Cargar nodos disponibles cuando se abre el modal de análisis detallado
  useEffect(() => {
    if (showDetailedAnalysis && selectedNode) {
      const loadAvailableNodes = async () => {
        try {
          // Obtener nodos (con filtro global para que el mapa tenga todos los del fundo/empresa/país)
          const filters = fundoSeleccionado
            ? { fundoId: fundoSeleccionado }
            : empresaSeleccionada
            ? { empresaId: empresaSeleccionada }
            : paisSeleccionado
            ? { paisId: paisSeleccionado }
            : undefined;
          const nodes = await JoySenseService.getNodosConLocalizacion(1000, filters);

          // Aplicar filtros globales por si acaso (redundante si ya se pasaron al API)
          let filteredNodes = filterNodesByGlobalFilters(
            nodes || [],
            paisSeleccionado,
            empresaSeleccionada,
            fundoSeleccionado
          );
          
          // Filtrar nodos: excluir solo el nodo actual
          // Mostrar todos los demás nodos (la verificación de mediciones se hace cuando se selecciona)
          filteredNodes = (filteredNodes || []).filter((node: any) => {
            // Excluir el nodo actual
            return node.nodoid !== selectedNode.nodoid
          })
          
          setAvailableNodes(filteredNodes)
        } catch (err) {
          console.error('Error cargando nodos disponibles:', err)
          setAvailableNodes([])
        }
      }
      loadAvailableNodes()
    } else {
      setAvailableNodes([])
    }
  }, [showDetailedAnalysis, selectedNode?.nodoid, paisSeleccionado, empresaSeleccionada, fundoSeleccionado])

  // Función para cargar mediciones del nodo de comparación
  const loadComparisonMediciones = useCallback(async (comparisonNode: any) => {
    if (!comparisonNode || !detailedStartDate || !detailedEndDate) {
      // console.warn('⚠️ loadComparisonMediciones: Faltan datos requeridos', { comparisonNode, detailedStartDate, detailedEndDate })
      return
    }

    // Si hay nodoid, usarlo directamente (más eficiente y directo)
    // Similar a cómo se hace para el nodo principal
    if (!comparisonNode.nodoid) {
      // console.warn('⚠️ loadComparisonMediciones: El nodo de comparación no tiene nodoid')
      return
    }

    setLoadingComparisonData(true)
    
    try {
      // IMPORTANTE: Parsear fechas en zona horaria local para evitar problemas de UTC
      const formatDate = (dateStr: string, isEnd: boolean = false) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        // Crear fecha en zona horaria local
        const date = new Date(year, month - 1, day)
        
        const yearStr = String(date.getFullYear())
        const monthStr = String(date.getMonth() + 1).padStart(2, '0')
        const dayStr = String(date.getDate()).padStart(2, '0')
        if (isEnd) {
          return `${yearStr}-${monthStr}-${dayStr} 23:59:59`
        }
        return `${yearStr}-${monthStr}-${dayStr} 00:00:00`
      }

      const startDateFormatted = formatDate(detailedStartDate, false)
      const endDateFormatted = formatDate(detailedEndDate, true)

      // IMPORTANTE: Crear fechas en zona horaria local para cálculo de días
      const [startYear, startMonth, startDay] = detailedStartDate.split('-').map(Number)
      const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
      
      const [endYear, endMonth, endDay] = detailedEndDate.split('-').map(Number)
      const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      
      // OPTIMIZACIÓN: Usar límites más pequeños para comparación (no necesita tanta precisión)
      // Para comparación, podemos usar menos datos y más agregación
      let maxLimit = 10000
      let useGetAll = false
      
      if (daysDiff > 60) {
        // Para rangos grandes, usar getAll pero con límite más pequeño
        maxLimit = 20000
        useGetAll = true
      } else if (daysDiff > 30) {
        maxLimit = 30000
      } else if (daysDiff > 14) {
        maxLimit = 20000
      } else if (daysDiff > 7) {
        maxLimit = 15000
      } else {
        maxLimit = 10000
      }
      
      // Usar nodoid directamente (más eficiente que filtrar por entidadId y ubicacionId)
      const comparisonData = await JoySenseService.getMediciones({
        nodoid: comparisonNode.nodoid,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        getAll: useGetAll,
        limit: !useGetAll ? maxLimit : undefined
      })
      
      if (!Array.isArray(comparisonData)) {
        console.warn('⚠️ Datos de comparación no válidos')
        return
      }

      const sortedComparisonData = comparisonData
        .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a, b) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }) => m)
      
      // CRÍTICO: Transformar datos para agregar campos legacy (nodoid, tipoid, metricaid)
      const transformedData = transformMedicionData(sortedComparisonData)
      
      setComparisonMediciones(transformedData)
    } catch (err: any) {
      console.error('❌ Error cargando datos de comparación:', err)
      setComparisonMediciones([])
    } finally {
      setLoadingComparisonData(false)
    }
  }, [detailedStartDate, detailedEndDate])

  // Función para analizar fluctuación y recomendar umbrales
  const analyzeFluctuationAndRecommendThresholds = useCallback(() => {
    // CRÍTICO: Usar detailedMediciones cuando esté disponible (para el modal detallado)
    const dataSource = detailedMediciones.length > 0 ? detailedMediciones : mediciones
    
    if (!dataSource.length || !tipos.length || !detailedStartDate || !detailedEndDate) {
      return
    }

    // IMPORTANTE: Parsear fechas en zona horaria local para evitar problemas de UTC
    const [startYear, startMonth, startDay] = detailedStartDate.split('-').map(Number)
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
    
    const [endYear, endMonth, endDay] = detailedEndDate.split('-').map(Number)
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
    
    // Función auxiliar para calcular recomendaciones de un conjunto de mediciones
    const calculateRecommendations = (medicionesData: any[]): { [label: string]: { min: number; max: number; avg: number; stdDev: number } } => {
      // CRÍTICO: Usar mapeo dinámico por nombre de métrica en lugar de ID hardcodeado
      const filteredMediciones = medicionesData.filter(m => {
        const medicionDate = new Date(m.fecha)
        const isInDateRange = medicionDate >= startDate && medicionDate <= endDate
        
        // Filtrar por nombre de métrica dinámicamente
        const rawMetricName = m.localizacion?.metrica?.metrica || ''
        const metricName = rawMetricName
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .trim()
          .toLowerCase()
        
        let matchesMetric = false
        if (selectedDetailedMetric === 'temperatura' && (
          metricName.includes('temperatura') || metricName.includes('temp')
        )) matchesMetric = true
        
        if (selectedDetailedMetric === 'humedad' && (
          metricName.includes('humedad') || metricName.includes('humidity')
        )) matchesMetric = true
        
        if (selectedDetailedMetric === 'conductividad' && (
          metricName.includes('conductividad') || 
          metricName.includes('electroconductividad') ||
          metricName.includes('conductivity')
        )) matchesMetric = true
        
        return isInDateRange && matchesMetric
      })

      if (filteredMediciones.length === 0) {
        return {}
      }

      // Agrupar por etiqueta de sensor (como en MetricaPorLoteModal)
      const medicionesPorLabel: { [label: string]: number[] } = {}
      
      filteredMediciones.forEach(m => {
        const label = getSeriesLabel(m)
        if (!medicionesPorLabel[label]) {
          medicionesPorLabel[label] = []
        }
        if (m.medicion != null && !isNaN(m.medicion)) {
          medicionesPorLabel[label].push(m.medicion)
        }
      })
      
      // Calcular estadísticas y recomendar umbrales para cada etiqueta
      const recommendations: { [label: string]: { min: number; max: number; avg: number; stdDev: number } } = {}
      
      Object.keys(medicionesPorLabel).forEach(label => {
        const valores = medicionesPorLabel[label]
        
        if (valores.length === 0) return
        
        // Calcular estadísticas
        const avg = valores.reduce((sum, v) => sum + v, 0) / valores.length
        const variance = valores.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / valores.length
        const stdDev = Math.sqrt(variance)
        
        // Recomendar umbrales basados en percentiles (5% y 95%) con un margen de seguridad
        const sorted = [...valores].sort((a, b) => a - b)
        const p5 = sorted[Math.floor(sorted.length * 0.05)]
        const p95 = sorted[Math.ceil(sorted.length * 0.95)]
        
        // Usar percentiles con un margen adicional basado en desviación estándar
        const margin = stdDev * 0.5 // Margen del 50% de la desviación estándar
        const recommendedMin = Math.max(0, p5 - margin) // No permitir valores negativos
        const recommendedMax = p95 + margin
        
        recommendations[label] = {
          min: Math.round(recommendedMin * 100) / 100,
          max: Math.round(recommendedMax * 100) / 100,
          avg: Math.round(avg * 100) / 100,
          stdDev: Math.round(stdDev * 100) / 100
        }
      })

      return recommendations
    }

    // Calcular recomendaciones para el nodo principal
    const mainNodeRecommendations = calculateRecommendations(dataSource)
    
    if (Object.keys(mainNodeRecommendations).length === 0) {
      showWarning(
        'Datos insuficientes',
        'No hay datos suficientes para analizar la fluctuación del nodo principal'
      )
      return
    }

    const allRecommendations: { [nodeId: string]: { [label: string]: { min: number; max: number; avg: number; stdDev: number } } } = {
      [`node_${selectedNode?.nodoid || 'main'}`]: mainNodeRecommendations
    }

    // Si hay nodo de comparación, calcular también sus recomendaciones
    if (comparisonNode && comparisonMediciones.length > 0) {
      const comparisonRecommendations = calculateRecommendations(comparisonMediciones)
      if (Object.keys(comparisonRecommendations).length > 0) {
        allRecommendations[`node_${comparisonNode.nodoid}`] = comparisonRecommendations
      }
    }

    setThresholdRecommendations(allRecommendations)
    setShowThresholdModal(true)
  }, [mediciones, detailedMediciones, comparisonMediciones, tipos, detailedStartDate, detailedEndDate, selectedDetailedMetric, selectedNode, comparisonNode, showWarning])

  // Callbacks estables para NodeSelector (fuera del JSX para cumplir reglas de hooks)
  const handleNodeSelect = useCallback((nodeData: NodeData) => {
    try {
      setSelectedNode(nodeData)
    } catch (error) {
      console.error('Error al actualizar selectedNode:', error);
    }
  }, [])

  const handleNodeClear = useCallback(() => {
    setSelectedNode(null);
    // Si está abierto el gráfico detallado, mostrar modal para volver al mapa
    if (showDetailedAnalysis) {
      setShowReturnToMapModal(true);
    } else {
      // Si no está en gráfico detallado, cerrar directamente
      setShowDetailedAnalysis(false);
    }
  }, [showDetailedAnalysis])

  const handleFiltersUpdate = useCallback((newFilters: {
    entidadId: number | null;
    ubicacionId: number | null;
    fundoId?: number | null;
    empresaId?: number | null;
    paisId?: number | null;
  }) => {
    onFiltersChange({
      entidadId: newFilters.entidadId,
      ubicacionId: newFilters.ubicacionId,
      startDate: filters.startDate,
      endDate: filters.endDate
    })
  }, [onFiltersChange, filters.startDate, filters.endDate])

  // Recargar datos cuando cambien las fechas del análisis detallado (con debouncing)
  useEffect(() => {
    // Validar que las fechas sean válidas antes de cargar
    if (!showDetailedAnalysis || !detailedStartDate || !detailedEndDate || !selectedNode) {
      // Si el modal está abierto pero faltan datos, detener el loading
      if (showDetailedAnalysis && loadingDetailedData) {
        setLoadingDetailedData(false)
      }
      return
    }
    
    // Validar que la fecha inicial no sea mayor que la final
    if (new Date(detailedStartDate) > new Date(detailedEndDate)) {
      console.warn('⚠️ Fechas inválidas: fecha inicial mayor que fecha final')
      setLoadingDetailedData(false)
      return
    }
    
    // Mostrar pantalla de carga INMEDIATAMENTE cuando cambian las fechas
    setLoadingDetailedData(true)
    
    // Cancelar request anterior si existe
    if (loadDetailedAnalysisAbortControllerRef.current) {
      loadDetailedAnalysisAbortControllerRef.current.abort()
    }
    
    // Limpiar timeout anterior
    if (loadDetailedAnalysisTimeoutRef.current) {
      clearTimeout(loadDetailedAnalysisTimeoutRef.current)
    }
    
    // Crear nuevo AbortController
    const abortController = new AbortController()
    loadDetailedAnalysisAbortControllerRef.current = abortController
    
    // Debounce: esperar 1000ms antes de cargar (más tiempo para análisis detallado y evitar lag)
    // PERO: si no hay datos para el rango seleccionado, cargar inmediatamente
    // Verificar si hay datos para el rango actual
    const hasDataForRange = mediciones.some(m => {
      const medicionDate = new Date(m.fecha)
      const startDate = new Date(detailedStartDate + 'T00:00:00')
      const endDate = new Date(detailedEndDate + 'T23:59:59')
      return medicionDate >= startDate && medicionDate <= endDate && m.nodoid === selectedNode?.nodoid
    })
    
    const delay = (!mediciones.length || !hasDataForRange) ? 100 : 1000 // Carga inmediata si no hay datos, debounce si hay datos
    
    loadDetailedAnalysisTimeoutRef.current = setTimeout(() => {
      loadMedicionesForDetailedAnalysis(detailedStartDate, detailedEndDate, abortController.signal)
    }, delay)
    
    // Cleanup
    return () => {
      if (loadDetailedAnalysisTimeoutRef.current) {
        clearTimeout(loadDetailedAnalysisTimeoutRef.current)
      }
      if (abortController) {
        abortController.abort()
      }
    }
  }, [detailedStartDate, detailedEndDate, selectedDetailedMetric, showDetailedAnalysis, selectedNode?.nodoid, loadMedicionesForDetailedAnalysis])

  // Resetear ajuste del eje Y cuando cambia el nodo o la métrica
  useEffect(() => {
    setYAxisDomain({ min: null, max: null })
  }, [selectedNode?.nodoid, selectedDetailedMetric])

  // Inicializar tipos visibles cuando se abre el modal o cambia la métrica/nodo
  useEffect(() => {
    if (!showDetailedAnalysis || !selectedDetailedMetric) {
      setVisibleTipos(new Set())
      return
    }
    
    // Obtener tipos disponibles de las mediciones
    // Para el análisis detallado, priorizar detailedMediciones si existen
    const dataSource = detailedMediciones.length > 0 ? detailedMediciones : mediciones
    
    // CRÍTICO: Usar mapeo dinámico por nombre de métrica en lugar de ID hardcodeado
    const metricMediciones = dataSource.filter(m => {
      const rawMetricName = m.localizacion?.metrica?.metrica || ''
      const metricName = rawMetricName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .trim()
        .toLowerCase()
      
      if (selectedDetailedMetric === 'temperatura' && (
        metricName.includes('temperatura') || metricName.includes('temp')
      )) return true
      
      if (selectedDetailedMetric === 'humedad' && (
        metricName.includes('humedad') || metricName.includes('humidity')
      )) return true
      
      if (selectedDetailedMetric === 'conductividad' && (
        metricName.includes('conductividad') || 
        metricName.includes('electroconductividad') ||
        metricName.includes('conductivity')
      )) return true
      
      return false
    })
    
    const tiposDisponibles = new Set<string>()
    
    // 1. Obtener tipos del nodo principal
    metricMediciones.forEach(m => {
      const label = getSeriesLabel(m)
      // Extraer solo la parte del sensor: "Ubicación (Sensor)" -> "Sensor"
      const sensorLabel = label.match(/\(([^)]+)\)/)?.[1] || label
      tiposDisponibles.add(`main:${sensorLabel}`)
    })
    
    // 2. Obtener tipos del nodo de comparación
    if (comparisonNode && comparisonMediciones.length > 0) {
      const comparisonMetricMediciones = comparisonMediciones.filter(m => {
        const rawMetricName = m.localizacion?.metrica?.metrica || ''
        const metricName = rawMetricName
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .trim()
          .toLowerCase()
        
        if (selectedDetailedMetric === 'temperatura' && (
          metricName.includes('temperatura') || metricName.includes('temp')
        )) return true
        
        if (selectedDetailedMetric === 'humedad' && (
          metricName.includes('humedad') || metricName.includes('humidity')
        )) return true
        
        if (selectedDetailedMetric === 'conductividad' && (
          metricName.includes('conductividad') || 
          metricName.includes('electroconductividad') ||
          metricName.includes('conductivity')
        )) return true
        
        return false
      })
      
      comparisonMetricMediciones.forEach(m => {
        const label = getSeriesLabel(m)
        const sensorLabel = label.match(/\(([^)]+)\)/)?.[1] || label
        tiposDisponibles.add(`comp:${sensorLabel}`)
      })
    }
    
    // Si visibleTipos está vacío o no contiene todos los tipos actuales, inicializar
    setVisibleTipos(prev => {
      const newVisible = new Set(prev)
      let changed = false
      
      tiposDisponibles.forEach(tipo => {
        if (!newVisible.has(tipo)) {
          newVisible.add(tipo)
          changed = true
        }
      })
      
      return changed ? newVisible : prev
    })
  }, [showDetailedAnalysis, selectedDetailedMetric, selectedNode?.nodoid, comparisonNode?.nodoid, mediciones, detailedMediciones, comparisonMediciones, tipos, sensores, getSeriesLabel])

  // Recargar datos de comparación cuando cambien las fechas o se seleccione un nodo de comparación (con debouncing)
  useEffect(() => {
    if (!showDetailedAnalysis || !comparisonNode || !detailedStartDate || !detailedEndDate) {
      // Si no hay nodo de comparación, limpiar datos de comparación
      if (!comparisonNode) {
        setComparisonMediciones([])
      }
      return
    }
    
    // Validar que la fecha inicial no sea mayor que la final
    if (new Date(detailedStartDate) > new Date(detailedEndDate)) {
      return
    }
    
    // OPTIMIZACIÓN: Debouncing para evitar recargas innecesarias
    // Esperar 500ms después del último cambio antes de cargar
    const timeoutId = setTimeout(() => {
      loadComparisonMediciones(comparisonNode)
    }, 500)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [detailedStartDate, detailedEndDate, comparisonNode?.nodoid, showDetailedAnalysis, loadComparisonMediciones])

  // Cargar entidades, ubicaciones, métricas, tipos y sensores
  useEffect(() => {
    loadEntidades()
    loadUbicaciones()
    loadMetricas()
    loadTipos()
    loadSensores()
  }, [])

  const loadEntidades = async () => {
    try {
      const data = await JoySenseService.getEntidades()
      setEntidades(data)
    } catch (err) {
      console.error("[ModernDashboard] loadEntidades:", err)
    }
  }

  const loadUbicaciones = async () => {
    try {
      const data = await JoySenseService.getUbicaciones()
      setUbicaciones(data)
    } catch (err) {
      console.error("[ModernDashboard] loadUbicaciones:", err)
    }
  }

  const loadMetricas = async () => {
    try {
      const data = await JoySenseService.getMetricas()
      setMetricas(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data.length > 0) {
        setSelectedMetrica(data[0].metricaid)
      }
    } catch (err) {
      console.error("[ModernDashboard] loadMetricas:", err)
    }
  }

  const loadTipos = async () => {
    try {
      const data = await JoySenseService.getTipos()
      setTipos(Array.isArray(data) ? data : [])
      setTiposDisponibles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("[ModernDashboard] loadTipos:", err)
    }
  }

  const loadSensores = async () => {
    try {
      const data = await JoySenseService.getSensores()
      setSensores(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading sensores:", err)
    }
  }

  // Cargar todos los umbrales del nodo para detectar cuáles tienen el mismo rango
  const loadUmbralesDelNodo = useCallback(async () => {
    if (!umbralNodoSeleccionado || !selectedDetailedMetric) {
      setUmbralesDisponibles({})
      setUmbralData(null)
      return
    }

    try {
      const allUmbrales = await JoySenseService.getTableData('umbral', 1000)
      const metricId = getMetricIdFromDataKey(selectedDetailedMetric)
      
      // Obtener todos los umbrales del nodo para esta métrica
      const umbralesDelNodo = allUmbrales.filter((u: any) => 
        u.nodoid === umbralNodoSeleccionado && 
        u.metricaid === metricId &&
        u.statusid === 1 // Solo umbrales activos
      )

      // Agrupar por tipoid
      const umbralesPorTipo: { [tipoid: number]: { minimo: number; maximo: number } } = {}
      umbralesDelNodo.forEach((u: any) => {
        umbralesPorTipo[u.tipoid] = {
          minimo: u.minimo,
          maximo: u.maximo
        }
      })

      setUmbralesDisponibles(umbralesPorTipo)

      // Si hay un tipo seleccionado, establecer umbralData
      if (umbralTipoSeleccionado && umbralesPorTipo[umbralTipoSeleccionado]) {
        setUmbralData(umbralesPorTipo[umbralTipoSeleccionado])
      } else if (umbralTiposSeleccionados.length > 0) {
        // Si hay múltiples tipos seleccionados, verificar que todos tengan el mismo umbral
        const primerUmbral = umbralesPorTipo[umbralTiposSeleccionados[0]]
        if (primerUmbral) {
          const todosIguales = umbralTiposSeleccionados.every(tipoid => {
            const umbral = umbralesPorTipo[tipoid]
            return umbral && umbral.minimo === primerUmbral.minimo && umbral.maximo === primerUmbral.maximo
          })
          if (todosIguales) {
            setUmbralData(primerUmbral)
          } else {
            setUmbralData(null)
          }
        }
      } else {
        setUmbralData(null)
      }
    } catch (err) {
      console.error("Error loading umbrales:", err)
      setUmbralesDisponibles({})
      setUmbralData(null)
    }
  }, [umbralNodoSeleccionado, umbralTipoSeleccionado, umbralTiposSeleccionados, selectedDetailedMetric])

  // Cargar umbral cuando cambian las selecciones (legacy, mantener para compatibilidad)
  const loadUmbral = useCallback(async () => {
    await loadUmbralesDelNodo()
  }, [loadUmbralesDelNodo])

  // Cargar umbrales cuando cambian las selecciones
  useEffect(() => {
    loadUmbralesDelNodo()
  }, [loadUmbralesDelNodo])

  // Función para calcular y ajustar el eje Y basado en datos y umbrales
  const ajustarEjeYParaUmbrales = useCallback(() => {
    if (!umbralData || !selectedDetailedMetric) {
      return
    }

    // Obtener tipos seleccionados (múltiples o único)
    const tiposValidos = umbralTiposSeleccionados.length > 0 
      ? umbralTiposSeleccionados 
      : (umbralTipoSeleccionado ? [umbralTipoSeleccionado] : [])
    
    if (tiposValidos.length === 0) {
      return
    }

    try {
      const metricId = getMetricIdFromDataKey(selectedDetailedMetric)

      // Obtener valores de las mediciones del nodo seleccionado para todos los tipos seleccionados y métrica
      const valores: number[] = []
      
      // Filtrar mediciones del nodo seleccionado para todos los tipos
      const medicionesDelNodo = umbralNodoSeleccionado === selectedNode?.nodoid
        ? mediciones.filter(m => m.metricaid === metricId && m.tipoid !== undefined && m.tipoid !== null && tiposValidos.includes(m.tipoid))
        : (comparisonNode && umbralNodoSeleccionado === comparisonNode.nodoid
          ? comparisonMediciones.filter(m => m.metricaid === metricId && m.tipoid !== undefined && m.tipoid !== null && tiposValidos.includes(m.tipoid))
          : [])
      
      // Extraer valores
      medicionesDelNodo.forEach(m => {
        if (m.medicion !== null && m.medicion !== undefined && !isNaN(m.medicion)) {
          valores.push(m.medicion)
        }
      })

      // Calcular min y max de los datos
      const dataMin = valores.length > 0 ? Math.min(...valores) : umbralData.minimo
      const dataMax = valores.length > 0 ? Math.max(...valores) : umbralData.maximo

      // Considerar también los umbrales
      const minGlobal = Math.min(dataMin, umbralData.minimo)
      const maxGlobal = Math.max(dataMax, umbralData.maximo)

      // Agregar un margen del 10% arriba y abajo
      const rango = maxGlobal - minGlobal
      const margen = Math.max(rango * 0.1, (maxGlobal - minGlobal) * 0.05) // Mínimo 5% del rango
      const nuevoMin = Math.max(0, minGlobal - margen) // No permitir valores negativos si el mínimo es positivo
      const nuevoMax = maxGlobal + margen

      // Actualizar el eje Y
      setYAxisDomain({
        min: nuevoMin,
        max: nuevoMax
      })
    } catch (err) {
      console.error("Error ajustando eje Y para umbrales:", err)
    }
  }, [umbralData, umbralTipoSeleccionado, umbralTiposSeleccionados, umbralNodoSeleccionado, selectedDetailedMetric, tipos, mediciones, comparisonMediciones, comparisonNode, selectedNode])

  // Inicializar nodo seleccionado por defecto cuando se abre el análisis detallado
  useEffect(() => {
    if (showDetailedAnalysis && selectedNode && !umbralNodoSeleccionado) {
      setUmbralNodoSeleccionado(selectedNode.nodoid)
    }
    // Resetear estados de umbral cuando se cierra el modal
    if (!showDetailedAnalysis) {
      setUmbralNodoSeleccionado(null)
      setUmbralTipoSeleccionado(null)
      setUmbralData(null)
      setUmbralAplicado(false)
    }
  }, [showDetailedAnalysis, selectedNode])

  // Actualizar visibleTipos cuando se seleccionan nodo y tipo para umbral y se aplica
  useEffect(() => {
    if (umbralAplicado && umbralNodoSeleccionado && umbralTipoSeleccionado) {
      const tipoSeleccionado = tipos.find(t => t.tipoid === umbralTipoSeleccionado)
      if (tipoSeleccionado) {
        setVisibleTipos(new Set([tipoSeleccionado.tipo]))
      }
    }
    // Nota: No restauramos automáticamente todos los tipos cuando se limpia la selección
    // para permitir que el usuario mantenga su selección manual de tipos visibles
  }, [umbralAplicado, umbralNodoSeleccionado, umbralTipoSeleccionado, tipos])


  // Procesar datos para gráficos - específico por métrica y tipo de sensor
  const processChartData = (dataKey: string, useCustomRange: boolean = false, overrideGranularity?: { useDays: boolean, useHours: boolean }) => {
    // CRÍTICO: Para gráfico detallado, SIEMPRE usar detailedMediciones
    // Para minigráficos, usar mediciones normales
    let sourceMediciones = mediciones
    
    if (useCustomRange) {
      // En modo gráfico detallado, SIEMPRE usar datos detallados
      // Si no hay datos detallados, retornar vacío (no caer a minigráficos)
      sourceMediciones = detailedMediciones
    }
    
    if (!sourceMediciones.length || !tipos.length || !selectedNode) return []

    // 1. Filtrar por Nodo y Métrica (nodo principal)
    const metricMediciones = sourceMediciones.filter(m => {
      if (Number(m.nodoid) !== Number(selectedNode.nodoid)) return false
      const rawMetricName = m.localizacion?.metrica?.metrica || ''
      const metricName = rawMetricName.replace(/[\r\n]/g, ' ').trim().toLowerCase()
      return matchesMetricId(rawMetricName, dataKey)
    })
    
    // Si hay nodo de comparación, incluir también sus mediciones
    let comparisonMetricMediciones: MedicionData[] = []
    if (comparisonNode && comparisonMediciones.length > 0) {
      comparisonMetricMediciones = comparisonMediciones.filter(m => {
        if (Number(m.nodoid) !== Number(comparisonNode.nodoid)) return false
        const rawMetricName = m.localizacion?.metrica?.metrica || ''
        const metricName = rawMetricName.replace(/[\r\n]/g, ' ').trim().toLowerCase()
        return matchesMetricId(rawMetricName, dataKey)
      })
    }
    

    if (!metricMediciones.length && !comparisonMetricMediciones.length) return []

    // 2. Ordenar y Filtrar por Rango (si es fallback)
    const sortedMediciones = [...metricMediciones].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    const sortedComparisonMediciones = [...comparisonMetricMediciones].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    
    let filteredMediciones = sortedMediciones
    let filteredComparisonMediciones = sortedComparisonMediciones
    let timeSpan = 3 * 60 * 60 * 1000
    
    if (useCustomRange && detailedStartDate && detailedEndDate) {
      const [sY, sM, sD] = detailedStartDate.split('-').map(Number);
      const startDate = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      const [eY, eM, eD] = detailedEndDate.split('-').map(Number);
      const endDate = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      

      // Aplicar filtro de fecha siempre que sea un rango personalizado
      filteredMediciones = sortedMediciones.filter(m => {
        const d = new Date(m.fecha).getTime();
        return d >= startDate.getTime() && d <= endDate.getTime();
      })
      filteredComparisonMediciones = sortedComparisonMediciones.filter(m => {
        const d = new Date(m.fecha).getTime();
        return d >= startDate.getTime() && d <= endDate.getTime();
      })
      timeSpan = endDate.getTime() - startDate.getTime()
    } else if (filters.startDate && filters.endDate && sortedMediciones.length > 0) {
      // Aplicar filtros globales de fecha si existen para los minigráficos
      const [sY, sM, sD] = filters.startDate.split('-').map(Number);
      const startDate = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      const [eY, eM, eD] = filters.endDate.split('-').map(Number);
      const endDate = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      
      filteredMediciones = sortedMediciones.filter(m => {
        const d = new Date(m.fecha).getTime();
        return d >= startDate.getTime() && d <= endDate.getTime();
      })
      timeSpan = endDate.getTime() - startDate.getTime()
    } else if (sortedMediciones.length > 0) {
      const latest = new Date(sortedMediciones[sortedMediciones.length - 1].fecha).getTime()
      filteredMediciones = sortedMediciones.filter(m => new Date(m.fecha).getTime() >= latest - 3 * 60 * 60 * 1000)
    }
    
    if (filteredMediciones.length === 0 && filteredComparisonMediciones.length === 0) return []

    // 3. Determinar Granularidad y Agrupar
    const hoursSpan = timeSpan / (1000 * 60 * 60)
    const daysSpan = hoursSpan / 24
    const pointCount = filteredMediciones.length + filteredComparisonMediciones.length
    
    // Decidir granularidad: 
    // - Si hay 1 día o menos: agrupar por 30 MINUTOS
    // - Si hay 1 a 7 días: agrupar por 3 HORAS
    // - Si hay más de 7 días: agrupar por DÍA
    let use30Minutes = false
    let use3Hours = false
    let useDays = false
    
    if (overrideGranularity) {
      useDays = overrideGranularity.useDays
    } else {
      if (daysSpan <= 1) {
        use30Minutes = true
      } else if (daysSpan <= 7) {
        use3Hours = true
      } else {
        useDays = true
      }
    }
    
    const useHours = false // No usaremos la granularidad de 1 hora completa anymore
    
    const startProcess = performance.now()

    // Obtener localizaciones de ambos nodos
    const allMediciones = [...filteredMediciones, ...filteredComparisonMediciones]
    const locsEnMediciones = Array.from(new Set(allMediciones.map(m => m.localizacionid).filter(id => id != null)))
    
    // Pre-calcular labels una sola vez para evitar búsquedas repetidas
    // En minigráficos: usar getSensorLabel (sin localización)
    // En gráfico detallado: usar getSeriesLabel (con localización)
    const labelCache = new Map<number, string>()
    const getOrCacheLabel = (m: MedicionData): string => {
      const key = m.sensorid || 0
      if (!labelCache.has(key)) {
        const label = useCustomRange 
          ? getSeriesLabel(m)  // Análisis detallado: incluir localización
          : getSensorLabelHelper(m, sensores, tipos)  // Minigráficos: solo sensor
        labelCache.set(key, label)
      }
      return labelCache.get(key)!
    }
    
    // Función auxiliar para generar timeKey consistentemente (DEBE estar antes de performGrouping)
    // Granularidad: 30 min (<= 1 día), 3 horas (1-7 días), día (> 7 días)
    const getTimeKey = (date: Date): string => {
      if (use30Minutes) {
        const minutes = Math.floor(date.getMinutes() / 30) * 30
        return `${String(date.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      }
      if (use3Hours) {
        const hours = Math.floor(date.getHours() / 3) * 3
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(hours).padStart(2, '0')}:00`
      }
      // Por defecto, agrupar por día
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
    }
    
    const performGrouping = (data: any[], isComparison: boolean = false) => {
      const grouped: { [locid: number]: any[] } = {}
      locsEnMediciones.forEach(id => { grouped[id] = [] })
      
      data.forEach(m => {
        const date = new Date(m.fecha)
        const timeKey = getTimeKey(date)
        
        let label = getOrCacheLabel(m)
        // Prefixar con "comp_" si es comparación para distinguir líneas
        if (isComparison) {
          label = `comp_${label}`
        }
        
        // CRÍTICO: Buscar NO SOLO por timeKey, sino también por LABEL (sensor)
        // Esto asegura que diferentes sensores en la misma localización no se sobrescriban
        const existing = (grouped[m.localizacionid] || []).find(p => p.time === timeKey && p.label === label)
        if (existing) {
          // Si ya existe un punto para este SENSOR específico en este TIEMPO, promediar
          existing.value = (existing.value * existing.count + m.medicion) / (existing.count + 1)
          existing.count += 1
        } else {
          // Crear nuevo punto para este SENSOR+TIEMPO
          grouped[m.localizacionid].push({ timestamp: date.getTime(), time: timeKey, value: m.medicion, count: 1, label })
        }
      })
      return grouped
    }

    let groupedData = performGrouping(filteredMediciones, false)
    let groupedComparisonData = performGrouping(filteredComparisonMediciones, true)
    
    // Fallback de resolución si hay muy pocos puntos (solo si no hay override)
    // Esta lógica se mantiene igual: si hay muy pocos datos, se recalcula con la granularidad anterior
    if (!overrideGranularity) {
      const countTotalPoints = (grouped: any) => {
        let total = 0
        locsEnMediciones.forEach(id => {
          total += (grouped[id] || []).length
        })
        return total
      }
      
      const totalPoints = countTotalPoints(groupedData) + countTotalPoints(groupedComparisonData)
      const totalMediciones = filteredMediciones.length + filteredComparisonMediciones.length
      
      // Si hay muy pocos datos agrupados pero muchas mediciones raw, cambiar granularidad
      if (totalPoints <= 2 && totalMediciones >= 3) {
        // Pasar de granularidad gruesa a más fina
        if (useDays) {
          use3Hours = true
          useDays = false
          groupedData = performGrouping(filteredMediciones, false)
          groupedComparisonData = performGrouping(filteredComparisonMediciones, true)
        } else if (use3Hours) {
          use30Minutes = true
          use3Hours = false
          groupedData = performGrouping(filteredMediciones, false)
          groupedComparisonData = performGrouping(filteredComparisonMediciones, true)
        }
      }
    }

    // 4. Formatear para Recharts - Combinar datos de ambos nodos
    // Granularidad: 30 min (<= 1 día), 3 horas (1-7 días), día (> 7 días)
    const allTimestamps = new Set<number>()
    Object.values(groupedData).forEach(list => list.forEach(p => {
      const date = new Date(p.timestamp)
      let ts: number
      if (use30Minutes) {
        const minutes = Math.floor(date.getMinutes() / 30) * 30
        ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), minutes).getTime()
      } else if (use3Hours) {
        const hours = Math.floor(date.getHours() / 3) * 3
        ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours).getTime()
      } else {
        ts = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      }
      allTimestamps.add(ts)
    }))
    Object.values(groupedComparisonData).forEach(list => list.forEach(p => {
      const date = new Date(p.timestamp)
      let ts: number
      if (use30Minutes) {
        const minutes = Math.floor(date.getMinutes() / 30) * 30
        ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), minutes).getTime()
      } else if (use3Hours) {
        const hours = Math.floor(date.getHours() / 3) * 3
        ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours).getTime()
      } else {
        ts = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      }
      allTimestamps.add(ts)
    }))

    const sortedTimes = Array.from(allTimestamps).sort((a, b) => a - b).map(ts => {
      const date = new Date(ts)
      return getTimeKey(date)
    })

    // Recolectar todas las líneas únicas (labels) que existen en los datos
    const allLabels = new Set<string>()
    Object.values(groupedData).forEach(list => list.forEach(p => allLabels.add(p.label)))
    Object.values(groupedComparisonData).forEach(list => list.forEach(p => allLabels.add(p.label)))
    const allLabelsArray = Array.from(allLabels).sort()
    
    const finalData = sortedTimes.map(time => {
      const entry: any = { time }
      // Inicializar todos los labels con undefined (Recharts lo trata como "sin dato")
      allLabelsArray.forEach(label => {
        entry[label] = undefined
      })
      
      locsEnMediciones.forEach(id => {
        // CRÍTICO: Usar .filter() en lugar de .find() para obtener TODOS los puntos
        // Esto asegura que si hay múltiples sensores en la misma localización,
        // todos se muestren en el gráfico, no solo el primero
        const points = (groupedData[id] || []).filter(p => p.time === time)
        points.forEach(point => {
          let val = point.value
          if (useCustomRange) {
            const { min, max } = yAxisDomain
            if ((min !== null && val < min) || (max !== null && val > max)) val = undefined
          }
          if (val !== undefined && val !== null) { entry[point.label] = val }
        })
        
        // Incluir datos de comparación
        const compPoints = (groupedComparisonData[id] || []).filter(p => p.time === time)
        compPoints.forEach(compPoint => {
          let val = compPoint.value
          if (useCustomRange) {
            const { min, max } = yAxisDomain
            if ((min !== null && val < min) || (max !== null && val > max)) val = undefined
          }
          if (val !== undefined && val !== null) { entry[compPoint.label] = val }
        })
      })
      return entry
    })

    const endProcess = performance.now()

    return finalData
  }

  const getMetricName = (metricaid: number): string | null => {
    const metricMap: { [key: number]: string } = {
      1: "temperatura",
      2: "humedad", 
      3: "conductividad"
    }
    return metricMap[metricaid] || null
  }

  const getStatus = (value: number, metric: MetricConfig) => {
    // Siempre mostrar como normal para simplificar
    return "normal"
  }

  // Memoizar funciones de utilidad para evitar recrearlas
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "normal": return "bg-blue-900 text-blue-300 border-blue-700"
      default: return "bg-gray-900 text-gray-300 border-gray-700"
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "normal": return "Normal"
      default: return "Sin datos"
    }
  }, [])

  // Función para abrir análisis detallado de una métrica específica
  const openDetailedAnalysis = (metric: MetricConfig) => {
    setSelectedMetricForAnalysis(metric)
    setSelectedDetailedMetric(metric.dataKey)
    
    // Si no hay métricas disponibles, seleccionar la primera disponible automáticamente
    if (availableMetrics.length > 0 && !availableMetrics.find(m => m.id === metric.id)) {
      setSelectedDetailedMetric(availableMetrics[0].dataKey)
      setSelectedMetricForAnalysis(availableMetrics[0])
    }
    
    // Limpiar nodo de comparación al abrir el modal
    setComparisonNode(null)
    setComparisonMediciones([])
    setLoadingComparisonData(false)
    
    // Obtener la última fecha disponible de los datos para esta métrica
    // Usar mapeo dinámico por nombre de métrica en lugar de ID hardcodeado
    const nodeMediciones = mediciones.filter(m => {
      const matchNode = Number(m.nodoid) === Number(selectedNode?.nodoid);
      // REMOVIDO: No filtrar por punto seleccionado
      return matchNode;
    })
    const metricMediciones = nodeMediciones.filter(m => {
      const rawMetricName = m.localizacion?.metrica?.metrica || ''
      const metricName = rawMetricName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .trim()
        .toLowerCase()
      
      if (metric.dataKey === 'temperatura' && (
        metricName.includes('temperatura') || metricName.includes('temp')
      )) return true
      
      if (metric.dataKey === 'humedad' && (
        metricName.includes('humedad') || metricName.includes('humidity')
      )) return true
      
      if (metric.dataKey === 'conductividad' && (
        metricName.includes('conductividad') || 
        metricName.includes('electroconductividad') ||
        metricName.includes('conductivity')
      )) return true
      
      return false
    })
    
    // Función helper para formatear como YYYY-MM-DD local
    const toLocalDateString = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Obtener el intervalo de un día (últimas 24 horas) solicitado por el usuario
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    
    // El gráfico de detalle debe salir con el intervalo de un día por defecto
    const startDateStr = toLocalDateString(yesterday)
    const endDateStr = toLocalDateString(today)
    
    // Limpiar estados temporales al abrir el modal
    setTempStartDate('')
    setTempEndDate('')
    
    // IMPORTANTE: Establecer fechas ANTES de abrir el modal para que el useEffect se dispare correctamente
    setDetailedStartDate(startDateStr)
    setDetailedEndDate(endDateStr)
    
    // Abrir el modal
    setTimeout(() => {
      setShowDetailedAnalysis(true)
    }, 0)
  }

  // chartData se calcula por métrica individualmente

  // Obtener métricas únicas que tienen datos en las mediciones
  const metricsWithData = useMemo(() => {
    if (!mediciones.length || !selectedNode) {
      return new Set<number>()
    }
    
    // Obtener todos los metricaid únicos de las mediciones del nodo seleccionado
    const nodeMediciones = mediciones.filter(m => Number(m.nodoid) === Number(selectedNode.nodoid))
    const uniqueMetricIds = new Set<number>(
      nodeMediciones
        .map(m => m.metricaid)
        .filter(id => id != null && id > 0)
    )
    
    // También obtener información de las métricas desde los datos expandidos
    const metricInfo = nodeMediciones
      .filter(m => m.metricaid != null && m.metricaid > 0)
      .map(m => ({
        metricaid: m.metricaid,
        metricName: m.localizacion?.metrica?.metrica || '',
        unidad: m.localizacion?.metrica?.unidad || ''
      }))
      .filter((m, index, self) => 
        index === self.findIndex(t => t.metricaid === m.metricaid)
      )
    
    return uniqueMetricIds
  }, [mediciones, selectedNode?.nodoid])

  // Mapeo de nombres de métricas a IDs (dinámico basado en datos reales)
  const getMetricIdFromName = useCallback((metricName: string): number | null => {
    if (!mediciones.length) return null
    
    // Buscar en las mediciones una que tenga el nombre de métrica coincidente
    const medicionWithMetric = mediciones.find(m => 
      m.localizacion?.metrica?.metrica?.toLowerCase().includes(metricName.toLowerCase()) ||
      m.localizacion?.metrica?.metrica === metricName
    )
    
    if (medicionWithMetric) {
      return medicionWithMetric.metricaid
    }
    
    // Fallback al mapeo hardcodeado si no se encuentra
    return getMetricIdFromDataKey(metricName)
  }, [mediciones])

  const availableMetrics = useMemo(() => {
    if (!selectedNode) {
      return []
    }
    
    // Solo usar mediciones normales (no detailedMediciones) para availableMetrics
    // detailedMediciones es para el modal de análisis, no para los minigráficos
    if (mediciones.length === 0) {
      return getTranslatedMetrics
    }
    
    // Obtener métricas únicas del nodo
    const nodeMediciones = mediciones.filter(m => Number(m.nodoid) === Number(selectedNode.nodoid))
    const uniqueMetricIds = new Set<number>()
    
    nodeMediciones.forEach(m => {
      if (m.metricaid) {
        uniqueMetricIds.add(Number(m.metricaid))
      }
    })
    
    if (uniqueMetricIds.size === 0) {
      return getTranslatedMetrics
    }

    // Filtrar las métricas traducidas para mostrar solo las que tienen datos
    const filtered = getTranslatedMetrics.filter(metric => {
      // Buscar si hay alguna medición con una métrica que coincida con el nombre
      return Array.from(uniqueMetricIds).some(metricaId => {
        const medicion = nodeMediciones.find(m => Number(m.metricaid) === Number(metricaId))
        if (!medicion) return false
        
        const rawMetricName = medicion.localizacion?.metrica?.metrica || ''
        return matchesMetricId(rawMetricName, metric.id)
      })
    })
    
    return filtered
  }, [getTranslatedMetrics, mediciones.length, selectedNode?.nodoid])

  // ========== OPTIMIZACIONES DE RENDERIZADO ==========
  
  // 1. Cachear datos de minigráficos usando hook optimizado
  // El hook detecta cambios reales en mediciones/nodo para evitar recálculos innecesarios
  const memoizedChartData = useOptimizedChartData(
    mediciones,
    selectedNode?.nodoid ?? null,
    (dataKey: string) => processChartData(dataKey, false),
    ['temperatura', 'humedad', 'conductividad']
  )

  // 2. Cachear datos del gráfico detallado - evitar recálculos múltiples
  const memoizedDetailedChartData = useMemo(() => {
    const cache: { [key: string]: any[] } = {}
    
    if (!selectedNode || !detailedMediciones.length || !selectedDetailedMetric || !tipos.length) {
      return cache
    }
    
    // Usar los mismos parámetros que se usarían en el JSX
    cache[selectedDetailedMetric] = processChartData(selectedDetailedMetric, true)
    
    return cache
  }, [detailedMediciones, selectedNode?.nodoid, selectedDetailedMetric, detailedStartDate, detailedEndDate, tipos, mediciones, filters, getSeriesLabel, comparisonNode?.nodoid, comparisonMediciones])

  // ========== FIN OPTIMIZACIONES ==========

  // ========== USO DE CACHE OPTIMIZADO EN LUGAR DE FUNCIONES REPETIDAS ==========
  // Ahora usamos las funciones con cache del hook useMetricCache en lugar de
  // hasMetricDataHelper que recalculaba cada vez. Esto reduce significativamente las iteraciones.

  return (
    <div className={`${showDetailedAnalysis && selectedMetricForAnalysis ? 'h-screen' : 'h-screen'} bg-gray-50 dark:bg-neutral-900 overflow-y-auto dashboard-scrollbar-blue`}>
      {/* Main Content - ancho completo y poco padding en vista análisis detallado */}
      <main className={`${showDetailedAnalysis && selectedMetricForAnalysis ? 'w-full max-w-none px-2 py-2 h-full flex flex-col' : 'container mx-auto px-4 py-8 h-full flex flex-col'}`}>

        {/* Error State */}
        {error && (
          <ErrorAlert 
            message={error} 
            onDismiss={() => setError(null)}
          />
        )}

        {/* View Switch: Análisis detallado fullscreen o Mapa + minigráficos */}
        {showDetailedAnalysis && selectedMetricForAnalysis ? (
          <DetailedAnalysisModal
            isOpen={true}
            isFullscreenView={true}
            selectedNode={selectedNode}
            selectedMetricForAnalysis={selectedMetricForAnalysis}
            selectedDetailedMetric={selectedDetailedMetric}
            detailedMediciones={detailedMediciones}
            comparisonNode={comparisonNode}
            comparisonMediciones={comparisonMediciones}
            mediciones={mediciones}
            availableMetrics={availableMetrics}
            availableNodes={availableNodes}
            tipos={tipos}
            sensores={sensores}
            loadingDetailedData={loadingDetailedData}
            loadingComparisonData={loadingComparisonData}
            detailedStartDate={detailedStartDate}
            detailedEndDate={detailedEndDate}
            isModalExpanded={true}
            visibleTipos={visibleTipos}
            memoizedDetailedChartData={memoizedDetailedChartData}
            umbralesDisponibles={umbralesDisponibles}
            localizacionesPorNodo={localizacionesPorNodo}
            yAxisDomain={yAxisDomain}
            onClose={() => {
              setShowDetailedAnalysis(false)
              setSelectedMetricForAnalysis(null)
              setComparisonNode(null)
              setComparisonMediciones([])
              setLoadingComparisonData(false)
              setIsModalExpanded(false)
              setYAxisDomain({ min: null, max: null })
              setVisibleTipos(new Set())
            }}
            onMetricChange={(metric) => setSelectedDetailedMetric(metric)}
            onComparisonNodeChange={(node) => setComparisonNode(node)}
            onDateRangeChange={(start, end) => {
              setDetailedStartDate(start)
              setDetailedEndDate(end)
            }}
            onYAxisDomainChange={(domain) => setYAxisDomain(domain)}
            onVisibleTiposChange={(tipos) => setVisibleTipos(tipos)}
            onToggleExpand={() => setIsModalExpanded(!isModalExpanded)}
            onAnalyzeFluctuation={analyzeFluctuationAndRecommendThresholds}
            onLoadComparisonData={loadComparisonMediciones}
            getSeriesLabel={getSeriesLabel}
          />
        ) : (
          <>
        {/* Node Selector Console */}
        <NodeSelector
          selectedEntidadId={filters.entidadId}
          selectedUbicacionId={filters.ubicacionId}
          onNodeSelect={handleNodeSelect}
          onNodeClear={handleNodeClear}
          onFiltersUpdate={handleFiltersUpdate}
          onEntidadChange={onEntidadChange}
          onUbicacionChange={onUbicacionChange}
        />

        {/* REMOVIDO: El selector de puntos físicos ya no es necesario para filtrar las métricas, 
            ya que ahora se muestran todas las líneas por sensor en cada gráfico de métrica. */}

        {/* Loading State - Mostrar después del mapa, donde van los gráficos */}
        {loading && selectedNode && (
          <LoadingState message="Cargando datos de métricas..." />
        )}

        {/* Metrics Cards - Solo mostrar cuando hay un nodo seleccionado Y no está cargando */}
        {!loading && !error && availableMetrics.length > 0 && selectedNode && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {availableMetrics.map((metric) => {
              const hasData = hasMetricDataOptimized(metric.dataKey)
              const currentValue = hasData ? getCurrentValueOptimized(metric.dataKey) : 0
              const chartData = memoizedChartData[metric.dataKey] || []
              
              return (
                <MetricMiniChart
                  key={metric.id}
                  metric={metric}
                  chartData={chartData}
                  currentValue={currentValue}
                  hasData={hasData}
                  onOpenAnalysis={openDetailedAnalysis}
                  t={t}
                />
              )
            })}
          </div>
        )}
        </>
        )}

        {/* Modal: Volver al Mapa */}
        {showReturnToMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-blue-500 font-mono uppercase">
                  ⚠️ Filtros Globales Cambiad
os
                </h2>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-mono mb-2">
                  Los filtros globales han cambiado. El nodo seleccionado ya no es válido para el nuevo filtro.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-mono">
                  Por favor, vuelve al mapa para seleccionar un nodo válido.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReturnToMapModal(false);
                    setShowDetailedAnalysis(false);
                  }}
                  className="flex-1 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded font-mono text-sm font-bold transition-colors"
                >
                  Volver al Mapa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Recomendaciones de Umbrales */}
        <ThresholdRecommendationsModal
          isOpen={showThresholdModal}
          recommendations={thresholdRecommendations}
          selectedNode={selectedNode}
          comparisonNode={comparisonNode}
          selectedDetailedMetric={selectedDetailedMetric}
          metricsConfig={getTranslatedMetrics}
          onClose={() => {
            setShowThresholdModal(false)
            setThresholdRecommendations(null)
          }}
        />

      </main>
    </div>
  )
}

