/**
 * Componente para renderizar la tabla de datos de Estado
 * Muestra los datos con formateo especial y paginación
 */

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';
import { StatusTableRow } from './StatusTableRow';
import type { ColumnInfo } from '../../../types/systemParameters';
import type { RelatedData } from '../../../utils/systemParametersUtils';

interface StatusTableProps {
  data: any[];
  columns: ColumnInfo[];
  relatedData: RelatedData;
  onRowClick?: (row: any) => void;
  loading?: boolean;
}

export const StatusTable: React.FC<StatusTableProps> = ({
  data,
  columns,
  relatedData,
  onRowClick,
  loading = false
}) => {
  const { t } = useLanguage();

  // Si no hay columnas, verificar si está cargando o si realmente hay un problema
  if (columns.length === 0) {
    // Si está cargando, mostrar mensaje de carga
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
    
    // Si no está cargando y no hay columnas, la tabla está vacía o no se pudieron cargar
    // Si hay datos pero no columnas, puede ser un problema temporal - mostrar mensaje más suave
    if (data.length > 0) {
      // Si hay datos pero no columnas, puede ser que las columnas aún no se hayan cargado
      // Esperar un momento antes de mostrar error
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
    
    // Si no hay columnas ni datos y no está cargando, la tabla está vacía
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
              <td colSpan={columns.length} className="px-6 py-8 text-center text-neutral-400">
                No hay entradas disponibles
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              // Crear una key única combinando múltiples identificadores y el índice
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
                row.entidadid
              ].filter(Boolean);
              
              // Si hay primary keys, combinarlos; si no, usar el índice
              const rowKey = primaryKeys.length > 0 
                ? `${primaryKeys.join('-')}-${index}` 
                : `row-${index}`;
              
              return (
                <StatusTableRow
                  key={rowKey}
                  row={row}
                  columns={columns}
                  relatedData={relatedData}
                  onRowClick={onRowClick}
                />
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
export const StatusTableMemo = React.memo(StatusTable, (prevProps, nextProps) => {
  // Comparar longitudes y referencias primero (más rápido)
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.columns.length !== nextProps.columns.length) return false;
  if (prevProps.loading !== nextProps.loading) return false;
  
  // Si las referencias son iguales, no hay cambios
  if (prevProps.data === nextProps.data &&
      prevProps.columns === nextProps.columns &&
      prevProps.relatedData === nextProps.relatedData) {
    return true;
  }
  
  // Si llegamos aquí, hay cambios y necesitamos re-renderizar
  return false;
});

