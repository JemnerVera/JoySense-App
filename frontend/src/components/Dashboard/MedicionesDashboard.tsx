import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

interface MedicionesDashboardProps {}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6', '#f97316'];

export function MedicionesDashboard(_props: MedicionesDashboardProps) {
  const { t } = useLanguage();
  const { showError } = useToast();

  // Estados principales
  const [nodos, setNodos] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de filtro
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);

  // Estados para combobox de nodo con searchbar
  const [isNodoDropdownOpen, setIsNodoDropdownOpen] = useState(false);
  const [nodoSearchTerm, setNodoSearchTerm] = useState('');
  const nodoDropdownRef = useRef<HTMLDivElement>(null);
  const [nodoDropdownPosition, setNodoDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Cargar nodos, sensores y tipos al iniciar
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [nodosData, sensoresData, tiposData] = await Promise.all([
          JoySenseService.getNodos(),
          JoySenseService.getSensores(),
          JoySenseService.getTipos()
        ]);
        
        setNodos(nodosData || []);
        setSensores(sensoresData || []);
        setTipos(tiposData || []);
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
        showError('Error', 'No se pudieron cargar los datos');
      }
    };
    
    loadInitialData();
  }, [showError]);

  // Cargar mediciones cuando cambia nodo o rango de fechas
  useEffect(() => {
    if (!selectedNode?.nodoid) return;

    const loadMediciones = async () => {
      try {
        setLoading(true);
        const data = await SupabaseRPCService.getMedicionesNodoDetallado({
          nodoid: selectedNode.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end
        });

        setMediciones(data || []);
        setSelectedMetricId(null);
      } catch (err) {
        console.error('Error cargando mediciones:', err);
        showError('Error', 'Error al cargar mediciones');
      } finally {
        setLoading(false);
      }
    };

    loadMediciones();
  }, [selectedNode, dateRange, showError]);

  // Filtrar nodos por término de búsqueda
  const filteredNodos = useMemo(() => {
    if (!nodoSearchTerm.trim()) {
      return nodos;
    }
    return nodos.filter((nodo: any) =>
      nodo.nodo?.toLowerCase().includes(nodoSearchTerm.toLowerCase())
    );
  }, [nodos, nodoSearchTerm]);

  // Calcular posición del dropdown de nodo cuando se abre
  useEffect(() => {
    if (isNodoDropdownOpen && nodoDropdownRef.current) {
      const rect = nodoDropdownRef.current.getBoundingClientRect();
      setNodoDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    } else {
      setNodoDropdownPosition(null);
    }
  }, [isNodoDropdownOpen]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodoDropdownRef.current && !nodoDropdownRef.current.contains(event.target as Node)) {
        setIsNodoDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener métricas disponibles
  const availableMetrics = useMemo(() => {
    const metricsMap = new Map<number, string>();
    mediciones.forEach((m: any) => {
      const metricId = m.metricaid || m.localizacion?.metricaid;
      const metricName = m.metrica_nombre || m.localizacion?.metrica?.metrica || `Métrica ${metricId}`;
      if (metricId && !metricsMap.has(metricId)) {
        metricsMap.set(metricId, metricName);
      }
    });
    
    return Array.from(metricsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [mediciones]);

  // Establecer métrica por defecto
  useEffect(() => {
    if (availableMetrics.length > 0 && !selectedMetricId) {
      setSelectedMetricId(availableMetrics[0].id);
    }
  }, [availableMetrics, selectedMetricId]);

  // Función para obtener etiqueta de serie (sensor)
  const getSeriesLabel = useCallback((medicion: any) => {
    const sensorId = medicion.sensorid || medicion.localizacion?.sensorid;
    const sensorInfo = sensores.find(s => s.sensorid === sensorId);
    const sensorName = sensorInfo?.sensor || sensorInfo?.nombre || `Sensor ${sensorId}`;

    const tipoId = medicion.tipoid || sensorInfo?.tipoid || medicion.localizacion?.sensor?.tipoid;
    const tipoInfo = tipos.find(t => t.tipoid === tipoId);
    const tipoName = tipoInfo?.tipo || 'Sensor';

    if (sensorName && sensorName !== tipoName) {
      return `${tipoName} - ${sensorName}`;
    }
    return tipoName;
  }, [sensores, tipos]);

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    if (!selectedMetricId || mediciones.length === 0) return [];

    // Filtrar mediciones por métrica seleccionada
    const filteredMediciones = mediciones.filter(
      m => (m.metricaid || m.localizacion?.metricaid) === selectedMetricId
    );

    if (filteredMediciones.length === 0) return [];

    // Agrupar por fecha
    const dataMap = new Map<string, any>();
    
    filteredMediciones.forEach((m: any) => {
      const fecha = new Date(m.fecha);
      const dateKey = `${fecha.getDate()}/${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, { fecha: dateKey });
      }

      if (m.medicion !== null && m.medicion !== undefined) {
        const label = getSeriesLabel(m);
        const entry = dataMap.get(dateKey)!;
        
        if (!entry[label]) {
          entry[label] = [];
        }
        entry[label].push(parseFloat(m.medicion));
      }
    });

    // Calcular promedios por serie
    const result = Array.from(dataMap.values()).map(entry => {
      const processed: any = { fecha: entry.fecha };
      Object.entries(entry).forEach(([key, values]: [string, any]) => {
        if (key !== 'fecha' && Array.isArray(values) && values.length > 0) {
          processed[key] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        }
      });
      return processed;
    });

    return result;
  }, [selectedMetricId, mediciones, getSeriesLabel]);

  // Obtener todas las series únicas para el gráfico
  const allSeries = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const seriesSet = new Set<string>();
    chartData.forEach((item: any) => {
      Object.keys(item).forEach(key => {
        if (key !== 'fecha' && typeof item[key] === 'number') {
          seriesSet.add(key);
        }
      });
    });
    
    return Array.from(seriesSet).sort();
  }, [chartData]);

  return (
    <div className="w-full p-6">
      {/* Header similar a NodeStatusDashboard */}
      <div className="flex items-center justify-center gap-4 mb-8 bg-gray-50 dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-neutral-800 flex-wrap">
        {/* Selector de Nodo con searchbar */}
        <div className="flex flex-col items-center" ref={nodoDropdownRef}>
          <label className="text-xs font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase">
            Nodo:
          </label>
          <div className="relative">
            <button
              onClick={() => setIsNodoDropdownOpen(!isNodoDropdownOpen)}
              className="h-8 min-w-[120px] px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs flex items-center justify-between"
            >
              <span className={selectedNode ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                {selectedNode?.nodo || 'Selecciona'}
              </span>
              <svg className={`w-4 h-4 transition-transform ${isNodoDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isNodoDropdownOpen && nodoDropdownPosition && (
              <div 
                className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
                style={{
                  top: `${nodoDropdownPosition.top}px`,
                  left: `${nodoDropdownPosition.left}px`,
                  width: `${nodoDropdownPosition.width}px`
                }}
              >
                <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                  <input
                    type="text"
                    value={nodoSearchTerm}
                    onChange={(e) => setNodoSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                  {filteredNodos.length > 0 ? (
                    filteredNodos.map((nodo: any) => (
                      <button
                        key={nodo.nodoid}
                        onClick={() => {
                          setSelectedNode(nodo);
                          setIsNodoDropdownOpen(false);
                          setNodoSearchTerm('');
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                          selectedNode?.nodoid === nodo.nodoid
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {nodo.nodo}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 font-mono">
                      No se encontraron resultados
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rango de fechas */}
        <div className="flex flex-col items-center">
          <label className="text-xs font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase">
            Intervalo de Fechas:
          </label>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="h-8 w-32 pl-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                style={{ colorScheme: 'dark', WebkitAppearance: 'none' }}
              />
              <span className="text-[10px] text-gray-400 font-mono mt-1 uppercase">Inicio</span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="h-8 w-32 pl-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                style={{ colorScheme: 'dark', WebkitAppearance: 'none' }}
              />
              <span className="text-[10px] text-gray-400 font-mono mt-1 uppercase">Fin</span>
            </div>
          </div>
        </div>

        {/* Métricas como botones */}
        <div className="flex flex-col items-center">
          <label className="text-xs font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase">
            Métrica:
          </label>
          <div className="flex items-center gap-2">
            {availableMetrics.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                Sin métricas
              </span>
            ) : (
              availableMetrics.map(metric => (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetricId(metric.id)}
                  className={`h-8 px-3 rounded font-mono text-xs transition-colors whitespace-nowrap ${
                    selectedMetricId === metric.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {metric.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-white dark:bg-neutral-800 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-96 bg-white dark:bg-neutral-800 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400">Selecciona un nodo y una métrica</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 border border-gray-200 dark:border-neutral-700">
          <style>{`
            .mediciones-chart ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            .mediciones-chart ::-webkit-scrollbar-track {
              background: transparent;
            }
            .mediciones-chart ::-webkit-scrollbar-thumb {
              background: #3b82f6;
              border-radius: 4px;
            }
            .mediciones-chart ::-webkit-scrollbar-thumb:hover {
              background: #2563eb;
            }
          `}</style>
          <ResponsiveContainer width="100%" height={400} className="mediciones-chart">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="fecha" 
                stroke="#6b7280"
                tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #4b5563',
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                  fontSize: '11px'
                }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend 
                wrapperStyle={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
              />
              {allSeries.map((series, idx) => (
                <Line
                  key={series}
                  type="monotone"
                  dataKey={series}
                  stroke={COLORS[idx % COLORS.length]}
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
