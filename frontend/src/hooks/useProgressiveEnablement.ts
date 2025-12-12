// ============================================================================
// USE PROGRESSIVE ENABLEMENT HOOK
// ============================================================================
// Hook para manejar la lógica de habilitación progresiva de campos

export const useProgressiveEnablement = (
  selectedTable: string,
  formData: Record<string, any>
) => {
  const isFieldEnabled = (columnName: string): boolean => {
    // Para País: solo habilitar paisabrev si pais tiene valor
    if (selectedTable === 'pais') {
      if (columnName === 'paisabrev') {
        return !!(formData.pais && formData.pais.trim() !== '');
      }
      if (columnName === 'pais') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Empresa: solo habilitar empresabrev si empresa tiene valor
    if (selectedTable === 'empresa') {
      if (columnName === 'empresabrev') {
        return !!(formData.empresa && formData.empresa.trim() !== '');
      }
      if (columnName === 'empresa') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Fundo: solo habilitar fundoabrev si fundo tiene valor
    if (selectedTable === 'fundo') {
      if (columnName === 'fundoabrev') {
        return !!(formData.fundo && formData.fundo.trim() !== '');
      }
      if (columnName === 'fundo') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Tipo: solo habilitar tipo si entidadid tiene valor
    if (selectedTable === 'tipo') {
      if (columnName === 'tipo') {
        return !!(formData.entidadid);
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
        return !!(formData.nodo && formData.nodo.trim() !== '');
      }
      // Para el resto de campos (appeui, appkey, atpin, statusid)
      if (['appeui', 'appkey', 'atpin', 'statusid'].includes(columnName)) {
        return !!(formData.nodo && formData.nodo.trim() !== '' && formData.deveui && formData.deveui.trim() !== '');
      }
    }
    
    // Para Métrica: habilitación progresiva metrica -> unidad -> resto
    if (selectedTable === 'metrica') {
      if (columnName === 'metrica') {
        return true; // Siempre habilitado
      }
      if (columnName === 'unidad') {
        return !!(formData.metrica && formData.metrica.trim() !== '');
      }
      // Para el resto de campos (statusid)
      if (['statusid'].includes(columnName)) {
        return !!(formData.metrica && formData.metrica.trim() !== '' && formData.unidad && formData.unidad.trim() !== '');
      }
    }
    
    // Para Perfil Umbral: habilitación progresiva perfilid -> umbralid -> resto
    if (selectedTable === 'perfilumbral') {
      if (columnName === 'perfilid') {
        return true; // Siempre habilitado
      }
      if (columnName === 'umbralid') {
        return !!(formData.perfilid && formData.perfilid !== 0);
      }
      // Para el resto de campos (statusid)
      if (['statusid'].includes(columnName)) {
        return !!(formData.perfilid && formData.perfilid !== 0 && formData.umbralid && formData.umbralid !== 0);
      }
    }
    
    // Para Criticidad: habilitación progresiva criticidad -> criticidadbrev -> resto
    if (selectedTable === 'criticidad') {
      if (columnName === 'criticidad') {
        return true; // Siempre habilitado
      }
      if (columnName === 'criticidadbrev') {
        return !!(formData.criticidad && formData.criticidad.trim() !== '');
      }
      // Para el resto de campos (statusid)
      if (['statusid'].includes(columnName)) {
        return !!(formData.criticidad && formData.criticidad.trim() !== '' && formData.criticidadbrev && formData.criticidadbrev.trim() !== '');
      }
    }
    
    // Para Contacto: habilitación progresiva usuarioid -> resto
    if (selectedTable === 'contacto') {
      if (columnName === 'usuarioid') {
        return true; // Siempre habilitado
      }
      // Para el resto de campos (codigotelefonoid, celular, correo, statusid)
      if (['codigotelefonoid', 'celular', 'correo', 'statusid'].includes(columnName)) {
        return !!(formData.usuarioid && formData.usuarioid !== 0);
      }
    }
    
    // Para Perfil: habilitación progresiva perfil -> nivel -> resto
    if (selectedTable === 'perfil') {
      if (columnName === 'perfil') {
        return true; // Siempre habilitado
      }
      if (columnName === 'nivel') {
        return !!(formData.perfil && formData.perfil.trim() !== '');
      }
      // Para el resto de campos (statusid)
      if (['statusid'].includes(columnName)) {
        return !!(formData.perfil && formData.perfil.trim() !== '' && formData.nivel && formData.nivel.trim() !== '');
      }
    }
    
    // Para otros campos, usar lógica normal
    return true;
  };

  // Función para obtener todos los campos habilitados
  const getEnabledFields = (): string[] => {
    // Por ahora, retornamos un array vacío ya que la lógica de habilitación
    // se maneja campo por campo con isFieldEnabled
    // Esto se puede expandir en el futuro si se necesita una lista completa
    return [];
  };

  return { isFieldEnabled, getEnabledFields };
};
