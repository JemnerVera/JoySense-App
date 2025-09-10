import { useState, useEffect, useCallback } from 'react';
import { DashboardService, DashboardFilters, DashboardData } from '../services/dashboardService';

export interface UseDashboardState {
  // Datos
  mediciones: any[];
  metricas: any[];
  nodos: any[];
  tipos: any[];
  entidades: any[];
  
  // Estados de filtros
  selectedMetrica: number | null;
  selectedNodos: number[];
  selectedTipos: number[];
  
  // Estados de UI
  loading: boolean;
  error: string | null;
  
  // Estadísticas
  stats: {
    totalMediciones: number;
    metricasUnicas: number;
    nodosUnicos: number;
    tiposUnicos: number;
    rangoFechas: { inicio: string; fin: string } | null;
  };
}

export interface UseDashboardActions {
  // Acciones de filtros
  setSelectedMetrica: (metricaId: number | null) => void;
  toggleNodo: (nodoId: number) => void;
  toggleTipo: (tipoId: number) => void;
  clearFilters: () => void;
  resetNodeAndTypeFilters: () => void;
  
  // Acciones de datos
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

export function useDashboard(initialFilters: DashboardFilters) {
  // Estados de datos
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [nodos, setNodos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [entidades, setEntidades] = useState<any[]>([]);
  
  // Estados de filtros
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null);
  const [selectedNodos, setSelectedNodos] = useState<number[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<number[]>([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros base
  const [baseFilters, setBaseFilters] = useState<DashboardFilters>(initialFilters);

  // Cargar datos del dashboard
  const loadDashboardData = useCallback(async (filters: DashboardFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useDashboard: Cargando datos con filtros:', filters);
      
      const data: DashboardData = await DashboardService.getDashboardData(filters);
      
      setMediciones(data.mediciones);
      setMetricas(data.metricas);
      setNodos(data.nodos);
      setTipos(data.tipos);
      setEntidades(data.entidades);
      
      // Inicializar filtros si no están seleccionados
      if (selectedMetrica === null && data.metricas.length > 0) {
        setSelectedMetrica(data.metricas[0].metricaid);
      }
      
      // Inicializar TODOS los nodos por defecto para mostrar el gráfico completo
      if (selectedNodos.length === 0 && data.nodos.length > 0) {
        setSelectedNodos(data.nodos.map(n => n.nodoid));
      }
      
      // Inicializar TODOS los tipos por defecto para mostrar todas las líneas en la leyenda
      if (selectedTipos.length === 0 && data.tipos.length > 0) {
        setSelectedTipos(data.tipos.map(t => t.tipoid));
      }
      
      console.log('✅ useDashboard: Datos cargados exitosamente');
      
    } catch (err) {
      console.error('❌ useDashboard: Error cargando datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [selectedMetrica, selectedNodos, selectedTipos]);

  // Efecto para cargar datos cuando cambian los filtros base
  useEffect(() => {
    loadDashboardData(baseFilters);
  }, [baseFilters, loadDashboardData]);

  // Actualizar filtros base
  const updateBaseFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setBaseFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Obtener mediciones filtradas
  const getFilteredMediciones = useCallback(() => {
    // Ahora siempre habrá nodos seleccionados por defecto, pero verificamos por seguridad
    if (selectedNodos.length === 0) {
      console.log('🔍 useDashboard: No hay nodos seleccionados, no mostrando mediciones');
      return [];
    }
    
    const filters: DashboardFilters = {
      ...baseFilters,
      metricaId: selectedMetrica || undefined,
      nodoIds: selectedNodos,
      tipoIds: selectedTipos.length > 0 ? selectedTipos : undefined
    };
    
    console.log('🔍 useDashboard: Aplicando filtros:', filters);
    const filtered = DashboardService.filterMediciones(mediciones, filters);
    console.log('🔍 useDashboard: Mediciones filtradas:', filtered.length);
    
    return filtered;
  }, [mediciones, baseFilters, selectedMetrica, selectedNodos, selectedTipos]);

  // Acciones de filtros
  const toggleNodo = useCallback((nodoId: number) => {
    setSelectedNodos(prev => {
      if (prev.includes(nodoId)) {
        return prev.filter(id => id !== nodoId);
      } else {
        return [...prev, nodoId];
      }
    });
  }, []);

  const toggleTipo = useCallback((tipoId: number) => {
    setSelectedTipos(prev => {
      if (prev.includes(tipoId)) {
        return prev.filter(id => id !== tipoId);
      } else {
        return [...prev, tipoId];
      }
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedMetrica(null);
    // Mantener TODOS los nodos seleccionados por defecto
    if (nodos.length > 0) {
      setSelectedNodos(nodos.map(n => n.nodoid));
    } else {
      setSelectedNodos([]);
    }
    // Mantener TODOS los tipos seleccionados por defecto
    if (tipos.length > 0) {
      setSelectedTipos(tipos.map(t => t.tipoid));
    } else {
      setSelectedTipos([]);
    }
  }, [nodos, tipos]);

  const resetNodeAndTypeFilters = useCallback(() => {
    // Resetear nodos y tipos a TODOS los disponibles, manteniendo la métrica
    if (nodos.length > 0) {
      setSelectedNodos(nodos.map(n => n.nodoid));
    } else {
      setSelectedNodos([]);
    }
    if (tipos.length > 0) {
      setSelectedTipos(tipos.map(t => t.tipoid));
    } else {
      setSelectedTipos([]);
    }
  }, [nodos, tipos]);

  // Acciones de datos
  const refreshData = useCallback(async () => {
    await loadDashboardData(baseFilters);
  }, [loadDashboardData, baseFilters]);

  const clearCache = useCallback(() => {
    DashboardService.clearCache();
  }, []);

  // Calcular estadísticas
  const stats = DashboardService.getDataStats(mediciones);

  // Estado actual
  const state: UseDashboardState = {
    mediciones: getFilteredMediciones(),
    metricas,
    nodos,
    tipos,
    entidades,
    selectedMetrica,
    selectedNodos,
    selectedTipos,
    loading,
    error,
    stats
  };

  // Acciones
  const actions: UseDashboardActions = {
    setSelectedMetrica,
    toggleNodo,
    toggleTipo,
    clearFilters,
    resetNodeAndTypeFilters,
    refreshData,
    clearCache
  };

  return {
    state,
    actions,
    updateBaseFilters
  };
}