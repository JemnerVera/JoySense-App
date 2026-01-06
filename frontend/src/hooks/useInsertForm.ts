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
    
    return cleanData
  }, [config])
  
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
    logger.debug('[useInsertForm] updateFormField llamado', {
      field,
      value,
      previousValue: formData[field],
      formDataKeys: Object.keys(formData)
    })
    
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
      logger.debug('[useInsertForm] Actualizando formDataState', {
        field,
        value,
        previousValue: prev[field],
        newDataKeys: Object.keys(newData),
        newDataValue: newData[field],
        userSelected: field === 'paisid' ? userSelectedPaisRef.current : 
                     field === 'empresaid' ? userSelectedEmpresaRef.current :
                     field === 'fundoid' ? userSelectedFundoRef.current : false
      })
      return newData
    })
    
    // Limpiar error del campo cuando se modifica
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [formErrors, formData])
  
  // Establecer datos del formulario (para compatibilidad)
  const setFormData = useCallback((data: Record<string, any>) => {
    setFormDataState(data)
  }, [])
  
  // Validar formulario básico (campos requeridos)
  const validateFormFields = useCallback((): boolean => {
    if (!config) return false

    const errors: Record<string, string> = {}

    config.fields.forEach(field => {
      // No validar campos ocultos o de solo lectura
      if (field.hidden || field.readonly) return
      
      if (field.required && !formData[field.name] && formData[field.name] !== 0) {
        errors[field.name] = `${field.label} es requerido`
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [config, formData])
  
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
      
      // Caso especial para tabla 'usuario': incluir empresas_ids aunque no esté en la configuración
      // porque no es un campo de la tabla, sino un campo especial para la lógica de negocio
      if (tableName === 'usuario' && formData.empresas_ids !== undefined) {
        if (Array.isArray(formData.empresas_ids) && formData.empresas_ids.length > 0) {
          filteredData.empresas_ids = formData.empresas_ids
        }
      }
      
      // También incluir is_default_empresa si existe
      if (tableName === 'usuario' && formData.is_default_empresa !== undefined) {
        filteredData.is_default_empresa = formData.is_default_empresa
      }
      
      // Caso especial para tabla 'usuario': incluir password aunque no esté en la configuración
      // porque password_hash está oculto y password es el campo que el usuario ingresa
      if (tableName === 'usuario' && formData.password !== undefined && formData.password !== null && formData.password !== '') {
        filteredData.password = formData.password
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
          // Concatenar código de país con número (ej: +51987654321)
          const celularCompleto = codigoTelefono.codigotelefono + dataToInsert.celular;
          dataToInsert.celular = celularCompleto;
          logger.debug('[useInsertForm] Celular concatenado:', {
            codigo: codigoTelefono.codigotelefono,
            numero: filteredData.celular,
            completo: celularCompleto
          });
        }
      }
      
      logger.debug('[useInsertForm] Datos a insertar (incluyendo auditoría):', {
        tableName,
        usercreatedid: dataToInsert.usercreatedid,
        usermodifiedid: dataToInsert.usermodifiedid,
        dataKeys: Object.keys(dataToInsert),
        empresas_ids: dataToInsert.empresas_ids,
        empresas_idsType: typeof dataToInsert.empresas_ids,
        empresas_idsIsArray: Array.isArray(dataToInsert.empresas_ids),
        fullDataToInsert: tableName === 'usuario' ? dataToInsert : 'hidden'
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
          if (tableName !== 'usuario') {
            setMessage?.({ type: 'success', text: 'Registro insertado correctamente' })
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

