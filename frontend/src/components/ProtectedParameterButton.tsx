import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useSimpleChangeDetection } from '../hooks/useSimpleChangeDetection';

interface ProtectedParameterButtonProps {
  children: React.ReactNode;
  targetTable: string;
  currentTable: string;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  formData: Record<string, any>;
  multipleData: any[];
  massiveFormData?: Record<string, any>;
  onTableChange: (table: string) => void;
  className?: string;
  onClick?: () => void;
}

const ProtectedParameterButton: React.FC<ProtectedParameterButtonProps> = ({
  children,
  targetTable,
  currentTable,
  activeSubTab,
  formData,
  multipleData,
  massiveFormData = {},
  onTableChange,
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

    console.log('[ProtectedParameterButton] handleClick:', {
      targetTable,
      currentTable,
      activeSubTab,
      isModalOpen,
      formDataKeys: Object.keys(formData),
      multipleDataLength: multipleData.length
    });

    // Si el modal ya está abierto, no hacer nada
    if (isModalOpen) {
      console.log('[ProtectedParameterButton] Modal ya abierto, retornando');
      return;
    }

    // Si hay un onClick personalizado, ejecutarlo primero
    if (onClick) {
      onClick();
    }

    // Verificar si hay cambios sin guardar
    const hasChanges = hasSignificantChanges(formData, currentTable, activeSubTab, multipleData, massiveFormData);
    console.log('[ProtectedParameterButton] hasChanges:', {
      hasChanges,
      currentTable,
      targetTable,
      activeSubTab
    });
    
    if (hasChanges) {
      console.log('[ProtectedParameterButton] Mostrando modal de confirmación');
      setIsModalOpen(true);
      // Mostrar modal de confirmación SIN cambiar el parámetro
      showModal(
        'parameter',
        currentTable,
        targetTable,
        () => {
          setIsModalOpen(false);
          console.log('[ProtectedParameterButton] Modal confirmado, llamando onTableChange:', targetTable);
          // Solo cambiar el parámetro DESPUÉS de confirmar
          onTableChange(targetTable);
        },
        () => {
          setIsModalOpen(false);
          console.log('[ProtectedParameterButton] Modal cancelado');
          // No hacer nada, quedarse en el parámetro actual
        }
      );
    } else {
      // No hay cambios, proceder normalmente
      console.log('[ProtectedParameterButton] Sin cambios, llamando onTableChange directamente:', {
        targetTable,
        currentTable,
        hasOnTableChange: !!onTableChange,
        onTableChangeType: typeof onTableChange
      });
      if (onTableChange) {
        onTableChange(targetTable);
        console.log('[ProtectedParameterButton] onTableChange llamado exitosamente');
      } else {
        console.error('[ProtectedParameterButton] ERROR: onTableChange no está definido');
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

export default ProtectedParameterButton;
