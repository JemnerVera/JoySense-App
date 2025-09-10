import { useCallback } from 'react';
import { useFilters } from '../contexts/FilterContext';

export const useCascadingFilters = () => {
  const {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    setPaisSeleccionado,
    setEmpresaSeleccionada,
    setFundoSeleccionado,
  } = useFilters();

  // Función para manejar el cambio de país con cascada
  const handlePaisChange = useCallback((paisId: string) => {
    setPaisSeleccionado(paisId);
    // Limpiar empresa y fundo cuando cambia el país
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado]);

  // Función para manejar el cambio de empresa con cascada
  const handleEmpresaChange = useCallback((empresaId: string) => {
    setEmpresaSeleccionada(empresaId);
    // Limpiar fundo cuando cambia la empresa
    setFundoSeleccionado('');
  }, [setEmpresaSeleccionada, setFundoSeleccionado]);

  // Función para manejar el cambio de fundo
  const handleFundoChange = useCallback((fundoId: string) => {
    setFundoSeleccionado(fundoId);
  }, [setFundoSeleccionado]);

  // Función para resetear todos los filtros
  const resetAllFilters = useCallback(() => {
    setPaisSeleccionado('');
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado]);

  // Función para verificar si hay filtros activos
  const hasActiveFilters = paisSeleccionado || empresaSeleccionada || fundoSeleccionado;

  return {
    // Estados
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    hasActiveFilters,
    
    // Funciones
    handlePaisChange,
    handleEmpresaChange,
    handleFundoChange,
    resetAllFilters,
  };
};
