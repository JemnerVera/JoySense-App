/**
 * Hook personalizado para cargar datos del sistema
 * Encapsula: metricas, tipos, sensores, entidades, ubicaciones
 */

import { useCallback, useEffect, useState } from 'react';
import { JoySenseService } from '../../../services/backend-api';

interface UseSystemDataReturn {
  metricas: any[];
  tipos: any[];
  sensores: any[];
  entidades: any[];
  ubicaciones: any[];
  loading: boolean;
  error: string | null;
  loadMetricas: () => Promise<void>;
  loadTipos: () => Promise<void>;
  loadSensores: () => Promise<void>;
  loadEntidades: (ubicacionId?: number) => Promise<void>;
  loadUbicaciones: () => Promise<void>;
}

export function useSystemData(): UseSystemDataReturn {
  const [metricas, setMetricas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [entidades, setEntidades] = useState<any[]>([]);
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

  const loadEntidades = useCallback(async (ubicacionId?: number) => {
    try {
      const data = await JoySenseService.getEntidades(ubicacionId);
      setEntidades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useSystemData] Error loading entidades:', err);
      setError('Error cargando entidades');
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

  // Cargar datos iniciales
  useEffect(() => {
    loadMetricas();
    loadTipos();
    loadSensores();
    loadEntidades();
  }, [loadMetricas, loadTipos, loadSensores, loadEntidades]);

  return {
    metricas,
    tipos,
    sensores,
    entidades,
    ubicaciones,
    loading,
    error,
    loadMetricas,
    loadTipos,
    loadSensores,
    loadEntidades,
    loadUbicaciones
  };
}
