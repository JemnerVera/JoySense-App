import React, { useState, useEffect } from "react"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { JoySenseService } from "../../services/backend-api"
import { NodeSelector } from "./NodeSelector"

interface ModernDashboardProps {
  filters: {
    entidadId: number | null
    ubicacionId: number | null
    startDate: string
    endDate: string
  }
  onFiltersChange: (filters: any) => void
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
    unit: "mS/cm",
    dataKey: "conductividad",
    description: "Conductividad eléctrica del sustrato",
    ranges: { min: 0.5, max: 2.5, optimal: [1.0, 1.8] }
  }
]

export function ModernDashboard({ filters, onFiltersChange }: ModernDashboardProps) {
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
    console.log('🔍 ModernDashboard: useEffect triggered - filters:', filters, 'selectedNode:', selectedNode)
    loadMediciones()
  }, [filters, selectedNode])

  // Cargar entidades, ubicaciones, métricas y tipos
  useEffect(() => {
    loadEntidades()
    loadUbicaciones()
    loadMetricas()
    loadTipos()
  }, [])

  const loadMediciones = async () => {
    console.log('🔍 ModernDashboard: loadMediciones called with filters:', filters, 'selectedNode:', selectedNode)
    
    if (!filters.entidadId || !filters.ubicacionId) {
      console.log('🔍 ModernDashboard: Faltan filtros - entidadId:', filters.entidadId, 'ubicacionId:', filters.ubicacionId)
      setMediciones([])
      return
    }

    console.log('🔍 ModernDashboard: Cargando mediciones con filtros:', filters)
    setLoading(true)
    setError(null)

    try {
      // Obtener todas las mediciones sin filtro de tiempo
      console.log('🔍 ModernDashboard: Obteniendo todas las mediciones...')
      const allData = await JoySenseService.getMediciones({
        entidadId: filters.entidadId,
        ubicacionId: filters.ubicacionId,
        getAll: true // Obtener todos los datos sin límite
      })

      // Verificar que allData sea un array
      if (!Array.isArray(allData)) {
        console.log('🔍 ModernDashboard: Datos no son un array, estableciendo array vacío')
        setMediciones([])
        setLoading(false)
        return
      }

      console.log('🔍 ModernDashboard: Todas las mediciones obtenidas:', allData.length)

      if (allData.length === 0) {
        console.log('🔍 ModernDashboard: No hay mediciones disponibles')
        setMediciones([])
        setLoading(false)
        return
      }

      // Filtrar por nodo seleccionado si existe
      let filteredData = allData
      if (selectedNode) {
        console.log('🔍 ModernDashboard: Filtrando por nodo seleccionado:', selectedNode.nodoid)
        filteredData = allData.filter(m => m.nodoid === selectedNode.nodoid)
        console.log('🔍 ModernDashboard: Mediciones filtradas por nodo:', filteredData.length)
      }

      // Mostrar métricas disponibles en los datos filtrados
      const metricasPresentes = Array.from(new Set(filteredData.map(m => m.metricaid))).sort()
      console.log('🔍 ModernDashboard: Metricas presentes en datos filtrados:', metricasPresentes)
      
      // No filtrar por tiempo aquí - cada métrica hará su propio filtrado de 3 horas
      setMediciones(filteredData)
    } catch (err) {
      setError("Error al cargar las mediciones")
      console.error("Error loading mediciones:", err)
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

  // Procesar datos para gráficos - específico por métrica
  const processChartData = (dataKey: string, useCustomRange: boolean = false) => {
    if (!mediciones.length) {
      console.log('🔍 ModernDashboard: No hay mediciones para procesar')
      return []
    }

    // Filtrar mediciones para esta métrica específica
    const metricId = getMetricIdFromDataKey(dataKey)
    const metricMediciones = mediciones.filter(m => m.metricaid === metricId)
    
    if (!metricMediciones.length) {
      console.log(`🔍 ModernDashboard: No hay mediciones para ${dataKey}`)
      return []
    }

    console.log(`🔍 ModernDashboard: Procesando ${metricMediciones.length} mediciones para ${dataKey}`)

    // Ordenar por fecha
    const sortedMediciones = metricMediciones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    
    let filteredMediciones = sortedMediciones

    if (useCustomRange && detailedStartDate && detailedEndDate) {
      // Usar rango personalizado de fechas
      const startDate = new Date(detailedStartDate)
      const endDate = new Date(detailedEndDate)
      endDate.setHours(23, 59, 59, 999) // Incluir todo el día final
      
      console.log(`🔍 ModernDashboard: ${dataKey} - Rango personalizado: ${startDate.toISOString()} a ${endDate.toISOString()}`)
      
      filteredMediciones = sortedMediciones.filter(m => {
        const medicionDate = new Date(m.fecha)
        return medicionDate >= startDate && medicionDate <= endDate
      })
      
      console.log(`🔍 ModernDashboard: ${dataKey} - Datos en rango personalizado: ${filteredMediciones.length}`)
    } else {
      // Usar lógica de 3 horas (comportamiento por defecto)
      const latestDate = new Date(sortedMediciones[sortedMediciones.length - 1].fecha)
      const threeHoursAgo = new Date(latestDate.getTime() - 3 * 60 * 60 * 1000)
      
      console.log(`🔍 ModernDashboard: ${dataKey} - Fecha más reciente: ${latestDate.toISOString()}`)
      console.log(`🔍 ModernDashboard: ${dataKey} - Rango de 3 horas: ${threeHoursAgo.toISOString()} a ${latestDate.toISOString()}`)

      filteredMediciones = sortedMediciones.filter(m => new Date(m.fecha) >= threeHoursAgo)
      console.log(`🔍 ModernDashboard: ${dataKey} - Datos en rango de 3 horas: ${filteredMediciones.length}`)
    }
    
    // Agrupar por hora
    const groupedData: { [key: string]: any } = {}
    
    filteredMediciones.forEach(medicion => {
      const date = new Date(medicion.fecha)
      const hourKey = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      
      if (!groupedData[hourKey]) {
        groupedData[hourKey] = {
          timestamp: date.getTime(),
          time: hourKey,
          value: 0
        }
      }
      
      groupedData[hourKey].value = medicion.medicion
    })

    const result = Object.values(groupedData).sort((a: any, b: any) => a.timestamp - b.timestamp)
    console.log(`🔍 ModernDashboard: Datos procesados para ${dataKey}:`, result.length, 'puntos')
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
      console.log(`🔍 ModernDashboard: No hay mediciones para ${dataKey} (metricaid: ${metricId})`)
      return 0
    }
    
    // Obtener la medición más reciente
    const latest = metricMediciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    const value = latest ? latest.medicion || 0 : 0
    console.log(`🔍 ModernDashboard: ${dataKey} - Valor más reciente: ${value} (fecha: ${latest.fecha})`)
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
    return baseMetrics
  }

  // Verificar si una métrica tiene datos
  const hasMetricData = (dataKey: string) => {
    if (!mediciones.length) {
      console.log(`🔍 ModernDashboard: hasMetricData(${dataKey}) - No hay mediciones`)
      return false
    }
    
    const metricId = getMetricIdFromDataKey(dataKey)
    const hasData = mediciones.some(m => m.metricaid === metricId)
    console.log(`🔍 ModernDashboard: hasMetricData(${dataKey}) - metricaid: ${metricId}, hasData: ${hasData}`)
    console.log(`🔍 ModernDashboard: hasMetricData(${dataKey}) - metricas disponibles:`, Array.from(new Set(mediciones.map(m => m.metricaid))))
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
  console.log('🔍 ModernDashboard: Métricas disponibles para mostrar:', availableMetrics.map(m => m.title))

  return (
    <div className="min-h-screen bg-neutral-900 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2 text-red-300">
              <div className="w-5 h-5">⚠️</div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Node Selector Console */}
        <NodeSelector
          selectedEntidadId={filters.entidadId}
          selectedUbicacionId={filters.ubicacionId}
          onNodeSelect={(nodeData) => {
            console.log('🔍 ModernDashboard: Nodo seleccionado:', nodeData)
            setSelectedNode(nodeData)
          }}
          onFiltersUpdate={(newFilters) => {
            console.log('🔍 ModernDashboard: Actualizando filtros desde nodo:', newFilters)
            onFiltersChange({
              entidadId: newFilters.entidadId,
              ubicacionId: newFilters.ubicacionId,
              startDate: filters.startDate,
              endDate: filters.endDate
            })
          }}
        />


        {/* Metrics Cards */}
        {!loading && !error && availableMetrics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {availableMetrics.map((metric) => {
              const hasData = hasMetricData(metric.dataKey)
              const currentValue = hasData ? getCurrentValue(metric.dataKey) : 0
              const status = hasData ? getStatus(currentValue as number, metric) : "no-data"

              return (
                <div
                  key={metric.id}
                  className={`bg-neutral-800 border border-neutral-700 rounded-lg hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-500/20 p-6 group ${
                    !hasData ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl text-white">
                        {metric.id === 'temperatura' ? '🌡' : 
                         metric.id === 'humedad' ? '💧' : '⚡'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white font-mono tracking-wider">{metric.title}</h3>
                      </div>
                    </div>
                    {!hasData && (
                      <span className="px-2 py-1 text-xs font-bold rounded-full border bg-gray-900 text-gray-300 border-gray-700 font-mono tracking-wider">
                        SIN DATOS
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline space-x-2 mb-4">
                    <span className="text-3xl font-bold text-orange-500 font-mono">
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
                            tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                            interval="preserveStartEnd"
                          />
                          <YAxis hide />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={metric.color}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5, fill: metric.color, stroke: metric.color, strokeWidth: 2 }}
                            strokeOpacity={0.9}
                          />
                          <Tooltip
                            labelFormatter={(label) => `Hora: ${label}`}
                            formatter={(value: number) => [`${value.toFixed(1)} ${metric.unit}`, metric.title]}
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#ffffff",
                              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-neutral-700/30 rounded-lg">
                        <div className="text-center text-neutral-500">
                          <div className="text-2xl mb-2">📊</div>
                          <div className="text-sm font-mono tracking-wider">SIN DATOS DISPONIBLES</div>
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
                          Última medida: {latestDate.toLocaleString('es-ES', { 
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
                        className="p-2 text-neutral-400 group-hover:text-orange-500 group-hover:bg-orange-500/10 rounded-lg transition-all duration-200 group-hover:scale-110"
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
            <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Botón de cerrar */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => {
                    setShowDetailedAnalysis(false)
                    setSelectedMetricForAnalysis(null)
                  }}
                  className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-700 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Contenido */}
              <div className="flex-1 overflow-y-auto bg-neutral-900 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
                <div className="p-6">
                  {/* Botones de métricas */}
                  <div className="flex space-x-3 mb-6">
                    {baseMetrics.map((metric) => (
                      <button
                        key={metric.id}
                        onClick={() => setSelectedDetailedMetric(metric.dataKey)}
                        className={`px-4 py-2 rounded-lg font-mono tracking-wider transition-colors ${
                          selectedDetailedMetric === metric.dataKey
                            ? 'bg-green-500 text-white'
                            : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                        }`}
                      >
                        {metric.title}
                      </button>
                    ))}
                  </div>

                  {/* Filtro de fechas */}
                  <div className="flex space-x-4 mb-6">
                    <div className="flex flex-col">
                      <label className="text-sm text-neutral-400 mb-2 font-mono tracking-wider">FECHA INICIO</label>
                      <input
                        type="date"
                        value={detailedStartDate}
                        onChange={(e) => setDetailedStartDate(e.target.value)}
                        className="px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm text-neutral-400 mb-2 font-mono tracking-wider">FECHA FIN</label>
                      <input
                        type="date"
                        value={detailedEndDate}
                        onChange={(e) => setDetailedEndDate(e.target.value)}
                        className="px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Gráfico detallado */}
                  <div className="bg-neutral-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 font-mono tracking-wider">
                      {baseMetrics.find(m => m.dataKey === selectedDetailedMetric)?.title} - ANÁLISIS DETALLADO
                    </h3>
                    {(() => {
                      const chartData = processChartData(selectedDetailedMetric, true);
                      if (chartData.length === 0) {
                        return (
                          <div className="h-96 flex items-center justify-center bg-neutral-700 rounded-lg">
                            <div className="text-center">
                              <div className="text-4xl mb-4">📊</div>
                              <div className="text-neutral-400 text-lg font-mono">
                                No hay datos disponibles para el rango de fechas seleccionado
                              </div>
                              <div className="text-neutral-500 text-sm font-mono mt-2">
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
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={baseMetrics.find(m => m.dataKey === selectedDetailedMetric)?.color || "#f59e0b"}
                            strokeWidth={3}
                            dot={{ r: 4, fill: baseMetrics.find(m => m.dataKey === selectedDetailedMetric)?.color || "#f59e0b" }}
                            activeDot={{ r: 6, fill: baseMetrics.find(m => m.dataKey === selectedDetailedMetric)?.color || "#f59e0b" }}
                          />
                          <Tooltip
                            labelFormatter={(label) => `Hora: ${label}`}
                            formatter={(value: number) => [`${value.toFixed(1)} ${baseMetrics.find(m => m.dataKey === selectedDetailedMetric)?.unit}`, baseMetrics.find(m => m.dataKey === selectedDetailedMetric)?.title]}
                            contentStyle={{
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#ffffff",
                              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
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
