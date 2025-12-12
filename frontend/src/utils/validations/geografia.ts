// ============================================================================
// GEOGRAFÍA VALIDATIONS
// ============================================================================
// Validaciones para: pais, empresa, fundo, ubicacion, localizacion

import { JoySenseService } from '../../services/backend-api';
import { ValidationError, EnhancedValidationResult } from './types';
import { generateUserFriendlyMessage, generateUpdateUserFriendlyMessage } from './common';

// ============================================================================
// PAIS VALIDATIONS
// ============================================================================

export const validatePaisData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.pais || formData.pais.trim() === '') {
    errors.push({
      field: 'pais',
      message: 'El nombre del país es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.paisabrev || formData.paisabrev.trim() === '') {
    errors.push({
      field: 'paisabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar longitud de abreviatura
  if (formData.paisabrev && formData.paisabrev.length > 2) {
    errors.push({
      field: 'paisabrev',
      message: 'La abreviatura no puede exceder 2 caracteres',
      type: 'length'
    });
  }
  
  // 3. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const paisExists = existingData.some(item => 
      item.pais && item.pais.toLowerCase().trim() === formData.pais?.toLowerCase().trim()
    );
    
    const abrevExists = existingData.some(item => 
      item.paisabrev && item.paisabrev.toLowerCase().trim() === formData.paisabrev?.toLowerCase().trim()
    );
    
    if (paisExists && abrevExists) {
      errors.push({
        field: 'both',
        message: 'El país y abreviatura se repite',
        type: 'duplicate'
      });
    } else if (paisExists) {
      errors.push({
        field: 'pais',
        message: 'El país se repite',
        type: 'duplicate'
      });
    } else if (abrevExists) {
      errors.push({
        field: 'paisabrev',
        message: 'La abreviatura se repite',
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

export const validatePaisUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.pais || formData.pais.trim() === '') {
    errors.push({
      field: 'pais',
      message: 'El país es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.paisabrev || formData.paisabrev.trim() === '') {
    errors.push({
      field: 'paisabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.pais && formData.pais.trim() !== '') {
    const paisExists = existingData.some(item => 
      item.paisid !== originalData.paisid && 
      item.pais && 
      item.pais.toLowerCase() === formData.pais.toLowerCase()
    );
    
    if (paisExists) {
      errors.push({
        field: 'pais',
        message: 'El país ya existe',
        type: 'duplicate'
      });
    }
  }
  
  if (formData.paisabrev && formData.paisabrev.trim() !== '') {
    const paisabrevExists = existingData.some(item => 
      item.paisid !== originalData.paisid && 
      item.paisabrev && 
      item.paisabrev.toLowerCase() === formData.paisabrev.toLowerCase()
    );
    
    if (paisabrevExists) {
      errors.push({
        field: 'paisabrev',
        message: 'La abreviatura ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkPaisDependencies(originalData.paisid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el país porque tiene empresas asociadas',
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

export const checkPaisDependencies = async (paisid: number): Promise<boolean> => {
  try {
    const empresas = await JoySenseService.getEmpresas();
    return empresas.some(empresa => empresa.paisid === paisid);
  } catch (error) {
    console.error('Error checking pais dependencies:', error);
    return false;
  }
};

// ============================================================================
// EMPRESA VALIDATIONS
// ============================================================================

export const validateEmpresaData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.empresa || formData.empresa.trim() === '') {
    errors.push({
      field: 'empresa',
      message: 'El nombre de la empresa es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.empresabrev || formData.empresabrev.trim() === '') {
    errors.push({
      field: 'empresabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.paisid) {
    errors.push({
      field: 'paisid',
      message: 'Debe seleccionar un país',
      type: 'required'
    });
  }
  
  // 2. Validar longitud de abreviatura
  if (formData.empresabrev && formData.empresabrev.length > 10) {
    errors.push({
      field: 'empresabrev',
      message: 'La abreviatura no puede exceder 10 caracteres',
      type: 'length'
    });
  }
  
  // 3. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const empresaExists = existingData.some(item => 
      item.empresa && item.empresa.toLowerCase().trim() === formData.empresa?.toLowerCase().trim()
    );
    
    const abrevExists = existingData.some(item => 
      item.empresabrev && item.empresabrev.toLowerCase().trim() === formData.empresabrev?.toLowerCase().trim()
    );
    
    if (empresaExists && abrevExists) {
      errors.push({
        field: 'both',
        message: 'La empresa y abreviatura se repite',
        type: 'duplicate'
      });
    } else if (empresaExists) {
      errors.push({
        field: 'empresa',
        message: 'La empresa se repite',
        type: 'duplicate'
      });
    } else if (abrevExists) {
      errors.push({
        field: 'empresabrev',
        message: 'La abreviatura se repite',
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

export const validateEmpresaUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.empresa || formData.empresa.trim() === '') {
    errors.push({
      field: 'empresa',
      message: 'La empresa es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.empresabrev || formData.empresabrev.trim() === '') {
    errors.push({
      field: 'empresabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.paisid || formData.paisid === '') {
    errors.push({
      field: 'paisid',
      message: 'El país es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.empresa && formData.empresa.trim() !== '') {
    const empresaExists = existingData.some(item => 
      item.empresaid !== originalData.empresaid && 
      item.empresa && 
      item.empresa.toLowerCase() === formData.empresa.toLowerCase()
    );
    
    if (empresaExists) {
      errors.push({
        field: 'empresa',
        message: 'La empresa ya existe',
        type: 'duplicate'
      });
    }
  }
  
  if (formData.empresabrev && formData.empresabrev.trim() !== '') {
    const empresabrevExists = existingData.some(item => 
      item.empresaid !== originalData.empresaid && 
      item.empresabrev && 
      item.empresabrev.toLowerCase() === formData.empresabrev.toLowerCase()
    );
    
    if (empresabrevExists) {
      errors.push({
        field: 'empresabrev',
        message: 'La abreviatura ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkEmpresaDependencies(originalData.empresaid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar la empresa porque tiene fundos asociados',
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

export const checkEmpresaDependencies = async (empresaid: number): Promise<boolean> => {
  try {
    const fundos = await JoySenseService.getFundos();
    return fundos.some(fundo => fundo.empresaid === empresaid);
  } catch (error) {
    console.error('Error checking empresa dependencies:', error);
    return false;
  }
};

// ============================================================================
// FUNDO VALIDATIONS
// ============================================================================

export const validateFundoData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.fundo || formData.fundo.trim() === '') {
    errors.push({
      field: 'fundo',
      message: 'El nombre del fundo es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.fundoabrev || formData.fundoabrev.trim() === '') {
    errors.push({
      field: 'fundoabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.empresaid) {
    errors.push({
      field: 'empresaid',
      message: 'Debe seleccionar una empresa',
      type: 'required'
    });
  }
  
  // 2. Validar longitud de abreviatura
  if (formData.fundoabrev && formData.fundoabrev.length > 10) {
    errors.push({
      field: 'fundoabrev',
      message: 'La abreviatura no puede exceder 10 caracteres',
      type: 'length'
    });
  }
  
  // 3. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const fundoExists = existingData.some(item => 
      item.fundo && item.fundo.toLowerCase() === formData.fundo?.toLowerCase()
    );
    
    const abrevExists = existingData.some(item => 
      item.fundoabrev && item.fundoabrev.toLowerCase() === formData.fundoabrev?.toLowerCase()
    );
    
    if (fundoExists && abrevExists) {
      errors.push({
        field: 'both',
        message: 'El fundo y abreviatura se repite',
        type: 'duplicate'
      });
    } else if (fundoExists) {
      errors.push({
        field: 'fundo',
        message: 'El nombre del fundo se repite',
        type: 'duplicate'
      });
    } else if (abrevExists) {
      errors.push({
        field: 'fundoabrev',
        message: 'La abreviatura se repite',
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

export const validateFundoUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.fundo || formData.fundo.trim() === '') {
    errors.push({
      field: 'fundo',
      message: 'El fundo es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.fundoabrev || formData.fundoabrev.trim() === '') {
    errors.push({
      field: 'fundoabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.empresaid || formData.empresaid === '') {
    errors.push({
      field: 'empresaid',
      message: 'La empresa es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.fundo && formData.fundo.trim() !== '') {
    const fundoExists = existingData.some(item => 
      item.fundoid !== originalData.fundoid && 
      item.fundo && 
      item.fundo.toLowerCase() === formData.fundo.toLowerCase()
    );
    
    if (fundoExists) {
      errors.push({
        field: 'fundo',
        message: 'El fundo ya existe',
        type: 'duplicate'
      });
    }
  }
  
  if (formData.fundoabrev && formData.fundoabrev.trim() !== '') {
    const fundoabrevExists = existingData.some(item => 
      item.fundoid !== originalData.fundoid && 
      item.fundoabrev && 
      item.fundoabrev.toLowerCase() === formData.fundoabrev.toLowerCase()
    );
    
    if (fundoabrevExists) {
      errors.push({
        field: 'fundoabrev',
        message: 'La abreviatura ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkFundoDependencies(originalData.fundoid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el fundo porque tiene ubicaciones asociadas',
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

export const checkFundoDependencies = async (fundoid: number): Promise<boolean> => {
  try {
    const ubicaciones = await JoySenseService.getUbicaciones();
    return ubicaciones.some(ubicacion => ubicacion.fundoid === fundoid);
  } catch (error) {
    console.error('Error checking fundo dependencies:', error);
    return false;
  }
};

// ============================================================================
// UBICACION VALIDATIONS
// ============================================================================

export const validateUbicacionData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.ubicacion || formData.ubicacion.trim() === '') {
    errors.push({
      field: 'ubicacion',
      message: 'El nombre de la ubicación es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.fundoid) {
    errors.push({
      field: 'fundoid',
      message: 'Debe seleccionar un fundo',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const ubicacionExists = existingData.some(item => 
      item.ubicacion && item.ubicacion.toLowerCase() === formData.ubicacion?.toLowerCase() &&
      item.fundoid && item.fundoid.toString() === formData.fundoid?.toString()
    );
    
    if (ubicacionExists) {
      errors.push({
        field: 'ubicacion',
        message: 'La ubicación ya existe en este fundo',
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

export const validateUbicacionUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.ubicacion || formData.ubicacion.trim() === '') {
    errors.push({
      field: 'ubicacion',
      message: 'La ubicación es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.fundoid || formData.fundoid === '') {
    errors.push({
      field: 'fundoid',
      message: 'El fundo es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.ubicacion && formData.ubicacion.trim() !== '') {
    const ubicacionExists = existingData.some(item => 
      item.ubicacionid !== originalData.ubicacionid && 
      item.ubicacion && 
      item.ubicacion.toLowerCase() === formData.ubicacion.toLowerCase()
    );
    
    if (ubicacionExists) {
      errors.push({
        field: 'ubicacion',
        message: 'La ubicación ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkUbicacionDependencies(originalData.ubicacionid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar la ubicación porque tiene localizaciones asociadas',
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

export const checkUbicacionDependencies = async (ubicacionid: number): Promise<boolean> => {
  try {
    const nodos = await JoySenseService.getNodos();
    return nodos.some((nodo: any) => nodo.ubicacionid === ubicacionid);
  } catch (error) {
    console.error('Error checking ubicacion dependencies:', error);
    return false;
  }
};

// ============================================================================
// LOCALIZACION VALIDATIONS
// ============================================================================

export const validateLocalizacionData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.entidadid) {
    errors.push({
      field: 'entidadid',
      message: 'Debe seleccionar una entidad',
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
  
  if (!formData.nodoid) {
    errors.push({
      field: 'nodoid',
      message: 'Debe seleccionar un nodo',
      type: 'required'
    });
  }
  
  if (!formData.latitud || formData.latitud === '') {
    errors.push({
      field: 'latitud',
      message: 'La latitud es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.longitud || formData.longitud === '') {
    errors.push({
      field: 'longitud',
      message: 'La longitud es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const localizacionExists = existingData.some(item => 
      item.ubicacionid && item.ubicacionid.toString() === formData.ubicacionid?.toString() &&
      item.nodoid && item.nodoid.toString() === formData.nodoid?.toString()
    );
    
    if (localizacionExists) {
      errors.push({
        field: 'ubicacionid',
        message: 'La ubicación y nodo ya están asociados',
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

export const validateLocalizacionUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.ubicacionid || formData.ubicacionid === '') {
    errors.push({
      field: 'ubicacionid',
      message: 'La ubicación es obligatoria',
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
  
  if (!formData.latitud || formData.latitud === '') {
    errors.push({
      field: 'latitud',
      message: 'La latitud es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.longitud || formData.longitud === '') {
    errors.push({
      field: 'longitud',
      message: 'La longitud es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.ubicacionid && formData.nodoid) {
    const localizacionExists = existingData.some(item => 
      (item.ubicacionid !== originalData.ubicacionid || item.nodoid !== originalData.nodoid) && 
      item.ubicacionid === formData.ubicacionid && 
      item.nodoid === formData.nodoid
    );
    
    if (localizacionExists) {
      errors.push({
        field: 'composite',
        message: 'Ya existe una localización para esta ubicación y nodo',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar restricción "unico_nodo_activo" (solo si se está activando)
  if (formData.statusid === 1 && originalData.statusid !== 1) {
    const nodoActivoExists = existingData.some(item => 
      item.nodoid === formData.nodoid && 
      item.statusid === 1 &&
      (item.ubicacionid !== originalData.ubicacionid || item.nodoid !== originalData.nodoid)
    );
    
    if (nodoActivoExists) {
      errors.push({
        field: 'statusid',
        message: 'Ya existe una localización activa para este nodo. Un nodo solo puede tener una localización activa a la vez.',
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
