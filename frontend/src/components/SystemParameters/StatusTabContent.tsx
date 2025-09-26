import React from 'react';
import { TableStatsDisplay } from './TableStatsDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { PaginationControls } from './PaginationControls';
import { ActionButtons } from './ActionButtons';

interface StatusTabContentProps {
  tableInfo: any;
  tableData: any[];
  userData: any[];
  loading: boolean;
  statusCurrentPage: number;
  statusTotalPages: number;
  statusFilteredData: any[];
  itemsPerPage: number;
  goToPage: (page: number) => void;
  columns: any[];
  selectedRowsForUpdate: any[];
  handleSelectRowForUpdate: (row: any) => void;
  handleSelectAllFiltered: () => void;
  isMultipleSelectionMode: boolean;
  selectedTable: string;
  getDisplayValue: (row: any, columnName: string) => string;
  statusSearchTerm: string;
  setStatusSearchTerm: (term: string) => void;
  statusSearchField: string;
  setStatusSearchField: (field: string) => void;
  searchableColumns: any[];
  handleStatusSearch: (term: string, field: string) => void;
  clearStatusSearchState: () => void;
}

export function StatusTabContent({
  tableInfo,
  tableData,
  userData,
  loading,
  statusCurrentPage,
  statusTotalPages,
  statusFilteredData,
  itemsPerPage,
  goToPage,
  columns,
  selectedRowsForUpdate,
  handleSelectRowForUpdate,
  handleSelectAllFiltered,
  isMultipleSelectionMode,
  selectedTable,
  getDisplayValue,
  statusSearchTerm,
  setStatusSearchTerm,
  statusSearchField,
  setStatusSearchField,
  searchableColumns,
  handleStatusSearch,
  clearStatusSearchState
}: StatusTabContentProps) {
  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
        <LoadingSpinner message="Cargando datos..." />
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
      {tableInfo && (
        <TableStatsDisplay tableData={tableData} userData={userData} />
      )}

      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar..."
              value={statusSearchTerm}
              onChange={(e) => setStatusSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusSearchField}
              onChange={(e) => setStatusSearchField(e.target.value)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {searchableColumns.map((col) => (
                <option key={col.columnName} value={col.columnName}>
                  {col.displayName}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleStatusSearch(statusSearchTerm, statusSearchField)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Buscar
            </button>
            <button
              onClick={clearStatusSearchState}
              className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-300">
            <thead className="text-xs text-neutral-400 uppercase bg-neutral-800">
              <tr>
                {isMultipleSelectionMode && (
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllFiltered}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.columnName} className="px-6 py-3">
                    {col.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statusFilteredData
                .slice((statusCurrentPage - 1) * itemsPerPage, statusCurrentPage * itemsPerPage)
                .map((row, index) => (
                  <tr
                    key={index}
                    className={`bg-neutral-900 border-b border-neutral-700 hover:bg-neutral-800 cursor-pointer ${
                      selectedRowsForUpdate.some(r => r.id === row.id) ? 'bg-blue-900 bg-opacity-30' : ''
                    }`}
                    onClick={() => handleSelectRowForUpdate(row)}
                  >
                    {isMultipleSelectionMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRowsForUpdate.some(r => r.id === row.id)}
                          onChange={() => handleSelectRowForUpdate(row)}
                          className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.columnName} className="px-6 py-4">
                        {getDisplayValue(row, col.columnName)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationControls
          currentPage={statusCurrentPage}
          totalPages={statusTotalPages}
          onPageChange={goToPage}
        />

        {/* Action Buttons */}
        <ActionButtons
          selectedTable={selectedTable}
          updateLoading={false}
          onUpdate={() => {}}
          onCancelUpdate={() => {}}
        />
      </div>
    </div>
  );
}
