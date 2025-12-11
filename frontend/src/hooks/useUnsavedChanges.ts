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
    
    // Debug: Log para entender qué está pasando
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Change detection:', {
        selectedTable,
        activeSubTab,
        formDataKeys: Object.keys(formData),
        formDataValues: Object.entries(formData).filter(([k, v]) => {
          const val = v;
          return val !== null && val !== undefined && val !== '' && val !== 1;
        }).map(([k, v]) => `${k}: ${v}`),
        multipleDataLength: multipleData.length
      });
    }
    
    // Verificar pestaña "Crear"
    if (activeSubTab === 'insert') {
      // Para formularios normales (no múltiples)
      if (selectedTable !== 'usuarioperfil' && selectedTable !== 'metricasensor' && selectedTable !== 'sensor') {
        // Campos que siempre deben ser excluidos (campos de auditoría y referenciales que no son editables)
        const alwaysExcludedFields = [
          'usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified',
          'modified_at', 'modified_by', 'auditid'
        ];
        
        // Campos referenciales que no deben considerarse para detección de cambios
        // Solo excluir IDs de relaciones que no son editables directamente
        let referentialIdFields: string[] = [];
        
        // Para cada tabla, solo excluir los IDs de relaciones que no son campos de entrada directos
        // Por ejemplo, en 'pais', 'paisid' no es editable (es auto-generado), pero 'pais' y 'paisabrev' sí lo son
        if (selectedTable === 'pais') {
          // En pais, solo 'pais' y 'paisabrev' son editables
          referentialIdFields = ['paisid', 'empresaid', 'fundoid', 'entidadid'];
        } else if (selectedTable === 'empresa') {
          // En empresa, 'empresa' y 'empresabrev' son editables, pero 'paisid' es una relación
          referentialIdFields = ['empresaid', 'fundoid', 'entidadid'];
        } else if (selectedTable === 'fundo') {
          // En fundo, 'fundo' y 'fundoabrev' son editables
          referentialIdFields = ['fundoid', 'entidadid'];
        } else {
          // Para otras tablas, excluir solo IDs de relaciones que no son editables
          referentialIdFields = ['paisid', 'empresaid', 'fundoid', 'entidadid'];
        }
        
        const hasChanges = Object.keys(formData).some(key => {
          const value = formData[key];
          
          // Excluir campos de auditoría
          if (alwaysExcludedFields.includes(key)) {
            return false;
          }
          
          // Excluir IDs de relaciones que no son editables (pero NO excluir los campos de texto editables)
          if (referentialIdFields.includes(key)) {
            return false;
          }
          
          // Excluir statusid si es 1 (valor por defecto)
          if (key === 'statusid') {
            return value !== 1 && value !== null && value !== undefined;
          }
          
          // Verificar si hay datos significativos
          if (typeof value === 'string' && value.trim() !== '') {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Cambio detectado en campo string: ${key} = "${value}"`);
            }
            return true;
          }
          if (typeof value === 'number' && value !== null && value !== undefined && value !== 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Cambio detectado en campo number: ${key} = ${value}`);
            }
            return true;
          }
          if (Array.isArray(value) && value.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Cambio detectado en campo array: ${key} = [${value.length} items]`);
            }
            return true;
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const hasObjectData = Object.keys(value).some(objKey => {
              const objValue = value[objKey];
              return objValue !== null && objValue !== undefined && objValue !== '';
            });
            if (hasObjectData && process.env.NODE_ENV === 'development') {
              console.log(`✅ Cambio detectado en campo object: ${key}`);
            }
            return hasObjectData;
          }
          if (typeof value === 'boolean' && value === true) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Cambio detectado en campo boolean: ${key} = true`);
            }
            return true;
          }
          
          return false;
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Change detection result: {hasFormDataChanges: ${hasChanges}, hasMultipleDataChanges: false, hasMassiveFormDataChanges: false, result: ${hasChanges}}`);
        }
        
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
