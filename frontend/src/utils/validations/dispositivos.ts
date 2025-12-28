// ============================================================================
// DISPOSITIVOS VALIDATIONS
// ============================================================================
// Validaciones para: entidad, tipo, nodo, sensor, metrica, metricasensor

import { JoySenseService } from '../../services/backend-api';
import { ValidationError, EnhancedValidationResult } from './types';
import { generateUserFriendlyMessage, generateUpdateUserFriendlyMessage } from './common';
import { logger } from '../../utils/logger';

// ============================================================================
// ENTIDAD VALIDATIONS
// ============================================================================

export const validateEntidadData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.entidad || formData.entidad.trim() === '') {
    errors.push({
      field: 'entidad',
      message: 'El nombre de la entidad es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const entidadExists = existingData.some(item => 
      item.entidad && item.entidad.toLowerCase() === formData.entidad?.toLowerCase()
    );
    
    if (entidadExists) {
      errors.push({
        field: 'entidad',
        message: 'La entidad ya existe',
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

export const validateEntidadUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.entidad || formData.entidad.trim() === '') {
    errors.push({
      field: 'entidad',
      message: 'La entidad es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.entidad && formData.entidad.trim() !== '') {
    const entidadExists = existingData.some(item => 
      item.entidadid !== originalData.entidadid && 
      item.entidad && 
      item.entidad.toLowerCase() === formData.entidad.toLowerCase()
    );
    
    if (entidadExists) {
      errors.push({
        field: 'entidad',
        message: 'La entidad ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkEntidadDependencies(originalData.entidadid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar la entidad porque tiene tipos o localizaciones asociadas',
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

export const checkEntidadDependencies = async (entidadid: number): Promise<boolean> => {
  try {
    const entidadLocalizaciones = await JoySenseService.getTableData('entidad_localizacion');
    return entidadLocalizaciones.some((el: any) => el.entidadid === entidadid);
  } catch (error) {
    logger.error('Error checking entidad dependencies:', error);
    return false;
  }
};

// ============================================================================
// TIPO VALIDATIONS
// ============================================================================

export const validateTipoData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.tipo || formData.tipo.trim() === '') {
    errors.push({
      field: 'tipo',
      message: 'El nombre del tipo es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes (según schema actual, solo se valida por 'tipo' único)
  if (existingData && existingData.length > 0) {
    const tipoExists = existingData.some(item => 
      item.tipo && item.tipo.toLowerCase() === formData.tipo?.toLowerCase()
    );
    
    if (tipoExists) {
      errors.push({
        field: 'tipo',
        message: 'El tipo ya existe',
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

export const validateTipoUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.tipo || formData.tipo.trim() === '') {
    errors.push({
      field: 'tipo',
      message: 'El tipo es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.tipo && formData.tipo.trim() !== '') {
    const tipoExists = existingData.some(item => 
      item.tipoid !== originalData.tipoid && 
      item.tipo && 
      item.tipo.toLowerCase() === formData.tipo.toLowerCase()
    );
    
    if (tipoExists) {
      errors.push({
        field: 'tipo',
        message: 'El tipo ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkTipoDependencies(originalData.tipoid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el tipo porque tiene sensores, métricas o umbrales asociados',
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

export const checkTipoDependencies = async (tipoid: number): Promise<boolean> => {
  try {
    const sensores = await JoySenseService.getTableData('sensor');
    const hasSensores = sensores.some(sensor => sensor.tipoid === tipoid);
    if (hasSensores) return true;
    
    const metricasensores = await JoySenseService.getTableData('metricasensor');
    // Según el schema actual, metricasensor NO tiene tipoid (solo tiene sensorid, metricaid, statusid)
    // Por lo tanto, no hay dependencias directas de tipo -> metricasensor
    const hasMetricasensores = false;
    if (hasMetricasensores) return true;
    
    const umbrales = await JoySenseService.getTableData('umbral');
    const hasUmbrales = umbrales.some(umbral => umbral.tipoid === tipoid);
    return hasUmbrales;
  } catch (error) {
    logger.error('Error checking tipo dependencies:', error);
    return false;
  }
};

// ============================================================================
// NODO VALIDATIONS
// ============================================================================

export const validateNodoData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.nodo || formData.nodo.trim() === '') {
    errors.push({
      field: 'nodo',
      message: 'El nombre del nodo es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.ubicacionid) {
    errors.push({
      field: 'ubicacionid',
      message: 'Debe seleccionar una ubicación',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  // El constraint es UNIQUE (ubicacionid, nodo), así que validamos esa combinación
  if (existingData && existingData.length > 0 && formData.nodo && formData.ubicacionid) {
    const duplicateExists = existingData.some(item => 
      item.ubicacionid === formData.ubicacionid &&
      item.nodo && 
      item.nodo.toLowerCase() === formData.nodo.toLowerCase()
    );
    
    if (duplicateExists) {
      errors.push({
        field: 'nodo',
        message: 'Ya existe un nodo con este nombre en la ubicación seleccionada',
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

export const validateNodoUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.nodo || formData.nodo.trim() === '') {
    errors.push({
      field: 'nodo',
      message: 'El nodo es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  // El constraint es UNIQUE (ubicacionid, nodo), así que validamos esa combinación
  if (formData.nodo && formData.nodo.trim() !== '' && formData.ubicacionid) {
    const duplicateExists = existingData.some(item => 
      item.nodoid !== originalData.nodoid && 
      item.ubicacionid === formData.ubicacionid &&
      item.nodo && 
      item.nodo.toLowerCase() === formData.nodo.toLowerCase()
    );
    
    if (duplicateExists) {
      errors.push({
        field: 'nodo',
        message: 'Ya existe un nodo con este nombre en la ubicación seleccionada',
        type: 'duplicate'
      });
    }
  }
  
  // 4. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkNodoDependencies(originalData.nodoid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el nodo porque tiene sensores, métricas o localizaciones asociadas',
        type: 'constraint'
      });
    }
  }
  
  // 5. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const checkNodoDependencies = async (nodoid: number): Promise<boolean> => {
  try {
    // Según el schema actual:
    // - sensor NO tiene nodoid (solo tiene sensorid, tipoid, statusid)
    // - metricasensor NO tiene nodoid (solo tiene sensorid, metricaid, statusid)
    // - localizacion SÍ tiene nodoid
    const localizaciones = await JoySenseService.getLocalizaciones();
    const hasLocalizaciones = localizaciones.some(localizacion => localizacion.nodoid === nodoid);
    return hasLocalizaciones;
  } catch (error) {
    logger.error('Error checking nodo dependencies:', error);
    return true; // En caso de error, bloquear la operación por seguridad
  }
};

// ============================================================================
// METRICA VALIDATIONS
// ============================================================================

export const validateMetricaData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.metrica || formData.metrica.trim() === '') {
    errors.push({
      field: 'metrica',
      message: 'El nombre de la métrica es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.unidad || formData.unidad.trim() === '') {
    errors.push({
      field: 'unidad',
      message: 'La unidad es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const metricaExists = existingData.some(item => 
      item.metrica && item.metrica.toLowerCase() === formData.metrica?.toLowerCase()
    );
    
    const unidadExists = existingData.some(item => 
      item.unidad && item.unidad.toLowerCase() === formData.unidad?.toLowerCase()
    );
    
    if (metricaExists && unidadExists) {
      errors.push({
        field: 'both',
        message: 'La métrica y unidad ya existen',
        type: 'duplicate'
      });
    } else if (metricaExists) {
      errors.push({
        field: 'metrica',
        message: 'El nombre de la métrica ya existe',
        type: 'duplicate'
      });
    } else if (unidadExists) {
      errors.push({
        field: 'unidad',
        message: 'La unidad ya existe',
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

export const validateMetricaUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.metrica || formData.metrica.trim() === '') {
    errors.push({
      field: 'metrica',
      message: 'La métrica es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.unidad || formData.unidad.trim() === '') {
    errors.push({
      field: 'unidad',
      message: 'La unidad es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.metrica && formData.metrica.trim() !== '') {
    const metricaExists = existingData.some(item => 
      item.metricaid !== originalData.metricaid && 
      item.metrica && 
      item.metrica.toLowerCase() === formData.metrica.toLowerCase()
    );
    
    if (metricaExists) {
      errors.push({
        field: 'metrica',
        message: 'La métrica ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkMetricaDependencies(originalData.metricaid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar la métrica porque tiene sensores o umbrales asociados',
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

export const checkMetricaDependencies = async (metricaid: number): Promise<boolean> => {
  try {
    const metricasensores = await JoySenseService.getTableData('metricasensor');
    const hasMetricasensores = metricasensores.some(metricasensor => metricasensor.metricaid === metricaid);
    if (hasMetricasensores) return true;
    
    const umbrales = await JoySenseService.getTableData('umbral');
    const hasUmbrales = umbrales.some(umbral => umbral.metricaid === metricaid);
    return hasUmbrales;
  } catch (error) {
    logger.error('Error checking metrica dependencies:', error);
    return false;
  }
};
