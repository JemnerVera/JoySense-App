// ============================================================================
// COMPONENT: MassiveLocalizacionTable
// Tabla de Sensores y Métricas para asignación masiva
// ============================================================================

import React from 'react';
import { SensorMetricaData } from '../types';

interface MassiveLocalizacionTableProps {
  sensoresMetricasData: SensorMetricaData[];
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  loading?: boolean;
}

export const MassiveLocalizacionTable: React.FC<MassiveLocalizacionTableProps> = ({
  sensoresMetricasData,
  onToggle,
  onSelectAll,
  loading = false
}) => {
  const selectedCount = sensoresMetricasData.filter(sm => sm.selected).length;
  const allSelected = selectedCount === sensoresMetricasData.length && sensoresMetricasData.length > 0;

  return (
    <div className="space-y-4">
      {/* Header con título y botón seleccionar todo */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-orange-500 font-mono tracking-wider">
          SENSORES Y MÉTRICAS
        </h3>
        {sensoresMetricasData.length > 0 && (
          <button
            onClick={onSelectAll}
            disabled={loading}
            className="px-3 py-1 text-sm font-mono font-bold bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allSelected ? 'DESELECCIONAR TODO' : 'SELECCIONAR TODO'}
          </button>
        )}
      </div>

      {/* Tabla o mensaje vacío */}
      {sensoresMetricasData.length === 0 ? (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
          <div className="text-yellow-300 font-mono text-sm">
            ⚠️ No hay combinaciones de sensores y métricas disponibles
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-300 dark:border-neutral-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-neutral-800 border-b border-gray-300 dark:border-neutral-700">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    disabled={loading}
                    className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-neutral-300">
                  SENSOR
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-neutral-300">
                  MÉTRICA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {sensoresMetricasData.map((sm, index) => (
                <tr
                  key={`${sm.sensorid}-${sm.metricaid}`}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={sm.selected}
                      onChange={() => onToggle(index)}
                      disabled={loading}
                      className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-neutral-300 font-mono">
                    {sm.sensor}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-neutral-300 font-mono">
                    {sm.metrica}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen */}
      {sensoresMetricasData.length > 0 && (
        <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-3 mt-4">
          <div className="text-blue-300 font-mono text-sm">
            ℹ️ {selectedCount} de {sensoresMetricasData.length} sensor(es) y métrica(s) seleccionado(s)
          </div>
        </div>
      )}
    </div>
  );
};
