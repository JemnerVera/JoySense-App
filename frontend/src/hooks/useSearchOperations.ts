import { useState, useCallback, useMemo } from 'react';

export interface SearchOperationState {
  searchTerm: string;
  searchField: string;
  filteredData: any[];
  hasSearched: boolean;
  isSearching: boolean;
}

export interface SearchOperationActions {
  setSearchTerm: (term: string) => void;
  setSearchField: (field: string) => void;
  performSearch: (data: any[], searchTerm: string, searchField: string) => any[];
  clearSearch: () => void;
  setFilteredData: (data: any[]) => void;
  setHasSearched: (searched: boolean) => void;
  setIsSearching: (searching: boolean) => void;
}

/**
 * Hook personalizado para manejar operaciones de búsqueda y filtrado
 * Incluye búsqueda por campo específico y búsqueda general
 */
export const useSearchOperations = (
  initialSearchTerm: string = '',
  initialSearchField: string = ''
): SearchOperationState & SearchOperationActions => {
  
  const [searchTerm, setSearchTermState] = useState(initialSearchTerm);
  const [searchField, setSearchFieldState] = useState(initialSearchField);
  const [filteredData, setFilteredDataState] = useState<any[]>([]);
  const [hasSearched, setHasSearchedState] = useState(false);
  const [isSearching, setIsSearchingState] = useState(false);

  /**
   * Realizar búsqueda en los datos
   */
  const performSearch = useCallback((
    data: any[], 
    searchTerm: string, 
    searchField: string
  ): any[] => {
    
    if (!searchTerm.trim()) {
      return data;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return data.filter(item => {
      if (searchField && searchField !== '') {
        // Búsqueda por campo específico
        const fieldValue = item[searchField];
        if (fieldValue === null || fieldValue === undefined) {
          return false;
        }
        
        const stringValue = String(fieldValue).toLowerCase();
        return stringValue.includes(term);
      } else {
        // Búsqueda general en todos los campos
        return Object.values(item).some(value => {
          if (value === null || value === undefined) {
            return false;
          }
          
          const stringValue = String(value).toLowerCase();
          return stringValue.includes(term);
        });
      }
    });
  }, []);

  /**
   * Establecer término de búsqueda
   */
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  /**
   * Establecer campo de búsqueda
   */
  const setSearchField = useCallback((field: string) => {
    setSearchFieldState(field);
  }, []);

  /**
   * Limpiar búsqueda
   */
  const clearSearch = useCallback(() => {
    setSearchTermState('');
    setSearchFieldState('');
    setFilteredDataState([]);
    setHasSearchedState(false);
  }, []);

  /**
   * Establecer datos filtrados
   */
  const setFilteredData = useCallback((data: any[]) => {
    setFilteredDataState(data);
  }, []);

  /**
   * Establecer si se ha buscado
   */
  const setHasSearched = useCallback((searched: boolean) => {
    setHasSearchedState(searched);
  }, []);

  /**
   * Establecer estado de búsqueda
   */
  const setIsSearching = useCallback((searching: boolean) => {
    setIsSearchingState(searching);
  }, []);

  // Memoizar datos filtrados cuando cambien los parámetros de búsqueda
  const memoizedFilteredData = useMemo(() => {
    if (!hasSearched || !searchTerm.trim()) {
      return filteredData;
    }
    
    return performSearch(filteredData, searchTerm, searchField);
  }, [filteredData, searchTerm, searchField, hasSearched, performSearch]);

  return {
    // Estado
    searchTerm,
    searchField,
    filteredData: memoizedFilteredData,
    hasSearched,
    isSearching,
    
    // Acciones
    setSearchTerm,
    setSearchField,
    performSearch,
    clearSearch,
    setFilteredData,
    setHasSearched,
    setIsSearching
  };
};
