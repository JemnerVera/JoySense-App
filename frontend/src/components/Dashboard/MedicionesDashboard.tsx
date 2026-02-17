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

interface MedicionesDashboardProps {}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6', '#f97316'];

export function MedicionesDashboard(_props: MedicionesDashboardProps) {
  const { t } = useLanguage();
  const { showError } = useToast();
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado, ubicacionSeleccionada } = useFilters();

  // Estados principales
  const [localizaciones, setLocalizaciones] = useState<Localizacion[]>([]);
  const [uniqueLocalizaciones, setUniqueLocalizaciones] = useState<any[]>([]);
  const [selectedLocalizacion, setSelectedLocalizacion] = useState<any | null>(null);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [fundosInfo, setFundosInfo] = useState<Map<number, any>>(new Map()); // Cache de info de fundos
  const { syncDashboardSelectionToGlobal } = useFilterSync(fundosInfo);
  const [loading, setLoading] = useState(false);
  const [availableMetrics, setAvailableMetrics] = useState<{ id: number; name: string }[]>([]);
  const [selectedMetricUnit, setSelectedMetricUnit] = useState<string>('');

  // Estados de filtro
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [pendingDateRange, setPendingDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null
  });

  // Estados para combobox de localización con searchbar
  const [isLocalizacionDropdownOpen, setIsLocalizacionDropdownOpen] = useState(false);
  const [localizacionSearchTerm, setLocalizacionSearchTerm] = useState('');
  const localizacionDropdownRef = useRef<HTMLDivElement>(null);
  const [localizacionDropdownPosition, setLocalizacionDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Cargar localizaciones, sensores, tipos y fundos con su información de empresa/país.
  // CRÍTICO: Usar el mismo endpoint que MAPEO DE NODOS (nodos-con-localizacion) con filtros,
  // para que al filtrar por fundo/empresa/país se traigan todas las localizaciones con paginación
  // correcta. getLocalizaciones() tiene límite ~1000 filas y al filtrar por fundo ZOE no aparecían.
  useEffect(() => {
    const loadInitialData = async () => {
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

        const [sensoresData, tiposData, fundosData, empresasData] = await Promise.all([
          JoySenseService.getSensores(),
          JoySenseService.getTipos(),
          JoySenseService.getFundos(),
          JoySenseService.getEmpresas()
        ]);

        setLocalizaciones(localizacionesData || []);
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
      }
    };

    loadInitialData();
  }, [showError, paisSeleccionado, empresaSeleccionada, fundoSeleccionado]);

  // Función auxiliar para verificar si una localización cumple con los filtros globales (centralizada en filterSync)
  const localizacionMatchesGlobalFilters = useCallback(
    (loc: any): boolean =>
      localizacionMatchesGlobalFiltersUtil(
        loc,
        { paisSeleccionado, empresaSeleccionada, fundoSeleccionado },
        fundosInfo
      ),
    [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, fundosInfo]
  );

  // Agrupar localizaciones por nombre único (sin repetir)
  useEffect(() => {
    const localizacionesMap = new Map<string, any>();
    
    localizaciones.forEach((loc: Localizacion) => {
      if (loc.localizacion && loc.nodoid) {
        // Usar el nombre de localización como clave
        if (!localizacionesMap.has(loc.localizacion)) {
          localizacionesMap.set(loc.localizacion, {
            localizacionid: loc.localizacionid,
            localizacion: loc.localizacion,
            nodoid: loc.nodoid,
            latitud: loc.latitud,
            longitud: loc.longitud,
            nodo: loc.nodo                // Guardar el objeto nodo completo
          });
        }
      }
    });
    
    setUniqueLocalizaciones(Array.from(localizacionesMap.values()));
  }, [localizaciones]);

  // Validar y limpiar la localización seleccionada cuando cambian los filtros globales
  useEffect(() => {
    if (selectedLocalizacion && !localizacionMatchesGlobalFilters(selectedLocalizacion)) {

      setSelectedLocalizacion(null);
      setMediciones([]);
      setAvailableMetrics([]);
      setSelectedMetricId(null);
    }
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, selectedLocalizacion, localizacionMatchesGlobalFilters]);

  // Sincronizar pendingDateRange con dateRange cuando cambia localización seleccionada
  useEffect(() => {
    setPendingDateRange(dateRange);
    // El eje Y se ajustará automáticamente cuando cambien las mediciones
  }, [selectedLocalizacion]);

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

  // Cargar métricas disponibles cuando cambia localización o rango de fechas
  useEffect(() => {
    if (!selectedLocalizacion?.nodoid) {
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
          nodoid: selectedLocalizacion.nodoid,
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
  }, [selectedLocalizacion, dateRange.start, dateRange.end, showError, validateDateRange]);

  // Cargar mediciones cuando cambia localización o rango de fechas (NO por métrica)
  useEffect(() => {
    if (!selectedLocalizacion?.nodoid) {
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
          nodoid: selectedLocalizacion.nodoid,
          startDate: dateRange.start,
          endDate: dateRange.end
          // NO pasar metricaid - cargar todo y filtrar en frontend
        });

        const medicionesData = data || [];

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
  }, [selectedLocalizacion, dateRange.start, dateRange.end, showError, validateDateRange]);

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

    setAvailableMetrics(availableFromData);

    // Si el selectedMetricId actual no existe en los datos, seleccionar el primero disponible
    if (availableFromData.length > 0) {
      const selectedExists = availableFromData.find(m => m.id === selectedMetricId);
      if (!selectedExists) {
        setSelectedMetricId(availableFromData[0].id);
      }
    } else {
      setSelectedMetricId(null);
    }
  }, [mediciones]);

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
  useEffect(() => {
    if (isLocalizacionDropdownOpen && localizacionDropdownRef.current) {
      const rect = localizacionDropdownRef.current.getBoundingClientRect();
      setLocalizacionDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    } else {
      setLocalizacionDropdownPosition(null);
    }
  }, [isLocalizacionDropdownOpen]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (localizacionDropdownRef.current && !localizacionDropdownRef.current.contains(event.target as Node)) {
        setIsLocalizacionDropdownOpen(false);
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
      const metricaId = m.metricaid || m.metrica_nombre;
      return Number(metricaId) === Number(selectedMetricId);
    });
    
    // Actualizar la unidad de la métrica seleccionada
    if (filtered.length > 0) {
      // Buscar la unidad en el primer registro que tenga esa métrica
      const unitFromData = 
        filtered[0]?.unidad ||
        filtered[0]?.metrica_nombre?.unidad ||
        '';
      
      setSelectedMetricUnit(unitFromData || '');
    } else {
      setSelectedMetricUnit('');
    }
    
    return filtered;
  }, [mediciones, selectedMetricId]);

  // Auto-ajustar eje Y cuando cambia la métrica seleccionada
  useEffect(() => {
    if (medicionesFiltradasPorMetrica.length === 0) {
      setYAxisDomain({ min: null, max: null });
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

    setYAxisDomain({
      min: calculatedMin,
      max: maxValue + padding
    });
  }, [medicionesFiltradasPorMetrica]);

  // Preparar datos para el gráfico (usando mediciones ya filtradas por métrica)
  const chartData = useMemo(() => {
    if (medicionesFiltradasPorMetrica.length === 0) return [];

    // Calcular timeSpan
    const timeSpan = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const hoursSpan = daysSpan * 24;

    console.log('[chartData PREP] dateRange:', dateRange, 'daysSpan:', daysSpan, 'medicionesCount:', medicionesFiltradasPorMetrica.length);

    // Función auxiliar para hacer grouping con una granularidad específica
    const performGrouping = (granularityType: 'minutes' | 'hours' | 'days') => {
      const getTimeKey = (date: Date): string => {
        if (granularityType === 'minutes') {
          const minutes = Math.floor(date.getMinutes() / 30) * 30;
          return `${String(date.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        if (granularityType === 'hours') {
          const hours = date.getHours();
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(hours).padStart(2, '0')}:00`;
        }
        // días
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

    // Hacer grouping con granularidad inicial
    let { result, allLabelsArray, pointCount } = performGrouping(granularityType);

    // Fallback: si hay muy pocos puntos pero muchas mediciones, cambiar granularidad
    const totalMediciones = medicionesFiltradasPorMetrica.length;
    if (pointCount <= 2 && totalMediciones >= 3 && granularityType !== 'minutes') {
      if (granularityType === 'days') {
        // Cambiar de días a horas
        ({ result, allLabelsArray, pointCount } = performGrouping('hours'));
      }
      if (pointCount <= 2 && granularityType === 'hours') {
        // Cambiar de horas a minutos
        ({ result, allLabelsArray, pointCount } = performGrouping('minutes'));
      }
    }

    console.log('[chartData FINAL] granularityType:', granularityType, 'pointCount:', pointCount, 'totalMediciones:', totalMediciones);
    console.log('[chartData FINAL] result fechas:', result.map((r: any) => r.fecha));

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY || e.deltaX;
      if (Math.abs(delta) > 0) {
        container.scrollLeft += delta;
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-3 mb-4 mx-6 mt-6 flex-shrink-0 min-w-0 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-4 flex-nowrap overflow-x-auto overflow-y-hidden w-full px-2 py-1 scrollbar-thin"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Selector de Localización (agrupada por Nodo) con searchbar */}
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
                  {selectedLocalizacion?.localizacion || 'Selecciona'}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isLocalizacionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLocalizacionDropdownOpen && localizacionDropdownPosition && (
                <div 
                  className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
                  style={{
                    top: `${localizacionDropdownPosition.top}px`,
                    left: `${localizacionDropdownPosition.left}px`,
                    width: `${Math.max(localizacionDropdownPosition.width * 1.5, 300)}px`
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
                    {filteredNodos.length > 0 ? (
                      filteredNodos.map((nodo: any) => (
                        <button
                          key={nodo.localizacionid}
                          onClick={() => {
                            setSelectedLocalizacion(nodo);
                            syncDashboardSelectionToGlobal(nodo, 'localizacion');
                            setIsLocalizacionDropdownOpen(false);
                            setLocalizacionSearchTerm('');
                          }}
                          className={`w-full text-left px-3 py-2 text-base transition-colors font-mono tracking-wider ${
                            selectedLocalizacion?.localizacionid === nodo.localizacionid
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {nodo.localizacion}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-base text-gray-500 dark:text-neutral-400 font-mono">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
                  const endDate = new Date(pendingDateRange.end);
                  endDate.setDate(endDate.getDate() - 90);
                  return endDate.toISOString().split('T')[0];
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
                max={(() => {
                  const startDate = new Date(pendingDateRange.start);
                  startDate.setDate(startDate.getDate() + 90);
                  return startDate.toISOString().split('T')[0];
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
                value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? yAxisDomain.min.toString() : ''}
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
                className="h-10 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono"
              />
              <span className="text-gray-600 dark:text-neutral-400 text-base">-</span>
              <input
                type="number"
                step="0.1"
                min="-999999"
                max="999999"
                value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? yAxisDomain.max.toString() : ''}
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
                className="h-10 w-20 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-base font-mono"
              />
              <button
                onClick={() => setYAxisDomain({ min: null, max: null })}
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
                availableMetrics.map(metric => (
                  <button
                    key={metric.id}
                    onClick={() => setSelectedMetricId(metric.id)}
                    className={`h-10 px-4 rounded font-mono text-base transition-colors whitespace-nowrap ${
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
        {loading ? (
          <div className="flex items-center justify-center flex-1 bg-white dark:bg-neutral-800 rounded-lg p-6">
            <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center flex-1 bg-white dark:bg-neutral-800 rounded-lg p-6">
            <p className="text-gray-600 dark:text-gray-400">Selecciona una localización y una métrica</p>
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
              key={`${selectedLocalizacion?.localizacionid}-${selectedMetricId}`}
              chartData={chartData}
              allSeries={allSeries}
              selectedMetricUnit={selectedMetricUnit}
              yAxisDomain={yAxisDomain}
              colors={COLORS}
            />
          </div>
        )}
      </div>

    </div>
  );
}
