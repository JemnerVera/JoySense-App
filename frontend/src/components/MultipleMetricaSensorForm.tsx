// ============================================================================
// IMPORTS
// ============================================================================

import React, { memo } from 'react';
import ReplicateButton from './ReplicateButton';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface MultipleMetricaSensorFormProps {
  selectedNodos: string[];
  setSelectedNodos: (value: string[]) => void;
  selectedEntidad: string;
  setSelectedEntidad: (value: string) => void;
  selectedMetricas: string[];
  setSelectedMetricas: (value: string[]) => void;
  selectedStatus: boolean;
  setSelectedStatus: (value: boolean) => void;
  multipleMetricas: any[];
  setMultipleMetricas: (value: any[]) => void;
  nodosData: any[];
  entidadesData: any[];
  metricasData: any[];
  tiposData: any[];
  sensorsData: any[];
  loading: boolean;
  onInitializeMetricas: (nodos: string[], metricas: string[]) => Promise<void>;
  onInsertMetricas: () => void;
  onCancel: () => void;
  getUniqueOptionsForField: (columnName: string, filterParams?: { entidadid?: string; nodoid?: string }) => Array<{value: any, label: string}>;
  // Props para replicación
  onReplicateClick?: () => void;
  // Prop para indicar si estamos en modo replicación (solo un nodo)
  isReplicateMode?: boolean;
  // Filtros globales para contextualizar
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres en lugar de IDs
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
}

// ============================================================================
// COMPONENT DECLARATION
// ============================================================================

const MultipleMetricaSensorForm: React.FC<MultipleMetricaSensorFormProps> = memo(({
  selectedNodos,
  setSelectedNodos,
  selectedEntidad,
  setSelectedEntidad,
  selectedMetricas,
  setSelectedMetricas,
  selectedStatus,
  setSelectedStatus,
  multipleMetricas,
  setMultipleMetricas,
  nodosData,
  entidadesData,
  metricasData,
  tiposData,
  sensorsData,
  loading,
  onInitializeMetricas,
  onInsertMetricas,
  onCancel,
  getUniqueOptionsForField,
  // Props para replicación
  onReplicateClick,
  isReplicateMode = false,
  // Filtros globales
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  paisesData,
  empresasData,
  fundosData
}) => {

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [nodosDropdownOpen, setNodosDropdownOpen] = React.useState(false);
  const [entidadDropdownOpen, setEntidadDropdownOpen] = React.useState(false);
  const [metricasDropdownOpen, setMetricasDropdownOpen] = React.useState(false);
  
  // Estados para términos de búsqueda
  const [nodosSearchTerm, setNodosSearchTerm] = React.useState('');
  const [entidadSearchTerm, setEntidadSearchTerm] = React.useState('');
  const [metricasSearchTerm, setMetricasSearchTerm] = React.useState('');
  
  // Estado para tipos seleccionados
  const [selectedTiposCheckboxes, setSelectedTiposCheckboxes] = React.useState<string[]>([]);
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Función para obtener tipos basándose en los nodos seleccionados
  const getTiposFromSelectedNodos = React.useCallback(() => {
    if (selectedNodos.length === 0) return [];

const tiposUnicos = new Set<string>();
    
    selectedNodos.forEach(nodoId => {
      // Buscar sensores que pertenecen a este nodo específico
      const sensoresDelNodo = sensorsData.filter(sensor => 
        sensor.nodoid && sensor.nodoid.toString() === nodoId
      );

// Agregar los tipos únicos de este nodo
      sensoresDelNodo.forEach(sensor => {
        if (sensor.tipoid) {
          tiposUnicos.add(sensor.tipoid.toString());
        }
      });
    });
    
    const resultado = Array.from(tiposUnicos).map(tipoId => {
      const tipo = tiposData.find(t => t.tipoid.toString() === tipoId);
      return tipo ? { tipoid: tipo.tipoid, tipo: tipo.tipo } : null;
    }).filter(Boolean);

return resultado;
  }, [selectedNodos, sensorsData, tiposData]);
  
  const tiposFromNodos = React.useMemo(() => getTiposFromSelectedNodos(), [getTiposFromSelectedNodos]);
  
  // Función para analizar similitud de nodos (similar a MassiveUmbralForm)
  const analyzeNodoSimilarity = React.useCallback(() => {
    if (selectedNodos.length <= 1) return null;

const nodoAnalysis = selectedNodos.map(nodoId => {
      const nodo = nodosData.find(n => n.nodoid.toString() === nodoId);
      
      // Obtener tipos específicos para este nodo usando getUniqueOptionsForField
      const tiposDelNodo = getUniqueOptionsForField('tipoid', { 
        entidadid: selectedEntidad,
        nodoid: nodoId
      });

return {
        nodoid: nodoId,
        nodo: nodo?.nodo || nodoId,
        tipos: tiposDelNodo.map(t => t.label),
        tiposCount: tiposDelNodo.length,
        tiposKey: tiposDelNodo.map(t => t.label).sort().join('|') // Clave única para agrupar
      };
    });

// Agrupar nodos por similitud de tipos (mismo patrón que MassiveUmbralForm)
    const groupedNodes: {[key: string]: {count: number, types: string[], nodos: any[]}} = {};
    
    nodoAnalysis.forEach(nt => {
      const key = `${nt.tiposCount}-${nt.tiposKey}`;
      if (!groupedNodes[key]) {
        groupedNodes[key] = {
          count: nt.tiposCount,
          types: nt.tipos,
          nodos: []
        };
      }
      groupedNodes[key].nodos.push(nt);
    });
    
    // Si solo hay un grupo, todos los nodos son consistentes
    const hasDifferences = Object.keys(groupedNodes).length > 1;

return {
      nodoAnalysis,
      similarityGroups: Object.values(groupedNodes).map(group => group.nodos),
      hasDifferences,
      groupedNodes
    };
  }, [selectedNodos, selectedEntidad, getUniqueOptionsForField, nodosData]);
  
  const similarityAnalysis = React.useMemo(() => analyzeNodoSimilarity(), [analyzeNodoSimilarity]);
  
  // Función para validar si la selección de nodos es válida
  const isValidNodoSelection = () => {
    if (!similarityAnalysis?.hasDifferences) return true;
    
    // Verificar que todos los nodos seleccionados pertenecen al mismo grupo
    const selectedNodoGroups = similarityAnalysis.similarityGroups.filter(group => 
      group.some(nodo => selectedNodos.includes(nodo.nodoid))
    );
    
    return selectedNodoGroups.length === 1;
  };
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Función para manejar la inserción y limpiar métricas después
  const handleInsertMetricas = async () => {
    await onInsertMetricas();
    // Limpiar métricas seleccionadas después de guardar
    setSelectedMetricasCheckboxes([]);
  };
  
  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Actualizar tipos seleccionados cuando cambien los nodos
  React.useEffect(() => {
    if (selectedNodos.length > 0) {
      const tiposIds = tiposFromNodos.filter(t => t !== null).map(t => t!.tipoid.toString());
      setSelectedTiposCheckboxes(tiposIds);
    } else {
      setSelectedTiposCheckboxes([]);
    }
  }, [selectedNodos, selectedEntidad, tiposFromNodos]);
  
  // Estado para métricas seleccionadas con checkboxes
  const [selectedMetricasCheckboxes, setSelectedMetricasCheckboxes] = React.useState<string[]>([]);
  const [combinacionesStatus, setCombinacionesStatus] = React.useState<{[key: string]: boolean}>({});

  // Cerrar dropdowns cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setNodosDropdownOpen(false);
        setEntidadDropdownOpen(false);
        setMetricasDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Limpiar estados locales cuando se desmonta el componente
  React.useEffect(() => {
    return () => {
      // Limpiar estados locales al desmontar
      setNodosDropdownOpen(false);
      setEntidadDropdownOpen(false);
      setMetricasDropdownOpen(false);
      setNodosSearchTerm('');
      setEntidadSearchTerm('');
      setMetricasSearchTerm('');
      setSelectedTiposCheckboxes([]);
      setSelectedMetricasCheckboxes([]);
      setCombinacionesStatus({});
    };
  }, []);

  // Limpiar estados locales cuando cambian las props principales
  React.useEffect(() => {
    // Limpiar estados locales cuando se resetean las props
    if (selectedNodos.length === 0 && selectedEntidad === '') {
      setNodosDropdownOpen(false);
      setEntidadDropdownOpen(false);
      setMetricasDropdownOpen(false);
      setNodosSearchTerm('');
      setEntidadSearchTerm('');
      setMetricasSearchTerm('');
      setSelectedTiposCheckboxes([]);
      setSelectedMetricasCheckboxes([]);
      setCombinacionesStatus({});
    }
  }, [selectedNodos, selectedEntidad]);

  // Sincronizar selectedMetricasCheckboxes con selectedMetricas (props)
  React.useEffect(() => {
    if (selectedMetricas.length > 0 && JSON.stringify(selectedMetricas) !== JSON.stringify(selectedMetricasCheckboxes)) {
      setSelectedMetricasCheckboxes(selectedMetricas);
    }
  }, [selectedMetricas, selectedMetricasCheckboxes]);

  // Limpiar tipos y métricas cuando cambia la entidad
  React.useEffect(() => {
    setSelectedTiposCheckboxes([]);
    setSelectedMetricasCheckboxes([]);
    setCombinacionesStatus({});
  }, [selectedEntidad]);

  // Seleccionar automáticamente todos los tipos cuando se selecciona una entidad
  React.useEffect(() => {
    if (selectedEntidad) {
      const tiposDisponibles = getUniqueOptionsForField('tipoid', { entidadid: selectedEntidad });
      const todosLosTipos = tiposDisponibles.map(tipo => tipo.value.toString());
      setSelectedTiposCheckboxes(todosLosTipos);
    }
  }, [selectedEntidad, getUniqueOptionsForField]);

  // Actualizar selectedMetricas y generar combinaciones cuando cambien los checkboxes
  React.useEffect(() => {
    setSelectedMetricas(selectedMetricasCheckboxes);
    
    // Generar las combinaciones para multipleMetricas
    if (selectedNodos.length > 0 && selectedMetricasCheckboxes.length > 0 && selectedTiposCheckboxes.length > 0 && selectedEntidad) {
      const combinaciones: Array<{
        nodoid: number;
        metricaid: number;
        tipoid: number;
        statusid: number;
      }> = [];
      
      selectedMetricasCheckboxes.forEach((metricaId) => {
        
        selectedNodos.forEach((nodoId) => {
          selectedTiposCheckboxes.forEach((tipoId) => {
            const key = `${nodoId}-${metricaId}-${tipoId}`;
            combinaciones.push({
              nodoid: parseInt(nodoId),
              metricaid: parseInt(metricaId),
              tipoid: parseInt(tipoId),
              statusid: combinacionesStatus[key] !== false ? 1 : 0 // Por defecto true (activo)
            });
          });
        });
      });
      
      setMultipleMetricas(combinaciones);
    } else {
      setMultipleMetricas([]);
    }
  }, [selectedMetricasCheckboxes, selectedTiposCheckboxes, selectedNodos, selectedEntidad, combinacionesStatus, metricasData, setMultipleMetricas, setSelectedMetricas]);

  // Agregar useEffect para generar combinaciones automáticamente
  React.useEffect(() => {
    if (selectedNodos.length > 0 && selectedMetricas.length > 0) {
      // En modo replicación, no regenerar métricas automáticamente
      // Solo generar combinaciones si no estamos en modo replicación
      if (!isReplicateMode) {
        onInitializeMetricas(selectedNodos, selectedMetricas).catch(console.error);
      }
    } else if (!isReplicateMode && multipleMetricas.length > 0) {
      // Solo limpiar métricas si no estamos en modo replicación y hay métricas
      setMultipleMetricas([]);
    }
  }, [selectedNodos, selectedMetricas, onInitializeMetricas, isReplicateMode, multipleMetricas.length, setMultipleMetricas]);

  // Función para obtener el nombre de un país por ID


  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      
      {/* Selección de Entidad y Nodos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">ENTIDAD*</label>
         <div className="relative dropdown-container">
             <div
               onClick={() => setEntidadDropdownOpen(!entidadDropdownOpen)}
               className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono"
             >
               <span className={selectedEntidad ? 'text-white' : 'text-neutral-400'}>
                 {selectedEntidad 
                   ? entidadesData.find(e => e.entidadid.toString() === selectedEntidad)?.entidad || `Entidad ${selectedEntidad}`
                   : 'ENTIDAD'
                 }
               </span>
               <span className="text-neutral-400">▼</span>
             </div>
             
            {entidadDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
                <div className="p-2 border-b border-neutral-700">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={entidadSearchTerm}
                    onChange={(e) => setEntidadSearchTerm(e.target.value)}
                    className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-32 overflow-y-auto custom-scrollbar">
                  {getUniqueOptionsForField('entidadid')
                    .filter(option => 
                      option.label.toLowerCase().includes(entidadSearchTerm.toLowerCase())
                    )
                    .map((option, index) => (
                     <div
                       key={index}
                       onClick={() => {
                         setSelectedEntidad(option.value.toString());
                         setEntidadDropdownOpen(false);
                         setEntidadSearchTerm('');
                         // Limpiar nodos seleccionados cuando se cambia la entidad
                         setSelectedNodos([]);
                       }}
                       className="px-3 py-2 cursor-pointer hover:bg-neutral-800 transition-colors"
                     >
                       <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
                     </div>
                   ))}
                   {getUniqueOptionsForField('entidadid')
                     .filter(option => 
                       option.label.toLowerCase().includes(entidadSearchTerm.toLowerCase())
                     ).length === 0 && (
                     <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                       NO SE ENCONTRARON RESULTADOS
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
       </div>

         <div>
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
             TIPO 🔒
           </label>
           <div className={`w-full px-3 py-2 border rounded-lg text-white font-mono ${
             selectedNodos.length > 0 
               ? 'bg-neutral-700 border-neutral-600' 
               : 'bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-50'
           }`}>
             <span className={selectedNodos.length > 0 ? 'text-white' : 'text-neutral-400'}>
               {selectedNodos.length > 0 
                 ? tiposFromNodos.length > 0
                   ? tiposFromNodos.filter(t => t !== null).map(t => t!.tipo).join(', ')
                   : 'NO HAY TIPOS DISPONIBLES PARA LOS NODOS SELECCIONADOS'
                 : 'SELECCIONAR NODOS PRIMERO'
               }
             </span>
           </div>
         </div>
       </div>

      {/* Mensaje de validación de similitud de nodos (compacto e interactivo) */}
      {similarityAnalysis?.hasDifferences && (
        <div className="mt-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg">
          <div className="flex items-start">
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <span className="text-black text-xs font-bold">⚠</span>
            </div>
            <div className="flex-1">
              <h5 className="text-yellow-400 font-bold text-sm font-mono tracking-wider mb-2">
                TIPOS DE SENSORES INCONSISTENTES
              </h5>
              
              {/* Resumen compacto de grupos con selección interactiva */}
              <div className="space-y-2">
                {Object.values(similarityAnalysis.groupedNodes).map((group, groupIndex) => (
                  <div 
                    key={groupIndex} 
                    className="bg-neutral-800 border border-neutral-600 rounded p-2 cursor-pointer hover:bg-neutral-700 transition-colors"
                    onClick={() => {
                      // Seleccionar solo los nodos de este grupo
                      const nodosDelGrupo = group.nodos.map(nodo => nodo.nodoid);
                      setSelectedNodos(nodosDelGrupo);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-orange-500 font-mono text-xs font-bold">
                        GRUPO {groupIndex + 1} - {group.count} TIPO(S)
                      </span>
                      <span className="text-green-400 font-mono text-xs">
                        CLICK PARA SELECCIONAR
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {group.nodos.slice(0, 3).map(nodo => (
                        <span key={nodo.nodoid} className="text-white font-mono text-xs bg-neutral-700 px-2 py-1 rounded">
                          {nodo.nodo}
                        </span>
                      ))}
                      {group.nodos.length > 3 && (
                        <span className="text-neutral-400 font-mono text-xs px-2 py-1">
                          +{group.nodos.length - 3} más
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.types.slice(0, 2).map((tipo, tipoIndex) => (
                        <span key={tipoIndex} className="text-orange-300 font-mono text-xs bg-orange-900 bg-opacity-30 px-2 py-1 rounded">
                          {tipo}
                        </span>
                      ))}
                      {group.types.length > 2 && (
                        <span className="text-orange-300 font-mono text-xs px-2 py-1">
                          +{group.types.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo diseño: 2 containers lado a lado */}
      {selectedEntidad && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Container 1: Nodos disponibles con checkboxes */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
            <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
              NODO
            </h4>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
              {getUniqueOptionsForField('nodoid', { entidadid: selectedEntidad })
                .map((option) => (
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
              {getUniqueOptionsForField('nodoid', { entidadid: selectedEntidad }).length === 0 && (
                <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                  NO HAY NODOS DISPONIBLES PARA ESTA ENTIDAD
                </div>
              )}
            </div>
          </div>

          {/* Container 2: Métricas disponibles con checkboxes */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">
                MÉTRICA
              </h4>
              <label className="flex items-center space-x-3 cursor-pointer bg-orange-900/20 border border-orange-500/30 rounded-lg px-3 py-2 hover:bg-orange-900/30 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedMetricasCheckboxes.length === getUniqueOptionsForField('metricaid', { entidadid: selectedEntidad }).length && getUniqueOptionsForField('metricaid', { entidadid: selectedEntidad }).length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Seleccionar todas las métricas
                      const allMetricas = getUniqueOptionsForField('metricaid', { entidadid: selectedEntidad }).map(option => option.value.toString());
                      setSelectedMetricasCheckboxes(allMetricas);
                    } else {
                      // Deseleccionar todas las métricas
                      setSelectedMetricasCheckboxes([]);
                    }
                  }}
                  className="w-5 h-5 text-orange-500 bg-neutral-800 border-orange-500 rounded focus:ring-orange-500 focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-orange-400 text-lg">📋</span>
                  <span className="text-orange-400 font-bold text-sm font-mono tracking-wider">TODAS</span>
                </div>
              </label>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getUniqueOptionsForField('metricaid', { entidadid: selectedEntidad })
                .map((option) => (
                  <label key={option.value} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                    <input
                      type="checkbox"
                      checked={selectedMetricasCheckboxes.includes(option.value.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMetricasCheckboxes([...selectedMetricasCheckboxes, option.value.toString()]);
                        } else {
                          setSelectedMetricasCheckboxes(selectedMetricasCheckboxes.filter(id => id !== option.value.toString()));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
                  </label>
                ))}
              {getUniqueOptionsForField('metricaid', { entidadid: selectedEntidad }).length === 0 && (
                <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                  NO HAY MÉTRICAS DISPONIBLES PARA ESTA ENTIDAD
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={handleInsertMetricas}
          disabled={loading || multipleMetricas.length === 0 || selectedNodos.length === 0 || selectedMetricasCheckboxes.length === 0 || (similarityAnalysis?.hasDifferences && !isValidNodoSelection())}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        
        {/* Botón de replicar */}
        <ReplicateButton
          onClick={onReplicateClick || (() => {})}
          disabled={selectedNodos.length === 0 || !selectedEntidad}
        />
        
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>
    </div>
  );
});

MultipleMetricaSensorForm.displayName = 'MultipleMetricaSensorForm';

export default MultipleMetricaSensorForm;

