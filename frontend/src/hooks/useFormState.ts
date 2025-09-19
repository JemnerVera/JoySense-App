import { useState, useCallback, useEffect } from 'react';

export interface FormState {
  formData: Record<string, any>;
  originalData: Record<string, any> | null;
  hasChanges: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isSubmitting: boolean;
  lastSaved: number | null;
}

export interface FormStateActions {
  setFormData: (data: Record<string, any>) => void;
  updateFormData: (field: string, value: any) => void;
  setOriginalData: (data: Record<string, any> | null) => void;
  setHasChanges: (hasChanges: boolean) => void;
  setIsValid: (isValid: boolean) => void;
  setErrors: (errors: string[]) => void;
  setWarnings: (warnings: string[]) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setLastSaved: (timestamp: number | null) => void;
  resetForm: () => void;
  resetToOriginal: () => void;
  clearValidation: () => void;
  markAsSaved: () => void;
}

/**
 * Hook personalizado para manejar el estado de formularios
 * Incluye validación, cambios, y persistencia
 */
export const useFormState = (
  initialData: Record<string, any> = {}
): FormState & FormStateActions => {
  
  const [formData, setFormDataState] = useState<Record<string, any>>(initialData);
  const [originalData, setOriginalDataState] = useState<Record<string, any> | null>(null);
  const [hasChanges, setHasChangesState] = useState(false);
  const [isValid, setIsValidState] = useState(true);
  const [errors, setErrorsState] = useState<string[]>([]);
  const [warnings, setWarningsState] = useState<string[]>([]);
  const [isSubmitting, setIsSubmittingState] = useState(false);
  const [lastSaved, setLastSavedState] = useState<number | null>(null);

  /**
   * Establecer datos del formulario
   */
  const setFormData = useCallback((data: Record<string, any>) => {
    console.log('📝 useFormState.setFormData:', data);
    setFormDataState(data);
    
    // Verificar si hay cambios comparando con datos originales
    if (originalData) {
      const hasChangesNow = JSON.stringify(data) !== JSON.stringify(originalData);
      setHasChangesState(hasChangesNow);
    }
  }, [originalData]);

  /**
   * Actualizar un campo específico del formulario
   */
  const updateFormData = useCallback((field: string, value: any) => {
    console.log(`📝 useFormState.updateFormData - ${field}:`, value);
    
    setFormDataState(prev => {
      const newData = { ...prev, [field]: value };
      
      // Verificar si hay cambios comparando con datos originales
      if (originalData) {
        const hasChangesNow = JSON.stringify(newData) !== JSON.stringify(originalData);
        setHasChangesState(hasChangesNow);
      }
      
      return newData;
    });
  }, [originalData]);

  /**
   * Establecer datos originales (para comparación de cambios)
   */
  const setOriginalData = useCallback((data: Record<string, any> | null) => {
    console.log('📋 useFormState.setOriginalData:', data);
    setOriginalDataState(data);
    
    // Si se establecen datos originales, verificar cambios
    if (data) {
      const hasChangesNow = JSON.stringify(formData) !== JSON.stringify(data);
      setHasChangesState(hasChangesNow);
    }
  }, [formData]);

  /**
   * Establecer si hay cambios
   */
  const setHasChanges = useCallback((hasChangesNow: boolean) => {
    console.log('🔄 useFormState.setHasChanges:', hasChangesNow);
    setHasChangesState(hasChangesNow);
  }, []);

  /**
   * Establecer si el formulario es válido
   */
  const setIsValid = useCallback((isValidNow: boolean) => {
    console.log('✅ useFormState.setIsValid:', isValidNow);
    setIsValidState(isValidNow);
  }, []);

  /**
   * Establecer errores
   */
  const setErrors = useCallback((errorsNow: string[]) => {
    console.log('❌ useFormState.setErrors:', errorsNow);
    setErrorsState(errorsNow);
  }, []);

  /**
   * Establecer advertencias
   */
  const setWarnings = useCallback((warningsNow: string[]) => {
    console.log('⚠️ useFormState.setWarnings:', warningsNow);
    setWarningsState(warningsNow);
  }, []);

  /**
   * Establecer estado de envío
   */
  const setIsSubmitting = useCallback((isSubmittingNow: boolean) => {
    console.log('📤 useFormState.setIsSubmitting:', isSubmittingNow);
    setIsSubmittingState(isSubmittingNow);
  }, []);

  /**
   * Establecer timestamp de último guardado
   */
  const setLastSaved = useCallback((timestamp: number | null) => {
    console.log('💾 useFormState.setLastSaved:', timestamp);
    setLastSavedState(timestamp);
  }, []);

  /**
   * Resetear formulario a estado inicial
   */
  const resetForm = useCallback(() => {
    console.log('🔄 useFormState.resetForm');
    setFormDataState(initialData);
    setOriginalDataState(null);
    setHasChangesState(false);
    setIsValidState(true);
    setErrorsState([]);
    setWarningsState([]);
    setIsSubmittingState(false);
    setLastSavedState(null);
  }, [initialData]);

  /**
   * Resetear a datos originales
   */
  const resetToOriginal = useCallback(() => {
    console.log('↩️ useFormState.resetToOriginal');
    if (originalData) {
      setFormDataState(originalData);
      setHasChangesState(false);
    }
  }, [originalData]);

  /**
   * Limpiar validación
   */
  const clearValidation = useCallback(() => {
    console.log('🧹 useFormState.clearValidation');
    setIsValidState(true);
    setErrorsState([]);
    setWarningsState([]);
  }, []);

  /**
   * Marcar como guardado
   */
  const markAsSaved = useCallback(() => {
    console.log('✅ useFormState.markAsSaved');
    setLastSavedState(Date.now());
    setHasChangesState(false);
    setOriginalDataState({ ...formData });
  }, [formData]);

  // Inicializar con datos iniciales si cambian
  useEffect(() => {
    if (JSON.stringify(initialData) !== JSON.stringify(formData)) {
      setFormDataState(initialData);
    }
  }, [initialData]);

  return {
    // Estado
    formData,
    originalData,
    hasChanges,
    isValid,
    errors,
    warnings,
    isSubmitting,
    lastSaved,
    
    // Acciones
    setFormData,
    updateFormData,
    setOriginalData,
    setHasChanges,
    setIsValid,
    setErrors,
    setWarnings,
    setIsSubmitting,
    setLastSaved,
    resetForm,
    resetToOriginal,
    clearValidation,
    markAsSaved
  };
};
