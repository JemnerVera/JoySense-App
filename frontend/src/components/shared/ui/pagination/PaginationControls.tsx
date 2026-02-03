import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  loading: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  loading,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onPageSizeChange,
  onPrevPage,
  onNextPage
}: PaginationControlsProps) {
  const startRecord = ((currentPage - 1) * pageSize) + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700">
      {/* Información de registros */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Mostrando <span className="font-semibold">{startRecord}</span> a{' '}
        <span className="font-semibold">{endRecord}</span> de{' '}
        <span className="font-semibold">{totalRecords}</span> registros
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-3">
        {/* Botón Anterior */}
        <button
          onClick={onPrevPage}
          disabled={!hasPrevPage || loading}
          className={`px-3 py-1 text-sm rounded border ${
            hasPrevPage && !loading
              ? 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-neutral-700 cursor-not-allowed'
          }`}
        >
          Anterior
        </button>

        {/* Input de página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Página</span>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 1 && value <= totalPages) {
                onPageChange(value);
              }
            }}
            disabled={loading}
            min="1"
            max={totalPages}
            className="w-14 px-2 py-1 text-sm text-center border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">de {totalPages}</span>
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={onNextPage}
          disabled={!hasNextPage || loading}
          className={`px-3 py-1 text-sm rounded border ${
            hasNextPage && !loading
              ? 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-neutral-700 cursor-not-allowed'
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

