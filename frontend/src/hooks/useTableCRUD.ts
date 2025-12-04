/**
 * Hook consolidado para operaciones CRUD de tablas
 * Reemplaza múltiples hooks individuales con una solución unificada
 */

import { useState, useCallback, useMemo } from 'react';
import { JoySenseService } from '../services/backend-api';
import { getTableConfig, getPrimaryKey, hasCompositeKey, TableConfig, TableFieldConfig } from '../config/tables.config';
import { TableName } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface TableState {
  data: any[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface FormState {
  data: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface RelatedData {
  [tableName: string]: any[];
}

export interface UseTableCRUDOptions {
  tableName: TableName | string;
  pageSize?: number;
  autoLoad?: boolean;
}

export interface UseTableCRUDReturn {
  // Estado de la tabla
  tableState: TableState;
  formState: FormState;
  relatedData: RelatedData;
  config: TableConfig | undefined;

  // Acciones de datos
  loadData: (options?: { page?: number; search?: string; filters?: Record<string, any> }) => Promise<void>;
  refreshData: () => Promise<void>;
  loadRelatedData: () => Promise<void>;

  // Acciones CRUD
  insertRow: (data: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateRow: (id: string | Record<string, any>, data: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteRow: (id: string | Record<string, any>) => Promise<{ success: boolean; error?: string }>;

  // Acciones de formulario
  setFormData: (data: Record<string, any>) => void;
  updateFormField: (field: string, value: any) => void;
  resetForm: () => void;
  validateForm: () => boolean;

  // Paginación
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Utilidades
  getDisplayValue: (row: any, fieldName: string) => string;
  getPrimaryKeyValue: (row: any) => string | Record<string, any>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTableCRUD(options: UseTableCRUDOptions): UseTableCRUDReturn {
  const { tableName, pageSize = 25, autoLoad = false } = options;

  // Configuración de la tabla
  const config = useMemo(() => getTableConfig(tableName), [tableName]);

  // Estado de la tabla
  const [tableState, setTableState] = useState<TableState>({
    data: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize,
    totalPages: 0
  });

  // Estado del formulario
  const [formState, setFormState] = useState<FormState>({
    data: initializeFormData(config),
    errors: {},
    isSubmitting: false,
    isDirty: false
  });

  // Datos relacionados (para dropdowns)
  const [relatedData, setRelatedData] = useState<RelatedData>({});

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = useCallback(async (loadOptions?: { page?: number; search?: string; filters?: Record<string, any> }) => {
    if (!tableName) return;

    setTableState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await JoySenseService.getTableDataPaginated(tableName, {
        page: loadOptions?.page || tableState.currentPage,
        pageSize: tableState.pageSize,
        search: loadOptions?.search,
        ...loadOptions?.filters
      });

      const data = result.data || [];
      const pagination = result.pagination;

      setTableState(prev => ({
        ...prev,
        data,
        loading: false,
        totalCount: pagination?.total || data.length,
        totalPages: pagination?.totalPages || Math.ceil(data.length / prev.pageSize),
        currentPage: pagination?.page || prev.currentPage
      }));
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      setTableState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar datos'
      }));
    }
  }, [tableName, tableState.currentPage, tableState.pageSize]);

  const refreshData = useCallback(async () => {
    await loadData({ page: tableState.currentPage });
  }, [loadData, tableState.currentPage]);

  const loadRelatedData = useCallback(async () => {
    if (!config) return;

    const foreignKeyFields = config.fields.filter(f => f.foreignKey);
    const tableSet = new Set(foreignKeyFields.map(f => f.foreignKey!.table));
    const tablesToLoad = Array.from(tableSet);

    const promises = tablesToLoad.map(async (table) => {
      try {
        const data = await JoySenseService.getTableData(table);
        return { table, data };
      } catch (error) {
        console.error(`Error loading related data for ${table}:`, error);
        return { table, data: [] };
      }
    });

    const results = await Promise.all(promises);
    const newRelatedData: RelatedData = {};
    results.forEach(({ table, data }) => {
      newRelatedData[table] = data;
    });

    setRelatedData(newRelatedData);
  }, [config]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const insertRow = useCallback(async (data: Record<string, any>) => {
    if (!config?.allowInsert) {
      return { success: false, error: 'Inserción no permitida para esta tabla' };
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const result = await JoySenseService.insertTableRow(tableName, data);
      await refreshData();
      setFormState(prev => ({ ...prev, isSubmitting: false, isDirty: false }));
      return { success: true, data: result };
    } catch (error: any) {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      const errorMessage = error.response?.data?.error || error.message || 'Error al insertar';
      return { success: false, error: errorMessage };
    }
  }, [tableName, config, refreshData]);

  const updateRow = useCallback(async (id: string | Record<string, any>, data: Record<string, any>) => {
    if (!config?.allowUpdate) {
      return { success: false, error: 'Actualización no permitida para esta tabla' };
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      let result;
      if (typeof id === 'object') {
        // Clave compuesta
        result = await JoySenseService.updateTableRowByCompositeKey(tableName, id, data);
      } else {
        result = await JoySenseService.updateTableRow(tableName, id, data);
      }
      await refreshData();
      setFormState(prev => ({ ...prev, isSubmitting: false, isDirty: false }));
      return { success: true, data: result };
    } catch (error: any) {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      const errorMessage = error.response?.data?.error || error.message || 'Error al actualizar';
      return { success: false, error: errorMessage };
    }
  }, [tableName, config, refreshData]);

  const deleteRow = useCallback(async (id: string | Record<string, any>) => {
    if (!config?.allowDelete) {
      return { success: false, error: 'Eliminación no permitida para esta tabla' };
    }

    try {
      const idString = typeof id === 'object' ? JSON.stringify(id) : id;
      await JoySenseService.deleteTableRow(tableName, idString);
      await refreshData();
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error al eliminar';
      return { success: false, error: errorMessage };
    }
  }, [tableName, config, refreshData]);

  // ============================================================================
  // FORM OPERATIONS
  // ============================================================================

  const setFormData = useCallback((data: Record<string, any>) => {
    setFormState(prev => ({
      ...prev,
      data,
      isDirty: true,
      errors: {}
    }));
  }, []);

  const updateFormField = useCallback((field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      errors: { ...prev.errors, [field]: '' }
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState({
      data: initializeFormData(config),
      errors: {},
      isSubmitting: false,
      isDirty: false
    });
  }, [config]);

  const validateForm = useCallback(() => {
    if (!config) return false;

    const errors: Record<string, string> = {};
    let isValid = true;

    config.fields.forEach(field => {
      if (field.required && !field.hidden && !field.readonly) {
        const value = formState.data[field.name];
        if (value === undefined || value === null || value === '') {
          errors[field.name] = `${field.label} es requerido`;
          isValid = false;
        }
      }

      // Validaciones adicionales
      if (field.validation && formState.data[field.name]) {
        const value = formState.data[field.name];
        
        if (field.validation.minLength && String(value).length < field.validation.minLength) {
          errors[field.name] = `Mínimo ${field.validation.minLength} caracteres`;
          isValid = false;
        }
        
        if (field.validation.maxLength && String(value).length > field.validation.maxLength) {
          errors[field.name] = `Máximo ${field.validation.maxLength} caracteres`;
          isValid = false;
        }

        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[field.name] = 'Email inválido';
          isValid = false;
        }
      }
    });

    setFormState(prev => ({ ...prev, errors }));
    return isValid;
  }, [config, formState.data]);

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const setPage = useCallback((page: number) => {
    setTableState(prev => ({ ...prev, currentPage: page }));
    loadData({ page });
  }, [loadData]);

  const setPageSize = useCallback((size: number) => {
    setTableState(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    loadData({ page: 1 });
  }, [loadData]);

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const getDisplayValue = useCallback((row: any, fieldName: string): string => {
    if (!config || !row) return '';

    const field = config.fields.find(f => f.name === fieldName);
    if (!field) return String(row[fieldName] || '');

    const value = row[fieldName];

    // Si es un foreign key, buscar el valor en los datos relacionados
    if (field.foreignKey) {
      const relatedTable = relatedData[field.foreignKey.table];
      if (relatedTable) {
        const relatedRow = relatedTable.find(r => r[field.foreignKey!.valueField] === value);
        if (relatedRow) {
          const labelFields = Array.isArray(field.foreignKey.labelField) 
            ? field.foreignKey.labelField 
            : [field.foreignKey.labelField];
          return labelFields.map(lf => relatedRow[lf]).filter(Boolean).join(' ');
        }
      }
      return String(value || '');
    }

    // Formateo por tipo
    if (field.type === 'datetime' && value) {
      return new Date(value).toLocaleString();
    }
    if (field.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (field.type === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    return String(value ?? '');
  }, [config, relatedData]);

  const getPrimaryKeyValue = useCallback((row: any): string | Record<string, any> => {
    const pk = getPrimaryKey(tableName);
    
    if (Array.isArray(pk)) {
      const compositeKey: Record<string, any> = {};
      pk.forEach(key => {
        compositeKey[key] = row[key];
      });
      return compositeKey;
    }
    
    return String(row[pk] || '');
  }, [tableName]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    tableState,
    formState,
    relatedData,
    config,
    loadData,
    refreshData,
    loadRelatedData,
    insertRow,
    updateRow,
    deleteRow,
    setFormData,
    updateFormField,
    resetForm,
    validateForm,
    setPage,
    setPageSize,
    getDisplayValue,
    getPrimaryKeyValue
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function initializeFormData(config?: TableConfig): Record<string, any> {
  if (!config) return {};

  const data: Record<string, any> = {};
  
  config.fields.forEach(field => {
    if (!field.hidden && !field.readonly) {
      if (field.defaultValue !== undefined) {
        data[field.name] = field.defaultValue;
      } else if (field.type === 'number') {
        data[field.name] = null;
      } else if (field.type === 'boolean') {
        data[field.name] = false;
      } else {
        data[field.name] = '';
      }
    }
  });

  // Siempre incluir statusid con valor por defecto
  if (!data.hasOwnProperty('statusid')) {
    data.statusid = 1;
  }

  return data;
}

export default useTableCRUD;

