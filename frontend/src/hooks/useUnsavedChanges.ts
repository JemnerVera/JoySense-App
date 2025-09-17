import { useCallback } from 'react';

export interface UnsavedChangesConfig {
  formData: Record<string, any>;
  selectedTable: string;
  activeSubTab: string;
  multipleData?: any[];
}

export const useUnsavedChanges = () => {
  const hasUnsavedChanges = useCallback((config: UnsavedChangesConfig): boolean => {
    const { formData, selectedTable, activeSubTab, multipleData = [] } = config;
    
    console.log('🔍 hasUnsavedChanges - activeSubTab:', activeSubTab, 'selectedTable:', selectedTable);
    console.log('🔍 formData:', formData);
    console.log('🔍 formData keys:', Object.keys(formData));
    console.log('🔍 formData values:', Object.values(formData));
    console.log('🔍 multipleData:', multipleData);
    
    // Verificar pestaña "Crear"
    if (activeSubTab === 'insert') {
      // Para formularios normales (no múltiples)
      if (selectedTable !== 'usuarioperfil' && selectedTable !== 'metricasensor' && selectedTable !== 'sensor') {
        // Campos referenciales que no deben considerarse para detección de cambios
        // Definir campos referenciales específicos por tabla
        let referentialFields: string[] = [];
        
        if (selectedTable === 'pais') {
          // Para pais: pais y paisabrev son campos de entrada
          referentialFields = ['paisid', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];
          console.log('🔍 Pais table - referentialFields:', referentialFields);
        } else if (selectedTable === 'fundo') {
          // Para fundo: fundo y fundoabrev son campos de entrada
          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'entidadid', 'entidad'];
        } else if (selectedTable === 'ubicacion') {
          // Para ubicacion: ubicacion es campo de entrada
          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];
        } else if (selectedTable === 'localizacion') {
          // Para localizacion: localizacion es campo de entrada
          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];
        } else if (selectedTable === 'entidad') {
          // Para entidad: entidad es campo de entrada
          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid'];
        } else {
          // Para otras tablas, usar la lista completa
          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];
        }
        
        const hasChanges = Object.keys(formData).some(key => {
          const value = formData[key];
          
          console.log(`🔍 Checking field: ${key} = ${value} (type: ${typeof value})`);
          
          // Excluir campos referenciales
          if (referentialFields.includes(key)) {
            console.log(`🔍 Excluding referential field: ${key}`);
            return false;
          }
          
          // Log específico para campos de país
          if (selectedTable === 'pais' && (key === 'pais' || key === 'paisabrev')) {
            console.log(`🔍 Pais field check: ${key} = "${value}" (length: ${value?.length || 0})`);
          }
          
          // Excluir statusid si es 1 (valor por defecto)
          if (key === 'statusid') {
            const hasStatusChange = value !== 1;
            console.log(`🔍 Status field: ${key} = ${value}, hasChange: ${hasStatusChange}`);
            return hasStatusChange;
          }
          
          // Verificar si hay datos significativos
          if (typeof value === 'string' && value.trim() !== '') {
            console.log(`🔍 String field with data: ${key} = "${value}"`);
            return true;
          }
          if (typeof value === 'number' && value !== null && value !== undefined) {
            console.log(`🔍 Number field with data: ${key} = ${value}`);
            return true;
          }
          if (Array.isArray(value) && value.length > 0) {
            console.log(`🔍 Array field with data: ${key} = [${value.length} items]`);
            return true;
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const hasObjectData = Object.keys(value).some(objKey => {
              const objValue = value[objKey];
              return objValue !== null && objValue !== undefined && objValue !== '';
            });
            console.log(`🔍 Object field: ${key}, hasData: ${hasObjectData}`);
            return hasObjectData;
          }
          if (typeof value === 'boolean' && value === true) {
            console.log(`🔍 Boolean field true: ${key} = ${value}`);
            return true;
          }
          
          console.log(`🔍 No significant data in field: ${key}`);
          return false;
        });
        
        console.log(`🔍 Form has changes: ${hasChanges}`);
        return hasChanges;
      }
      
      // Para formularios múltiples
      if (selectedTable === 'usuarioperfil' || selectedTable === 'metricasensor' || selectedTable === 'sensor') {
        return multipleData.length > 0;
      }
    }
    
    // Verificar pestaña "Actualizar"
    if (activeSubTab === 'update') {
      return Object.keys(formData).some(key => {
        const value = formData[key];
        return value !== null && value !== undefined && value !== '';
      });
    }
    
    // Verificar pestaña "Masivo"
    if (activeSubTab === 'massive') {
      if (selectedTable === 'umbral') {
        return multipleData.length > 0;
      }
      if (selectedTable === 'sensor') {
        return multipleData.length > 0;
      }
      if (selectedTable === 'metricasensor') {
        return multipleData.length > 0;
      }
    }
    
    return false;
  }, []);

  return { hasUnsavedChanges };
};
