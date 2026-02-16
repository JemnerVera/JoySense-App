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
  } = useFilters();
  
  // Obtener el array de ubicaciones para convertir IDs a objetos
  const { ubicaciones = [] } = useFilterData('');

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
    console.log('[useCascadingFilters] handleUbicacionChange recibido:', ubicacionId);
    
    if (!ubicacionId || ubicacionId === '') {
      console.log('[useCascadingFilters] Limpiando ubicación');
      setUbicacionSeleccionada(null);
      return;
    }
    
    // Convertir string ID a objeto ubicación
    const id = parseInt(ubicacionId, 10);
    const ubicacionObj = ubicaciones.find(u => u.ubicacionid === id);
    
    console.log('[useCascadingFilters] Búsqueda de ubicación:', {
      idBuscado: id,
      ubicacionesDisponibles: ubicaciones.length,
      ubicacionEncontrada: ubicacionObj
    });
    
    if (ubicacionObj) {
      console.log('[useCascadingFilters] ✓ Estableciendo ubicación:', ubicacionObj);
      setUbicacionSeleccionada(ubicacionObj);
    } else {
      console.warn('[useCascadingFilters] ⚠️ No se encontró ubicación con ID:', id);
      setUbicacionSeleccionada(null);
    }
  }, [setUbicacionSeleccionada, ubicaciones]);

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
