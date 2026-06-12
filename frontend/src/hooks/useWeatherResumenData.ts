import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWeatherData } from './useWeatherData';
import SupabaseRPCService from '../services/supabase-rpc';
import { getIsoWeekDateRange, getCurrentIsoWeek } from '../features/weather/utils/weekYearUtils';
import {
  AccumType,
  getMetricConfig,
} from '../features/weather/utils/metricChartConfig';

export interface DataPoint {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (from fecha field)
  value: number | null;
}

export interface MetricWeekSeries {
  metricName: string;
  label: string;
  unit: string;
  color: string;
  decimals: number;
  accumType: AccumType;
  weekPoints: DataPoint[]; // Valores semana
  cumulativePoints: DataPoint[] | null; // Acumulado o media móvil (si aplica)
}

export interface Fundo {
  id: string;
  name: string;
}

export interface UseWeatherResumenDataResult {
  fundos: Fundo[];
  selectedFundoId: string | null;
  setSelectedFundoId: (fundoId: string | null) => void;
  availableMetrics: Array<{ name: string; label: string }>;
  selectedMetricName: string | null;
  setSelectedMetricName: (metricName: string | null) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  selectedSeries: MetricWeekSeries | null;
  allSeries: MetricWeekSeries[];
  loading: boolean;
  error: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
    formatted: string;
  };
}

export function useWeatherResumenData(): UseWeatherResumenDataResult {
  const { selectedStation } = useWeatherData();
  const currentWeek = getCurrentIsoWeek();

  const [selectedFundoId, setSelectedFundoId] = useState<string | null>(null);
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentWeek.year);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek.week);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundos, setFundos] = useState<Fundo[]>([]);

  // Para ahora, los fondos vienen del selectedStation
  // En el futuro, pueden venir de otra fuente
  useEffect(() => {
    if (selectedStation) {
      setFundos([{ id: selectedStation.id, name: selectedStation.name }]);
      if (!selectedFundoId) {
        setSelectedFundoId(selectedStation.id);
      }
    }
  }, [selectedStation]);

  // Calcular rango de fechas de la semana seleccionada
  const dateRange = useMemo(() => {
    const { startDate, endDate } = getIsoWeekDateRange(selectedYear, selectedWeek);
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');

    const formatPart = (d: Date) => {
      const day = d.getUTCDate().toString().padStart(2, '0');
      const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    };

    const startStr = formatPart(start);
    const endStr = formatPart(end);
    const endYear = end.getUTCFullYear();
    const currentYear = new Date().getFullYear();

    const formatted =
      endYear === currentYear
        ? `${startStr} – ${endStr}/${endYear}`
        : `${startStr}/${start.getUTCFullYear()} – ${endStr}/${endYear}`;

    return { startDate, endDate, formatted };
  }, [selectedYear, selectedWeek]);

  // Fetch datos cuando cambian estación/año/semana
  useEffect(() => {
    if (!selectedStation) {
      setRawData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await SupabaseRPCService.getMedicionesNodoDetallado({
          nodoid: selectedStation.nodoid,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        setRawData(data || []);
      } catch (err) {
        console.error('Error fetching resumen data:', err);
        setError('Error al cargar datos de la semana');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStation, selectedYear, selectedWeek, dateRange]);

  // Procesar datos en series por métrica
  const allSeries = useMemo(() => {
    if (!rawData.length) return [];

    // Agrupar por métrica
    const metricGroups: Record<string, any[]> = {};
    rawData.forEach((record: any) => {
      const metricName = record.metrica_nombre;
      if (!metricName || record.medicion === null) return;

      if (!metricGroups[metricName]) {
        metricGroups[metricName] = [];
      }
      metricGroups[metricName].push(record);
    });

    // Transformar a series
    const series: MetricWeekSeries[] = Object.entries(metricGroups)
      .map(([metricName, records]) => {
        const config = getMetricConfig(metricName);

        // Ordenar por fecha
        const sorted = records.sort((a, b) =>
          a.fecha.localeCompare(b.fecha)
        );

        // Serie de semana (valores puntuales)
        const weekPoints: DataPoint[] = sorted.map((r: any) => {
          const fecha = new Date(r.fecha);
          return {
            date: fecha.toISOString().split('T')[0],
            time: r.fecha.slice(11, 16), // HH:mm
            value: r.medicion,
          };
        });

        // Serie acumulada/media móvil (si aplica)
        let cumulativePoints: DataPoint[] | null = null;

        if (config.accumType === 'cumsum') {
          // Suma acumulada
          let cumsum = 0;
          cumulativePoints = weekPoints.map((point) => ({
            ...point,
            value: point.value !== null ? (cumsum += point.value) : null,
          }));
        } else if (config.accumType === 'moving_avg') {
          // Media móvil de ~24 puntos
          const windowSize = 24;
          cumulativePoints = weekPoints.map((_, idx) => {
            const start = Math.max(0, idx - windowSize + 1);
            const window = weekPoints
              .slice(start, idx + 1)
              .filter((p) => p.value !== null)
              .map((p) => p.value as number);

            const avg = window.length > 0 ? window.reduce((a, b) => a + b, 0) / window.length : null;

            return {
              ...weekPoints[idx],
              value: avg,
            };
          });
        }

        return {
          metricName,
          label: config.label,
          unit: config.unit,
          color: config.color,
          decimals: config.decimals,
          accumType: config.accumType,
          weekPoints,
          cumulativePoints,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return series;
  }, [rawData]);

  // Métricas disponibles
  const availableMetrics = useMemo(() => {
    return allSeries.map((s) => ({ name: s.metricName, label: s.label }));
  }, [allSeries]);

  // Serie seleccionada
  const selectedSeries = useMemo(() => {
    if (!selectedMetricName) return null;
    return allSeries.find((s) => s.metricName === selectedMetricName) || null;
  }, [selectedMetricName, allSeries]);

  // Auto-select primera métrica si hay datos y no hay selección
  useEffect(() => {
    if (availableMetrics.length > 0 && !selectedMetricName) {
      setSelectedMetricName(availableMetrics[0].name);
    }
  }, [availableMetrics, selectedMetricName]);

  return {
    fundos,
    selectedFundoId,
    setSelectedFundoId,
    availableMetrics,
    selectedMetricName,
    setSelectedMetricName,
    selectedYear,
    setSelectedYear,
    selectedWeek,
    setSelectedWeek,
    selectedSeries,
    allSeries,
    loading,
    error,
    dateRange,
  };
}
