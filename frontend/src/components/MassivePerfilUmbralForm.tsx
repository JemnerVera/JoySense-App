// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect, useMemo, memo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import { useLanguage } from '../contexts/LanguageContext';
import { JoySenseService } from '../services/backend-api';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface MassivePerfilUmbralFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  onApply: (data: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName?: (paisId: string) => string;
  getEmpresaName?: (empresaId: string) => string;
  getFundoName?: (fundoId: string) => string;
  onFormDataChange?: (formData: any) => void;
}

interface SelectedNode {
  nodoid: number;
  nodo: string;
  selected: boolean;
  datecreated?: string;
}

interface UmbralData {
  umbralid: number;
  umbral: string;
  nodoid: number;
  tipoid: number;
  metricaid: number;
  perfilid: number | null;
}

interface FormData {
  fundoid: number | null;
  entidadid: number | null;
  nodoid: number[]; // Cambiar a array para múltiples nodos
}

interface PerfilUmbralDataToApply {
  perfilid: number;
  umbralid: number;
  statusid: number;
}

// ============================================================================
// COMPONENT DECLARATION
// ============================================================================

export const MassivePerfilUmbralForm = memo(function MassivePerfilUmbralForm({
  getUniqueOptionsForField,
  onApply,
  onCancel,
  loading = false,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  getPaisName,
  getEmpresaName,
  getFundoName,
  onFormDataChange
}: MassivePerfilUmbralFormProps) {
  const { t } = useLanguage();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    fundoid: null,
    entidadid: null,
    nodoid: [] // Array para múltiples nodos
  });

  const [umbralesDelNodo, setUmbralesDelNodo] = useState<UmbralData[]>([]);
  const [loadingUmbrales, setLoadingUmbrales] = useState(false);
  const [perfilUmbralesAsignados, setPerfilUmbralesAsignados] = useState<Map<number, number[]>>(new Map()); // umbralid -> perfilid[]
  const [perfilDropdownOpen, setPerfilDropdownOpen] = useState<Map<number, boolean>>(new Map()); // umbralid -> isOpen
  const [perfilSearchTerms, setPerfilSearchTerms] = useState<Map<number, string>>(new Map()); // umbralid -> searchTerm
  const [perfilPorTipo, setPerfilPorTipo] = useState<Map<number, number | null>>(new Map()); // tipoid -> perfilid | null (deprecated, usar perfilesGlobales)
  const [tipoDropdownOpen, setTipoDropdownOpen] = useState<Map<number, boolean>>(new Map()); // tipoid -> isOpen
  const [tipoSearchTerms, setTipoSearchTerms] = useState<Map<number, string>>(new Map()); // tipoid -> searchTerm
  const [perfilesGlobales, setPerfilesGlobales] = useState<number[]>([]); // Perfiles seleccionados globalmente
  const [globalPerfilDropdownOpen, setGlobalPerfilDropdownOpen] = useState(false);
  const [globalPerfilSearchTerm, setGlobalPerfilSearchTerm] = useState('');

  // Obtener opciones para los dropdowns
  const fundosOptions = useMemo(() => 
    getUniqueOptionsForField('fundoid'), [getUniqueOptionsForField]
  );

  const entidadesOptions = useMemo(() => 
    getUniqueOptionsForField('entidadid'), [getUniqueOptionsForField]
  );

  const nodosOptions = useMemo(() => {
    if (!formData.fundoid || !formData.entidadid) return [];
    return getUniqueOptionsForField('nodoid', { 
      fundoid: formData.fundoid.toString(),
      entidadid: formData.entidadid.toString()
    });
  }, [formData.fundoid, formData.entidadid, getUniqueOptionsForField]);

  const perfilesOptions = useMemo(() => 
    getUniqueOptionsForField('perfilid'), [getUniqueOptionsForField]
  );

  // Cargar umbrales cuando se seleccionan nodos
  useEffect(() => {
    const loadUmbralesDelNodo = async () => {
      if (!formData.nodoid || formData.nodoid.length === 0) {
        setUmbralesDelNodo([]);
        setPerfilUmbralesAsignados(new Map());
        return;
      }

      try {
        setLoadingUmbrales(true);
        const allUmbrales = await JoySenseService.getTableData('umbral', 1000);
        const umbralesFiltrados = allUmbrales.filter((u: any) => 
          formData.nodoid.includes(u.nodoid) && u.statusid === 1 // Solo umbrales activos de los nodos seleccionados
        );

        // Obtener perfiles ya asignados
        const allPerfilUmbrales = await JoySenseService.getTableData('perfilumbral', 1000);
        const asignadosMap = new Map<number, number[]>();
        
        umbralesFiltrados.forEach((umbral: any) => {
          const perfilesUmbral = allPerfilUmbrales.filter((pu: any) => 
            pu.umbralid === umbral.umbralid && pu.statusid === 1
          );
          if (perfilesUmbral.length > 0) {
            asignadosMap.set(umbral.umbralid, perfilesUmbral.map((pu: any) => pu.perfilid));
          }
        });

        setUmbralesDelNodo(umbralesFiltrados);
        setPerfilUmbralesAsignados(asignadosMap);
      } catch (error) {
        console.error('Error cargando umbrales del nodo:', error);
        setUmbralesDelNodo([]);
        setPerfilUmbralesAsignados(new Map());
      } finally {
        setLoadingUmbrales(false);
      }
    };

    loadUmbralesDelNodo();
  }, [formData.nodoid]);

  // Aplicar perfiles globales a todos los umbrales cuando cambian
  useEffect(() => {
    if (umbralesDelNodo.length > 0) {
      setPerfilUmbralesAsignados(prev => {
        const newMap = new Map(prev);
        umbralesDelNodo.forEach(umbral => {
          const perfilesActuales = newMap.get(umbral.umbralid) || [];
          // Mantener perfiles que no son globales (seleccionados individualmente)
          // y agregar/quitar perfiles globales según corresponda
          const perfilesNoGlobales = perfilesActuales.filter(p => !perfilesGlobales.includes(p));
          // Agregar perfiles globales
          const nuevosPerfiles = Array.from(new Set([...perfilesNoGlobales, ...perfilesGlobales]));
          if (nuevosPerfiles.length > 0) {
            newMap.set(umbral.umbralid, nuevosPerfiles);
          } else {
            newMap.delete(umbral.umbralid);
          }
        });
        return newMap;
      });
    }
  }, [perfilesGlobales, umbralesDelNodo]);

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.perfil-dropdown-container') && 
          !target.closest('.tipo-perfil-dropdown-container') &&
          !target.closest('.global-perfil-dropdown-container')) {
        setPerfilDropdownOpen(new Map());
        setTipoDropdownOpen(new Map());
        setGlobalPerfilDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener nombres de tipos y métricas para mostrar
  const tiposData = useMemo(() => {
    return getUniqueOptionsForField('tipoid');
  }, [getUniqueOptionsForField]);

  const metricasData = useMemo(() => {
    return getUniqueOptionsForField('metricaid');
  }, [getUniqueOptionsForField]);

  // Organizar umbrales por tipo y métrica para mostrar
  const umbralesOrganizados = useMemo(() => {
    if (!umbralesDelNodo.length) return {};

    const organizados: { [tipoid: number]: { [metricaid: number]: UmbralData[] } } = {};

    umbralesDelNodo.forEach((umbral) => {
      if (!organizados[umbral.tipoid]) {
        organizados[umbral.tipoid] = {};
      }
      if (!organizados[umbral.tipoid][umbral.metricaid]) {
        organizados[umbral.tipoid][umbral.metricaid] = [];
      }
      organizados[umbral.tipoid][umbral.metricaid].push(umbral);
    });

    return organizados;
  }, [umbralesDelNodo]);

  // Manejar toggle de perfil para un umbral específico
  const handlePerfilToggle = (umbralid: number, perfilid: number) => {
    // Si el perfil está en perfilesGlobales, no permitir quitarlo individualmente
    if (perfilesGlobales.includes(perfilid)) {
      return; // Los perfiles globales no se pueden quitar individualmente
    }
    
    setPerfilUmbralesAsignados(prev => {
      const newMap = new Map(prev);
      const perfilesActuales = newMap.get(umbralid) || [];
      
      if (perfilesActuales.includes(perfilid)) {
        // Remover perfil (solo si no es global)
        const nuevosPerfiles = perfilesActuales.filter(p => p !== perfilid);
        // Siempre mantener perfiles globales
        const perfilesFinales = Array.from(new Set([...nuevosPerfiles, ...perfilesGlobales]));
        if (perfilesFinales.length > 0) {
          newMap.set(umbralid, perfilesFinales);
        } else {
          newMap.delete(umbralid);
        }
      } else {
        // Agregar perfil
        const perfilesFinales = Array.from(new Set([...perfilesActuales, perfilid]));
        newMap.set(umbralid, perfilesFinales);
      }
      return newMap;
    });
  };

  // Manejar toggle del dropdown
  const handleDropdownToggle = (umbralid: number) => {
    setPerfilDropdownOpen(prev => {
      const newMap = new Map(prev);
      newMap.set(umbralid, !newMap.get(umbralid));
      return newMap;
    });
  };

  // Manejar término de búsqueda
  const handleSearchTermChange = (umbralid: number, term: string) => {
    setPerfilSearchTerms(prev => {
      const newMap = new Map(prev);
      newMap.set(umbralid, term);
      return newMap;
    });
  };

  // Obtener todos los umbrales de un tipo específico
  const getUmbralesPorTipo = (tipoid: number): number[] => {
    return umbralesDelNodo
      .filter(umbral => umbral.tipoid === tipoid)
      .map(umbral => umbral.umbralid);
  };

  // Manejar selección de perfil a nivel de tipo
  const handlePerfilPorTipoChange = (tipoid: number, perfilid: number | null) => {
    const perfilAnterior = perfilPorTipo.get(tipoid);
    
    setPerfilPorTipo(prev => {
      const newMap = new Map(prev);
      if (perfilid) {
        newMap.set(tipoid, perfilid);
      } else {
        newMap.delete(tipoid);
      }
      return newMap;
    });

    const umbralesDelTipo = getUmbralesPorTipo(tipoid);
    
    if (perfilid) {
      // Aplicar el perfil a todos los umbrales de este tipo
      setPerfilUmbralesAsignados(prev => {
        const newMap = new Map(prev);
        umbralesDelTipo.forEach(umbralid => {
          const perfilesActuales = newMap.get(umbralid) || [];
          if (!perfilesActuales.includes(perfilid)) {
            newMap.set(umbralid, [...perfilesActuales, perfilid]);
          }
        });
        return newMap;
      });
    } else if (perfilAnterior) {
      // Remover el perfil anterior de todos los umbrales de este tipo
      setPerfilUmbralesAsignados(prev => {
        const newMap = new Map(prev);
        umbralesDelTipo.forEach(umbralid => {
          const perfilesActuales = newMap.get(umbralid) || [];
          const nuevosPerfiles = perfilesActuales.filter(p => p !== perfilAnterior);
          if (nuevosPerfiles.length > 0) {
            newMap.set(umbralid, nuevosPerfiles);
          } else {
            newMap.delete(umbralid);
          }
        });
        return newMap;
      });
    }
  };

  // Manejar toggle del dropdown de tipo
  const handleTipoDropdownToggle = (tipoid: number) => {
    setTipoDropdownOpen(prev => {
      const newMap = new Map(prev);
      newMap.set(tipoid, !newMap.get(tipoid));
      return newMap;
    });
  };

  // Manejar término de búsqueda de tipo
  const handleTipoSearchTermChange = (tipoid: number, term: string) => {
    setTipoSearchTerms(prev => {
      const newMap = new Map(prev);
      newMap.set(tipoid, term);
      return newMap;
    });
  };

  // Manejar toggle de perfil global
  const handleGlobalPerfilToggle = (perfilid: number) => {
    setPerfilesGlobales(prev => {
      if (prev.includes(perfilid)) {
        return prev.filter(p => p !== perfilid);
      } else {
        return [...prev, perfilid];
      }
    });
  };

  // Validar formulario
  const isFormValid = () => {
    return formData.fundoid && 
           formData.entidadid && 
           formData.nodoid.length > 0 && 
           perfilUmbralesAsignados.size > 0;
  };

  // Manejar aplicación de cambios
  const handleApply = () => {
    if (!isFormValid()) return;

    const dataToApply: PerfilUmbralDataToApply[] = [];

    perfilUmbralesAsignados.forEach((perfilesIds, umbralid) => {
      perfilesIds.forEach(perfilid => {
        dataToApply.push({
          perfilid,
          umbralid,
          statusid: 1 // Activo por defecto
        });
      });
    });

    onApply(dataToApply);
  };

  // Limpiar formulario
  const handleCancel = () => {
    setFormData({
      fundoid: null,
      entidadid: null,
      nodoid: []
    });
    setUmbralesDelNodo([]);
    setPerfilUmbralesAsignados(new Map());
    setPerfilDropdownOpen(new Map());
    setPerfilSearchTerms(new Map());
    setPerfilPorTipo(new Map());
    setTipoDropdownOpen(new Map());
    setTipoSearchTerms(new Map());
    setPerfilesGlobales([]);
    setGlobalPerfilDropdownOpen(false);
    setGlobalPerfilSearchTerm('');
    onCancel();
  };

  // Reportar cambios al sistema de detección
  useEffect(() => {
    if (onFormDataChange) {
      const hasData = formData.fundoid !== null || 
                     formData.entidadid !== null || 
                     formData.nodoid.length > 0 ||
                     perfilUmbralesAsignados.size > 0;
      
      onFormDataChange({
        fundoid: formData.fundoid,
        entidadid: formData.entidadid,
        nodoid: formData.nodoid,
        hasData
      });
    }
  }, [formData, perfilUmbralesAsignados.size, onFormDataChange]);

  // Obtener nombre del tipo
  const getTipoName = (tipoid: number) => {
    const tipo = tiposData.find(t => parseInt(t.value.toString()) === tipoid);
    return tipo?.label || `Tipo ${tipoid}`;
  };

  // Obtener nombre de la métrica
  const getMetricaName = (metricaid: number) => {
    const metrica = metricasData.find(m => parseInt(m.value.toString()) === metricaid);
    return metrica?.label || `Métrica ${metricaid}`;
  };

  // Obtener nombre del perfil
  const getPerfilName = (perfilid: number) => {
    const perfil = perfilesOptions.find(p => parseInt(p.value.toString()) === perfilid);
    return perfil?.label || `Perfil ${perfilid}`;
  };

  return (
    <div className="space-y-6">
      {/* Fila 1: País y Empresa */}
      {(paisSeleccionado || empresaSeleccionada) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paisSeleccionado && getPaisName && (
            <div>
              <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                PAÍS
              </label>
              <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
                {getPaisName(paisSeleccionado)}
              </div>
            </div>
          )}
          {empresaSeleccionada && getEmpresaName && (
            <div>
              <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                EMPRESA
              </label>
              <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
                {getEmpresaName(empresaSeleccionada)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fila 2: Fundo y Entidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            {t('table_headers.fund')}
          </label>
          {fundosOptions.length === 1 ? (
            <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
              {fundosOptions[0].label}
            </div>
          ) : (
            <SelectWithPlaceholder
              options={fundosOptions}
              value={formData.fundoid}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  fundoid: value ? parseInt(value.toString()) : null,
                  entidadid: null,
                  nodoid: []
                }));
              }}
              placeholder={t('umbral.select_fund')}
              disabled={loading}
            />
          )}
        </div>

        <div>
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            {t('table_headers.entity')}
          </label>
          {entidadesOptions.length === 1 ? (
            <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
              {entidadesOptions[0].label}
            </div>
          ) : (
            <SelectWithPlaceholder
              options={entidadesOptions}
              value={formData.entidadid}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  entidadid: value ? parseInt(value.toString()) : null,
                  nodoid: [] // Limpiar nodos cuando cambia la entidad
                }));
              }}
              placeholder={t('umbral.select_entity')}
              disabled={loading || !formData.fundoid}
            />
          )}
        </div>
      </div>

      {/* Fila 3: Nodo (múltiple selección) */}
      <div>
        <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
          NODO
        </label>
        <div className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-3 max-h-60 overflow-y-auto custom-scrollbar">
          {nodosOptions.length === 0 ? (
            <div className="text-gray-500 dark:text-neutral-400 text-sm font-mono text-center py-4">
              {!formData.entidadid ? 'Seleccione una entidad primero' : 'No hay nodos disponibles'}
            </div>
          ) : (
            <div className="space-y-2">
              {nodosOptions.map((option) => {
                const nodoId = parseInt(option.value.toString());
                const isSelected = formData.nodoid.includes(nodoId);
                return (
                  <label
                    key={option.value}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            nodoid: [...prev.nodoid, nodoId]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            nodoid: prev.nodoid.filter(id => id !== nodoId)
                          }));
                        }
                      }}
                      disabled={loading || !formData.entidadid}
                      className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">
                      {option.label.toUpperCase()}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        {formData.nodoid.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-neutral-400 font-mono">
            {formData.nodoid.length} nodo{formData.nodoid.length > 1 ? 's' : ''} seleccionado{formData.nodoid.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Lista de umbrales del nodo */}
      {formData.nodoid.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              UMBRALES DEL NODO
            </h4>
            {/* Dropdown global de perfiles - Compacto, al extremo derecho */}
            {umbralesDelNodo.length > 0 && (
              <div className="relative global-perfil-dropdown-container">
                <div
                  onClick={() => !loading && setGlobalPerfilDropdownOpen(!globalPerfilDropdownOpen)}
                  className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <span className="text-xs font-mono text-gray-800 dark:text-white whitespace-nowrap">
                    {perfilesGlobales.length > 0 
                      ? `${perfilesGlobales.length} perfil${perfilesGlobales.length > 1 ? 'es' : ''}`
                      : 'APLICAR PERFIL'
                    }
                  </span>
                  <span className="text-gray-500 dark:text-neutral-400 text-xs">▼</span>
                </div>
            
                {globalPerfilDropdownOpen && !loading && (
                  <div className="absolute z-50 right-0 mt-1 w-64 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
                    {/* Barra de búsqueda */}
                    <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={globalPerfilSearchTerm}
                        onChange={(e) => {
                          e.stopPropagation();
                          setGlobalPerfilSearchTerm(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    
                    {/* Lista de opciones con checkboxes */}
                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                      {perfilesOptions
                        .filter(p => p.label.toLowerCase().includes(globalPerfilSearchTerm.toLowerCase()))
                        .length > 0 ? (
                        perfilesOptions
                          .filter(p => p.label.toLowerCase().includes(globalPerfilSearchTerm.toLowerCase()))
                          .map((perfil) => {
                            const perfilId = parseInt(perfil.value.toString());
                            const isSelected = perfilesGlobales.includes(perfilId);
                            return (
                              <label
                                key={perfil.value}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center px-3 py-2 cursor-pointer text-gray-900 dark:text-white font-mono tracking-wider transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleGlobalPerfilToggle(perfilId)}
                                  className="mr-3 text-orange-500 focus:ring-orange-500"
                                />
                                <span className={isSelected ? 'font-semibold' : ''}>
                                  {perfil.label.toUpperCase()}
                                </span>
                              </label>
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
            )}
          </div>
          
          {loadingUmbrales ? (
            <div className="text-center py-8 text-gray-500 dark:text-neutral-400 font-mono text-sm">
              Cargando umbrales...
            </div>
          ) : umbralesDelNodo.length === 0 ? (
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
              <div className="text-yellow-300 font-mono text-sm">
                ⚠️ El nodo seleccionado no tiene umbrales activos.
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {Object.entries(umbralesOrganizados).map(([tipoid, metricasData]) => {
                  const tipoIdNum = parseInt(tipoid);
                  const perfilTipoSeleccionado = perfilPorTipo.get(tipoIdNum);
                  const isTipoDropdownOpen = tipoDropdownOpen.get(tipoIdNum) || false;
                  const tipoSearchTerm = tipoSearchTerms.get(tipoIdNum) || '';
                  const filteredPerfilesTipo = perfilesOptions.filter(p => 
                    p.label.toLowerCase().includes(tipoSearchTerm.toLowerCase())
                  );
                  
                  return (
                  <div key={tipoid} className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
                    <div className="mb-3">
                      <h5 className="text-base font-bold text-orange-500 font-mono tracking-wider">
                        {getTipoName(tipoIdNum).toUpperCase()}
                      </h5>
                    </div>
                    <div className="space-y-3 ml-4">
                      {Object.entries(metricasData).map(([metricaid, umbrales]) => (
                        <div key={metricaid} className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                          <h6 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 font-mono mb-2">
                            {getMetricaName(parseInt(metricaid)).toUpperCase()}
                          </h6>
                          <div className="space-y-2">
                            {umbrales.map((umbral) => {
                              const perfilesAsignados = perfilUmbralesAsignados.get(umbral.umbralid) || [];
                              const isDropdownOpen = perfilDropdownOpen.get(umbral.umbralid) || false;
                              const searchTerm = perfilSearchTerms.get(umbral.umbralid) || '';
                              const filteredPerfiles = perfilesOptions.filter(p => 
                                p.label.toLowerCase().includes(searchTerm.toLowerCase())
                              );
                              
                              return (
                                <div key={umbral.umbralid} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded">
                                  <div className="flex-1">
                                    <div className="text-xs font-mono text-gray-600 dark:text-neutral-400">
                                      {umbral.umbral || `ID: ${umbral.umbralid}`}
                                    </div>
                                  </div>
                                  <div className="w-64 ml-4 relative perfil-dropdown-container">
                                    <div
                                      onClick={() => !loading && handleDropdownToggle(umbral.umbralid)}
                                      className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg cursor-pointer flex justify-between items-center"
                                    >
                                      <span className="text-xs font-mono text-gray-800 dark:text-white">
                                        {perfilesAsignados.length > 0 
                                          ? `${perfilesAsignados.length} perfil${perfilesAsignados.length > 1 ? 'es' : ''} seleccionado${perfilesAsignados.length > 1 ? 's' : ''}`
                                          : 'SELECCIONAR PERFIL'
                                        }
                                      </span>
                                      <span className="text-gray-500 dark:text-neutral-400">▼</span>
                                    </div>
                                    
                                    {isDropdownOpen && !loading && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
                                        {/* Barra de búsqueda */}
                                        <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                                          <input
                                            type="text"
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleSearchTermChange(umbral.umbralid, e.target.value);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                          />
                                        </div>
                                        
                                        {/* Lista de opciones con checkboxes */}
                                        <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                          {filteredPerfiles.length > 0 ? (
                                            filteredPerfiles.map((perfil) => {
                                              const perfilId = parseInt(perfil.value.toString());
                                              const isSelected = perfilesAsignados.includes(perfilId);
                                              const isGlobal = perfilesGlobales.includes(perfilId);
                                              return (
                                                <label
                                                  key={perfil.value}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className={`flex items-center px-3 py-2 cursor-pointer text-gray-900 dark:text-white font-mono tracking-wider transition-colors ${
                                                    isGlobal 
                                                      ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30' 
                                                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                                                  }`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isGlobal}
                                                    onChange={() => handlePerfilToggle(umbral.umbralid, perfilId)}
                                                    className={`mr-3 text-orange-500 focus:ring-orange-500 ${
                                                      isGlobal ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                  />
                                                  <span className={isSelected ? 'font-semibold' : ''}>
                                                    {perfil.label.toUpperCase()}
                                                    {isGlobal && (
                                                      <span className="ml-2 text-xs text-orange-500">(Global)</span>
                                                    )}
                                                  </span>
                                                </label>
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
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumen */}
      {perfilUmbralesAsignados.size > 0 && (
        <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4">
          <h5 className="text-orange-400 font-mono tracking-wider font-bold mb-3">
            RESUMEN
          </h5>
          <div className="text-sm text-gray-900 dark:text-white font-mono">
            <div>
              <span className="text-orange-400">Umbrales a asignar:</span> {perfilUmbralesAsignados.size}
            </div>
            <div>
              <span className="text-orange-400">Total relaciones perfil-umbral:</span> {
                Array.from(perfilUmbralesAsignados.values()).reduce((sum, perfiles) => sum + perfiles.length, 0)
              }
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleApply}
          disabled={!isFormValid() || loading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : `GUARDAR (${Array.from(perfilUmbralesAsignados.values()).reduce((sum, perfiles) => sum + perfiles.length, 0)})`}</span>
        </button>
        
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>
    </div>
  );
});


