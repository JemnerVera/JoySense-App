// ============================================================================
// HOOK: useMassiveLocalizacionValidation
// Valida el formulario masivo de localizaciones
// ============================================================================

import { useMemo } from 'react';
import { FormData, SelectedNodo, SelectedLocalizacion, ValidationResult } from '../types';

interface UseMassiveLocalizacionValidationProps {
  selectedNodo: SelectedNodo | null;
  selectedLocalizacion: SelectedLocalizacion | null;
  formData: FormData;
  localizacionName?: string;
}

export const useMassiveLocalizacionValidation = ({
  selectedNodo,
  selectedLocalizacion,
  formData,
  localizacionName = ''
}: UseMassiveLocalizacionValidationProps) => {
  const validationResult = useMemo((): ValidationResult => {
    // Validar que se haya seleccionado un nodo
    if (!selectedNodo || !selectedNodo.nodoid) {
      return {
        isValid: false,
        message: ''
      };
    }

    // Validar que se haya ingresado un nombre de localización
    if (!localizacionName || localizacionName.trim().length === 0) {
      return {
        isValid: false,
        message: ''
      };
    }

    // Validar que haya al menos un sensor y métrica seleccionados
    if (!formData.sensoresMetricasData || formData.sensoresMetricasData.length === 0) {
      return {
        isValid: false,
        message: '⚠️ Debe seleccionar al menos un Sensor y Métrica'
      };
    }

    const selectedCount = formData.sensoresMetricasData.filter(sm => sm.selected).length;
    if (selectedCount === 0) {
      return {
        isValid: false,
        message: '⚠️ Debe seleccionar al menos un Sensor y Métrica'
      };
    }

    return {
      isValid: true,
      message: 'Formulario válido'
    };
  }, [selectedNodo, selectedLocalizacion, formData.sensoresMetricasData, localizacionName]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!selectedNodo) {
      errors.push('Nodo requerido');
    }

    if (!localizacionName || localizacionName.trim().length === 0) {
      errors.push('Nombre de localización requerido');
    }

    if (!formData.sensoresMetricasData || formData.sensoresMetricasData.length === 0) {
      errors.push('Sensores y Métricas requeridos');
    }

    return errors;
  }, [selectedNodo, localizacionName, formData.sensoresMetricasData]);

  const isFormValid = () => {
    return validationResult.isValid;
  };

  const selectedCount = useMemo(() => {
    return formData.sensoresMetricasData?.filter(sm => sm.selected).length || 0;
  }, [formData.sensoresMetricasData]);

  return {
    validationResult,
    validationErrors,
    isFormValid,
    selectedCount
  };
};
