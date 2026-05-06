import { useMemo, useRef } from 'react'
import type { MedicionData } from '../types'
import type { MetricMetadata } from '../../../types/metrics'

/**
 * Verifica si un nombre de métrica coincide con un dataKey
 */
function metricNameMatchesDataKey(metricName: string, dataKey: string, registry?: Map<string, MetricMetadata>): boolean {
  if (registry) {
    // Búsqueda usando aliases del registry
    const metric = Array.from(registry.values()).find(m =>
      m.aliases?.some(alias => metricName.includes(alias) || alias.includes(metricName))
    )
    return metric ? metric.id === dataKey : false
  }

  // Fallback: matching por nombre (compatible con legacy)
  if (dataKey === 'temperatura' && (metricName.includes('temperatura') || metricName.includes('temp'))) return true
  if (dataKey === 'humedad' && (metricName.includes('humedad') || metricName.includes('humidity'))) return true
  if (dataKey === 'conductividad' && (metricName.includes('conductividad') || metricName.includes('electroconductividad') || metricName.includes('conductivity'))) return true
  return false
}

/**
 * Custom hook para optimizar el cacheo de datos de gráficos
 * Mantiene un cache persistent que solo se recalcula cuando los datos realmente cambian
 */
export function useOptimizedChartData(
  mediciones: MedicionData[],
  selectedNodeId: number | null,
  processChartDataFn: (dataKey: string) => any[],
  dataKeys: string[] = ['temperatura', 'humedad', 'conductividad'],
  registry?: Map<string, MetricMetadata>
) {
  // Cache persistent entre renders
  const cacheRef = useRef<{ [key: string]: any[] }>({})
  const lastMedicionLengthRef = useRef<number>(0)
  const lastNodeIdRef = useRef<number | null>(null)

  // Recalcular SOLO cuando mediciones o nodo cambien realmente
  // NO incluimos processChartDataFn en dependencias para evitar recálculos cuando la función cambia
  const chartDataCache = useMemo(() => {
    // Si no hay nodo o mediciones, retornar cache vacío
    if (!selectedNodeId || !mediciones.length) {
      lastMedicionLengthRef.current = 0
      lastNodeIdRef.current = null
      cacheRef.current = {}
      return {}
    }

    // Si el nodo o cantidad de mediciones NO cambió, retornar cache anterior
    if (
      lastNodeIdRef.current === selectedNodeId &&
      lastMedicionLengthRef.current === mediciones.length
    ) {
      return cacheRef.current
    }

    // Los datos cambiaron, actualizar referencias
    lastNodeIdRef.current = selectedNodeId
    lastMedicionLengthRef.current = mediciones.length

    // Crear nuevo cache
    const newCache: { [key: string]: any[] } = {}

    // Obtener métricas con datos del nodo seleccionado
    const nodeMediciones = mediciones.filter(m => Number(m.nodoid) === Number(selectedNodeId))

    if (nodeMediciones.length === 0) {
      cacheRef.current = newCache
      return newCache
    }

    // Obtener nombres únicos de métricas en los datos
    const metricNamesSet = new Set<string>()
    for (const m of nodeMediciones) {
      const rawName = m.localizacion?.metrica?.metrica || ''
      const cleanName = rawName.replace(/[\r\n]/g, ' ').trim().toLowerCase()
      if (cleanName) metricNamesSet.add(cleanName)
    }
    const metricNamesInData = Array.from(metricNamesSet)

    // Calcular datos para cada métrica
    for (const dataKey of dataKeys) {
      let hasData = false

      // Verificar si hay datos para este dataKey
      for (const metricName of metricNamesInData) {
        if (metricNameMatchesDataKey(metricName, dataKey, registry)) {
          hasData = true
          break
        }
      }

      if (hasData) {
        newCache[dataKey] = processChartDataFn(dataKey)
      }
    }

    cacheRef.current = newCache
    return newCache
  }, [mediciones.length, selectedNodeId, dataKeys, registry])

  return chartDataCache
}
