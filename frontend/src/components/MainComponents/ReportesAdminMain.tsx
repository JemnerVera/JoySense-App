/**
 * ReportesAdminMain - Componente principal para REPORTES ADMINISTRADOR
 * Solo muestra ESTADO (modo solo lectura)
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTableDataManagement } from '../../hooks/useTableDataManagement';
import { getTableConfig } from '../../config/tables.config';
import { TableName } from '../../types';
import { LoadingSpinner } from '../SystemParameters/LoadingSpinner';
import { MessageDisplay } from '../SystemParameters/MessageDisplay';
import { StatusTab } from '../SystemParameters/StatusTab/StatusTab';
import { logger } from '../../utils/logger';

interface ReportesAdminMainProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
  themeColor?: 'orange';
}

export interface ReportesAdminMainRef {
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  handleTableChange: (table: string) => void;
}

interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

const ReportesAdminMain = forwardRef<ReportesAdminMainRef, ReportesAdminMainProps>(({
  selectedTable: propSelectedTable,
  onTableSelect,
  activeSubTab: propActiveSubTab = 'status',
  onSubTabChange,
  onFormDataChange,
  themeColor = 'orange'
}, ref) => {
  const { t } = useLanguage();

  // Estado local
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
  const [message, setMessage] = useState<Message | null>(null);

  // Sincronizar con prop
  useEffect(() => {
    if (propSelectedTable) {
      setSelectedTable(propSelectedTable);
    }
  }, [propSelectedTable]);

  // Forzar activeSubTab a 'status' siempre (modo solo lectura)
  useEffect(() => {
    if (propActiveSubTab !== 'status' && onSubTabChange) {
      onSubTabChange('status');
    }
  }, [propActiveSubTab, onSubTabChange]);

  // Obtener configuración de la tabla
  const config = selectedTable ? getTableConfig(selectedTable as TableName) : undefined;

  // Hook para gestión de datos
  const {
    tableData,
    columns,
    loading: tableDataLoading,
    userData,
    paisesData,
    empresasData,
    fundosData,
    ubicacionesData,
    localizacionesData,
    nodosData,
    tiposData,
    metricasData,
    criticidadesData,
    perfilesData,
    umbralesData,
    reglasData,
    sensorsData,
    metricasensorData,
    contactosData,
    origenesData,
    fuentesData,
    correosData,
    codigotelefonosData,
    canalesData,
    loadTableData,
    loadRelatedTablesData
  } = useTableDataManagement();

  // Cargar datos relacionados al montar
  useEffect(() => {
    loadRelatedTablesData();
  }, [loadRelatedTablesData]);

  // Cargar datos de la tabla cuando cambia
  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable, loadTableData]);

  // Preparar relatedData para StatusTab (usar nombres de propiedades que espera RelatedData)
  const relatedDataForStatus = {
    paisesData: paisesData,
    empresasData: empresasData,
    fundosData: fundosData,
    ubicacionesData: ubicacionesData,
    localizacionesData: localizacionesData,
    entidadesData: [],
    nodosData: nodosData,
    tiposData: tiposData,
    metricasData: metricasData,
    criticidadesData: criticidadesData,
    perfilesData: perfilesData,
    umbralesData: umbralesData,
    reglasData: reglasData,
    sensorsData: sensorsData,
    userData: userData,
    origenesData: origenesData,
    fuentesData: fuentesData
  };

  // Handlers
  const handleTableSelect = useCallback((table: string) => {
    setSelectedTable(table);
    setMessage(null);
    if (onTableSelect) {
      onTableSelect(table);
    }
  }, [onTableSelect]);

  const handleRowSelect = useCallback((row: any) => {
    // En modo solo lectura, no hacemos nada al hacer click en una fila
    logger.info('[ReportesAdminMain] Row clicked (read-only mode):', row);
  }, []);

  // Exponer métodos al ref
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => false, // Siempre false en modo solo lectura
    handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => {
      // Solo permitir 'status'
      if (tab === 'status' && onSubTabChange) {
        onSubTabChange('status');
      }
    },
    handleTableChange: (table: string) => {
      handleTableSelect(table);
    }
  }), [handleTableSelect, onSubTabChange]);

  // Si no hay tabla seleccionada, mostrar mensaje
  if (!selectedTable) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">REPORTES ADMINISTRADOR</h2>
            <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay configuración, mostrar error
  if (!config) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500 mb-4 font-mono tracking-wider">ERROR</h2>
          <p className="text-gray-600 dark:text-neutral-400 font-mono">
            No se encontró configuración para la tabla: {selectedTable}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
      {/* Mensaje */}
      {message && (
        <MessageDisplay message={message} />
      )}

      {/* Contenido - Solo ESTADO (modo solo lectura) */}
      <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-6">
        <StatusTab
          tableName={selectedTable}
          tableData={tableData}
          columns={columns}
          relatedData={relatedDataForStatus}
          userData={userData || []}
          loading={tableDataLoading}
          themeColor={themeColor}
        />
      </div>
    </div>
  );
});

ReportesAdminMain.displayName = 'ReportesAdminMain';

export default ReportesAdminMain;

