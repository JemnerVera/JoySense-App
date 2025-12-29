
import { useLanguage } from '../../contexts/LanguageContext';

interface SearchBarWithCounterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  placeholder?: string;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple';
}

export function SearchBarWithCounter({ 
  searchTerm, 
  onSearchChange, 
  filteredCount, 
  totalCount, 
  placeholder,
  themeColor = 'orange'
}: SearchBarWithCounterProps) {
  const { t } = useLanguage();
  
  const getDisplayText = () => {
    const template = t('status.showing_records');
    return template.replace('{filtered}', filteredCount.toString()).replace('{total}', totalCount.toString());
  };

  const getFocusColor = () => {
    switch (themeColor) {
      case 'red': return 'focus:ring-red-500 focus:border-red-500';
      case 'blue': return 'focus:ring-blue-500 focus:border-blue-500';
      case 'green': return 'focus:ring-green-500 focus:border-green-500';
      case 'purple': return 'focus:ring-purple-500 focus:border-purple-500';
      default: return 'focus:ring-orange-500 focus:border-orange-500';
    }
  };
  
  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder || `🔍 ${t('status.search_placeholder')}`}
          className={`w-full px-4 py-3 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 ${getFocusColor()} text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 font-mono`}
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
