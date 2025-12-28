import { useCallback } from 'react';
import { validateTableData, validateTableUpdate, ValidationResult, EnhancedValidationResult } from '../utils/validations';
import { JoySenseService } from '../services/backend-api';
import { logger } from '../utils/logger';

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
      logger.error('Error en validateInsert:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la inserción',
          type: 'format'
        }],
        userFriendlyMessage: 'Error al validar la inserción'
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
      logger.error('Error en validateUpdate:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la actualización',
          type: 'format'
        }],
        userFriendlyMessage: 'Error al validar la actualización'
      };
    }
  }, [selectedTable]);

  /**
   * Verifica si un registro tiene dependencias antes de inactivar
   * Optimización: Cachear resultados y hacer llamadas paralelas cuando sea posible
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
            // Nota: localizacion ya no tiene ubicacionid según el schema actual
            // Las localizaciones están asociadas directamente a nodos, no a ubicaciones
            return false;
            
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
            // Nota: umbral ya no tiene metricaid según el schema actual
            // Los umbrales están asociados a localizaciones, que a su vez tienen metricaid
            // Verificar a través de localizaciones
            const localizacionesData = await JoySenseService.getTableData('localizacion');
            const localizacionesConMetrica = localizacionesData.filter((loc: any) => loc.metricaid === id);
            if (localizacionesConMetrica.length === 0) return false;
            
            const localizacionIds = localizacionesConMetrica.map((loc: any) => loc.localizacionid);
            const umbrales = await JoySenseService.getTableData('umbral');
            return umbrales.some((umbral: any) => localizacionIds.includes(umbral.localizacionid));
            
          case 'umbral':
            // Verificar si hay regla_umbral que referencian este umbral
            const reglaUmbrales = await JoySenseService.getTableData('regla_umbral');
            return reglaUmbrales.some((ru: any) => ru.umbralid === id);
            
          case 'criticidad':
            // Nota: umbral ya no tiene criticidadid según el schema actual
            // Solo verificar alertas que puedan tener criticidadid
            const alertas = await JoySenseService.getTableData('alerta');
            return alertas.some((alerta: any) => alerta.criticidadid === id);
            
          case 'medio':
            // Verificar si hay contactos que referencian este medio
            const contactos = await JoySenseService.getTableData('contacto');
            return contactos.some(contacto => contacto.medioid === id);
            
          case 'usuario':
            // Optimización: Hacer llamadas paralelas para usuario
            const [contactosUsuario, usuarioperfiles] = await Promise.all([
              JoySenseService.getTableData('contacto'),
              JoySenseService.getTableData('usuarioperfil')
            ]);
            return contactosUsuario.some(contacto => contacto.usuarioid === id) ||
                   usuarioperfiles.some(usuarioperfil => usuarioperfil.usuarioid === id);
                   
          case 'perfil':
            // Optimización: Hacer llamadas paralelas para perfil
            const [usuarioperfilesPerfil, reglaPerfilesPerfil] = await Promise.all([
              JoySenseService.getTableData('usuarioperfil'),
              JoySenseService.getTableData('regla_perfil')
            ]);
            return usuarioperfilesPerfil.some(usuarioperfil => usuarioperfil.perfilid === id) ||
                   reglaPerfilesPerfil.some(reglaPerfil => reglaPerfil.perfilid === id);
                   
          default:
            return false;
        }
      };
      
      const hasDependencies = await checkTableDependencies(selectedTable, recordId);
      
      
      return hasDependencies;
    } catch (error) {
      logger.error('Error en checkDependencies:', error);
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
      logger.error('Error en validateMultipleInsert:', error);
      return multipleData.map(() => ({
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la inserción múltiple',
          type: 'format'
        }],
        userFriendlyMessage: 'Error al validar la inserción múltiple'
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
      logger.error('Error en validateMassiveInsert:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error al validar la inserción masiva',
          type: 'format'
        }],
        userFriendlyMessage: 'Error al validar la inserción masiva'
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
