// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { JoySenseService } from '../../../services/backend-api';
import { logger } from '../../../utils/logger';

// Types
import {
  MassiveLocalizacionFormProps,
  SelectedNodo,
  SelectedLocalizacion,
  SensorMetricaData,
  FormData
} from '../../MassiveLocalizacionForm/types';

// Hooks
import { useMassiveLocalizacionForm } from '../../MassiveLocalizacionForm/hooks/useMassiveLocalizacionForm';
import { useMassiveLocalizacionSelection } from '../../MassiveLocalizacionForm/hooks/useMassiveLocalizacionSelection';
import { useMassiveLocalizacionValidation } from '../../MassiveLocalizacionForm/hooks/useMassiveLocalizacionValidation';
import { useMassiveLocalizacionApplication } from '../../MassiveLocalizacionForm/hooks/useMassiveLocalizacionApplication';

// Components
import { MassiveLocalizacionSelector } from '../../MassiveLocalizacionForm/components/MassiveLocalizacionSelector';
import { MassiveLocalizacionActions } from '../../MassiveLocalizacionForm/components/MassiveLocalizacionActions';
import { SelectWithPlaceholder } from '../../shared/selectors';

// ============================================================================
// COMPONENT DECLARATION
// ============================================================================

export const MassiveLocalizacionForm = memo(function MassiveLocalizacionForm({
  getUniqueOptionsForField,
  onApply,
  onCancel,
  loading = false,
  onFormDataChange,
  nodosData
}: MassiveLocalizacionFormProps) {
  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [localizacionName, setLocalizacionName] = useState<string>('');
  const [combinacionesAgregadas, setCombinacionesAgregadas] = useState<SensorMetricaData[]>([]);
  const [selectedSensorIds, setSelectedSensorIds] = useState<number[]>([]);
  const [selectedMetricaIds, setSelectedMetricaIds] = useState<number[]>([]);
  const [sensoresOptions, setSensoresOptions] = useState<any[]>([]);
  const [metricasOptions, setMetricasOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [sensoresMap, setSensoresMap] = useState<Map<number, string>>(new Map());
  const [metricasMap, setMetricasMap] = useState<Map<number, string>>(new Map());

  // ============================================================================
  // FORM HOOK
  // ============================================================================

  const [tempSelectedNodo, setTempSelectedNodo] = useState<number | null>(null);

  const {
    formData,
    setFormData,
    nodosOptions,
    localizacionesOptions,
    sensoresMetricasOptions
  } = useMassiveLocalizacionForm({
    getUniqueOptionsForField,
    selectedNodo: tempSelectedNodo
  });

  // Notificar cambios en formData sin causar setState durante render
  useEffect(() => {
    onFormDataChange?.({
      ...formData,
      sensoresMetricasData: combinacionesAgregadas
    });
  }, [formData.nodoid, formData.localizacionid, combinacionesAgregadas]);

  // ============================================================================
  // SELECTION HOOK
  // ============================================================================

  const {
    selectedNodo,
    selectedLocalizacion,
    handleNodoSelection,
    handleLocalizacionSelection
  } = useMassiveLocalizacionSelection({
    nodoid: formData.nodoid,
    localizacionid: formData.localizacionid
  });

  // ============================================================================
  // CARGAR OPCIONES DE SENSORES Y MÉTRICAS
  // ============================================================================

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        logger.info(`Cargando sensores y métricas disponibles`);

        const [allSensores, allMetricas] = await Promise.all([
          JoySenseService.getTableData('sensor', 1000),
          JoySenseService.getTableData('metrica', 1000)
        ]);

        const sensoresOpts = allSensores.map((s: any) => ({
          value: s.sensorid,
          label: s.sensor
        }));

        const metricasOpts = allMetricas.map((m: any) => ({
          value: m.metricaid,
          label: m.metrica
        }));

        const sMap = new Map(allSensores.map((s: any) => [s.sensorid, s.sensor]));
        const mMap = new Map(allMetricas.map((m: any) => [m.metricaid, m.metrica]));

        setSensoresOptions(sensoresOpts);
        setMetricasOptions(metricasOpts);
        setSensoresMap(sMap);
        setMetricasMap(mMap);
        setLoadingOptions(false);

        logger.info(`Sensores disponibles: ${sensoresOpts.length}, Métricas disponibles: ${metricasOpts.length}`);
      } catch (error) {
        logger.error('Error cargando opciones:', error);
        setSensoresOptions([]);
        setMetricasOptions([]);
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNodoChange = useCallback((nodoid: any) => {
    let parsedNodoid: number | null = null;
    
    if (nodoid === null) {
      parsedNodoid = null;
    } else if (typeof nodoid === 'object' && (nodoid as any).value) {
      parsedNodoid = parseInt((nodoid as any).value.toString());
    } else if (typeof nodoid === 'number') {
      parsedNodoid = nodoid;
    } else {
      parsedNodoid = parseInt(nodoid.toString());
    }

    setTempSelectedNodo(parsedNodoid);
    handleNodoSelection(parsedNodoid);
    setLocalizacionName('');
    setFormData({
      nodoid: parsedNodoid,
      localizacionid: null,
      sensoresMetricasData: []
    });
    setCombinacionesAgregadas([]);
  }, [handleNodoSelection, setFormData]);

  const handleLocalizacionNameChange = useCallback((localizacionName: string, localizacionid: number | null) => {
    setLocalizacionName(localizacionName);
    if (localizacionid !== null) {
      handleLocalizacionSelection(localizacionid);
    }
  }, [handleLocalizacionSelection]);

  const handleAgregarCombinacion = useCallback(() => {
    if (selectedSensorIds.length === 0 || selectedMetricaIds.length === 0) {
      logger.warn('Debe seleccionar al menos un sensor y una métrica');
      return;
    }

    // Generar combinatoria
    const combinaciones: SensorMetricaData[] = [];
    
    for (const sensorId of selectedSensorIds) {
      for (const metricaId of selectedMetricaIds) {
        const sensorName = sensoresMap.get(sensorId);
        const metricaName = metricasMap.get(metricaId);

        if (sensorName && metricaName) {
          combinaciones.push({
            sensorid: sensorId,
            sensor: sensorName,
            metricaid: metricaId,
            metrica: metricaName,
            selected: true
          });
        }
      }
    }

    logger.info(`${combinaciones.length} combinaciones generadas`);
    setCombinacionesAgregadas([...combinacionesAgregadas, ...combinaciones]);
    setSelectedSensorIds([]);
    setSelectedMetricaIds([]);
  }, [selectedSensorIds, selectedMetricaIds, sensoresMap, metricasMap, combinacionesAgregadas]);

  const handleEliminarCombinacion = useCallback((index: number) => {
    const updated = combinacionesAgregadas.filter((_, i) => i !== index);
    setCombinacionesAgregadas(updated);
  }, [combinacionesAgregadas]);

  // ============================================================================
  // VALIDATION & APPLICATION
  // ============================================================================

  const {
    validationResult,
    validationErrors,
    isFormValid,
    selectedCount
  } = useMassiveLocalizacionValidation({
    selectedNodo,
    selectedLocalizacion,
    formData: {
      ...formData,
      sensoresMetricasData: combinacionesAgregadas
    },
    localizacionName
  });

  const { handleApply } = useMassiveLocalizacionApplication({
    formData: {
      ...formData,
      sensoresMetricasData: combinacionesAgregadas
    },
    selectedNodo,
    selectedLocalizacion,
    localizacionName,
    onApply
  });

  // ============================================================================
  // CANCEL HANDLER
  // ============================================================================

  const handleCancel = () => {
    setFormData({
      nodoid: null,
      localizacionid: null,
      sensoresMetricasData: []
    });
    setCombinacionesAgregadas([]);
    setTempSelectedNodo(null);
    setLocalizacionName('');
    setSelectedSensorIds([]);
    setSelectedMetricaIds([]);
    onCancel();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Selector de Nodo y Localización */}
      <MassiveLocalizacionSelector
        selectedNodo={selectedNodo}
        selectedLocalizacion={selectedLocalizacion}
        localizacionName={localizacionName}
        nodosOptions={nodosOptions}
        onNodoSelection={handleNodoChange}
        onLocalizacionChange={handleLocalizacionNameChange}
        loading={loading}
      />

      {/* Formulario para agregar combinaciones */}
      {selectedNodo && localizacionName && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6">
          <h3 className="text-base font-bold text-orange-500 font-mono tracking-wider mb-4">
            AGREGAR COMBINACIÓN SENSOR - MÉTRICA
          </h3>

          {loadingOptions ? (
            <div className="text-center py-4 text-gray-500 dark:text-neutral-400 font-mono text-sm">
              Cargando opciones...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Multi-select Sensores */}
                <div>
                  <label className="block text-sm font-bold text-orange-500 font-mono tracking-wider mb-2">
                    SENSORES (Seleccionar uno o varios)
                  </label>
                  <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800">
                    {sensoresOptions.length === 0 ? (
                      <div className="text-gray-500 dark:text-neutral-400 text-sm">No hay sensores disponibles</div>
                    ) : (
                      sensoresOptions.map((sensor) => (
                        <label key={sensor.value} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedSensorIds.includes(sensor.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSensorIds([...selectedSensorIds, sensor.value]);
                              } else {
                                setSelectedSensorIds(selectedSensorIds.filter(id => id !== sensor.value));
                              }
                            }}
                            disabled={loading}
                            className="w-4 h-4 text-orange-500 rounded cursor-pointer"
                          />
                          <span className="ml-2 text-sm font-mono text-gray-700 dark:text-neutral-300">{sensor.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedSensorIds.length > 0 && (
                    <div className="text-xs text-blue-500 font-mono mt-1">{selectedSensorIds.length} seleccionado(s)</div>
                  )}
                </div>

                {/* Multi-select Métricas */}
                <div>
                  <label className="block text-sm font-bold text-orange-500 font-mono tracking-wider mb-2">
                    MÉTRICAS (Seleccionar una o varias)
                  </label>
                  <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800">
                    {metricasOptions.length === 0 ? (
                      <div className="text-gray-500 dark:text-neutral-400 text-sm">No hay métricas disponibles</div>
                    ) : (
                      metricasOptions.map((metrica) => (
                        <label key={metrica.value} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedMetricaIds.includes(metrica.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMetricaIds([...selectedMetricaIds, metrica.value]);
                              } else {
                                setSelectedMetricaIds(selectedMetricaIds.filter(id => id !== metrica.value));
                              }
                            }}
                            disabled={loading}
                            className="w-4 h-4 text-orange-500 rounded cursor-pointer"
                          />
                          <span className="ml-2 text-sm font-mono text-gray-700 dark:text-neutral-300">{metrica.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedMetricaIds.length > 0 && (
                    <div className="text-xs text-blue-500 font-mono mt-1">{selectedMetricaIds.length} seleccionado(s)</div>
                  )}
                </div>
              </div>

              {/* Botón Agregar con información de combinatoria */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-mono text-gray-600 dark:text-neutral-400">
                  {selectedSensorIds.length > 0 && selectedMetricaIds.length > 0 && (
                    <span className="text-blue-500">
                      Se generarán {selectedSensorIds.length * selectedMetricaIds.length} combinación(es)
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAgregarCombinacion}
                  disabled={selectedSensorIds.length === 0 || selectedMetricaIds.length === 0 || loading}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold font-mono rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + GENERAR
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de combinaciones agregadas */}
      {combinacionesAgregadas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-orange-500 font-mono tracking-wider">
            ENTRADAS GENERADAS ({combinacionesAgregadas.length})
          </h3>

          <div className="overflow-x-auto border border-gray-300 dark:border-neutral-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-neutral-800 border-b border-gray-300 dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-neutral-300">
                    SENSOR
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-neutral-300">
                    MÉTRICA
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-neutral-300 w-20">
                    ACCIÓN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                {combinacionesAgregadas.map((combo, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-gray-700 dark:text-neutral-300 font-mono">
                      {combo.sensor}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-neutral-300 font-mono">
                      {combo.metrica}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEliminarCombinacion(index)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Botones de acción */}
      <MassiveLocalizacionActions
        onApply={handleApply}
        onCancel={handleCancel}
        isValid={isFormValid()}
        loading={loading}
        validationResult={validationResult}
        selectedCount={combinacionesAgregadas.length}
      />
    </div>
  );
});
