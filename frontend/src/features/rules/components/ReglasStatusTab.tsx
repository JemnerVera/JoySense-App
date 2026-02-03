import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { JoySenseService } from '../../../services/backend-api';
import { SelectWithPlaceholder } from '../../../components/selectors';

interface ReglasStatusTabProps {
  reglasData?: any[];
}

export function ReglasStatusTab({ reglasData = [] }: ReglasStatusTabProps) {
  const { t } = useLanguage();
  const [selectedReglaid, setSelectedReglaid] = useState<number | null>(null);
  const [reglaUmbrales, setReglaUmbrales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Opciones de reglas activas
  const reglaOptions = React.useMemo(() => {
    return reglasData
      .filter(r => r.statusid === 1)
      .map(regla => ({
        value: regla.reglaid,
        label: regla.nombre || `Regla ${regla.reglaid}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [reglasData]);

  // Cargar umbrales cuando se selecciona una regla
  useEffect(() => {
    if (selectedReglaid) {
      loadReglaUmbrales(selectedReglaid);
    } else {
      setReglaUmbrales([]);
    }
  }, [selectedReglaid]);

  const loadReglaUmbrales = async (reglaid: number) => {
    setLoading(true);
    try {
      const data = await JoySenseService.getTableData('regla_umbral', 1000);
      const umbrales = (data || []).filter((ru: any) => ru.reglaid === reglaid);
      // Ordenar por orden
      umbrales.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
      setReglaUmbrales(umbrales);
    } catch (error) {
      console.error('Error cargando umbrales:', error);
      setReglaUmbrales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUmbralStatus = async (reglaUmbralid: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const result = await JoySenseService.updateTableRow('regla_umbral', reglaUmbralid.toString(), {
        statusid: newStatus,
        usermodifiedid: 1, // TODO: usar user actual
        datemodified: new Date().toISOString()
      });

      if (result && !result.error) {
        // Actualizar estado local
        setReglaUmbrales(prev =>
          prev.map(ru =>
            ru.regla_umbralid === reglaUmbralid ? { ...ru, statusid: newStatus } : ru
          )
        );
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de REGLA */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
        <label className="block text-lg font-bold mb-2 font-mono tracking-wider text-orange-500">
          SELECCIONAR REGLA
        </label>
        <SelectWithPlaceholder
          value={selectedReglaid || null}
          onChange={(value) => setSelectedReglaid(value ? Number(value) : null)}
          options={reglaOptions}
          placeholder="SELECCIONAR REGLA"
          themeColor="orange"
        />
      </div>

      {/* Tabla de UMBRALES (solo si hay regla seleccionada) */}
      {selectedReglaid && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono tracking-wider text-orange-500 mb-4">
            UMBRALES DE LA REGLA
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-400 font-mono">
              Cargando umbrales...
            </div>
          ) : reglaUmbrales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-neutral-600 bg-neutral-800">
                    <th className="px-4 py-3 text-left font-mono font-bold text-orange-500">ORDEN</th>
                    <th className="px-4 py-3 text-left font-mono font-bold text-orange-500">UMBRAL ID</th>
                    <th className="px-4 py-3 text-left font-mono font-bold text-orange-500">OPERADOR</th>
                    <th className="px-4 py-3 text-left font-mono font-bold text-orange-500">AGRUPADOR</th>
                    <th className="px-4 py-3 text-center font-mono font-bold text-orange-500">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {reglaUmbrales.map((ru: any) => (
                    <tr key={ru.regla_umbralid} className="border-b border-gray-300 dark:border-neutral-600 hover:bg-neutral-800 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-white">{ru.orden}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-400">{ru.umbralid}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-400">
                        {ru.operador_logico || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-400">
                        {ru.agrupador_inicio ? 'I' : ''}
                        {ru.agrupador_fin ? 'F' : ''}
                        {!ru.agrupador_inicio && !ru.agrupador_fin ? '-' : ''}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-white">
                        <span className={ru.statusid === 1 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {ru.statusid === 1 ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 font-mono">
              No hay umbrales para esta regla
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay regla seleccionada */}
      {!selectedReglaid && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 font-mono text-sm">
            Selecciona una regla para ver y gestionar sus umbrales
          </p>
        </div>
      )}
    </div>
  );
}