import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useFilters } from '../../contexts/FilterContext';
import { filterNodesByGlobalFilters } from '../../utils/filterNodesUtils';

interface MedicionesDashboardProps {}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6', '#f97316'];

export function MedicionesDashboard(_props: MedicionesDashboardProps) {
  const { t } = useLanguage();
  const { showError } = useToast();
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();

  // Estados principales
  const [nodos, setNodos] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableMetrics, setAvailableMetrics] = useState<{ id: number; name: string }[]>([]);
  const [selectedMetricUnit, setSelectedMetricUnit] = useState<string>('');

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
          JoySenseService.getNodosConLocalizacion(),
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

  // Validar rango máximo de 90 días
  const validateDateRange = useCallback((start: string, end: string): { start: string; end: string } | null => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff > 90) {
      showError('Límite excedido', 'El intervalo máximo permitido es 90 días. Se ajustará automáticamente.');
      // Ajustar automáticamente: mantener endDate, ajustar startDate
      const newStartDate = new Date(endDate);
      newStartDate.setDate(newStartDate.getDate() - 90);
      return {
        start: newStartDate.toISOString().split('T')[0],
        end: end
      };
    }
    return null;
  }, [showError]);

  // Cargar métricas disponibles cuando cambia nodo o rango de fechas
  useEffect(() => {
    if (!selectedNode?.nodoid) {
      setAvailableMetrics([]);
      setSelectedMetricId(null);
      setMediciones([]);
      return;
    }

    // Validar rango de fechas
    const adjustedRange = validateDateRange(dateRange.start, dateRange.end);
    if (adjustedRange) {
      setDateRange(adjustedRange);
      return;
    }

    const loadMetricas = async () => {
      try {
        setLoading(true);
        const metrics = await SupabaseRPCService.getMetricasDisponiblesPorNodo({
          nodoid: selectedNode.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end
        });

        // Transformar { id, nombre } a { id, name } para que coincida con el estado
        const transformedMetrics = (metrics || []).map(m => ({
          id: m.id,
          name: m.nombre
        }));
        
        setAvailableMetrics(transformedMetrics);
        
        // Seleccionar primera métrica por defecto si hay métricas disponibles
        if (transformedMetrics && transformedMetrics.length > 0) {
          if (!selectedMetricId || !transformedMetrics.find(m => m.id === selectedMetricId)) {
            setSelectedMetricId(transformedMetrics[0].id);
          }
        } else {
          setSelectedMetricId(null);
          setMediciones([]);
        }
      } catch (err: any) {
        console.error('Error cargando métricas:', err);
        if (err.message && err.message.includes('90 días')) {
          showError('Error', err.message);
        } else {
          showError('Error', 'Error al cargar métricas disponibles');
        }
        setAvailableMetrics([]);
        setSelectedMetricId(null);
      } finally {
        setLoading(false);
      }
    };

    loadMetricas();
  }, [selectedNode, dateRange.start, dateRange.end, showError, validateDateRange]);

  // Cargar mediciones cuando cambia nodo o rango de fechas (NO por métrica)
  useEffect(() => {
    if (!selectedNode?.nodoid) {
      setMediciones([]);
      return;
    }

    // Validar rango de fechas
    const adjustedRange = validateDateRange(dateRange.start, dateRange.end);
    if (adjustedRange) {
      setDateRange(adjustedRange);
      return;
    }

    const loadMediciones = async () => {
      try {
        setLoading(true);
        // Cargar datos de TODAS las métricas (sin filtro metricaid)
        const data = await SupabaseRPCService.getMedicionesNodoDetallado({
          nodoid: selectedNode.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end
          // NO pasar metricaid - cargar todo y filtrar en frontend
        });

        const medicionesData = data || [];
        console.log('[MedicionesDashboard] Mediciones cargadas (todas las métricas):', medicionesData.length);
        setMediciones(medicionesData);
      } catch (err: any) {
        console.error('Error cargando mediciones:', err);
        if (err.message && err.message.includes('90 días')) {
          showError('Error', err.message);
        } else {
          showError('Error', 'Error al cargar mediciones');
        }
        setMediciones([]);
      } finally {
        setLoading(false);
      }
    };

    loadMediciones();
  }, [selectedNode, dateRange.start, dateRange.end, showError, validateDateRange]);

  // Debugging: Mostrar cambios en mediciones
  useEffect(() => {
    console.log('[MedicionesDashboard] mediciones actualizado:', mediciones.length);
  }, [mediciones]);

  // Actualizar métricas disponibles basado en los datos REALES cargados
  // Esto es crítico para rangos largos donde el backend puede no devolver todas las métricas
  useEffect(() => {
    if (mediciones.length === 0) {
      setAvailableMetrics([]);
      setSelectedMetricId(null);
      return;
    }

    // Obtener los metricaid únicos que realmente existen en los datos
    const uniqueMetricIds = new Set<number>();
    mediciones.forEach(m => {
      const metricaId = m.metricaid || m.localizacion?.metricaid;
      if (metricaId) {
        uniqueMetricIds.add(Number(metricaId));
      }
    });

    console.log('[MedicionesDashboard] metricaid únicos en datos reales:', Array.from(uniqueMetricIds));

    // Crear mapeo de nombre a ID basado en los datos
    // Buscar en múltiples ubicaciones posibles del campo de nombre
    const metricMap = new Map<number, string>();
    mediciones.forEach(m => {
      const metricaId = m.metricaid || m.localizacion?.metricaid;
      
      // Intentar obtener el nombre de varias posibles ubicaciones
      let metricaNombre = 
        m.localizacion?.metrica?.metrica ||  // Estructura expandida
        m.metrica_nombre ||                   // Campo directo en medicion
        m.metrica ||                          // Campo directo alternativo
        m.localizacion?.metrica ||            // Métrica como objeto
        null;

      // Si metricaNombre es un objeto, intentar extraer el campo 'metrica'
      if (metricaNombre && typeof metricaNombre === 'object' && 'metrica' in metricaNombre) {
        metricaNombre = metricaNombre.metrica;
      }

      // Limpieza de espacios en blanco y saltos de línea
      if (typeof metricaNombre === 'string') {
        metricaNombre = metricaNombre.replace(/[\r\n]/g, ' ').trim();
      }

      if (metricaId && !metricMap.has(Number(metricaId))) {
        if (metricaNombre) {
          metricMap.set(Number(metricaId), metricaNombre);
        }
      }
    });

    // Mapeo manual de IDs a nombres si no se encontró en los datos
    const fallbackNames: { [key: number]: string } = {
      1: 'Temperatura',
      2: 'Humedad',
      3: 'Electroconductividad'
    };

    // Construir lista de métricas disponibles basado en datos reales
    const availableFromData = Array.from(uniqueMetricIds)
      .sort()
      .map(id => ({
        id,
        name: metricMap.get(id) || fallbackNames[id] || `Métrica ${id}`
      }));

    console.log('[MedicionesDashboard] Métricas disponibles:', availableFromData);

    setAvailableMetrics(availableFromData);

    // Si el selectedMetricId actual no existe en los datos, seleccionar el primero disponible
    if (availableFromData.length > 0) {
      const selectedExists = availableFromData.find(m => m.id === selectedMetricId);
      if (!selectedExists) {
        console.log('[MedicionesDashboard] selectedMetricId no existe en datos, cambiando a:', availableFromData[0].id);
        setSelectedMetricId(availableFromData[0].id);
      }
    } else {
      setSelectedMetricId(null);
    }
  }, [mediciones]);

  // Filtrar nodos por filtros globales y término de búsqueda
  const filteredNodos = useMemo(() => {
    // Primero aplicar filtros globales (país, empresa, fundo)
    let filtered = filterNodesByGlobalFilters(
      nodos,
      paisSeleccionado,
      empresaSeleccionada,
      fundoSeleccionado
    );
    
    // Luego filtrar por término de búsqueda
    if (!nodoSearchTerm.trim()) {
      return filtered;
    }
    return filtered.filter((nodo: any) =>
      nodo.nodo?.toLowerCase().includes(nodoSearchTerm.toLowerCase())
    );
  }, [nodos, nodoSearchTerm, paisSeleccionado, empresaSeleccionada, fundoSeleccionado]);

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

  // Filtrar mediciones por métrica seleccionada (filtrado en frontend)
  const medicionesFiltradasPorMetrica = useMemo(() => {
    if (!selectedMetricId || mediciones.length === 0) {
      return [];
    }
    
    const filtered = mediciones.filter(m => {
      const metricaId = m.metricaid || m.localizacion?.metricaid;
      return Number(metricaId) === Number(selectedMetricId);
    });
    
    // Actualizar la unidad de la métrica seleccionada
    if (filtered.length > 0) {
      // Buscar la unidad en el primer registro que tenga esa métrica
      const unitFromData = 
        filtered[0]?.localizacion?.metrica?.unidad ||
        filtered[0]?.unidad ||
        filtered[0]?.localizacion?.unidad ||
        '';
      
      setSelectedMetricUnit(unitFromData || '');
    } else {
      setSelectedMetricUnit('');
    }
    
    // Debugging: si no hay resultados pero hay mediciones, mostrar estructura de los datos
    if (filtered.length === 0 && mediciones.length > 0) {
      console.log('[MedicionesDashboard] DEBUG - Sin filtros coincidentes');
      console.log('[MedicionesDashboard] DEBUG - Primer medicion:', mediciones[0]);
      console.log('[MedicionesDashboard] DEBUG - metricaIds únicos en datos:', new Set(mediciones.map(m => m.metricaid || m.localizacion?.metricaid).filter(id => id != null)));
      console.log('[MedicionesDashboard] DEBUG - buscando metricaid:', selectedMetricId);
    }
    
    console.log('[MedicionesDashboard] Mediciones filtradas por metricaid:', selectedMetricId, 'items:', filtered.length);
    return filtered;
  }, [mediciones, selectedMetricId]);

  // Preparar datos para el gráfico (usando mediciones ya filtradas por métrica)
  const chartData = useMemo(() => {
    if (medicionesFiltradasPorMetrica.length === 0) return [];

    // Calcular timeSpan
    const timeSpan = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const hoursSpan = daysSpan * 24;

    // Función auxiliar para hacer grouping con una granularidad específica
    const performGrouping = (granularityType: 'minutes' | 'hours' | 'days') => {
      const getTimeKey = (date: Date): string => {
        if (granularityType === 'minutes') {
          const minutes = Math.floor(date.getMinutes() / 30) * 30;
          return `${String(date.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        if (granularityType === 'hours') {
          const hours = Math.floor(date.getHours() / 3) * 3;
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(hours).padStart(2, '0')}:00`;
        }
        // días
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      };

      // Pre-calcular labels
      const labelCache = new Map<number, string>();
      const getOrCacheLabel = (m: any): string => {
        const key = m.sensorid || 0;
        if (!labelCache.has(key)) {
          labelCache.set(key, getSeriesLabel(m));
        }
        return labelCache.get(key)!;
      };

      // Agrupar por tiempo y sensor
      const groupedByTime = new Map<string, Map<string, { values: number[], timestamp: number }>>();

      medicionesFiltradasPorMetrica.forEach((m: any) => {
        if (m.medicion === null || m.medicion === undefined) return;

        const date = new Date(m.fecha);
        const timeKey = getTimeKey(date);
        const label = getOrCacheLabel(m);

        if (!groupedByTime.has(timeKey)) {
          groupedByTime.set(timeKey, new Map());
        }

        const timeEntry = groupedByTime.get(timeKey)!;
        if (!timeEntry.has(label)) {
          // Guardar también el timestamp para ordenar después
          timeEntry.set(label, { values: [], timestamp: date.getTime() });
        }

        timeEntry.get(label)!.values.push(parseFloat(m.medicion));
      });

      // Recolectar todos los labels únicos
      const allLabels = new Set<string>();
      groupedByTime.forEach(timeEntry => {
        timeEntry.forEach((_, label) => allLabels.add(label));
      });
      const allLabelsArray = Array.from(allLabels).sort();

      // Obtener tiempos ordenados por timestamp
      const sortedTimes = Array.from(groupedByTime.entries())
        .sort((a, b) => {
          // Obtener el primer timestamp disponible de cada grupo
          const aTimestamp = Math.min(...Array.from(a[1].values()).map(v => v.timestamp || 0));
          const bTimestamp = Math.min(...Array.from(b[1].values()).map(v => v.timestamp || 0));
          return aTimestamp - bTimestamp;
        })
        .map(([timeKey]) => timeKey);

      // Construir resultado final
      const result = sortedTimes.map(timeKey => {
        const entry: any = { fecha: timeKey };

        // Inicializar todos los labels con undefined
        allLabelsArray.forEach(label => {
          entry[label] = undefined;
        });

        // Rellenar valores para este tiempo
        const timeEntry = groupedByTime.get(timeKey)!;
        timeEntry.forEach(({ values }, label) => {
          if (values.length > 0) {
            entry[label] = values.reduce((a, b) => a + b, 0) / values.length;
          }
        });

        return entry;
      });

      return { result, allLabelsArray, pointCount: result.length };
    };

    // Determinar granularidad inicial
    let granularityType: 'minutes' | 'hours' | 'days' = 'days';
    if (daysSpan <= 1) {
      granularityType = 'minutes';
    } else if (daysSpan <= 7) {
      granularityType = 'hours';
    } else {
      granularityType = 'days';
    }

    console.log('[MedicionesDashboard] chartData granularidad inicial:', { daysSpan, hoursSpan, granularityType });

    // Hacer grouping con granularidad inicial
    let { result, allLabelsArray, pointCount } = performGrouping(granularityType);

    // Fallback: si hay muy pocos puntos pero muchas mediciones, cambiar granularidad
    const totalMediciones = medicionesFiltradasPorMetrica.length;
    if (pointCount <= 2 && totalMediciones >= 3 && granularityType !== 'minutes') {
      console.log('[MedicionesDashboard] Fallback de granularidad: pocos puntos, cambiando...');
      if (granularityType === 'days') {
        // Cambiar de días a horas
        ({ result, allLabelsArray, pointCount } = performGrouping('hours'));
      }
      if (pointCount <= 2 && granularityType === 'hours') {
        // Cambiar de horas a minutos
        ({ result, allLabelsArray, pointCount } = performGrouping('minutes'));
      }
    }

    console.log('[MedicionesDashboard] chartData - granularidad final:', granularityType);
    console.log('[MedicionesDashboard] chartData - allLabels:', allLabelsArray);
    console.log('[MedicionesDashboard] chartData - result length:', result.length);
    if (result.length > 0) {
      console.log('[MedicionesDashboard] chartData - sample:', result[0]);
    }

    return result;
  }, [medicionesFiltradasPorMetrica, getSeriesLabel, dateRange.start, dateRange.end]);

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

  // Debugging: Mostrar cambios en chartData
  useEffect(() => {
    console.log('[MedicionesDashboard] chartData actualizado:', chartData.length);
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
                onChange={(e) => {
                  const newStart = e.target.value;
                  const endDate = new Date(dateRange.end);
                  const startDate = new Date(newStart);
                  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                  
                  if (daysDiff > 90) {
                    showError('Límite excedido', 'El intervalo máximo permitido es 90 días');
                    const adjustedStart = new Date(endDate);
                    adjustedStart.setDate(adjustedStart.getDate() - 90);
                    setDateRange({ start: adjustedStart.toISOString().split('T')[0], end: dateRange.end });
                  } else {
                    setDateRange({ ...dateRange, start: newStart });
                  }
                }}
                max={dateRange.end}
                min={(() => {
                  const endDate = new Date(dateRange.end);
                  endDate.setDate(endDate.getDate() - 90);
                  return endDate.toISOString().split('T')[0];
                })()}
                className="h-8 w-32 pl-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                style={{ colorScheme: 'dark', WebkitAppearance: 'none' }}
              />
              <span className="text-[10px] text-gray-400 font-mono mt-1 uppercase">Inicio</span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  const startDate = new Date(dateRange.start);
                  const endDate = new Date(newEnd);
                  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                  
                  if (daysDiff > 90) {
                    showError('Límite excedido', 'El intervalo máximo permitido es 90 días');
                    const adjustedEnd = new Date(startDate);
                    adjustedEnd.setDate(adjustedEnd.getDate() + 90);
                    setDateRange({ start: dateRange.start, end: adjustedEnd.toISOString().split('T')[0] });
                  } else {
                    setDateRange({ ...dateRange, end: newEnd });
                  }
                }}
                max={(() => {
                  const startDate = new Date(dateRange.start);
                  startDate.setDate(startDate.getDate() + 90);
                  return startDate.toISOString().split('T')[0];
                })()}
                min={dateRange.start}
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
            <LineChart key={`${selectedNode?.nodoid}-${selectedMetricId}`} data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                  fontSize: '11px',
                  borderRadius: '4px',
                  padding: '8px',
                  color: '#e5e7eb'
                }}
                labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }}
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return `${value.toFixed(2)} ${selectedMetricUnit}`;
                  }
                  return value;
                }}
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
