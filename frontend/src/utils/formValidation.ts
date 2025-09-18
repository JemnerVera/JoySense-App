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

// Esquemas de validación para cada tabla
export const tableValidationSchemas: Record<string, ValidationRule[]> = {
  pais: [
    { field: 'pais', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del país es obligatorio' },
    { field: 'paisabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  empresa: [
    { field: 'empresa', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la empresa es obligatorio' },
    { field: 'empresabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' },
    { field: 'paisid', required: true, type: 'number', customMessage: 'Debe seleccionar un país' }
  ],
  
  fundo: [
    { field: 'fundo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del fundo es obligatorio' },
    { field: 'fundoabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' },
    { field: 'empresaid', required: true, type: 'number', customMessage: 'Debe seleccionar una empresa' }
  ],
  
  ubicacion: [
    { field: 'ubicacion', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la ubicación es obligatorio' },
    { field: 'ubicacionabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' },
    { field: 'fundoid', required: true, type: 'number', customMessage: 'Debe seleccionar un fundo' }
  ],
  
  localizacion: [
    { field: 'entidadid', required: true, type: 'number', customMessage: 'Debe seleccionar una entidad' },
    { field: 'ubicacionid', required: true, type: 'number', customMessage: 'Debe seleccionar una ubicación' },
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' }
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
    { field: 'nodoabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' },
    { field: 'ubicacionid', required: true, type: 'number', customMessage: 'Debe seleccionar una ubicación' }
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
