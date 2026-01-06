import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectWithPlaceholderProps {
  value: number[];
  onChange: (value: number[]) => void;
  options: Array<{ value: any; label: string }>;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelectWithPlaceholder: React.FC<MultiSelectWithPlaceholderProps> = ({
  value = [],
  onChange,
  options,
  placeholder,
  className = "w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-white text-base font-mono",
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
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionToggle = (optionValue: number) => {
    if (disabled) return;
    
    const currentValue = value || [];
    // Convertir a números para comparación
    const currentValueNumbers = currentValue.map(v => Number(v));
    const optionValueNumber = Number(optionValue);
    const isSelected = currentValueNumbers.includes(optionValueNumber);
    
    if (isSelected) {
      onChange(currentValue.filter(v => Number(v) !== optionValueNumber));
    } else {
      onChange([...currentValue, optionValueNumber]);
    }
  };

  // Logs para diagnosticar
  console.log('🔍 [MultiSelectWithPlaceholder] Props recibidas:', {
    value,
    value_type: typeof value,
    value_isArray: Array.isArray(value),
    value_length: Array.isArray(value) ? value.length : 'N/A',
    value_first3: Array.isArray(value) ? value.slice(0, 3) : 'N/A',
    options_count: options.length,
    options_first3: options.slice(0, 3).map(opt => ({ value: opt.value, valueType: typeof opt.value, label: opt.label })),
    placeholder
  });
  
  // Obtener labels de las opciones seleccionadas
  // Comparar convirtiendo ambos valores a números
  const selectedLabels = options
    .filter(opt => {
      const optValue = Number(opt.value);
      const valueNumbers = value.map(v => Number(v));
      const isSelected = valueNumbers.includes(optValue);
      if (isSelected) {
        console.log('✅ [MultiSelectWithPlaceholder] Opción seleccionada encontrada:', { label: opt.label, optValue, valueNumbers });
      }
      return isSelected;
    })
    .map(opt => opt.label);

  console.log('🔍 [MultiSelectWithPlaceholder] selectedLabels:', {
    selectedLabels,
    count: selectedLabels.length
  });

  const displayText = selectedLabels.length > 0 
    ? selectedLabels.join(', ') 
    : placeholder.toUpperCase();
  
  console.log('🔍 [MultiSelectWithPlaceholder] displayText:', displayText);

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Ordenar opciones: primero las seleccionadas, luego las no seleccionadas
  // Comparar convirtiendo ambos valores a números
  const valueNumbers = value.map(v => Number(v));
  console.log('🔍 [MultiSelectWithPlaceholder] Ordenando opciones con valueNumbers:', valueNumbers);
  
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    const aValue = Number(a.value);
    const bValue = Number(b.value);
    const aSelected = valueNumbers.includes(aValue);
    const bSelected = valueNumbers.includes(bValue);
    
    // Si ambas están seleccionadas o ninguna, mantener orden original
    if (aSelected === bSelected) {
      return 0;
    }
    
    // Si solo una está seleccionada, la seleccionada va primero
    return aSelected ? -1 : 1;
  });
  
  console.log('🔍 [MultiSelectWithPlaceholder] sortedOptions:', {
    total: sortedOptions.length,
    first3: sortedOptions.slice(0, 3).map(opt => ({ 
      label: opt.label, 
      value: opt.value, 
      isSelected: valueNumbers.includes(Number(opt.value))
    }))
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center`}
      >
        <span className={selectedLabels.length > 0 ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'} style={{fontFamily: 'monospace'}}>
          {displayText}
        </span>
        <span className="text-gray-500 dark:text-neutral-400">▼</span>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Lista de opciones */}
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {sortedOptions.length > 0 ? (
              sortedOptions.map((option) => {
                const optionValue = Number(option.value);
                const isSelected = value.some(v => Number(v) === optionValue);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleOptionToggle(option.value)}
                    className={`px-3 py-2 cursor-pointer text-gray-900 dark:text-white font-mono tracking-wider transition-colors flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-purple-600 text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // El click en el div maneja el toggle
                      className="w-4 h-4 text-purple-600 bg-neutral-800 border-neutral-600 rounded focus:ring-purple-500 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{option.label.toUpperCase()}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-gray-500 dark:text-neutral-400 text-sm font-mono">
                NO SE ENCONTRARON RESULTADOS
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectWithPlaceholder;

