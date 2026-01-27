import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { flushSync } from "react-dom"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Legend } from "recharts"
import { JoySenseService } from "../../services/backend-api"
import { NodeSelector } from "./NodeSelector"
import { useLanguage } from "../../contexts/LanguageContext"
import { useToast } from "../../contexts/ToastContext"

// Constantes para límites de datos
const DATA_LIMITS = {
  RANGE_SELECTED: 20000,
  HOURS_24: 1000,
  DAYS_7: 5000,
  DAYS_14: 10000,
  DAYS_30: 20000,
  LAST_HOURS: 5000
} as const

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
  localizacionid: number
  fecha: string
  medicion: number
  usercreatedid?: number
  datecreated?: string
  // Datos expandidos desde localizacion
  localizacion?: {
    localizacionid: number
    localizacion: string
    nodoid: number
    metricaid: number
    sensorid: number
    latitud?: number
    longitud?: number
    nodo?: { nodoid: number; nodo: string }
    metrica?: { metricaid: number; metrica: string; unidad: string }
    sensor?: { 
      sensorid: number; 
      sensor: string; 
      nombre: string; 
      tipoid: number;
      tipo?: { tipoid: number; tipo: string } 
    }
  }
  // Campos legacy para compatibilidad - usados para indexación
  metricaid: number
  nodoid: number
  sensorid: number
  tipoid: number
  ubicacionid: number
}

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

interface MeasurementPoint {
  name: string;
  ids: number[];
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
      // ... more code ...
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
      color: "#3b82f6",
      unit: "uS/cm",
      dataKey: "conductividad",
      description: "Conductividad eléctrica del sustrato",
      ranges: { min: 0.5, max: 2.5, optimal: [1.0, 1.8] }
    }
  ], [t])
  
  const [mediciones, setMediciones] = useState<MedicionData[]>([])
  // Mediciones usadas exclusivamente para el análisis detallado (modal grande)
  const [detailedMediciones, setDetailedMediciones] = useState<MedicionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entidades, setEntidades] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [isModalExpanded, setIsModalExpanded] = useState(false)
  const [metricas, setMetricas] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [sensores, setSensores] = useState<any[]>([])
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null)
  const [selectedMetricForAnalysis, setSelectedMetricForAnalysis] = useState<MetricConfig | null>(null)
  const [selectedDetailedMetric, setSelectedDetailedMetric] = useState<string>('temperatura')
  const [detailedStartDate, setDetailedStartDate] = useState<string>('')
  const [detailedEndDate, setDetailedEndDate] = useState<string>('')
  const [tempStartDate, setTempStartDate] = useState<string>('') // Estado temporal para evitar carga automática
  const [tempEndDate, setTempEndDate] = useState<string>('') // Estado temporal para evitar carga automática
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([])
  const [selectedPointName, setSelectedPointName] = useState<string | null>(null)
  const [loadingLocalizaciones, setLoadingLocalizaciones] = useState(false)
  
  // Helper para obtener etiqueta de serie de datos (agrupación inteligente)
  const getSeriesLabel = useCallback((medicion: any) => {
    const locName = medicion.localizacion?.localizacion || `Punto ${medicion.localizacionid}`
    
    // Obtener información del sensor desde el estado global
    const sensorId = medicion.localizacion?.sensorid || medicion.sensorid
    const sensorInfo = sensores.find(s => s.sensorid === sensorId)
    const sensorName = sensorInfo?.sensor || sensorInfo?.nombre || sensorInfo?.modelo || sensorInfo?.deveui
    
    // Obtener información del tipo
    const tipoId = sensorInfo?.tipoid || medicion.tipoid
    const tipoInfo = tipos.find((t: any) => t.tipoid === tipoId)
    const tipoName = tipoInfo?.tipo || 'Sensor'
    
    // Construir etiqueta descriptiva: "Tipo - Sensor"
    let sensorLabel = tipoName
    if (sensorName && sensorName !== tipoName) {
      sensorLabel = `${tipoName} - ${sensorName}`
    }

    // Si estamos filtrando por un punto específico (agrupado por nombre), 
    // solo mostramos el tipo/sensor para que el gráfico sea más legible.
    if (selectedPointName && locName === selectedPointName) {
      return sensorLabel
    }
    
    // Si no hay punto seleccionado, mostrar Localización + Tipo/Sensor
    return `${locName} (${sensorLabel})`
  }, [tipos, sensores, selectedPointName])

  const selectedPointIds = useMemo(() => {
    return measurementPoints.find(p => p.name === selectedPointName)?.ids || [];
  }, [measurementPoints, selectedPointName]);
  
  // Efecto para manejar cambios en selectedNode
  useEffect(() => {
    if (selectedNode) {
      // Nodo seleccionado cambió
    } else {
      // Limpiar localizaciones cuando no hay nodo seleccionado
      setMeasurementPoints([]);
      setSelectedPointName(null);
    }
  }, [selectedNode])

  // Cargar localizaciones cuando cambia el nodo seleccionado
  useEffect(() => {
    if (!selectedNode?.nodoid) return;

    const fetchLocalizaciones = async () => {
      setLoadingLocalizaciones(true);
      try {
        const data = await JoySenseService.getLocalizacionesByNodo(selectedNode.nodoid);
        const activeLocalizaciones = data.filter((l: any) => l.statusid === 1);
        
        // Agrupar por nombre de localización (campo 'localizacion')
        const pointsMap = new Map<string, number[]>();
        activeLocalizaciones.forEach((loc: any) => {
          const name = loc.localizacion;
          if (!pointsMap.has(name)) {
            pointsMap.set(name, []);
          }
          pointsMap.get(name)?.push(loc.localizacionid);
        });

        const points: MeasurementPoint[] = Array.from(pointsMap.entries()).map(([name, ids]) => ({
          name,
          ids
        }));

        setMeasurementPoints(points);
        
        // Auto-seleccionar si solo hay un punto físico (agrupado)
        if (points.length === 1) {
          setSelectedPointName(points[0].name);
        } else if (points.length > 1) {
          setSelectedPointName(null);
        } else {
          setSelectedPointName(null);
        }
      } catch (err) {
        console.error('[ModernDashboard] Error loading localizations:', err);
      } finally {
        setLoadingLocalizaciones(false);
      }
    };

    fetchLocalizaciones();
  }, [selectedNode?.nodoid])
  
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
          console.log('[ModernDashboard] Using global date filters:', { start: filters.startDate, end: filters.endDate });
          
          const startDateFormatted = `${filters.startDate} 00:00:00`
          const endDateFormatted = `${filters.endDate} 23:59:59`
          
          try {
            const data = await JoySenseService.getMediciones({
              nodoid: selectedNode.nodoid,
              localizacionId: selectedPointIds.length > 0 ? selectedPointIds.join(',') : undefined,
              startDate: startDateFormatted,
              endDate: endDateFormatted,
              limit: DATA_LIMITS.RANGE_SELECTED
            })
            
            const dataArray = Array.isArray(data) ? data : (data ? [data] : [])
            if (dataArray.length > 0) {
              allData = dataArray
              console.log('[ModernDashboard] Data loaded using global filters. Count:', allData.length);
            }
          } catch (error: any) {
            console.error('[ModernDashboard] Error loading with global filters:', error);
            // Fallback a estrategia progresiva si hay error de timeout/500
          }
        }

        // 2. ESTRATEGIA PROGRESIVA: Solo si no se obtuvieron datos con los filtros globales
        if (allData.length === 0) {
          console.log('[ModernDashboard] No data from global filters or no filters provided. Using progressive strategy.');
          
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
                localizacionId: selectedPointIds.length > 0 ? selectedPointIds.join(',') : undefined,
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
        console.log('[ModernDashboard] loadMediciones: Request key changed during fetch. Canceling.');
        return
      }
      
      if (thisNodeId !== null && Number(selectedNode?.nodoid) !== Number(thisNodeId)) {
        console.log('[ModernDashboard] loadMediciones: Node changed after fetch. Canceling.');
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
        console.log('[ModernDashboard] loadMediciones: Request key changed before update. Canceling.');
        return
      }
      
      if (thisNodeId !== null && Number(selectedNode?.nodoid) !== Number(thisNodeId)) {
        console.log('[ModernDashboard] loadMediciones: Node changed before update. Canceling.');
        return
      }

      // No filtrar por tiempo aquí - cada métrica hará su propio filtrado de 3 horas
      // Transformar datos para agregar campos legacy
      const transformed = transformMedicionData(sortedData)
      console.log('[ModernDashboard] Data transformed. Count:', transformed.length, 'Sample:', transformed.slice(0, 2));
      
      setMediciones(transformed)
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
  }, [filters.entidadId, filters.ubicacionId, filters.startDate, filters.endDate, selectedNode?.nodoid, selectedPointIds])

  // Crear array de dependencias estable para evitar warnings de React
  // IMPORTANTE: Cuando hay un nodo seleccionado, NO incluir ubicacionId en las dependencias
  // para evitar doble renderizado cuando ubicacionId cambia después de seleccionar el nodo
  const useEffectDependencies = useMemo(() => {
    const deps = [
      filters.entidadId, 
      filters.startDate,
      filters.endDate,
      selectedNode?.nodoid, 
      selectedPointIds,
      loadMediciones
    ]
    // Solo incluir ubicacionId si NO hay nodo seleccionado
    // Cuando hay nodo, el nodoid es suficiente y ubicacionId puede cambiar sin afectar la carga
    if (!selectedNode && filters.ubicacionId) {
      deps.push(filters.ubicacionId)
    }
    return deps
  }, [filters.entidadId, filters.startDate, filters.endDate, selectedNode?.nodoid, selectedPointIds, loadMediciones, selectedNode])

  // Cargar datos de mediciones con debouncing y cancelación mejorada
  useEffect(() => {
    // Si hay un nodo seleccionado, no requerir filtros (podemos usar nodoid directamente)
    // Si no hay nodo seleccionado, requerir ambos filtros
    const requiresUbicacionId = !selectedNode
    const hasRequiredFilters = selectedNode ? true : (filters.entidadId && (requiresUbicacionId ? filters.ubicacionId : true))
    
    if (!hasRequiredFilters) {
      // Si no hay filtros y hay un nodo seleccionado, limpiar mediciones para evitar mostrar datos del nodo anterior
      if (selectedNode) {
        console.log('[ModernDashboard] useEffect: Missing filters for selectedNode, clearing');
        setMediciones([])
        setLoading(false)
      }
      return
    }
    
    // Si cambió el nodo, limpiar mediciones inmediatamente para mostrar loading
    const previousNodeId = currentRequestNodeIdRef.current
    const currentNodeId = selectedNode?.nodoid || null
    if (previousNodeId !== null && Number(previousNodeId) !== Number(currentNodeId)) {
      console.log('[ModernDashboard] useEffect: Node changed from', previousNodeId, 'to', currentNodeId, '. Clearing mediciones.');
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
    
    console.log('[ModernDashboard] useEffect: Setting timeout for loadMediciones in', debounceTime, 'ms');
    
    // Debounce: esperar antes de cargar
    loadMedicionesTimeoutRef.current = setTimeout(() => {
      // Verificar que el nodo no haya cambiado durante el debounce
      if (Number(expectedNodeId) !== Number(selectedNode?.nodoid || null)) {
        console.log('[ModernDashboard] useEffect: Node changed during debounce. Canceling.');
        return
      }
      
      // Verificar nuevamente que los filtros requeridos estén disponibles
      const stillRequiresUbicacionId = !selectedNode
      const stillHasRequiredFilters = selectedNode ? true : (filters.entidadId && (stillRequiresUbicacionId ? filters.ubicacionId : true))
      
      if (!stillHasRequiredFilters) {
        console.log('[ModernDashboard] useEffect: Missing filters after debounce. Canceling.');
        return
      }
      
      // Marcar esta como la petición actual
      currentRequestKeyRef.current = requestKey
      currentRequestNodeIdRef.current = expectedNodeId
      
      // Cargar datos
      console.log('[ModernDashboard] useEffect: Calling loadMediciones now.');
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
      console.log('[ModernDashboard] loadMedicionesForDetailedAnalysis: missing selectedNode');
      setLoadingDetailedData(false)
      return
    }

    if (signal?.aborted) {
      setLoadingDetailedData(false)
      return
    }

    setLoadingDetailedData(true)
    
    try {
      const formatDateForBackend = (dateStr: string, isEnd: boolean = false) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        if (isEnd) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 23:59:59`
        }
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`
      }

      const startDateFormatted = formatDateForBackend(startDateStr, false)
      const endDateFormatted = formatDateForBackend(endDateStr, true)
      
      console.log('[ModernDashboard] loadMedicionesForDetailedAnalysis: Dates for backend:', { 
        startDateFormatted, 
        endDateFormatted 
      });

      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number)
      const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
      
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number)
      const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      
      let filteredData: any[] = []
      
      let maxLimit = 15000 
      if (daysDiff > 30) maxLimit = 50000
      else if (daysDiff > 14) maxLimit = 30000
      else if (daysDiff > 7) maxLimit = 20000
      
      console.log('[ModernDashboard] loadMedicionesForDetailedAnalysis: Fetching from API', {
        nodoid: selectedNode.nodoid,
        startDateFormatted,
        endDateFormatted,
        maxLimit
      });

      try {
        const response = await JoySenseService.getMediciones({
          entidadId: filters.entidadId ?? undefined,
          nodoid: selectedNode.nodoid,
          localizacionId: selectedPointIds.length > 0 ? selectedPointIds.join(',') : undefined,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          limit: maxLimit
        })
        
        filteredData = Array.isArray(response) ? response : []
        console.log('[ModernDashboard] loadMedicionesForDetailedAnalysis: API response records:', filteredData.length);
        
      } catch (error: any) {
        console.error('[ModernDashboard] loadMedicionesForDetailedAnalysis: API Error:', error);
        if (error.message?.includes('500') || error.message?.includes('timeout') || error.message?.includes('57014')) {
          filteredData = []
        } else {
          throw error 
        }
      }

      if (!Array.isArray(filteredData)) {
        filteredData = []
      }

      // Ordenar cronológicamente (API devuelve desc)
      const sortedFilteredData = [...filteredData]
        .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a, b) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }) => m)
      
      const transformedData = transformMedicionData(sortedFilteredData)
      console.log('[ModernDashboard] loadMedicionesForDetailedAnalysis: Final transformed data count:', transformedData.length);
      
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
  }, [filters.entidadId, selectedNode, selectedPointIds])

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
        
        // Debug: mostrar localizaciones cargadas
        console.log('[ModernDashboard] localizacionesPorNodo updated:', { 
          nodoid: selectedNode.nodoid, 
          nombres,
          count: localizaciones.length 
        });
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
          // Obtener todos los nodos con localizaciones
          const nodes = await JoySenseService.getNodosConLocalizacion()
          
          // Filtrar nodos: excluir solo el nodo actual
          // Mostrar todos los demás nodos (la verificación de mediciones se hace cuando se selecciona)
          const filteredNodes = (nodes || []).filter((node: any) => {
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
  }, [showDetailedAnalysis, selectedNode?.nodoid])

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
      console.log('[ModernDashboard] loadEntidades: Respuesta recibida:', { count: data?.length || 0, data });
      setEntidades(data)
    } catch (err) {
      console.error("[ModernDashboard] loadEntidades: Error:", err)
    }
  }

  const loadUbicaciones = async () => {
    console.log('[ModernDashboard] loadUbicaciones: Iniciando...');
    try {
      const data = await JoySenseService.getUbicaciones()
      console.log('[ModernDashboard] loadUbicaciones: Respuesta recibida:', { count: data?.length || 0, data });
      setUbicaciones(data)
    } catch (err) {
      console.error("[ModernDashboard] loadUbicaciones: Error:", err)
    }
  }

  const loadMetricas = async () => {
    console.log('[ModernDashboard] loadMetricas: Iniciando...');
    try {
      const data = await JoySenseService.getMetricas()
      console.log('[ModernDashboard] loadMetricas: Respuesta recibida:', { count: data?.length || 0, data });
      setMetricas(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data.length > 0) {
        setSelectedMetrica(data[0].metricaid)
      }
    } catch (err) {
      console.error("[ModernDashboard] loadMetricas: Error:", err)
    }
  }

  const loadTipos = async () => {
    console.log('[ModernDashboard] loadTipos: Iniciando...');
    try {
      const data = await JoySenseService.getTipos()
      console.log('[ModernDashboard] loadTipos: Respuesta recibida:', { count: data?.length || 0, data });
      setTipos(Array.isArray(data) ? data : [])
      setTiposDisponibles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("[ModernDashboard] loadTipos: Error:", err)
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
    const sourceMediciones = useCustomRange && detailedMediciones.length > 0 ? detailedMediciones : mediciones
    
    if (!sourceMediciones.length || !tipos.length || !selectedNode) return []

    // 1. Filtrar por Nodo y Métrica
    const metricMediciones = sourceMediciones.filter(m => {
      if (Number(m.nodoid) !== Number(selectedNode.nodoid)) return false
      const rawMetricName = m.localizacion?.metrica?.metrica || ''
      const metricName = rawMetricName.replace(/[\r\n]/g, ' ').trim().toLowerCase()
      if (dataKey === 'temperatura' && (metricName.includes('temperatura') || metricName.includes('temp'))) return true
      if (dataKey === 'humedad' && (metricName.includes('humedad') || metricName.includes('humidity'))) return true
      if (dataKey === 'conductividad' && (metricName.includes('conductividad') || metricName.includes('electroconductividad') || metricName.includes('conductivity'))) return true
      return false
    })
    
    console.log('[ModernDashboard] processChartData: after metric filter:', metricMediciones.length);

    if (!metricMediciones.length) return []

    // 2. Ordenar y Filtrar por Rango (si es fallback)
    const sortedMediciones = [...metricMediciones].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    let filteredMediciones = sortedMediciones
    let timeSpan = 3 * 60 * 60 * 1000
    
    if (useCustomRange && detailedStartDate && detailedEndDate) {
      const [sY, sM, sD] = detailedStartDate.split('-').map(Number);
      const startDate = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      const [eY, eM, eD] = detailedEndDate.split('-').map(Number);
      const endDate = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      
      console.log('[ModernDashboard] processChartData applying custom range filter:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Aplicar filtro de fecha siempre que sea un rango personalizado
      filteredMediciones = sortedMediciones.filter(m => {
        const d = new Date(m.fecha).getTime();
        return d >= startDate.getTime() && d <= endDate.getTime();
      })
      console.log('[ModernDashboard] processChartData: filtered records for range:', filteredMediciones.length);
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
      console.log('[ModernDashboard] processChartData applying global filters:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        count: filteredMediciones.length
      });
      timeSpan = endDate.getTime() - startDate.getTime()
    } else if (sortedMediciones.length > 0) {
      const latest = new Date(sortedMediciones[sortedMediciones.length - 1].fecha).getTime()
      filteredMediciones = sortedMediciones.filter(m => new Date(m.fecha).getTime() >= latest - 3 * 60 * 60 * 1000)
      console.log('[ModernDashboard] processChartData: fallback 3h filter:', filteredMediciones.length);
    }

    if (filteredMediciones.length === 0) return []

    // 3. Determinar Granularidad y Agrupar
    const hoursSpan = timeSpan / (1000 * 60 * 60)
    const daysSpan = hoursSpan / 24
    const pointCount = filteredMediciones.length
    
    // Decidir granularidad: 
    // - Si hay más de 2 días: días
    // - Si hay más de 1000 puntos: horas
    // - Si no, 15 minutos
    let useDays = overrideGranularity ? overrideGranularity.useDays : (daysSpan >= 2)
    let useHours = overrideGranularity ? overrideGranularity.useHours : (!useDays && (hoursSpan >= 48 || pointCount > 1000))
    
    console.log('[ModernDashboard] processChartData granularidad:', { hoursSpan, daysSpan, pointCount, useDays, useHours });

    const locsEnMediciones = Array.from(new Set(filteredMediciones.map(m => m.localizacionid).filter(id => id != null)))
    
    const performGrouping = (data: any[], d: boolean, h: boolean) => {
      const grouped: { [locid: number]: any[] } = {}
      locsEnMediciones.forEach(id => { grouped[id] = [] })
      
      data.forEach(m => {
        const date = new Date(m.fecha)
        let timeKey: string
        if (d) timeKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
        else if (h) timeKey = `${String(date.getHours()).padStart(2, '0')}:00`
        else {
          const roundedMin = Math.floor(date.getMinutes() / 15) * 15
          timeKey = `${String(date.getHours()).padStart(2, '0')}:${String(roundedMin).padStart(2, '0')}`
        }
        
        const label = getSeriesLabel(m)
        const existing = (grouped[m.localizacionid] || []).find(p => p.time === timeKey)
        if (existing) {
          existing.value = (existing.value * existing.count + m.medicion) / (existing.count + 1)
          existing.count += 1
        } else {
          grouped[m.localizacionid].push({ timestamp: date.getTime(), time: timeKey, value: m.medicion, count: 1, label })
        }
      })
      return grouped
    }

    let groupedData = performGrouping(filteredMediciones, useDays, useHours)
    
    // Fallback de resolución si hay muy pocos puntos (solo si no hay override)
    if (!overrideGranularity) {
      if (useDays && locsEnMediciones.every(id => (groupedData[id] || []).length <= 2) && filteredMediciones.length >= 3) {
        useDays = false; useHours = true;
        groupedData = performGrouping(filteredMediciones, useDays, useHours)
      }
      if (useHours && locsEnMediciones.every(id => (groupedData[id] || []).length <= 2) && filteredMediciones.length >= 3) {
        useHours = false;
        groupedData = performGrouping(filteredMediciones, useDays, useHours)
      }
    }

    // 4. Formatear para Recharts
    const allTimestamps = new Set<number>()
    Object.values(groupedData).forEach(list => list.forEach(p => {
      const date = new Date(p.timestamp)
      let ts: number
      if (useDays) ts = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      else if (useHours) ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime()
      else ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / 15) * 15).getTime()
      allTimestamps.add(ts)
    }))

    const sortedTimes = Array.from(allTimestamps).sort((a, b) => a - b).map(ts => {
      const date = new Date(ts)
      if (useDays) return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
      if (useHours) return `${String(date.getHours()).padStart(2, '0')}:00`
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    })

    const finalData = sortedTimes.map(time => {
      const entry: any = { time }
      let hasValue = false
      locsEnMediciones.forEach(id => {
        const point = (groupedData[id] || []).find(p => p.time === time)
        if (point) {
          let val = point.value
          if (useCustomRange) {
            const { min, max } = yAxisDomain
            if ((min !== null && val < min) || (max !== null && val > max)) val = null
          }
          if (val !== null) { entry[point.label] = val; hasValue = true }
        }
      })
      return hasValue ? entry : null
    }).filter(e => e !== null)

    console.log('[ModernDashboard] processChartData: final data count:', finalData.length);
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

  const getCurrentValue = (dataKey: string) => {
    if (!mediciones.length || !selectedNode) return 0
    
    // Filtrar mediciones del nodo seleccionado
    const nodeMediciones = mediciones.filter(m => {
      const matchNode = Number(m.nodoid) === Number(selectedNode.nodoid);
      // REMOVIDO: No filtrar por punto seleccionado
      return matchNode;
    })
    
    // Buscar mediciones que coincidan con el dataKey por nombre de métrica
    const matchingMediciones = nodeMediciones.filter(m => {
      const metricName = m.localizacion?.metrica?.metrica?.toLowerCase() || ''
      
      if (dataKey === 'temperatura' && (
        metricName.includes('temperatura') || metricName.includes('temp')
      )) return true
      
      if (dataKey === 'humedad' && (
        metricName.includes('humedad') || metricName.includes('humidity')
      )) return true
      
      if (dataKey === 'conductividad' && (
        metricName.includes('conductividad') || 
        metricName.includes('electroconductividad') ||
        metricName.includes('conductivity')
      )) return true
      
      return false
    })
    
    if (!matchingMediciones.length) {
      return 0
    }
    
    // Obtener la medición más reciente
    const latest = matchingMediciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
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
    
    console.log('[ModernDashboard] openDetailedAnalysis: Setting initial 24h range', { 
      startDateStr, 
      endDateStr
    });
    
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
    
    // Usar detailedMediciones si están disponibles (en el modal de análisis detallado)
    const dataSource = detailedMediciones.length > 0 ? detailedMediciones : mediciones
    
    // Obtener métricas únicas del nodo desde la fuente de datos
    const nodeMediciones = dataSource.filter(m => {
      const matchNode = Number(m.nodoid) === Number(selectedNode.nodoid);
      // REMOVIDO: No filtrar por punto seleccionado para mostrar visión global del nodo
      return matchNode;
    })
    const uniqueMetricIds = new Set<number>()
    nodeMediciones.forEach(m => {
      if (m.metricaid) {
        uniqueMetricIds.add(Number(m.metricaid))
      }
    })
    
    console.log('[ModernDashboard] Unique metric IDs found:', Array.from(uniqueMetricIds));

    if (uniqueMetricIds.size === 0) {
      return getTranslatedMetrics;
    }

    // Filtrar las métricas traducidas para mostrar solo las que tienen datos
    const filtered = getTranslatedMetrics.filter(metric => {
      // Buscar si hay alguna medición con una métrica que coincida con el nombre
      const hasData = Array.from(uniqueMetricIds).some(metricaId => {
        // Buscar una medición con este metricaid y verificar si el nombre coincide
        const medicion = nodeMediciones.find(m =>
          Number(m.metricaid) === Number(metricaId)
        )

        if (!medicion) {
          return false
        }

        // Obtener el nombre de la métrica desde los datos expandidos o inferirlo
        // Limpiar espacios, saltos de línea y caracteres especiales
        const rawMetricName = medicion.localizacion?.metrica?.metrica || ''

        // Si no hay nombre expandido, intentar acceder directamente a la tabla metrica
        let finalMetricName = rawMetricName;
        if (!finalMetricName && medicion.metricaid) {
          // Nota: Esto es async, pero estamos en un filter sync, así que por ahora usamos lo que tenemos
        }

        const metricName = finalMetricName
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .trim()
          .toLowerCase()

        // Mapear nombres comunes (más flexible para manejar variaciones)
        if (metric.id === 'temperatura' && (
          metricName.includes('temperatura') ||
          metricName.includes('temp')
        )) {
          console.log(`[ModernDashboard] ✅ MATCH: temperatura con "${metricName}"`);
          return true
        }

        if (metric.id === 'humedad' && (
          metricName.includes('humedad') ||
          metricName.includes('humidity')
        )) {
          console.log(`[ModernDashboard] ✅ MATCH: humedad con "${metricName}"`);
          return true
        }

        if (metric.id === 'conductividad' && (
          metricName.includes('conductividad') ||
          metricName.includes('electroconductividad') ||
          metricName.includes('conductivity')
        )) {
          console.log(`[ModernDashboard] ✅ MATCH: conductividad con "${metricName}"`);
          return true
        }

        console.log(`[ModernDashboard] ❌ NO MATCH: ${metric.id} con "${metricName}"`);
        return false
      })

      console.log(`[ModernDashboard] Métrica ${metric.id} hasData: ${hasData}`);
      return hasData
    })
    
    console.log('[ModernDashboard] availableMetrics calculated:', filtered.map(m => m.id), 'nodeMediciones total:', nodeMediciones.length);
    return filtered
  }, [getTranslatedMetrics, mediciones, detailedMediciones, selectedNode])

  // Memoizar verificación de datos por métrica (verifica si hay datos recientes - últimos 30 días)
  // Los datos se cargan en rangos de 1, 7, 14, 30 días, así que consideramos "recientes" los últimos 30 días
  const hasMetricData = useCallback((dataKey: string) => {
    if (!mediciones.length || !selectedNode) {
      return false
    }
    
    // Buscar métricas que coincidan con el dataKey
    const nodeMediciones = mediciones.filter(m => {
      const matchNode = Number(m.nodoid) === Number(selectedNode.nodoid);
      // REMOVIDO: No filtrar por punto seleccionado
      return matchNode;
    })
    
    if (nodeMediciones.length === 0) {
      // Log only once per metric to avoid console flood
      if (Math.random() < 0.01) {
        console.log(`[ModernDashboard] hasMetricData: No measurements for node ${selectedNode.nodoid} in ${mediciones.length} total measurements`);
      }
    }
    
    // Buscar por nombre de métrica en los datos expandidos
    const matchingMediciones = nodeMediciones.filter(m => {
      // Limpiar espacios, saltos de línea y caracteres especiales
      const rawMetricName = m.localizacion?.metrica?.metrica || ''
      const metricName = rawMetricName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .trim()
        .toLowerCase()
      
      if (dataKey === 'temperatura' && (
        metricName.includes('temperatura') || metricName.includes('temp')
      )) return true
      
      if (dataKey === 'humedad' && (
        metricName.includes('humedad') || metricName.includes('humidity')
      )) return true
      
      if (dataKey === 'conductividad' && (
        metricName.includes('conductividad') || 
        metricName.includes('electroconductividad') ||
        metricName.includes('conductivity')
      )) return true
      
      return false
    })
    
    if (!matchingMediciones.length) {
      return false
    }
    
    // Verificar si hay datos recientes (últimos 30 días)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Ordenar por fecha descendente (más recientes primero)
    const sortedMediciones = [...matchingMediciones].sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
    
    // Verificar si la medición más reciente está dentro de los últimos 30 días
    const mostRecentDate = new Date(sortedMediciones[0].fecha)
    const hasRecentData = mostRecentDate >= thirtyDaysAgo
    
    return hasRecentData
  }, [mediciones, selectedNode])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 overflow-y-auto dashboard-scrollbar-blue">
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
            try {
              setSelectedNode(nodeData)
            } catch (error) {
              console.error('Error al actualizar selectedNode:', error);
            }
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

        {/* REMOVIDO: El selector de puntos físicos ya no es necesario para filtrar las métricas, 
            ya que ahora se muestran todas las líneas por sensor en cada gráfico de métrica. */}

        {/* Loading State - Mostrar después del mapa, donde van los gráficos */}
        {loading && selectedNode && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                  className={`bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-500/20 p-6 group ${
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

                  <div className="flex items-baseline justify-end space-x-2 mb-4">
                    <span className="text-3xl font-bold text-blue-500 font-mono">
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
                          <YAxis hide domain={['auto', 'auto']} />
                          {(() => {
                            const chartData = processChartData(metric.dataKey)
                            if (chartData.length === 0) return null
                            
                            // Obtener TODAS las claves únicas de series (excluyendo 'time') de todo el set de datos
                            const allSeriesKeys = Array.from(
                              new Set(
                                chartData.flatMap(item => Object.keys(item).filter(key => key !== 'time'))
                              )
                            )
                            
                            const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#10b981']
                            
                            return allSeriesKeys.map((seriesKey, index) => (
                              <Line
                                key={seriesKey}
                                type="monotone"
                                dataKey={seriesKey}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: colors[index % colors.length], stroke: colors[index % colors.length], strokeWidth: 2 }}
                                strokeOpacity={0.8}
                                connectNulls={true}
                                isAnimationActive={false}
                            />
                          ))
                        })()}
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
                          className="px-3 py-1.5 text-xs font-mono tracking-wider bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
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
                          ? 'text-neutral-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 group-hover:scale-110'
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
                    {availableMetrics.length > 0 ? (
                      availableMetrics.map((metric) => (
                        <button
                          key={metric.id}
                          onClick={() => setSelectedDetailedMetric(metric.dataKey)}
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
                  
                  {/* Información del nodo debajo de las pestañas */}
                  {selectedNode && (
                    <div className="mt-4 px-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                      <div className="text-xs font-mono space-y-1.5 text-gray-700 dark:text-neutral-300">
                        {/* Localización */}
                        {(() => {
                          const localizaciones = localizacionesPorNodo.get(selectedNode.nodoid)
                          // Usar un Set para asegurar que no haya nombres duplicados en la visualización
                          const uniqueLocalizaciones = Array.from(new Set(localizaciones || []))
                          const nameToShow = selectedPointName || (uniqueLocalizaciones.length > 0 ? uniqueLocalizaciones.join(', ') : null)
                          return nameToShow ? (
                            <div className="truncate pl-2">
                              <span className="text-gray-500 dark:text-neutral-500">Localización:</span> {nameToShow}
                            </div>
                          ) : null
                        })()}
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
                            <div className="pl-4 text-xs space-y-0.5">
                              <div>Lat.: {selectedNode.latitud}</div>
                              <div>Lon.: {selectedNode.longitud}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                    {(() => {
                      const metricId = getMetricIdFromDataKey(selectedDetailedMetric)
                      const dataSource = detailedMediciones.length > 0 ? detailedMediciones : mediciones
                      const metricMediciones = dataSource.filter(m => m.metricaid === metricId)
                      const tiposDisponiblesSet = new Set<string>()
                      
                      // Obtener tipos del nodo principal
                      metricMediciones.forEach(m => {
                        const tipoId = m.tipoid || m.localizacion?.sensor?.tipoid || m.localizacion?.sensor?.tipoid
                        const tipo = tipos.find(t => t.tipoid === tipoId)
                        if (tipo) {
                          tiposDisponiblesSet.add(tipo.tipo)
                        } else if (tipoId) {
                          console.warn('[ModernDashboard] Legend: Tipo no encontrado para tipoId:', tipoId, 'en medicion:', m.medicionid);
                        }
                      })
                      
                      // Obtener tipos del nodo de comparación si existe
                      if (comparisonNode && comparisonMediciones.length > 0) {
                        const comparisonMetricMediciones = comparisonMediciones.filter(m => m.metricaid === metricId)
                        console.log('[ModernDashboard] Legend: comparisonMetricMediciones size:', comparisonMetricMediciones.length);
                        
                        comparisonMetricMediciones.forEach(m => {
                          const tipoId = m.tipoid || m.localizacion?.sensor?.tipoid
                          const tipo = tipos.find(t => t.tipoid === tipoId)
                          if (tipo) {
                            tiposDisponiblesSet.add(tipo.tipo)
                          }
                        })
                      }
                    
                    const tiposArray = Array.from(tiposDisponiblesSet).sort()
                    console.log('[ModernDashboard] Legend: Final tiposArray:', tiposArray);
                    
                    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
                    const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4']
                    
                    if (tiposArray.length === 0) {
                      console.log('[ModernDashboard] Legend: No hay tipos para mostrar');
                      return null
                    }
                    
                    return (
                      <div className="mt-4 px-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                        <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 mb-2 font-mono">
                          Leyenda:
                        </div>
                        <div className="space-y-3">
                          {tiposArray.map((tipoNombre, index) => {
                            const isVisible = visibleTipos.size === 0 || visibleTipos.has(tipoNombre)
                            const color = colors[index % colors.length]
                            const compColor = comparisonColors[index % comparisonColors.length]
                            
                            // Obtener nodos que tienen este tipo
                            const nodosConEsteTipo: Array<{ nodo: string; color: string; isComparison: boolean }> = []
                            
                            // Verificar si este tipo existe en el nodo principal
                            const existsInMain = metricMediciones.some(m => {
                              const tipoId = m.tipoid || m.localizacion?.sensor?.tipoid
                              const tipo = tipos.find(t => t.tipoid === tipoId)
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
                              const tipoId = m.tipoid || m.localizacion?.sensor?.tipoid
                              const tipo = tipos.find(t => t.tipoid === tipoId)
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
                                {/* Nombre del tipo de sensor (sin checkbox global) */}
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-mono text-gray-700 dark:text-neutral-300 font-bold uppercase tracking-wider">
                                    {tipoNombre}
                                  </span>
                                </div>
                                
                                {/* Nodos con este tipo, con sus propios checkboxes */}
                                {nodosConEsteTipo.map((nodoInfo, nodoIndex) => {
                                  const key = `${nodoInfo.isComparison ? 'comp' : 'main'}:${tipoNombre}`
                                  const isVisible = visibleTipos.has(key)
                                  
                                  return (
                                    <div key={`${tipoNombre}-${nodoIndex}`} className="flex items-center space-x-2 pl-4 py-1">
                                      <input
                                        type="checkbox"
                                        checked={isVisible}
                                        onChange={(e) => {
                                          const newVisibleTipos = new Set(visibleTipos)
                                          if (e.target.checked) {
                                            newVisibleTipos.add(key)
                                          } else {
                                            newVisibleTipos.delete(key)
                                          }
                                          setVisibleTipos(newVisibleTipos)
                                        }}
                                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-neutral-600 text-blue-500 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <div 
                                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${nodoInfo.isComparison ? 'border-2 border-dashed' : ''}`}
                                        style={{ 
                                          backgroundColor: nodoInfo.isComparison ? 'transparent' : nodoInfo.color,
                                          borderColor: nodoInfo.isComparison ? nodoInfo.color : undefined
                                        }}
                                      />
                                      <span className={`text-xs font-mono truncate ${nodoInfo.isComparison ? 'text-indigo-500 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-neutral-300'}`}>
                                        {nodoInfo.nodo}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Visualizar umbral */}
                        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                          <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 mb-3 font-mono">
                            Visualizar umbral:
                          </div>
                          <div className="space-y-3">
                            {/* Combobox Nodo */}
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-neutral-400 mb-1 font-mono">
                                Nodo:
                              </label>
                              <select
                                value={umbralNodoSeleccionado || ''}
                                onChange={(e) => {
                                  const nodoId = e.target.value ? parseInt(e.target.value) : null
                                  setUmbralNodoSeleccionado(nodoId)
                                  setUmbralTipoSeleccionado(null) // Reset tipo cuando cambia el nodo
                                  setUmbralTiposSeleccionados([]) // Reset tipos múltiples cuando cambia el nodo
                                  setUmbralData(null)
                                  setUmbralAplicado(false) // Reset aplicación cuando cambia el nodo
                                }}
                                className="w-full h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-xs font-mono text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="" disabled hidden>Seleccionar nodo...</option>
                                {(() => {
                                  // Si hay nodo de comparación, mostrar solo ambos nodos
                                  if (comparisonNode) {
                                    const nodosParaMostrar = []
                                    if (selectedNode) {
                                      nodosParaMostrar.push(selectedNode)
                                    }
                                    if (comparisonNode) {
                                      nodosParaMostrar.push(comparisonNode)
                                    }
                                    return nodosParaMostrar.map((nodo) => (
                                      <option key={nodo.nodoid} value={nodo.nodoid}>
                                        {nodo.nodo}
                                      </option>
                                    ))
                                  } else {
                                    // Si no hay comparación, mostrar solo el nodo seleccionado
                                    if (selectedNode) {
                                      return (
                                        <option value={selectedNode.nodoid}>
                                          {selectedNode.nodo}
                                        </option>
                                      )
                                    }
                                    return null
                                  }
                                })()}
                              </select>
                            </div>
                            
                            {/* Selector Tipo Sensor */}
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-neutral-400 mb-1 font-mono">
                                Tipo Sensor:
                              </label>
                              {(() => {
                                if (!umbralNodoSeleccionado) {
                                  return (
                                    <select
                                      disabled={true}
                                      className="w-full h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-xs font-mono text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="" disabled hidden>Seleccionar tipo...</option>
                                    </select>
                                  )
                                }
                                
                                // Obtener tipos de sensor para el nodo seleccionado
                                const metricId = getMetricIdFromDataKey(selectedDetailedMetric)
                                const nodoSeleccionado = umbralNodoSeleccionado === selectedNode?.nodoid 
                                  ? selectedNode 
                                  : (comparisonNode && umbralNodoSeleccionado === comparisonNode.nodoid ? comparisonNode : null)
                                
                                if (!nodoSeleccionado) return null
                                
                                // Obtener mediciones del nodo seleccionado
                                const medicionesDelNodo = umbralNodoSeleccionado === selectedNode?.nodoid
                                  ? mediciones.filter(m => m.metricaid === metricId)
                                  : (comparisonMediciones.filter(m => m.metricaid === metricId))
                                
                                // Obtener tipos únicos de las mediciones
                                const tiposDelNodo = new Set<number>()
                                medicionesDelNodo.forEach(m => {
                                  if (m.tipoid !== undefined && m.tipoid !== null) {
                                  tiposDelNodo.add(m.tipoid)
                                  }
                                })
                                
                                // Filtrar tipos disponibles que tienen umbrales
                                const tiposConUmbral = tipos
                                  .filter(t => tiposDelNodo.has(t.tipoid) && umbralesDisponibles[t.tipoid])
                                
                                // Detectar grupos de tipos con el mismo umbral
                                const gruposPorUmbral: { [key: string]: number[] } = {}
                                tiposConUmbral.forEach(tipo => {
                                  const umbral = umbralesDisponibles[tipo.tipoid]
                                  if (umbral) {
                                    const key = `${umbral.minimo}-${umbral.maximo}`
                                    if (!gruposPorUmbral[key]) {
                                      gruposPorUmbral[key] = []
                                    }
                                    gruposPorUmbral[key].push(tipo.tipoid)
                                  }
                                })
                                
                                // Verificar si hay grupos con más de un tipo (umbrales iguales)
                                const gruposConMultiplesTipos = Object.values(gruposPorUmbral).filter(grupo => grupo.length > 1)
                                const hayUmbralesIguales = gruposConMultiplesTipos.length > 0
                                
                                // Obtener el texto del mensaje basado en cuántos tipos tienen el mismo umbral
                                const gruposConMultiples = Object.entries(gruposPorUmbral)
                                  .filter(([_, grupo]) => grupo.length > 1)
                                  .map(([_, grupo]) => grupo.length)
                                const maxTipos = gruposConMultiples.length > 0 ? Math.max(...gruposConMultiples) : 2
                                const mensajeTooltip = maxTipos > 2 
                                  ? `${maxTipos} tipos de sensor tienen el mismo rango de umbral`
                                  : "Ambos tipos de sensor tienen el mismo rango de umbral"
                                
                                // Texto a mostrar en el botón
                                const tiposSeleccionadosNombres = tiposConUmbral
                                  .filter(t => umbralTiposSeleccionados.includes(t.tipoid))
                                  .map(t => t.tipo)
                                const textoBoton = tiposSeleccionadosNombres.length > 0
                                  ? tiposSeleccionadosNombres.join(', ')
                                  : (umbralTipoSeleccionado 
                                    ? tiposConUmbral.find(t => t.tipoid === umbralTipoSeleccionado)?.tipo || "Seleccionar tipo..."
                                    : "Seleccionar tipo...")
                                
                                return (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setTipoSensorDropdownOpen(!tipoSensorDropdownOpen)}
                                      disabled={!umbralNodoSeleccionado}
                                      className={`w-full h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-xs font-mono text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between ${
                                        hayUmbralesIguales ? 'pr-6' : ''
                                      }`}
                                    >
                                      <span className="truncate">{textoBoton}</span>
                                      {hayUmbralesIguales && (
                                        <div className="relative group">
                                          <span className="ml-2 text-blue-500 cursor-help">
                                            ⓘ
                                          </span>
                                          <div className="absolute bottom-full left-full ml-2 mb-0 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs font-mono rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                                            {mensajeTooltip}
                                            <div className="absolute top-2 -left-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                                          </div>
                                        </div>
                                      )}
                                      <span className="ml-2 text-gray-500">▼</span>
                                    </button>
                                    
                                    {tipoSensorDropdownOpen && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-10" 
                                          onClick={() => setTipoSensorDropdownOpen(false)}
                                        />
                                        <div className="absolute z-20 w-full bottom-full mb-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded shadow-lg max-h-48 overflow-y-auto">
                                          {tiposConUmbral.map((tipo) => {
                                            const isSelected = umbralTiposSeleccionados.includes(tipo.tipoid) || umbralTipoSeleccionado === tipo.tipoid
                                            return (
                                              <label 
                                                key={tipo.tipoid} 
                                                className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      const nuevosTipos = hayUmbralesIguales 
                                                        ? [...umbralTiposSeleccionados, tipo.tipoid]
                                                        : [tipo.tipoid]
                                                      setUmbralTiposSeleccionados(nuevosTipos)
                                                      setUmbralTipoSeleccionado(tipo.tipoid) // Mantener para compatibilidad
                                                      // Actualizar umbralData si todos los tipos seleccionados tienen el mismo umbral
                                                      if (nuevosTipos.length > 0 && umbralesDisponibles[tipo.tipoid]) {
                                                        const primerUmbral = umbralesDisponibles[nuevosTipos[0]]
                                                        if (primerUmbral) {
                                                          const todosIguales = nuevosTipos.every(tipoid => {
                                                            const umbral = umbralesDisponibles[tipoid]
                                                            return umbral && umbral.minimo === primerUmbral.minimo && umbral.maximo === primerUmbral.maximo
                                                          })
                                                          if (todosIguales) {
                                                            setUmbralData(primerUmbral)
                                                          } else {
                                                            setUmbralData(null)
                                                          }
                                                        }
                                                      }
                                                    } else {
                                                      const nuevosTipos = umbralTiposSeleccionados.filter(id => id !== tipo.tipoid)
                                                      setUmbralTiposSeleccionados(nuevosTipos)
                                                      if (nuevosTipos.length === 0) {
                                                        setUmbralTipoSeleccionado(null)
                                                        setUmbralData(null)
                                                      } else if (nuevosTipos.length === 1) {
                                                        setUmbralTipoSeleccionado(nuevosTipos[0])
                                                        if (umbralesDisponibles[nuevosTipos[0]]) {
                                                          setUmbralData(umbralesDisponibles[nuevosTipos[0]])
                                                        }
                                                      } else {
                                                        // Verificar si todos los tipos restantes tienen el mismo umbral
                                                        const primerUmbral = umbralesDisponibles[nuevosTipos[0]]
                                                        if (primerUmbral) {
                                                          const todosIguales = nuevosTipos.every(tipoid => {
                                                            const umbral = umbralesDisponibles[tipoid]
                                                            return umbral && umbral.minimo === primerUmbral.minimo && umbral.maximo === primerUmbral.maximo
                                                          })
                                                          if (todosIguales) {
                                                            setUmbralData(primerUmbral)
                                                          } else {
                                                            setUmbralData(null)
                                                          }
                                                        }
                                                      }
                                                    }
                                                    setUmbralAplicado(false)
                                                    if (!hayUmbralesIguales) {
                                                      setTipoSensorDropdownOpen(false)
                                                    }
                                                  }}
                                                  className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-500 focus:ring-blue-500"
                                                />
                                                <span className="text-xs font-mono text-gray-700 dark:text-neutral-300 flex-1">
                                                  {tipo.tipo}
                                                </span>
                                              </label>
                                            )
                                          })}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                            
                            {/* Botones Aplicar y Quitar */}
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  // Verificar si hay tipos seleccionados (múltiples o único)
                                  const tiposValidos = umbralTiposSeleccionados.length > 0 
                                    ? umbralTiposSeleccionados 
                                    : (umbralTipoSeleccionado ? [umbralTipoSeleccionado] : [])
                                  
                                  if (umbralNodoSeleccionado && tiposValidos.length > 0 && umbralData) {
                                    // Ajustar el eje Y antes de aplicar
                                    ajustarEjeYParaUmbrales()
                                    setUmbralAplicado(true)
                                  }
                                }}
                                disabled={!umbralNodoSeleccionado || (umbralTiposSeleccionados.length === 0 && !umbralTipoSeleccionado) || !umbralData || umbralAplicado}
                                className="flex-1 h-8 px-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-xs font-mono transition-colors"
                              >
                                Aplicar
                              </button>
                              <button
                                onClick={() => {
                                  setUmbralAplicado(false)
                                  // Resetear eje Y a valores por defecto
                                  setYAxisDomain({ min: null, max: null })
                                  // Restaurar tipos visibles cuando se quita el umbral
                                  if (tipos.length > 0) {
                                    const allTipos = tipos.map(t => t.tipo)
                                    setVisibleTipos(new Set(allTipos))
                                  }
                                }}
                                disabled={!umbralAplicado}
                                className="flex-1 h-8 px-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-xs font-mono transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    )
                  })()}
              </div>
              
                {/* Contenido principal */}
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900 dashboard-scrollbar-blue relative">
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
                              className={`h-8 w-40 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={{
                                colorScheme: 'dark',
                                WebkitAppearance: 'none'
                              }}
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
                              className={`h-8 w-40 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={{
                                colorScheme: 'dark',
                                WebkitAppearance: 'none'
                              }}
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
                            disabled={loadingDetailedData || (!mediciones.length && !detailedMediciones.length)}
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
                            className="h-8 px-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white font-mono text-xs min-w-[200px] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors dashboard-scrollbar-blue"
                          >
                            <option value="" disabled hidden>Ninguno</option>
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
                        {selectedPointName && ` - ${selectedPointName}`}
                        {comparisonNode && ` vs ${comparisonNode.nodo}`}
                      </h3>
                    </div>
                    {(() => {
                      // Definir variables de tiempo que faltaban (necesarias para processComparisonData)
                      // Estas deben coincidir con la lógica de processChartData cuando useCustomRange es true
                      const useCustomRange = true;
                      let startDate = new Date();
                      let endDate = new Date();
                      
                      if (detailedStartDate && detailedEndDate) {
                        const [sYear, sMonth, sDay] = detailedStartDate.split('-').map(Number);
                        startDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
                        
                        const [eYear, eMonth, eDay] = detailedEndDate.split('-').map(Number);
                        endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
                      }
                      
                      const timeSpan = endDate.getTime() - startDate.getTime();
                      const hoursSpan = timeSpan / (1000 * 60 * 60);
                      const daysSpan = hoursSpan / 24;
                      
                      // Granularidad mejorada para el gráfico detallado: usar días si el intervalo es >= 2 días
                      const useDays = daysSpan >= 2;
                      const useHours = !useDays && hoursSpan >= 48;
                      const granularity = { useDays, useHours };

                      // Si está cargando, siempre mostrar pantalla de carga (ocultar gráfico anterior)
                      if (loadingDetailedData) {
                        return (
                          <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                              <div className="text-gray-600 dark:text-neutral-400 text-lg font-mono">
                                Cargando datos...
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      const chartData = processChartData(selectedDetailedMetric, true, granularity);
                      // Verificar que hay datos del nodo principal
                      if (chartData.length === 0) {
                        console.warn('⚠️ No hay datos del nodo principal para el rango seleccionado')
                      }
                      
                      // Procesar datos de comparación si están disponibles
                      // CRÍTICO: Usar EXACTAMENTE la misma lógica de granularidad que processChartData
                      // para asegurar que las claves de tiempo coincidan perfectamente
                      const processComparisonData = (comparisonData: any[], dataKey: string): any[] => {
                        if (!comparisonData.length || !tipos.length) return []
                        
                        // 1. Filtrar por Métrica
                        const metricMediciones = comparisonData.filter(m => {
                          const rawMetricName = m.localizacion?.metrica?.metrica || ''
                          const metricName = rawMetricName.replace(/[\r\n]/g, ' ').trim().toLowerCase()
                          if (dataKey === 'temperatura' && (metricName.includes('temperatura') || metricName.includes('temp'))) return true
                          if (dataKey === 'humedad' && (metricName.includes('humedad') || metricName.includes('humidity'))) return true
                          if (dataKey === 'conductividad' && (metricName.includes('conductividad') || metricName.includes('electroconductividad') || metricName.includes('conductivity'))) return true
                          return false
                        })
                        
                        console.log('[ModernDashboard] processComparisonData: after metric filter:', metricMediciones.length);
                        if (!metricMediciones.length) return []

                        // 2. Ordenar y Filtrar por Rango
                        const sortedMediciones = [...metricMediciones].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                        const filteredMediciones = sortedMediciones.filter(m => {
                          const d = new Date(m.fecha).getTime()
                          return d >= startDate.getTime() && d <= endDate.getTime()
                        })
                        
                        console.log('[ModernDashboard] processComparisonData: after range filter:', filteredMediciones.length);
                        if (filteredMediciones.length === 0) return []
                        
                        const locsEnMediciones = Array.from(new Set(filteredMediciones.map(m => m.localizacionid).filter((id): id is number => id !== undefined && id !== null)))

                        const performGrouping = (data: any[]) => {
                          const grouped: { [locid: number]: any[] } = {}
                          locsEnMediciones.forEach((locid: number) => { grouped[locid] = [] })
                          
                          data.forEach(medicion => {
                            if (medicion.localizacionid === undefined || medicion.localizacionid === null) return
                            
                            const date = new Date(medicion.fecha)
                            let timeKey: string
                            
                            if (useDays) {
                              timeKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
                            } else if (useHours) {
                              timeKey = `${String(date.getHours()).padStart(2, '0')}:00`
                            } else {
                              const roundedMinutes = Math.floor(date.getMinutes() / 15) * 15
                              timeKey = `${String(date.getHours()).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`
                            }
                            
                            const label = getSeriesLabel(medicion)
                            const existingPoint = (grouped[medicion.localizacionid] || []).find(p => p.time === timeKey)
                            
                            if (existingPoint) {
                              const currentValue = existingPoint.value
                              const currentCount = existingPoint.count
                              existingPoint.value = (currentValue * currentCount + medicion.medicion) / (currentCount + 1)
                              existingPoint.count = currentCount + 1
                            } else {
                              if (!grouped[medicion.localizacionid]) grouped[medicion.localizacionid] = []
                              grouped[medicion.localizacionid].push({
                                timestamp: date.getTime(),
                                time: timeKey,
                                value: medicion.medicion,
                                count: 1,
                                locid: medicion.localizacionid,
                                label: label
                              })
                            }
                          })
                          return grouped
                        }

                        let datosPorLoc = performGrouping(filteredMediciones)
                        
                        // Si hay muy pocos puntos por localización, intentar granularidad más fina
                        const locsConPocosPuntos = locsEnMediciones.filter(locid => (datosPorLoc[locid] || []).length <= 2)
                        if (locsConPocosPuntos.length === locsEnMediciones.length && locsEnMediciones.length > 0 && filteredMediciones.length >= 3) {
                          if (useDays) {
                            console.log('[ModernDashboard] processComparisonData: fallback to hours');
                            // Nota: esto puede romper el alineamiento si el nodo principal no hizo fallback
                            // useDays = false; useHours = true; // Evitamos modificar las variables de cierre para mantener consistencia
                            // En su lugar, deberíamos usar lo que processChartData decidió.
                          }
                        }

                        const allTimeStamps = new Set<number>()
                        locsEnMediciones.forEach(locid => {
                          (datosPorLoc[locid] || []).forEach(p => {
                            const date = new Date(p.timestamp)
                            let periodStart: Date
                            if (useDays) periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                            else if (useHours) periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours())
                            else {
                              const roundedMinutes = Math.floor(date.getMinutes() / 15) * 15
                              periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), roundedMinutes)
                            }
                            allTimeStamps.add(periodStart.getTime())
                          })
                        })
                        
                        const allTimes = Array.from(allTimeStamps).sort((a, b) => a - b).map(ts => {
                          const date = new Date(ts)
                          if (useDays) return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
                          if (useHours) return `${String(date.getHours()).padStart(2, '0')}:00`
                          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                        })
                        
                        const result = allTimes.map(time => {
                          const point: any = { time }
                          let hasAnyValue = false
                          locsEnMediciones.forEach(locid => {
                            const locData = (datosPorLoc[locid] || []).find(p => p.time === time)
                            if (locData) {
                              let value: number | null = locData.value
                              if (useCustomRange && value !== null) {
                                const { min, max } = yAxisDomain
                                const hasMinLimit = min !== null && !isNaN(min)
                                const hasMaxLimit = max !== null && !isNaN(max)
                                if ((hasMinLimit && value < min!) || (hasMaxLimit && value > max!)) {
                                  value = null
                                }
                              }
                              if (value !== null && value !== undefined) {
                                point[locData.label] = value
                                hasAnyValue = true
                              }
                            }
                          })
                          return hasAnyValue ? point : null
                        }).filter(p => p !== null)

                        console.log('[ModernDashboard] processComparisonData: final data count:', result.length);
                        return result
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
                      
                      // Filtrar puntos que no tienen ningún valor válido después del filtrado del eje Y
                      const finalChartDataFiltered = Array.from(timeMap.values()).filter(p => {
                        // Verificar si el punto tiene al menos un valor no-null
                        let hasAnyValue = false
                        Object.keys(p).forEach(key => {
                          if (key !== 'time' && p[key] !== null && p[key] !== undefined && !isNaN(p[key])) {
                            hasAnyValue = true
                          }
                        })
                        return hasAnyValue
                      })
                      
                      // Verificar que los datos del nodo principal se preservaron
                      const preservedMainData = finalChartDataFiltered.filter(p => {
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
                        } else {
                          console.warn('⚠️ No se encontraron claves comp_ en los datos combinados', {
                            chartDataLength: chartData.length,
                            comparisonChartDataLength: comparisonChartData.length,
                            chartDataSample: chartData[0],
                            comparisonSample: comparisonChartData[0]
                          })
                        }
                      }
                      
                      const finalChartData = finalChartDataFiltered.sort((a, b) => {
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
                      // Obtener todas las claves disponibles en los datos
                      const allKeys = Array.from(
                        new Set(
                          finalChartData.flatMap(item => Object.keys(item).filter(key => key !== 'time'))
                        )
                      )
                      
                      const mainKeys = allKeys.filter(k => !k.startsWith('comp_'))
                      const compKeys = allKeys.filter(k => k.startsWith('comp_'))
                      
                      // 1. Filtrar mainKeys solo por umbrales (para la leyenda)
                      let legendMainKeys = mainKeys
                      if (umbralAplicado && umbralNodoSeleccionado) {
                        const tiposValidos = umbralTiposSeleccionados.length > 0 
                          ? umbralTiposSeleccionados 
                          : (umbralTipoSeleccionado ? [umbralTipoSeleccionado] : [])
                        
                        if (tiposValidos.length > 0) {
                          const tiposSeleccionados = tipos.filter(t => tiposValidos.includes(t.tipoid))
                          const nombresTipos = tiposSeleccionados.map(t => t.tipo)
                          legendMainKeys = mainKeys.filter(key => 
                            nombresTipos.some(vTipo => key.includes(`(${vTipo}`) || key.startsWith(`${vTipo} -`) || key === vTipo)
                          )
                        }
                      }

                      // 2. Filtrar legendMainKeys por visibilidad (para las LÍNEAS del gráfico)
                      const filteredMainKeys = legendMainKeys.filter(key => {
                        if (visibleTipos.size === 0) return true
                        return Array.from(visibleTipos).some(vKey => {
                          if (!vKey.startsWith('main:')) return false
                          const vTipo = vKey.replace('main:', '')
                          return key.includes(`(${vTipo}`) || key.startsWith(`${vTipo} -`) || key === vTipo
                        })
                      })
                      
                      // 3. Filtrar compKeys por visibilidad (para las LÍNEAS del gráfico)
                      const filteredCompKeys = compKeys.filter(key => {
                        if (visibleTipos.size === 0) return true
                        const originalKey = key.replace('comp_', '')
                        return Array.from(visibleTipos).some(vKey => {
                          if (!vKey.startsWith('comp:')) return false
                          const vTipo = vKey.replace('comp:', '')
                          return originalKey.includes(`(${vTipo}`) || originalKey.startsWith(`${vTipo} -`) || originalKey === vTipo
                        })
                      })
                      
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
                            domain={(() => {
                              const calculatedDomain = (() => {
                                // Si hay valores min/max definidos, usarlos estrictamente como array fijo
                                if (yAxisDomain.min !== null && !isNaN(yAxisDomain.min) && yAxisDomain.max !== null && !isNaN(yAxisDomain.max)) {
                                  return [yAxisDomain.min, yAxisDomain.max]
                                }
                                if (yAxisDomain.min !== null && !isNaN(yAxisDomain.min)) {
                                  // Si solo hay min, calcular max desde los datos
                                  const allValues: number[] = []
                                  finalChartData.forEach(point => {
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
                                  // Si solo hay max, calcular min desde los datos
                                  const allValues: number[] = []
                                  finalChartData.forEach(point => {
                                    Object.keys(point).forEach(key => {
                                      if (key !== 'time' && typeof point[key] === 'number' && !isNaN(point[key])) {
                                        allValues.push(point[key])
                                      }
                                    })
                                  })
                                  const dataMin = allValues.length > 0 ? Math.min(...allValues) : yAxisDomain.max - 10
                                  return [dataMin, yAxisDomain.max]
                                }
                                // Si no hay límites, usar auto
                                return ['auto', 'auto']
                              })();
                              return calculatedDomain;
                            })()}
                            allowDataOverflow={false}
                            allowDecimals={true}
                            type="number"
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
                            // mainKeys, compKeys, colors y comparisonColors ya están definidos arriba
                            
                            return (
                              <>
                                {/* Líneas de referencia para umbrales - solo cuando está aplicado */}
                                {umbralAplicado && umbralData && umbralNodoSeleccionado && (
                                  (umbralTiposSeleccionados.length > 0 || umbralTipoSeleccionado) && (
                                    <>
                                      <ReferenceLine 
                                        y={umbralData.minimo} 
                                        stroke="#ef4444" 
                                        strokeDasharray="3 3" 
                                        strokeWidth={2}
                                        label={{ value: `Min: ${umbralData.minimo}`, position: "insideTopLeft", fill: "#ef4444", fontSize: 11, fontWeight: "bold" }}
                                      />
                                      <ReferenceLine 
                                        y={umbralData.maximo} 
                                        stroke="#ef4444" 
                                        strokeDasharray="3 3" 
                                        strokeWidth={2}
                                        label={{ value: `Max: ${umbralData.maximo}`, position: "insideTopRight", fill: "#ef4444", fontSize: 11, fontWeight: "bold" }}
                                      />
                                    </>
                                  )
                                )}
                                {/* Líneas del nodo principal */}
                                {filteredMainKeys.length > 0 ? (
                                  filteredMainKeys.map((tipoKey, index) => {
                                    // Recalcular el índice basado en la posición original en mainKeys
                                    const originalIndex = mainKeys.indexOf(tipoKey)
                                    const strokeColor = colors[originalIndex % colors.length]
                                    
                                    // Función para determinar el color del punto basado en umbrales
                                    const getDotColor = (value: number | null) => {
                                      if (value === null || value === undefined || isNaN(value)) return strokeColor
                                      // Solo pintar de rojo si los umbrales están aplicados
                                      if (umbralAplicado && umbralData && umbralNodoSeleccionado && (umbralTiposSeleccionados.length > 0 || umbralTipoSeleccionado)) {
                                        if (value < umbralData.minimo || value > umbralData.maximo) {
                                          return '#ef4444' // Rojo si está fuera del umbral
                                        }
                                      }
                                      return strokeColor
                                    }
                                    
                                    return (
                                      <Line
                                        key={tipoKey}
                                        type="monotone"
                                        dataKey={tipoKey}
                                        stroke={strokeColor}
                                        strokeWidth={3}
                                        dot={(props: any) => {
                                          const value = props.payload?.[tipoKey]
                                          // No mostrar punto si el valor es null
                                          if (value === null || value === undefined || isNaN(value)) {
                                            return <g key={`dot-empty-${props.index}`} /> // Retornar grupo vacío en lugar de null
                                          }
                                          const fillColor = getDotColor(value)
                                          return <circle key={`dot-${tipoKey}-${props.index}`} cx={props.cx} cy={props.cy} r={4} fill={fillColor} />
                                        }}
                                        activeDot={{ r: 6, fill: strokeColor }}
                                        connectNulls={true}
                                        isAnimationActive={true}
                                        animationDuration={300}
                                      />
                                    )
                                  })
                                ) : null}
                                {/* Líneas del nodo de comparación (con estilo punteado) */}
                                {filteredCompKeys.length > 0 ? (
                                  filteredCompKeys.map((compKey, index) => {
                                    const originalIndex = compKeys.indexOf(compKey)
                                    const strokeColor = comparisonColors[originalIndex % comparisonColors.length]
                                    return (
                                      <Line
                                        key={compKey}
                                        type="monotone"
                                        dataKey={compKey}
                                        stroke={strokeColor}
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={(props: any) => {
                                          const value = props.payload?.[compKey]
                                          // No mostrar punto si el valor es null
                                          if (value === null || value === undefined || isNaN(value)) {
                                            return <g key={`dot-comp-empty-${props.index}`} /> // Retornar grupo vacío en lugar de null
                                          }
                                          return <circle key={`dot-comp-${compKey}-${props.index}`} cx={props.cx} cy={props.cy} r={3} fill={strokeColor} />
                                        }}
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
                              const rawName = isComparison ? name.replace('comp_', '') : name
                              // Simplificar la etiqueta: "Ubicación (Tipo)" -> "Tipo"
                              const simplifiedName = rawName.match(/\(([^)]+)\)/)?.[1] || rawName
                              
                              let displayName: string
                              if (isComparison) {
                                displayName = `${simplifiedName} (${comparisonNode?.nodo || 'Comp.'})`
                              } else {
                                displayName = comparisonNode 
                                  ? `${simplifiedName} (${selectedNode?.nodo || 'Original'})`
                                  : simplifiedName
                              }
                              return [
                                <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                                  {displayName}: {value ? value.toFixed(1) : '--'}
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
                          {/* Leyenda con checkboxes - siempre visible cuando hay datos */}
                          {finalChartData.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                              <div className="flex flex-wrap items-center gap-6 justify-center">
                                {/* Leyenda del nodo original */}
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                    {selectedNode?.nodo || 'Nodo Original'}
                                  </div>
                                  <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                                    {legendMainKeys.map((tipoKey) => {
                                      const originalIndex = mainKeys.indexOf(tipoKey)
                                      // Simplificar la etiqueta para la leyenda: "Ubicación (Tipo)" -> "Tipo"
                                      const simplifiedLabel = tipoKey.match(/\(([^)]+)\)/)?.[1] || tipoKey
                                      const isVisible = visibleTipos.has(`main:${simplifiedLabel}`)
                                      
                                      return (
                                        <div key={tipoKey} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={isVisible}
                                            onChange={(e) => {
                                              const newVisible = new Set(visibleTipos)
                                              if (e.target.checked) {
                                                newVisible.add(`main:${simplifiedLabel}`)
                                              } else {
                                                newVisible.delete(`main:${simplifiedLabel}`)
                                              }
                                              setVisibleTipos(newVisible)
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <div 
                                            className="w-4 h-1 rounded-full" 
                                            style={{ backgroundColor: colors[originalIndex % colors.length] }}
                                          />
                                          <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono font-bold">
                                            {simplifiedLabel}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                                
                                {/* Separador (solo si hay comparación) */}
                                {comparisonNode && <div className="w-px h-12 bg-gray-300 dark:bg-neutral-600"></div>}
                                
                                {/* Leyenda del nodo de comparación */}
                                {comparisonNode && (
                                  <div className="flex flex-col gap-2">
                                    <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                      {comparisonNode.nodo}
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                                      {(() => {
                                        if (loadingComparisonData) {
                                          return (
                                            <div className="text-xs text-gray-500 dark:text-neutral-500 font-mono italic">
                                              Cargando datos de comparación...
                                            </div>
                                          )
                                        }
                                        
                                        if (filteredCompKeys.length === 0 && compKeys.length === 0) {
                                          return (
                                            <div className="text-xs text-gray-500 dark:text-neutral-500 font-mono italic">
                                              Sin datos en este intervalo
                                            </div>
                                          )
                                        }
                                        
                                        return compKeys.map((compKey) => {
                                          const originalIndex = compKeys.indexOf(compKey)
                                          const originalKey = compKey.replace('comp_', '')
                                          // Simplificar la etiqueta para la leyenda: "Ubicación (Tipo)" -> "Tipo"
                                          const simplifiedLabel = originalKey.match(/\(([^)]+)\)/)?.[1] || originalKey
                                          const isVisible = visibleTipos.has(`comp:${simplifiedLabel}`)

                                          return (
                                            <div key={compKey} className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={isVisible}
                                                onChange={(e) => {
                                                  const newVisible = new Set(visibleTipos)
                                                  if (e.target.checked) {
                                                    newVisible.add(`comp:${simplifiedLabel}`)
                                                  } else {
                                                    newVisible.delete(`comp:${simplifiedLabel}`)
                                                  }
                                                  setVisibleTipos(newVisible)
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                              />
                                              <div 
                                                className="w-4 h-1 rounded-full border border-dashed" 
                                                style={{ borderColor: comparisonColors[originalIndex % comparisonColors.length], backgroundColor: 'transparent' }}
                                              />
                                              <span className="text-xs text-indigo-400 font-mono font-bold">
                                                {simplifiedLabel}
                                              </span>
                                            </div>
                                          )
                                        })
                                      })()}
                                    </div>
                                  </div>
                                )}
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
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono border-b border-gray-300 dark:border-neutral-700 pb-2">
                          {nodeName}
                        </h3>
                        {Object.keys(nodeRecommendations).map(label => {
                          const rec = nodeRecommendations[label]
                          
                          if (!rec) return null
                          
                          return (
                            <div
                              key={`${nodeId}_${label}`}
                              className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 border border-gray-300 dark:border-neutral-700"
                            >
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-white font-mono mb-3">
                                {label}
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
