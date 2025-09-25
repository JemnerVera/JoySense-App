/**
 * Utilidades para inicialización de formularios
 */

/**
 * Inicializa los datos del formulario basándose en las columnas de la tabla
 */
export function initializeFormData(cols?: any[]): Record<string, any> {
  if (!cols) return {};
  
  const formData: Record<string, any> = {};
  
  cols.forEach(col => {
    // Inicializar campos según su tipo
    switch (col.type) {
      case 'boolean':
        formData[col.name] = false;
        break;
      case 'number':
        formData[col.name] = col.nullable ? null : 0;
        break;
      case 'date':
        formData[col.name] = col.nullable ? null : new Date().toISOString().split('T')[0];
        break;
      case 'timestamp':
        formData[col.name] = col.nullable ? null : new Date().toISOString();
        break;
      default:
        formData[col.name] = col.nullable ? null : '';
    }
  });
  
  return formData;
}

/**
 * Inicializa datos de formulario con valores por defecto específicos
 */
export function initializeFormDataWithDefaults(
  cols: any[],
  defaults: Record<string, any> = {}
): Record<string, any> {
  const formData = initializeFormData(cols);
  
  // Aplicar valores por defecto
  Object.keys(defaults).forEach(key => {
    if (formData.hasOwnProperty(key)) {
      formData[key] = defaults[key];
    }
  });
  
  return formData;
}

/**
 * Limpia los datos del formulario, manteniendo solo los campos requeridos
 */
export function clearFormData(
  cols: any[],
  keepFields: string[] = []
): Record<string, any> {
  const formData: Record<string, any> = {};
  
  cols.forEach(col => {
    if (keepFields.includes(col.name)) {
      // Mantener el valor actual o inicializar
      formData[col.name] = initializeFormData([col])[col.name];
    } else {
      // Limpiar el campo
      formData[col.name] = col.nullable ? null : '';
    }
  });
  
  return formData;
}
