import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { hexToRgba } from '../../utils/chartUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFilterSync } from '../../hooks/useFilterSync';
import { useEChartsReady } from '../../hooks/useEChartsReady';
import { PLCDataTable } from './PLCDataTable';
import { MetricMiniChart } from './components/MetricMiniChart';
import { OdometerCard } from './components/OdometerCard';
import { CompassRose } from './components/CompassRose';
import type { MetricConfig } from './types';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TRACTOR_TIPO_IDS = [18];
const COLORS = ['#eab308', '#f97316', '#84cc16', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
const AGGREGATION_MINUTES = 5;
const DEFAULT_HOURS = 12;

const METRIC_COLORS: Record<string, string> = {
  velocidad: '#eab308',
  rumbo: '#f97316',
  odometro: '#84cc16',
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
        color: '#666', fontFamily: 'Inter, sans-serif', rotate: 45,
        interval: Math.floor(xAxisData.length / 24),
      },
      axisLine: { lineStyle: { color: '#ccc' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      min: yDomain.min !== null ? yDomain.min : (calcDomain.min ?? undefined),
      max: yDomain.max !== null ? yDomain.max : (calcDomain.max ?? undefined),
      axisLabel: { color: '#666', fontFamily: 'Inter, sans-serif', formatter: (v: number) => v.toFixed(1) },
      splitLine: { lineStyle: { color: '#eee' } },
      nameTextStyle: { color: '#666', fontSize: 10 },
    },
    dataZoom: [
      { type: 'inside' as const, start: 0, end: 100, xAxisIndex: 0 },
      {
        type: 'slider' as const, start: 0, end: 100, xAxisIndex: 0, height: 25, bottom: '5px',
        textStyle: { color: '#666' }, fillerColor: 'rgba(234, 179, 8, 0.2)', handleStyle: { color: '#eab308' },
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

function MapBoundsUpdater({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, coords]);
  return null;
}

function createTractorIcon(color: string, isStart: boolean) {
  return L.divIcon({
    className: 'custom-tractor-icon',
    html: `
      <div style="
        background-color: ${color};
        width: ${isStart ? 20 : 16}px;
        height: ${isStart ? 20 : 16}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      ">${isStart ? '🚜' : '📍'}</div>
    `,
    iconSize: [isStart ? 20 : 16, isStart ? 20 : 16],
    iconAnchor: [isStart ? 10 : 8, isStart ? 10 : 8],
    popupAnchor: [0, -10],
  });
}

interface NodoSensorInfo {
  nodoid: number;
  nodo: string;
  sensorid: number;
  sensor: string;
  tipoid: number;
  tipo: string;
}

interface TractorEntry {
  localizacionid: number;
  localizacion: string;
  nodos: NodoSensorInfo[];
}

export function TractorDashboard() {
  const { t } = useLanguage();

  const [entries, setEntries] = useState<TractorEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<TractorEntry | null>(null);
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
  const { isReady: modalChartReady, containerRef: modalChartContainerRef, chartRef: modalChartRef } = useEChartsReady();
  const { syncDashboardSelectionToGlobal } = useFilterSync(fundosInfo);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

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

        const grouped = new Map<string, TractorEntry>();
        (localizacionData || []).forEach((loc: any) => {
          if (!loc.tipoid || !TRACTOR_TIPO_IDS.includes(Number(loc.tipoid))) return;
          const nodo = loc.nodo;
          const sensor = sensorMap.get(loc.sensorid);
          const nodoName = nodo?.nodo || `Nodo ${loc.nodoid}`;
          if (!grouped.has(nodoName)) {
            grouped.set(nodoName, {
              localizacionid: loc.localizacionid,
              localizacion: nodoName,
              nodos: [],
            });
          }
          const entry = grouped.get(nodoName)!;
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
        console.error('[TractorDashboard] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadMediciones = useCallback(async () => {
    if (!selectedEntry || !selectedEntry.nodos.length) { setMediciones([]); return; }
    const startDateTime = `${dateRange.start} 00:00:00`;
    const endDateTime = `${dateRange.end} 23:59:59`;
    try {
      setLoadingData(true);
      const results = await Promise.all(
        selectedEntry.nodos.map((n) =>
          SupabaseRPCService.getMedicionesNodoDetallado({
            nodoid: n.nodoid,
            startDate: startDateTime,
            endDate: endDateTime,
          }).then(data => (data || []).map(m => ({
            ...m,
            _nodoid: n.nodoid,
            _nodo: n.nodo,
          })))
        )
      );
      const merged = results.flat().filter(Boolean);
      console.log('[TractorDashboard] mediciones load:', {
        nodosSolicitados: selectedEntry.nodos.length,
        startDateTime,
        endDateTime,
        rawCount: merged.length,
        metricasUnicas: [...new Set(merged.map((m: any) => m.metrica_nombre))],
        sample: merged.slice(0, 2),
      });
      setMediciones(merged);
    } catch (error) {
      console.error('[TractorDashboard] Error loading mediciones:', error);
      setMediciones([]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedEntry, dateRange]);

  const loadMedicionesRef = useRef(loadMediciones);
  loadMedicionesRef.current = loadMediciones;

  useEffect(() => { if (selectedEntry) loadMedicionesRef.current(); }, [selectedEntry, dateRange]);
  useEffect(() => { setSelectedMetricDetail(null); }, [selectedEntry]);

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

  const handleEntrySelect = useCallback((entry: TractorEntry) => {
    setSelectedEntry(entry);
    setSelectedMetricDetail(null);
    setIsDropdownOpen(false);
    setSearchTerm('');
  }, []);

  const routeCoords = useMemo<[number, number][]>(() => {
    if (!mediciones || mediciones.length === 0) return [];
    const pairs = new Map<string, { lat: number; lng: number; time: Date }>();
    mediciones.forEach((m: any) => {
      const name = (m.metrica_nombre || '').toLowerCase().trim();
      const val = Number(m.medicion);
      if (isNaN(val)) return;
      const fecha = new Date(m.fecha);
      fecha.setMilliseconds(0);
      const timeKey = fecha.toISOString();
      if (!pairs.has(timeKey)) {
        pairs.set(timeKey, { lat: 0, lng: 0, time: fecha });
      }
      const pair = pairs.get(timeKey)!;
      if (name.includes('latitud')) pair.lat = val;
      if (name.includes('longitud')) pair.lng = val;
    });
    const coords = Array.from(pairs.values())
      .filter(p => p.lat !== 0 && p.lng !== 0)
      .sort((a, b) => a.time.getTime() - b.time.getTime())
      .map(p => [p.lat, p.lng] as [number, number]);
    console.log('[TractorDashboard] routeCoords:', {
      totalPairs: pairs.size,
      validCoords: coords.length,
      first: coords[0],
      last: coords[coords.length - 1],
    });
    return coords;
  }, [mediciones]);

  interface DayRoute {
    day: string;
    label: string;
    coords: [number, number][];
    opacity: number;
  }

  const daysCoords = useMemo<DayRoute[]>(() => {
    if (!mediciones || mediciones.length === 0) return [];
    const pairs = new Map<string, { lat: number; lng: number; time: Date }>();
    mediciones.forEach((m: any) => {
      const name = (m.metrica_nombre || '').toLowerCase().trim();
      const val = Number(m.medicion);
      if (isNaN(val)) return;
      const fecha = new Date(m.fecha);
      fecha.setMilliseconds(0);
      const timeKey = fecha.toISOString();
      if (!pairs.has(timeKey)) {
        pairs.set(timeKey, { lat: 0, lng: 0, time: fecha });
      }
      const pair = pairs.get(timeKey)!;
      if (name.includes('latitud')) pair.lat = val;
      if (name.includes('longitud')) pair.lng = val;
    });
    const byDay = new Map<string, { time: Date; coords: [number, number][] }>();
    pairs.forEach((p) => {
      if (p.lat === 0 || p.lng === 0) return;
      const dayKey = p.time.toISOString().slice(0, 10);
      if (!byDay.has(dayKey)) byDay.set(dayKey, { time: p.time, coords: [] });
      byDay.get(dayKey)!.coords.push([p.lat, p.lng]);
    });
    const sorted = Array.from(byDay.entries())
      .sort(([, a], [, b]) => a.time.getTime() - b.time.getTime());
    if (sorted.length === 0) return [];
    const minOpacity = 0.25;
    const maxOpacity = 1.0;
    return sorted.map(([day, entry], idx) => {
      const opacity = sorted.length === 1
        ? maxOpacity
        : minOpacity + (maxOpacity - minOpacity) * (idx / (sorted.length - 1));
      const date = new Date(day + 'T12:00:00');
      const label = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      return { day, label, coords: entry.coords, opacity };
    });
  }, [mediciones]);

  useEffect(() => { setSelectedDays(new Set(daysCoords.map(d => d.day))); }, [daysCoords]);

  const availableMetrics = useMemo<MetricConfig[]>(() => {
    if (!mediciones || mediciones.length === 0) return [];
    const metricSet = new Map<string, { name: string; values: number[]; nodo: string }>();
    mediciones.forEach((m: any) => {
      const mName = (m.metrica_nombre || '').toLowerCase().trim();
      if (mName.includes('latitud') || mName.includes('longitud')) return;
      const nodo = m._nodo || `Nodo ${m._nodoid}`;
      const key = `${(m.metrica_nombre || 'Métrica').trim()}||${nodo}`;
      if (!metricSet.has(key)) {
        metricSet.set(key, { name: `${(m.metrica_nombre || 'Métrica').trim()} (${nodo})`, values: [], nodo });
      }
      const val = Number(m.medicion);
      if (!isNaN(val) && val !== null) metricSet.get(key)!.values.push(val);
    });
    console.log('[TractorDashboard] availableMetrics:', {
      medicionesCount: mediciones.length,
      metricKeys: Array.from(metricSet.keys()),
      metricDetails: Array.from(metricSet.entries()).map(([k, v]) => ({
        key: k,
        valuesCount: v.values.length,
        sampleValue: v.values[0],
      })),
    });
    return Array.from(metricSet.values()).map((entry) => {
      const rawName = entry.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const dataKey = entry.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const allBinary = entry.values.every(v => v === 0 || v === 1);
      return {
        id: dataKey,
        title: entry.name,
        color: deriveMetricColor(entry.name),
        unit: '',
        dataKey,
        description: `Medición de ${entry.name}`,
        ranges: { min: 0, max: 100, optimal: [20, 80] },
        isBinary: allBinary,
        nodo: entry.nodo,
        rawName,
      } as MetricConfig;
    });
  }, [mediciones]);

  const chartDataCache = useMemo<{ [key: string]: any[] }>(() => {
    const cache: { [key: string]: any[] } = {};
    if (!mediciones || mediciones.length === 0) return cache;
    availableMetrics.forEach((metric) => {
      cache[metric.dataKey] = processChartData(mediciones, metric.rawName || metric.title, metric.nodo);
      console.log(`[TractorDashboard] chartData for ${metric.dataKey}:`, {
        rawName: metric.rawName,
        nodo: metric.nodo,
        chartDataLength: cache[metric.dataKey]?.length ?? 0,
        firstPoint: cache[metric.dataKey]?.[0] ?? null,
        lastPoint: cache[metric.dataKey]?.[cache[metric.dataKey].length - 1] ?? null,
      });
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
    const padding = (maxVal - minVal) * 0.1;
    return { min: Math.floor(minVal - padding), max: Math.ceil(maxVal + padding) };
  }, [selectedDetailChartData]);

  useEffect(() => {
    if (yAxisDomain.min === null && yAxisDomain.max === null) setInitialYAxisDomain(selectedCalcDomain);
  }, [selectedCalcDomain, selectedDetailChartData]);

  const detailOption = useMemo<EChartsOption>(() => {
    return buildDetailedOption(selectedDetailChartData, selectedDetailKeys, yAxisDomain, selectedCalcDomain);
  }, [selectedDetailChartData, selectedDetailKeys, yAxisDomain, selectedCalcDomain]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">Cargando tractores...</p>
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
                className="h-10 min-w-[200px] max-w-[320px] px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm flex items-center justify-between truncate"
              >
                <span className={selectedEntry ? 'text-gray-800 dark:text-white truncate' : 'text-gray-500 dark:text-neutral-400'}>
                  {selectedEntry ? selectedEntry.localizacion : 'Seleccionar tractor...'}
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
                      placeholder="Buscar tractor..."
                      className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-base focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto dashboard-scrollbar">
                    {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                      <button
                        key={entry.localizacion}
                        onClick={() => handleEntrySelect(entry)}
                        className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${selectedEntry?.localizacion === entry.localizacion ? 'bg-yellow-500 text-white' : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
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
                    {filteredEntries.length} tractor(es)
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
          <button onClick={handleApplyDateRange} className="h-10 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-mono text-sm font-medium self-end">APLICAR</button>
        </div>
      </div>

      {selectedEntry ? (
        <div className="flex-1 p-4 overflow-auto space-y-4">
          {loadingData ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* Metric Cards */}
              {availableMetrics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {availableMetrics.map((metric) => {
                    const chartData = chartDataCache[metric.dataKey] || [];
                    const currentValue = currentValues[metric.dataKey] ?? 0;
                    const rawName = (metric.rawName || metric.title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    if (rawName.includes('odometro')) {
                      return <OdometerCard key={metric.id} value={currentValue} title={metric.title} />;
                    }
                    if (rawName.includes('rumbo')) {
                      return <CompassRose key={metric.id} heading={currentValue} title={metric.title} />;
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
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📍</div>
                    <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">Sin datos de métricas disponibles</p>
                  </div>
                </div>
              )}

              {daysCoords.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  {daysCoords.map((day) => {
                    const active = selectedDays.has(day.day);
                    return (
                      <button
                        key={day.day}
                        onClick={() => {
                          const next = new Set(selectedDays);
                          if (active) next.delete(day.day);
                          else next.add(day.day);
                          setSelectedDays(next);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-colors ${
                          active
                            ? 'bg-yellow-500 text-white'
                            : 'border border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Route Map */}
              {routeCoords.length > 1 && (
                <div className="border border-gray-300 dark:border-neutral-700 rounded-lg overflow-hidden" style={{ height: '450px' }}>
                  <MapContainer center={routeCoords[0]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    {daysCoords.filter(d => selectedDays.has(d.day)).map((day) => (
                      <Polyline
                        key={day.day}
                        positions={day.coords}
                        pathOptions={{ color: '#eab308', weight: 4, opacity: day.opacity }}
                      />
                    ))}
                    <Marker position={routeCoords[0]} icon={createTractorIcon('#22c55e', true)}>
                      <Popup>Inicio — {selectedEntry.localizacion}</Popup>
                    </Marker>
                    <Marker position={routeCoords[routeCoords.length - 1]} icon={createTractorIcon('#eab308', false)}>
                      <Popup>Fin — {selectedEntry.localizacion}</Popup>
                    </Marker>
                    <MapBoundsUpdater coords={routeCoords} />
                  </MapContainer>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚜</div>
            <p className="text-gray-500 dark:text-neutral-400 font-mono text-base">
              Selecciona un tractor para ver sus métricas y ruta
            </p>
          </div>
        </div>
      )}

      {/* Metric Detail Modal */}
      {selectedMetricDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 rounded-t-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={handleCloseMetricDetail} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-mono text-sm font-bold transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  VOLVER
                </button>
                <h3 className="text-lg font-bold text-yellow-500 font-mono">{selectedMetricDetail.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium font-mono uppercase">Y:</label>
                  <input type="number" step="0.1" value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? Math.round(yAxisDomain.min * 100) / 100 : ''}
                    onChange={(e) => { const v = e.target.value; if (v === '') { setYAxisDomain({ ...yAxisDomain, min: null }); return; } const n = Number(v); if (!isNaN(n) && isFinite(n)) setYAxisDomain({ ...yAxisDomain, min: n }); }} placeholder="Min" className="h-8 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono" />
                  <span className="text-gray-600 dark:text-neutral-400 text-sm">-</span>
                  <input type="number" step="0.1" value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? Math.round(yAxisDomain.max * 100) / 100 : ''}
                    onChange={(e) => { const v = e.target.value; if (v === '') { setYAxisDomain({ ...yAxisDomain, max: null }); return; } const n = Number(v); if (!isNaN(n) && isFinite(n)) setYAxisDomain({ ...yAxisDomain, max: n }); }} placeholder="Max" className="h-8 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono" />
                  <button onClick={() => setYAxisDomain(initialYAxisDomain)} className="h-8 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-mono">RESET</button>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:border-neutral-600"></div>
                <button onClick={() => setShowDataTable(!showDataTable)}
                  className={`h-8 px-4 rounded font-mono text-sm font-medium ${showDataTable ? 'bg-yellow-600 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600'}`}>
                  {showDataTable ? 'GRÁFICO' : 'DATOS'}
                </button>
              </div>
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
                <div ref={modalChartContainerRef} style={{ width: '100%', minHeight: '500px', height: '65vh' }}>
                  {modalChartReady && (
                    <ReactECharts ref={modalChartRef} option={detailOption} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'canvas' }} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
