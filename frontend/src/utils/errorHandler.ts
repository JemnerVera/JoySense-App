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
  
  console.log('🔍 Debug - Constraint name:', constraintName);
  console.log('🔍 Debug - Details:', details);
  console.log('🔍 Debug - Error text:', errorText);
  
  // Determinar qué campo está causando el conflicto
  let fieldName = 'campo';
  
  if (constraintName.includes('_pkey') || constraintName.includes('pk_')) {
    fieldName = 'clave primaria';
  } else if (constraintName.includes('unq_')) {
    // Para constraints como "unq_entidad", extraer el nombre de la tabla
    if (constraintName.startsWith('unq_')) {
      const tableName = constraintName.substring(4); // Remover "unq_"
      fieldName = tableName; // Usar el nombre de la tabla como nombre del campo
    }
    
    // También intentar extraer de los detalles si está disponible
    const detailsMatch = details.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
    if (detailsMatch && detailsMatch[1]) {
      fieldName = detailsMatch[1]; // Usar el nombre del campo de los detalles
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
    'localizacion': 'localización'
  };
  
  // Aplicar mapeo si existe
  if (fieldNameMapping[fieldName]) {
    fieldName = fieldNameMapping[fieldName];
  }
  
  console.log('🔍 Debug - Field name:', fieldName);
  console.log('🔍 Debug - Conflicting value:', conflictingValue);
  
  return { fieldName, conflictingValue };
};

// Función principal para manejar errores de inserción
export const handleInsertError = (error: BackendError): ErrorResponse => {
  console.error('Error inserting row:', error);
  console.error('Error response data:', error.response?.data);
  console.error('Error response status:', error.response?.status);
  
  // Detectar errores de clave única
  if (isDuplicateKeyError(error)) {
    const { fieldName, conflictingValue } = extractDuplicateKeyInfo(error);
    
    // Mejorar el mensaje para evitar repetición de "campo"
    let displayFieldName = fieldName;
    if (fieldName === 'campo' && conflictingValue !== 'valor duplicado') {
      // Si tenemos el valor pero no el nombre del campo, usar el valor como referencia
      displayFieldName = 'entidad';
    }
    
    return {
      type: 'warning',
      message: `⚠️ Alerta: Esta entrada se repite en el campo "${displayFieldName}" (${conflictingValue}). Verifique que no esté duplicando información.`
    };
  }
  
  // Detectar errores 500 que podrían ser de clave única (fallback)
  if (error.response?.status === 500) {
    const errorText = error.response?.data?.error || error.message || '';
    console.log('🔍 Error 500 - Error text:', errorText);
    console.log('🔍 Error 500 - Full response:', error.response);
    
    if (errorText.includes('duplicate') || errorText.includes('unique') || errorText.includes('constraint') || 
        errorText.includes('violates') || errorText.includes('already exists')) {
      return {
        type: 'warning',
        message: `⚠️ Alerta: Esta entrada ya existe en el sistema. Verifique que no esté duplicando información.`
      };
    }
    
    // Si es un error 500 genérico, mostrar un mensaje más específico
    return {
      type: 'warning',
      message: `⚠️ Alerta: No se pudo guardar la información. Verifique que todos los campos estén completos y que no haya duplicados.`
    };
  }
  
  // Manejar otros tipos de errores
  let errorMessage = 'Error al insertar registro';
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.response?.data?.error) {
    errorMessage = error.response.data.error;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return {
    type: 'error',
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
    const { fieldName, conflictingValue } = extractDuplicateKeyInfo(error);
    
    // Mejorar el mensaje para evitar repetición de "campo"
    let displayFieldName = fieldName;
    if (fieldName === 'campo' && conflictingValue !== 'valor duplicado') {
      // Si tenemos el valor pero no el nombre del campo, usar el valor como referencia
      displayFieldName = 'entidad';
    }
    
    return {
      type: 'warning',
      message: `⚠️ Alerta: Esta entrada se repite en el campo "${displayFieldName}" (${conflictingValue}). Verifique que no esté duplicando información.`
    };
  }
  
  // Manejar otros tipos de errores
  let errorMessage = `Error al crear ${entityType} múltiples`;
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.response?.data?.error) {
    errorMessage = error.response.data.error;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return {
    type: 'error',
    message: errorMessage
  };
};
