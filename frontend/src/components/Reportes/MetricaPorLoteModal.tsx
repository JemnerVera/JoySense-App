import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { JoySenseService } from '../../services/backend-api';

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
  fechaFormatted: string;
  [tipoKey: string]: string | number | null | undefined; // Permite claves dinámicas para cada tipo
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
  const [tipos, setTipos] = useState<any[]>([]);
  const [tiposEnDatos, setTiposEnDatos] = useState<number[]>([]);

  // Cargar datos del gráfico
  useEffect(() => {
    if (isOpen && ubicacionId && metricaId && startDate && endDate) {
      loadChartData();
    }
  }, [isOpen, ubicacionId, metricaId, startDate, endDate, tipos]);

  // Cargar tipos de sensores
  useEffect(() => {
    const loadTipos = async () => {
      try {
        const tiposData = await JoySenseService.getTipos();
        setTipos(tiposData || []);
      } catch (err) {
        console.error('Error cargando tipos:', err);
      }
    };
    loadTipos();
  }, []);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener mediciones para el lote y métrica seleccionados
      // Limitar a un máximo razonable para el gráfico (últimas 10,000 mediciones o muestreo)
      const mediciones = await JoySenseService.getMediciones({
        ubicacionId,
        metricaId: metricaId,
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`,
        limit: 10000 // Limitar a 10,000 para el gráfico (suficiente para visualización)
      });

      // Ya están filtradas por métrica en el backend
      const medicionesFiltradas = Array.isArray(mediciones)
        ? mediciones.filter((m: any) => m.tipoid) // Solo filtrar por tipoid
        : [];

      if (medicionesFiltradas.length === 0) {
        setChartData([]);
        setTiposEnDatos([]);
        return;
      }

      // Obtener tipos únicos en los datos
      const tiposUnicos = Array.from(new Set(medicionesFiltradas.map((m: any) => m.tipoid).filter(Boolean)));
      setTiposEnDatos(tiposUnicos);

      // Si hay muchas mediciones, hacer muestreo para el gráfico (máximo 500 puntos)
      let medicionesParaGrafico = medicionesFiltradas;
      if (medicionesFiltradas.length > 500) {
        // Muestreo: tomar puntos distribuidos uniformemente
        const step = Math.ceil(medicionesFiltradas.length / 500);
        medicionesParaGrafico = medicionesFiltradas.filter((_, index) => index % step === 0);
      }

      // Agrupar por fecha y tipo (agrupar por hora para reducir puntos)
      const dataByTimeAndTipo = new Map<string, { [tipoid: number]: number[] }>();

      medicionesParaGrafico.forEach((medicion: any) => {
        if (!medicion.fecha || medicion.medicion == null || isNaN(medicion.medicion) || !medicion.tipoid) {
          return;
        }

        const fechaObj = new Date(medicion.fecha);
        // Usar hora para más granularidad - siempre agrupar por hora para ver variaciones
        const timeKey = `${fechaObj.toISOString().split('T')[0]} ${String(fechaObj.getHours()).padStart(2, '0')}:00`;

        if (!dataByTimeAndTipo.has(timeKey)) {
          dataByTimeAndTipo.set(timeKey, {});
        }

        const timeData = dataByTimeAndTipo.get(timeKey)!;
        if (!timeData[medicion.tipoid]) {
          timeData[medicion.tipoid] = [];
        }
        timeData[medicion.tipoid].push(parseFloat(medicion.medicion));
      });

      // Convertir a array de puntos de datos con una propiedad por tipo
      const dataPoints: ChartDataPoint[] = Array.from(dataByTimeAndTipo.entries())
        .map(([timeKey, tiposData]) => {
          const fechaObj = new Date(timeKey.split(' ')[0]);
          // Formato: DD/MM HH:00
          const fechaFormatted = `${String(fechaObj.getDate()).padStart(2, '0')}/${String(fechaObj.getMonth() + 1).padStart(2, '0')} ${timeKey.split(' ')[1]}`;

          const point: ChartDataPoint = {
            fecha: timeKey,
            fechaFormatted
          };

          // Calcular promedio por tipo
          tiposUnicos.forEach(tipoid => {
            const tipo = tipos.find(t => t.tipoid === tipoid);
            const tipoNombre = tipo?.tipo || `Tipo ${tipoid}`;
            const valores = tiposData[tipoid] || [];
            const promedio = valores.length > 0
              ? valores.reduce((sum, val) => sum + val, 0) / valores.length
              : null;
            
            // Usar el nombre del tipo como clave
            point[tipoNombre] = promedio !== null ? promedio : null;
          });

          return point;
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
      <div className="bg-neutral-900 dark:bg-neutral-900 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
          {loading ? (
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="fechaFormatted"
                    axisLine={{ stroke: '#4b5563' }}
                    tickLine={{ stroke: '#4b5563' }}
                    tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    axisLine={{ stroke: '#4b5563' }}
                    tickLine={{ stroke: '#4b5563' }}
                    tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
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
                    formatter={(value: any) => {
                      if (value == null || value === undefined) return '--';
                      return typeof value === 'number' ? value.toFixed(2) : value;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#9ca3af', fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
                  />
                  {tiposEnDatos.map((tipoid, index) => {
                    const tipo = tipos.find(t => t.tipoid === tipoid);
                    const tipoNombre = tipo?.tipo || `Tipo ${tipoid}`;
                    // Colores contrastantes para diferentes tipos
                    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Line
                        key={tipoid}
                        type="monotone"
                        dataKey={tipoNombre}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 3 }}
                        activeDot={{ r: 5, fill: color }}
                        connectNulls={false}
                        name={tipoNombre}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MetricaPorLoteModal;

