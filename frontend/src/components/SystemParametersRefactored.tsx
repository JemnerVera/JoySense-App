import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';
import { JoySenseService } from '../services/backend-api';
import { TableInfo, ColumnInfo, Message } from '../types/systemParameters';
import { STYLES_CONFIG } from '../config/styles';

// Hooks personalizados
import { useFormValidation } from '../hooks/useFormValidation';
import { useProgressiveEnablement } from '../hooks/useProgressiveEnablement';
import { useSystemParametersState } from '../hooks/useSystemParametersState';
import { useTableData } from '../hooks/useTableData';
import { useFormState } from '../hooks/useFormState';
import { useInsertOperations } from '../hooks/useInsertOperations';
import { useUpdateOperations } from '../hooks/useUpdateOperations';
import { useSearchOperations } from '../hooks/useSearchOperations';
import { useSystemParametersCRUD } from '../hooks/useSystemParametersCRUD';
import { useFormRendering } from '../hooks/useFormRendering';
import { useTableRendering } from '../hooks/useTableRendering';
import { useGlobalFilterEffect } from '../hooks/useGlobalFilterEffect';

// Componentes reutilizables
// import { ParameterForm, ParameterTable, MassiveOperations, NotificationSystem, useNotifications } from './SystemParameters/';

// Componentes existentes que se mantienen
import SimpleModal from './SimpleModal';
import { useSimpleModal } from '../hooks/useSimpleModal';
import { hasSignificantChanges } from '../utils/changeDetection';
import LostDataModal from './LostDataModal';
import ReplicateModal from './ReplicateModal';
import ReplicateButton from './ReplicateButton';
import { useReplicate } from '../hooks/useReplicate';
import { useInsertionMessages } from '../hooks/useInsertionMessages';
import InsertionMessage from './InsertionMessage';

// Formularios especializados
import MultipleSensorForm from './MultipleSensorForm';
import MultipleMetricaSensorForm from './MultipleMetricaSensorForm';
import MultipleUsuarioPerfilForm from './MultipleUsuarioPerfilForm';
import { MassiveSensorForm } from './MassiveSensorForm';
import { MassiveUmbralForm } from './MassiveUmbralForm';
import { MassiveMetricaSensorForm } from './MassiveMetricaSensorForm';
import { AdvancedUsuarioPerfilUpdateForm } from './AdvancedUsuarioPerfilUpdateForm';
import MultipleLocalizacionForm from './MultipleLocalizacionForm';
import NormalInsertForm from './NormalInsertForm';
import { AdvancedMetricaSensorUpdateForm } from './AdvancedMetricaSensorUpdateForm';
import { AdvancedSensorUpdateForm } from './AdvancedSensorUpdateForm';

export interface SystemParametersRefactoredProps {
  onDataChange?: (data: any) => void;
}

export interface SystemParametersRefactoredRef {
  refreshData: () => void;
  getCurrentData: () => any;
}

/**
 * Componente SystemParameters refactorizado
 * Utiliza hooks personalizados y componentes reutilizables para mejorar la modularidad
 */
export const SystemParametersRefactored = forwardRef<SystemParametersRefactoredRef, SystemParametersRefactoredProps>(
  ({ onDataChange }, ref) => {
    
    const { user } = useAuth();
    const filterContext = useFilters();
    const globalFilters = (filterContext as any)?.globalFilters || {};
    
    // Estado local simplificado
    const [selectedTable, setSelectedTable] = useState<string>('pais');
    const [activeSubTab, setActiveSubTab] = useState<'insert' | 'update' | 'status' | 'massive'>('insert');
    const [updateFormData, setUpdateFormData] = useState<Record<string, any>>({});
    const [selectedRowForUpdate, setSelectedRowForUpdate] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Estado de datos de tabla
    const [tableData, setTableData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const refreshData = useCallback(async () => {
      setIsLoading(true);
      try {
        const data = await JoySenseService.getTableData(selectedTable);
        setTableData(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    }, [selectedTable]);

    // Estado de operaciones CRUD
    const [isProcessing, setIsProcessing] = useState(false);
    const [operationError, setOperationError] = useState<string | null>(null);
    
    const handleInsert = useCallback(async (table: string, data: Record<string, any>) => {
      setIsProcessing(true);
      try {
        const result = await JoySenseService.insertTableRow(table, data);
        return { success: true, message: 'Datos insertados correctamente' };
      } catch (error) {
        return { success: false, error: 'Error al insertar datos' };
      } finally {
        setIsProcessing(false);
      }
    }, []);
    
    const handleUpdate = useCallback(async (table: string, data: Record<string, any>, originalData: Record<string, any>) => {
      setIsProcessing(true);
      try {
        const id = originalData.id || originalData[`${table}id`];
        const result = await JoySenseService.updateTableRow(table, String(id), data);
        return { success: true, message: 'Datos actualizados correctamente' };
      } catch (error) {
        return { success: false, error: 'Error al actualizar datos' };
      } finally {
        setIsProcessing(false);
      }
    }, []);
    
    const handleDelete = useCallback(async (table: string, id: number) => {
      setIsProcessing(true);
      try {
        await JoySenseService.deleteTableRow(table, String(id));
        return { success: true, message: 'Datos eliminados correctamente' };
      } catch (error) {
        return { success: false, error: 'Error al eliminar datos' };
      } finally {
        setIsProcessing(false);
      }
    }, []);

    // Estado de renderizado
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const filteredData = useMemo(() => {
      if (!searchTerm) return tableData;
      return tableData.filter((item: any) => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }, [tableData, searchTerm]);
    
    const paginatedData = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Estado de notificaciones
    const [notifications, setNotifications] = useState<any[]>([]);
    
    const showSuccess = useCallback((title: string, message: string) => {
      const notification = { id: Date.now(), type: 'success', title, message };
      setNotifications(prev => [...prev, notification]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }, []);
    
    const showError = useCallback((title: string, message: string) => {
      const notification = { id: Date.now(), type: 'error', title, message };
      setNotifications(prev => [...prev, notification]);
    }, []);
    
    const removeNotification = useCallback((id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const clearAllNotifications = useCallback(() => {
      setNotifications([]);
    }, []);

    // Funciones de formulario
    const resetForm = useCallback(() => {
      setFormData({});
      setUpdateFormData({});
    }, []);

    // Estado de operaciones simplificado
    const [isInserting, setIsInserting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Estado de modales
    const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    
    const openSimpleModal = useCallback((content: any) => {
      setModalContent(content);
      setIsSimpleModalOpen(true);
    }, []);
    
    const closeSimpleModal = useCallback(() => {
      setIsSimpleModalOpen(false);
      setModalContent(null);
    }, []);
    
    const clearMessages = useCallback(() => {
      setMessages([]);
    }, []);

    // Efecto para cargar datos cuando cambia la tabla
    useEffect(() => {
      refreshData();
    }, [selectedTable, refreshData]);

    // Obtener datos de la tabla actual
    const getCurrentTableData = useCallback(() => {
      return tableData;
    }, [tableData]);

    // Obtener columnas de la tabla actual
    const getCurrentTableColumns = useCallback(() => {
      if (tableData.length === 0) return [];
      const firstRow = tableData[0];
      return Object.keys(firstRow).map(key => ({
        key,
        label: key.toUpperCase(),
        type: 'text' as const,
        sortable: true
      }));
    }, [tableData]);

    // Manejar cambio de tabla
    const handleTableChange = useCallback((table: string) => {
      setSelectedTable(table);
      resetForm();
    }, [resetForm]);

    // Manejar cambio de sub-tab
    const handleSubTabChange = useCallback((subTab: 'insert' | 'update' | 'status' | 'massive') => {
      setActiveSubTab(subTab);
      resetForm();
    }, [resetForm]);

    // Manejar inserción de datos
    const handleInsertData = useCallback(async (data: Record<string, any>) => {
      try {
        const result = await handleInsert(selectedTable, data);
        if (result.success) {
          showSuccess('Éxito', result.message || 'Datos insertados correctamente');
          refreshData();
          resetForm();
        } else {
          showError('Error', result.error || 'Error al insertar datos');
        }
      } catch (error) {
        showError('Error', 'Error inesperado al insertar datos');
      }
    }, [selectedTable, handleInsert, showSuccess, showError, refreshData, resetForm]);

    // Manejar actualización de datos
    const handleUpdateData = useCallback(async (data: Record<string, any>, originalData: Record<string, any>) => {
      try {
        const result = await handleUpdate(selectedTable, data, originalData);
        if (result.success) {
          showSuccess('Éxito', result.message || 'Datos actualizados correctamente');
          refreshData();
          resetForm();
        } else {
          showError('Error', result.error || 'Error al actualizar datos');
        }
      } catch (error) {
        showError('Error', 'Error inesperado al actualizar datos');
      }
    }, [selectedTable, handleUpdate, showSuccess, showError, refreshData, resetForm]);

    // Manejar eliminación de datos
    const handleDeleteData = useCallback(async (recordId: number) => {
      try {
        const result = await handleDelete(selectedTable, recordId);
        if (result.success) {
          showSuccess('Éxito', result.message || 'Datos eliminados correctamente');
          refreshData();
        } else {
          showError('Error', result.error || 'Error al eliminar datos');
        }
      } catch (error) {
        showError('Error', 'Error inesperado al eliminar datos');
      }
    }, [selectedTable, handleDelete, showSuccess, showError, refreshData]);

    // Manejar selección de fila para actualización
    const handleRowSelect = useCallback((row: any) => {
      setSelectedRowForUpdate(row);
      setUpdateFormData(row);
      setActiveSubTab('update');
    }, []);

    // Manejar operaciones masivas
    const handleMassiveOperation = useCallback((operationType: 'insert' | 'update') => {
      setActiveSubTab('massive');
    }, []);

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      refreshData,
      getCurrentData: getCurrentTableData
    }), [refreshData, getCurrentTableData]);

    // Renderizar formulario según la tabla seleccionada
    const renderForm = () => {
      if (activeSubTab === 'insert') {
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Formulario de Inserción</h3>
            <p className="text-gray-600">Componente ParameterForm en desarrollo...</p>
          </div>
        );
      }

      if (activeSubTab === 'update' && selectedRowForUpdate) {
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Formulario de Actualización</h3>
            <p className="text-gray-600">Componente ParameterForm en desarrollo...</p>
          </div>
        );
      }

      if (activeSubTab === 'massive') {
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Operaciones Masivas</h3>
            <p className="text-gray-600">Componente MassiveOperations en desarrollo...</p>
          </div>
        );
      }

      return null;
    };

    // Renderizar tabla
    const renderTable = () => {
      if (activeSubTab === 'status') {
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Tabla de Estado</h3>
            <p className="text-gray-600">Componente ParameterTable en desarrollo...</p>
          </div>
        );
      }

      return null;
    };

    // Renderizar pestañas
    const renderTabs = () => {
      const tabs = [
        { id: 'insert', label: 'Crear', icon: '➕' },
        { id: 'update', label: 'Actualizar', icon: '✏️' },
        { id: 'status', label: 'Estado', icon: '📊' },
        { id: 'massive', label: 'Masivo', icon: '📦' }
      ];

      return (
        <div className="flex space-x-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id as 'insert' | 'update' | 'status' | 'massive')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      );
    };

    // Renderizar selector de tabla
    const renderTableSelector = () => {
      const tables = [
        { id: 'pais', label: 'País', icon: '🌍' },
        { id: 'empresa', label: 'Empresa', icon: '🏢' },
        { id: 'fundo', label: 'Fundo', icon: '🏞️' },
        { id: 'ubicacion', label: 'Ubicación', icon: '📍' },
        { id: 'localizacion', label: 'Localización', icon: '🗺️' },
        { id: 'entidad', label: 'Entidad', icon: '🏛️' },
        { id: 'tipo', label: 'Tipo', icon: '🏷️' },
        { id: 'nodo', label: 'Nodo', icon: '🔗' },
        { id: 'metrica', label: 'Métrica', icon: '📏' },
        { id: 'umbral', label: 'Umbral', icon: '⚖️' },
        { id: 'perfilumbral', label: 'Perfil Umbral', icon: '👤' },
        { id: 'criticidad', label: 'Criticidad', icon: '⚠️' },
        { id: 'medio', label: 'Medio', icon: '📱' },
        { id: 'contacto', label: 'Contacto', icon: '📞' },
        { id: 'usuario', label: 'Usuario', icon: '👤' },
        { id: 'perfil', label: 'Perfil', icon: '🎭' },
        { id: 'usuarioperfil', label: 'Usuario Perfil', icon: '🔗' }
      ];

      return (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parámetros del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleTableChange(table.id)}
                className={`p-4 text-left rounded-lg border-2 transition-all ${
                  selectedTable === table.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{table.icon}</span>
                  <span className="font-medium">{table.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    };

    if (!user) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Debes iniciar sesión para acceder a los parámetros del sistema.</p>
        </div>
      );
    }

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Sistema de notificaciones */}
        <div className="mb-4">
          <p className="text-gray-600">Sistema de notificaciones en desarrollo...</p>
        </div>

        {/* Selector de tabla */}
        {renderTableSelector()}

        {/* Pestañas */}
        {selectedTable && renderTabs()}

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600">
              <p>Error al cargar los datos: {error}</p>
              <button
                onClick={refreshData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {renderForm()}
              {renderTable()}
            </>
          )}
        </div>

        {/* Modales */}
        {isSimpleModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalContent?.title || 'Confirmación'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {modalContent?.message || '¿Estás seguro?'}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeSimpleModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    modalContent?.onConfirm?.();
                    closeSimpleModal();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SystemParametersRefactored.displayName = 'SystemParametersRefactored';

export default SystemParametersRefactored;
