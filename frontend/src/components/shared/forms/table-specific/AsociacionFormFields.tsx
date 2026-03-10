// ============================================================================
// ASOCIACION FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Asociación
// Muestra un grid de dispositivos cuando se selecciona una localización

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { LocationSelector } from '../LocationSelector';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';
import { JoySenseService } from '../../../../services/backend-api';

interface DispositivoRow {
  id: string;
  localizacionid: number;
  localizacionNombre: string;
  sensorNombre: string;
  tipoNombre: string;
  metricaNombre: string;
  metricaUnidad: string;
  id_device: string;
  activo: boolean;
}

interface LocalizacionConSensor {
  localizacionid: number;
  localizacion: string;
  sensorid?: number;
  sensorNombre?: string;
  tipoid?: number;
  tipoNombre?: string;
  metricaid?: number;
  metricaNombre?: string;
  metricaUnidad?: string;
}

interface AsociacionFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
}

export const AsociacionFormFields: React.FC<AsociacionFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField
}) => {
  const { t } = useLanguage();
  
  const [dispositivosGrid, setDispositivosGrid] = useState<DispositivoRow[]>([]);
  const [localizacionNombre, setLocalizacionNombre] = useState<string>('');
  const [isLoadingLocalizaciones, setIsLoadingLocalizaciones] = useState(false);

  const loadLocalizacionesRelacionadas = useCallback(async (nodoid: number, localizacionName: string) => {
    if (!nodoid || !localizacionName) {
      return;
    }
    
    setIsLoadingLocalizaciones(true);
    try {
      // Obtener TODAS las localizaciones con este nombre en este nodo
      // Esto devuelve todas las combinaciones sensor-métrica para esta ubicación
      const enrichedLocalizaciones = await JoySenseService.getLocalizacionesByName(localizacionName);
      
      // Filtrar para obtener SOLO las que pertenecen a este nodoid
      const nodosLocalizaciones = enrichedLocalizaciones.filter(
        (loc: any) => loc.nodoid === nodoid
      );
      
      // Si no obtenemos suficientes datos del enriquecimiento, obtener nodos
      if (nodosLocalizaciones.length === 0) {
        // Obtener datos de la tabla localizacion para filtrar por nodoid
        const allLocalizaciones = await JoySenseService.getTableData('localizacion', 10000);
        
        // Filtrar por nodoid y localizacion name
        const locsByNode = allLocalizaciones.filter(
          (loc: any) => loc.nodoid === nodoid && loc.localizacion === localizacionName
        );
        
        if (locsByNode.length === 0) {
          setDispositivosGrid([]);
          return;
        }
        
        // Enriquecer estos datos con información de sensores/tipos/métricas
        try {
          const enrichedAll = await JoySenseService.getLocalizacionesByName(localizacionName);
          
          // Filtrar para obtener solo los que coinciden con el nodoid
          const localizacionidsForNode = locsByNode.map((l: any) => l.localizacionid);
          const enrichedFiltered = enrichedAll.filter((loc: any) => 
            localizacionidsForNode.includes(loc.localizacionid)
          );
          
          // Crear filas con los datos enriquecidos
          const nuevasFilas: DispositivoRow[] = enrichedFiltered.map((loc) => ({
            id: `loc_${loc.localizacionid}`,
            localizacionid: loc.localizacionid,
            localizacionNombre: loc.localizacion,
            sensorNombre: loc.sensorNombre || 'Sin sensor',
            tipoNombre: loc.tipoNombre || 'Sin tipo',
            metricaNombre: loc.metricaNombre || 'Sin métrica',
            metricaUnidad: loc.metricaUnidad || '',
            id_device: '',
            activo: true
          }));
          
          setDispositivosGrid(nuevasFilas);
        } catch (enrichError) {
          // Fallback: usar datos básicos
          const nuevasFilas: DispositivoRow[] = locsByNode.map((loc) => ({
            id: `loc_${loc.localizacionid}`,
            localizacionid: loc.localizacionid,
            localizacionNombre: loc.localizacion,
            sensorNombre: `Sensor ${loc.sensorid}`,
            tipoNombre: 'Sin tipo',
            metricaNombre: `Métrica ${loc.metricaid}`,
            metricaUnidad: '',
            id_device: '',
            activo: true
          }));
          setDispositivosGrid(nuevasFilas);
        }
      } else {
        // Procesar los datos enriquecidos directamente
        const nuevasFilas: DispositivoRow[] = nodosLocalizaciones.map((loc) => ({
          id: `loc_${loc.localizacionid}`,
          localizacionid: loc.localizacionid,
          localizacionNombre: loc.localizacion,
          sensorNombre: loc.sensorNombre || 'Sin sensor',
          tipoNombre: loc.tipoNombre || 'Sin tipo',
          metricaNombre: loc.metricaNombre || 'Sin métrica',
          metricaUnidad: loc.metricaUnidad || '',
          id_device: '',
          activo: true
        }));
        
        setDispositivosGrid(nuevasFilas);
      }
    } catch (error) {
      console.error('[AsociacionFormFields] Error cargando localizaciones por nodo:', error);
    } finally {
      setIsLoadingLocalizaciones(false);
    }
  }, []);

  useEffect(() => {
    if (!formData.localizacionid) {
      setDispositivosGrid([]);
      setLocalizacionNombre('');
      return;
    }

    // formData.localizacionid ahora es "nodoid|localizacionName"
    const parts = (formData.localizacionid as string).split('|');
    
    if (parts.length !== 2) {
      setDispositivosGrid([]);
      return;
    }
    
    const nodoid = parseInt(parts[0]);
    const localizacionName = parts[1];
    
    // Cargar datos de la localización específica seleccionada (por nodoid + nombre)
    loadLocalizacionesRelacionadas(nodoid, localizacionName);
  }, [formData.localizacionid, loadLocalizacionesRelacionadas]);

  useEffect(() => {
    setFormData({
      ...formData,
      _dispositivosGrid: dispositivosGrid
    });
  }, [dispositivosGrid]);

  const handleLocationChange = useCallback((value: string | null) => {
    // value es "nodoid|localizacionName"
    updateField('localizacionid', value);
    
    if (!value) {
      setDispositivosGrid([]);
      setLocalizacionNombre('');
    } else {
      const parts = value.split('|');
      if (parts.length === 2) {
        setLocalizacionNombre(parts[1]);
      }
    }
  }, [updateField]);

  const handleNombreChange = useCallback((nombre: string) => {
    setLocalizacionNombre(nombre);
    // No cargar el grid aquí - solo se carga cuando se selecciona una localización específica (con ID)
    // El grid se cargará en el useEffect cuando formData.localizacionid cambie
  }, []);

  const handleAddDispositivo = useCallback(() => {
    const newId = `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRow: DispositivoRow = {
      id: newId,
      localizacionid: 0,
      localizacionNombre: localizacionNombre,
      sensorNombre: '',
      tipoNombre: '',
      metricaNombre: '',
      metricaUnidad: '',
      id_device: '',
      activo: true
    };
    setDispositivosGrid(prev => [...prev, newRow]);
  }, [localizacionNombre]);

  const handleRemoveDispositivo = useCallback((id: string) => {
    setDispositivosGrid(prev => prev.filter(row => row.id !== id));
  }, []);

  const handleIdDeviceChange = useCallback((id: string, value: string) => {
    setDispositivosGrid(prev => 
      prev.map(row => row.id === id ? { ...row, id_device: value } : row)
    );
  }, []);

  const handleActivoChange = useCallback((id: string, checked: boolean) => {
    setDispositivosGrid(prev => 
      prev.map(row => row.id === id ? { ...row, activo: checked } : row)
    );
  }, []);

  const hasValidDevices = dispositivosGrid.some(d => d.id_device.trim() !== '');

  const isRowFromLocalizacion = (id: string) => id.startsWith('loc_');

  return (
    <div className="space-y-4">
      {/* Campo Localización */}
      <div className="space-y-2">
        <label className={`block text-base font-bold font-mono tracking-wider ${getThemeColor('text')}`}>
          {getColumnDisplayNameTranslated('localizacionid', t)?.toUpperCase()} *
        </label>
        <div className="max-w-md">
          <LocationSelector
            value={(formData.localizacionid as string) || null}
            onChange={handleLocationChange}
            onNombreChange={handleNombreChange}
            placeholder="BUSQUEDA"
            isRequired={true}
            themeColor="green"
          />
        </div>
      </div>

      {/* Grid de Dispositivos - Solo mostrar si hay una localización seleccionada */}
      {formData.localizacionid && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={`block text-base font-bold font-mono tracking-wider ${getThemeColor('text')}`}>
              DISPOSITIVOS
            </label>
            <button
              type="button"
              onClick={handleAddDispositivo}
              className={`px-3 py-1.5 text-sm font-mono rounded-lg ${getThemeColor('bg')} ${getThemeColor('hover')} text-white transition-colors`}
            >
              + Agregar dispositivo
            </button>
          </div>

          {isLoadingLocalizaciones ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                Cargando localizaciones...
              </p>
            </div>
          ) : dispositivosGrid.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                No hay dispositivos agregados. Haga clic en "Agregar dispositivo" para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-neutral-600">
                <thead>
                  <tr className="bg-gray-100 dark:bg-neutral-800">
                    <th className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center font-mono text-sm font-bold w-16">
                      #
                    </th>
                    <th className="border border-gray-300 dark:border-neutral-600 px-4 py-2 text-left font-mono text-sm font-bold">
                      SENSOR
                    </th>
                    <th className="border border-gray-300 dark:border-neutral-600 px-4 py-2 text-left font-mono text-sm font-bold">
                      TIPO
                    </th>
                    <th className="border border-gray-300 dark:border-neutral-600 px-4 py-2 text-left font-mono text-sm font-bold">
                      MÉTRICA
                    </th>
                    <th className="border border-gray-300 dark:border-neutral-600 px-4 py-2 text-left font-mono text-sm font-bold">
                      ID DISPOSITIVO
                    </th>
                    <th className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center font-mono text-sm font-bold w-20">
                      ACTIVO
                    </th>
                    <th className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center font-mono text-sm font-bold w-16">
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dispositivosGrid.map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center font-mono text-sm text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 font-mono text-sm text-gray-700 dark:text-gray-300">
                        {row.sensorNombre || '-'}
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 font-mono text-sm text-gray-700 dark:text-gray-300">
                        {row.tipoNombre || '-'}
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 font-mono text-sm text-gray-700 dark:text-gray-300">
                        <div>
                          <span>{row.metricaNombre || '-'}</span>
                          {row.metricaUnidad && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">({row.metricaUnidad})</span>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2">
                        <input
                          type="text"
                          value={row.id_device}
                          onChange={(e) => handleIdDeviceChange(row.id, e.target.value)}
                          placeholder="Ingrese ID del dispositivo"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg font-mono text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.activo}
                          onChange={(e) => handleActivoChange(row.id, e.target.checked)}
                          className={`w-5 h-5 rounded focus:ring-2 focus:ring-orange-500 appearance-none border-2 ${
                            row.activo
                              ? 'bg-orange-600 border-orange-600 checked:bg-orange-600 checked:border-orange-600'
                              : 'bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 checked:bg-orange-600 checked:border-orange-600'
                          }`}
                          style={row.activo ? { backgroundColor: '#ea580c', borderColor: '#ea580c' } : {}}
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveDispositivo(row.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dispositivosGrid.length > 0 && !hasValidDevices && (
            <p className="text-orange-500 text-sm font-mono">
              ⚠️ Agregue al menos un ID de dispositivo válido
            </p>
          )}
        </div>
      )}
    </div>
  );
};
