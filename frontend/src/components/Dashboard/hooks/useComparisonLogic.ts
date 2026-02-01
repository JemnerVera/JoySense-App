import { useCallback } from 'react'
import type { MedicionData } from '../types'
import type { Nodo, Tipo } from '../../../types'

/**
 * Hook para gestionar lógica de comparación entre nodos
 * Maneja filtrado, etiquetado y cálculo de series visibles
 */
export function useComparisonLogic() {
  /**
   * Filtra mediciones de una métrica específica basada en su nombre
   */
  const filterByMetricName = useCallback((
    mediciones: MedicionData[],
    metricDataKey: string
  ): MedicionData[] => {
    return mediciones.filter(m => {
      const rawMetricName = m.localizacion?.metrica?.metrica || ''
      const metricName = rawMetricName
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .trim()
        .toLowerCase()

      if (metricDataKey === 'temperatura' && (
        metricName.includes('temperatura') || metricName.includes('temp')
      )) return true

      if (metricDataKey === 'humedad' && (
        metricName.includes('humedad') || metricName.includes('humidity')
      )) return true

      if (metricDataKey === 'conductividad' && (
        metricName.includes('conductividad') || 
        metricName.includes('electroconductividad') ||
        metricName.includes('conductivity')
      )) return true

      return false
    })
  }, [])

  /**
   * Obtiene tipos disponibles de sensores para comparación
   * Marca tipos del nodo principal vs nodo de comparación
   */
  const getAvailableSeriesTypes = useCallback((
    mainData: MedicionData[],
    comparisonData: MedicionData[],
    tipos: Tipo[]
  ): Array<{ tipo: string; tipoId: number; isComparison: boolean; nodeNodo: string }> => {
    const series: Array<{ tipo: string; tipoId: number; isComparison: boolean; nodeNodo: string }> = []
    const seenTipos = new Set<string>()

    // Procesar tipos del nodo principal
    mainData.forEach(m => {
      const tipoId = m.tipoid || m.localizacion?.sensor?.tipoid
      if (!tipoId) return

      const tipo = tipos.find(t => t.tipoid === tipoId)
      if (tipo && !seenTipos.has(tipo.tipo)) {
        seenTipos.add(tipo.tipo)
        series.push({
          tipo: tipo.tipo,
          tipoId: tipo.tipoid,
          isComparison: false,
          nodeNodo: m.localizacion?.nodo?.nodo || 'Nodo'
        })
      }
    })

    // Procesar tipos del nodo de comparación
    comparisonData.forEach(m => {
      const tipoId = m.tipoid || m.localizacion?.sensor?.tipoid
      if (!tipoId) return

      const tipo = tipos.find(t => t.tipoid === tipoId)
      if (tipo && !seenTipos.has(`comp:${tipo.tipo}`)) {
        seenTipos.add(`comp:${tipo.tipo}`)
        series.push({
          tipo: tipo.tipo,
          tipoId: tipo.tipoid,
          isComparison: true,
          nodeNodo: m.localizacion?.nodo?.nodo || 'Nodo'
        })
      }
    })

    return series
  }, [])

  /**
   * Determina qué series deben ser visibles basado en selección del usuario
   */
  const getVisibleSeries = useCallback((
    allSeries: Array<{ tipo: string; tipoId: number; isComparison: boolean; nodeNodo: string }>,
    visibleTipos: Set<string>,
    selectedNode: Nodo | null,
    comparisonNode: Nodo | null
  ): Set<string> => {
    if (visibleTipos.size === 0) {
      // Si nada está seleccionado, mostrar todo
      const visible = new Set<string>()
      allSeries.forEach(s => {
        const key = s.isComparison ? `comp:${s.tipo}` : `main:${s.tipo}`
        visible.add(key)
      })
      return visible
    }
    
    return visibleTipos
  }, [])

  /**
   * Calcula estadísticas comparativas entre dos conjuntos de mediciones
   */
  const calculateComparisonStats = useCallback((
    mainData: MedicionData[],
    comparisonData: MedicionData[]
  ): {
    mainAvg: number | null
    comparisonAvg: number | null
    difference: number | null
    percentDifference: number | null
  } => {
    if (mainData.length === 0 || comparisonData.length === 0) {
      return {
        mainAvg: null,
        comparisonAvg: null,
        difference: null,
        percentDifference: null
      }
    }

    const mainAvg = mainData.reduce((sum, m) => sum + m.medicion, 0) / mainData.length
    const comparisonAvg = comparisonData.reduce((sum, m) => sum + m.medicion, 0) / comparisonData.length

    const difference = comparisonAvg - mainAvg
    const percentDifference = mainAvg !== 0 ? (difference / mainAvg) * 100 : null

    return {
      mainAvg,
      comparisonAvg,
      difference,
      percentDifference
    }
  }, [])

  /**
   * Agrupa mediciones por tipo de sensor
   */
  const groupByType = useCallback((
    mediciones: MedicionData[],
    tipos: Tipo[]
  ): Map<number, MedicionData[]> => {
    const grouped = new Map<number, MedicionData[]>()

    mediciones.forEach(m => {
      const tipoId = m.tipoid || m.localizacion?.sensor?.tipoid
      if (!tipoId) return

      if (!grouped.has(tipoId)) {
        grouped.set(tipoId, [])
      }
      grouped.get(tipoId)!.push(m)
    })

    return grouped
  }, [])

  return {
    filterByMetricName,
    getAvailableSeriesTypes,
    getVisibleSeries,
    calculateComparisonStats,
    groupByType
  }
}
