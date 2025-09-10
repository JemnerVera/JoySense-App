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
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
             NODO
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
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
             CANTIDAD
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
           <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
             STATUS
           </label>
           <div className="flex items-center space-x-3 mt-2">
             <input
               type="checkbox"
               id="sensor-status"
               checked={selectedStatus}
               onChange={(e) => setSelectedStatus(e.target.checked)}
               className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
             />
             <label htmlFor="sensor-status" className="text-white text-lg font-medium font-mono tracking-wider">
               ACTIVO
             </label>
           </div>
         </div>
       </div>

             {/* Vista previa de sensores a crear */}
       {multipleSensors.length > 0 && (
         <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4">
           <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">SENSORES A CREAR:</h4>
           <div className="space-y-4">
             {multipleSensors.map((sensor, index) => (
               <div key={index} className="bg-neutral-700 border border-neutral-600 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center space-x-3">
                     <span className="text-orange-500 font-bold font-mono">#{sensor.sensorIndex}</span>
                     <span className="text-white font-mono">SENSOR {sensor.sensorIndex} PARA {nodosData.find(n => n.nodoid.toString() === selectedNodo)?.nodo || `NODO ${selectedNodo}`}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="text-neutral-300 text-sm font-mono">NODO: {nodosData.find(n => n.nodoid.toString() === selectedNodo)?.nodo || selectedNodo}</span>
                   </div>
                 </div>
                 
                 {/* Selector de tipo para cada sensor */}
                 <div className="flex items-center space-x-3">
                   <label className="text-white text-sm font-medium font-mono tracking-wider">TIPO:</label>
                   <SelectWithPlaceholder
                     value={sensor.tipoid}
                     onChange={(newValue) => onUpdateSensorTipo(sensor.sensorIndex, newValue ? parseInt(newValue.toString()) : 0)}
                     options={tiposData.map(tipo => ({ value: tipo.tipoid, label: tipo.tipo }))}
                     placeholder="Seleccionar tipo"
                     className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white font-mono"
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

export default MultipleSensorForm;
