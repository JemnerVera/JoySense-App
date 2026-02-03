// ============================================================================
// COMPONENT: MassiveLocalizacionActions
// Botones de acción para el formulario masivo de localizaciones
// ============================================================================

import React from 'react';
import { ValidationResult } from '../types';

interface MassiveLocalizacionActionsProps {
  onApply: () => void;
  onCancel: () => void;
  isValid: boolean;
  loading?: boolean;
  validationResult?: ValidationResult;
  selectedCount?: number;
}

export const MassiveLocalizacionActions: React.FC<MassiveLocalizacionActionsProps> = ({
  onApply,
  onCancel,
  isValid,
  loading = false,
  validationResult,
  selectedCount = 0
}) => {
  return (
    <div className="space-y-4">
      {/* Mostrar errores de validación */}
      {!isValid && validationResult && validationResult.message && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
          <div className="text-yellow-300 font-mono text-sm">
            {validationResult.message}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onApply}
          disabled={!isValid || loading}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold font-mono rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'APLICANDO...' : `APLICAR (${selectedCount})`}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold font-mono rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
};
