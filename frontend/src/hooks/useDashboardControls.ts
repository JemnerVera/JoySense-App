import { useState, useCallback } from 'react';
import { useFilters } from '../contexts/FilterContext';

export interface DashboardControlsState {
  selectedMetrica: number | null;
  selectedNodos: number[];
  selectedTipos: number[];
  loading: boolean;
}

export interface DashboardControlsActions {
  setSelectedMetrica: (metricaId: number | null) => void;
  toggleNodo: (nodoId: number) => void;
  toggleTipo: (tipoId: number) => void;
  clearFilters: () => void;
  resetFilters: () => void;
}

export function useDashboardControls() {
  const { 
    paisSeleccionado, 
    empresaSeleccionada, 
    fundoSeleccionado
  } = useFilters();

  // Estados locales para controles del dashboard
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null);
  const [selectedNodos, setSelectedNodos] = useState<number[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Verificar si los filtros base están completos
  const hasBaseFilters = !!(paisSeleccionado && empresaSeleccionada && fundoSeleccionado);

  // Acciones
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
    setSelectedNodos([]);
    setSelectedTipos([]);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedMetrica(null);
    setSelectedNodos([]);
    setSelectedTipos([]);
  }, []);

  // Estado
  const state: DashboardControlsState = {
    selectedMetrica,
    selectedNodos,
    selectedTipos,
    loading
  };

  // Acciones
  const actions: DashboardControlsActions = {
    setSelectedMetrica,
    toggleNodo,
    toggleTipo,
    clearFilters,
    resetFilters
  };

  return {
    state,
    actions,
    hasBaseFilters
  };
}