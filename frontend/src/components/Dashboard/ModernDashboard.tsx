import React, { useState, useEffect } from "react"
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
  const [selectedNode, setSelectedNode] = useState<any>(null)

  // Cargar datos de mediciones
  useEffect(() => {
    loadMediciones()
  }, [filters, selectedNode])

  // Función para cargar mediciones para el análisis detallado con rango de fechas específico
  const loadMedicionesForDetailedAnalysis = async (startDateStr: string, endDateStr: string) => {
    if (!filters.entidadId || !filters.ubicacionId || !selectedNode) {
      return
    }

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

      console.log('📊 Cargando datos para análisis detallado:', {
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        nodoId: selectedNode.nodoid
      })

      // Usar getAll: true para obtener todos los registros del rango (con paginación en backend)
      const allData = await JoySenseService.getMediciones({
        entidadId: filters.entidadId,
        ubicacionId: filters.ubicacionId,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        getAll: true // Esto activará la paginación en el backend
      })

      // Verificar que allData sea un array
      if (!Array.isArray(allData)) {
        console.warn('⚠️ Datos no válidos recibidos del backend')
        return
      }

      // Filtrar por nodo seleccionado
      const filteredData = allData.filter(m => m.nodoid === selectedNode.nodoid)

      console.log(`✅ Datos cargados para análisis detallado: ${filteredData.length} mediciones`)

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
        
        // Combinar mediciones fuera del rango con las nuevas mediciones del rango
        const combinedMediciones = [...medicionesFueraDelRango, ...filteredData]
        
        // Eliminar duplicados basándose en medicionid
        const uniqueMediciones = combinedMediciones.filter((medicion, index, self) =>
          index === self.findIndex(m => m.medicionid === medicion.medicionid)
        )
        
        return uniqueMediciones
      })
    } catch (err: any) {
      console.error('❌ Error cargando datos para análisis detallado:', err)
      // No mostrar error al usuario, solo loguear
    }
  }

  // Recargar datos cuando cambien las fechas del análisis detallado
  useEffect(() => {
    if (showDetailedAnalysis && detailedStartDate && detailedEndDate && selectedNode) {
      console.log('🔄 Fechas del modal cambiaron, recargando datos del backend...', {
        detailedStartDate,
        detailedEndDate,
        selectedDetailedMetric,
        nodoId: selectedNode.nodoid
      })
      
      // Recargar datos del backend con el nuevo rango de fechas
      loadMedicionesForDetailedAnalysis(detailedStartDate, detailedEndDate)
    }
  }, [detailedStartDate, detailedEndDate, selectedDetailedMetric, showDetailedAnalysis, selectedNode])

  // Cargar entidades, ubicaciones, métricas y tipos
  useEffect(() => {
    loadEntidades()
    loadUbicaciones()
    loadMetricas()
    loadTipos()
  }, [])

  const loadMediciones = async () => {
    if (!filters.entidadId || !filters.ubicacionId) {
      setMediciones([])
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Si hay un nodo seleccionado, buscar todas las mediciones disponibles para ese nodo
      // Si no hay nodo seleccionado, limitar a las últimas 6 horas
      let allData
      
      if (selectedNode) {
        // Cuando hay nodo seleccionado, obtener más datos para asegurar que haya información
        // Limitar a las últimas 30 días para tener datos suficientes pero no sobrecargar
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        
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
          limit: 10000 // Más registros para tener historial del nodo
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

      // Filtrar por nodo seleccionado si existe
      let filteredData = allData
      if (selectedNode) {
        filteredData = allData.filter(m => m.nodoid === selectedNode.nodoid)
        
        // Si después de filtrar no hay datos, intentar sin límite de tiempo
        if (filteredData.length === 0) {
          // Buscar todas las mediciones del nodo sin límite de tiempo (pero con límite de registros)
          const allDataNoLimit = await JoySenseService.getMediciones({
            entidadId: filters.entidadId,
            ubicacionId: filters.ubicacionId,
            limit: 10000
          })
          
          if (Array.isArray(allDataNoLimit)) {
            filteredData = allDataNoLimit.filter(m => m.nodoid === selectedNode.nodoid)
          }
        }
      }
      
      if (filteredData.length === 0) {
        setMediciones([])
        setLoading(false)
        return
      }

      // Mostrar métricas disponibles en los datos filtrados
      const metricasPresentes = Array.from(new Set(filteredData.map(m => m.metricaid))).sort()
      
      // No filtrar por tiempo aquí - cada métrica hará su propio filtrado de 3 horas
      setMediciones(filteredData)
      setError(null) // Limpiar cualquier error previo
    } catch (err: any) {
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
      setLoading(false)
    }
  }

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

    // Ordenar por fecha
    const sortedMediciones = metricMediciones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    
    let filteredMediciones = sortedMediciones
    let isDateRange = false

    if (useCustomRange && detailedStartDate && detailedEndDate) {
      // Usar rango personalizado de fechas del modal de detalle
      const startDate = new Date(detailedStartDate + 'T00:00:00')
      const endDate = new Date(detailedEndDate + 'T23:59:59')
      
      filteredMediciones = sortedMediciones.filter(m => {
        const medicionDate = new Date(m.fecha)
        return medicionDate >= startDate && medicionDate <= endDate
      })
      
      // Determinar si es un rango de días (más de 1 día)
      const timeDiff = endDate.getTime() - startDate.getTime()
      const daysDiff = timeDiff / (1000 * 3600 * 24)
      isDateRange = daysDiff > 1
      
    } else {
      // Usar lógica de 3 horas (comportamiento por defecto)
      const latestDate = new Date(sortedMediciones[sortedMediciones.length - 1].fecha)
      const threeHoursAgo = new Date(latestDate.getTime() - 3 * 60 * 60 * 1000)
      
      filteredMediciones = sortedMediciones.filter(m => new Date(m.fecha) >= threeHoursAgo)
      
      // Si no hay datos en las últimas 3 horas, mostrar las últimas entradas disponibles
      // (máximo 20 mediciones o las últimas 24 horas, lo que sea más relevante)
      if (filteredMediciones.length === 0 && sortedMediciones.length > 0) {
        // Obtener las últimas 20 mediciones o las últimas 24 horas, lo que sea menor
        const oneDayAgo = new Date(latestDate.getTime() - 24 * 60 * 60 * 1000)
        const lastDayMediciones = sortedMediciones.filter(m => new Date(m.fecha) >= oneDayAgo)
        
        if (lastDayMediciones.length > 0) {
          // Si hay datos del último día, usar esos (máximo 20)
          filteredMediciones = lastDayMediciones.slice(-20)
        } else {
          // Si no hay datos del último día, usar las últimas 20 mediciones disponibles
          filteredMediciones = sortedMediciones.slice(-20)
        }
      }
    }
    
    // Agrupar por tipo de sensor y luego por tiempo
    const tiposEnMediciones = Array.from(new Set(filteredMediciones.map(m => m.tipoid)))
    const datosPorTipo: { [tipoid: number]: any[] } = {}
    
    // Inicializar datos para cada tipo
    tiposEnMediciones.forEach(tipoid => {
      datosPorTipo[tipoid] = []
    })
    
    // Agrupar mediciones por tipo y tiempo
    filteredMediciones.forEach(medicion => {
      const date = new Date(medicion.fecha)
      let timeKey: string
      
      if (isDateRange) {
        // Agrupar por fecha (DD/MM) para rangos de días
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        timeKey = `${day}/${month}`
      } else {
        // Agrupar por hora (HH:MM) para rangos de horas
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
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
    
    // Obtener todos los tiempos únicos y ordenarlos
    const allTimes = Array.from(new Set(filteredMediciones.map(m => {
      const date = new Date(m.fecha)
      if (isDateRange) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        return `${day}/${month}`
      } else {
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        return `${hour}:${minute}`
      }
    }))).sort((a, b) => {
      // Ordenar por timestamp
      const aTime = datosPorTipo[tiposEnMediciones[0]]?.find(p => p.time === a)?.timestamp || 0
      const bTime = datosPorTipo[tiposEnMediciones[0]]?.find(p => p.time === b)?.timestamp || 0
      return aTime - bTime
    })
    
    // Crear estructura de datos con todas las líneas
    const result: any[] = []
    
    allTimes.forEach(time => {
      const timeData: any = { time }
      
      tiposEnMediciones.forEach(tipoid => {
        const tipoData = datosPorTipo[tipoid].find(p => p.time === time)
        const tipo = tipos.find(t => t.tipoid === tipoid)
        const tipoName = tipo?.tipo || `Tipo ${tipoid}`
        
        // Usar el nombre del tipo como key para la línea
        timeData[tipoName] = tipoData ? tipoData.value : null
      })
      
      result.push(timeData)
    })
    
    console.log('🔍 Datos procesados para gráfico con múltiples líneas:', {
      totalPuntos: result.length,
      tipos: tiposEnMediciones.length,
      tiposNombres: tiposEnMediciones.map(tid => tipos.find(t => t.tipoid === tid)?.tipo)
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
    
    // Obtener fechas reales de los datos disponibles para esta métrica
    const metricId = getMetricIdFromDataKey(metric.dataKey)
    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
    
    if (metricMediciones.length > 0) {
      // Ordenar por fecha para obtener la primera y última fecha
      const sortedMediciones = metricMediciones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      const firstDate = new Date(sortedMediciones[0].fecha)
      const lastDate = new Date(sortedMediciones[sortedMediciones.length - 1].fecha)
      
      // Establecer fechas basadas en los datos reales
      setDetailedStartDate(firstDate.toISOString().split('T')[0])
      setDetailedEndDate(lastDate.toISOString().split('T')[0])
      
      console.log(`🔍 Modal - Fechas reales para ${metric.dataKey}:`, {
        primeraFecha: firstDate.toISOString().split('T')[0],
        ultimaFecha: lastDate.toISOString().split('T')[0],
        totalMediciones: metricMediciones.length
      })
    } else {
      // Fallback: usar fechas por defecto si no hay datos
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      setDetailedStartDate(startDate.toISOString().split('T')[0])
      setDetailedEndDate(endDate.toISOString().split('T')[0])
    }
    
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

  const getMetricIdFromDataKey = (dataKey: string): number => {
    const metricMap: { [key: string]: number } = {
      "temperatura": 1,
      "humedad": 2,
      "conductividad": 3
    }
    return metricMap[dataKey] || 0
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
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

{/* Metrics Cards - Solo mostrar cuando hay un nodo seleccionado */}
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
                                connectNulls={false}
                              />
                            ))
                          })()}
                          <Tooltip
                            labelFormatter={(label) => (
                              <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                                {t('dashboard.tooltip.hour')} {label}
                              </span>
                            )}
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
                        className={`px-3 py-1 rounded-lg font-mono tracking-wider transition-colors text-sm ${
                          selectedDetailedMetric === metric.dataKey
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        }`}
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

                  {/* Filtro de fechas */}
                  <div className="flex space-x-4 mb-6">
                    <div className="flex flex-col">
                      <label className="text-sm text-neutral-400 mb-2 font-mono tracking-wider">{t('dashboard.date_start')}</label>
                      <input
                        type="date"
                        value={detailedStartDate}
                        onChange={(e) => setDetailedStartDate(e.target.value)}
                        className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm text-neutral-400 mb-2 font-mono tracking-wider">{t('dashboard.date_end')}</label>
                      <input
                        type="date"
                        value={detailedEndDate}
                        onChange={(e) => setDetailedEndDate(e.target.value)}
                        className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Gráfico detallado */}
                  <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 font-mono tracking-wider">
                      {getTranslatedMetrics().find(m => m.dataKey === selectedDetailedMetric)?.title}
                    </h3>
                    {(() => {
                      const chartData = processChartData(selectedDetailedMetric, true);
                      if (chartData.length === 0) {
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
                      return null;
                    })()}
                    {processChartData(selectedDetailedMetric, true).length > 0 && (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processChartData(selectedDetailedMetric, true)}>
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                            interval={(() => {
                              const chartData = processChartData(selectedDetailedMetric, true)
                              // Mostrar máximo 6-8 etiquetas en gráfico detallado
                              if (chartData.length <= 8) return 0
                              if (chartData.length <= 20) return 1
                              return Math.floor(chartData.length / 6)
                            })()}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                          />
                          {(() => {
                            const chartData = processChartData(selectedDetailedMetric, true)
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
                                strokeWidth={3}
                                dot={{ r: 4, fill: colors[index % colors.length] }}
                                activeDot={{ r: 6, fill: colors[index % colors.length] }}
                                connectNulls={false}
                              />
                            ))
                          })()}
                          <Tooltip
                            labelFormatter={(label) => (
                              <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                                {t('dashboard.tooltip.hour')} {label}
                              </span>
                            )}
                            formatter={(value: number, name: string) => [
                              <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                                {name}: {value ? value.toFixed(1) : '--'} {getTranslatedMetrics().find(m => m.dataKey === selectedDetailedMetric)?.unit}
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
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
