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

    console.log('🔄 ProtectedParameterButton clicked - PREVENTING default behavior');

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
    const hasChanges = hasSignificantChanges(formData, currentTable, activeSubTab, multipleData, massiveFormData);
    
    console.log('🔄 hasChanges result for parameter change:', hasChanges);
    
    if (hasChanges) {
      console.log('🔄 Showing modal for parameter change - PREVENTING parameter change');
      setIsModalOpen(true);
      // Mostrar modal de confirmación SIN cambiar el parámetro
      showModal(
        'parameter',
        currentTable,
        targetTable,
        () => {
          console.log('🔄 Confirming parameter change to:', targetTable);
          setIsModalOpen(false);
          // Solo cambiar el parámetro DESPUÉS de confirmar
          onTableChange(targetTable);
        },
        () => {
          console.log('🔄 Parameter change cancelled, staying in:', currentTable);
          setIsModalOpen(false);
          // No hacer nada, quedarse en el parámetro actual
        }
      );
    } else {
      console.log('🔄 No changes, proceeding with parameter change');
      // No hay cambios, proceder normalmente
      onTableChange(targetTable);
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
