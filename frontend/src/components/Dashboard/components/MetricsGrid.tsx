import React from 'react'
import { MetricCard } from './MetricCard'
import type { MetricConfig, MedicionData } from '../types'

interface MetricsGridProps {
  metrics: MetricConfig[]
  mediciones: MedicionData[]
  selectedNode: any
  onMetricClick: (metric: MetricConfig) => void
  hasMetricData: (dataKey: string) => boolean
  getCurrentValue: (dataKey: string) => number
  getChartData: (dataKey: string) => any[]
  loading?: boolean
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  mediciones,
  selectedNode,
  onMetricClick,
  hasMetricData,
  getCurrentValue,
  getChartData,
  loading = false
}) => {
  if (loading || !selectedNode || metrics.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric) => {
        const hasData = hasMetricData(metric.dataKey)
        const currentValue = hasData ? getCurrentValue(metric.dataKey) : 0
        const chartData = getChartData(metric.dataKey)
        
        return (
          <div
            key={metric.id}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <MetricCard
              metric={metric}
              hasData={hasData}
              currentValue={currentValue}
              chartData={chartData}
              onOpenAnalysis={onMetricClick}
            />
          </div>
        )
      })}
    </div>
  )
}
