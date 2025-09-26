import { useCallback } from 'react';
import { useDataLossModal } from './useDataLossModal';
import { useUnsavedChanges, UnsavedChangesConfig } from './useUnsavedChanges';

export interface DataLossProtectionConfig {
  formData: Record<string, any>;
  selectedTable: string;
  activeSubTab: string;
  multipleData?: any[];
  onConfirmAction: () => void;
  onCancelAction: () => void;
}

export const useDataLossProtection = () => {
  const { modalState, showModal, hideModal, confirmAction, cancelAction } = useDataLossModal();
  const { hasUnsavedChanges } = useUnsavedChanges();

  // Escenario 1: Cambio de subpestaña (Estado, Crear, Actualizar, Masivo)
  const checkSubTabChange = useCallback((
    config: DataLossProtectionConfig,
    targetSubTab: string
  ): boolean => {
    const { formData, selectedTable, activeSubTab, multipleData, onConfirmAction, onCancelAction } = config;
    
    const hasChanges = hasUnsavedChanges({
      formData,
      selectedTable,
      activeSubTab,
      multipleData
    });

    if (hasChanges) {
      const getSubTabName = (tab: string) => {
        const names: { [key: string]: string } = {
          'status': 'Estado',
          'insert': 'Crear',
          'update': 'Actualizar',
          'massive': 'Masivo'
        };
        return names[tab] || tab;
      };

      showModal(
        'subtab',
        getSubTabName(activeSubTab),
        getSubTabName(targetSubTab),
        onConfirmAction,
        onCancelAction
      );
      return true; // Modal mostrado, bloquear cambio
    }

    return false; // No hay cambios, permitir cambio
  }, [hasUnsavedChanges, showModal]);

  // Escenario 2: Cambio de parámetro (País, Empresa, Fundo, etc.)
  const checkParameterChange = useCallback((
    config: DataLossProtectionConfig,
    targetParameter: string
  ): boolean => {
    const { formData, selectedTable, activeSubTab, multipleData, onConfirmAction, onCancelAction } = config;
    
    
    const hasChanges = hasUnsavedChanges({
      formData,
      selectedTable,
      activeSubTab,
      multipleData
    });


    if (hasChanges) {
      const getParameterName = (param: string) => {
        const names: { [key: string]: string } = {
          'pais': 'PAÍS',
          'empresa': 'EMPRESA',
          'fundo': 'FUNDO',
          'ubicacion': 'UBICACIÓN',
          'localizacion': 'LOCALIZACIÓN',
          'entidad': 'ENTIDAD',
          'tipo': 'TIPO',
          'nodo': 'NODO',
          'sensor': 'SENSOR',
          'metricasensor': 'MÉTRICA SENSOR',
          'metrica': 'MÉTRICA',
          'umbral': 'UMBRAL',
          'perfilumbral': 'PERFIL UMBRAL',
          'audit_log_umbral': 'AUDIT LOG UMBRAL',
          'criticidad': 'CRITICIDAD',
          'medio': 'MEDIO',
          'contacto': 'CONTACTO',
          'usuario': 'USUARIO',
          'usuarioperfil': 'USUARIO PERFIL',
          'perfil': 'PERFIL'
        };
        return names[param] || param.toUpperCase();
      };

      showModal(
        'parameter',
        getParameterName(selectedTable),
        getParameterName(targetParameter),
        onConfirmAction,
        onCancelAction
      );
      return true; // Modal mostrado, bloquear cambio
    }

    return false; // No hay cambios, permitir cambio
  }, [hasUnsavedChanges, showModal]);

  // Escenario 3: Cambio de pestaña principal (Parámetros, Reportes, Dashboard, etc.)
  const checkTabChange = useCallback((
    config: DataLossProtectionConfig,
    targetTab: string
  ): boolean => {
    const { formData, selectedTable, activeSubTab, multipleData, onConfirmAction, onCancelAction } = config;
    
    const hasChanges = hasUnsavedChanges({
      formData,
      selectedTable,
      activeSubTab,
      multipleData
    });

    if (hasChanges) {
      const getTabName = (tab: string) => {
        const names: { [key: string]: string } = {
          'parameters': 'Parámetros',
          'reportes': 'Reportes',
          'dashboard': 'Dashboard',
          'umbrales': 'Configuración'
        };
        return names[tab] || tab.toUpperCase();
      };

      showModal(
        'tab',
        getTabName(selectedTable),
        getTabName(targetTab),
        onConfirmAction,
        onCancelAction
      );
      return true; // Modal mostrado, bloquear cambio
    }

    return false; // No hay cambios, permitir cambio
  }, [hasUnsavedChanges, showModal]);

  return {
    modalState,
    checkSubTabChange,
    checkParameterChange,
    checkTabChange,
    confirmAction,
    cancelAction,
    hideModal
  };
};
