/**
 * AjustesMain - Componente principal para AJUSTES
 * Maneja la configuración de idioma, tema y otras preferencias del usuario
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import ConfigurationPanel from '../core/ConfigurationPanel';

export interface AjustesMainRef {
  hasUnsavedChanges: () => boolean;
  handleTableChange: (table: string) => void;
}

interface AjustesMainProps {
  className?: string;
}

const AjustesMain = forwardRef<AjustesMainRef, AjustesMainProps>(({
  className = ''
}, ref) => {
  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => {
      // Por ahora, no hay cambios sin guardar en ajustes
      // TODO: Implementar detección de cambios si se agregan más configuraciones
      return false;
    },
    handleTableChange: (table: string) => {
      // No aplica para ajustes
    }
  }));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Contenido principal - sin título */}
      <div className="flex-1 overflow-y-auto p-6">
        <ConfigurationPanel className="max-w-4xl mx-auto" />
      </div>
    </div>
  );
});

AjustesMain.displayName = 'AjustesMain';

export default AjustesMain;
