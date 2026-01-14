import React, { useState, useRef, useEffect } from 'react';

interface SelectWithPlaceholderProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: Array<{ value: any; label: string }>;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  themeColor?: 'orange' | 'purple' | 'blue' | 'green' | 'red' | 'cyan';
  dropdownWidth?: string;
  renderSelectedLabel?: (label: string) => React.ReactNode;
  allowExternalChange?: boolean; // Permite cambios externos sin revertir
}

const SelectWithPlaceholder: React.FC<SelectWithPlaceholderProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
  themeColor = 'purple',
  dropdownWidth,
  renderSelectedLabel,
  allowExternalChange = false
}) => {
  // Construir className por defecto con el themeColor
  const defaultClassName = `w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 ${themeColor === 'orange' ? 'focus:ring-orange-500 focus:border-orange-500' : 'focus:ring-purple-500 focus:border-purple-500'} text-gray-800 dark:text-white text-base font-mono`;
  const finalClassName = className || defaultClassName;
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousValueRef = useRef<string | number | null>(value);
  const isUserInteractionRef = useRef(false);
  const isRevertingRef = useRef(false); // Flag para evitar loops al revertir cambios
  
  // Detectar cuando el value cambia desde fuera (reset)
  React.useEffect(() => {
    // Si estamos en medio de una reversión, ignorar este efecto
    if (isRevertingRef.current) {
      isRevertingRef.current = false;
      return;
    }
    
    if (previousValueRef.current !== value) {
      const wasUserInteraction = isUserInteractionRef.current;
      const previousWasEmpty = !previousValueRef.current || previousValueRef.current === '' || previousValueRef.current === null || previousValueRef.current === undefined;
      const currentIsEmpty = !value || value === '' || value === null || value === undefined;
      
      // CRÍTICO: Si el dropdown NO está abierto PERO fue una interacción reciente del usuario, confiar en el flag
      // El flag se mantiene activo por 500ms después de un click, así que si wasUserInteraction es true,
      // probablemente es una interacción real, incluso si el dropdown ya se cerró
      const isActuallyUserInteraction = wasUserInteraction;
      
      // Si el valor cambió desde empty a un valor Y NO fue una interacción real del usuario, es un problema
      // PERO solo revertir si estamos SEGUROS de que no fue una interacción del usuario
      // No revertir si el flag indica que fue una interacción (incluso si el dropdown está cerrado)
      // O si allowExternalChange está habilitado (permite cambios externos intencionales)
      if (previousWasEmpty && !currentIsEmpty && !isActuallyUserInteraction && !allowExternalChange) {
        // Verificar si estamos en medio de una reversión para evitar loops
        if (isRevertingRef.current) {
          // Ya estamos revirtiendo, no hacer nada más
          return;
        }
        
        // Marcar que estamos revirtiendo para evitar loops
        isRevertingRef.current = true;
        // NO actualizar previousValueRef aún - lo haremos después de revertir
        isUserInteractionRef.current = false;
        // Llamar onChange(null) para revertir el cambio en el estado padre
        // Esto es seguro porque isRevertingRef evitará que este efecto se ejecute nuevamente
        if (onChange) {
          onChange(null);
        }
        // Actualizar previousValueRef a null para que el componente muestre el placeholder
        previousValueRef.current = null;
        // Resetear el flag de reversión después de un delay para permitir que el cambio se procese
        setTimeout(() => {
          isRevertingRef.current = false;
        }, 100);
        return;
      }
      
      // Si el valor cambió a null/empty y NO fue una interacción del usuario, es un reset
      if (currentIsEmpty && !isActuallyUserInteraction) {
        setIsOpen(false);
        setSearchTerm('');
      }
      
      previousValueRef.current = value;
      isUserInteractionRef.current = false; // Resetear el flag después de procesar el cambio
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, placeholder, isOpen]);

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

  const handleOptionClick = (optionValue: any, event?: React.MouseEvent) => {
    // CRÍTICO: Verificar que esto es realmente un click del usuario
    // Si el dropdown no está abierto, NO es una interacción del usuario
    if (!isOpen) {
      return;
    }
    
    // Verificar que el valor realmente cambió ANTES de marcar como interacción del usuario
    const valueChanged = optionValue !== value && String(optionValue || '') !== String(value || '');
    if (!valueChanged) {
      setIsOpen(false);
      setSearchTerm('');
      return;
    }
    
    // Marcar como interacción del usuario ANTES de llamar onChange
    // Usar un timestamp para rastrear cuándo ocurrió la interacción
    isUserInteractionRef.current = true;
    
    // Cerrar el dropdown ANTES de llamar onChange para evitar que el useEffect detecte isOpen=false
    setIsOpen(false);
    setSearchTerm('');
    
    // Llamar onChange DESPUÉS de cerrar el dropdown
    onChange(optionValue);
    
    // Mantener el flag activo por más tiempo (500ms) para asegurar que el useEffect lo detecte
    setTimeout(() => {
      isUserInteractionRef.current = false;
    }, 500);
  };

  const selectedOption = options.find(option => {
    // Manejar comparación de valores, incluyendo strings 'true' y 'false'
    if (value === null || value === undefined) {
      return false;
    }
    // Comparar directamente
    if (option.value === value) {
      return true;
    }
    // Comparar como strings
    if (String(option.value) === String(value)) {
      return true;
    }
    // Comparar valores booleanos convertidos a strings
    // value es string | number | null, nunca boolean
    const optionStr = String(option.value);
    const valueStr = String(value);
    if ((optionStr === 'true' || option.value === true) && (valueStr === 'true' || value === 1 || valueStr === '1')) {
      return true;
    }
    if ((optionStr === 'false' || option.value === false) && (valueStr === 'false' || value === 0 || valueStr === '0')) {
      return true;
    }
    return false;
  });

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${finalClassName} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center`}
      >
        <span className={value && value !== 0 ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'} style={{fontFamily: 'monospace'}}>
          {selectedOption 
            ? (renderSelectedLabel ? renderSelectedLabel(selectedOption.label) : selectedOption.label)
            : placeholder.toUpperCase()}
        </span>
        <span className={`text-gray-500 dark:text-neutral-400 ${value && value !== 0 ? 'opacity-0' : ''}`}>▼</span>
      </div>
      
      {isOpen && !disabled && (
        <div className={`absolute z-[9999] ${dropdownWidth || 'w-full'} mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-64 overflow-hidden`}>
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 ${themeColor === 'orange' ? 'focus:ring-orange-500' : 'focus:ring-purple-500'}`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Lista de opciones */}
          <div className={`max-h-32 overflow-y-auto custom-scrollbar ${themeColor === 'orange' ? 'theme-orange' : ''}`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                // Si el label contiene " - ", mostrar código en naranja y país en blanco
                const labelParts = option.label.includes(' - ') 
                  ? option.label.split(' - ')
                  : null;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className={`px-3 py-2 cursor-pointer text-gray-900 dark:text-white font-mono tracking-wider transition-colors ${
                      selectedOption?.value === option.value 
                        ? (themeColor === 'orange' ? 'bg-orange-600' : 'bg-purple-600')
                        : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {labelParts ? (
                      <span>
                        <span className={selectedOption?.value === option.value ? 'text-white' : (themeColor === 'orange' ? 'text-orange-500' : 'text-purple-500')}>{labelParts[0]}</span>
                        <span> - {labelParts[1]}</span>
                      </span>
                    ) : (
                      option.label.toUpperCase()
                    )}
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

export default SelectWithPlaceholder;
