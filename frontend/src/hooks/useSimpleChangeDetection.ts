import { useCallback } from 'react';

export const useSimpleChangeDetection = () => {
  const hasSignificantChanges = useCallback((
    formData: Record<string, any>,
    selectedTable: string,
    activeSubTab: string,
    multipleData: any[] = [],
    massiveFormData: Record<string, any> = {}
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
          return ['nombre'];
        case 'contacto':
          return ['usuarioid', 'medioid', 'celular', 'correo'];
        case 'perfil':
          return ['perfil', 'perfilabrev'];
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
      }
      
      return hasValue;
    });

    // Para formularios múltiples, verificar si hay datos
    const hasMultipleDataChanges = (() => {
      if (selectedTable === 'sensor' && activeSubTab === 'massive') {
        // Para sensor masivo, solo verificar si hay nodo seleccionado
        const hasNodo = formData.nodoid && formData.nodoid !== null;
        return hasNodo;
      }
      
      if (selectedTable === 'metricasensor' && activeSubTab === 'massive') {
        // Para metricasensor masivo, solo verificar si hay entidad seleccionada
        const hasEntidad = formData.entidadid && formData.entidadid !== null;
        return hasEntidad;
      }
      
      // Para sensor y metricasensor en pestaña "Crear", verificar estados específicos
      if (selectedTable === 'sensor' && activeSubTab === 'insert') {
        // Verificar si multipleData tiene la estructura extendida
        if (multipleData && typeof multipleData === 'object' && !Array.isArray(multipleData) && (multipleData as any).sensorStates) {
          const { selectedNodo } = (multipleData as any).sensorStates;
          const hasChanges = selectedNodo !== '';
          return hasChanges;
        } else {
          // Fallback: verificar datos múltiples tradicionales
          const hasMultiple = Array.isArray(multipleData) && multipleData.length > 0;
          return hasMultiple;
        }
      }
      
      if (selectedTable === 'metricasensor' && activeSubTab === 'insert') {
        // Verificar si multipleData tiene la estructura extendida
        if (multipleData && typeof multipleData === 'object' && !Array.isArray(multipleData) && (multipleData as any).metricasensorStates) {
          const { selectedEntidadMetrica } = (multipleData as any).metricasensorStates;
          const hasChanges = selectedEntidadMetrica !== '';
          return hasChanges;
        } else {
          // Fallback: verificar datos múltiples tradicionales
          const hasMultiple = Array.isArray(multipleData) && multipleData.length > 0;
          return hasMultiple;
        }
      }
      
      // Para otros casos, verificar si hay datos múltiples
      const hasMultiple = multipleData && multipleData.length > 0;
      return hasMultiple;
    })();

    // Para formularios masivos, verificar si hay datos
    let hasMassiveFormDataChanges = false;
    if (activeSubTab === 'massive' && massiveFormData.hasData) {
      hasMassiveFormDataChanges = true;
    }

    console.log('🔍 Change detection result:', {
      hasFormDataChanges,
      hasMultipleDataChanges,
      hasMassiveFormDataChanges,
      result: hasFormDataChanges || hasMultipleDataChanges || hasMassiveFormDataChanges
    });

    return hasFormDataChanges || hasMultipleDataChanges || hasMassiveFormDataChanges;
  }, []);

  return { hasSignificantChanges };
};
