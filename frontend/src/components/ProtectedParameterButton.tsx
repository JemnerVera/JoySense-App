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

    console.log('[ProtectedParameterButton] Click detectado:', { 
      targetTable, 
      currentTable, 
      activeSubTab, 
      isModalOpen,
      hasOnTableChange: !!onTableChange 
    });

    // Si el modal ya está abierto, no hacer nada
    if (isModalOpen) {
      console.log('[ProtectedParameterButton] Modal ya abierto, ignorando click');
      return;
    }

    // Si hay un onClick personalizado, ejecutarlo primero
    if (onClick) {
      onClick();
    }

    // Verificar si hay cambios sin guardar
    // IMPORTANTE: Si currentTable está vacío, no hay cambios que verificar
    const hasChanges = currentTable && currentTable !== '' 
      ? hasSignificantChanges(formData, currentTable, activeSubTab, multipleData, massiveFormData)
      : false;
    
    console.log('[ProtectedParameterButton] Resultado de verificación de cambios:', { hasChanges, currentTable, targetTable });
    
    if (hasChanges) {
      setIsModalOpen(true);
      // Mostrar modal de confirmación SIN cambiar el parámetro
      showModal(
        'parameter',
        currentTable,
        targetTable,
        () => {
          setIsModalOpen(false);
          // Solo cambiar el parámetro DESPUÉS de confirmar
          onTableChange(targetTable);
        },
        () => {
          setIsModalOpen(false);
          // No hacer nada, quedarse en el parámetro actual
        }
      );
    } else {
      // No hay cambios, proceder normalmente
      console.log('[ProtectedParameterButton] No hay cambios, llamando a onTableChange con:', targetTable);
      if (onTableChange) {
        onTableChange(targetTable);
      } else {
        console.warn('[ProtectedParameterButton] onTableChange no está definido');
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
