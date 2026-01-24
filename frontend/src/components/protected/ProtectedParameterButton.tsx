import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useSimpleChangeDetection } from '../../hooks/useSimpleChangeDetection';

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
  const { showModal, modalState } = useModal();
  const { hasSignificantChanges } = useSimpleChangeDetection();

  const handleClick = (e: React.MouseEvent) => {
    // Prevenir el comportamiento por defecto del botón
    e.preventDefault();
    e.stopPropagation();

    // Si hay un onClick personalizado, ejecutarlo primero
    if (onClick) {
      onClick();
    }

    // Verificar si estamos en una tabla de REGLA
    const isReglaTable = (table: string) => {
      return table === 'regla' || table === 'regla_perfil' || table === 'regla_umbral' || table === 'regla_objeto';
    };

    const effectiveCurrentTable = currentTable && currentTable !== '' ? currentTable : '';
    
    // Si estamos en la misma tabla, no hacer nada
    if (effectiveCurrentTable === targetTable) {
      return;
    }
    
    // CRÍTICO: Para REGLA y sus sub-tablas, NO mostrar modales de alerta
    // La navegación debe ser directa sin verificar cambios sin guardar
    const isCurrentRegla = isReglaTable(effectiveCurrentTable);
    const isTargetRegla = isReglaTable(targetTable);
    
    if (isCurrentRegla || isTargetRegla) {
      // Navegación directa para REGLA sin modales
      if (onTableChange) {
        onTableChange(targetTable);
      }
      return;
    }
    
    // Para otras tablas, verificar cambios sin guardar normalmente
    // Si el modal ya está abierto, no hacer nada
    if (modalState && modalState.isOpen) {
      return;
    }

    // Verificar si hay cambios sin guardar
    const shouldCheckChanges = effectiveCurrentTable !== '' && activeSubTab !== 'status';
    
    const hasChanges = shouldCheckChanges
      ? hasSignificantChanges(formData, effectiveCurrentTable, activeSubTab, multipleData, massiveFormData)
      : false;
    
    if (hasChanges) {
      // Mostrar modal de confirmación SIN cambiar el parámetro
      showModal(
        'parameter',
        effectiveCurrentTable,
        targetTable,
        () => {
          // Solo cambiar el parámetro DESPUÉS de confirmar
          onTableChange(targetTable);
        },
        () => {
          // No hacer nada, quedarse en el parámetro actual
        }
      );
    } else {
      // No hay cambios, proceder normalmente
      if (onTableChange) {
        onTableChange(targetTable);
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
