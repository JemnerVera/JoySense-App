import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { JoySenseService } from '../../../services/backend-api';
import { useLanguage } from '../../../contexts/LanguageContext';

interface LocationOption {
  value: number; // localizacionid
  label: string; // Breadcrumb completo para mostrar en el dropdown: "País → Empresa → Fundo → Ubicación → Localización"
  localizacionid: number;
  localizacionNombre?: string; // Nombre de la localización para mostrar en el input
}

interface LocationSelectorProps {
  value: number | null;
  onChange: (localizacionid: number | null) => void;
  placeholder?: string;
  isRequired?: boolean;
  themeColor?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  placeholder = 'BUSQUEDA',
  isRequired = false,
  themeColor = 'green'
}) => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedPais, setSelectedPais] = useState<any>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [selectedFundo, setSelectedFundo] = useState<any>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<any>(null);
  const [selectedLocalizacion, setSelectedLocalizacion] = useState<any>(null);
  
  const [paises, setPaises] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [localizaciones, setLocalizaciones] = useState<any[]>([]);
  
  // Estado para guardar el label completo de la localización seleccionada
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  
  // Estados para el input con autocomplete
  const [inputValue, setInputValue] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Cargar países al abrir el modal
  const loadPaises = useCallback(async () => {
    try {
      const data = await JoySenseService.getPaises();
      setPaises(data || []);
    } catch (error) {
      console.error('Error cargando países:', error);
      setPaises([]);
    }
  }, []);

  // Cargar empresas cuando se selecciona un país
  const loadEmpresas = useCallback(async (paisId: number) => {
    try {
      const data = await JoySenseService.getEmpresasByPais(paisId);
      setEmpresas(data || []);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      setEmpresas([]);
    }
  }, []);

  // Cargar fundos cuando se selecciona una empresa
  const loadFundos = useCallback(async (empresaId: number) => {
    try {
      const data = await JoySenseService.getFundosByEmpresa(empresaId);
      setFundos(data || []);
    } catch (error) {
      console.error('Error cargando fundos:', error);
      setFundos([]);
    }
  }, []);

  // Cargar ubicaciones cuando se selecciona un fundo
  const loadUbicaciones = useCallback(async (fundoId: number) => {
    try {
      const data = await JoySenseService.getUbicacionesByFundo(fundoId);
      setUbicaciones(data || []);
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
      setUbicaciones([]);
    }
  }, []);

  // Cargar localizaciones cuando se selecciona una ubicación
  const loadLocalizaciones = useCallback(async (ubicacionId: number) => {
    try {
      const data = await JoySenseService.getLocalizacionesByUbicacion(ubicacionId);
      setLocalizaciones(data || []);
    } catch (error) {
      console.error('Error cargando localizaciones:', error);
      setLocalizaciones([]);
    }
  }, []);

  // Búsqueda global con AsyncSelect
  const loadOptions = useCallback(async (inputValue: string): Promise<LocationOption[]> => {
    if (!inputValue || inputValue.length < 2) {
      return [];
    }

    try {
      const results = await JoySenseService.searchLocations(inputValue);
      return results.map((loc: any) => ({
        value: loc.localizacionid,
        // Guardar el breadcrumb completo en el label para mostrarlo en el dropdown
        // pero cuando se seleccione, guardaremos solo el nombre de la localización
        label: loc.breadcrumb || `${loc.localizacion || 'Localización'} (${loc.localizacionid})`,
        localizacionid: loc.localizacionid,
        localizacionNombre: loc.localizacion // Guardar el nombre para usarlo después
      }));
    } catch (error) {
      console.error('Error en búsqueda de localizaciones:', error);
      return [];
    }
  }, []);

  // Cargar el nombre de la localización cuando hay un value pero no hay selectedLabel
  useEffect(() => {
    if (value && !selectedLabel) {
      // Intentar buscar la localización para obtener solo su nombre
      const searchLocation = async () => {
        try {
          // Buscar usando el endpoint de búsqueda
          const results = await JoySenseService.searchLocations(value.toString());
          const found = results.find((loc: any) => loc.localizacionid === value);
          if (found && found.localizacion) {
            // Guardar solo el nombre de la localización, no el breadcrumb
            setSelectedLabel(found.localizacion);
          }
        } catch (error) {
          console.error('Error buscando localización:', error);
        }
      };
      searchLocation();
    } else if (!value) {
      setSelectedLabel(null);
    }
  }, [value, selectedLabel]);

  // Sincronizar inputValue con selectedLabel cuando cambia value
  useEffect(() => {
    if (value && selectedLabel) {
      setInputValue(selectedLabel);
    } else if (!value) {
      setInputValue('');
    }
  }, [value, selectedLabel]);

  // Manejar cambios en el input
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.length >= 2) {
      setIsLoadingSuggestions(true);
      try {
        const options = await loadOptions(newValue);
        setSuggestions(options);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error cargando sugerencias:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Manejar click fuera del input para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar selección desde sugerencias
  const handleSelectSuggestion = (option: LocationOption) => {
    // Guardar solo el nombre de la localización, no el breadcrumb completo
    const nombre = option.localizacionNombre || option.label.split(' → ').pop() || `Localización ${option.localizacionid}`;
    setSelectedLabel(nombre);
    setInputValue(nombre);
    onChange(option.localizacionid);
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
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Manejar apertura del modal
  const handleOpenModal = async () => {
    setShowModal(true);
    await loadPaises();
  };

  // Manejar cierre del modal
  const handleCloseModal = () => {
    setShowModal(false);
    // Resetear selecciones
    setSelectedPais(null);
    setSelectedEmpresa(null);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setSelectedLocalizacion(null);
    setEmpresas([]);
    setFundos([]);
    setUbicaciones([]);
    setLocalizaciones([]);
  };

  // Manejar selección en cascada
  const handlePaisChange = async (pais: any) => {
    setSelectedPais(pais);
    setSelectedEmpresa(null);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setSelectedLocalizacion(null);
    setEmpresas([]);
    setFundos([]);
    setUbicaciones([]);
    setLocalizaciones([]);
    if (pais) {
      await loadEmpresas(pais.paisid);
    }
  };

  const handleEmpresaChange = async (empresa: any) => {
    setSelectedEmpresa(empresa);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setSelectedLocalizacion(null);
    setFundos([]);
    setUbicaciones([]);
    setLocalizaciones([]);
    if (empresa) {
      await loadFundos(empresa.empresaid);
    }
  };

  const handleFundoChange = async (fundo: any) => {
    setSelectedFundo(fundo);
    setSelectedUbicacion(null);
    setSelectedLocalizacion(null);
    setUbicaciones([]);
    setLocalizaciones([]);
    if (fundo) {
      await loadUbicaciones(fundo.fundoid);
    }
  };

  const handleUbicacionChange = async (ubicacion: any) => {
    setSelectedUbicacion(ubicacion);
    setSelectedLocalizacion(null);
    setLocalizaciones([]);
    if (ubicacion) {
      await loadLocalizaciones(ubicacion.ubicacionid);
    }
  };

  const handleLocalizacionChange = (localizacion: any) => {
    setSelectedLocalizacion(localizacion);
    if (localizacion) {
      // Guardar solo el nombre de la localización, no el breadcrumb completo
      setSelectedLabel(localizacion.localizacion);
      onChange(localizacion.localizacionid);
      handleCloseModal();
    }
  };

  const getThemeClasses = () => {
    const colorMap: Record<string, string> = {
      green: 'bg-green-500 hover:bg-green-600 text-green-500 focus:ring-green-500',
      blue: 'bg-blue-500 hover:bg-blue-600 text-blue-500 focus:ring-blue-500',
      orange: 'bg-orange-500 hover:bg-orange-600 text-orange-500 focus:ring-orange-500',
      red: 'bg-red-500 hover:bg-red-600 text-red-500 focus:ring-red-500',
      purple: 'bg-purple-500 hover:bg-purple-600 text-purple-500 focus:ring-purple-500'
    };
    return colorMap[themeColor] || colorMap.green;
  };

  return (
    <div className="w-full">
      <div className="flex gap-2">
        {/* Input con autocomplete */}
        <div className="flex-1 relative" ref={inputRef}>
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
            className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 dark:placeholder-neutral-400"
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
              className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scrollbar theme-green"
            >
              {isLoadingSuggestions ? (
                <div className="p-3 text-center text-gray-500 dark:text-neutral-400 font-mono text-sm">Buscando...</div>
              ) : suggestions.length === 0 ? (
                <div className="p-3 text-center text-gray-500 dark:text-neutral-400 font-mono text-sm">No se encontraron localizaciones</div>
              ) : (
                suggestions.map((option) => (
                  <button
                    key={option.localizacionid}
                    type="button"
                    onClick={() => handleSelectSuggestion(option)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white font-mono hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Botón para modal de selección avanzada */}
        <button
          type="button"
          onClick={handleOpenModal}
          className={`px-3 py-2 ${getThemeClasses().split(' ')[0]} text-white rounded-lg transition-colors flex items-center justify-center hover:opacity-80`}
          title="Selección Avanzada"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </button>
      </div>

      {/* Modal con cascada */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h2 className="text-xl font-bold text-green-500 font-mono tracking-wider">
                BUSQUEDA AVANZADA
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar theme-green">
              {/* País */}
              <div>
                <label className="block text-sm font-bold text-green-500 font-mono mb-2 uppercase">
                  País {isRequired && '*'}
                </label>
                <select
                  value={selectedPais?.paisid || ''}
                  onChange={(e) => {
                    const pais = paises.find(p => p.paisid === Number(e.target.value));
                    handlePaisChange(pais || null);
                  }}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="" disabled hidden>Selecciona País</option>
                  {paises.map(pais => (
                    <option key={pais.paisid} value={pais.paisid}>
                      {pais.pais}
                    </option>
                  ))}
                </select>
              </div>

              {/* Empresa */}
              {selectedPais && (
                <div>
                  <label className="block text-sm font-bold text-green-500 font-mono mb-2 uppercase">
                    Empresa {isRequired && '*'}
                  </label>
                  <select
                    value={selectedEmpresa?.empresaid || ''}
                    onChange={(e) => {
                      const empresa = empresas.find(emp => emp.empresaid === Number(e.target.value));
                      handleEmpresaChange(empresa || null);
                    }}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!selectedPais || empresas.length === 0}
                  >
                    <option value="" disabled hidden>Selecciona Empresa</option>
                    {empresas.map(empresa => (
                      <option key={empresa.empresaid} value={empresa.empresaid}>
                        {empresa.empresa}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fundo */}
              {selectedEmpresa && (
                <div>
                  <label className="block text-sm font-bold text-green-500 font-mono mb-2 uppercase">
                    Fundo {isRequired && '*'}
                  </label>
                  <select
                    value={selectedFundo?.fundoid || ''}
                    onChange={(e) => {
                      const fundo = fundos.find(f => f.fundoid === Number(e.target.value));
                      handleFundoChange(fundo || null);
                    }}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!selectedEmpresa || fundos.length === 0}
                  >
                    <option value="" disabled hidden>Selecciona Fundo</option>
                    {fundos.map(fundo => (
                      <option key={fundo.fundoid} value={fundo.fundoid}>
                        {fundo.fundo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ubicación */}
              {selectedFundo && (
                <div>
                  <label className="block text-sm font-bold text-green-500 font-mono mb-2 uppercase">
                    Ubicación {isRequired && '*'}
                  </label>
                  <select
                    value={selectedUbicacion?.ubicacionid || ''}
                    onChange={(e) => {
                      const ubicacion = ubicaciones.find(u => u.ubicacionid === Number(e.target.value));
                      handleUbicacionChange(ubicacion || null);
                    }}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!selectedFundo || ubicaciones.length === 0}
                  >
                    <option value="" disabled hidden>Selecciona Ubicación</option>
                    {ubicaciones.map(ubicacion => (
                      <option key={ubicacion.ubicacionid} value={ubicacion.ubicacionid}>
                        {ubicacion.ubicacion}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Localización */}
              {selectedUbicacion && (
                <div>
                  <label className="block text-sm font-bold text-green-500 font-mono mb-2 uppercase">
                    Localización {isRequired && '*'}
                  </label>
                  <select
                    value={selectedLocalizacion?.localizacionid || ''}
                    onChange={(e) => {
                      const localizacion = localizaciones.find(l => l.localizacionid === Number(e.target.value));
                      handleLocalizacionChange(localizacion || null);
                    }}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-800 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!selectedUbicacion || localizaciones.length === 0}
                  >
                    <option value="" disabled hidden>Selecciona Localización</option>
                    {localizaciones.map(localizacion => (
                      <option key={localizacion.localizacionid} value={localizacion.localizacionid}>
                        {localizacion.localizacion}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

