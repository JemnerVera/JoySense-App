import { useCallback } from 'react';
import { validateTableData, validateTableUpdate, ValidationResult, EnhancedValidationResult } from '../utils/formValidation';
import { JoySenseService } from '../services/backend-api';

export interface UseFormValidationReturn {
  validateInsert: (formData: Record<string, any>) => Promise<EnhancedValidationResult>;
  validateUpdate: (formData: Record<string, any>, originalData: Record<string, any>) => Promise<EnhancedValidationResult>;
  checkDependencies: (recordId: number) => Promise<boolean>;
  validateMultipleInsert: (multipleData: any[]) => Promise<EnhancedValidationResult[]>;
  validateMassiveInsert: (massiveFormData: Record<string, any>) => Promise<EnhancedValidationResult>;
}

/**
 * Hook personalizado para manejar toda la lógica de validación de formularios
 * Extrae la complejidad de validación del componente principal
 */
export const useFormValidation = (selectedTable: string): UseFormValidationReturn => {
  
  /**
   * Valida datos de inserción para la tabla seleccionada
   */
  const validateInsert = useCallback(async (formData: Record<string, any>): Promise<EnhancedValidationResult> => {
    
    try {
      const result = await validateTableData(selectedTable, formData);
      
      
      return result;
    } catch (error) {
      console.error('Error en validateInsert:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la inserción',
          type: 'format'
        }],
        userFriendlyMessage: '⚠️ Error al validar la inserción'
      };
    }
  }, [selectedTable]);

  /**
   * Valida datos de actualización para la tabla seleccionada
   * Incluye verificación de dependencias
   */
  const validateUpdate = useCallback(async (
    formData: Record<string, any>, 
    originalData: Record<string, any>
  ): Promise<EnhancedValidationResult> => {
    
    try {
      // Obtener datos existentes para validación de duplicados
      const existingData = await JoySenseService.getTableData(selectedTable);
      
      const result = await validateTableUpdate(selectedTable, formData, originalData, existingData);
      
      
      return result;
    } catch (error) {
      console.error('Error en validateUpdate:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la actualización',
          type: 'format'
        }],
        userFriendlyMessage: '⚠️ Error al validar la actualización'
      };
    }
  }, [selectedTable]);

  /**
   * Verifica si un registro tiene dependencias antes de inactivar
   */
  const checkDependencies = useCallback(async (recordId: number): Promise<boolean> => {
    
    try {
      // Función auxiliar para verificar dependencias por tabla
      const checkTableDependencies = async (tableName: string, id: number): Promise<boolean> => {
        switch (tableName) {
          case 'pais':
            // Verificar si hay empresas que referencian este país
            const empresas = await JoySenseService.getTableData('empresa');
            return empresas.some(empresa => empresa.paisid === id);
            
          case 'empresa':
            // Verificar si hay fundos que referencian esta empresa
            const fundos = await JoySenseService.getTableData('fundo');
            return fundos.some(fundo => fundo.empresaid === id);
            
          case 'fundo':
            // Verificar si hay ubicaciones que referencian este fundo
            const ubicaciones = await JoySenseService.getTableData('ubicacion');
            return ubicaciones.some(ubicacion => ubicacion.fundoid === id);
            
          case 'ubicacion':
            // Verificar si hay localizaciones que referencian esta ubicación
            const localizaciones = await JoySenseService.getTableData('localizacion');
            return localizaciones.some(localizacion => localizacion.ubicacionid === id);
            
          case 'entidad':
            // Verificar si hay tipos que referencian esta entidad
            const tipos = await JoySenseService.getTableData('tipo');
            return tipos.some(tipo => tipo.entidadid === id);
            
          case 'tipo':
            // Verificar si hay sensores que referencian este tipo
            const sensores = await JoySenseService.getTableData('sensor');
            return sensores.some(sensor => sensor.tipoid === id);
            
          case 'nodo':
            // Verificar si hay sensores que referencian este nodo
            const sensoresNodo = await JoySenseService.getTableData('sensor');
            return sensoresNodo.some(sensor => sensor.nodoid === id);
            
          case 'metrica':
            // Verificar si hay umbrales que referencian esta métrica
            const umbrales = await JoySenseService.getTableData('umbral');
            return umbrales.some(umbral => umbral.metricaid === id);
            
          case 'umbral':
            // Verificar si hay perfilumbrales que referencian este umbral
            const perfilumbrales = await JoySenseService.getTableData('perfilumbral');
            return perfilumbrales.some(perfilumbral => perfilumbral.umbralid === id);
            
          case 'criticidad':
            // Verificar si hay umbrales que referencian esta criticidad
            const umbralesCriticidad = await JoySenseService.getTableData('umbral');
            return umbralesCriticidad.some(umbral => umbral.criticidadid === id);
            
          case 'medio':
            // Verificar si hay contactos que referencian este medio
            const contactos = await JoySenseService.getTableData('contacto');
            return contactos.some(contacto => contacto.medioid === id);
            
          case 'usuario':
            // Verificar si hay contactos o usuarioperfiles que referencian este usuario
            const contactosUsuario = await JoySenseService.getTableData('contacto');
            const usuarioperfiles = await JoySenseService.getTableData('usuarioperfil');
            return contactosUsuario.some(contacto => contacto.usuarioid === id) ||
                   usuarioperfiles.some(usuarioperfil => usuarioperfil.usuarioid === id);
                   
          case 'perfil':
            // Verificar si hay usuarioperfiles o perfilumbrales que referencian este perfil
            const usuarioperfilesPerfil = await JoySenseService.getTableData('usuarioperfil');
            const perfilumbralesPerfil = await JoySenseService.getTableData('perfilumbral');
            return usuarioperfilesPerfil.some(usuarioperfil => usuarioperfil.perfilid === id) ||
                   perfilumbralesPerfil.some(perfilumbral => perfilumbral.perfilid === id);
                   
          default:
            return false;
        }
      };
      
      const hasDependencies = await checkTableDependencies(selectedTable, recordId);
      
      
      return hasDependencies;
    } catch (error) {
      console.error('Error en checkDependencies:', error);
      return false; // En caso de error, permitir la operación
    }
  }, [selectedTable]);

  /**
   * Valida datos de inserción múltiple
   */
  const validateMultipleInsert = useCallback(async (multipleData: any[]): Promise<EnhancedValidationResult[]> => {
    
    try {
      const results = await Promise.all(
        multipleData.map(async (data, index) => {
          const result = await validateTableData(selectedTable, data);
          return result;
        })
      );
      
      
      return results;
    } catch (error) {
      console.error('Error en validateMultipleInsert:', error);
      return multipleData.map(() => ({
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la inserción múltiple',
          type: 'format'
        }],
        userFriendlyMessage: '⚠️ Error al validar la inserción múltiple'
      }));
    }
  }, [selectedTable]);

  /**
   * Valida datos de inserción masiva
   */
  const validateMassiveInsert = useCallback(async (massiveFormData: Record<string, any>): Promise<EnhancedValidationResult> => {
    
    try {
      // Para inserción masiva, validamos los datos base
      const result = await validateTableData(selectedTable, massiveFormData);
      
      
      return result;
    } catch (error) {
      console.error('Error en validateMassiveInsert:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la inserción masiva',
          type: 'format'
        }],
        userFriendlyMessage: '⚠️ Error al validar la inserción masiva'
      };
    }
  }, [selectedTable]);

  return {
    validateInsert,
    validateUpdate,
    checkDependencies,
    validateMultipleInsert,
    validateMassiveInsert
  };
};
