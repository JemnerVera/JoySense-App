import { useState } from 'react'
import type { MetricConfig } from '../types'

interface UseDetailedAnalysisReturn {
  // Estados
  showDetailedAnalysis: boolean
  isModalExpanded: boolean
  selectedMetricForAnalysis: MetricConfig | null
  selectedDetailedMetric: string
  detailedStartDate: string
  detailedEndDate: string
  tempStartDate: string
  tempEndDate: string
  loadingDetailedData: boolean
  yAxisDomain: { min: number | null; max: number | null }
  comparisonNode: any
  comparisonMediciones: any[]
  loadingComparisonData: boolean
  visibleTipos: Set<string>
  
  // Setters
  setShowDetailedAnalysis: (s: boolean) => void
  setIsModalExpanded: (s: boolean) => void
  setSelectedMetricForAnalysis: (m: MetricConfig | null) => void
  setSelectedDetailedMetric: (m: string) => void
  setDetailedStartDate: (d: string) => void
  setDetailedEndDate: (d: string) => void
  setTempStartDate: (d: string) => void
  setTempEndDate: (d: string) => void
  setLoadingDetailedData: (l: boolean) => void
  setYAxisDomain: (d: { min: number | null; max: number | null }) => void
  setComparisonNode: (n: any) => void
  setComparisonMediciones: (m: any[]) => void
  setLoadingComparisonData: (l: boolean) => void
  setVisibleTipos: (v: Set<string>) => void
}

export function useDetailedAnalysis(): UseDetailedAnalysisReturn {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [isModalExpanded, setIsModalExpanded] = useState(false)
  const [selectedMetricForAnalysis, setSelectedMetricForAnalysis] = useState<MetricConfig | null>(null)
  const [selectedDetailedMetric, setSelectedDetailedMetric] = useState<string>('temperatura')
  const [detailedStartDate, setDetailedStartDate] = useState<string>('')
  const [detailedEndDate, setDetailedEndDate] = useState<string>('')
  const [tempStartDate, setTempStartDate] = useState<string>('')
  const [tempEndDate, setTempEndDate] = useState<string>('')
  const [loadingDetailedData, setLoadingDetailedData] = useState(false)
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null })
  const [comparisonNode, setComparisonNode] = useState<any>(null)
  const [comparisonMediciones, setComparisonMediciones] = useState<any[]>([])
  const [loadingComparisonData, setLoadingComparisonData] = useState(false)
  const [visibleTipos, setVisibleTipos] = useState<Set<string>>(new Set())

  return {
    showDetailedAnalysis,
    isModalExpanded,
    selectedMetricForAnalysis,
    selectedDetailedMetric,
    detailedStartDate,
    detailedEndDate,
    tempStartDate,
    tempEndDate,
    loadingDetailedData,
    yAxisDomain,
    comparisonNode,
    comparisonMediciones,
    loadingComparisonData,
    visibleTipos,
    setShowDetailedAnalysis,
    setIsModalExpanded,
    setSelectedMetricForAnalysis,
    setSelectedDetailedMetric,
    setDetailedStartDate,
    setDetailedEndDate,
    setTempStartDate,
    setTempEndDate,
    setLoadingDetailedData,
    setYAxisDomain,
    setComparisonNode,
    setComparisonMediciones,
    setLoadingComparisonData,
    setVisibleTipos
  }
}
