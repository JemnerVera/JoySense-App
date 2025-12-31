/**
 * Componente principal para la pestaña de Estado
 * Integra TableStatsDisplay, SearchBarWithCounter, StatusTable y PaginationControls
 */

import React from 'react';
import { useStatusTable } from '../../../hooks/useStatusTable';
import { TableStatsDisplay } from '../TableStatsDisplay';
import { SearchBarWithCounter } from '../SearchBarWithCounter';
import { LoadingSpinner } from '../LoadingSpinner';
import { PaginationControls } from '../PaginationControls';
import { StatusTableMemo as StatusTable } from './StatusTable';
import type { ColumnInfo } from '../../../types/systemParameters';
import type { RelatedData } from '../../../utils/systemParametersUtils';

interface StatusTabProps {
  tableName: string;
  tableData: any[];
  columns: ColumnInfo[];
  relatedData: RelatedData;
  userData?: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan';
}

export const StatusTab: React.FC<StatusTabProps> = ({
  tableName,
  tableData,
  columns,
  relatedData,
  userData = [],
  loading = false,
  onRowClick,
  themeColor = 'orange'
}) => {

  // Hook que encapsula toda la lógica de Estado
  const {
    filteredData,
    paginatedData,
    visibleColumns,
    currentPage,
    totalPages,
    handlePageChange,
    searchTerm,
    handleSearchChange,
    hasSearched
  } = useStatusTable({
    tableName,
    tableData,
    columns,
    relatedData,
    itemsPerPage: 10
  });

  // No renderizar hasta que las columnas estén cargadas para evitar renderizado incorrecto
  // Si está cargando O no hay columnas, mostrar spinner
  const isReady = !loading && columns.length > 0;

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
      {/* Estadísticas de la tabla */}
      {isReady && tableData && tableData.length > 0 && (
        <TableStatsDisplay tableData={tableData} userData={userData} themeColor={themeColor} />
      )}

      {!isReady ? (
        <LoadingSpinner message="Cargando datos..." />
      ) : (
        <>
          {/* Barra de búsqueda */}
          <SearchBarWithCounter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filteredCount={filteredData.length}
            totalCount={tableData.length}
            themeColor={themeColor}
          />

          {/* Tabla con datos - Solo renderizar cuando está listo */}
          {visibleColumns.length > 0 ? (
            <StatusTable
              data={paginatedData}
              columns={visibleColumns}
              relatedData={relatedData}
              onRowClick={onRowClick}
              loading={false}
            />
          ) : (
            <LoadingSpinner message="Cargando columnas..." />
          )}

          {/* Paginación */}
          {visibleColumns.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showPagination={totalPages > 1}
              themeColor={themeColor}
            />
          )}
        </>
      )}
    </div>
  );
};

