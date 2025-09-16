import React, { useState, useEffect, useMemo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';

interface MassiveMetricaSensorFormProps {
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
}

interface FormData {
  fundoid: number | null;
  entidadid: number | null;
  selectedTipos: SelectedTipo[];
  metricasData: MetricaData[];
}

export function MassiveMetricaSensorForm({
  getUniqueOptionsForField,
  onApply,
  onCancel,
  loading = false
}: MassiveMetricaSensorFormProps) {
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

  // Cargar nodos cuando se selecciona un fundo
  useEffect(() => {
    if (formData.fundoid) {
      const nodosOptions = getUniqueOptionsForField('nodoid', { fundoid: formData.fundoid.toString() });
      const nodesData: SelectedNode[] = nodosOptions.map(option => ({
        nodoid: parseInt(option.value.toString()),
        nodo: option.label,
        selected: false,
        datecreated: option.datecreated || undefined
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
        selected: false
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

  // Manejar selección de métrica
  const handleMetricaSelection = (metricaid: number, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, selected: selected }
          : metrica
      )
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
    const hasMetricas = formData.metricasData.some(metrica => metrica.selected);
    
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
          // Solo procesar métricas seleccionadas
          if (metrica.selected) {
            dataToApply.push({
              nodoid: node.nodoid,
              tipoid: tipo.tipoid,
              metricaid: metrica.metricaid,
              statusid: 1 // Activo por defecto
            });
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
    formData.metricasData.filter(m => m.selected).length;

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

      {/* Fila 2: Nodo (izquierda) y Sensor + Métricas (derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nodos - Columna izquierda */}
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            NODO
          </h4>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg h-96 overflow-y-auto custom-scrollbar">
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

        {/* Columna derecha: Sensor y Métricas */}
        <div className="space-y-6">
          {/* Tipos de sensor */}
          {formData.entidadid && (
            <div>
              <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
                SENSOR
              </h4>
              
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 h-44 overflow-y-auto custom-scrollbar">
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
          )}

          {/* Métricas */}
          {formData.selectedTipos.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
                MÉTRICAS
              </h4>
              
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 h-44 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {formData.metricasData.map((metrica) => (
                    <label key={metrica.metricaid} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                      <input
                        type="checkbox"
                        checked={metrica.selected}
                        onChange={(e) => handleMetricaSelection(metrica.metricaid, e.target.checked)}
                        className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                        disabled={loading}
                      />
                      <span className="text-white text-sm font-mono tracking-wider">
                        {metrica.metrica.toUpperCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
              <span className="text-white ml-2">{formData.metricasData.filter(m => m.selected).length}</span>
            </div>
            <div>
              <span className="text-orange-400">Total de métricas a crear:</span>
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
