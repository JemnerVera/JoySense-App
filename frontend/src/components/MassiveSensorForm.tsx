import React, { useState, useEffect, useMemo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';

interface MassiveSensorFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  onApply: (data: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface SelectedNode {
  nodoid: number;
  nodo: string;
  selected: boolean;
}

interface FormData {
  fundoid: number | null;
  entidadid: number | null;
  selectedTipos: number[];
}

export function MassiveSensorForm({
  getUniqueOptionsForField,
  onApply,
  onCancel,
  loading = false
}: MassiveSensorFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fundoid: null,
    entidadid: null,
    selectedTipos: []
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

  const tiposOptions = useMemo(() => 
    getUniqueOptionsForField('tipoid'), [getUniqueOptionsForField]
  );

  // Cargar nodos cuando se selecciona un fundo
  useEffect(() => {
    if (formData.fundoid) {
      const nodosOptions = getUniqueOptionsForField('nodoid', { fundoid: formData.fundoid });
      const nodesData: SelectedNode[] = nodosOptions.map(option => ({
        nodoid: parseInt(option.value.toString()),
        nodo: option.label,
        selected: false
      }));
      setSelectedNodes(nodesData);
      setAllNodesSelected(false);
    } else {
      setSelectedNodes([]);
      setAllNodesSelected(false);
    }
  }, [formData.fundoid, getUniqueOptionsForField]);

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
      setFormData(prev => ({
        ...prev,
        selectedTipos: [...prev.selectedTipos, tipoid]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedTipos: prev.selectedTipos.filter(id => id !== tipoid)
      }));
    }
  };

  // Obtener nodos seleccionados
  const getSelectedNodes = () => {
    return selectedNodes.filter(node => node.selected);
  };

  // Validar formulario
  const isFormValid = () => {
    return formData.fundoid && 
           formData.entidadid && 
           formData.selectedTipos.length > 0 && 
           getSelectedNodes().length > 0;
  };

  // Manejar aplicación de cambios
  const handleApply = () => {
    if (!isFormValid()) return;

    const selectedNodesData = getSelectedNodes();
    const dataToApply = [];

    // Crear datos para cada combinación de nodo-tipo
    for (const node of selectedNodesData) {
      for (const tipoid of formData.selectedTipos) {
        dataToApply.push({
          nodoid: node.nodoid,
          tipoid: tipoid,
          entidadid: formData.entidadid,
          statusid: 1 // Activo por defecto
        });
      }
    }

    onApply(dataToApply);
  };

  // Limpiar formulario
  const handleCancel = () => {
    setFormData({
      fundoid: null,
      entidadid: null,
      selectedTipos: []
    });
    setSelectedNodes([]);
    setAllNodesSelected(false);
    onCancel();
  };

  const selectedNodesCount = getSelectedNodes().length;
  const totalCombinations = selectedNodesCount * formData.selectedTipos.length;

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-orange-500 font-mono tracking-wider">
          CREACIÓN MASIVA DE SENSORES
        </h3>
        <p className="text-neutral-400 text-sm font-mono mt-2">
          Selecciona un fundo, nodos y tipos para crear sensores masivamente
        </p>
      </div>

      {/* Fila 1: Fundo y Entidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fundo */}
        <div>
          <label className="block text-sm font-medium text-orange-500 font-mono tracking-wider mb-2">
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
          <label className="block text-sm font-medium text-orange-500 font-mono tracking-wider mb-2">
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
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              NODOS DISPONIBLES
            </h4>
            {selectedNodes.length > 0 && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allNodesSelected}
                  onChange={(e) => handleSelectAllNodes(e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm text-orange-500 font-mono tracking-wider">
                  SELECCIONAR TODO
                </span>
              </label>
            )}
          </div>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            {selectedNodes.length > 0 ? (
              <div className="space-y-2">
                {selectedNodes.map((node) => (
                  <label key={node.nodoid} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                    <input
                      type="checkbox"
                      checked={node.selected}
                      onChange={(e) => handleNodeSelection(node.nodoid, e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-sm font-mono tracking-wider">
                      {node.nodo.toUpperCase()}
                    </span>
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
            TIPOS DE SENSOR
          </h4>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            {formData.entidadid ? (
              <div className="space-y-2">
                {tiposOptions.map((option) => (
                  <label key={option.value} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                    <input
                      type="checkbox"
                      checked={formData.selectedTipos.includes(parseInt(option.value.toString()))}
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

      {/* Resumen de selección */}
      {isFormValid() && (
        <div className="bg-orange-900 bg-opacity-30 border border-orange-600 rounded-lg p-4">
          <h5 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            RESUMEN DE SELECCIÓN
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
            <div>
              <span className="text-orange-400">Nodos seleccionados:</span>
              <span className="text-white ml-2">{selectedNodesCount}</span>
            </div>
            <div>
              <span className="text-orange-400">Tipos seleccionados:</span>
              <span className="text-white ml-2">{formData.selectedTipos.length}</span>
            </div>
            <div>
              <span className="text-orange-400">Total de sensores a crear:</span>
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
          {loading ? 'APLICANDO...' : 'APLICAR CREACIÓN MASIVA'}
        </button>
      </div>
    </div>
  );
}
