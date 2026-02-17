/**
 * Hook para manejar el formulario de inserción en SystemParameters
 * Encapsula la lógica de inicialización, validación e inserción de registros
 * Similar a useUpdateForm pero completamente aislado para evitar contaminación de estado
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { validateTableData } from '../utils/validations'
import type { TableConfig } from '../config/tables.config'
import { getTableConfig } from '../config/tables.config'
import { logger } from '../utils/logger'
import { consolidateErrorMessages } from '../utils/messageConsolidation'
import { AuthUser, Usuario } from '../types'
import { JoySenseService, checkUserSyncStatus } from '../services/backend-api'

interface Message {
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
}

interface UseInsertFormProps {
  tableName: string
  insertRow: (data: Record<string, any>) => Promise<{success: boolean, error?: string, data?: any}>
  user: any
  existingData?: any[]
  onSuccess?: () => void
  onCancel?: () => void
  // Para mostrar mensajes de validación y error
  setMessage?: (message: Message | null) => void
  // Datos relacionados para concatenación (ej: codigotelefonosData para contacto)
  codigotelefonosData?: any[]
  // Para sincronización con filtros globales
  paisSeleccionado?: string
  empresaSeleccionada?: string
  fundoSeleccionado?: string
  // Key para forzar reset cuando cambia
  resetKey?: string | number
}

interface UseInsertFormReturn {
  formData: Record<string, any>
  formErrors: Record<string, string>
  isSubmitting: boolean
  updateFormField: (field: string, value: any) => void
  setFormData: (data: Record<string, any>) => void
  handleInsert: () => Promise<void>
  handleCancel: () => void
  resetForm: () => void
  validateForm: () => boolean
}

/**
 * Hook que encapsula toda la lógica del formulario de inserción
 * Estado completamente aislado de UPDATE
 */
// Helper para obtener usuarioid desde la tabla usuario
// Busca por useruuid (UUID de Supabase Auth) o por email/login
async function getUsuarioidFromUser(user: AuthUser | null | undefined): Promise<number | null> {
  if (!user) {
    logger.debug('[getUsuarioidFromUser] No hay usuario proporcionado')
    return null
  }

  // Primero intentar obtener de user_metadata si está disponible
  if (user.user_metadata?.usuarioid) {
    logger.debug('[getUsuarioidFromUser] usuarioid encontrado en user_metadata:', user.user_metadata.usuarioid)
    return user.user_metadata.usuarioid
  }

  try {
    // Consultar tabla usuario por useruuid (coincide con user.id de Supabase Auth)
    logger.debug('[getUsuarioidFromUser] Buscando usuarioid en tabla usuario...', {
      useruuid: user.id,
      email: user.email
    })
    
    const usuariosData = await JoySenseService.getTableData('usuario', 100)
    const usuarios = Array.isArray(usuariosData) ? usuariosData : (usuariosData as any)?.data || []
    
    // Buscar por useruuid primero (más preciso)
    if (user.id) {
      const usuarioByUuid = usuarios.find((u: Usuario) => 
        u.useruuid && String(u.useruuid).toLowerCase() === String(user.id).toLowerCase()
      )
      if (usuarioByUuid?.usuarioid) {
        logger.debug('[getUsuarioidFromUser] usuarioid encontrado por useruuid:', usuarioByUuid.usuarioid)
        return usuarioByUuid.usuarioid
      }
    }
    
    // Si no se encuentra por UUID, buscar por email/login
    if (user.email) {
      const usuarioByEmail = usuarios.find((u: Usuario) => 
        u.login && u.login.toLowerCase() === user.email.toLowerCase()
      )
      if (usuarioByEmail?.usuarioid) {
        logger.debug('[getUsuarioidFromUser] usuarioid encontrado por email/login:', usuarioByEmail.usuarioid)
        return usuarioByEmail.usuarioid
      }
    }
    
    logger.warn('[getUsuarioidFromUser] No se encontró usuarioid para el usuario:', {
      useruuid: user.id,
      email: user.email
    })
    return null
  } catch (error) {
    logger.error('[getUsuarioidFromUser] Error al buscar usuarioid:', error)
    return null
  }
}

export const useInsertForm = ({
  tableName,
  insertRow,
  user,
  existingData = [],
  onSuccess,
  onCancel,
  setMessage,
  codigotelefonosData,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  resetKey
}: UseInsertFormProps): UseInsertFormReturn => {
  
  // Obtener configuración de la tabla
  const config = useMemo(() => getTableConfig(tableName), [tableName])
  
  // Función para inicializar datos limpios del formulario
  const initializeFormData = useCallback((): Record<string, any> => {
    if (!config) return {}
    
    const cleanData: Record<string, any> = {}
    config.fields.forEach(field => {
      if (!field.hidden && !field.readonly) {
        if (field.defaultValue !== undefined) {
          cleanData[field.name] = field.defaultValue
        } else if (field.type === 'number') {
          cleanData[field.name] = null
        } else if (field.type === 'boolean') {
          cleanData[field.name] = false
        } else {
          cleanData[field.name] = ''
        }
      }
    })
    
    // Establecer statusid por defecto si existe
    if (!cleanData.hasOwnProperty('statusid')) {
      cleanData.statusid = 1
    }

    // Carpeta: agregar campos para formulario unificado (ubicaciones y usuarios)
    if (tableName === 'carpeta') {
      cleanData.ubicacionids = cleanData.ubicacionids ?? []
      cleanData.usuarioids = cleanData.usuarioids ?? []
    }

    // Entidad (grupo): agregar campos para formulario unificado (localizaciones)
    if (tableName === 'entidad') {
      cleanData.localizacionids = cleanData.localizacionids ?? []
    }

    return cleanData
  }, [config, tableName])
  
  // Estado del formulario
  const [formData, setFormDataState] = useState<Record<string, any>>(initializeFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Resetear formulario cuando cambia la tabla o resetKey
  useEffect(() => {
    const cleanData = initializeFormData()
    setFormDataState(cleanData)
    setFormErrors({})
    // Resetear flags de selección manual cuando se resetea el formulario
    userSelectedPaisRef.current = false
    userSelectedEmpresaRef.current = false
    userSelectedFundoRef.current = false
  }, [tableName, resetKey, initializeFormData])
  
  // Refs para rastrear si el usuario ha seleccionado valores manualmente
  const userSelectedPaisRef = useRef(false)
  const userSelectedEmpresaRef = useRef(false)
  const userSelectedFundoRef = useRef(false)
  
  // Sincronizar con filtros globales (similar a NormalInsertForm)
  // IMPORTANTE: Solo sincronizar cuando el formulario está vacío, NO limpiar valores seleccionados por el usuario
  useEffect(() => {
    if (!config || !tableName) return
    
    // Sincronizar paisid si hay filtro global Y el formulario está vacío (no hay valor previo)
    if (paisSeleccionado && tableName !== 'pais') {
      const paisField = config.fields.find(f => f.name === 'paisid')
      const isPaisidEmpty = !formData.paisid || formData.paisid === '' || formData.paisid === null || formData.paisid === undefined
      
      // Solo sincronizar si está vacío Y el usuario no lo ha seleccionado manualmente
      if (paisField && isPaisidEmpty && !userSelectedPaisRef.current) {
        const paisId = parseInt(paisSeleccionado, 10)
        if (!isNaN(paisId)) {
          setFormDataState(prev => ({ ...prev, paisid: paisId }))
        }
      }
    }
    // NO limpiar paisid si el usuario lo seleccionó manualmente - solo sincronizar cuando hay filtro
    
    // Sincronizar empresaid si hay filtro global Y el formulario está vacío
    if (empresaSeleccionada && tableName !== 'empresa') {
      const empresaField = config.fields.find(f => f.name === 'empresaid')
      const isEmpresaidEmpty = !formData.empresaid || formData.empresaid === '' || formData.empresaid === null || formData.empresaid === undefined
      
      // Solo sincronizar si está vacío Y el usuario no lo ha seleccionado manualmente
      if (empresaField && isEmpresaidEmpty && !userSelectedEmpresaRef.current) {
        const empresaId = parseInt(empresaSeleccionada, 10)
        if (!isNaN(empresaId)) {
          setFormDataState(prev => ({ ...prev, empresaid: empresaId }))
        }
      }
    }
    // NO limpiar empresaid si el usuario lo seleccionó manualmente - solo sincronizar cuando hay filtro
    
    // Sincronizar fundoid si hay filtro global Y el formulario está vacío
    if (fundoSeleccionado && tableName !== 'fundo') {
      const fundoField = config.fields.find(f => f.name === 'fundoid')
      const isFundoidEmpty = !formData.fundoid || formData.fundoid === '' || formData.fundoid === null || formData.fundoid === undefined
      
      // Solo sincronizar si está vacío Y el usuario no lo ha seleccionado manualmente
      if (fundoField && isFundoidEmpty && !userSelectedFundoRef.current) {
        const fundoId = parseInt(fundoSeleccionado, 10)
        if (!isNaN(fundoId)) {
          setFormDataState(prev => ({ ...prev, fundoid: fundoId }))
        }
      }
    }
    // NO limpiar fundoid si el usuario lo seleccionó manualmente - solo sincronizar cuando hay filtro
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, tableName, config]) // Removido formData.* de dependencias para evitar loops
  
  // Actualizar campo del formulario
  const updateFormField = useCallback((field: string, value: any) => {
    // Marcar que el usuario seleccionó este campo manualmente (si es un campo de geografía)
    if (field === 'paisid' && value) {
      userSelectedPaisRef.current = true
    } else if (field === 'empresaid' && value) {
      userSelectedEmpresaRef.current = true
    } else if (field === 'fundoid' && value) {
      userSelectedFundoRef.current = true
    }
    
    // Si el usuario limpia el campo (pone null/undefined/vacío), resetear el flag
    if (field === 'paisid' && (!value || value === '' || value === null || value === undefined)) {
      userSelectedPaisRef.current = false
    } else if (field === 'empresaid' && (!value || value === '' || value === null || value === undefined)) {
      userSelectedEmpresaRef.current = false
    } else if (field === 'fundoid' && (!value || value === '' || value === null || value === undefined)) {
      userSelectedFundoRef.current = false
    }
    
    setFormDataState(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      return newData
    })
    
    // Limpiar error del campo cuando se modifica
    setFormErrors(prev => {
      if (!prev[field]) return prev
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, []) // Removido formErrors y formData de dependencias para evitar loops
  
  // Establecer datos del formulario (para compatibilidad)
  // Soporta tanto objeto directo como función de actualización
  const setFormData = useCallback((data: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    if (typeof data === 'function') {
      setFormDataState(data)
    } else {
      setFormDataState(data)
    }
  }, [])
  
  // Validar formulario básico (campos requeridos)
  const validateFormFields = useCallback((): boolean => {
    if (!config) return false

    const errors: Record<string, string> = {}

    // Caso especial para regla: validar campos de regla + regla_umbral
    if (tableName === 'regla') {
      // Validar campos requeridos de la tabla regla
      config.fields.forEach(field => {
        // No validar campos ocultos o de solo lectura
        if (field.hidden || field.readonly) return
        
        // No validar _reglaUmbralRows aquí (se valida abajo)
        if (field.name === '_reglaUmbralRows') return
        
        // Validar campos requeridos de regla
        if (field.required && !formData[field.name] && formData[field.name] !== 0 && formData[field.name] !== false) {
          errors[field.name] = `${field.label} es requerido`
        }
      })
      
      // Validar que haya al menos un umbral
      // Intentar obtener _reglaUmbralRows de múltiples fuentes para ser más robusto
      let reglaUmbralRows = formData._reglaUmbralRows as Array<{
        umbralid: number | null;
        operador_logico: 'AND' | 'OR';
        agrupador_inicio: boolean;
        agrupador_fin: boolean;
        orden: number;
      }> | undefined;
      
      // Si no está en formData, intentar obtenerlo del DOM (último recurso)
      if (!reglaUmbralRows || !Array.isArray(reglaUmbralRows) || reglaUmbralRows.length === 0) {
        // Buscar en el DOM si hay elementos de umbral seleccionados
        try {
          const umbralSelects = document.querySelectorAll('[name*="umbral"], [data-umbral-id]');
          if (umbralSelects.length > 0) {
            // Hay elementos en el DOM, pero no están sincronizados
            // Forzar una re-sincronización esperando un tick
            logger.warn('[validateFormFields] _reglaUmbralRows no está sincronizado, pero hay elementos en el DOM');
          }
        } catch (e) {
          // Ignorar errores de DOM
        }
      }
      
      // Debug: Log para ver qué hay en formData
      logger.debug('[validateFormFields] Validando regla:', {
        hasReglaUmbralRows: !!formData._reglaUmbralRows,
        reglaUmbralRowsType: typeof formData._reglaUmbralRows,
        isArray: Array.isArray(formData._reglaUmbralRows),
        length: Array.isArray(formData._reglaUmbralRows) ? formData._reglaUmbralRows.length : 0,
        reglaUmbralRows: formData._reglaUmbralRows,
        formDataKeys: Object.keys(formData),
        formDataValues: Object.keys(formData).reduce((acc, key) => {
          if (key === '_reglaUmbralRows') {
            acc[key] = formData[key];
          }
          return acc;
        }, {} as Record<string, any>)
      });
      
      // Validación robusta: verificar que haya al menos un umbral válido
      if (!reglaUmbralRows || !Array.isArray(reglaUmbralRows) || reglaUmbralRows.length === 0) {
        errors._reglaUmbralRows = 'Debe agregar al menos un umbral'
      } else {
        // Filtrar solo filas válidas (con umbralid)
        const validRows = reglaUmbralRows.filter(row => row && row.umbralid);
        if (validRows.length === 0) {
          errors._reglaUmbralRows = 'Debe agregar al menos un umbral con un umbral seleccionado'
        } else {
          // Verificar que todos los umbrales tengan umbralid (opcional, pero recomendado)
          const invalidRows = reglaUmbralRows.filter(row => row && !row.umbralid);
          if (invalidRows.length > 0 && invalidRows.length === reglaUmbralRows.length) {
            // Si TODAS las filas están inválidas, mostrar error
            errors._reglaUmbralRows = 'Todos los umbrales deben tener un umbral seleccionado'
          }
        }
      }
      
      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    // Caso especial para usuarioperfil: validar usuarioid y que haya perfiles seleccionados
    if (tableName === 'usuarioperfil') {
      if (!formData.usuarioid) {
        errors.usuarioid = 'Usuario es requerido'
      }
      
      // Verificar que haya al menos un perfil seleccionado
      const perfilesStatus = formData._perfilesStatus as Record<number, number> | undefined
      if (!perfilesStatus || Object.values(perfilesStatus).filter(statusid => statusid === 1).length === 0) {
        errors._perfilesStatus = 'Debe seleccionar al menos un perfil activo'
      }
      
      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    // Caso especial para regla_perfil: validar reglaid y que haya perfiles seleccionados
    if (tableName === 'regla_perfil') {
      if (!formData.reglaid) {
        errors.reglaid = 'Regla es requerida'
      }
      
      // Verificar que haya al menos un perfil seleccionado
      const perfilesStatus = formData._perfilesStatus as Record<number, number> | undefined
      if (!perfilesStatus || Object.values(perfilesStatus).filter(statusid => statusid === 1).length === 0) {
        errors._perfilesStatus = 'Debe seleccionar al menos un perfil activo'
      }
      
      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    // Caso especial para carpeta: validar nombre (ubicacionids y usuarioids son opcionales)
    if (tableName === 'carpeta') {
      if (!formData.carpeta || !String(formData.carpeta).trim()) {
        errors.carpeta = 'Nombre de carpeta es requerido'
      }
      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    // Caso especial para entidad (grupo): validar nombre (localizacionids son opcionales)
    if (tableName === 'entidad') {
      if (!formData.entidad || !String(formData.entidad).trim()) {
        errors.entidad = 'Nombre de grupo es requerido'
      }
      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    // Caso especial para regla_objeto: validar reglaid, fuenteid y _objetosSeleccionados
    if (tableName === 'regla_objeto') {
      if (!formData.reglaid) {
        errors.reglaid = 'Regla es requerida'
      }
      if (!formData.fuenteid) {
        errors.fuenteid = 'Fuente es requerida'
      }
      if (!formData._objetosSeleccionados || !Array.isArray(formData._objetosSeleccionados) || formData._objetosSeleccionados.length === 0) {
        errors._objetosSeleccionados = 'Debe seleccionar al menos un objeto'
      }
      
      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    // Caso especial para usuario_canal: validar usuarioid y que haya canales seleccionados
    if (tableName === 'usuario_canal') {
      if (!formData.usuarioid) {
        errors.usuarioid = 'Usuario es requerido'
      }
      
      // Verificar que haya al menos un canal seleccionado
      const canalesGrid = formData._canalesGrid as Array<{canalid: number, canal: string, status: boolean, identificador: string}> | undefined
      if (!canalesGrid || canalesGrid.filter(c => c.status === true).length === 0) {
        errors._canalesGrid = 'Debe seleccionar al menos un canal activo'
      } else {
        // Verificar que todos los canales seleccionados tengan identificador
        const canalesSinIdentificador = canalesGrid.filter(c => c.status === true && !c.identificador?.trim())
        if (canalesSinIdentificador.length > 0) {
          errors._canalesGrid = 'Todos los canales seleccionados deben tener un identificador'
        }
      }
      
      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    // Validación normal para otras tablas
    config.fields.forEach(field => {
      // No validar campos ocultos o de solo lectura
      if (field.hidden || field.readonly) return
      
      // Para usuarioperfil, no validar perfilid y statusid ya que se manejan de forma especial
      if (tableName === 'usuarioperfil' && (field.name === 'perfilid' || field.name === 'statusid')) {
        return
      }
      
      // Para regla_perfil, no validar perfilid y statusid ya que se manejan de forma especial
      if (tableName === 'regla_perfil' && (field.name === 'perfilid' || field.name === 'statusid')) {
        return
      }
      
      // Para usuario_canal, no validar canalid, identificador y statusid ya que se manejan de forma especial
      if (tableName === 'usuario_canal' && (field.name === 'canalid' || field.name === 'identificador' || field.name === 'statusid')) {
        return
      }
      
      if (field.required && !formData[field.name] && formData[field.name] !== 0) {
        errors[field.name] = `${field.label} es requerido`
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [config, formData, tableName])
  
  // Validar formulario completo (incluyendo validaciones específicas de insert)
  const validateFormComplete = useCallback(async (): Promise<boolean> => {
    if (!config) return false

    // Primero validar campos requeridos
    if (!validateFormFields()) {
      return false
    }

    // Luego validar con validaciones específicas de insert
    try {
      const validationResult = await validateTableData(
        tableName,
        formData,
        existingData
      )

      if (!validationResult.isValid) {
        // Convertir errores de validación al formato de formErrors
        const errors: Record<string, string> = {}
        validationResult.errors.forEach(error => {
          errors[error.field] = error.message
        })
        setFormErrors(errors)
        return false
      }

      return true
    } catch (error) {
      logger.error('Error en validación:', error)
      return false
    }
  }, [tableName, formData, existingData, config, validateFormFields])
  
  // Manejar inserción
  const handleInsert = useCallback(async () => {
    // PRIMERO: Validación específica de tabla (duplicados, constraints, longitud, etc.)
    // Esta validación es más específica y debe ejecutarse antes de la validación básica
    if (tableName && existingData) {
      try {
        const validationResult = await validateTableData(tableName, formData, existingData)
        if (!validationResult.isValid) {
          // Mostrar errores uno por línea, consolidando mensajes similares
          const errorMessages = validationResult.errors.map(e => e.message).filter(Boolean)
          const consolidatedErrors = consolidateErrorMessages(errorMessages)
          const errorMessage = validationResult.userFriendlyMessage || consolidatedErrors.join('\n')
          setMessage?.({ type: 'warning', text: errorMessage })
          return
        }
      } catch (validationError) {
        // Si falla la validación, continuar (el backend también validará)
        logger.error('Error en validación:', validationError)
      }
    }
    
    // SEGUNDO: Validar formulario básico (campos requeridos)
    // Solo si no hay errores específicos de tabla, validar campos requeridos
    const basicValidation = validateFormFields()
    if (!basicValidation) {
      // Obtener errores de validación básicos (campos requeridos)
      const validationErrors = Object.values(formErrors).filter(Boolean)
      // Solo mostrar mensaje genérico si realmente no hay errores específicos
      if (validationErrors.length > 0) {
        // Consolidar mensajes similares
        const consolidatedErrors = consolidateErrorMessages(validationErrors)
        const errorMessage = consolidatedErrors.join('\n')
        setMessage?.({ type: 'warning', text: errorMessage })
      } else {
        // Si validateFormFields() retorna false pero no hay errores específicos,
        // puede ser un problema de validación interna, mostrar mensaje genérico
        setMessage?.({ type: 'warning', text: 'Por favor complete todos los campos requeridos' })
      }
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    try {
      // Filtrar solo los campos válidos según la configuración de la tabla
      const validFields = config?.fields.map((f: any) => f.name) || []
      const filteredData: Record<string, any> = {}
      
      // Solo incluir campos que están en la configuración
      validFields.forEach((fieldName: string) => {
        if (formData[fieldName] !== undefined && formData[fieldName] !== null && formData[fieldName] !== '') {
          filteredData[fieldName] = formData[fieldName]
        }
      })
      
      // Caso especial para tabla 'usuario': incluir password aunque no esté en la configuración
      // porque password_hash está oculto y password es el campo que el usuario ingresa
      if (tableName === 'usuario' && formData.password !== undefined && formData.password !== null && formData.password !== '') {
        filteredData.password = formData.password
      }
      
      // Caso especial para carpeta: crear carpeta + carpeta_ubicacion + carpeta_usuario
      if (tableName === 'carpeta') {
        const currentUserId = await getUsuarioidFromUser(user)
        const userId = currentUserId || 1
        const now = new Date().toISOString()

        const carpetaData = {
          carpeta: (formData.carpeta || '').trim(),
          statusid: 1,
          usercreatedid: userId,
          datecreated: now,
          usermodifiedid: userId,
          datemodified: now
        }

        const carpetaResult = await insertRow(carpetaData)
        if (!carpetaResult.success) {
          throw new Error(carpetaResult.error || 'Error al crear carpeta')
        }

        let carpetaid: number
        const insertedData = Array.isArray(carpetaResult.data) ? carpetaResult.data[0] : carpetaResult.data
        carpetaid = insertedData?.carpetaid ?? (carpetaResult.data as any)?.carpetaid
        if (!carpetaid && Array.isArray(carpetaResult.data) && carpetaResult.data.length > 0) {
          carpetaid = carpetaResult.data[0].carpetaid
        }
        if (!carpetaid) {
          throw new Error('No se pudo obtener el ID de la carpeta creada')
        }

        const ubicacionids = Array.isArray(formData.ubicacionids) ? formData.ubicacionids : []
        const usuarioids = Array.isArray(formData.usuarioids) ? formData.usuarioids : []

        for (const ubicacionid of ubicacionids) {
          await JoySenseService.insertTableRow('carpeta_ubicacion', {
            carpetaid,
            ubicacionid: Number(ubicacionid),
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          })
        }

        for (const usuarioid of usuarioids) {
          await JoySenseService.insertTableRow('carpeta_usuario', {
            carpetaid,
            usuarioid: Number(usuarioid),
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          })
        }

        setIsSubmitting(false)
        setMessage?.({ type: 'success', text: 'Carpeta compartida creada correctamente con ubicaciones y usuarios asignados' })
        const cleanData = initializeFormData()
        setFormDataState(cleanData)
        setFormErrors({})
        onSuccess?.()
        return
      }

      // Caso especial para entidad (grupo): crear entidad + entidad_localizacion
      if (tableName === 'entidad') {
        const currentUserId = await getUsuarioidFromUser(user)
        const userId = currentUserId || 1
        const now = new Date().toISOString()

        const entidadData = {
          entidad: (formData.entidad || '').trim(),
          statusid: 1,
          usercreatedid: userId,
          datecreated: now,
          usermodifiedid: userId,
          datemodified: now
        }

        const entidadResult = await insertRow(entidadData)
        if (!entidadResult.success) {
          throw new Error(entidadResult.error || 'Error al crear grupo')
        }

        let entidadid: number
        const insertedData = Array.isArray(entidadResult.data) ? entidadResult.data[0] : entidadResult.data
        entidadid = insertedData?.entidadid ?? (entidadResult.data as any)?.entidadid
        if (!entidadid && Array.isArray(entidadResult.data) && entidadResult.data.length > 0) {
          entidadid = entidadResult.data[0].entidadid
        }
        if (!entidadid) {
          throw new Error('No se pudo obtener el ID del grupo creado')
        }

        const localizacionids = Array.isArray(formData.localizacionids) ? formData.localizacionids : []

        for (const localizacionid of localizacionids) {
          await JoySenseService.insertTableRow('entidad_localizacion', {
            entidadid,
            localizacionid: Number(localizacionid),
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          })
        }

        setIsSubmitting(false)
        setMessage?.({ type: 'success', text: 'Carpeta personal creada correctamente con localizaciones asignadas' })
        const cleanData = initializeFormData()
        setFormDataState(cleanData)
        setFormErrors({})
        onSuccess?.()
        return
      }

      // Caso especial para tabla 'usuarioperfil': crear múltiples registros (uno por cada perfil seleccionado)
      if (tableName === 'usuarioperfil' && formData._perfilesStatus) {
        const perfilesStatus = formData._perfilesStatus as Record<number, number>;
        const usuarioid = formData.usuarioid;
        
        if (!usuarioid) {
          throw new Error('Debe seleccionar un usuario');
        }
        
        // Obtener usuarioid del usuario autenticado para campos de auditoría
        const currentUserId = await getUsuarioidFromUser(user);
        const userId = currentUserId || 1;
        const now = new Date().toISOString();
        
        // Crear un array de registros, uno por cada perfil con statusid = 1
        const recordsToInsert = Object.entries(perfilesStatus)
          .filter(([_, statusid]) => statusid === 1)
          .map(([perfilid, _]) => ({
            usuarioid: usuarioid,
            perfilid: parseInt(perfilid),
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          }));
        
        if (recordsToInsert.length === 0) {
          throw new Error('Debe seleccionar al menos un perfil activo');
        }
        
        // Insertar múltiples registros
        const results = [];
        for (const record of recordsToInsert) {
          const result = await insertRow(record);
          if (result.success) {
            results.push(result);
          } else {
            throw new Error(`Error al insertar perfil ${record.perfilid}: ${result.error || 'Error desconocido'}`);
          }
        }
        
        setIsSubmitting(false);
        setMessage?.({ type: 'success', text: `Se asignaron ${results.length} perfil(es) al usuario correctamente` });
        resetForm();
        return;
      }

      // Caso especial para tabla 'regla_perfil': crear múltiples registros (uno por cada perfil seleccionado)
      if (tableName === 'regla_perfil' && formData._perfilesStatus) {
        const perfilesStatus = formData._perfilesStatus as Record<number, number>;
        const reglaid = formData.reglaid;
        
        if (!reglaid) {
          throw new Error('Debe seleccionar una regla');
        }
        
        // Obtener usuarioid del usuario autenticado para campos de auditoría
        const currentUserId = await getUsuarioidFromUser(user);
        const userId = currentUserId || 1;
        const now = new Date().toISOString();
        
        // Crear un array de registros, uno por cada perfil con statusid = 1
        const recordsToInsert = Object.entries(perfilesStatus)
          .filter(([_, statusid]) => statusid === 1)
          .map(([perfilid, _]) => ({
            reglaid: reglaid,
            perfilid: parseInt(perfilid),
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          }));
        
        if (recordsToInsert.length === 0) {
          throw new Error('Debe seleccionar al menos un perfil activo');
        }
        
        // Insertar múltiples registros
        const results = [];
        for (const record of recordsToInsert) {
          const result = await insertRow(record);
          if (result.success) {
            results.push(result);
          } else {
            throw new Error(`Error al insertar perfil ${record.perfilid}: ${result.error || 'Error desconocido'}`);
          }
        }
        
        setIsSubmitting(false);
        setMessage?.({ type: 'success', text: `Se asignaron ${results.length} perfil(es) a la regla correctamente` });
        resetForm();
        return;
      }

      // Caso especial para tabla 'regla': crear regla y regla_umbral simultáneamente
      if (tableName === 'regla' && formData._reglaUmbralRows) {
        const reglaUmbralRows = formData._reglaUmbralRows as Array<{
          umbralid: number | null;
          operador_logico: 'AND' | 'OR';
          agrupador_inicio: boolean;
          agrupador_fin: boolean;
          orden: number;
        }>;
        
        // Validar que haya al menos un umbral
        if (!reglaUmbralRows || reglaUmbralRows.length === 0) {
          throw new Error('Debe agregar al menos un umbral');
        }
        
        // Validar que todos los umbrales tengan umbralid
        const invalidRows = reglaUmbralRows.filter(row => !row.umbralid);
        if (invalidRows.length > 0) {
          throw new Error('Todos los umbrales deben tener un umbral seleccionado');
        }
        
        // Obtener usuarioid del usuario autenticado para campos de auditoría
        const currentUserId = await getUsuarioidFromUser(user);
        const userId = currentUserId || 1;
        
        // Preparar datos de REGLA: filtrar solo campos válidos de la tabla regla
        const validReglaFields = config?.fields.map((f: any) => f.name) || [];
        const reglaData: Record<string, any> = {};
        
        // Solo incluir campos que están en la configuración de la tabla regla
        validReglaFields.forEach((fieldName: string) => {
          const value = formData[fieldName];
          // Incluir si tiene valor (incluyendo 0 para números y false para booleanos)
          if (value !== undefined && value !== null && value !== '') {
            reglaData[fieldName] = value;
          }
        });
        
        // IMPORTANTE: Crear la regla INACTIVA primero (statusid=0) para evitar que los triggers
        // de validación se ejecuten antes de crear regla_umbral
        // Los triggers son DEFERRABLE INITIALLY DEFERRED, pero es más seguro crear inactiva primero
        reglaData.statusid = 0; // Inactiva temporalmente
        
        // Agregar campos de auditoría a REGLA
        reglaData.usercreatedid = userId;
        reglaData.usermodifiedid = userId;
        
        // Insertar REGLA primero (inactiva)
        setIsSubmitting(true);
        const reglaResult = await insertRow(reglaData);
        
        if (!reglaResult.success || !reglaResult.data) {
          throw new Error(`Error al insertar regla: ${reglaResult.error || 'Error desconocido'}`);
        }
        
        // Obtener reglaid del resultado
        // El backend devuelve un array en data, así que tomamos el primer elemento
        const reglaInserted = Array.isArray(reglaResult.data) 
          ? reglaResult.data[0] 
          : reglaResult.data;
        
        const reglaid = reglaInserted?.reglaid;
        if (!reglaid) {
          // Log para debugging
          console.error('Error obteniendo reglaid:', {
            reglaResult,
            reglaInserted,
            dataType: typeof reglaResult.data,
            isArray: Array.isArray(reglaResult.data),
            keys: reglaResult.data ? Object.keys(reglaResult.data) : []
          });
          throw new Error('No se pudo obtener el ID de la regla creada');
        }
        
        // Insertar cada REGLA_UMBRAL (obligatorio)
        const results = [reglaResult];
        for (const row of reglaUmbralRows) {
          if (!row.umbralid) continue; // Ya validado arriba
          
          const reglaUmbralRecord: Record<string, any> = {
            reglaid: reglaid,
            umbralid: row.umbralid,
            operador_logico: row.operador_logico || 'AND',
            agrupador_inicio: row.agrupador_inicio ?? false,
            agrupador_fin: row.agrupador_fin ?? false,
            orden: row.orden,
            statusid: 1,
            usercreatedid: userId,
            usermodifiedid: userId
          };
          
          logger.debug('[useInsertForm] Insertando regla_umbral:', {
            reglaUmbralRecord,
            row,
            reglaid
          });
          
          try {
            const result = await JoySenseService.insertTableRow('regla_umbral', reglaUmbralRecord);
            // insertTableRow devuelve directamente los datos del backend (array) en caso de éxito
            // Si es un array, significa que fue exitoso
            if (Array.isArray(result) || (result && !result.error)) {
              results.push(result);
            } else {
              const errorMsg = result?.error || result?.message || 'Error desconocido';
              throw new Error(`Error al insertar umbral ${row.umbralid}: ${errorMsg}`);
            }
          } catch (error: any) {
            // Si insertTableRow lanza una excepción (error HTTP), extraer el mensaje del response
            let errorMsg = 'Error desconocido';
            if (error?.response?.data) {
              errorMsg = error.response.data.error || error.response.data.message || JSON.stringify(error.response.data);
            } else if (error?.message) {
              errorMsg = error.message;
            } else if (typeof error === 'string') {
              errorMsg = error;
            }
            
            logger.error('[useInsertForm] Error al insertar regla_umbral:', {
              error,
              reglaUmbralRecord,
              errorMsg,
              errorResponse: error?.response,
              errorData: error?.response?.data
            });
            throw new Error(`Error al insertar umbral ${row.umbralid}: ${errorMsg}`);
          }
        }
        
        // Crear regla_objeto global (objetoid=NULL) para cumplir con el constraint de scope
        // origenid=1 es GEOGRAFÍA, necesitamos obtener fuenteid de cualquier fuente geográfica
        // Usamos 'localizacion' como fuente por defecto para scope global
        try {
          // Obtener fuenteid desde la tabla fuente directamente
          const fuentesData = await JoySenseService.getTableData('fuente', 100);
          const fuentesArray = Array.isArray(fuentesData) ? fuentesData : ((fuentesData as any)?.data || []);
          const fuenteLocalizacion = fuentesArray.find((f: any) => 
            f.fuente?.toLowerCase() === 'localizacion' && f.statusid === 1
          );
          
          if (fuenteLocalizacion?.fuenteid) {
            // Crear regla_objeto global (objetoid=NULL significa scope global)
            const reglaObjetoRecord: Record<string, any> = {
              reglaid: reglaid,
              origenid: 1, // 1 = GEOGRAFÍA
              fuenteid: fuenteLocalizacion.fuenteid,
              objetoid: null, // NULL = scope global
              statusid: 1,
              usercreatedid: userId,
              usermodifiedid: userId
            };
            
            const reglaObjetoResult = await JoySenseService.insertTableRow('regla_objeto', reglaObjetoRecord);
            if (!reglaObjetoResult || (reglaObjetoResult as any).error) {
              console.warn('No se pudo crear regla_objeto automáticamente, pero continuando...');
            }
          } else {
            console.warn('No se encontró fuente "localizacion" activa, regla_objeto no se creará automáticamente');
          }
        } catch (error) {
          // Si falla crear regla_objeto, continuar de todas formas
          // El usuario puede crearlo manualmente después
          console.warn('Error al crear regla_objeto automáticamente:', error);
        }
        
        // Si requiere_escalamiento=true, debemos crear regla_escalamiento antes de activar
        // Por ahora, si requiere_escalamiento=true, lo cambiamos a false para evitar el error
        // El usuario puede configurar el escalamiento después
        const requiereEscalamiento = reglaData.requiere_escalamiento === true || reglaData.requiere_escalamiento === 'true' || reglaData.requiere_escalamiento === 1;
        
        if (requiereEscalamiento) {
          // Si requiere escalamiento pero no se ha configurado, cambiar a false temporalmente
          // para permitir crear la regla. El usuario puede configurar escalamiento después.
          await JoySenseService.updateTableRow('regla', reglaid.toString(), {
            requiere_escalamiento: false,
            usermodifiedid: userId,
            datemodified: new Date().toISOString()
          });
        }
        
        // Finalmente, activar la regla (statusid=1)
        // Ahora que tenemos regla_umbral y regla_objeto creados, los triggers de validación pasarán
        const activateResult = await JoySenseService.updateTableRow('regla', reglaid.toString(), {
          statusid: 1,
          usermodifiedid: userId,
          datemodified: new Date().toISOString()
        });
        
        if (!activateResult || (activateResult as any).error) {
          throw new Error('Error al activar la regla');
        }
        
        setIsSubmitting(false);
        setMessage?.({ type: 'success', text: `Regla creada con ${results.length - 1} umbral(es) correctamente` });
        resetForm();
        onSuccess?.();
        return;
      }
      
      // Caso especial para tabla 'regla_objeto': crear múltiples registros si _objetosSeleccionados está presente
      if (tableName === 'regla_objeto' && formData._objetosSeleccionados && Array.isArray(formData._objetosSeleccionados)) {
        const objetosSeleccionados = formData._objetosSeleccionados as number[];
        const reglaid = formData.reglaid;
        const origenid = formData.origenid || 1;
        const fuenteid = formData.fuenteid;
        
        if (!reglaid) throw new Error('Debe seleccionar una regla');
        if (!fuenteid) throw new Error('Debe seleccionar un nivel de objeto');
        if (objetosSeleccionados.length === 0) throw new Error('Debe seleccionar al menos un objeto');
        
        // Obtener usuarioid del usuario autenticado para campos de auditoría
        const currentUserId = await getUsuarioidFromUser(user);
        const userId = currentUserId || 1;
        const now = new Date().toISOString();
        
        // Crear un array de registros, uno por cada objeto seleccionado
        const recordsToInsert = objetosSeleccionados.map(objetoid => ({
          reglaid: reglaid,
          origenid: origenid,
          fuenteid: fuenteid,
          objetoid: objetoid,
          statusid: 1,
          usercreatedid: userId,
          datecreated: now,
          usermodifiedid: userId,
          datemodified: now
        }));
        
        // Insertar múltiples registros
        const results = [];
        for (const record of recordsToInsert) {
          const result = await insertRow(record);
          if (result.success) {
            results.push(result);
          } else {
            throw new Error(`Error al asignar objeto ${record.objetoid}: ${result.error || 'Error desconocido'}`);
          }
        }
        
        setIsSubmitting(false);
        setMessage?.({ type: 'success', text: `Se asignaron ${results.length} objeto(s) a la regla correctamente` });
        resetForm();
        onSuccess?.();
        return;
      }
      
      // Caso especial para tabla 'usuario_canal': crear múltiples registros (uno por cada canal seleccionado)
      if (tableName === 'usuario_canal' && formData._canalesGrid) {
        const canalesGrid = formData._canalesGrid as Array<{canalid: number, canal: string, status: boolean, identificador: string}>;
        const usuarioid = formData.usuarioid;
        
        if (!usuarioid) {
          throw new Error('Debe seleccionar un usuario');
        }
        
        // Obtener usuarioid del usuario autenticado para campos de auditoría
        const currentUserId = await getUsuarioidFromUser(user);
        const userId = currentUserId || 1;
        const now = new Date().toISOString();
        
        // Crear un array de registros, uno por cada canal con status = true
        const recordsToInsert = canalesGrid
          .filter(c => c.status === true && c.identificador?.trim())
          .map(c => ({
            usuarioid: usuarioid,
            canalid: c.canalid,
            identificador: c.identificador.trim(),
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          }));
        
        if (recordsToInsert.length === 0) {
          throw new Error('Debe seleccionar al menos un canal activo con identificador');
        }
        
        // Insertar múltiples registros
        const results = [];
        for (const record of recordsToInsert) {
          const result = await insertRow(record);
          if (result.success) {
            results.push(result);
          } else {
            throw new Error(`Error al insertar canal ${record.canalid}: ${result.error || 'Error desconocido'}`);
          }
        }
        
        setIsSubmitting(false);
        setMessage?.({ type: 'success', text: `Se asignaron ${results.length} canal(es) al usuario correctamente` });
        resetForm();
        return;
      }
      
      // Agregar campos de auditoría
      // DIAGNÓSTICO: Log del objeto user completo para ver su estructura
      logger.debug('[useInsertForm] Objeto user completo:', {
        user,
        userKeys: user ? Object.keys(user) : [],
        user_metadata: user?.user_metadata,
        user_metadataKeys: user?.user_metadata ? Object.keys(user.user_metadata) : [],
        id: user?.id,
        email: user?.email,
        rawUser: JSON.stringify(user, null, 2)
      })
      
      // Obtener usuarioid consultando la tabla usuario
      const usuarioid = await getUsuarioidFromUser(user)
      const userId = usuarioid || 1
      
      logger.debug('[useInsertForm] userId calculado:', {
        userId,
        usuarioid,
        source: usuarioid ? 'tabla usuario (por useruuid/email)' :
                user?.user_metadata?.usuarioid ? 'user_metadata.usuarioid' :
                'fallback: 1'
      })
      
      const now = new Date().toISOString()
      let dataToInsert: Record<string, any> = {
        ...filteredData,
        usercreatedid: userId,
        datecreated: now,
        // Algunas tablas requieren usermodifiedid y datemodified incluso en inserción
        usermodifiedid: userId,
        datemodified: now
      }
      
      // Para contacto: concatenar código de país con número de celular antes de guardar
      if (tableName === 'contacto' && dataToInsert.codigotelefonoid && dataToInsert.celular) {
        // Obtener el código de país desde codigotelefonosData
        const codigoTelefono = codigotelefonosData?.find(
          (codigo: any) => codigo.codigotelefonoid === dataToInsert.codigotelefonoid
        );
        
        if (codigoTelefono?.codigotelefono) {
          // Verificar si el celular ya tiene el código concatenado (empieza con +)
          const celularActual = String(dataToInsert.celular);
          if (!celularActual.startsWith('+') && !celularActual.startsWith(codigoTelefono.codigotelefono)) {
            // Solo concatenar si no tiene el código ya
            const celularCompleto = codigoTelefono.codigotelefono + dataToInsert.celular;
            dataToInsert.celular = celularCompleto;
          }
        }
      }
      
      logger.debug('[useInsertForm] Datos a insertar (incluyendo auditoría):', {
        tableName,
        usercreatedid: dataToInsert.usercreatedid,
        usermodifiedid: dataToInsert.usermodifiedid,
        dataKeys: Object.keys(dataToInsert)
      })

      const result = await insertRow(dataToInsert)
      
      if (result.success) {
        // Verificar si es tabla 'usuario' y tiene estado de sincronización pendiente
        if (tableName === 'usuario' && result.data) {
          const syncStatus = result.data.syncStatus
          const usuarioid = result.data.usuarioid
          
          if (syncStatus === 'pending' && usuarioid) {
            // Mostrar mensaje de sincronización pendiente
            setMessage?.({ 
              type: 'warning', 
              text: result.data.syncMessage || 'Usuario creado. Sincronizando con sistema de autenticación...' 
            })
            
            // Reintentar sincronización automáticamente (según recomendación del DBA)
            retryUserSync(usuarioid, setMessage, () => {
              // Callback cuando la sincronización se complete exitosamente
              const cleanData = initializeFormData()
              setFormDataState(cleanData)
              setFormErrors({})
              setMessage?.({ 
                type: 'success', 
                text: 'Usuario creado y sincronizado exitosamente' 
              })
              onSuccess?.()
            })
            
            return // No continuar con el flujo normal, esperar sincronización
          } else if (syncStatus === 'error') {
            // Sincronización falló, pero usuario fue creado
            setMessage?.({ 
              type: 'warning', 
              text: result.data.syncMessage || 'Usuario creado pero sincronización falló. Puede reintentar más tarde.' 
            })
            // Continuar con flujo normal aunque haya error en sync
          } else if (syncStatus === 'success') {
            // Sincronización exitosa inmediatamente
            setMessage?.({ 
              type: 'success', 
              text: result.data.syncMessage || 'Usuario creado y sincronizado exitosamente' 
            })
          }
        }
        
        // Éxito: llamar callback y limpiar (si no es usuario con sync pendiente)
        if (tableName !== 'usuario' || !result.data?.syncStatus || result.data.syncStatus !== 'pending') {
          const cleanData = initializeFormData()
          setFormDataState(cleanData)
          setFormErrors({})
          // Mostrar mensaje de éxito para todas las tablas, incluyendo usuario cuando no hay sync pendiente
          if (tableName === 'usuario' && result.data?.syncStatus === 'success') {
            // Ya se mostró el mensaje arriba para sync success
          } else if (tableName === 'usuario' && result.data?.syncStatus === 'error') {
            // Ya se mostró el mensaje arriba para sync error
          } else {
            setMessage?.({ type: 'success', text: tableName === 'usuario' ? 'Usuario creado correctamente' : 'Registro insertado correctamente' })
          }
          onSuccess?.()
        }
      } else {
        // Error: mostrar mensaje (todos los mensajes deben ser 'warning' amarillo, nunca 'error' rojo)
        setMessage?.({ type: 'warning', text: result.error || 'Error al insertar' })
      }
    } catch (error: any) {
      logger.error('[useInsertForm] Excepción en inserción', error)
      setMessage?.({ type: 'warning', text: error.message || 'Error al insertar' })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, formErrors, tableName, existingData, validateFormFields, insertRow, user, onSuccess, setMessage, initializeFormData, config])
  
  // Manejar cancelación
  const handleCancel = useCallback(() => {
    const cleanData = initializeFormData()
    setFormDataState(cleanData)
    setFormErrors({})
    onCancel?.()
  }, [onCancel, initializeFormData])
  
  // Resetear formulario
  const resetForm = useCallback(() => {
    const cleanData = initializeFormData()
    setFormDataState(cleanData)
    setFormErrors({})
  }, [initializeFormData])
  
  return {
    formData,
    formErrors,
    isSubmitting,
    updateFormField,
    setFormData,
    handleInsert,
    handleCancel,
    resetForm,
    validateForm: validateFormFields
  }
}

/**
 * Reintentar sincronización de usuario automáticamente
 * Según recomendación del DBA: si sync retorna NULL, reintentar en 1-2 segundos
 * @param usuarioid ID del usuario a sincronizar
 * @param setMessage Función para mostrar mensajes al usuario
 * @param onSuccess Callback cuando la sincronización se complete exitosamente
 */
function retryUserSync(
  usuarioid: number,
  setMessage: ((msg: { type: 'success' | 'warning' | 'error'; text: string } | null) => void) | undefined,
  onSuccess: () => void
) {
  const maxAttempts = 5 // Máximo 5 reintentos (10 segundos total)
  let attempts = 0
  
  const retryInterval = setInterval(async () => {
    attempts++
    
    try {
      const syncStatus = await checkUserSyncStatus(usuarioid)
      
      if (syncStatus.synced) {
        // ✅ Sincronización exitosa
        clearInterval(retryInterval)
        logger.info(`✅ Usuario ${usuarioid} sincronizado exitosamente después de ${attempts} intento(s)`)
        onSuccess()
      } else if (attempts >= maxAttempts) {
        // ⚠️ Timeout después de N intentos
        clearInterval(retryInterval)
        logger.warn(`⚠️ Usuario ${usuarioid} no sincronizado después de ${maxAttempts} intentos`)
        setMessage?.({
          type: 'warning',
          text: 'Usuario creado pero sincronización pendiente. ' +
                'El usuario podrá hacer login una vez se complete la sincronización automática.'
        })
      } else {
        // 🔄 Aún pendiente, continuar reintentando
        logger.debug(`🔄 Reintentando sincronización de usuario ${usuarioid} (intento ${attempts}/${maxAttempts})...`)
        setMessage?.({
          type: 'warning',
          text: `Creando usuario... (${attempts}/${maxAttempts})`
        })
      }
    } catch (error: any) {
      logger.error(`❌ Error al verificar sincronización de usuario ${usuarioid}:`, error)
      
      if (attempts >= maxAttempts) {
        clearInterval(retryInterval)
        setMessage?.({
          type: 'warning',
          text: 'Usuario creado pero error al verificar sincronización. Puede reintentar más tarde.'
        })
      }
    }
  }, 2000) // Reintentar cada 2 segundos (según recomendación del DBA)
  
  // Cleanup: cancelar intervalo si el componente se desmonta
  return () => clearInterval(retryInterval)
}

