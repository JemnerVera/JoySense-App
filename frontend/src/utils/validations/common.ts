// ============================================================================
// COMMON VALIDATION FUNCTIONS
// ============================================================================

import { ValidationRule, ValidationResult } from './types';
import { tableValidationSchemas } from './schemas';

// Función de validación progresiva para nodo
function validateNodoProgressive(formData: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Siempre validar nodo (siempre habilitado)
  const nodoValue = formData.nodo;
  if (!nodoValue || (typeof nodoValue === 'string' && nodoValue.trim() === '')) {
    errors.push('El nombre del nodo es obligatorio');
    return { isValid: false, errors, warnings };
  }

  // Si nodo tiene valor, validar deveui (se habilita cuando nodo tiene valor)
  const deveuiValue = formData.deveui;
  if (!deveuiValue || (typeof deveuiValue === 'string' && deveuiValue.trim() === '')) {
    errors.push('El campo DEVEUI es obligatorio');
    return { isValid: false, errors, warnings };
  }

  // Los demás campos (appeui, appkey, atpin) son opcionales
  return { isValid: true, errors, warnings };
}

// Función principal de validación
export function validateFormData(tableName: string, formData: Record<string, any>): ValidationResult {
  // Validación especial para nodo con habilitación progresiva
  if (tableName === 'nodo') {
    return validateNodoProgressive(formData);
  }

  const schema = tableValidationSchemas[tableName];
  if (!schema) {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of schema) {
    const value = formData[rule.field];
    
    // Validar campo requerido
    if (rule.required) {
      if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
        errors.push(rule.customMessage || `El campo ${rule.field} es obligatorio`);
        continue;
      }
    }

    // Si el campo no es requerido y está vacío, saltar validaciones adicionales
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Validar tipo
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(rule.customMessage || `El campo ${rule.field} debe ser texto`);
            continue;
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(rule.customMessage || `El campo ${rule.field} debe ser un número`);
            continue;
          }
          break;
        case 'email':
          if (typeof value === 'string' && value.trim() !== '') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              errors.push(rule.customMessage || `El formato del correo no es válido`);
            }
          }
          break;
        case 'phone':
          if (typeof value === 'string' && value.trim() !== '') {
            const phonePattern = /^[+]?[0-9\s\-()]{7,15}$/;
            if (!phonePattern.test(value)) {
              errors.push(rule.customMessage || `El formato del teléfono no es válido`);
            }
          }
          break;
      }
    }

    // Validar longitud mínima
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      errors.push(rule.customMessage || `El campo ${rule.field} debe tener al menos ${rule.minLength} caracteres`);
    }

    // Validar longitud máxima
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      errors.push(rule.customMessage || `El campo ${rule.field} no puede exceder ${rule.maxLength} caracteres`);
    }

    // Validar patrón
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(rule.customMessage || `El formato del campo ${rule.field} no es válido`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Función para obtener mensajes de validación formateados
export function getValidationMessages(validationResult: ValidationResult): string[] {
  const messages: string[] = [];
  
  if (validationResult.errors.length > 0) {
    messages.push(...validationResult.errors.map(error => `⚠️ ${error}`));
  }
  
  if (validationResult.warnings.length > 0) {
    messages.push(...validationResult.warnings.map(warning => `ℹ️ ${warning}`));
  }
  
  return messages;
}

// Función para generar mensaje amigable de errores
// Muestra errores uno por línea para mejor legibilidad
export function generateUserFriendlyMessage(errors: any[]): string {
  if (errors.length === 0) {
    return 'Validación exitosa';
  }
  
  // Mostrar cada error en una línea separada
  const errorMessages = errors.map(e => e.message || 'Error desconocido').filter(Boolean);
  
  if (errorMessages.length === 1) {
    return errorMessages[0];
  }
  
  // Múltiples errores: uno por línea
  return errorMessages.join('\n');
}

// Función para generar mensaje amigable de actualización
// Muestra errores uno por línea para mejor legibilidad
export function generateUpdateUserFriendlyMessage(errors: any[]): string {
  if (errors.length === 0) {
    return 'Validación exitosa';
  }
  
  // Mostrar cada error en una línea separada
  const errorMessages = errors.map(e => e.message || 'Error desconocido').filter(Boolean);
  
  if (errorMessages.length === 1) {
    return errorMessages[0];
  }
  
  // Múltiples errores: uno por línea
  return errorMessages.join('\n');
}
