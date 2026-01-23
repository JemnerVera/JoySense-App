/**
 * AgrupacionMain - Componente principal para AGRUPACION
 * Maneja la tabla ENTIDAD
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import SystemParameters, { SystemParametersRef } from '../SystemParameters';

interface AgrupacionMainProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
  onMassiveFormDataChange?: (massiveFormData: Record<string, any>) => void;
  themeColor?: 'green';
}

export interface AgrupacionMainRef {
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  handleTableChange: (table: string) => void;
}

const AgrupacionMain = forwardRef<AgrupacionMainRef, AgrupacionMainProps>(({
  selectedTable: propSelectedTable,
  onTableSelect,
  activeSubTab: propActiveSubTab = 'status',
  onSubTabChange,
  onFormDataChange,
  onMassiveFormDataChange,
  themeColor = 'green'
}, ref) => {
  const { t } = useLanguage();
  const systemParametersRef = useRef<SystemParametersRef | null>(null);

  // Estado local para la tabla seleccionada
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || 'entidad');

  // Sincronizar con prop
  useEffect(() => {
    if (propSelectedTable) {
      setSelectedTable(propSelectedTable);
    } else {
      // Si no hay tabla seleccionada, usar 'entidad' por defecto
      setSelectedTable('entidad');
    }
  }, [propSelectedTable]);

  // Handlers
  const handleTableSelect = useCallback((table: string) => {
    setSelectedTable(table);
    if (onTableSelect) {
      onTableSelect(table);
    }
  }, [onTableSelect]);

  // Exponer métodos al ref
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => {
      return systemParametersRef.current?.hasUnsavedChanges() || false;
    },
    handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => {
      systemParametersRef.current?.handleTabChange(tab);
      if (onSubTabChange) {
        onSubTabChange(tab);
      }
    },
    handleTableChange: (table: string) => {
      handleTableSelect(table);
      systemParametersRef.current?.handleTableChange(table);
    }
  }), [handleTableSelect, onSubTabChange]);

  // Si no hay tabla seleccionada, mostrar mensaje
  if (!selectedTable) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono tracking-wider">AGRUPACIÓN</h2>
            <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DE AGRUPACIÓN PARA CONTINUAR</p>
          </div>
        </div>
      </div>
    );
  }

  // Usar SystemParameters para manejar la tabla
  return (
    <SystemParameters
      ref={systemParametersRef}
      selectedTable={selectedTable}
      onTableSelect={handleTableSelect}
      activeSubTab={propActiveSubTab}
      onSubTabChange={onSubTabChange}
      onFormDataChange={onFormDataChange}
      onMassiveFormDataChange={onMassiveFormDataChange}
      themeColor={themeColor}
    />
  );
});

AgrupacionMain.displayName = 'AgrupacionMain';

export default AgrupacionMain;

