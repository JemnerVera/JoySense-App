import React, { useState } from 'react';

interface DynamicFilterSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string | number; name: string }>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

const DynamicFilterSelector: React.FC<DynamicFilterSelectorProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Seleccionar...',
  className = '',
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find(option => option.id.toString() === value);
  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionId: string | number) => {
    onChange(optionId.toString());
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between font-mono min-w-[150px] ${
          selectedOption ? 'border-orange-500' : ''
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
          <span className={`${selectedOption ? 'text-white' : 'text-neutral-400'} truncate tracking-wider`}>
            {selectedOption ? selectedOption.name.toUpperCase() : placeholder.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {selectedOption && (
            <span
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-neutral-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH..."
              className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
              autoFocus
            />
          </div>
          
          {/* Lista de opciones */}
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                    selectedOption?.id === option.id 
                      ? 'bg-orange-500 text-white' 
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {option.name.toUpperCase()}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-neutral-400 font-mono">
                NO RESULTS FOUND
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicFilterSelector;
