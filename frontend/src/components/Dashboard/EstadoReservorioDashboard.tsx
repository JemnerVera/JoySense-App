import React, { useState, useEffect, useMemo, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import SupabaseRPCService from '../../services/supabase-rpc'
import { hexToRgba } from '../../utils/chartUtils'
import { nivelToAreaVolumen } from '../../utils/reservorioEquivalencias'

const NODO_ID = 393
const HOURS_BACK = 8
const CHART_COLORS = ['#06b6d4', '#3b82f6']

function formatFecha(fecha: string): string {
  const d = new Date(fecha)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  const MM = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${hh}:${mm}\n${dd}/${MM}`
}

function formatNum(v: number, decimals = 2): string {
  if (!isFinite(v)) return '--'
  return v.toFixed(decimals)
}

export function EstadoReservorioDashboard() {
  const [mediciones, setMediciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const start = new Date(now.getTime() - HOURS_BACK * 60 * 60 * 1000)
      const fmt = (d: Date) =>
        d.toISOString().replace('T', ' ').slice(0, 19)
      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: NODO_ID,
        startDate: fmt(start),
        endDate: fmt(now),
      })
      setMediciones(data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const nivelMediciones = useMemo(() => {
    return mediciones
      .filter((m: any) => (m.metrica_nombre || '').toLowerCase().trim() === 'nivel')
      .map((m: any) => {
        let nivel = Number(m.medicion)
        if (nivel > 50) nivel = nivel / 100
        return { ...m, medicion: nivel }
      })
      .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }, [mediciones])

  const derivedData = useMemo(() => {
    return nivelMediciones.map((m: any) => {
      const nivel = Number(m.medicion)
      const derived = nivelToAreaVolumen(nivel)
      return {
        fecha: m.fecha,
        nivel,
        area: derived?.area ?? 0,
        volumen: derived?.volumen ?? 0,
      }
    })
  }, [nivelMediciones])

  const current = useMemo(() => {
    if (derivedData.length === 0) return null
    return derivedData[derivedData.length - 1]
  }, [derivedData])

  const trend = useMemo(() => {
    if (derivedData.length < 2) return { icon: '→', label: 'Sin datos', color: 'text-gray-400' }
    const first = derivedData[0].nivel
    const last = derivedData[derivedData.length - 1].nivel
    const diff = (last - first) / Math.abs(first || 1)
    if (diff > 0.01) return { icon: '↑', label: 'Aumentando', color: 'text-green-500' }
    if (diff < -0.01) return { icon: '↓', label: 'Disminuyendo', color: 'text-red-500' }
    return { icon: '→', label: 'Estable', color: 'text-gray-500' }
  }, [derivedData])

  const buildChartOption = useCallback((data: { fecha: string; value: number }[], label: string, unit: string, color: string): EChartsOption => {
    const times = data.map(d => d.fecha)
    const values = data.map(d => d.value)
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const p = params[0]
          return `${formatFecha(p.axisValue)}<br/>${p.marker} ${label}: ${formatNum(p.value)} ${unit}`
        },
      },
      grid: { left: 60, right: 20, top: 10, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLabel: {
          color: '#999', fontSize: 10, fontFamily: 'monospace',
          formatter: (v: string) => formatFecha(v),
          interval: Math.max(0, Math.floor(times.length / 12)),
        },
        axisLine: { lineStyle: { color: '#333' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#999', fontSize: 10, fontFamily: 'monospace', formatter: (v: number) => formatNum(v, 1) },
        splitLine: { lineStyle: { color: '#2a2a2a' } },
      },
      series: [{
        type: 'line',
        data: values,
        symbol: 'none',
        smooth: true,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, 0.3) },
            { offset: 1, color: hexToRgba(color, 0.02) },
          ]),
        },
      }],
    }
  }, [])

  const areaChartOption = useMemo(() => {
    const data = derivedData.map(d => ({ fecha: d.fecha, value: d.area }))
    return buildChartOption(data, 'Área', 'm²', CHART_COLORS[0])
  }, [derivedData, buildChartOption])

  const volumenChartOption = useMemo(() => {
    const data = derivedData.map(d => ({ fecha: d.fecha, value: d.volumen }))
    return buildChartOption(data, 'Volumen', 'm³', CHART_COLORS[1])
  }, [derivedData, buildChartOption])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400 font-mono">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 min-h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={loadData}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-sm transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-5">
          <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider mb-1">Nivel</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {current ? `${formatNum(current.nivel, 2)} m` : '--'}
          </div>
        </div>
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-5">
          <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider mb-1">Área</div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {current ? `${formatNum(current.area, 1)} m²` : '--'}
          </div>
        </div>
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-5">
          <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider mb-1">Volumen</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">
            {current ? `${formatNum(current.volumen, 1)} m³` : '--'}
          </div>
        </div>
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-5">
          <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider mb-1">Tendencia (8h)</div>
          <div className={`text-2xl font-bold font-mono ${trend.color} flex items-center gap-2`}>
            <span>{trend.icon}</span>
            <span>{trend.label}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
          <h2 className="text-sm font-bold text-neutral-300 font-mono uppercase tracking-wider mb-3">Área (m²)</h2>
          {derivedData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-neutral-500 font-mono text-sm">
              Sin datos
            </div>
          ) : (
            <ReactECharts option={areaChartOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
          )}
        </div>
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
          <h2 className="text-sm font-bold text-neutral-300 font-mono uppercase tracking-wider mb-3">Volumen (m³)</h2>
          {derivedData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-neutral-500 font-mono text-sm">
              Sin datos
            </div>
          ) : (
            <ReactECharts option={volumenChartOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
          )}
        </div>
      </div>

      {/* Equivalencias table */}
      <details className="bg-neutral-800 rounded-xl border border-neutral-700">
        <summary className="px-5 py-3 text-sm text-neutral-400 font-mono cursor-pointer hover:text-neutral-200 transition-colors">
          Tabla de equivalencias nivel → área / volumen
        </summary>
        <div className="px-5 pb-4">
          <table className="w-full text-sm font-mono text-neutral-300">
            <thead>
              <tr className="text-neutral-500 border-b border-neutral-700">
                <th className="text-left py-2">Nivel min</th>
                <th className="text-left py-2">Nivel max</th>
                <th className="text-left py-2">Área (m²)</th>
                <th className="text-left py-2">Volumen (m³)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { min: 0.00, max: 1.00, area: 526.31, volumen: 5918.60 },
                { min: 1.00, max: 2.00, area: 526.43, volumen: 5389.57 },
                { min: 2.00, max: 3.00, area: 549.21, volumen: 4861.23 },
                { min: 3.00, max: 4.00, area: 665.39, volumen: 4263.63 },
                { min: 4.00, max: 5.00, area: 1713.18, volumen: 3389.18 },
                { min: 5.00, max: 5.52, area: 2202.23, volumen: 404.36 },
              ].map((row, i) => (
                <tr key={i} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
                  <td className="py-2">{row.min.toFixed(2)}</td>
                  <td className="py-2">{row.max.toFixed(2)}</td>
                  <td className="py-2">{row.area.toFixed(2)}</td>
                  <td className="py-2">{row.volumen.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
