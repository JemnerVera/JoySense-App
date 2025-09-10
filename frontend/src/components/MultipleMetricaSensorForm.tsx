import React from 'react';
import ReplicateButton from './ReplicateButton';

interface MultipleMetricaSensorFormProps {
  selectedNodos: string[];
  setSelectedNodos: (value: string[]) => void;
  selectedMetricas: string[];
  setSelectedMetricas: (value: string[]) => void;
  selectedStatus: boolean;
  setSelectedStatus: (value: boolean) => void;
  multipleMetricas: any[];
  setMultipleMetricas: (value: any[]) => void;
  nodosData: any[];
  metricasData: any[];
  tiposData: any[];
  loading: boolean;
  onInitializeMetricas: (nodos: string[], metricas: string[]) => Promise<void>;
  onInsertMetricas: () => void;
  onCancel: () => void;
  // Props para replicación
  onReplicateClick?: () => void;
  // Prop para indicar si estamos en modo replicación (solo un nodo)
  isReplicateMode?: boolean;
}

const MultipleMetricaSensorForm: React.FC<MultipleMetricaSensorFormProps> = ({
  selectedNodos,
  setSelectedNodos,
  selectedMetricas,
  setSelectedMetricas,
  selectedStatus,
  setSelectedStatus,
  multipleMetricas,
  setMultipleMetricas,
  nodosData,
  metricasData,
  tiposData,
  loading,
  onInitializeMetricas,
  onInsertMetricas,
  onCancel,
  // Props para replicación
  onReplicateClick,
  isReplicateMode = false
}) => {
  const [nodosDropdownOpen, setNodosDropdownOpen] = React.useState(false);
  const [metricasDropdownOpen, setMetricasDropdownOpen] = React.useState(false);

  // Cerrar dropdowns cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setNodosDropdownOpen(false);
        setMetricasDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Agregar useEffect para generar combinaciones automáticamente
  React.useEffect(() => {
    if (selectedNodos.length > 0 && selectedMetricas.length > 0) {
      // En modo replicación, no regenerar métricas automáticamente
      // Solo generar combinaciones si no estamos en modo replicación
      if (!isReplicateMode) {
        onInitializeMetricas(selectedNodos, selectedMetricas).catch(console.error);
      }
    } else if (!isReplicateMode) {
      // Solo limpiar métricas si no estamos en modo replicación
      setMultipleMetricas([]);
    }
  }, [selectedNodos, selectedMetricas, onInitializeMetricas, isReplicateMode]);

  return (
    <div className="space-y-6">

      {/* Selección de Nodos, Métricas y Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div>
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">NODOS:</label>
         <div className="relative dropdown-container">
           <div
             onClick={() => setNodosDropdownOpen(!nodosDropdownOpen)}
             className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono"
           >
             <span className={selectedNodos.length > 0 ? 'text-white' : 'text-neutral-400'}>
               {selectedNodos.length > 0 
                 ? selectedNodos.map(id => {
                     const nodo = nodosData.find(n => n.nodoid.toString() === id);
                     return nodo ? nodo.nodo : id;
                   }).join(', ')
                 : 'SELECCIONAR NODO'
               }
             </span>
             <span className="text-neutral-400">▼</span>
           </div>
           
           {nodosDropdownOpen && (
             <div className="absolute z-10 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
               {nodosData
                 .sort((a, b) => a.nodo.localeCompare(b.nodo))
                 .map(nodo => (
                   <label
                     key={nodo.nodoid}
                     className="flex items-center px-3 py-2 hover:bg-gray-600 cursor-pointer"
                   >
                     <input
                       type={isReplicateMode ? "radio" : "checkbox"}
                       name={isReplicateMode ? "selectedNodo" : undefined}
                       checked={selectedNodos.includes(nodo.nodoid.toString())}
                       onChange={(e) => {
                         if (isReplicateMode) {
                           // En modo replicación, solo permitir un nodo
                           if (e.target.checked) {
                             const nuevoNodoId = nodo.nodoid.toString();
                             setSelectedNodos([nuevoNodoId]);
                             
                             // Actualizar las métricas existentes con el nuevo nodo
                             if (multipleMetricas.length > 0) {
                               const metricasActualizadas = multipleMetricas.map(metrica => ({
                                 ...metrica,
                                 nodoid: parseInt(nuevoNodoId)
                               }));
                               setMultipleMetricas(metricasActualizadas);
                             }
                           }
                         } else {
                           // Modo normal, permitir múltiples nodos
                           if (e.target.checked) {
                             setSelectedNodos([...selectedNodos, nodo.nodoid.toString()]);
                           } else {
                             setSelectedNodos(selectedNodos.filter(id => id !== nodo.nodoid.toString()));
                           }
                         }
                       }}
                       className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                     />
                     <span className="text-white text-opacity-80 text-sm">{nodo.nodo}</span>
                   </label>
                 ))}
             </div>
           )}
         </div>
       </div>

         <div>
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">MÉTRICAS:</label>
         <div className="relative dropdown-container">
           <div
             onClick={() => setMetricasDropdownOpen(!metricasDropdownOpen)}
             className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex justify-between items-center font-mono"
           >
             <span className={selectedMetricas.length > 0 ? 'text-white' : 'text-neutral-400'}>
               {selectedMetricas.length > 0 
                 ? selectedMetricas.map(id => {
                     const metrica = metricasData.find(m => m.metricaid.toString() === id);
                     return metrica ? metrica.metrica : id;
                   }).join(', ')
                 : 'SELECCIONAR MÉTRICA'
               }
             </span>
             <span className="text-neutral-400">▼</span>
           </div>
           
           {metricasDropdownOpen && (
             <div className="absolute z-10 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
               {metricasData
                 .sort((a, b) => a.metrica.localeCompare(b.metrica))
                 .map(metrica => (
                   <label
                     key={metrica.metricaid}
                     className="flex items-center px-3 py-2 hover:bg-gray-600 cursor-pointer"
                   >
                     <input
                       type="checkbox"
                       checked={selectedMetricas.includes(metrica.metricaid.toString())}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setSelectedMetricas([...selectedMetricas, metrica.metricaid.toString()]);
                         } else {
                           setSelectedMetricas(selectedMetricas.filter(id => id !== metrica.metricaid.toString()));
                         }
                       }}
                       className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                     />
                     <span className="text-white text-opacity-80 text-sm">{metrica.metrica}</span>
                   </label>
                 ))}
             </div>
           )}
         </div>
       </div>

         <div>
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">STATUS:</label>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="metrica-status"
            checked={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.checked)}
            className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
          />
          <label htmlFor="metrica-status" className="text-white text-lg font-medium font-mono tracking-wider">
            ACTIVO
          </label>
        </div>
       </div>
      </div>



      {/* Vista previa de métricas a crear */}
      {multipleMetricas.length > 0 && (
        <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
            📋 MÉTRICAS A CREAR: {multipleMetricas.length} ENTRADAS
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {multipleMetricas.map((metrica, index) => (
              <div key={index} className="bg-neutral-700 border border-neutral-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-orange-500 font-bold font-mono">#{index + 1}</span>
                    <span className="text-white text-sm font-mono">
                      NODO: {nodosData.find(n => n.nodoid.toString() === metrica.nodoid.toString())?.nodo || metrica.nodoid}
                    </span>
                    <span className="text-neutral-300">|</span>
                    <span className="text-white text-sm font-mono">
                      TIPO: {tiposData.find(t => t.tipoid === metrica.tipoid)?.tipo || 'N/A'}
                    </span>
                    <span className="text-neutral-300">|</span>
                    <span className="text-white text-sm font-mono">
                      MÉTRICA: {metricasData.find(m => m.metricaid.toString() === metrica.metricaid.toString())?.metrica || 'N/A'}
                    </span>
                  </div>
                  <span className="text-orange-500">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onInsertMetricas}
          disabled={loading || multipleMetricas.length === 0}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        
        {/* Botón de replicar */}
        <ReplicateButton
          onClick={onReplicateClick || (() => {})}
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
