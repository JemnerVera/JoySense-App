/**
 * AlertasTableMain - Componente genérico para gestionar tablas relacionadas con alertas
 * Reutilizable para regla_objeto, regla_umbral, regla_perfil, alerta_regla
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
import { UpdateTab } from './SystemParameters/UpdateTab/UpdateTab';
import { getColumnDisplayNameTranslated } from '../utils/systemParametersUtils';

// ============================================================================
// INTERFACES
// ============================================================================

interface AlertasTableMainProps {
  tableName: 'regla_objeto' | 'regla_umbral' | 'regla_perfil' | 'alerta_regla';
  activeSubTab?: 'status' | 'insert' | 'update';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
}

export interface AlertasTableMainRef {
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

const AlertasTableMain = forwardRef<AlertasTableMainRef, AlertasTableMainProps>(({
  tableName,
  activeSubTab: propActiveSubTab = 'status',
  onSubTabChange,
  onFormDataChange
}, ref) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal } = useModal();
  const sidebar = useSidebar();

  const selectedTable = tableName;
  const activeSubTab = propActiveSubTab;
  const [message, setMessage] = useState<Message | null>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState<Record<string, any>>({});

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
    umbralesData,
    reglasData,
    origenesData,
    fuentesData,
    loadTableData,
    setTableData,
    setColumns,
    setLoading,
    loadRelatedTablesData
  } = useTableDataManagement();

  // Hook para detectar cambios sin guardar
  const { hasUnsavedChanges: checkUnsavedChanges } = useUnsavedChanges();
  
  const hasUnsavedChanges = useCallback(() => {
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
      const panelId = `${tableName}-main`;
      sidebar.requestSubTabChange?.(tab, () => {
        sidebar.markDirty(panelId, false);
        onSubTabChange?.(tab);
      });
    } else {
      onSubTabChange?.(tab);
    }
  }, [hasUnsavedChanges, sidebar, onSubTabChange, showModal, tableName]);

  // Monitorear cambios sin guardar y notificar al sidebar
  // SOLO marcar dirty en CREAR o ACTUALIZAR (no en STATUS)
  useEffect(() => {
    // En STATUS no hay cambios sin guardar
    if (activeSubTab === 'status') {
      sidebar.markDirty(`${tableName}-main`, false);
      return;
    }
    
    const isDirty = hasUnsavedChanges();
    sidebar.markDirty(`${tableName}-main`, isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.isDirty, formState.data, activeSubTab, updateFormData, tableName]);

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

  // Cargar datos de la tabla cuando cambia el subTab
  useEffect(() => {
    if (activeSubTab === 'status' || activeSubTab === 'update' || activeSubTab === 'insert') {
      console.log(`[AlertasTableMain-${tableName}] Cargando datos/columnas para subTab:`, activeSubTab);
      loadTableData(selectedTable);
    }
  }, [activeSubTab, loadTableData, selectedTable, tableName]);

  // Limpiar datos solo cuando cambia a 'insert' (pero mantener las columnas)
  useEffect(() => {
    if (activeSubTab === 'insert') {
      setTableData([]);
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
    // Validación básica
    if (!validateForm()) {
      const validationErrors = Object.values(formState.errors).filter(Boolean);
      const errorMessage = validationErrors.length > 0 
        ? validationErrors.join('\n')
        : 'Por favor complete todos los campos requeridos';
      
      setMessage({ type: 'warning', text: errorMessage });
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

    // Excluir el ID principal (se genera automáticamente)
    const primaryKey = config?.primaryKey;
    if (primaryKey && typeof primaryKey === 'string') {
      delete dataToInsert[primaryKey];
    }

    const result = await insertRow(dataToInsert);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro creado correctamente' });
      resetForm();
      onSubTabChange?.('status');
      loadTableData(selectedTable);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al crear el registro' });
    }
  }, [formState.data, formState.errors, validateForm, insertRow, resetForm, user, loadTableData, onSubTabChange, selectedTable, config]);

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
      setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      resetForm();
      setSelectedRow(null);
      setUpdateFormData({});
      onSubTabChange?.('status');
      loadTableData(selectedTable);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar el registro' });
    }
  }, [formState.data, formState.errors, validateForm, selectedRow, updateRow, user, getPrimaryKeyValue, loadTableData, onSubTabChange, resetForm, selectedTable]);


  // Función helper para obtener opciones únicas
  const getUniqueOptionsForField = useCallback((columnName: string): Array<{value: any, label: string}> => {
    let relatedTable = crudRelatedData[columnName.replace('id', '')] || 
                       crudRelatedData[columnName] || [];
    
    // Si no se encuentra en crudRelatedData, buscar en datos relacionados específicos
    if ((!Array.isArray(relatedTable) || relatedTable.length === 0)) {
      if (columnName === 'reglaid') {
        relatedTable = reglasData || [];
      } else if (columnName === 'origenid') {
        relatedTable = origenesData || [];
      } else if (columnName === 'fuenteid') {
        relatedTable = fuentesData || [];
      } else if (columnName === 'perfilid') {
        relatedTable = perfilesData || [];
      }
    }
    
    if (!Array.isArray(relatedTable) || relatedTable.length === 0) {
      return [];
    }

    return relatedTable.map((item: any) => {
      const value = item[columnName] || item[`${columnName.replace('id', '')}id`];
      let label = '';
      
      if (columnName === 'reglaid') {
        label = item.nombre || `Regla ${value}`;
      } else if (columnName === 'perfilid') {
        label = item.perfil || `Perfil ${value}`;
      } else if (columnName === 'umbralid') {
        label = item.umbral || `Umbral ${value}`;
      } else if (columnName === 'origenid') {
        label = item.origen || `Origen ${value}`;
      } else if (columnName === 'fuenteid') {
        label = item.fuente || `Fuente ${value}`;
      } else {
        label = String(value);
      }
      
      return { value, label };
    });
  }, [crudRelatedData, reglasData, origenesData, fuentesData, perfilesData]);

  // Construir relatedData
  const relatedData = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    criticidadesData: criticidadesData || [],
    umbralesData: umbralesData || [],
    reglasData: reglasData || [],
    origenesData: origenesData || [],
    fuentesData: fuentesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, criticidadesData, umbralesData, reglasData, origenesData, fuentesData, userData]);

  const relatedDataForStatus = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    criticidadesData: criticidadesData || [],
    umbralesData: umbralesData || [],
    reglasData: reglasData || [],
    origenesData: origenesData || [],
    fuentesData: fuentesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, criticidadesData, umbralesData, reglasData, origenesData, fuentesData, userData]);

  // Renderizar contenido según el subTab activo
  const renderContent = () => {
    switch (activeSubTab) {
      case 'status':
        return (
          <StatusTab
            tableName={selectedTable}
            tableData={tableData}
            columns={columns.filter(col => {
              // Filtrar primary keys de las tablas de reglas
              if (selectedTable === 'regla_objeto' && col.columnName === 'regla_objetoid') return false;
              if (selectedTable === 'regla_umbral' && col.columnName === 'regla_umbralid') return false;
              if (selectedTable === 'regla_perfil' && col.columnName === 'regla_perfilid') return false;
              return true;
            })}
            relatedData={relatedData}
            userData={userData}
            loading={tableDataLoading}
            onRowClick={handleRowSelect}
            themeColor="red"
          />
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
              const excludedFields = ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'];
              // Filtrar primary key auto-generado según la tabla
              if (selectedTable === 'regla_objeto') {
                excludedFields.push('regla_objetoid');
              } else if (selectedTable === 'regla_umbral') {
                excludedFields.push('regla_umbralid');
              } else if (selectedTable === 'regla_perfil') {
                excludedFields.push('regla_perfilid');
              } else if (selectedTable === 'alerta_regla') {
                excludedFields.push('uuid_alerta_reglaid');
              }
              return !excludedFields.includes(col.columnName);
            })}
            getColumnDisplayName={(columnName: string) => 
              getColumnDisplayNameTranslated(columnName, t)
            }
            getUniqueOptionsForField={getUniqueOptionsForField}
            themeColor="red"
            // Props adicionales para regla_perfil
            reglasData={reglasData}
          />
        );
      
      case 'update':
        const filteredColumnsForUpdate = columns.filter(col => {
          // Filtrar primary keys de las tablas de reglas
          if (selectedTable === 'regla_objeto' && col.columnName === 'regla_objetoid') return false;
          if (selectedTable === 'regla_umbral' && col.columnName === 'regla_umbralid') return false;
          if (selectedTable === 'regla_perfil' && col.columnName === 'regla_perfilid') return false;
          return true;
        });
        return (
          <UpdateTab
            tableName={selectedTable}
            tableData={tableData}
            columns={filteredColumnsForUpdate}
            relatedData={relatedData}
            config={config || null}
            updateRow={updateRow}
            getPrimaryKeyValue={getPrimaryKeyValue}
            user={user}
            loading={tableDataLoading}
            visibleColumns={filteredColumnsForUpdate}
            getColumnDisplayName={(columnName: string) => 
              getColumnDisplayNameTranslated(columnName, t)
            }
            getUniqueOptionsForField={getUniqueOptionsForField}
            existingData={tableData}
            onUpdateSuccess={() => {
              loadTableData(selectedTable);
              onSubTabChange?.('status');
            }}
            setMessage={setMessage}
            onFormDataChange={(formData: Record<string, any>) => {
              setUpdateFormData(formData);
            }}
            themeColor="red"
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

AlertasTableMain.displayName = 'AlertasTableMain';

export default AlertasTableMain;

