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
import { TableName } from '../types';
import type { ColumnInfo } from '../types/systemParameters';

// Hooks
import { useTableCRUD } from '../hooks/useTableCRUD';
import { useTableDataManagement } from '../hooks/useTableDataManagement';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

// Components
import { LoadingSpinner } from './SystemParameters/LoadingSpinner';
import { MessageDisplay } from './SystemParameters/MessageDisplay';
import { PaginationControls } from './SystemParameters/PaginationControls';
import { SearchBarWithCounter } from './SystemParameters/SearchBarWithCounter';
import { StatusTab } from './SystemParameters/StatusTab/StatusTab';
import { InsertTab } from './SystemParameters/InsertTab/InsertTab';
import { UpdateTab } from './SystemParameters/UpdateTab/UpdateTab';
import { getColumnDisplayNameTranslated } from '../utils/systemParametersUtils';

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
  onSubTabChange,
  onFormDataChange,
  onMassiveFormDataChange
}, ref) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal } = useModal();
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();

  // Estado local
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update' | 'massive'>(propActiveSubTab);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
    setPage,
    getDisplayValue,
    getPrimaryKeyValue
  } = useTableCRUD({ tableName: selectedTable as TableName });

  // Hook para detectar cambios sin guardar
  const { hasUnsavedChanges } = useUnsavedChanges();

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
    loadRelatedTablesData,
    loadTableData,
    setTableData, // Para limpiar datos inmediatamente
    setColumns, // Para limpiar columnas inmediatamente
    setLoading // Para establecer loading inmediatamente
  } = useTableDataManagement();

  // Filtrar columnas duplicadas (basándose en columnName)
  // También filtrar campos ocultos y de solo lectura que no deberían aparecer en formularios
  const uniqueColumns = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    
    // Debug: mostrar columnas originales para la tabla perfil
    if (selectedTable === 'perfil') {
      console.log('🔍 Columnas originales para perfil:', columns.map(c => c.columnName));
      console.log('🔍 Total de columnas:', columns.length);
    }
    
    const seen = new Set<string>();
    const config = selectedTable ? getTableConfig(selectedTable as TableName) : null;
    const filtered: ColumnInfo[] = [];
    
    for (const col of columns) {
      // Eliminar duplicados
      if (seen.has(col.columnName)) {
        console.warn(`⚠️ Columna duplicada detectada y eliminada: ${col.columnName} en tabla ${selectedTable}`);
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
      
      filtered.push(col);
    }
    
    // Debug: mostrar columnas únicas para la tabla perfil
    if (selectedTable === 'perfil') {
      console.log('✅ Columnas únicas para perfil:', filtered.map(c => c.columnName));
      console.log('✅ Total de columnas únicas:', filtered.length);
    }
    
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
    userData: userData || []
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
    userData
  ]);

  // Sync con props
  useEffect(() => {
    if (propSelectedTable && propSelectedTable !== selectedTable) {
      setSelectedTable(propSelectedTable);
    }
  }, [propSelectedTable]);

  // Notificar cambios en formData al componente padre (para protección de datos)
  // Usar useRef para evitar loops infinitos
  const prevFormDataRef = useRef<string>('');
  const prevActiveSubTabRef = useRef<'status' | 'insert' | 'update' | 'massive'>(activeSubTab);
  const onFormDataChangeRef = useRef(onFormDataChange);
  
  // Actualizar el ref cuando cambie la función
  useEffect(() => {
    onFormDataChangeRef.current = onFormDataChange;
  }, [onFormDataChange]);
  
  useEffect(() => {
    // Solo notificar si estamos en la pestaña "insert"
    if (activeSubTab === 'insert') {
      // Comparar si el formData realmente cambió (usando JSON.stringify para comparación profunda)
      const formDataString = JSON.stringify(formState.data);
      const activeSubTabChanged = prevActiveSubTabRef.current !== activeSubTab;
      
      // Solo notificar si cambió el formData o si cambió la pestaña activa
      if (formDataString !== prevFormDataRef.current || activeSubTabChanged) {
        if (onFormDataChangeRef.current) {
          onFormDataChangeRef.current(formState.data, []);
        }
        prevFormDataRef.current = formDataString;
        prevActiveSubTabRef.current = activeSubTab;
      }
    } else {
      // Si no estamos en "insert", resetear el ref
      prevFormDataRef.current = '';
      prevActiveSubTabRef.current = activeSubTab;
    }
  }, [formState.data, activeSubTab]); // No incluir onFormDataChange para evitar loops

  // Sincronizar activeSubTab con prop cuando cambia desde fuera (ej: ProtectedSubTabButton)
  useEffect(() => {
    if (propActiveSubTab && propActiveSubTab !== activeSubTab) {
      // Si veníamos de 'insert' o 'update' y cambiamos a otra pestaña, limpiar formulario
      if ((activeSubTab === 'insert' || activeSubTab === 'update') && 
          propActiveSubTab !== 'insert' && propActiveSubTab !== 'update') {
        resetForm();
        setUpdateFormData({});
      }
      
      setActiveSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab, activeSubTab, resetForm]);

  // Cargar datos relacionados al montar el componente (una sola vez)
  useEffect(() => {
    loadRelatedTablesData();
  }, []); // Solo al montar

  // Limpiar datos inmediatamente cuando cambia selectedTable (antes de cargar)
  useEffect(() => {
    if (selectedTable) {
      // Limpiar datos inmediatamente al cambiar de tabla para evitar mostrar datos incorrectos
      // Esto se hace ANTES de cargar los nuevos datos - de forma síncrona
      setTableData([]); // Limpiar datos de tabla
      setColumns([]); // Limpiar columnas
      setLoading(true); // Establecer loading
      setMessage(null);
      setSelectedRow(null);
      resetForm();
      setUpdateFormData({});
    }
  }, [selectedTable, setTableData, setColumns, setLoading, resetForm]); // Solo cuando cambia selectedTable

  // Cargar datos cuando cambia la tabla
  useEffect(() => {
    if (selectedTable) {
      console.log('🔵 [SystemParameters] selectedTable cambió a:', selectedTable);
      console.log('🔵 [SystemParameters] Estado actual - tableData.length:', tableData.length, 'columns.length:', columns.length);
      
      console.log('🔵 [SystemParameters] Iniciando carga de datos para:', selectedTable);
      
      // Para StatusTab: usar solo useTableDataManagement (tableData y columns)
      // Para Insert/Update: usar useTableCRUD (tableState.data)
      // Cargar datos de tabla y columnas (para StatusTab)
      loadTableData(selectedTable);
      loadRelatedTablesData(); // También cargar cuando cambia la tabla por si acaso
      
      // Cargar datos con useTableCRUD solo si no estamos en StatusTab
      // (se cargará cuando se cambie a Insert o Update)
      if (activeSubTab !== 'status') {
        loadData();
        loadRelatedData();
      }
    }
  }, [selectedTable]); // Solo cuando cambia selectedTable

  // Limpiar formulario cuando se cambia de pestaña (si veníamos de insert o update)
  useEffect(() => {
    // Si cambiamos desde 'insert' o 'update' a otra pestaña, limpiar formulario
    if ((prevActiveSubTabRef.current === 'insert' || prevActiveSubTabRef.current === 'update') && 
        activeSubTab !== prevActiveSubTabRef.current && 
        activeSubTab !== 'insert' && activeSubTab !== 'update') {
      resetForm();
      setUpdateFormData({});
    }
    prevActiveSubTabRef.current = activeSubTab;
  }, [activeSubTab, resetForm, formState.data]);

  // Recargar datos cuando se cambia a la pestaña de Estado
  // Usar useRef para evitar loops infinitos
  const lastLoadRef = useRef<{ table: string; subTab: string }>({ table: '', subTab: '' });
  useEffect(() => {
    if (selectedTable && activeSubTab === 'status' && !tableState.loading) {
      // Solo recargar si cambió la tabla o el subTab
      const key = `${selectedTable}-${activeSubTab}`;
      const lastKey = `${lastLoadRef.current.table}-${lastLoadRef.current.subTab}`;
      if (key !== lastKey) {
        lastLoadRef.current = { table: selectedTable, subTab: activeSubTab };
        loadData();
      }
    }
  }, [activeSubTab, selectedTable]); // Removemos loadData de dependencias para evitar loops

  // Exponer métodos al padre
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => formState.isDirty,
    handleTabChange: (tab) => {
      setActiveSubTab(tab);
      onSubTabChange?.(tab);
    },
    handleTableChange: (table) => {
      setSelectedTable(table);
      onTableSelect?.(table);
    }
  }));

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

  // Handlers
  const handleTableSelect = useCallback((table: string) => {
    // Verificar si hay cambios sin guardar antes de cambiar de tabla
    if (selectedTable) {
      if (activeSubTab === 'insert') {
        // Verificar con hasUnsavedChanges para detectar cambios reales
        const hasChanges = hasUnsavedChanges({
          formData: formState.data,
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
                setActiveSubTab('status');
                onSubTabChange?.('status');
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
    setActiveSubTab('status');
    onSubTabChange?.('status');
    setMessage(null);
    resetForm();
    setUpdateFormData({}); // Limpiar datos de actualización
  }, [selectedTable, formState.data, activeSubTab, hasUnsavedChanges, onTableSelect, onSubTabChange, resetForm, updateFormData]);

  const handleSubTabChange = useCallback((tab: 'status' | 'insert' | 'update' | 'massive') => {
    // Verificar si hay cambios sin guardar antes de cambiar de pestaña
    if (activeSubTab === 'insert') {
      // Verificar con hasUnsavedChanges para detectar cambios reales
      const hasChanges = hasUnsavedChanges({
        formData: formState.data,
        selectedTable,
        activeSubTab
      });
      
      // Si hay cambios, mostrar confirmación
      if (hasChanges) {
        if (!window.confirm('¿Está seguro? Los datos ingresados se perderán.')) {
          return; // Cancelar cambio de pestaña
        }
      }
    } else if (activeSubTab === 'update') {
      // Para update: verificar si hay cambios o si el formulario está abierto
      // updateFormData puede tener datos reales o un objeto especial { __formOpen: true, __hasChanges: false }
      if (updateFormData && Object.keys(updateFormData).length > 0) {
        // Verificar si realmente hay cambios (no es solo el marcador de formulario abierto)
        const hasRealChanges = !updateFormData.__formOpen || updateFormData.__hasChanges !== false;
        
        if (hasRealChanges) {
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
              setActiveSubTab(tab);
              onSubTabChange?.(tab);
              setMessage(null);
              resetForm(); // Limpiar formulario siempre al confirmar
              setUpdateFormData({}); // Limpiar datos de actualización
            },
            () => {
              // Cancelar: no hacer nada
            }
          );
          return; // Cancelar cambio de pestaña (el modal manejará la confirmación)
        }
      }
    }
    
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
    setMessage(null);
    if (tab === 'insert') resetForm();
    if (tab !== 'update') setUpdateFormData({}); // Limpiar datos de actualización al cambiar de pestaña
  }, [formState.data, activeSubTab, selectedTable, hasUnsavedChanges, onSubTabChange, resetForm, updateFormData]);

  const handleRowSelect = useCallback((row: any) => {
    setSelectedRow(row);
    setFormData(row);
    setActiveSubTab('update');
    onSubTabChange?.('update');
  }, [setFormData, onSubTabChange]);

  const handleInsert = useCallback(async () => {
    // Para perfil_geografia_permiso, validar campos requeridos manualmente
    if (selectedTable === 'perfil_geografia_permiso') {
      if (!formState.data.perfilid) {
        setMessage({ type: 'warning', text: 'Por favor seleccione un perfil' });
        return;
      }
      if (!formState.data.paisid && !formState.data.empresaid && !formState.data.fundoid && !formState.data.ubicacionid) {
        setMessage({ type: 'warning', text: 'Por favor seleccione un tipo de geografía y su valor' });
        return;
      }
    } else {
      // Validar formulario y mostrar mensaje warning si hay errores
      if (!validateForm()) {
        // Obtener errores de validación
        const validationErrors = Object.values(formState.errors).filter(Boolean);
        const errorMessage = validationErrors.length > 0 
          ? validationErrors.join('\n')
          : 'Por favor complete todos los campos requeridos';
        
        setMessage({ type: 'warning', text: errorMessage });
        return;
      }
    }

    // Filtrar solo los campos válidos según la configuración de la tabla
    const validFields = config?.fields.map(f => f.name) || [];
    const filteredData: Record<string, any> = {};
    
    // Solo incluir campos que están en la configuración
    validFields.forEach(fieldName => {
      if (formState.data[fieldName] !== undefined && formState.data[fieldName] !== null && formState.data[fieldName] !== '') {
        filteredData[fieldName] = formState.data[fieldName];
      }
    });
    
    // Agregar campos de auditoría
    const userId = user?.user_metadata?.usuarioid || 1;
    const now = new Date().toISOString();
    const dataToInsert: Record<string, any> = {
      ...filteredData,
      usercreatedid: userId,
      datecreated: now,
      // Algunas tablas requieren usermodifiedid y datemodified incluso en inserción
      usermodifiedid: userId,
      datemodified: now
    };

    // Para perfil_geografia_permiso, excluir permisoid (se genera automáticamente)
    if (selectedTable === 'perfil_geografia_permiso') {
      delete dataToInsert.permisoid;
    }

    const result = await insertRow(dataToInsert);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro insertado correctamente' });
      resetForm();
      // Cambiar a la pestaña de Estado para ver el nuevo registro
      setActiveSubTab('status');
      onSubTabChange?.('status');
      // Recargar datos para asegurar que se muestre el nuevo registro
      // Recargar tanto los datos de useTableCRUD como los de useTableDataManagement
      loadData();
      if (selectedTable) {
        loadTableData(selectedTable);
      }
      // Recargar datos relacionados si se insertó en una tabla que afecta a otras
      // (ej: perfil afecta a jefeid, usuario afecta a usuarioid, etc.)
      if (['perfil', 'usuario', 'pais', 'empresa', 'fundo', 'ubicacion'].includes(selectedTable)) {
        loadRelatedTablesData();
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al insertar' });
    }
  }, [formState.data, validateForm, insertRow, resetForm, user, loadData, loadTableData, loadRelatedTablesData, selectedTable, onSubTabChange]);

  const handleUpdate = useCallback(async () => {
    if (!selectedRow || !validateForm()) {
      setMessage({ type: 'error', text: 'Por favor complete todos los campos requeridos' });
      return;
    }

    // Filtrar solo los campos válidos según la configuración de la tabla
    const validFields = config?.fields.map(f => f.name) || [];
    const filteredData: Record<string, any> = {};
    
    // Solo incluir campos que están en la configuración
    validFields.forEach(fieldName => {
      if (formState.data[fieldName] !== undefined && formState.data[fieldName] !== null && formState.data[fieldName] !== '') {
        filteredData[fieldName] = formState.data[fieldName];
      }
    });

    // Agregar campos de auditoría
    const dataToUpdate = {
      ...filteredData,
      usermodifiedid: user?.user_metadata?.usuarioid || 1,
      datemodified: new Date().toISOString()
    };

    const pk = getPrimaryKeyValue(selectedRow);
    const result = await updateRow(pk, dataToUpdate);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      setSelectedRow(null);
      setActiveSubTab('status');
      onSubTabChange?.('status');
      // Recargar datos
      loadData();
      if (selectedTable) {
        loadTableData(selectedTable);
      }
      // Recargar datos relacionados si se actualizó en una tabla que afecta a otras
      // (ej: perfil afecta a jefeid, usuario afecta a usuarioid, etc.)
      if (['perfil', 'usuario', 'pais', 'empresa', 'fundo', 'ubicacion'].includes(selectedTable)) {
        loadRelatedTablesData();
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar' });
    }
  }, [selectedRow, formState.data, validateForm, updateRow, getPrimaryKeyValue, user, loadData, loadTableData, loadRelatedTablesData, selectedTable, onSubTabChange]);

  const handleDelete = useCallback(async (row: any) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return;

    const pk = getPrimaryKeyValue(row);
    const result = await deleteRow(pk);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro eliminado correctamente' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al eliminar' });
    }
  }, [deleteRow, getPrimaryKeyValue]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderTableSelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
        Seleccionar Tabla
      </h3>
      <div className="space-y-4">
        {Object.entries(TABLE_CATEGORIES).map(([category, { name, icon }]) => {
          const tables = getTablesByCategory(category as any);
          if (tables.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {icon} {name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {tables.map(table => (
                  <button
                    key={table.name}
                    onClick={() => handleTableSelect(table.name)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTable === table.name
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    }`}
                    title={table.description}
                  >
                    {table.icon} {table.displayName}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );


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
                setActiveSubTab('status');
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

  const renderMassiveOperations = () => {
    if (!config?.allowMassive) return null;

    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚧</div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Operaciones Masivas
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Las operaciones masivas para {config.displayName} estarán disponibles próximamente.
        </p>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
      {/* Selector de tabla */}
      {!selectedTable && renderTableSelector()}

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
              />
            )}
            {activeSubTab === 'insert' && (
              <InsertTab
                tableName={selectedTable}
                formData={formState.data}
                setFormData={(data) => {
                  setFormData(data);
                }}
                updateFormField={(field, value) => {
                  updateFormField(field, value);
                }}
                loading={formState.isSubmitting}
                onInsert={handleInsert}
                onCancel={() => {
                  resetForm();
                  setMessage(null);
                }}
                message={message}
                relatedData={relatedDataForStatus}
                paisSeleccionado={paisSeleccionado}
                empresaSeleccionada={empresaSeleccionada}
                fundoSeleccionado={fundoSeleccionado}
                visibleColumns={uniqueColumns.filter(col => {
                  // Filtrar campos automáticos que no deben aparecer en formularios
                  const excludedFields = ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'];
                  // Solo excluir perfilid si estamos en la tabla 'perfil' (donde es la clave primaria)
                  if (selectedTable === 'perfil' && col.columnName === 'perfilid') {
                    excludedFields.push('perfilid');
                  }
                  return !excludedFields.includes(col.columnName);
                })}
                getColumnDisplayName={(columnName: string) => 
                  getColumnDisplayNameTranslated(columnName, t)
                }
                getUniqueOptionsForField={(columnName: string) => {
                  // Caso especial para jefeid en tabla perfil: mostrar "nivel - perfil"
                  if (columnName === 'jefeid' && selectedTable === 'perfil') {
                    const perfiles = relatedDataForStatus.perfilesData || [];
                    return perfiles
                      .filter((p: any) => p.statusid === 1) // Solo perfiles activos
                      .map((item: any) => ({
                        value: item.perfilid,
                        label: `${item.nivel} - ${item.perfil}` || `ID: ${item.perfilid}`
                      }))
                      .sort((a: any, b: any) => {
                        // Ordenar por nivel ascendente, luego por nombre
                        const nivelA = parseInt(a.label.split(' - ')[0]) || 999;
                        const nivelB = parseInt(b.label.split(' - ')[0]) || 999;
                        if (nivelA !== nivelB) return nivelA - nivelB;
                        return a.label.localeCompare(b.label);
                      });
                  }
                  
                  // Mapeo de campos a tablas relacionadas
                  const fieldToTableMap: Record<string, { table: string; key: string; label: string | string[] }> = {
                    'paisid': { table: 'paisesData', key: 'paisid', label: 'pais' },
                    'empresaid': { table: 'empresasData', key: 'empresaid', label: 'empresa' },
                    'fundoid': { table: 'fundosData', key: 'fundoid', label: 'fundo' },
                    'ubicacionid': { table: 'ubicacionesData', key: 'ubicacionid', label: 'ubicacion' },
                    'localizacionid': { table: 'localizacionesData', key: 'localizacionid', label: 'localizacion' },
                    'entidadid': { table: 'entidadesData', key: 'entidadid', label: 'entidad' },
                    'nodoid': { table: 'nodosData', key: 'nodoid', label: 'nodo' },
                    'tipoid': { table: 'tiposData', key: 'tipoid', label: 'tipo' },
                    'metricaid': { table: 'metricasData', key: 'metricaid', label: 'metrica' },
                    'criticidadid': { table: 'criticidadesData', key: 'criticidadid', label: 'criticidad' },
                    'perfilid': { table: 'perfilesData', key: 'perfilid', label: 'perfil' },
                    'usuarioid': { table: 'userData', key: 'usuarioid', label: ['firstname', 'lastname'] }
                  };

                  const mapping = fieldToTableMap[columnName];
                  if (mapping && relatedDataForStatus[mapping.table as keyof typeof relatedDataForStatus]) {
                    const data = relatedDataForStatus[mapping.table as keyof typeof relatedDataForStatus] as any[];
                    return data.map((item: any) => {
                      let label = '';
                      if (Array.isArray(mapping.label)) {
                        label = mapping.label.map(l => item[l]).filter(Boolean).join(' ');
                      } else {
                        label = item[mapping.label] || '';
                      }
                      return {
                        value: item[mapping.key],
                        label: label || `ID: ${item[mapping.key]}`
                      };
                    });
                  }
                  return [];
                }}
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
                visibleColumns={uniqueColumns.filter(col => {
                  // Filtrar campos automáticos que no deben aparecer en formularios
                  const excludedFields = ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'];
                  // Solo excluir perfilid si estamos en la tabla 'perfil' (donde es la clave primaria)
                  if (selectedTable === 'perfil' && col.columnName === 'perfilid') {
                    excludedFields.push('perfilid');
                  }
                  return !excludedFields.includes(col.columnName);
                })}
                getColumnDisplayName={(columnName: string) => 
                  getColumnDisplayNameTranslated(columnName, t)
                }
                getUniqueOptionsForField={(columnName: string) => {
                  // Caso especial para jefeid en tabla perfil: mostrar "nivel - perfil"
                  if (columnName === 'jefeid' && selectedTable === 'perfil') {
                    const perfiles = relatedDataForStatus.perfilesData || [];
                    return perfiles
                      .filter((p: any) => p.statusid === 1) // Solo perfiles activos
                      .map((item: any) => ({
                        value: item.perfilid,
                        label: `${item.nivel} - ${item.perfil}` || `ID: ${item.perfilid}`
                      }))
                      .sort((a: any, b: any) => {
                        // Ordenar por nivel ascendente, luego por nombre
                        const nivelA = parseInt(a.label.split(' - ')[0]) || 999;
                        const nivelB = parseInt(b.label.split(' - ')[0]) || 999;
                        if (nivelA !== nivelB) return nivelA - nivelB;
                        return a.label.localeCompare(b.label);
                      });
                  }
                  
                  // Mapeo de campos a tablas relacionadas
                  const fieldToTableMap: Record<string, { table: string; key: string; label: string | string[] }> = {
                    'paisid': { table: 'paisesData', key: 'paisid', label: 'pais' },
                    'empresaid': { table: 'empresasData', key: 'empresaid', label: 'empresa' },
                    'fundoid': { table: 'fundosData', key: 'fundoid', label: 'fundo' },
                    'ubicacionid': { table: 'ubicacionesData', key: 'ubicacionid', label: 'ubicacion' },
                    'localizacionid': { table: 'localizacionesData', key: 'localizacionid', label: 'localizacion' },
                    'entidadid': { table: 'entidadesData', key: 'entidadid', label: 'entidad' },
                    'nodoid': { table: 'nodosData', key: 'nodoid', label: 'nodo' },
                    'tipoid': { table: 'tiposData', key: 'tipoid', label: 'tipo' },
                    'metricaid': { table: 'metricasData', key: 'metricaid', label: 'metrica' },
                    'criticidadid': { table: 'criticidadesData', key: 'criticidadid', label: 'criticidad' },
                    'perfilid': { table: 'perfilesData', key: 'perfilid', label: 'perfil' },
                    'usuarioid': { table: 'userData', key: 'usuarioid', label: ['firstname', 'lastname'] }
                  };

                  const mapping = fieldToTableMap[columnName];
                  if (mapping && relatedDataForStatus[mapping.table as keyof typeof relatedDataForStatus]) {
                    const data = relatedDataForStatus[mapping.table as keyof typeof relatedDataForStatus] as any[];
                    return data.map((item: any) => {
                      let label = '';
                      if (Array.isArray(mapping.label)) {
                        label = mapping.label.map(l => item[l]).filter(Boolean).join(' ');
                      } else {
                        label = item[mapping.label] || '';
                      }
                      return {
                        value: item[mapping.key],
                        label: label || `ID: ${item[mapping.key]}`
                      };
                    });
                  }
                  return [];
                }}
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
            {activeSubTab === 'massive' && renderMassiveOperations()}
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

