import { useCallback, useMemo } from 'react';
import { useProgressiveEnablement } from './useProgressiveEnablement';
import { useFormValidation } from './useFormValidation';

export interface FormRenderingState {
  enabledFields: string[];
  fieldErrors: Record<string, string>;
  fieldWarnings: Record<string, string>;
  isFormValid: boolean;
}

export interface FormRenderingActions {
  getFieldProps: (fieldName: string, formData: Record<string, any>) => {
    disabled: boolean;
    required: boolean;
    error: string | null;
    warning: string | null;
  };
  getFormValidation: (formData: Record<string, any>) => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  shouldShowField: (fieldName: string, formData: Record<string, any>) => boolean;
  getFieldDependencies: (fieldName: string) => string[];
}

/**
 * Hook personalizado para manejar la lógica de renderizado de formularios
 * Encapsula la lógica de habilitación progresiva, validación y renderizado condicional
 */
export const useFormRendering = (
  selectedTable: string,
  formData: Record<string, any> = {}
): FormRenderingState & FormRenderingActions => {
  
  const { getEnabledFields, isFieldEnabled } = useProgressiveEnablement(selectedTable, formData);
  const { validateInsert } = useFormValidation(selectedTable);

  // Memoizar campos habilitados
  const enabledFields = useMemo(() => {
    return getEnabledFields();
  }, [getEnabledFields, formData]);

  // Memoizar validación del formulario
  const formValidation = useMemo(async () => {
    try {
      return await validateInsert(formData);
    } catch (error) {
      return {
        isValid: false,
        errors: ['Error de validación'],
        warnings: []
      };
    }
  }, [validateInsert, formData]);

  /**
   * Obtener propiedades de un campo específico
   */
  const getFieldProps = useCallback((fieldName: string, currentFormData: Record<string, any>) => {
    const isEnabled = isFieldEnabled(fieldName);
    const isRequired = enabledFields.includes(fieldName);
    
    // Obtener errores y advertencias del campo
    const fieldError = null; // Se puede implementar lógica específica de errores por campo
    const fieldWarning = null; // Se puede implementar lógica específica de advertencias por campo

    return {
      disabled: !isEnabled,
      required: isRequired,
      error: fieldError,
      warning: fieldWarning
    };
  }, [isFieldEnabled, enabledFields]);

  /**
   * Obtener validación del formulario completo
   */
  const getFormValidation = useCallback((currentFormData: Record<string, any>) => {
    // Por ahora retornamos validación síncrona
    // Se puede implementar lógica más compleja si es necesario
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }, []);

  /**
   * Determinar si un campo debe mostrarse
   */
  const shouldShowField = useCallback((fieldName: string, currentFormData: Record<string, any>) => {
    // Lógica para determinar si un campo debe mostrarse
    // Por ejemplo, campos condicionales basados en otros valores
    return true; // Por defecto, mostrar todos los campos
  }, []);

  /**
   * Obtener dependencias de un campo
   */
  const getFieldDependencies = useCallback((fieldName: string) => {
    // Lógica para obtener las dependencias de un campo
    // Esto se puede implementar basándose en el esquema de la tabla
    return []; // Por defecto, sin dependencias
  }, []);

  return {
    // Estado
    enabledFields,
    fieldErrors: {},
    fieldWarnings: {},
    isFormValid: true, // Se puede implementar lógica más compleja
    
    // Acciones
    getFieldProps,
    getFormValidation,
    shouldShowField,
    getFieldDependencies
  };
};
