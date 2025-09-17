import React from 'react';
import ReplicateButton from './ReplicateButton';

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

const MultipleMetricaSensorForm: React.FC<MultipleMetricaSensorFormProps> = ({
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
  const [nodosDropdownOpen, setNodosDropdownOpen] = React.useState(false);
  const [entidadDropdownOpen, setEntidadDropdownOpen] = React.useState(false);
  const [metricasDropdownOpen, setMetricasDropdownOpen] = React.useState(false);
  
  // Estados para términos de búsqueda
  const [nodosSearchTerm, setNodosSearchTerm] = React.useState('');
  const [entidadSearchTerm, setEntidadSearchTerm] = React.useState('');
  const [metricasSearchTerm, setMetricasSearchTerm] = React.useState('');
  
  // Estado para tipos seleccionados
  const [selectedTiposCheckboxes, setSelectedTiposCheckboxes] = React.useState<string[]>([]);
  
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
  }, [selectedMetricas]);

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
  }, [selectedEntidad]);

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
        const metrica = metricasData.find(m => m.metricaid.toString() === metricaId);
        
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
  }, [selectedMetricasCheckboxes, selectedTiposCheckboxes, selectedNodos, selectedEntidad, combinacionesStatus, metricasData]);

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
  }, [selectedNodos, selectedMetricas, onInitializeMetricas, isReplicateMode]);

  // Función para obtener el nombre de un país por ID
  const getPaisName = (paisId: string) => {
    const pais = paisesData?.find(p => p.paisid.toString() === paisId);
    return pais ? pais.pais : `País ${paisId}`;
  };

  // Función para obtener el nombre de una empresa por ID
  const getEmpresaName = (empresaId: string) => {
    const empresa = empresasData?.find(e => e.empresaid.toString() === empresaId);
    return empresa ? empresa.empresa : `Empresa ${empresaId}`;
  };

  // Función para obtener el nombre de un fundo por ID
  const getFundoName = (fundoId: string) => {
    const fundo = fundosData?.find(f => f.fundoid.toString() === fundoId);
    return fundo ? fundo.fundo : `Fundo ${fundoId}`;
  };

  // Función para renderizar fila contextual con filtros globales
  const renderContextualRow = () => {
    const contextualFields = [];
    
    if (paisSeleccionado) {
      contextualFields.push(
        <div key="pais-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            PAÍS
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
            {getPaisName(paisSeleccionado)}
          </div>
        </div>
      );
    }
    
    if (empresaSeleccionada) {
      contextualFields.push(
        <div key="empresa-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            EMPRESA
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
            {getEmpresaName(empresaSeleccionada)}
          </div>
        </div>
      );
    }
    
    if (fundoSeleccionado) {
      contextualFields.push(
        <div key="fundo-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            FUNDO
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
            {getFundoName(fundoSeleccionado)}
          </div>
        </div>
      );
    }

    if (contextualFields.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {contextualFields}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Selección de Entidad y Nodos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">ENTIDAD</label>
         <div className="relative dropdown-container">
             <div
               onClick={() => setEntidadDropdownOpen(!entidadDropdownOpen)}
               className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono"
             >
               <span className={selectedEntidad ? 'text-white' : 'text-neutral-400'}>
                 {selectedEntidad 
                   ? entidadesData.find(e => e.entidadid.toString() === selectedEntidad)?.entidad || `Entidad ${selectedEntidad}`
                   : 'SELECCIONAR ENTIDAD'
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
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">TIPO</label>
         <div className="relative dropdown-container">
           <div
             onClick={() => selectedEntidad && setNodosDropdownOpen(!nodosDropdownOpen)}
             className={`w-full px-3 py-2 border rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono ${
               selectedEntidad 
                 ? 'bg-neutral-800 border-neutral-600' 
                 : 'bg-neutral-700 border-neutral-700 cursor-not-allowed opacity-50'
             }`}
           >
             <span className={selectedTiposCheckboxes.length > 0 ? 'text-white' : 'text-neutral-400'}>
               {selectedTiposCheckboxes.length > 0 
                 ? selectedTiposCheckboxes.map(id => {
                     const tipo = tiposData.find(t => t.tipoid.toString() === id);
                     return tipo ? tipo.tipo : id;
                   }).join(', ')
                 : selectedEntidad ? 'SELECCIONAR TIPO' : 'SELECCIONAR ENTIDAD PRIMERO'
               }
             </span>
             <span className="text-neutral-400">▼</span>
           </div>
           
          {nodosDropdownOpen && selectedEntidad && (
            <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden">
              <div className="p-2 border-b border-neutral-700">
                <input
                  type="text"
                  placeholder="🔍 Buscar tipos..."
                  value={nodosSearchTerm}
                  onChange={(e) => setNodosSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {getUniqueOptionsForField('tipoid', { entidadid: selectedEntidad })
                  .filter(option => 
                    option.label.toLowerCase().includes(nodosSearchTerm.toLowerCase())
                  )
                  .map(option => (
                   <label
                     key={option.value}
                     className="flex items-center px-3 py-2 hover:bg-neutral-800 cursor-pointer transition-colors"
                   >
                     <input
                       type="checkbox"
                       checked={selectedTiposCheckboxes.includes(option.value.toString())}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setSelectedTiposCheckboxes([...selectedTiposCheckboxes, option.value.toString()]);
                         } else {
                           setSelectedTiposCheckboxes(selectedTiposCheckboxes.filter(id => id !== option.value.toString()));
                         }
                       }}
                       className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                     />
                     <span className="text-white text-sm font-mono tracking-wider">{option.label.toUpperCase()}</span>
                   </label>
                 ))}
                 {getUniqueOptionsForField('tipoid', { entidadid: selectedEntidad })
                   .filter(option => 
                     option.label.toLowerCase().includes(nodosSearchTerm.toLowerCase())
                   ).length === 0 && (
                   <div className="px-3 py-2 text-neutral-400 text-sm font-mono">
                     NO HAY TIPOS DISPONIBLES PARA ESTA ENTIDAD
                   </div>
                 )}
              </div>
            </div>
          )}
         </div>
       </div>
       </div>




      {/* Nuevo diseño: 2 containers lado a lado */}
      {selectedEntidad && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Container 1: Nodos disponibles con checkboxes */}
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
            <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
              NODO
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
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
            <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
              MÉTRICA
            </h4>
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
          onClick={onInsertMetricas}
          disabled={loading || multipleMetricas.length === 0 || selectedTiposCheckboxes.length === 0 || selectedMetricasCheckboxes.length === 0}
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
};

export default MultipleMetricaSensorForm;

