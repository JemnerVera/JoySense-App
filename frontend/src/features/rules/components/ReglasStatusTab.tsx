import React, { useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ReglasStatusTabProps {
  reglasData?: any[];
}

export function ReglasStatusTab({ reglasData = [] }: ReglasStatusTabProps) {
  const { t } = useLanguage();

  // Agrupar reglas por status
  const reglasPorStatus = useMemo(() => {
    const activas = reglasData.filter(r => r.statusid === 1);
    const inactivas = reglasData.filter(r => r.statusid === 0);
    return { activas, inactivas };
  }, [reglasData]);

  const renderReglaRow = (regla: any) => (
    <tr key={regla.reglaid} className="border-b border-gray-300 dark:border-neutral-600 hover:bg-neutral-800 transition-colors">
      <td className="px-4 py-3 font-mono text-sm text-white">{regla.nombre || '-'}</td>
      <td className="px-4 py-3 font-mono text-sm text-gray-400">
        {regla.criticidadid ? `Criticidad ${regla.criticidadid}` : '-'}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-gray-400">
        {regla.ventana || '-'}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-gray-400">
        {regla.cooldown || '-'}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-center">
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          regla.statusid === 1
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {regla.statusid === 1 ? 'ACTIVA' : 'INACTIVA'}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Reglas Activas */}
      <div>
        <h3 className="text-lg font-bold font-mono tracking-wider text-green-500 mb-4">
          REGLAS ACTIVAS ({reglasPorStatus.activas.length})
        </h3>
        {reglasPorStatus.activas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 dark:border-neutral-600 bg-neutral-900">
                  <th className="px-4 py-2 text-left font-mono font-bold text-green-500">NOMBRE</th>
                  <th className="px-4 py-2 text-left font-mono font-bold text-green-500">CRITICIDAD</th>
                  <th className="px-4 py-2 text-left font-mono font-bold text-green-500">VENTANA</th>
                  <th className="px-4 py-2 text-left font-mono font-bold text-green-500">COOLDOWN</th>
                  <th className="px-4 py-2 text-center font-mono font-bold text-green-500">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {reglasPorStatus.activas.map(regla => renderReglaRow(regla))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 font-mono">
            No hay reglas activas
          </div>
        )}
      </div>

      {/* Reglas Inactivas */}
      <div>
        <h3 className="text-lg font-bold font-mono tracking-wider text-red-500 mb-4">
          REGLAS INACTIVAS ({reglasPorStatus.inactivas.length})
        </h3>
        {reglasPorStatus.inactivas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 dark:border-neutral-600 bg-neutral-900">
                  <th className="px-4 py-2 text-left font-mono font-bold text-red-500">NOMBRE</th>
                  <th className="px-4 py-2 text-left font-mono font-bold text-red-500">CRITICIDAD</th>
                  <th className="px-4 py-2 text-left font-mono font-bold text-red-500">VENTANA</th>
                  <th className="px-4 py-2 text-left font-mono font-bold text-red-500">COOLDOWN</th>
                  <th className="px-4 py-2 text-center font-mono font-bold text-red-500">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {reglasPorStatus.inactivas.map(regla => renderReglaRow(regla))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 font-mono">
            No hay reglas inactivas
          </div>
        )}
      </div>
    </div>
  );
}