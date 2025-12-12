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
      logger.debug('Columnas originales para perfil:', columns.map(c => c.columnName));
      logger.debug('Total de columnas:', columns.length);
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
      
      filtered.push(col);
    }
    
    // Debug: mostrar columnas únicas para la tabla perfil
    if (selectedTable === 'perfil') {
      logger.debug('Columnas únicas para perfil:', filtered.map(c => c.columnName));
      logger.debug('Total de columnas únicas:', filtered.length);
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

  // Hook de sincronización
  useSystemParametersSync({
    propSelectedTable,
    propActiveSubTab,
    selectedTable,
    activeSubTab,
    formState,
    setSelectedTable,
    setActiveSubTab,
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
    loadRelatedData
  });

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
    setActiveSubTab,
    onSubTabChange
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
                getUniqueOptionsForField={getUniqueOptionsForFieldHelper}
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

