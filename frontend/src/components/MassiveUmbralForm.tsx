import React, { useState, useEffect, useMemo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';

interface MassiveUmbralFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  onApply: (data: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface SelectedNode {
  nodoid: number;
  nodo: string;
  selected: boolean;
  datecreated?: string;
  ubicacionid?: number;
}

interface SelectedTipo {
  tipoid: number;
  tipo: string;
  selected: boolean;
}

interface MetricaData {
  metricaid: number;
  metrica: string;
  unidad: string;
  disabled: boolean;
  expanded: boolean;
  umbralesPorTipo: {
    [tipoid: number]: {
      minimo: string;
      maximo: string;
      criticidadid: number | null;
      umbral: string;
    }
  };
}

interface FormData {
  fundoid: number | null;
  entidadid: number | null;
  selectedTipos: SelectedTipo[];
  metricasData: MetricaData[];
}

export function MassiveUmbralForm({
  getUniqueOptionsForField,
  onApply,
  onCancel,
  loading = false
}: MassiveUmbralFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fundoid: null,
    entidadid: null,
    selectedTipos: [],
    metricasData: []
  });

  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);
  const [allNodesSelected, setAllNodesSelected] = useState(false);

  // Obtener opciones para los dropdowns
  const fundosOptions = useMemo(() => 
    getUniqueOptionsForField('fundoid'), [getUniqueOptionsForField]
  );

  const entidadesOptions = useMemo(() => 
    getUniqueOptionsForField('entidadid'), [getUniqueOptionsForField]
  );

  const tiposOptions = useMemo(() => {
    if (formData.entidadid) {
      return getUniqueOptionsForField('tipoid', { entidadid: formData.entidadid });
    }
    return [];
  }, [getUniqueOptionsForField, formData.entidadid]);

  const metricasOptions = useMemo(() => 
    getUniqueOptionsForField('metricaid'), [getUniqueOptionsForField]
  );

  const criticidadesOptions = useMemo(() => 
    getUniqueOptionsForField('criticidadid'), [getUniqueOptionsForField]
  );

  // Cargar nodos cuando se selecciona un fundo
  useEffect(() => {
    if (formData.fundoid) {
      const nodosOptions = getUniqueOptionsForField('nodoid', { fundoid: formData.fundoid });
      const nodesData: SelectedNode[] = nodosOptions.map(option => ({
        nodoid: parseInt(option.value.toString()),
        nodo: option.label,
        selected: false,
        datecreated: option.datecreated || undefined,
        ubicacionid: option.ubicacionid || undefined
      }));
      setSelectedNodes(nodesData);
      setAllNodesSelected(false);
    } else {
      setSelectedNodes([]);
      setAllNodesSelected(false);
    }
  }, [formData.fundoid, getUniqueOptionsForField]);

  // Inicializar métricas cuando se cargan las opciones
  useEffect(() => {
    if (metricasOptions.length > 0 && formData.metricasData.length === 0) {
      const initialMetricasData: MetricaData[] = metricasOptions.map(option => ({
        metricaid: parseInt(option.value.toString()),
        metrica: option.label,
        unidad: option.unidad || '',
        disabled: false,
        expanded: false,
        umbralesPorTipo: {}
      }));
      setFormData(prev => ({
        ...prev,
        metricasData: initialMetricasData
      }));
    }
  }, [metricasOptions, formData.metricasData.length]);

  // Manejar selección de nodos individuales
  const handleNodeSelection = (nodoid: number, selected: boolean) => {
    setSelectedNodes(prev => 
      prev.map(node => 
        node.nodoid === nodoid ? { ...node, selected } : node
      )
    );
  };

  // Manejar selección de todos los nodos
  const handleSelectAllNodes = (selected: boolean) => {
    setSelectedNodes(prev => 
      prev.map(node => ({ ...node, selected }))
    );
    setAllNodesSelected(selected);
  };

  // Actualizar estado de "seleccionar todo" cuando cambian las selecciones individuales
  useEffect(() => {
    if (selectedNodes.length > 0) {
      const allSelected = selectedNodes.every(node => node.selected);
      const someSelected = selectedNodes.some(node => node.selected);
      setAllNodesSelected(allSelected);
    } else {
      setAllNodesSelected(false);
    }
  }, [selectedNodes]);

  // Manejar selección de tipos
  const handleTipoSelection = (tipoid: number, selected: boolean) => {
    if (selected) {
      const tipo = tiposOptions.find(t => parseInt(t.value.toString()) === tipoid);
      if (tipo) {
        setFormData(prev => ({
          ...prev,
          selectedTipos: [...prev.selectedTipos, {
            tipoid,
            tipo: tipo.label,
            selected: true
          }]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        selectedTipos: prev.selectedTipos.filter(t => t.tipoid !== tipoid)
      }));
    }
  };

  // Manejar toggle de métrica (expandir/contraer)
  const handleMetricaToggle = (metricaid: number) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, expanded: !metrica.expanded }
          : metrica
      )
    }));
  };

  // Manejar desactivación de métrica (tacho)
  const handleMetricaDisable = (metricaid: number) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, disabled: !metrica.disabled }
          : metrica
      )
    }));
  };

  // Manejar cambios en umbrales por tipo
  const handleUmbralChange = (metricaid: number, tipoid: number, field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        if (metrica.metricaid === metricaid) {
          const updatedUmbralesPorTipo = {
            ...metrica.umbralesPorTipo,
            [tipoid]: {
              ...metrica.umbralesPorTipo[tipoid],
              [field]: value
            }
          };
          return { ...metrica, umbralesPorTipo: updatedUmbralesPorTipo };
        }
        return metrica;
      })
    }));
  };

  // Obtener nodos seleccionados
  const getSelectedNodes = () => {
    return selectedNodes.filter(node => node.selected);
  };

  // Validar formulario
  const isFormValid = () => {
    const hasNodes = getSelectedNodes().length > 0;
    const hasTipos = formData.selectedTipos.length > 0;
    const hasMetricas = formData.metricasData.some(metrica => {
      if (metrica.disabled) return false;
      return Object.values(metrica.umbralesPorTipo).some(umbral => 
        umbral.minimo && umbral.maximo && umbral.criticidadid && umbral.umbral
      );
    });
    
    return formData.fundoid && 
           formData.entidadid && 
           hasNodes && 
           hasTipos && 
           hasMetricas;
  };

  // Manejar aplicación de cambios
  const handleApply = () => {
    if (!isFormValid()) return;

    const selectedNodesData = getSelectedNodes();
    const dataToApply = [];

    // Crear datos para cada combinación de nodo-tipo-métrica
    for (const node of selectedNodesData) {
      for (const tipo of formData.selectedTipos) {
        for (const metrica of formData.metricasData) {
          // Solo procesar métricas no desactivadas
          if (!metrica.disabled) {
            const umbralTipo = metrica.umbralesPorTipo[tipo.tipoid];
            // Solo incluir si el umbral para este tipo tiene todos los campos requeridos
            if (umbralTipo && umbralTipo.minimo && umbralTipo.maximo && umbralTipo.criticidadid && umbralTipo.umbral) {
              dataToApply.push({
                ubicacionid: node.ubicacionid,
                nodoid: node.nodoid,
                tipoid: tipo.tipoid,
                metricaid: metrica.metricaid,
                criticidadid: umbralTipo.criticidadid,
                umbral: umbralTipo.umbral,
                minimo: parseFloat(umbralTipo.minimo),
                maximo: parseFloat(umbralTipo.maximo),
                statusid: 1 // Activo por defecto
              });
            }
          }
        }
      }
    }

    onApply(dataToApply);
  };

  // Limpiar formulario
  const handleCancel = () => {
    setFormData({
      fundoid: null,
      entidadid: null,
      selectedTipos: [],
      metricasData: []
    });
    setSelectedNodes([]);
    setAllNodesSelected(false);
    onCancel();
  };

  const selectedNodesCount = getSelectedNodes().length;
  const totalCombinations = selectedNodesCount * formData.selectedTipos.length * 
    formData.metricasData.filter(m => !m.disabled && Object.values(m.umbralesPorTipo).some(u => u.minimo && u.maximo && u.criticidadid && u.umbral)).length;

  return (
    <div className="space-y-6">
      {/* Fila 1: Fundo y Entidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fundo */}
        <div>
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            FUNDO
          </label>
          <SelectWithPlaceholder
            options={fundosOptions}
            value={formData.fundoid}
            onChange={(value) => {
              setFormData(prev => ({
                ...prev,
                fundoid: value ? parseInt(value.toString()) : null,
                entidadid: null,
                selectedTipos: []
              }));
            }}
            placeholder="SELECCIONAR FUNDO"
            disabled={loading}
          />
        </div>

        {/* Entidad */}
        <div>
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            ENTIDAD
          </label>
          <SelectWithPlaceholder
            options={entidadesOptions}
            value={formData.entidadid}
            onChange={(value) => {
              setFormData(prev => ({
                ...prev,
                entidadid: value ? parseInt(value.toString()) : null,
                selectedTipos: []
              }));
            }}
            placeholder="SELECCIONAR ENTIDAD"
            disabled={loading || !formData.fundoid}
          />
        </div>
      </div>

      {/* Fila 2: Nodos y Tipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nodos */}
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            NODO
          </h4>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
            {selectedNodes.length > 0 ? (
              <div className="space-y-1">
                {/* Header del grid */}
                <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-neutral-800 rounded border-b border-neutral-600">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={allNodesSelected}
                      onChange={(e) => handleSelectAllNodes(e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
                    />
                  </div>
                  <div className="col-span-6">
                    <span className="text-orange-500 text-sm font-mono tracking-wider font-bold">
                      NODO
                    </span>
                  </div>
                  <div className="col-span-5">
                    <span className="text-orange-500 text-sm font-mono tracking-wider font-bold">
                      FECHA DE CREACIÓN
                    </span>
                  </div>
                </div>
                
                {/* Filas de nodos */}
                {selectedNodes.map((node) => (
                  <div key={node.nodoid} className="grid grid-cols-12 gap-4 px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={node.selected}
                        onChange={(e) => handleNodeSelection(node.nodoid, e.target.checked)}
                        className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                    </div>
                    <div className="col-span-6 flex items-center">
                      <span className="text-white text-sm font-mono tracking-wider">
                        {node.nodo.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center">
                      <span className="text-neutral-300 text-sm font-mono">
                        {node.datecreated ? new Date(node.datecreated).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-neutral-400 text-sm font-mono tracking-wider">
                  {formData.fundoid ? 'CARGANDO NODOS...' : 'SELECCIONA UN FUNDO PARA VER LOS NODOS'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tipos */}
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            SENSOR
          </h4>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
            {formData.entidadid ? (
              <div className="space-y-2">
                {tiposOptions.map((option) => (
                  <label key={option.value} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                    <input
                      type="checkbox"
                      checked={formData.selectedTipos.some(t => t.tipoid === parseInt(option.value.toString()))}
                      onChange={(e) => handleTipoSelection(parseInt(option.value.toString()), e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-sm font-mono tracking-wider">
                      {option.label.toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-neutral-400 text-sm font-mono tracking-wider">
                  SELECCIONA UNA ENTIDAD PARA VER LOS TIPOS
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      {formData.selectedTipos.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            MÉTRICAS
          </h4>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              {formData.metricasData.map((metrica, index) => (
                <div key={metrica.metricaid} className={`rounded-lg transition-all duration-200 ${metrica.disabled ? 'bg-red-900 bg-opacity-30 border border-red-600' : 'bg-neutral-800 border border-neutral-600'}`}>
                  {/* Header de la métrica */}
                  <div 
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-700 transition-colors ${metrica.disabled ? 'opacity-60' : ''}`}
                    onClick={() => !metrica.disabled && handleMetricaToggle(metrica.metricaid)}
                  >
                    <div className="flex items-center space-x-3">
                      {!metrica.disabled && (
                        <div className="text-orange-500">
                          {metrica.expanded ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <h5 className="text-orange-400 font-mono tracking-wider font-bold">
                        {metrica.metrica.toUpperCase()}
                      </h5>
                    </div>
                    
                    {/* Botón de tacho */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricaDisable(metrica.metricaid);
                      }}
                      className={`p-2 rounded transition-colors ${
                        metrica.disabled 
                          ? 'bg-red-600 hover:bg-red-500 text-white' 
                          : 'bg-neutral-600 hover:bg-red-600 text-neutral-300 hover:text-white'
                      }`}
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Contenido expandible */}
                  {metrica.expanded && !metrica.disabled && (
                    <div className="px-3 pb-3 border-t border-neutral-600">
                      <div className="space-y-4 mt-3">
                        {formData.selectedTipos.map((tipo) => {
                          const umbralTipo = metrica.umbralesPorTipo[tipo.tipoid] || {
                            minimo: '',
                            maximo: '',
                            criticidadid: null,
                            umbral: ''
                          };
                          
                          return (
                            <div key={tipo.tipoid} className="bg-neutral-700 rounded-lg p-4">
                              <h6 className="text-orange-300 font-mono tracking-wider font-bold mb-3">
                                {tipo.tipo.toUpperCase()}
                              </h6>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Valor Mínimo */}
                                <div>
                                  <label className="block text-sm font-medium text-orange-500 font-mono tracking-wider mb-1">
                                    VALOR MÍNIMO
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={umbralTipo.minimo}
                                    onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'minimo', e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder="0.00"
                                    disabled={loading}
                                  />
                                </div>

                                {/* Valor Máximo */}
                                <div>
                                  <label className="block text-sm font-medium text-orange-500 font-mono tracking-wider mb-1">
                                    VALOR MÁXIMO
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={umbralTipo.maximo}
                                    onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'maximo', e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder="0.00"
                                    disabled={loading}
                                  />
                                </div>

                                {/* Criticidad */}
                                <div>
                                  <label className="block text-sm font-medium text-orange-500 font-mono tracking-wider mb-1">
                                    CRITICIDAD
                                  </label>
                                  <SelectWithPlaceholder
                                    options={criticidadesOptions}
                                    value={umbralTipo.criticidadid}
                                    onChange={(value) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'criticidadid', value ? parseInt(value.toString()) : null)}
                                    placeholder="SELECCIONAR"
                                    disabled={loading}
                                  />
                                </div>

                                {/* Nombre Umbral */}
                                <div>
                                  <label className="block text-sm font-medium text-orange-500 font-mono tracking-wider mb-1">
                                    NOMBRE UMBRAL
                                  </label>
                                  <input
                                    type="text"
                                    value={umbralTipo.umbral}
                                    onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'umbral', e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder="Nombre del umbral"
                                    disabled={loading}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resumen de selección */}
      {isFormValid() && (
        <div className="bg-orange-900 bg-opacity-30 border border-orange-600 rounded-lg p-4">
          <h5 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            RESUMEN DE SELECCIÓN
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm font-mono">
            <div>
              <span className="text-orange-400">Nodos seleccionados:</span>
              <span className="text-white ml-2">{selectedNodesCount}</span>
            </div>
            <div>
              <span className="text-orange-400">Tipos seleccionados:</span>
              <span className="text-white ml-2">{formData.selectedTipos.length}</span>
            </div>
            <div>
              <span className="text-orange-400">Métricas configuradas:</span>
              <span className="text-white ml-2">{formData.metricasData.filter(m => !m.disabled && Object.values(m.umbralesPorTipo).some(u => u.minimo && u.maximo && u.criticidadid && u.umbral)).length}</span>
            </div>
            <div>
              <span className="text-orange-400">Total de umbrales a crear:</span>
              <span className="text-white ml-2 font-bold">{totalCombinations}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-center space-x-4 pt-6">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-mono tracking-wider rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          CANCELAR
        </button>
        <button
          onClick={handleApply}
          disabled={!isFormValid() || loading}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-mono tracking-wider rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'APLICANDO...' : 'APLICAR'}
        </button>
      </div>
    </div>
  );
}
