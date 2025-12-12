// ============================================================================
// COMPONENT: TableSelector - Selector de tablas por categoría
// ============================================================================

import React from 'react';
import { TABLES_CONFIG, getTablesByCategory, TABLE_CATEGORIES } from '../../../config/tables.config';

interface TableSelectorProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  selectedTable,
  onTableSelect
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
        Seleccionar Tabla
      </h3>
      <div className="space-y-4">
        {Object.entries(TABLE_CATEGORIES).map(([category, { name, icon }]) => {
          const tables = getTablesByCategory(category as any);
          if (tables.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {icon} {name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {tables.map(table => (
                  <button
                    key={table.name}
                    onClick={() => onTableSelect(table.name)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTable === table.name
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    }`}
                    title={table.description}
                  >
                    {table.icon} {table.displayName}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

