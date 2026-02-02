import { useMemo, useRef } from 'react'
import type { MedicionData } from '../types'

/**
 * Custom hook para optimizar el cacheo de datos de gráficos
 * Mantiene un cache persistent que solo se recalcula cuando los datos realmente cambian
 */
export function useOptimizedChartData(
  mediciones: MedicionData[],
  selectedNodeId: number | null,
  processChartDataFn: (dataKey: string) => any[],
  dataKeys: string[] = ['temperatura', 'humedad', 'conductividad']
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
      console.log('[useOptimizedChartData] Cache hit - evitando recálculo')
      return cacheRef.current
    }
    
    console.log('[useOptimizedChartData] Cache miss - recalculando', { 
      selectedNodeId, 
      lastNodeId: lastNodeIdRef.current,
      medicionCount: mediciones.length, 
      lastMedicionCount: lastMedicionLengthRef.current 
    })

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
        if (dataKey === 'temperatura' && (metricName.includes('temperatura') || metricName.includes('temp'))) {
          hasData = true
          break
        }
        if (dataKey === 'humedad' && (metricName.includes('humedad') || metricName.includes('humidity'))) {
          hasData = true
          break
        }
        if (dataKey === 'conductividad' && (metricName.includes('conductividad') || metricName.includes('electroconductividad') || metricName.includes('conductivity'))) {
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
  }, [mediciones.length, selectedNodeId, dataKeys])

  return chartDataCache
}
