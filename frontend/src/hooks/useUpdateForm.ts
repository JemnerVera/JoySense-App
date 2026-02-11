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
  revertChanges: () => void;
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
      
      // Para tabla 'usuario', cargar datos normalmente
      setFormData({ ...selectedRow });
      
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
      
      // Caso especial para tabla 'usuario': incluir password aunque sea vacío (para limpiar campo)
      if (tableName === 'usuario') {
        // Manejar password por separado
        if (dataToUpdate.password !== undefined && dataToUpdate.password !== '') {
          // Password se manejará abajo
        }
      }

      // Caso especial para carpeta: actualizar carpeta + ubicaciones + usuarios
      if (tableName === 'carpeta') {
        const carpetaid = selectedRow?.carpetaid;
        if (!carpetaid) {
          throw new Error('No hay ID de carpeta');
        }

        const currentUserId = user?.user_metadata?.usuarioid || 1;
        const now = new Date().toISOString();

        // Actualizar carpeta (solo el nombre)
        const carpetaUpdateData = {
          carpeta: formData.carpeta,
          usermodifiedid: currentUserId,
          datemodified: now
        };

        // Sincronizar ubicaciones
        const ubicacionidsToAdd = (formData.ubicacionids || []).filter((id: number) => 
          !Array.isArray(formData._existingUbicacionids) || !formData._existingUbicacionids.includes(id)
        );
        const ubicacionidsToRemove = (formData._existingUbicacionids || []).filter((id: number) =>
          !(formData.ubicacionids || []).includes(id)
        );

        // Sincronizar usuarios
        const usuarioidesToAdd = (formData.usuarioids || []).filter((id: number) =>
          !Array.isArray(formData._existingUsuarioids) || !formData._existingUsuarioids.includes(id)
        );
        const usuarioidesToRemove = (formData._existingUsuarioids || []).filter((id: number) =>
          !(formData.usuarioids || []).includes(id)
        );

        // Actualizar carpeta
        const carpetaPk = { carpetaid };
        const carpetaResult = await updateRow(carpetaPk, carpetaUpdateData);
        if (!carpetaResult.success) {
          throw new Error(`Error actualizando carpeta: ${carpetaResult.error}`);
        }

        // Eliminar ubicaciones no seleccionadas
        for (const ubicacionid of ubicacionidsToRemove) {
          try {
            const pk = { carpetaid, ubicacionid };
            await updateRow(pk, { statusid: 0, usermodifiedid: currentUserId, datemodified: now });
          } catch (error) {
            console.warn(`Error al desactivar ubicación ${ubicacionid}:`, error);
          }
        }

        // Agregar nuevas ubicaciones
        for (const ubicacionid of ubicacionidsToAdd) {
          try {
            const { JoySenseService } = await import('../services/backend-api');
            await JoySenseService.insertTableRow('carpeta_ubicacion', {
              carpetaid,
              ubicacionid,
              statusid: 1,
              usercreatedid: currentUserId,
              datecreated: now,
              usermodifiedid: currentUserId,
              datemodified: now
            });
          } catch (error) {
            console.warn(`Error al agregar ubicación ${ubicacionid}:`, error);
          }
        }

        // Eliminar usuarios no seleccionados
        for (const usuarioid of usuarioidesToRemove) {
          try {
            const pk = { carpetaid, usuarioid };
            await updateRow(pk, { statusid: 0, usermodifiedid: currentUserId, datemodified: now });
          } catch (error) {
            console.warn(`Error al desactivar usuario ${usuarioid}:`, error);
          }
        }

        // Agregar nuevos usuarios
        for (const usuarioid of usuarioidesToAdd) {
          try {
            const { JoySenseService } = await import('../services/backend-api');
            await JoySenseService.insertTableRow('carpeta_usuario', {
              carpetaid,
              usuarioid,
              statusid: 1,
              usercreatedid: currentUserId,
              datecreated: now,
              usermodifiedid: currentUserId,
              datemodified: now
            });
          } catch (error) {
            console.warn(`Error al agregar usuario ${usuarioid}:`, error);
          }
        }

        onSuccess?.();
        return;
      }

      // Caso especial para entidad (grupo): actualizar entidad + localizaciones
      if (tableName === 'entidad') {
        const entidadid = selectedRow?.entidadid;
        if (!entidadid) {
          throw new Error('No hay ID de grupo');
        }

        const currentUserId = user?.user_metadata?.usuarioid || 1;
        const now = new Date().toISOString();

        // Actualizar entidad (solo el nombre)
        const entidadUpdateData = {
          entidad: formData.entidad,
          usermodifiedid: currentUserId,
          datemodified: now
        };

        // Sincronizar localizaciones
        const localizacionidsToAdd = (formData.localizacionids || []).filter((id: number) =>
          !Array.isArray(formData._existingLocalizacionids) || !formData._existingLocalizacionids.includes(id)
        );
        const localizacionidsToRemove = (formData._existingLocalizacionids || []).filter((id: number) =>
          !(formData.localizacionids || []).includes(id)
        );

        // Actualizar entidad
        const entidadPk = { entidadid };
        const entidadResult = await updateRow(entidadPk, entidadUpdateData);
        if (!entidadResult.success) {
          throw new Error(`Error actualizando grupo: ${entidadResult.error}`);
        }

        // Eliminar localizaciones no seleccionadas (statusid=0 en entidad_localizacion)
        const { JoySenseService } = await import('../services/backend-api');
        for (const localizacionid of localizacionidsToRemove) {
          try {
            await JoySenseService.updateTableRowByCompositeKey(
              'entidad_localizacion',
              { entidadid, localizacionid },
              { statusid: 0, usermodifiedid: currentUserId, datemodified: now }
            );
          } catch (error) {
            console.warn(`Error al desactivar localización ${localizacionid}:`, error);
          }
        }

        // Agregar nuevas localizaciones
        for (const localizacionid of localizacionidsToAdd) {
          try {
            await JoySenseService.insertTableRow('entidad_localizacion', {
              entidadid,
              localizacionid,
              statusid: 1,
              usercreatedid: currentUserId,
              datecreated: now,
              usermodifiedid: currentUserId,
              datemodified: now
            });
          } catch (error) {
            console.warn(`Error al agregar localización ${localizacionid}:`, error);
          }
        }

        onSuccess?.();
        return;
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

  // Revertir cambios a los datos originales
  const revertChanges = useCallback(() => {
    if (Object.keys(originalData).length > 0) {
      setFormData({ ...originalData });
      setFormErrors({});
    }
  }, [originalData]);

  return {
    formData,
    formErrors,
    isSubmitting,
    updateFormField,
    handleUpdate,
    handleCancel,
    validateForm: validateFormFields,
    revertChanges
  };
};
