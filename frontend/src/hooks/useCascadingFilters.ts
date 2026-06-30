import { useCallback } from 'react';
import { useFilters } from '../contexts/FilterContext';

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
    ubicaciones,
  } = useFilters();

  const handlePaisChange = useCallback((paisId: string) => {
    if (showDetailedAnalysis) {
      console.warn('[useCascadingFilters] Cambio de país bloqueado: análisis detallado abierto');
      return;
    }
    
    setPaisSeleccionado(paisId);
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada, showDetailedAnalysis]);

  const handleEmpresaChange = useCallback((empresaId: string) => {
    if (showDetailedAnalysis) {
      console.warn('[useCascadingFilters] Cambio de empresa bloqueado: análisis detallado abierto');
      return;
    }
    
    setEmpresaSeleccionada(empresaId);
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada, showDetailedAnalysis]);

  const handleFundoChange = useCallback((fundoId: string) => {
    if (showDetailedAnalysis) {
      console.warn('[useCascadingFilters] Cambio de fundo bloqueado: análisis detallado abierto');
      return;
    }
    
    setFundoSeleccionado(fundoId);
    setUbicacionSeleccionada(null);
  }, [setFundoSeleccionado, setUbicacionSeleccionada, showDetailedAnalysis]);

  const handleUbicacionChange = useCallback((ubicacionId: string) => {
    if (showDetailedAnalysis) {
      return;
    }
    
    if (!ubicacionId || ubicacionId === '') {
      setUbicacionSeleccionada(null);
      return;
    }
    
    const id = parseInt(ubicacionId, 10);
    const ubicacionObj = ubicaciones.find(u => u.ubicacionid === id);
    
    if (ubicacionObj) {
      setUbicacionSeleccionada(ubicacionObj);
    } else {
      setUbicacionSeleccionada(null);
    }
  }, [setUbicacionSeleccionada, ubicaciones, showDetailedAnalysis]);

  const resetAllFilters = useCallback(() => {
    setPaisSeleccionado('');
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada]);

  const hasActiveFilters = paisSeleccionado || empresaSeleccionada || fundoSeleccionado || ubicacionSeleccionada;

  return {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    ubicacionSeleccionada,
    hasActiveFilters,
    handlePaisChange,
    handleEmpresaChange,
    handleFundoChange,
    handleUbicacionChange,
    resetAllFilters,
  };
};
