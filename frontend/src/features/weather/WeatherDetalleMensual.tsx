import React, { useState, useEffect, useMemo } from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherWeekYearSlicer } from './components/WeatherWeekYearSlicer';
import { WeatherMensualTable, ResumenSemanalRow } from './components/WeatherMensualTable';
import { getIsoWeekDateRange, getCurrentIsoWeek } from './utils/weekYearUtils';
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

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await SupabaseRPCService.getResumenSemanalNodo({
          nodoid: selectedStation.nodoid,
          lunes: dateRange.startDate,
          domingo: dateRange.endDate,
        });

        if (cancelled) return;
        setTableData(data || []);
      } catch (err) {
        console.error('Error fetching detalle mensual:', err);
        setError('Error al cargar datos de la semana');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [selectedStation?.nodoid, selectedYear, selectedWeek]);

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
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Detalle Mensual — {dateRange.formatted}
              </h2>
            </div>
          )}

          {selectedStation && (
            <WeatherMensualTable
              data={tableData}
              loading={loading}
              stationName={selectedStation?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};
