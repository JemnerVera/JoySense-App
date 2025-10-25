import { useState, useCallback, useMemo } from 'react';
import { JoySenseService } from '../services/backend-api';

// ============================================================================
// CLIENT-SIDE PAGINATION (Original - para compatibilidad)
// ============================================================================

/**
 * Hook para paginación del lado del cliente
 * @param data - Array de datos a paginar
 * @param itemsPerPage - Número de items por página
 */
export function usePagination<T = any>(data: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.ceil(data.length / itemsPerPage);
  }, [data, itemsPerPage]);

  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const hasPrevPage = useMemo(() => currentPage > 1, [currentPage]);
  const totalItems = data?.length || 0;

  const getPaginatedData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Reset to page 1 when data changes
  useMemo(() => {
    setCurrentPage(1);
  }, [data]);

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    itemsPerPage,
    totalItems,
    getPaginatedData,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage
  };
}

// ============================================================================
// SERVER-SIDE PAGINATION (Nuevo - para tablas grandes)
// ============================================================================

/**
 * Hook para manejar paginación del servidor con búsqueda y filtros
 * @param tableName - Nombre de la tabla
 * @param initialPageSize - Tamaño inicial de página (default: 100)
 */
export function useServerPagination(tableName: string, initialPageSize: number = 100) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  /**
   * Cargar datos con paginación
   */
  const loadData = useCallback(async (
    page: number = currentPage,
    size: number = pageSize,
    search: string = searchTerm,
    additionalFilters: Record<string, any> = filters
  ) => {
    try {
      setLoading(true);

      const response = await JoySenseService.getTableDataPaginated(tableName, {
        page,
        pageSize: size,
        search,
        ...additionalFilters
      });

      setData(response.data || []);
      
      if (response.pagination) {
        setTotalRecords(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
        setCurrentPage(response.pagination.page);
      } else {
        // Modo legacy (sin paginación)
        setTotalRecords(response.data?.length || 0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error(`Error loading paginated data for ${tableName}:`, error);
      setData([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [tableName, currentPage, pageSize, searchTerm, filters]);

  /**
   * Ir a una página específica
   */
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadData(page, pageSize, searchTerm, filters);
    }
  }, [loadData, totalPages, pageSize, searchTerm, filters]);

  /**
   * Ir a la página siguiente
   */
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  /**
   * Ir a la página anterior
   */
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  /**
   * Cambiar tamaño de página
   */
  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    loadData(1, newSize, searchTerm, filters); // Volver a página 1 al cambiar tamaño
  }, [loadData, searchTerm, filters]);

  /**
   * Buscar con nuevo término
   */
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    loadData(1, pageSize, term, filters); // Volver a página 1 al buscar
  }, [loadData, pageSize, filters]);

  /**
   * Aplicar nuevos filtros
   */
  const applyFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    loadData(1, pageSize, searchTerm, newFilters); // Volver a página 1 al filtrar
  }, [loadData, pageSize, searchTerm]);

  /**
   * Refrescar datos (mantener página actual)
   */
  const refresh = useCallback(() => {
    loadData(currentPage, pageSize, searchTerm, filters);
  }, [loadData, currentPage, pageSize, searchTerm, filters]);

  /**
   * Resetear paginación (volver a página 1)
   */
  const reset = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    loadData(1, initialPageSize, '', {});
  }, [loadData, initialPageSize]);

  return {
    // Datos
    data,
    loading,
    
    // Información de paginación
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    
    // Estado de búsqueda y filtros
    searchTerm,
    filters,
    
    // Funciones de paginación
    loadData,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    
    // Funciones de búsqueda y filtros
    search,
    applyFilters,
    
    // Utilidades
    refresh,
    reset
  };
}
