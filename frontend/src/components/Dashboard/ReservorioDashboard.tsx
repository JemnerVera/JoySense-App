import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { hexToRgba } from '../../utils/chartUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFilterSync } from '../../hooks/useFilterSync';

import { PLCDataTable } from './PLCDataTable';
import { MetricMiniChart } from './components/MetricMiniChart';
import { StatusMiniChart } from './components/StatusMiniChart';
import type { MetricConfig } from './types';

const RESERVORIO_TIPO_IDS = [13, 14, 19];
const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#84cc16', '#ec4899'];
const AGGREGATION_MINUTES = 5;
const DEFAULT_HOURS = 12;

const METRIC_COLORS: Record<string, string> = {
  nivel: '#06b6d4',
  electroconductividad: '#10b981',
  ph: '#8b5cf6',
  alarma: '#ef4444',
  desactivacion: '#f97316',
};

function deriveMetricColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(METRIC_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return COLORS[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length];
}

function processChartData(mediciones: any[], metricName: string, nodoName?: string) {
  if (!mediciones || mediciones.length === 0) return [];
  const groupedByTime: Map<string, Map<string, number>> = new Map();
  mediciones.forEach((m: any) => {
    const mName = (m.metrica_nombre || '').toLowerCase().trim();
    if (!mName.includes(metricName.toLowerCase())) return;
    if (nodoName && m._nodo !== nodoName) return;
    const fecha = new Date(m.fecha);
    const minutes = fecha.getMinutes();
    const roundedMinutes = Math.floor(minutes / AGGREGATION_MINUTES) * AGGREGATION_MINUTES;
    fecha.setHours(fecha.getHours(), roundedMinutes, 0, 0);
    const timeKey = fecha.toISOString().replace('T', ' ').slice(0, 16);
    const label = m._nodo || m.localizacion_nombre || `Localización ${m.localizacionid}`;
    const valor = Number(m.medicion);
    if (!groupedByTime.has(timeKey)) groupedByTime.set(timeKey, new Map());
    const existing = groupedByTime.get(timeKey)!.get(label);
    if (existing !== undefined) {
      const countKey = `${label}_count`;
      const count = (groupedByTime.get(timeKey)!.get(countKey) || 0) + 1;
      groupedByTime.get(timeKey)!.set(countKey, count);
      groupedByTime.get(timeKey)!.set(label, (existing * (count - 1) + valor) / count);
    } else {
      groupedByTime.get(timeKey)!.set(label, valor);
    }
  });
  return Array.from(groupedByTime.entries())
    .map(([time, values]) => {
      const entry: any = { time };
      values.forEach((val, key) => { if (!key.toString().endsWith('_count')) entry[key] = val; });
      return entry;
    })
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

function buildDetailedOption(
  chartData: any[],
  metricKeys: string[],
  yDomain: { min: number | null; max: number | null },
  calcDomain: { min: number | null; max: number | null }
): EChartsOption {
  if (!chartData || chartData.length === 0) return { tooltip: {}, xAxis: {}, yAxis: {}, series: [] };
  const xAxisData = chartData.map((d) => d.time);
  const series = metricKeys.map((metricKey, idx) => ({
    name: metricKey,
    type: 'line' as const,
    symbol: 'none' as const,
    sampling: 'lttb' as const,
    connectNulls: true,
    itemStyle: { color: COLORS[idx % COLORS.length] },
    lineStyle: { width: 2 },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: hexToRgba(COLORS[idx % COLORS.length], 0.3) },
        { offset: 1, color: hexToRgba(COLORS[idx % COLORS.length], 0.05) },
      ]),
    },
    data: chartData.map((d) => {
      const val = d[metricKey];
      return typeof val === 'number' && !isNaN(val) ? val : null;
    }),
  }));
  return {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        const lines: string[] = [];
        params.forEach((p: any) => {
          const val = p.value;
          const display = typeof val === 'number' && !isNaN(val) ? val.toFixed(2) : '-';
          lines.push(`${p.marker} ${p.seriesName}: ${display}`);
        });
        const date = params[0]?.axisValue || '';
        return `${date}<br/>${lines.join('<br/>')}`;
      },
    },
    toolbox: { feature: { dataZoom: { yAxisIndex: 'none' as const }, restore: {}, saveAsImage: {} } },
    grid: { left: '4%', right: '4%', bottom: '50px', top: '8%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        color: '#666', fontFamily: 'Inter, sans-serif', interval: Math.floor(xAxisData.length / 24),
        formatter: (value: string) => {
          const parts = value.split(' ');
          if (parts.length < 2) return value;
          const dateParts = parts[0].split('-');
          const timeParts = parts[1].split(':');
          if (dateParts.length < 3) return value;
          return `${timeParts[0]}:${timeParts[1]}\n${dateParts[2]}/${dateParts[1]}`;
        },
      },
      axisLine: { lineStyle: { color: '#ccc' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      min: yDomain.min !== null ? yDomain.min : (calcDomain.min ?? undefined),
      max: yDomain.max !== null ? yDomain.max : (calcDomain.max ?? undefined),
      axisLabel: { color: '#666', fontFamily: 'Inter, sans-serif', formatter: (v: number) => Number.isInteger(v) ? v.toString() : v.toFixed(1) },
      splitLine: { lineStyle: { color: '#eee' } },
      nameTextStyle: { color: '#666', fontSize: 10 },
    },
    dataZoom: [
      { type: 'inside' as const, start: 0, end: 100, xAxisIndex: 0 },
      {
        type: 'slider' as const, start: 0, end: 100, xAxisIndex: 0, height: 25, bottom: '5px',
        textStyle: { color: '#666' }, fillerColor: 'rgba(6, 182, 212, 0.2)', handleStyle: { color: '#06b6d4' },
      },
    ],
    legend: {
      type: 'scroll' as const, orient: 'horizontal' as const, top: 0, left: '3%', right: '4%',
      textStyle: { color: '#666', fontSize: 11 },
      pageTextStyle: { color: '#666' },
      pageIconColor: '#666',
      pageIconInactiveColor: '#ccc',
    },
    series,
  };
}

interface NodoSensorInfo {
  nodoid: number;
  nodo: string;
  sensorid: number;
  sensor: string;
  tipoid: number;
  tipo: string;
}

interface ReservoirEntry {
  localizacionid: number;
  localizacion: string;
  nodos: NodoSensorInfo[];
}

export function ReservorioDashboard() {
  const { t } = useLanguage();

  const [entries, setEntries] = useState<ReservoirEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ReservoirEntry | null>(null);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [fundosInfo, setFundosInfo] = useState<Map<number, any>>(new Map());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDataTable, setShowDataTable] = useState(false);
  const [selectedMetricDetail, setSelectedMetricDetail] = useState<MetricConfig | null>(null);
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [initialYAxisDomain, setInitialYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const { syncDashboardSelectionToGlobal } = useFilterSync(fundosInfo);

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - DEFAULT_HOURS * 60 * 60 * 1000);

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(twelveHoursAgo),
    end: getLocalDateString(now),
  });

  const [pendingDateRange, setPendingDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(twelveHoursAgo),
    end: getLocalDateString(now),
  });

  // ── Initial load: build reservoir entries from sensor + localizacion (via geografia endpoint) ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [localizacionData, sensorData] = await Promise.all([
          JoySenseService.getLocalizacionesParaMediciones(1000),
          JoySenseService.getTableData('sensor', 100),
        ]);

        const sensorMap = new Map<number, any>();
        (sensorData || []).forEach((s: any) => sensorMap.set(s.sensorid, s));

        const fundosMap = new Map();
        (localizacionData || []).forEach((loc: any) => {
          const fundo = loc.nodo?.ubicacion?.zona?.fundo;
          if (fundo && !fundosMap.has(fundo.fundoid)) {
            fundosMap.set(fundo.fundoid, {
              ...fundo,
              empresa: fundo.empresa || null,
              paisid: fundo.empresa?.paisid || null,
            });
          }
        });
        setFundosInfo(fundosMap);

        const grouped = new Map<string, ReservoirEntry>();

        (localizacionData || []).forEach((loc: any) => {
          if (!loc.tipoid || !RESERVORIO_TIPO_IDS.includes(Number(loc.tipoid))) return;

          const nodo = loc.nodo;
          const sensor = sensorMap.get(loc.sensorid);
          const locName = loc.localizacion || `Localización ${loc.localizacionid}`;

          if (!grouped.has(locName)) {
            grouped.set(locName, {
              localizacionid: loc.localizacionid,
              localizacion: locName,
              nodos: [],
            });
          }

          const entry = grouped.get(locName)!;
          const exists = entry.nodos.some((n) => n.nodoid === loc.nodoid && n.sensorid === loc.sensorid);
          if (!exists) {
            entry.nodos.push({
              nodoid: nodo?.nodoid || loc.nodoid,
              nodo: nodo?.nodo || `Nodo ${loc.nodoid}`,
              sensorid: loc.sensorid,
              sensor: sensor?.sensor || `Sensor ${loc.sensorid}`,
              tipoid: loc.tipoid,
              tipo: sensor?.tipo || '',
            });
          }
        });

        setEntries(Array.from(grouped.values()));
      } catch (error) {
        console.error('[ReservorioDashboard] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Load mediciones when entry is selected (all nodos in the localizacion) ──
  const loadMediciones = useCallback(async () => {
    if (!selectedEntry || !selectedEntry.nodos.length) { setMediciones([]); return; }
    const startDateTime = `${dateRange.start} 00:00:00`;
    const endDateTime = `${dateRange.end} 23:59:59`;
    try {
      setLoadingData(true);
      // 🔍 LOG: parámetros del RPC
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
      );
      const merged = results.flat().filter(Boolean);
      const valid = merged.filter((m: any) => m.metrica_nombre);
      const normalized = valid.map((m: any) => {
        if ((m.metrica_nombre || '').toLowerCase() === 'nivel' && Number(m.medicion) > 50) {
          return { ...m, medicion: Number(m.medicion) / 100 };
        }
        return m;
      });
      setMediciones(normalized);
    } catch (error) {
      console.error('[ReservorioDashboard] Error loading mediciones:', error);
      setMediciones([]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedEntry, dateRange]);

  useEffect(() => { if (selectedEntry) loadMediciones(); }, [selectedEntry, dateRange, loadMediciones]);
  useEffect(() => { setSelectedMetricDetail(null); }, [selectedEntry]);

  // ── Filtered entries for dropdown ──
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    const term = searchTerm.toLowerCase();
    return entries.filter((e) =>
      e.localizacion.toLowerCase().includes(term) ||
      e.nodos.some((n) =>
        n.nodo.toLowerCase().includes(term) ||
        n.sensor.toLowerCase().includes(term) ||
        n.tipo.toLowerCase().includes(term)
      )
    );
  }, [entries, searchTerm]);

  const handleEntrySelect = useCallback((entry: ReservoirEntry) => {
    setSelectedEntry(entry);
    setSelectedMetricDetail(null);
    setIsDropdownOpen(false);
    setSearchTerm('');
  }, []);

  // ── Metric derivation ──
  const availableMetrics = useMemo<MetricConfig[]>(() => {
    if (!mediciones || mediciones.length === 0) return [];
    const metricSet = new Map<string, { name: string; values: number[]; nodo: string; unit: string }>();
    mediciones.forEach((m: any) => {
      const nodo = m._nodo || `Nodo ${m._nodoid}`;
      const key = `${(m.metrica_nombre || 'Métrica').trim()}||${nodo}`;
      if (!metricSet.has(key)) {
        metricSet.set(key, { name: `${(m.metrica_nombre || 'Métrica').trim()} (${nodo})`, values: [], nodo, unit: m.unidad || '' });
      }
      const val = Number(m.medicion);
      if (!isNaN(val) && val !== null) metricSet.get(key)!.values.push(val);
    });
    const result = Array.from(metricSet.values()).map((entry) => {
      const rawName = entry.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const dataKey = entry.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const allBinary = entry.values.every(v => v === 0 || v === 1);
      return {
        id: dataKey,
        title: entry.name,
        color: deriveMetricColor(entry.name),
        unit: entry.unit,
        dataKey,
        description: `Medición de ${entry.name}`,
        ranges: { min: 0, max: 100, optimal: [20, 80] },
        isBinary: allBinary,
        nodo: entry.nodo,
        rawName,
      } as MetricConfig;
    });
    return result;
  }, [mediciones]);

  const chartDataCache = useMemo<{ [key: string]: any[] }>(() => {
    const cache: { [key: string]: any[] } = {};
    if (!mediciones || mediciones.length === 0) return cache;
    availableMetrics.forEach((metric) => {
      cache[metric.dataKey] = processChartData(mediciones, metric.rawName || metric.title, metric.nodo);
    });
    return cache;
  }, [mediciones, availableMetrics]);

  const currentValues = useMemo<{ [key: string]: number }>(() => {
    const values: { [key: string]: number } = {};
    if (!mediciones || mediciones.length === 0) return values;
    availableMetrics.forEach((metric) => {
      const rawName = (metric.rawName || metric.title).toLowerCase();
      const nodoFilter = metric.nodo;
      const m = mediciones.filter((m: any) => {
        const matchesMetric = (m.metrica_nombre || '').toLowerCase().includes(rawName);
        const matchesNodo = !nodoFilter || m._nodo === nodoFilter;
        return matchesMetric && matchesNodo;
      });
      if (m.length > 0) {
        const sorted = [...m].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        for (const item of sorted) {
          const val = Number(item.medicion);
          if (!isNaN(val) && val !== null) { values[metric.dataKey] = val; break; }
        }
      }
    });
    return values;
  }, [mediciones, availableMetrics]);

  const selectedDetailChartData = useMemo<any[]>(() => {
    if (!selectedMetricDetail) return [];
    return chartDataCache[selectedMetricDetail.dataKey] || [];
  }, [selectedMetricDetail, chartDataCache]);

  const selectedDetailKeys = useMemo<string[]>(() => {
    if (!selectedDetailChartData || selectedDetailChartData.length === 0) return [];
    const keys = new Set<string>();
    selectedDetailChartData.forEach((d) => { Object.keys(d).forEach((k) => { if (k !== 'time') keys.add(k); }); });
    return Array.from(keys);
  }, [selectedDetailChartData]);

  const selectedCalcDomain = useMemo(() => {
    if (!selectedDetailChartData || selectedDetailChartData.length === 0) return { min: null, max: null };
    let minVal = Infinity, maxVal = -Infinity;
    selectedDetailChartData.forEach((d) => {
      Object.keys(d).forEach((key) => {
        if (key !== 'time') {
          const val = Number(d[key]);
          if (!isNaN(val) && val !== null) { minVal = Math.min(minVal, val); maxVal = Math.max(maxVal, val); }
        }
      });
    });
    if (minVal === Infinity || maxVal === -Infinity) return { min: null, max: null };
    const padding = Math.max((maxVal - minVal) * 0.1, 0.5);
    const rawMin = minVal - padding;
    const rawMax = maxVal + padding;
    // Round to nice numbers: if range < 10, use 1-decimal precision; else integer
    const precision = (maxVal - minVal + padding * 2) < 10 ? 1 : 0;
    const round = (v: number, p: number) => Math.round(v * Math.pow(10, p)) / Math.pow(10, p);
    return { min: round(rawMin, precision), max: round(rawMax, precision) };
  }, [selectedDetailChartData]);

  useEffect(() => {
    if (yAxisDomain.min === null && yAxisDomain.max === null) setInitialYAxisDomain(selectedCalcDomain);
  }, [selectedCalcDomain, selectedDetailChartData]);

  const detailOption = useMemo<EChartsOption>(() => {
    return buildDetailedOption(selectedDetailChartData, selectedDetailKeys, yAxisDomain, selectedCalcDomain);
  }, [selectedDetailChartData, selectedDetailKeys, yAxisDomain, selectedCalcDomain]);

  // ── Dropdown positioning ──
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      let afId: number;
      let mounted = true;
      const update = () => {
        if (!mounted || !dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
        if (mounted) afId = requestAnimationFrame(update);
      };
      afId = requestAnimationFrame(update);
      return () => { mounted = false; cancelAnimationFrame(afId); };
    } else {
      setDropdownPosition(null);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleApplyDateRange = () => setDateRange(pendingDateRange);
  const handleOpenMetricDetail = (metric: MetricConfig) => {
    setSelectedMetricDetail(metric);
    setYAxisDomain({ min: null, max: null });
    setShowDataTable(false);
  };
  const handleCloseMetricDetail = () => {
    setSelectedMetricDetail(null);
    setYAxisDomain({ min: null, max: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">Cargando reservorios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 dark:bg-neutral-800 px-4 py-3 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
        <div className="flex flex-nowrap gap-4 items-end justify-start overflow-x-auto w-full">
          <div className="flex flex-col flex-shrink-0">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">
              LOCALIZACIÓN
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-10 min-w-[200px] max-w-[320px] px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm flex items-center justify-between truncate"
              >
                <span className={selectedEntry ? 'text-gray-800 dark:text-white truncate' : 'text-gray-500 dark:text-neutral-400'}>
                  {selectedEntry ? selectedEntry.localizacion : 'Seleccionar localización...'}
                </span>
                <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && dropdownPosition && (
                <div
                  className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
                  style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: `${Math.max(dropdownPosition.width * 2, 400)}px` }}
                >
                  <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar localización..."
                      className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-base focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                    {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                      <button
                        key={entry.localizacion}
                        onClick={() => handleEntrySelect(entry)}
                        className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${selectedEntry?.localizacion === entry.localizacion ? 'bg-cyan-500 text-white' : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                      >
                        <div>{entry.localizacion}</div>
                        <div className="text-xs text-gray-500 dark:text-neutral-400">
                          {entry.nodos.map((n) => `${n.nodo} (${n.sensor})`).join(' · ')}
                        </div>
                      </button>
                    )) : (
                      <div className="px-3 py-2 text-base text-gray-500 dark:text-neutral-400 font-mono">Sin resultados</div>
                    )}
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-neutral-400 font-mono border-t border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                    {filteredEntries.length} localización(es)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-300 dark:bg-neutral-600 self-center"></div>

          <div className="flex flex-col">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">DESDE</label>
            <input type="date" value={pendingDateRange.start} onChange={(e) => setPendingDateRange((prev) => ({ ...prev, start: e.target.value }))} className="h-10 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono" />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">HASTA</label>
            <input type="date" value={pendingDateRange.end} onChange={(e) => setPendingDateRange((prev) => ({ ...prev, end: e.target.value }))} className="h-10 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono" />
          </div>
          <button onClick={handleApplyDateRange} className="h-10 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded font-mono text-sm font-medium self-end">APLICAR</button>
        </div>
      </div>

      {/* Content */}
      {selectedEntry ? (
        <div className="flex-1 p-4 overflow-auto">
          {loadingData ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">Cargando datos...</p>
            </div>
          ) : availableMetrics.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">Sin datos de métricas disponibles</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-hidden">
              {availableMetrics.map((metric) => {
                const chartData = chartDataCache[metric.dataKey] || [];
                const currentValue = currentValues[metric.dataKey] ?? 0;
                if (metric.isBinary) {
                  return (
                    <StatusMiniChart
                      key={metric.id}
                      metric={metric}
                      currentValue={currentValue}
                      hasData={chartData.length > 0}
                      t={t}
                    />
                  );
                }
                return (
                  <MetricMiniChart
                    key={metric.id}
                    metric={metric}
                    chartData={chartData}
                    currentValue={currentValue}
                    hasData={chartData.length > 0}
                    onOpenAnalysis={handleOpenMetricDetail}
                    t={t}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">💧</div>
            <p className="text-gray-500 dark:text-neutral-400 font-mono text-base">
              Selecciona una localización para ver sus métricas
            </p>
          </div>
        </div>
      )}

      {/* Metric Detail Modal */}
      {selectedMetricDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 w-full h-screen flex flex-col">
            {/* Top bar: title only */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={handleCloseMetricDetail} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-mono text-sm font-bold transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  VOLVER
                </button>
                <h3 className="text-lg font-bold text-cyan-500 font-mono">{selectedMetricDetail.title}</h3>
              </div>
            </div>
            {/* Controls bar: Y-axis limits + DATOS button */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex-shrink-0">
              <div className="flex items-center gap-1">
                <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium font-mono uppercase mr-1">Y:</label>
                <input type="number" step="0.1" value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? Math.round(yAxisDomain.min * 100) / 100 : ''}
                  onChange={(e) => { const v = e.target.value; if (v === '') { setYAxisDomain({ ...yAxisDomain, min: null }); return; } const n = Number(v); if (!isNaN(n) && isFinite(n)) setYAxisDomain({ ...yAxisDomain, min: n }); }} placeholder="Min" className="h-8 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono" />
                <span className="text-gray-600 dark:text-neutral-400 text-sm mx-1">-</span>
                <input type="number" step="0.1" value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? Math.round(yAxisDomain.max * 100) / 100 : ''}
                  onChange={(e) => { const v = e.target.value; if (v === '') { setYAxisDomain({ ...yAxisDomain, max: null }); return; } const n = Number(v); if (!isNaN(n) && isFinite(n)) setYAxisDomain({ ...yAxisDomain, max: n }); }} placeholder="Max" className="h-8 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono" />
                <button onClick={() => setYAxisDomain(initialYAxisDomain)} className="h-8 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-mono ml-2">RESET</button>
              </div>
              <button onClick={() => setShowDataTable(!showDataTable)}
                className={`h-8 px-4 rounded font-mono text-sm font-medium ${showDataTable ? 'bg-cyan-600 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600'}`}>
                {showDataTable ? 'GRÁFICO' : 'DATOS'}
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              {showDataTable ? (
                <PLCDataTable selectedNodo={selectedEntry && selectedEntry.nodos.length > 0 ? { nodoid: selectedEntry.nodos[0].nodoid, nodo: selectedEntry.nodos[0].nodo } : null} dateRange={dateRange} onClose={() => setShowDataTable(false)} />
              ) : selectedDetailChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">No hay datos disponibles</p>
                </div>
              ) : (
                <ReactECharts option={detailOption} style={{ width: '100%', height: '65vh' }} opts={{ renderer: 'canvas' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
