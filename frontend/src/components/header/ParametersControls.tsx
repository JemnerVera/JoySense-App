import React from 'react';

interface ParametersControlsProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
  // Props para sub-pestañas
  activeSubTab?: 'status' | 'insert' | 'update' | 'copy';
  onSubTabChange?: (tab: 'status' | 'insert' | 'update' | 'copy') => void;
}

export const ParametersControls: React.FC<ParametersControlsProps> = ({
  selectedTable,
  onTableSelect,
  activeSubTab = 'status',
  onSubTabChange
}) => {
  return (
    <div className="flex items-center space-x-3">
      {/* Botones de acción */}
      <button 
        onClick={() => onSubTabChange?.('status')}
        className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center space-x-1 header-button depth-effect transition-colors ${
          activeSubTab === 'status'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
        }`}
      >
        <span>📊</span>
        <span>Estado</span>
      </button>
      <button 
        onClick={() => onSubTabChange?.('insert')}
        className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center space-x-1 header-button depth-effect transition-colors ${
          activeSubTab === 'insert'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
        }`}
      >
        <span>➕</span>
        <span>Crear</span>
      </button>
      <button 
        onClick={() => onSubTabChange?.('update')}
        className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center space-x-1 header-button depth-effect transition-colors ${
          activeSubTab === 'update'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
        }`}
      >
        <span>✏️</span>
        <span>Actualizar</span>
      </button>
      {/* Botón de Copiar - Solo visible para nodo, sensor y metricasensor */}
      {['nodo', 'sensor', 'metricasensor'].includes(selectedTable) && (
        <button 
          onClick={() => onSubTabChange?.('copy')}
          className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center space-x-1 header-button depth-effect transition-colors ${
            activeSubTab === 'copy'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          <span>📋</span>
          <span>Copiar</span>
        </button>
      )}
    </div>
  );
};
