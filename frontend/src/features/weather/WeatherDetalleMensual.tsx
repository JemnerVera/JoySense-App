import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherWeekYearSlicer } from './components/WeatherWeekYearSlicer';
import { WeatherMensualTable, ResumenSemanalRow } from './components/WeatherMensualTable';
import { getIsoWeekDateRange, getCurrentIsoWeek } from './utils/weekYearUtils';
import { useExportPDF } from '../../hooks/useExportPDF';
import SupabaseRPCService from '../../services/supabase-rpc';

export const WeatherDetalleMensual: React.FC = () => {
  const {
    stations,
    stationsLoading,
    selectedStation,
    setSelectedStation,
  } = useWeatherData();

  const currentWeek = getCurrentIsoWeek();
  const [selectedYear, setSelectedYear] = useState(currentWeek.year);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek.week);
  const [tableData, setTableData] = useState<ResumenSemanalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const stationName = selectedStation?.name || 'Estacion';
  const { exportToPDF, exportToImage, exporting } = useExportPDF({ stationName });

  const fetchWeekData = useCallback(async () => {
    if (!selectedStation) return;
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getIsoWeekDateRange(selectedYear, selectedWeek);
      const [data, gdd7, gdd10, fluctData, dpvData] = await Promise.all([
        SupabaseRPCService.getResumenSemanalNodo({
          nodoid: selectedStation.nodoid,
          lunes: startDate,
          domingo: endDate,
        }),
        SupabaseRPCService.getGdd({
          nodoid: selectedStation.nodoid,
          fechaDesde: `${startDate} 00:00:00`,
          fechaHasta: `${endDate} 23:59:59`,
          tempBase: 7,
        }),
        SupabaseRPCService.getGdd({
          nodoid: selectedStation.nodoid,
          fechaDesde: `${startDate} 00:00:00`,
          fechaHasta: `${endDate} 23:59:59`,
          tempBase: 10,
        }),
        SupabaseRPCService.getFluctuacion({
          nodoid: selectedStation.nodoid,
          fechaDesde: `${startDate} 00:00:00`,
          fechaHasta: `${endDate} 23:59:59`,
        }),
        SupabaseRPCService.getDpv({
          nodoid: selectedStation.nodoid,
          fechaDesde: `${startDate} 00:00:00`,
          fechaHasta: `${endDate} 23:59:59`,
        }),
      ]);

      const gdd7Map = new Map((gdd7 || []).map((g: any) => [g.fecha, g.gdd_diario]));
      const gdd10Map = new Map((gdd10 || []).map((g: any) => [g.fecha, g.gdd_diario]));
      const fluctMap = new Map((fluctData || []).map((f: any) => [f.fecha, f.fluctuacion]));
      const dpvMap = new Map((dpvData || []).map((d: any) => [d.fecha, d.dpv]));

      const merged = (data || []).map((row: any) => ({
        ...row,
        fluctuacion: fluctMap.get(row.dia) ?? null,
        dpv: dpvMap.get(row.dia) ?? null,
        gdd_7: gdd7Map.get(row.dia) ?? null,
        gdd_10: gdd10Map.get(row.dia) ?? null,
      }));

      setTableData(merged);
    } catch (err) {
      console.error('Error fetching detalle mensual:', err);
      setError('Error al cargar datos de la semana');
    } finally {
      setLoading(false);
    }
  }, [selectedStation?.nodoid, selectedYear, selectedWeek]);

  const dateRange = useMemo(() => {
    const { startDate, endDate } = getIsoWeekDateRange(selectedYear, selectedWeek);
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');

    const formatPart = (d: Date) => {
      const day = d.getUTCDate().toString().padStart(2, '0');
      const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    };

    const startStr = formatPart(start);
    const endStr = formatPart(end);
    const endYear = end.getUTCFullYear();
    const currentYear = new Date().getFullYear();

    const formatted =
      endYear === currentYear
        ? `${startStr} – ${endStr}/${endYear}`
        : `${startStr}/${start.getUTCFullYear()} – ${endStr}/${endYear}`;

    return { startDate, endDate, formatted };
  }, [selectedYear, selectedWeek]);

  useEffect(() => {
    if (!selectedStation) {
      setTableData([]);
      return;
    }
    fetchWeekData();
  }, [fetchWeekData]);

  return (
    <div className="w-full flex flex-col bg-gray-50 dark:bg-black" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WeatherWeekYearSlicer
          stations={stations}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
          stationsLoading={stationsLoading}
          availableMetrics={[]}
          selectedMetricName={null}
          onMetricChange={() => {}}
          selectedYear={selectedYear}
          selectedWeek={selectedWeek}
          onYearChange={setSelectedYear}
          onWeekChange={setSelectedWeek}
        />

        <div className="flex-1 min-h-0 min-w-0 flex flex-col mx-6 mb-6 mt-6">
          {!selectedStation && (
            <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center flex-1 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona una estación del panel izquierdo
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {selectedStation && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 font-mono">
                Detalle Mensual — {dateRange.formatted}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchWeekData}
                  disabled={loading}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
                  title="Actualizar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => contentRef.current && exportToPDF(contentRef, { title: `Meteorologia_${stationName}` })}
                  disabled={exporting}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                  title="Exportar PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => contentRef.current && exportToImage(contentRef)}
                  disabled={exporting}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                  title="Exportar Imagen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {selectedStation && (
            <div ref={contentRef} className="flex-1 min-h-0">
              <WeatherMensualTable
                data={tableData}
                loading={loading}
                stationName={selectedStation?.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
