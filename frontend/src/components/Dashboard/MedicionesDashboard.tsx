import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useFilters } from '../../contexts/FilterContext';
import { useFilterSync } from '../../hooks/useFilterSync';
import { filterNodesByGlobalFilters } from '../../utils/filterNodesUtils';
import { localizacionMatchesGlobalFilters as localizacionMatchesGlobalFiltersUtil } from '../../utils/filterSync';
import { Localizacion } from '../../types';
import { MedicionesAreaChart } from './components/MedicionesAreaChart';
import { InteractiveMap } from './InteractiveMap';
import { SVGPlantMap } from './SVGPlantMap';
import { useSidebar } from '../../contexts/SidebarContext';

interface MedicionesDashboardProps {}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6', '#f97316'];

// Ubicaciones con mapa SVG para PLC
// 235: Valerie Planta 01, 236: Valerie Planta 02 → mapa_valerie.svg
// 239: Zoe Planta 02 → mapa_zoe_uvas.svg
// 237, 238 no tienen SVG aún
const SVG_UBICACIONES = [235, 236, 239]

export function MedicionesDashboard(_props: MedicionesDashboardProps) {
  const { t } = useLanguage();
  const { showError } = useToast();
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado, ubicacionSeleccionada, setUbicacionSeleccionada, localizacionSeleccionada, setShowDetailedAnalysis } = useFilters();
  const { isCollapsed, state } = useSidebar();

  // Estados principales
  const [localizaciones, setLocalizaciones] = useState<Localizacion[]>([]);
  const [allLocalizaciones, setAllLocalizaciones] = useState<Localizacion[]>([]); // Todas las localizaciones sin filtro global (para contador del dropdown)
  const [uniqueLocalizaciones, setUniqueLocalizaciones] = useState<any[]>([]);
  const [selectedLocalizacion, setSelectedLocalizacion] = useState<any | null>(null);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [fundosInfo, setFundosInfo] = useState<Map<number, any>>(new Map()); // Cache de info de fundos
  const { syncDashboardSelectionToGlobal } = useFilterSync(fundosInfo);
  const [loading, setLoading] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [availableMetrics, setAvailableMetrics] = useState<{ id: number; name: string }[]>([]);
  const [allMetricsFromInitialLoad, setAllMetricsFromInitialLoad] = useState<{ id: number; name: string }[]>([]);  // ← NUEVO: Almacenar todas las métricas de la carga inicial

  // Estados de filtro
  // Función auxiliar para formatear fechas en zona horaria local (YYYY-MM-DD)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(sevenDaysAgo),
    end: getLocalDateString(today)
  });
  const [pendingDateRange, setPendingDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(sevenDaysAgo),
    end: getLocalDateString(today)
  });
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null
  });
  const [initialYAxisDomain, setInitialYAxisDomain] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null
  });

  // Estados para comparación de métricas
  const [comparisonMetricId, setComparisonMetricId] = useState<number | null>(null);
  const [comparisonMediciones, setComparisonMediciones] = useState<any[]>([]);
  const [comparisonChartData, setComparisonChartData] = useState<any[]>([]);
  const [comparisonSeries, setComparisonSeries] = useState<string[]>([]);
  const [comparisonUnit, setComparisonUnit] = useState<string>('');
  const [comparisonYAxisDomain, setComparisonYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [initialComparisonYAxisDomain, setInitialComparisonYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [isComparisonDropdownOpen, setIsComparisonDropdownOpen] = useState(false);

  // Estados para combobox de localización con searchbar
  const [isLocalizacionDropdownOpen, setIsLocalizacionDropdownOpen] = useState(false);
  const [localizacionSearchTerm, setLocalizacionSearchTerm] = useState('');
  const localizacionDropdownRef = useRef<HTMLDivElement>(null);
  const [localizacionDropdownPosition, setLocalizacionDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Estados para el modal de mapa
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapNodes, setMapNodes] = useState<any[]>([]);
  const [loadingMapNodes, setLoadingMapNodes] = useState(false);

  // Refs para inputs de fecha (para cerrar date pickers nativos cuando el sidebar cambia)
  const fechaInicioInputRef = useRef<HTMLInputElement>(null);
  const fechaFinInputRef = useRef<HTMLInputElement>(null);

  // Ref para rastrear si acaba de hacerse una selección en el dropdown de localización
  // Evita que el useEffect de sincronización global limpie selectedLocalizacion prematuramente
  const justSelectedLocalizacionRef = useRef<boolean>(false);

  // Efecto para cerrar date pickers nativos cuando el sidebar se expande/colapsa
  useEffect(() => {
    const closeDatePickers = () => {
      if (fechaInicioInputRef.current) {
        fechaInicioInputRef.current.blur();
      }
      if (fechaFinInputRef.current) {
        fechaFinInputRef.current.blur();
      }
    };

    // Cerrar date pickers cuando el sidebar cambia
    closeDatePickers();
  }, [isCollapsed, state]);

  // Resetear el estado de análisis detallado cuando el dashboard se monta
  useEffect(() => {
    setShowDetailedAnalysis(false);
  }, [setShowDetailedAnalysis]);

  // Evitar ejecución ganda (React StrictMode en desarrollo)
  const initialDataLoaded = useRef(false);

  // Memoizar sensores y tipos para evitar que getSeriesLabel se recree innecesariamente
  const memoizedSensores = useMemo(() => sensores, [sensores]);
  const memoizedTipos = useMemo(() => tipos, [tipos]);

  const localizacionTipoidMap = useMemo(() => {
    const map = new Map<number, number>();
    memoizedSensores.forEach((sensor: any) => {
      localizaciones.forEach((loc: any) => {
        if (loc.sensorid === sensor.sensorid) {
          map.set(loc.localizacionid, sensor.tipoid);
        }
      });
    });
    return map;
  }, [localizaciones, memoizedSensores]);

  // Función helper para filtrar datos según el tipo de sensor
  // LoRa (tipoid 1,2): NO filtrar por localizacionid - mostrar métricas de todo el nodo
  // PLC (tipoid 3,4): SÍ filtrar por localizacionid - mostrar solo métricas de esa localización
  const filterByTipoSensor = useCallback((data: any[], selectedLocalizacion: any): { data: any[]; isLora: boolean } => {
    if (!data || data.length === 0) {
      return { data: [], isLora: true };
    }
    
    const tiposPresentes = new Set<number>();
    data.forEach((m: any) => {
      const tipoid = m.tipoid || m.localizacion?.sensor?.tipoid;
      if (tipoid) tiposPresentes.add(Number(tipoid));
    });
    
    const hasLora = Array.from(tiposPresentes).some(t => [1, 2].includes(t));
    const hasPlc = Array.from(tiposPresentes).some(t => [3, 4].includes(t));
    
    if (hasLora && !hasPlc) {
      return { data, isLora: true };
    } else if (hasPlc && !hasLora) {
      const filtered = data.filter((m: any) => m.localizacionid === selectedLocalizacion.localizacionid);
      return { 
        data: filtered,
        isLora: false 
      };
    } else if (hasLora && hasPlc) {
      return { data, isLora: true };
    }
    
    const filtered = data.filter((m: any) => m.localizacionid === selectedLocalizacion.localizacionid);
    return { 
      data: filtered,
      isLora: false 
    };
  }, []);

  // Cargar localizaciones, sensores, tipos y fundos con su información de empresa/país.
  // CRÍTICO: Usar el mismo endpoint que MAPEO DE NODOS (nodos-con-localizacion) con filtros,
  // para que al filtrar por fundo/empresa/país se traigan todas las localizaciones con paginación
  // correcta. getLocalizaciones() tiene límite ~1000 filas y al filtrar por fundo ZOE no aparecían.
  useEffect(() => {
    if (initialDataLoaded.current) return;
    initialDataLoaded.current = true;

    const loadInitialData = async () => {
      setIsLoadingInitialData(true);
      try {
        const filters =
          fundoSeleccionado != null && fundoSeleccionado !== ''
            ? { fundoId: fundoSeleccionado }
            : empresaSeleccionada != null && empresaSeleccionada !== ''
              ? { empresaId: empresaSeleccionada }
              : paisSeleccionado != null && paisSeleccionado !== ''
                ? { paisId: paisSeleccionado }
                : undefined;
        const localizacionesData = await JoySenseService.getLocalizacionesParaMediciones(1000, filters);
        const allLocalizacionesData = await JoySenseService.getLocalizacionesParaMediciones(2000, undefined); // Sin filtro global para contador

        const [sensoresData, tiposData, fundosData, empresasData] = await Promise.all([
          JoySenseService.getSensores(),
          JoySenseService.getTipos(),
          JoySenseService.getFundos(),
          JoySenseService.getEmpresas()
        ]);

        setLocalizaciones(localizacionesData || []);
        setAllLocalizaciones(allLocalizacionesData || []);
        setSensores(sensoresData || []);
        setTipos(tiposData || []);
        
        // Crear un mapa de empresaid → empresa para enriquecer los fundos
        const empresasMap = new Map();
        (empresasData || []).forEach((empresa: any) => {
          empresasMap.set(empresa.empresaid, empresa);
        });
        
        // Crear un mapa de fundoid → fundo (enriquecido con empresa y paisid)
        const fundosMap = new Map();
        (fundosData || []).forEach((fundo: any) => {
          const empresa = empresasMap.get(fundo.empresaid);
          fundosMap.set(fundo.fundoid, {
            ...fundo,
            empresa: empresa, // Agregar empresa completa si existe
            paisid: empresa?.paisid // Agregar paisid directamente para acceso rápido
          });
        });
        setFundosInfo(fundosMap);
        
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
        showError('Error', 'No se pudieron cargar los datos');
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [showError, paisSeleccionado, empresaSeleccionada, fundoSeleccionado]);

  // Función para cargar nodos con GPS para el modal de mapa
  const loadMapNodes = async () => {
    if (mapNodes.length > 0) return; // Ya están cargados
    
    setLoadingMapNodes(true);
    try {
      const filters =
        fundoSeleccionado != null && fundoSeleccionado !== ''
          ? { fundoId: fundoSeleccionado }
          : empresaSeleccionada != null && empresaSeleccionada !== ''
            ? { empresaId: empresaSeleccionada }
            : paisSeleccionado != null && paisSeleccionado !== ''
              ? { paisId: paisSeleccionado }
              : undefined;
      
      const nodesData = await JoySenseService.getNodosConLocalizacion(1000, filters);
      setMapNodes(nodesData || []);
    } catch (err) {
      console.error('Error cargando nodos para el mapa:', err);
      showError('Error', 'No se pudieron cargar los nodos para el mapa');
    } finally {
      setLoadingMapNodes(false);
    }
  };

  // Función auxiliar para verificar si una localización cumple con los filtros globales (centralizada en filterSync)
  // Memoizar correctamente para evitar recreación innecesaria
  const memoizedFundosInfo = useMemo(() => fundosInfo, [fundosInfo]);
  const localizacionMatchesGlobalFilters = useCallback(
    (loc: any): boolean =>
      localizacionMatchesGlobalFiltersUtil(
        loc,
        { paisSeleccionado, empresaSeleccionada, fundoSeleccionado, ubicacionSeleccionada },
        memoizedFundosInfo
      ),
    [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, ubicacionSeleccionada, memoizedFundosInfo]
  );

  // Agrupar localizaciones por nombre + nodoid (clave compuesta)
  // Esto permite mantener múltiples nodos bajo la misma localización
  useEffect(() => {
    const localizacionesMap = new Map<string, any>();
    
    localizaciones.forEach((loc: Localizacion) => {
      if (loc.localizacion && loc.nodoid) {
        const key = `${loc.localizacion}__${loc.nodoid}`;
        if (!localizacionesMap.has(key)) {
          const tipoid = localizacionTipoidMap.get(loc.localizacionid);
          localizacionesMap.set(key, {
            localizacionid: loc.localizacionid,
            localizacion: loc.localizacion,
            nodoid: loc.nodoid,
            latitud: loc.latitud,
            longitud: loc.longitud,
            nodo: loc.nodo,
            tipoid: tipoid
          });
        }
      }
    });
    
    setUniqueLocalizaciones(Array.from(localizacionesMap.values()));
  }, [localizaciones, localizacionTipoidMap]);

  // Agrupar TODAS las localizaciones sin filtro global (para contador del dropdown)
  const allUniqueLocalizaciones = useMemo(() => {
    const localizacionesMap = new Map<string, any>();
    
    allLocalizaciones.forEach((loc: Localizacion) => {
      if (loc.localizacion && loc.nodoid) {
        const key = `${loc.localizacion}__${loc.nodoid}`;
        if (!localizacionesMap.has(key)) {
          const tipoid = localizacionTipoidMap.get(loc.localizacionid);
          localizacionesMap.set(key, {
            localizacionid: loc.localizacionid,
            localizacion: loc.localizacion,
            nodoid: loc.nodoid,
            latitud: loc.latitud,
            longitud: loc.longitud,
            nodo: loc.nodo,
            tipoid: tipoid
          });
        }
      }
    });
    
    return Array.from(localizacionesMap.values());
  }, [allLocalizaciones, localizacionTipoidMap]);

  // Validar y limpiar la localización seleccionada cuando cambian los filtros globales
  // OPTIMIZACIÓN: Solo ejecutar cuando cambien los filtros reales, no cuando cambie selectedLocalizacion
  useEffect(() => {
    console.log('[useEffect global filters] 🔵 Ejecutándose', {
      selectedLocalizacion: selectedLocalizacion?.localizacionid,
      pais: paisSeleccionado,
      empresa: empresaSeleccionada,
      fundo: fundoSeleccionado,
      ubicacion: ubicacionSeleccionada
    });
    
    if (selectedLocalizacion && !localizacionMatchesGlobalFilters(selectedLocalizacion)) {
      console.log('[useEffect global filters] ❌ NO coincide con filtros globales - Limpiando');
      setSelectedLocalizacion(null);
      setMediciones([]);
      setAvailableMetrics([]);
      setSelectedMetricId(null);
      setComparisonMetricId(null);
      setComparisonMediciones([]);
      setComparisonChartData([]);
      setComparisonSeries([]);
    }
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, ubicacionSeleccionada]);

  // Sincronizar la localización desde el contexto global
  // Permite que cuando se selecciona un nodo en otro dashboard (MAPEO DE NODOS, STATUS DE NODOS),
  // al regresar a MEDICIONES ya esté pre-seleccionada la localización
  useEffect(() => {
    console.log('[useEffect sync] 🔵 Ejecutándose', {
      localizacionSeleccionada: localizacionSeleccionada?.localizacionid,
      selectedLocalizacion: selectedLocalizacion?.localizacionid,
      justSelectedRef: justSelectedLocalizacionRef.current
    });
    
    if (localizacionSeleccionada) {
      if (!selectedLocalizacion || selectedLocalizacion.nodoid !== localizacionSeleccionada.nodoid) {
        console.log('[useEffect sync] ✅ Sincronizando selectedLocalizacion:', localizacionSeleccionada.localizacionid);
        setSelectedLocalizacion(localizacionSeleccionada);
      } else {
        console.log('[useEffect sync] ⚠️ NO se sincroniza - nodoid igual:', selectedLocalizacion?.nodoid);
      }
    } else if (selectedLocalizacion && !localizacionSeleccionada) {
      // Solo limpiar selectedLocalizacion si no acabamos de hacer una selección en el dropdown
      if (!justSelectedLocalizacionRef.current) {
        console.log('[useEffect sync] ❌ Limpiando selectedLocalizacion (no había justSelectedRef)');
        setSelectedLocalizacion(null);
      } else {
        console.log('[useEffect sync] ⚠️ NO se limpia - justSelectedRef era true');
      }
    }
    
    // Resetear la flag después de procesar
    if (justSelectedLocalizacionRef.current) {
      justSelectedLocalizacionRef.current = false;
    }
  }, [localizacionSeleccionada]);

  // Validar rango máximo de 90 días
  const validateDateRange = useCallback((start: string, end: string): { start: string; end: string } | null => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff > 90) {
      showError('Límite excedido', 'El intervalo máximo permitido es 90 días. Se ajustará automáticamente.');
      // Ajustar automáticamente: mantener endDate, ajustar startDate
      const newStartDate = new Date(end);
      newStartDate.setDate(newStartDate.getDate() - 90);
      const year = newStartDate.getFullYear();
      const month = String(newStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(newStartDate.getDate()).padStart(2, '0');
      return {
        start: `${year}-${month}-${day}`,
        end: end
      };
    }
    return null;
  }, [showError]);

  // Cargar métricas disponibles cuando cambia localización o rango de fechas
  // Este efecto SOLO detecta qué métricas hay disponibles, sin mostrar loading
  useEffect(() => {
    console.log('[useEffect metrics] 🔵 Ejecutándose - selectedLocalizacion:', selectedLocalizacion?.localizacionid, 'selectedMetricId:', selectedMetricId);
    
    if (!selectedLocalizacion?.nodoid) {
      console.log('[useEffect metrics] ⚠️ No hay localizacion seleccionada');
      setAvailableMetrics([]);
      setSelectedMetricId(null);
      setMediciones([]);
      setAllMetricsFromInitialLoad([]);
      return;
    }

    // Validar rango de fechas
    const adjustedRange = validateDateRange(dateRange.start, dateRange.end);
    if (adjustedRange) {
      setDateRange(adjustedRange);
      return;
    }

    const loadMetricsAvailable = async () => {
      try {
        console.log('[loadMetricsAvailable] 🔵 Iniciando - selectedLocalizacion:', selectedLocalizacion?.localizacionid, 'selectedMetricId (antes):', selectedMetricId);
        
        const data = await SupabaseRPCService.getMedicionesNodoDetallado({
          nodoid: selectedLocalizacion.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end
        });

        const { data: filteredData, isLora } = filterByTipoSensor(data || [], selectedLocalizacion);
        const medicionesData = filteredData || [];
        
        // CRÍTICO: Detectar todas las métricas en la carga inicial y guardarlas
        const uniqueMetricIds = new Set<number>();
        medicionesData.forEach(m => {
          const metricaId = m.metricaid || m.localizacion?.metricaid;
          if (metricaId) {
            uniqueMetricIds.add(Number(metricaId));
          }
        });

        // Crear mapeo de nombre a ID basado en los datos iniciales
        const metricMap = new Map<number, string>();
        medicionesData.forEach(m => {
          const metricaId = m.metricaid || m.localizacion?.metricaid;
          
          let metricaNombre = 
            m.localizacion?.metrica?.metrica ||
            m.metrica_nombre ||
            m.metrica ||
            m.localizacion?.metrica ||
            null;

          if (metricaNombre && typeof metricaNombre === 'object' && 'metrica' in metricaNombre) {
            metricaNombre = metricaNombre.metrica;
          }

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

        // Guardar todas las métricas detectadas en la carga inicial
        const allMetricsDetected = Array.from(uniqueMetricIds)
          .sort()
          .map(id => ({
            id,
            name: metricMap.get(id) || fallbackNames[id] || `Métrica ${id}`
          }));

        setAllMetricsFromInitialLoad(allMetricsDetected);
        setAvailableMetrics(allMetricsDetected);
        
        console.log('[loadMetricsAvailable] 📊 Métricas detectadas:', allMetricsDetected, 'selectedMetricId (actual):', selectedMetricId);
        
        // Seleccionar primera métrica si no hay seleccionada
        if (allMetricsDetected.length > 0 && !selectedMetricId) {
          console.log('[loadMetricsAvailable] ✅ Seleccionando primera métrica:', allMetricsDetected[0]);
          flushSync(() => {
            setSelectedMetricId(allMetricsDetected[0].id);
          });
        } else if (allMetricsDetected.length === 0) {
          console.log('[loadMetricsAvailable] ⚠️ NO hay métricas detectadas');
        } else if (selectedMetricId) {
          console.log('[loadMetricsAvailable] ⚠️ NO se selecciona métrica - ya hay una seleccionada:', selectedMetricId);
        }
      } catch (err: any) {
        console.error('Error detectando métricas:', err);
        if (err.message && err.message.includes('90 días')) {
          showError('Error', err.message);
        }
        setAllMetricsFromInitialLoad([]);
        setAvailableMetrics([]);
        setSelectedMetricId(null);
      }
    };

    loadMetricsAvailable();
  }, [selectedLocalizacion?.localizacionid, dateRange.start, dateRange.end, showError, validateDateRange, filterByTipoSensor]);

  // Cargar datos de la métrica seleccionada
  // Se ejecuta DESPUÉS de que ya tenemos la lista de métricas disponibles
  useEffect(() => {
    if (!selectedLocalizacion?.nodoid || !selectedMetricId) {
      setMediciones([]);
      return;
    }

    // Validar rango de fechas
    const adjustedRange = validateDateRange(dateRange.start, dateRange.end);
    if (adjustedRange) {
      return;
    }

    const loadMedicionesMetricaSeleccionada = async () => {
      try {
        console.log('[loadMedData] 🔵 Iniciando - nodoid:', selectedLocalizacion?.nodoid, 'metricaid:', selectedMetricId);
        setLoading(true);

        const data = await SupabaseRPCService.getMedicionesNodoDetallado({
          nodoid: selectedLocalizacion.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end,
          metricaid: selectedMetricId
        });

        const { data: filteredData } = filterByTipoSensor(data || [], selectedLocalizacion);
        const medicionesData = filteredData || [];
        console.log('[loadMedData] ✅ Datos cargados:', medicionesData.length);
        setMediciones(medicionesData);
      } catch (err: any) {
        console.error('Error cargando datos de métrica seleccionada:', err);
        setMediciones([]);
      } finally {
        setLoading(false);
      }
    };

    loadMedicionesMetricaSeleccionada();
  }, [selectedLocalizacion?.localizacionid, dateRange.start, dateRange.end, selectedMetricId, validateDateRange, filterByTipoSensor]);

  // Función helper para obtener etiqueta de serie (para uso en comparación)
  const getComparisonSeriesLabel = useCallback((medicion: any) => {
    const sensorId = medicion.sensorid || medicion.localizacion?.sensorid;
    const sensorInfo = memoizedSensores.find(s => s.sensorid === sensorId);
    const sensorName = sensorInfo?.sensor || sensorInfo?.nombre || `Sensor ${sensorId}`;

    const tipoId = medicion.tipoid || sensorInfo?.tipoid || medicion.localizacion?.sensor?.tipoid;
    const tipoInfo = memoizedTipos.find(t => t.tipoid === tipoId);
    const tipoName = tipoInfo?.tipo || 'Sensor';

    if (sensorName && sensorName !== tipoName) {
      return `${tipoName} - ${sensorName}`;
    }
    return tipoName;
  }, [memoizedSensores, memoizedTipos]);

  // Cargar datos de la métrica de comparación
  useEffect(() => {
    if (!selectedLocalizacion?.nodoid || !comparisonMetricId) {
      setComparisonMediciones([]);
      setComparisonChartData([]);
      setComparisonSeries([]);
      setComparisonUnit('');
      setComparisonYAxisDomain({ min: null, max: null });
      setInitialComparisonYAxisDomain({ min: null, max: null });
      return;
    }

    const adjustedRange = validateDateRange(dateRange.start, dateRange.end);
    if (adjustedRange) {
      return;
    }

    const loadComparisonData = async () => {
      try {
        const data = await SupabaseRPCService.getMedicionesNodoDetallado({
          nodoid: selectedLocalizacion.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end,
          metricaid: comparisonMetricId
        });

        // FILTRO: Aplicar lógica según tipo de sensor (LoRa vs PLC)
        const { data: filteredData } = filterByTipoSensor(data || [], selectedLocalizacion);
        const comparisonData = filteredData || [];
        setComparisonMediciones(comparisonData);

        if (comparisonData.length > 0) {
          setComparisonUnit(
            comparisonData[0]?.unidad ||
            comparisonData[0]?.metrica_nombre?.unidad ||
            ''
          );
        }
      } catch (err: any) {
        console.error('Error cargando datos de comparación:', err);
        setComparisonMediciones([]);
      }
    };

    loadComparisonData();
  }, [selectedLocalizacion?.localizacionid, dateRange.start, dateRange.end, comparisonMetricId, validateDateRange, filterByTipoSensor]);

  // Filtrar mediciones de comparación por métrica (usar directamente los datos ya que RPC filtra por metricaid)
  const comparisonFiltradasPorMetrica = useMemo(() => {
    if (comparisonMediciones.length === 0) {
      return [];
    }
    return comparisonMediciones;
  }, [comparisonMediciones]);

  // Auto-ajustar eje Y de comparación
  useEffect(() => {
    if (comparisonFiltradasPorMetrica.length === 0) {
      setComparisonYAxisDomain({ min: null, max: null });
      setInitialComparisonYAxisDomain({ min: null, max: null });
      return;
    }

    let minValue = Infinity;
    let maxValue = -Infinity;
    let hasNegativeValues = false;

    comparisonFiltradasPorMetrica.forEach((m: any) => {
      const val = m.medicion;
      if (typeof val === 'number' && !isNaN(val)) {
        minValue = Math.min(minValue, val);
        maxValue = Math.max(maxValue, val);
        if (val < 0) {
          hasNegativeValues = true;
        }
      }
    });

    if (minValue === Infinity || maxValue === -Infinity) {
      setComparisonYAxisDomain({ min: null, max: null });
      setInitialComparisonYAxisDomain({ min: null, max: null });
      return;
    }

    const range = maxValue - minValue;
    const padding = range * 0.1;

    let calculatedMin = minValue - padding;
    if (!hasNegativeValues && calculatedMin < 0) {
      calculatedMin = 0;
    }

    const calculatedDomain = {
      min: calculatedMin,
      max: maxValue + padding
    };

    setComparisonYAxisDomain(prevDomain => {
      if (prevDomain.min === calculatedDomain.min && prevDomain.max === calculatedDomain.max) {
        return prevDomain;
      }
      return calculatedDomain;
    });

    setInitialComparisonYAxisDomain(calculatedDomain);
  }, [comparisonFiltradasPorMetrica]);

  // Preparar datos para el gráfico de comparación
  const comparisonProcessedChartData = useMemo(() => {
    if (comparisonFiltradasPorMetrica.length === 0) return [];

    const timeSpan = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const hoursSpan = daysSpan * 24;

    const performGrouping = (granularityType: 'minutes' | 'hours' | 'days', interval?: number, hourlyInterval?: number) => {
      const getTimeKey = (date: Date, granularityType: 'minutes' | 'hours' | 'days', interval?: number, hourlyInterval?: number): string => {
        if (granularityType === 'minutes') {
          const minuteInterval = interval || 15;
          const minutes = Math.floor(date.getMinutes() / minuteInterval) * minuteInterval;
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        if (granularityType === 'hours') {
          let hours = date.getHours();
          if (hourlyInterval && hourlyInterval > 1) {
            hours = Math.floor(hours / hourlyInterval) * hourlyInterval;
          }
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(hours).padStart(2, '0')}:00`;
        }
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      };

      const labelCache = new Map<number, string>();
      const getOrCacheLabel = (m: any): string => {
        const key = m.sensorid || 0;
        if (!labelCache.has(key)) {
          labelCache.set(key, getComparisonSeriesLabel(m));
        }
        return labelCache.get(key)!;
      };

      const groupedByTime = new Map<string, Map<string, { values: number[], timestamp: number }>>();

      comparisonFiltradasPorMetrica.forEach((m: any) => {
        if (m.medicion === null || m.medicion === undefined) return;

        const date = new Date(m.fecha);
        const timeKey = getTimeKey(date, granularityType, interval, hourlyInterval);
        const label = getOrCacheLabel(m);

        if (!groupedByTime.has(timeKey)) {
          groupedByTime.set(timeKey, new Map());
        }

        const timeEntry = groupedByTime.get(timeKey)!;
        if (!timeEntry.has(label)) {
          timeEntry.set(label, { values: [], timestamp: date.getTime() });
        }

        timeEntry.get(label)!.values.push(parseFloat(m.medicion));
      });

      const allLabels = new Set<string>();
      groupedByTime.forEach(timeEntry => {
        timeEntry.forEach((_, label) => allLabels.add(label));
      });
      const allLabelsArray = Array.from(allLabels).sort();

      const sortedTimes = Array.from(groupedByTime.entries())
        .sort((a, b) => {
          const aTimestamp = Math.min(...Array.from(a[1].values()).map(v => v.timestamp || 0));
          const bTimestamp = Math.min(...Array.from(b[1].values()).map(v => v.timestamp || 0));
          return aTimestamp - bTimestamp;
        })
        .map(([timeKey]) => timeKey);

      const result = sortedTimes.map(timeKey => {
        const entry: any = { fecha: timeKey };
        allLabelsArray.forEach(label => {
          entry[label] = undefined;
        });

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

    let granularityType: 'minutes' | 'hours' | 'days' = 'hours';
    let minuteInterval = 30;
    let hourlyInterval: number | undefined = undefined;

    if (daysSpan <= 1) {
      granularityType = 'minutes';
      minuteInterval = 15;
    } else if (daysSpan <= 7) {
      granularityType = 'hours';
      hourlyInterval = 1;
    } else if (daysSpan <= 21) {
      granularityType = 'hours';
      hourlyInterval = 2;
    } else if (daysSpan <= 28) {
      granularityType = 'hours';
      hourlyInterval = 4;
    } else if (daysSpan <= 60) {
      granularityType = 'hours';
      hourlyInterval = 4;
    } else {
      granularityType = 'hours';
      hourlyInterval = 6;
    }

    let { result, allLabelsArray, pointCount } = performGrouping(granularityType, minuteInterval, hourlyInterval);

    const totalMediciones = comparisonFiltradasPorMetrica.length;
    if (pointCount <= 2 && totalMediciones >= 3) {
      if (granularityType === 'hours') {
        ({ result, allLabelsArray, pointCount } = performGrouping('hours', undefined, 1));
      }
      if (pointCount <= 2) {
        ({ result, allLabelsArray, pointCount } = performGrouping('minutes', 15, undefined));
      }
    }

    return result;
  }, [comparisonFiltradasPorMetrica, dateRange.start, dateRange.end, memoizedSensores, memoizedTipos]);

  // Obtener todas las series de comparación
  const comparisonAllSeries = useMemo(() => {
    const seriesSet = new Set<string>();

    comparisonFiltradasPorMetrica.forEach((m: any) => {
      if (m.medicion !== null && m.medicion !== undefined) {
        const label = getComparisonSeriesLabel(m);
        seriesSet.add(label);
      }
    });

    comparisonProcessedChartData.forEach((item: any) => {
      Object.keys(item).forEach(key => {
        if (key !== 'fecha' && typeof item[key] === 'number') {
          seriesSet.add(key);
        }
      });
    });

    return Array.from(seriesSet).sort();
  }, [comparisonProcessedChartData, comparisonFiltradasPorMetrica, getComparisonSeriesLabel]);

  // Actualizar estados derivados cuando los datos de comparación cambien
  useEffect(() => {
    setComparisonChartData(comparisonProcessedChartData);
    setComparisonSeries(comparisonAllSeries);
  }, [comparisonProcessedChartData, comparisonAllSeries]);

  // YA NO es necesario actualizar availableMetrics cuando cambian mediciones
  // Porque ahora usamos allMetricsFromInitialLoad que se mantiene constante
  // Este useEffect se puede remover o dejar como es (será un no-op)

  // Filtrar localizaciones por filtros globales y término de búsqueda
  const filteredNodos = useMemo(() => {
    // Primero filtrar por filtros globales
    const globalFiltered = uniqueLocalizaciones.filter((loc: any) => {
      return localizacionMatchesGlobalFilters(loc);
    });
    
    // Luego filtrar por término de búsqueda
    if (!localizacionSearchTerm.trim()) {
      return globalFiltered;
    }
    return globalFiltered.filter((loc: any) =>
      loc.localizacion?.toLowerCase().includes(localizacionSearchTerm.toLowerCase())
    );
  }, [uniqueLocalizaciones, localizacionSearchTerm, localizacionMatchesGlobalFilters]);

  // Calcular posición del dropdown de localización cuando se abre
  // Usa requestAnimationFrame para actualizar posición en cada frame (más preciso durante animación del sidebar)
  useEffect(() => {
    if (isLocalizacionDropdownOpen && localizacionDropdownRef.current) {
      let animationFrameId: number;
      let isMounted = true;

      const updatePosition = () => {
        if (!isMounted || !localizacionDropdownRef.current) return;
        const rect = localizacionDropdownRef.current.getBoundingClientRect();
        setLocalizacionDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });

        // Continuar el loop mientras el dropdown esté abierto
        if (isMounted) {
          animationFrameId = requestAnimationFrame(updatePosition);
        }
      };

      // Iniciar el loop de animación
      animationFrameId = requestAnimationFrame(updatePosition);

      return () => {
        isMounted = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } else {
      setLocalizacionDropdownPosition(null);
    }
  }, [isLocalizacionDropdownOpen, isCollapsed, state]);

  // Ref para el dropdown de comparación
  const comparisonDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (localizacionDropdownRef.current && !localizacionDropdownRef.current.contains(target)) {
        setIsLocalizacionDropdownOpen(false);
      }
      // Cerrar dropdown de comparación solo si el click fue fuera de él
      if (comparisonDropdownRef.current && !comparisonDropdownRef.current.contains(target)) {
        setIsComparisonDropdownOpen(false);
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
    const sensorInfo = memoizedSensores.find(s => s.sensorid === sensorId);
    const sensorName = sensorInfo?.sensor || sensorInfo?.nombre || `Sensor ${sensorId}`;

    const tipoId = medicion.tipoid || sensorInfo?.tipoid || medicion.localizacion?.sensor?.tipoid;
    const tipoInfo = memoizedTipos.find(t => t.tipoid === tipoId);
    const tipoName = tipoInfo?.tipo || 'Sensor';

    if (sensorName && sensorName !== tipoName) {
      return `${tipoName} - ${sensorName}`;
    }
    return tipoName;
  }, [memoizedSensores, memoizedTipos]);

  // Función para limpiar la localización seleccionada
  const handleClearLocalizacion = useCallback(() => {
    setSelectedLocalizacion(null);
    setUbicacionSeleccionada(null);
    setComparisonMetricId(null);
    setComparisonMediciones([]);
    setComparisonChartData([]);
    setComparisonSeries([]);
    setComparisonUnit('');
  }, [setUbicacionSeleccionada]);

  // Filtrar mediciones por métrica seleccionada (ya vienen filtradas del backend, pero aplicar filtro por si acaso)
  const medicionesFiltradasPorMetrica = useMemo(() => {
    if (!selectedMetricId || mediciones.length === 0) {
      return [];
    }
    
    // Como la RPC ya devuelve solo la métrica seleccionada, simplemente retornar los datos
    // Pero aplicar un filtro defensivo por si los datos no están completamente filtrados
    const filtered = mediciones.filter(m => {
      const metricaId = m.metricaid || m.metrica_nombre;
      return Number(metricaId) === Number(selectedMetricId);
    });
    
    return filtered;
  }, [mediciones, selectedMetricId]);

  // Calcular la unidad de la métrica seleccionada sin setState (evita re-renders)
  const unitFromData = useMemo(() => {
    if (medicionesFiltradasPorMetrica.length > 0) {
      return (
        medicionesFiltradasPorMetrica[0]?.unidad ||
        medicionesFiltradasPorMetrica[0]?.metrica_nombre?.unidad ||
        ''
      );
    }
    return '';
  }, [medicionesFiltradasPorMetrica]);

  // Auto-ajustar eje Y cuando cambia la métrica seleccionada
  useEffect(() => {
    if (medicionesFiltradasPorMetrica.length === 0) {
      setYAxisDomain({ min: null, max: null });
      setInitialYAxisDomain({ min: null, max: null });
      return;
    }

    // Calcular min y max de los valores actuales
    let minValue = Infinity;
    let maxValue = -Infinity;
    let hasNegativeValues = false;

    medicionesFiltradasPorMetrica.forEach((m: any) => {
      const val = m.medicion;
      if (typeof val === 'number' && !isNaN(val)) {
        minValue = Math.min(minValue, val);
        maxValue = Math.max(maxValue, val);
        if (val < 0) {
          hasNegativeValues = true;
        }
      }
    });

    if (minValue === Infinity || maxValue === -Infinity) {
      setYAxisDomain({ min: null, max: null });
      setInitialYAxisDomain({ min: null, max: null });
      return;
    }

    // Calcular rango y agregar padding (10% en cada lado)
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% de padding

    let calculatedMin = minValue - padding;
    
    // Si no hay valores negativos y el mínimo calculado es negativo, usar 0
    if (!hasNegativeValues && calculatedMin < 0) {
      calculatedMin = 0;
    }

    const calculatedDomain = {
      min: calculatedMin,
      max: maxValue + padding
    };

    // Solo actualizar si los valores realmente cambiaron
    setYAxisDomain(prevDomain => {
      if (prevDomain.min === calculatedDomain.min && prevDomain.max === calculatedDomain.max) {
        return prevDomain; // No cambió, retornar el anterior
      }
      return calculatedDomain;
    });

    setInitialYAxisDomain(calculatedDomain);
  }, [medicionesFiltradasPorMetrica]);

  // Preparar datos para el gráfico (usando mediciones ya filtradas por métrica)
  const chartData = useMemo(() => {
    if (medicionesFiltradasPorMetrica.length === 0) {
      return [];
    }

    // Calcular timeSpan
    const timeSpan = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const hoursSpan = daysSpan * 24;

    // Función auxiliar para hacer grouping con una granularidad específica
    const performGrouping = (granularityType: 'minutes' | 'hours' | 'days', interval?: number, hourlyInterval?: number) => {
      const getTimeKey = (date: Date, granularityType: 'minutes' | 'hours' | 'days', interval?: number, hourlyInterval?: number): string => {
        if (granularityType === 'minutes') {
          // Para minutos, usar el intervalo especificado (por defecto 15)
          const minuteInterval = interval || 15;
          const minutes = Math.floor(date.getMinutes() / minuteInterval) * minuteInterval;
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        if (granularityType === 'hours') {
          let hours = date.getHours();
          if (hourlyInterval && hourlyInterval > 1) {
            hours = Math.floor(hours / hourlyInterval) * hourlyInterval;
          }
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(hours).padStart(2, '0')}:00`;
        }
        // días (evitar usar - preferir hours con interval)
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      };

      // Pre-calcular labels - usa el nombre del sensor
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
        const timeKey = getTimeKey(date, granularityType, interval, hourlyInterval);
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

    // Determinar granularidad inicial - NUNCA usar 'days' para evitar pérdida de líneas de sensores
    // Usar siempre horas (con intervalos) o minutos para mantener todos los sensores visibles
    let granularityType: 'minutes' | 'hours' | 'days' = 'hours';
    let minuteInterval = 30;
    let hourlyInterval: number | undefined = undefined;

    if (daysSpan <= 1) {
      granularityType = 'minutes';
      minuteInterval = 15; // Cada 15 min para 1 día
    } else if (daysSpan <= 7) {
      granularityType = 'hours';
      hourlyInterval = 1; // Cada hora
    } else if (daysSpan <= 21) {
      granularityType = 'hours';
      hourlyInterval = 2; // Cada 2 horas - igual a > 21 días para más detalle
    } else if (daysSpan <= 28) {
      granularityType = 'hours';
      hourlyInterval = 4; // Cada 4 horas
    } else if (daysSpan <= 60) {
      granularityType = 'hours';
      hourlyInterval = 4; // Cada 4 horas - mantener resolución para 1-2 meses
    } else {
      granularityType = 'hours';
      hourlyInterval = 6; // Cada 6 horas solo para > 2 meses
    }

    // Hacer grouping con granularidad inicial
    let { result, allLabelsArray, pointCount } = performGrouping(granularityType, minuteInterval, hourlyInterval);

    // Fallback: si hay muy pocos puntos pero muchas mediciones, usar granularidad más fina
    const totalMediciones = medicionesFiltradasPorMetrica.length;
    if (pointCount <= 2 && totalMediciones >= 3) {
      if (granularityType === 'hours') {
        ({ result, allLabelsArray, pointCount } = performGrouping('hours', undefined, 1));
      }
      if (pointCount <= 2) {
        ({ result, allLabelsArray, pointCount } = performGrouping('minutes', 15, undefined));
      }
    }

    return result;
  }, [medicionesFiltradasPorMetrica, dateRange.start, dateRange.end, memoizedSensores, memoizedTipos]);

  // Obtener todas las series únicas para el gráfico
  // CRÍTICO: Incluir TODOS los sensores de medicionesFiltradasPorMetrica para que nunca se pierda una línea
  // (incluso con intervalos largos > 1 mes donde el agrupamiento puede dejar gaps)
  const allSeries = useMemo(() => {
    const seriesSet = new Set<string>();

    // 1. Incluir todos los sensores que tienen datos en las mediciones
    medicionesFiltradasPorMetrica.forEach((m: any) => {
      if (m.medicion !== null && m.medicion !== undefined) {
        const label = getSeriesLabel(m);
        seriesSet.add(label);
      }
    });

    // 2. Complementar con labels de chartData (por si hay datos que no pasaron el filtro anterior)
    chartData.forEach((item: any) => {
      Object.keys(item).forEach(key => {
        if (key !== 'fecha' && typeof item[key] === 'number') {
          seriesSet.add(key);
        }
      });
    });

    return Array.from(seriesSet).sort();
  }, [chartData, medicionesFiltradasPorMetrica, getSeriesLabel]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-3 mb-4 mx-6 mt-6 flex-shrink-0 min-w-0 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="flex items-center justify-evenly gap-4 flex-nowrap overflow-x-auto overflow-y-hidden w-full px-2 py-1 scrollbar-thin"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Selector de Localización (agrupada por Nodo) con searchbar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center flex-shrink-0" ref={localizacionDropdownRef}>
              <label className="text-base font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Localización:
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsLocalizacionDropdownOpen(!isLocalizacionDropdownOpen)}
                  className="h-10 min-w-[180px] px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base flex items-center justify-between"
                >
                  <span className={selectedLocalizacion ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                    {selectedLocalizacion 
                      ? `${selectedLocalizacion.localizacion} - ${selectedLocalizacion.nodo?.nodo || 'Nodo ' + selectedLocalizacion.nodoid}`
                      : 'Selecciona'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${isLocalizacionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              
              {isLocalizacionDropdownOpen && localizacionDropdownPosition && (
                <div 
                  className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
                  style={{
                    top: `${localizacionDropdownPosition.top}px`,
                    left: `${localizacionDropdownPosition.left}px`,
                    width: `${Math.max(localizacionDropdownPosition.width * 2.2, 450)}px`
                  }}
                >
                  <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                    <input
                      type="text"
                      value={localizacionSearchTerm}
                      onChange={(e) => setLocalizacionSearchTerm(e.target.value)}
                      placeholder="Buscar..."
                      className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-base focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                    {isLoadingInitialData ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : filteredNodos.length > 0 ? (
                      filteredNodos.map((nodo: any) => (
                        <button
                          key={nodo.localizacionid}
                          onClick={() => {
                            console.log('[DROPDOWN] 🔵 Seleccionando:', nodo.localizacion, 'nodoid:', nodo.nodoid, 'localizacionid:', nodo.localizacionid);
                            flushSync(() => {
                              justSelectedLocalizacionRef.current = true;
                              setSelectedLocalizacion(nodo);
                              setSelectedMetricId(null);
                              setIsLocalizacionDropdownOpen(false);
                              setLocalizacionSearchTerm('');
                            });
                            console.log('[DROPDOWN] ✅ Selección completada');
                            syncDashboardSelectionToGlobal(nodo, 'localizacion');
                          }}
                          className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${
                            selectedLocalizacion?.localizacionid === nodo.localizacionid
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {nodo.localizacion} - {nodo.nodo?.nodo || 'Nodo ' + nodo.nodoid}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-base text-gray-500 dark:text-neutral-400 font-mono">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-neutral-400 font-mono border-t border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                    Mostrando {filteredNodos.length} de {allUniqueLocalizaciones.length} opciones
                  </div>
                </div>
              )}
              </div>
            </div>
            
            {/* Botón para limpiar localización */}
            {selectedLocalizacion && (
              <button
                onClick={handleClearLocalizacion}
                className="h-10 w-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded font-bold text-lg transition-colors flex-shrink-0 self-end mb-0"
                title="Limpiar localización"
              >
                ×
              </button>
            )}

            {/* Botón para abrir el mapa */}
            <button
              onClick={async () => {
                // Cargar nodos y abrir modal
                // La detección de PLC se hará en el renderizado del modal basándose en los nodos cargados
                await loadMapNodes();
                setShowMapModal(true);
              }}
              className="h-10 w-10 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors flex-shrink-0 self-end mb-0"
              title="Ver en el mapa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* Separador visual */}
          <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

          {/* Rango de fechas */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <label className="text-base font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Fecha Inicio
              </label>
              <input
                ref={fechaInicioInputRef}
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
                    const year = adjustedStart.getFullYear();
                    const month = String(adjustedStart.getMonth() + 1).padStart(2, '0');
                    const day = String(adjustedStart.getDate()).padStart(2, '0');
                    setPendingDateRange({ start: `${year}-${month}-${day}`, end: pendingDateRange.end });
                  } else {
                    setPendingDateRange({ ...pendingDateRange, start: newStart });
                  }
                }}
                max={pendingDateRange.end}
                min={(() => {
                  const today = new Date();
                  today.setDate(today.getDate() - 90);
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })()}
                className="h-10 w-40 pl-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base"
                style={{ colorScheme: 'dark', WebkitAppearance: 'none' }}
              />
            </div>
            <div className="flex flex-col items-center flex-shrink-0">
              <label className="text-base font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Fecha Fin
              </label>
              <input
                ref={fechaFinInputRef}
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
                    const year = adjustedEnd.getFullYear();
                    const month = String(adjustedEnd.getMonth() + 1).padStart(2, '0');
                    const day = String(adjustedEnd.getDate()).padStart(2, '0');
                    setPendingDateRange({ start: pendingDateRange.start, end: `${year}-${month}-${day}` });
                  } else {
                    setPendingDateRange({ ...pendingDateRange, end: newEnd });
                  }
                }}
                max={(() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })()}
                min={pendingDateRange.start}
                className="h-10 w-40 pl-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base"
                style={{ colorScheme: 'dark', WebkitAppearance: 'none' }}
              />
            </div>
          </div>

          {/* Botón Aplicar - aparece cuando hay cambios en las fechas */}
          {selectedLocalizacion && (pendingDateRange.start !== dateRange.start || pendingDateRange.end !== dateRange.end) && (
            <div className="flex flex-col items-center flex-shrink-0">
              <label className="text-base font-bold text-blue-500 font-mono mb-0.5 whitespace-nowrap invisible">Aplicar:</label>
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
                className="h-10 px-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-base transition-colors whitespace-nowrap"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Separador visual */}
          <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

          {/* Ajuste Eje Y */}
          <div className="flex flex-col items-center flex-shrink-0">
            <label className="text-base font-bold text-blue-500 font-mono mb-0.5 whitespace-nowrap uppercase">
              Ajuste Eje Y:
            </label>
            <div className="flex items-center gap-2 h-10">
              <input
                type="number"
                step="0.1"
                min="-999999"
                max="999999"
                value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? Math.round(yAxisDomain.min * 100) / 100 : ''}
                onChange={(e) => {
                  const inputValue = e.target.value
                  if (inputValue === '') {
                    setYAxisDomain({ ...yAxisDomain, min: null })
                    return
                  }
                  const numValue = Number(inputValue)
                  if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                    setYAxisDomain({ ...yAxisDomain, min: numValue })
                  }
                }}
                placeholder="Min"
                className="h-10 w-32 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono"
              />
              <span className="text-gray-600 dark:text-neutral-400 text-base">-</span>
              <input
                type="number"
                step="0.1"
                min="-999999"
                max="999999"
                value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? Math.round(yAxisDomain.max * 100) / 100 : ''}
                onChange={(e) => {
                  const inputValue = e.target.value
                  if (inputValue === '') {
                    setYAxisDomain({ ...yAxisDomain, max: null })
                    return
                  }
                  const numValue = Number(inputValue)
                  if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                    setYAxisDomain({ ...yAxisDomain, max: numValue })
                  }
                }}
                placeholder="Max"
                className="h-10 w-32 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono"
              />
              <button
                onClick={() => setYAxisDomain(initialYAxisDomain)}
                className="h-10 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded text-base font-mono"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Separador visual */}
          <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

          {/* Métricas como botones */}
          <div className="flex flex-col items-center flex-shrink-0">
            <label className="text-base font-bold text-blue-500 font-mono mb-0.5 whitespace-nowrap uppercase">
              Métrica:
            </label>
            <div className="flex items-center gap-2">
              {availableMetrics.length === 0 ? (
                <span className="text-gray-500 dark:text-gray-400 font-mono text-base">
                  Sin métricas
                </span>
              ) : (
                availableMetrics.map(metric => {
                  const isInComparison = comparisonMetricId === metric.id;
                  return (
                    <button
                      key={metric.id}
                      onClick={() => !isInComparison && setSelectedMetricId(metric.id)}
                      disabled={isInComparison}
                      className={`h-10 px-4 rounded font-mono text-base transition-colors whitespace-nowrap ${
                        selectedMetricId === metric.id
                          ? 'bg-blue-500 text-white'
                          : isInComparison
                            ? 'bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-400 dark:text-neutral-500 cursor-not-allowed opacity-60'
                            : 'bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                      title={isInComparison ? `Esta métrica está en modo comparación` : ''}
                    >
                      {metric.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Separador visual */}
          <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

          {/* Comparar Métricas */}
          <div className="flex flex-col items-center flex-shrink-0">
            <label className="text-base font-bold text-blue-500 font-mono mb-0.5 whitespace-nowrap uppercase">
              Comparar:
            </label>
            <div className="relative" ref={comparisonDropdownRef}>
              {comparisonMetricId ? (
                <div className="flex items-center gap-2">
                  <button
                    className="h-10 px-4 rounded font-mono text-base transition-colors whitespace-nowrap bg-blue-500 text-white border border-blue-600"
                  >
                    {availableMetrics.find(m => m.id === comparisonMetricId)?.name || 'Comparar'}
                  </button>
                  <button
                    onClick={() => {
                      setComparisonMetricId(null);
                      setComparisonMediciones([]);
                      setComparisonChartData([]);
                      setComparisonSeries([]);
                    }}
                    className="h-10 w-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded font-bold text-lg transition-colors"
                    title="Quitar comparación"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsComparisonDropdownOpen(!isComparisonDropdownOpen)}
                  disabled={availableMetrics.length <= 1}
                  className="h-10 px-4 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Agregar</span>
                  <svg className={`w-4 h-4 transition-transform ${isComparisonDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {isComparisonDropdownOpen && availableMetrics.length > 1 && comparisonDropdownRef.current && (() => {
                const rect = comparisonDropdownRef.current.getBoundingClientRect();
                return (
                  <div 
                    className="fixed z-[99999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    style={{
                      top: `${rect.bottom + 4}px`,
                      left: `${rect.left}px`,
                      minWidth: '200px'
                    }}
                  >
                    {availableMetrics
                      .filter(metric => metric.id !== selectedMetricId)
                      .map(metric => (
                        <button
                          key={metric.id}
                          onClick={() => {
                            setComparisonMetricId(metric.id);
                            setIsComparisonDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider text-gray-700 dark:text-neutral-300 hover:bg-blue-100 dark:hover:bg-blue-900 whitespace-nowrap"
                        >
                          {metric.name}
                        </button>
                      ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Separador visual */}
          <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch flex-shrink-0"></div>

          {/* Información del Nodo */}
          <div className="flex flex-col items-center flex-shrink-0">
            <label className="text-base font-bold text-blue-500 font-mono mb-0.5 whitespace-nowrap uppercase">
              Información del Nodo:
            </label>
            <div className="h-10 flex items-center gap-3 px-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-700 dark:text-gray-300 font-mono">Loc.:</span>
                <span className="text-base text-gray-800 dark:text-white font-mono">{selectedLocalizacion?.localizacion || '--'}</span>
              </div>
              <div className="w-px h-4 bg-gray-400 dark:bg-neutral-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-700 dark:text-gray-300 font-mono">Ubic.:</span>
                <span className="text-base text-gray-800 dark:text-white font-mono">
                  {selectedLocalizacion?.nodo?.ubicacion?.ubicacion || '--'}
                </span>
              </div>
              <div className="w-px h-4 bg-gray-400 dark:bg-neutral-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-700 dark:text-gray-300 font-mono">Fundo:</span>
                <span className="text-base text-gray-800 dark:text-white font-mono">
                  {selectedLocalizacion?.nodo?.ubicacion?.fundo?.fundo || '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-0 flex flex-col mx-6 mb-6" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {loading || isLoadingInitialData ? (
          <div className="flex items-center justify-center flex-1 bg-white dark:bg-neutral-800 rounded-lg p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center flex-1 bg-white dark:bg-neutral-800 rounded-lg p-6">
            <p className="text-gray-600 dark:text-gray-400 font-mono text-base">Selecciona una localización en la barra superior</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700 mediciones-chart flex flex-col flex-1 min-h-0">
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
            <MedicionesAreaChart
              key={`chart-${selectedLocalizacion?.nodoid || 'empty'}`}
              chartData={chartData}
              allSeries={allSeries}
              selectedMetricUnit={unitFromData}
              yAxisDomain={yAxisDomain}
              colors={COLORS}
              comparisonChartData={comparisonChartData}
              comparisonSeries={comparisonSeries}
              comparisonUnit={comparisonUnit}
              comparisonYAxisDomain={comparisonYAxisDomain}
              isComparisonMode={!!comparisonMetricId}
            />
          </div>
        )}
      </div>

      {/* Modal de Mapa para Seleccionar Nodo */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-5xl flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="text-lg font-bold text-blue-500 font-mono uppercase">
                Ubicación del Nodo
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
                    .mediciones-map-container > div {
                      height: 100% !important;
                    }
                    .mediciones-map-container > div > div {
                      height: 100% !important;
                    }
                  `
                }} />
                <div className="mediciones-map-container h-full">
                  {/* Detectar nodos PLC basándose en los nodos cargados y la ubicación seleccionada */}
                  {(() => {
                    // Obtener la ubicación seleccionada del contexto global
                    const selectedUbicacionId = ubicacionSeleccionada?.ubicacionid;
                    
                    console.log('[Mediciones] Modal mapa - selectedUbicacionId:', selectedUbicacionId, 'SVG_UBICACIONES:', SVG_UBICACIONES);
                    
                    // Si la ubicación seleccionada es una planta SVG (230, 231, 234), mostrar el mapa SVG de esa planta
                    if (selectedUbicacionId && SVG_UBICACIONES.includes(selectedUbicacionId)) {
                      // Filtrar nodos de esta ubicación específica con coordenadas PLC (0-100)
                      const plcNodesForLocation = mapNodes.filter((n: any) => {
                        return n.ubicacionid === selectedUbicacionId &&
                               n.latitud != null && n.longitud != null &&
                               n.latitud >= 0 && n.latitud <= 100 &&
                               n.longitud >= 0 && n.longitud <= 100;
                      });
                      
                      console.log('[Mediciones] Mostrando SVG para planta - plcNodesForLocation:', plcNodesForLocation.length, 'ubicacionId:', selectedUbicacionId);
                      
                      if (plcNodesForLocation.length > 0) {
                        return (
                          <SVGPlantMap
                            nodes={plcNodesForLocation}
                            selectedNode={selectedLocalizacion ? mapNodes.find((n: any) => n.nodoid === selectedLocalizacion.nodoid) || null : null}
                            onNodeSelect={(node: any) => {
                              // Buscar la localización correspondiente en uniqueLocalizaciones
                              const correspondingLocalizacion = uniqueLocalizaciones.find((loc: any) => loc.nodoid === node.nodoid);
                              if (correspondingLocalizacion) {
                                flushSync(() => {
                                  justSelectedLocalizacionRef.current = true;
                                  setSelectedLocalizacion(correspondingLocalizacion);
                                });
                                syncDashboardSelectionToGlobal(correspondingLocalizacion, 'localizacion');
                              }
                              setShowMapModal(false);
                            }}
                            loading={loadingMapNodes}
                            fundoid={selectedUbicacionId === 230 || selectedUbicacionId === 231 ? 3 : 8} // 3=Valerie, 8=Zoe
                            defaultNodeColor="#3b82f6"
                          />
                        );
                      }
                    }
                    
                    // Si no hay ubicación específica de planta, aplicar lógica actual de "puro PLC"
                    // Filtrar nodos PLC (ubicaciones SVG con coordenadas relativas 0-100)
                    const plcNodes = mapNodes.filter((n: any) => {
                      const hasPlcUbicacion = SVG_UBICACIONES.includes(n.ubicacionid);
                      const couldBePlc = n.latitud != null && n.longitud != null && 
                                        n.latitud >= 0 && n.latitud <= 100 && 
                                        n.longitud >= 0 && n.longitud <= 100;
                      return hasPlcUbicacion && couldBePlc;
                    });
                    
                    // Filtrar nodos LoRaWAN (coordenadas GPS válidas fuera del rango 0-100)
                    const loraNodes = mapNodes.filter((n: any) => {
                      const lat = n.latitud;
                      const lng = n.longitud;
                      const isValidGps = lat != null && lng != null && 
                                        (lat > 100 || lat < 0 || lng > 100 || lng < 0);
                      return isValidGps;
                    });
                    
                    // Solo mostrar SVG si es PURO PLC (sin LoRaWAN)
                    const isPurePlc = plcNodes.length > 0 && loraNodes.length === 0;
                    
                    console.log('[Mediciones] Fallback - plcNodes:', plcNodes.length, 'loraNodes:', loraNodes.length, 'isPurePlc:', isPurePlc);
                    
                    if (isPurePlc && plcNodes.length > 0) {
                      return (
                        <SVGPlantMap
                          nodes={plcNodes}
                          selectedNode={selectedLocalizacion ? mapNodes.find((n: any) => n.nodoid === selectedLocalizacion.nodoid) || null : null}
                          onNodeSelect={(node: any) => {
                            // Buscar la localización correspondiente en uniqueLocalizaciones
                            const correspondingLocalizacion = uniqueLocalizaciones.find((loc: any) => loc.nodoid === node.nodoid);
                            if (correspondingLocalizacion) {
                              flushSync(() => {
                                justSelectedLocalizacionRef.current = true;
                                setSelectedLocalizacion(correspondingLocalizacion);
                              });
                              syncDashboardSelectionToGlobal(correspondingLocalizacion, 'localizacion');
                            }
                            setShowMapModal(false);
                          }}
                          loading={loadingMapNodes}
                          fundoid={plcNodes[0]?.ubicacion?.fundoid}
                          defaultNodeColor="#3b82f6"
                        />
                      );
                    }
                    
                    // Otherwise, show Leaflet map
                    return (
                      <InteractiveMap
                        nodes={mapNodes}
                        selectedNode={selectedLocalizacion ? mapNodes.find((n: any) => n.nodoid === selectedLocalizacion.nodoid) || null : null}
                        onNodeSelect={(node: any) => {
                          // Buscar la localización correspondiente en uniqueLocalizaciones
                          const correspondingLocalizacion = uniqueLocalizaciones.find((loc: any) => loc.nodoid === node.nodoid);
                          if (correspondingLocalizacion) {
                            flushSync(() => {
                              justSelectedLocalizacionRef.current = true;
                              setSelectedLocalizacion(correspondingLocalizacion);
                            });
                            syncDashboardSelectionToGlobal(correspondingLocalizacion, 'localizacion');
                          }
                          setShowMapModal(false);
                        }}
                        loading={loadingMapNodes}
                        nodeMediciones={{}}
                        defaultNodeColor="#6b7280"
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
