/**
 * SystemParameters - Componente principal para administración de parámetros del sistema
 * Versión simplificada usando configuración centralizada
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { useFilters } from '../contexts/FilterContext';

// Config & Types
import { TABLES_CONFIG, getTableConfig, getTablesByCategory, TABLE_CATEGORIES, TableConfig } from '../config/tables.config';
import { TableName, PRIMARY_KEY_MAP } from '../types';
import type { ColumnInfo } from '../types/systemParameters';

// Hooks
import { useTableCRUD } from '../hooks/useTableCRUD';
import { useTableDataManagement } from '../hooks/useTableDataManagement';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useInsertForm } from '../hooks/useInsertForm';

// Components
import { LoadingSpinner } from './SystemParameters/LoadingSpinner';
import { MessageDisplay } from './SystemParameters/MessageDisplay';
import { PaginationControls } from './SystemParameters/PaginationControls';
import { SearchBarWithCounter } from './SystemParameters/SearchBarWithCounter';
import { StatusTab } from './SystemParameters/StatusTab/StatusTab';
import { InsertTab } from './SystemParameters/InsertTab/InsertTab';
import { UpdateTab } from './SystemParameters/UpdateTab/UpdateTab';
import { TableSelector } from './SystemParameters/components/TableSelector';
import { MassiveOperationsRenderer } from './SystemParameters/components/MassiveOperationsRenderer';
import { getColumnDisplayNameTranslated } from '../utils/systemParametersUtils';
import { logger } from '../utils/logger';

// Hooks
import { useSystemParametersUtils } from './SystemParameters/hooks/useSystemParametersUtils';
import { useSystemParametersCRUD } from './SystemParameters/hooks/useSystemParametersCRUD';
import { useMassiveOperations } from './SystemParameters/hooks/useMassiveOperations';
import { useSystemParametersSync } from './SystemParameters/hooks/useSystemParametersSync';
import { getUniqueOptionsForField } from './SystemParameters/utils/getUniqueOptionsForField';

// ============================================================================
// INTERFACES
// ============================================================================

interface SystemParametersProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
  onMassiveFormDataChange?: (massiveFormData: Record<string, any>) => void;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple';
}

export interface SystemParametersRef {
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  handleTableChange: (table: string) => void;
}

interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SystemParameters = forwardRef<SystemParametersRef, SystemParametersProps>(({
  selectedTable: propSelectedTable,
  onTableSelect,
  activeSubTab: propActiveSubTab = 'status',
  onSubTabChange: propOnSubTabChange, // Renombrar para evitar conflicto
  onFormDataChange,
  onMassiveFormDataChange,
  themeColor = 'orange'
}, ref) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal } = useModal();
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();

  // Estado local
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
  const [activeSubTab, setActiveSubTabState] = useState<'status' | 'insert' | 'update' | 'massive'>(propActiveSubTab);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState<Record<string, any>>({});
  const [insertedRecords, setInsertedRecords] = useState<Array<{ id: string; fields: Record<string, any> }>>([]);
  const insertTabMountCounterRef = useRef<number>(0); // Contador para forzar re-mount de InsertTab
  const prevActiveSubTabRef = useRef<'status' | 'insert' | 'update' | 'massive'>(activeSubTab);
  
  // Calcular key para InsertTab basado en si estamos entrando a insert desde otra pestaña
  const insertTabKey = useMemo(() => {
    if (activeSubTab === 'insert' && prevActiveSubTabRef.current !== 'insert') {
      // Estamos entrando a insert desde otra pestaña - incrementar contador
      insertTabMountCounterRef.current += 1;
    }
    prevActiveSubTabRef.current = activeSubTab;
    return insertTabMountCounterRef.current;
  }, [activeSubTab]);
  
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
    getResetKey,
    validateForm,
    setPage,
    getDisplayValue,
    getPrimaryKeyValue
  } = useTableCRUD({ tableName: selectedTable as TableName });

  // Hook para detectar cambios sin guardar
  const { hasUnsavedChanges } = useUnsavedChanges();

  // Wrapper para setMessage con logs (para depuración)
  const handleInsertFormMessage = useCallback((msg: Message | null) => {
    setMessage(msg)
  }, [])

  // Hook para datos relacionados (necesario para StatusTab)
  const {
    tableData, // Datos de la tabla actual (de useTableDataManagement)
    columns,
    loading: tableDataLoading, // Loading de useTableDataManagement
    userData,
    paisesData,
    empresasData,
    fundosData,
    ubicacionesData,
    localizacionesData,
    entidadesData,
    nodosData,
    tiposData,
    metricasData,
    criticidadesData,
    perfilesData,
    umbralesData,
    sensorsData,
    codigotelefonosData,
    canalesData,
    contactosData,
    correosData,
    loadRelatedTablesData,
    loadTableData,
    setTableData, // Para limpiar datos inmediatamente
    setColumns, // Para limpiar columnas inmediatamente
    setLoading // Para establecer loading inmediatamente
  } = useTableDataManagement();

  // Cargar datos relacionados al montar el componente
  useEffect(() => {
    console.log('🔄 [SystemParameters] Cargando datos relacionados al montar...');
    loadRelatedTablesData();
  }, [loadRelatedTablesData]);

  // Recargar datos relacionados cuando se selecciona una tabla que los necesita
  // Esto asegura que los datos estén disponibles incluso si el componente ya estaba montado
  useEffect(() => {
    if (selectedTable && ['sensor', 'tipo', 'metrica', 'nodo'].includes(selectedTable)) {
      // Verificar si tiposData está vacío y recargar si es necesario
      if (selectedTable === 'sensor' && (!tiposData || tiposData.length === 0)) {
        loadRelatedTablesData().catch(err => {
          console.error('❌ [SystemParameters] Error al recargar datos relacionados:', err);
        });
      }
    }
  }, [selectedTable, tiposData, loadRelatedTablesData]);

  // También recargar cuando se cambia a la pestaña 'insert' si tiposData está vacío
  useEffect(() => {
    if (activeSubTab === 'insert' && selectedTable === 'sensor' && (!tiposData || tiposData.length === 0)) {
      loadRelatedTablesData().catch(err => {
        console.error('❌ [SystemParameters] Error al recargar datos relacionados en insert:', err);
      });
    }
  }, [activeSubTab, selectedTable, tiposData, loadRelatedTablesData]);

  // Hook para formulario de inserción (estado completamente aislado de UPDATE)
  // IMPORTANTE: Debe ir después de useTableDataManagement para tener acceso a codigotelefonosData
  const insertForm = useInsertForm({
    tableName: selectedTable || '',
    insertRow,
    user,
    existingData: tableState.data || [],
    onSuccess: () => {
      loadData()
      if (selectedTable) {
        loadTableData(selectedTable)
      }
      // Recargar datos relacionados si se insertó en una tabla que afecta a otras
      if (selectedTable && ['perfil', 'usuario', 'pais', 'empresa', 'fundo', 'ubicacion', 'tipo', 'entidad', 'metrica'].includes(selectedTable)) {
        loadRelatedTablesData()
      }
    },
    onCancel: () => {
      setMessage(null)
    },
    setMessage: handleInsertFormMessage, // Pasar setMessage para mostrar mensajes de validación (con wrapper para logs)
    codigotelefonosData: codigotelefonosData || [],
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    resetKey: `${selectedTable}-${insertTabKey}-${getResetKey()}`
  })

  // Filtrar columnas duplicadas (basándose en columnName)
  // También filtrar campos ocultos y de solo lectura que no deberían aparecer en formularios
  const uniqueColumns = useMemo(() => {
    console.log('[SystemParameters] Calculando uniqueColumns', {
      selectedTable,
      columnsCount: columns.length,
      columnsNames: columns.map(c => c.columnName),
      hasColumns: !!columns && columns.length > 0,
      timestamp: Date.now()
    });
    
    if (!columns || columns.length === 0) {
      console.log('[SystemParameters] uniqueColumns retornando vacío - no hay columnas', {
        selectedTable,
        timestamp: Date.now()
      });
      return [];
    }
    
    // Debug: mostrar columnas originales para la tabla perfil
    if (selectedTable === 'perfil') {
    }
    
    const seen = new Set<string>();
    const config = selectedTable ? getTableConfig(selectedTable as TableName) : null;
    const filtered: ColumnInfo[] = [];
    
    for (const col of columns) {
      // Eliminar duplicados
      if (seen.has(col.columnName)) {
        logger.warn(`Columna duplicada detectada y eliminada: ${col.columnName} en tabla ${selectedTable}`);
        continue;
      }
      seen.add(col.columnName);
      
      // Si hay configuración, verificar si el campo está definido y no está oculto
      if (config && config.fields) {
        const fieldConfig = config.fields.find(f => f.name === col.columnName);
        if (fieldConfig && fieldConfig.hidden) {
          continue; // Ocultar campos marcados como hidden
        }
      }
      
      // También excluir la clave primaria de la tabla SOLO si es auto-incremental
      // (es decir, si NO es una foreign key requerida Y está marcada como hidden)
      const primaryKey = PRIMARY_KEY_MAP[selectedTable as TableName];
      if (primaryKey) {
        const primaryKeyFields = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
        if (primaryKeyFields.includes(col.columnName)) {
          // Verificar si el campo de clave primaria es una foreign key
          const fieldConfig = config?.fields.find(f => f.name === col.columnName);
          // Si NO es foreign key Y está marcado como hidden, entonces es auto-incremental y debe excluirse
          // Si ES foreign key O NO está hidden, NO debe excluirse porque el usuario debe ingresarlo/seleccionarlo
          if (!fieldConfig?.foreignKey && fieldConfig?.hidden) {
            continue;
          }
        }
      }
      
      filtered.push(col);
    }
    
    // Debug: mostrar columnas únicas para la tabla perfil
    if (selectedTable === 'perfil') {
    }
    
    console.log('[SystemParameters] uniqueColumns calculado', {
      selectedTable,
      filteredCount: filtered.length,
      filteredNames: filtered.map(c => c.columnName),
      timestamp: Date.now()
    });
    
    return filtered;
  }, [columns, selectedTable]);

  // Adaptar relatedData para StatusTab
  const relatedDataForStatus = useMemo(() => ({
    paisesData: paisesData || [],
    empresasData: empresasData || [],
    fundosData: fundosData || [],
    ubicacionesData: ubicacionesData || [],
    localizacionesData: localizacionesData || [],
    entidadesData: entidadesData || [],
    nodosData: nodosData || [],
    tiposData: tiposData || [],
    metricasData: metricasData || [],
    criticidadesData: criticidadesData || [],
    perfilesData: perfilesData || [],
    umbralesData: umbralesData || [],
    userData: userData || [],
    sensorsData: sensorsData || [],
    codigotelefonosData: codigotelefonosData || [],
    canalesData: canalesData || [],
    contactosData: contactosData || [],
    correosData: correosData || []
  }), [
    paisesData,
    empresasData,
    fundosData,
    ubicacionesData,
    localizacionesData,
    entidadesData,
    nodosData,
    tiposData,
    metricasData,
    criticidadesData,
    perfilesData,
    umbralesData,
    userData,
    sensorsData,
    codigotelefonosData,
    canalesData,
    contactosData,
    correosData
  ]);

  // Ref para poder usar handleSubTabChangeInternal en useSystemParametersSync (debe declararse antes)
  const handleSubTabChangeInternalRef = useRef<((tab: 'status' | 'insert' | 'update' | 'massive') => void) | null>(null);
  
  // Guard para prevenir múltiples llamadas simultáneas a handleSubTabChangeInternal
  const isProcessingTabChangeRef = useRef<boolean>(false);

  // Ref para comunicar con useSystemParametersSync
  const skipNextSyncRef = useRef<boolean>(false);
  
  // Ref para rastrear si el cambio viene de ProtectedSubTabButton (ya validado)
  const changeFromProtectedButtonRef = useRef<boolean>(false);
  
  // Hook de sincronización (se define antes de handleSubTabChangeInternal para evitar dependencia circular)
  useSystemParametersSync({
    propSelectedTable,
    propActiveSubTab,
    selectedTable,
    activeSubTab,
    formState,
    setSelectedTable,
    setActiveSubTab: (tab) => {
      // Interceptar para pasar por validación - se usará el ref cuando esté disponible
      handleSubTabChangeInternalRef.current?.(tab);
    },
    resetForm,
    setUpdateFormData,
    setTableData,
    setColumns,
    setLoading,
    setMessage,
    setSelectedRow,
    onFormDataChange,
    loadRelatedTablesData,
    loadTableData,
    loadData,
    loadRelatedData,
    setInsertedRecords,
    skipNextSyncRef,
    isProcessingTabChangeRef
  });

  // Wrapper para propOnSubTabChange que marca cuando viene de ProtectedSubTabButton
  // Este wrapper se pasa a ProtectedSubTabButton para que pueda marcar el cambio como ya validado
  // IMPORTANTE: Este wrapper debe limpiar el formulario ANTES de llamar a propOnSubTabChange
  // para evitar que SystemParameters valide de nuevo
  const handleSubTabChangeFromProtectedButton = useCallback((tab: 'status' | 'insert' | 'update' | 'massive') => {
    // IMPORTANTE: Limpiar el formulario ANTES de marcar el ref y llamar al callback
    // Esto evita que SystemParameters detecte cambios sin guardar cuando valida de nuevo
    if (activeSubTab === 'insert') {
      insertForm?.resetForm();
      setInsertedRecords([]);
    }
    if (activeSubTab === 'update') {
      setUpdateFormData({});
    }
    
    // Marcar que el cambio viene de ProtectedSubTabButton (ya validado)
    changeFromProtectedButtonRef.current = true;
    
    // Marcar para saltar la próxima sincronización
    skipNextSyncRef.current = true;
    isProcessingTabChangeRef.current = true;
    
    // IMPORTANTE: Actualizar el estado interno PRIMERO para que la UI se actualice inmediatamente
    // Esto debe hacerse ANTES de llamar al callback del padre
    setActiveSubTabState(tab);
    setMessage(null);
    
    // Limpiar formulario cuando se cambia a 'insert' o se sale de 'insert'
    if (tab === 'insert') {
      insertForm?.resetForm();
      setInsertedRecords([]);
    } else if (activeSubTab === 'insert') {
      insertForm?.resetForm();
      setInsertedRecords([]);
    }
    if (tab !== 'update') setUpdateFormData({});
    
    // Llamar al callback original del padre (esto actualizará propActiveSubTab en App.tsx)
    // IMPORTANTE: Esto se hace DESPUÉS de actualizar el estado interno para evitar conflictos
    propOnSubTabChange?.(tab);
    
    // Resetear después de un delay suficiente para que el estado se propague
    setTimeout(() => {
      changeFromProtectedButtonRef.current = false;
      isProcessingTabChangeRef.current = false;
      skipNextSyncRef.current = false;
    }, 500);
  }, [propOnSubTabChange, activeSubTab, insertForm, setInsertedRecords]);
  
  // Exponer métodos al padre
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => formState.isDirty,
    handleTabChange: (tab) => {
      handleSubTabChangeInternal(tab);
    },
    handleTableChange: (table) => {
      setSelectedTable(table);
      onTableSelect?.(table);
    },
    // Exponer el wrapper para que ProtectedSubTabButton pueda usarlo
    handleSubTabChangeFromProtectedButton
  }));
  
  // Exponer handleSubTabChangeFromProtectedButton a través de onFormDataChange
  // para que pueda ser accedido desde PermisosOperationsSidebar
  // Esto se hace pasando la función en el contexto o a través de un ref global
  // Por ahora, usaremos una solución más simple: modificar el callback que se pasa
  // a PermisosOperationsSidebar para que use handleSubTabChangeFromProtectedButton

  // Filtrar datos por búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableState.data;
    
    const term = searchTerm.toLowerCase();
    return tableState.data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(term)
      )
    );
  }, [tableState.data, searchTerm]);

  // Hook de utilidades
  const {
    getUniqueOptionsForFieldMassive,
    getPaisName,
    getEmpresaName,
    getFundoName
  } = useSystemParametersUtils({
    relatedDataForStatus
  });

  // Hook CRUD
  const {
    handleInsert,
    handleUpdate,
    handleDelete
  } = useSystemParametersCRUD({
    selectedTable,
    selectedRow,
    formState,
    config: config || null,
    user,
    validateForm,
    insertRow,
    updateRow,
    deleteRow,
    resetForm,
    getPrimaryKeyValue,
    loadData,
    loadTableData,
    loadRelatedTablesData,
    setMessage,
    setSelectedRow,
    setActiveSubTab: (tab) => {
      // Cuando se actualiza exitosamente un registro, no necesitamos validar cambios
      // porque ya se guardó correctamente - actualizar directamente
      setActiveSubTabState(tab);
      propOnSubTabChange?.(tab);
    },
    onSubTabChange: propOnSubTabChange, // Usar propOnSubTabChange
    setInsertedRecords,
    existingData: tableState.data || []
  });

  // Hook de operaciones masivas
  const {
    handleMassiveUmbralApply
  } = useMassiveOperations({
    insertRow,
    loadData,
    loadTableData,
    selectedTable,
    setMessage
  });

  // Helper para getUniqueOptionsForField (para InsertTab y UpdateTab)
  const getUniqueOptionsForFieldHelper = useCallback((columnName: string) => {
    return getUniqueOptionsForField({
      columnName,
      selectedTable,
      relatedDataForStatus
    });
  }, [selectedTable, relatedDataForStatus]);

  // Handlers de navegación
  const handleTableSelect = useCallback((table: string) => {
    // Verificar si hay cambios sin guardar antes de cambiar de tabla
    if (selectedTable) {
      if (activeSubTab === 'insert') {
        // Verificar con hasUnsavedChanges para detectar cambios reales
        const hasChanges = hasUnsavedChanges({
          formData: insertForm?.formData || {},
          selectedTable,
          activeSubTab
        });
        
        // Si hay cambios, mostrar confirmación
        if (hasChanges) {
          if (!window.confirm('¿Está seguro? Los datos ingresados se perderán.')) {
            return; // Cancelar cambio de tabla
          }
        }
      } else if (activeSubTab === 'update') {
        // Para update: verificar si hay cambios o si el formulario está abierto
        // updateFormData puede tener datos reales o un objeto especial { __formOpen: true, __hasChanges: false }
        if (updateFormData && Object.keys(updateFormData).length > 0) {
          // Verificar si realmente hay cambios (no es solo el marcador de formulario abierto)
          const hasRealChanges = !updateFormData.__formOpen || updateFormData.__hasChanges !== false;
          
          if (hasRealChanges) {
            // Obtener nombre de la tabla actual y destino
            const getTableName = (table: string) => {
              const config = getTableConfig(table as TableName);
              return config?.displayName || table;
            };
            
            showModal(
              'parameter',
              getTableName(selectedTable),
              getTableName(table),
              () => {
                // Confirmar: proceder con el cambio
                setSelectedTable(table);
                onTableSelect?.(table);
                setActiveSubTabState('status');
                propOnSubTabChange?.('status');
                setMessage(null);
                resetForm();
                setUpdateFormData({});
              },
              () => {
                // Cancelar: no hacer nada
              }
            );
            return; // Cancelar cambio de tabla (el modal manejará la confirmación)
          }
        }
      }
    }
    
    setSelectedTable(table);
    onTableSelect?.(table);
    setActiveSubTabState('status');
    propOnSubTabChange?.('status');
    setMessage(null);
    resetForm();
    setUpdateFormData({}); // Limpiar datos de actualización
  }, [selectedTable, formState.data, activeSubTab, hasUnsavedChanges, onTableSelect, propOnSubTabChange, resetForm, updateFormData]);

  // handleSubTabChange interno que verifica cambios sin guardar
  const handleSubTabChangeInternal = useCallback((tab: 'status' | 'insert' | 'update' | 'massive') => {
    // Si ya estamos en el tab objetivo, no hacer nada
    if (tab === activeSubTab) {
      return;
    }
    
    // Si ya hay un cambio de tab en proceso, ignorar esta llamada
    if (isProcessingTabChangeRef.current) {
      return;
    }
    
    // Si el cambio viene de ProtectedSubTabButton (ya validado), proceder sin validar de nuevo
    if (changeFromProtectedButtonRef.current) {
      changeFromProtectedButtonRef.current = false;
      // Marcar para saltar la próxima sincronización y evitar que useSystemParametersSync procese el cambio
      skipNextSyncRef.current = true;
      // Mantener isProcessingTabChangeRef en true para evitar que useSystemParametersSync procese
      isProcessingTabChangeRef.current = true;
      setActiveSubTabState(tab);
      propOnSubTabChange?.(tab);
      setMessage(null);
      // Limpiar formulario cuando se cambia a 'insert' o se sale de 'insert'
      if (tab === 'insert') {
        insertForm?.resetForm();
        setInsertedRecords([]);
      } else if (activeSubTab === 'insert') {
        insertForm?.resetForm();
        setInsertedRecords([]);
      }
      if (tab !== 'update') setUpdateFormData({});
      // Resetear después de un delay suficiente
      setTimeout(() => {
        isProcessingTabChangeRef.current = false;
        skipNextSyncRef.current = false;
      }, 300);
      return;
    }
    
    // Verificar si hay cambios sin guardar antes de cambiar de pestaña
    if (activeSubTab === 'insert') {
      // Verificar con hasUnsavedChanges para detectar cambios reales
      const hasChanges = hasUnsavedChanges({
        formData: insertForm?.formData || {},
        selectedTable,
        activeSubTab
      });
      
      // Si hay cambios, mostrar modal de confirmación
      if (hasChanges) {
        // Activar guard para prevenir múltiples llamadas
        isProcessingTabChangeRef.current = true;
        
        // Obtener nombres de las pestañas
        const getSubTabName = (subTab: string) => {
          const names: { [key: string]: string } = {
            'status': 'Estado',
            'insert': 'Crear',
            'update': 'Actualizar',
            'massive': 'Masivo'
          };
          return names[subTab] || subTab;
        };
        
        const currentTabName = getSubTabName(activeSubTab);
        const targetTabName = getSubTabName(tab);
        
        console.log('[SystemParameters] Llamando a showModal', {
          currentTabName,
          targetTabName,
          activeSubTab,
          tab
        });
        
        showModal(
          'subtab',
          currentTabName,
          targetTabName,
          () => {
            console.log('[SystemParameters] Modal confirmado (INSERT -> otro)', {
              from: activeSubTab,
              to: tab,
              skipNextSyncBefore: skipNextSyncRef.current,
              isProcessingBefore: isProcessingTabChangeRef.current
            });
            
            // Confirmar: proceder con el cambio y limpiar formulario
            // IMPORTANTE: Marcar ANTES de cualquier actualización de estado para prevenir sincronización duplicada
            skipNextSyncRef.current = true;
            // Mantener isProcessingTabChangeRef en true hasta que se complete el cambio
            insertForm?.resetForm(); // Limpiar formulario usando useInsertForm
            setActiveSubTabState(tab); // Actualizar estado directamente (ya pasó validación)
            // Llamar al callback del padre - esto actualizará propActiveSubTab en App.tsx
            console.log('[SystemParameters] Llamando a propOnSubTabChange con tab:', tab);
            propOnSubTabChange?.(tab);
            setMessage(null);
            setInsertedRecords([]); // Limpiar registros insertados
            // Liberar el guard después de un delay suficiente para que useSystemParametersSync procese el skip
            setTimeout(() => {
              console.log('[SystemParameters] Liberando isProcessingTabChangeRef');
              isProcessingTabChangeRef.current = false;
              // Resetear skipNextSyncRef después de que se haya procesado
              setTimeout(() => {
                skipNextSyncRef.current = false;
              }, 100);
            }, 200);
          },
          () => {
            // Cancelar: revertir el cambio en App.tsx para que la pestaña visual vuelva al estado original
            propOnSubTabChange?.(activeSubTab);
            // Liberar el guard inmediatamente en caso de cancelar
            isProcessingTabChangeRef.current = false;
          }
        );
        return; // IMPORTANTE: Salir aquí para NO proceder con el cambio de pestaña
      }
    } else if (activeSubTab === 'update') {
      // Para update: verificar si hay cambios o si el formulario está abierto
      // updateFormData puede tener datos reales o un objeto especial { __formOpen: true, __hasChanges: false }
      if (updateFormData && Object.keys(updateFormData).length > 0) {
        // Verificar si realmente hay cambios (no es solo el marcador de formulario abierto)
        const hasRealChanges = !updateFormData.__formOpen || updateFormData.__hasChanges !== false;
        
        if (hasRealChanges) {
          // Activar guard para prevenir múltiples llamadas
          isProcessingTabChangeRef.current = true;
          
          // Obtener nombres de las pestañas
          const getSubTabName = (subTab: string) => {
            const names: { [key: string]: string } = {
              'status': 'Estado',
              'insert': 'Crear',
              'update': 'Actualizar',
              'massive': 'Masivo'
            };
            return names[subTab] || subTab;
          };
          
          showModal(
            'subtab',
            getSubTabName(activeSubTab),
            getSubTabName(tab),
            () => {
              // Confirmar: proceder con el cambio y limpiar formulario
              // IMPORTANTE: Marcar ANTES de cualquier actualización de estado para prevenir sincronización duplicada
              skipNextSyncRef.current = true;
              // Mantener isProcessingTabChangeRef en true hasta que se complete el cambio
              setActiveSubTabState(tab); // Actualizar estado directamente (ya pasó validación)
              // Llamar al callback del padre - esto actualizará propActiveSubTab en App.tsx
              propOnSubTabChange?.(tab);
              setMessage(null);
              resetForm(); // Limpiar formulario siempre al confirmar
              setUpdateFormData({}); // Limpiar datos de actualización
              // Liberar el guard después de un delay suficiente para que useSystemParametersSync procese el skip
              setTimeout(() => {
                isProcessingTabChangeRef.current = false;
                // Resetear skipNextSyncRef después de que se haya procesado
                setTimeout(() => {
                  skipNextSyncRef.current = false;
                }, 100);
              }, 200);
            },
            () => {
              // Cancelar: revertir el cambio en App.tsx para que la pestaña visual vuelva al estado original
              propOnSubTabChange?.(activeSubTab);
              // Liberar el guard inmediatamente en caso de cancelar
              isProcessingTabChangeRef.current = false;
            }
          );
          return; // IMPORTANTE: Salir aquí para NO proceder con el cambio de pestaña
        }
      }
    }
    
    // No hay cambios o ya se confirmó, proceder con el cambio
    console.log('[SystemParameters] No hay cambios o ya se confirmó, procediendo con el cambio', {
      from: activeSubTab,
      to: tab,
      selectedTable
    });
    
    // Marcar para saltar la próxima sincronización ya que el cambio fue iniciado internamente
    skipNextSyncRef.current = true;
    setActiveSubTabState(tab); // Actualizar estado directamente (ya pasó validación o no había cambios)
    // IMPORTANTE: Llamar al onSubTabChange del padre solo después de pasar todas las validaciones
    console.log('[SystemParameters] Llamando a propOnSubTabChange (sin cambios)', tab);
    propOnSubTabChange?.(tab); // Llamar al callback del padre
    setMessage(null);
    // Limpiar formulario cuando se cambia a 'insert' o se sale de 'insert'
    if (tab === 'insert') {
      insertForm?.resetForm(); // Limpiar formulario al entrar a insert usando useInsertForm
      setInsertedRecords([]); // Limpiar registros insertados
    } else if (activeSubTab === 'insert') {
      insertForm?.resetForm(); // Limpiar formulario al salir de insert usando useInsertForm
      setInsertedRecords([]); // Limpiar registros insertados
    }
    if (tab !== 'update') setUpdateFormData({}); // Limpiar datos de actualización al cambiar de pestaña
  }, [insertForm, activeSubTab, selectedTable, hasUnsavedChanges, propOnSubTabChange, updateFormData, showModal, setInsertedRecords]);

  // Actualizar el ref cuando handleSubTabChangeInternal cambie
  useEffect(() => {
    handleSubTabChangeInternalRef.current = handleSubTabChangeInternal;
  }, [handleSubTabChangeInternal]);

  const handleRowSelect = useCallback((row: any) => {
    setSelectedRow(row);
    // NO llamar setFormData aquí - useUpdateForm maneja su propio estado interno
    // setFormData(row); // <-- ESTO CONTAMINABA EL ESTADO COMPARTIDO
    handleSubTabChangeInternal('update');
  }, [handleSubTabChangeInternal]); // Usar handleSubTabChangeInternal en lugar de llamar directamente


  // ============================================================================
  // RENDER HELPERS
  // ============================================================================



  const renderDataTable = () => {
    if (!config) return null;

    const visibleFields = config.fields.filter(f => !f.hidden);

    return (
      <div className="overflow-x-auto">
        <SearchBarWithCounter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredCount={filteredData.length}
          totalCount={tableState.data.length}
          placeholder="Buscar..."
        />

        {tableState.loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-neutral-800">
                <tr>
                  {visibleFields.map(field => (
                    <th key={field.name} className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-gray-600 dark:text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleFields.length + 1} className="px-4 py-8 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                    >
                      {visibleFields.map(field => (
                        <td key={field.name} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {getDisplayValue(row, field.name)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {config.allowUpdate && (
                            <button
                              onClick={() => handleRowSelect(row)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          )}
                          {config.allowDelete && (
                            <button
                              onClick={() => handleDelete(row)}
                              className="text-red-500 hover:text-red-700"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <PaginationControls
              currentPage={tableState.currentPage}
              totalPages={tableState.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    );
  };

  const renderForm = (mode: 'insert' | 'update') => {
    if (!config) return null;

    const editableFields = config.fields.filter(f => !f.hidden && !f.readonly);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editableFields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.foreignKey ? (
                // Select para foreign keys
                <select
                  value={formState.data[field.name] || ''}
                  onChange={(e) => updateFormField(field.name, e.target.value ? Number(e.target.value) : null)}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 ${
                    formState.errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {(crudRelatedData[field.foreignKey.table] || []).map((item: any) => {
                    const labelFields = Array.isArray(field.foreignKey!.labelField) 
                      ? field.foreignKey!.labelField 
                      : [field.foreignKey!.labelField];
                    const label = labelFields.map(lf => item[lf]).filter(Boolean).join(' ');
                    return (
                      <option key={item[field.foreignKey!.valueField]} value={item[field.foreignKey!.valueField]}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formState.data[field.name] || ''}
                  onChange={(e) => updateFormField(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 ${
                    formState.errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                />
              ) : field.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={formState.data[field.name] || false}
                  onChange={(e) => updateFormField(field.name, e.target.checked)}
                  className="w-5 h-5"
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                  value={formState.data[field.name] ?? ''}
                  onChange={(e) => updateFormField(
                    field.name, 
                    field.type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value
                  )}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 ${
                    formState.errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {formState.errors[field.name] && (
                <p className="text-red-500 text-xs mt-1">{formState.errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={mode === 'insert' ? handleInsert : handleUpdate}
            disabled={formState.isSubmitting}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {formState.isSubmitting ? 'Guardando...' : (mode === 'insert' ? 'Insertar' : 'Actualizar')}
          </button>
          <button
            onClick={() => {
              resetForm();
              if (mode === 'update') {
                setSelectedRow(null);
                setActiveSubTabState('status');
              }
            }}
            className="px-6 py-2 bg-gray-300 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-neutral-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };


  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
      {/* Selector de tabla */}
      {!selectedTable && (
        <TableSelector
          selectedTable={selectedTable}
          onTableSelect={handleTableSelect}
        />
      )}

      {/* Contenido de la tabla seleccionada */}
      {selectedTable && config && (
        <div>
          {/* Mensaje */}
          {message && (
            <MessageDisplay message={message} />
          )}

          {/* Contenido según tab activa (controlada por sidebar) */}
          <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-6">
            {activeSubTab === 'status' && (
              <StatusTab
                tableName={selectedTable}
                tableData={tableData} // Usar tableData de useTableDataManagement, no tableState.data
                columns={columns}
                relatedData={relatedDataForStatus}
                userData={userData || []}
                loading={tableDataLoading} // Usar loading de useTableDataManagement
                onRowClick={handleRowSelect}
                themeColor={themeColor}
              />
            )}
            {(() => {
              if (activeSubTab === 'insert') {
                console.log('[SystemParameters] Condición para InsertTab', {
                  activeSubTab,
                  hasInsertForm: !!insertForm,
                  selectedTable,
                  resetKey: getResetKey(),
                  insertTabKey,
                  columnsCount: columns.length,
                  hasConfig: !!config,
                  timestamp: Date.now()
                });
              }
              return null;
            })()}
            {activeSubTab === 'insert' && insertForm && (
              <InsertTab
                key={`insert-${selectedTable}-${activeSubTab}-${getResetKey()}-${insertTabKey}`}
                tableName={selectedTable}
                formData={insertForm.formData}
                setFormData={insertForm.setFormData}
                updateFormField={insertForm.updateFormField}
                loading={insertForm.isSubmitting}
                onInsert={() => {
                  if (insertForm?.handleInsert) {
                    insertForm.handleInsert()
                  }
                }}
                onCancel={() => {
                  insertForm.handleCancel();
                }}
                message={message}
                relatedData={relatedDataForStatus}
                paisSeleccionado={paisSeleccionado}
                empresaSeleccionada={empresaSeleccionada}
                fundoSeleccionado={fundoSeleccionado}
                visibleColumns={(() => {
                  console.log('[SystemParameters] Calculando visibleColumns para InsertTab', {
                    selectedTable,
                    uniqueColumnsCount: uniqueColumns.length,
                    uniqueColumnsNames: uniqueColumns.map(c => c.columnName),
                    columnsCount: columns.length,
                    columnsNames: columns.map(c => c.columnName),
                    timestamp: Date.now()
                  });
                  
                  const filtered = uniqueColumns.filter(col => {
                    // Filtrar campos automáticos que no deben aparecer en formularios
                    const excludedFields = ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'];
                    
                    // Excluir la clave primaria de la tabla SOLO si es auto-incremental
                    // (es decir, si NO es una foreign key requerida Y está marcada como hidden)
                    const primaryKey = PRIMARY_KEY_MAP[selectedTable as TableName];
                    if (primaryKey) {
                      const config = getTableConfig(selectedTable as TableName);
                      const primaryKeyFields = Array.isArray(primaryKey) ? primaryKey : [primaryKey];
                      
                      primaryKeyFields.forEach(pk => {
                        // Verificar si el campo de clave primaria es una foreign key
                        const fieldConfig = config?.fields.find(f => f.name === pk);
                        // Si NO es foreign key Y está marcado como hidden, entonces es auto-incremental y debe excluirse
                        // Si ES foreign key O NO está hidden, NO debe excluirse porque el usuario debe ingresarlo/seleccionarlo
                        if (!fieldConfig?.foreignKey && fieldConfig?.hidden) {
                          excludedFields.push(pk);
                        }
                      });
                    }
                    
                    return !excludedFields.includes(col.columnName);
                  });
                  
                  console.log('[SystemParameters] visibleColumns calculado', {
                    selectedTable,
                    filteredCount: filtered.length,
                    filteredNames: filtered.map(c => c.columnName),
                    excludedFields: ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'],
                    timestamp: Date.now()
                  });
                  
                  return filtered;
                })()}
                getColumnDisplayName={(columnName: string) => 
                  getColumnDisplayNameTranslated(columnName, t)
                }
                getUniqueOptionsForField={getUniqueOptionsForFieldHelper}
                insertedRecords={insertedRecords}
                onClearInsertedRecords={() => setInsertedRecords([])}
                resetKey={`${selectedTable}-${insertTabKey}-${getResetKey()}`}
                themeColor={themeColor}
              />
            )}
            {activeSubTab === 'update' && (
              <UpdateTab
                tableName={selectedTable}
                tableData={tableState.data}
                columns={uniqueColumns}
                relatedData={relatedDataForStatus}
                config={config}
                updateRow={updateRow}
                getPrimaryKeyValue={getPrimaryKeyValue}
                user={user}
                loading={tableState.loading}
                themeColor={themeColor}
                visibleColumns={uniqueColumns.filter(col => {
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
                getUniqueOptionsForField={getUniqueOptionsForFieldHelper}
                existingData={tableState.data}
                onUpdateSuccess={() => {
                  loadData();
                }}
                setMessage={setMessage}
                onFormDataChange={(formData) => {
                  // Guardar datos del formulario de actualización para detección de cambios sin guardar
                  setUpdateFormData(formData);
                  
                  // Notificar cambios en formData al componente padre
                  if (onFormDataChange) {
                    onFormDataChange(formData, []);
                  }
                }}
              />
            )}
            {activeSubTab === 'massive' && (
              <MassiveOperationsRenderer
                selectedTable={selectedTable}
                config={config}
                formState={formState}
                getUniqueOptionsForField={getUniqueOptionsForFieldMassive}
                onApply={handleMassiveUmbralApply}
                onCancel={() => {
                  setMessage(null);
                }}
                paisSeleccionado={paisSeleccionado}
                empresaSeleccionada={empresaSeleccionada}
                fundoSeleccionado={fundoSeleccionado}
                getPaisName={getPaisName}
                getEmpresaName={getEmpresaName}
                getFundoName={getFundoName}
                onFormDataChange={(massiveFormData) => {
                  if (onMassiveFormDataChange) {
                    onMassiveFormDataChange(massiveFormData);
                  }
                }}
                localizacionesData={localizacionesData || []}
              />
            )}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!selectedTable && (
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">👆</div>
          <p>Seleccione una tabla para comenzar</p>
        </div>
      )}
    </div>
  );
});

SystemParameters.displayName = 'SystemParameters';

export default SystemParameters;

