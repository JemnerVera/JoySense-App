// ============================================================================
// COMPONENT: MassiveLocalizacionSummary
// Resumen de la operación masiva de localizaciones
// ============================================================================

import React from 'react';

interface MassiveLocalizacionSummaryProps {
  nodosSeleccionados: number;
  sensoresSeleccionados: number;
}

export const MassiveLocalizacionSummary: React.FC<MassiveLocalizacionSummaryProps> = ({
  nodosSeleccionados,
  sensoresSeleccionados
}) => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
      <h3 className="text-base font-bold font-mono tracking-wider mb-3">
        📊 RESUMEN DE ASIGNACIÓN
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <div className="text-sm font-mono opacity-80">Nodo</div>
          <div className="text-2xl font-bold font-mono">{nodosSeleccionados}</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <div className="text-sm font-mono opacity-80">Combinaciones</div>
          <div className="text-2xl font-bold font-mono">{sensoresSeleccionados}</div>
        </div>
      </div>
    </div>
  );
};
