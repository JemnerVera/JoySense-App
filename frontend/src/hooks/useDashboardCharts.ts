import { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../contexts/FilterContext';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

export interface DashboardChartsState {
  sensorStatusChart: ChartData | null;
  measurementsChart: ChartData | null;
  alertsChart: ChartData | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardCharts() {
  const { 
    paisSeleccionado, 
    empresaSeleccionada, 
    fundoSeleccionado
  } = useFilters();

  const [sensorStatusChart, setSensorStatusChart] = useState<ChartData | null>(null);
  const [measurementsChart, setMeasurementsChart] = useState<ChartData | null>(null);
  const [alertsChart, setAlertsChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar datos de ejemplo para los gráficos
  const generateChartData = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // Datos para gráfico de estado de sensores
      const sensorStatusData: ChartData = {
        labels: ['Activos', 'Inactivos', 'Mantenimiento', 'Error'],
        datasets: [{
          label: 'Estado de Sensores',
          data: [42, 3, 2, 1],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }]
      };

      // Datos para gráfico de mediciones por hora
      const measurementsData: ChartData = {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [
          {
            label: 'Temperatura',
            data: [22, 24, 26, 28, 25, 23],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          },
          {
            label: 'Humedad',
            data: [65, 70, 75, 80, 72, 68],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          },
          {
            label: 'Presión',
            data: [1013, 1015, 1012, 1010, 1014, 1016],
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4
          }
        ]
      };

      // Datos para gráfico de alertas
      const alertsData: ChartData = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
          {
            label: 'Alertas Críticas',
            data: [2, 1, 3, 0, 1, 2, 1],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          },
          {
            label: 'Advertencias',
            data: [5, 3, 7, 4, 6, 3, 4],
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4
          }
        ]
      };

      setSensorStatusChart(sensorStatusData);
      setMeasurementsChart(measurementsData);
      setAlertsChart(alertsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando datos de gráficos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (paisSeleccionado && empresaSeleccionada && fundoSeleccionado) {
      generateChartData();
    }
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, generateChartData]);

  const state: DashboardChartsState = {
    sensorStatusChart,
    measurementsChart,
    alertsChart,
    loading,
    error
  };

  return {
    state,
    refreshCharts: generateChartData
  };
}
