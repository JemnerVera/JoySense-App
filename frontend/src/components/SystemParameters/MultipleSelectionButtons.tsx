import React from 'react';

interface MultipleSelectionButtonsProps {
  selectedTable: string;
  selectedRowsForManualUpdate: any[];
  onGoToManualUpdateForm: () => void;
  onDeselectAll: () => void;
}

export function MultipleSelectionButtons({ 
  selectedTable, 
  selectedRowsForManualUpdate, 
  onGoToManualUpdateForm, 
  onDeselectAll 
}: MultipleSelectionButtonsProps) {
  // Solo mostrar para tablas específicas y cuando hay selecciones
  if ((selectedTable !== 'sensor' && selectedTable !== 'metricasensor' && selectedTable !== 'usuarioperfil') || 
      selectedRowsForManualUpdate.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
        <button
          onClick={onGoToManualUpdateForm}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-mono tracking-wider"
        >
          🔧 Actualizar
        </button>

        <button
          onClick={onDeselectAll}
          className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-mono tracking-wider"
        >
          🗑️ Limpiar Selección
        </button>
      </div>
    </div>
  );
}
