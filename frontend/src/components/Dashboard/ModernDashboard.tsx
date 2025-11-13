import React, { useState, useEffect, useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { JoySenseService } from "../../services/backend-api"
import { NodeSelector } from "./NodeSelector"
import { useLanguage } from "../../contexts/LanguageContext"

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

export function ModernDashboard({ filters, onFiltersChange, onEntidadChange, onUbicacionChange }: ModernDashboardProps) {
  const { t } = useLanguage();
  
  // Función para obtener métricas con traducciones dinámicas
  const getTranslatedMetrics = (): MetricConfig[] => [
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
  ];
  const [mediciones, setMediciones] = useState<MedicionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entidades, setEntidades] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
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

  // Refs para cancelar requests y debouncing
  const loadMedicionesAbortControllerRef = useRef<AbortController | null>(null)
  const loadMedicionesTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadDetailedAnalysisAbortControllerRef = useRef<AbortController | null>(null)
  const loadDetailedAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función para cargar mediciones (declarada antes del useEffect que la usa)
  const loadMediciones = useCallback(async (signal?: AbortSignal) => {
    if (!filters.entidadId || !filters.ubicacionId) {
      setMediciones([])
      return
    }
    
    // Si el request fue cancelado, no continuar
    if (signal?.aborted) {
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // Si hay un nodo seleccionado, buscar todas las mediciones disponibles para ese nodo
      // Si no hay nodo seleccionado, limitar a las últimas 6 horas
      let allData
      
      if (selectedNode) {
        // Cuando hay nodo seleccionado, usar getAll: true para obtener TODOS los datos del nodo
        // Los sensores LoRaWAN emiten cada 15 minutos, así que necesitamos todos los datos
        // Filtrar por nodoid directamente en el backend para mayor eficiencia
        // IMPORTANTE: Usar los últimos 14 días para balancear entre datos recientes y evitar timeouts
        // Asegurar que endDate incluya el final del día actual para obtener todos los datos de hoy
        const now = new Date()
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) // Final del día actual
        const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000) // Últimos 14 días
        
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
        
        allData = await JoySenseService.getMediciones({
          entidadId: filters.entidadId,
          ubicacionId: filters.ubicacionId,
          nodoid: selectedNode.nodoid, // Filtrar por nodo en el backend
          startDate: startDateStr,
          endDate: endDateStr,
          getAll: true // Obtener TODOS los datos con paginación
        })
        
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

        allData = await JoySenseService.getMediciones({
          entidadId: filters.entidadId,
          ubicacionId: filters.ubicacionId,
          startDate: startDateStr,
          endDate: endDateStr,
          limit: 5000 // Límite razonable para las últimas horas
        })
      }

      // Verificar que allData sea un array
      if (!Array.isArray(allData)) {
        setMediciones([])
        setLoading(false)
        return
      }

      // Si ya se filtró por nodoid en el backend, no necesitamos filtrar de nuevo
      // El backend devuelve datos ordenados descendente (más recientes primero)
      // Ordenarlos ascendente para el procesamiento correcto
      let filteredData = allData
      
      if (filteredData.length === 0) {
        setMediciones([])
        setLoading(false)
        return
      }

      // Ordenar datos ascendente (más antiguos primero) para procesamiento correcto
      // Esto asegura que los datos más recientes estén al final y no se pierdan
      const sortedData = filteredData
        .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a, b) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }) => m)

      // Verificar si hay datos recientes
      if (sortedData.length > 0) {
        const lastDate = new Date(sortedData[sortedData.length - 1].fecha)
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const recentData = sortedData.filter(m => new Date(m.fecha) >= oneDayAgo)
        
        if (recentData.length === 0) {
          console.warn(`⚠️ No hay datos de las últimas 24 horas. Última fecha disponible: ${lastDate.toLocaleDateString('es-ES')}`)
        }
      } else {
        console.warn(`⚠️ No se cargaron datos para el nodo ${selectedNode?.nodoid}`)
      }

      // Mostrar métricas disponibles en los datos filtrados
      const metricasPresentes = Array.from(new Set(sortedData.map(m => m.metricaid))).sort()
      
      // No filtrar por tiempo aquí - cada métrica hará su propio filtrado de 3 horas
      setMediciones(sortedData)
      setError(null) // Limpiar cualquier error previo
    } catch (err: any) {
      // Ignorar errores de cancelación
      if (err.name === 'AbortError' || signal?.aborted) {
        return
      }
      
      // Solo mostrar errores críticos, no errores temporales o de "no hay datos"
      const errorMessage = err?.message || String(err)
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')
      const isServerError = errorMessage.includes('status: 500') || errorMessage.includes('HTTP error')
      
      // Si es un error de servidor o de red temporal, no mostrar error al usuario
      // Solo loguear para debugging
      if (isServerError || isNetworkError) {
        console.warn('⚠️ Error temporal al cargar mediciones (sin datos disponibles):', err)
        // Tratar como "sin datos" en lugar de error crítico
        setMediciones([])
        setError(null) // No mostrar error al usuario
      } else {
        // Error crítico no relacionado con datos, mostrar al usuario
        console.error("❌ Error crítico cargando mediciones:", err)
        setError("Error al cargar las mediciones")
      }
    } finally {
      // Solo actualizar loading si no fue cancelado
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [filters.entidadId, filters.ubicacionId, selectedNode?.nodoid])

  // Cargar datos de mediciones con debouncing y cancelación
  useEffect(() => {
    // Cancelar request anterior si existe
    if (loadMedicionesAbortControllerRef.current) {
      loadMedicionesAbortControllerRef.current.abort()
    }
    
    // Limpiar timeout anterior
    if (loadMedicionesTimeoutRef.current) {
      clearTimeout(loadMedicionesTimeoutRef.current)
    }
    
    // Crear nuevo AbortController
    const abortController = new AbortController()
    loadMedicionesAbortControllerRef.current = abortController
    
    // Debounce: esperar 300ms antes de cargar
    loadMedicionesTimeoutRef.current = setTimeout(() => {
      loadMediciones(abortController.signal)
    }, 300)
    
    // Cleanup
    return () => {
      if (loadMedicionesTimeoutRef.current) {
        clearTimeout(loadMedicionesTimeoutRef.current)
      }
      if (abortController) {
        abortController.abort()
      }
    }
  }, [filters.entidadId, filters.ubicacionId, selectedNode?.nodoid, loadMediciones])

  // Función para cargar mediciones para el análisis detallado con rango de fechas específico
  const loadMedicionesForDetailedAnalysis = useCallback(async (startDateStr: string, endDateStr: string, signal?: AbortSignal) => {
    if (!filters.entidadId || !filters.ubicacionId || !selectedNode) {
      return
    }

    // Si el request fue cancelado, no continuar
    if (signal?.aborted) {
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
      
      // Para el gráfico detallado, balancear entre suficientes datos y rendimiento
      // Sensores LoRaWAN emiten cada 15 min = 4 mediciones/hora por tipo/métrica
      // Estrategia: cargar suficientes datos pero con límites razonables
      let maxLimit = 20000 // Límite base balanceado
      let useGetAll = false
      
      if (daysDiff > 60) {
        // Rangos muy grandes: usar getAll con timeout (backend maneja el límite)
        useGetAll = true
      } else if (daysDiff > 30) {
        maxLimit = 30000
      } else if (daysDiff > 14) {
        maxLimit = 25000
      } else if (daysDiff > 7) {
        maxLimit = 20000
      } else {
        maxLimit = 15000 // Rangos pequeños: menos datos necesarios
      }
      
      // Filtrar por nodoid directamente en el backend para mayor eficiencia
      const filteredData = await JoySenseService.getMediciones({
        entidadId: filters.entidadId,
        ubicacionId: filters.ubicacionId,
        nodoid: selectedNode.nodoid, // Filtrar por nodo en el backend
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        getAll: useGetAll, // Solo usar getAll para rangos muy grandes
        limit: !useGetAll ? maxLimit : undefined // Limitar para rangos pequeños/medianos
      })

      // Verificar que filteredData sea un array
      if (!Array.isArray(filteredData)) {
        console.warn('⚠️ Datos no válidos recibidos del backend')
        return
      }

      // El backend devuelve datos ordenados descendente (más recientes primero)
      // Necesitamos ordenarlos ascendente para el procesamiento correcto
      const sortedFilteredData = filteredData
        .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a, b) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }) => m)
      
      // Logs de debug para análisis detallado
      if (sortedFilteredData.length > 0) {
        const firstDate = new Date(sortedFilteredData[0].fecha)
        const lastDate = new Date(sortedFilteredData[sortedFilteredData.length - 1].fecha)
        console.log(`📊 DEBUG loadMedicionesForDetailedAnalysis: Total registros: ${sortedFilteredData.length}`)
        console.log(`📅 DEBUG Rango solicitado: ${startDateStr} a ${endDateStr}`)
        console.log(`📅 DEBUG Fecha más antigua en datos: ${firstDate.toISOString()} (${firstDate.toLocaleDateString('es-ES')})`)
        console.log(`📅 DEBUG Fecha más reciente en datos: ${lastDate.toISOString()} (${lastDate.toLocaleDateString('es-ES')})`)
        
        // Verificar si los datos cubren el rango solicitado
        const requestedStart = new Date(startDateStr + 'T00:00:00')
        const requestedEnd = new Date(endDateStr + 'T23:59:59')
        if (lastDate < requestedEnd) {
          console.warn(`⚠️ DEBUG: Los datos no llegan hasta la fecha final solicitada! Última fecha: ${lastDate.toLocaleDateString('es-ES')}, Solicitada: ${requestedEnd.toLocaleDateString('es-ES')}`)
        }
      }
      
      // Actualizar mediciones con los nuevos datos
      // Combinar con datos existentes para no perder información de otras métricas
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
        return
      }
      console.error('❌ Error cargando datos para análisis detallado:', err)
      // No mostrar error al usuario, solo loguear
    } finally {
      // Solo actualizar loading si no fue cancelado
      if (!signal?.aborted) {
        setLoadingDetailedData(false)
      }
    }
  }, [filters.entidadId, filters.ubicacionId, selectedNode])

  // Cargar nodos disponibles cuando se abre el modal de análisis detallado
  useEffect(() => {
    if (showDetailedAnalysis) {
      const loadAvailableNodes = async () => {
        try {
          const nodes = await JoySenseService.getNodosConLocalizacion()
          setAvailableNodes(nodes || [])
        } catch (err) {
          console.error('Error cargando nodos disponibles:', err)
        }
      }
      loadAvailableNodes()
    }
  }, [showDetailedAnalysis])

  // Función para cargar mediciones del nodo de comparación
  const loadComparisonMediciones = useCallback(async (comparisonNode: any) => {
    if (!comparisonNode || !detailedStartDate || !detailedEndDate) {
      console.warn('⚠️ No se puede cargar comparación: faltan datos del nodo o fechas')
      return
    }

    // Obtener entidadId y ubicacionId del nodo de comparación directamente
    const comparisonEntidadId = comparisonNode.entidad?.entidadid
    const comparisonUbicacionId = comparisonNode.ubicacionid

    if (!comparisonEntidadId || !comparisonUbicacionId) {
      console.warn('⚠️ No se puede cargar comparación: el nodo no tiene entidadId o ubicacionId')
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
      
      let maxLimit = 20000
      let useGetAll = false
      
      if (daysDiff > 60) {
        useGetAll = true
      } else if (daysDiff > 30) {
        maxLimit = 30000
      } else if (daysDiff > 14) {
        maxLimit = 25000
      } else if (daysDiff > 7) {
        maxLimit = 20000
      } else {
        maxLimit = 15000
      }
      
      const comparisonData = await JoySenseService.getMediciones({
        entidadId: comparisonEntidadId,
        ubicacionId: comparisonUbicacionId,
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
      console.log(`✅ Datos de comparación cargados: ${sortedComparisonData.length} registros para nodo ${comparisonNode.nodo}`)
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
      alert('No hay datos suficientes para analizar la fluctuación del nodo principal')
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
  }, [mediciones, comparisonMediciones, tipos, detailedStartDate, detailedEndDate, selectedDetailedMetric, selectedNode, comparisonNode])

  // Función auxiliar para obtener metricId desde dataKey
  const getMetricIdFromDataKey = (dataKey: string): number => {
    const metricMap: { [key: string]: number } = {
      'temperatura': 1,
      'humedad': 2,
      'conductividad': 3
    }
    return metricMap[dataKey] || 1
  }

  // Recargar datos cuando cambien las fechas del análisis detallado (con debouncing)
  useEffect(() => {
    // Validar que las fechas sean válidas antes de cargar
    if (!showDetailedAnalysis || !detailedStartDate || !detailedEndDate || !selectedNode) {
      return
    }
    
    // Validar que la fecha inicial no sea mayor que la final
    if (new Date(detailedStartDate) > new Date(detailedEndDate)) {
      console.warn('⚠️ Fechas inválidas: fecha inicial mayor que fecha final')
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
    loadDetailedAnalysisTimeoutRef.current = setTimeout(() => {
      loadMedicionesForDetailedAnalysis(detailedStartDate, detailedEndDate, abortController.signal)
    }, 1000)
    
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
      const continuousSegment = findLastContinuousSegment(sortedMediciones, 2)
      
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
      
      // Si no hay segmento continuo, usar las últimas mediciones disponibles
      if (filteredMediciones.length === 0 && sortedMediciones.length > 0) {
        // Usar las últimas 50 mediciones como fallback
        const last50 = sortedMediciones.slice(-50)
        filteredMediciones = last50
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
            if (timeDiff > 6 * 60 * 60 * 1000) {
              console.warn(`⚠️ Gap significativo detectado en tipo ${tipoid}: ${Math.round(timeDiff / (60 * 60 * 1000))} horas`)
              break
            }
          }
        }
      }
    })
    
    // Verificar si después de agrupar tenemos muy pocos puntos por tipo
    // Esto es solo para logging - ya expandimos el rango antes de agrupar
    if (!useCustomRange && filteredMediciones.length > 0) {
      const tiposConPocosPuntos = tiposEnMediciones.filter(tipoid => 
        datosPorTipo[tipoid] && datosPorTipo[tipoid].length <= 2
      )
      
      if (tiposConPocosPuntos.length === tiposEnMediciones.length && tiposEnMediciones.length > 0) {
        // Todos los tipos tienen 2 o menos puntos - esto indica que el nodo tiene datos muy escasos
        console.warn(`⚠️ Todos los tipos tienen 2 o menos puntos después de agrupar. El nodo tiene datos muy escasos.`)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-900 text-green-300 border-green-700"
      default: return "bg-gray-900 text-gray-300 border-gray-700"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "normal": return "Normal"
      default: return "Sin datos"
    }
  }

  // Función para abrir análisis detallado de una métrica específica
  const openDetailedAnalysis = (metric: MetricConfig) => {
    setSelectedMetricForAnalysis(metric)
    setSelectedDetailedMetric(metric.dataKey)
    
    // Establecer intervalo inicial de 1 día hacia atrás desde hoy
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // 1 día hacia atrás
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    setDetailedStartDate(startDateStr)
    setDetailedEndDate(endDateStr)
    // Limpiar estados temporales al abrir el modal
    setTempStartDate('')
    setTempEndDate('')
    
    setShowDetailedAnalysis(true)
  }

  // chartData se calcula por métrica individualmente

  // Obtener métricas disponibles (solo las 3 principales)
  const getAvailableMetrics = () => {
    // Solo mostrar las 3 métricas principales: Temperatura, Humedad, Electroconductividad
    return getTranslatedMetrics()
  }

  // Verificar si una métrica tiene datos
  const hasMetricData = (dataKey: string) => {
    if (!mediciones.length) {
      return false
    }
    
    const metricId = getMetricIdFromDataKey(dataKey)
    const hasData = mediciones.some(m => m.metricaid === metricId)
    return hasData
  }

  const availableMetrics = getAvailableMetrics()

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
                      <span className="px-2 py-1 text-xs font-bold rounded-full border bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 font-mono tracking-wider">
                        {t('dashboard.no_data')}
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
                      <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-neutral-700/30 rounded-lg">
                        <div className="text-center text-gray-600 dark:text-neutral-500">
                          <div className="text-2xl mb-2">📊</div>
                          <div className="text-sm font-mono tracking-wider">{t('dashboard.no_data_available')}</div>
                        </div>
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

                  {/* Botón de lupa para análisis detallado */}
                  {hasData && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => openDetailedAnalysis(metric)}
                        className="p-2 text-neutral-400 group-hover:text-green-500 group-hover:bg-green-500/10 rounded-lg transition-all duration-200 group-hover:scale-110"
                        title="Ver análisis detallado"
                      >
                        <svg className="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Análisis Detallado */}
        {showDetailedAnalysis && selectedMetricForAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header con botones de métricas */}
              <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-neutral-700">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white font-mono tracking-wider">
                    {t('dashboard.detailed_analysis')}
                  </h2>
                  {/* Botones de métricas en el header */}
                  <div className="flex space-x-2">
                    {getTranslatedMetrics().map((metric) => (
                      <button
                        key={metric.id}
                        onClick={() => setSelectedDetailedMetric(metric.dataKey)}
                        disabled={loadingDetailedData}
                        className={`px-3 py-1 rounded-lg font-mono tracking-wider transition-colors text-sm ${
                          selectedDetailedMetric === metric.dataKey
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        } ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {metric.title}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailedAnalysis(false)
                    setSelectedMetricForAnalysis(null)
                  }}
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Contenido */}
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
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

                  {/* Controles en una sola fila con separadores - Layout compacto de 2 filas por sección */}
                  <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-4 mb-6">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Intervalo de Fechas */}
                      <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2">Intervalo Fechas:</label>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <input
                              type="date"
                              value={tempStartDate || detailedStartDate}
                              onChange={(e) => {
                                const newStartDate = e.target.value
                                setTempStartDate(newStartDate)
                                
                                if (newStartDate && newStartDate.length === 10 && newStartDate !== detailedStartDate) {
                                  flushSync(() => {
                                    setLoadingDetailedData(true)
                                    if (newStartDate && detailedEndDate && new Date(newStartDate) > new Date(detailedEndDate)) {
                                      setDetailedStartDate(newStartDate)
                                      setDetailedEndDate(newStartDate)
                                      setTempEndDate(newStartDate)
                                    } else {
                                      setDetailedStartDate(newStartDate)
                                    }
                                    setTempStartDate('')
                                  })
                                }
                              }}
                              onBlur={(e) => {
                                const newStartDate = e.target.value
                                if (newStartDate && newStartDate === tempStartDate && newStartDate !== detailedStartDate) {
                                  if (newStartDate && detailedEndDate && new Date(newStartDate) > new Date(detailedEndDate)) {
                                    setDetailedStartDate(newStartDate)
                                    setDetailedEndDate(newStartDate)
                                    setTempEndDate(newStartDate)
                                  } else {
                                    setDetailedStartDate(newStartDate)
                                  }
                                  setTempStartDate('')
                                }
                              }}
                              max={detailedEndDate || undefined}
                              disabled={loadingDetailedData}
                              className={`h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-xs ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <label className="text-xs text-gray-600 dark:text-neutral-400 mt-1 font-mono">{t('dashboard.date_start')}</label>
                          </div>
                          <div className="flex flex-col">
                            <input
                              type="date"
                              value={tempEndDate || detailedEndDate}
                              onChange={(e) => {
                                const newEndDate = e.target.value
                                setTempEndDate(newEndDate)
                                
                                if (newEndDate && newEndDate.length === 10 && newEndDate !== detailedEndDate) {
                                  if (newEndDate && detailedStartDate && new Date(newEndDate) < new Date(detailedStartDate)) {
                                    alert('La fecha final no puede ser menor que la fecha inicial. Por favor, seleccione una fecha válida.')
                                    setTempEndDate('')
                                    return
                                  }
                                  
                                  flushSync(() => {
                                    setLoadingDetailedData(true)
                                    setDetailedEndDate(newEndDate)
                                    setTempEndDate('')
                                  })
                                }
                              }}
                              onBlur={(e) => {
                                const newEndDate = e.target.value
                                if (newEndDate && newEndDate === tempEndDate && newEndDate !== detailedEndDate) {
                                  if (newEndDate && detailedStartDate && new Date(newEndDate) < new Date(detailedStartDate)) {
                                    alert('La fecha final no puede ser menor que la fecha inicial. Por favor, seleccione una fecha válida.')
                                    setTempEndDate('')
                                    return
                                  }
                                  setDetailedEndDate(newEndDate)
                                  setTempEndDate('')
                                }
                              }}
                              min={detailedStartDate || undefined}
                              disabled={loadingDetailedData}
                              className={`h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-xs ${loadingDetailedData ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <label className="text-xs text-gray-600 dark:text-neutral-400 mt-1 font-mono">{t('dashboard.date_end')}</label>
                          </div>
                        </div>
                      </div>

                      {/* Separador visual */}
                      <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

                      {/* Ajuste del eje Y */}
                      <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2">Ajuste Eje Y:</label>
                        <div className="flex items-center gap-2">
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
                      <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2">Analizar Fluctuación:</label>
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

                      {/* Separador visual */}
                      <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

                      {/* Selector de nodo para comparación */}
                      <div className="flex flex-col">
                        <label className="text-sm font-bold text-green-500 dark:text-green-400 font-mono mb-2 tracking-wider">Comparar con Nodo:</label>
                        <div className="flex items-center gap-2">
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
                            className="h-8 px-3 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white font-mono text-sm min-w-[200px] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors dashboard-scrollbar"
                            style={{
                              scrollbarWidth: 'thin',
                              scrollbarColor: '#22c55e #d1d5db'
                            }}
                          >
                            <option value="">Ninguno</option>
                            {availableNodes
                              .filter(n => n.nodoid !== selectedNode?.nodoid)
                              .map(node => (
                                <option key={node.nodoid} value={node.nodoid}>
                                  {node.nodo} - {node.ubicacion.ubicacion}
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
                      const chartData = processChartData(selectedDetailedMetric, true);
                      
                      // Procesar datos de comparación si están disponibles
                      // Usar la misma lógica que processChartData para asegurar que las claves de tiempo coincidan
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
                        
                        // Calcular el rango de tiempo para determinar la granularidad (igual que processChartData)
                        const timeSpan = endDate.getTime() - startDate.getTime()
                        const daysDiff = timeSpan / (1000 * 3600 * 24)
                        const hoursSpan = timeSpan / (1000 * 3600)
                        const isDateRange = daysDiff > 1
                        
                        // Determinar granularidad (igual que processChartData)
                        const useMinutes = !isDateRange && (filteredMediciones.length < 500 || hoursSpan < 48)
                        const useHours = !isDateRange && !useMinutes && hoursSpan < 168 // 7 días
                        const useDays = isDateRange && daysDiff > 7
                        
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
                                point[tipo.tipo] = tipoPoint.value
                              }
                            }
                          })
                          return point
                        })
                      }
                      
                      let comparisonChartData: any[] = []
                      if (comparisonMediciones.length > 0 && comparisonNode) {
                        comparisonChartData = processComparisonData(comparisonMediciones, selectedDetailedMetric)
                        console.log(`📊 DEBUG Comparación: ${comparisonChartData.length} puntos procesados para nodo ${comparisonNode.nodo}`)
                        if (comparisonChartData.length > 0) {
                          console.log(`📊 DEBUG Comparación - Primer punto:`, comparisonChartData[0])
                          console.log(`📊 DEBUG Comparación - Último punto:`, comparisonChartData[comparisonChartData.length - 1])
                        }
                      }
                      
                      // Combinar datos de comparación con datos principales
                      // Crear un mapa de tiempo para combinar eficientemente
                      const timeMap = new Map<string, any>()
                      chartData.forEach(point => {
                        timeMap.set(point.time, { ...point })
                      })
                      
                      comparisonChartData.forEach(point => {
                        const existing = timeMap.get(point.time) || { time: point.time }
                        Object.keys(point).forEach(key => {
                          if (key !== 'time') {
                            existing[`comp_${key}`] = point[key]
                          }
                        })
                        timeMap.set(point.time, existing)
                      })
                      
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
                      
                      // Debug: verificar que los datos de comparación estén presentes
                      if (comparisonChartData.length > 0 && finalChartData.length > 0) {
                        const samplePoint = finalChartData.find(p => {
                          const compKeys = Object.keys(p).filter(k => k.startsWith('comp_'))
                          return compKeys.length > 0
                        })
                        if (samplePoint) {
                          console.log(`✅ DEBUG: Datos de comparación combinados correctamente. Punto de ejemplo:`, samplePoint)
                        } else {
                          console.warn(`⚠️ DEBUG: No se encontraron datos de comparación en finalChartData. comparisonChartData tiene ${comparisonChartData.length} puntos, finalChartData tiene ${finalChartData.length} puntos`)
                        }
                      }
                      
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
                      const tipoKeys = Object.keys(finalChartData[0] || {}).filter(key => key !== 'time' && !key.startsWith('comp_'))
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
                            const comparisonKeys = Object.keys(finalChartData[0] || {}).filter(key => key.startsWith('comp_'))
                            
                            // Debug: verificar que las claves estén presentes
                            if (comparisonKeys.length > 0) {
                              console.log(`🔍 DEBUG Renderizado: ${comparisonKeys.length} líneas de comparación a renderizar:`, comparisonKeys)
                            }
                            
                            return (
                              <>
                                {/* Líneas del nodo principal */}
                                {tipoKeys.map((tipoKey, index) => (
                                  <Line
                                    key={tipoKey}
                                    type="monotone"
                                    dataKey={tipoKey}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: colors[index % colors.length] }}
                                    activeDot={{ r: 6, fill: colors[index % colors.length] }}
                                    connectNulls={true}
                                    isAnimationActive={true}
                                    animationDuration={300}
                                  />
                                ))}
                                {/* Líneas del nodo de comparación (con estilo punteado) */}
                                {comparisonKeys.map((compKey, index) => {
                                  const originalKey = compKey.replace('comp_', '')
                                  // Buscar el índice del tipo original en tipoKeys, o usar el índice de comparisonKeys como fallback
                                  let tipoIndex = tipoKeys.indexOf(originalKey)
                                  if (tipoIndex === -1) {
                                    // Si el tipo no está en el nodo principal, usar el índice de comparisonKeys
                                    tipoIndex = index
                                  }
                                  const strokeColor = comparisonColors[tipoIndex % comparisonColors.length]
                                  console.log(`🎨 DEBUG Renderizando línea de comparación: ${compKey} (originalKey: ${originalKey}, tipoIndex: ${tipoIndex}, color: ${strokeColor})`)
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
                                })}
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
                                  {displayName}: {value ? value.toFixed(1) : '--'} {getTranslatedMetrics().find(m => m.dataKey === selectedDetailedMetric)?.unit}
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
                                    {tipoKeys.map((tipoKey, index) => {
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
                                    })}
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
                                    {rec.min.toFixed(2)} {getTranslatedMetrics().find(m => m.dataKey === selectedDetailedMetric)?.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Umbral Máximo Recomendado</label>
                                  <div className="text-lg font-bold text-red-600 dark:text-red-400 font-mono">
                                    {rec.max.toFixed(2)} {getTranslatedMetrics().find(m => m.dataKey === selectedDetailedMetric)?.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Promedio</label>
                                  <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                                    {rec.avg.toFixed(2)} {getTranslatedMetrics().find(m => m.dataKey === selectedDetailedMetric)?.unit}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Desviación Estándar</label>
                                  <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                                    {rec.stdDev.toFixed(2)} {getTranslatedMetrics().find(m => m.dataKey === selectedDetailedMetric)?.unit}
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
