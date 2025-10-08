
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPagination?: boolean;
}

export function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPagination = true 
}: PaginationControlsProps) {
  if (!showPagination || totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
        className="px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"
        title="Primera página"
      >
        ⏮️
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"
      >
        ← ANTERIOR
      </button>

      <span className="text-gray-800 dark:text-white flex items-center px-3 font-mono tracking-wider">
        PÁGINA {currentPage} DE {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"
      >
        SIGUIENTE →
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages}
        className="px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"
        title="Última página"
      >
        ⏭️
      </button>
    </div>
  );
}
