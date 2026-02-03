/**
 * ReglasMain - Componente principal para gestión de reglas de alertas
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';

// Contexts
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../contexts/ModalContext';
import { useSidebar } from '../../contexts/SidebarContext';

// Hooks
import { useTableCRUD } from '../../hooks/useTableCRUD';
import { useTableDataManagement } from '../../hooks/useTableDataManagement';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

// Components
import { MessageDisplay } from '../system-parameters/MessageDisplay';

// Local hooks and components
import { useReglasData } from './hooks/useReglasData';
import { useReglasOperations } from './hooks/useReglasOperations';
import { useReglasValidation } from './hooks/useReglasValidation';
import { ReglasStatusTab } from './components/ReglasStatusTab';
import { ReglasInsertTab } from './components/ReglasInsertTab';
import { ReglasUpdateTab } from './components/ReglasUpdateTab';

// Types
import { ReglasMainProps, ReglasMainRef, Message, RelatedData } from './types';

// Utils
import { getSubTabName, isFieldVisibleInForm } from './utils';

const ReglasMain = forwardRef<ReglasMainRef, ReglasMainProps>(({
  activeSubTab: propActiveSubTab = 'insert',
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

  // Hook para datos de reglas
  const { reglasData, reloadReglas, umbralesData, reloadUmbrales } = useReglasData(activeSubTab);

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

  // Hook para operaciones CRUD
  const { handleInsert, handleUpdate, handleReglaUpdate } = useReglasOperations({
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
  });

  // Hook para validaciones
  const { getUniqueOptionsForField } = useReglasValidation({
    crudRelatedData,
    criticidadesData,
    umbralesData: umbralesData || []
  });

  // Monitorear cambios sin guardar y notificar al sidebar
  // Marcar dirty en CREAR o ACTUALIZAR
  useEffect(() => {
    const isDirty = hasUnsavedChanges();
    sidebar.markDirty('reglas-main', isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.isDirty, formState.data, activeSubTab, updateFormData]);

  // Handler interno para cambios de subTab con protección
  const handleSubTabChangeInternal = useCallback((tab: 'status' | 'insert' | 'update') => {
    // Verificar cambios sin guardar antes de cambiar
    const hasChanges = hasUnsavedChanges();
    if (hasChanges) {
      // Usar el sistema del sidebar para mostrar el modal
      sidebar.requestSubTabChange?.(tab, () => {
        sidebar.markDirty('reglas-main', false);
        onSubTabChange?.(tab);
      });
    } else {
      onSubTabChange?.(tab);
    }
  }, [hasUnsavedChanges, sidebar, onSubTabChange]);

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

  // Construir relatedData para StatusTab y UpdateTab
  const relatedData: RelatedData = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    criticidadesData: criticidadesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, criticidadesData, userData]);

  // Datos relacionados para InsertTab
  const relatedDataForStatus: RelatedData = useMemo(() => ({
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
        return <ReglasStatusTab reglasData={reglasData} />;

      case 'insert':
        return (
          <ReglasInsertTab
            selectedTable={selectedTable}
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
            columns={columns}
            getUniqueOptionsForField={getUniqueOptionsForField}
          />
        );

      case 'update':
        return (
          <ReglasUpdateTab
            reglasData={reglasData}
            relatedData={relatedData}
            getUniqueOptionsForField={getUniqueOptionsForField}
            onUpdate={handleReglaUpdate}
            onCancel={() => {
              onSubTabChange?.('insert');
            }}
            setMessage={setMessage}
            onFormDataChange={(formData) => {
              setUpdateFormData(formData);
            }}
            perfilesData={perfilesData}
            umbralesData={umbralesData}
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