import { JoySenseService } from '../services/backend-api';

// Sistema de validación modular para formularios de parámetros
export interface ValidationRule {
  field: string;
  required: boolean;
  type?: 'string' | 'number' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Interfaz para errores de validación específicos
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'duplicate' | 'format' | 'length' | 'constraint';
}

// Interfaz para resultado de validación mejorado
export interface EnhancedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  userFriendlyMessage: string;
}

// Esquemas de validación para cada tabla
export const tableValidationSchemas: Record<string, ValidationRule[]> = {
  pais: [
    { field: 'pais', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del país es obligatorio' },
    { field: 'paisabrev', required: true, type: 'string', minLength: 1, maxLength: 2, customMessage: 'La abreviatura es obligatoria' }
  ],
  
  empresa: [
    { field: 'empresa', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la empresa es obligatorio' },
    { field: 'empresabrev', required: true, type: 'string', minLength: 1, maxLength: 3, customMessage: 'La abreviatura es obligatoria' },
    { field: 'paisid', required: true, type: 'number', customMessage: 'Debe seleccionar un país' }
  ],
  
  fundo: [
    { field: 'fundo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del fundo es obligatorio' },
    { field: 'fundoabrev', required: true, type: 'string', minLength: 1, maxLength: 2, customMessage: 'La abreviatura es obligatoria' },
    { field: 'empresaid', required: true, type: 'number', customMessage: 'Debe seleccionar una empresa' }
  ],
  
  ubicacion: [
    { field: 'ubicacion', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la ubicación es obligatorio' },
    { field: 'fundoid', required: true, type: 'number', customMessage: 'Debe seleccionar un fundo' }
  ],
  
  localizacion: [
    { field: 'entidadid', required: true, type: 'number', customMessage: 'Debe seleccionar una entidad' },
    { field: 'ubicacionid', required: true, type: 'number', customMessage: 'Debe seleccionar una ubicación' },
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'latitud', required: true, type: 'number', customMessage: 'La latitud es obligatoria' },
    { field: 'longitud', required: true, type: 'number', customMessage: 'La longitud es obligatoria' },
    { field: 'referencia', required: true, type: 'string', minLength: 1, customMessage: 'La referencia es obligatoria' }
  ],
  
  entidad: [
    { field: 'entidad', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la entidad es obligatorio' }
  ],
  
  tipo: [
    { field: 'tipo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del tipo es obligatorio' },
    { field: 'entidadid', required: true, type: 'number', customMessage: 'Debe seleccionar una entidad' }
  ],
  
  nodo: [
    { field: 'nodo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del nodo es obligatorio' },
    { field: 'deveui', required: true, type: 'string', minLength: 1, customMessage: 'El campo DEVEUI es obligatorio' }
  ],
  
  metrica: [
    { field: 'metrica', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la métrica es obligatorio' },
    { field: 'unidad', required: true, type: 'string', minLength: 1, customMessage: 'La unidad es obligatoria' }
  ],
  
  umbral: [
    { field: 'umbral', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del umbral es obligatorio' },
    { field: 'ubicacionid', required: true, type: 'number', customMessage: 'Debe seleccionar una ubicación' },
    { field: 'criticidadid', required: true, type: 'number', customMessage: 'Debe seleccionar una criticidad' },
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'metricaid', required: true, type: 'number', customMessage: 'Debe seleccionar una métrica' },
    { field: 'tipoid', required: true, type: 'number', customMessage: 'Debe seleccionar un tipo' }
  ],
  
  perfilumbral: [
    { field: 'perfilid', required: true, type: 'number', customMessage: 'Debe seleccionar un perfil' },
    { field: 'umbralid', required: true, type: 'number', customMessage: 'Debe seleccionar un umbral' }
  ],
  
  sensor: [
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'tipoid', required: true, type: 'number', customMessage: 'Debe seleccionar un tipo' }
  ],
  
  medicion: [
    { field: 'medicion', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la medición es obligatorio' },
    { field: 'medicionabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  alerta: [
    { field: 'alerta', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la alerta es obligatorio' },
    { field: 'alertaabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  usuario: [
    { field: 'usuario', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de usuario es obligatorio' },
    { field: 'usuarioabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  medio: [
    { field: 'nombre', required: true, type: 'string', minLength: 1, maxLength: 50, customMessage: 'El nombre del medio es obligatorio' }
  ],
  
  contacto: [
    { field: 'usuarioid', required: true, type: 'number', customMessage: 'Debe seleccionar un usuario' },
    { field: 'medioid', required: true, type: 'number', customMessage: 'Debe seleccionar un medio' },
    { field: 'celular', required: false, type: 'phone', customMessage: 'El formato del celular no es válido' },
    { field: 'correo', required: false, type: 'email', customMessage: 'El formato del correo no es válido' }
  ],
  
  perfil: [
    { field: 'perfil', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del perfil es obligatorio' },
    { field: 'nivel', required: true, type: 'string', minLength: 1, customMessage: 'El nivel del perfil es obligatorio' }
  ],
  
  metricasensor: [
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'metricaid', required: true, type: 'number', customMessage: 'Debe seleccionar una métrica' },
    { field: 'tipoid', required: true, type: 'number', customMessage: 'Debe seleccionar un tipo' }
  ],
  
  auditlogumbral: [
    { field: 'auditlogumbral', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del log de auditoría es obligatorio' },
    { field: 'auditlogumbralabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  criticidad: [
    { field: 'criticidad', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la criticidad es obligatorio' },
    { field: 'criticidadbrev', required: true, type: 'string', minLength: 1, maxLength: 10, customMessage: 'La abreviatura de la criticidad es obligatoria' }
  ],
  
  status: [
    { field: 'status', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del status es obligatorio' },
    { field: 'statusabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ]
};

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
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
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

// Función para validación robusta específica por tabla
// Función general para validación de actualización
export const validateTableUpdate = async (
  tableName: string,
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  switch (tableName) {
    case 'pais':
      return await validatePaisUpdate(formData, originalData, existingData || []);
    case 'empresa':
      return await validateEmpresaUpdate(formData, originalData, existingData || []);
    case 'fundo':
      return await validateFundoUpdate(formData, originalData, existingData || []);
    case 'ubicacion':
      return await validateUbicacionUpdate(formData, originalData, existingData || []);
    default:
      // Fallback a validación básica
      const basicResult = validateFormData(tableName, formData);
      return {
        isValid: basicResult.isValid,
        errors: basicResult.errors.map(error => ({
          field: 'general',
          message: error,
          type: 'format'
        })),
        userFriendlyMessage: basicResult.errors.length > 0 
          ? `⚠️ ${basicResult.errors.join('\n')}`
          : ''
      };
  }
};

export const validateTableData = async (
  tableName: string, 
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  switch (tableName) {
    case 'pais':
      return await validatePaisData(formData, existingData);
    case 'empresa':
      return await validateEmpresaData(formData, existingData);
    case 'fundo':
      return await validateFundoData(formData, existingData);
    case 'ubicacion':
      return await validateUbicacionData(formData, existingData);
    case 'localizacion':
      return await validateLocalizacionData(formData, existingData);
    case 'entidad':
      return await validateEntidadData(formData, existingData);
    case 'tipo':
      return await validateTipoData(formData, existingData);
    case 'nodo':
      return await validateNodoData(formData, existingData);
    case 'metrica':
      return await validateMetricaData(formData, existingData);
    case 'umbral':
      return await validateUmbralData(formData, existingData);
    case 'perfilumbral':
      return await validatePerfilUmbralData(formData, existingData);
    case 'criticidad':
      return await validateCriticidadData(formData, existingData);
    case 'medio':
      return await validateMedioData(formData, existingData);
    case 'contacto':
      return await validateContactoData(formData, existingData);
    case 'perfil':
      return await validatePerfilData(formData, existingData);
    default:
      // Fallback a validación básica
      const basicResult = validateFormData(tableName, formData);
      return {
        isValid: basicResult.isValid,
        errors: basicResult.errors.map(error => ({
          field: 'general',
          message: error,
          type: 'format'
        })),
        userFriendlyMessage: basicResult.errors.length > 0 
          ? `⚠️ ${basicResult.errors.join(' ⚠️ ')}` 
          : ''
      };
  }
};

// Validación específica para País
const validatePaisData = async (
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

// Validación específica para Empresa
const validateEmpresaData = async (
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
  if (formData.empresabrev && formData.empresabrev.length > 3) {
    errors.push({
      field: 'empresabrev',
      message: 'La abreviatura no puede exceder 3 caracteres',
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

// Validación específica para Fundo
const validateFundoData = async (
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
  if (formData.fundoabrev && formData.fundoabrev.length > 2) {
    errors.push({
      field: 'fundoabrev',
      message: 'La abreviatura no puede exceder 2 caracteres',
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

// Validación específica para Ubicación
const validateUbicacionData = async (
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

// Validación específica para Localización
const validateLocalizacionData = async (
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
  
  if (!formData.referencia || formData.referencia.trim() === '') {
    errors.push({
      field: 'referencia',
      message: 'La referencia es obligatoria',
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

// Validación específica para Entidad
const validateEntidadData = async (
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

// Validación específica para Tipo
const validateTipoData = async (
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
  
  if (!formData.entidadid) {
    errors.push({
      field: 'entidadid',
      message: 'Debe seleccionar una entidad',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const tipoExists = existingData.some(item => 
      item.tipo && item.tipo.toLowerCase() === formData.tipo?.toLowerCase() &&
      item.entidadid && item.entidadid.toString() === formData.entidadid?.toString()
    );
    
    if (tipoExists) {
      errors.push({
        field: 'tipo',
        message: 'El tipo ya existe en esta entidad',
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

// Validación específica para Nodo
const validateNodoData = async (
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
  
  if (!formData.deveui || formData.deveui.trim() === '') {
    errors.push({
      field: 'deveui',
      message: 'El DevEUI es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const nodoExists = existingData.some(item => 
      item.nodo && item.nodo.toLowerCase() === formData.nodo?.toLowerCase()
    );
    
    const deveuiExists = existingData.some(item => 
      item.deveui && item.deveui.toLowerCase() === formData.deveui?.toLowerCase()
    );
    
    if (nodoExists && deveuiExists) {
      errors.push({
        field: 'both',
        message: 'El nodo y DevEUI ya existen',
        type: 'duplicate'
      });
    } else if (nodoExists) {
      errors.push({
        field: 'nodo',
        message: 'El nombre del nodo ya existe',
        type: 'duplicate'
      });
    } else if (deveuiExists) {
      errors.push({
        field: 'deveui',
        message: 'El DevEUI ya existe',
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

// Validación específica para Métrica
const validateMetricaData = async (
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

// Validación específica para Umbral
const validateUmbralData = async (
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

// Validación específica para Perfil Umbral
const validatePerfilUmbralData = async (
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

// Validación específica para Criticidad
const validateCriticidadData = async (
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
  
  if (!formData.criticidadbrev || formData.criticidadbrev.trim() === '') {
    errors.push({
      field: 'criticidadbrev',
      message: 'La abreviatura de la criticidad es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const criticidadExists = existingData.some(item => 
      item.criticidad && item.criticidad.toLowerCase() === formData.criticidad?.toLowerCase()
    );
    
    const criticidadbrevExists = existingData.some(item => 
      item.criticidadbrev && item.criticidadbrev.toLowerCase() === formData.criticidadbrev?.toLowerCase()
    );
    
    if (criticidadExists && criticidadbrevExists) {
      errors.push({
        field: 'both',
        message: 'La criticidad y abreviatura ya existen',
        type: 'duplicate'
      });
    } else if (criticidadExists) {
      errors.push({
        field: 'criticidad',
        message: 'El nombre de la criticidad ya existe',
        type: 'duplicate'
      });
    } else if (criticidadbrevExists) {
      errors.push({
        field: 'criticidadbrev',
        message: 'La abreviatura de la criticidad ya existe',
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

// Validación específica para Medio
const validateMedioData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.nombre || formData.nombre.trim() === '') {
    errors.push({
      field: 'nombre',
      message: 'El nombre del medio es obligatorio',
      type: 'required'
    });
  } else if (formData.nombre.length > 50) {
    errors.push({
      field: 'nombre',
      message: 'El nombre del medio no puede exceder 50 caracteres',
      type: 'format'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const medioExists = existingData.some(item => 
      item.nombre && item.nombre.toLowerCase() === formData.nombre?.toLowerCase()
    );
    
    if (medioExists) {
      errors.push({
        field: 'nombre',
        message: 'El nombre del medio ya existe',
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

// Validación específica para Contacto
const validateContactoData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.usuarioid || formData.usuarioid === 0) {
    errors.push({
      field: 'usuarioid',
      message: 'Debe seleccionar un usuario',
      type: 'required'
    });
  }
  
  if (!formData.medioid || formData.medioid === 0) {
    errors.push({
      field: 'medioid',
      message: 'Debe seleccionar un medio',
      type: 'required'
    });
  }
  
  // 2. Validar constraint de negocio: al menos uno de celular o correo debe estar presente
  if ((!formData.celular || formData.celular.trim() === '') && 
      (!formData.correo || formData.correo.trim() === '')) {
    errors.push({
      field: 'contacto',
      message: 'Debe proporcionar al menos un celular o correo',
      type: 'required'
    });
  }
  
  // 3. Validar duplicados si hay datos existentes (constraint: usuarioid + medioid único)
  if (existingData && existingData.length > 0) {
    const contactoExists = existingData.some(item => 
      item.usuarioid === formData.usuarioid && item.medioid === formData.medioid
    );
    
    if (contactoExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un contacto para este usuario y medio',
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

// Validación específica para Perfil
const validatePerfilData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.perfil || formData.perfil.trim() === '') {
    errors.push({
      field: 'perfil',
      message: 'El nombre del perfil es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.nivel || formData.nivel.trim() === '') {
    errors.push({
      field: 'nivel',
      message: 'El nivel del perfil es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const perfilExists = existingData.some(item => 
      item.perfil && item.perfil.toLowerCase() === formData.perfil?.toLowerCase()
    );
    
    const nivelExists = existingData.some(item => 
      item.nivel && item.nivel.toLowerCase() === formData.nivel?.toLowerCase()
    );
    
    if (perfilExists && nivelExists) {
      errors.push({
        field: 'both',
        message: 'El perfil y nivel ya existen',
        type: 'duplicate'
      });
    } else if (perfilExists) {
      errors.push({
        field: 'perfil',
        message: 'El nombre del perfil ya existe',
        type: 'duplicate'
      });
    } else if (nivelExists) {
      errors.push({
        field: 'nivel',
        message: 'El nivel del perfil ya existe',
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

// Validación específica para actualización de País
const validatePaisUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  console.log('🔍 validatePaisUpdate - formData:', formData);
  console.log('🔍 validatePaisUpdate - originalData:', originalData);
  console.log('🔍 validatePaisUpdate - pais value:', formData.pais);
  console.log('🔍 validatePaisUpdate - paisabrev value:', formData.paisabrev);
  
  // 1. Validar campos obligatorios
  if (!formData.pais || formData.pais.trim() === '') {
    console.log('🔍 validatePaisUpdate - pais está vacío');
    errors.push({
      field: 'pais',
      message: 'El país es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.paisabrev || formData.paisabrev.trim() === '') {
    console.log('🔍 validatePaisUpdate - paisabrev está vacío');
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
    // Verificar si hay empresas que referencian este país
    const hasDependentRecords = await checkPaisDependencies(originalData.paisid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el país porque tiene empresas asociadas',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización (mensajes individuales)
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

// Función para verificar dependencias de País
const checkPaisDependencies = async (paisid: number): Promise<boolean> => {
  try {
    // Verificar en tabla empresa
    const empresas = await JoySenseService.getEmpresas();
    return empresas.some(empresa => empresa.paisid === paisid);
  } catch (error) {
    console.error('Error checking pais dependencies:', error);
    return false; // En caso de error, permitir la operación
  }
};

// Validación específica para actualización de Empresa
const validateEmpresaUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  console.log('🔍 validateEmpresaUpdate - formData:', formData);
  console.log('🔍 validateEmpresaUpdate - originalData:', originalData);
  console.log('🔍 validateEmpresaUpdate - empresa value:', formData.empresa);
  console.log('🔍 validateEmpresaUpdate - empresabrev value:', formData.empresabrev);
  console.log('🔍 validateEmpresaUpdate - paisid value:', formData.paisid);
  
  // 1. Validar campos obligatorios
  if (!formData.empresa || formData.empresa.trim() === '') {
    console.log('🔍 validateEmpresaUpdate - empresa está vacío');
    errors.push({
      field: 'empresa',
      message: 'La empresa es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.empresabrev || formData.empresabrev.trim() === '') {
    console.log('🔍 validateEmpresaUpdate - empresabrev está vacío');
    errors.push({
      field: 'empresabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.paisid || formData.paisid === '') {
    console.log('🔍 validateEmpresaUpdate - paisid está vacío');
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
    // Verificar si hay fundos que referencian esta empresa
    const hasDependentRecords = await checkEmpresaDependencies(originalData.empresaid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar la empresa porque tiene fundos asociados',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización (mensajes individuales)
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

// Función para verificar dependencias de Empresa
const checkEmpresaDependencies = async (empresaid: number): Promise<boolean> => {
  try {
    // Verificar en tabla fundo
    const fundos = await JoySenseService.getFundos();
    return fundos.some(fundo => fundo.empresaid === empresaid);
  } catch (error) {
    console.error('Error checking empresa dependencies:', error);
    return false; // En caso de error, permitir la operación
  }
};

// Validación específica para actualización de Fundo
const validateFundoUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  console.log('🔍 validateFundoUpdate - formData:', formData);
  console.log('🔍 validateFundoUpdate - originalData:', originalData);
  console.log('🔍 validateFundoUpdate - fundo value:', formData.fundo);
  console.log('🔍 validateFundoUpdate - fundoabrev value:', formData.fundoabrev);
  console.log('🔍 validateFundoUpdate - empresaid value:', formData.empresaid);
  
  // 1. Validar campos obligatorios
  if (!formData.fundo || formData.fundo.trim() === '') {
    console.log('🔍 validateFundoUpdate - fundo está vacío');
    errors.push({
      field: 'fundo',
      message: 'El fundo es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.fundoabrev || formData.fundoabrev.trim() === '') {
    console.log('🔍 validateFundoUpdate - fundoabrev está vacío');
    errors.push({
      field: 'fundoabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.empresaid || formData.empresaid === '') {
    console.log('🔍 validateFundoUpdate - empresaid está vacío');
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
    // Verificar si hay ubicaciones que referencian este fundo
    const hasDependentRecords = await checkFundoDependencies(originalData.fundoid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el fundo porque tiene ubicaciones asociadas',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización (mensajes individuales)
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

// Función para verificar dependencias de Fundo
const checkFundoDependencies = async (fundoid: number): Promise<boolean> => {
  try {
    // Verificar en tabla ubicacion
    const ubicaciones = await JoySenseService.getUbicaciones();
    return ubicaciones.some(ubicacion => ubicacion.fundoid === fundoid);
  } catch (error) {
    console.error('Error checking fundo dependencies:', error);
    return false; // En caso de error, permitir la operación
  }
};

// Validación específica para actualización de Ubicación
const validateUbicacionUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  console.log('🔍 validateUbicacionUpdate - formData:', formData);
  console.log('🔍 validateUbicacionUpdate - originalData:', originalData);
  console.log('🔍 validateUbicacionUpdate - ubicacion value:', formData.ubicacion);
  console.log('🔍 validateUbicacionUpdate - fundoid value:', formData.fundoid);
  
  // 1. Validar campos obligatorios
  if (!formData.ubicacion || formData.ubicacion.trim() === '') {
    console.log('🔍 validateUbicacionUpdate - ubicacion está vacío');
    errors.push({
      field: 'ubicacion',
      message: 'La ubicación es obligatoria',
      type: 'required'
    });
  }
  
  if (!formData.fundoid || formData.fundoid === '') {
    console.log('🔍 validateUbicacionUpdate - fundoid está vacío');
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
    // Verificar si hay localizaciones que referencian esta ubicación
    const hasDependentRecords = await checkUbicacionDependencies(originalData.ubicacionid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar la ubicación porque tiene localizaciones asociadas',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización (mensajes individuales)
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

// Función para verificar dependencias de Ubicación
const checkUbicacionDependencies = async (ubicacionid: number): Promise<boolean> => {
  try {
    // Verificar en tabla localizacion
    const localizaciones = await JoySenseService.getLocalizaciones();
    return localizaciones.some(localizacion => localizacion.ubicacionid === ubicacionid);
  } catch (error) {
    console.error('Error checking ubicacion dependencies:', error);
    return false; // En caso de error, permitir la operación
  }
};

// Función para generar mensajes amigables para actualización (mensajes individuales)
const generateUpdateUserFriendlyMessage = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  
  // Para actualización, mostrar mensajes individuales sin combinar
  const messages = errors.map(error => `⚠️ ${error.message}`);
  
  return messages.join('\n');
};

// Función para generar mensajes amigables al usuario
const generateUserFriendlyMessage = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  
  // Agrupar errores por tipo
  const requiredErrors = errors.filter(e => e.type === 'required');
  const duplicateErrors = errors.filter(e => e.type === 'duplicate');
  const lengthErrors = errors.filter(e => e.type === 'length');
  
  const messages: string[] = [];
  
  // Manejar errores de campos obligatorios
  if (requiredErrors.length > 0) {
    if (requiredErrors.length === 1) {
      messages.push(`⚠️ ${requiredErrors[0].message}`);
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'pais') && 
               requiredErrors.some(e => e.field === 'paisabrev')) {
      messages.push('⚠️ El país y abreviatura es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'empresa') && 
               requiredErrors.some(e => e.field === 'empresabrev')) {
      messages.push('⚠️ La empresa y abreviatura es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'fundo') && 
               requiredErrors.some(e => e.field === 'fundoabrev')) {
      messages.push('⚠️ El fundo y abreviatura es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'ubicacion') && 
               requiredErrors.some(e => e.field === 'fundoid')) {
      messages.push('⚠️ La ubicación y fundo es obligatorio');
    } else if (requiredErrors.length === 3 && 
               requiredErrors.some(e => e.field === 'latitud') && 
               requiredErrors.some(e => e.field === 'longitud') && 
               requiredErrors.some(e => e.field === 'referencia')) {
      messages.push('⚠️ La latitud, longitud y referencia es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'latitud') && 
               requiredErrors.some(e => e.field === 'longitud')) {
      messages.push('⚠️ La latitud y longitud es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'latitud') && 
               requiredErrors.some(e => e.field === 'referencia')) {
      messages.push('⚠️ La latitud y referencia es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'longitud') && 
               requiredErrors.some(e => e.field === 'referencia')) {
      messages.push('⚠️ La longitud y referencia es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'tipo') && 
               requiredErrors.some(e => e.field === 'entidadid')) {
      messages.push('⚠️ El tipo y entidad es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'nodo') && 
               requiredErrors.some(e => e.field === 'deveui')) {
      messages.push('⚠️ El nodo y DevEUI es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'metrica') && 
               requiredErrors.some(e => e.field === 'unidad')) {
      messages.push('⚠️ La métrica y unidad es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'perfilid') && 
               requiredErrors.some(e => e.field === 'umbralid')) {
      messages.push('⚠️ El perfil y umbral es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'criticidad') && 
               requiredErrors.some(e => e.field === 'criticidadbrev')) {
      messages.push('⚠️ La criticidad y abreviatura es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'usuarioid') && 
               requiredErrors.some(e => e.field === 'medioid')) {
      messages.push('⚠️ El usuario y medio es obligatorio');
    } else if (requiredErrors.length === 2 && 
               requiredErrors.some(e => e.field === 'perfil') && 
               requiredErrors.some(e => e.field === 'nivel')) {
      messages.push('⚠️ El perfil y nivel es obligatorio');
    } else {
      messages.push(`⚠️ ${requiredErrors.map(e => e.message).join(' ⚠️ ')}`);
    }
  }
  
  // Manejar errores de duplicados
  if (duplicateErrors.length > 0) {
    if (duplicateErrors.length === 1) {
      messages.push(`⚠️ ${duplicateErrors[0].message}`);
    } else if (duplicateErrors.some(e => e.field === 'both')) {
      // Determinar si es país o empresa basado en los errores
      const isPais = duplicateErrors.some(e => e.message.includes('país'));
      const isEmpresa = duplicateErrors.some(e => e.message.includes('empresa'));
      
      if (isPais) {
        messages.push('⚠️ El país y abreviatura se repite');
      } else if (isEmpresa) {
        messages.push('⚠️ La empresa y abreviatura se repite');
      } else if (duplicateErrors.some(e => e.message.includes('fundo'))) {
        messages.push('⚠️ El fundo y abreviatura se repite');
      } else if (duplicateErrors.some(e => e.message.includes('métrica'))) {
        messages.push('⚠️ La métrica y unidad se repite');
      } else if (duplicateErrors.some(e => e.message.includes('criticidad'))) {
        messages.push('⚠️ La criticidad y abreviatura se repite');
      } else if (duplicateErrors.some(e => e.message.includes('perfil'))) {
        messages.push('⚠️ El perfil y nivel se repite');
      } else {
        messages.push(`⚠️ ${duplicateErrors[0].message}`);
      }
    } else {
      messages.push(`⚠️ ${duplicateErrors.map(e => e.message).join(' ⚠️ ')}`);
    }
  }
  
  // Manejar errores de longitud
  if (lengthErrors.length > 0) {
    messages.push(`⚠️ ${lengthErrors[0].message}`);
  }
  
  return messages.join('\n');
};
