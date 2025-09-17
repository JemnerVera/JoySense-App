import React, { useState, useEffect, useMemo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';

interface MassiveUmbralFormProps {
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
  selected: boolean;
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
  loading = false,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  getPaisName,
  getEmpresaName,
  getFundoName
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
      const nodosOptions = getUniqueOptionsForField('nodoid', { fundoid: formData.fundoid.toString() });
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
        selected: false,
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

  // Manejar selección de métrica (checkbox)
  const handleMetricaSelect = (metricaid: number) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, selected: !metrica.selected, expanded: false }
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
      if (!metrica.selected) return false;
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
      console.log('🔍 Nodo seleccionado:', { nodoid: node.nodoid, ubicacionid: node.ubicacionid });
      
      for (const tipo of formData.selectedTipos) {
        for (const metrica of formData.metricasData) {
          // Solo procesar métricas seleccionadas
          if (metrica.selected) {
            const umbralTipo = metrica.umbralesPorTipo[tipo.tipoid];
            console.log('🔍 Verificando umbral para tipo:', { 
              metrica: metrica.metrica, 
              tipo: tipo.tipo, 
              umbralTipo: umbralTipo 
            });
            
            // Solo incluir si el umbral para este tipo tiene todos los campos requeridos
            if (umbralTipo && umbralTipo.minimo && umbralTipo.maximo && umbralTipo.criticidadid && umbralTipo.umbral) {
              if (!node.ubicacionid) {
                console.error('❌ Nodo sin ubicacionid:', node);
                continue; // Saltar este nodo si no tiene ubicacionid
              }
              
              const umbralData = {
                ubicacionid: node.ubicacionid,
                nodoid: node.nodoid,
                tipoid: tipo.tipoid,
                metricaid: metrica.metricaid,
                criticidadid: umbralTipo.criticidadid,
                umbral: umbralTipo.umbral,
                minimo: parseFloat(umbralTipo.minimo),
                maximo: parseFloat(umbralTipo.maximo),
                statusid: 1 // Activo por defecto
              };
              
              console.log('✅ Agregando umbral:', umbralData);
              dataToApply.push(umbralData);
            } else {
              console.log('❌ Umbral incompleto para tipo:', { 
                metrica: metrica.metrica, 
                tipo: tipo.tipo, 
                umbralTipo: umbralTipo,
                tieneMinimo: !!umbralTipo?.minimo,
                tieneMaximo: !!umbralTipo?.maximo,
                tieneCriticidad: !!umbralTipo?.criticidadid,
                tieneUmbral: !!umbralTipo?.umbral
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
    formData.metricasData.filter(m => m.selected && Object.values(m.umbralesPorTipo).some(u => u.minimo && u.maximo && u.criticidadid && u.umbral)).length;

  // Auto-seleccionar fundo si solo hay una opción
  useEffect(() => {
    if (fundosOptions.length === 1 && !formData.fundoid) {
      setFormData(prev => ({
        ...prev,
        fundoid: fundosOptions[0].value ? parseInt(fundosOptions[0].value.toString()) : null,
        entidadid: null,
        selectedTipos: []
      }));
    }
  }, [fundosOptions, formData.fundoid]);

  // Función para renderizar fila contextual con filtros globales
  const renderContextualRow = (fields: string[]) => {
    const contextualFields = fields.map(field => {
      if (field === 'pais' && paisSeleccionado && getPaisName) {
        return (
          <div key="pais-contextual">
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              PAÍS
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
              {getPaisName(paisSeleccionado)}
            </div>
          </div>
        );
      } else if (field === 'empresa' && empresaSeleccionada && getEmpresaName) {
        return (
          <div key="empresa-contextual">
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              EMPRESA
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
              {getEmpresaName(empresaSeleccionada)}
            </div>
          </div>
        );
      } else if (field === 'fundo') {
        return (
          <div key="fundo-contextual">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
              FUNDO
            </label>
            {fundosOptions.length === 1 ? (
              <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
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
                    selectedTipos: []
                  }));
                }}
                placeholder="SELECCIONAR FUNDO"
                disabled={loading}
              />
            )}
          </div>
        );
      }
      return null;
    }).filter(Boolean);

    if (contextualFields.length === 0) return null;

    // Separar campos en dos filas
    const firstRowFields = contextualFields.filter(field => 
      field && (field.key === 'pais-contextual' || field.key === 'empresa-contextual')
    );
    const secondRowFields = contextualFields.filter(field => 
      field && field.key === 'fundo-contextual'
    );

    return (
      <div className="space-y-6 mb-6">
        {/* Primera fila: País y Empresa */}
        {firstRowFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {firstRowFields}
          </div>
        )}
        
        {/* Segunda fila: Fundo */}
        {secondRowFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondRowFields}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Fila 1: País y Empresa (contextual) */}
      {renderContextualRow(['pais', 'empresa'])}

      {/* Fila 2: Fundo y Entidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fundo */}
        <div>
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            FUNDO
          </label>
          {fundosOptions.length === 1 ? (
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
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
                  selectedTipos: []
                }));
              }}
              placeholder="SELECCIONAR FUNDO"
              disabled={loading}
            />
          )}
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

      {/* Fila 3: Nodos y Tipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nodos */}
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            NODO
          </h4>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-h-96 overflow-y-auto custom-scrollbar">
            {selectedNodes.length > 0 ? (
              <div>
                {/* Header del grid - Sticky */}
                <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-4 py-3 bg-neutral-900 border-b border-neutral-600">
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
                  <label key={node.nodoid} className="grid grid-cols-12 gap-4 px-4 py-2 hover:bg-neutral-700 cursor-pointer transition-colors">
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
                        {node.datecreated ? new Date(node.datecreated).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </label>
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
                <div key={metrica.metricaid} className={`rounded-lg transition-all duration-200 ${metrica.selected ? 'bg-neutral-800 border border-neutral-600' : 'bg-neutral-900 border border-neutral-700'}`}>
                  {/* Header de la métrica */}
                  <div className="flex items-center space-x-3 p-3">
                    {/* Checkbox para seleccionar métrica */}
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={metrica.selected}
                        onChange={() => handleMetricaSelect(metrica.metricaid)}
                        disabled={loading}
                        className="w-4 h-4 text-orange-500 bg-neutral-700 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <h5 className={`font-mono tracking-wider font-bold transition-colors ${metrica.selected ? 'text-orange-400' : 'text-neutral-500'}`}>
                        {metrica.metrica.toUpperCase()}
                      </h5>
                    </label>
                    
                    {/* Botón para expandir/contraer (solo si está seleccionada) */}
                    {metrica.selected && (
                      <button
                        onClick={() => handleMetricaToggle(metrica.metricaid)}
                        className="ml-auto p-2 rounded transition-colors bg-neutral-600 hover:bg-neutral-500 text-neutral-300 hover:text-white"
                        disabled={loading}
                      >
                        {metrica.expanded ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Contenido expandible */}
                  {metrica.expanded && metrica.selected && (
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
              <span className="text-white ml-2">{formData.metricasData.filter(m => m.selected && Object.values(m.umbralesPorTipo).some(u => u.minimo && u.maximo && u.criticidadid && u.umbral)).length}</span>
            </div>
            <div>
              <span className="text-orange-400">Total de umbrales a crear:</span>
              <span className="text-white ml-2 font-bold">{totalCombinations}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button
          onClick={handleApply}
          disabled={!isFormValid() || loading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'APLICANDO...' : 'APLICAR'}</span>
        </button>
        
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>
    </div>
  );
}
