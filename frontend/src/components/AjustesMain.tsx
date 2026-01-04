/**
 * AjustesMain - Componente principal para AJUSTES
 * Maneja la configuración de idioma, tema y otras preferencias del usuario
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ConfigurationPanel from './ConfigurationPanel';

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
  const { t } = useLanguage();

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => {
      // Por ahora, no hay cambios sin guardar en ajustes
      // TODO: Implementar detección de cambios si se agregan más configuraciones
      return false;
    },
    handleTableChange: (table: string) => {
      // No aplica para ajustes
      console.log('[AjustesMain] handleTableChange llamado con:', table);
    }
  }));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white font-mono tracking-wider">
          ⚙️ {t('configuration.title') || 'AJUSTES'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-neutral-400 font-mono mt-2">
          {t('configuration.description') || 'Configura tus preferencias de idioma, tema y otras opciones'}
        </p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto">
        <ConfigurationPanel className="max-w-4xl mx-auto" />
      </div>
    </div>
  );
});

AjustesMain.displayName = 'AjustesMain';

export default AjustesMain;

