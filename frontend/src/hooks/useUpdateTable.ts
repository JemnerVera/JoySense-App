/**
 * Hook para manejar la tabla de Actualizar en SystemParameters
 * Encapsula toda la lógica de paginación, búsqueda, filtrado y columnas visibles
 * Similar a useStatusTable pero específico para el tab de Actualizar
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTableColumns } from './useTableColumns';
import { useSearchAndFilter } from './useSearchAndFilter';
import { useGlobalFilterEffect } from './useGlobalFilterEffect';
import type { ColumnInfo } from '../types/systemParameters';
import type { RelatedData } from '../utils/systemParametersUtils';

interface UseUpdateTableOptions {
  tableName: string;
  tableData: any[];
  columns: ColumnInfo[];
  relatedData: RelatedData;
  itemsPerPage?: number;
}

interface UseUpdateTableReturn {
  // Datos
  filteredData: any[];
  paginatedData: any[];
  visibleColumns: ColumnInfo[];
  
  // Paginación
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  
  // Búsqueda
  searchTerm: string;
  handleSearchChange: (term: string) => void;
  hasSearched: boolean;
  
  // Estado
  loading: boolean;
}

/**
 * Hook que encapsula toda la lógica de la tabla de Actualizar
 */
export const useUpdateTable = ({
  tableName,
  tableData,
  columns,
  relatedData,
  itemsPerPage = 10
}: UseUpdateTableOptions): UseUpdateTableReturn => {
  
  // Aplicar filtros globales (país, empresa, fundo)
  const filteredTableData = useGlobalFilterEffect({
    tableName,
    data: tableData
  });

  // Hook de búsqueda y filtrado
  const {
    statusSearchTerm,
    statusHasSearched,
    statusFilteredData,
    setStatusSearchTerm,
    setStatusFilteredData,
    setStatusHasSearched,
    handleStatusSearch
  } = useSearchAndFilter();

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Columnas visibles
  const visibleColumns = useTableColumns({
    columns,
    tableName,
    forTable: false // Para Actualizar siempre usamos columnas desagregadas
  });

  // Inicializar datos filtrados cuando se cargan los datos por primera vez
  useEffect(() => {
    if (filteredTableData.length > 0 && statusFilteredData.length === 0 && !statusHasSearched) {
      setStatusFilteredData(filteredTableData);
    }
  }, [filteredTableData.length, statusFilteredData.length, statusHasSearched, setStatusFilteredData]);

  // Actualizar datos filtrados cuando cambian los filtros globales (solo si no hay búsqueda activa)
  // Usar useRef para evitar resetear la página cuando el usuario cambia de página manualmente
  const prevFilteredTableDataRef = useRef(filteredTableData);
  useEffect(() => {
    // Solo resetear si los datos realmente cambiaron (no solo por re-render)
    const dataChanged = JSON.stringify(prevFilteredTableDataRef.current) !== JSON.stringify(filteredTableData);
    
    if (!statusHasSearched && dataChanged) {
      setStatusFilteredData(filteredTableData);
      const calculatedTotalPages = Math.ceil(filteredTableData.length / itemsPerPage);
      setTotalPages(calculatedTotalPages);
      // Solo resetear a página 1 si los datos realmente cambiaron
      setCurrentPage(1);
      prevFilteredTableDataRef.current = filteredTableData;
    }
  }, [filteredTableData, itemsPerPage, statusHasSearched, setStatusFilteredData]);

  // Recalcular paginación cuando cambian los datos filtrados por búsqueda
  useEffect(() => {
    const calculatedTotalPages = Math.ceil(statusFilteredData.length / itemsPerPage);
    setTotalPages(calculatedTotalPages);
    
    // Si la página actual es mayor que el total de páginas, resetear a la última página disponible
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(calculatedTotalPages);
    } else if (calculatedTotalPages === 0) {
      setCurrentPage(1);
    }
  }, [statusFilteredData, itemsPerPage, currentPage]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return statusFilteredData.slice(startIndex, endIndex);
  }, [statusFilteredData, currentPage, itemsPerPage]);

  // Handler para cambio de búsqueda
  const handleSearchChange = useCallback((term: string) => {
    setStatusSearchTerm(term);
    
    if (term.trim()) {
      // Realizar búsqueda
      handleStatusSearch(
        term,
        filteredTableData,
        visibleColumns,
        relatedData.userData || [],
        setCurrentPage,
        relatedData
      );
      setStatusHasSearched(true);
    } else {
      // Limpiar búsqueda
      setStatusFilteredData(filteredTableData);
      setStatusHasSearched(false);
      setCurrentPage(1);
    }
  }, [
    filteredTableData,
    visibleColumns,
    relatedData,
    handleStatusSearch,
    setStatusSearchTerm,
    setStatusFilteredData,
    setStatusHasSearched
  ]);

  // Handler para cambio de página
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    filteredData: statusFilteredData,
    paginatedData,
    visibleColumns,
    currentPage,
    totalPages,
    handlePageChange,
    searchTerm: statusSearchTerm,
    handleSearchChange,
    hasSearched: statusHasSearched,
    loading: false // TODO: Integrar con loading real
  };
};
