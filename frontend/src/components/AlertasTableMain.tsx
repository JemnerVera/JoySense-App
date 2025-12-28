/**
 * AlertasTableMain - Componente genérico para gestionar tablas relacionadas con alertas
 * Reutilizable para regla_objeto, regla_umbral, regla_perfil
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';

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
  tableName: 'regla_objeto' | 'regla_umbral' | 'regla_perfil';
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

  // Exponer métodos al padre mediante ref
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => hasUnsavedChanges(),
    handleTabChange: (tab: 'status' | 'insert' | 'update') => {
      onSubTabChange?.(tab);
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
    const dataToInsert: Record<string, any> = {
      ...formState.data,
      usercreatedid: user?.user_metadata?.usuarioid || 1,
      datecreated: new Date().toISOString()
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
    const relatedTable = crudRelatedData[columnName.replace('id', '')] || 
                        crudRelatedData[columnName] || [];
    
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
  }, [crudRelatedData]);

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
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, criticidadesData, umbralesData, reglasData, userData]);

  const relatedDataForStatus = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    criticidadesData: criticidadesData || [],
    umbralesData: umbralesData || [],
    reglasData: reglasData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, criticidadesData, umbralesData, reglasData, userData]);

  // Renderizar contenido según el subTab activo
  const renderContent = () => {
    switch (activeSubTab) {
      case 'status':
        return (
          <StatusTab
            tableName={selectedTable}
            tableData={tableData}
            columns={columns}
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
            visibleColumns={columns}
            getColumnDisplayName={(columnName: string) => 
              getColumnDisplayNameTranslated(columnName, t)
            }
            getUniqueOptionsForField={getUniqueOptionsForField}
            themeColor="red"
          />
        );
      
      case 'update':
        return (
          <UpdateTab
            tableName={selectedTable}
            tableData={tableData}
            columns={columns}
            relatedData={relatedData}
            config={config || null}
            updateRow={updateRow}
            getPrimaryKeyValue={getPrimaryKeyValue}
            user={user}
            loading={tableDataLoading}
            visibleColumns={columns}
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

