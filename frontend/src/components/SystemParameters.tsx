/**
 * SystemParameters - Componente principal para administración de parámetros del sistema
 * Versión simplificada usando configuración centralizada
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// Config & Types
import { TABLES_CONFIG, getTableConfig, getTablesByCategory, TABLE_CATEGORIES, TableConfig } from '../config/tables.config';
import { TableName } from '../types';

// Hooks
import { useTableCRUD } from '../hooks/useTableCRUD';

// Components
import { LoadingSpinner } from './SystemParameters/LoadingSpinner';
import { MessageDisplay } from './SystemParameters/MessageDisplay';
import { PaginationControls } from './SystemParameters/PaginationControls';
import { SearchBarWithCounter } from './SystemParameters/SearchBarWithCounter';

// ============================================================================
// INTERFACES
// ============================================================================

interface SystemParametersProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
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
  onSubTabChange
}, ref) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Estado local
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update' | 'massive'>(propActiveSubTab);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // Hook CRUD
  const {
    tableState,
    formState,
    relatedData,
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

  // Sync con props
  useEffect(() => {
    if (propSelectedTable && propSelectedTable !== selectedTable) {
      setSelectedTable(propSelectedTable);
    }
  }, [propSelectedTable]);

  useEffect(() => {
    if (propActiveSubTab && propActiveSubTab !== activeSubTab) {
      setActiveSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab]);

  // Cargar datos cuando cambia la tabla
  useEffect(() => {
    if (selectedTable) {
      loadData();
      loadRelatedData();
      setMessage(null);
      setSelectedRow(null);
      resetForm();
    }
  }, [selectedTable]);

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
    setSelectedTable(table);
    onTableSelect?.(table);
    setActiveSubTab('status');
    onSubTabChange?.('status');
  }, [onTableSelect, onSubTabChange]);

  const handleSubTabChange = useCallback((tab: 'status' | 'insert' | 'update' | 'massive') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
    setMessage(null);
    if (tab === 'insert') resetForm();
  }, [onSubTabChange, resetForm]);

  const handleRowSelect = useCallback((row: any) => {
    setSelectedRow(row);
    setFormData(row);
    setActiveSubTab('update');
    onSubTabChange?.('update');
  }, [setFormData, onSubTabChange]);

  const handleInsert = useCallback(async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Por favor complete todos los campos requeridos' });
      return;
    }

    // Agregar campos de auditoría
    const dataToInsert = {
      ...formState.data,
      usercreatedid: user?.user_metadata?.usuarioid || 1,
      datecreated: new Date().toISOString()
    };

    const result = await insertRow(dataToInsert);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro insertado correctamente' });
      resetForm();
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al insertar' });
    }
  }, [formState.data, validateForm, insertRow, resetForm, user]);

  const handleUpdate = useCallback(async () => {
    if (!selectedRow || !validateForm()) {
      setMessage({ type: 'error', text: 'Por favor complete todos los campos requeridos' });
      return;
    }

    // Agregar campos de auditoría
    const dataToUpdate = {
      ...formState.data,
      usermodifiedid: user?.user_metadata?.usuarioid || 1,
      datemodified: new Date().toISOString()
    };

    const pk = getPrimaryKeyValue(selectedRow);
    const result = await updateRow(pk, dataToUpdate);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      setSelectedRow(null);
      setActiveSubTab('status');
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar' });
    }
  }, [selectedRow, formState.data, validateForm, updateRow, getPrimaryKeyValue, user]);

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

  const renderSubTabs = () => {
    if (!config) return null;

    const tabs = [
      { id: 'status', label: 'Ver Datos', show: true },
      { id: 'insert', label: 'Insertar', show: config.allowInsert },
      { id: 'update', label: 'Actualizar', show: config.allowUpdate && selectedRow },
      { id: 'massive', label: 'Masivo', show: config.allowMassive }
    ].filter(tab => tab.show);

    return (
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-neutral-700 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleSubTabChange(tab.id as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              activeSubTab === tab.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

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
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {mode === 'insert' ? 'Nuevo Registro' : 'Actualizar Registro'}
        </h3>

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
                  {(relatedData[field.foreignKey.table] || []).map((item: any) => {
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-orange-500 font-mono tracking-wider mb-2">
          PARÁMETROS DEL SISTEMA
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Administración de tablas y datos del sistema JoySense
        </p>
      </div>

      {/* Selector de tabla */}
      {!selectedTable && renderTableSelector()}

      {/* Contenido de la tabla seleccionada */}
      {selectedTable && config && (
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <button
              onClick={() => handleTableSelect('')}
              className="text-orange-500 hover:text-orange-600"
            >
              Tablas
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {config.icon} {config.displayName}
            </span>
          </div>

          {/* Mensaje */}
          {message && (
            <MessageDisplay message={message} />
          )}

          {/* Sub-tabs */}
          {renderSubTabs()}

          {/* Contenido según tab activa */}
          <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-6">
            {activeSubTab === 'status' && renderDataTable()}
            {activeSubTab === 'insert' && renderForm('insert')}
            {activeSubTab === 'update' && renderForm('update')}
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

