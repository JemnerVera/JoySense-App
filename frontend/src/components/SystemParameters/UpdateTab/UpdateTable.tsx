/**
 * Componente para renderizar la tabla de selección en el tab Actualizar
 * Similar a StatusTable pero con funcionalidad de selección de filas
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated, getDisplayValue, getUserName, formatDate } from '../../../utils/systemParametersUtils';
import type { ColumnInfo } from '../../../types/systemParameters';
import type { RelatedData } from '../../../utils/systemParametersUtils';

interface UpdateTableProps {
  data: any[];
  columns: ColumnInfo[];
  relatedData: RelatedData;
  selectedRow: any | null;
  onRowClick: (row: any) => void;
  loading?: boolean;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple';
  tableName?: string;
}

export const UpdateTable: React.FC<UpdateTableProps> = ({
  data,
  columns,
  relatedData,
  selectedRow,
  onRowClick,
  loading = false,
  themeColor = 'orange',
  tableName
}) => {
  const { t } = useLanguage();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = useCallback((rowKey: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  }, []);

  const getRowKey = useCallback((row: any) => {
    // Usar la lógica estándar basada en la configuración de la tabla
    return row.usuarioid || row.login || row.nodoid || row.tipoid || 'default';
  }, [tableName]);

  // Memoizar userData para evitar re-renders innecesarios
  const userData = useMemo(() => relatedData.userData || [], [relatedData.userData]);

  // Función para determinar si una fila está seleccionada
  const isRowSelected = useCallback((row: any): boolean => {
    if (!selectedRow) return false;
    
    // Comparar por múltiples campos (lógica estándar)
    const rowKeys = [
      row.paisid,
      row.empresaid,
      row.fundoid,
      row.usuarioid,
      row.nodoid,
      row.tipoid,
      row.sensorid,
      row.metricaid,
      row.umbralid,
      row.perfilid,
      row.contactoid,
      row.ubicacionid,
      row.localizacionid,
      row.entidadid
    ].filter(Boolean);
    
    const selectedKeys = [
      selectedRow.paisid,
      selectedRow.empresaid,
      selectedRow.fundoid,
      selectedRow.usuarioid,
      selectedRow.nodoid,
      selectedRow.tipoid,
      selectedRow.sensorid,
      selectedRow.metricaid,
      selectedRow.umbralid,
      selectedRow.perfilid,
      selectedRow.contactoid,
      selectedRow.ubicacionid,
      selectedRow.localizacionid,
      selectedRow.entidadid
    ].filter(Boolean);
    
    return rowKeys.length > 0 && selectedKeys.length > 0 && 
           rowKeys.every((key, index) => key === selectedKeys[index]);
  }, [selectedRow, tableName]);

  // Si no hay columnas, verificar si está cargando o si realmente hay un problema
  if (columns.length === 0) {
    if (loading) {
      return (
        <div className="overflow-x-auto -mx-2 sm:mx-0 custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-900 dark:text-neutral-300">
            <tbody>
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-neutral-400">
                  {t('status.loading_columns')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    if (data.length > 0) {
      return (
        <div className="overflow-x-auto -mx-2 sm:mx-0 custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-900 dark:text-neutral-300">
            <tbody>
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-neutral-400">
                  {t('status.loading_columns')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto -mx-2 sm:mx-0 custom-scrollbar">
        <table className="w-full text-sm text-left text-gray-900 dark:text-neutral-300">
          <tbody>
            <tr>
              <td colSpan={10} className="px-6 py-8 text-center text-neutral-400">
                No hay entradas disponibles
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0 custom-scrollbar">
      <table className="w-full text-sm text-left text-gray-900 dark:text-neutral-300">
        <thead className="text-xs text-gray-500 dark:text-neutral-400 bg-gray-200 dark:bg-neutral-800">
          <tr>
            {/* Columna de checkbox */}
            <th className="px-4 py-3 font-mono tracking-wider text-gray-700 dark:text-gray-300 w-12">
              {/* Header vacío para checkbox */}
            </th>
            {columns.map(col => {
              const displayName = getColumnDisplayNameTranslated(col.columnName, t);
              return displayName ? (
                <th 
                  key={col.columnName} 
                  className="px-6 py-3 font-mono tracking-wider text-gray-700 dark:text-gray-300"
                >
                  {displayName.toUpperCase()}
                </th>
              ) : null;
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-neutral-400">
                No hay entradas disponibles
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const isSelected = isRowSelected(row);
              
              // Crear una key única combinando múltiples identificadores y el índice
              let rowKey: string;
              {
                const primaryKeys = [
                  row.paisid,
                  row.empresaid,
                  row.fundoid,
                  row.usuarioid,
                  row.nodoid,
                  row.tipoid,
                  row.sensorid,
                  row.metricaid,
                  row.umbralid,
                  row.perfilid,
                  row.contactoid,
                  row.ubicacionid,
                  row.localizacionid,
                  row.entidadid,
                  row.permisoid
                ].filter(Boolean);
                
                rowKey = primaryKeys.length > 0 
                  ? `${primaryKeys.join('-')}-${index}` 
                  : `row-${index}`;
              }
              
              return (
                <tr
                  key={rowKey}
                  className={isSelected 
                    ? themeColor === 'red' 
                      ? 'bg-red-100 dark:bg-red-900/20' 
                      : themeColor === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : themeColor === 'green'
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-orange-100 dark:bg-orange-900/20'
                    : 'bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onRowClick(row)}
                      className={`w-4 h-4 bg-gray-100 border-gray-300 rounded dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer ${
                        themeColor === 'red'
                          ? 'text-red-500 focus:ring-red-500 dark:focus:ring-red-600'
                          : themeColor === 'blue'
                          ? 'text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-600'
                          : themeColor === 'green'
                          ? 'text-green-500 focus:ring-green-500 dark:focus:ring-green-600'
                          : 'text-orange-500 focus:ring-orange-500 dark:focus:ring-orange-600'
                      }`}
                    />
                  </td>
                  {/* Resto de las columnas - usar la misma lógica de formateo que StatusTableRow */}
                  {columns.map(col => {
                    const displayName = getColumnDisplayNameTranslated(col.columnName, t);
                    if (!displayName) return null;

                    // Usercreatedid / Usermodifiedid - Nombre de usuario
                    if (col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid') {
                      return (
                        <td key={col.columnName} className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
                          {getUserName(row[col.columnName], userData)}
                        </td>
                      );
                    }

                    // Statusid - Formateo especial con colores
                    if (col.columnName === 'statusid') {
                      const hasActiveRow = row.originalRows && row.originalRows.length > 0
                        ? row.originalRows.some((originalRow: any) => originalRow.statusid === 1)
                        : null;
                      const isActive = hasActiveRow !== null ? hasActiveRow : (row[col.columnName] === 1);
                      
                      return (
                        <td key={col.columnName} className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
                          <span className={isActive ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                            {isActive ? t('status.active') : t('status.inactive')}
                          </span>
                        </td>
                      );
                    }

                    // Datecreated / Datemodified - Fecha formateada
                    if (col.columnName === 'datecreated' || col.columnName === 'datemodified') {
                      return (
                        <td key={col.columnName} className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
                          {formatDate(row[col.columnName])}
                        </td>
                      );
                    }

                    // Password_hash - Mostrar/ocultar con toggle
                    if (col.columnName === 'password_hash') {
                      const rowKey = getRowKey(row);
                      const isVisible = showPasswords[rowKey] || false;
                      
                      return (
                        <td key={col.columnName} className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {isVisible ? row[col.columnName] : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePassword(rowKey);
                              }}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {isVisible ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      );
                    }

                    // Para otros campos, usar getDisplayValue
                    return (
                      <td key={col.columnName} className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
                        {getDisplayValue(row, col.columnName, relatedData)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
// Usar comparación profunda para arrays y objetos
export const UpdateTableMemo = React.memo(UpdateTable, (prevProps, nextProps) => {
  // Comparar longitudes y referencias primero (más rápido)
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.columns.length !== nextProps.columns.length) return false;
  if (prevProps.tableName !== nextProps.tableName) return false;
  if (prevProps.themeColor !== nextProps.themeColor) return false;
  if (prevProps.loading !== nextProps.loading) return false;
  
  // Comparar selectedRow por valor si son objetos diferentes pero con el mismo contenido
  if (prevProps.selectedRow && nextProps.selectedRow) {
    if (prevProps.selectedRow !== nextProps.selectedRow) {
      return false;
    }
  } else if (prevProps.selectedRow !== nextProps.selectedRow) {
    return false;
  }
  
  // Si las referencias son iguales, no hay cambios
  if (prevProps.data === nextProps.data &&
      prevProps.columns === nextProps.columns &&
      prevProps.relatedData === nextProps.relatedData &&
      prevProps.onRowClick === nextProps.onRowClick) {
    return true;
  }
  
  // Si llegamos aquí, hay cambios y necesitamos re-renderizar
  return false;
});
