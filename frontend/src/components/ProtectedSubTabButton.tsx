import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useSimpleChangeDetection } from '../hooks/useSimpleChangeDetection';
import { useSidebar } from '../contexts/SidebarContext';

interface ProtectedSubTabButtonProps {
  children: React.ReactNode;
  targetTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar';
  currentTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar';
  selectedTable: string;
  formData: Record<string, any>;
  multipleData: any[];
  massiveFormData?: Record<string, any>;
  onTabChange: (tab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => void;
  onTabChangeFromProtectedButton?: (tab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => void;
  className?: string;
  onClick?: () => void;
}

const ProtectedSubTabButton: React.FC<ProtectedSubTabButtonProps> = ({
  children,
  targetTab,
  currentTab,
  selectedTable,
  formData,
  multipleData,
  massiveFormData = {},
  onTabChange,
  onTabChangeFromProtectedButton,
  className,
  onClick
}) => {
  const { showModal } = useModal();
  const { hasSignificantChanges } = useSimpleChangeDetection();
  const sidebar = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevenir el comportamiento por defecto del botón
    e.preventDefault();
    e.stopPropagation();

    console.log('[ProtectedSubTabButton] Click detectado', {
      currentTab,
      targetTab,
      selectedTable,
      isModalOpen,
      formDataKeys: Object.keys(formData),
      formDataValues: Object.entries(formData).filter(([k, v]) => {
        const val = v;
        return val !== null && val !== undefined && val !== '' && val !== 0 && val !== 1;
      }).map(([k, v]) => `${k}: ${v}`)
    });

    // Si el modal ya está abierto, no hacer nada
    if (isModalOpen) {
      console.log('[ProtectedSubTabButton] Modal ya está abierto, ignorando click');
      return;
    }

    // Si hay un onClick personalizado, ejecutarlo primero
    if (onClick) {
      onClick();
    }

    // NUEVO SISTEMA: Verificar cambios usando el sidebar
    // Construir panelId para el sidebar
    const panelId = selectedTable ? `${selectedTable}-${currentTab}` : currentTab;
    const hasChangesInSidebar = sidebar.hasUnsavedChanges[panelId] === true;
    
    // También verificar con el sistema legacy para compatibilidad
    const hasChanges = hasSignificantChanges(formData, selectedTable, currentTab, multipleData, massiveFormData);
    
    console.log('[ProtectedSubTabButton] Resultado de detección de cambios', {
      hasChanges,
      hasChangesInSidebar,
      selectedTable,
      currentTab,
      targetTab,
      panelId
    });
    
    // Si hay cambios (en cualquiera de los dos sistemas), mostrar modal
    if (hasChanges || hasChangesInSidebar) {
      console.log('[ProtectedSubTabButton] Mostrando modal de confirmación');
      setIsModalOpen(true);
      // Mostrar modal de confirmación SIN cambiar la pestaña
      showModal(
        'subtab',
        currentTab,
        targetTab,
        () => {
          console.log('[ProtectedSubTabButton] Modal confirmado, cambiando a tab:', targetTab);
          setIsModalOpen(false);
          
          // Limpiar cambios en el sidebar
          sidebar.markDirty(panelId, false);
          
          // IMPORTANTE: Si hay onTabChangeFromProtectedButton, usarlo en lugar de onTabChange
          // Esto evita que handleSubTabChangeInternal muestre el modal de nuevo
          if (onTabChangeFromProtectedButton) {
            console.log('[ProtectedSubTabButton] Usando onTabChangeFromProtectedButton');
            onTabChangeFromProtectedButton(targetTab);
          } else {
            console.log('[ProtectedSubTabButton] Usando onTabChange (fallback)');
            // Solo cambiar la pestaña DESPUÉS de confirmar
            onTabChange(targetTab);
          }
        },
        () => {
          console.log('[ProtectedSubTabButton] Modal cancelado');
          setIsModalOpen(false);
          // No hacer nada, quedarse en la pestaña actual
        }
      );
    } else {
      console.log('[ProtectedSubTabButton] No hay cambios, procediendo con cambio de tab');
      // No hay cambios, proceder normalmente
      // IMPORTANTE: Si hay onTabChangeFromProtectedButton, usarlo en lugar de onTabChange
      if (onTabChangeFromProtectedButton) {
        console.log('[ProtectedSubTabButton] Usando onTabChangeFromProtectedButton (sin cambios)');
        onTabChangeFromProtectedButton(targetTab);
      } else {
        onTabChange(targetTab);
      }
    }
  };

  return (
    <button
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default ProtectedSubTabButton;
