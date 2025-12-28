// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

import { ValidationRule } from './types';

// Esquemas de validación para cada tabla
export const tableValidationSchemas: Record<string, ValidationRule[]> = {
  pais: [
    { field: 'pais', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del país es obligatorio' },
    { field: 'paisabrev', required: true, type: 'string', minLength: 1, maxLength: 2, customMessage: 'La abreviatura es obligatoria' }
  ],
  
  empresa: [
    { field: 'empresa', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la empresa es obligatorio' },
    { field: 'empresabrev', required: true, type: 'string', minLength: 1, maxLength: 10, customMessage: 'La abreviatura es obligatoria' },
    { field: 'paisid', required: true, type: 'number', customMessage: 'Debe seleccionar un país' }
  ],
  
  fundo: [
    { field: 'fundo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del fundo es obligatorio' },
    { field: 'fundoabrev', required: true, type: 'string', minLength: 1, maxLength: 10, customMessage: 'La abreviatura es obligatoria' },
    { field: 'empresaid', required: true, type: 'number', customMessage: 'Debe seleccionar una empresa' }
  ],
  
  ubicacion: [
    { field: 'ubicacion', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la ubicación es obligatorio' },
    { field: 'fundoid', required: true, type: 'number', customMessage: 'Debe seleccionar un fundo' }
  ],
  
  localizacion: [
    { field: 'nodoid', required: true, type: 'number', customMessage: 'Debe seleccionar un nodo' },
    { field: 'sensorid', required: true, type: 'number', customMessage: 'Debe seleccionar un sensor' },
    { field: 'metricaid', required: true, type: 'number', customMessage: 'Debe seleccionar una métrica' },
    { field: 'localizacion', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la localización es obligatorio' },
    { field: 'latitud', required: false, type: 'number', customMessage: 'La latitud es obligatoria' },
    { field: 'longitud', required: false, type: 'number', customMessage: 'La longitud es obligatoria' },
    { field: 'referencia', required: false, type: 'string', customMessage: 'La referencia es obligatoria' }
  ],
  
  entidad: [
    { field: 'entidad', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la entidad es obligatorio' }
  ],
  
  tipo: [
    { field: 'tipo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del tipo es obligatorio' }
  ],
  
  nodo: [
    { field: 'nodo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del nodo es obligatorio' },
    { field: 'ubicacionid', required: true, type: 'number', customMessage: 'Debe seleccionar una ubicación' }
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
    { field: 'sensorid', required: true, type: 'number', customMessage: 'El ID del sensor es obligatorio' },
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
    { field: 'login', required: true, type: 'email', minLength: 1, customMessage: 'El login debe tener formato de email válido (ejemplo@dominio.com)' },
    { field: 'firstname', required: true, type: 'string', minLength: 1, maxLength: 50, customMessage: 'El nombre es obligatorio y no puede exceder 50 caracteres' },
    { field: 'lastname', required: true, type: 'string', minLength: 1, maxLength: 50, customMessage: 'El apellido es obligatorio y no puede exceder 50 caracteres' }
  ],
  
  medio: [
    { field: 'nombre', required: true, type: 'string', minLength: 1, maxLength: 50, customMessage: 'El nombre del medio es obligatorio' }
  ],
  
  contacto: [
    { field: 'usuarioid', required: true, type: 'number', customMessage: 'Debe seleccionar un usuario' },
    { field: 'codigotelefonoid', required: false, type: 'number', customMessage: 'Debe seleccionar un código de país' },
    { field: 'celular', required: false, type: 'phone', customMessage: 'El formato del celular no es válido' }
  ],
  
  correo: [
    { field: 'usuarioid', required: true, type: 'number', customMessage: 'Debe seleccionar un usuario' },
    { field: 'correo', required: true, type: 'email', customMessage: 'El correo electrónico es obligatorio y debe tener formato válido' }
  ],
  
  perfil: [
    { field: 'perfil', required: true, type: 'string', minLength: 1, maxLength: 50, customMessage: 'El nombre del perfil es obligatorio y no puede exceder 50 caracteres' },
    { field: 'nivel', required: true, type: 'number', customMessage: 'El nivel del perfil es obligatorio' },
    { field: 'jefeid', required: false, type: 'number', customMessage: 'El jefe debe ser un número válido' }
  ],
  
  metricasensor: [
    { field: 'sensorid', required: true, type: 'number', customMessage: 'Debe seleccionar un sensor' },
    { field: 'metricaid', required: true, type: 'number', customMessage: 'Debe seleccionar una métrica' }
  ],
  
  auditlogumbral: [
    { field: 'auditlogumbral', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del log de auditoría es obligatorio' },
    { field: 'auditlogumbralabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ],
  
  criticidad: [
    { field: 'criticidad', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la criticidad es obligatorio' },
    { field: 'grado', required: false, type: 'number', customMessage: 'El grado debe ser un número válido' },
    { field: 'frecuencia', required: false, type: 'number', customMessage: 'La frecuencia debe ser un número válido' },
    { field: 'escalamiento', required: false, type: 'number', customMessage: 'El escalamiento debe ser un número válido' },
    { field: 'escalon', required: false, type: 'number', customMessage: 'El escalón debe ser un número válido' }
  ],
  
  status: [
    { field: 'status', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del status es obligatorio' },
    { field: 'statusabrev', required: false, type: 'string', maxLength: 10, customMessage: 'La abreviatura no puede exceder 10 caracteres' }
  ]
};
