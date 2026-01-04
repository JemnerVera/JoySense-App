// ============================================================================
// USUARIOS VALIDATIONS
// ============================================================================
// Validaciones para: usuario, perfil, usuarioperfil, contacto, correo, medio

import { JoySenseService } from '../../services/backend-api';
import { ValidationError, EnhancedValidationResult } from './types';
import { generateUserFriendlyMessage, generateUpdateUserFriendlyMessage } from './common';
import { logger } from '../../utils/logger';

// ============================================================================
// USUARIO VALIDATIONS
// ============================================================================

export const validateUsuarioData = async (
  formData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.login || formData.login.trim() === '') {
    errors.push({
      field: 'login',
      message: 'El login es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.firstname || formData.firstname.trim() === '') {
    errors.push({
      field: 'firstname',
      message: 'El nombre es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.lastname || formData.lastname.trim() === '') {
    errors.push({
      field: 'lastname',
      message: 'El apellido es obligatorio',
      type: 'required'
    });
  }
  
  // Validar formato de email para login
  if (formData.login && formData.login.trim() !== '') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.login)) {
      errors.push({
        field: 'login',
        message: 'El login debe tener formato de email válido',
        type: 'format'
      });
    }
  }
  
  // 2. Validar duplicados
  if (formData.login && formData.login.trim() !== '') {
    const loginExists = existingData.some(item => 
      item.login && 
      item.login.toLowerCase() === formData.login.toLowerCase()
    );
    
    if (loginExists) {
      errors.push({
        field: 'login',
        message: 'El login ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Generar mensaje amigable para inserción
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const validateUsuarioUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.login || formData.login.trim() === '') {
    errors.push({
      field: 'login',
      message: 'El login es obligatorio',
      type: 'required'
    });
  }
  
  // Validar formato de email para login
  if (formData.login && formData.login.trim() !== '') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.login)) {
      errors.push({
        field: 'login',
        message: 'El login debe tener formato de email válido',
        type: 'format'
      });
    }
  }
  
  // Validar campos obligatorios: firstname y lastname (NOT NULL en schema)
  if (!formData.firstname || formData.firstname.trim() === '') {
    errors.push({
      field: 'firstname',
      message: 'El nombre es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.lastname || formData.lastname.trim() === '') {
    errors.push({
      field: 'lastname',
      message: 'El apellido es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.login && formData.login.trim() !== '') {
    const loginExists = existingData.some(item => 
      item.usuarioid !== originalData.usuarioid && 
      item.login && 
      item.login.toLowerCase() === formData.login.toLowerCase()
    );
    
    if (loginExists) {
      errors.push({
        field: 'login',
        message: 'El login ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkUsuarioDependencies(originalData.usuarioid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el usuario porque tiene perfiles, contactos, logs o alertas asociadas',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const checkUsuarioDependencies = async (usuarioid: number): Promise<boolean> => {
  try {
    const usuarioperfiles = await JoySenseService.getTableData('usuarioperfil');
    const hasUsuarioperfiles = usuarioperfiles.some(usuarioperfil => usuarioperfil.usuarioid === usuarioid);
    if (hasUsuarioperfiles) return true;
    
    const contactos = await JoySenseService.getTableData('contacto');
    const hasContactos = contactos.some(contacto => contacto.usuarioid === usuarioid);
    if (hasContactos) return true;
    
    const auditLogs = await JoySenseService.getTableData('audit_log_umbral');
    const hasAuditLogs = auditLogs.some(auditLog => auditLog.modified_by === usuarioid);
    if (hasAuditLogs) return true;
    
    // ⚠️ Actualizado: La tabla 'alerta' fue eliminada en SCHEMA_04.01.2025
    // alerta_regla no tiene usuarioid directamente
    // Verificar otras dependencias del usuario
    const hasAlertas = false; // alerta_regla no tiene usuarioid directo
    return hasAlertas;
  } catch (error) {
    logger.error('Error checking usuario dependencies:', error);
    return false;
  }
};

// ============================================================================
// PERFIL VALIDATIONS
// ============================================================================

export const validatePerfilData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.perfil || formData.perfil.trim() === '') {
    errors.push({
      field: 'perfil',
      message: 'El nombre del perfil es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar nivel (obligatorio y debe ser número)
  if (!formData.nivel || formData.nivel === '' || isNaN(Number(formData.nivel))) {
    errors.push({
      field: 'nivel',
      message: 'El nivel del perfil es obligatorio y debe ser un número',
      type: 'required'
    });
  }
  
  // 3. Validar constraint de jerarquía: si hay jefeid, nivel debe ser > 0
  if (formData.jefeid && formData.jefeid !== '' && formData.nivel !== '' && !isNaN(Number(formData.nivel))) {
    if (Number(formData.nivel) <= 0) {
      errors.push({
        field: 'nivel',
        message: 'Si se asigna un jefe, el nivel debe ser mayor a 0',
        type: 'constraint'
      });
    }
  }
  
  // 4. Validar que el jefe tenga nivel menor (si se asigna jefe)
  if (formData.jefeid && formData.jefeid !== '' && formData.nivel !== '' && !isNaN(Number(formData.nivel))) {
    const jefePerfil = existingData?.find(item => item.perfilid === formData.jefeid);
    if (jefePerfil && jefePerfil.nivel >= Number(formData.nivel)) {
      errors.push({
        field: 'jefeid',
        message: `El jefe debe tener nivel menor al perfil (jefe: ${jefePerfil.nivel}, perfil: ${formData.nivel})`,
        type: 'constraint'
      });
    }
  }
  
  // 5. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const perfilExists = existingData.some(item => 
      item.perfil && item.perfil.toLowerCase() === formData.perfil?.toLowerCase()
    );
    
    const nivelExists = existingData.some(item => 
      item.nivel && item.nivel.toString().toLowerCase() === formData.nivel?.toLowerCase()
    );
    
    if (perfilExists && nivelExists) {
      errors.push({
        field: 'both',
        message: 'El perfil y nivel ya existen',
        type: 'duplicate'
      });
    } else if (perfilExists) {
      errors.push({
        field: 'perfil',
        message: 'El nombre del perfil ya existe',
        type: 'duplicate'
      });
    } else if (nivelExists) {
      errors.push({
        field: 'nivel',
        message: 'El nivel del perfil ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 6. Generar mensaje amigable
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const validatePerfilUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.perfil || formData.perfil.trim() === '') {
    errors.push({
      field: 'perfil',
      message: 'El nombre del perfil es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar nivel (obligatorio y debe ser número)
  if (!formData.nivel || formData.nivel === '' || isNaN(Number(formData.nivel))) {
    errors.push({
      field: 'nivel',
      message: 'El nivel del perfil es obligatorio y debe ser un número',
      type: 'required'
    });
  }
  
  // 3. Validar constraint de jerarquía: si hay jefeid, nivel debe ser > 0
  if (formData.jefeid && formData.jefeid !== '' && formData.nivel !== '' && !isNaN(Number(formData.nivel))) {
    if (Number(formData.nivel) <= 0) {
      errors.push({
        field: 'nivel',
        message: 'Si se asigna un jefe, el nivel debe ser mayor a 0',
        type: 'constraint'
      });
    }
  }
  
  // 4. Validar que el jefe tenga nivel menor (si se asigna jefe)
  if (formData.jefeid && formData.jefeid !== '' && formData.nivel !== '' && !isNaN(Number(formData.nivel))) {
    const jefePerfil = existingData.find(item => item.perfilid === formData.jefeid);
    if (jefePerfil && jefePerfil.nivel >= Number(formData.nivel)) {
      errors.push({
        field: 'jefeid',
        message: `El jefe debe tener nivel menor al perfil (jefe: ${jefePerfil.nivel}, perfil: ${formData.nivel})`,
        type: 'constraint'
      });
    }
  }
  
  // 5. Validar duplicados (excluyendo el registro actual)
  if (formData.perfil && formData.perfil.trim() !== '') {
    const perfilExists = existingData.some(item => 
      item.perfilid !== originalData.perfilid && 
      item.perfil && 
      item.perfil.toLowerCase() === formData.perfil.toLowerCase()
    );
    
    if (perfilExists) {
      errors.push({
        field: 'perfil',
        message: 'El nombre del perfil ya existe',
        type: 'duplicate'
      });
    }
  }
  
  if (formData.nivel && formData.nivel !== '') {
    const nivelExists = existingData.some(item => 
      item.perfilid !== originalData.perfilid && 
      item.nivel && 
      item.nivel.toString() === formData.nivel.toString()
    );
    
    if (nivelExists) {
      errors.push({
        field: 'nivel',
        message: 'El nivel del perfil ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 6. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkPerfilDependencies(originalData.perfilid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el perfil porque tiene usuarios o umbrales asociados',
        type: 'constraint'
      });
    }
  }
  
  // 7. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const checkPerfilDependencies = async (perfilid: number): Promise<boolean> => {
  try {
    const usuarioperfiles = await JoySenseService.getTableData('usuarioperfil');
    const hasUsuarioperfiles = usuarioperfiles.some(usuarioperfil => usuarioperfil.perfilid === perfilid);
    if (hasUsuarioperfiles) return true;
    
    const reglaPerfiles = await JoySenseService.getTableData('regla_perfil');
    const hasReglaPerfiles = reglaPerfiles.some(reglaPerfil => reglaPerfil.perfilid === perfilid);
    return hasReglaPerfiles;
  } catch (error) {
    logger.error('Error checking perfil dependencies:', error);
    return false;
  }
};

// ============================================================================
// USUARIOPERFIL VALIDATIONS
// ============================================================================

export const validateUsuarioPerfilUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.usuarioid || formData.usuarioid === '') {
    errors.push({
      field: 'usuarioid',
      message: 'El usuario es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.perfilid || formData.perfilid === '') {
    errors.push({
      field: 'perfilid',
      message: 'El perfil es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.usuarioid && formData.perfilid) {
    const usuarioPerfilExists = existingData.some(item => 
      (item.usuarioid !== originalData.usuarioid || item.perfilid !== originalData.perfilid) && 
      item.usuarioid === formData.usuarioid && 
      item.perfilid === formData.perfilid
    );
    
    if (usuarioPerfilExists) {
      errors.push({
        field: 'composite',
        message: 'Ya existe una relación entre este usuario y perfil',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

// ============================================================================
// CONTACTO VALIDATIONS
// ============================================================================

export const validateContactoData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.usuarioid || formData.usuarioid === 0) {
    errors.push({
      field: 'usuarioid',
      message: 'Debe seleccionar un usuario',
      type: 'required'
    });
  }
  
  // 2. Validar codigotelefonoid (obligatorio según schema)
  if (!formData.codigotelefonoid || formData.codigotelefonoid === 0) {
    errors.push({
      field: 'codigotelefonoid',
      message: 'Debe seleccionar un código de país',
      type: 'required'
    });
  }
  
  // 3. Validar celular (obligatorio según schema, máximo 12 caracteres)
  if (!formData.celular || formData.celular.trim() === '') {
    errors.push({
      field: 'celular',
      message: 'El número de celular es obligatorio',
      type: 'required'
    });
  } else if (formData.celular.length > 12) {
    errors.push({
      field: 'celular',
      message: 'El número de celular no puede exceder 12 caracteres',
      type: 'length'
    });
  }
  
  // 4. Validar duplicados si hay datos existentes (constraint: usuarioid único para contacto)
  if (existingData && existingData.length > 0) {
    const contactoExists = existingData.some(item => 
      item.usuarioid === formData.usuarioid
    );
    
    if (contactoExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un contacto para este usuario',
        type: 'duplicate'
      });
    }
  }
  
  // 5. Generar mensaje amigable
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const validateContactoUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.usuarioid || formData.usuarioid === '') {
    errors.push({
      field: 'usuarioid',
      message: 'El usuario es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar codigotelefonoid (obligatorio según schema)
  if (!formData.codigotelefonoid || formData.codigotelefonoid === 0) {
    errors.push({
      field: 'codigotelefonoid',
      message: 'Debe seleccionar un código de país',
      type: 'required'
    });
  }
  
  // 3. Validar celular (obligatorio según schema, máximo 12 caracteres)
  if (!formData.celular || formData.celular.trim() === '') {
    errors.push({
      field: 'celular',
      message: 'El número de celular es obligatorio',
      type: 'required'
    });
  } else if (formData.celular.length > 12) {
    errors.push({
      field: 'celular',
      message: 'El número de celular no puede exceder 12 caracteres',
      type: 'length'
    });
  }
  
  // 4. Validar duplicados (excluyendo el registro actual)
  if (formData.usuarioid) {
    const contactoExists = existingData.some(item => 
      item.contactoid !== originalData.contactoid && 
      item.usuarioid === formData.usuarioid
    );
    
    if (contactoExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un contacto para este usuario',
        type: 'duplicate'
      });
    }
  }
  
  // 5. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

// ============================================================================
// CORREO VALIDATIONS
// ============================================================================

export const validateCorreoData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.usuarioid || formData.usuarioid === 0) {
    errors.push({
      field: 'usuarioid',
      message: 'Debe seleccionar un usuario',
      type: 'required'
    });
  }
  
  // 2. Validar que el correo esté presente y tenga formato válido
  if (!formData.correo || formData.correo.trim() === '') {
    errors.push({
      field: 'correo',
      message: 'Debe proporcionar un correo electrónico',
      type: 'required'
    });
  } else {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      errors.push({
        field: 'correo',
        message: 'Formato de correo inválido. Use: usuario@dominio.com',
        type: 'format'
      });
    }
  }
  
  // 3. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const correoExists = existingData.some(item => 
      item.correo === formData.correo
    );
    
    if (correoExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un correo con esta dirección',
        type: 'duplicate'
      });
    }
  }
  
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const validateCorreoUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.usuarioid || formData.usuarioid === '') {
    errors.push({
      field: 'usuarioid',
      message: 'El usuario es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar que el correo esté presente y tenga formato válido
  if (!formData.correo || formData.correo.trim() === '') {
    errors.push({
      field: 'correo',
      message: 'El correo electrónico es obligatorio',
      type: 'required'
    });
  } else {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      errors.push({
        field: 'correo',
        message: 'Formato de correo inválido. Use: usuario@dominio.com',
        type: 'format'
      });
    }
  }
  
  // 3. Validar duplicados (excluyendo el registro actual)
  if (formData.correo) {
    const correoExists = existingData.some(item => 
      item.correoid !== originalData.correoid && 
      item.correo === formData.correo
    );
    
    if (correoExists) {
      errors.push({
        field: 'general',
        message: 'Ya existe un correo con esta dirección',
        type: 'duplicate'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

// ============================================================================
// MEDIO VALIDATIONS
// ============================================================================

export const validateMedioData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.nombre || formData.nombre.trim() === '') {
    errors.push({
      field: 'nombre',
      message: 'El nombre del medio es obligatorio',
      type: 'required'
    });
  } else if (formData.nombre.length > 50) {
    errors.push({
      field: 'nombre',
      message: 'El nombre del medio no puede exceder 50 caracteres',
      type: 'format'
    });
  }
  
  // 2. Validar duplicados si hay datos existentes
  if (existingData && existingData.length > 0) {
    const medioExists = existingData.some(item => 
      item.nombre && item.nombre.toLowerCase() === formData.nombre?.toLowerCase()
    );
    
    if (medioExists) {
      errors.push({
        field: 'nombre',
        message: 'El nombre del medio ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Generar mensaje amigable
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const validateMedioUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];

  // 1. Validar campos obligatorios
  if (!formData.nombre || formData.nombre.trim() === '') {
    errors.push({
      field: 'nombre',
      message: 'El nombre del medio es obligatorio',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.nombre && formData.nombre.trim() !== '') {
    const nombreExists = existingData.some(item => 
      item.medioid !== originalData.medioid && 
      item.nombre && 
      item.nombre.toLowerCase() === formData.nombre.toLowerCase()
    );
    
    if (nombreExists) {
      errors.push({
        field: 'nombre',
        message: 'El nombre del medio ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    const hasDependentRecords = await checkMedioDependencies(originalData.medioid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el medio porque tiene contactos asociados',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable para actualización
  const userFriendlyMessage = generateUpdateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};

export const checkMedioDependencies = async (medioid: number): Promise<boolean> => {
  try {
    const contactos = await JoySenseService.getTableData('contacto');
    return contactos.some(contacto => contacto.medioid === medioid);
  } catch (error) {
    logger.error('Error checking medio dependencies:', error);
    return false;
  }
};
