import React from 'react';
import { TableStatsDisplay } from './TableStatsDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { PaginationControls } from './PaginationControls';
import { SearchBarWithCounter } from './SearchBarWithCounter';

interface StatusTabJSXProps {
  tableInfo: any;
  tableData: any[];
  userData: any[];
  loading: boolean;
  statusCurrentPage: number;
  statusTotalPages: number;
  statusFilteredData: any[];
  filteredTableData: any[];
  statusVisibleColumns: any[];
  statusSearchTerm: string;
  handleStatusSearch: (value: string, filteredTableData: any[], statusVisibleColumns: any[], userData: any[], setStatusCurrentPage: (page: number) => void) => void;
  handleStatusPageChange: (page: number) => void;
  getStatusPaginatedData: () => any[];
  getColumnDisplayName: (columnName: string) => string;
  getUserName: (userId: any, userData: any[]) => string;
  formatDate: (date: string) => string;
  getDisplayValue: (row: any, columnName: string) => string;
}

export function StatusTabJSX({
  tableInfo,
  tableData,
  userData,
  loading,
  statusCurrentPage,
  statusTotalPages,
  statusFilteredData,
  filteredTableData,
  statusVisibleColumns,
  statusSearchTerm,
  handleStatusSearch,
  handleStatusPageChange,
  getStatusPaginatedData,
  getColumnDisplayName,
  getUserName,
  formatDate,
  getDisplayValue
}: StatusTabJSXProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
      {tableInfo && (
        <TableStatsDisplay tableData={tableData} userData={userData} />
      )}

      {loading ? (
        <LoadingSpinner message="Cargando datos..." />
      ) : (
        <>
          {/* Barra de búsqueda - Tactical Style */}
          <SearchBarWithCounter
            searchTerm={statusSearchTerm}
            onSearchChange={(value) => handleStatusSearch(value, filteredTableData, statusVisibleColumns, userData, handleStatusPageChange)}
            filteredCount={statusFilteredData.length}
            totalCount={filteredTableData.length}
          />

          {/* Tabla con datos */}
          <div className="overflow-x-auto -mx-2 sm:mx-0 custom-scrollbar">
            <table className="w-full text-sm text-left text-neutral-300">
              <thead className="text-xs text-neutral-400 bg-neutral-800">
                <tr>
                  {statusVisibleColumns.map(col => {
                    const displayName = getColumnDisplayName(col.columnName);
                    return displayName ? (
                      <th key={col.columnName} className="px-6 py-3 font-mono tracking-wider">
                        {displayName.toUpperCase()}
                      </th>
                    ) : null;
                  })}
                </tr>
              </thead>
              <tbody>
                {statusVisibleColumns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-neutral-400">
                      Cargando columnas...
                    </td>
                  </tr>
                ) : getStatusPaginatedData().map((row, index) => (
                  <tr key={index} className="bg-neutral-900 border-b border-neutral-700 hover:bg-neutral-800">
                    {statusVisibleColumns.map(col => {
                      const displayName = getColumnDisplayName(col.columnName);
                      return displayName ? (
                        <td key={col.columnName} className="px-6 py-4 text-xs font-mono">
                          {col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' 
                            ? getUserName(row[col.columnName], userData)
                            : col.columnName === 'statusid'
                            ? (
                              <span className={(() => {
                                // Para filas agrupadas, verificar si al menos una fila original está activa
                                if (row.originalRows && row.originalRows.length > 0) {
                                  const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                                  return hasActiveRow ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold';
                                }
                                // Para filas normales, usar el statusid directamente
                                return (row[col.columnName] === 1 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold');
                              })()}>
                                {(() => {
                                  // Para filas agrupadas, mostrar el estado basado en las filas originales
                                  if (row.originalRows && row.originalRows.length > 0) {
                                    const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                                    return (hasActiveRow ? 'Activo' : 'Inactivo');
                                  }
                                  // Para filas normales, usar el statusid directamente
                                  return (row[col.columnName] === 1 ? 'Activo' : 'Inactivo');
                                })()}
                              </span>
                            )
                            : col.columnName === 'datecreated' || col.columnName === 'datemodified'
                            ? formatDate(row[col.columnName])
                            : getDisplayValue(row, col.columnName)}
                        </td>
                      ) : null;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <PaginationControls
            currentPage={statusCurrentPage}
            totalPages={statusTotalPages}
            onPageChange={handleStatusPageChange}
            showPagination={statusTotalPages > 1}
          />
        </>
      )}
    </div>
  );
}
