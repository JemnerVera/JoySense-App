import React, { useState, useRef, useEffect } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useCompleteFilterData } from '../../hooks/useCompleteFilterData';
import { JoySenseService } from '../../services/backend-api';
import OverlayDropdown from '../shared/ui/buttons/PushDropdown';

interface DashboardFiltersProps {
  onFiltersChange?: (filters: {
    entidadId: number | null;
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  }) => void;
  showDateFilters?: boolean; // Nueva prop para controlar si mostrar filtros de fecha
  showActiveFiltersCount?: boolean; // Nueva prop para controlar si mostrar contador de filtros activos
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  onFiltersChange,
  showDateFilters = true, // Por defecto mostrar filtros de fecha
  showActiveFiltersCount = false // Por defecto no mostrar contador de filtros activos
}) => {
  const { 
    paisSeleccionado, 
    empresaSeleccionada, 
    fundoSeleccionado,
    entidadSeleccionada,
    ubicacionSeleccionada,
    setPaisSeleccionado,
    setEmpresaSeleccionada,
    setFundoSeleccionado,
    setEntidadSeleccionada,
    setUbicacionSeleccionada
  } = useFilters();

  const { paises, empresas, fundos } = useCompleteFilterData('');
  
  // Estados para entidades y ubicaciones filtradas
  const [entidades, setEntidades] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(false);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Usar directamente el contexto global como fuente de verdad (eliminar estados locales)
  const selectedEntidad = entidadSeleccionada;
  const selectedUbicacion = ubicacionSeleccionada;
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Estados para dropdowns
  const [isEntidadDropdownOpen, setIsEntidadDropdownOpen] = useState(false);
  const [isUbicacionDropdownOpen, setIsUbicacionDropdownOpen] = useState(false);
  const [isFechasDropdownOpen, setIsFechasDropdownOpen] = useState(false);

  const entidadDropdownRef = useRef<HTMLDivElement>(null);
  const ubicacionDropdownRef = useRef<HTMLDivElement>(null);
  const fechasDropdownRef = useRef<HTMLDivElement>(null);

  // Forzar re-render cuando cambien los valores del contexto global
  useEffect(() => {
    // Este useEffect se ejecuta cuando cambian los valores del contexto
    // y fuerza el re-render del componente
  }, [entidadSeleccionada, ubicacionSeleccionada, entidades.length, ubicaciones.length]);

  // Cerrar dropdowns cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (entidadDropdownRef.current && !entidadDropdownRef.current.contains(event.target as Node)) {
        setIsEntidadDropdownOpen(false);
      }
      if (ubicacionDropdownRef.current && !ubicacionDropdownRef.current.contains(event.target as Node)) {
        setIsUbicacionDropdownOpen(false);
      }
      if (fechasDropdownRef.current && !fechasDropdownRef.current.contains(event.target as Node)) {
        setIsFechasDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // No inicializar fechas por defecto - dejar vacías hasta que el usuario las seleccione

  // Notificar cambios de filtros
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        entidadId: selectedEntidad?.entidadid || null,
        ubicacionId: selectedUbicacion?.ubicacionid || null,
        startDate,
        endDate
      });
    }
  }, [selectedEntidad, selectedUbicacion, startDate, endDate, onFiltersChange]);

  // Cargar entidades basadas en el fundo seleccionado
  useEffect(() => {
    const cargarEntidades = async () => {
      if (!fundoSeleccionado) {
        setEntidades([]);
        return;
      }

      try {
        setLoadingEntidades(true);
        
        // Obtener todas las entidades
        const entidadesData = await JoySenseService.getTableData('entidad');
        
        // Obtener ubicaciones del fundo seleccionado
        const ubicacionesData = await JoySenseService.getTableData('ubicacion');
        const ubicacionesDelFundo = ubicacionesData.filter((ubicacion: any) => 
          ubicacion.fundoid === parseInt(fundoSeleccionado)
        );
        
        // Obtener localizaciones para encontrar entidades relacionadas
        const localizacionesData = await JoySenseService.getTableData('localizacion');
        
        // Encontrar entidades que tienen ubicaciones en este fundo
        const entidadIds = new Set();
        ubicacionesDelFundo.forEach((ubicacion: any) => {
          const localizacionesDeUbicacion = localizacionesData.filter((loc: any) => 
            loc.ubicacionid === ubicacion.ubicacionid
          );
          localizacionesDeUbicacion.forEach((loc: any) => {
            entidadIds.add(loc.entidadid);
          });
        });
        
        
        // Filtrar entidades
        const entidadesFiltradas = entidadesData.filter((entidad: any) => 
          entidadIds.has(entidad.entidadid)
        );
        
        setEntidades(entidadesFiltradas);
      } catch (error) {
        console.error('❌ Error cargando entidades:', error);
        setEntidades([]);
      } finally {
        setLoadingEntidades(false);
      }
    };

    cargarEntidades();
  }, [fundoSeleccionado, selectedEntidad]); // Agregar selectedEntidad para forzar recarga cuando cambia

  // Cargar ubicaciones basadas en el fundo seleccionado y entidad seleccionada
  useEffect(() => {
    const cargarUbicaciones = async () => {
      if (!fundoSeleccionado) {
        setUbicaciones([]);
        return;
      }

      try {
        setLoadingUbicaciones(true);
        
        const ubicacionesData = await JoySenseService.getTableData('ubicacion');
        
        // Filtrar ubicaciones del fundo seleccionado
        let ubicacionesFiltradas = ubicacionesData.filter((ubicacion: any) =>
          ubicacion.fundoid === parseInt(fundoSeleccionado)
        );

        // Obtener nodos con GPS para filtrar solo ubicaciones que tienen nodos con coordenadas
        try {
          // Verificar que el token esté disponible antes de llamar
          const { supabaseAuth } = await import('../../services/supabase-auth');
          const { data: { session } } = await supabaseAuth.auth.getSession();
          if (!session?.access_token) {
            // console.warn('DashboardFilters: No hay token de sesión, saltando filtro de nodos con GPS');
          }
          const nodosConGPS = await JoySenseService.getNodosConLocalizacion();

          // Extraer ubicaciones únicas que tienen nodos con GPS
          const ubicacionesConGPS = Array.from(new Set(
            nodosConGPS
              .filter((nodo: any) => nodo.latitud && nodo.longitud) // Solo nodos con coordenadas
              .map((nodo: any) => nodo.ubicacionid)
          ));

          // Filtrar ubicaciones para mostrar solo las que tienen nodos con GPS
          ubicacionesFiltradas = ubicacionesFiltradas.filter((ubicacion: any) =>
            ubicacionesConGPS.includes(ubicacion.ubicacionid)
          );
        } catch (error) {
          console.error('Error obteniendo nodos con GPS para filtrar ubicaciones:', error);
          // En caso de error, continuar con todas las ubicaciones del fundo
        }
        
        // Si hay una entidad seleccionada, filtrar también por entidad
        if (selectedEntidad) {
          const localizacionesData = await JoySenseService.getTableData('localizacion');
          
          // Obtener ubicaciones que están relacionadas con la entidad seleccionada
          const ubicacionIds = localizacionesData
            .filter((loc: any) => loc.entidadid === selectedEntidad.entidadid)
            .map((loc: any) => loc.ubicacionid);
          
          
          // Filtrar ubicaciones que están en el fundo Y en la entidad
          ubicacionesFiltradas = ubicacionesFiltradas.filter((ubicacion: any) => 
            ubicacionIds.includes(ubicacion.ubicacionid)
          );
          
        }
        
        setUbicaciones(ubicacionesFiltradas);
      } catch (error) {
        console.error('❌ Error cargando ubicaciones:', error);
        setUbicaciones([]);
      } finally {
        setLoadingUbicaciones(false);
      }
    };

    cargarUbicaciones();
  }, [fundoSeleccionado, selectedEntidad]);

  // Forzar recarga de entidades cuando se limpia la selección y hay fundo seleccionado
  // Esto asegura que las listas se actualicen después de cancelar la selección del nodo
  useEffect(() => {
    // Si hay fundo seleccionado pero no entidad seleccionada y las entidades están vacías
    // o si cambió selectedEntidad a null, recargar
    if (fundoSeleccionado && !selectedEntidad) {
      // Verificar si necesitamos recargar
      const shouldReload = entidades.length === 0;
      
      if (shouldReload) {
        const cargarEntidades = async () => {
          try {
            setLoadingEntidades(true);
            
            const entidadesData = await JoySenseService.getTableData('entidad');
            const ubicacionesData = await JoySenseService.getTableData('ubicacion');
            const ubicacionesDelFundo = ubicacionesData.filter((ubicacion: any) => 
              ubicacion.fundoid === parseInt(fundoSeleccionado)
            );
            
            const localizacionesData = await JoySenseService.getTableData('localizacion');
            
            const entidadIds = new Set();
            ubicacionesDelFundo.forEach((ubicacion: any) => {
              const localizacionesDeUbicacion = localizacionesData.filter((loc: any) => 
                loc.ubicacionid === ubicacion.ubicacionid
              );
              localizacionesDeUbicacion.forEach((loc: any) => {
                entidadIds.add(loc.entidadid);
              });
            });
            
            const entidadesFiltradas = entidadesData.filter((entidad: any) => 
              entidadIds.has(entidad.entidadid)
            );
            
            setEntidades(entidadesFiltradas);
          } catch (error) {
            console.error('❌ Error recargando entidades:', error);
          } finally {
            setLoadingEntidades(false);
          }
        };
        
        cargarEntidades();
      }
    }
  }, [fundoSeleccionado, selectedEntidad]);

  // Filtrar entidades basadas en el fundo seleccionado
  const filteredEntidades = entidades;

  // Las ubicaciones ya están filtradas en el useEffect
  const filteredUbicaciones = ubicaciones;

  // Limpiar selecciones cuando cambian los filtros padre
  // PERO solo si las listas ya están cargadas (no vacías)
  useEffect(() => {
    if (selectedEntidad && filteredEntidades.length > 0 && !filteredEntidades.find((e: any) => e.entidadid === selectedEntidad.entidadid)) {
      setEntidadSeleccionada(null);
    }
  }, [filteredEntidades, selectedEntidad, setEntidadSeleccionada]);

  useEffect(() => {
    if (selectedUbicacion && filteredUbicaciones.length > 0 && !filteredUbicaciones.find((u: any) => u.ubicacionid === selectedUbicacion.ubicacionid)) {
      setUbicacionSeleccionada(null);
    }
  }, [filteredUbicaciones, selectedUbicacion, setUbicacionSeleccionada]);


  const handleEntidadSelect = (entidad: any) => {
    setEntidadSeleccionada(entidad); // Solo actualizar contexto global
    setIsEntidadDropdownOpen(false);
    // Limpiar ubicación
    setUbicacionSeleccionada(null); // Limpiar contexto global
  };

  const handleUbicacionSelect = (ubicacion: any) => {
    setUbicacionSeleccionada(ubicacion); // Solo actualizar contexto global
    setIsUbicacionDropdownOpen(false);
  };

  const selectedPais = paises.find(p => p.paisid.toString() === paisSeleccionado);
  const selectedEmpresa = empresas.find(e => e.empresaid.toString() === empresaSeleccionada);
  const selectedFundo = fundos.find(f => f.fundoid.toString() === fundoSeleccionado);

  // Función para formatear fechas
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Fechas';
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleFechasToggle = () => {
    setIsFechasDropdownOpen(!isFechasDropdownOpen);
  };

  // Calcular filtros activos para indicadores visuales
  const activeFiltersCount = [
    paisSeleccionado && 'País',
    empresaSeleccionada && 'Empresa',
    fundoSeleccionado && 'Fundo',
    selectedEntidad && 'Entidad',
    selectedUbicacion && 'Ubicación',
    startDate && endDate && 'Fechas'
  ].filter(Boolean).length;

  // Atajo de teclado para reset (Ctrl+R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'r' && e.target === document.body) {
        e.preventDefault();
        // Reset all filters
        setPaisSeleccionado('');
        setEmpresaSeleccionada('');
        setFundoSeleccionado('');
        setEntidadSeleccionada(null);
        setUbicacionSeleccionada(null);
        setStartDate('');
        setEndDate('');
        setIsFechasDropdownOpen(false);
        console.log('🔄 Filtros reseteados con Ctrl+R');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPaisSeleccionado, setEmpresaSeleccionada, setFundoSeleccionado, setEntidadSeleccionada, setUbicacionSeleccionada]);

  return (
    <div className="flex items-center space-x-3">
      {/* Indicador de filtros activos */}
      {showActiveFiltersCount && activeFiltersCount > 0 && (
        <div
          className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800"
          title={`Filtros activos: ${[
            paisSeleccionado && `País: ${selectedPais?.pais || 'Seleccionado'}`,
            empresaSeleccionada && `Empresa: ${selectedEmpresa?.empresa || 'Seleccionada'}`,
            fundoSeleccionado && `Fundo: ${selectedFundo?.fundo || 'Seleccionado'}`,
            selectedEntidad && `Entidad: ${selectedEntidad?.entidad || 'Seleccionada'}`,
            selectedUbicacion && `Ubicación: ${selectedUbicacion?.ubicacion || 'Seleccionada'}`,
            startDate && endDate && `Fechas: ${formatDateRange()}`
          ].filter(Boolean).join(', ')}`}
        >
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => {
              setPaisSeleccionado('');
              setEmpresaSeleccionada('');
              setFundoSeleccionado('');
              setEntidadSeleccionada(null);
              setUbicacionSeleccionada(null);
              setStartDate('');
              setEndDate('');
              setIsFechasDropdownOpen(false);
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors ml-2"
            title="Limpiar todos los filtros (Ctrl+R)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Dropdown de Fechas - Solo mostrar si showDateFilters es true */}
      {showDateFilters && (
        <div className="relative" ref={fechasDropdownRef}>
          <button
            onClick={() => !fundoSeleccionado ? null : handleFechasToggle()}
            disabled={!fundoSeleccionado}
            className={`min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-green-600 dark:text-green-500 font-mono tracking-wider ${
              startDate && endDate ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
            }`}
            title={!fundoSeleccionado ? 'Selecciona un fundo primero' : 'Seleccionar rango de fechas'}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className={`${startDate && endDate ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-neutral-400'} truncate`}>
                {formatDateRange()}
              </span>
            </div>
            <svg className={`w-4 h-4 text-green-600 dark:text-green-500 transition-transform ${isFechasDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isFechasDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
              {!fundoSeleccionado ? (
                <div className="px-4 py-3 text-sm text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>SELECCIONA UN FUNDO PRIMERO</span>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-neutral-300 mb-1 font-mono tracking-wider">FECHA INICIAL</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          setStartDate(newStartDate);
                          // Auto-ajustar fecha final si es anterior
                          if (endDate && newStartDate > endDate) {
                            setEndDate(newStartDate);
                          }
                        }}
                        max={endDate || undefined}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-neutral-600 focus:border-orange-500 focus:outline-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-neutral-300 mb-1 font-mono tracking-wider">FECHA FINAL</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          const newEndDate = e.target.value;
                          setEndDate(newEndDate);
                          // Auto-ajustar fecha inicial si es posterior
                          if (startDate && newEndDate < startDate) {
                            setStartDate(newEndDate);
                          }
                        }}
                        min={startDate || undefined}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-neutral-600 focus:border-orange-500 focus:outline-none text-sm font-mono"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors font-mono"
                      >
                        LIMPIAR
                      </button>
                      <button
                        onClick={() => setIsFechasDropdownOpen(false)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors font-mono tracking-wider"
                      >
                        APLICAR
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
