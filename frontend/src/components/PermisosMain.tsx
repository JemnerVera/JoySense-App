/**
 * PermisosMain - Componente principal para gestión de permisos geográficos
 * Solo visible para administradores (perfilid === 1)
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

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
import { TableName, PRIMARY_KEY_MAP } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

interface PermisosMainProps {
  activeSubTab?: 'status' | 'insert' | 'update';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
}

export interface PermisosMainRef {
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

const PermisosMain = forwardRef<PermisosMainRef, PermisosMainProps>(({
  activeSubTab: propActiveSubTab = 'status',
  onSubTabChange,
  onFormDataChange
}, ref) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal } = useModal();

  // Tabla fija para permisos
  const selectedTable = 'permiso';

  // Estado local - usar propActiveSubTab directamente, no estado local
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
  // Para 'insert' también necesitamos cargar las columnas (aunque no los datos)
  useEffect(() => {
    if (activeSubTab === 'status' || activeSubTab === 'update' || activeSubTab === 'insert') {
      console.log('[PermisosMain] Cargando datos/columnas para subTab:', activeSubTab);
      loadTableData(selectedTable);
    }
  }, [activeSubTab, loadTableData, selectedTable]);

  // Limpiar datos solo cuando cambia a 'insert' (pero mantener las columnas)
  useEffect(() => {
    if (activeSubTab === 'insert') {
      setTableData([]);
      // NO limpiar columnas - InsertTab las necesita para renderizar el formulario
      setLoading(false);
      setMessage(null);
      setSelectedRow(null);
      setUpdateFormData({});
      resetForm();
    }
  }, [activeSubTab, setTableData, setLoading, resetForm]);

  // Handler para cambio de subTab (ya no se usa, se maneja desde el sidebar)
  // Se mantiene por compatibilidad pero no se usa directamente

  const handleRowSelect = useCallback((row: any) => {
    setSelectedRow(row);
    setFormData(row);
    onSubTabChange?.('update');
  }, [setFormData, onSubTabChange]);

  const handleInsert = useCallback(async () => {
    // Validación de campos requeridos según la configuración de la tabla
    if (!formState.data.perfilid) {
      setMessage({ type: 'warning', text: 'Por favor seleccione un perfil' });
      return;
    }
    if (!formState.data.origenid) {
      setMessage({ type: 'warning', text: 'Por favor seleccione un origen' });
      return;
    }
    if (!formState.data.fuenteid) {
      setMessage({ type: 'warning', text: 'Por favor seleccione una fuente' });
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

    // Excluir permisoid (se genera automáticamente)
    delete dataToInsert.permisoid;

    const result = await insertRow(dataToInsert);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro insertado correctamente' });
      resetForm();
      onSubTabChange?.('status');
      loadTableData(selectedTable);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al insertar' });
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
      setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      resetForm();
      setSelectedRow(null);
      setUpdateFormData({});
      onSubTabChange?.('status');
      loadTableData(selectedTable);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar' });
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
      
      if (columnName === 'perfilid') {
        label = item.perfil || `Perfil ${value}`;
      } else if (columnName === 'origenid') {
        label = item.origen || `Origen ${value}`;
      } else if (columnName === 'fuenteid') {
        label = item.fuente || `Fuente ${value}`;
      } else if (columnName === 'paisid') {
        label = item.pais || `País ${value}`;
      } else if (columnName === 'empresaid') {
        label = item.empresa || `Empresa ${value}`;
      } else if (columnName === 'fundoid') {
        label = item.fundo || `Fundo ${value}`;
      } else if (columnName === 'ubicacionid') {
        label = item.ubicacion || `Ubicación ${value}`;
      } else {
        label = String(value);
      }
      
      return { value, label };
    });
  }, [crudRelatedData]);

  // Construir relatedData para StatusTab y UpdateTab
  const relatedData = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, userData]);

  // Datos relacionados para InsertTab
  const relatedDataForStatus = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    origenesData: origenesData || [],
    fuentesData: fuentesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, origenesData, fuentesData, userData]);

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
            themeColor="purple"
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
              
              // Excluir la clave primaria de la tabla (se genera automáticamente)
              const primaryKey = PRIMARY_KEY_MAP[selectedTable as TableName];
              if (primaryKey) {
                if (Array.isArray(primaryKey)) {
                  // Si es una clave compuesta, excluir todos los campos
                  primaryKey.forEach(pk => excludedFields.push(pk));
                } else {
                  // Si es una clave simple, excluir solo ese campo
                  excludedFields.push(primaryKey);
                }
              }
              
              return !excludedFields.includes(col.columnName);
            })}
            getColumnDisplayName={(columnName: string) => 
              getColumnDisplayNameTranslated(columnName, t)
            }
            getUniqueOptionsForField={getUniqueOptionsForField}
            themeColor="purple"
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
            visibleColumns={columns.filter(col => {
              // Filtrar campos automáticos que no deben aparecer en formularios
              const excludedFields = ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'];
              
              // Excluir la clave primaria de la tabla (se genera automáticamente)
              const primaryKey = PRIMARY_KEY_MAP[selectedTable as TableName];
              if (primaryKey) {
                if (Array.isArray(primaryKey)) {
                  // Si es una clave compuesta, excluir todos los campos
                  primaryKey.forEach(pk => excludedFields.push(pk));
                } else {
                  // Si es una clave simple, excluir solo ese campo
                  excludedFields.push(primaryKey);
                }
              }
              
              return !excludedFields.includes(col.columnName);
            })}
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
            themeColor="purple"
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

PermisosMain.displayName = 'PermisosMain';

export default PermisosMain;

