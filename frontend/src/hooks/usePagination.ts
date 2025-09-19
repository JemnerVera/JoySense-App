import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  getPaginatedData: () => any[];
  getPageInfo: () => { start: number; end: number; total: number };
}

/**
 * Hook personalizado para manejar paginación de datos
 */
export const usePagination = (
  data: any[] = [],
  initialItemsPerPage: number = 10
): PaginationState & PaginationActions => {
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(data.length / itemsPerPage));
  }, [data.length, itemsPerPage]);

  // Calcular si hay páginas siguiente y anterior
  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPrevPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  // Obtener datos paginados
  const getPaginatedData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Navegar a una página específica
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  // Ir a la página siguiente
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  // Ir a la página anterior
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  // Ir a la primera página
  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Ir a la última página
  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Cambiar número de elementos por página
  const setItemsPerPageHandler = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a la primera página
  }, []);

  // Obtener información de la página actual
  const getPageInfo = useCallback(() => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, data.length);
    return {
      start: data.length > 0 ? start : 0,
      end: data.length > 0 ? end : 0,
      total: data.length
    };
  }, [currentPage, itemsPerPage, data.length]);

  return {
    // Estado
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    itemsPerPage,
    totalItems: data.length,
    
    // Acciones
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setItemsPerPage: setItemsPerPageHandler,
    getPaginatedData,
    getPageInfo
  };
};
