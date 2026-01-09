import { useCallback } from 'react';
import { getTableConfig } from '../config/tables.config';

export const useSimpleChangeDetection = () => {
  const hasSignificantChanges = useCallback((
    formData: Record<string, any>,
    selectedTable: string,
    activeSubTab: string,
    multipleData: any[] = [],
    massiveFormData: Record<string, any> = {}
  ): boolean => {
    // Verificar cambios en pestañas de inserción, masivo o actualizar
    if (activeSubTab !== 'insert' && activeSubTab !== 'massive' && activeSubTab !== 'update') {
      return false;
    }
    
    // Para update: verificar si formData tiene datos reales (no es solo el marcador)
    if (activeSubTab === 'update') {
      console.log('[useSimpleChangeDetection] Verificando cambios en update - formData:', formData);
      if (!formData || Object.keys(formData).length === 0) {
        console.log('[useSimpleChangeDetection] No hay formData o está vacío');
        return false;
      }
      // Si es el marcador de formulario abierto sin cambios, no hay cambios
      if (formData.__formOpen === true && formData.__hasChanges === false) {
        console.log('[useSimpleChangeDetection] Es marcador sin cambios - retornando false');
        return false;
      }
      // Si tiene datos reales (no es el marcador), hay cambios
      // Excluir el marcador de las keys para verificar si hay datos reales
      const realKeys = Object.keys(formData).filter(key => key !== '__formOpen' && key !== '__hasChanges');
      const hasChanges = realKeys.length > 0;
      console.log('[useSimpleChangeDetection] realKeys:', realKeys, 'hasChanges:', hasChanges);
      return hasChanges;
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
          return ['tipoid'];
        case 'metrica':
          return ['metrica', 'metricaabrev'];
        case 'tipo':
          return ['tipo'];
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
          return ['sensorid', 'metricaid'];
        // perfilumbral ya no existe - reemplazado por regla_perfil y regla_umbral
        case 'auditlogumbral':
          return ['auditlogumbral', 'auditlogumbralabrev'];
        case 'criticidad':
          return ['criticidad', 'criticidadabrev'];
        case 'status':
          return ['status', 'statusabrev'];
        case 'regla':
          return ['nombre', 'prioridad', 'ventana', 'cooldown', 'criticidadid'];
        case 'regla_perfil':
          return ['reglaid', 'perfilid'];
        case 'regla_umbral':
          return ['reglaid', 'umbralid', 'operador_logico', 'orden'];
        case 'regla_objeto':
          return ['reglaid', 'origenid', 'fuenteid', 'objetoid'];
        default:
          return [];
      }
    };

    const significantFields = getSignificantFields(selectedTable);
    const alwaysExcludedFields = [
      'usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified',
      'modified_at', 'modified_by', 'auditid'
    ];

    // Verificar si hay cambios en CUALQUIER campo con datos (más robusto)
    // Primero verificar campos significativos, luego todos los demás
    const hasFormDataChanges = (() => {
      // Verificar TODOS los campos (excepto campos de auditoría)
      // Esto es más robusto que solo verificar campos significativos
      // IMPORTANTE: Solo detectar cambios si hay datos REALES ingresados por el usuario
      const changes: string[] = [];
      
      Object.keys(formData).forEach(key => {
        // Excluir campos de auditoría
        if (alwaysExcludedFields.includes(key)) {
          return;
        }
        
        const value = formData[key];
        
        // Excluir statusid si es 1 (valor por defecto ACTIVO) - no cuenta como cambio
        if (key === 'statusid') {
          if (value !== 1 && value !== null && value !== undefined) {
            changes.push(key);
          }
          return;
        }
        
        // Verificar si hay datos significativos (solo valores que el usuario haya ingresado)
        // Strings: debe tener contenido real (no solo espacios)
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed !== '' && trimmed.length > 0) {
            changes.push(key);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ [useSimpleChangeDetection] Cambio detectado en campo string: ${key} = "${value}"`);
            }
          }
          return;
        }
        
        // Numbers: debe ser un número válido y diferente de 0 (a menos que sea un ID válido)
        // Para foreign keys, 0 generalmente significa "no seleccionado", así que no cuenta como cambio
        // IMPORTANTE: Excluir valores por defecto de la tabla (ej: escalamiento = 2 en criticidad)
        if (typeof value === 'number') {
          // PRIMERO: Verificar si es un valor por defecto de la tabla (antes de cualquier otra verificación)
          const config = getTableConfig(selectedTable);
          if (config) {
            const fieldConfig = config.fields.find(f => f.name === key);
            if (fieldConfig && fieldConfig.defaultValue !== undefined && value === fieldConfig.defaultValue) {
              // Es un valor por defecto, no contar como cambio
              console.log(`⚠️ [useSimpleChangeDetection] Ignorando valor por defecto: ${key} = ${value} (defaultValue: ${fieldConfig.defaultValue})`);
              return;
            }
          }
          
          // Si el campo termina en 'id', es un foreign key
          if (key.endsWith('id')) {
              // En formularios de inserción, verificar si hay datos relacionados ingresados
              // Solo considerar cambio si hay datos de texto o boolean ingresados por el usuario
              if (activeSubTab === 'insert') {
                // Verificar si hay datos en los campos relacionados (no foreign keys)
                // Si todos los campos de texto están vacíos, probablemente es un valor por defecto
                const hasRelatedData = Object.keys(formData).some(otherKey => {
                  if (otherKey === key || otherKey.endsWith('id') || alwaysExcludedFields.includes(otherKey)) {
                    return false;
                  }
                  const otherValue = formData[otherKey];
                  if (typeof otherValue === 'string' && otherValue.trim() !== '') {
                    return true;
                  }
                  if (typeof otherValue === 'boolean' && otherValue === true) {
                    return true;
                  }
                  return false;
                });
                
                if (hasRelatedData && value > 0 && value !== null && value !== undefined) {
                  changes.push(key);
                  console.log(`✅ [useSimpleChangeDetection] Cambio detectado en campo foreign key (insert): ${key} = ${value} (hay datos relacionados)`);
                } else if (value > 0 && value !== null && value !== undefined) {
                  console.log(`⚠️ [useSimpleChangeDetection] Foreign key ${key} = ${value} pero no hay datos relacionados, ignorando como valor por defecto`);
                }
              } else {
              // Para otras pestañas (update, etc.), verificar si hay datos relacionados
              // Solo considerar cambio si es > 0 Y hay datos relacionados ingresados
              // Por ejemplo, si paisid > 0 pero pais y paisabrev están vacíos, es un valor por defecto
              if (value > 0 && value !== null && value !== undefined) {
                // Verificar si hay datos en los campos relacionados (no foreign keys)
                // Si todos los campos de texto están vacíos, probablemente es un valor por defecto
                const hasRelatedData = Object.keys(formData).some(otherKey => {
                  if (otherKey === key || otherKey.endsWith('id') || alwaysExcludedFields.includes(otherKey)) {
                    return false;
                  }
                  const otherValue = formData[otherKey];
                  if (typeof otherValue === 'string' && otherValue.trim() !== '') {
                    return true;
                  }
                  if (typeof otherValue === 'number' && otherValue > 0 && !otherKey.endsWith('id')) {
                    return true;
                  }
                  if (typeof otherValue === 'boolean' && otherValue === true) {
                    return true;
                  }
                  return false;
                });
                
                if (hasRelatedData) {
                  changes.push(key);
                  console.log(`✅ [useSimpleChangeDetection] Cambio detectado en campo foreign key: ${key} = ${value} (hay datos relacionados)`);
                } else {
                  console.log(`⚠️ [useSimpleChangeDetection] Foreign key ${key} = ${value} pero no hay datos relacionados, ignorando como valor por defecto`);
                }
              }
            }
            return;
          }
          // Para otros números, verificar si es un valor por defecto antes de contar como cambio
          // Si no es un valor por defecto y es válido, contar como cambio
          if (value !== null && value !== undefined && value !== 0) {
            // Verificar nuevamente si es un valor por defecto (por si acaso no se detectó antes)
            const config = getTableConfig(selectedTable);
            if (config) {
              const fieldConfig = config.fields.find(f => f.name === key);
              if (fieldConfig && fieldConfig.defaultValue !== undefined && value === fieldConfig.defaultValue) {
                // Es un valor por defecto, no contar como cambio
                console.log(`⚠️ [useSimpleChangeDetection] Ignorando valor por defecto en número: ${key} = ${value} (defaultValue: ${fieldConfig.defaultValue})`);
                return;
              }
            }
            changes.push(key);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ [useSimpleChangeDetection] Cambio detectado en campo number: ${key} = ${value}`);
            }
          }
          return;
        }
        
        // Boolean: solo true cuenta como cambio (false es el valor por defecto)
        if (typeof value === 'boolean') {
          if (value === true) {
            changes.push(key);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ [useSimpleChangeDetection] Cambio detectado en campo boolean: ${key} = true`);
            }
          }
          return;
        }
        
        // Arrays: debe tener elementos
        if (Array.isArray(value)) {
          if (value.length > 0) {
            changes.push(key);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ [useSimpleChangeDetection] Cambio detectado en campo array: ${key} = [${value.length} items]`);
            }
          }
          return;
        }
      });
      
      // Si solo hay statusid con valor 1 (ACTIVO por defecto) y ningún otro cambio, no hay cambios reales
      // Verificar si todos los cambios son solo statusid=1
      const hasOnlyStatusId = changes.length === 0 || 
        (changes.length === 1 && changes.includes('statusid') && formData.statusid === 1) ||
        (changes.length > 0 && changes.every(key => key === 'statusid') && formData.statusid === 1);
      
      if (hasOnlyStatusId) {
        return false;
      }
      
      return changes.length > 0;
    })();

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

    // Siempre loggear para regla_perfil y regla_objeto para debugging
    const shouldLog = process.env.NODE_ENV === 'development' || 
      selectedTable === 'regla_perfil' || 
      selectedTable === 'regla_objeto' ||
      selectedTable === 'regla' ||
      selectedTable === 'regla_umbral';
    
    if (shouldLog) {
      console.log('🔍 [useSimpleChangeDetection] Change detection result:', {
        selectedTable,
        activeSubTab,
        formDataKeys: Object.keys(formData),
        formDataValues: Object.entries(formData).filter(([k, v]) => {
          const val = v;
          return val !== null && val !== undefined && val !== '' && val !== 0 && val !== 1;
        }).map(([k, v]) => `${k}: ${v}`),
        significantFields,
        hasFormDataChanges,
        hasMultipleDataChanges,
        hasMassiveFormDataChanges,
        result: hasFormDataChanges || hasMultipleDataChanges || hasMassiveFormDataChanges
      });
    }

    return hasFormDataChanges || hasMultipleDataChanges || hasMassiveFormDataChanges;
  }, []);

  return { hasSignificantChanges };
};
