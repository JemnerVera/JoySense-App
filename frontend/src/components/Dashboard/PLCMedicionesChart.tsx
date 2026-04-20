import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { hexToRgba } from '../../utils/chartUtils';
import { useLanguage } from '../../contexts/LanguageContext';

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
        const [nodosData, tiposData] = await Promise.all([
          JoySenseService.getTableData('nodo', 1000),
          JoySenseService.getTableData('tipo', 100)
        ]);
        setNodos(nodosData || []);
        setTipos(tiposData || []);
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

  const option = useMemo<EChartsOption>(() => {
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
        left: '3%',
        right: '4%',
        bottom: '60px',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category' as const,
        boundaryGap: false,
        data: xAxisData,
        axisLabel: {
          color: '#666',
          fontFamily: 'Inter, sans-serif',
          rotate: 45
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
        axisLabel: {
          color: '#666',
          fontFamily: 'Inter, sans-serif'
        },
        splitLine: {
          lineStyle: { color: '#eee' }
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
  }, [chartData, metricKeys]);

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
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1">
            {t('fields.node') || 'Nodo'}
          </label>
          <select
            value={selectedNodo?.nodoid || ''}
            onChange={handleNodoChange}
            className="bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-600 rounded px-3 py-2 min-w-48 text-sm"
          >
            <option value="">Seleccionar nodo...</option>
            {nodos.map(nodo => (
              <option key={nodo.nodoid} value={nodo.nodoid}>
                {nodo.nodo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1">Desde</label>
          <input
            type="date"
            value={pendingDateRange.start}
            onChange={e => setPendingDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-600 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-600 dark:text-neutral-400 text-xs font-medium mb-1">Hasta</label>
          <input
            type="date"
            value={pendingDateRange.end}
            onChange={e => setPendingDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-600 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleApplyDateRange}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Aplicar
          </button>
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
        <div style={{ height: '500px', width: '100%' }}>
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      )}
    </div>
  );
}

export default PLCMedicionesChart;