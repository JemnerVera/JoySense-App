import React from 'react';
import { PaginationControls } from './PaginationControls';

/**
 * Props compatibles con la interfaz antigua
 * Permite transición gradual del código legacy al nuevo PaginationControls
 */
interface PaginationControlsCompatProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Props opcionales para compatibilidad con interfaz antigua
  showPagination?: boolean;
  themeColor?: "orange" | "red" | "blue" | "green" | "purple" | "cyan";
  pageSize?: number;
  totalRecords?: number;
  loading?: boolean;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onPageSizeChange?: (size: number) => void;
  onPrevPage?: () => void;
  onNextPage?: () => void;
}

/**
 * Wrapper compatible con la interfaz antigua
 * Traduce props simples de la interfaz antigua a los requerimientos del nuevo PaginationControls
 */
export function PaginationControlsCompat({
  currentPage,
  totalPages,
  onPageChange,
  showPagination = true,
  themeColor = "orange",
  pageSize = 25,
  totalRecords,
  loading = false,
  hasNextPage,
  hasPrevPage,
  onPageSizeChange,
  onPrevPage,
  onNextPage
}: PaginationControlsCompatProps) {
  // Si showPagination es false, no mostrar nada
  if (!showPagination) {
    return null;
  }

  // Calcular totalRecords si no se proporciona (fallback)
  const calculatedTotalRecords = totalRecords || totalPages * pageSize;

  // Calcular hasNextPage y hasPrevPage si no se proporcionan
  const calculatedHasNextPage = hasNextPage !== undefined ? hasNextPage : currentPage < totalPages;
  const calculatedHasPrevPage = hasPrevPage !== undefined ? hasPrevPage : currentPage > 1;

  // Funciones de paginación por defecto
  const handlePrevPage = onPrevPage || (() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });

  const handleNextPage = onNextPage || (() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  });

  const handlePageSizeChange = onPageSizeChange || (() => {
    // Fallback: hacer nada si no se proporciona
  });

  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalRecords={calculatedTotalRecords}
      loading={loading}
      hasNextPage={calculatedHasNextPage}
      hasPrevPage={calculatedHasPrevPage}
      onPageChange={onPageChange}
      onPageSizeChange={handlePageSizeChange}
      onPrevPage={handlePrevPage}
      onNextPage={handleNextPage}
    />
  );
}
