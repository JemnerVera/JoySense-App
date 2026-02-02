import { useMemo, useCallback } from 'react'
import type { MedicionData } from '../types'
import { createOptimizedMetricHelper } from '../utils/dashboardHelpers'

/**
 * Custom hook que crea un cache de métricas optimizado para un nodo
 * Esto evita recalcular hasMetricData y getCurrentValue múltiples veces
 */
export function useMetricCache(
  mediciones: MedicionData[],
  selectedNode: any
) {
  // Crear el cache una sola vez por nodo y conjunto de mediciones
  const metricHelper = useMemo(() => {
    if (!selectedNode || !mediciones.length) {
      return null
    }
    return createOptimizedMetricHelper(mediciones, selectedNode.nodoid)
  }, [mediciones, selectedNode?.nodoid])

  // Funciones memoizadas que usan el cache
  const hasData = useCallback((dataKey: string) => {
    return metricHelper?.hasData(dataKey) ?? false
  }, [metricHelper])

  const getCurrentValue = useCallback((dataKey: string) => {
    return metricHelper?.getCurrentValue(dataKey) ?? 0
  }, [metricHelper])

  return {
    hasData,
    getCurrentValue,
    metricHelper
  }
}
