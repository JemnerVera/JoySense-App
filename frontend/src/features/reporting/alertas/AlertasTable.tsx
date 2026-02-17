import React, { useState, useEffect, startTransition, useMemo, useRef } from 'react';
import { JoySenseService } from '../../../services/backend-api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAlertasFilter } from '../../../contexts/AlertasFilterContext';
import { ALERTAS_CONFIG } from '../../../config/alertasConfig';

interface AlertaData {
  alertaid: string; // UUID de alerta_regla
  uuid_alerta_reglaid: string;
  reglaid: number;
  localizacionid: number;
  medicionid?: number;
  fecha: string;
  valor?: number; // Valor que activó la alerta
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  // Relaciones
  regla?: {
    reglaid: number;
    nombre: string;
    prioridad: number;
  };
  localizacion?: {
    localizacionid: number;
    localizacion: string;
    nodoid: number;
    metricaid: number;
    sensorid: number;
    nodo?: {
      nodoid: number;
      nodo: string;
      ubicacionid: number;
      ubicacion?: {
        ubicacionid: number;
        ubicacion: string;
      };
    };
  };
  medicion?: {
    medicionid: number;
    medicion: number;
    fecha: string;
  };
  umbral?: {
    umbralid: number;
    umbral: string;
    minimo: number;
    maximo: number;
    estandar?: number;
    operador: string;
    inversion: boolean;
    metricaid?: number;
    criticidad?: {
      criticidadid: number;
      criticidad: string;
      grado: number;
    } | string | null;
  };
  // Campos calculados
  umbral_intervalo?: string; // "minimo - maximo"
  valor_medido?: number;
  umbral_minimo?: number;
  umbral_maximo?: number;
}

const AlertasTable: React.FC = () => {
  const { t } = useLanguage();
  const {
    filtroCriticidad,
    filtroUbicacion,
    filtroLocalizacion,
    setCriticidadesDisponibles,
    setUbicacionesDisponibles,
    setLocalizacionesDisponibles
  } = useAlertasFilter();
  
  const [alertas, setAlertas] = useState<AlertaData[]>([]);
  const [allAlertas, setAllAlertas] = useState<AlertaData[]>([]); // Todas las alertas sin filtrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Estados para comboboxes de filtros
  const [selectedLocalizacion, setSelectedLocalizacion] = useState<any>(null);
  const [localizaciones, setLocalizaciones] = useState<any[]>([]);
  const [isLocalizacionDropdownOpen, setIsLocalizacionDropdownOpen] = useState(false);
  const [localizacionSearchTerm, setLocalizacionSearchTerm] = useState('');
  const localizacionDropdownRef = useRef<HTMLDivElement>(null);
  const [localizacionDropdownPosition, setLocalizacionDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // Estados para intervalo de fechas
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const loadAlertas = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Usar el nuevo endpoint específico para alerta_regla que incluye todas las relaciones
      // Cargar todas las alertas (sin paginación) para poder filtrar y obtener opciones disponibles
      startTransition(() => {
        JoySenseService.getAlertasRegla({
          page: 1,
          pageSize: 10000 // Cargar todas para filtrar
        })
          .then(result => {
            let allData: AlertaData[] = [];
            if (result && typeof result === 'object' && 'pagination' in result) {
              allData = Array.isArray(result.data) ? result.data : [];
            } else if (Array.isArray(result)) {
              allData = result;
            }
            
            setAllAlertas(allData);
            
            // Extraer opciones disponibles para los filtros
            const criticidades = new Set<string>();
            const ubicaciones = new Set<string>();
            const localizaciones = new Set<string>();
            
            allData.forEach(alerta => {
              // Criticidad desde umbral
              if (alerta.umbral?.criticidad) {
                const criticidad = typeof alerta.umbral.criticidad === 'string' 
                  ? alerta.umbral.criticidad 
                  : (alerta.umbral.criticidad as any)?.criticidad;
                if (criticidad) criticidades.add(criticidad);
              }
              
              // Ubicación desde localizacion -> nodo -> ubicacion
              if (alerta.localizacion?.nodo?.ubicacion?.ubicacion) {
                ubicaciones.add(alerta.localizacion.nodo.ubicacion.ubicacion);
              }
              
              // Localización
              if (alerta.localizacion?.localizacion) {
                localizaciones.add(alerta.localizacion.localizacion);
              }
            });
            
            // Actualizar opciones disponibles en el contexto
            if (setCriticidadesDisponibles) {
              setCriticidadesDisponibles(Array.from(criticidades).sort());
            }
            if (setUbicacionesDisponibles) {
              setUbicacionesDisponibles(Array.from(ubicaciones).sort());
            }
            if (setLocalizacionesDisponibles) {
              setLocalizacionesDisponibles(Array.from(localizaciones).sort());
            }
          })
          .catch(err => {
            console.error('Error cargando alertas:', err);
            setError('Error al cargar las alertas');
            setAllAlertas([]);
            setAlertas([]);
            setTotalRecords(0);
          })
          .finally(() => {
            setLoading(false);
          });
      });
    } catch (err) {
      console.error('Error en loadAlertas:', err);
      setError('Error al cargar las alertas');
      setLoading(false);
    }
  };
  
  // Cargar localizaciones disponibles
  useEffect(() => {
    const loadLocalizaciones = async () => {
      try {
        const localizacionesData = await JoySenseService.getLocalizaciones();
        setLocalizaciones(localizacionesData || []);
      } catch (err: any) {
        console.error('Error cargando localizaciones:', err);
      }
    };
    loadLocalizaciones();
  }, []);

  // Calcular posición del dropdown de localización cuando se abre
  useEffect(() => {
    if (isLocalizacionDropdownOpen && localizacionDropdownRef.current) {
      const rect = localizacionDropdownRef.current.getBoundingClientRect();
      setLocalizacionDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isLocalizacionDropdownOpen]);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (localizacionDropdownRef.current && !localizacionDropdownRef.current.contains(event.target as Node)) {
        setIsLocalizacionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar localizaciones por término de búsqueda
  const filteredLocalizaciones = useMemo(() => {
    if (!localizacionSearchTerm.trim()) {
      return localizaciones;
    }
    return localizaciones.filter((loc: any) =>
      loc.localizacion?.toLowerCase().includes(localizacionSearchTerm.toLowerCase())
    );
  }, [localizaciones, localizacionSearchTerm]);
  
  // Filtrar alertas según los filtros seleccionados
  const filteredAlertas = useMemo(() => {
    let filtered = [...allAlertas];
    
    // Filtrar por criticidad
    if (filtroCriticidad && filtroCriticidad !== 'todas' && filtroCriticidad !== ALERTAS_CONFIG.DEFAULT_FILTERS.CRITICIDAD) {
      filtered = filtered.filter(alerta => {
        const criticidad = alerta.umbral?.criticidad;
        const criticidadNombre = typeof criticidad === 'string' 
          ? criticidad 
          : (criticidad as any)?.criticidad;
        return criticidadNombre === filtroCriticidad;
      });
    }
    
    // Filtrar por ubicación
    if (filtroUbicacion && filtroUbicacion !== 'todas' && filtroUbicacion !== ALERTAS_CONFIG.DEFAULT_FILTERS.UBICACION) {
      filtered = filtered.filter(alerta => {
        const ubicacion = alerta.localizacion?.nodo?.ubicacion?.ubicacion;
        return ubicacion === filtroUbicacion;
      });
    }
    
    // Filtrar por localización
    if (filtroLocalizacion && filtroLocalizacion !== 'todas') {
      filtered = filtered.filter(alerta => {
        const localizacion = alerta.localizacion?.localizacion;
        return localizacion === filtroLocalizacion;
      });
    }
    
    return filtered;
  }, [allAlertas, filtroCriticidad, filtroUbicacion, filtroLocalizacion]);
  
  // Aplicar paginación a las alertas filtradas
  const paginatedAlertas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAlertas.slice(startIndex, endIndex);
  }, [filteredAlertas, currentPage, itemsPerPage]);
  
  // Actualizar alertas y total cuando cambian los filtros
  useEffect(() => {
    setAlertas(paginatedAlertas);
    setTotalRecords(filteredAlertas.length);
    // Si la página actual está fuera del rango, volver a la página 1
    if (currentPage > 1 && paginatedAlertas.length === 0) {
      setCurrentPage(1);
    }
  }, [paginatedAlertas, filteredAlertas.length, currentPage]);

  useEffect(() => {
    loadAlertas(currentPage);
  }, [currentPage]);
  
  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filtroCriticidad, filtroUbicacion, filtroLocalizacion, selectedLocalizacion, startDate, endDate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statusid: number) => {
    switch (statusid) {
      case 1:
        return (
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-900 text-blue-300 border border-blue-700 font-mono tracking-wider">
              {t('status.active')}
            </span>
        );
      case 0:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-900 text-red-300 border border-red-700 font-mono tracking-wider">
            {t('status.inactive')}
          </span>
        );
      case -1:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-900 text-yellow-300 border border-yellow-700 font-mono tracking-wider">
            PROCESADA
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-mono tracking-wider">
            DESCONOCIDO
          </span>
        );
    }
  };


  // Paginación - Los datos ya vienen paginados del servidor
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-neutral-400 font-mono tracking-wider">{t('status.loading')} {t('tabs.alerts')}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-500 mb-2 font-mono tracking-wider">{t('status.error')}</h3>
          <p className="text-gray-600 dark:text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => loadAlertas(currentPage)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-mono tracking-wider"
          >
{t('buttons.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 font-mono tracking-wider">{t('reports.alerts.no_data')}</h3>
          <p className="text-gray-600 dark:text-neutral-400 font-mono tracking-wider">No se encontraron registros de alertas en la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Container con comboboxes de filtros */}
      <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-3 relative">
        {/* Botón X para cancelar selección */}
        {(selectedLocalizacion || startDate || endDate) && (
          <button
            onClick={() => {
              setSelectedLocalizacion(null);
              setStartDate(() => {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              });
              setEndDate(() => {
                const date = new Date();
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              });
              setLocalizacionSearchTerm('');
            }}
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-mono flex items-center justify-center transition-colors"
            title="Cancelar selección"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <div className="flex items-start gap-2 flex-nowrap overflow-x-auto dashboard-scrollbar-blue justify-center" style={{ maxWidth: '100%', width: '100%' }}>
          {/* Selector de Localización */}
          <div className="flex flex-col flex-shrink-0" ref={localizacionDropdownRef}>
            <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
              Localización:
            </label>
            <div className="relative">
              <button
                onClick={() => setIsLocalizacionDropdownOpen(!isLocalizacionDropdownOpen)}
                className="h-8 min-w-[120px] px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs flex items-center justify-between"
              >
                <span className={selectedLocalizacion ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                  {selectedLocalizacion?.localizacion || 'Todas'}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isLocalizacionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLocalizacionDropdownOpen && localizacionDropdownPosition && (
                <div 
                  className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
                  style={{
                    top: `${localizacionDropdownPosition.top}px`,
                    left: `${localizacionDropdownPosition.left}px`,
                    width: `${localizacionDropdownPosition.width}px`
                  }}
                >
                  <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                    <input
                      type="text"
                      value={localizacionSearchTerm}
                      onChange={(e) => setLocalizacionSearchTerm(e.target.value)}
                      placeholder="Buscar..."
                      className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                    <button
                      onClick={() => {
                        setSelectedLocalizacion(null);
                        setIsLocalizacionDropdownOpen(false);
                        setLocalizacionSearchTerm('');
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                        !selectedLocalizacion
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Todas
                    </button>
                    {filteredLocalizaciones.length > 0 ? (
                      filteredLocalizaciones.map((localizacion: any) => (
                        <button
                          key={localizacion.localizacionid}
                          onClick={() => {
                            setSelectedLocalizacion(localizacion);
                            setIsLocalizacionDropdownOpen(false);
                            setLocalizacionSearchTerm('');
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                            selectedLocalizacion?.localizacionid === localizacion.localizacionid
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {localizacion.localizacion}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 font-mono text-center">
                        No se encontraron localizaciones
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Separador vertical */}
          <div className="h-16 w-px bg-gray-300 dark:bg-neutral-600 flex-shrink-0"></div>

          {/* Intervalo de Fechas */}
          <div className="flex flex-col flex-shrink-0">
            <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
              Fecha Inicio:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
              className="h-8 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              style={{
                colorScheme: 'dark',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          <div className="flex flex-col flex-shrink-0">
            <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
              Fecha Fin:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="h-8 w-36 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              style={{
                colorScheme: 'dark',
                WebkitAppearance: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Container de la tabla */}
      <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6 border border-gray-300 dark:border-neutral-700">
        {/* Tabla */}
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 dark:border-neutral-700">
              <th className="text-left py-3 px-4 font-bold text-blue-500 font-mono tracking-wider">{t('reports.table.id_alert')}</th>
              <th className="text-left py-3 px-4 font-bold text-blue-500 font-mono tracking-wider">LOCALIZACIÓN</th>
              <th className="text-left py-3 px-4 font-bold text-blue-500 font-mono tracking-wider">{t('reports.table.threshold')}</th>
              <th className="text-left py-3 px-4 font-bold text-blue-500 font-mono tracking-wider">{t('reports.table.measurement')}</th>
              <th className="text-left py-3 px-4 font-bold text-blue-500 font-mono tracking-wider">{t('reports.table.alert_date')}</th>
              <th className="text-left py-3 px-4 font-bold text-blue-500 font-mono tracking-wider">{t('reports.table.creation_date')}</th>
              <th className="text-left py-3 px-4 font-bold text-blue-500 font-mono tracking-wider">{t('reports.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((alerta) => (
              <tr key={alerta.uuid_alerta_reglaid || alerta.alertaid} className="border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-800/50">
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {alerta.uuid_alerta_reglaid ? alerta.uuid_alerta_reglaid.substring(0, 8) : alerta.alertaid}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {alerta.localizacion?.localizacion || 'N/A'}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {alerta.umbral ? (
                    <div>
                      <div className="font-semibold">{alerta.umbral.umbral}</div>
                      <div className="text-xs text-gray-600 dark:text-neutral-400">
                        Intervalo: {alerta.umbral_intervalo || `${alerta.umbral.minimo} - ${alerta.umbral.maximo}`}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-neutral-500">Sin umbral</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {alerta.valor != null ? (
                    <div>
                      <div className="font-semibold">{alerta.valor.toFixed(2)}</div>
                      {alerta.medicion && (
                        <div className="text-xs text-gray-600 dark:text-neutral-400">
                          Medición {alerta.medicionid}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-neutral-500">
                      {alerta.medicionid ? `Medición ${alerta.medicionid}` : 'Sin medición'}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {formatDate(alerta.fecha)}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {formatDate(alerta.datecreated)}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(alerta.statusid)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-neutral-400 font-mono">
            PÁGINA {currentPage} DE {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Primera página"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1)
                setCurrentPage(newPage)
              }}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Página anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1)
                setCurrentPage(newPage)
              }}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Página siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Última página"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default AlertasTable;
