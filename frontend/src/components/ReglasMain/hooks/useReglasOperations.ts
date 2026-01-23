import { useCallback } from 'react';
import { JoySenseService } from '../../../services/backend-api';
import { ReglaUpdateData, OperationResult, UmbralData } from '../types';

interface UseReglasOperationsProps {
  formState: any;
  selectedRow: any;
  user: any;
  config: any;
  selectedTable: string;
  insertRow: (data: any) => Promise<any>;
  updateRow: (primaryKeyValue: any, data: any) => Promise<any>;
  validateForm: () => boolean;
  getPrimaryKeyValue: (row: any) => any;
  loadTableData: (tableName: string) => void;
  setMessage: (message: any) => void;
  resetForm: () => void;
  onSubTabChange?: (tab: 'status' | 'insert' | 'update') => void;
  setSelectedRow: (row: any) => void;
  setUpdateFormData: (data: any) => void;
  reloadReglas: () => void;
}

export function useReglasOperations({
  formState,
  selectedRow,
  user,
  config,
  selectedTable,
  insertRow,
  updateRow,
  validateForm,
  getPrimaryKeyValue,
  loadTableData,
  setMessage,
  resetForm,
  onSubTabChange,
  setSelectedRow,
  setUpdateFormData,
  reloadReglas
}: UseReglasOperationsProps) {

  const handleInsert = useCallback(async () => {
    // Validación de campos requeridos según la configuración de la tabla
    if (!formState.data.nombre || formState.data.nombre.trim() === '') {
      setMessage({ type: 'warning', text: 'Por favor ingrese un nombre para la regla' });
      return;
    }
    if (!formState.data.criticidadid) {
      setMessage({ type: 'warning', text: 'Por favor seleccione una criticidad' });
      return;
    }

    // Agregar campos de auditoría
    const userId = user?.user_metadata?.usuarioid || 1;
    const now = new Date().toISOString();
    const dataToInsert: Record<string, any> = {
      ...formState.data,
      usercreatedid: userId,
      datecreated: now,
      usermodifiedid: userId,
      datemodified: now
    };

    // Excluir reglaid (se genera automáticamente)
    delete dataToInsert.reglaid;

    const result = await insertRow(dataToInsert);

    if (result.success) {
      setMessage({ type: 'success', text: 'Regla creada correctamente' });
      resetForm();
      onSubTabChange?.('status');
      loadTableData(selectedTable);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al crear la regla' });
    }
  }, [formState.data, insertRow, resetForm, user, loadTableData, onSubTabChange, selectedTable, setMessage]);

  const handleUpdate = useCallback(async () => {
    if (!validateForm()) {
      const validationErrors = Object.values(formState.errors).filter(Boolean);
      const errorMessage = validationErrors.length > 0
        ? validationErrors.join('\n')
        : 'Por favor complete todos los campos requeridos';

      setMessage({ type: 'warning', text: errorMessage });
      return;
    }

    if (!selectedRow) {
      setMessage({ type: 'error', text: 'No hay fila seleccionada para actualizar' });
      return;
    }

    const primaryKeyValue = getPrimaryKeyValue(selectedRow);
    const dataToUpdate = {
      ...formState.data,
      usermodifiedid: user?.user_metadata?.usuarioid || 1,
      datemodified: new Date().toISOString()
    };

    const result = await updateRow(primaryKeyValue, dataToUpdate);

    if (result.success) {
      setMessage({ type: 'success', text: 'Regla actualizada correctamente' });
      resetForm();
      setSelectedRow(null);
      setUpdateFormData({});
      onSubTabChange?.('status');
      loadTableData(selectedTable);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar la regla' });
    }
  }, [formState.data, formState.errors, validateForm, selectedRow, updateRow, user, getPrimaryKeyValue, loadTableData, onSubTabChange, resetForm, setMessage, selectedTable, setSelectedRow, setUpdateFormData]);

  // Función para manejar la actualización de regla y umbrales
  const handleReglaUpdate = useCallback(async (reglaid: number, data: ReglaUpdateData): Promise<OperationResult> => {
    const reglaUmbralRows = data._reglaUmbralRows;

    // Validar que haya al menos un umbral
    if (!reglaUmbralRows || reglaUmbralRows.length === 0) {
      return { success: false, error: 'Debe agregar al menos un umbral' };
    }

    // Validar que todos los umbrales tengan umbralid
    const invalidRows = reglaUmbralRows.filter(row => !row.umbralid);
    if (invalidRows.length > 0) {
      return { success: false, error: 'Todos los umbrales deben tener un umbral seleccionado' };
    }

    try {
      // 1. Actualizar la regla
      const validReglaFields = config?.fields.map((f: any) => f.name) || [];
      const reglaData: Record<string, any> = {};

      // Solo incluir campos que están en la configuración de la tabla regla
      validReglaFields.forEach((fieldName: string) => {
        if (fieldName === '_reglaUmbralRows') return; // Excluir campo especial
        const value = data[fieldName];
        if (value !== undefined && value !== null && value !== '') {
          reglaData[fieldName] = value;
        }
      });

      // Agregar campos de auditoría
      reglaData.usermodifiedid = user?.user_metadata?.usuarioid || 1;
      reglaData.datemodified = new Date().toISOString();

      // Actualizar REGLA
      const reglaResult = await updateRow(reglaid.toString(), reglaData);
      if (!reglaResult.success) {
        return { success: false, error: `Error al actualizar regla: ${reglaResult.error || 'Error desconocido'}` };
      }

      // 2. Obtener umbrales existentes de la regla - solo activos (statusid: 1)
      const existingUmbrales = await JoySenseService.getTableData('regla_umbral', 1000);
      const existingUmbralesFiltrados = (existingUmbrales || []).filter((ru: any) =>
        ru.reglaid === reglaid && ru.statusid === 1
      );

      // 3. Preparar umbrales nuevos con tempId para identificar cuáles son nuevos y cuáles existentes
      const umbralesNuevos: UmbralData[] = reglaUmbralRows.map(row => {
        let regla_umbralid: number | null = null;
        if (row.tempId?.includes('regla_umbralid')) {
          const parts = row.tempId.split('-');
          // Buscar el número después de "regla_umbralid"
          const idIndex = parts.findIndex((p: string) => p === 'regla_umbralid');
          if (idIndex >= 0 && idIndex + 1 < parts.length) {
            regla_umbralid = parseInt(parts[idIndex + 1]);
          }
        }
        return {
          regla_umbralid,
          umbralid: row.umbralid!,
          operador_logico: row.operador_logico || 'AND',
          agrupador_inicio: row.agrupador_inicio ?? false,
          agrupador_fin: row.agrupador_fin ?? false,
          orden: row.orden || 1
        };
      });

      // 4. Identificar umbrales a desactivar (existen en BD pero no en la lista nueva)
      const umbralesIdsNuevos = umbralesNuevos
        .map(u => u.regla_umbralid)
        .filter(id => id !== null) as number[];

      for (const existingUmbral of existingUmbralesFiltrados) {
        if (!umbralesIdsNuevos.includes(existingUmbral.regla_umbralid)) {
          // Desactivar umbral que ya no está en la lista nueva (statusid: 0)
          await JoySenseService.updateTableRow('regla_umbral', existingUmbral.regla_umbralid.toString(), {
            statusid: 0,
            usermodifiedid: user?.user_metadata?.usuarioid || 1,
            datemodified: new Date().toISOString()
          });
        }
      }

      // 5. Agregar o actualizar umbrales
      const userId = user?.user_metadata?.usuarioid || 1;
      const now = new Date().toISOString();

      for (const nuevoUmbral of umbralesNuevos) {
        if (nuevoUmbral.regla_umbralid) {
          // Actualizar umbral existente
          const existingUmbral = existingUmbralesFiltrados.find((ru: any) =>
            ru.regla_umbralid === nuevoUmbral.regla_umbralid
          );

          if (existingUmbral) {
            // Verificar si hay cambios
            const hasChanges =
              existingUmbral.umbralid !== nuevoUmbral.umbralid ||
              existingUmbral.operador_logico !== nuevoUmbral.operador_logico ||
              existingUmbral.agrupador_inicio !== nuevoUmbral.agrupador_inicio ||
              existingUmbral.agrupador_fin !== nuevoUmbral.agrupador_fin ||
              existingUmbral.orden !== nuevoUmbral.orden;

            if (hasChanges) {
              await JoySenseService.updateTableRow('regla_umbral', existingUmbral.regla_umbralid.toString(), {
                umbralid: nuevoUmbral.umbralid,
                operador_logico: nuevoUmbral.operador_logico,
                agrupador_inicio: nuevoUmbral.agrupador_inicio,
                agrupador_fin: nuevoUmbral.agrupador_fin,
                orden: nuevoUmbral.orden,
                usermodifiedid: userId,
                datemodified: now
              });
            }
          }
        } else {
          // Insertar nuevo umbral
          const reglaUmbralRecord: Record<string, any> = {
            reglaid: reglaid,
            umbralid: nuevoUmbral.umbralid,
            operador_logico: nuevoUmbral.operador_logico,
            agrupador_inicio: nuevoUmbral.agrupador_inicio,
            agrupador_fin: nuevoUmbral.agrupador_fin,
            orden: nuevoUmbral.orden,
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          };

          await JoySenseService.insertTableRow('regla_umbral', reglaUmbralRecord);
        }
      }

      // Recargar datos
      await loadTableData(selectedTable);
      await reloadReglas();

      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando regla:', error);
      return { success: false, error: error.message || 'Error al actualizar la regla' };
    }
  }, [config, updateRow, user, loadTableData, selectedTable, reloadReglas]);

  return {
    handleInsert,
    handleUpdate,
    handleReglaUpdate
  };
}