import React from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import ReplicateButton from './ReplicateButton';

interface MultipleSensorFormProps {
  selectedNodo: string;
  setSelectedNodo: (value: string) => void;
  selectedTipo: string;
  setSelectedTipo: (value: string) => void;
  selectedStatus: boolean;
  setSelectedStatus: (value: boolean) => void;
  selectedSensorCount: number;
  setSelectedSensorCount: (value: number) => void;
  multipleSensors: any[];
  nodosData: any[];
  tiposData: any[];
  loading: boolean;
  onInitializeSensors: (nodoid: string, count: number, specificTipos?: number[]) => void;
  onUpdateSensorTipo: (sensorIndex: number, tipoid: number) => void;
  onInsertSensors: () => void;
  onCancel: () => void;
  onUpdateSensorNodo: (sensorIndex: number, nodoid: number) => void;
  onUpdateAllSensorsNodo: (nodoid: string) => void;
  // Props para replicación
  onReplicateClick?: () => void;
}

const MultipleSensorForm: React.FC<MultipleSensorFormProps> = ({
  selectedNodo,
  setSelectedNodo,
  selectedTipo,
  setSelectedTipo,
  selectedStatus,
  setSelectedStatus,
  selectedSensorCount,
  setSelectedSensorCount,
  multipleSensors,
  nodosData,
  tiposData,
  loading,
  onInitializeSensors,
  onUpdateSensorTipo,
  onInsertSensors,
  onCancel,
  onUpdateSensorNodo,
  onUpdateAllSensorsNodo,
  // Props para replicación
  onReplicateClick
}) => {
  
  return (
    <div className="space-y-6">

      {/* Selección de Nodo, Cantidad y Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div>
           <label className="block text-lg font-bold text-white mb-2">
             Nodo
           </label>
           <SelectWithPlaceholder
             value={selectedNodo}
             onChange={(newValue) => {
               setSelectedNodo(newValue?.toString() || '');
               if (newValue) {
                 // Si ya hay sensores creados, solo actualizar el nodo
                 if (multipleSensors.length > 0) {
                   onUpdateAllSensorsNodo(newValue.toString());
                 } else {
                   // Si no hay sensores, inicializar normalmente
                   onInitializeSensors(newValue.toString(), selectedSensorCount);
                 }
               }
             }}
             options={nodosData.map(nodo => ({ value: nodo.nodoid, label: nodo.nodo }))}
             placeholder="Seleccionar nodo"
           />
         </div>

         <div>
           <label className="block text-lg font-bold text-white mb-2">
             Cantidad
           </label>
           <SelectWithPlaceholder
             value={selectedSensorCount}
             onChange={(newValue) => {
               const newCount = newValue ? parseInt(newValue.toString()) : 1;
               setSelectedSensorCount(newCount);
               if (selectedNodo) {
                 onInitializeSensors(selectedNodo, newCount);
               }
             }}
             options={[
               { value: 1, label: '1 Sensor' },
               { value: 2, label: '2 Sensores' },
               { value: 3, label: '3 Sensores' }
             ]}
             placeholder="Seleccionar cantidad"
           />
         </div>

         <div>
           <label className="block text-lg font-bold text-white mb-2">
             Status
           </label>
           <div className="flex items-center space-x-3 mt-2">
             <input
               type="checkbox"
               id="sensor-status"
               checked={selectedStatus}
               onChange={(e) => setSelectedStatus(e.target.checked)}
               className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
             />
             <label htmlFor="sensor-status" className="text-white text-lg font-medium">
               Activo
             </label>
           </div>
         </div>
       </div>

             {/* Vista previa de sensores a crear */}
       {multipleSensors.length > 0 && (
         <div className="bg-gray-700 rounded-lg p-4">
           <h4 className="text-lg font-bold text-white mb-4">Sensores a crear:</h4>
           <div className="space-y-4">
             {multipleSensors.map((sensor, index) => (
               <div key={index} className="bg-gray-600 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center space-x-3">
                     <span className="text-green-400 font-bold">#{sensor.sensorIndex}</span>
                     <span className="text-white">Sensor {sensor.sensorIndex} para {nodosData.find(n => n.nodoid.toString() === selectedNodo)?.nodo || `Nodo ${selectedNodo}`}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="text-gray-300 text-sm">Nodo: {nodosData.find(n => n.nodoid.toString() === selectedNodo)?.nodo || selectedNodo}</span>
                   </div>
                 </div>
                 
                 {/* Selector de tipo para cada sensor */}
                 <div className="flex items-center space-x-3">
                   <label className="text-white text-sm font-medium">Tipo:</label>
                   <SelectWithPlaceholder
                     value={sensor.tipoid}
                     onChange={(newValue) => onUpdateSensorTipo(sensor.sensorIndex, newValue ? parseInt(newValue.toString()) : 0)}
                     options={tiposData.map(tipo => ({ value: tipo.tipoid, label: tipo.tipo }))}
                     placeholder="Seleccionar tipo"
                     className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white text-opacity-80"
                   />
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

             {/* Botones de acción */}
       <div className="flex justify-center gap-4 mt-8">
         <button
           onClick={onInsertSensors}
           disabled={loading || multipleSensors.length === 0 || multipleSensors.some(sensor => !sensor.tipoid)}
           className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
         >
           <span>➕</span>
           <span>{loading ? 'Guardando...' : 'Guardar'}</span>
         </button>
         
         {/* Botón de replicar */}
         <ReplicateButton
           onClick={onReplicateClick || (() => {})}
         />
         
         <button
           onClick={onCancel}
           className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
         >
           <span>❌</span>
           <span>Cancelar</span>
         </button>
       </div>
    </div>
  );
};

export default MultipleSensorForm;
