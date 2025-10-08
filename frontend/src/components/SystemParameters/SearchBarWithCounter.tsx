
import { useLanguage } from '../../contexts/LanguageContext';

interface SearchBarWithCounterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  placeholder?: string;
}

export function SearchBarWithCounter({ 
  searchTerm, 
  onSearchChange, 
  filteredCount, 
  totalCount, 
  placeholder 
}: SearchBarWithCounterProps) {
  const { t } = useLanguage();
  
  const getDisplayText = () => {
    const template = t('status.showing_records');
    return template.replace('{filtered}', filteredCount.toString()).replace('{total}', totalCount.toString());
  };
  
  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder || `🔍 ${t('status.search_placeholder')}`}
          className="w-full px-4 py-3 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 font-mono"
        />
      </div>

      {searchTerm && (
        <div className="mt-2 text-sm text-gray-600 dark:text-neutral-400 font-mono">
          {getDisplayText()}
        </div>
      )}
    </div>
  );
}
