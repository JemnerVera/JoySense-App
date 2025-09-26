import React, { useState, useEffect, useMemo } from 'react';

interface MassiveSensorFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  onApply: (data: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
  entidadesData?: any[];
}

interface SelectedNode {
  nodoid: number;
  nodo: string;
  selected: boolean;
  datecreated?: string;
}

interface FormData {
  selectedTipos: number[];
}

export function MassiveSensorForm({
  getUniqueOptionsForField,
  onApply,
  onCancel,
  loading = false,
  entidadesData = []
}: MassiveSensorFormProps) {
  const [formData, setFormData] = useState<FormData>({
    selectedTipos: []
  });

  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);
  const [allNodesSelected, setAllNodesSelected] = useState(false);

  // Obtener opciones para los dropdowns
  const allTiposOptions = useMemo(() => 
    getUniqueOptionsForField('tipoid'), [getUniqueOptionsForField]
  );

  // Obtener la entidad del primer tipo seleccionado para determinar qué opciones están disponibles
  const entidadDelPrimerTipo = useMemo(() => {
    if (formData.selectedTipos.length === 0) {
      return null; // No hay restricciones
    }

    const firstSelectedTipo = allTiposOptions.find(tipo => 
      parseInt(tipo.value.toString()) === formData.selectedTipos[0]
    );

    return firstSelectedTipo ? firstSelectedTipo.entidadid : null;
  }, [allTiposOptions, formData.selectedTipos]);

  // Función para determinar si un tipo está disponible para selección
  const isTipoAvailable = (tipo: any) => {
    if (!entidadDelPrimerTipo) {
      return true; // Sin restricciones
    }
    return tipo.entidadid === entidadDelPrimerTipo;
  };

  // Obtener el nombre de la entidad seleccionada
  const entidadSeleccionada = useMemo(() => {
    if (!entidadDelPrimerTipo || !entidadesData.length) {
      return null;
    }
    return entidadesData.find(entidad => entidad.entidadid === entidadDelPrimerTipo);
  }, [entidadDelPrimerTipo, entidadesData]);

  // Cargar nodos automáticamente (todos los nodos que NO tienen sensores asignados)
  useEffect(() => {
    // Obtener nodos que NO tienen sensores asignados
    // La función getUniqueOptionsForField ya filtra automáticamente nodos sin sensores cuando selectedTable === 'sensor'
    const nodosOptions = getUniqueOptionsForField('nodoid');
    
    const nodesData: SelectedNode[] = nodosOptions.map(option => ({
      nodoid: parseInt(option.value.toString()),
      nodo: option.label,
      selected: false,
      datecreated: option.datecreated || undefined
    }));
    
    setSelectedNodes(nodesData);
    setAllNodesSelected(false);
  }, [getUniqueOptionsForField]);

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
      // Verificar que el tipo está disponible para selección
      const tipo = allTiposOptions.find(t => parseInt(t.value.toString()) === tipoid);
      if (!tipo || !isTipoAvailable(tipo)) {
        return; // No permitir selección si no está disponible
      }

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
    return formData.selectedTipos.length > 0 && 
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
          statusid: 1 // Activo por defecto
        });
      }
    }

    onApply(dataToApply);
  };

  // Limpiar formulario
  const handleCancel = () => {
    setFormData({
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
      {/* Fila 1: Nodos y Tipos */}
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
                  CARGANDO NODOS DISPONIBLES...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tipos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              SENSOR
            </h4>
            {entidadSeleccionada && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-900 bg-opacity-30 border border-green-600 rounded-full">
                <span className="text-green-400 text-xs font-mono">🏷️</span>
                <span className="text-green-300 text-xs font-mono tracking-wider">
                  {entidadSeleccionada.entidad.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
            {allTiposOptions.length > 0 ? (
              <div className="space-y-2">
                {allTiposOptions.map((option) => {
                  const isAvailable = isTipoAvailable(option);
                  const isSelected = formData.selectedTipos.includes(parseInt(option.value.toString()));
                  
                  return (
                    <label 
                      key={option.value} 
                      className={`flex items-center px-3 py-2 transition-colors rounded ${
                        isAvailable 
                          ? 'hover:bg-neutral-700 cursor-pointer' 
                          : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleTipoSelection(parseInt(option.value.toString()), e.target.checked)}
                        disabled={!isAvailable}
                        className={`w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3 ${
                          !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <span className={`text-sm font-mono tracking-wider ${
                        isAvailable ? 'text-white' : 'text-neutral-500'
                      }`}>
                        {option.label.toUpperCase()}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-neutral-400 text-sm font-mono tracking-wider">
                  CARGANDO TIPOS DE SENSORES...
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
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button
          onClick={handleApply}
          disabled={!isFormValid() || loading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
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
