// ============================================================================
// USUARIO EMPRESA SELECTOR
// ============================================================================
// Componente para seleccionar usuarios mostrando "firstname lastname - empresa"
// Similar a UserSelector pero incluye información de empresas

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { JoySenseService } from '../../services/backend-api';
import { useLanguage } from '../../contexts/LanguageContext';

interface UsuarioEmpresaOption {
  value: number; // usuarioid
  label: string; // "firstname lastname - empresa" para mostrar en el dropdown
  usuarioid: number;
  displayName?: string; // Nombre completo para mostrar en el input
}

interface UsuarioEmpresaSelectorProps {
  value: number | null;
  onChange: (usuarioid: number | null) => void;
  placeholder?: string;
  isRequired?: boolean;
  themeColor?: string;
  excludeWithProfiles?: boolean; // Si es true, excluir usuarios que ya tienen perfiles asignados
}

export const UsuarioEmpresaSelector: React.FC<UsuarioEmpresaSelectorProps> = ({
  value,
  onChange,
  placeholder = 'BUSQUEDA',
  isRequired = false,
  themeColor = 'orange',
  excludeWithProfiles = false
}) => {
  const { t } = useLanguage();
  
  // Estado para guardar el label del usuario seleccionado
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  
  // Estados para el input con autocomplete
  const [inputValue, setInputValue] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UsuarioEmpresaOption[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Búsqueda de usuarios con empresas
  const loadOptions = useCallback(async (inputValue: string): Promise<UsuarioEmpresaOption[]> => {
    if (!inputValue || inputValue.length < 2) {
      return [];
    }

    try {
      const results = await JoySenseService.searchUsersWithEmpresas(inputValue, excludeWithProfiles);
      return results.map((u: any) => ({
        value: u.usuarioid,
        label: u.label || `${u.firstname || ''} ${u.lastname || ''} - ${u.empresa || 'Sin empresa'}`.trim(),
        usuarioid: u.usuarioid,
        displayName: u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.login
      }));
    } catch (error) {
      console.error('Error en búsqueda de usuarios con empresas:', error);
      return [];
    }
  }, [excludeWithProfiles]);

  // Cargar el nombre del usuario cuando hay un value pero no hay selectedLabel
  useEffect(() => {
    if (value && !selectedLabel) {
      // Intentar buscar el usuario para obtener su nombre
      const searchUser = async () => {
        try {
          // Buscar usando el endpoint de búsqueda con el ID
          const results = await JoySenseService.searchUsersWithEmpresas(value.toString());
          const found = results.find((u: any) => u.usuarioid === value);
          if (found && found.displayName) {
            setSelectedLabel(found.displayName);
          } else if (found && found.label) {
            // Extraer solo el nombre del label completo
            const parts = found.label.split(' - ');
            setSelectedLabel(parts[0] || found.label);
          }
        } catch (error) {
          console.error('Error buscando usuario:', error);
        }
      };
      searchUser();
    } else if (!value) {
      setSelectedLabel(null);
    }
  }, [value, selectedLabel]);

  // Sincronizar inputValue con selectedLabel
  useEffect(() => {
    if (selectedLabel) {
      setInputValue(selectedLabel);
    } else if (!value) {
      setInputValue('');
    }
  }, [selectedLabel, value]);

  // Manejar cambios en el input de búsqueda
  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(null); // Limpiar la selección si el usuario está escribiendo
    setSelectedLabel(null);

    if (newInputValue.length >= 2) {
      setIsLoadingSuggestions(true);
      setShowSuggestions(true);
      try {
        const opts = await loadOptions(newInputValue);
        setSuggestions(opts);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [loadOptions, onChange]);

  // Manejar selección desde sugerencias
  const handleSelectSuggestion = (option: UsuarioEmpresaOption) => {
    // Guardar solo el nombre del usuario, no el label completo
    const nombre = option.displayName || option.label.split(' - ')[0] || `Usuario ${option.usuarioid}`;
    setSelectedLabel(nombre);
    setInputValue(nombre);
    onChange(option.usuarioid);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Manejar limpiar el input
  const handleClear = () => {
    setInputValue('');
    setSelectedLabel(null);
    onChange(null);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getThemeClasses = () => {
    const colorMap: Record<string, string> = {
      green: 'bg-green-500 hover:bg-green-600 text-green-500 focus:ring-green-500',
      blue: 'bg-blue-500 hover:bg-blue-600 text-blue-500 focus:ring-blue-500',
      orange: 'bg-orange-500 hover:bg-orange-600 text-orange-500 focus:ring-orange-500',
      red: 'bg-red-500 hover:bg-red-600 text-red-500 focus:ring-red-500',
      purple: 'bg-purple-500 hover:bg-purple-600 text-purple-500 focus:ring-purple-500'
    };
    return colorMap[themeColor] || colorMap.orange;
  };

  return (
    <div className="w-full">
      <div className="relative" ref={inputRef}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setShowTooltip(true);
            if (inputValue.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay para permitir click en sugerencias
            setTimeout(() => {
              setShowTooltip(false);
              setShowSuggestions(false);
            }, 200);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-500 dark:placeholder-neutral-400"
        />
        {/* Tooltip */}
        {showTooltip && !inputValue && (
          <div className="absolute z-50 top-full mt-1 left-0 bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            Digita mínimo 2 letras para búsqueda inteligente
            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          </div>
        )}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Dropdown de sugerencias */}
        {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scrollbar theme-orange"
          >
            {isLoadingSuggestions ? (
              <div className="p-3 text-center text-gray-500 dark:text-neutral-400 font-mono text-sm">Buscando...</div>
            ) : suggestions.length === 0 ? (
              <div className="p-3 text-center text-gray-500 dark:text-neutral-400 font-mono text-sm">No se encontraron usuarios</div>
            ) : (
              suggestions.map((option) => (
                <button
                  key={option.usuarioid}
                  type="button"
                  onClick={() => handleSelectSuggestion(option)}
                  className="w-full text-left px-3 py-2 text-base text-gray-900 dark:text-white font-mono hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

