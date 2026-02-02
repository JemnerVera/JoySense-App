// ============================================================================
// COMPONENT: MassiveUmbralMetricsTable - Tabla de métricas con configuración de umbrales
// ============================================================================

import React from 'react';
import { SelectWithPlaceholder } from '../../selectors';
import { MetricaData, SelectedTipo } from '../types';

interface MassiveUmbralMetricsTableProps {
  metricasData: MetricaData[];
  assignedSensorTypes: SelectedTipo[];
  criticidadesOptions: any[];
  onMetricaToggle: (metricaid: number) => void;
  onMetricaSelection: (metricaid: number, selected: boolean) => void;
  onUmbralChange: (metricaid: number, tipoid: number, field: string, value: string) => void;
  loading?: boolean;
}

export const MassiveUmbralMetricsTable: React.FC<MassiveUmbralMetricsTableProps> = ({
  metricasData,
  assignedSensorTypes,
  criticidadesOptions,
  onMetricaToggle,
  onMetricaSelection,
  onUmbralChange,
  loading = false
}) => {
  if (assignedSensorTypes.length === 0) return null;

  return (
    <div>
      <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
        MÉTRICAS
      </h4>
      
      <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {metricasData.map((metrica) => (
            <div key={metrica.metricaid} className="bg-gray-100 dark:bg-neutral-800 rounded-lg">
              <div className="flex items-center justify-between p-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metrica.selected}
                    onChange={(e) => onMetricaSelection(metrica.metricaid, e.target.checked)}
                    className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                  />
                  <span className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">
                    {metrica.metrica.toUpperCase()}
                  </span>
                  {metrica.unidad && (
                    <span className="text-gray-500 dark:text-neutral-400 text-xs ml-2">
                      ({metrica.unidad})
                    </span>
                  )}
                </label>
                
                <button
                  onClick={() => onMetricaToggle(metrica.metricaid)}
                  disabled={!metrica.selected}
                  className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                >
                  {metrica.expanded ? 'OCULTAR' : 'CONFIGURAR'}
                </button>
              </div>
              
              {/* Contenido expandible */}
              {metrica.expanded && metrica.selected && (
                <div className="px-3 pb-3 border-t border-gray-300 dark:border-neutral-600">
                  <div className="space-y-4 mt-3">
                    {assignedSensorTypes.map((tipo) => {
                      const umbralDelTipo = metrica.umbralesPorTipo[tipo.tipoid] || {
                        minimo: '',
                        maximo: '',
                        criticidadid: null,
                        umbral: ''
                      };
                      
                      return (
                        <div key={tipo.tipoid} className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-4">
                          <div className="mb-3">
                            <h6 className="text-orange-300 font-mono tracking-wider font-bold">
                              {tipo.tipo.toUpperCase()}
                            </h6>
                          </div>
                          
                          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-300 dark:border-neutral-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                  VALOR MÍNIMO
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={umbralDelTipo.minimo || ''}
                                  onChange={(e) => onUmbralChange(metrica.metricaid, tipo.tipoid, 'minimo', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0.00"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                  VALOR MÁXIMO
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={umbralDelTipo.maximo || ''}
                                  onChange={(e) => onUmbralChange(metrica.metricaid, tipo.tipoid, 'maximo', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="100.00"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                  CRITICIDAD
                                </label>
                                <SelectWithPlaceholder
                                  options={criticidadesOptions}
                                  value={umbralDelTipo.criticidadid || null}
                                  onChange={(value) => onUmbralChange(metrica.metricaid, tipo.tipoid, 'criticidadid', value ? value.toString() : '')}
                                  placeholder="SELECCIONAR"
                                  disabled={loading}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                  NOMBRE UMBRAL
                                </label>
                                <input
                                  type="text"
                                  value={umbralDelTipo.umbral || ''}
                                  onChange={(e) => onUmbralChange(metrica.metricaid, tipo.tipoid, 'umbral', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500"
                                  placeholder="Nombre del umbral"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

