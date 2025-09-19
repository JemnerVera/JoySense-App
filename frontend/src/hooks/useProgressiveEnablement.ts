import { useCallback } from 'react';

export interface UseProgressiveEnablementReturn {
  isFieldEnabled: (columnName: string) => boolean;
  getEnabledFields: () => string[];
  getDisabledFields: () => string[];
  getRequiredFields: () => string[];
  getOptionalFields: () => string[];
}

/**
 * Hook personalizado para manejar la habilitación progresiva de campos
 * Extrae la lógica compleja de habilitación del componente principal
 */
export const useProgressiveEnablement = (
  selectedTable: string, 
  formData: Record<string, any>
): UseProgressiveEnablementReturn => {
  
  /**
   * Determina si un campo debe estar habilitado basado en la lógica de habilitación progresiva
   */
  const isFieldEnabled = useCallback((columnName: string): boolean => {
    console.log('🔍 useProgressiveEnablement.isFieldEnabled - selectedTable:', selectedTable);
    console.log('🔍 useProgressiveEnablement.isFieldEnabled - columnName:', columnName);
    console.log('🔍 useProgressiveEnablement.isFieldEnabled - formData:', formData);
    
    // Para País: solo habilitar paisabrev si pais tiene valor
    if (selectedTable === 'pais') {
      if (columnName === 'paisabrev') {
        const enabled = !!(formData.pais && formData.pais.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - pais paisabrev enabled:', enabled);
        return enabled;
      }
      if (columnName === 'pais') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - pais pais enabled: true');
        return true; // Siempre habilitado
      }
    }
    
    // Para Empresa: solo habilitar empresabrev si empresa tiene valor
    if (selectedTable === 'empresa') {
      if (columnName === 'empresabrev') {
        const enabled = !!(formData.empresa && formData.empresa.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - empresa empresabrev enabled:', enabled);
        return enabled;
      }
      if (columnName === 'empresa') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - empresa empresa enabled: true');
        return true; // Siempre habilitado
      }
    }
    
    // Para Fundo: solo habilitar fundoabrev si fundo tiene valor
    if (selectedTable === 'fundo') {
      if (columnName === 'fundoabrev') {
        const enabled = !!(formData.fundo && formData.fundo.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - fundo fundoabrev enabled:', enabled);
        return enabled;
      }
      if (columnName === 'fundo') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - fundo fundo enabled: true');
        return true; // Siempre habilitado
      }
    }
    
    // Para Tipo: solo habilitar tipo si entidadid tiene valor
    if (selectedTable === 'tipo') {
      if (columnName === 'tipo') {
        const enabled = !!(formData.entidadid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - tipo tipo enabled:', enabled);
        return enabled;
      }
      if (columnName === 'entidadid') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - tipo entidadid enabled: true');
        return true; // Siempre habilitado
      }
    }
    
    // Para Nodo: habilitación progresiva nodo -> deveui -> resto
    if (selectedTable === 'nodo') {
      if (columnName === 'nodo') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - nodo nodo enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'deveui') {
        const enabled = !!(formData.nodo && formData.nodo.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - nodo deveui enabled:', enabled);
        return enabled;
      }
      // Para el resto de campos (appeui, appkey, atpin, statusid)
      if (['appeui', 'appkey', 'atpin', 'statusid'].includes(columnName)) {
        const enabled = !!(formData.nodo && formData.nodo.trim() !== '' && formData.deveui && formData.deveui.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - nodo', columnName, 'enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Métrica: habilitación progresiva metrica -> unidad -> resto
    if (selectedTable === 'metrica') {
      if (columnName === 'metrica') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - metrica metrica enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'unidad') {
        const enabled = !!(formData.metrica && formData.metrica.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - metrica unidad enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Umbral: habilitación progresiva umbral -> ubicacionid -> criticidadid -> nodoid -> metricaid -> tipoid
    if (selectedTable === 'umbral') {
      if (columnName === 'umbral') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - umbral umbral enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'ubicacionid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - umbral ubicacionid enabled:', enabled);
        return enabled;
      }
      if (columnName === 'criticidadid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - umbral criticidadid enabled:', enabled);
        return enabled;
      }
      if (columnName === 'nodoid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid && formData.criticidadid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - umbral nodoid enabled:', enabled);
        return enabled;
      }
      if (columnName === 'metricaid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid && formData.criticidadid && formData.nodoid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - umbral metricaid enabled:', enabled);
        return enabled;
      }
      if (columnName === 'tipoid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid && formData.criticidadid && formData.nodoid && formData.metricaid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - umbral tipoid enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Perfil Umbral: habilitación progresiva perfilid -> umbralid
    if (selectedTable === 'perfilumbral') {
      if (columnName === 'perfilid') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - perfilumbral perfilid enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'umbralid') {
        const enabled = !!(formData.perfilid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - perfilumbral umbralid enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Criticidad: habilitación progresiva criticidad -> criticidadbrev
    if (selectedTable === 'criticidad') {
      if (columnName === 'criticidad') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - criticidad criticidad enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'criticidadbrev') {
        const enabled = !!(formData.criticidad && formData.criticidad.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - criticidad criticidadbrev enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Medio: solo nombre (sin habilitación progresiva)
    if (selectedTable === 'medio') {
      if (columnName === 'nombre') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - medio nombre enabled: true');
        return true; // Siempre habilitado
      }
    }
    
    // Para Contacto: habilitación progresiva usuarioid -> medioid -> celular/correo
    if (selectedTable === 'contacto') {
      if (columnName === 'usuarioid') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - contacto usuarioid enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'medioid') {
        const enabled = !!(formData.usuarioid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - contacto medioid enabled:', enabled);
        return enabled;
      }
      if (['celular', 'correo'].includes(columnName)) {
        const enabled = !!(formData.usuarioid && formData.medioid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - contacto', columnName, 'enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Usuario: habilitación progresiva login -> nombre -> apellido -> rol
    if (selectedTable === 'usuario') {
      if (columnName === 'login') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - usuario login enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'nombre') {
        const enabled = !!(formData.login && formData.login.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - usuario nombre enabled:', enabled);
        return enabled;
      }
      if (columnName === 'apellido') {
        const enabled = !!(formData.login && formData.login.trim() !== '' && formData.nombre && formData.nombre.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - usuario apellido enabled:', enabled);
        return enabled;
      }
      if (columnName === 'rol') {
        const enabled = !!(formData.login && formData.login.trim() !== '' && formData.nombre && formData.nombre.trim() !== '' && formData.apellido && formData.apellido.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - usuario rol enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Perfil: habilitación progresiva perfil -> nivel
    if (selectedTable === 'perfil') {
      if (columnName === 'perfil') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - perfil perfil enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'nivel') {
        const enabled = !!(formData.perfil && formData.perfil.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - perfil nivel enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Usuario Perfil: habilitación progresiva usuarioid -> perfilid
    if (selectedTable === 'usuarioperfil') {
      if (columnName === 'usuarioid') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - usuarioperfil usuarioid enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'perfilid') {
        const enabled = !!(formData.usuarioid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - usuarioperfil perfilid enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Localización: habilitación progresiva ubicacionid -> nodoid -> entidadid -> latitud/longitud/referencia
    if (selectedTable === 'localizacion') {
      if (columnName === 'ubicacionid') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - localizacion ubicacionid enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'nodoid') {
        const enabled = !!(formData.ubicacionid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - localizacion nodoid enabled:', enabled);
        return enabled;
      }
      if (columnName === 'entidadid') {
        const enabled = !!(formData.ubicacionid && formData.nodoid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - localizacion entidadid enabled:', enabled);
        return enabled;
      }
      if (['latitud', 'longitud', 'referencia'].includes(columnName)) {
        const enabled = !!(formData.ubicacionid && formData.nodoid && formData.entidadid);
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - localizacion', columnName, 'enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Ubicación: habilitación progresiva ubicacion -> fundoid
    if (selectedTable === 'ubicacion') {
      if (columnName === 'ubicacion') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - ubicacion ubicacion enabled: true');
        return true; // Siempre habilitado
      }
      if (columnName === 'fundoid') {
        const enabled = !!(formData.ubicacion && formData.ubicacion.trim() !== '');
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - ubicacion fundoid enabled:', enabled);
        return enabled;
      }
    }
    
    // Para Entidad: solo entidad (sin habilitación progresiva)
    if (selectedTable === 'entidad') {
      if (columnName === 'entidad') {
        console.log('🔍 useProgressiveEnablement.isFieldEnabled - entidad entidad enabled: true');
        return true; // Siempre habilitado
      }
    }
    
    // Por defecto, habilitado
    console.log('🔍 useProgressiveEnablement.isFieldEnabled - default enabled: true');
    return true;
  }, [selectedTable, formData]);

  /**
   * Obtiene la lista de campos habilitados
   */
  const getEnabledFields = useCallback((): string[] => {
    // Lista de campos comunes para todas las tablas
    const commonFields = ['statusid'];
    
    // Campos específicos por tabla
    const tableFields: Record<string, string[]> = {
      pais: ['pais', 'paisabrev'],
      empresa: ['empresa', 'empresabrev', 'paisid'],
      fundo: ['fundo', 'fundoabrev', 'empresaid'],
      ubicacion: ['ubicacion', 'fundoid'],
      localizacion: ['ubicacionid', 'nodoid', 'entidadid', 'latitud', 'longitud', 'referencia'],
      entidad: ['entidad'],
      tipo: ['tipo', 'entidadid'],
      nodo: ['nodo', 'deveui', 'appeui', 'appkey', 'atpin'],
      metrica: ['metrica', 'unidad'],
      umbral: ['umbral', 'ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'tipoid', 'minimo', 'maximo'],
      perfilumbral: ['perfilid', 'umbralid'],
      criticidad: ['criticidad', 'criticidadbrev'],
      medio: ['nombre'],
      perfil: ['perfil', 'nivel'],
      usuario: ['login', 'nombre', 'apellido', 'rol', 'activo'],
      contacto: ['usuarioid', 'medioid', 'celular', 'correo'],
      usuarioperfil: ['usuarioid', 'perfilid']
    };
    
    const allFields = [...commonFields, ...(tableFields[selectedTable] || [])];
    
    return allFields.filter(field => isFieldEnabled(field));
  }, [selectedTable, isFieldEnabled]);

  /**
   * Obtiene la lista de campos deshabilitados
   */
  const getDisabledFields = useCallback((): string[] => {
    // Lista de campos comunes para todas las tablas
    const commonFields = ['statusid'];
    
    // Campos específicos por tabla
    const tableFields: Record<string, string[]> = {
      pais: ['pais', 'paisabrev'],
      empresa: ['empresa', 'empresabrev', 'paisid'],
      fundo: ['fundo', 'fundoabrev', 'empresaid'],
      ubicacion: ['ubicacion', 'fundoid'],
      localizacion: ['ubicacionid', 'nodoid', 'entidadid', 'latitud', 'longitud', 'referencia'],
      entidad: ['entidad'],
      tipo: ['tipo', 'entidadid'],
      nodo: ['nodo', 'deveui', 'appeui', 'appkey', 'atpin'],
      metrica: ['metrica', 'unidad'],
      umbral: ['umbral', 'ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'tipoid', 'minimo', 'maximo'],
      perfilumbral: ['perfilid', 'umbralid'],
      criticidad: ['criticidad', 'criticidadbrev'],
      medio: ['nombre'],
      perfil: ['perfil', 'nivel'],
      usuario: ['login', 'nombre', 'apellido', 'rol', 'activo'],
      contacto: ['usuarioid', 'medioid', 'celular', 'correo'],
      usuarioperfil: ['usuarioid', 'perfilid']
    };
    
    const allFields = [...commonFields, ...(tableFields[selectedTable] || [])];
    
    return allFields.filter(field => !isFieldEnabled(field));
  }, [selectedTable, isFieldEnabled]);

  /**
   * Obtiene la lista de campos obligatorios
   */
  const getRequiredFields = useCallback((): string[] => {
    // Campos obligatorios por tabla (basado en tableValidationSchemas)
    const requiredFields: Record<string, string[]> = {
      pais: ['pais', 'paisabrev'],
      empresa: ['empresa', 'empresabrev'],
      fundo: ['fundo', 'fundoabrev'],
      ubicacion: ['ubicacion'],
      localizacion: ['ubicacionid', 'nodoid', 'entidadid', 'latitud', 'longitud', 'referencia'],
      entidad: ['entidad'],
      tipo: ['tipo'],
      nodo: ['nodo'],
      metrica: ['metrica', 'unidad'],
      umbral: ['umbral', 'ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'tipoid'],
      perfilumbral: ['perfilid', 'umbralid'],
      criticidad: ['criticidad', 'criticidadbrev'],
      medio: ['nombre'],
      perfil: ['perfil', 'nivel'],
      usuario: ['login', 'nombre', 'apellido', 'rol'],
      contacto: ['usuarioid', 'medioid'],
      usuarioperfil: ['usuarioid', 'perfilid']
    };
    
    return requiredFields[selectedTable] || [];
  }, [selectedTable]);

  /**
   * Obtiene la lista de campos opcionales
   */
  const getOptionalFields = useCallback((): string[] => {
    const allFields = getEnabledFields();
    const requiredFields = getRequiredFields();
    
    return allFields.filter(field => !requiredFields.includes(field));
  }, [getEnabledFields, getRequiredFields]);

  return {
    isFieldEnabled,
    getEnabledFields,
    getDisabledFields,
    getRequiredFields,
    getOptionalFields
  };
};
