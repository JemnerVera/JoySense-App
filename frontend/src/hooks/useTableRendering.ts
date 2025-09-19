import { useCallback, useMemo } from 'react';
import { useSearchOperations } from './useSearchOperations';
import { usePagination } from './usePagination';

export interface TableRenderingState {
  filteredData: any[];
  paginatedData: any[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  searchTerm: string;
  searchField: string;
  isSearching: boolean;
}

export interface TableRenderingActions {
  setSearchTerm: (term: string) => void;
  setSearchField: (field: string) => void;
  performSearch: (data: any[], term: string, field: string) => any[];
  clearSearch: () => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  getDisplayValue: (row: any, columnName: string) => string;
  formatCellValue: (value: any, columnName: string) => string;
}

/**
 * Hook personalizado para manejar la lógica de renderizado de tablas
 * Encapsula la lógica de búsqueda, filtrado, paginación y formateo de datos
 */
export const useTableRendering = (
  data: any[] = [],
  itemsPerPage: number = 10
): TableRenderingState & TableRenderingActions => {
  
  const {
    searchTerm,
    searchField,
    filteredData: searchFilteredData,
    hasSearched,
    isSearching,
    setSearchTerm,
    setSearchField,
    performSearch,
    clearSearch,
    setFilteredData,
    setHasSearched,
    setIsSearching
  } = useSearchOperations();

  // Aplicar búsqueda a los datos
  const filteredData = useMemo(() => {
    if (!hasSearched || !searchTerm.trim()) {
      return data;
    }
    return performSearch(data, searchTerm, searchField);
  }, [data, searchTerm, searchField, hasSearched, performSearch]);

  // Paginación
  const {
    currentPage,
    totalPages,
    getPaginatedData,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNextPage,
    hasPrevPage
  } = usePagination(filteredData, itemsPerPage);

  // Datos paginados
  const paginatedData = useMemo(() => {
    return getPaginatedData();
  }, [getPaginatedData]);

  /**
   * Obtener valor de visualización para una celda
   */
  const getDisplayValue = useCallback((row: any, columnName: string): string => {
    const value = row[columnName];
    
    if (value === null || value === undefined) {
      return '';
    }
    
    // Si es un objeto, mostrar una representación string
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }, []);

  /**
   * Formatear valor de celda para visualización
   */
  const formatCellValue = useCallback((value: any, columnName: string): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Formateo específico por tipo de columna
    if (columnName.includes('date') || columnName.includes('created') || columnName.includes('updated')) {
      // Formatear fechas
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    
    if (columnName.includes('status')) {
      // Formatear estados
      return value === 1 ? 'Activo' : 'Inactivo';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  }, []);

  return {
    // Estado
    filteredData,
    paginatedData,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    searchTerm,
    searchField,
    isSearching,
    
    // Acciones
    setSearchTerm,
    setSearchField,
    performSearch,
    clearSearch,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    getDisplayValue,
    formatCellValue
  };
};
