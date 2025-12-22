// ============================================================================
// HOOK: useSystemParametersCRUD - Handlers CRUD para SystemParameters
// ============================================================================

import { useCallback } from 'react';

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
  insertRow: (data: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
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
  onSubTabChange
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
      // Validar formulario y mostrar mensaje warning si hay errores
      if (!validateForm()) {
        // Obtener errores de validación
        const validationErrors = Object.values(formState.errors).filter(Boolean);
        const errorMessage = validationErrors.length > 0 
          ? validationErrors.join('\n')
          : 'Por favor complete todos los campos requeridos';
        
        setMessage({ type: 'warning', text: errorMessage });
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
    const userId = user?.user_metadata?.usuarioid || 1;
    const now = new Date().toISOString();
    const dataToInsert: Record<string, any> = {
      ...filteredData,
      usercreatedid: userId,
      datecreated: now,
      // Algunas tablas requieren usermodifiedid y datemodified incluso en inserción
      usermodifiedid: userId,
      datemodified: now
    };

    // Excluir campos de clave primaria que se generan automáticamente
    // (ya se maneja en la configuración de cada tabla)

    const result = await insertRow(dataToInsert);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro insertado correctamente' });
      resetForm();
      // Cambiar a la pestaña de Estado para ver el nuevo registro
      setActiveSubTab('status');
      onSubTabChange?.('status');
      // Recargar datos para asegurar que se muestre el nuevo registro
      loadData();
      if (selectedTable) {
        loadTableData(selectedTable);
      }
      // Recargar datos relacionados si se insertó en una tabla que afecta a otras
      if (['perfil', 'usuario', 'pais', 'empresa', 'fundo', 'ubicacion'].includes(selectedTable)) {
        loadRelatedTablesData();
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al insertar' });
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
    config
  ]);

  const handleUpdate = useCallback(async () => {
    if (!selectedRow || !validateForm()) {
      setMessage({ type: 'error', text: 'Por favor complete todos los campos requeridos' });
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
      setMessage({ type: 'error', text: result.error || 'Error al actualizar' });
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
      setMessage({ type: 'error', text: result.error || 'Error al eliminar' });
    }
  }, [deleteRow, getPrimaryKeyValue, setMessage]);

  return {
    handleInsert,
    handleUpdate,
    handleDelete
  };
};

