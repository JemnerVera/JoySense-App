/**
 * NodeStatusDashboard - Dashboard tipo PowerBI para Status de Nodos
 * Muestra información estadística, KPIs, gráficos, alertas y umbrales por nodo
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import { NodeData } from '../../types/NodeData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useFilters } from '../../contexts/FilterContext';
import { filterNodesByGlobalFilters } from '../../utils/filterNodesUtils';
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

export function NodeStatusDashboard(_props: NodeStatusDashboardProps) {
  const { t } = useLanguage();
  const { showError } = useToast();
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();
  
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<any>(null);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<AlertData[]>([]);
  const [umbrales, setUmbrales] = useState<UmbralData[]>([]);
  const [statistics, setStatistics] = useState<{ [metricId: number]: StatisticData }>({});
  const [tipos, setTipos] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Estados para fechas temporales (antes de aplicar)
  const [pendingDateRange, setPendingDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [showMapModal, setShowMapModal] = useState(false);
  const [localizacionesNodo, setLocalizacionesNodo] = useState<string[]>([]);
  const [selectedBoxplotMetricId, setSelectedBoxplotMetricId] = useState<number | null>(null);
  
  // Función para obtener la etiqueta de la serie (compartida entre gráficos)
  const getSeriesLabel = useCallback((m: any) => {
    const sensorId = m.sensorid || m.localizacion?.sensorid;
    const sensorInfo = sensores.find(s => s.sensorid === sensorId);
    
    // IMPORTANTE: Usar m.localizacion?.sensor?.sensor primero (viene de la BD con nombre completo)
    const sensorName = m.localizacion?.sensor?.sensor || 
                       m.localizacion?.sensor?.nombre ||
                       sensorInfo?.sensor || 
                       sensorInfo?.nombre || 
                       sensorInfo?.modelo;
    
    // Buscar tipo en múltiples lugares
    const tipoId = m.tipoid || sensorInfo?.tipoid || m.localizacion?.sensor?.tipoid || m.localizacion?.sensor?.tipo?.tipoid;
    const tipoInfo = tipos.find(t => t.tipoid === tipoId);
    const tipoName = tipoInfo?.tipo || m.localizacion?.sensor?.tipo?.tipo || 'Sensor';
    
    if (sensorName && sensorName !== tipoName) {
      return `${tipoName} - ${sensorName}`;
    }
    
    // Si no hay nombre de sensor distintivo, usar ID para asegurar unicidad si es posible
    if (sensorId && sensorId !== tipoId) {
      return `${tipoName} (ID: ${sensorId})`;
    }
    
    return tipoName;
  }, [sensores, tipos]);

  // Estados para comboboxes con searchbar
  const [isUbicacionDropdownOpen, setIsUbicacionDropdownOpen] = useState(false);
  const [isNodoDropdownOpen, setIsNodoDropdownOpen] = useState(false);
  const [ubicacionSearchTerm, setUbicacionSearchTerm] = useState('');
  const [nodoSearchTerm, setNodoSearchTerm] = useState('');
  const ubicacionDropdownRef = useRef<HTMLDivElement>(null);
  const nodoDropdownRef = useRef<HTMLDivElement>(null);
  const [ubicacionDropdownPosition, setUbicacionDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [nodoDropdownPosition, setNodoDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // Cache de información de fundos (para validar nodos contra filtros globales)
  const [fundosInfo, setFundosInfo] = useState<Map<number, any>>(new Map());

  // Cargar ubicaciones disponibles y fundos con su información
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [ubicacionesData, tiposData, sensoresData, fundosData] = await Promise.all([
          JoySenseService.getUbicaciones(),
          JoySenseService.getTipos(),
          JoySenseService.getSensores(),
          JoySenseService.getFundos()
        ]);
        setUbicaciones(ubicacionesData || []);
        setTipos(tiposData || []);
        setSensores(sensoresData || []);
        
        // Crear un mapa de fundoid → fundo completo (con empresa y país)
        const fundosMap = new Map();
        (fundosData || []).forEach((fundo: any) => {
          fundosMap.set(fundo.fundoid, fundo);
        });
        setFundosInfo(fundosMap);
      } catch (err: any) {
        console.error('[NodeStatusDashboard] Error cargando datos iniciales:', err);
      }
    };
    loadInitialData();
  }, []);

  // Cargar nodos disponibles (con filtros globales para que el mapa muestre todos los del fundo/empresa/país)
  useEffect(() => {
    const loadNodes = async () => {
      try {
        setLoading(true);
        const filters = fundoSeleccionado
          ? { fundoId: fundoSeleccionado }
          : empresaSeleccionada
          ? { empresaId: empresaSeleccionada }
          : paisSeleccionado
          ? { paisId: paisSeleccionado }
          : undefined;
        const nodesData = await JoySenseService.getNodosConLocalizacion(1000, filters);
        setNodes(nodesData || []);
      } catch (err: any) {
        console.error('[NodeStatusDashboard] Error cargando nodos:', err);
        showError('Error', 'Error al cargar nodos');
      } finally {
        setLoading(false);
      }
    };
    loadNodes();
  }, [showError, paisSeleccionado, empresaSeleccionada, fundoSeleccionado]);

  // Filtrar nodos por filtros globales y ubicación seleccionada
  const filteredNodes = useMemo(() => {
    // Primero aplicar filtros globales (país, empresa, fundo)
    let filtered = filterNodesByGlobalFilters(
      nodes,
      paisSeleccionado,
      empresaSeleccionada,
      fundoSeleccionado
    );
    
    // Luego filtrar por ubicación seleccionada (filtro cascade)
    if (!selectedUbicacion) {
      return filtered;
    }
    return filtered.filter(node => node.ubicacionid === selectedUbicacion.ubicacionid);
  }, [nodes, selectedUbicacion, paisSeleccionado, empresaSeleccionada, fundoSeleccionado]);

  // Filtrar ubicaciones por término de búsqueda
  const filteredUbicaciones = useMemo(() => {
    if (!ubicacionSearchTerm.trim()) {
      return ubicaciones;
    }
    return ubicaciones.filter((ubicacion: any) =>
      ubicacion.ubicacion?.toLowerCase().includes(ubicacionSearchTerm.toLowerCase())
    );
  }, [ubicaciones, ubicacionSearchTerm]);

  // Obtener localizaciones únicas de los nodos filtrados
  const localizacionesDisponibles = useMemo(() => {
    const localizacionesSet = new Set<string>();
    filteredNodes.forEach((node: any) => {
      if (node.localizacion) {
        localizacionesSet.add(node.localizacion);
      }
    });
    return Array.from(localizacionesSet).sort();
  }, [filteredNodes]);

  // Filtrar localizaciones por término de búsqueda
  const filteredLocalizacionesBySearch = useMemo(() => {
    if (!nodoSearchTerm.trim()) {
      return localizacionesDisponibles;
    }
    return localizacionesDisponibles.filter((localizacion: string) =>
      localizacion.toLowerCase().includes(nodoSearchTerm.toLowerCase())
    );
  }, [localizacionesDisponibles, nodoSearchTerm]);

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

  // Función para validar si un nodo cumple con los filtros globales actuales
  const nodoMatchesGlobalFilters = useCallback((node: NodeData): boolean => {
    // Si no hay filtros activos, aceptar el nodo
    if (!paisSeleccionado && !empresaSeleccionada && !fundoSeleccionado) {
      return true;
    }

    if (!node.ubicacion) {
      return false;
    }

    const fundoId = node.ubicacion.fundoid;
    
    // Verificar filtro de fundo (el más específico)
    if (fundoSeleccionado && fundoSeleccionado !== '') {
      if (fundoId?.toString() !== fundoSeleccionado) {
        return false;
      }
    }

    // Para empresa y país, usar el mapa de fundos
    const fundoInfo = fundosInfo.get(fundoId);

    // Verificar filtro de empresa
    if (empresaSeleccionada && empresaSeleccionada !== '') {
      const empresaId = fundoInfo?.empresaid;
      if (empresaId?.toString() !== empresaSeleccionada) {
        return false;
      }
    }

    // Nota: El filtro de país se verifica principalmente a través de empresa
    
    return true;
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, fundosInfo]);

  // Limpiar nodo cuando cambian los filtros globales y el nodo ya no es válido
  useEffect(() => {
    if (selectedNode && !nodoMatchesGlobalFilters(selectedNode)) {
      setSelectedNode(null);
      setSelectedUbicacion(null);
      setNodoSearchTerm('');           // Limpiar búsqueda de nodos
      setUbicacionSearchTerm('');      // Limpiar búsqueda de ubicaciones
      setMediciones([]);
      setAlertas([]);
      setUmbrales([]);
      setStatistics([]);
      setLocalizacionesNodo([]);
      setShowMapModal(false);
      setSelectedMetricId(null);       // Limpiar métrica seleccionada
      setSelectedBoxplotMetricId(null); // Limpiar boxplot si existe
    }
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, selectedNode, nodoMatchesGlobalFilters]);
  useEffect(() => {
    if (selectedUbicacion && selectedNode && selectedNode.ubicacionid !== selectedUbicacion.ubicacionid) {
      setSelectedNode(null);
      setLocalizacionesNodo([]);
    }
  }, [selectedUbicacion]);

  // Sincronizar pendingDateRange con dateRange cuando cambia selectedNode
  useEffect(() => {
    setPendingDateRange(dateRange);
  }, [selectedNode]);

  // Cargar datos cuando se selecciona un nodo
  useEffect(() => {
    if (!selectedNode) {
      setMediciones([]);
      setAlertas([]);
      setUmbrales([]);
      setStatistics({});
      setLocalizacionesNodo([]);
      return;
    }

    const loadNodeData = async () => {
      try {
        setLoading(true);

        // Validar que el rango de fechas no exceda 90 días
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff > 90) {
          showError('Límite excedido', 'El intervalo máximo permitido es 90 días');
          setLoading(false);
          return;
        }

        // Las mediciones se cargarán en un useEffect separado cuando cambie selectedMetricId
        // Aquí solo cargamos KPIs, alertas, umbrales y localizaciones
        setMediciones([]);

        // Cargar KPIs consolidados (incluye estadísticas y alertas por métrica)
        const kpisData = await SupabaseRPCService.getKPIsNodo({
          nodoid: selectedNode.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end
        });

        // Convertir KPIs a formato de estadísticas
        const statsByMetric: { [metricId: number]: StatisticData } = {};
        kpisData.forEach((kpi: any) => {
          statsByMetric[kpi.metricaid] = {
            promedio: kpi.promedio,
            minimo: kpi.minimo,
            maximo: kpi.maximo,
            desviacion: kpi.desviacion,
            ultimaMedicion: kpi.ultima_valor,
            ultimaFecha: kpi.ultima_fecha
          };
        });

        setStatistics(statsByMetric);

        // Cargar alertas del nodo
        try {
          const alertasData = await SupabaseRPCService.getAlertasPorNodo({
            nodoid: selectedNode.nodoid,
            startDate: dateRange.start,
            endDate: dateRange.end
          });

          setAlertas(
            (alertasData || []).map((a: any) => ({
              alertaid: a.alertaid,
              alerta: a.regla_nombre || 'Alerta',
              criticidad: a.criticidad || 'Media',
              fecha: a.fecha,
              valor: a.valor || 0,
              regla: a.regla_nombre || 'N/A'
            }))
          );
        } catch (err) {
          console.error('[NodeStatusDashboard] Error cargando alertas:', err);
          setAlertas([]);
        }

        // Cargar umbrales del nodo
        try {
          const umbralesData = await SupabaseRPCService.getUmbralesPorNodo({
            nodoid: selectedNode.nodoid
          });

          setUmbrales(
            (umbralesData || []).map((u: any) => ({
              umbralid: u.umbralid,
              minimo: u.minimo,
              maximo: u.maximo,
              estandar: u.estandar,
              umbral: u.metrica_nombre || 'Umbral',
              criticidad: u.criticidad || 'Sin Criticidad',
              metrica: u.metrica_nombre || 'N/A',
              unidad: u.unidad || '',
              metricaid: u.metricaid
            }))
          );
        } catch (err) {
          console.error('[NodeStatusDashboard] Error cargando umbrales:', err);
          setUmbrales([]);
        }

        // Obtener localizaciones únicas del nodo
        try {
          const localizacionesData = await JoySenseService.getLocalizacionesByNodo(
            selectedNode.nodoid
          );
          const nombresLocalizaciones = Array.from(
            new Set(
              localizacionesData
                .map((loc: any) => {
                  const nombreCompleto = loc.localizacion || '';
                  const nombreLimpio = nombreCompleto.includes(' - ')
                    ? nombreCompleto.split(' - ')[0].trim()
                    : nombreCompleto.trim();
                  return nombreLimpio;
                })
                .filter((n: string) => n)
            )
          );
          setLocalizacionesNodo(nombresLocalizaciones);
        } catch (err) {
          console.error('[NodeStatusDashboard] Error cargando localizaciones:', err);
          setLocalizacionesNodo([]);
        }

        // Establecer métrica por defecto si no hay una seleccionada
        const availableMetricIds = Object.keys(statsByMetric).map(Number);
        if (availableMetricIds.length > 0) {
          if (!selectedMetricId || !availableMetricIds.includes(selectedMetricId)) {
            setSelectedMetricId(availableMetricIds[0]);
          }
        } else {
          setSelectedMetricId(null);
        }

        // Resetear la selección de métrica del boxplot cuando cambian los datos
        setSelectedBoxplotMetricId(null);
      } catch (err: any) {
        console.error('[NodeStatusDashboard] Error cargando datos del nodo:', err);
        showError('Error', 'Error al cargar datos del nodo');
      } finally {
        setLoading(false);
      }
    };

    loadNodeData();
  }, [selectedNode, dateRange, showError]);

  // Cargar mediciones cuando cambia rango de fechas o métrica seleccionada
  useEffect(() => {
    if (!selectedNode?.nodoid) {
      setMediciones([]);
      return;
    }

    // Validar que el rango de fechas no exceda 90 días
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff > 90) {
      showError('Límite excedido', 'El intervalo máximo permitido es 90 días');
      return;
    }

    const loadMediciones = async () => {
      try {
        setLoading(true);
        // SIEMPRE cargar TODAS las mediciones sin filtro de métrica
        // El selector de métrica solo es para referencia visual
        const medicionesDetalladas = await SupabaseRPCService.getMedicionesNodoDetallado({
          nodoid: selectedNode.nodoid,
          // NO pasar metricaid - queremos TODAS las métricas
          startDate: dateRange.start,
          endDate: dateRange.end
        });

        // Transformar mediciones detalladas a formato para gráficos
        // IMPORTANTE: Calcular label aquí para evitar problemas de recreación de funciones
        const medicionesTransformadas = medicionesDetalladas.map((m: any) => {
          // getMedicionesNodoDetallado ya viene con estructura anidada de localizacion
          const sensorId = m.sensorid || m.localizacion?.sensorid;
          const sensorInfo = sensores.find(s => s.sensorid === sensorId);
          const sensorName = m.localizacion?.sensor?.sensor || 
                            sensorInfo?.sensor || 
                            sensorInfo?.nombre || 
                            `Sensor ${sensorId}`;
          
          const tipoId = m.tipoid || sensorInfo?.tipoid || m.localizacion?.sensor?.tipoid;
          const tipoInfo = tipos.find(t => t.tipoid === tipoId);
          const tipoName = tipoInfo?.tipo || 'Sensor';

          let label = '';
          if (sensorName && sensorName !== tipoName) {
            label = `${tipoName} - ${sensorName}`;
          } else if (sensorId && sensorId !== tipoId) {
            label = `${tipoName} (ID: ${sensorId})`;
          } else {
            label = tipoName;
          }
          
          return {
            medicionid: m.medicionid,
            fecha: m.fecha,
            medicion: parseFloat(m.medicion || m.valor || 0),
            metricaid: m.metricaid || m.localizacion?.metricaid,
            metrica_nombre: m.metrica_nombre || m.metrica || `Métrica ${m.metricaid}`,
            sensorid: sensorId,
            tipoid: tipoId,
            localizacionid: m.localizacionid || m.localizacion?.localizacionid,
            seriesLabel: label,
            localizacion: m.localizacion || {
              localizacionid: m.localizacionid,
              metricaid: m.metricaid,
              sensorid: sensorId,
              sensor: {
                sensorid: sensorId,
                sensor: sensorName,
                tipoid: tipoId,
                tipo: {
                  tipoid: tipoId,
                  tipo: tipoName
                }
              },
              metrica: {
                metricaid: m.metricaid,
                metrica: m.metrica_nombre || m.metrica || `Métrica ${m.metricaid}`,
                unidad: m.unidad
              }
            }
          };
        });

        setMediciones(medicionesTransformadas);
      } catch (err: any) {
        console.error('[NodeStatusDashboard] Error cargando mediciones:', err);
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
  }, [selectedNode, dateRange, sensores, tipos, showError]);

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
        // Ahora m.metrica_nombre está disponible en el objeto transformado
        const metricName = m.metrica_nombre || `Métrica ${metricId}`;
        map[metricId] = metricName.trim();
      }
    });
    return map;
  }, [mediciones]);

  // Lista de métricas disponibles para los botones de selección
  const availableMetrics = useMemo(() => {
    return Object.keys(statistics).map(id => ({
      id: parseInt(id),
      name: metricNamesMap[parseInt(id)] || `Métrica ${id}`
    })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [statistics, metricNamesMap]);

  // Preparar datos para los minigráficos de todas las métricas
  const allSparklineData = useMemo(() => {
    if (!selectedNode || mediciones.length === 0) return {};


    const sparklines: { [metricId: number]: any[] } = {};

    // Agrupar mediciones por métrica
    const medicionesPorMetrica: { [metricId: number]: any[] } = {};
    mediciones.forEach((m: any) => {
      const metricId = m.metricaid || m.localizacion?.metricaid || 0;
      if (!medicionesPorMetrica[metricId]) medicionesPorMetrica[metricId] = [];
      medicionesPorMetrica[metricId].push(m);
    });

    // Para cada métrica, preparar sus datos agrupados por sensor
    Object.entries(medicionesPorMetrica).forEach(([metricIdStr, metricMediciones]) => {
      const metricId = parseInt(metricIdStr);
      const grouped: { [dateKey: string]: any } = {};

      const start = new Date(dateRange.start).getTime();
      const end = new Date(dateRange.end).getTime();
      const spanDays = (end - start) / (1000 * 3600 * 24);

      metricMediciones.forEach((m: any) => {
        const date = new Date(m.fecha);
        let fechaKey: string;
        
        if (spanDays >= 2) {
          // Resolución diaria
          fechaKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          // Redondear a intervalos de 30 minutos para alinear series en minigráficos
          const roundedMin = Math.floor(date.getMinutes() / 30) * 30;
          const fechaObj = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), roundedMin);
          fechaKey = fechaObj.toISOString();
        }
        
        const label = getSeriesLabel(m);
        
        if (!grouped[fechaKey]) {
          grouped[fechaKey] = { fechaKey, fechaOriginal: new Date(date.getFullYear(), date.getMonth(), date.getDate(), spanDays >= 2 ? 0 : date.getHours(), spanDays >= 2 ? 0 : Math.floor(date.getMinutes() / 30) * 30) };
        }
        
        const valor = m.medicion || m.valor;
        if (valor != null && !isNaN(valor)) {
          // Si ya existe un valor para este sensor en este intervalo, promediar
          if (grouped[fechaKey][label] !== undefined) {
            grouped[fechaKey][label] = (grouped[fechaKey][label] + parseFloat(valor)) / 2;
          } else {
            grouped[fechaKey][label] = parseFloat(valor);
          }
        }
      });

      sparklines[metricId] = Object.values(grouped)
        .sort((a: any, b: any) => a.fechaOriginal.getTime() - b.fechaOriginal.getTime());
      
    });

    return sparklines;
  }, [mediciones, selectedNode, dateRange]);

  // Datos para gráfico de evolución (todas las métricas, no solo la seleccionada)
  const allMetricsChartData = useMemo(() => {
    if (!selectedNode || mediciones.length === 0) return [];

    // Mostrar TODAS las mediciones
    const filteredMediciones = mediciones;

    if (filteredMediciones.length === 0) {
      return [];
    }

    // 2. Determinar granularidad basada en el rango de fechas
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();
    const timeSpan = end - start;
    const spanHours = timeSpan / (1000 * 60 * 60);
    const spanDays = spanHours / 24;

    let useDays = spanDays >= 2;
    let useHours = !useDays && spanHours >= 48;

    // 3. Obtener TODAS las localizacionesID únicas en los datos filtrados
    const localizacionesEnDatos = Array.from(
      new Set(filteredMediciones.map((m: any) => m.localizacionid || m.localizacion?.localizacionid).filter((id: any) => id != null))
    ) as (string | number)[];

    // 4. Agrupar datos por localizacionid y tiempo
    const grouped: { [locid: string]: any[] } = {};
    (localizacionesEnDatos as (string | number)[]).forEach((id: string | number) => { grouped[String(id)] = []; });

    filteredMediciones.forEach((m: any) => {
      const locid = String(m.localizacionid || m.localizacion?.localizacionid);
      const date = new Date(m.fecha);
      
      let timeKey: string;
      if (useDays) {
        timeKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (useHours) {
        timeKey = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        // Usar 30 minutos para intervalos pequeños
        const roundedMin = Math.floor(date.getMinutes() / 30) * 30;
        timeKey = `${String(date.getHours()).padStart(2, '0')}:${String(roundedMin).padStart(2, '0')}`;
      }

      const label = m.seriesLabel || getSeriesLabel(m);
      const existing = (grouped[locid] || []).find((p: any) => p.time === timeKey);
      
      const valor = m.medicion || m.valor;
      if (valor != null && !isNaN(valor)) {
        if (existing) {
          existing.value = (existing.value * existing.count + parseFloat(valor)) / (existing.count + 1);
          existing.count += 1;
        } else {
          grouped[locid].push({ 
            timestamp: date.getTime(), 
            time: timeKey, 
            value: parseFloat(valor), 
            count: 1, 
            label 
          });
        }
      }
    });

    // 5. Colectar todos los timestamps únicos
    const allTimestamps = new Set<number>();
    Object.values(grouped).forEach((list: any) => 
      list.forEach((p: any) => {
        const date = new Date(p.timestamp);
        let ts: number;
        if (useDays) ts = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        else if (useHours) ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
        else ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / 30) * 30).getTime();
        allTimestamps.add(ts);
      })
    );

    // 6. Formatear para Recharts
    const sortedTimes = Array.from(allTimestamps).sort((a, b) => a - b).map((ts: number) => {
      const date = new Date(ts);
      if (useDays) return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (useHours) return `${String(date.getHours()).padStart(2, '0')}:00`;
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    });

    const finalData = sortedTimes.map((time: string) => {
      const entry: any = { fecha: time };
      let hasValue = false;
      
      (localizacionesEnDatos as (string | number)[]).forEach((id: string | number) => {
        const point = (grouped[String(id)] || []).find((p: any) => p.time === time);
        if (point && point.value !== null) {
          entry[point.label] = point.value;
          hasValue = true;
        }
      });
      
      return hasValue ? entry : null;
    }).filter((e: any) => e !== null);

    return finalData;
  }, [mediciones, selectedNode, dateRange]);

  // Datos para gráfico de evolución - filtra por métrica seleccionada si existe
  const sensorChartData = useMemo(() => {
    if (!selectedNode || mediciones.length === 0) return [];

    // Si NO hay métrica seleccionada, mostrar TODAS las mediciones
    // Si hay métrica seleccionada, mostrar solo esa métrica
    const filteredMediciones = selectedMetricId
      ? mediciones.filter(m => (m.metricaid || m.localizacion?.metricaid || 0) === selectedMetricId)
      : mediciones;

    if (filteredMediciones.length === 0) {
      return [];
    }

    // Determinar granularidad basada en el rango de fechas
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();
    const timeSpan = end - start;
    const spanHours = timeSpan / (1000 * 60 * 60);
    const spanDays = spanHours / 24;

    // Lógica mejorada de granularidad:
    // - 2+ días: usar días
    // - 1-2 días: usar horas
    // - < 1 día: usar 30 minutos (en lugar de 15)
    let useDays = spanDays >= 2;
    let useHours = !useDays && spanHours >= 1;
    let use30Min = !useDays && !useHours;

    // Obtener TODAS las localizacionesID únicas en los datos filtrados
    const localizacionesEnDatos = Array.from(
      new Set(filteredMediciones.map((m: any) => m.localizacionid || m.localizacion?.localizacionid).filter((id: any) => id != null))
    ) as (string | number)[];

    // Agrupar datos por localizacionid y tiempo
    const grouped: { [locid: string]: any[] } = {};
    (localizacionesEnDatos as (string | number)[]).forEach((id: string | number) => { grouped[String(id)] = []; });

    filteredMediciones.forEach((m: any) => {
      const locid = String(m.localizacionid || m.localizacion?.localizacionid);
      const date = new Date(m.fecha);
      
      let timeKey: string;
      if (useDays) {
        timeKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (useHours) {
        timeKey = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        // Usar 30 minutos para intervalos pequeños
        const roundedMin = Math.floor(date.getMinutes() / 30) * 30;
        timeKey = `${String(date.getHours()).padStart(2, '0')}:${String(roundedMin).padStart(2, '0')}`;
      }

      const label = m.seriesLabel || getSeriesLabel(m);
      const existing = (grouped[locid] || []).find((p: any) => p.time === timeKey);
      
      const valor = m.medicion || m.valor;
      if (valor != null && !isNaN(valor)) {
        if (existing) {
          existing.value = (existing.value * existing.count + parseFloat(valor)) / (existing.count + 1);
          existing.count += 1;
        } else {
          grouped[locid].push({ 
            timestamp: date.getTime(), 
            time: timeKey, 
            value: parseFloat(valor), 
            count: 1, 
            label 
          });
        }
      }
    });

    // Colectar todos los timestamps únicos
    const allTimestamps = new Set<number>();
    Object.values(grouped).forEach((list: any) => 
      list.forEach((p: any) => {
        const date = new Date(p.timestamp);
        let ts: number;
        if (useDays) ts = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        else if (useHours) ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
        else ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / 30) * 30).getTime();
        allTimestamps.add(ts);
      })
    );

    // Formatear para Recharts
    const sortedTimes = Array.from(allTimestamps).sort((a, b) => a - b).map((ts: number) => {
      const date = new Date(ts);
      if (useDays) return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (useHours) return `${String(date.getHours()).padStart(2, '0')}:00`;
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    });

    const finalData = sortedTimes.map((time: string) => {
      const entry: any = { fecha: time };
      let hasValue = false;
      
      (localizacionesEnDatos as (string | number)[]).forEach((id: string | number) => {
        const point = (grouped[String(id)] || []).find((p: any) => p.time === time);
        if (point && point.value !== null) {
          entry[point.label] = point.value;
          hasValue = true;
        }
      });
      
      return hasValue ? entry : null;
    }).filter((e: any) => e !== null);

    return finalData;
  }, [mediciones, selectedNode, selectedMetricId, dateRange]);

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
  const boxplotDataAll = useMemo(() => {
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
      
      // Obtener nombre de métrica usando el mapa pre-calculado
      const metricName = metricNamesMap[metricId] || `Métrica ${metricId}`;
      
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

  // Filtrar boxplotData según la métrica seleccionada
  const boxplotData = useMemo(() => {
    if (selectedBoxplotMetricId === null) {
      return boxplotDataAll;
    }
    return boxplotDataAll.filter(item => item.metricId === selectedBoxplotMetricId);
  }, [boxplotDataAll, selectedBoxplotMetricId]);

  // Obtener métricas disponibles para el boxplot
  const availableBoxplotMetrics = useMemo(() => {
    return boxplotDataAll.map(item => ({
      id: item.metricId,
      name: item.metrica
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [boxplotDataAll]);

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
          
          <div className="flex items-center justify-center gap-4 flex-nowrap overflow-x-auto dashboard-scrollbar-blue w-full">
            {/* Selector de Ubicación */}
            <div className="flex flex-col items-center flex-shrink-0" ref={ubicacionDropdownRef}>
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

            {/* Selector de Localización */}
            <div className="flex flex-col items-center flex-shrink-0" ref={nodoDropdownRef}>
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Localización:
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsNodoDropdownOpen(!isNodoDropdownOpen)}
                  className="h-8 min-w-[120px] px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs flex items-center justify-between"
                >
                  <span className={selectedNode?.localizacion ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                    {selectedNode?.localizacion || 'Selecciona Localización'}
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
                      {filteredLocalizacionesBySearch.length > 0 ? (
                        filteredLocalizacionesBySearch.map((localizacion: string) => {
                          // Obtener el primer nodo que tiene esta localización para poder seleccionarlo
                          const nodoConLocalizacion = filteredNodes.find((n: any) => n.localizacion === localizacion);
                          return (
                            <button
                              key={localizacion}
                              onClick={() => {
                                if (nodoConLocalizacion) {
                                  setSelectedNode(nodoConLocalizacion);
                                  // Establecer automáticamente la ubicación del nodo seleccionado
                                  if (nodoConLocalizacion.ubicacionid) {
                                    const ubicacionCorrespondiente = ubicaciones.find((u: any) => u.ubicacionid === nodoConLocalizacion.ubicacionid);
                                    if (ubicacionCorrespondiente) {
                                      setSelectedUbicacion(ubicacionCorrespondiente);
                                    }
                                  }
                                }
                                setIsNodoDropdownOpen(false);
                                setNodoSearchTerm('');
                              }}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                                selectedNode?.localizacion === localizacion
                                  ? 'bg-blue-500 text-white'
                                  : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              {localizacion}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 font-mono">
                          {selectedUbicacion ? 'No se encontraron localizaciones en esta ubicación' : 'No se encontraron localizaciones'}
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
            <div className="flex flex-col items-center flex-shrink-0">
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
            <div className="flex flex-col items-center flex-shrink-0">
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Intervalo de Fechas:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <input
                    type="date"
                    value={pendingDateRange.start}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const endDate = new Date(pendingDateRange.end);
                      const startDate = new Date(newStart);
                      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                      
                      if (daysDiff > 90) {
                        showError('Límite excedido', 'El intervalo máximo permitido es 90 días');
                        const adjustedStart = new Date(endDate);
                        adjustedStart.setDate(adjustedStart.getDate() - 90);
                        setPendingDateRange({ start: adjustedStart.toISOString().split('T')[0], end: pendingDateRange.end });
                      } else {
                        setPendingDateRange({ ...pendingDateRange, start: newStart });
                      }
                    }}
                    max={pendingDateRange.end}
                    min={(() => {
                      if (!pendingDateRange.end) return undefined;
                      const endDate = new Date(pendingDateRange.end);
                      endDate.setDate(endDate.getDate() - 90);
                      return endDate.toISOString().split('T')[0];
                    })()}
                    disabled={!selectedNode}
                    className="h-8 w-36 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      colorScheme: 'dark',
                      WebkitAppearance: 'none'
                    }}
                  />
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">Inicio</span>
                </div>
                <div className="flex flex-col items-center">
                  <input
                    type="date"
                    value={pendingDateRange.end}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const startDate = new Date(pendingDateRange.start);
                      const endDate = new Date(newEnd);
                      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                      
                      if (daysDiff > 90) {
                        showError('Límite excedido', 'El intervalo máximo permitido es 90 días');
                        const adjustedEnd = new Date(startDate);
                        adjustedEnd.setDate(adjustedEnd.getDate() + 90);
                        setPendingDateRange({ start: pendingDateRange.start, end: adjustedEnd.toISOString().split('T')[0] });
                      } else {
                        setPendingDateRange({ ...pendingDateRange, end: newEnd });
                      }
                    }}
                    min={pendingDateRange.start || undefined}
                    max={(() => {
                      if (!pendingDateRange.start) return undefined;
                      const startDate = new Date(pendingDateRange.start);
                      startDate.setDate(startDate.getDate() + 90);
                      return startDate.toISOString().split('T')[0];
                    })()}
                    disabled={!selectedNode}
                    className="h-8 w-36 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      colorScheme: 'dark',
                      WebkitAppearance: 'none'
                    }}
                  />
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">Fin</span>
                </div>
              </div>
            </div>

            {/* Botón Aplicar - aparece cuando hay cambios en las fechas */}
            {selectedNode && (pendingDateRange.start !== dateRange.start || pendingDateRange.end !== dateRange.end) && (
              <div className="flex flex-col items-center flex-shrink-0">
                <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap invisible">Aplicar:</label>
                <button
                  onClick={() => {
                    // Validar fechas antes de aplicar
                    if (pendingDateRange.start && pendingDateRange.end && new Date(pendingDateRange.start) > new Date(pendingDateRange.end)) {
                      showError(
                        'Fecha inválida',
                        'La fecha inicial no puede ser mayor que la fecha final. Por favor, seleccione fechas válidas.'
                      );
                      return;
                    }

                    // Validar rango máximo de 90 días
                    const startDate = new Date(pendingDateRange.start);
                    const endDate = new Date(pendingDateRange.end);
                    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                    
                    if (daysDiff > 90) {
                      showError('Límite excedido', 'El intervalo máximo permitido es 90 días');
                      return;
                    }

                    // Aplicar cambios
                    flushSync(() => {
                      setDateRange(pendingDateRange);
                    });
                  }}
                  disabled={loading}
                  className="h-8 px-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-xs transition-colors whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>
            )}

            {/* Separador visual */}
            <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

            {/* Información del Nodo - Siempre visible pero sin info hasta seleccionar nodo */}
            <div className="flex flex-col items-center flex-shrink-0">
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

        {/* Mensaje cuando no hay nodo seleccionado - Use el botón "Nodo en Mapa" */}
        {!selectedNode && !loading && (
          <div className="flex items-center justify-center py-12 text-gray-500 dark:text-neutral-400">
            <p>Seleccione un nodo usando el botón "Nodo en Mapa"</p>
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
            {mediciones.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <h2 className="text-xl font-bold text-blue-500 font-mono uppercase tracking-wider">Evolución de Mediciones</h2>
                    
                    {/* Selector de Métricas (Tabs) */}
                    <div className="flex flex-wrap gap-2">
                      {availableMetrics.map(metric => (
                        <button
                          key={metric.id}
                          onClick={() => setSelectedMetricId(metric.id)}
                          className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                            selectedMetricId === metric.id
                              ? 'bg-blue-500 text-white shadow-md transform scale-105'
                              : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-300 dark:hover:bg-neutral-600'
                          }`}
                        >
                          {metric.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .recharts-tooltip-wrapper,
                      .recharts-legend-wrapper {
                        font-family: 'JetBrains Mono', monospace !important;
                      }
                    `
                  }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sensorChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                      <XAxis 
                        dataKey="fecha" 
                        tick={{ fontSize: 10, fill: '#888' }}
                        tickLine={{ stroke: '#888' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#888' }}
                        tickLine={{ stroke: '#888' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                        itemStyle={{ padding: '2px 0' }}
                        formatter={(value: any) => {
                          if (typeof value === 'number') {
                            return value.toFixed(2);
                          }
                          return value;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      />
                      {(() => {
                        if (sensorChartData.length === 0) return null;
                        
                        // Obtener TODAS las claves únicas de series de todo el set de datos
                        const allSeriesKeys = Array.from(
                          new Set(
                            sensorChartData.flatMap(item => 
                              Object.keys(item).filter(key => key !== 'fecha' && key !== 'fechaOriginal')
                            )
                          )
                        ).sort();

                        return allSeriesKeys.map((label, index) => (
                          <Line
                            key={label}
                            type="monotone"
                            dataKey={label}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                            name={label}
                            connectNulls={true}
                          />
                        ));
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Estadísticas por Métrica */}
                {Object.keys(statistics).length > 0 && (
                  <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-blue-500 font-mono mb-4 uppercase tracking-wider">Estadísticas por Métrica</h2>
                    <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-2 dashboard-scrollbar-blue">
                      {Object.entries(statistics).map(([metricIdStr, stats]) => {
                        const metricId = parseInt(metricIdStr);
                        const metricName = metricNamesMap[metricId] || `Métrica ${metricId}`;
                        
                        // Datos para el minigráfico (sparkline)
                        const sparklineData = allSparklineData[metricId] || [];

                        return (
                          <div key={metricId} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-neutral-750 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-gray-900 dark:text-white text-sm font-mono uppercase tracking-tight">{metricName}</h3>
                              <div className="text-right">
                                <span className="text-xs font-mono font-bold text-blue-500">{stats.ultimaMedicion}</span>
                                <p className="text-[10px] text-gray-400 font-mono">{new Date(stats.ultimaFecha).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-4 items-center">
                              {/* Minigráfico (Sparkline) */}
                              <div className="w-1/3 h-12">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={sparklineData}>
                                    {(() => {
                                      const seriesKeys = Array.from(
                                        new Set(
                                          sparklineData.flatMap(item => 
                                            Object.keys(item).filter(k => k !== 'fechaKey' && k !== 'fechaOriginal')
                                          )
                                        )
                                      ).sort();

                                      return seriesKeys.map((key, idx) => (
                                        <Line 
                                          key={key}
                                          type="monotone" 
                                          dataKey={key} 
                                          stroke={COLORS[idx % COLORS.length]} 
                                          strokeWidth={1.5} 
                                          dot={false} 
                                          isAnimationActive={false}
                                          connectNulls={true}
                                        />
                                      ));
                                    })()}
                                    <YAxis hide domain={['auto', 'auto']} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>

                              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                                <div className="flex justify-between border-b border-gray-100 dark:border-neutral-700 pb-0.5">
                                  <span className="text-gray-500 uppercase">Prom:</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{stats.promedio}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-neutral-700 pb-0.5">
                                  <span className="text-gray-500 uppercase">Mín:</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{stats.minimo}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-neutral-700 pb-0.5">
                                  <span className="text-gray-500 uppercase">Máx:</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{stats.maximo}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-neutral-700 pb-0.5">
                                  <span className="text-gray-500 uppercase">Desv:</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{stats.desviacion}</span>
                                </div>
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
                      <Tooltip 
                        formatter={(value: any) => {
                          if (typeof value === 'number') {
                            return value.toFixed(2);
                          }
                          return value;
                        }}
                      />
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                      <h2 className="text-xl font-bold text-blue-500 font-mono uppercase tracking-wider">Distribución vs Umbral Estándar</h2>
                      
                      {/* Selector de Métricas (Tabs) para Boxplot */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedBoxplotMetricId(null)}
                          className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                            selectedBoxplotMetricId === null
                              ? 'bg-blue-500 text-white shadow-md transform scale-105'
                              : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-300 dark:hover:bg-neutral-600'
                          }`}
                        >
                          Todas
                        </button>
                        {availableBoxplotMetrics.map(metric => (
                          <button
                            key={metric.id}
                            onClick={() => setSelectedBoxplotMetricId(metric.id)}
                            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                              selectedBoxplotMetricId === metric.id
                                ? 'bg-blue-500 text-white shadow-md transform scale-105'
                                : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-300 dark:hover:bg-neutral-600'
                            }`}
                          >
                            {metric.name}
                          </button>
                        ))}
                      </div>
                    </div>
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

