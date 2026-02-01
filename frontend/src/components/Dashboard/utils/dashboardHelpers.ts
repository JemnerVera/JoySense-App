import type { MedicionData, MetricConfig } from '../types'

/**
 * Obtiene la etiqueta descriptiva para una serie de datos
 */
export function getSeriesLabel(
  medicion: MedicionData,
  sensores: any[],
  tipos: any[]
): string {
  // Para datos agregados (sin sensorid específico)
  if (!medicion.sensorid || medicion.sensorid === 0) {
    const metricName = medicion.localizacion?.metrica?.metrica || 'Métrica'
    return metricName.charAt(0).toUpperCase() + metricName.slice(1)
  }
  
  const locName = medicion.localizacion?.localizacion || `Punto ${medicion.localizacionid}`
  
  // Obtener información del sensor
  const sensorId = medicion.localizacion?.sensorid || medicion.sensorid
  const sensorInfo = sensores.find(s => s.sensorid === sensorId)
  const sensorName = sensorInfo?.sensor || sensorInfo?.nombre || sensorInfo?.modelo || sensorInfo?.deveui
  
  // Obtener información del tipo
  const tipoId = sensorInfo?.tipoid || medicion.tipoid
  const tipoInfo = tipos.find((t: any) => t.tipoid === tipoId)
  const tipoName = tipoInfo?.tipo || 'Sensor'
  
  // Construir etiqueta descriptiva
  let sensorLabel = tipoName
  if (sensorName && sensorName !== tipoName) {
    sensorLabel = `${tipoName} - ${sensorName}`
  }

  return `${locName} (${sensorLabel})`
}

/**
 * Verifica si hay datos para una métrica específica
 */
export function hasMetricData(
  dataKey: string,
  mediciones: MedicionData[],
  selectedNode?: any
): boolean {
  if (!mediciones || mediciones.length === 0 || !selectedNode) {
    return false
  }

  // Filtrar mediciones del nodo seleccionado
  const nodeMediciones = mediciones.filter(m => {
    const matchNode = Number(m.nodoid) === Number(selectedNode.nodoid)
    return matchNode
  })

  if (nodeMediciones.length === 0) {
    return false
  }

  // Buscar mediciones que coincidan con la métrica
  const matchingMediciones = nodeMediciones.filter(m => {
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
  
  return matchingMediciones.length > 0
}

/**
 * Obtiene el valor actual para una métrica específica
 */
export function getCurrentValue(
  dataKey: string,
  mediciones: MedicionData[]
): number {
  if (!mediciones || mediciones.length === 0) {
    return 0
  }

  const matchingMediciones = mediciones.filter(m => {
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

  if (matchingMediciones.length === 0) return 0

  // Obtener el valor más reciente (ordenado por fecha descendente)
  const sorted = [...matchingMediciones].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  const latestValue = sorted[0]?.medicion
  return latestValue ? Number(latestValue) : 0
}

/**
 * Obtiene el estado de un valor comparándolo con los rangos óptimos
 */
export function getStatus(
  value: number,
  metric: MetricConfig
): 'optimal' | 'warning' | 'critical' | 'unknown' {
  if (value === null || value === undefined) {
    return 'unknown'
  }

  const { ranges } = metric
  
  if (!ranges) {
    return 'unknown'
  }

  const [optimalMin, optimalMax] = ranges.optimal
  
  // Dentro del rango óptimo
  if (value >= optimalMin && value <= optimalMax) {
    return 'optimal'
  }
  
  // Dentro de los rangos pero fuera del óptimo
  if (value >= ranges.min && value <= ranges.max) {
    return 'warning'
  }
  
  // Fuera de los rangos
  return 'critical'
}

/**
 * Verifica si hay datos recientes (últimos 30 días) para un nodo
 */
export function hasRecentData(
  mediciones: MedicionData[],
  selectedNode: any
): boolean {
  if (!mediciones || !selectedNode) {
    return false
  }

  // Filtrar mediciones que coincidan con el nodo seleccionado
  const matchingMediciones = mediciones.filter(m => {
    if (selectedNode.nodoid && m.nodoid === selectedNode.nodoid) return true
    if (selectedNode.ubicacionid && m.ubicacionid === selectedNode.ubicacionid) return true
    return false
  })

  if (matchingMediciones.length === 0) {
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
  
  return mostRecentDate >= thirtyDaysAgo
}

/**
 * Prepara datos para gráficos agrupados por hora
 */
export function prepareChartData(
  mediciones: MedicionData[],
  dataKey: string
): any[] {
  if (!mediciones || mediciones.length === 0) {
    return []
  }

  // Filtrar mediciones que coincidan con la métrica
  const matchingMediciones = mediciones.filter(m => {
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

  if (matchingMediciones.length === 0) {
    return []
  }

  // Agrupar por hora
  const grouped: { [key: string]: MedicionData[] } = {}
  
  matchingMediciones.forEach(m => {
    const date = new Date(m.fecha)
    const hourKey = date.toISOString().slice(0, 13) + ':00:00'
    
    if (!grouped[hourKey]) {
      grouped[hourKey] = []
    }
    grouped[hourKey].push(m)
  })

  // Convertir a formato de gráfico
  const chartData = Object.entries(grouped).map(([hour, mediciones]) => {
    const dataPoint: any = {
      time: hour,
      hora: new Date(hour).getHours()
    }

    // Promediar valores por sensor/tipo
    mediciones.forEach(m => {
      const sensorName = m.localizacion?.sensor?.sensor || `Sensor ${m.sensorid}`
      const tipoName = m.localizacion?.sensor?.tipo?.tipo || 'Tipo'
      const label = `${tipoName} - ${sensorName}`
      
      const valor = Number(m.medicion) || 0
      dataPoint[label] = valor
    })

    return dataPoint
  })

  // Ordenar por tiempo
  return chartData.sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  )
}

/**
 * Formatea una fecha al formato requerido por el backend
 */
export function formatDateForBackend(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Obtiene el rango de fechas para una carga de datos
 */
export function getDateRange(
  daysBack: number,
  baseDate: Date = new Date()
): { start: string; end: string } {
  const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59)
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000)
  
  return {
    start: formatDateForBackend(startDate),
    end: formatDateForBackend(endDate)
  }
}
