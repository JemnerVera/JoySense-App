import React from 'react';

interface ActionButtonsProps {
  selectedTable: string;
  updateLoading: boolean;
  onUpdate: () => void;
  onCancelUpdate: () => void;
}

export function ActionButtons({ 
  selectedTable, 
  updateLoading, 
  onUpdate, 
  onCancelUpdate 
}: ActionButtonsProps) {
  // Solo mostrar para tablas que no sean metricasensor, sensor o usuarioperfil
  if (selectedTable === 'metricasensor' || selectedTable === 'sensor' || selectedTable === 'usuarioperfil') {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center">
      <button
        onClick={onUpdate}
        disabled={updateLoading}
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
      >
        <span>➕</span>
        <span>{updateLoading ? 'GUARDANDO...' : 'GUARDAR'}</span>
      </button>

      <button
        onClick={onCancelUpdate}
        className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
      >
        <span>❌</span>
        <span>CANCELAR</span>
      </button>
    </div>
  );
}
