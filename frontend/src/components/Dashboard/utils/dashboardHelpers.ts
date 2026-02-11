import type { MedicionData, MetricConfig } from '../types'

// ============================================================================
// HELPERS PARA MATCHING DE MÉTRICAS - Reutilizables y memoizables
// ============================================================================

/**
 * Normaliza un nombre de métrica para búsqueda
 */
function normalizeMetricName(rawName: string): string {
  return rawName
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Verifica si un nombre de métrica coincide con un dataKey
 */
function matchesDataKey(metricName: string, dataKey: string): boolean {
  if (dataKey === 'temperatura' && (metricName.includes('temperatura') || metricName.includes('temp'))) return true
  if (dataKey === 'humedad' && (metricName.includes('humedad') || metricName.includes('humidity'))) return true
  if (dataKey === 'conductividad' && (
    metricName.includes('conductividad') || 
    metricName.includes('electroconductividad') ||
    metricName.includes('conductivity')
  )) return true
  return false
}

/**
 * Crea un cache de mediciones por nodo y métrica para evitar filtrado repetido
 */
function createMedicionCache(mediciones: MedicionData[], nodeId: number) {
  const nodeCache = new Map<string, MedicionData[]>()
  
  mediciones.forEach(m => {
    if (Number(m.nodoid) === Number(nodeId)) {
      const metricName = normalizeMetricName(m.localizacion?.metrica?.metrica || '')
      if (!nodeCache.has(metricName)) {
        nodeCache.set(metricName, [])
      }
      nodeCache.get(metricName)!.push(m)
    }
  })
  
  return nodeCache
}

// ============================================================================
// EXPORTED HELPERS
// ============================================================================

/**
 * Obtiene la etiqueta descriptiva para una serie de datos (incluye localización)
 * Usado en análisis detallado donde necesitamos identificar cada punto de medición
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
  
  // Obtener información del sensor (fallback a localizacion.sensor para datos RPC fn_get_mediciones_nodo_detallado)
  const sensorId = medicion.localizacion?.sensorid || medicion.sensorid
  const sensorInfo = sensores.find(s => s.sensorid === sensorId)
  const sensorName = medicion.localizacion?.sensor?.sensor || medicion.localizacion?.sensor?.nombre || sensorInfo?.sensor || sensorInfo?.nombre || sensorInfo?.modelo || sensorInfo?.deveui
  
  // Obtener información del tipo (fallback a localizacion.sensor.tipo para datos RPC)
  const tipoId = sensorInfo?.tipoid || medicion.tipoid
  const tipoInfo = tipos.find((t: any) => t.tipoid === tipoId)
  const tipoName = medicion.localizacion?.sensor?.tipo?.tipo || tipoInfo?.tipo || 'Sensor'
  
  // Construir etiqueta descriptiva
  let sensorLabel = tipoName
  if (sensorName && sensorName !== tipoName) {
    sensorLabel = `${tipoName} - ${sensorName}`
  }

  return `${locName} (${sensorLabel})`
}

/**
 * Obtiene solo la etiqueta del sensor sin la localización
 * Usado en minigráficos para mantener las leyendas limpias y legibles
 */
export function getSensorLabel(
  medicion: MedicionData,
  sensores: any[],
  tipos: any[]
): string {
  // Para datos agregados (sin sensorid específico)
  if (!medicion.sensorid || medicion.sensorid === 0) {
    const metricName = medicion.localizacion?.metrica?.metrica || 'Métrica'
    return metricName.charAt(0).toUpperCase() + metricName.slice(1)
  }
  
  // Obtener información del sensor (fallback a localizacion.sensor para datos RPC fn_get_mediciones_nodo_detallado)
  const sensorId = medicion.localizacion?.sensorid || medicion.sensorid
  const sensorInfo = sensores.find(s => s.sensorid === sensorId)
  const sensorName = medicion.localizacion?.sensor?.sensor || medicion.localizacion?.sensor?.nombre || sensorInfo?.sensor || sensorInfo?.nombre || sensorInfo?.modelo || sensorInfo?.deveui
  
  // Obtener información del tipo (fallback a localizacion.sensor.tipo para datos RPC)
  const tipoId = sensorInfo?.tipoid || medicion.tipoid
  const tipoInfo = tipos.find((t: any) => t.tipoid === tipoId)
  const tipoName = medicion.localizacion?.sensor?.tipo?.tipo || tipoInfo?.tipo || 'Sensor'
  
  // Construir etiqueta descriptiva (solo el sensor, sin localización)
  let sensorLabel = tipoName
  if (sensorName && sensorName !== tipoName) {
    sensorLabel = `${tipoName} - ${sensorName}`
  }

  return sensorLabel
}

/**
 * Verifica si hay datos para una métrica específica (con cache optimizado)
 */
export function hasMetricData(
  dataKey: string,
  mediciones: MedicionData[],
  selectedNode?: any,
  cache?: Map<string, MedicionData[]>
): boolean {
  if (!mediciones || mediciones.length === 0 || !selectedNode) {
    return false
  }

  // Si hay cache, usarlo (precalculado)
  if (cache) {
    const entries = Array.from(cache.entries())
    for (const [metricName, meds] of entries) {
      if (matchesDataKey(metricName, dataKey) && meds.length > 0) {
        return true
      }
    }
    return false
  }

  // Fallback: búsqueda directa (sin cache)
  const nodeMediciones = mediciones.filter(m => Number(m.nodoid) === Number(selectedNode.nodoid))

  if (nodeMediciones.length === 0) {
    return false
  }

  const matchingMediciones = nodeMediciones.filter(m => {
    const rawMetricName = m.localizacion?.metrica?.metrica || ''
    const metricName = normalizeMetricName(rawMetricName)
    return matchesDataKey(metricName, dataKey)
  })
  
  return matchingMediciones.length > 0
}

/**
 * Obtiene el valor actual para una métrica específica (con cache optimizado)
 */
export function getCurrentValue(
  dataKey: string,
  mediciones: MedicionData[],
  cache?: Map<string, MedicionData[]>
): number {
  if (!mediciones || mediciones.length === 0) {
    return 0
  }

  let matchingMediciones: MedicionData[] = []

  // Si hay cache, usarlo
  if (cache) {
    const entries = Array.from(cache.entries())
    for (const [metricName, meds] of entries) {
      if (matchesDataKey(metricName, dataKey)) {
        matchingMediciones = meds
        break
      }
    }
  } else {
    // Fallback: búsqueda directa
    matchingMediciones = mediciones.filter(m => {
      const rawMetricName = m.localizacion?.metrica?.metrica || ''
      const metricName = normalizeMetricName(rawMetricName)
      return matchesDataKey(metricName, dataKey)
    })
  }

  if (matchingMediciones.length === 0) return 0

  // Obtener el valor más reciente (sin copia innecesaria)
  let maxDate = new Date(matchingMediciones[0].fecha).getTime()
  let latestMedicion = matchingMediciones[0]

  for (let i = 1; i < matchingMediciones.length; i++) {
    const time = new Date(matchingMediciones[i].fecha).getTime()
    if (time > maxDate) {
      maxDate = time
      latestMedicion = matchingMediciones[i]
    }
  }

  const latestValue = latestMedicion?.medicion
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

// ============================================================================
// HELPERS PARA OPTIMIZACIÓN DE RENDERIZADO
// ============================================================================

/**
 * Crea un cache de mediciones por métrica normalizada para una sola pasada de datos
 * Esto evita filtrar repetidamente las mediciones para cada métrica
 */
export function createMetricCache(mediciones: MedicionData[], nodeId: number): Map<string, MedicionData[]> {
  return createMedicionCache(mediciones, nodeId)
}

/**
 * Estructura de datos para pasar a componentes que necesitan info de métricas
 */
export interface MetricCacheData {
  cache: Map<string, MedicionData[]>
  hasData: (dataKey: string) => boolean
  getCurrentValue: (dataKey: string) => number
  nodeId: number
}

/**
 * Factory function para crear un helper optimizado de métricas
 * Realiza una sola pasada sobre los datos en lugar de múltiples
 */
export function createOptimizedMetricHelper(
  mediciones: MedicionData[],
  nodeId: number
): MetricCacheData {
  const cache = createMedicionCache(mediciones, nodeId)
  
  const entries = Array.from(cache.entries())
  
  return {
    cache,
    hasData: (dataKey: string) => {
      for (const [metricName, meds] of entries) {
        if (matchesDataKey(metricName, dataKey) && meds.length > 0) {
          return true
        }
      }
      return false
    },
    getCurrentValue: (dataKey: string) => {
      for (const [metricName, meds] of entries) {
        if (matchesDataKey(metricName, dataKey)) {
          if (meds.length === 0) return 0
          
          let maxDate = new Date(meds[0].fecha).getTime()
          let latestMedicion = meds[0]
          
          for (let i = 1; i < meds.length; i++) {
            const time = new Date(meds[i].fecha).getTime()
            if (time > maxDate) {
              maxDate = time
              latestMedicion = meds[i]
            }
          }
          
          const latestValue = latestMedicion?.medicion
          return latestValue ? Number(latestValue) : 0
        }
      }
      return 0
    },
    nodeId
  }
}
