import React, { useState, useEffect, useMemo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';

interface AdvancedSensorUpdateFormProps {
  selectedRows: any[];
  onUpdate: (updatedData: any[]) => void;
  onCancel: () => void;
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  entidadesData: any[];
  tiposData: any[];
  nodosData: any[];
}

export function AdvancedSensorUpdateForm({
  selectedRows,
  onUpdate,
  onCancel,
  getUniqueOptionsForField,
  entidadesData,
  tiposData,
  nodosData
}: AdvancedSensorUpdateFormProps) {
  // Función robusta para extraer la entidad de las filas seleccionadas
  const getEntidadFromSelectedRows = () => {
    if (selectedRows.length === 0) return null;
    
    // Obtener el primer tipoid de las filas seleccionadas
    const firstTipoid = selectedRows[0]?.tipoid;
    if (!firstTipoid) return null;
    
    // Buscar el tipo para obtener la entidad
    const tipo = tiposData.find(t => t.tipoid === firstTipoid);
    if (!tipo?.entidadid) return null;
    
    // Buscar la entidad
    const entidad = entidadesData.find(e => e.entidadid === tipo.entidadid);
    return entidad;
  };
  
  const entidad = useMemo(() => getEntidadFromSelectedRows(), [selectedRows]);
  const entidadId = entidad?.entidadid;
  
  // Estados para los tipos y nodos seleccionados
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedNodos, setSelectedNodos] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estados para dropdowns
  const [tiposDropdownOpen, setTiposDropdownOpen] = useState(false);
  const [nodosDropdownOpen, setNodosDropdownOpen] = useState(false);
  
  // Estados para búsqueda
  const [tiposSearchTerm, setTiposSearchTerm] = useState('');
  const [nodosSearchTerm, setNodosSearchTerm] = useState('');

  // Función robusta para obtener tipos únicos de las filas seleccionadas
  const getTiposFromSelectedRows = () => {
    if (selectedRows.length === 0) return [];
    
    // Para tablas agrupadas, los tipos están en originalRows
    const allOriginalRows = selectedRows.flatMap(row => row.originalRows || [row]);
    const tiposSet = new Set(
      allOriginalRows
        .filter(row => row.statusid === 1) // Solo tipos activos
        .map(row => row.tipoid?.toString())
        .filter(Boolean)
    );
    return Array.from(tiposSet);
  };
  
  // Función robusta para obtener nodos únicos de las filas seleccionadas
  const getNodosFromSelectedRows = () => {
    if (selectedRows.length === 0) return [];
    
    // Extraer nodoid únicos de las filas seleccionadas
    const nodosSet = new Set(selectedRows.map(row => row.nodoid?.toString()).filter(Boolean));
    return Array.from(nodosSet);
  };

  // Inicializar datos basados en las filas seleccionadas
  useEffect(() => {
    if (selectedRows.length > 0) {
      const initialTipos = getTiposFromSelectedRows();
      const initialNodos = getNodosFromSelectedRows();
      
      console.log('🔍 Inicializando AdvancedSensorUpdateForm:');
      console.log('  - selectedRows:', selectedRows);
      console.log('  - allOriginalRows:', selectedRows.flatMap(row => row.originalRows || [row]));
      console.log('  - Tipos iniciales:', initialTipos);
      console.log('  - Nodos iniciales:', initialNodos);
      
      setSelectedTipos(initialTipos);
      setSelectedNodos(initialNodos);
    }
  }, [selectedRows]);

  // Obtener tipos disponibles para la entidad
  const availableTipos = useMemo(() => {
    if (!entidadId) return [];
    return getUniqueOptionsForField('tipoid', { entidadid: entidadId.toString() });
  }, [entidadId, getUniqueOptionsForField]);

  // Obtener nodos disponibles - solo el nodo de las filas seleccionadas
  const availableNodos = useMemo(() => {
    if (selectedRows.length === 0) return [];
    
    // Obtener nodos únicos de las filas seleccionadas
    const nodosFromSelectedRows = getNodosFromSelectedRows();
    return nodosFromSelectedRows.map(nodoId => {
      const nodo = nodosData.find(n => n.nodoid.toString() === nodoId);
      return {
        value: nodoId,
        label: nodo?.nodo || `Nodo ${nodoId}`
      };
    });
  }, [selectedRows, nodosData]);

  // Filtrar tipos por término de búsqueda
  const filteredTipos = useMemo(() => {
    if (!tiposSearchTerm) return availableTipos;
    return availableTipos.filter(tipo => 
      tipo.label.toLowerCase().includes(tiposSearchTerm.toLowerCase())
    );
  }, [availableTipos, tiposSearchTerm]);

  // Filtrar nodos por término de búsqueda
  const filteredNodos = useMemo(() => {
    if (!nodosSearchTerm) return availableNodos;
    return availableNodos.filter(nodo => 
      nodo.label.toLowerCase().includes(nodosSearchTerm.toLowerCase())
    );
  }, [availableNodos, nodosSearchTerm]);

  // Obtener todas las filas originales (incluyendo las agrupadas)
  const allOriginalRows = useMemo(() => {
    return selectedRows.flatMap(row => row.originalRows || [row]);
  }, [selectedRows]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      const updatedEntries: any[] = [];
      const firstRow = allOriginalRows[0];
      
      if (!firstRow) {
        throw new Error('No hay datos para actualizar');
      }

      console.log('🔍 Debug - Filas originales:', allOriginalRows);
      
      // Para cada combinación de nodo-tipo seleccionada
      selectedNodos.forEach(nodoId => {
        selectedTipos.forEach(tipoId => {
          // Verificar si esta combinación ya existe en las filas originales
          const existingRow = allOriginalRows.find(row => 
            row.nodoid?.toString() === nodoId && 
            row.tipoid?.toString() === tipoId
          );
          
          if (existingRow) {
            // Actualizar la entrada existente con status activo
            updatedEntries.push({
              ...existingRow,
              statusid: 1, // Activo
              usermodifiedid: firstRow?.usermodifiedid,
              datemodified: new Date().toISOString()
            });
          } else {
            // Crear nueva entrada solo si no existe
            updatedEntries.push({
              nodoid: parseInt(nodoId),
              tipoid: parseInt(tipoId),
              statusid: 1, // Activo
              usercreatedid: firstRow?.usercreatedid,
              datecreated: new Date().toISOString(),
              usermodifiedid: firstRow?.usermodifiedid,
              datemodified: new Date().toISOString()
            });
          }
        });
      });
      
      // Agregar entradas desactivadas para tipos que se deseleccionaron
      allOriginalRows.forEach(originalRow => {
        const stillExists = updatedEntries.some(entry => 
          entry.nodoid === originalRow.nodoid &&
          entry.tipoid === originalRow.tipoid
        );
        
        if (!stillExists) {
          // Esta entrada ya no está seleccionada, desactivarla
          updatedEntries.push({
            ...originalRow,
            statusid: 0, // Inactivo
            usermodifiedid: firstRow?.usermodifiedid,
            datemodified: new Date().toISOString()
          });
        }
      });
      
      console.log('🔍 Debug - Entradas actualizadas:', updatedEntries.length);
      console.log('🔍 Debug - Detalles:', updatedEntries);
      
      await onUpdate(updatedEntries);
    } catch (error) {
      console.error('Error actualizando sensores:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTipoToggle = (tipoId: string) => {
    setSelectedTipos(prev => 
      prev.includes(tipoId) 
        ? prev.filter(id => id !== tipoId)
        : [...prev, tipoId]
    );
  };

  const handleNodoToggle = (nodoId: string) => {
    setSelectedNodos(prev => 
      prev.includes(nodoId) 
        ? prev.filter(id => id !== nodoId)
        : [...prev, nodoId]
      );
  };

  const handleSelectAllTipos = () => {
    setSelectedTipos(filteredTipos.map(tipo => tipo.value.toString()));
  };

  const handleDeselectAllTipos = () => {
    setSelectedTipos([]);
  };

  const handleSelectAllNodos = () => {
    setSelectedNodos(filteredNodos.map(nodo => nodo.value.toString()));
  };

  const handleDeselectAllNodos = () => {
    setSelectedNodos([]);
  };

  if (!entidad) {
    return (
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 text-lg font-mono tracking-wider mb-4">
            ⚠️ ERROR: No se pudo determinar la entidad
          </div>
          <p className="text-neutral-400 text-sm font-mono">
            Las filas seleccionadas no tienen una entidad válida asociada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-orange-500 mb-2 font-mono tracking-wider">
          ACTUALIZAR SENSORES
        </h3>
        <p className="text-neutral-300 text-sm font-mono">
          Entidad: <span className="text-orange-400">{entidad.entidad}</span>
        </p>
        <p className="text-neutral-400 text-xs font-mono mt-1">
          Selecciona los nodos y tipos de sensor que deseas activar/desactivar
        </p>
      </div>

      {/* Nuevo diseño: 2 containers lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Container 1: Nodos disponibles con checkboxes */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              NODO SELECCIONADO
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllNodos}
                className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors font-mono"
              >
                TODOS
              </button>
              <button
                onClick={handleDeselectAllNodos}
                className="px-2 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors font-mono"
              >
                NINGUNO
              </button>
            </div>
          </div>
          
          {/* Búsqueda de nodos */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Buscar nodo..."
              value={nodosSearchTerm}
              onChange={(e) => setNodosSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredNodos.map((option) => (
              <label key={option.value} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                <input
                  type="checkbox"
                  checked={selectedNodos.includes(option.value.toString())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedNodos([...selectedNodos, option.value.toString()]);
                    } else {
                      setSelectedNodos(selectedNodos.filter(id => id !== option.value.toString()));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                />
                <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
              </label>
            ))}
            {filteredNodos.length === 0 && (
              <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                {nodosSearchTerm ? 'NO SE ENCONTRÓ EL NODO' : 'NO HAY NODO SELECCIONADO'}
              </div>
            )}
          </div>
        </div>

        {/* Container 2: Tipos disponibles con checkboxes */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
              TIPOS DE SENSOR
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllTipos}
                className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors font-mono"
              >
                TODOS
              </button>
              <button
                onClick={handleDeselectAllTipos}
                className="px-2 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors font-mono"
              >
                NINGUNO
              </button>
            </div>
          </div>
          
          {/* Búsqueda de tipos */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Buscar tipos..."
              value={tiposSearchTerm}
              onChange={(e) => setTiposSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredTipos.map((option) => (
              <label key={option.value} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                <input
                  type="checkbox"
                  checked={selectedTipos.includes(option.value.toString())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTipos([...selectedTipos, option.value.toString()]);
                    } else {
                      setSelectedTipos(selectedTipos.filter(id => id !== option.value.toString()));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                />
                <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
              </label>
            ))}
            {filteredTipos.length === 0 && (
              <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                {tiposSearchTerm ? 'NO SE ENCONTRARON TIPOS' : 'NO HAY TIPOS DISPONIBLES'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de selección */}
      <div className="mt-6 p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
        <h5 className="text-sm font-bold text-orange-500 mb-2 font-mono tracking-wider">
          RESUMEN DE SELECCIÓN
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
          <div>
            <span className="text-neutral-400">Nodos seleccionados:</span>
            <span className="text-white ml-2">{selectedNodos.length}</span>
          </div>
          <div>
            <span className="text-neutral-400">Tipos seleccionados:</span>
            <span className="text-white ml-2">{selectedTipos.length}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-neutral-400">Total de combinaciones:</span>
            <span className="text-orange-400 ml-2 font-bold">
              {selectedNodos.length * selectedTipos.length}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-500 transition-colors font-mono tracking-wider"
        >
          CANCELAR
        </button>
        <button
          onClick={handleUpdate}
          disabled={isUpdating || selectedNodos.length === 0 || selectedTipos.length === 0}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-wider"
        >
          {isUpdating ? 'ACTUALIZANDO...' : 'ACTUALIZAR SENSORES'}
        </button>
      </div>
    </div>
  );
}
