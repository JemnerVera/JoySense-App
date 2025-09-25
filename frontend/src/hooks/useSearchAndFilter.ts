import { useState, useCallback, useMemo } from 'react';
import { getUserName } from '../utils/systemParametersUtils';

/**
 * Hook para manejar búsquedas y filtros
 * Extraído de SystemParameters.tsx para reducir complejidad
 */
export const useSearchAndFilter = () => {
  // Estados para búsquedas
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchField, setSearchField] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchFilteredData, setSearchFilteredData] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Estados para búsquedas de estado
  const [statusSearchTerm, setStatusSearchTerm] = useState<string>('');
  const [statusHasSearched, setStatusHasSearched] = useState<boolean>(false);
  const [statusFilteredData, setStatusFilteredData] = useState<any[]>([]);

  // Estados para búsquedas de copia
  const [copySearchTerm, setCopySearchTerm] = useState<string>('');
  const [copyFilteredData, setCopyFilteredData] = useState<any[]>([]);

  /**
   * Función genérica para buscar por criterios
   */
  const searchByCriteria = useCallback((criteria: string, filterFn: (dataRow: any) => boolean, data: any[]) => {
    const results = data.filter(filterFn);
    console.log(`🔍 ${criteria}:`, results.length);

    if (results.length > 0) {
      console.log(`📋 Detalles de ${criteria}:`, results.map(e => ({
        nodoid: e.nodoid,
        tipoid: e.tipoid,
        datecreated: e.datecreated,
        statusid: e.statusid
      })));
    }

    return results;
  }, []);

  /**
   * Función para buscar entradas con timestamp exacto
   */
  const searchByExactTimestamp = useCallback((timestamp: string, data: any[]) => {
    return searchByCriteria(
      'entradas con timestamp exacto',
      (dataRow) => dataRow.datecreated === timestamp,
      data
    );
  }, [searchByCriteria]);

  /**
   * Función para buscar entradas con timestamp similar
   */
  const searchBySimilarTimestamp = useCallback((timestamp: string, data: any[]) => {
    const baseTimestamp = timestamp.substring(0, 16); // YYYY-MM-DD HH:MM
    return searchByCriteria(
      'entradas con timestamp similar',
      (dataRow) => dataRow.datecreated && dataRow.datecreated.startsWith(baseTimestamp),
      data
    );
  }, [searchByCriteria]);

  /**
   * Función para buscar entradas con el mismo nodo
   */
  const searchBySameNode = useCallback((nodoid: number, data: any[]) => {
    return searchByCriteria(
      'entradas del mismo nodo',
      (dataRow) => dataRow.nodoid === nodoid,
      data
    );
  }, [searchByCriteria]);

  /**
   * Función para buscar entradas con el mismo tipo
   */
  const searchBySameType = useCallback((tipoid: number, data: any[]) => {
    return searchByCriteria(
      'entradas del mismo tipo',
      (dataRow) => dataRow.tipoid === tipoid,
      data
    );
  }, [searchByCriteria]);

  /**
   * Función para buscar entradas activas
   */
  const searchByActiveStatus = useCallback((data: any[]) => {
    return searchByCriteria(
      'entradas activas',
      (dataRow) => dataRow.statusid === 1,
      data
    );
  }, [searchByCriteria]);

  /**
   * Función para buscar entradas inactivas
   */
  const searchByInactiveStatus = useCallback((data: any[]) => {
    return searchByCriteria(
      'entradas inactivas',
      (dataRow) => dataRow.statusid !== 1,
      data
    );
  }, [searchByCriteria]);

  /**
   * Manejar cambio de término de búsqueda
   */
  const handleSearchTermChange = useCallback((term: string, statusFilteredData: any[], statusVisibleColumns: any[], userData: any[]) => {
    setSearchTerm(term);

    if (term.trim()) {
      setHasSearched(true);

      // Filtrar datos basado en el término de búsqueda
      const filtered = statusFilteredData.filter(row => {
        return statusVisibleColumns.some(col => {
          const value = row[col.columnName];
          if (value === null || value === undefined) return false;

          const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' || col.columnName === 'modified_by'
            ? getUserName(value, userData)
            : col.columnName === 'statusid'
            ? (() => {
                // Para filas agrupadas, verificar si al menos una fila original está activa
                if (row.originalRows && row.originalRows.length > 0) {
                  const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                  return hasActiveRow ? 'Activo' : 'Inactivo';
                }
                return value === 1 ? 'Activo' : 'Inactivo';
              })()
            : value.toString();

          return displayValue.toLowerCase().includes(term.toLowerCase());
        });
      });

      setSearchFilteredData(filtered);
    } else {
      setHasSearched(false);
      setSearchFilteredData([]);
    }
  }, []);

  /**
   * Manejar cambio de campo de búsqueda
   */
  const handleSearchFieldChange = useCallback((field: string) => {
    setSearchField(field);
    // Limpiar término de búsqueda y resetear tabla cuando se cambia el campo
    setSearchTerm('');
    setHasSearched(false);
    setSearchFilteredData([]);
  }, []);

  /**
   * Manejar búsqueda de estado
   */
  const handleStatusSearch = useCallback((searchTerm: string, filteredTableData: any[], statusVisibleColumns: any[], userData: any[], setStatusCurrentPage: (page: number) => void) => {
    setStatusSearchTerm(searchTerm);
    setStatusCurrentPage(1); // Resetear a la primera página

    if (searchTerm.trim()) {
      setStatusHasSearched(true);

      const filtered = filteredTableData.filter(row => {
        return statusVisibleColumns.some(col => {
          const value = row[col.columnName];
          if (value === null || value === undefined) return false;

          const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' || col.columnName === 'modified_by'
            ? getUserName(value, userData)
            : col.columnName === 'statusid'
            ? (() => {
                // Para filas agrupadas, verificar si al menos una fila original está activa
                if (row.originalRows && row.originalRows.length > 0) {
                  const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                  return hasActiveRow ? 'Activo' : 'Inactivo';
                }
                return value === 1 ? 'Activo' : 'Inactivo';
              })()
            : value.toString();

          return displayValue.toLowerCase().includes(searchTerm.toLowerCase());
        });
      });

      setStatusFilteredData(filtered);
    } else {
      setStatusHasSearched(false);
      setStatusFilteredData([]);
    }
  }, []);

  /**
   * Manejar búsqueda de copia
   */
  const handleCopySearch = useCallback((searchTerm: string, copyData: any[], statusVisibleColumns: any[], userData: any[], setCopyCurrentPage: (page: number) => void) => {
    setCopySearchTerm(searchTerm);
    setCopyCurrentPage(1); // Resetear a la primera página

    if (searchTerm.trim()) {
      const filtered = copyData.filter(row => {
        return statusVisibleColumns.some(col => {
          const value = row[col.columnName];
          if (value === null || value === undefined) return false;

          const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' || col.columnName === 'modified_by'
            ? getUserName(value, userData)
            : col.columnName === 'statusid'
            ? (() => {
                // Para filas agrupadas, verificar si al menos una fila original está activa
                if (row.originalRows && row.originalRows.length > 0) {
                  const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                  return hasActiveRow ? 'Activo' : 'Inactivo';
                }
                return value === 1 ? 'Activo' : 'Inactivo';
              })()
            : value.toString();

          return displayValue.toLowerCase().includes(searchTerm.toLowerCase());
        });
      });

      setCopyFilteredData(filtered);
    } else {
      setCopyFilteredData([]);
    }
  }, []);

  /**
   * Obtener columnas buscables
   */
  const getSearchableColumns = useCallback((tableColumns: any[], getVisibleColumns: () => any[]) => {
    if (tableColumns.length === 0) return [];
    const allColumns = getVisibleColumns();
    const excludedFields: string[] = [];

    // Excluir campos que no son útiles para búsqueda
    if (selectedTable === 'sensor') {
      excludedFields.push('tipos');
    } else if (selectedTable === 'metricasensor') {
      excludedFields.push('tipos', 'metricas');
    } else if (selectedTable === 'usuarioperfil') {
      excludedFields.push('usuario', 'perfiles');
    }

    return allColumns.filter(col => !excludedFields.includes(col.columnName));
  }, []);

  /**
   * Limpiar estado de búsqueda
   */
  const clearSearchState = useCallback(() => {
    setSearchTerm('');
    setSearchField('');
    setHasSearched(false);
    setSearchFilteredData([]);
    setIsSearching(false);
  }, []);

  /**
   * Limpiar estado de búsqueda de estado
   */
  const clearStatusSearchState = useCallback(() => {
    setStatusSearchTerm('');
    setStatusHasSearched(false);
    setStatusFilteredData([]);
  }, []);

  /**
   * Limpiar estado de búsqueda de copia
   */
  const clearCopySearchState = useCallback(() => {
    setCopySearchTerm('');
    setCopyFilteredData([]);
  }, []);

  return {
    // Estados de búsqueda
    searchTerm,
    searchField,
    hasSearched,
    searchFilteredData,
    isSearching,
    statusSearchTerm,
    statusHasSearched,
    statusFilteredData,
    copySearchTerm,
    copyFilteredData,

    // Setters
    setSearchTerm,
    setSearchField,
    setHasSearched,
    setSearchFilteredData,
    setIsSearching,
    setStatusSearchTerm,
    setStatusHasSearched,
    setStatusFilteredData,
    setCopySearchTerm,
    setCopyFilteredData,

    // Funciones de búsqueda
    searchByCriteria,
    searchByExactTimestamp,
    searchBySimilarTimestamp,
    searchBySameNode,
    searchBySameType,
    searchByActiveStatus,
    searchByInactiveStatus,

    // Handlers
    handleSearchTermChange,
    handleSearchFieldChange,
    handleStatusSearch,
    handleCopySearch,

    // Utilidades
    getSearchableColumns,
    clearSearchState,
    clearStatusSearchState,
    clearCopySearchState
  };
};
