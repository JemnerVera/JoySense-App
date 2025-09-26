import { useState, useEffect, useCallback } from 'react';
import { JoySenseService } from '../services/backend-api';
import { useGlobalFilterEffect } from './useGlobalFilterEffect';

export interface TableDataState {
  data: any[];
  filteredData: any[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
}

export interface TableDataActions {
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setData: (data: any[]) => void;
  setFilteredData: (data: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Hook personalizado para manejar la carga y gestión de datos de tablas
 * Incluye filtros globales, paginación y manejo de errores
 */
export const useTableData = (
  tableName: string,
  enabled: boolean = true
): TableDataState & TableDataActions => {
  
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Aplicar filtros globales
  const globalFilteredData = useGlobalFilterEffect({
    tableName,
    data
  });

  // Actualizar filteredData cuando cambien los filtros globales
  useEffect(() => {
    setFilteredData(globalFilteredData);
  }, [globalFilteredData]);

  /**
   * Cargar datos de la tabla
   */
  const fetchData = useCallback(async () => {
    if (!tableName || !enabled) return;

    
    setLoading(true);
    setError(null);

    try {
      let tableData: any[] = [];

      // Usar el método específico si existe, sino usar getTableData genérico
      switch (tableName) {
        case 'pais':
          tableData = await JoySenseService.getPaises();
          break;
        case 'empresa':
          tableData = await JoySenseService.getEmpresas();
          break;
        case 'fundo':
          tableData = await JoySenseService.getFundos();
          break;
        case 'ubicacion':
          tableData = await JoySenseService.getUbicaciones();
          break;
        case 'localizacion':
          tableData = await JoySenseService.getLocalizaciones();
          break;
        case 'entidad':
          tableData = await JoySenseService.getEntidades();
          break;
        case 'tipo':
          tableData = await JoySenseService.getTipos();
          break;
        case 'nodo':
          tableData = await JoySenseService.getNodos();
          break;
        case 'metrica':
          tableData = await JoySenseService.getMetricas();
          break;
        default:
          // Para tablas que no tienen método específico, usar getTableData genérico
          tableData = await JoySenseService.getTableData(tableName);
          break;
      }

      
      setData(tableData);
      setLastFetchTime(Date.now());
      
    } catch (err) {
      console.error(`❌ useTableData.fetchData - Error loading ${tableName}:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [tableName, enabled]);

  /**
   * Refrescar datos (forzar recarga)
   */
  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Establecer datos manualmente
   */
  const setDataManually = useCallback((newData: any[]) => {
    setData(newData);
    setLastFetchTime(Date.now());
  }, [tableName]);

  /**
   * Establecer datos filtrados manualmente
   */
  const setFilteredDataManually = useCallback((newFilteredData: any[]) => {
    setFilteredData(newFilteredData);
  }, [tableName]);

  /**
   * Establecer estado de carga
   */
  const setLoadingState = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
  }, [tableName]);

  /**
   * Establecer error
   */
  const setErrorState = useCallback((errorState: string | null) => {
    setError(errorState);
  }, [tableName]);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [tableName]);

  // Cargar datos automáticamente cuando cambie la tabla o se habilite
  useEffect(() => {
    if (enabled && tableName) {
      fetchData();
    }
  }, [fetchData, enabled, tableName]);

  return {
    // Estado
    data,
    filteredData,
    loading,
    error,
    lastFetchTime,
    
    // Acciones
    fetchData,
    refreshData,
    setData: setDataManually,
    setFilteredData: setFilteredDataManually,
    setLoading: setLoadingState,
    setError: setErrorState,
    clearError
  };
};
