import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';
import { useRechartsLazy } from '../../hooks/useRechartsLazy';

interface MetricaPorLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ubicacionId: number;
  ubicacionNombre: string;
  metricaId: number;
  metricaNombre: string;
  startDate: string;
  endDate: string;
}

interface ChartDataPoint {
  fecha: string;
  valor: number;
  fechaFormatted: string;
}

const MetricaPorLoteModal: React.FC<MetricaPorLoteModalProps> = ({
  isOpen,
  onClose,
  ubicacionId,
  ubicacionNombre,
  metricaId,
  metricaNombre,
  startDate,
  endDate
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, loading: chartsLoading } = useRechartsLazy();

  // Cargar datos del gráfico
  useEffect(() => {
    if (isOpen && ubicacionId && metricaId && startDate && endDate) {
      loadChartData();
    }
  }, [isOpen, ubicacionId, metricaId, startDate, endDate]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener mediciones para el lote y métrica seleccionados
      const mediciones = await JoySenseService.getMediciones({
        ubicacionId,
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`,
        getAll: true
      });

      // Filtrar por métrica
      const medicionesFiltradas = Array.isArray(mediciones)
        ? mediciones.filter((m: any) => m.metricaid === metricaId)
        : [];

      // Agrupar por fecha y calcular promedio diario
      const dataByDate = new Map<string, number[]>();

      medicionesFiltradas.forEach((medicion: any) => {
        const fecha = medicion.fecha ? medicion.fecha.split('T')[0] : '';
        if (fecha && medicion.medicion != null && !isNaN(medicion.medicion)) {
          if (!dataByDate.has(fecha)) {
            dataByDate.set(fecha, []);
          }
          dataByDate.get(fecha)?.push(parseFloat(medicion.medicion));
        }
      });

      // Convertir a array de puntos de datos
      const dataPoints: ChartDataPoint[] = Array.from(dataByDate.entries())
        .map(([fecha, valores]) => {
          const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length;
          const fechaObj = new Date(fecha);
          const fechaFormatted = fechaObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          return {
            fecha,
            valor: promedio,
            fechaFormatted
          };
        })
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      setChartData(dataPoints);
    } catch (err: any) {
      console.error('Error cargando datos del gráfico:', err);
      setError('Error al cargar datos del gráfico');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600 dark:border-gray-600">
          <div>
            <h2 className="text-xl font-bold text-white dark:text-white font-mono tracking-wider">
              EVOLUCIÓN DE MÉTRICA EN EL TIEMPO
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-400 font-mono mt-1">
              Lote: {ubicacionNombre} | Métrica: {metricaNombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading || chartsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-gray-400 dark:text-gray-400 font-mono">Cargando gráfico...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-2">⚠️</div>
                <p className="text-red-400 font-mono">{error}</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-400 dark:text-gray-400 font-mono">
                  No hay datos disponibles para el período seleccionado
                </p>
              </div>
            </div>
          ) : (
            <div className="h-96">
              {LineChart && Line && XAxis && YAxis && CartesianGrid && Tooltip && ResponsiveContainer ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis
                      dataKey="fechaFormatted"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 dark:text-gray-400 font-mono">Cargando componentes del gráfico...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-600 dark:border-gray-600 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-mono tracking-wider transition-colors"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetricaPorLoteModal;

