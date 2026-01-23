/**
 * PermisosMain - Componente principal para gestión de permisos geográficos
 * Solo visible para administradores (perfilid === 1)
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

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
import { LoadingSpinner } from '../SystemParameters/LoadingSpinner';
import { MessageDisplay } from '../SystemParameters/MessageDisplay';
import { StatusTab } from '../SystemParameters/StatusTab/StatusTab';
import { InsertTab } from '../SystemParameters/InsertTab/InsertTab';
import { UpdateTab } from '../SystemParameters/UpdateTab/UpdateTab';
import { AsignarPermisosTab } from '../Permisos/AsignarPermisosTab';
import { PermisosSkillTree } from '../Permisos/PermisosSkillTree';
import { getColumnDisplayNameTranslated } from '../../utils/systemParametersUtils';
import { TableName, PRIMARY_KEY_MAP } from '../../types';

// ============================================================================
// INTERFACES
// ============================================================================

interface PermisosMainProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update' | 'asignar';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'asignar') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
  themeColor?: 'purple';
  permisosTipo?: 'permisos-geo' | 'permisos-conf';
}

export interface PermisosMainRef {
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: 'status' | 'insert' | 'update' | 'asignar') => void;
  handleSubTabChangeFromProtectedButton?: (tab: 'status' | 'insert' | 'update' | 'asignar') => void;
  handleTableChange?: (table: string) => void;
}

interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PermisosMain = forwardRef<PermisosMainRef, PermisosMainProps>(({
  selectedTable: propSelectedTable,
  onTableSelect,
  activeSubTab: propActiveSubTab = 'status',
  onSubTabChange,
  onFormDataChange,
  themeColor = 'purple',
  permisosTipo
}, ref) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal } = useModal();
  const sidebar = useSidebar();

  // Estado local para la tabla seleccionada
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || 'permiso');
  
  // Sincronizar con prop
  useEffect(() => {
    if (propSelectedTable) {
      setSelectedTable(propSelectedTable);
    }
  }, [propSelectedTable]);
  
  // Determinar si la tabla actual es 'permiso' (para mostrar tab 'asignar')
  const isPermisoTable = selectedTable === 'permiso';

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
    nodosData,
    localizacionesData,
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
    // Para 'asignar', no verificar cambios sin guardar (permite cambiar libremente)
    if (activeSubTab === 'asignar') {
      return false;
    }
    
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
  // SOLO marcar dirty en CREAR, ASIGNAR o ACTUALIZAR (no en STATUS)
  useEffect(() => {
    // En STATUS no hay cambios sin guardar
    if (activeSubTab === 'status') {
      const panelId = `permisos-${selectedTable}-main`;
      sidebar.markDirty(panelId, false);
      return;
    }
    
    const isDirty = hasUnsavedChanges();
    const panelId = `permisos-${selectedTable}-main`;
    sidebar.markDirty(panelId, isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.isDirty, formState.data, activeSubTab, updateFormData, selectedTable]);

  // Handler para cambio de tab desde ProtectedSubTabButton (similar a SystemParameters)
  const handleSubTabChangeFromProtectedButton = useCallback((tab: 'status' | 'insert' | 'update' | 'asignar') => {
    // Limpiar formularios antes de cambiar
    if (activeSubTab === 'insert') {
      resetForm();
      setTableData([]);
    }
    if (activeSubTab === 'update') {
      setUpdateFormData({});
    }
    
    // Limpiar mensajes
    setMessage(null);
    setSelectedRow(null);
    
    // Llamar al callback del padre
    onSubTabChange?.(tab);
  }, [activeSubTab, resetForm, setTableData, onSubTabChange]);

  // Handler interno para cambios de subTab con protección
  const handleSubTabChangeInternal = useCallback((tab: 'status' | 'insert' | 'update' | 'asignar') => {
    // Verificar cambios sin guardar antes de cambiar
    const hasChanges = hasUnsavedChanges();
    if (hasChanges) {
      // Usar el modal para confirmar navegación
      const getSubTabName = (subTab: string) => {
        const names: { [key: string]: string } = {
          'status': 'Estado',
          'insert': 'Crear',
          'update': 'Actualizar',
          'asignar': 'Asignar'
        };
        return names[subTab] || subTab;
      };
      
      // Usar el sistema del sidebar para mostrar el modal
      const panelId = `permisos-${selectedTable}-main`;
      sidebar.requestSubTabChange?.(tab, () => {
        sidebar.markDirty(panelId, false);
        onSubTabChange?.(tab);
      });
    } else {
      onSubTabChange?.(tab);
    }
  }, [hasUnsavedChanges, sidebar, onSubTabChange, showModal, selectedTable]);

  // Exponer métodos al padre mediante ref
  // Handler para cambio de tabla
  const handleTableChange = useCallback((table: string) => {
    // Verificar cambios sin guardar antes de cambiar de tabla
    const hasChanges = hasUnsavedChanges();
    if (hasChanges) {
      // Usar el sistema del sidebar para mostrar el modal de cambio de tabla
      const currentPanelId = `permisos-${selectedTable}-main`;
      const executeTableChange = () => {
        sidebar.markDirty(currentPanelId, false);
        setSelectedTable(table);
        onTableSelect?.(table);
        onSubTabChange?.('status');
        resetForm();
        setTableData([]);
        setUpdateFormData({});
        setMessage(null);
        setSelectedRow(null);
      };
      
      sidebar.requestSubTabChange?.('status', executeTableChange);
    } else {
      setSelectedTable(table);
      onTableSelect?.(table);
      // Resetear a status cuando cambia la tabla
      onSubTabChange?.('status');
      resetForm();
      setTableData([]);
      setUpdateFormData({});
      setMessage(null);
      setSelectedRow(null);
    }
  }, [hasUnsavedChanges, sidebar, onTableSelect, onSubTabChange, resetForm, setTableData, showModal, selectedTable]);

  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => hasUnsavedChanges(),
    handleTabChange: (tab: 'status' | 'insert' | 'update' | 'asignar') => {
      handleSubTabChangeInternal(tab);
    },
    handleSubTabChangeFromProtectedButton,
    handleTableChange
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
    // Para 'asignar' no necesitamos cargar datos de la tabla, solo los relacionados
  }, [activeSubTab, loadTableData, selectedTable]);

  // Ref para rastrear si ya se preseleccionó el origen en CREAR
  const origenPreseleccionadoEnCrearRef = useRef<number | null>(null);

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
      origenPreseleccionadoEnCrearRef.current = null;
    }
  }, [activeSubTab, setTableData, setLoading, resetForm]);

  // Preseleccionar origen en CREAR según el tipo de permisos (después del reset)
  useEffect(() => {
    if (activeSubTab !== 'insert' || selectedTable !== 'permiso' || !permisosTipo || !origenesData.length) {
      return;
    }

    // Buscar el origen esperado (case insensitive, con o sin tilde)
    const origenEncontrado = origenesData.find(o => {
      const nombre = (o.origen || '').toUpperCase().trim();
      if (permisosTipo === 'permisos-geo') {
        return nombre === 'GEOGRAFÍA' || nombre === 'GEOGRAFIA';
      } else {
        return nombre === 'TABLA';
      }
    });

    if (origenEncontrado) {
      const origenId = origenEncontrado.origenid;
      
      // Solo preseleccionar si el origen actual no coincide con el esperado
      if (formState.data.origenid !== origenId && origenPreseleccionadoEnCrearRef.current !== origenId) {
        origenPreseleccionadoEnCrearRef.current = origenId;
        // Usar setFormData para preservar los otros campos del formulario y establecer el origen
        // Usar un delay para asegurar que el reset haya terminado
        const timeoutId = setTimeout(() => {
          setFormData({
            ...formState.data,
            origenid: origenId
          });
        }, 400);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [activeSubTab, selectedTable, permisosTipo, origenesData, formState.data, setFormData]);

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

    // Filtrar opciones de origen según el tipo de permisos
    let filteredTable = relatedTable;
    if (columnName === 'origenid' && permisosTipo && selectedTable === 'permiso') {
      filteredTable = relatedTable.filter((item: any) => {
        const nombre = (item.origen || '').toUpperCase().trim();
        if (permisosTipo === 'permisos-geo') {
          return nombre === 'GEOGRAFÍA' || nombre === 'GEOGRAFIA';
        } else if (permisosTipo === 'permisos-conf') {
          return nombre === 'TABLA';
        }
        return true;
      });
    }

    return filteredTable.map((item: any) => {
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
  }, [crudRelatedData, permisosTipo, selectedTable]);

  // Construir relatedData para StatusTab y UpdateTab
  const relatedData = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    perfilesData: perfilesData || [],
    origenesData: origenesData || [],
    fuentesData: fuentesData || [],
    userData: userData || []
  }), [paisesData, empresasData, fundosData, ubicacionesData, perfilesData, origenesData, fuentesData, userData]);

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
        // Si la tabla es 'permiso', usar la vista de skill tree
        if (isPermisoTable) {
          return (
            <PermisosSkillTree themeColor="purple" />
          );
        }
        // Para otras tablas, usar StatusTab normal
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
            themeColor="orange"
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
            themeColor="orange"
          />
        );
      
      case 'asignar':
        // Solo mostrar 'asignar' si la tabla es 'permiso'
        if (!isPermisoTable) {
          return null;
        }
        return (
          <AsignarPermisosTab
            perfilesData={perfilesData}
            origenesData={origenesData}
            fuentesData={fuentesData}
            paisesData={paisesData}
            empresasData={empresasData}
            fundosData={fundosData}
            ubicacionesData={ubicacionesData}
            nodosData={nodosData}
            localizacionesData={localizacionesData}
            permisosTipo={permisosTipo}
            onSuccess={() => {
              loadTableData(selectedTable);
              setMessage({ type: 'success', text: 'Permisos asignados correctamente' });
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6 overflow-visible" style={{ minHeight: 'calc(100vh - 200px)' }}>
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

