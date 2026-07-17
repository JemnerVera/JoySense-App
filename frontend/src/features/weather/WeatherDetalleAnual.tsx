import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherAnualChart, SemanaMetricaRow } from './components/WeatherAnualChart';
import { getMetricConfig } from './utils/metricChartConfig';
import { useExportPDF } from '../../hooks/useExportPDF';
import SupabaseRPCService from '../../services/supabase-rpc';

interface MetricOption {
  metricaid: number;
  name: string;
  label: string;
  unit: string;
  color: string;
}

export const WeatherDetalleAnual: React.FC = () => {
  const {
    stations,
    stationsLoading,
    selectedStation,
    setSelectedStation,
  } = useWeatherData();

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 2, currentYear - 1, currentYear].filter(y => y >= 2024);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [metricOptions, setMetricOptions] = useState<MetricOption[]>([]);
  const [selectedMetricaId1, setSelectedMetricaId1] = useState<number | null>(null);
  const [selectedMetricaId2, setSelectedMetricaId2] = useState<number | null>(null);
  const [seriesList, setSeriesList] = useState<Array<{
    metricaid: number;
    metricName: string;
    label: string;
    unit: string;
    color: string;
    decimals: number;
    data: SemanaMetricaRow[];
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const stationName = selectedStation?.name || 'Estacion';
  const { exportToPDF, exportToImage, exporting } = useExportPDF({ stationName });

  const [isMetric1DropdownOpen, setIsMetric1DropdownOpen] = useState(false);
  const [isMetric2DropdownOpen, setIsMetric2DropdownOpen] = useState(false);
  const [metric1SearchTerm, setMetric1SearchTerm] = useState('');
  const [metric2SearchTerm, setMetric2SearchTerm] = useState('');

  useEffect(() => {
    if (!selectedStation) {
      setMetricOptions([]);
      setSelectedMetricaId1(null);
      setSelectedMetricaId2(null);
      return;
    }

    const fetchMetrics = async () => {
      try {
        const metrics = await SupabaseRPCService.getMetricasNodo({
          nodoid: selectedStation.nodoid,
        });

        const mapped = metrics
          .map((m: any) => {
            const config = getMetricConfig(m.nombre);
            return {
              metricaid: m.metricaid,
              name: m.nombre,
              label: config.label,
              unit: config.unit,
              color: config.color,
            };
          })
          .sort((a: MetricOption, b: MetricOption) => a.label.localeCompare(b.label));

        const gddOptions: MetricOption[] = [
          { metricaid: -7, name: 'gdd_7', label: 'GDD 7°C', unit: '°C·día', color: '#e67e22' },
          { metricaid: -10, name: 'gdd_10', label: 'GDD 10°C', unit: '°C·día', color: '#d35400' },
          { metricaid: -11, name: 'dpv', label: 'DPV', unit: 'hPa', color: '#8b5cf6' },
          { metricaid: -12, name: 'fluctuacion', label: 'Fluctuación', unit: '°C', color: '#14b8a6' },
        ];
        const allOptions = [...mapped, ...gddOptions];
        setMetricOptions(allOptions);
        const tempOut = allOptions.find(m => m.name === 'temp_out');
        const humOut = allOptions.find(m => m.name === 'hum_out');
        setSelectedMetricaId1(tempOut?.metricaid ?? allOptions[0]?.metricaid);
        const default2 = humOut?.metricaid ?? allOptions.find(m => m.metricaid !== (tempOut?.metricaid ?? -1))?.metricaid;
        if (default2) setSelectedMetricaId2(default2);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      }
    };

    fetchMetrics();
  }, [selectedStation?.nodoid]);

  const activeMetricaIds = useMemo(() => {
    const ids: number[] = [];
    if (selectedMetricaId1 !== null) ids.push(selectedMetricaId1);
    if (selectedMetricaId2 !== null) ids.push(selectedMetricaId2);
    return ids;
  }, [selectedMetricaId1, selectedMetricaId2]);

  useEffect(() => {
    if (!selectedStation || activeMetricaIds.length === 0) {
      setSeriesList([]);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fechaDesde = `${selectedYear}-01-01 00:00:00`;
        const fechaHasta = `${selectedYear + 1}-01-01 00:00:00`;

        const results = await Promise.all(
          activeMetricaIds.map(async (metricaid) => {
            const metricInfo = metricOptions.find((m) => m.metricaid === metricaid);
            const isGdd = metricaid === -7 || metricaid === -10;
            const isDpv = metricaid === -11;
            const isFluctuacion = metricaid === -12;

            const rawData = isGdd
              ? await SupabaseRPCService.getGddSemanalesPorAnual({
                  nodoid: selectedStation.nodoid,
                  tempBase: Math.abs(metricaid),
                  anuales: [selectedYear],
                })
              : isDpv
                ? await SupabaseRPCService.getDpvSemanalesPorAnual({
                    nodoid: selectedStation.nodoid,
                    anuales: [selectedYear],
                  })
                : isFluctuacion
                  ? await SupabaseRPCService.getFluctuacionSemanalesPorAnual({
                      nodoid: selectedStation.nodoid,
                      anuales: [selectedYear],
                    })
                  : await SupabaseRPCService.getResumenSemanalMetricaNodo({
                      nodoid: selectedStation.nodoid,
                      metricaid,
                      fechaDesde,
                      fechaHasta,
                    });

            const data: SemanaMetricaRow[] = isGdd
              ? (rawData || []).map((d: any) => ({
                  iso_anual: d.iso_anual,
                  semana_iso: d.semana_iso,
                  valor_avg: d.gdd_total,
                  valor_min: null,
                  valor_max: null,
                  cantidad_mediciones: d.dias_con_datos,
                }))
              : isDpv
                ? (rawData || []).map((d: any) => ({
                    iso_anual: d.iso_anual,
                    semana_iso: d.semana_iso,
                    valor_avg: d.dpv_avg,
                    valor_min: null,
                    valor_max: d.dpv_max,
                    cantidad_mediciones: d.dias_con_datos,
                  }))
                : isFluctuacion
                  ? (rawData || []).map((d: any) => ({
                      iso_anual: d.iso_anual,
                      semana_iso: d.semana_iso,
                      valor_avg: d.fluctuacion_avg,
                      valor_min: null,
                      valor_max: d.fluctuacion_max,
                      cantidad_mediciones: d.dias_con_datos,
                    }))
                  : (rawData || []);

            const config = getMetricConfig(metricInfo?.name || '');
            return {
              metricaid,
              metricName: metricInfo?.name || String(metricaid),
              label: metricInfo?.label || config.label,
              unit: metricInfo?.unit || config.unit,
              color: metricInfo?.color || config.color,
              decimals: config.decimals,
              data,
            };
          })
        );

        if (cancelled) return;
        setSeriesList(results);
      } catch (err) {
        console.error('Error fetching anual data:', err);
        setError('Error al cargar datos anuales');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [selectedStation?.nodoid, selectedYear, activeMetricaIds.join(',')]);

  const filteredMetrics1 = metricOptions.filter((m) =>
    m.label.toLowerCase().includes(metric1SearchTerm.toLowerCase())
  );
  const filteredMetrics2 = metricOptions.filter(
    (m) =>
      m.metricaid !== selectedMetricaId1 &&
      m.label.toLowerCase().includes(metric2SearchTerm.toLowerCase())
  );

  const selectedMetric1 = metricOptions.find((m) => m.metricaid === selectedMetricaId1);
  const selectedMetric2 = metricOptions.find((m) => m.metricaid === selectedMetricaId2);

  return (
    <div className="w-full flex flex-col bg-gray-50 dark:bg-black" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-60 min-w-[15rem] bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col overflow-y-auto font-mono" style={{ height: 'calc(100vh - 56px)' }}>
          <div className="p-4 space-y-4">
            {/* Station Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Estación
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={selectedStation?.nodoid ?? ''}
                onChange={(e) => {
                  const station = stations.find((s) => s.nodoid === Number(e.target.value));
                  setSelectedStation(station || null);
                }}
              >
                <option value="">Seleccionar estación</option>
                {stations.map((s) => (
                  <option key={s.nodoid} value={s.nodoid}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Año
              </label>
              <div className="flex gap-1 flex-wrap">
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedYear === y
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric 1 Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Métrica 1
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setIsMetric1DropdownOpen(!isMetric1DropdownOpen);
                    setIsMetric2DropdownOpen(false);
                    setMetric1SearchTerm('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-left text-sm text-gray-800 dark:text-gray-200 flex items-center justify-between gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedMetric1?.color || '#6b7280' }}
                  />
                  <span className="flex-1 truncate">{selectedMetric1?.label || 'Seleccionar'}</span>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMetric1DropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100 dark:border-neutral-600">
                      <input
                        type="text"
                        placeholder="Buscar métrica..."
                        value={metric1SearchTerm}
                        onChange={(e) => setMetric1SearchTerm(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        autoFocus
                      />
                    </div>
                    {filteredMetrics1.map((m) => (
                      <button
                        key={m.metricaid}
                        onClick={() => {
                          setSelectedMetricaId1(m.metricaid);
                          setIsMetric1DropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-neutral-600 ${
                          selectedMetricaId1 === m.metricaid ? 'bg-gray-50 dark:bg-neutral-600' : ''
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                        <span>{m.label}</span>
                        <span className="text-xs text-gray-400 ml-auto">({m.unit})</span>
                      </button>
                    ))}
                    {filteredMetrics1.length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metric 2 Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Métrica 2 (opcional)
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setIsMetric2DropdownOpen(!isMetric2DropdownOpen);
                    setIsMetric1DropdownOpen(false);
                    setMetric2SearchTerm('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-left text-sm text-gray-800 dark:text-gray-200 flex items-center justify-between gap-2"
                >
                  {selectedMetric2 ? (
                    <>
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selectedMetric2.color }}
                      />
                      <span className="flex-1 truncate">{selectedMetric2.label}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Ninguna</span>
                  )}
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMetric2DropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedMetricaId2(null);
                        setIsMetric2DropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
                    >
                      — Ninguna —
                    </button>
                    <div className="p-2 border-b border-gray-100 dark:border-neutral-600">
                      <input
                        type="text"
                        placeholder="Buscar métrica..."
                        value={metric2SearchTerm}
                        onChange={(e) => setMetric2SearchTerm(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        autoFocus
                      />
                    </div>
                    {filteredMetrics2.map((m) => (
                      <button
                        key={m.metricaid}
                        onClick={() => {
                          setSelectedMetricaId2(m.metricaid);
                          setIsMetric2DropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-neutral-600 ${
                          selectedMetricaId2 === m.metricaid ? 'bg-gray-50 dark:bg-neutral-600' : ''
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                        <span>{m.label}</span>
                        <span className="text-xs text-gray-400 ml-auto">({m.unit})</span>
                      </button>
                    ))}
                    {filteredMetrics2.length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 min-w-0 flex flex-col mx-6 mb-6 mt-6 font-mono">
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
                Detalle Anual {selectedYear} — {selectedStation.name}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
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
              <WeatherAnualChart
                series={seriesList}
                year={selectedYear}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
