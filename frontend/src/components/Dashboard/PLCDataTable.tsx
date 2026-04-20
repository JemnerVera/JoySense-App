import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import { useLanguage } from '../../contexts/LanguageContext';

const ITEMS_PER_PAGE = 25;
const DEFAULT_HOURS = 1;

interface PLCDataTableProps {
  selectedNodo: any;
  dateRange: { start: string; end: string };
  onClose?: () => void;
}

export function PLCDataTable({ selectedNodo, dateRange, onClose }: PLCDataTableProps) {
  const { t } = useLanguage();

  const [mediciones, setMediciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const defaultDateRange = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - DEFAULT_HOURS * 60 * 60 * 1000);
    return {
      start: getLocalDateString(oneHourAgo),
      end: getLocalDateString(now)
    };
  }, []);

  const effectiveDateRange = dateRange || defaultDateRange;

  const loadMediciones = useCallback(async () => {
    if (!selectedNodo?.nodoid) {
      setMediciones([]);
      return;
    }

    const startDateTime = `${effectiveDateRange.start} 00:00:00`;
    const endDateTime = `${effectiveDateRange.end} 23:59:59`;

    try {
      setLoading(true);
      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedNodo.nodoid,
        startDate: startDateTime,
        endDate: endDateTime
      });
      setMediciones(data || []);
    } catch (error) {
      console.error('[PLCDataTable] Error loading mediciones:', error);
      setMediciones([]);
    } finally {
      setLoading(false);
    }
  }, [selectedNodo, effectiveDateRange]);

  useEffect(() => {
    loadMediciones();
  }, [loadMediciones]);

  const tableData = useMemo(() => {
    if (!mediciones || mediciones.length === 0) return [];

    const groupedByTime: Map<string, { [key: string]: number | string }> = new Map();

    mediciones.forEach((m: any) => {
      const fecha = new Date(m.fecha);
      fecha.setSeconds(0, 0);
      const timeKey = fecha.toISOString().replace('T', ' ').slice(0, 16);

      const localizacionNombre = m.localizacion_nombre || `Localización ${m.localizacionid}`;
      const metricaNombre = m.metrica_nombre || 'Métrica';
      const key = `${localizacionNombre} - ${metricaNombre}`;
      const valor = Number(m.medicion);

      if (!groupedByTime.has(timeKey)) {
        groupedByTime.set(timeKey, { time: timeKey });
      }

      groupedByTime.get(timeKey)![key] = valor;
    });

    return Array.from(groupedByTime.values())
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [mediciones]);

  const columns = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const keys = new Set<string>();
    tableData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'time') keys.add(k);
      });
    });
    return ['time', ...Array.from(keys)];
  }, [tableData]);

  const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return tableData.slice(start, start + ITEMS_PER_PAGE);
  }, [tableData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedNodo, effectiveDateRange]);

  if (!selectedNodo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">
            Selecciona un nodo para ver los datos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
        <h3 className="text-sm font-medium text-gray-800 dark:text-white font-mono">
          Datos - {selectedNodo.nodo}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 px-3 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-neutral-700"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600 dark:text-neutral-400 font-mono">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 px-3 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-neutral-700"
          >
            Siguiente
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="h-8 px-3 ml-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-mono"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">Cargando datos...</p>
          </div>
        </div>
      )}

      {!loading && tableData.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500 dark:text-neutral-400 font-mono text-sm">No hay datos disponibles</p>
          </div>
        </div>
      )}

      {!loading && tableData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead className="bg-gray-100 dark:bg-neutral-800 sticky top-0">
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left text-gray-600 dark:text-neutral-400 border-b border-gray-200 dark:border-neutral-700 whitespace-nowrap"
                  >
                    {col === 'time' ? 'Timestamp' : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-gray-50 dark:bg-neutral-800/50'}
                >
                  {columns.map(col => (
                    <td
                      key={col}
                      className="px-3 py-2 text-gray-800 dark:text-white border-b border-gray-100 dark:border-neutral-800"
                    >
                      {col === 'time' 
                        ? row[col] 
                        : (typeof row[col] === 'number' && !isNaN(row[col] as number))
                          ? (row[col] as number).toFixed(2) 
                          : '-'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-neutral-700 text-xs text-gray-500 dark:text-neutral-400 font-mono">
        <span>
          Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, tableData.length)} de {tableData.length} registros
        </span>
        <span>
          Intervalo: {DEFAULT_HOURS} hora(s)
        </span>
      </div>
    </div>
  );
}

export default PLCDataTable;