import React from 'react';

interface ParametersControlsProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
  // Props para sub-pestañas
  activeSubTab?: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange?: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
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
      {/* Botón de Masivo - Solo visible para sensor, metricasensor, usuarioperfil y umbral */}
      {['sensor', 'metricasensor', 'usuarioperfil', 'umbral'].includes(selectedTable) && (
        <button 
          onClick={() => onSubTabChange?.('massive')}
          className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center space-x-1 header-button depth-effect transition-colors ${
            activeSubTab === 'massive'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          <span>⚡</span>
          <span>Masivo</span>
        </button>
      )}
    </div>
  );
};
