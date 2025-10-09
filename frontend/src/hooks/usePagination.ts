import { useState, useEffect, useCallback, useMemo } from 'react';

interface UsePaginationProps {
  data: any[];
  itemsPerPage?: number;
}

export const usePagination = (data: any[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Optimización: Memoizar totalPages para evitar recálculos innecesarios
  const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);

  // Optimización: Memoizar getPaginatedData para evitar recálculos en cada render
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

  // Optimización: Memoizar funciones de navegación
  const nextPage = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  // Optimización: Memoizar valores computados
  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const hasPrevPage = useMemo(() => currentPage > 1, [currentPage]);

  // Resetear a página 1 cuando cambian los datos
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
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
  };
};