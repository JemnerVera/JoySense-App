import React from 'react';

interface TableInfoDisplayProps {
  tableInfo: {
    totalRecords?: number;
    activeRecords?: number;
    inactiveRecords?: number;
  } | null;
}

export function TableInfoDisplay({ tableInfo }: TableInfoDisplayProps) {
  if (!tableInfo) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-400 mb-1">
          {tableInfo.totalRecords || 0}
        </div>
        <div className="text-sm text-gray-300">Total de registros</div>
      </div>
      
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-400 mb-1">
          {tableInfo.activeRecords || 0}
        </div>
        <div className="text-sm text-gray-300">Registros activos</div>
      </div>
      
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-yellow-400 mb-1">
          {tableInfo.inactiveRecords || 0}
        </div>
        <div className="text-sm text-gray-300">Registros inactivos</div>
      </div>
    </div>
  );
}
