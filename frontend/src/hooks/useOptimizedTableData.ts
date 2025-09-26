import { useState, useCallback, useEffect, useRef } from 'react';
import { optimizedDataService, ReferenceData } from '../services/optimizedDataService';

interface UseOptimizedTableDataReturn {
  // Estados de datos
  tableData: any[];
  userData: any[];
  referenceData: ReferenceData | null;
  
  // Estados de carga
  loading: boolean;
  error: string | null;
  
  // Funciones de carga
  loadUserData: () => Promise<void>;
  loadReferenceData: () => Promise<void>;
  loadTableData: (table: string, limit?: number) => Promise<any[]>;
  
  // Funciones de caché
  invalidateTable: (table: string) => void;
  clearCache: () => void;
  getCacheStats: () => { size: number; entries: string[] };
  
  // Estados de carga específicos
  isLoadingTable: (table: string, limit?: number) => boolean;
}

export const useOptimizedTableData = (): UseOptimizedTableDataReturn => {
  // Estados para datos
  const [tableData, setTableData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  
  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencia para abortar operaciones
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Cargar datos de usuario
   */
  const loadUserData = useCallback(async () => {
    try {
      setError(null);
      const data = await optimizedDataService.loadTableData('usuario', 1000);
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError(error instanceof Error ? error.message : 'Error loading user data');
      setUserData([]);
    }
  }, []);

  /**
   * Cargar datos de referencia optimizados
   */
  const loadReferenceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = performance.now();
      const data = await optimizedDataService.loadReferenceData();
      const endTime = performance.now();
      
      setReferenceData(data);
      console.log(`✅ Datos de referencia cargados en ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error('Error loading reference data:', error);
      setError(error instanceof Error ? error.message : 'Error loading reference data');
      setReferenceData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar datos de una tabla específica
   */
  const loadTableData = useCallback(async (table: string, limit: number = 500): Promise<any[]> => {
    try {
      setError(null);
      const data = await optimizedDataService.loadTableData(table, limit);
      setTableData(data);
      return data;
    } catch (error) {
      console.error(`Error loading table data for ${table}:`, error);
      setError(error instanceof Error ? error.message : `Error loading ${table} data`);
      return [];
    }
  }, []);

  /**
   * Invalidar caché para una tabla específica
   */
  const invalidateTable = useCallback((table: string) => {
    optimizedDataService.invalidateTable(table);
  }, []);

  /**
   * Limpiar todo el caché
   */
  const clearCache = useCallback(() => {
    optimizedDataService.clearCache();
  }, []);

  /**
   * Obtener estadísticas del caché
   */
  const getCacheStats = useCallback(() => {
    return optimizedDataService.getCacheStats();
  }, []);

  /**
   * Verificar si una tabla está siendo cargada
   */
  const isLoadingTable = useCallback((table: string, limit?: number) => {
    return optimizedDataService.isLoading(table, limit);
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Estados de datos
    tableData,
    userData,
    referenceData,
    
    // Estados de carga
    loading,
    error,
    
    // Funciones de carga
    loadUserData,
    loadReferenceData,
    loadTableData,
    
    // Funciones de caché
    invalidateTable,
    clearCache,
    getCacheStats,
    
    // Estados de carga específicos
    isLoadingTable
  };
};
