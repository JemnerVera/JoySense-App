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
import { SVGPlantMap } from './SVGPlantMap';
import { PLCDataTable } from './PLCDataTable';
import { NodeData } from '../../types/NodeData';
import { MetricMiniChart } from './components/MetricMiniChart';
import type { MetricConfig } from './types';

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'];
const AGGREGATION_MINUTES = 5;
const DEFAULT_HOURS = 12;

const FUNDO_SVG_MAP: Record<number, string> = {
  3: '/mapa_valerie.svg',
  8: '/mapa_zoe_uvas.svg',
};

const METRIC_COLORS: Record<string, string> = {
  temperatura: '#ef4444',
  temp: '#ef4444',
  humedad: '#3b82f6',
  humidity: '#3b82f6',
  presion: '#10b981',
  presi_n: '#10b981',
  presion_aire: '#10b981',
  conductividad: '#f59e0b',
  ph: '#8b5cf6',
  rpm: '#06b6d4',
  velocidad: '#06b6d4',
  flujo: '#84cc16',
  nivel: '#ec4899',
};

function deriveMetricColor(metricName: string): string {
  const lower = metricName.toLowerCase();
  for (const [key, color] of Object.entries(METRIC_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return COLORS[Math.abs(metricName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length];
}

function processMetricChartData(mediciones: any[], metricName: string) {
  if (!mediciones || mediciones.length === 0) return [];
  const groupedByTime: Map<string, Map<string, number>> = new Map();
  mediciones.forEach((m: any) => {
    const mName = (m.metrica_nombre || '').toLowerCase().trim();
    if (!mName.includes(metricName.toLowerCase())) return;
    const fecha = new Date(m.fecha);
    const minutes = fecha.getMinutes();
    const roundedMinutes = Math.floor(minutes / AGGREGATION_MINUTES) * AGGREGATION_MINUTES;
    fecha.setHours(fecha.getHours(), roundedMinutes, 0, 0);
    const timeKey = fecha.toISOString().replace('T', ' ').slice(0, 16);
    const localizacionNombre = m.localizacion_nombre || `Localización ${m.localizacionid}`;
    const label = localizacionNombre;
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
    toolbox: {
      feature: {
        dataZoom: { yAxisIndex: 'none' as const },
        restore: {},
        saveAsImage: {},
      },
    },
    grid: { left: '4%', right: '4%', bottom: '50px', top: '8%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        color: '#666',
        fontFamily: 'Inter, sans-serif',
        rotate: 45,
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
        type: 'slider' as const,
        start: 0, end: 100,
        xAxisIndex: 0, height: 25, bottom: '5px',
        textStyle: { color: '#666' },
        fillerColor: 'rgba(249, 115, 22, 0.2)',
        handleStyle: { color: '#f97316' },
      },
    ],
    legend: {
      type: 'scroll' as const,
      orient: 'horizontal' as const,
      top: 0, left: '3%', right: '4%',
      textStyle: { color: '#666', fontSize: 11 },
      pageTextStyle: '#666',
      pageIconColor: '#666',
      pageIconInactiveColor: '#ccc',
    },
    series,
  };
}

export function PLCMapeoDashboard() {
  const { t } = useLanguage();

  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<number | null>(null);
  const [selectedNodo, setSelectedNodo] = useState<any | null>(null);
  const [nodosConLocalizacion, setNodosConLocalizacion] = useState<any[]>([]);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [initialYAxisDomain, setInitialYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [fundosInfo, setFundosInfo] = useState<Map<number, any>>(new Map());
  const [plcNodoids, setPlcNodoids] = useState<Set<number>>(new Set());
  const { syncDashboardSelectionToGlobal } = useFilterSync(fundosInfo);

  const [selectedMetricDetail, setSelectedMetricDetail] = useState<MetricConfig | null>(null);
  const { isReady: modalChartReady, containerRef: modalChartContainerRef, chartRef: modalChartRef } = useEChartsReady();

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

  // ── Initial load: sensor + localizacion for PLC nodoids, ubicacion + fundo for dropdown ──
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [sensorData, localizacionData, ubicacionesData, fundosData, empresasData, tiposData] = await Promise.all([
          JoySenseService.getTableData('sensor', 100),
          JoySenseService.getTableData('localizacion', 1000),
          JoySenseService.getTableData('ubicacion', 1000),
          JoySenseService.getTableData('fundo', 100),
          JoySenseService.getTableData('empresa', 100),
          JoySenseService.getTableData('tipo', 100),
        ]);

        const plcSensorids = new Set(
          (sensorData || []).filter((s: any) => s.tipoid === 3 || s.tipoid === 4).map((s: any) => s.sensorid)
        );
        const plcNodoidsSet = new Set(
          (localizacionData || []).filter((l: any) => plcSensorids.has(l.sensorid)).map((l: any) => l.nodoid)
        );
        setPlcNodoids(plcNodoidsSet);

        setUbicaciones(ubicacionesData || []);
        setTipos(tiposData || []);

        const empresasMap = new Map();
        (empresasData || []).forEach((empresa: any) => empresasMap.set(empresa.empresaid, empresa));
        const fundosMap = new Map();
        (fundosData || []).forEach((fundo: any) => {
          const empresa = empresasMap.get(fundo.empresaid);
          fundosMap.set(fundo.fundoid, { ...fundo, empresa, paisid: empresa?.paisid });
        });
        setFundosInfo(fundosMap);
      } catch (error) {
        console.error('[PLCMapeo] Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // ── Load mediciones when a node is selected ──
  const loadMediciones = useCallback(async () => {
    if (!selectedNodo?.nodoid) { setMediciones([]); return; }
    const startDateTime = `${dateRange.start} 00:00:00`;
    const endDateTime = `${dateRange.end} 23:59:59`;
    try {
      setLoadingData(true);
      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedNodo.nodoid,
        startDate: startDateTime,
        endDate: endDateTime,
      });
      setMediciones(data || []);
    } catch (error) {
      console.error('[PLCMapeo] Error loading mediciones:', error);
      setMediciones([]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedNodo, dateRange]);

  useEffect(() => {
    if (selectedNodo) loadMediciones();
  }, [selectedNodo, dateRange, loadMediciones]);

  useEffect(() => {
    setSelectedMetricDetail(null);
  }, [selectedNodo]);

  // ── Available ubicaciones: those belonging to fundos with SVG maps ──
  const availableUbicaciones = useMemo(() => {
    const svgFundoids = new Set(Object.keys(FUNDO_SVG_MAP).map(Number));
    return ubicaciones.filter((u: any) => {
      const fundoid = u.zona?.fundoid;
      return fundoid != null && svgFundoids.has(fundoid);
    });
  }, [ubicaciones]);

  // ── Filtered list for the dropdown search ──
  const filteredUbicaciones = useMemo(() => {
    if (!searchTerm) return availableUbicaciones;
    const term = searchTerm.toLowerCase();
    return availableUbicaciones.filter((u: any) =>
      (u.ubicacion || '').toLowerCase().includes(term)
    );
  }, [availableUbicaciones, searchTerm]);

  const selectedUbicacion = useMemo(() => {
    if (selectedUbicacionId == null) return null;
    return ubicaciones.find((u: any) => u.ubicacionid === selectedUbicacionId) || null;
  }, [selectedUbicacionId, ubicaciones]);

  // ── On ubicacion select: load nodes with coordinates via API ──
  const handleUbicacionSelect = useCallback(async (ubicacion: any) => {
    setSelectedUbicacionId(ubicacion.ubicacionid);
    setSelectedNodo(null);
    setMediciones([]);
    setNodosConLocalizacion([]);
    setSelectedMetricDetail(null);
    setIsDropdownOpen(false);
    setSearchTerm('');

    const fundoid = ubicacion.zona?.fundoid;
    if (!fundoid) return;

    setLoadingNodes(true);
    try {
      const data = await JoySenseService.getNodosConLocalizacion(1000, { fundoId: fundoid });
      setNodosConLocalizacion(data || []);
    } catch (error) {
      console.error('[PLCMapeo] Error loading nodos:', error);
      setNodosConLocalizacion([]);
    } finally {
      setLoadingNodes(false);
    }
  }, []);

  // ── SVG nodes: from nodosConLocalizacion filtered to PLC ──
  const svgNodes: NodeData[] = useMemo(() => {
    if (!nodosConLocalizacion || nodosConLocalizacion.length === 0) return [];
    const fundoid = selectedUbicacion?.zona?.fundoid;
    if (!fundoid) return [];

    return nodosConLocalizacion
      .filter((n: any) => plcNodoids.has(n.nodoid))
      .map((n: any) => {
        const zona = n.ubicacion?.zona;
        const fundo = zona?.fundo;
        return {
          nodoid: n.nodoid,
          nodo: n.nodo || '',
          deveui: n.deveui || '',
          ubicacionid: n.ubicacionid || 0,
          latitud: Number(n.latitud) || 0,
          longitud: Number(n.longitud) || 0,
          referencia: n.referencia || '',
          localizacion: n.localizacion || '',
          ubicacion: {
            ubicacion: n.ubicacion?.ubicacion || '',
            ubicacionabrev: '',
            zona: {
              zonaid: zona?.zonaid || 0,
              zona: zona?.zona || '',
              fundoid: fundo?.fundoid || fundoid,
              fundo: fundo ? {
                fundoid: fundo.fundoid || 0,
                fundo: fundo.fundo || '',
                fundoabrev: fundo.fundoabrev || '',
                empresaid: fundo.empresaid || null,
                empresa: fundo.empresa || null,
              } : {
                fundoid, fundo: fundosInfo.get(fundoid)?.fundo || '', fundoabrev: '',
                empresaid: fundosInfo.get(fundoid)?.empresaid || null,
                empresa: fundosInfo.get(fundoid)?.empresa || null,
              },
            },
          },
          entidad: n.entidad || { entidadid: 0, entidad: '' },
        } as NodeData;
      });
  }, [nodosConLocalizacion, plcNodoids, selectedUbicacion, fundosInfo]);

  const selectedNodeData = useMemo<NodeData | null>(() => {
    if (!selectedNodo) return null;
    return svgNodes.find((n) => n.nodoid === selectedNodo.nodoid) || null;
  }, [selectedNodo, svgNodes]);

  const currentFundoid = useMemo(() => {
    if (!selectedUbicacion?.zona?.fundoid) return null;
    const fid = selectedUbicacion.zona.fundoid;
    return FUNDO_SVG_MAP[fid] ? fid : null;
  }, [selectedUbicacion]);

  // ── Dropdown position effect ──
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      let animationFrameId: number;
      let isMounted = true;
      const updatePosition = () => {
        if (!isMounted || !dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
        if (isMounted) animationFrameId = requestAnimationFrame(updatePosition);
      };
      animationFrameId = requestAnimationFrame(updatePosition);
      return () => { isMounted = false; if (animationFrameId) cancelAnimationFrame(animationFrameId); };
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

  // ── Metric derivation (unchanged logic) ──
  const availableMetrics = useMemo<MetricConfig[]>(() => {
    if (!mediciones || mediciones.length === 0) return [];
    const metricSet = new Map<string, { name: string; values: number[] }>();
    mediciones.forEach((m: any) => {
      const name = (m.metrica_nombre || 'Métrica').trim();
      if (!metricSet.has(name)) metricSet.set(name, { name, values: [] });
      const val = Number(m.medicion);
      if (!isNaN(val) && val !== null) metricSet.get(name)!.values.push(val);
    });
    return Array.from(metricSet.values()).map((entry) => {
      const dataKey = entry.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      return {
        id: dataKey,
        title: entry.name,
        color: deriveMetricColor(entry.name),
        unit: '',
        dataKey,
        description: `Medición de ${entry.name}`,
        ranges: { min: 0, max: 100, optimal: [20, 80] },
      } as MetricConfig;
    });
  }, [mediciones]);

  const metricChartDataCache = useMemo<{ [key: string]: any[] }>(() => {
    const cache: { [key: string]: any[] } = {};
    if (!mediciones || mediciones.length === 0) return cache;
    availableMetrics.forEach((metric) => {
      const metricName = metric.title;
      cache[metric.dataKey] = processMetricChartData(mediciones, metricName);
    });
    return cache;
  }, [mediciones, availableMetrics]);

  const metricCurrentValues = useMemo<{ [key: string]: number }>(() => {
    const values: { [key: string]: number } = {};
    if (!mediciones || mediciones.length === 0) return values;
    availableMetrics.forEach((metric) => {
      const metricName = metric.title.toLowerCase();
      const m = mediciones.filter((m: any) => (m.metrica_nombre || '').toLowerCase().includes(metricName));
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
    return metricChartDataCache[selectedMetricDetail.dataKey] || [];
  }, [selectedMetricDetail, metricChartDataCache]);

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

  // ── Handlers ──
  const handleApplyDateRange = () => {
    setDateRange(pendingDateRange);
  };

  const handleMapNodeClick = (node: NodeData) => {
    setSelectedNodo(node);
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 flex flex-col h-full overflow-hidden">
      {/* Controls Bar */}
      <div className="bg-gray-50 dark:bg-neutral-800 px-4 py-3 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
        <div className="flex flex-nowrap gap-4 items-end justify-start overflow-x-auto w-full">
          {/* Ubicacion Selector */}
          <div className="flex flex-col flex-shrink-0">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">
              UBICACIÓN
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-10 min-w-[200px] max-w-[320px] px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm flex items-center justify-between truncate"
              >
                <span className={selectedUbicacion ? 'text-gray-800 dark:text-white truncate' : 'text-gray-500 dark:text-neutral-400'}>
                  {selectedUbicacion ? selectedUbicacion.ubicacion : 'Seleccionar ubicación...'}
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
                      placeholder="Buscar ubicación..."
                      className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-base focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                    {filteredUbicaciones.length > 0 ? filteredUbicaciones.map((ubicacion: any) => (
                      <button
                        key={ubicacion.ubicacionid}
                        onClick={() => handleUbicacionSelect(ubicacion)}
                        className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${selectedUbicacionId === ubicacion.ubicacionid ? 'bg-orange-500 text-white' : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                      >
                        {ubicacion.ubicacion}
                      </button>
                    )) : (
                      <div className="px-3 py-2 text-base text-gray-500 dark:text-neutral-400 font-mono">No se encontraron resultados</div>
                    )}
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-neutral-400 font-mono border-t border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                    Mostrando {filteredUbicaciones.length} de {availableUbicaciones.length} opciones
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-300 dark:bg-neutral-600 self-center"></div>

          {/* Date Range */}
          <div className="flex flex-col">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">DESDE</label>
            <input type="date" value={pendingDateRange.start} onChange={(e) => setPendingDateRange((prev) => ({ ...prev, start: e.target.value }))} className="h-10 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono" />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">HASTA</label>
            <input type="date" value={pendingDateRange.end} onChange={(e) => setPendingDateRange((prev) => ({ ...prev, end: e.target.value }))} className="h-10 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono" />
          </div>
          <button onClick={handleApplyDateRange} className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded font-mono text-sm font-medium self-end">APLICAR</button>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedUbicacion ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SVG Plant Map */}
          <div className="h-[40%] min-h-[250px] px-4 pt-3 flex-shrink-0">
            {loadingNodes ? (
              <div className="bg-neutral-700 rounded-lg h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-400 font-mono text-sm">Cargando nodos...</p>
              </div>
            ) : currentFundoid ? (
              <SVGPlantMap
                nodes={svgNodes}
                selectedNode={selectedNodeData}
                onNodeSelect={handleMapNodeClick}
                loading={false}
                fundoid={currentFundoid}
              />
            ) : (
              <div className="bg-neutral-700 rounded-lg h-full flex items-center justify-center">
                <div className="text-center text-neutral-400">
                  <div className="text-4xl mb-4">🏭</div>
                  <div className="text-lg font-medium mb-2 font-mono">Sin mapa disponible</div>
                  <div className="text-sm font-mono">No hay mapa SVG para esta ubicación</div>
                </div>
              </div>
            )}
          </div>

          {/* Metric Mini Cards */}
          <div className="flex-1 p-4 pt-2 overflow-auto">
            {!selectedNodo ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">📍</div>
                  <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">
                    Selecciona un nodo en el mapa para ver sus mediciones
                  </p>
                </div>
              </div>
            ) : loadingData ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">Cargando datos...</p>
                </div>
              </div>
            ) : availableMetrics.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">No hay datos de métricas disponibles</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableMetrics.map((metric) => {
                  const chartData = metricChartDataCache[metric.dataKey] || [];
                  const currentValue = metricCurrentValues[metric.dataKey] ?? 0;
                  const hasData = chartData.length > 0;
                  return (
                    <MetricMiniChart
                      key={metric.id}
                      metric={metric}
                      chartData={chartData}
                      currentValue={currentValue}
                      hasData={hasData}
                      onOpenAnalysis={handleOpenMetricDetail}
                      t={t}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-500 dark:text-neutral-400 font-mono text-base">
              Selecciona una ubicación para ver el mapa
            </p>
          </div>
        </div>
      )}

      {/* Metric Detail Modal Overlay */}
      {selectedMetricDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 rounded-t-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={handleCloseMetricDetail} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-mono text-sm font-bold transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  VOLVER
                </button>
                <h3 className="text-lg font-bold text-orange-500 font-mono">{selectedMetricDetail.title}</h3>
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
                <div className="w-px h-8 bg-gray-300 dark:bg-neutral-600"></div>
                <button onClick={() => setShowDataTable(!showDataTable)}
                  className={`h-8 px-4 rounded font-mono text-sm font-medium ${showDataTable ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600'}`}>
                  {showDataTable ? 'GRÁFICO' : 'DATOS'}
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              {showDataTable ? (
                <PLCDataTable selectedNodo={selectedNodo} dateRange={dateRange} onClose={() => setShowDataTable(false)} />
              ) : selectedDetailChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">No hay datos disponibles</p>
                  </div>
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
