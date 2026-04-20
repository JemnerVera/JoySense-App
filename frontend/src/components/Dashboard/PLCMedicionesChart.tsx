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

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'];

const AGGREGATION_MINUTES = 5;
const DEFAULT_HOURS = 12;

interface PLCMedicionesChartProps {}

export function PLCMedicionesChart(_props: PLCMedicionesChartProps) {
  const { t } = useLanguage();

  const [nodos, setNodos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [selectedNodo, setSelectedNodo] = useState<any | null>(null);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [initialYAxisDomain, setInitialYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [isNodoDropdownOpen, setIsNodoDropdownOpen] = useState(false);
  const [nodoSearchTerm, setNodoSearchTerm] = useState('');
  const [nodoDropdownPosition, setNodoDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const nodoDropdownRef = useRef<HTMLDivElement>(null);
  const [fundosInfo, setFundosInfo] = useState<Map<number, any>>(new Map());
  const { syncDashboardSelectionToGlobal } = useFilterSync(fundosInfo);

  const enrichNodoForSync = useCallback((nodo: any) => {
    if (!nodo || !fundosInfo || fundosInfo.size === 0) return nodo;
    
    const ubicacionid = nodo.ubicacionid;
    if (!ubicacionid) return nodo;
    
    return {
      nodo: {
        ...nodo,
        ubicacion: {
          ubicacionid: nodo.ubicacionid,
          localizacion: nodo.ubicacion_nombre,
          fundoid: nodo.fundoid,
          fundo: {
            fundoid: nodo.fundoid,
            fundo: nodo.fundo_nombre,
            empresaid: fundosInfo.get(nodo.fundoid)?.empresaid,
            empresa: fundosInfo.get(nodo.fundoid)?.empresa
          }
        }
      }
    };
  }, [fundosInfo]);

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
    end: getLocalDateString(now)
  });

  const [pendingDateRange, setPendingDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(twelveHoursAgo),
    end: getLocalDateString(now)
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [nodosData, tiposData, ubicacionesData, fundosData, empresasData] = await Promise.all([
          JoySenseService.getTableData('nodo', 1000),
          JoySenseService.getTableData('tipo', 100),
          JoySenseService.getTableData('ubicacion', 1000),
          JoySenseService.getTableData('fundo', 100),
          JoySenseService.getTableData('empresa', 100)
        ]);
        
        const nodesWithInfo = (nodosData || []).map((nodo: any) => {
          const ubicacion = ubicacionesData?.find((u: any) => u.ubicacionid === nodo.ubicacionid);
          const fundo = fundosData?.find((f: any) => f.fundoid === ubicacion?.fundoid);
          return {
            ...nodo,
            fundo_nombre: fundo?.fundo || '',
            ubicacion_nombre: ubicacion?.ubicacion || '',
            fundoid: ubicacion?.fundoid
          };
        });
        
        setNodos(nodesWithInfo || []);
        setTipos(tiposData || []);
        
        const empresasMap = new Map();
        (empresasData || []).forEach((empresa: any) => {
          empresasMap.set(empresa.empresaid, empresa);
        });
        
        const fundosMap = new Map();
        (fundosData || []).forEach((fundo: any) => {
          const empresa = empresasMap.get(fundo.empresaid);
          fundosMap.set(fundo.fundoid, {
            ...fundo,
            empresa: empresa,
            paisid: empresa?.paisid
          });
        });
        setFundosInfo(fundosMap);
        console.log('[PLC] fundosInfo cargado, size:', fundosMap.size);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const loadMediciones = useCallback(async () => {
    if (!selectedNodo?.nodoid) {
      setMediciones([]);
      return;
    }

    const startDateTime = `${dateRange.start} 00:00:00`;
    const endDateTime = `${dateRange.end} 23:59:59`;

    try {
      setLoadingData(true);
      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedNodo.nodoid,
        startDate: startDateTime,
        endDate: endDateTime
      });
      setMediciones(data || []);
    } catch (error) {
      console.error('[PLC] Error loading mediciones:', error);
      setMediciones([]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedNodo, dateRange]);

  useEffect(() => {
    if (selectedNodo) {
      loadMediciones();
    }
  }, [selectedNodo, dateRange, loadMediciones]);

  const filteredNodos = useMemo(() => {
    if (!nodoSearchTerm) return nodos;
    const term = nodoSearchTerm.toLowerCase();
    return nodos.filter(n => 
      n.fundo_nombre?.toLowerCase().includes(term) ||
      n.ubicacion_nombre?.toLowerCase().includes(term) ||
      n.nodo?.toLowerCase().includes(term)
    );
  }, [nodos, nodoSearchTerm]);

  useEffect(() => {
    if (isNodoDropdownOpen && nodoDropdownRef.current) {
      const rect = nodoDropdownRef.current.getBoundingClientRect();
      setNodoDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isNodoDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (nodoDropdownRef.current && !nodoDropdownRef.current.contains(e.target as Node)) {
        setIsNodoDropdownOpen(false);
      }
    };
    if (isNodoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNodoDropdownOpen]);

  const chartData = useMemo(() => {
    if (!mediciones || mediciones.length === 0) return [];

    const groupedByTime: Map<string, Map<string, number>> = new Map();

    mediciones.forEach((m: any) => {
      const fecha = new Date(m.fecha);
      const minutes = fecha.getMinutes();
      const roundedMinutes = Math.floor(minutes / AGGREGATION_MINUTES) * AGGREGATION_MINUTES;
      fecha.setHours(fecha.getHours(), roundedMinutes, 0, 0);
      const timeKey = fecha.toISOString().replace('T', ' ').slice(0, 16);

      // Usar campos planos de la RPC
      const localizacionNombre = m.localizacion_nombre || `Localización ${m.localizacionid}`;
      const metricaNombre = m.metrica_nombre || 'Métrica';
      const sensorNombre = m.sensor_nombre || `Sensor ${m.sensorid}`;

      // Label: localización + métrica (igual que en Mapeo de Nodos)
      const label = `${localizacionNombre} - ${metricaNombre}`;
      const valor = Number(m.medicion);

      if (!groupedByTime.has(timeKey)) {
        groupedByTime.set(timeKey, new Map());
      }

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
        values.forEach((val, key) => {
          if (!key.toString().endsWith('_count')) {
            entry[key] = val;
          }
        });
        return entry;
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [mediciones]);

  const metricKeys = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const keys = new Set<string>();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'time') keys.add(k);
      });
    });
    return Array.from(keys);
  }, [chartData]);

  const calculatedYAxisDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return { min: null, max: null };
    
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    chartData.forEach(d => {
      Object.keys(d).forEach(key => {
        if (key !== 'time') {
          const val = Number(d[key]);
          if (!isNaN(val) && val !== null) {
            minVal = Math.min(minVal, val);
            maxVal = Math.max(maxVal, val);
          }
        }
      });
    });
    
    if (minVal === Infinity || maxVal === -Infinity) {
      return { min: null, max: null };
    }
    
    const padding = (maxVal - minVal) * 0.1;
    return { 
      min: Math.floor(minVal - padding), 
      max: Math.ceil(maxVal + padding) 
    };
  }, [chartData]);

  useEffect(() => {
    if (yAxisDomain.min === null && yAxisDomain.max === null) {
      setInitialYAxisDomain(calculatedYAxisDomain);
    }
  }, [calculatedYAxisDomain, chartData]);

  const option = useMemo<EChartsOption>(() => {
    if (!chartData || chartData.length === 0) {
      return { tooltip: {}, xAxis: {}, yAxis: {}, series: [] };
    }
    
    const xAxisData = chartData.map(d => d.time);

    const series = metricKeys.map((metricKey, idx) => ({
      name: metricKey,
      type: 'line' as const,
      symbol: 'none' as const,
      sampling: 'lttb' as const,
      connectNulls: true,
      itemStyle: {
        color: COLORS[idx % COLORS.length]
      },
      lineStyle: {
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: hexToRgba(COLORS[idx % COLORS.length], 0.3) },
          { offset: 1, color: hexToRgba(COLORS[idx % COLORS.length], 0.05) }
        ])
      },
      data: chartData.map(d => {
        const val = d[metricKey];
        return typeof val === 'number' && !isNaN(val) ? val : null;
      })
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
        }
      },
      toolbox: {
        feature: {
          dataZoom: { yAxisIndex: 'none' as const },
          restore: {},
          saveAsImage: {}
        }
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '50px',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category' as const,
        boundaryGap: false,
        data: xAxisData,
        axisLabel: {
          color: '#666',
          fontFamily: 'Inter, sans-serif',
          rotate: 45,
          interval: Math.floor(xAxisData.length / 24)
        },
        axisLine: {
          lineStyle: { color: '#ccc' }
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value' as const,
        min: yAxisDomain.min !== null ? yAxisDomain.min : (calculatedYAxisDomain.min ?? undefined),
        max: yAxisDomain.max !== null ? yAxisDomain.max : (calculatedYAxisDomain.max ?? undefined),
        axisLabel: {
          color: '#666',
          fontFamily: 'Inter, sans-serif',
          formatter: (value: number) => value.toFixed(1)
        },
        splitLine: {
          lineStyle: { color: '#eee' }
        },
        nameTextStyle: {
          color: '#666',
          fontSize: 10
        }
      },
      dataZoom: [
        {
          type: 'inside' as const,
          start: 0,
          end: 100,
          xAxisIndex: 0
        },
        {
          type: 'slider' as const,
          start: 0,
          end: 100,
          xAxisIndex: 0,
          height: 25,
          bottom: '5px',
          textStyle: { color: '#666' },
          fillerColor: 'rgba(249, 115, 22, 0.2)',
          handleStyle: { color: '#f97316' }
        }
      ],
      legend: {
        type: 'scroll' as const,
        orient: 'horizontal' as const,
        top: 0,
        left: '3%',
        right: '4%',
        textStyle: {
          color: '#666',
          fontSize: 11
        },
        pageTextStyle: '#666',
        pageIconColor: '#666',
        pageIconInactiveColor: '#ccc'
      },
      series
    };
  }, [chartData, metricKeys, yAxisDomain]);

  const handleApplyDateRange = () => {
    setDateRange(pendingDateRange);
  };

  const handleNodoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nodoid = parseInt(e.target.value, 10);
    const nodo = nodos.find(n => n.nodoid === nodoid) || null;
    setSelectedNodo(nodo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">Cargando nodos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-neutral-700">
        <div className="flex flex-wrap gap-4 items-end justify-center">
          <div className="flex flex-col">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">
              {t('fields.node') || 'NODO'}
            </label>
            <div className="relative" ref={nodoDropdownRef}>
              <button
                onClick={() => setIsNodoDropdownOpen(!isNodoDropdownOpen)}
                className="h-10 min-w-[180px] px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm flex items-center justify-between"
              >
                <span className={selectedNodo ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                  {selectedNodo 
                    ? `${selectedNodo.fundo_nombre} - ${selectedNodo.ubicacion_nombre} - ${selectedNodo.nodo}`
                    : 'Seleccionar nodo...'}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isNodoDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            
              {isNodoDropdownOpen && nodoDropdownPosition && (
                <div 
                  className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
                  style={{
                    top: `${nodoDropdownPosition.top}px`,
                    left: `${nodoDropdownPosition.left}px`,
                    width: `${Math.max(nodoDropdownPosition.width * 2, 400)}px`
                  }}
                >
                  <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                    <input
                      type="text"
                      value={nodoSearchTerm}
                      onChange={(e) => setNodoSearchTerm(e.target.value)}
                      placeholder="Buscar..."
                      className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-base focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : filteredNodos.length > 0 ? (
                      filteredNodos.map((nodo: any) => (
                        <button
                          key={nodo.nodoid}
                          onClick={() => {
                            console.log('[PLC] Seleccionando nodo:', nodo.nodo, 'nodoid:', nodo.nodoid, 'ubicacionid:', nodo.ubicacionid);
                            setSelectedNodo(nodo);
                            setIsNodoDropdownOpen(false);
                            setNodoSearchTerm('');
                            const enrichedNodo = enrichNodoForSync(nodo);
                            console.log('[PLC] Llamando syncDashboardSelectionToGlobal con:', enrichedNodo);
                            syncDashboardSelectionToGlobal(enrichedNodo, 'localizacion');
                            console.log('[PLC] syncDashboardSelectionToGlobal completado');
                          }}
                          className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${
                            selectedNodo?.nodoid === nodo.nodoid
                              ? 'bg-orange-500 text-white'
                              : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {nodo.fundo_nombre} - {nodo.ubicacion_nombre} - {nodo.nodo}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-base text-gray-500 dark:text-neutral-400 font-mono">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-neutral-400 font-mono border-t border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                    Mostrando {filteredNodos.length} de {nodos.length} opciones
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-12 bg-gray-300 dark:bg-neutral-600 self-center"></div>

          <div className="flex flex-col">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">DESDE</label>
            <input
              type="date"
              value={pendingDateRange.start}
              onChange={e => setPendingDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="h-10 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">HASTA</label>
            <input
              type="date"
              value={pendingDateRange.end}
              onChange={e => setPendingDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="h-10 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono"
            />
          </div>

          <button
            onClick={handleApplyDateRange}
            className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded font-mono text-sm font-medium self-end"
          >
            APLICAR
          </button>

          <div className="w-px h-12 bg-gray-300 dark:bg-neutral-600 self-center"></div>

          <div className="flex flex-col items-center">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">AJUSTAR EJE Y</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? Math.round(yAxisDomain.min * 100) / 100 : ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setYAxisDomain({ ...yAxisDomain, min: null });
                    return;
                  }
                  const numValue = Number(inputValue);
                  if (!isNaN(numValue) && isFinite(numValue)) {
                    setYAxisDomain({ ...yAxisDomain, min: numValue });
                  }
                }}
                placeholder="Min"
                className="h-10 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono"
              />
              <span className="text-gray-600 dark:text-neutral-400 text-sm">-</span>
              <input
                type="number"
                step="0.1"
                value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? Math.round(yAxisDomain.max * 100) / 100 : ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setYAxisDomain({ ...yAxisDomain, max: null });
                    return;
                  }
                  const numValue = Number(inputValue);
                  if (!isNaN(numValue) && isFinite(numValue)) {
                    setYAxisDomain({ ...yAxisDomain, max: numValue });
                  }
                }}
                placeholder="Max"
                className="h-10 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono"
              />
              <button
                onClick={() => setYAxisDomain(initialYAxisDomain)}
                className="h-10 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-mono"
              >
                RESET
              </button>
            </div>
          </div>

          <div className="w-px h-12 bg-gray-300 dark:bg-neutral-600 self-center"></div>

          <div className="flex flex-col items-center">
            <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1 font-mono uppercase">VISUALIZAR EN TABLA</label>
            <button
              onClick={() => setShowDataTable(!showDataTable)}
              className={`h-10 px-4 rounded font-mono text-sm font-medium ${
                showDataTable 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
              }`}
            >
              DATOS
            </button>
          </div>
        </div>
      </div>

      {!selectedNodo && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">
              Selecciona un nodo para ver sus mediciones
            </p>
          </div>
        </div>
      )}

      {selectedNodo && showDataTable ? (
        <div className="mt-4">
          <PLCDataTable 
            selectedNodo={selectedNodo}
            dateRange={dateRange}
            onClose={() => setShowDataTable(false)}
          />
        </div>
      ) : (
        <>
          {loadingData && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">Cargando datos...</p>
              </div>
            </div>
          )}

          {!loadingData && selectedNodo && chartData.length === 0 && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">No hay datos disponibles</p>
              </div>
            </div>
          )}

          {!loadingData && selectedNodo && chartData.length > 0 && (
            <div style={{ height: 'calc(100vh - 320px)', minHeight: '400px', width: '100%' }}>
              <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PLCMedicionesChart;