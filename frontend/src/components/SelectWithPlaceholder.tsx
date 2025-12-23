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
      
      // Solo resetear el flag si definitivamente NO fue una interacción (ni flag ni dropdown abierto)
      if (!wasUserInteraction && !isOpen) {
        // No es una interacción del usuario
      } else if (wasUserInteraction && !isOpen) {
        // El flag dice que fue una interacción, pero el dropdown está cerrado
        // Esto es normal después de hacer click - confiar en el flag
        console.log('[SelectWithPlaceholder] Interacción detectada por flag aunque dropdown cerrado (normal después de click)', {
          previous: previousValueRef.current,
          current: value,
          placeholder,
          isOpen
        });
      }
      
      console.log('[SelectWithPlaceholder] Value cambió desde fuera:', {
        previous: previousValueRef.current,
        current: value,
        placeholder,
        wasUserInteraction,
        isOpen,
        isActuallyUserInteraction,
        previousWasEmpty,
        currentIsEmpty,
        isReset: previousWasEmpty && !currentIsEmpty && !isActuallyUserInteraction
      });
      
      // Si el valor cambió desde empty a un valor Y NO fue una interacción real del usuario, es un problema
      // PERO solo revertir si estamos SEGUROS de que no fue una interacción del usuario
      // No revertir si el flag indica que fue una interacción (incluso si el dropdown está cerrado)
      if (previousWasEmpty && !currentIsEmpty && !isActuallyUserInteraction) {
        // Verificar si estamos en medio de una reversión para evitar loops
        if (isRevertingRef.current) {
          // Ya estamos revirtiendo, no hacer nada más
          return;
        }
        
        console.warn('[SelectWithPlaceholder] ⚠️ Valor restaurado incorrectamente después de reset! Revirtiendo cambio.', {
          previous: previousValueRef.current,
          current: value,
          placeholder,
          wasUserInteraction,
          isOpen,
          isActuallyUserInteraction,
          stackTrace: new Error().stack
        });
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
      console.warn('[SelectWithPlaceholder] handleOptionClick llamado cuando dropdown está cerrado - ignorando completamente');
      return;
    }
    
    // Verificar que el valor realmente cambió ANTES de marcar como interacción del usuario
    const valueChanged = optionValue !== value && String(optionValue || '') !== String(value || '');
    if (!valueChanged) {
      console.warn('[SelectWithPlaceholder] handleOptionClick llamado pero el valor no cambió - ignorando');
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
        <span className="text-gray-500 dark:text-neutral-400">▼</span>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                  className={`px-3 py-2 cursor-pointer text-gray-900 dark:text-white font-mono tracking-wider transition-colors ${
                    selectedOption?.value === option.value 
                      ? 'bg-orange-500' 
                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {option.label.toUpperCase()}
                </div>
              ))
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
