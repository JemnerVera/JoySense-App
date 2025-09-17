import { useState, useCallback, useRef } from 'react';

export interface ChangeInterceptorConfig {
  formData: Record<string, any>;
  selectedTable: string;
  activeSubTab: string;
  multipleData: any[];
  onConfirmAction: () => void;
  onCancelAction: () => void;
}

export interface PendingChange {
  type: 'subtab' | 'parameter' | 'tab';
  target: string;
  config: ChangeInterceptorConfig;
}

export const useChangeInterceptor = () => {
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasUnsavedChangesRef = useRef<() => boolean>(() => false);

  // Función para registrar la función de detección de cambios
  const registerChangeDetector = useCallback((detector: () => boolean) => {
    hasUnsavedChangesRef.current = detector;
  }, []);

  // Función para interceptar cambios de subpestaña
  const interceptSubTabChange = useCallback((
    targetSubTab: string,
    config: ChangeInterceptorConfig
  ): boolean => {
    console.log('🛡️ Intercepting sub-tab change to:', targetSubTab);
    
    const hasChanges = hasUnsavedChangesRef.current();
    console.log('🛡️ Has unsaved changes:', hasChanges);
    
    if (hasChanges) {
      setPendingChange({
        type: 'subtab',
        target: targetSubTab,
        config
      });
      setIsModalOpen(true);
      return true; // Bloquear cambio
    }
    
    // No hay cambios, permitir cambio inmediatamente
    config.onConfirmAction();
    return false;
  }, []);

  // Función para interceptar cambios de parámetro
  const interceptParameterChange = useCallback((
    targetParameter: string,
    config: ChangeInterceptorConfig
  ): boolean => {
    console.log('🛡️ Intercepting parameter change to:', targetParameter);
    
    const hasChanges = hasUnsavedChangesRef.current();
    console.log('🛡️ Has unsaved changes:', hasChanges);
    
    if (hasChanges) {
      setPendingChange({
        type: 'parameter',
        target: targetParameter,
        config
      });
      setIsModalOpen(true);
      return true; // Bloquear cambio
    }
    
    // No hay cambios, permitir cambio inmediatamente
    config.onConfirmAction();
    return false;
  }, []);

  // Función para interceptar cambios de pestaña principal
  const interceptTabChange = useCallback((
    targetTab: string,
    config: ChangeInterceptorConfig
  ): boolean => {
    console.log('🛡️ Intercepting tab change to:', targetTab);
    
    const hasChanges = hasUnsavedChangesRef.current();
    console.log('🛡️ Has unsaved changes:', hasChanges);
    
    if (hasChanges) {
      setPendingChange({
        type: 'tab',
        target: targetTab,
        config
      });
      setIsModalOpen(true);
      return true; // Bloquear cambio
    }
    
    // No hay cambios, permitir cambio inmediatamente
    config.onConfirmAction();
    return false;
  }, []);

  // Función para confirmar el cambio pendiente
  const confirmChange = useCallback(() => {
    if (pendingChange) {
      console.log('🛡️ Confirming change:', pendingChange);
      pendingChange.config.onConfirmAction();
      setPendingChange(null);
      setIsModalOpen(false);
    }
  }, [pendingChange]);

  // Función para cancelar el cambio pendiente
  const cancelChange = useCallback(() => {
    if (pendingChange) {
      console.log('🛡️ Cancelling change:', pendingChange);
      pendingChange.config.onCancelAction();
      setPendingChange(null);
      setIsModalOpen(false);
    }
  }, [pendingChange]);

  // Función para obtener información del cambio pendiente
  const getPendingChangeInfo = useCallback(() => {
    if (!pendingChange) return null;

    const getContextName = (type: string, target: string) => {
      if (type === 'subtab') {
        const names: { [key: string]: string } = {
          'status': 'Estado',
          'insert': 'Crear',
          'update': 'Actualizar',
          'massive': 'Masivo'
        };
        return names[target] || target;
      } else if (type === 'parameter') {
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
        return names[target] || target.toUpperCase();
      } else if (type === 'tab') {
        const names: { [key: string]: string } = {
          'parameters': 'Parámetros',
          'reportes': 'Reportes',
          'dashboard': 'Dashboard',
          'umbrales': 'Configuración'
        };
        return names[target] || target.toUpperCase();
      }
      return target;
    };

    return {
      isOpen: isModalOpen,
      contextType: pendingChange.type as 'subtab' | 'parameter' | 'tab',
      currentContext: getContextName(pendingChange.type, 'current'), // Esto se puede mejorar
      targetContext: getContextName(pendingChange.type, pendingChange.target),
      onConfirm: confirmChange,
      onCancel: cancelChange
    };
  }, [pendingChange, isModalOpen, confirmChange, cancelChange]);

  return {
    registerChangeDetector,
    interceptSubTabChange,
    interceptParameterChange,
    interceptTabChange,
    getPendingChangeInfo
  };
};
