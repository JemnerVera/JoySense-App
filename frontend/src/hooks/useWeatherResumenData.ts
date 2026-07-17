import { useState, useEffect, useMemo } from 'react';
import { useWeatherData, isProprietaryStation, transformProprietaryData } from './useWeatherData';
import SupabaseRPCService from '../services/supabase-rpc';
import { getIsoWeekDateRange, getCurrentIsoWeek, getAvailableYears } from '../features/weather/utils/weekYearUtils';
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

export interface UseWeatherResumenDataResult {
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
  availableYearsWithData: number[];
  availableWeeksWithData: Set<number>;
  availabilityLoading: boolean;
}

export function useWeatherResumenData(): UseWeatherResumenDataResult {
  const { selectedStation } = useWeatherData();
  const currentWeek = getCurrentIsoWeek();

  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentWeek.year);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek.week);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekAvailability, setWeekAvailability] = useState<Map<number, Set<number>>>(new Map());
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Reset métrica al cambiar estación
  useEffect(() => {
    setSelectedMetricName(null);
  }, [selectedStation?.nodoid]);

  // Cargar disponibilidad de semanas al cambiar estación o métrica
  useEffect(() => {
    if (!selectedStation || !selectedMetricName) {
      setWeekAvailability(new Map());
      return;
    }

    let cancelled = false;

    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const years = getAvailableYears();
        const rows = await SupabaseRPCService.getSemanasConDatos({
          nodoid: selectedStation.nodoid,
          metricaNombre: selectedMetricName,
          startYear: Math.min(...years),
          endYear: Math.max(...years),
        });

        if (cancelled) return;

        const map = new Map<number, Set<number>>();
        for (const { year_num, week_num } of rows) {
          if (!map.has(year_num)) {
            map.set(year_num, new Set());
          }
          map.get(year_num)!.add(week_num);
        }
        setWeekAvailability(map);
      } catch (err) {
        console.error('Error fetching week availability:', err);
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedStation?.nodoid, selectedMetricName]);

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

  // Derivados: años y semanas con datos disponibles
  const availableYearsWithData = useMemo(() => {
    const years = getAvailableYears();
    return years.filter((y) => weekAvailability.has(y));
  }, [weekAvailability]);

  const availableWeeksWithData = useMemo(() => {
    return weekAvailability.get(selectedYear) ?? new Set<number>();
  }, [weekAvailability, selectedYear]);

  // Auto-seleccionar semana más reciente con data si la selección actual no es válida
  useEffect(() => {
    if (availabilityLoading || weekAvailability.size === 0) return;

    const currentYearWeeks = weekAvailability.get(selectedYear);
    if (currentYearWeeks?.has(selectedWeek)) {
      return; // Selección actual es válida
    }

    // Buscar año+semana más reciente con data
    const sortedYears = [...getAvailableYears()].sort((a, b) => b - a);
    for (const year of sortedYears) {
      const weeks = weekAvailability.get(year);
      if (weeks && weeks.size > 0) {
        setSelectedYear(year);
        setSelectedWeek(Math.max(...weeks));
        return;
      }
    }
  }, [weekAvailability, availabilityLoading, selectedYear, selectedWeek]);

  // Fetch datos cuando cambian año/semana o estación
  useEffect(() => {
    if (!selectedStation) {
      setRawData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mediciones, fluctData, dpvData] = await Promise.all([
          SupabaseRPCService.getMedicionesNodoDetallado({
            nodoid: selectedStation.nodoid,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
          SupabaseRPCService.getFluctuacion({
            nodoid: selectedStation.nodoid,
            fechaDesde: `${dateRange.startDate} 00:00:00`,
            fechaHasta: `${dateRange.endDate} 23:59:59`,
          }),
          SupabaseRPCService.getDpv({
            nodoid: selectedStation.nodoid,
            fechaDesde: `${dateRange.startDate} 00:00:00`,
            fechaHasta: `${dateRange.endDate} 23:59:59`,
          }),
        ]);

        let data = transformProprietaryData(mediciones || [], selectedStation.name);

        const syntheticRecords = [
          ...(fluctData || []).map((f: any) => ({
            fecha: `${f.fecha}T12:00:00`,
            medicion: f.fluctuacion,
            metrica_nombre: 'fluctuacion',
          })),
          ...(dpvData || []).map((d: any) => ({
            fecha: `${d.fecha}T12:00:00`,
            medicion: d.dpv,
            metrica_nombre: 'dpv',
          })),
        ];

        data = [...data, ...syntheticRecords];

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

    const metricGroups: Record<string, any[]> = {};
    rawData.forEach((record: any) => {
      const metricName = record.metrica_nombre;
      if (!metricName || record.medicion === null) return;

      if (!metricGroups[metricName]) {
        metricGroups[metricName] = [];
      }
      metricGroups[metricName].push(record);
    });

    const series: MetricWeekSeries[] = Object.entries(metricGroups)
      .map(([metricName, records]) => {
        const config = getMetricConfig(metricName);

        const sorted = records.sort((a, b) =>
          a.fecha.localeCompare(b.fecha)
        );

        const weekPoints: DataPoint[] = sorted.map((r: any) => {
          const fecha = new Date(r.fecha);
          return {
            date: fecha.toISOString().split('T')[0],
            time: r.fecha.slice(11, 16),
            value: r.medicion,
          };
        });

        let cumulativePoints: DataPoint[] | null = null;

        if (config.accumType === 'cumsum') {
          let cumsum = 0;
          cumulativePoints = weekPoints.map((point) => ({
            ...point,
            value: point.value !== null ? (cumsum += point.value) : null,
          }));
        } else if (config.accumType === 'moving_avg') {
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

        const propStation = isProprietaryStation(selectedStation?.name ?? '');
        return {
          metricName,
          label: propStation && metricName === 'wind_speed_10_min_avg' ? 'Nivel Viento' : config.label,
          unit: propStation && metricName === 'wind_speed_10_min_avg' ? 'nivel' : config.unit,
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

  const availableMetrics = useMemo(() => {
    return allSeries.map((s) => ({ name: s.metricName, label: s.label }));
  }, [allSeries]);

  const selectedSeries = useMemo(() => {
    if (!selectedMetricName) return null;
    return allSeries.find((s) => s.metricName === selectedMetricName) || null;
  }, [selectedMetricName, allSeries]);

  useEffect(() => {
    if (availableMetrics.length > 0 && !selectedMetricName) {
      setSelectedMetricName(availableMetrics[0].name);
    }
  }, [availableMetrics, selectedMetricName]);

  return {
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
    availableYearsWithData,
    availableWeeksWithData,
    availabilityLoading,
  };
}
