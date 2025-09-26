import React, { useState, useRef, useEffect } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useCompleteFilterData } from '../../hooks/useCompleteFilterData';
import { JoySenseService } from '../../services/backend-api';
import OverlayDropdown from '../PushDropdown';

interface DashboardFiltersProps {
  onFiltersChange?: (filters: {
    entidadId: number | null;
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  }) => void;
  showDateFilters?: boolean; // Nueva prop para controlar si mostrar filtros de fecha
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  onFiltersChange,
  showDateFilters = true // Por defecto mostrar filtros de fecha
}) => {
  const { 
    paisSeleccionado, 
    empresaSeleccionada, 
    fundoSeleccionado,
    setPaisSeleccionado,
    setEmpresaSeleccionada,
    setFundoSeleccionado
  } = useFilters();

  const { paises, empresas, fundos } = useCompleteFilterData('');
  
  // Estados para entidades y ubicaciones filtradas
  const [entidades, setEntidades] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(false);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Estados locales para filtros del dashboard
  const [selectedEntidad, setSelectedEntidad] = useState<any>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Estados para dropdowns
  const [isEntidadDropdownOpen, setIsEntidadDropdownOpen] = useState(false);
  const [isUbicacionDropdownOpen, setIsUbicacionDropdownOpen] = useState(false);
  const [isFechasDropdownOpen, setIsFechasDropdownOpen] = useState(false);

  const entidadDropdownRef = useRef<HTMLDivElement>(null);
  const ubicacionDropdownRef = useRef<HTMLDivElement>(null);
  const fechasDropdownRef = useRef<HTMLDivElement>(null);

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
  }, [fundoSeleccionado]);

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

  // Filtrar entidades basadas en el fundo seleccionado
  const filteredEntidades = entidades;

  // Las ubicaciones ya están filtradas en el useEffect
  const filteredUbicaciones = ubicaciones;

  // Limpiar selecciones cuando cambian los filtros padre
  useEffect(() => {
    if (selectedEntidad && !filteredEntidades.find((e: any) => e.entidadid === selectedEntidad.entidadid)) {
      setSelectedEntidad(null);
    }
  }, [filteredEntidades, selectedEntidad]);

  useEffect(() => {
    if (selectedUbicacion && !filteredUbicaciones.find((u: any) => u.ubicacionid === selectedUbicacion.ubicacionid)) {
      setSelectedUbicacion(null);
    }
  }, [filteredUbicaciones, selectedUbicacion]);


  const handleEntidadSelect = (entidad: any) => {
    setSelectedEntidad(entidad);
    setIsEntidadDropdownOpen(false);
    // Limpiar ubicación
    setSelectedUbicacion(null);
  };

  const handleUbicacionSelect = (ubicacion: any) => {
    setSelectedUbicacion(ubicacion);
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

  return (
    <div className="flex items-center space-x-3">
      {/* Dropdown de Entidad */}
      <div className="relative" ref={entidadDropdownRef}>
        <OverlayDropdown
          isOpen={isEntidadDropdownOpen}
          onToggle={() => setIsEntidadDropdownOpen(!isEntidadDropdownOpen)}
          title="Entidad"
          icon=""
          selectedValue={selectedEntidad?.entidad}
          placeholder="Entidad"
          className="w-full"
          buttonClassName="min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:bg-neutral-700 transition-colors px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white font-mono"
          dropdownClassName="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50 max-h-60 overflow-hidden"
        >
          {loadingEntidades ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-neutral-400 text-sm font-mono">CARGANDO ENTIDADES...</p>
            </div>
          ) : filteredEntidades.length > 0 ? (
            filteredEntidades.map((entidad: any) => (
              <button
                key={entidad.entidadid}
                onClick={() => handleEntidadSelect(entidad)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-mono tracking-wider ${
                  selectedEntidad?.entidadid === entidad.entidadid
                    ? 'bg-orange-500 text-white' 
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                {entidad.entidad.toUpperCase()}
              </button>
            ))
          ) : (
            <p className="text-neutral-400 text-sm font-mono tracking-wider">
              {!fundoSeleccionado ? 'SELECCIONA UN FUNDO PRIMERO' : 'NO HAY ENTIDADES DISPONIBLES'}
            </p>
          )}
        </OverlayDropdown>
      </div>

      {/* Dropdown de Ubicación */}
      <div className="relative" ref={ubicacionDropdownRef}>
        <OverlayDropdown
          isOpen={isUbicacionDropdownOpen}
          onToggle={() => setIsUbicacionDropdownOpen(!isUbicacionDropdownOpen)}
          title="Ubicación"
          icon=""
          selectedValue={selectedUbicacion?.ubicacion}
          placeholder="Ubicación"
          className="w-full"
          buttonClassName="min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:bg-neutral-700 transition-colors px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white font-mono"
          dropdownClassName="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50 max-h-60 overflow-hidden"
        >
          {loadingUbicaciones ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-neutral-400 text-sm font-mono">CARGANDO UBICACIONES...</p>
            </div>
          ) : filteredUbicaciones.length > 0 ? (
            filteredUbicaciones.map((ubicacion: any) => (
              <button
                key={ubicacion.ubicacionid}
                onClick={() => handleUbicacionSelect(ubicacion)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-mono tracking-wider ${
                  selectedUbicacion?.ubicacionid === ubicacion.ubicacionid
                    ? 'bg-orange-500 text-white' 
                    : 'text-white hover:bg-neutral-800'
                }`}
              >
                {ubicacion.ubicacion.toUpperCase()}
              </button>
            ))
          ) : (
            <p className="text-neutral-400 text-sm font-mono tracking-wider">
              {!selectedEntidad ? 'SELECCIONA UNA ENTIDAD PRIMERO' : 'NO HAY UBICACIONES DISPONIBLES'}
            </p>
          )}
        </OverlayDropdown>
      </div>

      {/* Dropdown de Fechas - Solo mostrar si showDateFilters es true */}
      {showDateFilters && (
        <div className="relative" ref={fechasDropdownRef}>
          <button
            onClick={() => !fundoSeleccionado ? null : handleFechasToggle()}
            disabled={!fundoSeleccionado}
            className={`min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:bg-neutral-700 transition-colors px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white font-mono ${
              startDate && endDate ? 'border-orange-500' : ''
            }`}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className={`${startDate && endDate ? 'text-white' : 'text-neutral-400'} truncate`}>
                {formatDateRange()}
              </span>
            </div>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isFechasDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isFechasDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
              {!fundoSeleccionado ? (
                <div className="px-3 py-2 text-sm text-neutral-400 font-mono">
                  SELECCIONA UN FUNDO PRIMERO
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-neutral-300 mb-1 font-mono tracking-wider">FECHA INICIAL</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-600 focus:border-orange-500 focus:outline-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-300 mb-1 font-mono tracking-wider">FECHA FINAL</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-600 focus:border-orange-500 focus:outline-none text-sm font-mono"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
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
