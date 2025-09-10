import { useState, useEffect } from 'react';
import { JoySenseService } from '../services/backend-api';

interface DashboardData {
  metricas: any[];
  nodos: any[];
  tipos: any[];
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (): DashboardData => {
  const [metricas, setMetricas] = useState<any[]>([]);
  const [nodos, setNodos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar datos específicos del dashboard
        const [metricasData, nodosData, tiposData] = await Promise.all([
          JoySenseService.getTableData('metricasensor'),
          JoySenseService.getTableData('nodo'),
          JoySenseService.getTableData('tipo')
        ]);

        setMetricas(metricasData || []);
        setNodos(nodosData || []);
        setTipos(tiposData || []);

      } catch (err: any) {
        console.error('Error cargando datos del dashboard:', err);
        setError(err.message || 'Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return {
    metricas,
    nodos,
    tipos,
    loading,
    error
  };
};
