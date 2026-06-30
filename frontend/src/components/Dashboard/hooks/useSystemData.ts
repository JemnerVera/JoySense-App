/**
 * Hook personalizado para cargar datos del sistema
 */

import { useCallback, useEffect, useState } from 'react';
import { JoySenseService } from '../../../services/backend-api';

interface UseSystemDataReturn {
  metricas: any[];
  tipos: any[];
  sensores: any[];
  ubicaciones: any[];
  loading: boolean;
  error: string | null;
  loadMetricas: () => Promise<void>;
  loadTipos: () => Promise<void>;
  loadSensores: () => Promise<void>;
  loadUbicaciones: () => Promise<void>;
}

export function useSystemData(): UseSystemDataReturn {
  const [metricas, setMetricas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetricas = useCallback(async () => {
    try {
      const data = await JoySenseService.getMetricas();
      setMetricas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useSystemData] Error loading metricas:', err);
      setError('Error cargando métricas');
    }
  }, []);

  const loadTipos = useCallback(async () => {
    try {
      const data = await JoySenseService.getTipos();
      setTipos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useSystemData] Error loading tipos:', err);
      setError('Error cargando tipos');
    }
  }, []);

  const loadSensores = useCallback(async () => {
    try {
      const data = await JoySenseService.getSensores();
      setSensores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useSystemData] Error loading sensores:', err);
      setError('Error cargando sensores');
    }
  }, []);

  const loadUbicaciones = useCallback(async () => {
    try {
      const data = await JoySenseService.getUbicaciones();
      setUbicaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useSystemData] Error loading ubicaciones:', err);
      setError('Error cargando ubicaciones');
    }
  }, []);

  useEffect(() => {
    loadMetricas();
    loadTipos();
    loadSensores();
  }, [loadMetricas, loadTipos, loadSensores]);

  return {
    metricas,
    tipos,
    sensores,
    ubicaciones,
    loading,
    error,
    loadMetricas,
    loadTipos,
    loadSensores,
    loadUbicaciones
  };
}
