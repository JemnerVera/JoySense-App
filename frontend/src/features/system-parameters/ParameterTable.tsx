import React, { useState, useEffect } from 'react';
import { useTableRendering } from '../../hooks/useTableRendering';

interface ParameterTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'status' | 'boolean';
    sortable?: boolean;
  }>;
  onRowSelect?: (row: any) => void;
  onRowEdit?: (row: any) => void;
  onRowDelete?: (row: any) => void;
  selectedRows?: any[];
  onSelectionChange?: (rows: any[]) => void;
  searchable?: boolean;
  paginated?: boolean;
  itemsPerPage?: number;
  className?: string;
}

/**
 * Componente reutilizable para tablas de parámetros
 * Utiliza el hook de renderizado de tablas para manejar búsqueda, filtrado y paginación
 */
export function ParameterTable({
  data,
  columns,
  onRowSelect,
  onRowEdit,
  onRowDelete,
  selectedRows = [],
  onSelectionChange,
  searchable = true,
  paginated = true,
  itemsPerPage = 10,
  className = ''
}: ParameterTableProps) {
  
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const {
    filteredData,
    paginatedData,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    searchTerm,
    searchField,
    isSearching,
    setSearchTerm,
    setSearchField,
    clearSearch,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    getDisplayValue,
    formatCellValue
  } = useTableRendering(data, itemsPerPage);

  // Manejar selección de filas
  const handleRowSelect = (row: any) => {
    if (onRowSelect) {
      onRowSelect(row);
    }
  };

  // Manejar edición de fila
  const handleRowEdit = (row: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRowEdit) {
      onRowEdit(row);
    }
  };

  // Manejar eliminación de fila
  const handleRowDelete = (row: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRowDelete) {
      onRowDelete(row);
    }
  };

  // Manejar ordenamiento
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Aplicar ordenamiento a los datos
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return paginatedData;
    
    return [...paginatedData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [paginatedData, sortColumn, sortDirection]);

  // Renderizar encabezado de tabla
  const renderTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
            }`}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {column.sortable && (
                <div className="flex flex-col">
                  <svg
                    className={`w-3 h-3 ${
                      sortColumn === column.key && sortDirection === 'asc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                  <svg
                    className={`w-3 h-3 ${
                      sortColumn === column.key && sortDirection === 'desc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                  </svg>
                </div>
              )}
            </div>
          </th>
        ))}
        {(onRowEdit || onRowDelete) && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Acciones
          </th>
        )}
      </tr>
    </thead>
  );

  // Renderizar fila de tabla
  const renderTableRow = (row: any, index: number) => (
    <tr
      key={index}
      className={`hover:bg-gray-50 cursor-pointer ${
        selectedRows.some(selected => selected.id === row.id) ? 'bg-blue-50' : ''
      }`}
      onClick={() => handleRowSelect(row)}
    >
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatCellValue(getDisplayValue(row, column.key), column.key)}
        </td>
      ))}
      {(onRowEdit || onRowDelete) && (
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex space-x-2">
            {onRowEdit && (
              <button
                onClick={(e) => handleRowEdit(row, e)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                Editar
              </button>
            )}
            {onRowDelete && (
              <button
                onClick={(e) => handleRowDelete(row, e)}
                className="text-red-600 hover:text-red-900"
              >
                Eliminar
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );

  // Renderizar controles de búsqueda
  const renderSearchControls = () => {
    if (!searchable) return null;

    return (
      <div className="mb-4 flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Limpiar
          </button>
        )}
      </div>
    );
  };

  // Renderizar controles de paginación
  const renderPaginationControls = () => {
    if (!paginated || totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, data.length)} de {data.length} resultados
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={firstPage}
            disabled={!hasPrevPage}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Primera
          </button>
          <button
            onClick={prevPage}
            disabled={!hasPrevPage}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <span className="px-3 py-1 text-sm font-medium text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
          <button
            onClick={lastPage}
            disabled={!hasNextPage}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Última
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      {renderSearchControls()}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {renderTableHeader()}
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => renderTableRow(row, index))}
          </tbody>
        </table>
      </div>
      
      {sortedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron resultados
        </div>
      )}
      
      {renderPaginationControls()}
    </div>
  );
}
