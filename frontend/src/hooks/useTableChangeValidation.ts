import { useState } from 'react';

interface UseTableChangeValidationProps {
  activeSubTab: string;
  formData: Record<string, any>;
  updateFormData: Record<string, any>;
  selectedRowForUpdate: any;
}

export const useTableChangeValidation = ({
  activeSubTab,
  formData,
  updateFormData,
  selectedRowForUpdate
}: UseTableChangeValidationProps) => {
  const [pendingChange, setPendingChange] = useState<string>('');

  // Verificar si hay datos modificados en el formulario de inserción
  const hasModifiedInsertData = () => {
    return Object.keys(formData).some(key => {
      const value = formData[key];
      
      // Para statusid, el valor por defecto es 1
      if (key === 'statusid') {
        return value !== 1;
      }
      
      // Para otros campos, cualquier valor no vacío es una modificación
      return value !== '' && value !== null && value !== undefined;
    });
  };

  // Verificar si hay datos modificados en el formulario de actualización
  const hasModifiedUpdateData = () => {
    if (!selectedRowForUpdate) return false;
    
    return Object.keys(updateFormData).some(key => {
      const currentValue = updateFormData[key];
      const originalValue = selectedRowForUpdate[key];
      
      return currentValue !== originalValue;
    });
  };

  // Verificar si se puede cambiar sin confirmación
  const canChangeWithoutConfirmation = (): boolean => {
    // Si hay una fila seleccionada para actualizar
    if (selectedRowForUpdate && activeSubTab === 'update') {
      return false;
    }
    
    // Si estamos en la pestaña de crear y hay datos modificados
    if (activeSubTab === 'insert' && hasModifiedInsertData()) {
      return false;
    }

    // Si estamos en la pestaña de actualizar y hay datos modificados
    if (activeSubTab === 'update' && hasModifiedUpdateData()) {
      return false;
    }
    
    return true;
  };

  // Solicitar confirmación para un cambio
  const requestConfirmation = (changeType: string) => {
    setPendingChange(changeType);
  };

  // Confirmar el cambio
  const confirmChange = () => {
    setPendingChange('');
  };

  // Cancelar el cambio
  const cancelChange = () => {
    setPendingChange('');
  };

  return {
    pendingChange,
    canChangeWithoutConfirmation,
    requestConfirmation,
    confirmChange,
    cancelChange
  };
};
