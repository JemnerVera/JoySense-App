import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { JoySenseService } from '../../services/backend-api';
import { flushSync } from 'react-dom';

interface MetricaPorLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ubicacionId: number;
  ubicacionNombre: string;
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
  ubicacionid: number;
  nodoid: number;
  tipoid: number;
  metricaid: number;
  medicion: number;
  fecha: string;
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
  ubicacionId,
  ubicacionNombre,
  metricaId: initialMetricaId,
  metricaNombre: initialMetricaNombre,
  startDate: initialStartDate,
  endDate: initialEndDate
}) => {
  // Estados principales
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipos, setTipos] = useState<any[]>([]);
  const [tiposEnDatos, setTiposEnDatos] = useState<number[]>([]);
  const [mediciones, setMediciones] = useState<MedicionData[]>([]);
  
  // Estados para nuevas funcionalidades
  const [selectedMetric, setSelectedMetric] = useState<string>(() => {
    const metricMap: { [key: number]: string } = {
      1: 'temperatura',
      2: 'humedad',
      3: 'conductividad'
    };
    return metricMap[initialMetricaId] || 'temperatura';
  });
  const [detailedStartDate, setDetailedStartDate] = useState<string>(initialStartDate);
  const [detailedEndDate, setDetailedEndDate] = useState<string>(initialEndDate);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [comparisonLote, setComparisonLote] = useState<any>(null);
  const [comparisonMediciones, setComparisonMediciones] = useState<MedicionData[]>([]);
  const [loadingComparisonData, setLoadingComparisonData] = useState(false);
  const [thresholdRecommendations, setThresholdRecommendations] = useState<{ [loteId: string]: { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } } | null>(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [availableLotes, setAvailableLotes] = useState<any[]>([]);
  
  // Refs para cancelar requests
  const loadChartDataAbortControllerRef = useRef<AbortController | null>(null);
  const loadChartDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función auxiliar para obtener metricId desde dataKey
  const getMetricIdFromDataKey = (dataKey: string): number => {
    const metricMap: { [key: string]: number } = {
      'temperatura': 1,
      'humedad': 2,
      'conductividad': 3
    };
    return metricMap[dataKey] || 1;
  };

  // Función para procesar datos del gráfico (definida antes de loadChartData)
  const processChartData = useCallback((
    medicionesFiltradas: MedicionData[],
    tiposUnicos: number[],
    daysDiff: number,
    tiposData: any[]
  ): ChartDataPoint[] => {
    // Determinar granularidad
    const useHours = daysDiff <= 7;
    const useDays = daysDiff > 30;

    // Agrupar por fecha y tipo con granularidad adaptativa
    const dataByTimeAndTipo = new Map<string, { [tipoid: number]: { sum: number; count: number; timestamp: number } }>();

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

      if (!dataByTimeAndTipo.has(timeKey)) {
        dataByTimeAndTipo.set(timeKey, {});
      }

      const timeData = dataByTimeAndTipo.get(timeKey)!;
      const timestamp = fechaObj.getTime();
      
      if (!timeData[medicion.tipoid]) {
        timeData[medicion.tipoid] = { sum: 0, count: 0, timestamp };
      }
      
      timeData[medicion.tipoid].sum += parseFloat(medicion.medicion.toString());
      timeData[medicion.tipoid].count += 1;
      if (timestamp > timeData[medicion.tipoid].timestamp) {
        timeData[medicion.tipoid].timestamp = timestamp;
      }
    });

    // Convertir a array de puntos de datos
    const allTimeStamps = Array.from(dataByTimeAndTipo.entries())
      .map(([timeKey, tiposData]) => {
        const timestamps = Object.values(tiposData).map(t => t.timestamp);
        const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        return { timeKey, timestamp: maxTimestamp };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    const dataPoints: ChartDataPoint[] = allTimeStamps.map(({ timeKey }) => {
      const timeDataByTipo = dataByTimeAndTipo.get(timeKey)!;
      const fechaFormatted = timeKey;

      const point: ChartDataPoint = {
        fecha: timeKey,
        fechaFormatted
      };

      tiposUnicos.forEach(tipoid => {
        const tipo = tiposData.find(t => t.tipoid === tipoid);
        const tipoNombre = tipo?.tipo || `Tipo ${tipoid}`;
        const tipoDataForTipo = timeDataByTipo[tipoid];
        
        if (tipoDataForTipo && tipoDataForTipo.count > 0) {
          const promedio = tipoDataForTipo.sum / tipoDataForTipo.count;
          point[tipoNombre] = promedio;
        } else {
          point[tipoNombre] = null;
        }
      });

      return point;
    });

    return dataPoints;
  }, []);

  // Cargar tipos de sensores y ubicaciones disponibles
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [tiposData, ubicacionesData] = await Promise.all([
          JoySenseService.getTipos(),
          JoySenseService.getUbicaciones()
        ]);
        setTipos(tiposData || []);
        // Filtrar ubicaciones disponibles (excluyendo la actual)
        const lotesDisponibles = (ubicacionesData || []).filter((u: any) => u.ubicacionid !== ubicacionId);
        setAvailableLotes(lotesDisponibles);
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    };
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, ubicacionId]);

  // Cargar datos del gráfico
  const loadChartData = useCallback(async () => {
    if (!isOpen || !ubicacionId || !detailedStartDate || !detailedEndDate) {
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
      // Calcular diferencia de días para determinar estrategia de carga
      const startDateObj = new Date(detailedStartDate + 'T00:00:00');
      const endDateObj = new Date(detailedEndDate + 'T23:59:59');
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

      // Obtener mediciones para el lote y métrica seleccionados
      const medicionesData = await JoySenseService.getMediciones({
        ubicacionId,
        metricaId: currentMetricId,
        startDate: `${detailedStartDate} 00:00:00`,
        endDate: `${detailedEndDate} 23:59:59`,
        getAll: useGetAll,
        limit: !useGetAll ? maxLimit : undefined
      });

      if (abortController.signal.aborted) {
        return;
      }

      // Ordenar por fecha ascendente
      const medicionesFiltradas = Array.isArray(medicionesData)
        ? medicionesData
            .filter((m: any) => m.tipoid && m.medicion != null && !isNaN(m.medicion))
            .map((m: any) => ({ ...m, fechaParsed: new Date(m.fecha).getTime() }))
            .sort((a: any, b: any) => a.fechaParsed - b.fechaParsed)
            .map(({ fechaParsed, ...m }: any) => m)
        : [];

      setMediciones(medicionesFiltradas);

      if (medicionesFiltradas.length === 0) {
        setChartData([]);
        setTiposEnDatos([]);
        setLoading(false);
        return;
      }

      // Obtener tipos únicos en los datos
      const tiposUnicos = Array.from(new Set(medicionesFiltradas.map((m: any) => m.tipoid).filter(Boolean)));
      setTiposEnDatos(tiposUnicos);

      // Procesar datos para el gráfico
      const processedData = processChartData(medicionesFiltradas, tiposUnicos, daysDiff, tipos);
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
  }, [isOpen, ubicacionId, selectedMetric, detailedStartDate, detailedEndDate, tipos, processChartData]);

  // Cargar datos de comparación
  const loadComparisonMediciones = useCallback(async (comparisonLote: any) => {
    if (!comparisonLote || !detailedStartDate || !detailedEndDate) {
      return;
    }

    setLoadingComparisonData(true);
    try {
      const startDateObj = new Date(detailedStartDate + 'T00:00:00');
      const endDateObj = new Date(detailedEndDate + 'T23:59:59');
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

      const comparisonData = await JoySenseService.getMediciones({
        ubicacionId: comparisonLote.ubicacionid,
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

      const sortedComparisonData = comparisonData
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

    const startDate = new Date(detailedStartDate + 'T00:00:00');
    const endDate = new Date(detailedEndDate + 'T23:59:59');
    const currentMetricId = getMetricIdFromDataKey(selectedMetric);
    
    // Función auxiliar para calcular recomendaciones
    const calculateRecommendations = (medicionesData: MedicionData[]): { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } => {
      const filteredMediciones = medicionesData.filter(m => {
        const medicionDate = new Date(m.fecha);
        return medicionDate >= startDate && medicionDate <= endDate && m.metricaid === currentMetricId;
      });

      if (filteredMediciones.length === 0) {
        return {};
      }

      const medicionesPorTipo: { [tipoid: number]: number[] } = {};
      
      filteredMediciones.forEach(m => {
        if (!medicionesPorTipo[m.tipoid]) {
          medicionesPorTipo[m.tipoid] = [];
        }
        if (m.medicion != null && !isNaN(m.medicion)) {
          medicionesPorTipo[m.tipoid].push(m.medicion);
        }
      });

      const recommendations: { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } = {};
      
      Object.keys(medicionesPorTipo).forEach(tipoidStr => {
        const tipoid = parseInt(tipoidStr);
        const valores = medicionesPorTipo[tipoid];
        
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
        
        recommendations[tipoid] = {
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

    const allRecommendations: { [loteId: string]: { [tipoid: number]: { min: number; max: number; avg: number; stdDev: number } } } = {
      [`lote_${ubicacionId}`]: mainLoteRecommendations
    };

    // Si hay lote de comparación, calcular también sus recomendaciones
    if (comparisonLote && comparisonMediciones.length > 0) {
      const comparisonRecommendations = calculateRecommendations(comparisonMediciones);
      if (Object.keys(comparisonRecommendations).length > 0) {
        allRecommendations[`lote_${comparisonLote.ubicacionid}`] = comparisonRecommendations;
      }
    }

    setThresholdRecommendations(allRecommendations);
    setShowThresholdModal(true);
  }, [mediciones, comparisonMediciones, tipos, detailedStartDate, detailedEndDate, selectedMetric, ubicacionId, comparisonLote]);

  // Recargar datos cuando cambien las fechas o métrica
  useEffect(() => {
    if (!isOpen || !ubicacionId || !detailedStartDate || !detailedEndDate) {
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
  }, [detailedStartDate, detailedEndDate, selectedMetric, isOpen, ubicacionId, loadChartData]);

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
    }
  }, [isOpen, initialMetricaId, initialStartDate, initialEndDate]);

  if (!isOpen) return null;

  // Procesar datos de comparación si están disponibles
  // CRÍTICO: Usar EXACTAMENTE la misma lógica de granularidad que processChartData
  const processComparisonData = (comparisonData: MedicionData[], dataKey: string): ChartDataPoint[] => {
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
    
    // Obtener tipos únicos en los datos de comparación
    const tiposUnicos = Array.from(new Set(filteredMediciones.map(m => m.tipoid).filter(Boolean)));
    
    // Agrupar por fecha y tipo con granularidad adaptativa (MISMA LÓGICA QUE processChartData)
    const dataByTimeAndTipo = new Map<string, { [tipoid: number]: { sum: number; count: number; timestamp: number } }>();
    
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
      
      if (!dataByTimeAndTipo.has(timeKey)) {
        dataByTimeAndTipo.set(timeKey, {});
      }
      
      const timeData = dataByTimeAndTipo.get(timeKey)!;
      const timestamp = fechaObj.getTime();
      
      if (!timeData[medicion.tipoid]) {
        timeData[medicion.tipoid] = { sum: 0, count: 0, timestamp };
      }
      
      timeData[medicion.tipoid].sum += parseFloat(medicion.medicion.toString());
      timeData[medicion.tipoid].count += 1;
      if (timestamp > timeData[medicion.tipoid].timestamp) {
        timeData[medicion.tipoid].timestamp = timestamp;
      }
    });
    
    // Convertir a array de puntos de datos (MISMA LÓGICA QUE processChartData)
    const allTimeStamps = Array.from(dataByTimeAndTipo.entries())
      .map(([timeKey, tiposData]) => {
        const timestamps = Object.values(tiposData).map(t => t.timestamp);
        const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        return { timeKey, timestamp: maxTimestamp };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const dataPoints: ChartDataPoint[] = allTimeStamps.map(({ timeKey }) => {
      const timeDataByTipo = dataByTimeAndTipo.get(timeKey)!;
      const fechaFormatted = timeKey;
      
      const point: ChartDataPoint = {
        fecha: timeKey,
        fechaFormatted,
        time: timeKey // Agregar 'time' para compatibilidad con combineChartData
      };
      
      tiposUnicos.forEach(tipoid => {
        const tipo = tipos.find(t => t.tipoid === tipoid);
        const tipoNombre = tipo?.tipo || `Tipo ${tipoid}`;
        const tipoDataForTipo = timeDataByTipo[tipoid];
        
        if (tipoDataForTipo && tipoDataForTipo.count > 0) {
          const promedio = tipoDataForTipo.sum / tipoDataForTipo.count;
          point[tipoNombre] = promedio;
        } else {
          point[tipoNombre] = null;
        }
      });
      
      return point;
    });
    
    return dataPoints;
  };

  // Combinar datos principales con datos de comparación
  // CRÍTICO: Incluir TODOS los timeKeys de ambos datasets para que las líneas se rendericen
  // CRÍTICO: PRESERVAR SIEMPRE los datos del lote principal
  const finalChartData = (() => {
    if (!comparisonLote || comparisonMediciones.length === 0) {
      return chartData;
    }

    const comparisonChartData = processComparisonData(comparisonMediciones, selectedMetric);
    
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
    
    // Convertir a array y ordenar
    return Array.from(timeMap.values()).sort((a, b) => {
      const timeA = a.fecha || a.fechaFormatted;
      const timeB = b.fecha || b.fechaFormatted;
      
      if (timeA.includes('/') && timeB.includes('/')) {
        const [dayA, monthA] = timeA.split(' ')[0].split('/').map(Number);
        const [dayB, monthB] = timeB.split(' ')[0].split('/').map(Number);
        const year = new Date(detailedStartDate).getFullYear();
        const dateA = new Date(year, monthA - 1, dayA).getTime();
        const dateB = new Date(year, monthB - 1, dayB).getTime();
        return dateA - dateB;
      }
      
      return timeA.localeCompare(timeB);
    });
  })();

  const currentMetric = getTranslatedMetrics().find(m => m.dataKey === selectedMetric);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header con botones de métricas */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-neutral-700">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white font-mono tracking-wider">
                EVOLUCIÓN DE MÉTRICA EN EL TIEMPO
              </h2>
              {/* Botones de métricas en el header */}
              <div className="flex space-x-2">
                {getTranslatedMetrics().map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => setSelectedMetric(metric.dataKey)}
                    disabled={loading}
                    className={`px-3 py-1 rounded-lg font-mono tracking-wider transition-colors text-sm ${
                      selectedMetric === metric.dataKey
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {metric.title}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                <div className="flex flex-wrap items-start gap-4">
                  {/* Intervalo de Fechas */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 dark:text-neutral-300 font-mono mb-2">Intervalo Fechas:</label>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <input
                          type="date"
                          value={tempStartDate || detailedStartDate}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            setTempStartDate(newStartDate);
                            
                            if (newStartDate && newStartDate.length === 10 && newStartDate !== detailedStartDate) {
                              flushSync(() => {
                                setLoading(true);
                                if (newStartDate && detailedEndDate && new Date(newStartDate) > new Date(detailedEndDate)) {
                                  setDetailedStartDate(newStartDate);
                                  setDetailedEndDate(newStartDate);
                                  setTempEndDate(newStartDate);
                                } else {
                                  setDetailedStartDate(newStartDate);
                                }
                                setTempStartDate('');
                              });
                            }
                          }}
                          onBlur={(e) => {
                            const newStartDate = e.target.value;
                            if (newStartDate && newStartDate === tempStartDate && newStartDate !== detailedStartDate) {
                              if (newStartDate && detailedEndDate && new Date(newStartDate) > new Date(detailedEndDate)) {
                                setDetailedStartDate(newStartDate);
                                setDetailedEndDate(newStartDate);
                                setTempEndDate(newStartDate);
                              } else {
                                setDetailedStartDate(newStartDate);
                              }
                              setTempStartDate('');
                            }
                          }}
                          max={detailedEndDate || undefined}
                          disabled={loading}
                          className={`h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-xs ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label className="text-xs text-gray-600 dark:text-neutral-400 mt-1 font-mono">Fecha Inicio</label>
                      </div>
                      <div className="flex flex-col">
                        <input
                          type="date"
                          value={tempEndDate || detailedEndDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value;
                            setTempEndDate(newEndDate);
                            
                            if (newEndDate && newEndDate.length === 10 && newEndDate !== detailedEndDate) {
                              if (newEndDate && detailedStartDate && new Date(newEndDate) < new Date(detailedStartDate)) {
                                alert('La fecha final no puede ser menor que la fecha inicial. Por favor, seleccione una fecha válida.');
                                setTempEndDate('');
                                return;
                              }
                              
                              flushSync(() => {
                                setLoading(true);
                                setDetailedEndDate(newEndDate);
                                setTempEndDate('');
                              });
                            }
                          }}
                          onBlur={(e) => {
                            const newEndDate = e.target.value;
                            if (newEndDate && newEndDate === tempEndDate && newEndDate !== detailedEndDate) {
                              if (newEndDate && detailedStartDate && new Date(newEndDate) < new Date(detailedStartDate)) {
                                alert('La fecha final no puede ser menor que la fecha inicial. Por favor, seleccione una fecha válida.');
                                setTempEndDate('');
                                return;
                              }
                              setDetailedEndDate(newEndDate);
                              setTempEndDate('');
                            }
                          }}
                          min={detailedStartDate || undefined}
                          disabled={loading}
                          className={`h-8 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-xs ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label className="text-xs text-gray-600 dark:text-neutral-400 mt-1 font-mono">Fecha Fin</label>
                      </div>
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
                        value={comparisonLote?.ubicacionid || ''}
                        onChange={(e) => {
                          const loteId = parseInt(e.target.value);
                          if (loteId && loteId !== ubicacionId) {
                            const lote = availableLotes.find(l => l.ubicacionid === loteId);
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
                        className="h-8 px-3 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white font-mono text-sm min-w-[200px] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors dashboard-scrollbar"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#22c55e #d1d5db'
                        }}
                      >
                        <option value="">Ninguno</option>
                        {availableLotes.map(lote => (
                          <option key={lote.ubicacionid} value={lote.ubicacionid}>
                            {lote.ubicacion}
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
                    {ubicacionNombre}
                    {comparisonLote && ` vs ${comparisonLote.ubicacion}`}
                  </h3>
                </div>
                {(() => {
                  if (loading) {
                    return (
                      <div className="h-96 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
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

                  const tipoKeys = Object.keys(finalChartData[0] || {}).filter(key => key !== 'fecha' && key !== 'fechaFormatted' && !key.startsWith('comp_'));
                  const comparisonKeys = Object.keys(finalChartData[0] || {}).filter(key => key.startsWith('comp_'));
                  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
                  const comparisonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4'];

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
                              domain={yAxisDomain.min !== null || yAxisDomain.max !== null ? [yAxisDomain.min ?? 'auto', yAxisDomain.max ?? 'auto'] : ['auto', 'auto']}
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
                                let displayName: string;
                                if (isComparison) {
                                  displayName = `${name.replace('comp_', '')} (${comparisonLote?.ubicacion || 'Comparación'})`;
                                } else {
                                  displayName = comparisonLote 
                                    ? `${name} (${ubicacionNombre})`
                                    : name;
                                }
                                return [
                                  <span key="value" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                                    {displayName}: {value ? value.toFixed(1) : '--'} {currentMetric?.unit || ''}
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
                            {!comparisonLote && (
                              <Legend
                                wrapperStyle={{ color: '#9ca3af', fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                              />
                            )}
                            {/* Líneas del lote principal */}
                            {tipoKeys.map((tipoKey, index) => (
                              <Line
                                key={tipoKey}
                                type="monotone"
                                dataKey={tipoKey}
                                stroke={colors[index % colors.length]}
                                strokeWidth={3}
                                dot={{ r: 4, fill: colors[index % colors.length] }}
                                activeDot={{ r: 6, fill: colors[index % colors.length] }}
                                connectNulls={true}
                                isAnimationActive={true}
                                animationDuration={300}
                              />
                            ))}
                            {/* Líneas del lote de comparación */}
                            {comparisonKeys.map((compKey, index) => {
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
                      {/* Leyenda de colores por lote cuando hay comparación */}
                      {comparisonLote && (
                        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-neutral-600">
                          <div className="flex flex-wrap items-center gap-6 justify-center">
                            {/* Leyenda del lote principal */}
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                {ubicacionNombre}
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {tipoKeys.map((tipoKey, index) => (
                                  <div key={tipoKey} className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-0.5" 
                                      style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <span className="text-xs text-gray-600 dark:text-neutral-400 font-mono">
                                      {tipoKey}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Separador */}
                            <div className="w-px h-12 bg-gray-300 dark:bg-neutral-600"></div>
                            
                            {/* Leyenda del lote de comparación */}
                            <div className="flex flex-col gap-2">
                              <div className="text-xs font-bold text-gray-700 dark:text-neutral-300 font-mono">
                                {comparisonLote.ubicacion}
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {tipoKeys.map((tipoKey, index) => {
                                  const compKey = `comp_${tipoKey}`;
                                  const hasComparisonData = finalChartData.some(point => point[compKey] !== undefined && point[compKey] !== null);
                                  if (!hasComparisonData) return null;
                                  
                                  return (
                                    <div key={compKey} className="flex items-center gap-2">
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
                  const isMainLote = loteId.startsWith(`lote_${ubicacionId}`);
                  const loteName = isMainLote 
                    ? ubicacionNombre
                    : (comparisonLote?.ubicacion || 'Lote de Comparación');
                  
                  return (
                    <div key={loteId} className="space-y-4">
                      <h3 className="text-xl font-bold text-green-600 dark:text-green-400 font-mono border-b border-gray-300 dark:border-neutral-700 pb-2">
                        {loteName}
                      </h3>
                      {Object.keys(loteRecommendations).map(tipoidStr => {
                        const tipoid = parseInt(tipoidStr);
                        const tipo = tipos.find(t => t.tipoid === tipoid);
                        const rec = loteRecommendations[tipoid];
                        
                        if (!tipo || !rec) return null;
                        
                        return (
                          <div
                            key={`${loteId}_${tipoid}`}
                            className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 border border-gray-300 dark:border-neutral-700"
                          >
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white font-mono mb-3">
                              {tipo.tipo}
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
