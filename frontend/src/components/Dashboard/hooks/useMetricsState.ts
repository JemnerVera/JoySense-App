import { useState, useCallback } from 'react'
import type { MetricConfig, MedicionData } from '../types'

interface UseMetricsStateReturn {
  metricas: any[]
  tipos: any[]
  sensores: any[]
  ubicaciones: any[]
  mediciones: MedicionData[]
  detailedMediciones: MedicionData[]
  loading: boolean
  error: string | null
  selectedNode: any
  
  setMetricas: (m: any[]) => void
  setTipos: (t: any[]) => void
  setSensores: (s: any[]) => void
  setUbicaciones: (u: any[]) => void
  setMediciones: (m: MedicionData[]) => void
  setDetailedMediciones: (m: MedicionData[]) => void
  setLoading: (l: boolean) => void
  setError: (e: string | null) => void
  setSelectedNode: (n: any) => void
}

export function useMetricsState(): UseMetricsStateReturn {
  const [metricas, setMetricas] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [sensores, setSensores] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [mediciones, setMediciones] = useState<MedicionData[]>([])
  const [detailedMediciones, setDetailedMediciones] = useState<MedicionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)

  return {
    metricas,
    tipos,
    sensores,
    ubicaciones,
    mediciones,
    detailedMediciones,
    loading,
    error,
    selectedNode,
    setMetricas,
    setTipos,
    setSensores,
    setUbicaciones,
    setMediciones,
    setDetailedMediciones,
    setLoading,
    setError,
    setSelectedNode
  }
}
