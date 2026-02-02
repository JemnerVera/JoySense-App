/**
 * SystemParameters - Componente principal para administración de parámetros del sistema
 * Versión simplificada usando configuración centralizada
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

// Contexts
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFilters } from '../../contexts/FilterContext';
import { useSidebar } from '../../contexts/SidebarContext';

// Config & Types
import { TABLES_CONFIG, getTableConfig, getTablesByCategory, TABLE_CATEGORIES, TableConfig } from '../../config/tables.config';
import { TableName, PRIMARY_KEY_MAP } from '../../types';
import type { ColumnInfo } from '../../types/systemParameters';

// Hooks
import { useTableCRUD } from '../../hooks/useTableCRUD';
import { useTableDataManagement } from '../../hooks/useTableDataManagement';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useInsertForm } from '../../hooks/useInsertForm';

// Components
import { LoadingSpinner } from './LoadingSpinner';
import { MessageDisplay } from './MessageDisplay';
import { PaginationControlsCompat } from '../../components/shared/ui/pagination/PaginationControlsCompat';
import { SearchBarWithCounter } from './SearchBarWithCounter';
import { StatusTab } from './StatusTab/StatusTab';
import { InsertTab } from './InsertTab/InsertTab';
import { UpdateTab } from './UpdateTab/UpdateTab';
import { TableSelector } from './components/TableSelector';
import { MassiveOperationsRenderer } from './components/MassiveOperationsRenderer';
import { getColumnDisplayNameTranslated } from '../../utils/systemParametersUtils';
import { logger } from '../../utils/logger';

// Hooks
import { useSystemParametersUtils } from './hooks/useSystemParametersUtils';
import { useSystemParametersCRUD } from './hooks/useSystemParametersCRUD';
import { useMassiveOperations } from './hooks/useMassiveOperations';
import { useSystemParametersSync } from './hooks/useSystemParametersSync';
import { getUniqueOptionsForField } from './utils/getUniqueOptionsForField';

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
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();
  const sidebar = useSidebar();

  // Estado local
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
  const [activeSubTab, setActiveSubTabState] = useState<'status' | 'insert' | 'update' | 'massive'>(propActiveSubTab);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState<Record<string, any>>({});
  const [massiveFormData, setMassiveFormData] = useState<Record<string, any>>({});
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
    reglasData,
    origenesData,
    fuentesData,
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
      if (selectedTable && ['perfil', 'usuario', 'pais', 'empresa', 'fundo', 'ubicacion', 'tipo', 'entidad', 'metrica', 'umbral'].includes(selectedTable)) {
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
    if (!columns || columns.length === 0) {
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
    
    return filtered;
  }, [columns, selectedTable]);

  // Adaptar relatedData para StatusTab
  const relatedDataForStatus = useMemo(() => {
    // Asegurar que reglasData, origenesData y fuentesData siempre sean arrays
    const safeReglasData = Array.isArray(reglasData) ? reglasData : [];
    const safeOrigenesData = Array.isArray(origenesData) ? origenesData : [];
    const safeFuentesData = Array.isArray(fuentesData) ? fuentesData : [];
    
    const result = {
      paisesData: Array.isArray(paisesData) ? paisesData : [],
      empresasData: Array.isArray(empresasData) ? empresasData : [],
      fundosData: Array.isArray(fundosData) ? fundosData : [],
      ubicacionesData: Array.isArray(ubicacionesData) ? ubicacionesData : [],
      localizacionesData: Array.isArray(localizacionesData) ? localizacionesData : [],
      entidadesData: Array.isArray(entidadesData) ? entidadesData : [],
      nodosData: Array.isArray(nodosData) ? nodosData : [],
      tiposData: Array.isArray(tiposData) ? tiposData : [],
      metricasData: Array.isArray(metricasData) ? metricasData : [],
      criticidadesData: Array.isArray(criticidadesData) ? criticidadesData : [],
      perfilesData: Array.isArray(perfilesData) ? perfilesData : [],
      umbralesData: Array.isArray(umbralesData) ? umbralesData : [],
      reglasData: safeReglasData,
      origenesData: safeOrigenesData,
      fuentesData: safeFuentesData,
      userData: Array.isArray(userData) ? userData : [],
      sensorsData: Array.isArray(sensorsData) ? sensorsData : [],
      codigotelefonosData: Array.isArray(codigotelefonosData) ? codigotelefonosData : [],
      canalesData: Array.isArray(canalesData) ? canalesData : [],
      contactosData: Array.isArray(contactosData) ? contactosData : [],
      correosData: Array.isArray(correosData) ? correosData : []
    };
    
    return result;
  }, [
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
    reglasData,
    origenesData,
    fuentesData,
    userData,
    sensorsData,
    codigotelefonosData,
    canalesData,
    contactosData,
    correosData,
    selectedTable // Agregado para que el useMemo se recalcule cuando cambia selectedTable
  ]);

  // Ref para poder usar handleSubTabChangeInternal en useSystemParametersSync (debe declararse antes)
  const handleSubTabChangeInternalRef = useRef<((tab: 'status' | 'insert' | 'update' | 'massive') => void) | null>(null);
  
  // Guard para prevenir múltiples llamadas simultáneas a handleSubTabChangeInternal
  const isProcessingTabChangeRef = useRef<boolean>(false);

  // Ref para comunicar con useSystemParametersSync
  const skipNextSyncRef = useRef<boolean>(false);
  
  // Ref para rastrear si el cambio viene de ProtectedSubTabButton (ya validado)
  const changeFromProtectedButtonRef = useRef<boolean>(false);
  
  // Ref para rastrear cuando el cambio de tabla viene de ProtectedParameterButton
  // Esto evita que se valide el cambio de activeSubTab cuando viene de un cambio de tabla
  const isTableChangeFromProtectedButtonRef = useRef<boolean>(false);
  
  // Monitorear cambios sin guardar y notificar al sidebar
  // SOLO marcar dirty en CREAR, ASIGNAR, MASIVO o ACTUALIZAR (no en STATUS)
  useEffect(() => {
    if (!selectedTable) return;
    
    // Solo verificar cambios en pestañas que tienen formularios editables
    if (activeSubTab === 'status') {
      // En STATUS no hay cambios sin guardar
      const panelId = `system-parameters-${selectedTable}`;
      sidebar.markDirty(panelId, false);
      return;
    }
    
    let hasChanges = false;
    if (activeSubTab === 'insert') {
      // Verificar con hasUnsavedChanges para detectar cambios reales
      hasChanges = hasUnsavedChanges({
        formData: insertForm?.formData || {},
        selectedTable,
        activeSubTab
      });
    } else if (activeSubTab === 'update') {
      // Verificar cambios en formulario de actualización
      if (updateFormData && Object.keys(updateFormData).length > 0) {
        const hasRealChanges = !updateFormData.__formOpen || updateFormData.__hasChanges !== false;
        hasChanges = hasRealChanges;
      }
    } else if (activeSubTab === 'massive') {
      // Verificar cambios en formulario masivo
      if (massiveFormData && Object.keys(massiveFormData).length > 0) {
        hasChanges = hasUnsavedChanges({
          formData: massiveFormData,
          selectedTable,
          activeSubTab
        });
      }
    } else if (activeSubTab === 'asignar') {
      // Verificar cambios en formulario de asignar (similar a insert)
      hasChanges = hasUnsavedChanges({
        formData: insertForm?.formData || {},
        selectedTable,
        activeSubTab: 'insert' // Usar 'insert' para la detección ya que 'asignar' es similar
      });
    }

    // Marcar en el sidebar (sin incluir sidebar en dependencias para evitar loops)
    const panelId = `system-parameters-${selectedTable}`;
    sidebar.markDirty(panelId, hasChanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, activeSubTab, insertForm?.formData, updateFormData, massiveFormData]);

  // Hook de sincronización (se define antes de handleSubTabChangeInternal para evitar dependencia circular)
  useSystemParametersSync({
    propSelectedTable,
    propActiveSubTab,
    selectedTable,
    activeSubTab,
    formState,
    setSelectedTable,
    setActiveSubTab: (tab) => {
      // Si el cambio viene de un cambio de tabla (ProtectedParameterButton), NO validar
      if (isTableChangeFromProtectedButtonRef.current) {
        setActiveSubTabState(tab);
        return;
      }
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
  // IMPORTANTE: Este handler NO debe validar cambios si viene de ProtectedParameterButton
  // ProtectedParameterButton ya valida y muestra el modal antes de llamar a onTableSelect
  // Este handler solo se usa internamente o desde TableSelector (que no usa ProtectedParameterButton)
  const handleTableSelect = useCallback((table: string) => {
    // Si la tabla es la misma, no hacer nada
    if (table === selectedTable) {
      return;
    }
    
    // Marcar que el cambio viene de ProtectedParameterButton (ya validado)
    // Esto evitará que useSystemParametersSync valide el cambio de activeSubTab
    isTableChangeFromProtectedButtonRef.current = true;
    skipNextSyncRef.current = true;
    
    // NO validar cambios aquí - ProtectedParameterButton ya lo hace
    // Limpiar formulario ANTES de actualizar estados para evitar que se detecten cambios
    resetForm();
    setUpdateFormData({});
    setInsertedRecords([]);
    
    // Actualizar el estado y llamar al callback del padre
    setSelectedTable(table);
    onTableSelect?.(table);
    setActiveSubTabState('status');
    propOnSubTabChange?.('status');
    setMessage(null);
    
    // Resetear el ref después de un delay para permitir futuros cambios
    setTimeout(() => {
      isTableChangeFromProtectedButtonRef.current = false;
      skipNextSyncRef.current = false;
    }, 500);
  }, [selectedTable, onTableSelect, propOnSubTabChange, resetForm, updateFormData, setInsertedRecords, skipNextSyncRef]);

  // Efecto para resetear isProcessingTabChangeRef cuando se cancela el modal
  useEffect(() => {
    // Si el modal se cierra y no hay pendingTransition, significa que se canceló
    // Resetear el ref para permitir futuros cambios
    if (!sidebar.showModal && !sidebar.pendingTransition && isProcessingTabChangeRef.current) {
      isProcessingTabChangeRef.current = false;
    }
  }, [sidebar.showModal, sidebar.pendingTransition]);

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
        
        // Usar el sistema del sidebar para mostrar el modal
        const panelId = `system-parameters-${selectedTable}`;
        
        // CRÍTICO: Revertir propActiveSubTab inmediatamente para evitar que useSystemParametersSync procese el cambio
        // Esto previene que el cambio se ejecute antes de que el usuario confirme
        propOnSubTabChange?.(activeSubTab);
        
        sidebar.requestSubTabChange?.(tab, () => {
          // Confirmar: usar handleSubTabChangeFromProtectedButton para evitar validación duplicada
          sidebar.markDirty(panelId, false);
          handleSubTabChangeFromProtectedButton(tab);
        });
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
          
          // Usar el sistema del sidebar para mostrar el modal
          const panelId = `system-parameters-${selectedTable}`;
          
          // CRÍTICO: Revertir propActiveSubTab inmediatamente para evitar que useSystemParametersSync procese el cambio
          // Esto previene que el cambio se ejecute antes de que el usuario confirme
          propOnSubTabChange?.(activeSubTab);
          
          sidebar.requestSubTabChange?.(tab, () => {
            // Confirmar: usar handleSubTabChangeFromProtectedButton para evitar validación duplicada
            sidebar.markDirty(panelId, false);
            handleSubTabChangeFromProtectedButton(tab);
          });
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
  }, [insertForm, activeSubTab, selectedTable, hasUnsavedChanges, propOnSubTabChange, updateFormData, setInsertedRecords]);

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

            <PaginationControlsCompat
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
                themeColor={themeColor}
              />
            )}
            {(() => {
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
                  // Guardar datos del formulario masivo para detección de cambios sin guardar
                  setMassiveFormData(massiveFormData);
                  if (onMassiveFormDataChange) {
                    onMassiveFormDataChange(massiveFormData);
                  }
                }}
                localizacionesData={localizacionesData || []}
                entidadesData={relatedDataForStatus.entidadesData || []}
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

