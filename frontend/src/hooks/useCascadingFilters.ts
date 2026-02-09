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
  } = useFilters();

  // Función para manejar el cambio de país con cascada
  const handlePaisChange = useCallback((paisId: string) => {
    setPaisSeleccionado(paisId);
    // Limpiar empresa, fundo y ubicación cuando cambia el país
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada]);

  // Función para manejar el cambio de empresa con cascada
  const handleEmpresaChange = useCallback((empresaId: string) => {
    setEmpresaSeleccionada(empresaId);
    // Limpiar fundo y ubicación cuando cambia la empresa
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  }, [setEmpresaSeleccionada, setFundoSeleccionado, setUbicacionSeleccionada]);

  // Función para manejar el cambio de fundo con cascada
  const handleFundoChange = useCallback((fundoId: string) => {
    setFundoSeleccionado(fundoId);
    // Limpiar ubicación cuando cambia el fundo
    setUbicacionSeleccionada(null);
  }, [setFundoSeleccionado, setUbicacionSeleccionada]);

  // Función para manejar el cambio de ubicación
  const handleUbicacionChange = useCallback((ubicacionId: string) => {
    setUbicacionSeleccionada(ubicacionId);
  }, [setUbicacionSeleccionada]);

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
