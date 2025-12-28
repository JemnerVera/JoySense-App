/**
 * Componente principal para la pestaña de Actualizar
 * Orquesta tabla de selección y formulario modal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUpdateTable } from '../../../hooks/useUpdateTable';
import { useUpdateForm } from '../../../hooks/useUpdateForm';
import { SearchBarWithCounter } from '../SearchBarWithCounter';
import { LoadingSpinner } from '../LoadingSpinner';
import { PaginationControls } from '../PaginationControls';
import { UpdateTableMemo as UpdateTable } from './UpdateTable';
import { NormalUpdateForm } from './forms/NormalUpdateForm';
import { MessageDisplay } from '../MessageDisplay';
import { useModal } from '../../../contexts/ModalContext';
import { consolidateErrorMessages } from '../../../utils/messageConsolidation';
import type { ColumnInfo } from '../../../types/systemParameters';
import type { RelatedData } from '../../../utils/systemParametersUtils';
import type { TableConfig } from '../../../config/tables.config';

interface UpdateTabProps {
  tableName: string;
  tableData: any[];
  columns: ColumnInfo[];
  relatedData: RelatedData;
  config: TableConfig | null;
  updateRow: (id: string | Record<string, any>, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  getPrimaryKeyValue: (row: any) => string | Record<string, any>;
  user: any;
  loading?: boolean;
  visibleColumns?: any[];
  getColumnDisplayName?: (columnName: string) => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  existingData?: any[];
  onUpdateSuccess?: () => void;
  setMessage?: (message: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
  onFormDataChange?: (formData: Record<string, any>) => void;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple';
}

export const UpdateTab: React.FC<UpdateTabProps> = ({
  tableName,
  tableData,
  columns,
  relatedData,
  config,
  updateRow,
  getPrimaryKeyValue,
  user,
  loading = false,
  visibleColumns = [],
  getColumnDisplayName,
  getUniqueOptionsForField,
  existingData = [],
  onUpdateSuccess,
  setMessage,
  onFormDataChange,
  themeColor = 'orange'
}) => {
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<Record<string, any>>({});
  const { showModal } = useModal();

  // Hook para tabla
  const {
    filteredData,
    paginatedData,
    visibleColumns: tableVisibleColumns,
    currentPage,
    totalPages,
    handlePageChange,
    searchTerm,
    handleSearchChange,
    hasSearched
  } = useUpdateTable({
    tableName,
    tableData,
    columns,
    relatedData,
    itemsPerPage: 10
  });

  // Hook para formulario
  const {
    formData,
    formErrors,
    isSubmitting,
    updateFormField,
    handleUpdate,
    handleCancel,
    validateForm
  } = useUpdateForm({
    selectedRow,
    tableName,
    config,
    updateRow,
    getPrimaryKeyValue,
    user,
    existingData,
    onSuccess: () => {
      setSelectedRow(null);
      setShowForm(false);
      setOriginalFormData({});
      if (setMessage) {
        setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      }
      onUpdateSuccess?.();
    },
    onCancel: () => {
      setSelectedRow(null);
      setShowForm(false);
      setOriginalFormData({});
    }
  });

  // Cuando se selecciona una fila, mostrar botones pero no el formulario aún
  const handleRowSelect = (row: any) => {
    setSelectedRow(row);
    setShowForm(false); // No mostrar formulario hasta que se haga click en "Actualizar"
    setOriginalFormData({}); // Limpiar datos originales al cambiar de fila
  };

  // Cuando se hace click en "Actualizar", mostrar el formulario
  const handleGoToUpdate = () => {
    if (selectedRow) {
      setShowForm(true);
    }
  };

  // Guardar datos originales cuando se abre el formulario
  useEffect(() => {
    if (showForm && selectedRow && Object.keys(formData).length > 0 && Object.keys(originalFormData).length === 0) {
      // Guardar una copia profunda de los datos originales
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
    }
  }, [showForm, selectedRow, formData, originalFormData]);

  // Función helper para detectar cambios reales
  const hasRealChanges = useCallback((): boolean => {
    if (!showForm || Object.keys(originalFormData).length === 0) {
      return false;
    }
    
    return Object.keys(formData).some(key => {
      // Excluir campos de auditoría
      if (['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(key)) {
        return false;
      }
      const currentValue = formData[key];
      const originalValue = originalFormData[key];
      
      // Comparar valores (manejar null/undefined)
      if (currentValue === originalValue) return false;
      if (currentValue == null && originalValue == null) return false;
      
      // Comparar números y strings
      if (typeof currentValue === 'number' && typeof originalValue === 'number') {
        return currentValue !== originalValue;
      }
      
      // Comparar strings (trim para ignorar espacios)
      const currentStr = String(currentValue || '').trim();
      const originalStr = String(originalValue || '').trim();
      return currentStr !== originalStr;
    });
  }, [showForm, formData, originalFormData]);

  // Cuando se cancela, limpiar selección
  const handleCancelSelection = () => {
    // Verificar si hay cambios antes de cancelar (solo si estamos en el formulario)
    if (showForm) {
      if (hasRealChanges()) {
        // Mostrar modal de confirmación
        showModal(
          'subtab',
          'Actualizar',
          'Estado',
          () => {
            // Confirmar: limpiar y cancelar
            setSelectedRow(null);
            setShowForm(false);
            setOriginalFormData({});
            handleCancel();
          },
          () => {
            // Cancelar: no hacer nada
          }
        );
        return;
      }
    }
    
    // No hay cambios, proceder normalmente
    setSelectedRow(null);
    setShowForm(false);
    setOriginalFormData({});
    handleCancel();
  };

  // Notificar cambios en formData al componente padre (para protección de datos)
  const prevFormDataRef = useRef<string>('');
  const onFormDataChangeRef = useRef(onFormDataChange);
  const hasChangesRef = useRef<boolean>(false);
  
  // Actualizar el ref cuando cambie la función
  useEffect(() => {
    onFormDataChangeRef.current = onFormDataChange;
  }, [onFormDataChange]);
  
  useEffect(() => {
    // Solo notificar si estamos en el formulario (showForm) y hay datos
    if (showForm && selectedRow && Object.keys(formData).length > 0 && Object.keys(originalFormData).length > 0) {
      // Usar la función helper para detectar cambios
      const hasChanges = hasRealChanges();
      hasChangesRef.current = hasChanges;
      
      // Notificar siempre que el formulario esté abierto y haya datos
      // Esto asegura que updateFormData se mantenga actualizado para la detección de cambios
      // Notificar con formData si hay cambios, o con un objeto especial si no hay cambios pero el formulario está abierto
      const formDataString = JSON.stringify(formData);
      
      if (formDataString !== prevFormDataRef.current || hasChanges) {
        // Notificar con formData si hay cambios, o con un objeto especial si no hay cambios pero el formulario está abierto
        if (onFormDataChangeRef.current) {
          if (hasChanges) {
            onFormDataChangeRef.current(formData);
          } else {
            // Notificar con un objeto especial que indique que el formulario está abierto pero sin cambios
            // Esto permite que SystemParameters sepa que debe verificar si hay cambios
            onFormDataChangeRef.current({ __formOpen: true, __hasChanges: false });
          }
        }
        prevFormDataRef.current = formDataString;
      }
    } else {
      // Limpiar cuando no hay formulario visible
      hasChangesRef.current = false;
      prevFormDataRef.current = '';
      if (onFormDataChangeRef.current) {
        onFormDataChangeRef.current({});
      }
    }
  }, [formData, showForm, selectedRow, originalFormData, hasRealChanges]);

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
      {loading ? (
        <LoadingSpinner message="Cargando datos..." />
      ) : showForm && selectedRow ? (
        // Mostrar formulario inline (no modal)
        <div className="space-y-4">
          {/* Mensaje de warning/error (amarillo) */}
          {(() => {
            // Verificar si hay errores de validación para mostrar warning
            const hasValidationErrors = Object.keys(formErrors).length > 0 && !formErrors.general;
            if (hasValidationErrors) {
              const errorMessages = Object.values(formErrors).filter(Boolean);
              if (errorMessages.length > 0) {
                // Consolidar mensajes similares
                const consolidatedErrors = consolidateErrorMessages(errorMessages);
                return (
                  <MessageDisplay 
                    message={{ 
                      type: 'warning', 
                      text: consolidatedErrors.join('\n') || 'Por favor complete todos los campos requeridos' 
                    }} 
                  />
                );
              }
            }
            return null;
          })()}

          {/* Mensaje de error general (convertir a warning) */}
          {formErrors.general && (
            <MessageDisplay 
              message={{ type: 'warning', text: formErrors.general }} 
            />
          )}

          {/* Formulario */}
          <NormalUpdateForm
              config={config}
              formData={formData}
              formErrors={formErrors}
              updateFormField={updateFormField}
              relatedData={relatedData}
              visibleColumns={visibleColumns}
              getColumnDisplayName={getColumnDisplayName}
              getUniqueOptionsForField={getUniqueOptionsForField}
              tableName={tableName}
              themeColor={themeColor}
            />

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mt-6">
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono tracking-wider ${
                themeColor === 'red' 
                  ? 'bg-red-500 hover:bg-red-600'
                  : themeColor === 'blue'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : themeColor === 'green'
                  ? 'bg-green-500 hover:bg-green-600'
                  : themeColor === 'purple'
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {isSubmitting ? 'Guardando...' : '🔧 Actualizar'}
            </button>
            <button
              onClick={handleCancelSelection}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-mono tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {!loading && columns.length > 0 && tableVisibleColumns.length > 0 ? (
            <>
              {/* Botones de acción cuando hay fila seleccionada */}
              {selectedRow && (
                <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={handleGoToUpdate}
                    className={`px-6 py-2 text-white rounded-lg transition-colors font-mono tracking-wider ${
                      themeColor === 'red' 
                        ? 'bg-red-500 hover:bg-red-600'
                        : themeColor === 'blue'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : themeColor === 'green'
                        ? 'bg-green-500 hover:bg-green-600'
                        : themeColor === 'purple'
                        ? 'bg-purple-500 hover:bg-purple-600'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    🔧 Actualizar
                  </button>
                  <button
                    onClick={handleCancelSelection}
                    className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-mono tracking-wider"
                  >
                    🗑️ Cancelar
                  </button>
                </div>
              )}

              {/* Barra de búsqueda */}
              <SearchBarWithCounter
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                filteredCount={filteredData.length}
                totalCount={tableData.length}
              />

              {/* Tabla con datos - Solo renderizar cuando está listo */}
              <UpdateTable
                data={paginatedData}
                columns={tableVisibleColumns}
                relatedData={relatedData}
                selectedRow={selectedRow}
                onRowClick={handleRowSelect}
                loading={false}
                themeColor={themeColor}
                tableName={tableName}
              />

              {/* Paginación */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showPagination={totalPages > 1}
              />
            </>
          ) : (
            <LoadingSpinner message={columns.length === 0 ? "Cargando columnas..." : "Cargando datos..."} />
          )}
        </>
      )}
    </div>
  );
};
