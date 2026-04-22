import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import SupabaseRPCService from '../../services/supabase-rpc';
import { useExportPDF } from '../../hooks/useExportPDF';

type TimeRange = '1d' | '7d' | '14d' | '30d' | '90d' | 'custom';

interface MetricInfo {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  color: string;
}

const METRIC_MAP: Record<string, MetricInfo> = {
  temp_out: { key: 'temp_out', label: 'Temp', unit: '°C', decimals: 1, color: 'text-red-600' },
  hum_out: { key: 'hum_out', label: 'Humedad', unit: '%', decimals: 0, color: 'text-blue-600' },
  dew_point: { key: 'dew_point', label: 'Punto Rocío', unit: '°C', decimals: 1, color: 'text-cyan-600' },
  temp_in: { key: 'temp_in', label: 'Temp Int', unit: '°C', decimals: 1, color: 'text-orange-600' },
  hum_in: { key: 'hum_in', label: 'Hum Int', unit: '%', decimals: 0, color: 'text-blue-400' },
  wind_speed_10_min_avg: { key: 'wind_speed_10_min_avg', label: 'Viento', unit: 'km/h', decimals: 1, color: 'text-gray-600' },
  wind_dir: { key: 'wind_dir', label: 'Dir Viento', unit: '°', decimals: 0, color: 'text-gray-500' },
  wind_gust_10_min: { key: 'wind_gust_10_min', label: 'Ráfaga', unit: 'km/h', decimals: 1, color: 'text-red-500' },
  rain_day_mm: { key: 'rain_day_mm', label: 'Lluvia', unit: 'mm', decimals: 2, color: 'text-blue-600' },
  rain_rate_mm: { key: 'rain_rate_mm', label: 'Tasa Lluvia', unit: 'mm/h', decimals: 2, color: 'text-blue-500' },
  solar_rad: { key: 'solar_rad', label: 'Radiación', unit: 'W/m²', decimals: 0, color: 'text-yellow-600' },
  bar: { key: 'bar', label: 'Presión', unit: 'hPa', decimals: 0, color: 'text-purple-600' },
  et_day: { key: 'et_day', label: 'ET', unit: 'mm', decimals: 2, color: 'text-green-600' },
  wind_chill: { key: 'wind_chill', label: 'Wind Chill', unit: '°C', decimals: 1, color: 'text-blue-400' },
  heat_index: { key: 'heat_index', label: 'Heat Index', unit: '°C', decimals: 1, color: 'text-red-400' },
  thw_index: { key: 'thw_index', label: 'THW', unit: '°C', decimals: 1, color: 'text-purple-500' },
  thsw_index: { key: 'thsw_index', label: 'THSW', unit: '°C', decimals: 1, color: 'text-pink-600' },
};

const getMetricInfo = (metricName: string): MetricInfo => {
  return METRIC_MAP[metricName] || { 
    key: metricName, 
    label: metricName, 
    unit: '', 
    decimals: 1,
    color: 'text-gray-600'
  };
};

const RECORDS_PER_PAGE = 50;

export const WeatherDataHistorica: React.FC = () => {
  const { stations, selectedStation, setSelectedStation } = useWeatherData();
  const [timeRange, setTimeRange] = useState<TimeRange>('1d');
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const contentRef = useRef<HTMLDivElement>(null);
  const stationName = selectedStation?.name || 'Estacion';
  const { exportToPDF, exportToImage, exporting } = useExportPDF({ stationName });

  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;
    
    if (timeRange === 'custom') {
      startDate = customStartDate ? new Date(customStartDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      endDate = customEndDate ? new Date(customEndDate) : new Date();
    } else {
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      endDate = new Date();
    }
    
    return {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    };
  };

  useEffect(() => {
    if (selectedStation) {
      fetchHistoricalData();
      setCurrentPage(1);
    }
  }, [selectedStation, timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    setCustomStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setCustomEndDate(new Date().toISOString().slice(0, 10));
  }, []);

  const fetchHistoricalData = async () => {
    if (!selectedStation) return;
    
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedStation.nodoid,
        startDate,
        endDate,
      });
      
      setRawData(data || []);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableMetrics = useMemo(() => {
    if (!rawData.length) return [];
    const metrics = [...new Set(rawData.map((r: any) => r.metrica_nombre))];
    return metrics.sort().filter(m => m);
  }, [rawData]);

  const pivotedData = useMemo(() => {
    if (!rawData.length || !availableMetrics.length) return [];
    
    interface DataRow {
      fecha: string;
      [key: string]: string | number | null;
    }
    
    const grouped: Record<string, DataRow> = {};
    
    rawData.forEach((record: any) => {
      const fecha = record.fecha?.slice(0, 16) || '';
      if (!fecha) return;
      
      if (!grouped[fecha]) {
        grouped[fecha] = { fecha };
        availableMetrics.forEach(m => {
          grouped[fecha][m] = null;
        });
      }
      
      if (record.medicion !== null) {
        grouped[fecha][record.metrica_nombre] = record.medicion;
      }
    });
    
    return Object.values(grouped).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [rawData, availableMetrics]);

  const totalPages = Math.ceil(pivotedData.length / RECORDS_PER_PAGE);
  const paginatedData = pivotedData.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );

  const formatValue = (value: number | null, decimals: number = 1): string => {
    if (value === null) return '-';
    return value.toFixed(decimals);
  };

  const formatFecha = (fecha: string): string => {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return fecha;
      return date.toLocaleString('es-PE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <WeatherStationSelector
          stations={stations}
          selectedStation={selectedStation}
          onSelect={setSelectedStation}
        />
        
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {(['1d', '7d', '14d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-200'
                }`}
              >
                {range === '1d' ? '1D' : range === '7d' ? '7D' : '14D'}
              </button>
            ))}
            
            <button
              key="custom"
              onClick={() => setTimeRange('custom')}
              className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
                timeRange === 'custom'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
          
          {timeRange === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200"
              />
              <span className="text-gray-500 font-mono text-xs">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200"
              />
            </div>
          )}
          
          <button
            onClick={fetchHistoricalData}
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

      <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-mono font-bold mb-4 text-gray-700 dark:text-gray-200">
          Datos Históricos - {selectedStation?.name || 'Sin seleccionar'}
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : !selectedStation ? (
          <div className="text-center py-12 text-gray-500 font-mono">
            Selecciona una estación para ver datos históricos
          </div>
        ) : pivotedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-mono">
            No hay datos disponibles para el período seleccionado
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-neutral-700 rounded p-3">
                <div className="text-xs text-gray-500 font-mono">Registros</div>
                <div className="text-xl font-mono font-bold text-gray-700 dark:text-gray-200">
                  {pivotedData.length}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-700 rounded p-3">
                <div className="text-xs text-gray-500 font-mono">Rango</div>
                <div className="text-base font-mono font-bold text-gray-700 dark:text-gray-200">
                  {timeRange === '1d' ? '1 Día' : timeRange === '7d' ? '7 Días' : timeRange === '14d' ? '14 Días' : 'Personalizado'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-700 rounded p-3">
                <div className="text-xs text-gray-500 font-mono">Métricas</div>
                <div className="text-base font-mono font-bold text-gray-700 dark:text-gray-200">
                  {availableMetrics.length}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-700 rounded p-3">
                <div className="text-xs text-gray-500 font-mono">Última Fecha</div>
                <div className="text-base font-mono font-bold text-gray-700 dark:text-gray-200">
                  {pivotedData.length > 0 ? formatFecha(String(pivotedData[0]?.fecha)) : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="mt-6 overflow-x-auto">
              <h3 className="text-md font-mono font-semibold mb-3 text-gray-600 dark:text-gray-300">
                Vista de Datos ({availableMetrics.length} métricas)
              </h3>
              <div className="rounded-lg border border-gray-300 dark:border-neutral-700" style={{ minWidth: 'max-content' }}>
                <table className="min-w-full text-xs font-mono">
                  <thead className="bg-gray-200 dark:bg-neutral-700 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-200 dark:bg-neutral-700">Fecha</th>
                      {availableMetrics.map(metric => {
                        const info = getMetricInfo(metric);
                        return (
                          <th key={metric} className="px-2 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {info.label} {info.unit && `(${info.unit})`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-600">
                    {paginatedData.map((record: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-gray-50 dark:bg-neutral-700'}>
                        <td className="px-2 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap sticky left-0 bg-inherit">
                          {formatFecha(record.fecha)}
                        </td>
                        {availableMetrics.map(metric => {
                          const info = getMetricInfo(metric);
                          return (
                            <td key={metric} className={`px-2 py-2 text-right ${info.color} dark:${info.color.replace('text-', 'text-')}`}>
                              {formatValue(record[metric], info.decimals)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-2 px-3 border-t border-gray-200 dark:border-neutral-600">
                  <div className="text-xs text-gray-500 font-mono">
                    Página {currentPage} de {totalPages} ({pivotedData.length} registros)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs font-mono rounded bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs font-mono rounded bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      «
                    </button>
                    <span className="px-3 py-1 text-xs font-mono text-gray-600 dark:text-gray-300">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs font-mono rounded bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs font-mono rounded bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDataHistorica;