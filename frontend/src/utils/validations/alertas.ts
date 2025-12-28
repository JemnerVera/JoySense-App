// ============================================================================
// ALERTAS VALIDATIONS
// ============================================================================
// Validaciones para: umbral, criticidad, perfilumbral

import { JoySenseService } from '../../services/backend-api';
import { ValidationError, EnhancedValidationResult } from './types';
import { generateUserFriendlyMessage, generateUpdateUserFriendlyMessage } from './common';
import { logger } from '../../utils/logger';

// ============================================================================
// UMBRAL VALIDATIONS
// ============================================================================

export const validateUmbralData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios según schema actual
  if (!formData.localizacionid || formData.localizacionid === '' || formData.localizacionid === 0) {
    errors.push({
      field: 'localizacionid',
      message: 'Debe seleccionar una localización',
      type: 'required'
    });
  }
  
  if (!formData.umbral || (typeof formData.umbral === 'string' && formData.umbral.trim() === '')) {
    errors.push({
      field: 'umbral',
      message: 'El nombre del umbral es obligatorio',
      type: 'required'
    });
  }
  
  if (formData.minimo === null || formData.minimo === undefined || formData.minimo === '') {
    errors.push({
      field: 'minimo',
      message: 'El valor mínimo es obligatorio',
      type: 'required'
    });
  }
  
  if (formData.maximo === null || formData.maximo === undefined || formData.maximo === '') {
    errors.push({
      field: 'maximo',
      message: 'El valor máximo es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.operador || (typeof formData.operador === 'string' && formData.operador.trim() === '')) {
    errors.push({
      field: 'operador',
      message: 'El operador es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar constraint de negocio: minimo < maximo
  if (formData.minimo !== null && formData.minimo !== undefined && 
      formData.maximo !== null && formData.maximo !== undefined) {
    const minimo = parseFloat(formData.minimo);
    const maximo = parseFloat(formData.maximo);
    
    if (!isNaN(minimo) && !isNaN(maximo) && minimo >= maximo) {
      errors.push({
        field: 'minimo',
        message: 'El valor mínimo debe ser menor que el valor máximo',
        type: 'format'
      });
    }
  }
  
  // 3. Validar duplicados si hay datos existentes (basado en localizacionid y nombre)
  if (existingData && existingData.length > 0) {
    const umbralExists = existingData.some(item => 
      item.umbral && item.umbral.toLowerCase() === formData.umbral?.toLowerCase() &&
      item.localizacionid === formData.localizacionid
    );
    
    if (umbralExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un umbral con el mismo nombre para esta localización',
        type: 'duplicate'
      });
    }
  }
  
  // 4. Generar mensaje amigable
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const validateUmbralUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios según schema actual
  if (!formData.localizacionid || formData.localizacionid === '' || formData.localizacionid === 0) {
    errors.push({
      field: 'localizacionid',
      message: 'Debe seleccionar una localización',
      type: 'required'
    });
  }
  
  if (!formData.umbral || formData.umbral.trim() === '') {
    errors.push({
      field: 'umbral',
      message: 'El nombre del umbral es obligatorio',
      type: 'required'
    });
  }
  
  if (formData.minimo === null || formData.minimo === undefined || formData.minimo === '') {
    errors.push({
      field: 'minimo',
      message: 'El valor mínimo es obligatorio',
      type: 'required'
    });
  }
  
  if (formData.maximo === null || formData.maximo === undefined || formData.maximo === '') {
    errors.push({
      field: 'maximo',
      message: 'El valor máximo es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.operador || (typeof formData.operador === 'string' && formData.operador.trim() === '')) {
    errors.push({
      field: 'operador',
      message: 'El operador es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar constraint de negocio: minimo < maximo
  if (formData.minimo !== null && formData.minimo !== undefined && 
      formData.maximo !== null && formData.maximo !== undefined) {
    const minimo = parseFloat(formData.minimo);
    const maximo = parseFloat(formData.maximo);
    
    if (!isNaN(minimo) && !isNaN(maximo) && minimo >= maximo) {
      errors.push({
        field: 'minimo',
        message: 'El valor mínimo debe ser menor que el valor máximo',
        type: 'format'
      });
    }
  }
  
  // 3. Validar duplicados si hay datos existentes (basado en localizacionid y nombre)
  if (existingData && existingData.length > 0) {
    const umbralExists = existingData.some(item => 
      item.umbralid !== originalData.umbralid &&
      item.umbral && item.umbral.toLowerCase() === formData.umbral?.toLowerCase() &&
      item.localizacionid === formData.localizacionid
    );
    
    if (umbralExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un umbral con el mismo nombre para esta localización',
        type: 'duplicate'
      });
    }
  }
  
  // 4. Generar mensaje amigable
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const checkUmbralDependencies = async (umbralid: number): Promise<boolean> => {
  try {
    // Verificar si el umbral está usado en regla_umbral (reemplazo de perfilumbral)
    const reglaUmbrales = await JoySenseService.getTableData('regla_umbral');
    const hasReglaUmbrales = reglaUmbrales.some(reglaUmbral => reglaUmbral.umbralid === umbralid);
    if (hasReglaUmbrales) return true;
    
    const alertas = await JoySenseService.getTableData('alerta');
    const hasAlertas = alertas.some(alerta => alerta.umbralid === umbralid);
    return hasAlertas;
  } catch (error) {
    logger.error('Error checking umbral dependencies:', error);
    return false;
  }
};

// ============================================================================
// PERFILUMBRAL VALIDATIONS
// ============================================================================
// NOTA: perfilumbral ya no existe - reemplazado por regla_perfil y regla_umbral
// Las funciones validatePerfilUmbralData y validatePerfilUmbralUpdate fueron eliminadas

// ============================================================================
// CRITICIDAD VALIDATIONS
// ============================================================================

export const validateCriticidadData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.criticidad || formData.criticidad.trim() === '') {
    errors.push({
      field: 'criticidad',
      message: 'El nombre de la criticidad es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const criticidadExists = existingData.some(item => 
      item.criticidad && item.criticidad.toLowerCase() === formData.criticidad?.toLowerCase()
    );
    
    if (criticidadExists) {
      errors.push({
        field: 'criticidad',
        message: 'El nombre de la criticidad ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Generar mensaje amigable
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const validateCriticidadUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.criticidad || formData.criticidad.trim() === '') {
    errors.push({
      field: 'criticidad',
      message: 'El nombre de la criticidad es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.criticidad && formData.criticidad.trim() !== '') {
    const criticidadExists = existingData.some(item => 
      item.criticidadid !== originalData.criticidadid && 
      item.criticidad && 
      item.criticidad.toLowerCase() === formData.criticidad.toLowerCase()
    );
    
    if (criticidadExists) {
      errors.push({
        field: 'criticidad',
        message: 'El nombre de la criticidad ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkCriticidadDependencies(originalData.criticidadid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar la criticidad porque tiene umbrales o alertas asociadas',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const checkCriticidadDependencies = async (criticidadid: number): Promise<boolean> => {
  try {
    // Nota: umbral ya no tiene criticidadid según el schema actual
    // Solo verificar alertas que puedan tener criticidadid
    const alertas = await JoySenseService.getTableData('alerta');
    const hasAlertas = alertas.some(alerta => alerta.criticidadid === criticidadid);
    return hasAlertas;
  } catch (error) {
    logger.error('Error checking criticidad dependencies:', error);
    return false;
  }
};
