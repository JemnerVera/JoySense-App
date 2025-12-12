// ============================================================================
// COMPONENT: MassiveUmbralActions - Botones de acción
// ============================================================================

import React from 'react';
import { ValidationResult } from '../types';

interface MassiveUmbralActionsProps {
  onApply: () => void;
  onCancel: () => void;
  isValid: boolean;
  loading: boolean;
  validationResult: ValidationResult;
  validationErrors: string[];
  totalCombinations: number;
}

export const MassiveUmbralActions: React.FC<MassiveUmbralActionsProps> = ({
  onApply,
  onCancel,
  isValid,
  loading,
  validationResult,
  validationErrors,
  totalCombinations
}) => {
  return (
    <div className="flex justify-end space-x-4">
      <button
        onClick={onApply}
        disabled={!isValid || loading || validationErrors.length > 0}
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        title={
          loading ? 'Guardando umbrales...' :
          !validationResult.isValid ? 'Selecciona nodos con los mismos tipos de sensores' :
          validationErrors.length > 0 ? `Faltan: ${validationErrors.join(', ')}` :
          `Crear ${totalCombinations} umbrales`
        }
      >
        <span>➕</span>
        <span>
          {loading ? 'GUARDANDO...' : 
           !validationResult.isValid ? 'TIPOS INCONSISTENTES' : 
           validationErrors.length > 0 ? 'FALTAN DATOS' :
           `GUARDAR (${totalCombinations})`}
        </span>
      </button>
      
      <button
        onClick={onCancel}
        disabled={loading}
        className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
      >
        <span>❌</span>
        <span>CANCELAR</span>
      </button>
    </div>
  );
};

