// ============================================================================
// COMPONENT: MassiveLocalizacionSelector
// Selector de Nodo y Localización para el formulario masivo
// ============================================================================

import React from 'react';
import { SelectWithPlaceholder } from '../../shared/selectors';
import { SelectedNodo, SelectedLocalizacion } from '../types';

interface MassiveLocalizacionSelectorProps {
  selectedNodo: SelectedNodo | null;
  selectedLocalizacion: SelectedLocalizacion | null;
  localizacionName: string;
  nodosOptions: any[];
  onNodoSelection: (nodoid: number | null) => void;
  onLocalizacionChange: (localizacionName: string, localizacionid: number | null) => void;
  loading?: boolean;
}

export const MassiveLocalizacionSelector: React.FC<MassiveLocalizacionSelectorProps> = ({
  selectedNodo,
  selectedLocalizacion,
  localizacionName,
  nodosOptions,
  onNodoSelection,
  onLocalizacionChange,
  loading = false
}) => {
  return (
    <div className="space-y-4">
      {/* Selector de Nodo */}
      <div>
        <label className="block text-sm font-bold text-orange-500 font-mono tracking-wider mb-2">
          NODO
        </label>
        <SelectWithPlaceholder
          options={nodosOptions}
          value={selectedNodo?.nodoid || null}
          onChange={(value) => {
            // Asegurar que el valor sea un número
            if (value) {
              const numValue = typeof value === 'object' && (value as any).value ? parseInt((value as any).value.toString()) : parseInt(value.toString());
              onNodoSelection(numValue);
            } else {
              onNodoSelection(null);
            }
          }}
          placeholder="Seleccionar Nodo..."
          disabled={loading}
        />
      </div>

      {/* Input de texto para Localización */}
      {selectedNodo && (
        <div>
          <label className="block text-sm font-bold text-orange-500 font-mono tracking-wider mb-2">
            NOMBRE DE LOCALIZACIÓN
          </label>
          <input
            type="text"
            value={localizacionName}
            onChange={(e) => onLocalizacionChange(e.target.value, null)}
            placeholder="Tipear nombre de localización..."
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-mono placeholder-gray-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
};
