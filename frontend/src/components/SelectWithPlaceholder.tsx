import React, { useState, useRef, useEffect } from 'react';

interface SelectWithPlaceholderProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: Array<{ value: any; label: string }>;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

const SelectWithPlaceholder: React.FC<SelectWithPlaceholderProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = "w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 dark:text-white text-base font-mono",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: any) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedOption = options.find(option => 
    (value !== null && value !== undefined && value !== 0) && (
      option.value === value || 
      option.value === value?.toString() || 
      option.value?.toString() === value?.toString()
    )
  );

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center`}
      >
        <span className={value && value !== 0 ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'} style={{fontFamily: 'monospace'}}>
          {selectedOption ? selectedOption.label.toUpperCase() : placeholder.toUpperCase()}
        </span>
        <span className="text-neutral-400">▼</span>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-neutral-700">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Lista de opciones */}
          <div className="max-h-32 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`px-3 py-2 cursor-pointer text-white font-mono tracking-wider transition-colors ${
                    selectedOption?.value === option.value 
                      ? 'bg-orange-500' 
                      : 'hover:bg-neutral-800'
                  }`}
                >
                  {option.label.toUpperCase()}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                NO SE ENCONTRARON RESULTADOS
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectWithPlaceholder;
