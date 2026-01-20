import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { JoySenseService } from '../../services/backend-api';
import { flushSync } from 'react-dom';

interface MetricaPorLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  localizacionIds: number[];
  localizacionNombre: string;
  metricaId: number;
  metricaNombre: string;
  startDate: string;
  endDate: string;
}

interface ChartDataPoint {
  fecha: string;
  fechaFormatted: string;
  [tipoKey: string]: string | number | null | undefined; // Permite claves dinámicas para cada tipo
}

interface MedicionData {
  medicionid: number;
  localizacionid: number;
  fecha: string;
  medicion: number;
  usercreatedid?: number;
  datecreated?: string;
  localizacion?: {
    localizacionid: number;
    localizacion: string;
    nodoid: number;
    metricaid: number;
    sensorid?: number;
    nodo?: { nodoid: number; nodo: string; ubicacionid?: number };
    metrica?: { metricaid: number; metrica: string; unidad: string };
    sensor?: { sensorid: number; tipoid: number };
  };
  // Campos legacy para compatibilidad - usados para indexación
  ubicacionid: number;
  nodoid: number;
  tipoid: number;
  metricaid: number;
}

// Helper para transformar datos del backend al formato MedicionData con campos legacy
// CRÍTICO: Manejar el caso donde localizacion puede ser un array (resultado de Supabase)
function transformMedicionData(data: any[]): MedicionData[] {
  return data.map(m => {
    // CRÍTICO: Manejar el caso donde localizacion puede ser un array (resultado de Supabase)
    const localizacion = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null
    const sensor = localizacion?.sensor ? (Array.isArray(localizacion.sensor) ? localizacion.sensor[0] : localizacion.sensor) : null
    
    return {
      ...m,
      // Normalizar localizacion para que no sea un array
      localizacion: localizacion ? {
        ...localizacion,
        sensor: sensor
      } : null,
      // Extraer campos desde localizacion si existen
      metricaid: m.metricaid ?? localizacion?.metricaid ?? 0,
      nodoid: m.nodoid ?? localizacion?.nodoid ?? 0,
      tipoid: m.tipoid ?? sensor?.tipoid ?? localizacion?.sensor?.tipoid ?? 0,
      ubicacionid: m.ubicacionid ?? localizacion?.nodo?.ubicacionid ?? 0
    }
  })
}

// Configuración de métricas
interface MetricConfig {
  id: number;
  dataKey: string;
  title: string;
  unit: string;
}

const getTranslatedMetrics = (): MetricConfig[] => [
  { id: 1, dataKey: 'temperatura', title: 'Temperatura', unit: '°C' },
  { id: 2, dataKey: 'humedad', title: 'Humedad', unit: '%' },
  { id: 3, dataKey: 'conductividad', title: 'Electroconductividad', unit: 'uS/cm' }
];

const MetricaPorLoteModal: React.FC<MetricaPorLoteModalProps> = ({
  isOpen,
  onClose,
  localizacionIds,
  localizacionNombre,
  metricaId: initialMetricaId,
  metricaNombre: initialMetricaNombre,
  startDate: initialStartDate,
  endDate: initialEndDate
}) => {
  // Estados principales
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [tiposEnDatos, setTiposEnDatos] = useState<number[]>([]);
  const [mediciones, setMediciones] = useState<MedicionData[]>([]);
  
  // Estados para nuevas funcionalidades
  const [selectedMetric, setSelectedMetric] = useState<string>(() => {
    const metricMap: { [key: number]: string } = {
      1: 'temperatura',
      2: 'humedad',
      3: 'conductividad'
    };
    // Si la métrica no está en el mapeo estándar, usar el formato dinámico
    if (metricMap[initialMetricaId]) {
      return metricMap[initialMetricaId];
    }
    // Usar formato dinámico para métricas con IDs diferentes
    return `metrica_${initialMetricaId}`;
  });
  const [detailedStartDate, setDetailedStartDate] = useState<string>(initialStartDate);
  const [detailedEndDate, setDetailedEndDate] = useState<string>(initialEndDate);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [comparisonLote, setComparisonLote] = useState<any>(null);
  const [comparisonMediciones, setComparisonMediciones] = useState<MedicionData[]>([]);
  const [loadingComparisonData, setLoadingComparisonData] = useState(false);
  const [thresholdRecommendations, setThresholdRecommendations] = useState<{ [loteId: string]: { [label: string]: { min: number; max: number; avg: number; stdDev: number } } } | null>(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [availableLotes, setAvailableLotes] = useState<any[]>([]);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [visibleTipos, setVisibleTipos] = useState<Set<string>>(new Set()); // Tipos de sensores visibles en el gráfico
  const [availableMetricIds, setAvailableMetricIds] = useState<Set<number>>(new Set()); // Métricas disponibles en las mediciones
  
  // Función para obtener la etiqueta de la serie (compartida entre gráficos)
  const getSeriesLabel = useCallback((m: any) => {
    const sensorId = m.sensorid || m.localizacion?.sensorid;
    const sensorInfo = sensores.find((s: any) => s.sensorid === sensorId);
    
    // Buscar nombre del sensor en múltiples niveles del objeto
    const sensorName = sensorInfo?.sensor || 
                       sensorInfo?.nombre || 
                       sensorInfo?.modelo || 
                       m.localizacion?.sensor?.sensor || 
                       m.localizacion?.sensor?.nombre;
    
    // Buscar tipo en múltiples niveles
    const tipoId = m.tipoid || sensorInfo?.tipoid || m.localizacion?.sensor?.tipoid || m.localizacion?.sensor?.tipo?.tipoid;
    const tipoInfo = tipos.find(t => t.tipoid === tipoId);
    const tipoName = tipoInfo?.tipo || m.localizacion?.sensor?.tipo?.tipo || 'Sensor';
    
    if (sensorName && sensorName !== tipoName) {
      return `${tipoName} - ${sensorName}`;
    }
    
    // Si no hay nombre de sensor distintivo, usar ID para asegurar unicidad
    if (sensorId && sensorId !== tipoId) {
      return `${tipoName} (ID: ${sensorId})`;
    }
    
    return tipoName;
  }, [sensores, tipos]);

  // Refs para cancelar requests
  const loadChartDataAbortControllerRef = useRef<AbortController | null>(null);
  const loadChartDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función auxiliar para obtener metricId desde dataKey
  const getMetricIdFromDataKey = (dataKey: string): number => {
    // Si el dataKey es del formato "metrica_X", extraer el ID
    if (dataKey.startsWith('metrica_')) {
      const id = parseInt(dataKey.replace('metrica_', ''));
      if (!isNaN(id)) return id;
    }
    
    // Mapeo estándar para las métricas conocidas
    const metricMap: { [key: string]: number } = {
      'temperatura': 1,
      'humedad': 2,
      'conductividad': 3
    };
    
    // Si no está en el mapeo, usar initialMetricaId como fallback
    return metricMap[dataKey] || initialMetricaId || 1;
  };

  // Función para procesar datos del gráfico (definida antes de loadChartData)
  const processChartData = useCallback((
    medicionesFiltradas: MedicionData[],
    tiposUnicos: number[],
    daysDiff: number,
    tiposData: any[],
    yAxisDomainFilter?: { min: number | null; max: number | null }
  ): ChartDataPoint[] => {
    // Determinar granularidad
    const useHours = daysDiff <= 7;
    const useDays = daysDiff > 30;

    // Agrupar por fecha y tipo con granularidad adaptativa
    const dataByTimeAndLabel = new Map<string, { [label: string]: { sum: number; count: number; timestamp: number } }>();

      medicionesFiltradas.forEach((medicion) => {
      const fechaObj = new Date(medicion.fecha);
      let timeKey: string;
      
      if (useDays) {
        const day = String(fechaObj.getDate()).padStart(2, '0');
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        timeKey = `${day}/${month}`;
      } else if (useHours) {
        const day = String(fechaObj.getDate()).padStart(2, '0');
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const hour = String(fechaObj.getHours()).padStart(2, '0');
        timeKey = `${day}/${month} ${hour}:00`;
      } else {
        const day = String(fechaObj.getDate()).padStart(2, '0');
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const hour = Math.floor(fechaObj.getHours() / 4) * 4;
        timeKey = `${day}/${month} ${String(hour).padStart(2, '0')}:00`;
      }

      if (!dataByTimeAndLabel.has(timeKey)) {
        dataByTimeAndLabel.set(timeKey, {});
      }

      const timeData = dataByTimeAndLabel.get(timeKey)!;
      const timestamp = fechaObj.getTime();
      
      const label = getSeriesLabel(medicion);
      
      if (!timeData[label]) {
        timeData[label] = { sum: 0, count: 0, timestamp };
      }
      
      timeData[label].sum += parseFloat(medicion.medicion.toString());
      timeData[label].count += 1;
      if (timestamp > timeData[label].timestamp) {
        timeData[label].timestamp = timestamp;
      }
    });

    // Convertir a array de puntos de datos
    const allTimeStamps = Array.from(dataByTimeAndLabel.entries())
      .map(([timeKey, labelsData]) => {
        const timestamps = Object.values(labelsData).map(t => t.timestamp);
        const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        return { timeKey, timestamp: maxTimestamp };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    const dataPoints: ChartDataPoint[] = allTimeStamps.map(({ timeKey }) => {
      const timeDataByLabel = dataByTimeAndLabel.get(timeKey)!;
      const fechaFormatted = timeKey;

      const point: ChartDataPoint = {
        fecha: timeKey,
        fechaFormatted
      };

      Object.keys(timeDataByLabel).forEach(label => {
        const labelData = timeDataByLabel[label];
        
        if (labelData && labelData.count > 0) {
          let promedio = labelData.sum / labelData.count;
          
          // Filtrar valores fuera del rango del eje Y si está configurado
          if (yAxisDomainFilter) {
            const hasMinLimit = yAxisDomainFilter.min !== null && !isNaN(yAxisDomainFilter.min);
            const hasMaxLimit = yAxisDomainFilter.max !== null && !isNaN(yAxisDomainFilter.max);
            
            if (hasMinLimit && promedio < yAxisDomainFilter.min!) {
              promedio = null as any; // Ocultar valor si está por debajo del mínimo
            } else if (hasMaxLimit && promedio > yAxisDomainFilter.max!) {
              promedio = null as any; // Ocultar valor si está por encima del máximo
            }
          }
          
          point[label] = promedio;
        } else {
          point[label] = null;
        }
      });

      return point;
    });

    return dataPoints;
  }, [yAxisDomain, getSeriesLabel]);

  // Cargar tipos de sensores y ubicaciones disponibles
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [tiposData, sensoresData, localizacionesData, metricasData] = await Promise.all([
          JoySenseService.getTipos(),
          JoySenseService.getSensores(),
          JoySenseService.getLocalizaciones(),
          JoySenseService.getMetricas()
        ]);
        setTipos(tiposData || []);
        setSensores(sensoresData || []);
        setMetricas(metricasData || []);
        // Filtrar localizaciones disponibles (excluyendo las actuales) y agrupar por nombre
        const allLocalizaciones = localizacionesData || [];
        const currentLoteName = allLocalizaciones.find(l => localizacionIds.includes(l.localizacionid))?.localizacion;
        
        const lotesGroupedMap = new Map<string, { localizacion: string; ids: number[] }>();
        allLocalizaciones.forEach((l: any) => {
          if (l.localizacion === currentLoteName) return; // Excluir el lote actual
          
          if (!lotesGroupedMap.has(l.localizacion)) {
            lotesGroupedMap.set(l.localizacion, { localizacion: l.localizacion, ids: [] });
          }
          lotesGroupedMap.get(l.localizacion)!.ids.push(l.localizacionid);
        });

        const lotesDisponibles = Array.from(lotesGroupedMap.values()).map(group => ({
          localizacion: group.localizacion,
          localizacionid: group.ids[0], // ID principal para el select
          ids: group.ids // Todos los IDs para la carga
        })).sort((a, b) => a.localizacion.localeCompare(b.localizacion));

        setAvailableLotes(lotesDisponibles);

        // EXTRA: Identificar todas las métricas disponibles para este lote basándose en los IDs
        const metricasDelLote = allLocalizaciones
          .filter((l: any) => localizacionIds.includes(l.localizacionid))
          .map((l: any) => l.metricaid)
          .filter((id: number) => id != null && id !== 0);
        
        if (metricasDelLote.length > 0) {
          setAvailableMetricIds(prev => {
            const combined = new Set(prev);
            metricasDelLote.forEach((id: number) => combined.add(id));
            return combined;
          });
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    };
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, localizacionIds]);

  // Cargar métricas disponibles para la localización
  const loadAvailableMetrics = useCallback(async () => {
    if (!isOpen || !localizacionIds.length || !detailedStartDate || !detailedEndDate) {
      return;
    }

    try {
      // Cargar una muestra pequeña de mediciones para todos los IDs en un solo request
      const sampleMediciones = await JoySenseService.getMediciones({
        localizacionId: localizacionIds.join(','),
        startDate: `${detailedStartDate} 00:00:00`,
        endDate: `${detailedEndDate} 23:59:59`,
        limit: 200 // Un poco más para cubrir múltiples sensores
      });

      if (Array.isArray(sampleMediciones) && sampleMediciones.length > 0) {
        const transformed = transformMedicionData(sampleMediciones);
        const metricasUnicas = Array.from(new Set(
          transformed.map((m: any) => {
            return m.metricaid ?? m.localizacion?.metricaid ?? 0
          }).filter((id): id is number => id !== undefined && id !== null && id !== 0)
        ));
        
        // Combinar con las métricas ya disponibles (incluyendo la inicial)
        setAvailableMetricIds(prev => {
          const combined = new Set(prev);
          metricasUnicas.forEach(id => combined.add(id));
          // Asegurar que la métrica inicial siempre esté incluida
          if (initialMetricaId) {
            combined.add(initialMetricaId);
          }
          return combined;
        });
      }
    } catch (err) {
      console.error('Error cargando métricas disponibles:', err);
    }
  }, [isOpen, localizacionIds, detailedStartDate, detailedEndDate, initialMetricaId]);

  // Cargar datos del gráfico
  const loadChartData = useCallback(async () => {
    if (!isOpen || !localizacionIds.length || !detailedStartDate || !detailedEndDate) {
      return;
    }

    // Cancelar request anterior si existe
    if (loadChartDataAbortControllerRef.current) {
      loadChartDataAbortControllerRef.current.abort();
    }

    // Limpiar timeout anterior
    if (loadChartDataTimeoutRef.current) {
      clearTimeout(loadChartDataTimeoutRef.current);
    }

    // Crear nuevo AbortController
    const abortController = new AbortController();
    loadChartDataAbortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      // IMPORTANTE: Parsear fechas en zona horaria local para evitar problemas de UTC
      const [startYear, startMonth, startDay] = detailedStartDate.split('-').map(Number)
      const startDateObj = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
      
      const [endYear, endMonth, endDay] = detailedEndDate.split('-').map(Number)
      const endDateObj = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
      
      // Calcular diferencia de días para determinar estrategia de carga
      const daysDiff = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24);
      
      // Estrategia de carga similar a ModernDashboard
      let maxLimit = 20000;
      let useGetAll = false;
      
      if (daysDiff > 60) {
        useGetAll = true;
      } else if (daysDiff > 30) {
        maxLimit = 30000;
      } else if (daysDiff > 14) {
        maxLimit = 25000;
      } else if (daysDiff > 7) {
        maxLimit = 20000;
      } else {
        maxLimit = 15000;
      }

      const currentMetricId = getMetricIdFromDataKey(selectedMetric);

      // Obtener mediciones para TODOS los IDs de localización en un solo request
      const medicionesData = await JoySenseService.getMediciones({
        localizacionId: localizacionIds.join(','),
        metricaId: currentMetricId,
        startDate: `${detailedStartDate} 00:00:00`,
        endDate: `${detailedEndDate} 23:59:59`,
        getAll: useGetAll,
        limit: !useGetAll ? maxLimit : undefined
      });

      if (abortController.signal.aborted) {
        return;
      }

      // CRÍTICO: Transformar datos para asegurar que tipoid, nodoid, metricaid estén disponibles
      const transformedData = transformMedicionData(Array.isArray(medicionesData) ? medicionesData : [])
      
      // Ordenar por fecha ascendente y filtrar
      const medicionesFiltradas = transformedData
        .filter((m: any) => {
          // CRÍTICO: Obtener tipoid desde múltiples fuentes posibles
          const tipoid = m.tipoid ?? m.localizacion?.sensor?.tipoid ?? 0
          return tipoid !== 0 && m.medicion != null && !isNaN(m.medicion)
        })
        .map((m: any) => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a: any, b: any) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }: any) => m)

      setMediciones(medicionesFiltradas);

      // Actualizar métricas disponibles con las métricas encontradas en los datos
      const metricasUnicas = Array.from(new Set(
        medicionesFiltradas.map((m: any) => {
          return m.metricaid ?? m.localizacion?.metricaid ?? 0
        }).filter((id): id is number => id !== undefined && id !== null && id !== 0)
      ));
      
      // Combinar con las métricas ya disponibles (incluyendo la inicial)
      setAvailableMetricIds(prev => {
        const combined = new Set(prev);
        metricasUnicas.forEach(id => combined.add(id));
        // Asegurar que la métrica inicial siempre esté incluida
        if (initialMetricaId) {
          combined.add(initialMetricaId);
        }
        return combined;
      });

      if (medicionesFiltradas.length === 0) {
        setChartData([]);
        setTiposEnDatos([]);
        setLoading(false);
        return;
      }

      // Obtener tipos únicos en los datos
      const tiposUnicos = Array.from(new Set(
        medicionesFiltradas.map((m: any) => {
          // CRÍTICO: Obtener tipoid desde múltiples fuentes posibles
          return m.tipoid ?? m.localizacion?.sensor?.tipoid ?? 0
        }).filter((id): id is number => id !== undefined && id !== null && id !== 0)
      ))
      setTiposEnDatos(tiposUnicos);

      // Procesar datos para el gráfico
      const processedData = processChartData(medicionesFiltradas, tiposUnicos, daysDiff, tipos, yAxisDomain);
      setChartData(processedData);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error cargando datos del gráfico:', err);
        setError('Error al cargar datos del gráfico');
        setChartData([]);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [isOpen, localizacionIds, selectedMetric, detailedStartDate, detailedEndDate, tipos, processChartData]);

  const loadComparisonMediciones = useCallback(async (comparisonLote: any) => {
    if (!comparisonLote || !detailedStartDate || !detailedEndDate) {
      return;
    }

    setLoadingComparisonData(true);
    try {
      // IMPORTANTE: Parsear fechas en zona horaria local para evitar problemas de UTC
      const [startYear, startMonth, startDay] = detailedStartDate.split('-').map(Number)
      const startDateObj = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
      
      const [endYear, endMonth, endDay] = detailedEndDate.split('-').map(Number)
      const endDateObj = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
      
      const daysDiff = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24);
      
      let maxLimit = 20000;
      let useGetAll = false;
      
      if (daysDiff > 60) {
        useGetAll = true;
      } else if (daysDiff > 30) {
        maxLimit = 30000;
      } else if (daysDiff > 14) {
        maxLimit = 25000;
      } else if (daysDiff > 7) {
        maxLimit = 20000;
      } else {
        maxLimit = 15000;
      }

      const currentMetricId = getMetricIdFromDataKey(selectedMetric);

      // Usar todos los IDs asociados al lote de comparación
      const comparisonIds = comparisonLote.ids || [comparisonLote.localizacionid];

      const comparisonData = await JoySenseService.getMediciones({
        localizacionId: comparisonIds.join(','),
        metricaId: currentMetricId,
        startDate: `${detailedStartDate} 00:00:00`,
        endDate: `${detailedEndDate} 23:59:59`,
        getAll: useGetAll,
        limit: !useGetAll ? maxLimit : undefined
      });

      if (!Array.isArray(comparisonData)) {
        console.warn('⚠️ Datos de comparación no válidos');
        return;
      }

      // CRÍTICO: Transformar datos primero para asegurar que tipoid esté disponible
      const transformedComparisonData = transformMedicionData(Array.isArray(comparisonData) ? comparisonData : [])
      
      const sortedComparisonData = transformedComparisonData
        .map(m => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
        .sort((a, b) => a.fechaParsed - b.fechaParsed)
        .map(({ fechaParsed, ...m }) => m);
      
      setComparisonMediciones(sortedComparisonData);
    } catch (err: any) {
      console.error('❌ Error cargando datos de comparación:', err);
    } finally {
      setLoadingComparisonData(false);
    }
  }, [detailedStartDate, detailedEndDate, selectedMetric]);

  // Analizar fluctuación y recomendar umbrales
  const analyzeFluctuationAndRecommendThresholds = useCallback(() => {
    if (!mediciones.length || !tipos.length || !detailedStartDate || !detailedEndDate) {
      return;
    }

    // IMPORTANTE: Parsear fechas en zona horaria local para evitar problemas de UTC
    const [startYear, startMonth, startDay] = detailedStartDate.split('-').map(Number)
    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
    
    const [endYear, endMonth, endDay] = detailedEndDate.split('-').map(Number)
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
    
    // CRÍTICO: Usar mapeo dinámico por nombre de métrica en lugar de ID hardcodeado
    // Función auxiliar para calcular recomendaciones
    const calculateRecommendations = (medicionesData: MedicionData[]): { [label: string]: { min: number; max: number; avg: number; stdDev: number } } => {
      const filteredMediciones = medicionesData.filter(m => {
        const medicionDate = new Date(m.fecha)
        const isInDateRange = medicionDate >= startDate && medicionDate <= endDate
        
        // Filtrar por nombre de métrica dinámicamente
        const rawMetricName = m.localizacion?.metrica?.metrica || ''
        const metricName = rawMetricName
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .trim()
          .toLowerCase()
        
        let matchesMetric = false
        if (selectedMetric === 'temperatura' && (
          metricName.includes('temperatura') || metricName.includes('temp')
        )) matchesMetric = true
        
        if (selectedMetric === 'humedad' && (
          metricName.includes('humedad') || metricName.includes('humidity')
        )) matchesMetric = true
        
        if (selectedMetric === 'conductividad' && (
          metricName.includes('conductividad') || 
          metricName.includes('electroconductividad') ||
          metricName.includes('conductivity')
        )) matchesMetric = true
        
        // Formato metrica_X
        if (selectedMetric.startsWith('metrica_')) {
          const targetId = parseInt(selectedMetric.replace('metrica_', ''))
          const mId = m.metricaid ?? m.localizacion?.metricaid
          if (mId === targetId) matchesMetric = true
        }
        
        return isInDateRange && matchesMetric
      });

      if (filteredMediciones.length === 0) {
        return {};
      }

      const medicionesPorLabel: { [label: string]: number[] } = {};
      
      filteredMediciones.forEach(m => {
        const label = getSeriesLabel(m);
        if (!medicionesPorLabel[label]) {
          medicionesPorLabel[label] = [];
        }
        if (m.medicion != null && !isNaN(m.medicion)) {
          medicionesPorLabel[label].push(m.medicion);
        }
      });

      const recommendations: { [label: string]: { min: number; max: number; avg: number; stdDev: number } } = {};
      
      Object.keys(medicionesPorLabel).forEach(label => {
        const valores = medicionesPorLabel[label];
        
        if (valores.length === 0) return;
        
        const avg = valores.reduce((sum, v) => sum + v, 0) / valores.length;
        const variance = valores.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / valores.length;
        const stdDev = Math.sqrt(variance);
        
        const sorted = [...valores].sort((a, b) => a - b);
        const p5 = sorted[Math.floor(sorted.length * 0.05)];
        const p95 = sorted[Math.ceil(sorted.length * 0.95)];
        
        const margin = stdDev * 0.5;
        const recommendedMin = Math.max(0, p5 - margin);
        const recommendedMax = p95 + margin;
        
        recommendations[label] = {
          min: Math.round(recommendedMin * 100) / 100,
          max: Math.round(recommendedMax * 100) / 100,
          avg: Math.round(avg * 100) / 100,
          stdDev: Math.round(stdDev * 100) / 100
        }
      });

      return recommendations;
    };

    // Calcular recomendaciones para el lote principal
    const mainLoteRecommendations = calculateRecommendations(mediciones);
    
    if (Object.keys(mainLoteRecommendations).length === 0) {
      alert('No hay datos suficientes para analizar la fluctuación del lote principal');
      return;
    }

    const allRecommendations: { [loteId: string]: { [label: string]: { min: number; max: number; avg: number; stdDev: number } } } = {
      [`localizacion_${localizacionIds.join('_')}`]: mainLoteRecommendations
    };

    // Si hay lote de comparación, calcular también sus recomendaciones
    if (comparisonLote && comparisonMediciones.length > 0) {
      const comparisonRecommendations = calculateRecommendations(comparisonMediciones);
      if (Object.keys(comparisonRecommendations).length > 0) {
        allRecommendations[`localizacion_${comparisonLote.localizacionid}`] = comparisonRecommendations;
      }
    }

    setThresholdRecommendations(allRecommendations);
    setShowThresholdModal(true);
  }, [mediciones, comparisonMediciones, tipos, detailedStartDate, detailedEndDate, selectedMetric, localizacionIds, comparisonLote]);

  // Inicializar métricas disponibles con la métrica inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen && initialMetricaId) {
      console.log('[MetricaPorLoteModal] Inicializando métricas disponibles con initialMetricaId:', initialMetricaId);
      // Inicializar con la métrica que se pasó como prop
      setAvailableMetricIds(new Set([initialMetricaId]));
    }
  }, [isOpen, initialMetricaId]);

  // Cargar métricas disponibles cuando se abre el modal o cambian las fechas
  useEffect(() => {
    if (isOpen && localizacionIds.length && detailedStartDate && detailedEndDate) {
      loadAvailableMetrics();
    }
  }, [isOpen, localizacionIds, detailedStartDate, detailedEndDate, loadAvailableMetrics]);

  // Recargar datos cuando cambien las fechas o métrica
  useEffect(() => {
    if (!isOpen || !localizacionIds.length || !detailedStartDate || !detailedEndDate) {
      return;
    }
    
    if (new Date(detailedStartDate) > new Date(detailedEndDate)) {
      console.warn('⚠️ Fechas inválidas: fecha inicial mayor que fecha final');
      return;
    }
    
    setLoading(true);
    
    // Debounce: esperar 1000ms antes de cargar
    loadChartDataTimeoutRef.current = setTimeout(() => {
      loadChartData();
    }, 1000);
    
    return () => {
      if (loadChartDataTimeoutRef.current) {
        clearTimeout(loadChartDataTimeoutRef.current);
      }
      if (loadChartDataAbortControllerRef.current) {
        loadChartDataAbortControllerRef.current.abort();
      }
    };
  }, [detailedStartDate, detailedEndDate, selectedMetric, isOpen, localizacionIds, loadChartData]);

  // Recargar datos de comparación cuando cambien las fechas o métrica
  useEffect(() => {
    if (comparisonLote && detailedStartDate && detailedEndDate) {
      loadComparisonMediciones(comparisonLote);
    }
  }, [comparisonLote, detailedStartDate, detailedEndDate, selectedMetric, loadComparisonMediciones]);

  // Resetear estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedMetric(() => {
        const metricMap: { [key: number]: string } = {
          1: 'temperatura',
          2: 'humedad',
          3: 'conductividad'
        };
        return metricMap[initialMetricaId] || 'temperatura';
      });
      setDetailedStartDate(initialStartDate);
      setDetailedEndDate(initialEndDate);
      setTempStartDate('');
      setTempEndDate('');
      setYAxisDomain({ min: null, max: null });
      setComparisonLote(null);
      setComparisonMediciones([]);
      setThresholdRecommendations(null);
      setShowThresholdModal(false);
      setChartData([]);
      setMediciones([]);
      setIsModalExpanded(false); // Resetear expansión al cerrar
      setVisibleTipos(new Set()); // Resetear tipos visibles
    }
  }, [isOpen, initialMetricaId, initialStartDate, initialEndDate]);

  // Resetear ajuste del eje Y cuando cambia el lote seleccionado
  useEffect(() => {
    setYAxisDomain({ min: null, max: null });
  }, [localizacionIds]);

  // Reprocesar datos cuando cambia el ajuste del eje Y
  useEffect(() => {
    if (!mediciones.length || !tiposEnDatos.length || !detailedStartDate || !detailedEndDate) {
      return;
    }

    const startDateObj = new Date(detailedStartDate + 'T00:00:00');
    const endDateObj = new Date(detailedEndDate + 'T23:59:59');
    const daysDiff = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24);

    const processedData = processChartData(mediciones, tiposEnDatos, daysDiff, tipos, yAxisDomain);
    setChartData(processedData);
  }, [yAxisDomain, mediciones, tiposEnDatos, detailedStartDate, detailedEndDate, tipos, processChartData]);

  // Inicializar tipos visibles cuando se cargan los datos o cambia la métrica
  useEffect(() => {
    if (!isOpen || !chartData.length) {
      if (!isOpen) {
        setVisibleTipos(new Set());
      }
      return;
    }

    // Obtener tipos disponibles de los datos del gráfico
    const tiposDisponibles = new Set<string>();
    
    // Agregar tipos del lote principal
    chartData.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'fecha' && key !== 'fechaFormatted' && key !== 'time' && !key.startsWith('comp_')) {
          tiposDisponibles.add(key);
        }
      });
    });

    // IMPORTANTE: También agregar tipos del lote de comparación
    if (comparisonMediciones.length > 0) {
      comparisonMediciones.forEach(m => {
        const label = getSeriesLabel(m);
        if (label) tiposDisponibles.add(label);
      });
    }

    // Si visibleTipos está vacío o no contiene todos los tipos actuales, inicializar
    setVisibleTipos(prev => {
      // Si ya hay tipos seleccionados, mantenerlos y agregar los nuevos encontrados
      const newVisibleTipos = new Set(prev);
      let changed = false;
      
      tiposDisponibles.forEach(tipo => {
        if (!newVisibleTipos.has(tipo)) {
          newVisibleTipos.add(tipo);
          changed = true;
        }
      });

      return changed ? newVisibleTipos : prev;
    });
  }, [isOpen, chartData, comparisonMediciones, selectedMetric, localizacionIds, getSeriesLabel]);

  // Procesar datos de comparación si están disponibles
  // CRÍTICO: Usar EXACTAMENTE la misma lógica de granularidad que processChartData
  const processComparisonData = (comparisonData: MedicionData[], dataKey: string, yAxisDomainFilter?: { min: number | null; max: number | null }): ChartDataPoint[] => {
    if (!comparisonData.length || !tipos.length) {
      return [];
    }
    
    const metricId = getMetricIdFromDataKey(dataKey);
    const metricMediciones = comparisonData.filter(m => m.metricaid === metricId);
    
    if (!metricMediciones.length) {
      return [];
    }
    
    if (!detailedStartDate || !detailedEndDate) {
      return [];
    }
    
    const startDate = new Date(detailedStartDate + 'T00:00:00');
    const endDate = new Date(detailedEndDate + 'T23:59:59');
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    
    // USAR EXACTAMENTE LA MISMA LÓGICA DE GRANULARIDAD QUE processChartData
    const useHours = daysDiff <= 7;
    const useDays = daysDiff > 30;
    
    const filteredMediciones = metricMediciones.filter(m => {
      const medicionDate = new Date(m.fecha);
      return medicionDate >= startDate && medicionDate <= endDate;
    });
    
    if (filteredMediciones.length === 0) {
      return [];
    }
    
    // Agrupar por fecha y tipo con granularidad adaptativa (MISMA LÓGICA QUE processChartData)
    const dataByTimeAndLabel = new Map<string, { [label: string]: { sum: number; count: number; timestamp: number } }>();
    
    filteredMediciones.forEach((medicion) => {
      if (medicion.medicion == null || isNaN(medicion.medicion)) return;
      
      const fechaObj = new Date(medicion.fecha);
      let timeKey: string;
      
      if (useDays) {
        const day = String(fechaObj.getDate()).padStart(2, '0');
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        timeKey = `${day}/${month}`;
      } else if (useHours) {
        const day = String(fechaObj.getDate()).padStart(2, '0');
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const hour = String(fechaObj.getHours()).padStart(2, '0');
        timeKey = `${day}/${month} ${hour}:00`;
      } else {
        // Intervalos de 4 horas (misma lógica que processChartData)
        const day = String(fechaObj.getDate()).padStart(2, '0');
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const hour = Math.floor(fechaObj.getHours() / 4) * 4;
        timeKey = `${day}/${month} ${String(hour).padStart(2, '0')}:00`;
      }
      
      if (!dataByTimeAndLabel.has(timeKey)) {
        dataByTimeAndLabel.set(timeKey, {});
      }
      
      const timeData = dataByTimeAndLabel.get(timeKey)!;
      const timestamp = fechaObj.getTime();
      
      const label = getSeriesLabel(medicion);
      
      if (!timeData[label]) {
        timeData[label] = { sum: 0, count: 0, timestamp };
      }
      
      timeData[label].sum += parseFloat(medicion.medicion.toString());
      timeData[label].count += 1;
      if (timestamp > timeData[label].timestamp) {
        timeData[label].timestamp = timestamp;
      }
    });
    
    // Convertir a array de puntos de datos (MISMA LÓGICA QUE processChartData)
    const allTimeStamps = Array.from(dataByTimeAndLabel.entries())
      .map(([timeKey, labelsData]) => {
        const timestamps = Object.values(labelsData).map(t => t.timestamp);
        const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        return { timeKey, timestamp: maxTimestamp };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const dataPoints: ChartDataPoint[] = allTimeStamps.map(({ timeKey }) => {
      const timeDataByLabel = dataByTimeAndLabel.get(timeKey)!;
      const fechaFormatted = timeKey;
      
      const point: ChartDataPoint = {
        fecha: timeKey,
        fechaFormatted,
        time: timeKey // Agregar 'time' para compatibilidad con combineChartData
      };
      
      Object.keys(timeDataByLabel).forEach(label => {
        const labelData = timeDataByLabel[label];
        
        if (labelData && labelData.count > 0) {
          let promedio = labelData.sum / labelData.count;
          
          // Filtrar valores fuera del rango del eje Y si está configurado
          if (yAxisDomainFilter) {
            const hasMinLimit = yAxisDomainFilter.min !== null && !isNaN(yAxisDomainFilter.min);
            const hasMaxLimit = yAxisDomainFilter.max !== null && !isNaN(yAxisDomainFilter.max);
            
            if (hasMinLimit && promedio < yAxisDomainFilter.min!) {
              promedio = null as any; // Ocultar valor si está por debajo del mínimo
            } else if (hasMaxLimit && promedio > yAxisDomainFilter.max!) {
              promedio = null as any; // Ocultar valor si está por encima del máximo
            }
          }
          
          point[label] = promedio;
        } else {
          point[label] = null;
        }
      });
      
      return point;
    });
    
    return dataPoints;
  };

  // Combinar datos principales con datos de comparación
  // CRÍTICO: Incluir TODOS los timeKeys de ambos datasets para que las líneas se rendericen
  // CRÍTICO: PRESERVAR SIEMPRE los datos del lote principal
  const finalChartData = useMemo(() => {
    if (!comparisonLote || comparisonMediciones.length === 0) {
      return chartData;
    }

    const comparisonChartData = processComparisonData(comparisonMediciones, selectedMetric, yAxisDomain);
    
    if (comparisonChartData.length === 0) {
      return chartData;
    }

    // Crear un mapa de tiempo para combinar eficientemente
    const timeMap = new Map<string, any>();
    
    // PRIMERO: Agregar TODOS los puntos del lote principal (CRÍTICO: esto debe preservarse)
    chartData.forEach(point => {
      const timeKey = point.fecha || point.fechaFormatted;
      if (timeKey) {
        timeMap.set(timeKey, { ...point });
      }
    });
    
    // SEGUNDO: Agregar/actualizar con datos de comparación
    comparisonChartData.forEach(point => {
      const timeKeyRaw = point.fecha || point.fechaFormatted || point.time;
      if (!timeKeyRaw) return;
      
      // Asegurar que timeKey sea siempre string
      const timeKey = String(timeKeyRaw);
      if (!timeKey) return;
      
      // Si no existe un punto para este timeKey, crear uno nuevo
      const existing = timeMap.get(timeKey) || { fecha: timeKey, fechaFormatted: timeKey };
      
      // Agregar todas las propiedades de comparación con prefijo 'comp_'
      Object.keys(point).forEach(key => {
        if (key !== 'fecha' && key !== 'fechaFormatted' && key !== 'time') {
          existing[`comp_${key}`] = point[key];
        }
      });
      
      timeMap.set(timeKey, existing);
    });
    
    // Convertir a array y ordenar cronológicamente
    return Array.from(timeMap.values()).sort((a, b) => {
      const timeA = a.fecha || a.fechaFormatted;
      const timeB = b.fecha || b.fechaFormatted;
      
      // Intentar ordenar por fecha si tiene formato dd/mm
      if (timeA.includes('/') && timeB.includes('/')) {
        const partsA = timeA.split(' ');
        const datePartsA = partsA[0].split('/');
        const timePartsA = (partsA[1] || '00:00').split(':');
        
        const partsB = timeB.split(' ');
        const datePartsB = partsB[0].split('/');
        const timePartsB = (partsB[1] || '00:00').split(':');
        
        const year = new Date(detailedStartDate).getFullYear();
        
        const dateA = new Date(year, Number(datePartsA[1]) - 1, Number(datePartsA[0]), Number(timePartsA[0]), Number(timePartsA[1])).getTime();
        const dateB = new Date(year, Number(datePartsB[1]) - 1, Number(datePartsB[0]), Number(timePartsB[0]), Number(timePartsB[1])).getTime();
        
        return dateA - dateB;
      }
      
      return timeA.localeCompare(timeB);
    });
  }, [chartData, comparisonLote, comparisonMediciones, selectedMetric, yAxisDomain, detailedStartDate]);

  // Siempre incluir la métrica inicial si está disponible, y agregar las demás encontradas
  const metricsToShow = useMemo(() => {
    const allMetrics: MetricConfig[] = [];
    const processedIds = new Set<number>();

    // 1. Agregar métricas estándar si están en availableMetricIds
    getTranslatedMetrics().forEach(m => {
      if (availableMetricIds.has(m.id)) {
        allMetrics.push(m);
        processedIds.add(m.id);
      }
    });

    // 2. Agregar la métrica inicial si no se ha procesado aún
    if (initialMetricaId && !processedIds.has(initialMetricaId)) {
      const metricInfo = metricas.find(m => m.metricaid === initialMetricaId);
      const title = initialMetricaNombre || metricInfo?.metrica || `Métrica ${initialMetricaId}`;
      
      let unit = metricInfo?.unidad || '';
      if (!unit) {
        const nombreLower = title.toLowerCase();
        if (nombreLower.includes('temperatura')) unit = '°C';
        else if (nombreLower.includes('humedad')) unit = '%';
        else if (nombreLower.includes('conductividad')) unit = 'uS/cm';
      }

      allMetrics.push({
        id: initialMetricaId,
        dataKey: `metrica_${initialMetricaId}`,
        title: title,
        unit: unit
      });
      processedIds.add(initialMetricaId);
    }

    // 3. Agregar CUALQUIER otra métrica encontrada en availableMetricIds
    availableMetricIds.forEach(id => {
      if (!processedIds.has(id)) {
        const metricInfo = metricas.find(m => m.metricaid === id);
        if (metricInfo) {
          allMetrics.push({
            id: id,
            dataKey: `metrica_${id}`,
            title: metricInfo.metrica,
            unit: metricInfo.unidad || ''
          });
          processedIds.add(id);
        }
      }
    });

    return allMetrics.sort((a, b) => a.title.localeCompare(b.title));
  }, [metricas, availableMetricIds, initialMetricaId, initialMetricaNombre]);

  // Asegurar que la métrica seleccionada esté disponible
  useEffect(() => {
    if (availableMetricIds.size > 0) {
      const currentMetricId = getMetricIdFromDataKey(selectedMetric);
      if (!availableMetricIds.has(currentMetricId) && metricsToShow.length > 0) {
        // Cambiar a la primera métrica disponible
        setSelectedMetric(metricsToShow[0].dataKey);
      }
    } else if (availableMetricIds.size === 0 && initialMetricaId) {
      // Si no hay métricas disponibles aún, usar la métrica inicial
      const metricMap: { [key: number]: string } = {
        1: 'temperatura',
        2: 'humedad',
        3: 'conductividad'
      };
      const initialMetricKey = metricMap[initialMetricaId] || 'temperatura';
      if (selectedMetric !== initialMetricKey) {
        setSelectedMetric(initialMetricKey);
      }
    }
  }, [availableMetricIds, metricsToShow, selectedMetric, initialMetricaId]);

  const currentMetric = metricsToShow.find(m => m.dataKey === selectedMetric);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full ${isModalExpanded ? 'max-w-[95vw]' : 'max-w-7xl'} max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300`}>
          {/* Header con botones de métricas */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-neutral-700">
            {/* Botones de métricas centrados */}
            <div className="flex-1 flex justify-center">
              <div className="flex space-x-2">
                {(() => {
                  console.log('[MetricaPorLoteModal] Renderizando botones de métricas:', {
                    metricsToShowLength: metricsToShow.length,
                    metricsToShow: metricsToShow.map(m => ({ id: m.id, title: m.title })),
                    availableMetricIds: Array.from(availableMetricIds),
                    initialMetricaId
                  });
                  
                  if (metricsToShow.length > 0) {
                    return metricsToShow.map((metric) => (
                      <button
                        key={metric.id}
                        onClick={() => setSelectedMetric(metric.dataKey)}
                        disabled={loading}
                        className={`px-3 py-1 rounded-lg font-mono tracking-wider transition-colors text-sm uppercase ${
                          selectedMetric === metric.dataKey
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {metric.title}
                      </button>
                    ));
                  } else {
                    // Fallback: mostrar la métrica inicial si existe
                    if (initialMetricaId) {
                      let initialMetric = getTranslatedMetrics().find(m => m.id === initialMetricaId);
                      
                      // Si no se encuentra, crear una métrica dinámica
                      if (!initialMetric && initialMetricaNombre) {
                        let unit = '';
                        const nombreLower = initialMetricaNombre.toLowerCase();
                        if (nombreLower.includes('temperatura')) unit = '°C';
                        else if (nombreLower.includes('humedad')) unit = '%';
                        else if (nombreLower.includes('conductividad') || nombreLower.includes('electroconductividad')) unit = 'uS/cm';
                        
                        initialMetric = {
                          id: initialMetricaId,
                          dataKey: `metrica_${initialMetricaId}`,
                          title: initialMetricaNombre,
                          unit: unit
                        };
                      }
                      
                      console.log('[MetricaPorLoteModal] Usando fallback con initialMetric:', initialMetric);
                      if (initialMetric) {
                        const metric = initialMetric; // Crear una constante para que TypeScript sepa que no es undefined
                        return (
                          <button
                            key={metric.id}
                            onClick={() => setSelectedMetric(metric.dataKey)}
                            disabled={loading}
                            className={`px-3 py-1 rounded-lg font-mono tracking-wider transition-colors text-sm uppercase ${
                              selectedMetric === metric.dataKey
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {metric.title}
                          </button>
                        );
                      }
                    }
                    console.warn('[MetricaPorLoteModal] No hay métricas para mostrar y no hay initialMetricaId');
                    return (
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        No hay métricas disponibles
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
            {/* Botones de control (expandir y cerrar) */}
            <div className="flex items-center gap-2">
              {/* Botón expandir/contraer */}
              <button
                onClick={() => setIsModalExpanded(!isModalExpanded)}
                className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
                title={isModalExpanded ? "Contraer" : "Expandir"}
              >
                {isModalExpanded ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
                title="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Contenido */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
            <div className="p-6">
              {/* Mensaje de validación de fechas */}
              {detailedStartDate && detailedEndDate && new Date(detailedStartDate) > new Date(detailedEndDate) && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                    <span>⚠️</span>
                    <span className="text-sm font-mono">La fecha inicial no puede ser mayor que la fecha final. Por favor, ajuste las fechas.</span>
                  </div>
                </div>
              )}

              {/* Controles */}
              <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap items-start gap-4 justify-center">
                  {/* Intervalo de Fechas */}
                  <div className="flex flex-col flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Fecha Inicio:</label>
                        <input
                          type="date"
                          value={tempStartDate || detailedStartDate}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            // Solo actualizar tempStartDate, NO cargar datos automáticamente
                            setTempStartDate(newStartDate);
                          }}
                          max={tempEndDate || detailedEndDate || undefined}
                          disabled={loading}
                          className={`h-8 w-40 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          style={{
                            colorScheme: 'dark',
                            WebkitAppearance: 'none'
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap">Fecha Fin:</label>
                        <input
                          type="date"
                          value={tempEndDate || detailedEndDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value;
                            // Solo actualizar tempEndDate, NO cargar datos automáticamente
                            setTempEndDate(newEndDate);
                          }}
                          min={tempStartDate || detailedStartDate || undefined}
                          disabled={loading}
                          className={`h-8 w-40 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          style={{
                            colorScheme: 'dark',
                            WebkitAppearance: 'none'
                          }}
                        />
                      </div>
                      {/* Botón Aplicar - aparece cuando hay fechas temporales diferentes */}
                      {(tempStartDate && tempStartDate !== detailedStartDate) || (tempEndDate && tempEndDate !== detailedEndDate) ? (
                        <div className="flex flex-col">
                          <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 whitespace-nowrap invisible">Aplicar:</label>
                          <button
                            onClick={() => {
                              // Validar fechas antes de aplicar
                              const startDateToApply = tempStartDate || detailedStartDate;
                              const endDateToApply = tempEndDate || detailedEndDate;
                              
                              if (startDateToApply && endDateToApply && new Date(startDateToApply) > new Date(endDateToApply)) {
                                alert('La fecha inicial no puede ser mayor que la fecha final. Por favor, seleccione fechas válidas.');
                                return;
                              }
                              
                              // Aplicar cambios y cargar datos
                              flushSync(() => {
                                setLoading(true);
                                if (tempStartDate) {
                                  setDetailedStartDate(tempStartDate);
                                  setTempStartDate('');
                                }
                                if (tempEndDate) {
                                  setDetailedEndDate(tempEndDate);
                                  setTempEndDate('');
                                }
                                // Si la fecha inicio cambió y es mayor que la fecha fin, ajustar ambas
                                if (tempStartDate && tempEndDate && new Date(tempStartDate) > new Date(tempEndDate)) {
                                  setDetailedStartDate(tempStartDate);
                                  setDetailedEndDate(tempStartDate);
                                  setTempStartDate('');
                                  setTempEndDate('');
                                }
                              });
                            }}
                            disabled={loading}
                            className="h-8 px-3 ml-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-xs transition-colors whitespace-nowrap"
                          >
                            Aplicar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Separador visual */}
                  <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

                  {/* Ajuste del eje Y */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2">Ajuste Eje Y:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="-999999"
                        max="999999"
                        value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? yAxisDomain.min.toString() : ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === '') {
                            setYAxisDomain(prev => ({ ...prev, min: null }));
                            return;
                          }
                          const numValue = Number(inputValue);
                          if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                            setYAxisDomain(prev => ({ ...prev, min: numValue }));
                          }
                        }}
                        placeholder="Min"
                        className="h-8 w-16 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono"
                      />
                      <span className="text-gray-600 dark:text-neutral-400">-</span>
                      <input
                        type="number"
                        step="0.1"
                        min="-999999"
                        max="999999"
                        value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? yAxisDomain.max.toString() : ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === '') {
                            setYAxisDomain(prev => ({ ...prev, max: null }));
                            return;
                          }
                          const numValue = Number(inputValue);
                          if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                            setYAxisDomain(prev => ({ ...prev, max: numValue }));
                          }
                        }}
                        placeholder="Max"
                        className="h-8 w-16 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono"
                      />
                      <button
                        onClick={() => setYAxisDomain({ min: null, max: null })}
                        className="h-8 px-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-mono"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Separador visual */}
                  <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

                  {/* Botón de análisis de fluctuación */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2">Analizar Fluctuación:</label>
                    <button
                      onClick={analyzeFluctuationAndRecommendThresholds}
                      disabled={loading || !mediciones.length}
                      className="h-8 px-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Umbrales
                    </button>
                  </div>

                  {/* Separador visual */}
                  <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

                  {/* Selector de lote para comparación */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2 tracking-wider">Comparar con Lote:</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={comparisonLote?.localizacionid || ''}
                        onChange={(e) => {
                          const loteId = parseInt(e.target.value);
                          if (loteId && !localizacionIds.includes(loteId)) {
                            const lote = availableLotes.find(l => l.localizacionid === loteId);
                            if (lote) {
                              setComparisonLote(lote);
                              loadComparisonMediciones(lote);
                            } else {
                              setComparisonLote(null);
                              setComparisonMediciones([]);
                            }
                          } else {
                            setComparisonLote(null);
                            setComparisonMediciones([]);
                          }
                        }}
                        disabled={loadingComparisonData}
                        className="h-8 px-3 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 dark:text-white font-mono text-sm min-w-[200px] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors dashboard-scrollbar"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#22c55e #d1d5db'
                        }}
                      >
                        <option value="">Ninguno</option>
                        {availableLotes.map(lote => (
                          <option key={lote.localizacionid} value={lote.localizacionid}>
                            {lote.localizacion}
                          </option>
                        ))}
                      </select>
                      {comparisonLote && (
                        <button
                          onClick={() => {
                            setComparisonLote(null);
                            setComparisonMediciones([]);
                          }}
                          className="h-8 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-mono"
                        >
                          ✕
                        </button>
                      )}
                      {loadingComparisonData && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico */}
              <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white font-mono tracking-wider">
                    {localizacionNombre}
                    {comparisonLote && ` vs ${comparisonLote.localizacion}`}
                  </h3>
                </div>
                {(() => {
                  if (loading) {
                    return (
                      <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <div className="text-gray-600 dark:text-neutral-400 text-lg font-mono">
                            Cargando datos...
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  if (finalChartData.length === 0) {
                    return (
                      <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-4">📊</div>
                          <div className="text-gray-600 dark:text-neutral-400 text-lg font-mono">
                            No hay datos disponibles para el período seleccionado
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const allKeys = Array.from(new Set(finalChartData.flatMap(point => Object.keys(point))));
                  const tipoKeys = allKeys.filter(key => key !== 'fecha' && key !== 'fechaFormatted' && key !== 'time' && !key.startsWith('comp_')).sort();
                  const comparisonKeys = allKeys.filter(key => key.startsWith('comp_')).sort();
                  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#8b5cf6', '#3b82f6'];
                  const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4', '#ef4444', '#f59e0b'];

                  return (
                    <>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={finalChartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="fechaFormatted"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={(() => {
                                if (finalChartData.length <= 8) return 0;
                                if (finalChartData.length <= 20) return 1;
                                return Math.floor(finalChartData.length / 6);
                              })()}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                              domain={([dataMin, dataMax]) => {
                                if (yAxisDomain.min !== null || yAxisDomain.max !== null) {
                                  const min = yAxisDomain.min !== null ? yAxisDomain.min : dataMin;
                                  const max = yAxisDomain.max !== null ? yAxisDomain.max : dataMax;
                                  return [min, max];
                                }
                                return [dataMin, dataMax];
                              }}
                              allowDataOverflow={false}
                              tickFormatter={(value) => {
                                if (Math.abs(value) >= 1) {
                                  return Math.round(value).toString();
                                } else {
                                  return value.toFixed(1);
                                }
                              }}
                            />
                            <Tooltip
                              labelFormatter={(label) => {
                                const isDate = label && typeof label === 'string' && label.includes('/');
                                if (isDate) {
                                  let year = new Date(detailedStartDate).getFullYear();
                                  if (label.includes(' ')) {
                                    return `Fecha: ${label}`;
                                  } else {
                                    return `Fecha: ${label}/${year}`;
                                  }
                                }
                                return `Hora: ${label}`;
                              }}
                              formatter={(value: number, name: string) => {
                                const isComparison = name.startsWith('comp_');
                                const rawName = isComparison ? name.replace('comp_', '') : name;
                                
                                let displayName: string;
                                if (isComparison) {
                                  displayName = `${rawName} (${comparisonLote?.localizacion || 'Comparación'})`;
                                } else {
                                  displayName = comparisonLote 
                                    ? `${rawName} (${localizacionNombre})`
                                    : rawName;
                                }
                                return [
                                  <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                                    {displayName}: {value != null ? value.toFixed(1) : '--'} {currentMetric?.unit || ''}
                                  </span>
                                ];
                              }}
                              contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                                padding: "8px 12px"
                              }}
                            />
                            {/* Líneas del lote principal */}
                            {tipoKeys
                              .filter(tipoKey => visibleTipos.has(tipoKey))
                              .map((tipoKey, index) => {
                                // Recalcular el índice basado en la posición original en tipoKeys
                                const originalIndex = tipoKeys.indexOf(tipoKey);
                                return (
                                  <Line
                                    key={tipoKey}
                                    type="monotone"
                                    dataKey={tipoKey}
                                    stroke={colors[originalIndex % colors.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: colors[originalIndex % colors.length] }}
                                    activeDot={{ r: 6, fill: colors[originalIndex % colors.length] }}
                                    connectNulls={true}
                                    isAnimationActive={true}
                                    animationDuration={300}
                                  />
                                );
                              })}
                            {/* Líneas del lote de comparación */}
                            {comparisonKeys
                              .filter(compKey => {
                                const originalKey = compKey.replace('comp_', '');
                                return visibleTipos.has(originalKey);
                              })
                              .map((compKey, index) => {
                                const originalKey = compKey.replace('comp_', '');
                                let tipoIndex = tipoKeys.indexOf(originalKey);
                                if (tipoIndex === -1) {
                                  tipoIndex = index;
                                }
                                const strokeColor = comparisonColors[tipoIndex % comparisonColors.length];
                                return (
                                  <Line
                                    key={compKey}
                                    type="monotone"
                                    dataKey={compKey}
                                    stroke={strokeColor}
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 3, fill: strokeColor }}
                                    activeDot={{ r: 5, fill: strokeColor }}
                                    connectNulls={true}
                                    isAnimationActive={true}
                                    animationDuration={300}
                                  />
                                );
                              })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Leyenda con checkboxes - siempre visible cuando hay datos */}
                      {finalChartData.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                          {comparisonLote ? (
                            // Leyenda cuando hay comparación
                            <div className="flex flex-wrap items-center gap-6 justify-center">
                              {/* Leyenda del lote principal */}
                              <div className="flex flex-col gap-2">
                                <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                  {localizacionNombre}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {tipoKeys.map((tipoKey, index) => {
                                    const isVisible = visibleTipos.has(tipoKey);
                                    return (
                                      <div key={tipoKey} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isVisible}
                                          onChange={(e) => {
                                            const newVisibleTipos = new Set(visibleTipos);
                                            if (e.target.checked) {
                                              newVisibleTipos.add(tipoKey);
                                            } else {
                                              newVisibleTipos.delete(tipoKey);
                                            }
                                            setVisibleTipos(newVisibleTipos);
                                          }}
                                          className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-500 focus:ring-blue-600"
                                        />
                                        <div 
                                          className="w-4 h-0.5" 
                                          style={{ backgroundColor: colors[index % colors.length] }}
                                        />
                                        <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono">
                                          {tipoKey}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Separador */}
                              <div className="w-px h-12 bg-gray-300 dark:bg-neutral-600"></div>
                              
                              {/* Leyenda del lote de comparación */}
                              <div className="flex flex-col gap-2">
                                <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                  {comparisonLote.localizacion}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {tipoKeys.map((tipoKey, index) => {
                                    const compKey = `comp_${tipoKey}`;
                                    const hasComparisonData = finalChartData.some(point => point[compKey] !== undefined && point[compKey] !== null);
                                    if (!hasComparisonData) return null;
                                    
                                    const isVisible = visibleTipos.has(tipoKey);
                                    return (
                                      <div key={compKey} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isVisible}
                                          onChange={(e) => {
                                            const newVisibleTipos = new Set(visibleTipos);
                                            if (e.target.checked) {
                                              newVisibleTipos.add(tipoKey);
                                            } else {
                                              newVisibleTipos.delete(tipoKey);
                                            }
                                            setVisibleTipos(newVisibleTipos);
                                          }}
                                          className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-500 focus:ring-blue-600"
                                        />
                                        <div 
                                          className="w-4 h-0.5 border-dashed border-t-2" 
                                          style={{ borderColor: comparisonColors[index % comparisonColors.length] }}
                                        />
                                        <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono">
                                          {tipoKey}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Leyenda cuando solo hay un lote
                            <div className="flex flex-wrap items-center gap-3 justify-center">
                              {tipoKeys.map((tipoKey, index) => {
                                const isVisible = visibleTipos.has(tipoKey);
                                return (
                                  <div key={tipoKey} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isVisible}
                                      onChange={(e) => {
                                        const newVisibleTipos = new Set(visibleTipos);
                                        if (e.target.checked) {
                                          newVisibleTipos.add(tipoKey);
                                        } else {
                                          newVisibleTipos.delete(tipoKey);
                                        }
                                        setVisibleTipos(newVisibleTipos);
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-500 focus:ring-blue-600"
                                    />
                                    <div 
                                      className="w-4 h-0.5" 
                                      style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono">
                                      {tipoKey}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recomendaciones de Umbrales */}
      {showThresholdModal && thresholdRecommendations && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-neutral-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white font-mono tracking-wider">
                Recomendaciones de Umbrales
              </h2>
              <button
                onClick={() => {
                  setShowThresholdModal(false);
                  setThresholdRecommendations(null);
                }}
                className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 text-sm text-gray-600 dark:text-neutral-400 font-mono">
                <p className="mb-2">
                  Basado en el análisis de fluctuación de los datos en el intervalo seleccionado, se recomiendan los siguientes umbrales para cada tipo de sensor:
                </p>
                <p className="text-xs">
                  Los umbrales se calculan usando percentiles (5% y 95%) con un margen de seguridad basado en la desviación estándar.
                </p>
              </div>

              <div className="space-y-6">
                {Object.keys(thresholdRecommendations).map(loteId => {
                  const loteRecommendations = thresholdRecommendations[loteId];
                  const isMainLote = loteId.startsWith(`localizacion_${localizacionIds.join('_')}`);
                  const loteName = isMainLote 
                    ? localizacionNombre
                    : (comparisonLote?.localizacion || 'Localización de Comparación');
                  
                  return (
                    <div key={loteId} className="space-y-4">
                      <h3 className="text-xl font-bold text-blue-500 dark:text-blue-500 font-mono border-b border-gray-300 dark:border-neutral-700 pb-2">
                        {loteName}
                      </h3>
                      {Object.keys(loteRecommendations).map(label => {
                        const rec = loteRecommendations[label];
                        
                        if (!rec) return null;
                        
                        return (
                          <div
                            key={`${loteId}_${label}`}
                            className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 border border-gray-300 dark:border-neutral-700"
                          >
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white font-mono mb-3">
                              {label}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Umbral Mínimo Recomendado</label>
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                                  {rec.min.toFixed(2)} {currentMetric?.unit || ''}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Umbral Máximo Recomendado</label>
                                <div className="text-lg font-bold text-red-600 dark:text-red-400 font-mono">
                                  {rec.max.toFixed(2)} {currentMetric?.unit || ''}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Promedio</label>
                                <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                                  {rec.avg.toFixed(2)} {currentMetric?.unit || ''}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Desviación Estándar</label>
                                <div className="text-lg font-semibold text-gray-700 dark:text-neutral-300 font-mono">
                                  {rec.stdDev.toFixed(2)} {currentMetric?.unit || ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MetricaPorLoteModal;
