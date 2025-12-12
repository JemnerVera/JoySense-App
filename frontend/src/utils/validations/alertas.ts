// ============================================================================
// ALERTAS VALIDATIONS
// ============================================================================
// Validaciones para: umbral, criticidad, perfilumbral

import { JoySenseService } from '../../services/backend-api';
import { ValidationError, EnhancedValidationResult } from './types';
import { generateUserFriendlyMessage, generateUpdateUserFriendlyMessage } from './common';

// ============================================================================
// UMBRAL VALIDATIONS
// ============================================================================

export const validateUmbralData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  const requiredFields = ['umbral', 'ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'tipoid'];
  
  requiredFields.forEach(field => {
    if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
      const fieldNames: Record<string, string> = {
        'umbral': 'El nombre del umbral es obligatorio',
        'ubicacionid': 'Debe seleccionar una ubicación',
        'criticidadid': 'Debe seleccionar una criticidad',
        'nodoid': 'Debe seleccionar un nodo',
        'metricaid': 'Debe seleccionar una métrica',
        'tipoid': 'Debe seleccionar un tipo'
      };
      
      errors.push({
        field,
        message: fieldNames[field],
        type: 'required'
      });
    }
  });
  
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
  
  // 3. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const umbralExists = existingData.some(item => 
      item.umbral && item.umbral.toLowerCase() === formData.umbral?.toLowerCase() &&
      item.ubicacionid === formData.ubicacionid &&
      item.nodoid === formData.nodoid &&
      item.metricaid === formData.metricaid &&
      item.tipoid === formData.tipoid
    );
    
    if (umbralExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un umbral con la misma configuración (ubicación, nodo, métrica y tipo)',
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

  // 1. Validar campos obligatorios
  if (!formData.umbral || formData.umbral.trim() === '') {
    errors.push({
      field: 'umbral',
      message: 'El nombre del umbral es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.ubicacionid || formData.ubicacionid === '') {
    errors.push({
      field: 'ubicacionid',
      message: 'La ubicación es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.criticidadid || formData.criticidadid === '') {
    errors.push({
      field: 'criticidadid',
      message: 'La criticidad es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.nodoid || formData.nodoid === '') {
    errors.push({
      field: 'nodoid',
      message: 'El nodo es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.metricaid || formData.metricaid === '') {
    errors.push({
      field: 'metricaid',
      message: 'La métrica es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.tipoid || formData.tipoid === '') {
    errors.push({
      field: 'tipoid',
      message: 'El tipo es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.umbral && formData.umbral.trim() !== '') {
    const umbralExists = existingData.some(item => 
      item.umbralid !== originalData.umbralid && 
      item.umbral && 
      item.umbral.toLowerCase() === formData.umbral.toLowerCase()
    );
    
    if (umbralExists) {
      errors.push({
        field: 'umbral',
        message: 'El nombre del umbral ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkUmbralDependencies(originalData.umbralid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el umbral porque tiene perfiles o alertas asociadas',
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

export const checkUmbralDependencies = async (umbralid: number): Promise<boolean> => {
  try {
    const perfilumbrales = await JoySenseService.getTableData('perfilumbral');
    const hasPerfilumbrales = perfilumbrales.some(perfilumbral => perfilumbral.umbralid === umbralid);
    if (hasPerfilumbrales) return true;
    
    const alertas = await JoySenseService.getTableData('alerta');
    const hasAlertas = alertas.some(alerta => alerta.umbralid === umbralid);
    return hasAlertas;
  } catch (error) {
    console.error('Error checking umbral dependencies:', error);
    return false;
  }
};

// ============================================================================
// PERFILUMBRAL VALIDATIONS
// ============================================================================

export const validatePerfilUmbralData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.perfilid || formData.perfilid === 0) {
    errors.push({
      field: 'perfilid',
      message: 'Debe seleccionar un perfil',
      type: 'required'
    });
  }
  
  if (!formData.umbralid || formData.umbralid === 0) {
    errors.push({
      field: 'umbralid',
      message: 'Debe seleccionar un umbral',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes (PRIMARY KEY compuesta)
  if (existingData && existingData.length > 0) {
    const perfilUmbralExists = existingData.some(item => 
      item.perfilid === formData.perfilid && item.umbralid === formData.umbralid
    );
    
    if (perfilUmbralExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe una relación entre este perfil y umbral',
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

export const validatePerfilUmbralUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.perfilid || formData.perfilid === '') {
    errors.push({
      field: 'perfilid',
      message: 'El perfil es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.umbralid || formData.umbralid === '') {
    errors.push({
      field: 'umbralid',
      message: 'El umbral es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.perfilid && formData.umbralid) {
    const perfilUmbralExists = existingData.some(item => 
      (item.perfilid !== originalData.perfilid || item.umbralid !== originalData.umbralid) && 
      item.perfilid === formData.perfilid && 
      item.umbralid === formData.umbralid
    );
    
    if (perfilUmbralExists) {
      errors.push({
        field: 'composite',
        message: 'Ya existe una relación entre este perfil y umbral',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

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
    const umbrales = await JoySenseService.getTableData('umbral');
    const hasUmbrales = umbrales.some(umbral => umbral.criticidadid === criticidadid);
    if (hasUmbrales) return true;
    
    const alertas = await JoySenseService.getTableData('alerta');
    const hasAlertas = alertas.some(alerta => alerta.criticidadid === criticidadid);
    return hasAlertas;
  } catch (error) {
    console.error('Error checking criticidad dependencies:', error);
    return false;
  }
};
