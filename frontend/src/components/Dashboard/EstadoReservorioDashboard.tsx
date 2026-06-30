import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import SupabaseRPCService from '../../services/supabase-rpc'
import { JoySenseService } from '../../services/backend-api'
import { hexToRgba } from '../../utils/chartUtils'
import { nivelToAreaVolumen } from '../../utils/reservorioEquivalencias'

const RESERVORIO_TIPO_IDS = [13, 14, 19]
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

interface NodoSensorInfo {
  nodoid: number
  nodo: string
  sensorid: number
  sensor: string
  tipoid: number
  tipo: string
}

interface ReservoirEntry {
  localizacionid: number
  localizacion: string
  nodos: NodoSensorInfo[]
}

export function EstadoReservorioDashboard() {
  const [entries, setEntries] = useState<ReservoirEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<ReservoirEntry | null>(null)
  const [mediciones, setMediciones] = useState<any[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const now = new Date()
  const defaultStart = new Date(now.getTime() - HOURS_BACK * 60 * 60 * 1000)

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(defaultStart),
    end: getLocalDateString(now),
  })
  const [pendingDateRange, setPendingDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(defaultStart),
    end: getLocalDateString(now),
  })

  useEffect(() => {
    const load = async () => {
      setLoadingEntries(true)
      try {
        const [localizacionData, sensorData] = await Promise.all([
          JoySenseService.getLocalizacionesParaMediciones(1000),
          JoySenseService.getTableData('sensor', 100),
        ])

        const sensorMap = new Map<number, any>()
        ;(sensorData || []).forEach((s: any) => sensorMap.set(s.sensorid, s))

        const grouped = new Map<string, ReservoirEntry>()

        ;(localizacionData || []).forEach((loc: any) => {
          if (!loc.tipoid || !RESERVORIO_TIPO_IDS.includes(Number(loc.tipoid))) return

          const nodo = loc.nodo
          const sensor = sensorMap.get(loc.sensorid)
          const locName = loc.localizacion || `Localización ${loc.localizacionid}`

          if (!grouped.has(locName)) {
            grouped.set(locName, {
              localizacionid: loc.localizacionid,
              localizacion: locName,
              nodos: [],
            })
          }

          const entry = grouped.get(locName)!
          const exists = entry.nodos.some((n) => n.nodoid === loc.nodoid && n.sensorid === loc.sensorid)
          if (!exists) {
            entry.nodos.push({
              nodoid: nodo?.nodoid || loc.nodoid,
              nodo: nodo?.nodo || `Nodo ${loc.nodoid}`,
              sensorid: loc.sensorid,
              sensor: sensor?.sensor || `Sensor ${loc.sensorid}`,
              tipoid: loc.tipoid,
              tipo: sensor?.tipo || '',
            })
          }
        })

        setEntries(Array.from(grouped.values()))
      } catch (err: any) {
        console.error('[EstadoReservorioDashboard] Error loading entries:', err)
        setError('Error al cargar lista de reservorios')
      } finally {
        setLoadingEntries(false)
      }
    }
    load()
  }, [])

  const loadMediciones = useCallback(async () => {
    if (!selectedEntry || !selectedEntry.nodos.length) {
      setMediciones([])
      return
    }
    const startDateTime = `${dateRange.start} 00:00:00`
    const endDateTime = `${dateRange.end} 23:59:59`
    try {
      setLoadingData(true)
      setError(null)
      const results = await Promise.all(
        selectedEntry.nodos.map((n) =>
          SupabaseRPCService.getMedicionesNodoDetallado({
            nodoid: n.nodoid,
            startDate: startDateTime,
            endDate: endDateTime,
          }).then(data =>
            (data || []).map(m => ({
              ...m,
              _nodoid: n.nodoid,
              _nodo: n.nodo,
            }))
          )
        )
      )
      const merged = results.flat().filter(Boolean)
      const valid = merged.filter((m: any) => m.metrica_nombre)
      const normalized = valid.map((m: any) => {
        if ((m.metrica_nombre || '').toLowerCase() === 'nivel' && Number(m.medicion) > 50) {
          return { ...m, medicion: Number(m.medicion) / 100 }
        }
        return m
      })
      setMediciones(normalized)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
      setMediciones([])
    } finally {
      setLoadingData(false)
    }
  }, [selectedEntry, dateRange])

  useEffect(() => { if (selectedEntry) loadMediciones() }, [selectedEntry, dateRange, loadMediciones])

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries
    const term = searchTerm.toLowerCase()
    return entries.filter((e) =>
      e.localizacion.toLowerCase().includes(term) ||
      e.nodos.some((n) =>
        n.nodo.toLowerCase().includes(term) ||
        n.sensor.toLowerCase().includes(term) ||
        n.tipo.toLowerCase().includes(term)
      )
    )
  }, [entries, searchTerm])

  const handleEntrySelect = useCallback((entry: ReservoirEntry) => {
    setSelectedEntry(entry)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }, [])

  const handleApplyDateRange = () => setDateRange(pendingDateRange)

  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      let afId: number
      let mounted = true
      const update = () => {
        if (!mounted || !dropdownRef.current) return
        const rect = dropdownRef.current.getBoundingClientRect()
        setDropdownPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
        if (mounted) afId = requestAnimationFrame(update)
      }
      afId = requestAnimationFrame(update)
      return () => { mounted = false; cancelAnimationFrame(afId) }
    } else {
      setDropdownPosition(null)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false)
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const nivelMediciones = useMemo(() => {
    return mediciones
      .filter((m: any) => (m.metrica_nombre || '').toLowerCase().trim() === 'nivel' && (m._nodo || '').toLowerCase().includes('res'))
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

  if (loadingEntries) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400 font-mono">
        Error: {error}
      </div>
    )
  }

  if (!selectedEntry) {
    return (
      <div className="bg-neutral-900 min-h-full p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-10 min-w-[200px] max-w-[320px] px-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm flex items-center justify-between truncate"
            >
              <span className="text-neutral-400 truncate">Seleccionar localización...</span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && dropdownPosition && (
              <div
                className="fixed z-[9999] bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
                style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${Math.max(dropdownPosition.width * 2, 400)}px` }}
              >
                <div className="p-2 border-b border-neutral-700">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar localización..."
                    className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-base focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                    <button
                      key={entry.localizacion}
                      onClick={() => handleEntrySelect(entry)}
                      className="w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider text-neutral-300 hover:bg-neutral-800"
                    >
                      {entry.localizacion}
                    </button>
                  )) : (
                    <div className="px-3 py-2 text-base text-neutral-500 font-mono">Sin resultados</div>
                  )}
                </div>
                <div className="px-3 py-2 text-xs text-neutral-500 font-mono border-t border-neutral-700 bg-neutral-800">
                  {filteredEntries.length} localización(es)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder */}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">💧</div>
            <p className="text-neutral-400 font-mono text-base">Selecciona una localización para ver su estado</p>
          </div>
        </div>
      </div>
    )
  }

  if (loadingData && mediciones.length === 0) {
    return (
      <div className="bg-neutral-900 min-h-full p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-10 min-w-[200px] max-w-[320px] px-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm flex items-center justify-between truncate"
            >
              <span className="text-white truncate">{selectedEntry.localizacion}</span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && dropdownPosition && (
              <div
                className="fixed z-[9999] bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
                style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${Math.max(dropdownPosition.width * 2, 400)}px` }}
              >
                <div className="p-2 border-b border-neutral-700">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar localización..."
                    className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-base focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                    <button
                      key={entry.localizacion}
                      onClick={() => handleEntrySelect(entry)}
                      className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${selectedEntry?.localizacion === entry.localizacion ? 'bg-cyan-500 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
                    >
                      {entry.localizacion}
                    </button>
                  )) : (
                    <div className="px-3 py-2 text-base text-neutral-500 font-mono">Sin resultados</div>
                  )}
                </div>
                <div className="px-3 py-2 text-xs text-neutral-500 font-mono border-t border-neutral-700 bg-neutral-800">
                  {filteredEntries.length} localización(es)
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
        </div>
      </div>
    )
  }

  if (error && mediciones.length === 0) {
    return (
      <div className="bg-neutral-900 min-h-full p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-10 min-w-[200px] max-w-[320px] px-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm flex items-center justify-between truncate"
            >
              <span className="text-white truncate">{selectedEntry.localizacion}</span>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && dropdownPosition && (
              <div
                className="fixed z-[9999] bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
                style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${Math.max(dropdownPosition.width * 2, 400)}px` }}
              >
                <div className="p-2 border-b border-neutral-700">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar localización..."
                    className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-base focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                    <button
                      key={entry.localizacion}
                      onClick={() => handleEntrySelect(entry)}
                      className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${selectedEntry?.localizacion === entry.localizacion ? 'bg-cyan-500 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
                    >
                      {entry.localizacion}
                    </button>
                  )) : (
                    <div className="px-3 py-2 text-base text-neutral-500 font-mono">Sin resultados</div>
                  )}
                </div>
                <div className="px-3 py-2 text-xs text-neutral-500 font-mono border-t border-neutral-700 bg-neutral-800">
                  {filteredEntries.length} localización(es)
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-red-400 font-mono">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 min-h-full p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="relative" ref={dropdownRef}>
          <label className="text-neutral-400 text-xs font-medium mb-1 font-mono uppercase block">LOCALIZACIÓN</label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="h-10 min-w-[200px] max-w-[320px] px-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm flex items-center justify-between truncate"
          >
            <span className="text-white truncate">{selectedEntry.localizacion}</span>
            <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && dropdownPosition && (
            <div
              className="fixed z-[9999] bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
              style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${Math.max(dropdownPosition.width * 2, 400)}px` }}
            >
              <div className="p-2 border-b border-neutral-700">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar localización..."
                  className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-base focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                  <button
                    key={entry.localizacion}
                    onClick={() => handleEntrySelect(entry)}
                    className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${selectedEntry?.localizacion === entry.localizacion ? 'bg-cyan-500 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
                  >
                    {entry.localizacion}
                  </button>
                )) : (
                  <div className="px-3 py-2 text-base text-neutral-500 font-mono">Sin resultados</div>
                )}
              </div>
              <div className="px-3 py-2 text-xs text-neutral-500 font-mono border-t border-neutral-700 bg-neutral-800">
                {filteredEntries.length} localización(es)
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">DESDE</label>
          <input type="date" value={pendingDateRange.start} onChange={(e) => setPendingDateRange((prev) => ({ ...prev, start: e.target.value }))} className="h-10 w-36 px-2 bg-neutral-800 border border-neutral-600 rounded text-white font-mono text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">HASTA</label>
          <input type="date" value={pendingDateRange.end} onChange={(e) => setPendingDateRange((prev) => ({ ...prev, end: e.target.value }))} className="h-10 w-36 px-2 bg-neutral-800 border border-neutral-600 rounded text-white font-mono text-sm" />
        </div>
        <button onClick={handleApplyDateRange} className="h-10 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-sm transition-colors">APLICAR</button>
        <button onClick={loadMediciones} className="h-10 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-sm transition-colors">ACTUALIZAR</button>
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
