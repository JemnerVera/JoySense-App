import { useState, useEffect, useCallback } from 'react';

interface UsePaginationProps {
  data: any[];
  itemsPerPage?: number;
}

export const usePagination = (data: any[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    return paginatedData;
  };

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

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
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};