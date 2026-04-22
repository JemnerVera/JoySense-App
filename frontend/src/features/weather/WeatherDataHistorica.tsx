import React, { useState, useEffect } from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { WeatherStationSelector } from './WeatherStationSelector';
import SupabaseRPCService from '../../services/supabase-rpc';

type TimeRange = '7d' | '14d' | '30d' | '90d';

export const WeatherDataHistorica: React.FC = () => {
  const { stations, selectedStation, setSelectedStation } = useWeatherData();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedStation) {
      fetchHistoricalData();
    }
  }, [selectedStation, timeRange]);

  const fetchHistoricalData = async () => {
    if (!selectedStation) return;
    
    setLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : 90;
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      
      const data = await SupabaseRPCService.getMedicionesNodoDetallado({
        nodoid: selectedStation.nodoid,
        startDate,
        endDate,
      });
      
      setHistoricalData(data || []);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    } finally {
      setLoading(false);
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
        
        <div className="flex gap-2">
          {(['7d', '14d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {range === '7d' ? '7 Días' : range === '14d' ? '14 Días' : range === '30d' ? '30 Días' : '90 Días'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
        ) : historicalData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-mono">
            No hay datos disponibles para el período seleccionado
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-500 font-mono">Registros</div>
                <div className="text-2xl font-mono font-bold text-gray-700 dark:text-gray-200">
                  {historicalData.length}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-500 font-mono">Rango</div>
                <div className="text-lg font-mono font-bold text-gray-700 dark:text-gray-200">
                  {timeRange === '7d' ? '7 Días' : timeRange === '14d' ? '14 Días' : timeRange === '30d' ? '30 Días' : '90 Días'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-500 font-mono">Estación</div>
                <div className="text-lg font-mono font-bold text-gray-700 dark:text-gray-200">
                  {selectedStation.name}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-500 font-mono">Última Lectura</div>
                <div className="text-lg font-mono font-bold text-gray-700 dark:text-gray-200">
                  {historicalData.length > 0 
                    ? new Date(historicalData[historicalData.length - 1]?.created_at).toLocaleString()
                    : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-md font-mono font-semibold mb-3 text-gray-600 dark:text-gray-300">
                Vista de Datos (Últimos 50 registros)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm font-mono">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Fecha</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Temp (°C)</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Humedad (%)</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Presión (hPa)</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Viento (km/h)</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Lluvia (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {historicalData.slice(0, 50).map((record: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                          {new Date(record.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {record.temperature?.toFixed(1) || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {record.humidity?.toFixed(1) || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {record.pressure?.toFixed(1) || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {record.wind_speed?.toFixed(1) || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {record.rain?.toFixed(2) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDataHistorica;