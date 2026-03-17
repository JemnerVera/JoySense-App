import { useCallback } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { useFilterData } from './useFilterData';

export const useCascadingFilters = () => {
  const {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    ubicacionSeleccionada,
    setPaisSeleccionado,
    setEmpresaSeleccionada,
    setFundoSeleccionado,
    setUbicacionSeleccionada,
    showDetailedAnalysis,
  } = useFilters();
  
  // Obtener el array de ubicaciones para convertir IDs a objetos
  const { ubicaciones = [] } = useFilterData('');

  // Función para manejar el cambio de país con cascada
  const handlePaisChange = useCallback((paisId: string) => {
    // GUARD: Bloquear cambios de filtros cuando el análisis detallado está abierto
    if (showDetailedAnalysis) {
      console.warn('[useCascadingFilters] Cambio de país bloqueado: análisis detallado abierto');
      return;
    }
    
    setPaisSeleccionado(paisId);
    // Limpiar empresa, fundo y ubicación cuando cambia el país
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada, showDetailedAnalysis]);

  // Función para manejar el cambio de empresa con cascada
  const handleEmpresaChange = useCallback((empresaId: string) => {
    // GUARD: Bloquear cambios de filtros cuando el análisis detallado está abierto
    if (showDetailedAnalysis) {
      console.warn('[useCascadingFilters] Cambio de empresa bloqueado: análisis detallado abierto');
      return;
    }
    
    setEmpresaSeleccionada(empresaId);
    // Limpiar fundo y ubicación cuando cambia la empresa
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada, showDetailedAnalysis]);

  // Función para manejar el cambio de fundo con cascada
  const handleFundoChange = useCallback((fundoId: string) => {
    // GUARD: Bloquear cambios de filtros cuando el análisis detallado está abierto
    if (showDetailedAnalysis) {
      console.warn('[useCascadingFilters] Cambio de fundo bloqueado: análisis detallado abierto');
      return;
    }
    
    setFundoSeleccionado(fundoId);
    // Limpiar ubicación cuando cambia el fundo
    setUbicacionSeleccionada(null);
  }, [setFundoSeleccionado, setUbicacionSeleccionada, showDetailedAnalysis]);

  // Función para manejar el cambio de ubicación
  const handleUbicacionChange = useCallback((ubicacionId: string) => {
    // GUARD: Bloquear cambios de filtros cuando el análisis detallado está abierto
    if (showDetailedAnalysis) {
      return;
    }
    
    if (!ubicacionId || ubicacionId === '') {
      setUbicacionSeleccionada(null);
      return;
    }
    
    // Convertir string ID a objeto ubicación
    const id = parseInt(ubicacionId, 10);
    const ubicacionObj = ubicaciones.find(u => u.ubicacionid === id);
    
    if (ubicacionObj) {
      setUbicacionSeleccionada(ubicacionObj);
    } else {
      setUbicacionSeleccionada(null);
    }
  }, [setUbicacionSeleccionada, ubicaciones, showDetailedAnalysis]);

  // Función para resetear todos los filtros
  const resetAllFilters = useCallback(() => {
    setPaisSeleccionado('');
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada]);

  // Función para verificar si hay filtros activos
  const hasActiveFilters = paisSeleccionado || empresaSeleccionada || fundoSeleccionado || ubicacionSeleccionada;

  return {
    // Estados
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    ubicacionSeleccionada,
    hasActiveFilters,
    
    // Funciones
    handlePaisChange,
    handleEmpresaChange,
    handleFundoChange,
    handleUbicacionChange,
    resetAllFilters,
  };
};
