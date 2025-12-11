/**
 * Hook para manejar columnas visibles de tablas
 * Encapsula la lógica de filtrado, inyección y reordenamiento de columnas
 */

import { useMemo } from 'react';
import { getVisibleColumns } from '../utils/columnUtils';
import type { ColumnInfo } from '../types/systemParameters';

interface UseTableColumnsOptions {
  columns: ColumnInfo[];
  tableName: string;
  forTable?: boolean; // true para tabla de datos, false para formulario
  selectedContactType?: 'phone' | 'email' | null;
}

/**
 * Hook que calcula las columnas visibles para una tabla
 */
export const useTableColumns = ({
  columns,
  tableName,
  forTable = true,
  selectedContactType
}: UseTableColumnsOptions): ColumnInfo[] => {
  return useMemo(() => {
    if (!columns || columns.length === 0) {
      return [];
    }

    return getVisibleColumns(columns, tableName, forTable, selectedContactType);
  }, [columns, tableName, forTable, selectedContactType]);
};

