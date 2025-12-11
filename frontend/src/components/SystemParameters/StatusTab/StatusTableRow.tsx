/**
 * Componente para renderizar una fila de la tabla de Estado
 * Maneja el formateo especial de campos (statusid, fechas, usuarios, contraseñas)
 * Versión optimizada para renderizado directo como antes
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated, getUserName, formatDate, getDisplayValue } from '../../../utils/systemParametersUtils';
import type { ColumnInfo } from '../../../types/systemParameters';
import type { RelatedData } from '../../../utils/systemParametersUtils';

interface StatusTableRowProps {
  row: any;
  columns: ColumnInfo[];
  relatedData: RelatedData;
  onRowClick?: (row: any) => void;
  className?: string;
}

const StatusTableRowComponent: React.FC<StatusTableRowProps> = ({
  row,
  columns,
  relatedData,
  onRowClick,
  className
}) => {
  const { t } = useLanguage();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = useCallback((rowKey: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  }, []);

  const getRowKey = useCallback(() => {
    return row.usuarioid || row.login || row.nodoid || row.tipoid || 'default';
  }, [row]);

  // Memoizar userData para evitar re-renders innecesarios
  const userData = useMemo(() => relatedData.userData || [], [relatedData.userData]);

  return (
    <tr 
      className={`bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 ${className || ''}`}
      onClick={() => onRowClick?.(row)}
    >
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
          // Para filas agrupadas, verificar si al menos una fila original está activa
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
          const rowKey = getRowKey();
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

        // Para otros campos, usar getDisplayValue directamente (más eficiente)
        return (
          <td key={col.columnName} className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
            {getDisplayValue(row, col.columnName, relatedData)}
          </td>
        );
      })}
    </tr>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const StatusTableRow = React.memo(StatusTableRowComponent, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian los datos relevantes
  return (
    prevProps.row === nextProps.row &&
    prevProps.columns === nextProps.columns &&
    prevProps.relatedData === nextProps.relatedData
  );
});

