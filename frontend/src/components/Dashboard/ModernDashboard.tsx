import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { flushSync } from "react-dom"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { JoySenseService } from "../../services/backend-api"
import { NodeSelector } from "./NodeSelector"
import { useLanguage } from "../../contexts/LanguageContext"
import { useToast } from "../../contexts/ToastContext"

interface ModernDashboardProps {
  filters: {
    entidadId: number | null
    ubicacionId: number | null
    startDate: string
    endDate: string
  }
  onFiltersChange: (filters: any) => void
  // Callbacks para actualizar filtros del header
  onEntidadChange?: (entidad: any) => void
  onUbicacionChange?: (ubicacion: any) => void
}

interface MedicionData {
  medicionid: number
  metricaid: number
  nodoid: number
  fecha: string
  medicion: number
  tipoid: number
  ubicacionid: number
}

interface MetricConfig {
  id: string
  title: string
  color: string
  unit: string
  dataKey: string
  description: string
  ranges: {
    min: number
    max: number
    optimal: [number, number]
  }
}

// Configuración base de métricas (se filtrará dinámicamente)
const baseMetrics: MetricConfig[] = [
  {
    id: "temperatura",
    title: "Temperatura",
    color: "#f59e0b",
    unit: "°C",
    dataKey: "temperatura",
    description: "Temperatura del suelo/sustrato",
    ranges: { min: 15, max: 35, optimal: [20, 28] }
  },
  {
    id: "humedad",
    title: "Humedad",
    color: "#3b82f6",
    unit: "%",
    dataKey: "humedad",
    description: "Humedad relativa del suelo",
    ranges: { min: 40, max: 90, optimal: [60, 75] }
  },
  {
    id: "conductividad",
    title: "Electroconductividad",
    color: "#10b981",
    unit: "uS/cm",
    dataKey: "conductividad",
    description: "Conductividad eléctrica del sustrato",
    ranges: { min: 0.5, max: 2.5, optimal: [1.0, 1.8] }
  }
]

// Función pura: obtener metricId desde dataKey (extraída fuera del componente)
function getMetricIdFromDataKey(dataKey: string): number {
  const metricMap: { [key: string]: number } = {
    'temperatura': 1,
    'humedad': 2,
    'conductividad': 3
  }
  return metricMap[dataKey] || 1
}

export function ModernDashboard({ filters, onFiltersChange, onEntidadChange, onUbicacionChange }: ModernDashboardProps) {
  const { t } = useLanguage()
  const { showWarning, showError } = useToast()
  
  // Memoizar métricas traducidas para evitar recrearlas en cada render
  const getTranslatedMetrics = useMemo((): MetricConfig[] => [
    {
      id: "temperatura",
      title: t('dashboard.metrics.temperature'),
      color: "#f59e0b",
      unit: "°C",
      dataKey: "temperatura",
      description: "Temperatura del suelo/sustrato",
      ranges: { min: 15, max: 35, optimal: [20, 28] }
    },
    {
      id: "humedad",
      title: t('dashboard.metrics.humidity'),
      color: "#3b82f6",
      unit: "%",
      dataKey: "humedad",
      description: "Humedad relativa del suelo",
      ranges: { min: 40, max: 90, optimal: [60, 75] }
    },
    {
      id: "conductividad",
      title: t('dashboard.metrics.electroconductivity'),
      color: "#10b981",
      unit: "uS/cm",
      dataKey: "conductividad",
      description: "Conductividad eléctrica del sustrato",
      ranges: { min: 0.5, max: 2.5, optimal: [1.0, 1.8] }
    }
  ], [t])
  
  const [mediciones, setMediciones] = useState<MedicionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entidades, setEntidades] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [isModalExpanded, setIsModalExpanded] = useState(false)
  const [metricas, setMetricas] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null)
  const [selectedMetricForAnalysis, setSelectedMetricForAnalysis] = useState<MetricConfig | null>(null)
  const [selectedDetailedMetric, setSelectedDetailedMetric] = useState<string>('temperatura')
  const [detailedStartDate, setDetailedStartDate] = useState<string>('')
  const [detailedEndDate, setDetailedEndDate] = useState<string>('')
  const [tempStartDate, setTempStartDate] = useState<string>('') // Estado temporal para evitar carga automática
  const [tempEndDate, setTempEndDate] = useState<string>('') // Estado temporal para evitar carga automática
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [loadingDetailedData, setLoadingDetailedData] = useState(false)
  
  // Estados para nuevas funcionalidades del análisis detallado
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null }) // Ajuste del eje Y
  const [comparisonNode, setComparisonNode] = useState<any>(null) // Nodo para comparación
  const [comparisonMediciones, setComparisonMediciones] = useState<MedicionData[]>([]) // Mediciones del nodo de comparación
  const [loadingComparisonData, setLoadingComparisonData] = useState(false) // Loading para datos de comparación
  const [thresholdRecommendations, setThresholdRecommendations] = useState<{ [nodeId: string]: { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } } | null>(null) // Recomendaciones de umbrales por nodo
  const [showThresholdModal, setShowThresholdModal] = useState(false) // Modal para mostrar recomendaciones
  const [availableNodes, setAvailableNodes] = useState<any[]>([]) // Lista de nodos disponibles para comparación
  const [visibleTipos, setVisibleTipos] = useState<Set<string>>(new Set()) // Tipos de sensores visibles en el gráfico

  // Refs para cancelar requests y debouncing
  const loadMedicionesAbortControllerRef = useRef<AbortController | null>(null)
  const loadMedicionesTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadDetailedAnalysisAbortControllerRef = useRef<AbortController | null>(null)
  const loadDetailedAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Ref para rastrear el nodo actual de la petición en curso
  const currentRequestNodeIdRef = useRef<number | null>(null)
  const currentRequestKeyRef = useRef<string | null>(null)

  // Función para cargar mediciones (declarada antes del useEffect que la usa)
  const loadMediciones = useCallback(async (requestKey?: string, expectedNodeId?: number | null) => {
    // Si hay un nodo seleccionado, no requerir ubicacionId (podemos usar nodoid directamente)
    // Si no hay nodo seleccionado, requerir ambos filtros
    const requiresUbicacionId = !selectedNode
    const hasRequiredFilters = filters.entidadId && (requiresUbicacionId ? filters.ubicacionId : true)
    
    if (!hasRequiredFilters) {
      setMediciones([])
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
    if (thisNodeId !== null && selectedNode?.nodoid !== thisNodeId) {
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
        // ESTRATEGIA PROGRESIVA: Empezar con rango pequeño y expandir si no hay datos
        // Esto evita timeouts en el backend cuando hay muchos datos antiguos
        const now = new Date()
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) // Final del día actual
        
        const formatDate = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const seconds = String(date.getSeconds()).padStart(2, '0')
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        }
        
        // ESTRATEGIA: Intentar primero rangos pequeños (más rápidos) y luego expandir
        // Esto evita timeouts en nodos con muchos datos
        // Orden: 24 horas -> 7 días -> 14 días -> 30 días
        const ranges = [
          { days: 1, limit: 1000, label: '24 horas' },
          { days: 7, limit: 5000, label: '7 días' },
          { days: 14, limit: 10000, label: '14 días' },
          { days: 30, limit: 20000, label: '30 días' }
        ]
        let foundDataInRange = false
        
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
              foundDataInRange = true
              break
            }
          } catch (error: any) {
            // Si es timeout o error 500, continuar con el siguiente rango
            // Los errores 500 pueden ser timeouts del backend, así que intentamos rangos más pequeños
            const isTimeoutOr500 = error.message?.includes('timeout') || 
                                   error.code === '57014' || 
                                   error.message?.includes('500') ||
                                   error.message?.includes('HTTP error! status: 500')
            
            if (isTimeoutOr500) {
              // Continuar con el siguiente rango más pequeño
              // Si es 30 días y falla, ya intentamos rangos más pequeños antes
              continue
            }
            
            // Si no es timeout/500, puede ser un error de red u otro error crítico
            // Continuar de todas formas para intentar otros rangos
            continue
          }
        }
        
        // Si no encontramos datos en ningún rango, el nodo no tiene datos recientes
        // Se mostrará "NODO OBSERVADO"
        
      } else {
        // Sin nodo seleccionado, usar las últimas 6 horas
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
          limit: 5000 // Límite razonable para las últimas horas
        })
        
        // Asegurar que dataSinNodo es un array
        allData = Array.isArray(dataSinNodo) ? dataSinNodo : (dataSinNodo ? [dataSinNodo] : [])
      }

      // Verificar nuevamente si la petición sigue siendo válida después de la llamada async
      if (currentRequestKeyRef.current !== thisRequestKey) {
        return
      }
      
      if (thisNodeId !== null && selectedNode?.nodoid !== thisNodeId) {
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
      
      if (thisNodeId !== null && selectedNode?.nodoid !== thisNodeId) {
        return
      }

      // No filtrar por tiempo aquí - cada métrica hará su propio filtrado de 3 horas
      setMediciones(sortedData)
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
  }, [filters.entidadId, filters.ubicacionId, selectedNode?.nodoid])

  // Crear array de dependencias estable para evitar warnings de React
  // IMPORTANTE: Cuando hay un nodo seleccionado, NO incluir ubicacionId en las dependencias
  // para evitar doble renderizado cuando ubicacionId cambia después de seleccionar el nodo
  const useEffectDependencies = useMemo(() => {
    const deps = [
      filters.entidadId, 
      selectedNode?.nodoid, 
      loadMediciones
    ]
    // Solo incluir ubicacionId si NO hay nodo seleccionado
    // Cuando hay nodo, el nodoid es suficiente y ubicacionId puede cambiar sin afectar la carga
    if (!selectedNode && filters.ubicacionId) {
      deps.push(filters.ubicacionId)
    }
    return deps
  }, [filters.entidadId, selectedNode?.nodoid, loadMediciones, selectedNode])

  // Cargar datos de mediciones con debouncing y cancelación mejorada
  useEffect(() => {
    // Si hay un nodo seleccionado, no requerir ubicacionId (lo obtenemos del nodo)
    // Si no hay nodo seleccionado, requerir ambos filtros
    const requiresUbicacionId = !selectedNode
    const hasRequiredFilters = filters.entidadId && (requiresUbicacionId ? filters.ubicacionId : true)
    
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
    if (previousNodeId !== null && previousNodeId !== currentNodeId) {
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
    if (previousNodeId !== currentNodeId) {
      currentRequestKeyRef.current = null // Invalidar temporalmente
    }
    
    // Debounce reducido cuando hay un nodo seleccionado (más rápido)
    const debounceTime = selectedNode ? 300 : 500
    
    // Debounce: esperar antes de cargar
    loadMedicionesTimeoutRef.current = setTimeout(() => {
      // Verificar que el nodo no haya cambiado durante el debounce
      if (expectedNodeId !== (selectedNode?.nodoid || null)) {
        return
      }
      
      // Verificar nuevamente que los filtros requeridos estén disponibles
      const stillRequiresUbicacionId = !selectedNode
      const stillHasRequiredFilters = filters.entidadId && (stillRequiresUbicacionId ? filters.ubicacionId : true)
      
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
      if (currentRequestKeyRef.current === requestKey && currentRequestNodeIdRef.current !== cleanupNodeId) {
        currentRequestKeyRef.current = null
        currentRequestNodeIdRef.current = null
      }
    }
    // IMPORTANTE: Usar array de dependencias estable creado con useMemo
  }, useEffectDependencies)

  // Función para cargar mediciones para el análisis detallado con rango de fechas específico
  const loadMedicionesForDetailedAnalysis = useCallback(async (startDateStr: string, endDateStr: string, signal?: AbortSignal) => {
    // Cuando hay un nodo seleccionado, no requerir ubicacionId (el nodoid es suficiente)
    // El backend puede filtrar directamente por nodoid sin necesidad de ubicacionId
    if (!filters.entidadId || !selectedNode) {
      setLoadingDetailedData(false)
      return
    }

    // Si el request fue cancelado, no continuar
    if (signal?.aborted) {
      setLoadingDetailedData(false)
      return
    }

    setLoadingDetailedData(true)
    
    try {
      const formatDate = (dateStr: string, isEnd: boolean = false) => {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        if (isEnd) {
          return `${year}-${month}-${day} 23:59:59`
        }
        return `${year}-${month}-${day} 00:00:00`
      }

      const startDateFormatted = formatDate(startDateStr, false)
      const endDateFormatted = formatDate(endDateStr, true)

      const startDate = new Date(startDateStr + 'T00:00:00')
      const endDate = new Date(endDateStr + 'T23:59:59')
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      
      // ESTRATEGIA DESHABILITADA: No usar estrategia sin filtro de fecha para evitar timeouts
      // Los nodos con muchos datos requieren filtros de fecha obligatorios
      // Si el usuario necesita ver datos antiguos, debe usar el análisis detallado con un rango específico
      const USE_STRATEGY_WITHOUT_DATE_FILTER = false // DESHABILITADO: Siempre requerir filtros de fecha
      
      let filteredData: any[] = []
      
      if (USE_STRATEGY_WITHOUT_DATE_FILTER) {
        // ESTRATEGIA 1: Para rangos grandes, buscar últimas mediciones sin filtro de fecha
        // Esto es mucho más rápido porque el backend solo necesita ordenar por fecha descendente
        // Para nodos con muchos datos, usar límites MUY conservadores
        // Empezar con 5000 y aumentar progresivamente solo si es necesario
        const initialLimit = 5000 // Límite inicial muy conservador
        const fallbackLimits = [3000, 2000, 1000, 500] // Límites de fallback progresivos
        
        let success = false
        
        // Intentar primero con el límite inicial
        try {
          const response = await JoySenseService.getMediciones({
            entidadId: filters.entidadId,
            nodoid: selectedNode.nodoid,
            limit: initialLimit
            // NO pasar startDate ni endDate - esto hace que el backend solo ordene por fecha descendente
          })
          
          filteredData = Array.isArray(response) ? response : []
          success = true
        } catch (error: any) {
          // Si el error indica que se requiere filtro de fecha, no intentar más
          if (error.code === 'TIMEOUT' || error.message?.includes('filtros de fecha') || error.message?.includes('demasiados datos')) {
            filteredData = []
            success = false
            // Mostrar mensaje al usuario (se manejará en el código que verifica filteredData.length === 0)
            return // Salir temprano, no intentar más
          }
          
          // Si falla por otro motivo, intentar con límites progresivamente más pequeños
          for (const fallbackLimit of fallbackLimits) {
            if (signal?.aborted) {
              setLoadingDetailedData(false)
              return
            }
            
            try {
              const response2 = await JoySenseService.getMediciones({
                entidadId: filters.entidadId,
                nodoid: selectedNode.nodoid,
                limit: fallbackLimit
              })
              
              filteredData = Array.isArray(response2) ? response2 : []
              
              if (filteredData.length > 0) {
                success = true
                break
              }
            } catch (e2: any) {
              // Si el error indica que se requiere filtro de fecha, no continuar
              if (e2.code === 'TIMEOUT' || e2.message?.includes('filtros de fecha') || e2.message?.includes('demasiados datos')) {
                filteredData = []
                success = false
                break
              }
              continue
            }
          }
          
          if (!success) {
            filteredData = []
          }
        }
        
        // Si obtuvimos datos, filtrar por rango de fechas en el frontend
        if (success && filteredData.length > 0) {
          const startTimestamp = startDate.getTime()
          const endTimestamp = endDate.getTime()
          
          filteredData = filteredData.filter(m => {
            const medicionDate = new Date(m.fecha).getTime()
            return medicionDate >= startTimestamp && medicionDate <= endTimestamp
          })
        }
      } else {
        // ESTRATEGIA 2: Para rangos pequeños, usar filtro de fecha normal
        let maxLimit = 10000 // Límite conservador para evitar timeouts
        
        if (daysDiff > 14) {
          maxLimit = 15000
        } else if (daysDiff > 7) {
          maxLimit = 12000
        }
        
        try {
          const response = await JoySenseService.getMediciones({
            entidadId: filters.entidadId,
            nodoid: selectedNode.nodoid,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            limit: maxLimit
          })
          
          filteredData = Array.isArray(response) ? response : []
        } catch (error: any) {
          // Si hay un error (como timeout 500), NO intentar estrategia sin filtro de fecha
          if (error.message?.includes('500') || error.message?.includes('timeout') || error.message?.includes('57014')) {
            filteredData = []
            // No intentar estrategia sin filtro de fecha - esto causaría más timeouts
          } else {
            throw error // Re-lanzar el error para que se maneje en el catch principal
          }
        }
      }

      // Verificar que filteredData sea un array
      if (!Array.isArray(filteredData)) {
        setLoadingDetailedData(false)
        return
      }
      
      // Si no hay datos, también detener el loading
      if (filteredData.length === 0) {
        setLoadingDetailedData(false)
        return
      }

      // El backend devuelve datos ordenados descendente (más recientes primero)
      // Necesitamos ordenarlos ascendente para el procesamiento correcto
      const sortedFilteredData = filteredData
        .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a, b) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }) => m)
      
      // Actualizar mediciones con los nuevos datos
      // IMPORTANTE: Para el análisis detallado, reemplazar completamente las mediciones del rango
      // Esto asegura que siempre tengamos los datos correctos para el intervalo seleccionado
      setMediciones(prevMediciones => {
        // Filtrar mediciones existentes que no estén en el rango de fechas del modal
        const medicionesFueraDelRango = prevMediciones.filter(m => {
          const medicionDate = new Date(m.fecha)
          const startDate = new Date(startDateStr + 'T00:00:00')
          const endDate = new Date(endDateStr + 'T23:59:59')
          return medicionDate < startDate || medicionDate > endDate
        })
        
        // Combinar mediciones fuera del rango con las nuevas mediciones del rango (ya ordenadas)
        const combinedMediciones = [...medicionesFueraDelRango, ...sortedFilteredData]
        
        // Eliminar duplicados basándose en medicionid
        const uniqueMediciones = combinedMediciones.filter((medicion, index, self) =>
          index === self.findIndex(m => m.medicionid === medicion.medicionid)
        )
        
        return uniqueMediciones
      })
    } catch (err: any) {
      // Ignorar errores de cancelación
      if (err.name === 'AbortError' || signal?.aborted) {
        setLoadingDetailedData(false)
        return
      }
      console.error('Error cargando datos para análisis detallado:', err)
      // Siempre detener el loading en caso de error
      setLoadingDetailedData(false)
    } finally {
      // SIEMPRE actualizar loading a false, incluso si fue cancelado
      // Esto asegura que el modal no quede en estado de carga infinito
      setLoadingDetailedData(false)
    }
  }, [filters.entidadId, selectedNode])

  // Cargar nodos disponibles cuando se abre el modal de análisis detallado
  useEffect(() => {
    if (showDetailedAnalysis && selectedNode) {
      const loadAvailableNodes = async () => {
        try {
          const nodes = await JoySenseService.getNodosConLocalizacion()
          // Filtrar nodos para que solo muestre los de la misma entidad que el nodo seleccionado
          const filteredNodes = (nodes || []).filter((node: any) => {
            // Excluir el nodo actual
            if (node.nodoid === selectedNode.nodoid) {
              return false
            }
            // Solo incluir nodos de la misma entidad
            if (selectedNode.entidad?.entidadid && node.entidad?.entidadid) {
              return node.entidad.entidadid === selectedNode.entidad.entidadid
            }
            return false
          })
          setAvailableNodes(filteredNodes)
    } catch (err) {
          console.error('Error cargando nodos disponibles:', err)
        }
      }
      loadAvailableNodes()
    } else {
      setAvailableNodes([])
    }
  }, [showDetailedAnalysis, selectedNode?.nodoid, selectedNode?.entidad?.entidadid])

  // Función para cargar mediciones del nodo de comparación
  const loadComparisonMediciones = useCallback(async (comparisonNode: any) => {
    if (!comparisonNode || !detailedStartDate || !detailedEndDate) {
      console.warn('⚠️ loadComparisonMediciones: Faltan datos requeridos', { comparisonNode, detailedStartDate, detailedEndDate })
      return
    }

    // Si hay nodoid, usarlo directamente (más eficiente y directo)
    // Similar a cómo se hace para el nodo principal
    if (!comparisonNode.nodoid) {
      console.warn('⚠️ loadComparisonMediciones: El nodo de comparación no tiene nodoid')
      return
    }

    setLoadingComparisonData(true)
    try {
      const formatDate = (dateStr: string, isEnd: boolean = false) => {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        if (isEnd) {
          return `${year}-${month}-${day} 23:59:59`
        }
        return `${year}-${month}-${day} 00:00:00`
      }

      const startDateFormatted = formatDate(detailedStartDate, false)
      const endDateFormatted = formatDate(detailedEndDate, true)

      const startDate = new Date(detailedStartDate + 'T00:00:00')
      const endDate = new Date(detailedEndDate + 'T23:59:59')
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      
      // OPTIMIZACIÓN: Usar límites más pequeños para comparación (no necesita tanta precisión)
      // Para comparación, podemos usar menos datos y más agregación
      let maxLimit = 10000
      let useGetAll = false
      
      if (daysDiff > 60) {
        // Para rangos grandes, usar getAll pero con límite más pequeño
        maxLimit = 15000
        useGetAll = true
      } else if (daysDiff > 30) {
        maxLimit = 12000
      } else if (daysDiff > 14) {
        maxLimit = 10000
      } else if (daysDiff > 7) {
        maxLimit = 8000
      } else {
        maxLimit = 5000
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
      
      setComparisonMediciones(sortedComparisonData)
    } catch (err: any) {
      console.error('❌ Error cargando datos de comparación:', err)
    } finally {
      setLoadingComparisonData(false)
    }
  }, [detailedStartDate, detailedEndDate])

  // Función para analizar fluctuación y recomendar umbrales
  const analyzeFluctuationAndRecommendThresholds = useCallback(() => {
    if (!mediciones.length || !tipos.length || !detailedStartDate || !detailedEndDate) {
      return
    }

    const startDate = new Date(detailedStartDate + 'T00:00:00')
    const endDate = new Date(detailedEndDate + 'T23:59:59')
    const metricId = getMetricIdFromDataKey(selectedDetailedMetric)
    
    // Función auxiliar para calcular recomendaciones de un conjunto de mediciones
    const calculateRecommendations = (medicionesData: any[]): { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } => {
      const filteredMediciones = medicionesData.filter(m => {
        const medicionDate = new Date(m.fecha)
        return medicionDate >= startDate && medicionDate <= endDate && m.metricaid === metricId
      })

      if (filteredMediciones.length === 0) {
        return {}
      }

      // Agrupar por tipo de sensor
      const medicionesPorTipo: { [tipoid: number]: number[] } = {}
      
      filteredMediciones.forEach(m => {
        if (!medicionesPorTipo[m.tipoid]) {
          medicionesPorTipo[m.tipoid] = []
        }
        if (m.medicion != null && !isNaN(m.medicion)) {
          medicionesPorTipo[m.tipoid].push(m.medicion)
        }
      })

      // Calcular estadísticas y recomendar umbrales para cada tipo
      const recommendations: { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } = {}
      
      Object.keys(medicionesPorTipo).forEach(tipoidStr => {
        const tipoid = parseInt(tipoidStr)
        const valores = medicionesPorTipo[tipoid]
        
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
        
        recommendations[tipoid] = {
          min: Math.round(recommendedMin * 100) / 100,
          max: Math.round(recommendedMax * 100) / 100,
          avg: Math.round(avg * 100) / 100,
          stdDev: Math.round(stdDev * 100) / 100
        }
      })

      return recommendations
    }

    // Calcular recomendaciones para el nodo principal
    const mainNodeRecommendations = calculateRecommendations(mediciones)
    
    if (Object.keys(mainNodeRecommendations).length === 0) {
      showWarning(
        'Datos insuficientes',
        'No hay datos suficientes para analizar la fluctuación del nodo principal'
      )
      return
    }

    const allRecommendations: { [nodeId: string]: { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } } = {
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
  }, [mediciones, comparisonMediciones, tipos, detailedStartDate, detailedEndDate, selectedDetailedMetric, selectedNode, comparisonNode, showWarning])


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

  // Resetear ajuste del eje Y cuando cambia el nodo seleccionado
  useEffect(() => {
    setYAxisDomain({ min: null, max: null })
  }, [selectedNode?.nodoid])

  // Inicializar tipos visibles cuando se abre el modal o cambia la métrica/nodo
  useEffect(() => {
    if (!showDetailedAnalysis || !selectedDetailedMetric) {
      setVisibleTipos(new Set())
      return
    }
    
    // Obtener tipos disponibles de las mediciones
    const metricId = getMetricIdFromDataKey(selectedDetailedMetric)
    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
    const tiposDisponibles = new Set<string>()
    
    metricMediciones.forEach(m => {
      const tipo = tipos.find(t => t.tipoid === m.tipoid)
      if (tipo) {
        tiposDisponibles.add(tipo.tipo)
      }
    })
    
    // Si hay nodo de comparación, agregar también sus tipos
    if (comparisonNode && comparisonMediciones.length > 0) {
      const comparisonMetricMediciones = comparisonMediciones.filter(m => m.metricaid === metricId)
      comparisonMetricMediciones.forEach(m => {
        const tipo = tipos.find(t => t.tipoid === m.tipoid)
        if (tipo) {
          tiposDisponibles.add(tipo.tipo)
        }
      })
    }
    
    // Si visibleTipos está vacío o no contiene todos los tipos actuales, inicializar
    if (visibleTipos.size === 0 || !Array.from(tiposDisponibles).every(tipo => visibleTipos.has(tipo))) {
      setVisibleTipos(new Set(tiposDisponibles))
    }
  }, [showDetailedAnalysis, selectedDetailedMetric, selectedNode?.nodoid, comparisonNode?.nodoid, mediciones, comparisonMediciones, tipos])

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

  // Cargar entidades, ubicaciones, métricas y tipos
  useEffect(() => {
    loadEntidades()
    loadUbicaciones()
    loadMetricas()
    loadTipos()
  }, [])

  const loadEntidades = async () => {
    try {
      const data = await JoySenseService.getEntidades()
      setEntidades(data)
    } catch (err) {
      console.error("Error loading entidades:", err)
    }
  }

  const loadUbicaciones = async () => {
    try {
      const data = await JoySenseService.getUbicaciones()
      setUbicaciones(data)
    } catch (err) {
      console.error("Error loading ubicaciones:", err)
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
      console.error("Error loading metricas:", err)
    }
  }

  const loadTipos = async () => {
    try {
      const data = await JoySenseService.getTipos()
      setTipos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading tipos:", err)
    }
  }

  // Procesar datos para gráficos - específico por métrica y tipo de sensor
  const processChartData = (dataKey: string, useCustomRange: boolean = false) => {
    if (!mediciones.length || !tipos.length) {
      return []
    }

    // Filtrar mediciones para esta métrica específica
    const metricId = getMetricIdFromDataKey(dataKey)
    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
    
    if (!metricMediciones.length) {
      return []
    }

    // Ordenar por fecha (ascendente: más antiguas primero)
    // Esto asegura que los datos más recientes estén al final
    const sortedMediciones = metricMediciones
      .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
      .sort((a, b) => a.fechaParsed - b.fechaParsed)
      .map(({ fechaParsed, ...m }) => m)
    
    let filteredMediciones = sortedMediciones
    let isDateRange = false
    let timeSpan = 3 * 60 * 60 * 1000 // 3 horas por defecto

    if (useCustomRange && detailedStartDate && detailedEndDate) {
      // Usar rango personalizado de fechas del modal de detalle
      const startDate = new Date(detailedStartDate + 'T00:00:00')
      const endDate = new Date(detailedEndDate + 'T23:59:59')
      
      filteredMediciones = sortedMediciones.filter(m => {
        const medicionDate = new Date(m.fecha)
        return medicionDate >= startDate && medicionDate <= endDate
      })
      
      // Determinar si es un rango de días (más de 1 día)
      timeSpan = endDate.getTime() - startDate.getTime()
      const daysDiff = timeSpan / (1000 * 3600 * 24)
      isDateRange = daysDiff > 1
      
    } else {
      // Usar lógica de 3 horas (comportamiento por defecto)
      // IMPORTANTE: Usar la fecha más reciente disponible en los datos, no la fecha actual
      // Esto asegura que siempre mostremos los datos más recientes disponibles
      const latestDate = new Date(sortedMediciones[sortedMediciones.length - 1].fecha)
      const now = new Date()
      const threeHoursAgo = new Date(latestDate.getTime() - 3 * 60 * 60 * 1000)
      
      // NUEVA ESTRATEGIA: Detectar el último segmento continuo de datos
      // Esto evita incluir datos antiguos con gaps grandes
      const findLastContinuousSegment = (mediciones: any[], maxGapHours: number = 2): any[] => {
        if (mediciones.length === 0) return []
        
        // Ordenar por fecha ascendente (más antiguas primero)
        const sorted = [...mediciones].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        
        // Empezar desde la medición más reciente
        const result: any[] = []
        const maxGapMs = maxGapHours * 60 * 60 * 1000
        
        // Agregar la medición más reciente
        result.push(sorted[sorted.length - 1])
        
        // Ir hacia atrás, agregando mediciones consecutivas
        for (let i = sorted.length - 2; i >= 0; i--) {
          const currentDate = new Date(sorted[i].fecha).getTime()
          const nextDate = new Date(result[0].fecha).getTime()
          const gap = nextDate - currentDate
          
          // Si el gap es menor al máximo permitido, es parte del segmento continuo
          if (gap <= maxGapMs) {
            result.unshift(sorted[i]) // Agregar al inicio para mantener orden cronológico
          } else {
            // Gap grande detectado - este es el límite del segmento continuo
            break
          }
        }
        
        return result
      }
      
      // Detectar el último segmento continuo (sin gaps mayores a 2 horas)
      let continuousSegment = findLastContinuousSegment(sortedMediciones, 2)
      
      // Usar el segmento continuo como base
      filteredMediciones = continuousSegment
      
      // Si el segmento continuo tiene menos de 10 mediciones, expandir hacia atrás
      // pero sin cruzar gaps grandes (máximo 4 horas de gap)
      if (filteredMediciones.length < 10 && sortedMediciones.length > filteredMediciones.length) {
        // Expandir hacia atrás permitiendo gaps de hasta 4 horas
        const expandedSegment = findLastContinuousSegment(sortedMediciones, 4)
        
        if (expandedSegment.length > filteredMediciones.length) {
          filteredMediciones = expandedSegment
        }
      }
      
      // Si aún hay muy pocos datos (menos de 5), expandir más agresivamente
      // Permitir gaps de hasta 12 horas para capturar más mediciones
      if (filteredMediciones.length < 5 && sortedMediciones.length > filteredMediciones.length) {
        const expandedSegment12h = findLastContinuousSegment(sortedMediciones, 12)
        
        if (expandedSegment12h.length > filteredMediciones.length) {
          filteredMediciones = expandedSegment12h
        }
      }
      
      // Si aún hay muy pocos datos (menos de 3), expandir aún más (24 horas de gap)
      if (filteredMediciones.length < 3 && sortedMediciones.length > filteredMediciones.length) {
        const expandedSegment24h = findLastContinuousSegment(sortedMediciones, 24)
        
        if (expandedSegment24h.length > filteredMediciones.length) {
          filteredMediciones = expandedSegment24h
        }
      }
      
      // Si aún hay muy pocos datos (menos de 2), usar las últimas mediciones disponibles
      // sin importar gaps, para asegurar que siempre mostremos algo
      if (filteredMediciones.length < 2 && sortedMediciones.length > 0) {
        // Usar las últimas 100 mediciones como fallback final
        const last100 = sortedMediciones.slice(-100)
        filteredMediciones = last100
        
        // Si aún no hay suficientes, usar todas las mediciones disponibles
        if (filteredMediciones.length < 2 && sortedMediciones.length > 0) {
          filteredMediciones = sortedMediciones
        }
      }
    }
    
    // Determinar granularidad de agrupación basada en cantidad de datos y rango
    const totalMediciones = filteredMediciones.length
    const hoursSpan = timeSpan / (1000 * 60 * 60)
    const daysSpan = hoursSpan / 24
    
    // Para el gráfico detallado, hacer muestreo inteligente si hay demasiados datos
    // El agrupamiento por tiempo reduce los puntos, pero si hay > 30k puntos, muestrear primero
    let medicionesParaProcesar = filteredMediciones
    if (useCustomRange && totalMediciones > 30000) {
      // Muestreo inteligente: mantener distribución temporal uniforme
      // Calcular puntos necesarios: ~4 puntos por hora × número de horas
      const estimatedHours = Math.ceil(hoursSpan)
      const minPointsNeeded = estimatedHours * 4 // Al menos 4 puntos por hora (cada 15 min)
      const maxPoints = Math.min(Math.max(minPointsNeeded, 15000), 25000) // Entre 15k-25k puntos
      const step = Math.ceil(totalMediciones / maxPoints)
      medicionesParaProcesar = filteredMediciones.filter((_, index) => index % step === 0)
    }
    
    // Agrupar por tipo de sensor y luego por tiempo (usar datos muestreados)
    const tiposEnMediciones = Array.from(new Set(medicionesParaProcesar.map(m => m.tipoid)))
    const datosPorTipo: { [tipoid: number]: any[] } = {}
    
    // Inicializar datos para cada tipo
    tiposEnMediciones.forEach(tipoid => {
      datosPorTipo[tipoid] = []
    })
    
    // Decidir granularidad: si hay pocos datos o rango pequeño, usar minutos; si hay muchos datos, usar horas/días
    // Para sensores LoRaWAN que emiten cada 15 minutos, necesitamos más granularidad
    // Para el gráfico detallado, usar granularidad más fina para mantener curvas suaves
    // Solo agrupar por días si el rango es muy grande (> 7 días)
    const useMinutes = !isDateRange && (medicionesParaProcesar.length < 500 || hoursSpan < 48)
    const useHours = !isDateRange && !useMinutes && hoursSpan < 168 // 7 días
    const useDays = isDateRange && daysSpan > 7 // Solo días si es rango personalizado y > 7 días
    
    // Agrupar mediciones por tipo y tiempo (usar datos muestreados si aplica)
    medicionesParaProcesar.forEach(medicion => {
      const date = new Date(medicion.fecha)
      let timeKey: string
      
      if (useDays) {
        // Agrupar por fecha (DD/MM) para rangos de días
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        timeKey = `${day}/${month}`
      } else if (useHours) {
        // Agrupar por hora (HH:00) para rangos de horas
        const hour = String(date.getHours()).padStart(2, '0')
        timeKey = `${hour}:00`
      } else {
        // Agrupar por 15 minutos (HH:MM) para rangos pequeños o pocos datos
        // Redondear a múltiplos de 15 minutos para agrupar mediciones cercanas
        const minutes = date.getMinutes()
        const roundedMinutes = Math.floor(minutes / 15) * 15
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(roundedMinutes).padStart(2, '0')
        timeKey = `${hour}:${minute}`
      }
      
      // Buscar si ya existe un punto para este tipo y tiempo
      const existingPoint = datosPorTipo[medicion.tipoid].find(p => p.time === timeKey)
      
      if (existingPoint) {
        // Promediar con el valor existente
        const currentValue = existingPoint.value
        const currentCount = existingPoint.count
        const newValue = (currentValue * currentCount + medicion.medicion) / (currentCount + 1)
        existingPoint.value = newValue
        existingPoint.count = currentCount + 1
        // Actualizar timestamp si esta medición es más reciente
        if (date.getTime() > existingPoint.timestamp) {
          existingPoint.timestamp = date.getTime()
        }
      } else {
        // Crear nuevo punto
        datosPorTipo[medicion.tipoid].push({
          timestamp: date.getTime(),
          time: timeKey,
          value: medicion.medicion,
          count: 1,
          tipoid: medicion.tipoid,
          tipo: tipos.find(t => t.tipoid === medicion.tipoid)?.tipo || `Tipo ${medicion.tipoid}`
        })
      }
    })
    
    // Ordenar los datos de cada tipo por timestamp antes de crear la estructura final
    tiposEnMediciones.forEach(tipoid => {
      if (datosPorTipo[tipoid]) {
        datosPorTipo[tipoid].sort((a, b) => a.timestamp - b.timestamp)
        // Verificar si hay gaps significativos en los datos
        if (datosPorTipo[tipoid].length > 1) {
          for (let i = 1; i < datosPorTipo[tipoid].length; i++) {
            const prevTime = datosPorTipo[tipoid][i - 1].timestamp
            const currTime = datosPorTipo[tipoid][i].timestamp
            const timeDiff = currTime - prevTime
            // Si hay un gap mayor a 6 horas, es significativo
            // Comentado para evitar spam en consola - solo activar si es necesario para debugging
            // if (timeDiff > 6 * 60 * 60 * 1000) {
            //   console.warn(`⚠️ Gap significativo detectado en tipo ${tipoid}: ${Math.round(timeDiff / (60 * 60 * 1000))} horas`)
            //   break
            // }
          }
        }
      }
    })
    
    // Verificar si después de agrupar tenemos muy pocos puntos por tipo
    // Si hay muy pocos puntos, intentar usar granularidad más fina o mostrar todos los datos disponibles
    if (!useCustomRange && filteredMediciones.length > 0) {
      const tiposConPocosPuntos = tiposEnMediciones.filter(tipoid => 
        datosPorTipo[tipoid] && datosPorTipo[tipoid].length <= 2
      )
      
      if (tiposConPocosPuntos.length === tiposEnMediciones.length && tiposEnMediciones.length > 0) {
        // Todos los tipos tienen 2 o menos puntos después de agrupar
        // Esto puede deberse a que hay muy pocos datos o a que la agrupación es demasiado agresiva
        // Intentar usar granularidad más fina (minutos en lugar de horas) si hay datos suficientes
        if (filteredMediciones.length >= 3 && !useMinutes) {
          // Re-agrupar con granularidad de minutos para capturar más puntos
          const datosPorTipoMinutos: { [tipoid: number]: any[] } = {}
          tiposEnMediciones.forEach(tipoid => {
            datosPorTipoMinutos[tipoid] = []
          })
          
          filteredMediciones.forEach(medicion => {
            const date = new Date(medicion.fecha)
            const minutes = date.getMinutes()
            const roundedMinutes = Math.floor(minutes / 15) * 15
            const hour = String(date.getHours()).padStart(2, '0')
            const minute = String(roundedMinutes).padStart(2, '0')
            const timeKey = `${hour}:${minute}`
            
            if (!datosPorTipoMinutos[medicion.tipoid]) {
              datosPorTipoMinutos[medicion.tipoid] = []
            }
            
            const existingPoint = datosPorTipoMinutos[medicion.tipoid].find(p => p.time === timeKey)
            
            if (existingPoint) {
              const currentValue = existingPoint.value
              const currentCount = existingPoint.count
              const newValue = (currentValue * currentCount + medicion.medicion) / (currentCount + 1)
              existingPoint.value = newValue
              existingPoint.count = currentCount + 1
              if (date.getTime() > existingPoint.timestamp) {
                existingPoint.timestamp = date.getTime()
              }
            } else {
              datosPorTipoMinutos[medicion.tipoid].push({
                timestamp: date.getTime(),
                time: timeKey,
                value: medicion.medicion,
                count: 1,
                tipoid: medicion.tipoid,
                tipo: tipos.find(t => t.tipoid === medicion.tipoid)?.tipo || `Tipo ${medicion.tipoid}`
              })
            }
          })
          
          // Verificar si con granularidad de minutos tenemos más puntos
          const tiposConMasPuntos = tiposEnMediciones.filter(tipoid => 
            datosPorTipoMinutos[tipoid] && datosPorTipoMinutos[tipoid].length > 2
          )
          
          if (tiposConMasPuntos.length > 0) {
            // Usar los datos con granularidad de minutos
            tiposEnMediciones.forEach(tipoid => {
              if (datosPorTipoMinutos[tipoid]) {
                datosPorTipoMinutos[tipoid].sort((a, b) => a.timestamp - b.timestamp)
                datosPorTipo[tipoid] = datosPorTipoMinutos[tipoid]
              }
            })
          } else {
            // Aún hay muy pocos puntos - el nodo realmente tiene datos escasos
            // Pero aún así mostrar los datos disponibles
            console.warn(`⚠️ Todos los tipos tienen 2 o menos puntos después de agrupar. Mostrando datos disponibles (${filteredMediciones.length} mediciones).`)
          }
        } else {
          // Ya estamos usando granularidad fina o no hay suficientes datos
          // Mostrar los datos disponibles de todas formas
          console.warn(`⚠️ Todos los tipos tienen 2 o menos puntos después de agrupar. Mostrando datos disponibles (${filteredMediciones.length} mediciones).`)
        }
      }
    }
    
    // Obtener todos los tiempos únicos ordenados por timestamp
    const allTimeStamps = new Set<number>()
    tiposEnMediciones.forEach(tipoid => {
      datosPorTipo[tipoid].forEach(point => {
        // Obtener el timestamp del inicio del período según la granularidad
        const date = new Date(point.timestamp)
        let periodStart: Date
        if (useDays) {
          // Inicio del día
          periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        } else if (useHours) {
          // Inicio de la hora
          periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours())
        } else {
          // Inicio del período de 15 minutos
          const minutes = date.getMinutes()
          const roundedMinutes = Math.floor(minutes / 15) * 15
          periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), roundedMinutes)
        }
        allTimeStamps.add(periodStart.getTime())
      })
    })
    
    // Convertir timestamps a timeKeys y ordenar
    const allTimes = Array.from(allTimeStamps)
      .sort((a, b) => a - b)
      .map(timestamp => {
        const date = new Date(timestamp)
        if (useDays) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        return `${day}/${month}`
        } else if (useHours) {
          const hour = String(date.getHours()).padStart(2, '0')
          return `${hour}:00`
      } else {
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        return `${hour}:${minute}`
      }
    })
    
    // Crear estructura de datos con todas las líneas
    const result: any[] = []
    
    // Para suavizar líneas incompletas, encontrar el primer valor no-null para cada tipo
    const firstValueByType: { [tipoName: string]: number | null } = {}
    tiposEnMediciones.forEach(tipoid => {
      const tipo = tipos.find(t => t.tipoid === tipoid)
      const tipoName = tipo?.tipo || `Tipo ${tipoid}`
      const firstDataPoint = datosPorTipo[tipoid]?.find(p => p.value !== null && p.value !== undefined)
      firstValueByType[tipoName] = firstDataPoint ? firstDataPoint.value : null
    })
    
    allTimes.forEach(time => {
      const timeData: any = { time }
      let hasAnyValue = false
      
      tiposEnMediciones.forEach(tipoid => {
        // Buscar el punto más cercano para este tiempo y tipo
        // Si no hay punto exacto, buscar el más cercano dentro de un rango razonable
        const tipoData = datosPorTipo[tipoid].find(p => p.time === time)
        const tipo = tipos.find(t => t.tipoid === tipoid)
        const tipoName = tipo?.tipo || `Tipo ${tipoid}`
        
        // Usar el nombre del tipo como key para la línea
        let value = tipoData ? tipoData.value : null
        
        // Si no hay valor y estamos al inicio del gráfico (primeros tiempos),
        // usar el primer valor disponible del tipo para suavizar la línea
        // Solo aplicar esto si no estamos en modo detallado (useCustomRange)
        if (value === null && !useCustomRange && firstValueByType[tipoName] !== null) {
          // Verificar si este tiempo está antes del primer punto de datos de este tipo
          const firstPoint = datosPorTipo[tipoid]?.[0]
          if (firstPoint) {
            const currentTimeIndex = allTimes.indexOf(time)
            const firstTimeIndex = allTimes.indexOf(firstPoint.time)
            // Si estamos antes del primer punto (o muy cerca, hasta 2 posiciones antes),
            // usar el primer valor para suavizar la línea
            if (currentTimeIndex >= 0 && firstTimeIndex >= 0 && currentTimeIndex < firstTimeIndex + 2) {
              value = firstValueByType[tipoName]
            }
          }
        }
        
        // Filtrar valores fuera del rango del eje Y si está configurado
        if (value !== null && value !== undefined && useCustomRange) {
          const hasMinLimit = yAxisDomain.min !== null && !isNaN(yAxisDomain.min)
          const hasMaxLimit = yAxisDomain.max !== null && !isNaN(yAxisDomain.max)
          
          if (hasMinLimit && value < yAxisDomain.min!) {
            value = null // Ocultar valor si está por debajo del mínimo
          }
          if (hasMaxLimit && value > yAxisDomain.max!) {
            value = null // Ocultar valor si está por encima del máximo
          }
        }
        
        timeData[tipoName] = value
        
        // Verificar si hay al menos un valor no-null
        if (value !== null && value !== undefined) {
          hasAnyValue = true
        }
      })
      
      // Solo incluir tiempos que tengan al menos un valor no-null
      // Esto evita líneas incompletas al inicio del gráfico
      if (hasAnyValue) {
      result.push(timeData)
      }
    })
    
    return result
  }

  const getMetricName = (metricaid: number): string | null => {
    const metricMap: { [key: number]: string } = {
      1: "temperatura",
      2: "humedad", 
      3: "conductividad"
    }
    return metricMap[metricaid] || null
  }

  const getCurrentValue = (dataKey: string) => {
    if (!mediciones.length) return 0
    
    // Filtrar mediciones para esta métrica específica
    const metricId = getMetricIdFromDataKey(dataKey)
    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
    
    if (!metricMediciones.length) {
      return 0
    }
    
    // Obtener la medición más reciente
    const latest = metricMediciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    const value = latest ? latest.medicion || 0 : 0
    return value
  }

  const getStatus = (value: number, metric: MetricConfig) => {
    // Siempre mostrar como normal para simplificar
    return "normal"
  }

  // Memoizar funciones de utilidad para evitar recrearlas
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "normal": return "bg-green-900 text-green-300 border-green-700"
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
    
    // Limpiar nodo de comparación al abrir el modal
    setComparisonNode(null)
    setComparisonMediciones([])
    setLoadingComparisonData(false)
    
    // Obtener la última fecha disponible de los datos para esta métrica
    const metricId = getMetricIdFromDataKey(metric.dataKey)
    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
    
    let endDate: Date
    let startDate: Date
    
    if (metricMediciones.length > 0) {
      // Encontrar la última fecha disponible
      const sortedMediciones = [...metricMediciones].sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
      const lastAvailableDate = new Date(sortedMediciones[0].fecha)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Normalizar a inicio del día
      lastAvailableDate.setHours(0, 0, 0, 0) // Normalizar a inicio del día
      
      // Si la última fecha disponible es anterior a hoy, usar esa fecha como punto de partida
      if (lastAvailableDate < today) {
        // Usar la última fecha disponible como fecha final
        endDate = new Date(lastAvailableDate)
        // Un día antes de la última fecha disponible
        startDate = new Date(lastAvailableDate.getTime() - 24 * 60 * 60 * 1000)
      } else {
        // Si hay datos de hoy o más recientes, usar el comportamiento normal
        endDate = new Date()
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // 1 día hacia atrás
      }
    } else {
      // Si no hay datos, usar el comportamiento por defecto (hoy - 1 día)
      endDate = new Date()
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // 1 día hacia atrás
    }
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    // Limpiar estados temporales al abrir el modal
    setTempStartDate('')
    setTempEndDate('')
    
    // IMPORTANTE: Establecer fechas ANTES de abrir el modal para que el useEffect se dispare correctamente
    setDetailedStartDate(startDateStr)
    setDetailedEndDate(endDateStr)
    
    // Abrir el modal - el useEffect se encargará de cargar los datos
    // Usar setTimeout para asegurar que las fechas se establezcan antes de que el useEffect se ejecute
    setTimeout(() => {
    setShowDetailedAnalysis(true)
    }, 0)
  }

  // chartData se calcula por métrica individualmente

  // Memoizar métricas disponibles (solo las 3 principales)
  const availableMetrics = getTranslatedMetrics

  // Memoizar verificación de datos por métrica (verifica si hay datos recientes - últimos 30 días)
  // Los datos se cargan en rangos de 1, 7, 14, 30 días, así que consideramos "recientes" los últimos 30 días
  const hasMetricData = useCallback((dataKey: string) => {
    if (!mediciones.length) {
      return false
    }
    
    const metricId = getMetricIdFromDataKey(dataKey)
    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
    
    if (!metricMediciones.length) {
      return false
    }
    
    // Verificar si hay datos recientes (últimos 30 días)
    // Esto coincide con los rangos que se cargan (1, 7, 14, 30 días)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Ordenar por fecha descendente (más recientes primero)
    const sortedMediciones = [...metricMediciones].sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
    
    // Verificar si la medición más reciente está dentro de los últimos 30 días
    const mostRecentDate = new Date(sortedMediciones[0].fecha)
    const hasRecentData = mostRecentDate >= thirtyDaysAgo
    
    // Si hay datos recientes (últimos 30 días), considerarlos válidos
    // Esto permite mostrar gráficos incluso si los datos no son de las últimas 24 horas exactas
    if (hasRecentData) {
      return true
    }
    
    // Si no hay datos en los últimos 30 días, el nodo no tiene datos recientes
    return false
  }, [mediciones])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 overflow-y-auto dashboard-scrollbar">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <div className="w-5 h-5">⚠️</div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Node Selector Console */}
        <NodeSelector
          selectedEntidadId={filters.entidadId}
          selectedUbicacionId={filters.ubicacionId}
          onNodeSelect={(nodeData) => {
            setSelectedNode(nodeData)
          }}
          onFiltersUpdate={(newFilters) => {
            onFiltersChange({
              entidadId: newFilters.entidadId,
              ubicacionId: newFilters.ubicacionId,
              startDate: filters.startDate,
              endDate: filters.endDate
            })
          }}
          onEntidadChange={onEntidadChange}
          onUbicacionChange={onUbicacionChange}
        />

        {/* Loading State - Mostrar después del mapa, donde van los gráficos */}
        {loading && selectedNode && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        )}

{/* Metrics Cards - Solo mostrar cuando hay un nodo seleccionado Y no está cargando */}
        {!loading && !error && availableMetrics.length > 0 && selectedNode && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {availableMetrics.map((metric) => {
              const hasData = hasMetricData(metric.dataKey)
              const currentValue = hasData ? getCurrentValue(metric.dataKey) : 0
              const status = hasData ? getStatus(currentValue as number, metric) : "no-data"

              return (
                <div
                  key={metric.id}
                  className={`bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:shadow-lg transition-all duration-200 border-2 hover:border-green-500/20 p-6 group ${
                    !hasData ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl text-gray-800 dark:text-white">
                        {metric.id === 'temperatura' ? '🌡' : 
                         metric.id === 'humedad' ? '💧' : '⚡'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white font-mono tracking-wider">{metric.title}</h3>
                      </div>
                    </div>
                    {!hasData && (
                      <span className="px-2 py-1 text-xs font-bold rounded-full border bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 font-mono tracking-wider">
                        NODO OBSERVADO
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline space-x-2 mb-4">
                    <span className="text-3xl font-bold text-green-500 font-mono">
                      {hasData && typeof currentValue === "number" ? currentValue.toFixed(1) : "--"}
                    </span>
                    <span className="text-sm text-neutral-400 font-mono">{metric.unit}</span>
                  </div>

                  <div className="h-32 mb-4">
                    {hasData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processChartData(metric.dataKey)}>
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                            interval={(() => {
                              const chartData = processChartData(metric.dataKey)
                              // Mostrar máximo 4-5 etiquetas en gráficos pequeños
                              if (chartData.length <= 5) return 0
                              if (chartData.length <= 10) return 1
                              return Math.floor(chartData.length / 4)
                            })()}
                          />
                          <YAxis hide />
                          {(() => {
                            const chartData = processChartData(metric.dataKey)
                            if (chartData.length === 0) return null
                            
                            // Obtener todas las claves de tipo (excluyendo 'time')
                            const tipoKeys = Object.keys(chartData[0] || {}).filter(key => key !== 'time')
                            const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
                            
                            return tipoKeys.map((tipoKey, index) => (
                              <Line
                                key={tipoKey}
                                type="monotone"
                                dataKey={tipoKey}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: colors[index % colors.length], stroke: colors[index % colors.length], strokeWidth: 2 }}
                                strokeOpacity={0.8}
                                connectNulls={true}
                              />
                            ))
                          })()}
                          <Tooltip
                            labelFormatter={(label) => {
                              // Detectar si el label es una fecha (contiene "/") o una hora
                              const isDate = label && typeof label === 'string' && label.includes('/')
                              return (
                              <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                                  {isDate ? label : `${t('dashboard.tooltip.hour')} ${label}`}
                              </span>
                              )
                            }}
                            formatter={(value: number, name: string) => [
                              <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                                {name}: {value ? value.toFixed(1) : '--'} {metric.unit}
                              </span>
                            ]}
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#ffffff",
                              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                              padding: "8px 12px"
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
                        <div className="text-center text-blue-700 dark:text-blue-400 mb-3">
                          <div className="text-3xl mb-2">👁️</div>
                          <div className="text-sm font-mono tracking-wider font-bold mb-1">NODO OBSERVADO</div>
                          <div className="text-xs font-mono opacity-75">No disponible por el momento</div>
                        </div>
                        <button
                          onClick={() => openDetailedAnalysis(metric)}
                          className="px-3 py-1.5 text-xs font-mono tracking-wider bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
                        >
                          Ajustar Rango Manualmente
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mostrar fecha y hora de la medida más actual */}
                  {hasData && (() => {
                    const metricId = getMetricIdFromDataKey(metric.dataKey)
                    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
                    if (metricMediciones.length > 0) {
                      const latest = metricMediciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
                      const latestDate = new Date(latest.fecha)
                      return (
                        <div className="text-xs text-neutral-400 text-center mb-3">
                          {t('dashboard.last_measurement')} {latestDate.toLocaleString('es-ES', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Botón de lupa para análisis detallado - Siempre visible para permitir ajuste manual */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => openDetailedAnalysis(metric)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        hasData 
                          ? 'text-neutral-400 group-hover:text-green-500 group-hover:bg-green-500/10 group-hover:scale-110'
                          : 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                      }`}
                      title={hasData ? "Ver análisis detallado" : "Ajustar rango de fechas para buscar datos antiguos"}
                      >
                        <svg className="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>

                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Análisis Detallado */}
        {showDetailedAnalysis && selectedMetricForAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full ${isModalExpanded ? 'max-w-[95vw]' : 'max-w-7xl'} max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300`}>
              {/* Contenido con sidebar de pestañas */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar izquierdo con pestañas de métricas (estilo separadores de libros) */}
                <div className="w-48 border-r border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex flex-col py-4">
                  <div className="flex flex-col space-y-2 px-2">
                    {getTranslatedMetrics.map((metric) => (
                      <button
                        key={metric.id}
                        onClick={() => setSelectedDetailedMetric(metric.dataKey)}
                        disabled={loadingDetailedData}
                        className={`relative px-4 py-3 font-mono tracking-wider transition-all duration-200 text-sm text-left ${
                          selectedDetailedMetric === metric.dataKey
                            ? 'bg-green-500 text-white shadow-md'
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
                    ))}
                  </div>
                  
                  {/* Información del nodo debajo de las pestañas */}
                  {selectedNode && (
                    <div className="mt-4 px-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                      <div className="text-xs font-mono space-y-1.5 text-gray-700 dark:text-neutral-300">
                        {/* Entidad primero, en negrita */}
                        {selectedNode.entidad && (
                          <div className="truncate pl-2 mb-2">
                            <span className="font-bold text-gray-800 dark:text-white">Entidad: {selectedNode.entidad.entidad}</span>
                          </div>
                        )}
                        
                        {/* Separador */}
                        {selectedNode.entidad && (
                          <div className="border-t border-gray-300 dark:border-neutral-600 my-2"></div>
                        )}
                        
                        {/* Resto de la información */}
                        {selectedNode.deveui && (
                          <div className="truncate pl-2" title={`DevEUI: ${selectedNode.deveui}`}>
                            <span className="text-gray-500 dark:text-neutral-500">DevEUI:</span> {selectedNode.deveui}
                </div>
                        )}
                        {selectedNode.ubicacion && (
                          <div className="truncate pl-2" title={`Ubicación: ${selectedNode.ubicacion.ubicacion}`}>
                            <span className="text-gray-500 dark:text-neutral-500">Ubicación:</span> {selectedNode.ubicacion.ubicacion}
                          </div>
                        )}
                        {selectedNode.ubicacion?.fundo && (
                          <div className="truncate pl-2" title={`Fundo: ${selectedNode.ubicacion.fundo.fundo}`}>
                            <span className="text-gray-500 dark:text-neutral-500">Fundo:</span> {selectedNode.ubicacion.fundo.fundo}
                          </div>
                        )}
                        {selectedNode.ubicacion?.fundo?.empresa && (
                          <div className="truncate pl-2" title={`Empresa: ${selectedNode.ubicacion.fundo.empresa.empresa}`}>
                            <span className="text-gray-500 dark:text-neutral-500">Empresa:</span> {selectedNode.ubicacion.fundo.empresa.empresa}
                          </div>
                        )}
                        {selectedNode.ubicacion?.fundo?.empresa?.pais && (
                          <div className="truncate pl-2" title={`País: ${selectedNode.ubicacion.fundo.empresa.pais.pais}`}>
                            <span className="text-gray-500 dark:text-neutral-500">País:</span> {selectedNode.ubicacion.fundo.empresa.pais.pais}
                          </div>
                        )}
                        {selectedNode.latitud && selectedNode.longitud && (
                          <div className="truncate pl-2" title={`Coordenadas: ${selectedNode.latitud}, ${selectedNode.longitud}`}>
                            <span className="text-gray-500 dark:text-neutral-500">Coordenadas:</span>
                            <div className="pl-4 text-xs">
                              {selectedNode.latitud}, {selectedNode.longitud}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Leyenda de tipos de sensores */}
                  {showDetailedAnalysis && selectedDetailedMetric && tipos.length > 0 && (() => {
                    const metricId = getMetricIdFromDataKey(selectedDetailedMetric)
                    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
                    const tiposDisponibles = new Set<string>()
                    
                    // Obtener tipos del nodo principal
                    metricMediciones.forEach(m => {
                      const tipo = tipos.find(t => t.tipoid === m.tipoid)
                      if (tipo) {
                        tiposDisponibles.add(tipo.tipo)
                      }
                    })
                    
                    // Obtener tipos del nodo de comparación si existe
                    if (comparisonNode && comparisonMediciones.length > 0) {
                      const comparisonMetricMediciones = comparisonMediciones.filter(m => m.metricaid === metricId)
                      comparisonMetricMediciones.forEach(m => {
                        const tipo = tipos.find(t => t.tipoid === m.tipoid)
                        if (tipo) {
                          tiposDisponibles.add(tipo.tipo)
                        }
                      })
                    }
                    
                    const tiposArray = Array.from(tiposDisponibles).sort()
                    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
                    const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4']
                    
                    if (tiposArray.length === 0) {
                      return null
                    }
                    
                    return (
                      <div className="mt-4 px-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                        <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 mb-2 font-mono">
                          Leyenda:
                        </div>
                        <div className="space-y-3">
                          {tiposArray.map((tipoNombre, index) => {
                            const isVisible = visibleTipos.has(tipoNombre)
                            const color = colors[index % colors.length]
                            const compColor = comparisonColors[index % comparisonColors.length]
                            
                            // Obtener nodos que tienen este tipo
                            const nodosConEsteTipo: Array<{ nodo: string; color: string; isComparison: boolean }> = []
                            
                            // Verificar si este tipo existe en el nodo principal
                            const existsInMain = metricMediciones.some(m => {
                              const tipo = tipos.find(t => t.tipoid === m.tipoid)
                              return tipo && tipo.tipo === tipoNombre
                            })
                            
                            if (existsInMain && selectedNode) {
                              nodosConEsteTipo.push({
                                nodo: selectedNode.nodo || 'Nodo Principal',
                                color: color,
                                isComparison: false
                              })
                            }
                            
                            // Verificar si este tipo existe en el nodo de comparación
                            const existsInComparison = comparisonNode && comparisonMediciones.length > 0 && comparisonMediciones.some(m => {
                              const tipo = tipos.find(t => t.tipoid === m.tipoid)
                              return tipo && tipo.tipo === tipoNombre && m.metricaid === metricId
                            })
                            
                            if (existsInComparison && comparisonNode) {
                              nodosConEsteTipo.push({
                                nodo: comparisonNode.nodo,
                                color: compColor,
                                isComparison: true
                              })
                            }
                            
                            if (nodosConEsteTipo.length === 0) {
                              return null
                            }
                            
                            return (
                              <div key={tipoNombre} className="space-y-1">
                                {/* Checkbox y nombre del tipo de sensor */}
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={isVisible}
                                    onChange={(e) => {
                                      const newVisibleTipos = new Set(visibleTipos)
                                      if (e.target.checked) {
                                        newVisibleTipos.add(tipoNombre)
                                      } else {
                                        newVisibleTipos.delete(tipoNombre)
                                      }
                                      setVisibleTipos(newVisibleTipos)
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-green-500 focus:ring-green-500"
                                  />
                                  <span className="text-xs font-mono text-gray-700 dark:text-neutral-300 font-semibold">
                                    {tipoNombre}
                                  </span>
                                </div>
                                
                                {/* Nodos con este tipo, indentados */}
                                {nodosConEsteTipo.map((nodoInfo, nodoIndex) => (
                                  <div key={`${tipoNombre}-${nodoIndex}`} className="flex items-center space-x-2 pl-6">
                                    <div 
                                      className={`w-3 h-3 rounded-full flex-shrink-0 ${nodoInfo.isComparison ? 'border-2 border-dashed' : ''}`}
                                      style={{ 
                                        backgroundColor: nodoInfo.isComparison ? 'transparent' : nodoInfo.color,
                                        borderColor: nodoInfo.isComparison ? nodoInfo.color : undefined
                                      }}
                                    />
                                    <span className={`text-xs font-mono truncate ${nodoInfo.isComparison ? 'text-gray-500 dark:text-neutral-400' : 'text-gray-700 dark:text-neutral-300'}`}>
                                      {nodoInfo.nodo}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
              </div>
              
                {/* Contenido principal */}
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800 relative">
                <div className="p-6">

                  {/* Mensaje de validación de fechas */}
                  {detailedStartDate && detailedEndDate && new Date(detailedStartDate) > new Date(detailedEndDate) && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                        <span>⚠️</span>
                        <span className="text-sm font-mono">La fecha inicial no puede ser mayor que la fecha final. Por favor, ajuste las fechas.</span>
                      </div>
                    </div>
                  )}

                  {/* Controles en una sola fila con separadores - Layout compacto horizontal */}
                  <div className="flex items-start gap-4 mb-6 justify-center">
                    <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-4 flex-shrink-0">
                    <div className="flex flex-nowrap items-center gap-4 overflow-x-hidden">
                      {/* Intervalo de Fechas */}
                    <div className="flex flex-col flex-shrink-0">
                        <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Fecha Inicio:</label>
                      <input
                        type="date"
                              value={tempStartDate || detailedStartDate}
                              onChange={(e) => {
                                const newStartDate = e.target.value
                                // Solo actualizar tempStartDate, NO cargar datos automáticamente
                                setTempStartDate(newStartDate)
                              }}
                              max={tempEndDate || detailedEndDate || undefined}
                              disabled={loadingDetailedData}
                              className={`h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-xs ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Fecha Fin:</label>
                      <input
                        type="date"
                              value={tempEndDate || detailedEndDate}
                              onChange={(e) => {
                                const newEndDate = e.target.value
                                // Solo actualizar tempEndDate, NO cargar datos automáticamente
                                setTempEndDate(newEndDate)
                              }}
                              min={tempStartDate || detailedStartDate || undefined}
                              disabled={loadingDetailedData}
                              className={`h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-xs ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>
                          {/* Botón Aplicar - aparece cuando hay fechas temporales diferentes */}
                          {(tempStartDate && tempStartDate !== detailedStartDate) || (tempEndDate && tempEndDate !== detailedEndDate) ? (
                            <div className="flex flex-col">
                              <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap invisible">Aplicar:</label>
                              <button
                                onClick={() => {
                                  // Validar fechas antes de aplicar
                                  const startDateToApply = tempStartDate || detailedStartDate
                                  const endDateToApply = tempEndDate || detailedEndDate
                                  
                                  if (startDateToApply && endDateToApply && new Date(startDateToApply) > new Date(endDateToApply)) {
                                    showWarning(
                                      'Fecha inválida',
                                      'La fecha inicial no puede ser mayor que la fecha final. Por favor, seleccione fechas válidas.'
                                    )
                                    return
                                  }
                                  
                                  // Aplicar cambios y cargar datos
                                  flushSync(() => {
                                    setLoadingDetailedData(true)
                                    if (tempStartDate) {
                                      setDetailedStartDate(tempStartDate)
                                      setTempStartDate('')
                                    }
                                    if (tempEndDate) {
                                      setDetailedEndDate(tempEndDate)
                                      setTempEndDate('')
                                    }
                                    // Si la fecha inicio cambió y es mayor que la fecha fin, ajustar ambas
                                    if (tempStartDate && tempEndDate && new Date(tempStartDate) > new Date(tempEndDate)) {
                                      setDetailedStartDate(tempStartDate)
                                      setDetailedEndDate(tempStartDate)
                                      setTempStartDate('')
                                      setTempEndDate('')
                                    }
                                  })
                                }}
                                disabled={loadingDetailedData}
                                className="h-8 px-3 ml-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-xs transition-colors whitespace-nowrap"
                              >
                                Aplicar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Separador visual */}
                      <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

                      {/* Ajuste del eje Y */}
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
                                setYAxisDomain(prev => ({ ...prev, min: null }))
                                return
                              }
                              const numValue = Number(inputValue)
                              if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                                setYAxisDomain(prev => ({ ...prev, min: numValue }))
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
                                setYAxisDomain(prev => ({ ...prev, max: null }))
                                return
                              }
                              const numValue = Number(inputValue)
                              if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                                setYAxisDomain(prev => ({ ...prev, max: numValue }))
                              }
                            }}
                            placeholder="Max"
                            className="h-8 w-16 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono"
                          />
                          <button
                            onClick={() => setYAxisDomain({ min: null, max: null })}
                            className="h-8 px-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-mono"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Separador visual */}
                      <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

                      {/* Botón de análisis de fluctuación */}
                      <div className="flex flex-col flex-shrink-0">
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Analizar Fluctuación:</label>
                        <div className="h-8 flex items-center">
                          <button
                            onClick={analyzeFluctuationAndRecommendThresholds}
                            disabled={loadingDetailedData || !mediciones.length}
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

                      {/* Selector de nodo para comparación */}
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
                                  setComparisonNode(node)
                                  loadComparisonMediciones(node)
                                } else {
                                  setComparisonNode(null)
                                  setComparisonMediciones([])
                                }
                              } else {
                                setComparisonNode(null)
                                setComparisonMediciones([])
                              }
                            }}
                            disabled={loadingComparisonData}
                            className="h-8 px-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white font-mono text-xs w-28 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors dashboard-scrollbar"
                            style={{
                              scrollbarWidth: 'thin',
                              scrollbarColor: '#22c55e #d1d5db'
                            }}
                          >
                            <option value="">Ninguno</option>
                            {availableNodes
                              .filter(n => n.nodoid !== selectedNode?.nodoid)
                              .map(node => (
                                <option key={node.nodoid} value={node.nodoid} title={`${node.nodo} - ${node.ubicacion?.ubicacion || ''}`}>
                                  {node.nodo.length > 12 ? `${node.nodo.substring(0, 12)}...` : node.nodo}
                                </option>
                              ))}
                          </select>
                          {comparisonNode && (
                            <button
                              onClick={() => {
                                setComparisonNode(null)
                                setComparisonMediciones([])
                              }}
                              className="h-8 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-mono"
                            >
                              ✕
                            </button>
                          )}
                          {loadingComparisonData && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                    {/* Botones de control (cerrar y expandir) - Posición absoluta para mantener posición relativa */}
                    <div className={`flex flex-col gap-2 flex-shrink-0 absolute ${isModalExpanded ? 'right-4' : 'right-4'} top-4 transition-all duration-300`}>
                      {/* Botón cerrar */}
                      <button
                        onClick={() => {
                          // Limpiar estado al cerrar el modal
                          setShowDetailedAnalysis(false)
                          setSelectedMetricForAnalysis(null)
                          setComparisonNode(null)
                          setComparisonMediciones([])
                          setLoadingComparisonData(false)
                          setIsModalExpanded(false) // Resetear expansión al cerrar
                          setYAxisDomain({ min: null, max: null }) // Resetear ajuste del eje Y
                          setVisibleTipos(new Set()) // Resetear tipos visibles
                        }}
                        className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
                        title="Cerrar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {/* Botón expandir/contraer */}
                      <button
                        onClick={() => setIsModalExpanded(!isModalExpanded)}
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

                  {/* Gráfico detallado */}
                  <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white font-mono tracking-wider">
                        {selectedNode?.nodo || 'Nodo'}
                        {comparisonNode && ` vs ${comparisonNode.nodo}`}
                    </h3>
                    </div>
                    {(() => {
                      // Si está cargando, siempre mostrar pantalla de carga (ocultar gráfico anterior)
                      if (loadingDetailedData) {
                        return (
                          <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                              <div className="text-gray-600 dark:text-neutral-400 text-lg font-mono">
                                Cargando datos...
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Procesar datos principales
                      // CRÍTICO: Siempre procesar datos del nodo principal primero
                      const chartData = processChartData(selectedDetailedMetric, true);
                      
                      // Verificar que hay datos del nodo principal
                      if (chartData.length === 0) {
                        console.warn('⚠️ No hay datos del nodo principal para el rango seleccionado')
                      }
                      
                      // Procesar datos de comparación si están disponibles
                      // CRÍTICO: Usar EXACTAMENTE la misma lógica de granularidad que processChartData
                      // para asegurar que las claves de tiempo coincidan perfectamente
                      const processComparisonData = (comparisonData: MedicionData[], dataKey: string): any[] => {
                        if (!comparisonData.length || !tipos.length) {
                          return []
                        }
                        
                        const metricId = getMetricIdFromDataKey(dataKey)
                        const metricMediciones = comparisonData.filter(m => m.metricaid === metricId)
                        
                        if (!metricMediciones.length) {
                          return []
                        }
                        
                        // Ordenar por fecha (ascendente)
                        const sortedMediciones = metricMediciones
                          .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
                          .sort((a, b) => a.fechaParsed - b.fechaParsed)
                          .map(({ fechaParsed, ...m }) => m)
                        
                        if (!detailedStartDate || !detailedEndDate) {
                          return []
                        }
                        
                        const startDate = new Date(detailedStartDate + 'T00:00:00')
                        const endDate = new Date(detailedEndDate + 'T23:59:59')
                        
                        const filteredMediciones = sortedMediciones.filter(m => {
                          const medicionDate = new Date(m.fecha)
                          return medicionDate >= startDate && medicionDate <= endDate
                        })
                        
                        if (filteredMediciones.length === 0) {
                          return []
                        }
                        
                        // CRÍTICO: Usar EXACTAMENTE la misma lógica de granularidad que processChartData
                        // Calcular el rango de tiempo para determinar la granularidad
                        const timeSpan = endDate.getTime() - startDate.getTime()
                        const daysSpan = timeSpan / (1000 * 3600 * 24)
                        const hoursSpan = timeSpan / (1000 * 60 * 60)
                        const isDateRange = daysSpan > 1
                        
                        // USAR LA MISMA LÓGICA QUE processChartData (líneas 1194-1196)
                        const useMinutes = !isDateRange && (filteredMediciones.length < 500 || hoursSpan < 48)
                        const useHours = !isDateRange && !useMinutes && hoursSpan < 168 // 7 días
                        const useDays = isDateRange && daysSpan > 7 // Solo días si es rango personalizado y > 7 días
                        
                        // Obtener tipos únicos en las mediciones de comparación
                        const tiposEnMediciones = Array.from(new Set(filteredMediciones.map(m => m.tipoid)))
                        
                        // Inicializar estructura de datos por tipo
                        const datosPorTipo: { [tipoid: number]: Array<{ timestamp: number; time: string; value: number; count: number; tipoid: number; tipo: string }> } = {}
                        tiposEnMediciones.forEach(tipoid => {
                          datosPorTipo[tipoid] = []
                        })
                        
                        // Agrupar mediciones por tipo y tiempo (igual que processChartData)
                        filteredMediciones.forEach(medicion => {
                          if (medicion.medicion == null || isNaN(medicion.medicion)) return
                          
                          const date = new Date(medicion.fecha)
                          let timeKey: string
                          
                          if (useDays) {
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            timeKey = `${day}/${month}`
                          } else if (useHours) {
                            const hour = String(date.getHours()).padStart(2, '0')
                            timeKey = `${hour}:00`
                          } else {
                            const minutes = date.getMinutes()
                            const roundedMinutes = Math.floor(minutes / 15) * 15
                            const hour = String(date.getHours()).padStart(2, '0')
                            const minute = String(roundedMinutes).padStart(2, '0')
                            timeKey = `${hour}:${minute}`
                          }
                          
                          // Buscar si ya existe un punto para este tipo y tiempo
                          const existingPoint = datosPorTipo[medicion.tipoid].find(p => p.time === timeKey)
                          
                          if (existingPoint) {
                            const currentValue = existingPoint.value
                            const currentCount = existingPoint.count
                            const newValue = (currentValue * currentCount + medicion.medicion) / (currentCount + 1)
                            existingPoint.value = newValue
                            existingPoint.count = currentCount + 1
                            if (date.getTime() > existingPoint.timestamp) {
                              existingPoint.timestamp = date.getTime()
                            }
                          } else {
                            datosPorTipo[medicion.tipoid].push({
                              timestamp: date.getTime(),
                              time: timeKey,
                              value: medicion.medicion,
                              count: 1,
                              tipoid: medicion.tipoid,
                              tipo: tipos.find(t => t.tipoid === medicion.tipoid)?.tipo || `Tipo ${medicion.tipoid}`
                            })
                          }
                        })
                        
                        // Ordenar los datos de cada tipo por timestamp
                        tiposEnMediciones.forEach(tipoid => {
                          if (datosPorTipo[tipoid]) {
                            datosPorTipo[tipoid].sort((a, b) => a.timestamp - b.timestamp)
                          }
                        })
                        
                        // Obtener todos los tiempos únicos ordenados por timestamp (igual que processChartData)
                        const allTimeStamps = new Set<number>()
                        tiposEnMediciones.forEach(tipoid => {
                          if (datosPorTipo[tipoid]) {
                            datosPorTipo[tipoid].forEach(point => {
                              // Calcular el inicio del período para el timeKey
                              const periodStart = new Date(point.timestamp)
                              if (useDays) {
                                periodStart.setHours(0, 0, 0, 0)
                              } else if (useHours) {
                                periodStart.setMinutes(0, 0, 0)
                              } else {
                                const roundedMinutes = Math.floor(periodStart.getMinutes() / 15) * 15
                                periodStart.setMinutes(roundedMinutes, 0, 0)
                              }
                              allTimeStamps.add(periodStart.getTime())
                            })
                          }
                        })
                        
                        // Convertir timestamps a timeKeys y ordenar
                        const allTimes = Array.from(allTimeStamps)
                          .sort((a, b) => a - b)
                          .map(ts => {
                            const date = new Date(ts)
                            if (useDays) {
                              const day = String(date.getDate()).padStart(2, '0')
                              const month = String(date.getMonth() + 1).padStart(2, '0')
                              return `${day}/${month}`
                            } else if (useHours) {
                              const hour = String(date.getHours()).padStart(2, '0')
                              return `${hour}:00`
                            } else {
                              const minutes = date.getMinutes()
                              const roundedMinutes = Math.floor(minutes / 15) * 15
                              const hour = String(date.getHours()).padStart(2, '0')
                              const minute = String(roundedMinutes).padStart(2, '0')
                              return `${hour}:${minute}`
                            }
                          })
                        
                        // Crear estructura de datos para el gráfico
                        return allTimes.map(time => {
                          const point: any = { time }
                          tiposEnMediciones.forEach(tipoid => {
                            const tipo = tipos.find(t => t.tipoid === tipoid)
                            if (tipo && datosPorTipo[tipoid]) {
                              const tipoPoint = datosPorTipo[tipoid].find(p => p.time === time)
                              if (tipoPoint) {
                                let value: number | null = tipoPoint.value
                                
                                // Filtrar valores fuera del rango del eje Y si está configurado
                                if (value !== null && value !== undefined) {
                                  const hasMinLimit = yAxisDomain.min !== null && !isNaN(yAxisDomain.min)
                                  const hasMaxLimit = yAxisDomain.max !== null && !isNaN(yAxisDomain.max)
                                  
                                  if (hasMinLimit && value < yAxisDomain.min!) {
                                    value = null // Ocultar valor si está por debajo del mínimo
                                  } else if (hasMaxLimit && value > yAxisDomain.max!) {
                                    value = null // Ocultar valor si está por encima del máximo
                                  }
                                }
                                
                                point[tipo.tipo] = value
                              }
                            }
                          })
                          return point
                        })
                      }
                      
                      let comparisonChartData: any[] = []
                      if (comparisonMediciones.length > 0 && comparisonNode) {
                        comparisonChartData = processComparisonData(comparisonMediciones, selectedDetailedMetric)
                        // Debug: verificar que se procesaron datos
                        if (comparisonChartData.length === 0 && comparisonMediciones.length > 0) {
                          console.warn('⚠️ processComparisonData no generó datos aunque hay mediciones de comparación', {
                            comparisonMedicionesCount: comparisonMediciones.length,
                            selectedMetric: selectedDetailedMetric
                          })
                        }
                      }
                      
                      // Combinar datos de comparación con datos principales
                      // CRÍTICO: Incluir TODOS los timeKeys de ambos datasets para que las líneas se rendericen
                      // CRÍTICO: PRESERVAR SIEMPRE los datos del nodo principal
                      // Crear un mapa de tiempo para combinar eficientemente
                      const timeMap = new Map<string, any>()
                      
                      // PRIMERO: Agregar TODOS los puntos del nodo principal (CRÍTICO: esto debe preservarse)
                      chartData.forEach(point => {
                        // Crear una copia profunda para no modificar el original
                        const pointCopy: any = { ...point }
                        timeMap.set(point.time, pointCopy)
                      })
                      
                      // SEGUNDO: Agregar/combinar puntos del nodo de comparación SIN sobrescribir datos principales
                      // IMPORTANTE: Si un timeKey no existe en el nodo principal, crear un punto nuevo
                      // IMPORTANTE: Si existe, SOLO agregar las claves comp_ sin tocar las claves originales
                      comparisonChartData.forEach(point => {
                        const existing = timeMap.get(point.time)
                        if (existing) {
                          // Si el timeKey ya existe, SOLO agregar las claves de comparación
                          // NO modificar ni eliminar las claves originales del nodo principal
                          Object.keys(point).forEach(key => {
                            if (key !== 'time') {
                              existing[`comp_${key}`] = point[key]
                            }
                          })
                        } else {
                          // Si el timeKey NO existe, crear un nuevo punto solo con datos de comparación
                          // Esto permite mostrar datos de comparación en momentos donde el nodo principal no tiene datos
                          const newPoint: any = { time: point.time }
                          Object.keys(point).forEach(key => {
                            if (key !== 'time') {
                              newPoint[`comp_${key}`] = point[key]
                            }
                          })
                          timeMap.set(point.time, newPoint)
                        }
                      })
                      
                      // Verificar que los datos del nodo principal se preservaron
                      const preservedMainData = Array.from(timeMap.values()).filter(p => {
                        // Un punto tiene datos principales si tiene alguna clave que NO empiece con 'comp_' y NO sea 'time'
                        return Object.keys(p).some(k => k !== 'time' && !k.startsWith('comp_'))
                      })
                      
                      if (chartData.length > 0 && preservedMainData.length === 0) {
                        console.error('❌ ERROR CRÍTICO: Los datos del nodo principal se perdieron durante la combinación!', {
                          chartDataLength: chartData.length,
                          timeMapSize: timeMap.size,
                          sampleChartData: chartData[0],
                          sampleTimeMap: Array.from(timeMap.values())[0]
                        })
                      }
                      
                      // Debug: verificar datos combinados
                      if (comparisonChartData.length > 0) {
                        const pointsWithComparison = Array.from(timeMap.values()).filter(p => 
                          Object.keys(p).some(k => k.startsWith('comp_'))
                        )
                        if (pointsWithComparison.length > 0) {
                          console.log('✅ Datos combinados correctamente:', {
                            totalPuntos: timeMap.size,
                            puntosConComparacion: pointsWithComparison.length,
                            muestra: pointsWithComparison[0]
                          })
                        } else {
                          console.warn('⚠️ No se encontraron claves comp_ en los datos combinados', {
                            chartDataLength: chartData.length,
                            comparisonChartDataLength: comparisonChartData.length,
                            chartDataSample: chartData[0],
                            comparisonSample: comparisonChartData[0]
                          })
                        }
                      }
                      
                      const finalChartData = Array.from(timeMap.values()).sort((a, b) => {
                        // Ordenar por tiempo, manejando diferentes formatos
                        const timeA = a.time
                        const timeB = b.time
                        
                        // Si son fechas (DD/MM), convertir a timestamp
                        if (timeA.includes('/') && timeB.includes('/')) {
                          const [dayA, monthA] = timeA.split('/').map(Number)
                          const [dayB, monthB] = timeB.split('/').map(Number)
                          const year = new Date(detailedStartDate).getFullYear()
                          const dateA = new Date(year, monthA - 1, dayA).getTime()
                          const dateB = new Date(year, monthB - 1, dayB).getTime()
                          return dateA - dateB
                        }
                        
                        // Si son horas (HH:MM), comparar directamente como string
                        return timeA.localeCompare(timeB)
                      })
                      
                      
                      // Solo mostrar "No hay datos" si NO está cargando y no hay datos
                      if (finalChartData.length === 0) {
                        return (
                          <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                            <div className="text-center">
                              <div className="text-4xl mb-4">📊</div>
                              <div className="text-gray-600 dark:text-neutral-400 text-lg font-mono">
                                No hay datos disponibles para el rango de fechas seleccionado
                              </div>
                              <div className="text-gray-500 dark:text-neutral-500 text-sm font-mono mt-2">
                                Ajusta las fechas o verifica que existan mediciones
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Renderizar el gráfico con los datos procesados (usar finalChartData que incluye comparación)
                      // CRÍTICO: Obtener tipoKeys del nodo principal (chartData), NO de finalChartData
                      // Esto asegura que siempre se muestren las líneas del nodo principal
                      const tipoKeys = chartData.length > 0 
                        ? Object.keys(chartData[0] || {}).filter(key => key !== 'time' && !key.startsWith('comp_'))
                        : (finalChartData.length > 0 
                          ? Object.keys(finalChartData[0] || {}).filter(key => key !== 'time' && !key.startsWith('comp_'))
                          : [])
                      const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
                      const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4']
                      
                      return (
                        <>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={finalChartData}>
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                            interval={(() => {
                              // Usar finalChartData ya calculado arriba
                              // Mostrar máximo 6-8 etiquetas en gráfico detallado
                              if (finalChartData.length <= 8) return 0
                              if (finalChartData.length <= 20) return 1
                              return Math.floor(finalChartData.length / 6)
                            })()}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                            domain={yAxisDomain.min !== null || yAxisDomain.max !== null ? [yAxisDomain.min ?? 'auto', yAxisDomain.max ?? 'auto'] : ['auto', 'auto']}
                            tickFormatter={(value) => {
                              // Redondear a entero si el valor es mayor a 1, o mostrar 1 decimal si es menor
                              if (Math.abs(value) >= 1) {
                                return Math.round(value).toString()
                              } else {
                                return value.toFixed(1)
                              }
                            }}
                          />
                          {(() => {
                            // Usar finalChartData ya calculado arriba
                            if (finalChartData.length === 0) return null
                            
                            // Obtener todas las claves de tipo (excluyendo 'time')
                            // tipoKeys, colors y comparisonColors ya están definidos arriba
                            // Buscar claves comp_ en TODOS los puntos, no solo en el primero
                            const allComparisonKeys = new Set<string>()
                            finalChartData.forEach(point => {
                              Object.keys(point).forEach(key => {
                                if (key.startsWith('comp_')) {
                                  allComparisonKeys.add(key)
                                }
                              })
                            })
                            const comparisonKeys = Array.from(allComparisonKeys)
                            
                            // Debug: verificar claves de comparación encontradas
                            if (comparisonNode && comparisonKeys.length === 0 && comparisonChartData.length > 0) {
                              console.warn('⚠️ No se encontraron claves comp_ en finalChartData aunque hay datos de comparación', {
                                comparisonChartDataLength: comparisonChartData.length,
                                finalChartDataLength: finalChartData.length,
                                samplePoint: finalChartData[0],
                                comparisonSamplePoint: comparisonChartData[0],
                                allKeysInSample: Object.keys(finalChartData[0] || {})
                              })
                            }
                            
                            return (
                              <>
                                {/* Líneas del nodo principal */}
                                {tipoKeys
                                  .filter(tipoKey => visibleTipos.has(tipoKey))
                                  .map((tipoKey, index) => {
                                    // Recalcular el índice basado en la posición original en tipoKeys
                                    const originalIndex = tipoKeys.indexOf(tipoKey)
                                    return (
                                      <Line
                                        key={tipoKey}
                                        type="monotone"
                                        dataKey={tipoKey}
                                        stroke={colors[originalIndex % colors.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: colors[originalIndex % colors.length] }}
                                        activeDot={{ r: 6, fill: colors[originalIndex % colors.length] }}
                                        connectNulls={true}
                                        isAnimationActive={true}
                                        animationDuration={300}
                                      />
                                    )
                                  })}
                                {/* Líneas del nodo de comparación (con estilo punteado) */}
                                {comparisonKeys.length > 0 ? (
                                  comparisonKeys
                                    .filter(compKey => {
                                      const originalKey = compKey.replace('comp_', '')
                                      return visibleTipos.has(originalKey)
                                    })
                                    .map((compKey, index) => {
                                      const originalKey = compKey.replace('comp_', '')
                                      // Buscar el índice del tipo original en tipoKeys, o usar el índice de comparisonKeys como fallback
                                      let tipoIndex = tipoKeys.indexOf(originalKey)
                                      if (tipoIndex === -1) {
                                        // Si el tipo no está en el nodo principal, usar el índice de comparisonKeys
                                        tipoIndex = comparisonKeys.indexOf(compKey)
                                      }
                                      const strokeColor = comparisonColors[tipoIndex % comparisonColors.length]
                                      return (
                                        <Line
                                          key={compKey}
                                          type="monotone"
                                          dataKey={compKey}
                                          stroke={strokeColor}
                                          strokeWidth={2}
                                          strokeDasharray="5 5"
                                          dot={{ r: 3, fill: strokeColor }}
                                          activeDot={{ r: 5, fill: strokeColor }}
                                          connectNulls={true}
                                          isAnimationActive={true}
                                          animationDuration={300}
                                        />
                                      )
                                    })
                                ) : null}
                              </>
                            )
                          })()}
                          <Tooltip
                            labelFormatter={(label) => {
                              // Detectar si el label es una fecha (contiene "/") o una hora
                              const isDate = label && typeof label === 'string' && label.includes('/')
                              
                              if (isDate) {
                                // Si es una fecha (formato DD/MM), buscar el año correspondiente
                                // Intentar obtener el año de las fechas seleccionadas o usar el año actual
                                let year = new Date().getFullYear()
                                
                                // Si tenemos fechas seleccionadas, usar el año de la fecha inicial
                                if (detailedStartDate) {
                                  const startDateObj = new Date(detailedStartDate)
                                  year = startDateObj.getFullYear()
                                }
                                
                                // Formatear como "Fecha: DD/MM/YYYY"
                                return (
                                  <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                                    Fecha: {label}/{year}
                                  </span>
                                )
                              } else {
                                // Si es una hora, mostrar "Hora: HH:MM"
                                return (
                              <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                                {t('dashboard.tooltip.hour')} {label}
                              </span>
                                )
                              }
                            }}
                            formatter={(value: number, name: string) => {
                              const isComparison = name.startsWith('comp_')
                              let displayName: string
                              if (isComparison) {
                                displayName = `${name.replace('comp_', '')} (${comparisonNode?.nodo || 'Comparación'})`
                              } else {
                                // Cuando hay comparación, también mostrar el nombre del nodo original
                                displayName = comparisonNode 
                                  ? `${name} (${selectedNode?.nodo || 'Nodo Original'})`
                                  : name
                              }
                              return [
                              <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                                  {displayName}: {value ? value.toFixed(1) : '--'} {getTranslatedMetrics.find(m => m.dataKey === selectedDetailedMetric)?.unit}
                              </span>
                              ]
                            }}
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#ffffff",
                              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                              padding: "8px 12px"
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                          </div>
                          {/* Leyenda de colores por nodo cuando hay comparación */}
                          {comparisonNode && (
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                              <div className="flex flex-wrap items-center gap-6 justify-center">
                                {/* Leyenda del nodo original */}
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                    {selectedNode?.nodo || 'Nodo Original'}
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    {tipoKeys.map((tipoKey, index) => (
                                      <div key={tipoKey} className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-0.5" 
                                          style={{ backgroundColor: colors[index % colors.length] }}
                                        />
                                        <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono">
                                          {tipoKey}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Separador */}
                                <div className="w-px h-12 bg-gray-300 dark:bg-neutral-600"></div>
                                
                                {/* Leyenda del nodo de comparación */}
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                    {comparisonNode.nodo}
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    {(() => {
                                      // CRÍTICO: Solo verificar datos de comparación DESPUÉS de que se hayan cargado
                                      // No mostrar mensaje mientras se está cargando
                                      if (loadingComparisonData) {
                                        return (
                                          <div className="text-xs text-gray-500 dark:text-neutral-500 font-mono italic">
                                            Cargando datos de comparación...
                                          </div>
                                        )
                                      }
                                      
                                      // Verificar si hay algún dato de comparación
                                      const hasAnyComparisonData = tipoKeys.some((tipoKey) => {
                                        const compKey = `comp_${tipoKey}`
                                        return finalChartData.some(point => point[compKey] !== undefined && point[compKey] !== null)
                                      })
                                      
                                      // Si no hay datos de comparación DESPUÉS de cargar, mostrar mensaje
                                      if (!hasAnyComparisonData) {
                                        return (
                                          <div className="text-xs text-gray-500 dark:text-neutral-500 font-mono italic">
                                            El nodo no tiene datos en este intervalo
                                          </div>
                                        )
                                      }
                                      
                                      // Si hay datos, mostrar las líneas de comparación
                                      return tipoKeys.map((tipoKey, index) => {
                                        const compKey = `comp_${tipoKey}`
                                        const hasComparisonData = finalChartData.some(point => point[compKey] !== undefined && point[compKey] !== null)
                                        if (!hasComparisonData) return null
                                        
                                        return (
                                          <div key={compKey} className="flex items-center gap-2">
                                            <div 
                                              className="w-4 h-0.5 border-dashed border-t-2" 
                                              style={{ borderColor: comparisonColors[index % comparisonColors.length] }}
                                            />
                                            <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono">
                                              {tipoKey}
                                            </span>
                                          </div>
                                        )
                                      })
                                    })()}
                                  </div>
                                </div>
                              </div>
                    </div>
                    )}
                        </>
                      );
                    })()}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Recomendaciones de Umbrales */}
        {showThresholdModal && thresholdRecommendations && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-neutral-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white font-mono tracking-wider">
                  Recomendaciones de Umbrales
                </h2>
                <button
                  onClick={() => {
                    setShowThresholdModal(false)
                    setThresholdRecommendations(null)
                  }}
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido */}
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
                  {Object.keys(thresholdRecommendations).map(nodeId => {
                    const nodeRecommendations = thresholdRecommendations[nodeId]
                    const isMainNode = nodeId.startsWith(`node_${selectedNode?.nodoid || 'main'}`)
                    const nodeName = isMainNode 
                      ? (selectedNode?.nodo || 'Nodo Principal')
                      : (comparisonNode?.nodo || 'Nodo de Comparación')
                    
                    return (
                      <div key={nodeId} className="space-y-4">
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400 font-mono border-b border-gray-300 dark:border-neutral-700 pb-2">
                          {nodeName}
                        </h3>
                        {Object.keys(nodeRecommendations).map(tipoidStr => {
                          const tipoid = parseInt(tipoidStr)
                          const tipo = tipos.find(t => t.tipoid === tipoid)
                          const rec = nodeRecommendations[tipoid]
                          
                          if (!tipo || !rec) return null
                          
                          return (
                            <div
                              key={`${nodeId}_${tipoid}`}
                              className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 border border-gray-300 dark:border-neutral-700"
                            >
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-white font-mono mb-3">
                                {tipo.tipo}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Umbral Mínimo Recomendado</label>
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                                    {rec.min.toFixed(2)} {getTranslatedMetrics.find(m => m.dataKey === selectedDetailedMetric)?.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Umbral Máximo Recomendado</label>
                                  <div className="text-lg font-bold text-red-600 dark:text-red-400 font-mono">
                                    {rec.max.toFixed(2)} {getTranslatedMetrics.find(m => m.dataKey === selectedDetailedMetric)?.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Promedio</label>
                                  <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                                    {rec.avg.toFixed(2)} {getTranslatedMetrics.find(m => m.dataKey === selectedDetailedMetric)?.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Desviación Estándar</label>
                                  <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                                    {rec.stdDev.toFixed(2)} {getTranslatedMetrics.find(m => m.dataKey === selectedDetailedMetric)?.unit}
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
        )}

      </main>
    </div>
  )
}
