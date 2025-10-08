import React from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import ReplicateButton from './ReplicateButton';
import { useLanguage } from '../contexts/LanguageContext';

interface MultipleSensorFormProps {
  selectedNodo: string;
  setSelectedNodo: (value: string) => void;
  selectedEntidad: string;
  setSelectedEntidad: (value: string) => void;
  selectedTipo: string;
  setSelectedTipo: (value: string) => void;
  selectedStatus: boolean;
  setSelectedStatus: (value: boolean) => void;
  selectedSensorCount: number;
  setSelectedSensorCount: (value: number) => void;
  multipleSensors: any[];
  nodosData: any[];
  entidadesData: any[];
  tiposData: any[];
  loading: boolean;
  onInitializeSensors: (nodoid: string, count: number, specificTipos?: number[]) => void;
  onUpdateSensorTipo: (sensorIndex: number, tipoid: number) => void;
  onToggleSensorDelete: (sensorIndex: number, toDelete: boolean) => void;
  onInsertSensors: () => void;
  onCancel: () => void;
  onUpdateSensorNodo: (sensorIndex: number, nodoid: number) => void;
  onUpdateAllSensorsNodo: (nodoid: string) => void;
  getUniqueOptionsForField: (columnName: string, filterParams?: { entidadid?: string }) => Array<{value: any, label: string}>;
  // Props para replicación
  onReplicateClick?: () => void;
  // Filtros globales para contextualizar
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres en lugar de IDs
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
}

const MultipleSensorForm: React.FC<MultipleSensorFormProps> = ({
  selectedNodo,
  setSelectedNodo,
  selectedEntidad,
  setSelectedEntidad,
  selectedTipo,
  setSelectedTipo,
  selectedStatus,
  setSelectedStatus,
  selectedSensorCount,
  setSelectedSensorCount,
  multipleSensors,
  nodosData,
  entidadesData,
  tiposData,
  loading,
  onInitializeSensors,
  onUpdateSensorTipo,
  onToggleSensorDelete,
  onInsertSensors,
  onCancel,
  onUpdateSensorNodo,
  onUpdateAllSensorsNodo,
  getUniqueOptionsForField,
  // Props para replicación
  onReplicateClick,
  // Filtros globales
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  paisesData,
  empresasData,
  fundosData
}) => {
  const { t } = useLanguage();
  
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
      
      {/* Layout fijo: Siempre 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Primera columna: Campos y botones */}
        <div className="space-y-6">
          {/* Fila 2: Nodo */}
          <div>
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              {t('table_headers.node')}*
            </label>
            <SelectWithPlaceholder
              value={selectedNodo}
              onChange={(newValue) => {
                setSelectedNodo(newValue?.toString() || '');
                // Limpiar entidad cuando se cambia el nodo
                setSelectedEntidad('');
              }}
              options={getUniqueOptionsForField('nodoid')}
              placeholder={t('table_headers.node')}
            />
          </div>

          {/* Fila 3: Entidad */}
          <div>
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              {t('table_headers.entity')}*
            </label>
            <SelectWithPlaceholder
              value={selectedEntidad}
              onChange={(newValue) => {
                setSelectedEntidad(newValue?.toString() || '');
                // Generar sensores automáticamente cuando se selecciona entidad
                if (selectedNodo && newValue) {
                  // Obtener tipos disponibles para la entidad seleccionada
                  const tiposParaEntidad = getUniqueOptionsForField('tipoid', { entidadid: newValue.toString() });
                  const tiposIds = tiposParaEntidad.map(tipo => tipo.value);
                  
                  // Generar sensores con los tipos de la entidad seleccionada
                  onInitializeSensors(selectedNodo, Math.min(3, tiposIds.length), tiposIds);
                }
              }}
              options={getUniqueOptionsForField('entidadid')}
              placeholder={t('table_headers.entity')}
              disabled={!selectedNodo}
            />
          </div>

          {/* Fila 4: Botones */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={onInsertSensors}
              disabled={loading || multipleSensors.length === 0 || multipleSensors.filter(sensor => !sensor.toDelete).some(sensor => !sensor.tipoid)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider text-sm"
            >
              <span>➕</span>
              <span>{loading ? t('sensor.saving') : t('sensor.save')}</span>
            </button>
            
            {/* Botón de replicar */}
            <ReplicateButton
              onClick={onReplicateClick || (() => {})}
              disabled={!selectedNodo || !selectedEntidad}
            />
            
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider text-sm"
            >
              <span>❌</span>
              <span>{t('sensor.cancel')}</span>
            </button>
          </div>
        </div>

        {/* Segunda columna: Container de sensores */}
        <div>
          <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">{t('sensor.sensors_to_create')}</h4>
          <div className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
            {multipleSensors.length > 0 ? (
              multipleSensors.map((sensor, index) => (
                <div key={index} className={`rounded-lg p-3 transition-colors ${
                  sensor.toDelete 
                    ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600' 
                    : 'bg-gray-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600'
                }`}>
                  <div className="flex items-center justify-between">
                    {/* Lado izquierdo: Número y tipo */}
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Número de sensor */}
                      <span className={`font-bold font-mono min-w-[30px] ${
                        sensor.toDelete ? 'text-red-600 dark:text-red-400' : 'text-orange-500'
                      }`}>#{sensor.sensorIndex}</span>
                      
                      {/* Mostrar tipo como texto o selector */}
                      {sensor.tipoid ? (
                        <div className={`flex-1 px-3 py-2 border rounded-lg font-mono ${
                          sensor.toDelete 
                            ? 'bg-red-200 dark:bg-red-800/50 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200' 
                            : 'bg-gray-200 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white'
                        }`}>
                          {tiposData.find(tipo => tipo.tipoid === sensor.tipoid)?.tipo || 'Tipo no encontrado'}
                        </div>
                      ) : (
                        <SelectWithPlaceholder
                          value={sensor.tipoid}
                          onChange={(newValue) => onUpdateSensorTipo(sensor.sensorIndex, newValue ? parseInt(newValue.toString()) : 0)}
                          options={getUniqueOptionsForField('tipoid', { entidadid: selectedEntidad })}
                          placeholder="Seleccionar tipo"
                          className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-white font-mono"
                          disabled={sensor.toDelete}
                        />
                      )}
                    </div>
                    
                    {/* Lado derecho: Icono de basura */}
                    <div className="flex items-center ml-3">
                      <button
                        onClick={() => onToggleSensorDelete(sensor.sensorIndex, !sensor.toDelete)}
                        className={`p-1 rounded transition-colors ${
                          sensor.toDelete 
                            ? 'text-red-600 dark:text-red-300 bg-red-200 dark:bg-red-800/50 hover:bg-red-300 dark:hover:bg-red-700/50' 
                            : 'text-red-500 hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20'
                        }`}
                        title={sensor.toDelete ? "Restaurar entrada" : "Eliminar esta entrada"}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-neutral-400 text-sm font-mono tracking-wider">
                  {t('sensor.select_node_entity')}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleSensorForm;
