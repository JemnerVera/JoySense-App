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
  reloadUmbrales?: () => Promise<void>;
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
  reloadReglas,
  reloadUmbrales
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

    // Validar que haya al menos un umbral
    const reglaUmbralRows = formState.data._reglaUmbralRows;
    if (!reglaUmbralRows || reglaUmbralRows.length === 0) {
      setMessage({ type: 'warning', text: 'Debe agregar al menos un umbral a la regla' });
      return;
    }

    // Validar que todos los umbrales tengan umbralid
    const invalidRows = reglaUmbralRows.filter((row: any) => !row.umbralid);
    if (invalidRows.length > 0) {
      setMessage({ type: 'warning', text: 'Todos los umbrales deben tener un umbral seleccionado' });
      return;
    }

    try {
      // Preparar datos de REGLA: filtrar solo campos válidos de la tabla regla
      const validReglaFields = config?.fields.map((f: any) => f.name) || [];
      const reglaData: Record<string, any> = {};

      // Solo incluir campos que están en la configuración de la tabla regla
      validReglaFields.forEach((fieldName: string) => {
        const value = formState.data[fieldName];
        // Excluir campo especial _reglaUmbralRows
        if (fieldName === '_reglaUmbralRows') return;
        // Incluir si tiene valor (incluyendo 0 para números y false para booleanos)
        if (value !== undefined && value !== null && value !== '') {
          reglaData[fieldName] = value;
        }
      });

      // IMPORTANTE: Crear la regla INACTIVA primero (statusid=0) para evitar que los triggers
      // de validación se ejecuten antes de crear regla_umbral, regla_objeto, etc.
      // Los triggers son DEFERRABLE INITIALLY DEFERRED, pero es más seguro crear inactiva primero
      reglaData.statusid = 0; // Inactiva temporalmente

      // Agregar campos de auditoría a REGLA
      const userId = user?.user_metadata?.usuarioid || 1;
      const now = new Date().toISOString();
      reglaData.usercreatedid = userId;
      reglaData.usermodifiedid = userId;

      // Excluir reglaid (se genera automáticamente)
      delete reglaData.reglaid;

      // 1. Insertar REGLA primero (inactiva)
      const reglaResult = await insertRow(reglaData);

      if (!reglaResult || reglaResult.success === false || (reglaResult.error && !Array.isArray(reglaResult))) {
        setMessage({ type: 'error', text: reglaResult?.error || 'Error al crear la regla' });
        return;
      }

      // Obtener el ID de la regla creada
      // insertRow devuelve un objeto con success y data, o devuelve directamente los datos
      let reglaid: any;
      
      if (reglaResult.success !== undefined) {
        // Formato: { success: true, data: ... }
        const reglaInserted = Array.isArray(reglaResult.data) 
          ? reglaResult.data[0] 
          : reglaResult.data;
        reglaid = reglaInserted?.reglaid;
      } else if (Array.isArray(reglaResult)) {
        // Formato: array directo
        reglaid = reglaResult[0]?.reglaid;
      } else {
        // Formato: objeto directo
        reglaid = reglaResult?.reglaid;
      }
      
      if (!reglaid) {
        setMessage({ type: 'error', text: 'No se obtuvo el ID de la regla creada' });
        return;
      }

      // 2. Insertar REGLA_UMBRAL para cada umbral
      for (const row of reglaUmbralRows) {
        const reglaUmbralRecord: Record<string, any> = {
          reglaid: reglaid,
          umbralid: row.umbralid,
          operador_logico: row.operador_logico || 'AND',
          agrupador_inicio: row.agrupador_inicio ?? false,
          agrupador_fin: row.agrupador_fin ?? false,
          orden: row.orden || 1,
          statusid: 1,
          usercreatedid: userId,
          datecreated: now,
          usermodifiedid: userId,
          datemodified: now
        };

        try {
          const umbralResult = await JoySenseService.insertTableRow('regla_umbral', reglaUmbralRecord);
          // insertTableRow devuelve directamente los datos del backend (array) en caso de éxito
          // Si es un array, significa que fue exitoso
          if (!Array.isArray(umbralResult) && umbralResult && (umbralResult.error || umbralResult.message)) {
            const errorMsg = umbralResult.error || umbralResult.message || 'Error desconocido';
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
          
          setMessage({ 
            type: 'error', 
            text: `Error al crear asociación con umbral: ${errorMsg}` 
          });
          return;
        }
      }

      // 3. Crear REGLA_PERFIL para los perfiles seleccionados
      const perfilesSeleccionados = formState.data._perfilesSeleccionados;
      if (perfilesSeleccionados && Object.keys(perfilesSeleccionados).length > 0) {
        const perfilesActivos = Object.entries(perfilesSeleccionados)
          .filter(([_, statusid]) => statusid === 1)
          .map(([perfilid]) => parseInt(perfilid));

        for (const perfilid of perfilesActivos) {
          const reglaPerfilRecord: Record<string, any> = {
            reglaid: reglaid,
            perfilid: perfilid,
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          };

          try {
            const perfilResult = await JoySenseService.insertTableRow('regla_perfil', reglaPerfilRecord);
            if (!Array.isArray(perfilResult) && perfilResult && (perfilResult.error || perfilResult.message)) {
              console.warn(`Advertencia al asignar perfil ${perfilid}:`, perfilResult.error || perfilResult.message);
            }
          } catch (error) {
            console.warn(`Error al asignar perfil ${perfilid}:`, error);
          }
        }
      }

      // 4. Crear regla_objeto global (objetoid=NULL) para cumplir con el constraint de scope
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

      // 5. Si requiere_escalamiento=true, debemos crear regla_escalamiento antes de activar
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

      // 6. Si se asignaron perfiles, activar la regla automáticamente
      // Si no se asignaron perfiles, la regla permanece inactiva
      const tienePerfilesAsignados = perfilesSeleccionados && Object.values(perfilesSeleccionados).some((v: any) => v === 1);
      
      if (tienePerfilesAsignados) {
        // Activar la regla (statusid=1) porque ya tiene perfiles
        const activateResult = await JoySenseService.updateTableRow('regla', reglaid.toString(), {
          statusid: 1,
          usermodifiedid: userId,
          datemodified: new Date().toISOString()
        });
        
        if (!activateResult || (activateResult as any).error) {
          console.warn('Advertencia al activar la regla:', (activateResult as any)?.error);
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: 'Regla y umbrales creados correctamente. Ahora asigna perfiles desde la pestaña "REGLA & PERFIL" para activarla.' 
      });
      resetForm();
      onSubTabChange?.('status');
      loadTableData(selectedTable);
      
      // Recargar umbrales para actualizar el catálogo si se creó uno nuevo
      if (reloadUmbrales) {
        await reloadUmbrales();
      }
    } catch (error) {
      console.error('Error en handleInsert:', error);
      setMessage({ type: 'error', text: 'Error inesperado al crear la regla' });
    }
  }, [formState.data, insertRow, resetForm, user, loadTableData, onSubTabChange, selectedTable, setMessage, reloadUmbrales]);

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