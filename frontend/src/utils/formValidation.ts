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
  type: 'required' | 'duplicate' | 'format' | 'length';
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
    { field: 'entidad', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la entidad es obligatorio' },
    { field: 'entidadabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  tipo: [
    { field: 'tipo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del tipo es obligatorio' },
    { field: 'entidadid', required: true, type: 'number', customMessage: 'Debe seleccionar una entidad' }
  ],
  
  nodo: [
    { field: 'nodo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del nodo es obligatorio' },
    { field: 'deveui', required: true, type: 'string', minLength: 1, customMessage: 'El campo DEVEUI es obligatorio' }
  ],
  
  sensor: [
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'tipoid', required: true, type: 'number', customMessage: 'Debe seleccionar un tipo' }
  ],
  
  metrica: [
    { field: 'metrica', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la métrica es obligatorio' },
    { field: 'metricaabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  medicion: [
    { field: 'medicion', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la medición es obligatorio' },
    { field: 'medicionabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  umbral: [
    { field: 'ubicacionid', required: true, type: 'number', customMessage: 'Debe seleccionar una ubicación' },
    { field: 'criticidadid', required: true, type: 'number', customMessage: 'Debe seleccionar una criticidad' },
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'metricaid', required: true, type: 'number', customMessage: 'Debe seleccionar una métrica' },
    { field: 'tipoid', required: true, type: 'number', customMessage: 'Debe seleccionar un tipo' }
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
    { field: 'nombre', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del medio es obligatorio' }
  ],
  
  contacto: [
    { field: 'usuarioid', required: true, type: 'number', customMessage: 'Debe seleccionar un usuario' },
    { field: 'medioid', required: true, type: 'number', customMessage: 'Debe seleccionar un medio' },
    { field: 'celular', required: false, type: 'phone', customMessage: 'El formato del celular no es válido' },
    { field: 'correo', required: false, type: 'email', customMessage: 'El formato del correo no es válido' }
  ],
  
  perfil: [
    { field: 'perfil', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del perfil es obligatorio' },
    { field: 'perfilabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  metricasensor: [
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'metricaid', required: true, type: 'number', customMessage: 'Debe seleccionar una métrica' },
    { field: 'tipoid', required: true, type: 'number', customMessage: 'Debe seleccionar un tipo' }
  ],
  
  perfilumbral: [
    { field: 'perfilid', required: true, type: 'number', customMessage: 'Debe seleccionar un perfil' },
    { field: 'umbralid', required: true, type: 'number', customMessage: 'Debe seleccionar un umbral' }
  ],
  
  auditlogumbral: [
    { field: 'auditlogumbral', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del log de auditoría es obligatorio' },
    { field: 'auditlogumbralabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  criticidad: [
    { field: 'criticidad', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la criticidad es obligatorio' },
    { field: 'criticidadabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
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
