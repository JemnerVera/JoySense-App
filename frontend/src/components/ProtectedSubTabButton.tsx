import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useSimpleChangeDetection } from '../hooks/useSimpleChangeDetection';

interface ProtectedSubTabButtonProps {
  children: React.ReactNode;
  targetTab: 'status' | 'insert' | 'update' | 'massive';
  currentTab: 'status' | 'insert' | 'update' | 'massive';
  selectedTable: string;
  formData: Record<string, any>;
  multipleData: any[];
  massiveFormData?: Record<string, any>;
  onTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
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
  className,
  onClick
}) => {
  const { showModal } = useModal();
  const { hasSignificantChanges } = useSimpleChangeDetection();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevenir el comportamiento por defecto del botón
    e.preventDefault();
    e.stopPropagation();

    console.log('🔄 ProtectedSubTabButton clicked - PREVENTING default behavior');

    // Si el modal ya está abierto, no hacer nada
    if (isModalOpen) {
      console.log('🔄 Modal already open, ignoring click');
      return;
    }

    // Si hay un onClick personalizado, ejecutarlo primero
    if (onClick) {
      onClick();
    }

    // Verificar si hay cambios sin guardar
    const hasChanges = hasSignificantChanges(formData, selectedTable, currentTab, multipleData, massiveFormData);
    
    console.log('🔄 hasChanges result:', hasChanges);
    
    if (hasChanges) {
      console.log('🔄 Showing modal for sub-tab change - PREVENTING tab change');
      setIsModalOpen(true);
      // Mostrar modal de confirmación SIN cambiar la pestaña
      showModal(
        'subtab',
        currentTab,
        targetTab,
        () => {
          console.log('🔄 Confirming sub-tab change to:', targetTab);
          setIsModalOpen(false);
          // Solo cambiar la pestaña DESPUÉS de confirmar
          onTabChange(targetTab);
        },
        () => {
          console.log('🔄 Sub-tab change cancelled, staying in:', currentTab);
          setIsModalOpen(false);
          // No hacer nada, quedarse en la pestaña actual
        }
      );
    } else {
      console.log('🔄 No changes, proceeding with sub-tab change');
      // No hay cambios, proceder normalmente
      onTabChange(targetTab);
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
