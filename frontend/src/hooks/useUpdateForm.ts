/**
 * Hook para manejar el formulario de actualización en SystemParameters
 * Encapsula la lógica de carga, validación y actualización de registros
 */

import { useState, useEffect, useCallback } from 'react';
import { validateTableUpdate } from '../utils/validations';
import type { TableConfig } from '../config/tables.config';

interface UseUpdateFormProps {
  selectedRow: any | null;
  tableName: string;
  config: TableConfig | null;
  updateRow: (id: string | Record<string, any>, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  getPrimaryKeyValue: (row: any) => string | Record<string, any>;
  user: any;
  existingData?: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UseUpdateFormReturn {
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  updateFormField: (field: string, value: any) => void;
  handleUpdate: () => Promise<void>;
  handleCancel: () => void;
  validateForm: () => boolean;
}

/**
 * Hook que encapsula toda la lógica del formulario de actualización
 */
export const useUpdateForm = ({
  selectedRow,
  tableName,
  config,
  updateRow,
  getPrimaryKeyValue,
  user,
  existingData = [],
  onSuccess,
  onCancel
}: UseUpdateFormProps): UseUpdateFormReturn => {
  
  // Estado del formulario
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<Record<string, any>>({});

  // Cargar datos de la fila seleccionada al formulario
  useEffect(() => {
    if (selectedRow) {
      // Guardar datos originales para validación
      setOriginalData({ ...selectedRow });
      // Cargar datos al formulario
      setFormData({ ...selectedRow });
      // Limpiar errores
      setFormErrors({});
    } else {
      // Limpiar formulario si no hay fila seleccionada
      setFormData({});
      setFormErrors({});
      setOriginalData({});
    }
  }, [selectedRow]);

  // Actualizar campo del formulario
  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo cuando se modifica
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  // Validar formulario
  const validateFormFields = useCallback((): boolean => {
    if (!config) return false;

    const errors: Record<string, string> = {};

    // Validar campos requeridos (excluir campos de clave primaria que son solo lectura)
    const primaryKeyFields: string[] = [];
    try {
      const { getPrimaryKey } = require('../config/tables.config');
      const pk = getPrimaryKey(config.name);
      if (Array.isArray(pk)) {
        primaryKeyFields.push(...pk);
      } else {
        primaryKeyFields.push(pk);
      }
    } catch (e) {
      // Si no se puede obtener la clave primaria, continuar sin excluir
    }

    config.fields.forEach(field => {
      // No validar campos de clave primaria (son solo lectura)
      if (primaryKeyFields.includes(field.name)) {
        return;
      }
      
      if (field.required && !formData[field.name] && formData[field.name] !== 0) {
        errors[field.name] = `${field.label} es requerido`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [config, formData]);

  // Validar formulario completo (incluyendo validaciones específicas de update)
  const validateFormComplete = useCallback(async (): Promise<boolean> => {
    if (!config) return false;

    // Primero validar campos requeridos
    if (!validateFormFields()) {
      return false;
    }

    // Luego validar con validaciones específicas de update
    try {
      const validationResult = await validateTableUpdate(
        tableName,
        formData,
        originalData,
        existingData
      );

      if (!validationResult.isValid) {
        // Convertir errores de validación al formato de formErrors
        const errors: Record<string, string> = {};
        validationResult.errors.forEach(error => {
          errors[error.field] = error.message;
        });
        setFormErrors(errors);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en validación:', error);
      return false;
    }
  }, [tableName, formData, originalData, existingData, config, validateFormFields]);

  // Manejar actualización
  const handleUpdate = useCallback(async () => {
    if (!selectedRow) {
      setFormErrors({ general: 'No hay registro seleccionado' });
      return;
    }

    // Primero validar campos requeridos básicos
    const basicValidation = validateFormFields();
    if (!basicValidation) {
      // Mostrar errores de validación (se mostrarán como warnings amarillos)
      return;
    }

    // Luego validar con validaciones específicas de update
    const isValid = await validateFormComplete();
    if (!isValid) {
      // Los errores ya están en formErrors, se mostrarán como warnings
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Agregar campos de auditoría
      const dataToUpdate = {
        ...formData,
        usermodifiedid: user?.user_metadata?.usuarioid || 1,
        datemodified: new Date().toISOString()
      };

      const pk = getPrimaryKeyValue(selectedRow);
      const result = await updateRow(pk, dataToUpdate);
      
      if (result.success) {
        // Éxito: llamar callback y limpiar
        onSuccess?.();
      } else {
        // Error: mostrar mensaje
        setFormErrors({ general: result.error || 'Error al actualizar' });
      }
    } catch (error: any) {
      setFormErrors({ general: error.message || 'Error al actualizar' });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRow, formData, validateFormComplete, updateRow, getPrimaryKeyValue, user, onSuccess]);

  // Manejar cancelación
  const handleCancel = useCallback(() => {
    setFormData({});
    setFormErrors({});
    setOriginalData({});
    onCancel?.();
  }, [onCancel]);

  return {
    formData,
    formErrors,
    isSubmitting,
    updateFormField,
    handleUpdate,
    handleCancel,
    validateForm: validateFormFields
  };
};
