// Tipos para el manejo de errores
export interface ErrorResponse {
  type: 'error' | 'warning' | 'success';
  message: string;
}

export interface BackendError {
  response?: {
    status?: number;
    data?: {
      error?: string;
      details?: string;
      code?: string;
      message?: string;
    };
  };
  message?: string;
}

// Función para detectar errores de clave única
export const isDuplicateKeyError = (error: BackendError): boolean => {
  return (
    error.response?.status === 409 ||
    (error.response?.data?.error && error.response.data.error.includes('duplicate key value violates unique constraint')) ||
    error.response?.data?.code === '23505'
  );
};

// Función para extraer información del error de clave única
export const extractDuplicateKeyInfo = (error: BackendError): { fieldName: string; conflictingValue: string } => {
  const details = error.response?.data?.details || '';
  const errorText = error.response?.data?.error || '';
  const constraintName = errorText.match(/constraint "([^"]+)"/)?.[1] || '';
  
  
  // Determinar qué campo está causando el conflicto
  let fieldName = 'campo';
  
  if (constraintName.includes('_pkey') || constraintName.includes('pk_')) {
    fieldName = 'clave primaria';
  } else if (constraintName.includes('unq_')) {
    // Para constraints como "unq_pais_0", extraer información más específica
    // Intentar extraer de los detalles primero (más preciso)
    const detailsMatch = details.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
    if (detailsMatch && detailsMatch[1]) {
      // Los detalles pueden contener múltiples campos separados por coma
      const keyFields = detailsMatch[1].split(',').map(f => f.trim());
      // Si hay múltiples campos, preferir el primero no-id
      fieldName = keyFields.find(f => !f.endsWith('id')) || keyFields[0] || 'campo';
    } else if (constraintName.startsWith('unq_')) {
      // Parsear constraint name como "unq_pais_0" -> extraer "pais"
      const parts = constraintName.split('_');
      if (parts.length >= 2) {
        fieldName = parts[1]; // Usar "pais" de "unq_pais_0"
      }
    }
  }
  
  // Extraer el valor que está causando conflicto
  const valueMatch = details.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
  let conflictingValue = valueMatch ? valueMatch[2] : 'valor duplicado';
  
  // Si no encontramos el valor en los detalles, intentar extraerlo del mensaje de error
  if (conflictingValue === 'valor duplicado') {
    const errorValueMatch = errorText.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
    if (errorValueMatch && errorValueMatch[2]) {
      conflictingValue = errorValueMatch[2];
    }
  }
  
  // Mapeo inteligente de nombres de campos basado en el contexto
  const fieldNameMapping: Record<string, string> = {
    'entidad': 'entidad',
    'pais': 'país',
    'empresa': 'empresa',
    'fundo': 'fundo',
    'ubicacion': 'ubicación',
    'nodo': 'nodo',
    'tipo': 'tipo',
    'metrica': 'métrica',
    'sensor': 'sensor',
    'metricasensor': 'métrica sensor',
    'localizacion': 'localización',
    'usuario': 'usuario',
    'login': 'login'
  };
  
  // Aplicar mapeo si existe
  if (fieldNameMapping[fieldName]) {
    fieldName = fieldNameMapping[fieldName];
  }
  
  
  return { fieldName, conflictingValue };
};

// Función auxiliar para convertir errores de longitud a mensajes amigables
function convertLengthError(errorText: string): string | null {
  if (!errorText || (!errorText.includes('value too long') && !errorText.includes('character varying') && 
      !errorText.includes('varchar'))) {
    return null;
  }
  
  // Extraer el límite de caracteres y el campo
  const lengthMatch = errorText.match(/character varying\((\d+)\)|varchar\((\d+)\)/);
  const length = lengthMatch ? (lengthMatch[1] || lengthMatch[2]) : '';
  
  // Intentar identificar qué campo tiene el problema
  let fieldName = '';
  const lowerErrorText = errorText.toLowerCase();
  if (lowerErrorText.includes('paisabrev') || lowerErrorText.includes('pais_abrev')) {
    fieldName = 'abreviatura';
  } else if (lowerErrorText.includes('empresabrev') || lowerErrorText.includes('empresa_abrev')) {
    fieldName = 'abreviatura de empresa';
  } else if (lowerErrorText.includes('fundoabrev') || lowerErrorText.includes('fundo_abrev')) {
    fieldName = 'abreviatura de fundo';
  } else {
    fieldName = 'campo';
  }
  
  if (length) {
    return `El ${fieldName} excede el límite de ${length} caracteres`;
  } else {
    return `El ${fieldName} excede el límite de caracteres permitido`;
  }
}

// Función principal para manejar errores de inserción
export const handleInsertError = (error: BackendError): ErrorResponse => {
  console.error('Error inserting row:', error);
  console.error('Error response data:', error.response?.data);
  console.error('Error response status:', error.response?.status);
  
  // Obtener el texto del error de todas las fuentes posibles
  const errorText = error.response?.data?.error || error.response?.data?.message || error.message || '';
  
  // 1. PRIMERO: Detectar y convertir errores de longitud (varchar, character varying)
  // Estos errores pueden venir con cualquier código de estado (400, 500, etc.)
  const lengthError = convertLengthError(errorText);
  if (lengthError) {
    return {
      type: 'warning',
      message: lengthError
    };
  }
  
  // 2. PRIMERO: Detectar errores de Row-Level Security (RLS)
  // Estos tienen código 42501 y mensaje "new row violates row-level security policy"
  if (error.response?.data?.code === '42501' || 
      error.response?.status === 403 ||
      errorText.toLowerCase().includes('row-level security') ||
      errorText.toLowerCase().includes('violates row-level security policy')) {
    const tableName = errorText.match(/table "([^"]+)"/)?.[1] || 'la tabla';
    return {
      type: 'error',
      message: `Error de permisos: No tiene permiso para insertar registros en ${tableName}. Contacte al administrador.`
    };
  }
  
  // 3. Detectar errores de clave única
  if (isDuplicateKeyError(error)) {
    const { fieldName } = extractDuplicateKeyInfo(error);
    
    // Simplificar mensajes según el tipo de campo
    let message = '';
    if (fieldName === 'login' || fieldName === 'usuario') {
      message = `El login ya existe`;
    } else if (fieldName === 'pais' || fieldName === 'país') {
      message = `El país se repite`;
    } else if (fieldName === 'paisabrev') {
      message = `La abreviatura se repite`;
    } else if (fieldName === 'empresa') {
      message = `La empresa se repite`;
    } else if (fieldName === 'empresabrev') {
      message = `La abreviatura de empresa se repite`;
    } else if (fieldName === 'fundo') {
      message = `El fundo se repite`;
    } else if (fieldName === 'fundoabrev') {
      message = `La abreviatura de fundo se repite`;
    } else if (fieldName === 'nodo') {
      message = `El nodo se repite`;
    } else if (fieldName === 'metrica' || fieldName === 'métrica') {
      message = `La métrica se repite`;
    } else if (fieldName === 'tipo') {
      message = `El tipo se repite`;
    } else if (fieldName === 'entidad') {
      message = `La entidad se repite`;
    } else {
      // Fallback para otros campos
      message = `Esta entrada ya existe`;
    }
    
    return {
      type: 'warning',
      message
    };
  }
  
  // 4. Detectar errores 500 que podrían ser de clave única (fallback)
  // PERO primero verificar que NO sea un error de RLS
  if (error.response?.status === 500) {
    // Verificar que no sea RLS disfrazado
    if (!errorText.toLowerCase().includes('row-level security') && 
        !errorText.toLowerCase().includes('violates row-level security policy') &&
        (errorText.includes('duplicate') || errorText.includes('unique') || errorText.includes('constraint') || 
         errorText.includes('violates') || errorText.includes('already exists'))) {
      return {
        type: 'warning',
        message: `Alerta: Esta entrada ya existe en el sistema. Verifique que no esté duplicando información.`
      };
    }
  }
  
  // 5. Manejar otros tipos de errores - convertir a warning
  let errorMessage = errorText || 'Error al insertar registro';
  
  // Convertir mensajes técnicos a mensajes amigables en español
  
  // Errores de constraint duplicado
  if (errorMessage.includes('duplicate') || errorMessage.includes('constraint') || 
      errorMessage.includes('violates') || errorMessage.includes('unique')) {
    // Intentar extraer información del constraint
    const constraintMatch = errorMessage.match(/constraint "([^"]+)"/);
    if (constraintMatch) {
      const constraintName = constraintMatch[1];
      if (constraintName.includes('unq_pais')) {
        errorMessage = 'El país o abreviatura se repite';
      } else if (constraintName.includes('unq_empresa')) {
        errorMessage = 'La empresa o abreviatura se repite';
      } else if (constraintName.includes('unq_fundo')) {
        errorMessage = 'El fundo o abreviatura se repite';
      } else {
        errorMessage = 'Esta entrada ya existe';
      }
    }
  }
  // Errores de NOT NULL
  else if (errorMessage.includes('null value') || errorMessage.includes('not null') || 
           errorMessage.includes('violates not-null constraint')) {
    errorMessage = 'Falta completar campos obligatorios';
  }
  // Errores de foreign key
  else if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key constraint')) {
    errorMessage = 'La referencia seleccionada no es válida';
  }
  // Otros errores de constraint
  else if (errorMessage.includes('check constraint') || errorMessage.includes('violates check constraint')) {
    errorMessage = 'El valor ingresado no cumple con las reglas de validación';
  }
  
  return {
    type: 'warning', // Todos los mensajes son warning (amarillo), nunca error (rojo)
    message: errorMessage
  };
};

// Función para manejar errores de actualización (reutiliza la lógica de inserción)
export const handleUpdateError = (error: BackendError): ErrorResponse => {
  console.error('Error updating row:', error);
  console.error('Error response data:', error.response?.data);
  console.error('Error response status:', error.response?.status);
  
  // Obtener el texto del error de todas las fuentes posibles
  const errorText = error.response?.data?.error || error.response?.data?.message || error.message || '';
  
  // 1. PRIMERO: Detectar y convertir errores de longitud (varchar, character varying)
  // Estos errores pueden venir con cualquier código de estado (400, 500, etc.)
  const lengthError = convertLengthError(errorText);
  if (lengthError) {
    return {
      type: 'warning',
      message: lengthError
    };
  }
  
  // 2. Detectar errores de clave única
  if (isDuplicateKeyError(error)) {
    const { fieldName } = extractDuplicateKeyInfo(error);
    
    // Simplificar mensajes según el tipo de campo
    let message = '';
    if (fieldName === 'login' || fieldName === 'usuario') {
      message = `El login ya existe`;
    } else if (fieldName === 'pais' || fieldName === 'país') {
      message = `El país se repite`;
    } else if (fieldName === 'paisabrev') {
      message = `La abreviatura se repite`;
    } else if (fieldName === 'empresa') {
      message = `La empresa se repite`;
    } else if (fieldName === 'empresabrev') {
      message = `La abreviatura de empresa se repite`;
    } else if (fieldName === 'fundo') {
      message = `El fundo se repite`;
    } else if (fieldName === 'fundoabrev') {
      message = `La abreviatura de fundo se repite`;
    } else if (fieldName === 'nodo') {
      message = `El nodo se repite`;
    } else if (fieldName === 'metrica' || fieldName === 'métrica') {
      message = `La métrica se repite`;
    } else if (fieldName === 'tipo') {
      message = `El tipo se repite`;
    } else if (fieldName === 'entidad') {
      message = `La entidad se repite`;
    } else {
      // Fallback para otros campos
      message = `Esta entrada ya existe`;
    }
    
    return {
      type: 'warning',
      message
    };
  }
  
  // 3. Detectar errores 500 que podrían ser de clave única (fallback)
  if (error.response?.status === 500) {
    if (errorText.includes('duplicate') || errorText.includes('unique') || errorText.includes('constraint') || 
        errorText.includes('violates') || errorText.includes('already exists')) {
      return {
        type: 'warning',
        message: `Alerta: Esta entrada ya existe en el sistema. Verifique que no esté duplicando información.`
      };
    }
  }
  
  // 4. Manejar otros tipos de errores - convertir a warning
  let errorMessage = errorText || 'Error al actualizar registro';
  
  // Convertir mensajes técnicos a mensajes amigables en español
  
  // Errores de constraint duplicado
  if (errorMessage.includes('duplicate') || errorMessage.includes('constraint') || 
      errorMessage.includes('violates') || errorMessage.includes('unique')) {
    // Intentar extraer información del constraint
    const constraintMatch = errorMessage.match(/constraint "([^"]+)"/);
    if (constraintMatch) {
      const constraintName = constraintMatch[1];
      if (constraintName.includes('unq_pais')) {
        errorMessage = 'El país o abreviatura se repite';
      } else if (constraintName.includes('unq_empresa')) {
        errorMessage = 'La empresa o abreviatura se repite';
      } else if (constraintName.includes('unq_fundo')) {
        errorMessage = 'El fundo o abreviatura se repite';
      } else {
        errorMessage = 'Esta entrada ya existe';
      }
    }
  }
  // Errores de NOT NULL
  else if (errorMessage.includes('null value') || errorMessage.includes('not null') || 
           errorMessage.includes('violates not-null constraint')) {
    errorMessage = 'Falta completar campos obligatorios';
  }
  // Errores de foreign key
  else if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key constraint')) {
    errorMessage = 'La referencia seleccionada no es válida';
  }
  // Otros errores de constraint
  else if (errorMessage.includes('check constraint') || errorMessage.includes('violates check constraint')) {
    errorMessage = 'El valor ingresado no cumple con las reglas de validación';
  }
  
  return {
    type: 'warning', // Todos los mensajes son warning (amarillo), nunca error (rojo)
    message: errorMessage
  };
};

// Función para manejar errores de inserción múltiple
export const handleMultipleInsertError = (error: BackendError, entityType: string): ErrorResponse => {
  console.error(`Error inserting multiple ${entityType}:`, error);
  console.error('Error response data:', error.response?.data);
  console.error('Error response status:', error.response?.status);
  
  // Detectar errores de clave única
  if (isDuplicateKeyError(error)) {
    const { fieldName } = extractDuplicateKeyInfo(error);
    
    // Simplificar mensajes según el tipo de campo
    let message = '';
    if (fieldName === 'login' || fieldName === 'usuario') {
      message = `El login ya existe`;
    } else if (fieldName === 'pais') {
      message = `El país se repite`;
    } else if (fieldName === 'empresa') {
      message = `La empresa se repite`;
    } else if (fieldName === 'fundo') {
      message = `El fundo se repite`;
    } else if (fieldName === 'nodo') {
      message = `El nodo se repite`;
    } else if (fieldName === 'metrica') {
      message = `La métrica se repite`;
    } else if (fieldName === 'tipo') {
      message = `El tipo se repite`;
    } else if (fieldName === 'entidad') {
      message = `La entidad se repite`;
    } else {
      // Fallback para otros campos
      message = `Esta entrada ya existe`;
    }
    
    return {
      type: 'warning',
      message
    };
  }
  
  // Manejar otros tipos de errores - convertir a warning
  const errorText = error.response?.data?.error || error.response?.data?.message || error.message || '';
  
  // Verificar primero errores de longitud
  const lengthError = convertLengthError(errorText);
  if (lengthError) {
    return {
      type: 'warning',
      message: lengthError
    };
  }
  
  let errorMessage = errorText || `Error al crear ${entityType} múltiples`;
  
  // Convertir mensaje técnico a mensaje amigable si contiene "duplicate" o "constraint"
  if (errorMessage.includes('duplicate') || errorMessage.includes('constraint') || 
      errorMessage.includes('violates') || errorMessage.includes('unique')) {
    errorMessage = `Algunos ${entityType} ya existen`;
  }
  
  return {
    type: 'warning', // Todos los mensajes son warning (amarillo), nunca error (rojo)
    message: errorMessage
  };
};
