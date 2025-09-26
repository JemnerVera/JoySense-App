import { useState, useCallback } from 'react';
import { JoySenseService } from '../services/backend-api';
import { backendAPI } from '../services/backend-api';
import { useAuth } from '../contexts/AuthContext';
import { validateTableData } from '../utils/formValidation';
import { handleInsertError, handleMultipleInsertError, BackendError } from '../utils/errorHandler';

export interface InsertOperationState {
  isInserting: boolean;
  insertError: string | null;
  insertSuccess: boolean;
  lastInsertedId: number | null;
}

export interface InsertOperationActions {
  insertSingle: (tableName: string, formData: Record<string, any>) => Promise<{ success: boolean; id?: number; error?: string }>;
  insertMultiple: (tableName: string, multipleData: any[]) => Promise<{ success: boolean; insertedCount?: number; errors?: string[] }>;
  insertMassive: (tableName: string, massiveData: any[]) => Promise<{ success: boolean; insertedCount?: number; error?: string }>;
  clearInsertState: () => void;
  setInserting: (isInserting: boolean) => void;
  setInsertError: (error: string | null) => void;
  setInsertSuccess: (success: boolean) => void;
}

/**
 * Hook personalizado para manejar operaciones de inserción
 * Incluye validación, manejo de errores y estados de carga
 */
export const useInsertOperations = (): InsertOperationState & InsertOperationActions => {
  
  const { user } = useAuth();
  
  const [isInserting, setIsInserting] = useState(false);
  const [insertError, setInsertErrorState] = useState<string | null>(null);
  const [insertSuccess, setInsertSuccessState] = useState(false);
  const [lastInsertedId, setLastInsertedId] = useState<number | null>(null);

  /**
   * Insertar un solo registro
   */
  const insertSingle = useCallback(async (
    tableName: string, 
    formData: Record<string, any>
  ): Promise<{ success: boolean; id?: number; error?: string }> => {
    
    setIsInserting(true);
    setInsertErrorState(null);
    setInsertSuccessState(false);

    try {
      // Validar datos antes de insertar
      const validationResult = await validateTableData(tableName, formData);
      
      if (!validationResult.isValid) {
        const errorMessage = validationResult.userFriendlyMessage || 'Datos inválidos';
        setInsertErrorState(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Preparar datos para inserción
      const dataToInsert = {
        ...formData,
        user_created_id: user?.id || 1,
        date_created: new Date().toISOString()
      };

      // Realizar inserción
      const response = await backendAPI.post(`/${tableName}`, dataToInsert);
      
      
      setInsertSuccessState(true);
      setLastInsertedId(response.id || response[`${tableName}id`] || null);
      
      return { success: true, id: response.id || response[`${tableName}id`] || null };
      
    } catch (error) {
      console.error(`❌ useInsertOperations.insertSingle - ${tableName} error:`, error);
      
      const errorResponse = handleInsertError(error as BackendError);
      setInsertErrorState(errorResponse.message);
      
      return { success: false, error: errorResponse.message };
    } finally {
      setIsInserting(false);
    }
  }, [user]);

  /**
   * Insertar múltiples registros
   */
  const insertMultiple = useCallback(async (
    tableName: string, 
    multipleData: any[]
  ): Promise<{ success: boolean; insertedCount?: number; errors?: string[] }> => {
    
    setIsInserting(true);
    setInsertErrorState(null);
    setInsertSuccessState(false);

    try {
      const results = [];
      const errors = [];
      let insertedCount = 0;

      // Validar y insertar cada registro
      for (let i = 0; i < multipleData.length; i++) {
        const data = multipleData[i];
        
        try {
          // Validar datos
          const validationResult = await validateTableData(tableName, data);
          
          if (!validationResult.isValid) {
            errors.push(`Registro ${i + 1}: ${validationResult.userFriendlyMessage || 'Datos inválidos'}`);
            continue;
          }

          // Preparar datos para inserción
          const dataToInsert = {
            ...data,
            user_created_id: user?.id || 1,
            date_created: new Date().toISOString()
          };

          // Realizar inserción
          const response = await backendAPI.post(`/${tableName}`, dataToInsert);
          results.push(response);
          insertedCount++;
          
        } catch (error) {
          console.error(`❌ useInsertOperations.insertMultiple - ${tableName} error for record ${i + 1}:`, error);
          const errorResponse = handleMultipleInsertError(error as BackendError, tableName);
          errors.push(errorResponse.message);
        }
      }

      if (insertedCount > 0) {
        setInsertSuccessState(true);
        setLastInsertedId(results[results.length - 1]?.id || results[results.length - 1]?.[`${tableName}id`] || null);
      }

      if (errors.length > 0) {
        setInsertErrorState(`Se insertaron ${insertedCount} de ${multipleData.length} registros. Errores: ${errors.join(', ')}`);
      }

      return { 
        success: insertedCount > 0, 
        insertedCount, 
        errors: errors.length > 0 ? errors : undefined 
      };
      
    } catch (error) {
      console.error(`❌ useInsertOperations.insertMultiple - ${tableName} general error:`, error);
      
      const errorResponse = handleMultipleInsertError(error as BackendError, tableName);
      setInsertErrorState(errorResponse.message);
      
      return { success: false, errors: [errorResponse.message] };
    } finally {
      setIsInserting(false);
    }
  }, [user]);

  /**
   * Inserción masiva
   */
  const insertMassive = useCallback(async (
    tableName: string, 
    massiveData: any[]
  ): Promise<{ success: boolean; insertedCount?: number; error?: string }> => {
    
    setIsInserting(true);
    setInsertErrorState(null);
    setInsertSuccessState(false);

    try {
      // Preparar datos para inserción masiva
      const dataToInsert = massiveData.map(data => ({
        ...data,
        user_created_id: user?.id || 1,
        date_created: new Date().toISOString()
      }));

      // Realizar inserción masiva
      const response = await backendAPI.post(`/${tableName}/massive`, dataToInsert);
      
      
      setInsertSuccessState(true);
      setLastInsertedId(response.lastInsertedId || null);
      
      return { 
        success: true, 
        insertedCount: response.insertedCount || massiveData.length 
      };
      
    } catch (error) {
      console.error(`❌ useInsertOperations.insertMassive - ${tableName} error:`, error);
      
      const errorResponse = handleInsertError(error as BackendError);
      setInsertErrorState(errorResponse.message);
      
      return { success: false, error: errorResponse.message };
    } finally {
      setIsInserting(false);
    }
  }, [user]);

  /**
   * Limpiar estado de inserción
   */
  const clearInsertState = useCallback(() => {
    setInsertErrorState(null);
    setInsertSuccessState(false);
    setLastInsertedId(null);
  }, []);

  /**
   * Establecer estado de inserción
   */
  const setInserting = useCallback((inserting: boolean) => {
    setIsInserting(inserting);
  }, []);

  /**
   * Establecer error de inserción
   */
  const setInsertError = useCallback((error: string | null) => {
    setInsertErrorState(error);
  }, []);

  /**
   * Establecer éxito de inserción
   */
  const setInsertSuccess = useCallback((success: boolean) => {
    setInsertSuccessState(success);
  }, []);

  return {
    // Estado
    isInserting,
    insertError,
    insertSuccess,
    lastInsertedId,
    
    // Acciones
    insertSingle,
    insertMultiple,
    insertMassive,
    clearInsertState,
    setInserting,
    setInsertError,
    setInsertSuccess
  };
};
