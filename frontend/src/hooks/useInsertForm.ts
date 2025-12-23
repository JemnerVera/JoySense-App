/**
 * Hook para manejar el formulario de inserción en SystemParameters
 * Encapsula la lógica de inicialización, validación e inserción de registros
 * Similar a useUpdateForm pero completamente aislado para evitar contaminación de estado
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { validateTableData } from '../utils/validations'
import type { TableConfig } from '../config/tables.config'
import { getTableConfig } from '../config/tables.config'
import { logger } from '../utils/logger'
import { consolidateErrorMessages } from '../utils/messageConsolidation'

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
export const useInsertForm = ({
  tableName,
  insertRow,
  user,
  existingData = [],
  onSuccess,
  onCancel,
  setMessage,
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
  }, [tableName, resetKey, initializeFormData])
  
  // Sincronizar con filtros globales (similar a NormalInsertForm)
  useEffect(() => {
    if (!config || !tableName) return
    
    // Sincronizar paisid si hay filtro global
    if (paisSeleccionado && tableName !== 'pais') {
      const paisField = config.fields.find(f => f.name === 'paisid')
      if (paisField && !formData.paisid) {
        const paisId = parseInt(paisSeleccionado, 10)
        if (!isNaN(paisId)) {
          setFormDataState(prev => ({ ...prev, paisid: paisId }))
        }
      }
    } else if (!paisSeleccionado && tableName !== 'pais') {
      // Limpiar paisid si no hay filtro global
      if (formData.paisid) {
        setFormDataState(prev => {
          const { paisid, ...rest } = prev
          return rest
        })
      }
    }
    
    // Sincronizar empresaid si hay filtro global
    if (empresaSeleccionada && tableName !== 'empresa') {
      const empresaField = config.fields.find(f => f.name === 'empresaid')
      if (empresaField && !formData.empresaid) {
        const empresaId = parseInt(empresaSeleccionada, 10)
        if (!isNaN(empresaId)) {
          setFormDataState(prev => ({ ...prev, empresaid: empresaId }))
        }
      }
    } else if (!empresaSeleccionada && tableName !== 'empresa') {
      // Limpiar empresaid si no hay filtro global
      if (formData.empresaid) {
        setFormDataState(prev => {
          const { empresaid, ...rest } = prev
          return rest
        })
      }
    }
    
    // Sincronizar fundoid si hay filtro global
    if (fundoSeleccionado && tableName !== 'fundo') {
      const fundoField = config.fields.find(f => f.name === 'fundoid')
      if (fundoField && !formData.fundoid) {
        const fundoId = parseInt(fundoSeleccionado, 10)
        if (!isNaN(fundoId)) {
          setFormDataState(prev => ({ ...prev, fundoid: fundoId }))
        }
      }
    } else if (!fundoSeleccionado && tableName !== 'fundo') {
      // Limpiar fundoid si no hay filtro global
      if (formData.fundoid) {
        setFormDataState(prev => {
          const { fundoid, ...rest } = prev
          return rest
        })
      }
    }
  }, [paisSeleccionado, empresaSeleccionada, fundoSeleccionado, tableName, config, formData.paisid, formData.empresaid, formData.fundoid])
  
  // Actualizar campo del formulario
  const updateFormField = useCallback((field: string, value: any) => {
    setFormDataState(prev => ({
      ...prev,
      [field]: value
    }))
    // Limpiar error del campo cuando se modifica
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [formErrors])
  
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
    // Validaciones especiales según la tabla
    if (tableName === 'nodo') {
      // Validación especial para nodo (validación progresiva)
      const nodoValue = formData.nodo
      if (!nodoValue || (typeof nodoValue === 'string' && nodoValue.trim() === '')) {
        setMessage?.({ type: 'warning', text: 'El nombre del nodo es obligatorio' })
        return
      }
      
      const deveuiValue = formData.deveui
      if (!deveuiValue || (typeof deveuiValue === 'string' && deveuiValue.trim() === '')) {
        setMessage?.({ type: 'warning', text: 'El campo DEVEUI es obligatorio cuando se especifica un nodo' })
        return
      }
    } else {
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
      
      // Agregar campos de auditoría
      const userId = user?.user_metadata?.usuarioid || user?.id || 1
      const now = new Date().toISOString()
      const dataToInsert: Record<string, any> = {
        ...filteredData,
        usercreatedid: userId,
        datecreated: now,
        // Algunas tablas requieren usermodifiedid y datemodified incluso en inserción
        usermodifiedid: userId,
        datemodified: now
      }

      const result = await insertRow(dataToInsert)
      
      if (result.success) {
        // Éxito: llamar callback y limpiar
        const cleanData = initializeFormData()
        setFormDataState(cleanData)
        setFormErrors({})
        setMessage?.({ type: 'success', text: 'Registro insertado correctamente' })
        onSuccess?.()
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

