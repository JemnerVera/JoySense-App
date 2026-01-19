/**
 * ReglasMain - Componente principal para gestión de reglas de alertas
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { useSidebar } from '../contexts/SidebarContext';

// Hooks
import { useTableCRUD } from '../hooks/useTableCRUD';
import { useTableDataManagement } from '../hooks/useTableDataManagement';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

// Components
import { LoadingSpinner } from './SystemParameters/LoadingSpinner';
import { MessageDisplay } from './SystemParameters/MessageDisplay';
import { StatusTab } from './SystemParameters/StatusTab/StatusTab';
import { InsertTab } from './SystemParameters/InsertTab/InsertTab';
import { ReglasSankeyDiagram } from './Reglas/ReglasSankeyDiagram';
import { ReglaUpdateForm } from './Reglas/ReglaUpdateForm';
import { getColumnDisplayNameTranslated } from '../utils/systemParametersUtils';
import { JoySenseService } from '../services/backend-api';

// ============================================================================
// INTERFACES
// ============================================================================

interface ReglasMainProps {
  activeSubTab?: 'status' | 'insert' | 'update';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
}

export interface ReglasMainRef {
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: 'status' | 'insert' | 'update') => void;
}

interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ReglasMain = forwardRef<ReglasMainRef, ReglasMainProps>(({
  activeSubTab: propActiveSubTab = 'status',
  onSubTabChange,
  onFormDataChange
}, ref) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal } = useModal();
  const sidebar = useSidebar();

  // Tabla fija para reglas
  const selectedTable = 'regla';

  // Estado local - usar propActiveSubTab directamente, no estado local
  const activeSubTab = propActiveSubTab;
  const [message, setMessage] = useState<Message | null>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState<Record<string, any>>({});
  const [reglasData, setReglasData] = useState<any[]>([]);

  // Hook CRUD
  const {
    tableState,
    formState,
    relatedData: crudRelatedData,
    config,
    loadData,
    loadRelatedData,
    insertRow,
    updateRow,
    deleteRow,
    setFormData,
    updateFormField,
    resetForm,
    validateForm,
    getDisplayValue,
    getPrimaryKeyValue
  } = useTableCRUD({ tableName: selectedTable });

  // Hook para gestión de datos de tabla
  const {
    tableData,
    columns,
    loading: tableDataLoading,
    userData,
    paisesData,
    empresasData,
    fundosData,
    ubicacionesData,
    perfilesData,
    criticidadesData,
    loadTableData,
    setTableData,
    setColumns,
    setLoading,
    loadRelatedTablesData
  } = useTableDataManagement();

  // Hook para detectar cambios sin guardar
  const { hasUnsavedChanges: checkUnsavedChanges } = useUnsavedChanges();
  
  const hasUnsavedChanges = useCallback(() => {
    // Para update, verificar también updateFormData
    if (activeSubTab === 'update') {
      if (!updateFormData || Object.keys(updateFormData).length === 0) {
        return false;
      }
      if (updateFormData.__formOpen === true && updateFormData.__hasChanges === false) {
        return false;
      }
      const realKeys = Object.keys(updateFormData).filter(key => key !== '__formOpen' && key !== '__hasChanges');
      if (realKeys.length > 0) {
        return true;
      }
    }
    
    return checkUnsavedChanges({
      formData: formState.data,
      selectedTable,
      activeSubTab,
      multipleData: []
    });
  }, [formState.data, activeSubTab, selectedTable, updateFormData, checkUnsavedChanges]);

  // Monitorear cambios sin guardar y notificar al sidebar
  // SOLO marcar dirty en CREAR o ACTUALIZAR (no en STATUS)
  useEffect(() => {
    // En STATUS no hay cambios sin guardar
    if (activeSubTab === 'status') {
      sidebar.markDirty('reglas-main', false);
      return;
    }
    
    const isDirty = hasUnsavedChanges();
    sidebar.markDirty('reglas-main', isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.isDirty, formState.data, activeSubTab, updateFormData]);

  // Handler interno para cambios de subTab con protección
  const handleSubTabChangeInternal = useCallback((tab: 'status' | 'insert' | 'update') => {
    // Verificar cambios sin guardar antes de cambiar
    const hasChanges = hasUnsavedChanges();
    if (hasChanges) {
      // Usar el modal para confirmar navegación
      const getSubTabName = (subTab: string) => {
        const names: { [key: string]: string } = {
          'status': 'Estado',
          'insert': 'Crear',
          'update': 'Actualizar'
        };
        return names[subTab] || subTab;
      };
      
      // Usar el sistema del sidebar para mostrar el modal
      sidebar.requestSubTabChange?.(tab, () => {
        sidebar.markDirty('reglas-main', false);
        onSubTabChange?.(tab);
      });
    } else {
      onSubTabChange?.(tab);
    }
  }, [hasUnsavedChanges, sidebar, onSubTabChange, showModal]);

  // Monitorear cambios sin guardar y notificar al sidebar
  useEffect(() => {
    const isDirty = hasUnsavedChanges();
    sidebar.markDirty('reglas-main', isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.isDirty, formState.data, activeSubTab, updateFormData]);

  // Exponer métodos al padre mediante ref
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => hasUnsavedChanges(),
    handleTabChange: (tab: 'status' | 'insert' | 'update') => {
      handleSubTabChangeInternal(tab);
    }
  }));

  // Cargar datos relacionados al montar
  useEffect(() => {
    loadRelatedTablesData();
    if (activeSubTab !== 'status') {
      loadRelatedData();
    }
  }, [activeSubTab, loadRelatedData, loadRelatedTablesData]);

  // Cargar reglasData cuando se monta o cuando cambia a 'update'
  useEffect(() => {
    const loadReglas = async () => {
      try {
        const reglas = await JoySenseService.getTableData('regla', 1000);
        const reglasArray = Array.isArray(reglas) ? reglas : [];
        setReglasData(reglasArray);
      } catch (error) {
        console.error('Error cargando reglas:', error);
        setReglasData([]);
      }
    };
    // Cargar cuando se monta o cuando se cambia a 'update'
    if (activeSubTab === 'update' || reglasData.length === 0) {
      loadReglas();
    }
  }, [activeSubTab]);

  // Cargar datos de la tabla cuando cambia el subTab
  // Para 'insert' también necesitamos cargar las columnas (aunque no los datos)
  useEffect(() => {
    if (activeSubTab === 'status' || activeSubTab === 'update' || activeSubTab === 'insert') {
      loadTableData(selectedTable);
    }
  }, [activeSubTab, loadTableData, selectedTable]);

  // Limpiar datos solo cuando cambia a 'insert' (pero mantener las columnas)
  useEffect(() => {
    if (activeSubTab === 'insert') {
      setTableData([]); // Limpiar datos pero mantener columnas
      setLoading(false);
      setMessage(null);
      setSelectedRow(null);
      setUpdateFormData({});
      resetForm();
    }
  }, [activeSubTab, setTableData, setLoading, resetForm]);

  const handleRowSelect = useCallback((row: any) => {
    setSelectedRow(row);
    setFormData(row);
    onSubTabChange?.('update');
  }, [setFormData, onSubTabChange]);

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
  }, [formState.data, insertRow, resetForm, user, loadTableData, onSubTabChange, selectedTable]);

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
  }, [formState.data, formState.errors, validateForm, selectedRow, updateRow, user, getPrimaryKeyValue, loadTableData, onSubTabChange, resetForm, selectedTable]);

  // Función para manejar la actualización de regla y umbrales
  const handleReglaUpdate = useCallback(async (reglaid: number, data: Record<string, any>) => {
    const reglaUmbralRows = data._reglaUmbralRows as Array<{
      umbralid: number | null;
      operador_logico: 'AND' | 'OR';
      agrupador_inicio: boolean;
      agrupador_fin: boolean;
      orden: number;
      tempId?: string;
    }>;

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
      // Los umbrales que vienen de formData tienen tempId que incluye el regla_umbralid si existe
      // Formato: "temp-regla_umbralid-{id}-{index}" o "temp-{timestamp}-{index}"
      const umbralesNuevos = reglaUmbralRows.map(row => {
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
      const updatedReglas = await JoySenseService.getTableData('regla', 1000);
      setReglasData(Array.isArray(updatedReglas) ? updatedReglas : []);

      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando regla:', error);
      return { success: false, error: error.message || 'Error al actualizar la regla' };
    }
  }, [config, updateRow, user, loadTableData, selectedTable]);

  // Función helper para obtener opciones únicas
  // Estado para umbralesData
  const [umbralesData, setUmbralesData] = useState<any[]>([]);

  // Cargar umbralesData cuando se monta o cuando cambia a 'update'
  useEffect(() => {
    const loadUmbrales = async () => {
      try {
        const umbrales = await JoySenseService.getTableData('umbral', 1000);
        const umbralesArray = Array.isArray(umbrales) ? umbrales : [];
        setUmbralesData(umbralesArray);
      } catch (error) {
        console.error('Error cargando umbrales:', error);
        setUmbralesData([]);
      }
    };
    
    if (activeSubTab === 'update') {
      loadUmbrales();
    }
  }, [activeSubTab]);

  const getUniqueOptionsForField = useCallback((columnName: string): Array<{value: any, label: string}> => {
    // Buscar en crudRelatedData primero
    let relatedTable = crudRelatedData[columnName.replace('id', '')] || 
                       crudRelatedData[columnName] || [];
    
    // Si no se encuentra, buscar en criticidadesData (para criticidadid)
    if ((!Array.isArray(relatedTable) || relatedTable.length === 0) && columnName === 'criticidadid') {
      relatedTable = criticidadesData || [];
    }
    
    // Si no se encuentra, buscar en umbralesData (para umbralid)
    if ((!Array.isArray(relatedTable) || relatedTable.length === 0) && columnName === 'umbralid') {
      relatedTable = umbralesData || [];
    }
    
    if (!Array.isArray(relatedTable) || relatedTable.length === 0) {
      return [];
    }

    return relatedTable.map((item: any) => {
      const value = item[columnName] || item[`${columnName.replace('id', '')}id`];
      let label = '';
      
      if (columnName === 'criticidadid') {
        label = item.criticidad || `Criticidad ${value}`;
      } else if (columnName === 'perfilid') {
        label = item.perfil || `Perfil ${value}`;
      } else if (columnName === 'umbralid') {
        label = item.umbral || `Umbral ${value}`;
      } else {
        label = String(value);
      }
      
      return { value, label };
    });
  }, [crudRelatedData, criticidadesData, umbralesData]);

  // Construir relatedData para StatusTab y UpdateTab
  const relatedData = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    criticidadesData: criticidadesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, criticidadesData, userData]);

  // Datos relacionados para InsertTab
  const relatedDataForStatus = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    criticidadesData: criticidadesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, criticidadesData, userData]);

  // Renderizar contenido según el subTab activo
  const renderContent = () => {
    switch (activeSubTab) {
      case 'status':
        // Mostrar diagrama Sankey en lugar de tabla para regla
        return (
          <ReglasSankeyDiagram themeColor="red" />
        );
      
      case 'insert':
        return (
          <InsertTab
            tableName={selectedTable}
            formData={formState.data}
            setFormData={setFormData}
            updateFormField={updateFormField}
            loading={formState.isSubmitting}
            onInsert={handleInsert}
            onCancel={() => {
              resetForm();
              setMessage(null);
            }}
            message={message}
            relatedData={relatedDataForStatus}
            visibleColumns={columns.filter(col => {
              // Filtrar campos automáticos que no deben aparecer en formularios
              const excludedFields = ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified', 'reglaid'];
              return !excludedFields.includes(col.columnName);
            })}
            getColumnDisplayName={(columnName: string) => 
              getColumnDisplayNameTranslated(columnName, t)
            }
            getUniqueOptionsForField={getUniqueOptionsForField}
            themeColor="orange"
          />
        );
      
      case 'update':
        return (
          <ReglaUpdateForm
            reglasData={reglasData}
            relatedData={relatedData}
            getUniqueOptionsForField={getUniqueOptionsForField}
            onUpdate={handleReglaUpdate}
            onCancel={() => {
              onSubTabChange?.('status');
            }}
            setMessage={setMessage}
            themeColor="orange"
            onFormDataChange={(formData) => {
              setUpdateFormData(formData);
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Mensaje */}
      {message && (
        <MessageDisplay message={message} />
      )}

      {/* Contenido */}
      {renderContent()}
    </div>
  );
});

ReglasMain.displayName = 'ReglasMain';

export default ReglasMain;

