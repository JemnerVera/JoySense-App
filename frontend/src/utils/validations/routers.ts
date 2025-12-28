// ============================================================================
// VALIDATION ROUTERS
// ============================================================================
// Funciones router que dirigen a las validaciones específicas por módulo

import { EnhancedValidationResult } from './types';
import { validateFormData } from './common';

// Geografía
import {
  validatePaisData,
  validatePaisUpdate,
  validateEmpresaData,
  validateEmpresaUpdate,
  validateFundoData,
  validateFundoUpdate,
  validateUbicacionData,
  validateUbicacionUpdate,
  validateLocalizacionData,
  validateLocalizacionUpdate
} from './geografia';

// Dispositivos
import {
  validateEntidadData,
  validateEntidadUpdate,
  validateTipoData,
  validateTipoUpdate,
  validateNodoData,
  validateNodoUpdate,
  validateMetricaData,
  validateMetricaUpdate
} from './dispositivos';

// Alertas
import {
  validateUmbralData,
  validateUmbralUpdate,
  // validatePerfilUmbralData, validatePerfilUmbralUpdate - eliminadas (perfilumbral ya no existe)
  validateCriticidadData,
  validateCriticidadUpdate
} from './alertas';

// Usuarios
import {
  validateUsuarioData,
  validateUsuarioUpdate,
  validatePerfilData,
  validatePerfilUpdate,
  validateUsuarioPerfilUpdate,
  validateContactoData,
  validateContactoUpdate,
  validateCorreoData,
  validateCorreoUpdate,
  validateMedioData,
  validateMedioUpdate
} from './usuarios';

// ============================================================================
// ROUTER FUNCTIONS
// ============================================================================

export const validateTableUpdate = async (
  tableName: string,
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  
  switch (tableName) {
    // Geografía
    case 'pais':
      return await validatePaisUpdate(formData, originalData, existingData || []);
    case 'empresa':
      return await validateEmpresaUpdate(formData, originalData, existingData || []);
    case 'fundo':
      return await validateFundoUpdate(formData, originalData, existingData || []);
    case 'ubicacion':
      return await validateUbicacionUpdate(formData, originalData, existingData || []);
    case 'localizacion':
      return await validateLocalizacionUpdate(formData, originalData, existingData || []);
    
    // Dispositivos
    case 'entidad':
      return await validateEntidadUpdate(formData, originalData, existingData || []);
    case 'tipo':
      return await validateTipoUpdate(formData, originalData, existingData || []);
    case 'nodo':
      return await validateNodoUpdate(formData, originalData, existingData || []);
    case 'metrica':
      return await validateMetricaUpdate(formData, originalData, existingData || []);
    
    // Alertas
    case 'umbral':
      return await validateUmbralUpdate(formData, originalData, existingData || []);
    // perfilumbral ya no existe - reemplazado por regla_perfil y regla_umbral
    case 'criticidad':
      return await validateCriticidadUpdate(formData, originalData, existingData || []);
    
    // Usuarios
    case 'medio':
      return await validateMedioUpdate(formData, originalData, existingData || []);
    case 'contacto':
      return await validateContactoUpdate(formData, originalData, existingData || []);
    case 'correo':
      return await validateCorreoUpdate(formData, originalData, existingData || []);
    case 'usuario':
      return await validateUsuarioUpdate(formData, originalData, existingData || []);
    case 'perfil':
      return await validatePerfilUpdate(formData, originalData, existingData || []);
    case 'usuarioperfil':
      return await validateUsuarioPerfilUpdate(formData, originalData, existingData || []);
    
    default:
      // Fallback a validación básica
      const basicResult = validateFormData(tableName, formData);
      return {
        isValid: basicResult.isValid,
        errors: basicResult.errors.map(error => ({
          field: 'general',
          message: error,
          type: 'format' as const
        })),
        userFriendlyMessage: basicResult.errors.length > 0 
          ? basicResult.errors.map(error => error).join('\n')
          : ''
      };
  }
};

export const validateTableData = async (
  tableName: string, 
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  
  switch (tableName) {
    // Geografía
    case 'pais':
      return await validatePaisData(formData, existingData);
    case 'empresa':
      return await validateEmpresaData(formData, existingData);
    case 'fundo':
      return await validateFundoData(formData, existingData);
    case 'ubicacion':
      return await validateUbicacionData(formData, existingData);
    case 'localizacion':
      return await validateLocalizacionData(formData, existingData);
    
    // Dispositivos
    case 'entidad':
      return await validateEntidadData(formData, existingData);
    case 'tipo':
      return await validateTipoData(formData, existingData);
    case 'nodo':
      return await validateNodoData(formData, existingData);
    case 'metrica':
      return await validateMetricaData(formData, existingData);
    
    // Alertas
    case 'umbral':
      return await validateUmbralData(formData, existingData);
    // perfilumbral ya no existe - reemplazado por regla_perfil y regla_umbral
    case 'criticidad':
      return await validateCriticidadData(formData, existingData);
    
    // Usuarios
    case 'medio':
      return await validateMedioData(formData, existingData);
    case 'contacto':
      return await validateContactoData(formData, existingData);
    case 'correo':
      return await validateCorreoData(formData, existingData);
    case 'perfil':
      return await validatePerfilData(formData, existingData);
    case 'usuario':
      return await validateUsuarioData(formData, existingData || []);
    
    default:
      // Fallback a validación básica
      const basicResult = validateFormData(tableName, formData);
      return {
        isValid: basicResult.isValid,
        errors: basicResult.errors.map(error => ({
          field: 'general',
          message: error,
          type: 'format' as const
        })),
        userFriendlyMessage: basicResult.errors.length > 0 
          ? basicResult.errors.map(error => error).join('\n')
          : ''
      };
  }
};
