import { useState, useCallback, useMemo } from 'react'
import type { MedicionData } from '../types'

export interface YAxisDomain {
  min: number | null
  max: number | null
}

export interface AxisRange {
  min: number
  max: number
  range: number
  padding: number
}

/**
 * Hook para gestionar configuración de ejes Y dinámicos
 * Calcula rangos automáticos y permite ajustes manuales
 */
export function useAxisConfiguration() {
  const [yAxisDomain, setYAxisDomain] = useState<YAxisDomain>({ min: null, max: null })

  /**
   * Calcula el rango recomendado basado en los datos
   */
  const calculateAutoRange = useCallback((mediciones: MedicionData[]): AxisRange | null => {
    if (mediciones.length === 0) {
      return null
    }

    const values = mediciones.map(m => m.medicion).filter(v => !isNaN(v))
    if (values.length === 0) {
      return null
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    // Agregar padding del 10% arriba y abajo
    const padding = range * 0.1 || 1

    return {
      min: Math.floor((min - padding) * 100) / 100,
      max: Math.ceil((max + padding) * 100) / 100,
      range,
      padding
    }
  }, [])

  /**
   * Obtiene el rango del eje Y para Recharts
   * Usa valores personalizados si están definidos, si no usa auto-rango
   */
  const getYAxisDomain = useCallback((mediciones: MedicionData[]): [number | string, number | string] => {
    // Si el usuario ha definido valores personalizados, usarlos
    if (yAxisDomain.min !== null && yAxisDomain.max !== null) {
      return [yAxisDomain.min, yAxisDomain.max]
    }

    // Si el usuario definió solo el mínimo
    if (yAxisDomain.min !== null) {
      const autoRange = calculateAutoRange(mediciones)
      return [yAxisDomain.min, autoRange?.max || 'auto']
    }

    // Si el usuario definió solo el máximo
    if (yAxisDomain.max !== null) {
      const autoRange = calculateAutoRange(mediciones)
      return [autoRange?.min || 'auto', yAxisDomain.max]
    }

    // Si nada está personalizado, usar auto
    return ['auto', 'auto']
  }, [yAxisDomain, calculateAutoRange])

  /**
   * Valida que los valores del eje Y sean válidos
   */
  const isValidYAxisValue = useCallback((value: number): boolean => {
    return !isNaN(value) && isFinite(value) && value >= -999999 && value <= 999999
  }, [])

  /**
   * Establece el valor mínimo del eje Y con validación
   */
  const setYAxisMin = useCallback((value: number | null): void => {
    if (value === null) {
      setYAxisDomain(prev => ({ ...prev, min: null }))
      return
    }

    if (isValidYAxisValue(value)) {
      setYAxisDomain(prev => ({ ...prev, min: value }))
    }
  }, [isValidYAxisValue])

  /**
   * Establece el valor máximo del eje Y con validación
   */
  const setYAxisMax = useCallback((value: number | null): void => {
    if (value === null) {
      setYAxisDomain(prev => ({ ...prev, max: null }))
      return
    }

    if (isValidYAxisValue(value)) {
      setYAxisDomain(prev => ({ ...prev, max: value }))
    }
  }, [isValidYAxisValue])

  /**
   * Resetea el eje Y a valores automáticos
   */
  const resetYAxis = useCallback((): void => {
    setYAxisDomain({ min: null, max: null })
  }, [])

  /**
   * Verifica si el eje Y tiene alguna personalización
   */
  const hasCustomYAxis = useMemo(() => {
    return yAxisDomain.min !== null || yAxisDomain.max !== null
  }, [yAxisDomain])

  /**
   * Calcula el rango de ticks para el eje Y basado en los datos
   */
  const calculateTickIntervals = useCallback((mediciones: MedicionData[]): number[] => {
    const autoRange = calculateAutoRange(mediciones)
    if (!autoRange) return []

    const min = yAxisDomain.min ?? autoRange.min
    const max = yAxisDomain.max ?? autoRange.max

    const range = max - min
    const tickCount = 5 // Número de ticks a mostrar

    const interval = Math.ceil(range / tickCount * 100) / 100
    const ticks: number[] = []

    for (let i = 0; i <= tickCount; i++) {
      ticks.push(Math.round((min + interval * i) * 100) / 100)
    }

    return ticks
  }, [yAxisDomain, calculateAutoRange])

  return {
    yAxisDomain,
    setYAxisDomain,
    setYAxisMin,
    setYAxisMax,
    resetYAxis,
    getYAxisDomain,
    hasCustomYAxis,
    isValidYAxisValue,
    calculateAutoRange,
    calculateTickIntervals
  }
}
