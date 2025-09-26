// Función simple para detectar cambios sin usar hooks complejos
export const hasSignificantChanges = (
  formData: Record<string, any>,
  selectedTable: string,
  activeSubTab: string,
  multipleData: any[] = [],
  massiveFormData: Record<string, any> = {}
): boolean => {
  console.log('🔍 hasSignificantChanges called:', {
    formData,
    selectedTable,
    activeSubTab,
    multipleData,
    massiveFormData
  });

  // Solo verificar cambios en pestañas de inserción o masivo
  if (activeSubTab !== 'insert' && activeSubTab !== 'massive') {
    return false;
  }

  // Definir campos específicos para cada tabla que deben considerarse como "cambios"
  const getSignificantFields = (table: string): string[] => {
    switch (table) {
      case 'pais':
        return ['pais', 'paisabrev'];
      case 'empresa':
        return ['empresa', 'empresaabrev'];
      case 'fundo':
        return ['fundo', 'fundoabrev'];
      case 'ubicacion':
        return ['ubicacion', 'ubicacionabrev'];
      case 'localizacion':
        return ['localizacion', 'localizacionabrev'];
      case 'entidad':
        return ['entidad', 'entidadabrev'];
      case 'nodo':
        return ['nodo', 'nodoabrev'];
      case 'sensor':
        return ['sensor', 'sensorabrev'];
      case 'metrica':
        return ['metrica', 'metricaabrev'];
      case 'tipo':
        return ['tipo', 'tipoabrev'];
      case 'medicion':
        return ['medicion', 'medicionabrev'];
      case 'umbral':
        return ['umbral', 'umbralabrev'];
      case 'alerta':
        return ['alerta', 'alertaabrev'];
      case 'usuario':
        return ['usuario', 'usuarioabrev'];
      case 'medio':
        return ['medio', 'medioabrev'];
      case 'contacto':
        return ['contacto', 'contactoabrev'];
      case 'metricasensor':
        return ['metricasensor', 'metricasensorabrev'];
      case 'perfilumbral':
        return ['perfilumbral', 'perfilumbralabrev'];
      case 'auditlogumbral':
        return ['auditlogumbral', 'auditlogumbralabrev'];
      case 'criticidad':
        return ['criticidad', 'criticidadabrev'];
      case 'status':
        return ['status', 'statusabrev'];
      default:
        return [];
    }
  };

  const significantFields = getSignificantFields(selectedTable);

  // Verificar si hay cambios en los campos significativos
  const hasFormDataChanges = significantFields.some(field => {
    const value = formData[field];
    return value !== null && value !== undefined && value !== '';
  });

  // Para formularios múltiples, verificar si hay datos
  const hasMultipleDataChanges = multipleData.length > 0;

  // Para formularios masivos, verificar si hay datos
  let hasMassiveFormDataChanges = false;
  if (activeSubTab === 'massive' && massiveFormData.hasData) {
    hasMassiveFormDataChanges = true;
  }

  console.log('🔍 Change detection result:', {
    significantFields,
    hasFormDataChanges,
    hasMultipleDataChanges,
    hasMassiveFormDataChanges,
    result: hasFormDataChanges || hasMultipleDataChanges || hasMassiveFormDataChanges
  });

  return hasFormDataChanges || hasMultipleDataChanges || hasMassiveFormDataChanges;
};
