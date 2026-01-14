/**
 * NodeStatusDashboard - Dashboard tipo PowerBI para Status de Nodos
 * Muestra información estadística, KPIs, gráficos, alertas y umbrales por nodo
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { JoySenseService } from '../../services/backend-api';
import { NodeData } from '../../types/NodeData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { InteractiveMap } from './InteractiveMap';

interface NodeStatusDashboardProps {}

interface KPI {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color: string;
}

interface AlertData {
  alertaid: number;
  alerta: string;
  criticidad: string;
  fecha: string;
  umbral?: string;
  valor?: number;
  regla?: string;
}

interface UmbralData {
  umbralid: number;
  minimo: number;
  maximo: number;
  estandar?: number;
  umbral: string;
  criticidad: string;
  metrica: string;
  metricaid?: number;
  unidad?: string;
}

interface StatisticData {
  promedio: number;
  minimo: number;
  maximo: number;
  desviacion: number;
  ultimaMedicion: number;
  ultimaFecha: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function NodeStatusDashboard({}: NodeStatusDashboardProps) {
  const { t } = useLanguage();
  const { showError } = useToast();
  
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<any>(null);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<AlertData[]>([]);
  const [umbrales, setUmbrales] = useState<UmbralData[]>([]);
  const [statistics, setStatistics] = useState<{ [metricId: number]: StatisticData }>({});
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showMapModal, setShowMapModal] = useState(false);
  const [localizacionesNodo, setLocalizacionesNodo] = useState<string[]>([]);
  
  // Estados para comboboxes con searchbar
  const [isUbicacionDropdownOpen, setIsUbicacionDropdownOpen] = useState(false);
  const [isNodoDropdownOpen, setIsNodoDropdownOpen] = useState(false);
  const [ubicacionSearchTerm, setUbicacionSearchTerm] = useState('');
  const [nodoSearchTerm, setNodoSearchTerm] = useState('');
  const ubicacionDropdownRef = useRef<HTMLDivElement>(null);
  const nodoDropdownRef = useRef<HTMLDivElement>(null);
  const [ubicacionDropdownPosition, setUbicacionDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [nodoDropdownPosition, setNodoDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Cargar ubicaciones disponibles
  useEffect(() => {
    const loadUbicaciones = async () => {
      try {
        const ubicacionesData = await JoySenseService.getUbicaciones();
        setUbicaciones(ubicacionesData || []);
      } catch (err: any) {
        console.error('[NodeStatusDashboard] Error cargando ubicaciones:', err);
      }
    };
    loadUbicaciones();
  }, []);

  // Cargar nodos disponibles
  useEffect(() => {
    const loadNodes = async () => {
      try {
        setLoading(true);
        console.log('[NodeStatusDashboard] Cargando nodos...');
        const nodesData = await JoySenseService.getNodosConLocalizacion(1000);
        console.log('[NodeStatusDashboard] Nodos cargados:', nodesData?.length || 0);
        setNodes(nodesData || []);
      } catch (err: any) {
        console.error('[NodeStatusDashboard] Error cargando nodos:', err);
        showError('Error', 'Error al cargar nodos');
      } finally {
        setLoading(false);
      }
    };
    loadNodes();
  }, [showError]);

  // Filtrar nodos por ubicación seleccionada (filtro cascade)
  const filteredNodes = useMemo(() => {
    if (!selectedUbicacion) {
      return nodes;
    }
    return nodes.filter(node => node.ubicacionid === selectedUbicacion.ubicacionid);
  }, [nodes, selectedUbicacion]);

  // Filtrar ubicaciones por término de búsqueda
  const filteredUbicaciones = useMemo(() => {
    if (!ubicacionSearchTerm.trim()) {
      return ubicaciones;
    }
    return ubicaciones.filter((ubicacion: any) =>
      ubicacion.ubicacion?.toLowerCase().includes(ubicacionSearchTerm.toLowerCase())
    );
  }, [ubicaciones, ubicacionSearchTerm]);

  // Filtrar nodos por término de búsqueda
  const filteredNodesBySearch = useMemo(() => {
    if (!nodoSearchTerm.trim()) {
      return filteredNodes;
    }
    return filteredNodes.filter((node: any) =>
      node.nodo?.toLowerCase().includes(nodoSearchTerm.toLowerCase())
    );
  }, [filteredNodes, nodoSearchTerm]);

  // Calcular posición del dropdown de ubicación cuando se abre
  useEffect(() => {
    if (isUbicacionDropdownOpen && ubicacionDropdownRef.current) {
      const rect = ubicacionDropdownRef.current.getBoundingClientRect();
      setUbicacionDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    } else {
      setUbicacionDropdownPosition(null);
    }
  }, [isUbicacionDropdownOpen]);

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

  // Cerrar dropdowns cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ubicacionDropdownRef.current && !ubicacionDropdownRef.current.contains(event.target as Node)) {
        setIsUbicacionDropdownOpen(false);
      }
      if (nodoDropdownRef.current && !nodoDropdownRef.current.contains(event.target as Node)) {
        setIsNodoDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Limpiar nodo cuando cambia la ubicación
  useEffect(() => {
    if (selectedUbicacion && selectedNode && selectedNode.ubicacionid !== selectedUbicacion.ubicacionid) {
      setSelectedNode(null);
      setLocalizacionesNodo([]);
    }
  }, [selectedUbicacion]);

  // Cargar datos cuando se selecciona un nodo
  useEffect(() => {
    if (!selectedNode) {
      console.log('[NodeStatusDashboard] No hay nodo seleccionado, limpiando datos');
      setMediciones([]);
      setAlertas([]);
      setUmbrales([]);
      setStatistics({});
      setLocalizacionesNodo([]);
      return;
    }

    console.log('[NodeStatusDashboard] Nodo seleccionado:', selectedNode.nodoid, selectedNode.nodo);
    const loadNodeData = async () => {
      try {
        setLoading(true);
        console.log('[NodeStatusDashboard] Cargando datos para nodo:', selectedNode.nodoid);
        
        // Cargar mediciones del nodo
        const medicionesData = await JoySenseService.getMediciones({
          nodoid: selectedNode.nodoid,
          startDate: `${dateRange.start} 00:00:00`,
          endDate: `${dateRange.end} 23:59:59`,
          limit: 1000
        });
        // Verificar si es un array o un objeto con count
        const medicionesArray = Array.isArray(medicionesData) ? medicionesData : [];
        console.log('[NodeStatusDashboard] Mediciones cargadas:', medicionesArray.length);
        setMediciones(medicionesArray);

        // Cargar alertas del nodo
        try {
          // Obtener localizaciones del nodo primero
          const localizacionesData = await JoySenseService.getLocalizacionesByNodo(selectedNode.nodoid);
          const localizacionIds = (localizacionesData || []).map((l: any) => l.localizacionid);
          // Extraer solo el nombre de la localización (antes del guion si existe)
          const nombresLocalizaciones = localizacionesData
            .map((loc: any) => {
              const nombreCompleto = loc.localizacion || '';
              // Si contiene un guion, tomar solo la parte antes del guion
              const nombreLimpio = nombreCompleto.includes(' - ') 
                ? nombreCompleto.split(' - ')[0].trim()
                : nombreCompleto.trim();
              return nombreLimpio;
            })
            .filter((n: string) => n);
          setLocalizacionesNodo(nombresLocalizaciones);
          
          if (localizacionIds.length > 0) {
            // Obtener alertas para estas localizaciones
            const alertasData = await JoySenseService.getAlertasRegla({
              startDate: `${dateRange.start} 00:00:00`,
              endDate: `${dateRange.end} 23:59:59`,
              pageSize: 100
            });
            
            const alertasArray = Array.isArray(alertasData) ? alertasData : (alertasData as any)?.data || [];
            const alertasFiltradas = alertasArray.filter((a: any) => 
              localizacionIds.includes(a.localizacionid)
            );
            
            setAlertas(alertasFiltradas.map((a: any) => ({
              alertaid: a.uuid_alerta_reglaid || a.alertaid,
              alerta: a.regla?.nombre || 'Alerta',
              criticidad: a.regla?.criticidad?.criticidad || 'Media',
              fecha: a.fecha || a.datecreated,
              valor: a.valor || 0,
              regla: a.regla?.nombre || 'N/A'
            })));
          } else {
            setAlertas([]);
          }
        } catch (err) {
          console.error('Error cargando alertas:', err);
          setAlertas([]);
        }

        // Cargar umbrales del nodo
        try {
          const umbralesData = await JoySenseService.getUmbralesPorNodo(selectedNode.nodoid);
          console.log('Umbrales cargados para nodo:', selectedNode.nodoid, umbralesData);
          setUmbrales((umbralesData || []).map((u: any) => ({
            umbralid: u.umbralid,
            minimo: u.minimo,
            maximo: u.maximo,
            estandar: u.estandar,
            umbral: u.umbral || 'Umbral',
            criticidad: u.criticidad?.criticidad || 'Media',
            metrica: u.metrica?.metrica || 'N/A',
            unidad: u.metrica?.unidad || '',
            metricaid: u.metricaid
          })));
        } catch (err) {
          console.error('Error cargando umbrales:', err);
          setUmbrales([]);
        }

        // Calcular estadísticas por métrica
        const statsByMetric: { [metricId: number]: StatisticData } = {};
        const metricGroups: { [metricId: number]: number[] } = {};
        
        // Usar medicionesArray que ya fue declarado arriba
        medicionesArray.forEach((m: any) => {
          const metricId = m.metricaid || m.localizacion?.metricaid || 0;
          if (!metricGroups[metricId]) {
            metricGroups[metricId] = [];
          }
          const valor = m.medicion;
          if (valor != null && !isNaN(valor)) {
            metricGroups[metricId].push(parseFloat(valor));
          }
        });

        Object.keys(metricGroups).forEach(metricIdStr => {
          const metricId = parseInt(metricIdStr);
          const values = metricGroups[metricId];
          if (values.length > 0) {
            const promedio = values.reduce((a, b) => a + b, 0) / values.length;
            const minimo = Math.min(...values);
            const maximo = Math.max(...values);
            const variance = values.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / values.length;
            const desviacion = Math.sqrt(variance);
            
            // Obtener última medición
            const ultimaMedicionData = medicionesArray
              .filter((m: any) => (m.metricaid || m.localizacion?.metricaid || 0) === metricId)
              .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
            
            statsByMetric[metricId] = {
              promedio: Number(promedio.toFixed(2)),
              minimo: Number(minimo.toFixed(2)),
              maximo: Number(maximo.toFixed(2)),
              desviacion: Number(desviacion.toFixed(2)),
              ultimaMedicion: ultimaMedicionData ? (ultimaMedicionData.medicion || 0) : 0,
              ultimaFecha: ultimaMedicionData?.fecha || ''
            };
          }
        });

        setStatistics(statsByMetric);
        console.log('[NodeStatusDashboard] Datos cargados exitosamente. Estadísticas:', Object.keys(statsByMetric).length, 'métricas');
      } catch (err: any) {
        console.error('[NodeStatusDashboard] Error cargando datos del nodo:', err);
        showError('Error', 'Error al cargar datos del nodo');
      } finally {
        setLoading(false);
        console.log('[NodeStatusDashboard] Carga de datos completada');
      }
    };

    loadNodeData();
  }, [selectedNode, dateRange, showError]);

  // Calcular KPIs
  const kpis = useMemo((): KPI[] => {
    if (!selectedNode || Object.keys(statistics).length === 0) {
      return [];
    }

    const stats = Object.values(statistics);
    const totalMediciones = mediciones.length;
    const alertasActivas = alertas.length;
    const umbralesConfigurados = umbrales.length;

    return [
      {
        label: 'TOTAL MEDICIONES',
        value: totalMediciones,
        color: '#3b82f6'
      },
      {
        label: 'ALERTAS ACTIVAS',
        value: alertasActivas,
        color: alertasActivas > 0 ? '#ef4444' : '#10b981'
      },
      {
        label: 'UMBRALES CONFIGURADOS',
        value: umbralesConfigurados,
        color: '#8b5cf6'
      },
      {
        label: 'MÉTRICAS MONITOREADAS',
        value: Object.keys(statistics).length,
        color: '#f59e0b'
      }
    ];
  }, [selectedNode, statistics, mediciones, alertas, umbrales]);

  // Mapeo de metricId a nombre de métrica
  const metricNamesMap = useMemo(() => {
    const map: { [metricId: number]: string } = {};
    mediciones.forEach((m: any) => {
      const metricId = m.metricaid || m.localizacion?.metricaid || 0;
      if (metricId && !map[metricId]) {
        const metricName = m.localizacion?.metrica?.metrica || `Métrica ${metricId}`;
        map[metricId] = metricName;
      }
    });
    return map;
  }, [mediciones]);

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    if (!selectedNode || mediciones.length === 0) return [];

    // Agrupar por fecha y métrica, manteniendo la fecha original para ordenar
    const grouped: { [dateKey: string]: any } = {};
    
    mediciones.forEach((m: any) => {
      const fechaOriginal = new Date(m.fecha);
      const fecha = fechaOriginal.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      const fechaKey = fechaOriginal.toISOString().split('T')[0]; // Usar fecha completa como key
      const metricId = m.metricaid || m.localizacion?.metricaid || 0;
      const valor = m.medicion || m.valor;
      
      if (!grouped[fechaKey]) {
        grouped[fechaKey] = { fecha, fechaOriginal, [metricId]: 0 };
      }
      if (valor != null && !isNaN(valor)) {
        grouped[fechaKey][metricId] = parseFloat(valor);
      }
    });

    // Ordenar por fecha de menor a mayor
    return Object.values(grouped)
      .sort((a: any, b: any) => a.fechaOriginal.getTime() - b.fechaOriginal.getTime())
      .map((item: any) => {
        const { fechaOriginal, fecha, ...rest } = item;
        return {
          fecha,
          ...rest
        };
      });
  }, [mediciones, selectedNode]);

  // Datos para gráfico de alertas por criticidad
  const alertasByCriticidad = useMemo(() => {
    const counts: { [key: string]: number } = {};
    alertas.forEach(a => {
      counts[a.criticidad] = (counts[a.criticidad] || 0) + 1;
    });
    return Object.keys(counts).map(criticidad => ({
      name: criticidad,
      value: counts[criticidad]
    }));
  }, [alertas]);

  // Datos para gráfico de barras de alertas
  const alertasChartData = useMemo(() => {
    if (alertas.length === 0) return [];
    
    // Agrupar alertas por fecha y criticidad, tomando el máximo valor
    const grouped: { [dateKey: string]: any } = {};
    
    alertas.forEach((a: any) => {
      const fechaOriginal = new Date(a.fecha);
      const fecha = fechaOriginal.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      const fechaKey = fechaOriginal.toISOString().split('T')[0]; // Usar fecha completa como key
      const criticidad = a.criticidad || 'Desconocida';
      const valor = a.valor || 0;
      
      if (!grouped[fechaKey]) {
        grouped[fechaKey] = { fecha, fechaOriginal, [criticidad]: 0 };
      }
      if (!grouped[fechaKey][criticidad]) {
        grouped[fechaKey][criticidad] = valor;
      } else {
        // Tomar el máximo valor para esa fecha y criticidad
        grouped[fechaKey][criticidad] = Math.max(grouped[fechaKey][criticidad], valor);
      }
    });

    // Ordenar por fecha de menor a mayor
    return Object.values(grouped)
      .sort((a: any, b: any) => a.fechaOriginal.getTime() - b.fechaOriginal.getTime())
      .map((item: any) => {
        const { fechaOriginal, fecha, ...rest } = item;
        return {
          fecha,
          ...rest
        };
      });
  }, [alertas]);

  // Calcular estadísticas para boxplot por métrica
  const boxplotData = useMemo(() => {
    if (!selectedNode || mediciones.length === 0 || umbrales.length === 0) return [];
    
    const result: any[] = [];
    
    // Agrupar mediciones por métrica
    const medicionesPorMetrica: { [metricId: number]: number[] } = {};
    mediciones.forEach((m: any) => {
      const metricId = m.metricaid || m.localizacion?.metricaid || 0;
      const valor = m.medicion || m.valor;
      if (metricId && valor != null && !isNaN(valor)) {
        if (!medicionesPorMetrica[metricId]) {
          medicionesPorMetrica[metricId] = [];
        }
        medicionesPorMetrica[metricId].push(parseFloat(valor));
      }
    });

    // Agrupar umbrales por métrica (para evitar duplicados)
    const umbralesPorMetrica: { [metricId: number]: any } = {};
    umbrales.forEach((umbral) => {
      const metricId = umbral.metricaid;
      if (metricId) {
        // Si ya existe un umbral para esta métrica, mantener el primero o el que tenga estandar definido
        if (!umbralesPorMetrica[metricId] || (umbral.estandar != null && umbralesPorMetrica[metricId].estandar == null)) {
          umbralesPorMetrica[metricId] = umbral;
        }
      }
    });

    // Para cada métrica única, calcular boxplot una sola vez
    Object.keys(umbralesPorMetrica).forEach((metricIdStr) => {
      const metricId = parseInt(metricIdStr);
      const umbral = umbralesPorMetrica[metricId];
      
      if (!medicionesPorMetrica[metricId] || medicionesPorMetrica[metricId].length === 0) {
        return;
      }

      const valores = [...medicionesPorMetrica[metricId]].sort((a, b) => a - b);
      const n = valores.length;
      
      // Calcular cuartiles
      const q1Index = Math.floor(n * 0.25);
      const medianIndex = Math.floor(n * 0.5);
      const q3Index = Math.floor(n * 0.75);
      
      const min = valores[0];
      const q1 = valores[q1Index];
      const median = valores[medianIndex];
      const q3 = valores[q3Index];
      const max = valores[n - 1];
      const iqr = q3 - q1; // Rango intercuartílico
      
      // Obtener nombre de métrica
      const metric = mediciones.find((m: any) => 
        (m.metricaid || m.localizacion?.metricaid || 0) === metricId
      );
      const metricName = metric?.localizacion?.metrica?.metrica || `Métrica ${metricId}`;
      
      // Calcular offsets para barras apiladas
      const minOffset = min;
      const q1Offset = q1 - min;
      const iqrValue = q3 - q1;
      const maxOffset = max - q3;
      
      result.push({
        metrica: metricName,
        metricId: metricId,
        min,
        q1,
        median,
        q3,
        max,
        iqr: iqrValue,
        minOffset,
        q1Offset,
        maxOffset,
        estandar: umbral.estandar,
        minimo: umbral.minimo,
        maximo: umbral.maximo
      });
    });

    return result;
  }, [mediciones, umbrales, selectedNode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6">
      <div className="max-w-[95vw] mx-auto">
        {/* Controles compactos en una sola fila - Similar a MAPEO DE NODOS */}
        <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-3 mb-6 relative">
          {/* Botón X para cancelar selección - Extremo superior derecho */}
          {(selectedUbicacion || selectedNode) && (
            <button
              onClick={() => {
                setSelectedUbicacion(null);
                setSelectedNode(null);
                setLocalizacionesNodo([]);
                setUbicacionSearchTerm('');
                setNodoSearchTerm('');
              }}
              className="absolute top-2 right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-mono flex items-center justify-center transition-colors"
              title="Cancelar selección"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <div className={`flex items-start gap-2 flex-nowrap overflow-x-auto dashboard-scrollbar-blue ${!selectedNode ? 'justify-center' : ''}`} style={{ maxWidth: '100%', width: '100%' }}>
            {/* Selector de Ubicación */}
            <div className="flex flex-col flex-shrink-0" ref={ubicacionDropdownRef}>
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Ubicación:
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsUbicacionDropdownOpen(!isUbicacionDropdownOpen)}
                  className="h-8 min-w-[120px] px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs flex items-center justify-between"
                >
                  <span className={selectedUbicacion ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                    {selectedUbicacion?.ubicacion || 'Selecciona Ubicación'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${isUbicacionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isUbicacionDropdownOpen && ubicacionDropdownPosition && (
                  <div 
                    className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
                    style={{
                      top: `${ubicacionDropdownPosition.top}px`,
                      left: `${ubicacionDropdownPosition.left}px`,
                      width: `${ubicacionDropdownPosition.width}px`
                    }}
                  >
                    <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                      <input
                        type="text"
                        value={ubicacionSearchTerm}
                        onChange={(e) => setUbicacionSearchTerm(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                      {filteredUbicaciones.length > 0 ? (
                        filteredUbicaciones.map((ubicacion: any) => (
                          <button
                            key={ubicacion.ubicacionid}
                            onClick={() => {
                              setSelectedUbicacion(ubicacion);
                              setIsUbicacionDropdownOpen(false);
                              setUbicacionSearchTerm('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                              selectedUbicacion?.ubicacionid === ubicacion.ubicacionid
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {ubicacion.ubicacion}
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

            {/* Separador visual */}
            <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

            {/* Selector de Nodo */}
            <div className="flex flex-col flex-shrink-0" ref={nodoDropdownRef}>
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Nodo:
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsNodoDropdownOpen(!isNodoDropdownOpen)}
                  className="h-8 min-w-[120px] px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs flex items-center justify-between"
                >
                  <span className={selectedNode ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                    {selectedNode?.nodo || 'Selecciona Nodo'}
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
                      {filteredNodesBySearch.length > 0 ? (
                        filteredNodesBySearch.map((node: any) => (
                          <button
                            key={node.nodoid}
                            onClick={() => {
                              setSelectedNode(node);
                              // Establecer automáticamente la ubicación del nodo seleccionado
                              if (node.ubicacionid) {
                                const ubicacionCorrespondiente = ubicaciones.find((u: any) => u.ubicacionid === node.ubicacionid);
                                if (ubicacionCorrespondiente) {
                                  setSelectedUbicacion(ubicacionCorrespondiente);
                                }
                              }
                              setIsNodoDropdownOpen(false);
                              setNodoSearchTerm('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                              selectedNode?.nodoid === node.nodoid
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {node.nodo}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 font-mono">
                          {selectedUbicacion ? 'No se encontraron nodos en esta ubicación' : 'No se encontraron nodos'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Separador visual */}
            <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

            {/* Botón Nodo en Mapa */}
            <div className="flex flex-col flex-shrink-0">
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Mapa:
              </label>
              <button
                onClick={() => setShowMapModal(true)}
                className="h-8 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-mono text-xs transition-colors whitespace-nowrap"
                title="Ver nodos en el mapa"
              >
                Nodo en Mapa
              </button>
            </div>

            {/* Separador visual después de Mapa */}
            <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

            {/* Intervalo de Fechas - Siempre visible pero deshabilitado hasta seleccionar nodo */}
            <div className="flex flex-col flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                    Fecha Inicio:
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    disabled={!selectedNode}
                    className="h-8 w-36 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      colorScheme: 'dark',
                      WebkitAppearance: 'none'
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                    Fecha Fin:
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    min={dateRange.start || undefined}
                    disabled={!selectedNode}
                    className="h-8 w-36 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      colorScheme: 'dark',
                      WebkitAppearance: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Separador visual */}
            <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

            {/* Información del Nodo - Siempre visible pero sin info hasta seleccionar nodo */}
            <div className="flex flex-col flex-shrink-0">
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Información del Nodo:
              </label>
              <div className="h-8 flex items-center gap-3 px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">Loc.:</span>
                  <span className="text-xs text-gray-800 dark:text-white font-mono">{localizacionesNodo.length > 0 ? localizacionesNodo.join(', ') : '--'}</span>
                </div>
                <div className="w-px h-4 bg-gray-400 dark:bg-neutral-600"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">Ubic.:</span>
                  <span className="text-xs text-gray-800 dark:text-white font-mono">{selectedNode?.ubicacion?.ubicacion || '--'}</span>
                </div>
                <div className="w-px h-4 bg-gray-400 dark:bg-neutral-600"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">Fundo:</span>
                  <span className="text-xs text-gray-800 dark:text-white font-mono">{selectedNode?.ubicacion?.fundo?.fundo || '--'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}


        {selectedNode && !loading && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {kpis.map((kpi, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 border-l-4"
                  style={{ borderLeftColor: kpi.color }}
                >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-mono">{kpi.label}</p>
                <p className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>
                  {kpi.value} {kpi.unit || ''}
                </p>
                </div>
              ))}
            </div>

            {/* Gráficos: Evolución de Mediciones y Estadísticas por Métrica en la misma fila */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-blue-500 font-mono mb-4 uppercase tracking-wider">Evolución de Mediciones</h2>
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .recharts-tooltip-wrapper,
                      .recharts-legend-wrapper {
                        font-family: 'JetBrains Mono', monospace !important;
                      }
                    `
                  }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {Object.keys(statistics).map((metricId, index) => {
                        const metricIdNum = parseInt(metricId);
                        const metricName = metricNamesMap[metricIdNum] || `Métrica ${metricId}`;
                        return (
                          <Line
                            key={metricId}
                            type="monotone"
                            dataKey={metricId}
                            stroke={COLORS[index % COLORS.length]}
                            name={metricName}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Estadísticas por Métrica */}
                {Object.keys(statistics).length > 0 && (
                  <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-blue-500 font-mono mb-4 uppercase tracking-wider">Estadísticas por Métrica</h2>
                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                      {Object.entries(statistics).map(([metricId, stats]) => {
                        const metric = mediciones.find((m: any) => 
                          (m.metricaid || m.localizacion?.metricaid || 0) === parseInt(metricId)
                        );
                        const metricName = metric?.localizacion?.metrica?.metrica || `Métrica ${metricId}`;
                        
                        return (
                          <div key={metricId} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm font-mono">{metricName}</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Promedio:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.promedio}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Mínimo:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.minimo}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Máximo:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.maximo}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Desviación:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.desviacion}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alertas del Nodo y Boxplot en la misma fila */}
            {alertas.length > 0 && alertasChartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Alertas del Nodo - Gráfico de Barras */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-blue-500 font-mono mb-4 uppercase tracking-wider">Alertas del Nodo</h2>
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .recharts-tooltip-wrapper,
                      .recharts-legend-wrapper {
                        font-family: 'JetBrains Mono', monospace !important;
                      }
                    `
                  }} />
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={alertasChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {Array.from(new Set(alertas.map(a => a.criticidad))).map((criticidad, index) => {
                        const colorMap: { [key: string]: string } = {
                          'Alta': '#ef4444',
                          'Media': '#f59e0b',
                          'Baja': '#10b981'
                        };
                        return (
                          <Bar
                            key={criticidad}
                            dataKey={criticidad}
                            fill={colorMap[criticidad] || COLORS[index % COLORS.length]}
                            name={criticidad}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Boxplot de Mediciones vs Umbral Estándar */}
                {boxplotData.length > 0 && (
                  <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-blue-500 font-mono mb-4 uppercase tracking-wider">Distribución vs Umbral Estándar</h2>
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .recharts-tooltip-wrapper,
                        .recharts-legend-wrapper {
                          font-family: 'JetBrains Mono', monospace !important;
                        }
                      `
                    }} />
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={boxplotData} layout="vertical" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="metrica" type="category" width={120} />
                        <Tooltip 
                          formatter={(value: any, name: string, props: any) => {
                            const data = props.payload;
                            if (name === 'estandar') return [`${value?.toFixed(2) || 'N/A'}`, 'Umbral Estándar'];
                            if (name === 'iqr') {
                              return [
                                `Min: ${data.min?.toFixed(2)}, Q1: ${data.q1?.toFixed(2)}, Mediana: ${data.median?.toFixed(2)}, Q3: ${data.q3?.toFixed(2)}, Max: ${data.max?.toFixed(2)}`,
                                'Distribución'
                              ];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        {/* Boxplot: barras apiladas para representar la distribución */}
                        {/* Offset hasta min (transparente) */}
                        <Bar dataKey="minOffset" stackId="box" fill="transparent" />
                        {/* Offset de min a Q1 (whisker inferior) */}
                        <Bar dataKey="q1Offset" stackId="box" fill="#e5e7eb" name="Min-Q1" />
                        {/* IQR (Q1 a Q3) - la caja del boxplot */}
                        <Bar dataKey="iqr" stackId="box" fill="#3b82f6" name="IQR (Q1-Q3)" />
                        {/* Offset de Q3 a max (whisker superior) */}
                        <Bar dataKey="maxOffset" stackId="box" fill="#e5e7eb" name="Q3-Max" />
                        {/* Mediana como barra delgada */}
                        <Bar dataKey="median" fill="#f59e0b" name="Mediana" radius={[0, 0, 0, 0]} />
                        {/* Línea de referencia para umbral estándar */}
                        {boxplotData.map((item, index) => (
                          item.estandar != null && !isNaN(item.estandar) && (
                            <ReferenceLine
                              key={`ref-${index}`}
                              x={item.estandar}
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              label={{ value: 'Estándar', position: 'right', fill: '#8b5cf6', fontSize: 10 }}
                            />
                          )
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Umbrales */}
            {umbrales.length > 0 && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-blue-500 font-mono mb-4 uppercase tracking-wider">Umbrales Configurados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {umbrales.map(umbral => (
                    <div
                      key={umbral.umbralid}
                      className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 font-mono">{umbral.metrica}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-mono">Umbral: {umbral.umbral}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-mono">
                        Rango: {umbral.minimo} - {umbral.maximo}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        Criticidad: {umbral.criticidad}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Mapa para Seleccionar Nodo */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-5xl flex flex-col">
              {/* Header del Modal */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-neutral-700">
                <h2 className="text-lg font-bold text-blue-500 font-mono uppercase">
                  Seleccionar Nodo en el Mapa
                </h2>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del Modal - Mapa */}
              <div className="p-2">
                <div 
                  className="overflow-hidden"
                  style={{ height: '500px' }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .node-status-map-container > div {
                        height: 100% !important;
                      }
                      .node-status-map-container > div > div {
                        height: 100% !important;
                      }
                    `
                  }} />
                  <div className="node-status-map-container h-full">
                    <InteractiveMap
                      nodes={nodes}
                      selectedNode={selectedNode}
                      onNodeSelect={(node) => {
                        setSelectedNode(node);
                        // Establecer automáticamente la ubicación del nodo seleccionado
                        if (node.ubicacionid) {
                          const ubicacionCorrespondiente = ubicaciones.find((u: any) => u.ubicacionid === node.ubicacionid);
                          if (ubicacionCorrespondiente) {
                            setSelectedUbicacion(ubicacionCorrespondiente);
                          }
                        }
                        setShowMapModal(false);
                      }}
                      loading={loading}
                      nodeMediciones={{}}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NodeStatusDashboard;

