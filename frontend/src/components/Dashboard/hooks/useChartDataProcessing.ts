import { useMemo } from 'react'
import type { MedicionData } from '../types'

export interface GranularityConfig {
  useDays: boolean
  useHours: boolean
}

export interface ProcessedChartData {
  [locid: number]: Array<{
    timestamp: number
    time: string
    value: number
    count: number
  }>
}

/**
 * Hook para procesar y transformar datos de gráficos
 * Maneja agrupamiento por granularidad (minutos, horas, días)
 * y promediado de valores cuando hay múltiples puntos en el mismo período
 */
export function useChartDataProcessing() {
  /**
   * Calcula la granularidad basada en el rango de fechas
   */
  const calculateGranularity = (startDate: Date, endDate: Date): GranularityConfig => {
    const timeSpan = endDate.getTime() - startDate.getTime()
    const hoursSpan = timeSpan / (1000 * 60 * 60)
    const daysSpan = hoursSpan / 24

    return {
      useDays: daysSpan >= 2,
      useHours: !( daysSpan >= 2) && hoursSpan >= 48
    }
  }

  /**
   * Genera la clave de tiempo para agrupar puntos
   */
  const getTimeKey = (date: Date, granularity: GranularityConfig): string => {
    if (granularity.useDays) {
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
    } else if (granularity.useHours) {
      return `${String(date.getHours()).padStart(2, '0')}:00`
    } else {
      const roundedMinutes = Math.floor(date.getMinutes() / 15) * 15
      return `${String(date.getHours()).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`
    }
  }

  /**
   * Agrupa mediciones por localizació n y período de tiempo
   * Calcula promedio de valores cuando hay múltiples puntos
   */
  const groupMedicionesByLocation = (
    mediciones: MedicionData[],
    granularity: GranularityConfig,
    locationIds: number[]
  ): ProcessedChartData => {
    const grouped: ProcessedChartData = {}
    
    // Inicializar estructura
    locationIds.forEach((locid: number) => {
      grouped[locid] = []
    })

    // Agrupar mediciones
    mediciones.forEach(medicion => {
      if (medicion.localizacionid === undefined || medicion.localizacionid === null) return

      const date = new Date(medicion.fecha)
      const timeKey = getTimeKey(date, granularity)
      
      const locationData = grouped[medicion.localizacionid] || []
      const existingPoint = locationData.find(p => p.time === timeKey)

      if (existingPoint) {
        // Recalcular promedio
        const currentValue = existingPoint.value
        const currentCount = existingPoint.count
        existingPoint.value = (currentValue * currentCount + medicion.medicion) / (currentCount + 1)
        existingPoint.count = currentCount + 1
      } else {
        // Nuevo punto
        if (!grouped[medicion.localizacionid]) {
          grouped[medicion.localizacionid] = []
        }
        grouped[medicion.localizacionid].push({
          timestamp: date.getTime(),
          time: timeKey,
          value: medicion.medicion,
          count: 1
        })
      }
    })

    return grouped
  }

  /**
   * Ordena los puntos agrupados por timestamp
   */
  const sortGroupedData = (grouped: ProcessedChartData): ProcessedChartData => {
    const sorted: ProcessedChartData = {}
    
    Object.entries(grouped).forEach(([locid, points]: [string, any[]]) => {
      sorted[Number(locid)] = points.sort((a: any, b: any) => a.timestamp - b.timestamp)
    })

    return sorted
  }

  /**
   * Transforma datos agrupados a formato para gráfico Recharts
   * Combina todas las localizaciones en un array de objetos
   */
  const formatForChart = (
    grouped: ProcessedChartData,
    locationLabels: Map<number, string>
  ): Array<any> => {
    const chartData: any[] = []
    const timeKeys = new Set<string>()

    // Recolectar todas las claves de tiempo
    Object.values(grouped).forEach((points: any[]) => {
      points.forEach((p: any) => timeKeys.add(p.time))
    })

    // Crear mapa de tiempo ordenado
    const sortedTimeKeys = Array.from(timeKeys).sort()

    // Construir array de puntos para gráfico
    sortedTimeKeys.forEach(timeKey => {
      const dataPoint: any = { time: timeKey }

      Object.entries(grouped).forEach(([locid, points]: [string, any[]]) => {
        const point = points.find((p: any) => p.time === timeKey)
        if (point) {
          const label = locationLabels.get(Number(locid)) || `Loc ${locid}`
          dataPoint[label] = point.value
        }
      })

      chartData.push(dataPoint)
    })

    return chartData
  }

  return {
    calculateGranularity,
    getTimeKey,
    groupMedicionesByLocation,
    sortGroupedData,
    formatForChart
  }
}
