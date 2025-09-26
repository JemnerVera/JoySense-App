import { useState, useCallback } from 'react';
import { JoySenseService } from '../services/backend-api';
import { backendAPI } from '../services/backend-api';
import { useAuth } from '../contexts/AuthContext';
import { validateTableUpdate } from '../utils/formValidation';

export interface UpdateOperationState {
  isUpdating: boolean;
  updateError: string | null;
  updateSuccess: boolean;
  lastUpdatedId: number | null;
}

export interface UpdateOperationActions {
  updateSingle: (tableName: string, formData: Record<string, any>, originalData: Record<string, any>) => Promise<{ success: boolean; id?: number; error?: string }>;
  updateMultiple: (tableName: string, updates: Array<{ id: number; data: Record<string, any> }>) => Promise<{ success: boolean; updatedCount?: number; errors?: string[] }>;
  clearUpdateState: () => void;
  setUpdating: (isUpdating: boolean) => void;
  setUpdateError: (error: string | null) => void;
  setUpdateSuccess: (success: boolean) => void;
}

/**
 * Hook personalizado para manejar operaciones de actualización
 * Incluye validación, verificación de dependencias y manejo de errores
 */
export const useUpdateOperations = (): UpdateOperationState & UpdateOperationActions => {
  
  const { user } = useAuth();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateErrorState] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccessState] = useState(false);
  const [lastUpdatedId, setLastUpdatedId] = useState<number | null>(null);

  /**
   * Actualizar un solo registro
   */
  const updateSingle = useCallback(async (
    tableName: string, 
    formData: Record<string, any>,
    originalData: Record<string, any>
  ): Promise<{ success: boolean; id?: number; error?: string }> => {
    
    setIsUpdating(true);
    setUpdateErrorState(null);
    setUpdateSuccessState(false);

    try {
      // Obtener datos existentes para validación de duplicados
      const existingData = await JoySenseService.getTableData(tableName);
      
      // Validar datos antes de actualizar
      const validationResult = await validateTableUpdate(tableName, formData, originalData, existingData);
      
      if (!validationResult.isValid) {
        const errorMessage = validationResult.userFriendlyMessage || 'Datos inválidos';
        setUpdateErrorState(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Preparar datos para actualización
      const dataToUpdate = {
        ...formData,
        user_updated_id: user?.id || 1,
        date_updated: new Date().toISOString()
      };

      // Obtener ID del registro a actualizar
      const recordId = originalData[`${tableName}id`] || originalData.id;
      
      if (!recordId) {
        const errorMessage = 'ID del registro no encontrado';
        setUpdateErrorState(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Realizar actualización
      const response = await backendAPI.put(`/${tableName}/${recordId}`, dataToUpdate);
      
      
      setUpdateSuccessState(true);
      setLastUpdatedId(recordId);
      
      return { success: true, id: recordId };
      
    } catch (error) {
      console.error(`❌ useUpdateOperations.updateSingle - ${tableName} error:`, error);
      
      let errorMessage = 'Error al actualizar el registro';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const errorResponse = (error as any).response;
        if (errorResponse?.data?.error) {
          errorMessage = errorResponse.data.error;
        }
      }
      
      setUpdateErrorState(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  }, [user]);

  /**
   * Actualizar múltiples registros
   */
  const updateMultiple = useCallback(async (
    tableName: string, 
    updates: Array<{ id: number; data: Record<string, any> }>
  ): Promise<{ success: boolean; updatedCount?: number; errors?: string[] }> => {
    
    setIsUpdating(true);
    setUpdateErrorState(null);
    setUpdateSuccessState(false);

    try {
      const results = [];
      const errors = [];
      let updatedCount = 0;

      // Obtener datos existentes para validación de duplicados
      const existingData = await JoySenseService.getTableData(tableName);

      // Actualizar cada registro
      for (let i = 0; i < updates.length; i++) {
        const { id, data } = updates[i];
        
        try {
          // Buscar datos originales
          const originalData = existingData.find(item => 
            item[`${tableName}id`] === id || item.id === id
          );
          
          if (!originalData) {
            errors.push(`Registro ${i + 1}: Registro no encontrado`);
            continue;
          }

          // Validar datos
          const validationResult = await validateTableUpdate(tableName, data, originalData, existingData);
          
          if (!validationResult.isValid) {
            errors.push(`Registro ${i + 1}: ${validationResult.userFriendlyMessage || 'Datos inválidos'}`);
            continue;
          }

          // Preparar datos para actualización
          const dataToUpdate = {
            ...data,
            user_updated_id: user?.id || 1,
            date_updated: new Date().toISOString()
          };

          // Realizar actualización
          const response = await backendAPI.put(`/${tableName}/${id}`, dataToUpdate);
          results.push(response);
          updatedCount++;
          
        } catch (error) {
          console.error(`❌ useUpdateOperations.updateMultiple - ${tableName} error for record ${i + 1}:`, error);
          
          let errorMessage = `Error al actualizar registro ${i + 1}`;
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'response' in error) {
            const errorResponse = (error as any).response;
            if (errorResponse?.data?.error) {
              errorMessage = errorResponse.data.error;
            }
          }
          
          errors.push(errorMessage);
        }
      }

      if (updatedCount > 0) {
        setUpdateSuccessState(true);
        setLastUpdatedId(updates[updates.length - 1]?.id || null);
      }

      if (errors.length > 0) {
        setUpdateErrorState(`Se actualizaron ${updatedCount} de ${updates.length} registros. Errores: ${errors.join(', ')}`);
      }

      return { 
        success: updatedCount > 0, 
        updatedCount, 
        errors: errors.length > 0 ? errors : undefined 
      };
      
    } catch (error) {
      console.error(`❌ useUpdateOperations.updateMultiple - ${tableName} general error:`, error);
      
      let errorMessage = 'Error general al actualizar registros';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setUpdateErrorState(errorMessage);
      
      return { success: false, errors: [errorMessage] };
    } finally {
      setIsUpdating(false);
    }
  }, [user]);

  /**
   * Limpiar estado de actualización
   */
  const clearUpdateState = useCallback(() => {
    setUpdateErrorState(null);
    setUpdateSuccessState(false);
    setLastUpdatedId(null);
  }, []);

  /**
   * Establecer estado de actualización
   */
  const setUpdating = useCallback((updating: boolean) => {
    setIsUpdating(updating);
  }, []);

  /**
   * Establecer error de actualización
   */
  const setUpdateError = useCallback((error: string | null) => {
    setUpdateErrorState(error);
  }, []);

  /**
   * Establecer éxito de actualización
   */
  const setUpdateSuccess = useCallback((success: boolean) => {
    setUpdateSuccessState(success);
  }, []);

  return {
    // Estado
    isUpdating,
    updateError,
    updateSuccess,
    lastUpdatedId,
    
    // Acciones
    updateSingle,
    updateMultiple,
    clearUpdateState,
    setUpdating,
    setUpdateError,
    setUpdateSuccess
  };
};
