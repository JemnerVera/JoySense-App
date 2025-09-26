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
    
    // Para País: solo habilitar paisabrev si pais tiene valor
    if (selectedTable === 'pais') {
      if (columnName === 'paisabrev') {
        const enabled = !!(formData.pais && formData.pais.trim() !== '');
        return enabled;
      }
      if (columnName === 'pais') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Empresa: solo habilitar empresabrev si empresa tiene valor
    if (selectedTable === 'empresa') {
      if (columnName === 'empresabrev') {
        const enabled = !!(formData.empresa && formData.empresa.trim() !== '');
        return enabled;
      }
      if (columnName === 'empresa') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Fundo: solo habilitar fundoabrev si fundo tiene valor
    if (selectedTable === 'fundo') {
      if (columnName === 'fundoabrev') {
        const enabled = !!(formData.fundo && formData.fundo.trim() !== '');
        return enabled;
      }
      if (columnName === 'fundo') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Tipo: solo habilitar tipo si entidadid tiene valor
    if (selectedTable === 'tipo') {
      if (columnName === 'tipo') {
        const enabled = !!(formData.entidadid);
        return enabled;
      }
      if (columnName === 'entidadid') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Nodo: habilitación progresiva nodo -> deveui -> resto
    if (selectedTable === 'nodo') {
      if (columnName === 'nodo') {
        return true; // Siempre habilitado
      }
      if (columnName === 'deveui') {
        const enabled = !!(formData.nodo && formData.nodo.trim() !== '');
        return enabled;
      }
      // Para el resto de campos (appeui, appkey, atpin, statusid)
      if (['appeui', 'appkey', 'atpin', 'statusid'].includes(columnName)) {
        const enabled = !!(formData.nodo && formData.nodo.trim() !== '' && formData.deveui && formData.deveui.trim() !== '');
        return enabled;
      }
    }
    
    // Para Métrica: habilitación progresiva metrica -> unidad -> resto
    if (selectedTable === 'metrica') {
      if (columnName === 'metrica') {
        return true; // Siempre habilitado
      }
      if (columnName === 'unidad') {
        const enabled = !!(formData.metrica && formData.metrica.trim() !== '');
        return enabled;
      }
    }
    
    // Para Umbral: habilitación progresiva umbral -> ubicacionid -> criticidadid -> nodoid -> metricaid -> tipoid
    if (selectedTable === 'umbral') {
      if (columnName === 'umbral') {
        return true; // Siempre habilitado
      }
      if (columnName === 'ubicacionid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '');
        return enabled;
      }
      if (columnName === 'criticidadid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid);
        return enabled;
      }
      if (columnName === 'nodoid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid && formData.criticidadid);
        return enabled;
      }
      if (columnName === 'metricaid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid && formData.criticidadid && formData.nodoid);
        return enabled;
      }
      if (columnName === 'tipoid') {
        const enabled = !!(formData.umbral && formData.umbral.trim() !== '' && formData.ubicacionid && formData.criticidadid && formData.nodoid && formData.metricaid);
        return enabled;
      }
    }
    
    // Para Perfil Umbral: habilitación progresiva perfilid -> umbralid
    if (selectedTable === 'perfilumbral') {
      if (columnName === 'perfilid') {
        return true; // Siempre habilitado
      }
      if (columnName === 'umbralid') {
        const enabled = !!(formData.perfilid);
        return enabled;
      }
    }
    
    // Para Criticidad: habilitación progresiva criticidad -> criticidadbrev
    if (selectedTable === 'criticidad') {
      if (columnName === 'criticidad') {
        return true; // Siempre habilitado
      }
      if (columnName === 'criticidadbrev') {
        const enabled = !!(formData.criticidad && formData.criticidad.trim() !== '');
        return enabled;
      }
    }
    
    // Para Medio: solo nombre (sin habilitación progresiva)
    if (selectedTable === 'medio') {
      if (columnName === 'nombre') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Contacto: habilitación progresiva usuarioid -> medioid -> celular/correo
    if (selectedTable === 'contacto') {
      if (columnName === 'usuarioid') {
        return true; // Siempre habilitado
      }
      if (columnName === 'medioid') {
        const enabled = !!(formData.usuarioid);
        return enabled;
      }
      if (['celular', 'correo'].includes(columnName)) {
        const enabled = !!(formData.usuarioid && formData.medioid);
        return enabled;
      }
    }
    
    // Para Usuario: habilitación progresiva login -> nombre -> apellido -> rol
    if (selectedTable === 'usuario') {
      if (columnName === 'login') {
        return true; // Siempre habilitado
      }
      if (columnName === 'nombre') {
        const enabled = !!(formData.login && formData.login.trim() !== '');
        return enabled;
      }
      if (columnName === 'apellido') {
        const enabled = !!(formData.login && formData.login.trim() !== '' && formData.nombre && formData.nombre.trim() !== '');
        return enabled;
      }
      if (columnName === 'rol') {
        const enabled = !!(formData.login && formData.login.trim() !== '' && formData.nombre && formData.nombre.trim() !== '' && formData.apellido && formData.apellido.trim() !== '');
        return enabled;
      }
    }
    
    // Para Perfil: habilitación progresiva perfil -> nivel
    if (selectedTable === 'perfil') {
      if (columnName === 'perfil') {
        return true; // Siempre habilitado
      }
      if (columnName === 'nivel') {
        const enabled = !!(formData.perfil && formData.perfil.trim() !== '');
        return enabled;
      }
    }
    
    // Para Usuario Perfil: habilitación progresiva usuarioid -> perfilid
    if (selectedTable === 'usuarioperfil') {
      if (columnName === 'usuarioid') {
        return true; // Siempre habilitado
      }
      if (columnName === 'perfilid') {
        const enabled = !!(formData.usuarioid);
        return enabled;
      }
    }
    
    // Para Localización: habilitación progresiva ubicacionid -> nodoid -> entidadid -> latitud/longitud/referencia
    if (selectedTable === 'localizacion') {
      if (columnName === 'ubicacionid') {
        return true; // Siempre habilitado
      }
      if (columnName === 'nodoid') {
        const enabled = !!(formData.ubicacionid);
        return enabled;
      }
      if (columnName === 'entidadid') {
        const enabled = !!(formData.ubicacionid && formData.nodoid);
        return enabled;
      }
      if (['latitud', 'longitud', 'referencia'].includes(columnName)) {
        const enabled = !!(formData.ubicacionid && formData.nodoid && formData.entidadid);
        return enabled;
      }
    }
    
    // Para Ubicación: habilitación progresiva ubicacion -> fundoid
    if (selectedTable === 'ubicacion') {
      if (columnName === 'ubicacion') {
        return true; // Siempre habilitado
      }
      if (columnName === 'fundoid') {
        const enabled = !!(formData.ubicacion && formData.ubicacion.trim() !== '');
        return enabled;
      }
    }
    
    // Para Entidad: solo entidad (sin habilitación progresiva)
    if (selectedTable === 'entidad') {
      if (columnName === 'entidad') {
        return true; // Siempre habilitado
      }
    }
    
    // Por defecto, habilitado
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
