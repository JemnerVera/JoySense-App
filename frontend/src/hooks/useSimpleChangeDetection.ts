import { useCallback } from 'react';

export const useSimpleChangeDetection = () => {
  const hasSignificantChanges = useCallback((
    formData: Record<string, any>,
    selectedTable: string,
    activeSubTab: string,
    multipleData: any[] = []
  ): boolean => {
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
          return ['entidadid', 'ubicacionid', 'nodoid'];
        case 'entidad':
          return ['entidad', 'entidadabrev'];
        case 'nodo':
          return ['nodo', 'nodoabrev'];
        case 'sensor':
          return ['nodoid', 'tipoid'];
        case 'metrica':
          return ['metrica', 'metricaabrev'];
        case 'tipo':
          return ['entidadid', 'tipo'];
        case 'medicion':
          return ['medicion', 'medicionabrev'];
        case 'umbral':
          return ['ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'tipoid'];
        case 'alerta':
          return ['alerta', 'alertaabrev'];
        case 'usuario':
          return ['usuario', 'usuarioabrev'];
        case 'medio':
          return ['medio', 'medioabrev'];
        case 'contacto':
          return ['contacto', 'contactoabrev'];
        case 'metricasensor':
          return ['nodoid', 'metricaid', 'tipoid'];
        case 'perfilumbral':
          return ['perfilid', 'umbralid'];
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
    console.log(`🔍 Verificando campos significativos para ${selectedTable}:`, significantFields);
    console.log(`🔍 formData recibido:`, formData);

    // Verificar si hay cambios en los campos significativos
    const hasFormDataChanges = significantFields.some(field => {
      const value = formData[field];
      const hasValue = (
        (typeof value === 'string' && value.trim() !== '') ||
        (typeof value === 'number') ||
        (typeof value === 'boolean')
      );
      
      // Log temporal para debuggear
      if (hasValue) {
        console.log(`🔍 Campo ${field} tiene valor:`, value);
      }
      
      return hasValue;
    });

    // Para formularios múltiples, verificar si hay datos
    const hasMultipleDataChanges = multipleData.length > 0;

    return hasFormDataChanges || hasMultipleDataChanges;
  }, []);

  return { hasSignificantChanges };
};
