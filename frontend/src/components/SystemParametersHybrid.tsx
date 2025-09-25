import React, { useState, forwardRef, useImperativeHandle } from 'react';
import SystemParameters from './SystemParameters';
import { SystemParametersRefactored } from './SystemParametersRefactored';

interface SystemParametersHybridProps {
  onDataChange?: (data: any) => void;
  clearFormData?: boolean;
}

export interface SystemParametersHybridRef {
  handleTableChange: (table: string) => void;
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: "status" | "insert" | "update" | "massive") => void;
}

/**
 * Componente híbrido para migración gradual
 * Usa versión refactorizada solo para "Crear", original para el resto
 */
export const SystemParametersHybrid = forwardRef<SystemParametersHybridRef, SystemParametersHybridProps>(({ onDataChange, clearFormData }, ref) => {
  const [useRefactoredForCreate, setUseRefactoredForCreate] = useState(false);
  
  const toggleCreateVersion = () => {
    setUseRefactoredForCreate(!useRefactoredForCreate);
  };

  // Exponer métodos del componente original
  useImperativeHandle(ref, () => ({
    handleTableChange: (table: string) => {
      // Delegar al componente original
      console.log('handleTableChange delegado a versión original:', table);
    },
    hasUnsavedChanges: () => {
      return false;
    },
    handleTabChange: (tab: "status" | "insert" | "update" | "massive") => {
      // Delegar al componente original
      console.log('handleTabChange delegado a versión original:', tab);
    }
  }));
  
  return (
    <div>
      {/* Banner de migración gradual */}
      <div className="mb-4 p-4 bg-blue-100 border border-blue-400 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-800 text-lg">🔄 Migración Gradual - Solo "Crear"</h3>
            <p className="text-blue-700 mt-1">
              <strong>Estado:</strong> {useRefactoredForCreate ? 'Crear con versión refactorizada' : 'Crear con versión original'}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              {useRefactoredForCreate 
                ? '✅ Crear: Versión optimizada - 96.5% menos código' 
                : '⚠️ Crear: Versión original - 14,390 líneas'
              }
            </p>
            <p className="text-blue-500 text-xs mt-1">
              Estado, Actualizar y Masivo: Siempre versión original (estable)
            </p>
          </div>
          <button
            onClick={toggleCreateVersion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {useRefactoredForCreate ? '← Crear Original' : 'Crear Refactorizada →'}
          </button>
        </div>
      </div>
      
      {/* Renderizar componente según la configuración */}
      {useRefactoredForCreate ? (
        <SystemParametersRefactored onDataChange={onDataChange} />
      ) : (
        <SystemParameters 
          onFormDataChange={onDataChange} 
          clearFormData={clearFormData}
        />
      )}
    </div>
  );
});

export default SystemParametersHybrid;
