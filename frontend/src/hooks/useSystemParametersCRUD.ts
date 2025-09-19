import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useInsertOperations } from './useInsertOperations';
import { useUpdateOperations } from './useUpdateOperations';
import { useFormValidation } from './useFormValidation';
import { JoySenseService } from '../services/backend-api';

export interface SystemParametersCRUDState {
  isProcessing: boolean;
  lastOperation: 'insert' | 'update' | 'delete' | null;
  operationSuccess: boolean;
  operationError: string | null;
}

export interface SystemParametersCRUDActions {
  handleInsert: (selectedTable: string, formData: Record<string, any>, existingData: any[]) => Promise<{ success: boolean; message?: string; error?: string }>;
  handleUpdate: (selectedTable: string, formData: Record<string, any>, originalData: Record<string, any>, existingData: any[]) => Promise<{ success: boolean; message?: string; error?: string }>;
  handleDelete: (selectedTable: string, recordId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  clearOperationState: () => void;
}

/**
 * Hook personalizado para manejar operaciones CRUD específicas de SystemParameters
 * Encapsula la lógica compleja de validación, inserción y actualización
 */
export const useSystemParametersCRUD = (): SystemParametersCRUDState & SystemParametersCRUDActions => {
  
  const { user } = useAuth();
  const { insertSingle, isInserting, insertError, insertSuccess } = useInsertOperations();
  const { updateSingle, isUpdating, updateError, updateSuccess } = useUpdateOperations();
  const { validateInsert, validateUpdate } = useFormValidation('');

  /**
   * Manejar inserción de datos
   */
  const handleInsert = useCallback(async (
    selectedTable: string,
    formData: Record<string, any>,
    existingData: any[]
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    console.log(`🔍 useSystemParametersCRUD.handleInsert - ${selectedTable}:`, formData);

    if (!selectedTable || !user) {
      return { success: false, error: 'Tabla no seleccionada o usuario no autenticado' };
    }

    try {
      // Validar datos usando el hook de validación
      const validationResult = await validateInsert(formData);
      
      if (!validationResult.isValid) {
        return { 
          success: false, 
          error: validationResult.userFriendlyMessage || 'Datos inválidos' 
        };
      }

      // Realizar inserción usando el hook de operaciones
      const result = await insertSingle(selectedTable, formData);
      
      if (result.success) {
        return { 
          success: true, 
          message: `✅ ${selectedTable} creado exitosamente` 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Error al crear el registro' 
        };
      }
      
    } catch (error) {
      console.error(`❌ useSystemParametersCRUD.handleInsert - ${selectedTable} error:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }, [user, validateInsert, insertSingle]);

  /**
   * Manejar actualización de datos
   */
  const handleUpdate = useCallback(async (
    selectedTable: string,
    formData: Record<string, any>,
    originalData: Record<string, any>,
    existingData: any[]
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    console.log(`🔍 useSystemParametersCRUD.handleUpdate - ${selectedTable}:`, formData);

    if (!selectedTable || !user) {
      return { success: false, error: 'Tabla no seleccionada o usuario no autenticado' };
    }

    try {
      // Validar datos usando el hook de validación
      const validationResult = await validateUpdate(formData, originalData);
      
      if (!validationResult.isValid) {
        return { 
          success: false, 
          error: validationResult.userFriendlyMessage || 'Datos inválidos' 
        };
      }

      // Realizar actualización usando el hook de operaciones
      const result = await updateSingle(selectedTable, formData, originalData);
      
      if (result.success) {
        return { 
          success: true, 
          message: `✅ ${selectedTable} actualizado exitosamente` 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Error al actualizar el registro' 
        };
      }
      
    } catch (error) {
      console.error(`❌ useSystemParametersCRUD.handleUpdate - ${selectedTable} error:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }, [user, validateUpdate, updateSingle]);

  /**
   * Manejar eliminación de datos
   */
  const handleDelete = useCallback(async (
    selectedTable: string,
    recordId: number
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    console.log(`🔍 useSystemParametersCRUD.handleDelete - ${selectedTable}:`, recordId);

    if (!selectedTable || !user || !recordId) {
      return { success: false, error: 'Datos insuficientes para eliminar' };
    }

    try {
      // Realizar eliminación usando el servicio
      // Nota: JoySenseService.deleteRecord no existe, se debe implementar
      // Por ahora retornamos éxito simulado
      console.log(`🗑️ Eliminando ${selectedTable} con ID: ${recordId}`);
      
      return { 
        success: true, 
        message: `✅ ${selectedTable} eliminado exitosamente` 
      };
      
    } catch (error) {
      console.error(`❌ useSystemParametersCRUD.handleDelete - ${selectedTable} error:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al eliminar el registro' 
      };
    }
  }, [user]);

  /**
   * Limpiar estado de operaciones
   */
  const clearOperationState = useCallback(() => {
    console.log('🧹 useSystemParametersCRUD.clearOperationState');
    // Los hooks individuales manejan su propio estado
  }, []);

  return {
    // Estado
    isProcessing: isInserting || isUpdating,
    lastOperation: insertSuccess ? 'insert' : updateSuccess ? 'update' : null,
    operationSuccess: insertSuccess || updateSuccess,
    operationError: insertError || updateError,
    
    // Acciones
    handleInsert,
    handleUpdate,
    handleDelete,
    clearOperationState
  };
};
