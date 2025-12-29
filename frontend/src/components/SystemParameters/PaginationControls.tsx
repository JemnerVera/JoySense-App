
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPagination?: boolean;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple';
}

export function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPagination = true,
  themeColor = 'orange'
}: PaginationControlsProps) {
  if (!showPagination || totalPages <= 1) return null;

  const getHoverColor = () => {
    switch (themeColor) {
      case 'red': return 'hover:bg-red-100 dark:hover:bg-red-900/20 hover:border-red-400';
      case 'blue': return 'hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:border-blue-400';
      case 'green': return 'hover:bg-green-100 dark:hover:bg-green-900/20 hover:border-green-400';
      case 'purple': return 'hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:border-purple-400';
      default: return 'hover:bg-orange-100 dark:hover:bg-orange-900/20 hover:border-orange-400';
    }
  };

  const getBorderColor = () => {
    switch (themeColor) {
      case 'red': return 'border-red-300 dark:border-red-700';
      case 'blue': return 'border-blue-300 dark:border-blue-700';
      case 'green': return 'border-green-300 dark:border-green-700';
      case 'purple': return 'border-purple-300 dark:border-purple-700';
      default: return 'border-orange-300 dark:border-orange-700';
    }
  };

  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
        className={`px-3 py-2 bg-gray-200 dark:bg-neutral-800 border ${getBorderColor()} text-gray-800 dark:text-white rounded-lg ${getHoverColor()} transition-colors disabled:opacity-50 font-mono tracking-wider`}
        title="Primera página"
      >
        ⏮️
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`px-4 py-2 bg-gray-200 dark:bg-neutral-800 border ${getBorderColor()} text-gray-800 dark:text-white rounded-lg ${getHoverColor()} transition-colors disabled:opacity-50 font-mono tracking-wider`}
      >
        ← ANTERIOR
      </button>

      <span className="text-gray-800 dark:text-white flex items-center px-3 font-mono tracking-wider">
        PÁGINA {currentPage} DE {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`px-4 py-2 bg-gray-200 dark:bg-neutral-800 border ${getBorderColor()} text-gray-800 dark:text-white rounded-lg ${getHoverColor()} transition-colors disabled:opacity-50 font-mono tracking-wider`}
      >
        SIGUIENTE →
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages}
        className={`px-3 py-2 bg-gray-200 dark:bg-neutral-800 border ${getBorderColor()} text-gray-800 dark:text-white rounded-lg ${getHoverColor()} transition-colors disabled:opacity-50 font-mono tracking-wider`}
        title="Última página"
      >
        ⏭️
      </button>
    </div>
  );
}
