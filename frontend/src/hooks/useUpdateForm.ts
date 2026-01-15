/**
 * Hook para manejar el formulario de actualización en SystemParameters
 * Encapsula la lógica de carga, validación y actualización de registros
 */

import { useState, useEffect, useCallback } from 'react';
import { validateTableUpdate } from '../utils/validations';
import type { TableConfig } from '../config/tables.config';
import { logger } from '../utils/logger';

interface UseUpdateFormProps {
  selectedRow: any | null;
  tableName: string;
  config: TableConfig | null;
  updateRow: (id: string | Record<string, any>, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  getPrimaryKeyValue: (row: any) => string | Record<string, any>;
  user: any;
  existingData?: any[];
  relatedData?: any; // Para acceso a codigotelefonosData en caso de contacto
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UseUpdateFormReturn {
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  updateFormField: (field: string, value: any) => void;
  handleUpdate: () => Promise<void>;
  handleCancel: () => void;
  validateForm: () => boolean;
}

/**
 * Hook que encapsula toda la lógica del formulario de actualización
 */
export const useUpdateForm = ({
  selectedRow,
  tableName,
  config,
  updateRow,
  getPrimaryKeyValue,
  user,
  existingData = [],
  relatedData,
  onSuccess,
  onCancel
}: UseUpdateFormProps): UseUpdateFormReturn => {
  
  // Estado del formulario
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<Record<string, any>>({});

  // Cargar datos de la fila seleccionada al formulario
  useEffect(() => {
    if (selectedRow) {
      // Guardar datos originales para validación
      setOriginalData({ ...selectedRow });
      
      // Para tabla 'usuarioperfil', cargar perfiles existentes del usuario
      if (tableName === 'usuarioperfil' && selectedRow._allRows) {
        // Cargar datos con los perfiles existentes
        setFormData({
          ...selectedRow,
          _allRows: selectedRow._allRows, // Guardar todas las filas originales
          usuarioid: selectedRow.usuarioid
        });
        setFormErrors({});
        return;
      }
      
      // Para tabla 'usuario', cargar empresas asociadas
      if (tableName === 'usuario' && selectedRow.usuarioid) {
        const loadUsuarioEmpresas = async () => {
          try {
            // usuario_empresa no está en ALLOWED_TABLES, usar backend directamente
            // El backend tiene acceso a todas las tablas, así que usamos una consulta directa
            const { backendAPI } = await import('../services/backend-api');
            const { supabaseAuth } = await import('../services/supabase-auth');
            
            // Obtener token de sesión
            const { data: { session } } = await supabaseAuth.auth.getSession();
            const token = session?.access_token || null;
            
            // Usar endpoint genérico con filtro por usuarioid
            // Nota: Esto requiere que el backend permita filtros en query params
            const response = await backendAPI.get(
              `/generic/usuario_empresa?usuarioid=${selectedRow.usuarioid}&limit=1000`,
              token || undefined
            );
            
            const usuarioEmpresasArray = Array.isArray(response) 
              ? response 
              : (response?.data || []);
            
            logger.debug('[useUpdateForm] Respuesta de backend usuario_empresa:', {
              response_type: typeof response,
              response_isArray: Array.isArray(response),
              data_length: usuarioEmpresasArray.length,
              data_first3: usuarioEmpresasArray.slice(0, 3)
            });
            
            // Filtrar empresas activas del usuario (ya están filtradas por usuarioid en la query)
            const empresasActivas = usuarioEmpresasArray
              .filter((ue: any) => ue.statusid === 1)
              .map((ue: any) => ue.empresaid);
            
            // Encontrar la empresa predeterminada
            const empresaDefault = usuarioEmpresasArray.find(
              (ue: any) => ue.is_default === true && ue.statusid === 1
            );
            
            // Si no hay empresa default pero hay empresas activas, usar la primera como default
            const defaultEmpresaId = empresaDefault?.empresaid || (empresasActivas.length > 0 ? empresasActivas[0] : null);
            
            // Cargar datos al formulario incluyendo empresas
            const formDataWithEmpresas = {
              ...selectedRow,
              empresas_ids: empresasActivas,
              is_default_empresa: defaultEmpresaId
            };
            
            logger.debug('[useUpdateForm] Empresas cargadas para usuario:', {
              usuarioid: selectedRow.usuarioid,
              empresas_ids: empresasActivas,
              empresas_ids_type: typeof empresasActivas[0],
              empresas_ids_length: empresasActivas.length,
              is_default_empresa: empresaDefault?.empresaid,
              formDataWithEmpresas_keys: Object.keys(formDataWithEmpresas),
              formDataWithEmpresas_empresas_ids: formDataWithEmpresas.empresas_ids,
              formDataWithEmpresas_empresas_ids_type: typeof formDataWithEmpresas.empresas_ids,
              formDataWithEmpresas_empresas_ids_isArray: Array.isArray(formDataWithEmpresas.empresas_ids)
            });
            
            setFormData(formDataWithEmpresas);
            
            logger.debug('[useUpdateForm] formData actualizado con empresas');
          } catch (error) {
            logger.error('[useUpdateForm] Error cargando empresas del usuario:', error);
            // Si falla, cargar sin empresas
            setFormData({ ...selectedRow });
          }
        };
        
        loadUsuarioEmpresas();
      } else {
        // Para otras tablas, cargar normalmente
        setFormData({ ...selectedRow });
      }
      
      // Limpiar errores
      setFormErrors({});
    } else {
      // Limpiar formulario si no hay fila seleccionada
      setFormData({});
      setFormErrors({});
      setOriginalData({});
    }
  }, [selectedRow, tableName]);

  // Actualizar campo del formulario
  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo cuando se modifica
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  // Validar formulario
  const validateFormFields = useCallback((): boolean => {
    if (!config) return false;

    const errors: Record<string, string> = {};

    // Validar campos requeridos (excluir campos de clave primaria que son solo lectura)
    const primaryKeyFields: string[] = [];
    try {
      const { getPrimaryKey } = require('../config/tables.config');
      const pk = getPrimaryKey(config.name);
      if (Array.isArray(pk)) {
        primaryKeyFields.push(...pk);
      } else {
        primaryKeyFields.push(pk);
      }
    } catch (e) {
      // Si no se puede obtener la clave primaria, continuar sin excluir
    }

    config.fields.forEach(field => {
      // No validar campos de clave primaria (son solo lectura)
      if (primaryKeyFields.includes(field.name)) {
        return;
      }
      
      if (field.required && !formData[field.name] && formData[field.name] !== 0) {
        errors[field.name] = `${field.label} es requerido`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [config, formData]);

  // Validar formulario completo (incluyendo validaciones específicas de update)
  const validateFormComplete = useCallback(async (): Promise<boolean> => {
    if (!config) return false;

    // Primero validar campos requeridos
    if (!validateFormFields()) {
      return false;
    }

    // Luego validar con validaciones específicas de update
    try {
      const validationResult = await validateTableUpdate(
        tableName,
        formData,
        originalData,
        existingData
      );

      if (!validationResult.isValid) {
        // Convertir errores de validación al formato de formErrors
        const errors: Record<string, string> = {};
        validationResult.errors.forEach(error => {
          errors[error.field] = error.message;
        });
        setFormErrors(errors);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error en validación:', error);
      return false;
    }
  }, [tableName, formData, originalData, existingData, config, validateFormFields]);

  // Manejar actualización
  const handleUpdate = useCallback(async () => {
    if (!selectedRow) {
      setFormErrors({ general: 'No hay registro seleccionado' });
      return;
    }

    // Primero validar campos requeridos básicos
    const basicValidation = validateFormFields();
    if (!basicValidation) {
      // Mostrar errores de validación (se mostrarán como warnings amarillos)
      return;
    }

    // Luego validar con validaciones específicas de update
    const isValid = await validateFormComplete();
    if (!isValid) {
      // Los errores ya están en formErrors, se mostrarán como warnings
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Agregar campos de auditoría
      let dataToUpdate: Record<string, any> = {
        ...formData,
        usermodifiedid: user?.user_metadata?.usuarioid || 1,
        datemodified: new Date().toISOString()
      };

      // Para contacto: concatenar código de país con número de celular antes de guardar
      if (tableName === 'contacto' && dataToUpdate.codigotelefonoid && dataToUpdate.celular) {
        // Obtener el código de país desde codigotelefonosData
        const codigotelefonosData = (relatedData as any)?.codigotelefonosData || [];
        const codigoTelefono = codigotelefonosData.find(
          (codigo: any) => codigo.codigotelefonoid === dataToUpdate.codigotelefonoid
        );
        
        if (codigoTelefono?.codigotelefono) {
          // Verificar si el celular ya tiene el código concatenado (empieza con +)
          const celularActual = String(dataToUpdate.celular);
          if (!celularActual.startsWith('+') && !celularActual.startsWith(codigoTelefono.codigotelefono)) {
            // Solo concatenar si no tiene el código ya
            dataToUpdate.celular = codigoTelefono.codigotelefono + dataToUpdate.celular;
          }
        }
      }
      
      // Caso especial para tabla 'usuario': incluir empresas_ids aunque no esté en la configuración
      // porque no es un campo de la tabla, sino un campo especial para la lógica de negocio
      if (tableName === 'usuario' && formData.empresas_ids !== undefined) {
        if (Array.isArray(formData.empresas_ids) && formData.empresas_ids.length > 0) {
          dataToUpdate.empresas_ids = formData.empresas_ids;
          logger.debug('[useUpdateForm] empresas_ids agregado a dataToUpdate para usuario:', {
            empresas_ids: formData.empresas_ids,
            count: formData.empresas_ids.length
          });
        } else {
          // Si está vacío, enviar array vacío para desactivar todas las empresas
          dataToUpdate.empresas_ids = [];
          logger.debug('[useUpdateForm] empresas_ids vacío, se desactivarán todas las empresas');
        }
      }
      
      // También incluir is_default_empresa si existe
      if (tableName === 'usuario' && formData.is_default_empresa !== undefined) {
        dataToUpdate.is_default_empresa = formData.is_default_empresa;
      }

      // Caso especial para usuarioperfil: actualizar múltiples registros
      if (tableName === 'usuarioperfil' && formData._perfilesStatus && formData._allRows) {
        const perfilesStatus = formData._perfilesStatus as Record<number, number>;
        const existingRows = formData._allRows as any[];
        const usuarioid = formData.usuarioid;
        
        if (!usuarioid) {
          throw new Error('Debe seleccionar un usuario');
        }

        // Obtener usuarioid del usuario autenticado para campos de auditoría
        const currentUserId = user?.user_metadata?.usuarioid || 1;
        const now = new Date().toISOString();

        // Comparar perfiles seleccionados con existentes
        const perfilesSeleccionados = Object.entries(perfilesStatus)
          .filter(([_, statusid]) => statusid === 1)
          .map(([perfilid, _]) => parseInt(perfilid));

        const perfilesExistentes = existingRows.map((r: any) => r.perfilid);

        // Perfiles a eliminar (estaban activos pero ahora están inactivos)
        const perfilesAEliminar = existingRows
          .filter((r: any) => r.statusid === 1 && !perfilesSeleccionados.includes(r.perfilid))
          .map((r: any) => ({ usuarioid: r.usuarioid, perfilid: r.perfilid }));

        // Perfiles a agregar (nuevos o que estaban inactivos)
        const perfilesAAgregar = perfilesSeleccionados
          .filter(perfilid => !existingRows.some((r: any) => r.perfilid === perfilid && r.statusid === 1))
          .map(perfilid => ({
            usuarioid: usuarioid,
            perfilid: perfilid,
            statusid: 1,
            usercreatedid: currentUserId,
            datecreated: now,
            usermodifiedid: currentUserId,
            datemodified: now
          }));

        // Perfiles a actualizar (cambiar statusid)
        const perfilesAActualizar = existingRows
          .filter((r: any) => {
            const nuevoStatus = perfilesStatus[r.perfilid];
            return nuevoStatus !== undefined && nuevoStatus !== r.statusid;
          })
          .map((r: any) => ({
            pk: { usuarioid: r.usuarioid, perfilid: r.perfilid },
            data: {
              statusid: perfilesStatus[r.perfilid],
              usermodifiedid: currentUserId,
              datemodified: now
            }
          }));

        // Ejecutar operaciones
        const results = [];
        
        // Eliminar perfiles
        for (const pk of perfilesAEliminar) {
          try {
            // Para eliminar, necesitamos usar DELETE, pero como no tenemos deleteRow aquí,
            // actualizamos statusid a 0
            const result = await updateRow(pk, {
              statusid: 0,
              usermodifiedid: currentUserId,
              datemodified: now
            });
            if (result.success) {
              results.push({ type: 'delete', success: true });
            }
          } catch (error: any) {
            results.push({ type: 'delete', success: false, error: error.message });
          }
        }

        // Agregar perfiles nuevos
        for (const record of perfilesAAgregar) {
          try {
            // Usar JoySenseService para insertar nuevos perfiles
            const { JoySenseService } = await import('../services/backend-api');
            await JoySenseService.insertTableRow('usuarioperfil', record);
            results.push({ type: 'insert', success: true });
          } catch (error: any) {
            results.push({ type: 'insert', success: false, error: error.message });
          }
        }

        // Actualizar perfiles existentes
        for (const { pk, data } of perfilesAActualizar) {
          try {
            const result = await updateRow(pk, data);
            if (result.success) {
              results.push({ type: 'update', success: true });
            } else {
              results.push({ type: 'update', success: false, error: result.error });
            }
          } catch (error: any) {
            results.push({ type: 'update', success: false, error: error.message });
          }
        }

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        if (errorCount === 0) {
          onSuccess?.();
        } else {
          setFormErrors({ 
            general: `Se actualizaron ${successCount} perfil(es), pero hubo ${errorCount} error(es). Los perfiles nuevos deben agregarse en modo CREATE.` 
          });
        }
        
        return;
      }

      const pk = getPrimaryKeyValue(selectedRow);
      const result = await updateRow(pk, dataToUpdate);
      
      if (result.success) {
        // Éxito: llamar callback y limpiar
        onSuccess?.();
      } else {
        // Error: mostrar mensaje
        setFormErrors({ general: result.error || 'Error al actualizar' });
      }
    } catch (error: any) {
      setFormErrors({ general: error.message || 'Error al actualizar' });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRow, formData, validateFormComplete, updateRow, getPrimaryKeyValue, user, relatedData, tableName, onSuccess]);

  // Manejar cancelación
  const handleCancel = useCallback(() => {
    setFormData({});
    setFormErrors({});
    setOriginalData({});
    onCancel?.();
  }, [onCancel]);

  return {
    formData,
    formErrors,
    isSubmitting,
    updateFormField,
    handleUpdate,
    handleCancel,
    validateForm: validateFormFields
  };
};
