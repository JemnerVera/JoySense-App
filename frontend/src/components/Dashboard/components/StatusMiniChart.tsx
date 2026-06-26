import React from 'react'
import type { MetricConfig } from '../types'

interface StatusMiniChartProps {
  metric: MetricConfig
  currentValue: number
  hasData: boolean
  t: any
}

function getStatusLabel(metricTitle: string, isAlert: boolean): string {
  const lower = metricTitle.toLowerCase();
  if (lower.includes('alarma')) {
    return isAlert ? 'ALERTA' : 'SIN ALERTA';
  }
  return isAlert ? 'ACTIVO' : 'INACTIVO';
}

function StatusMiniChartComponent({
  metric,
  currentValue,
  hasData,
}: StatusMiniChartProps) {
  const isAlert = currentValue === 1;
  const statusText = getStatusLabel(metric.title, isAlert);
  const textColor = isAlert ? 'text-red-500' : 'text-green-400';
  const statusDot = isAlert ? '🔴' : '🟢';

  return (
    <div
      className={`bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-6 w-full ${
        !hasData ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start space-x-1 min-w-0">
        <span className="text-xs text-gray-800 dark:text-white flex-shrink-0 mt-0.5">⚡</span>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-gray-800 dark:text-white font-mono tracking-wider leading-tight">
            {metric.rawName || metric.title}
          </h3>
          {metric.nodo && (
            <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-mono leading-none">
              ({metric.nodo})
            </span>
          )}
        </div>
      </div>
      {hasData ? (
        <div className="pt-0.5 flex items-center gap-1">
          <span className="text-sm">{statusDot}</span>
          <span className={`text-sm font-bold font-mono ${textColor} leading-tight`}>
            {statusText}
          </span>
        </div>
      ) : (
        <div className="pt-1">
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full border bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 font-mono">
            NODO OBSERVADO
          </span>
        </div>
      )}
    </div>
  )
}

export const StatusMiniChart = React.memo(StatusMiniChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.metric.id === nextProps.metric.id &&
    prevProps.currentValue === nextProps.currentValue &&
    prevProps.hasData === nextProps.hasData
  )
});

StatusMiniChart.displayName = 'StatusMiniChart';
