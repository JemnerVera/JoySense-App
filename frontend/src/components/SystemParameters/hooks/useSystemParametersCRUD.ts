// ============================================================================
// HOOK: useSystemParametersCRUD - Handlers CRUD para SystemParameters
// ============================================================================

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { validateTableData } from '../../../utils/validations/routers';
import { consolidateErrorMessages } from '../../../utils/messageConsolidation';
import { logger } from '../../../utils/logger';

interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

interface UseSystemParametersCRUDProps {
  selectedTable: string;
  selectedRow: any;
  formState: {
    data: Record<string, any>;
    errors: Record<string, string>;
    isSubmitting: boolean;
    isDirty: boolean;
  };
  config: any;
  user: any;
  validateForm: () => boolean;
  insertRow: (data: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateRow: (pk: any, data: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  deleteRow: (pk: any) => Promise<{ success: boolean; error?: string }>;
  resetForm: () => void;
  getPrimaryKeyValue: (row: any) => any;
  loadData: () => void;
  loadTableData: (table: string) => void;
  loadRelatedTablesData: () => void;
  setMessage: (message: Message | null) => void;
  setSelectedRow: (row: any) => void;
  setActiveSubTab: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  onSubTabChange?: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  setInsertedRecords: Dispatch<SetStateAction<Array<{ id: string; fields: Record<string, any> }>>>;
  existingData?: any[]; // Datos existentes para validación de duplicados
}

export const useSystemParametersCRUD = ({
  selectedTable,
  selectedRow,
  formState,
  config,
  user,
  validateForm,
  insertRow,
  updateRow,
  deleteRow,
  resetForm,
  getPrimaryKeyValue,
  loadData,
  loadTableData,
  loadRelatedTablesData,
  setMessage,
  setSelectedRow,
  setActiveSubTab,
  onSubTabChange,
  setInsertedRecords,
  existingData
}: UseSystemParametersCRUDProps) => {

  const handleInsert = useCallback(async () => {
    // Validaciones especiales según la tabla
    if (selectedTable === 'nodo') {
      // Validación especial para nodo (validación progresiva)
      // Validación progresiva: primero debe tener nodo, luego deveui
      const nodoValue = formState.data.nodo;
      if (!nodoValue || (typeof nodoValue === 'string' && nodoValue.trim() === '')) {
        setMessage({ type: 'warning', text: 'El nombre del nodo es obligatorio' });
        return;
      }
      
      const deveuiValue = formState.data.deveui;
      if (!deveuiValue || (typeof deveuiValue === 'string' && deveuiValue.trim() === '')) {
        setMessage({ type: 'warning', text: 'El campo DEVEUI es obligatorio cuando se especifica un nodo' });
        return;
      }
    } else {
      // PRIMERO: Validación específica de tabla (duplicados, constraints, longitud, etc.)
      // Esta validación es más específica y debe ejecutarse antes de la validación básica
      if (selectedTable && existingData) {
        try {
          const validationResult = await validateTableData(selectedTable, formState.data, existingData);
          if (!validationResult.isValid) {
            // Mostrar errores uno por línea, consolidando mensajes similares
            const errorMessages = validationResult.errors.map(e => e.message).filter(Boolean);
            const consolidatedErrors = consolidateErrorMessages(errorMessages);
            const errorMessage = validationResult.userFriendlyMessage || consolidatedErrors.join('\n');
            setMessage({ type: 'warning', text: errorMessage });
            return;
          }
        } catch (validationError) {
          // Si falla la validación, continuar (el backend también validará)
          console.error('Error en validación:', validationError);
        }
      }
      
      // SEGUNDO: Validar formulario básico (campos requeridos)
      // Solo si no hay errores específicos de tabla, validar campos requeridos
      if (!validateForm()) {
        // Obtener errores de validación básicos (campos requeridos)
        const validationErrors = Object.values(formState.errors).filter(Boolean);
        // Solo mostrar mensaje genérico si realmente no hay errores específicos
        if (validationErrors.length > 0) {
          // Consolidar mensajes similares
          const consolidatedErrors = consolidateErrorMessages(validationErrors);
          const errorMessage = consolidatedErrors.join('\n');
          setMessage({ type: 'warning', text: errorMessage });
        } else {
          // Si validateForm() retorna false pero no hay errores específicos,
          // puede ser un problema de validación interna, mostrar mensaje genérico
          setMessage({ type: 'warning', text: 'Por favor complete todos los campos requeridos' });
        }
        return;
      }
    }

    // Filtrar solo los campos válidos según la configuración de la tabla
    const validFields = config?.fields.map((f: any) => f.name) || [];
    const filteredData: Record<string, any> = {};
    
    // Solo incluir campos que están en la configuración
    validFields.forEach((fieldName: string) => {
      if (formState.data[fieldName] !== undefined && formState.data[fieldName] !== null && formState.data[fieldName] !== '') {
        filteredData[fieldName] = formState.data[fieldName];
      }
    });
    
    // Agregar campos de auditoría
    // DIAGNÓSTICO: Log del objeto user completo para ver su estructura
    logger.debug('[useSystemParametersCRUD] Objeto user completo:', {
      user,
      userKeys: user ? Object.keys(user) : [],
      user_metadata: user?.user_metadata,
      user_metadataKeys: user?.user_metadata ? Object.keys(user.user_metadata) : [],
      id: user?.id,
      email: user?.email,
      rawUser: JSON.stringify(user, null, 2)
    })
    
    // NOTA: En useSystemParametersCRUD no podemos usar async fácilmente en handleInsert
    // Por ahora usamos la lógica anterior, pero idealmente debería usar la misma función helper
    // Para diagnóstico, intentar obtener usuarioid de user_metadata primero
    const userId = 
      user?.user_metadata?.usuarioid || 
      1
    
    logger.debug('[useSystemParametersCRUD] userId calculado:', {
      userId,
      source: user?.user_metadata?.usuarioid ? 'user_metadata.usuarioid' : 'fallback: 1',
      note: 'Para obtener usuarioid desde tabla usuario, usar useInsertForm en lugar de este hook'
    })
    
    const now = new Date().toISOString();
    const dataToInsert: Record<string, any> = {
      ...filteredData,
      usercreatedid: userId,
      datecreated: now,
      // Algunas tablas requieren usermodifiedid y datemodified incluso en inserción
      usermodifiedid: userId,
      datemodified: now
    };
    
    logger.debug('[useSystemParametersCRUD] Datos a insertar (incluyendo auditoría):', {
      tableName: selectedTable,
      usercreatedid: dataToInsert.usercreatedid,
      usermodifiedid: dataToInsert.usermodifiedid,
      dataKeys: Object.keys(dataToInsert)
    })

    // Excluir campos de clave primaria que se generan automáticamente
    // (ya se maneja en la configuración de cada tabla)

    const result = await insertRow(dataToInsert);
    
    if (result.success) {
      // NO cambiar de pestaña, permanecer en 'insert'
      // Agregar el registro insertado a la lista de registros insertados
      // El backend devuelve un array con el registro insertado, tomar el primer elemento
      let insertedData = result.data;
      
      // Si result.data es un array, tomar el primer elemento
      if (Array.isArray(insertedData)) {
        insertedData = insertedData[0] || dataToInsert;
      }
      
      // Si result.data no existe o está vacío, usar dataToInsert
      if (!insertedData || (typeof insertedData === 'object' && Object.keys(insertedData).length === 0)) {
        insertedData = dataToInsert;
      }
      
      const insertedRecord = {
        id: `${selectedTable}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fields: insertedData
      };
      
      setInsertedRecords(prev => {
        const updated = [...prev, insertedRecord];
        // Mantener solo las últimas 3 entradas
        return updated.slice(-3);
      });
      
      resetForm();
      // NO cambiar de pestaña
      // Recargar datos de la tabla para actualizar la tabla de estado
      loadData();
      if (selectedTable) {
        loadTableData(selectedTable);
      }
      // Recargar datos relacionados si se insertó en una tabla que afecta a otras
      if (['perfil', 'usuario', 'pais', 'empresa', 'fundo', 'ubicacion'].includes(selectedTable || '')) {
        loadRelatedTablesData();
      }
    } else {
      // Todos los mensajes deben ser 'warning' (amarillo), nunca 'error' (rojo)
      setMessage({ type: 'warning', text: result.error || 'Error al insertar' });
    }
  }, [
    selectedTable,
    formState.data,
    formState.errors,
    validateForm,
    insertRow,
    resetForm,
    user,
    loadData,
    loadTableData,
    loadRelatedTablesData,
    setMessage,
    setActiveSubTab,
    onSubTabChange,
    config,
    existingData,
    setInsertedRecords
  ]);

  const handleUpdate = useCallback(async () => {
    if (!selectedRow) {
      setMessage({ type: 'warning', text: 'No hay registro seleccionado para actualizar' });
      return;
    }

    // PRIMERO: Validación específica de tabla (duplicados, constraints, longitud, etc.)
    // Esta validación es más específica y debe ejecutarse antes de la validación básica
    if (selectedTable && existingData) {
      try {
        const validationResult = await validateTableData(selectedTable, formState.data, existingData);
        if (!validationResult.isValid) {
          // Mostrar errores uno por línea, consolidando mensajes similares
          const errorMessages = validationResult.errors.map(e => e.message).filter(Boolean);
          const consolidatedErrors = consolidateErrorMessages(errorMessages);
          const errorMessage = validationResult.userFriendlyMessage || consolidatedErrors.join('\n');
          setMessage({ type: 'warning', text: errorMessage });
          return;
        }
      } catch (validationError) {
        // Si falla la validación, continuar (el backend también validará)
        console.error('Error en validación:', validationError);
      }
    }

    // SEGUNDO: Validar formulario básico (campos requeridos)
    // Solo si no hay errores específicos de tabla, validar campos requeridos
    if (!validateForm()) {
      // Obtener errores de validación básicos (campos requeridos)
      const validationErrors = Object.values(formState.errors).filter(Boolean);
      // Solo mostrar mensaje genérico si realmente no hay errores específicos
      if (validationErrors.length > 0) {
        // Consolidar mensajes similares
        const consolidatedErrors = consolidateErrorMessages(validationErrors);
        const errorMessage = consolidatedErrors.join('\n');
        setMessage({ type: 'warning', text: errorMessage });
      } else {
        // Si validateForm() retorna false pero no hay errores específicos,
        // puede ser un problema de validación interna, mostrar mensaje genérico
        setMessage({ type: 'warning', text: 'Por favor complete todos los campos requeridos' });
      }
      return;
    }

    // Filtrar solo los campos válidos según la configuración de la tabla
    const validFields = config?.fields.map((f: any) => f.name) || [];
    const filteredData: Record<string, any> = {};
    
    // Solo incluir campos que están en la configuración
    validFields.forEach((fieldName: string) => {
      if (formState.data[fieldName] !== undefined && formState.data[fieldName] !== null && formState.data[fieldName] !== '') {
        filteredData[fieldName] = formState.data[fieldName];
      }
    });

    // Agregar campos de auditoría
    const dataToUpdate = {
      ...filteredData,
      usermodifiedid: user?.user_metadata?.usuarioid || 1,
      datemodified: new Date().toISOString()
    };

    const pk = getPrimaryKeyValue(selectedRow);
    const result = await updateRow(pk, dataToUpdate);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      setSelectedRow(null);
      setActiveSubTab('status');
      onSubTabChange?.('status');
      // Recargar datos
      loadData();
      if (selectedTable) {
        loadTableData(selectedTable);
      }
      // Recargar datos relacionados si se actualizó en una tabla que afecta a otras
      if (['perfil', 'usuario', 'pais', 'empresa', 'fundo', 'ubicacion'].includes(selectedTable)) {
        loadRelatedTablesData();
      }
    } else {
      setMessage({ type: 'warning', text: result.error || 'Error al actualizar' });
    }
  }, [
    selectedRow,
    formState.data,
    validateForm,
    updateRow,
    getPrimaryKeyValue,
    user,
    loadData,
    loadTableData,
    loadRelatedTablesData,
    selectedTable,
    setMessage,
    setSelectedRow,
    setActiveSubTab,
    onSubTabChange,
    config
  ]);

  const handleDelete = useCallback(async (row: any) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return;

    const pk = getPrimaryKeyValue(row);
    const result = await deleteRow(pk);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro eliminado correctamente' });
    } else {
      setMessage({ type: 'warning', text: result.error || 'Error al eliminar' });
    }
  }, [deleteRow, getPrimaryKeyValue, setMessage]);

  return {
    handleInsert,
    handleUpdate,
    handleDelete
  };
};

