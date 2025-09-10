import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';

interface DashboardLineChartProps {
  entidadId: number | null;
  ubicacionId: number | null;
  startDate: string;
  endDate: string;
}

interface MeasurementData {
  fecha: string;
  mediciones: {
    [metricaId: string]: {
      metrica: string;
      nodo: string;
      valor: number;
      color: string;
    }[];
  };
}

export const DashboardLineChart: React.FC<DashboardLineChartProps> = ({
  entidadId,
  ubicacionId,
  startDate,
  endDate
}) => {
  const [measurementData, setMeasurementData] = useState<MeasurementData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetricas, setSelectedMetricas] = useState<number[]>([]);
  const [selectedNodos, setSelectedNodos] = useState<number[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [nodos, setNodos] = useState<any[]>([]);

  // Colores para las líneas
  const colors = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Cargar datos de mediciones
  const loadMeasurementData = async () => {
    console.log('🔍 loadMeasurementData llamado con:', { entidadId, ubicacionId, startDate, endDate });
    
    if (!entidadId || !ubicacionId || !startDate || !endDate) {
      console.log('❌ Faltan parámetros, limpiando datos');
      setMeasurementData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Cargando mediciones para:', { entidadId, ubicacionId, startDate, endDate });

      // Obtener datos reales de mediciones del backend
      console.log('🔍 Llamando a getMediciones con:', { entidadId, ubicacionId, startDate, endDate });
      const medicionesResponse = await JoySenseService.getMediciones({
        entidadId,
        ubicacionId,
        startDate,
        endDate
      });

      console.log('📊 Respuesta de getMediciones:', medicionesResponse);

      // Verificar si es un array o un objeto con count
      const medicionesData = Array.isArray(medicionesResponse) ? medicionesResponse : [];
      console.log('📊 Mediciones obtenidas:', medicionesData.length);
      
      if (medicionesData.length > 0) {
        console.log('📊 Primera medición:', medicionesData[0]);
      }

      // Obtener métricas y nodos para procesar los datos
      const metricasData = await JoySenseService.getTableData('metricasensor');
      const nodosData = await JoySenseService.getTableData('nodo');

      console.log('📈 Métricas obtenidas:', metricasData.length);
      console.log('📍 Nodos obtenidos:', nodosData.length);

      // Guardar métricas y nodos en el estado
      setMetricas(metricasData);
      setNodos(nodosData);

      // Procesar datos para agrupar por fecha
      const dataByDate: { [fecha: string]: MeasurementData } = {};

      medicionesData.forEach((medicion: any) => {
        const fecha = medicion.fecha.split('T')[0]; // Solo la fecha, sin hora
        
        if (!dataByDate[fecha]) {
          dataByDate[fecha] = {
            fecha,
            mediciones: {}
          };
        }

        // Encontrar la métrica correspondiente
        const metrica = metricasData.find((m: any) => m.metricasensorid === medicion.metricasensorid);
        const nodo = nodosData.find((n: any) => n.nodoid === medicion.nodoid);

        if (metrica && nodo) {
          const metricaId = metrica.metricasensorid;
          
          if (!dataByDate[fecha].mediciones[metricaId]) {
            dataByDate[fecha].mediciones[metricaId] = [];
          }

          dataByDate[fecha].mediciones[metricaId].push({
            metrica: metrica.metrica,
            nodo: nodo.nodo,
            valor: parseFloat(medicion.medicion),
            color: colors[(metricaId * nodosData.length + medicion.nodoid) % colors.length]
          });
        }
      });

      // Convertir a array y ordenar por fecha
      const processedData = Object.values(dataByDate).sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

      console.log('✅ Datos procesados:', processedData.length, 'días');
      setMeasurementData(processedData);

      // Inicializar selecciones por defecto
      if (selectedMetricas.length === 0 && metricasData.length > 0) {
        setSelectedMetricas([metricasData[0].metricasensorid]);
      }
      if (selectedNodos.length === 0 && nodosData.length > 0) {
        setSelectedNodos(nodosData.slice(0, 3).map((n: any) => n.nodoid)); // Seleccionar primeros 3 nodos
      }

    } catch (err) {
      console.error('❌ Error cargando datos de mediciones:', err);
      setError('Error cargando datos de mediciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeasurementData();
  }, [entidadId, ubicacionId, startDate, endDate]);

  const toggleMetrica = (metricaId: number) => {
    setSelectedMetricas(prev => 
      prev.includes(metricaId) 
        ? prev.filter(id => id !== metricaId)
        : [...prev, metricaId]
    );
  };

  const toggleNodo = (nodoId: number) => {
    setSelectedNodos(prev => 
      prev.includes(nodoId) 
        ? prev.filter(id => id !== nodoId)
        : [...prev, nodoId]
    );
  };

  const getMaxValue = () => {
    let max = 0;
    measurementData.forEach(day => {
      Object.entries(day.mediciones).forEach(([metricaId, metricaData]) => {
        if (selectedMetricas.includes(parseInt(metricaId))) {
          metricaData.forEach(medicion => {
            const nodoId = nodos.find(n => n.nodo === medicion.nodo)?.nodoid;
            if (nodoId && selectedNodos.includes(nodoId)) {
              max = Math.max(max, medicion.valor);
            }
          });
        }
      });
    });
    return max;
  };

  const maxValue = getMaxValue();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!entidadId || !ubicacionId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 text-4xl mb-2">📊</div>
          <p className="text-gray-400">Selecciona entidad y ubicación para ver el gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-white text-lg font-semibold mb-4">Mediciones por Fecha</h3>
      
      {/* Lista de Nodos Disponibles */}
      <div className="mb-4">
        <h4 className="text-gray-300 text-sm font-medium mb-2">Nodos Disponibles:</h4>
        <div className="flex flex-wrap gap-2">
          {nodos.map(nodo => (
            <button
              key={nodo.nodoid}
              onClick={() => toggleNodo(nodo.nodoid)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedNodos.includes(nodo.nodoid)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {nodo.nodo}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico de Líneas */}
      <div className="h-64 mb-4 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Eje Y */}
          <line
            x1="40"
            y1="20"
            x2="40"
            y2="240"
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Eje X */}
          <line
            x1="40"
            y1="240"
            x2="100%"
            y2="240"
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Líneas de mediciones */}
          {selectedMetricas.map(metricaId => {
            const metrica = metricas.find(m => m.metricasensorid === metricaId);
            if (!metrica) return null;

            return selectedNodos.map(nodoId => {
              const nodo = nodos.find(n => n.nodoid === nodoId);
              if (!nodo) return null;

              const points: string[] = [];
              measurementData.forEach((day, index) => {
                const mediciones = day.mediciones[metricaId];
                if (mediciones) {
                  const medicion = mediciones.find(m => m.nodo === nodo.nodo);
                  if (medicion) {
                    const x = 40 + (index / (measurementData.length - 1)) * (window.innerWidth - 100);
                    const y = 240 - (medicion.valor / maxValue) * 200;
                    points.push(`${x},${y}`);
                  }
                }
              });

              if (points.length > 1) {
                return (
                  <polyline
                    key={`${metricaId}-${nodoId}`}
                    points={points.join(' ')}
                    fill="none"
                    stroke={colors[(metricaId * nodos.length + nodoId) % colors.length]}
                    strokeWidth="2"
                  />
                );
              }
              return null;
            });
          })}

          {/* Puntos de datos */}
          {selectedMetricas.map(metricaId => {
            const metrica = metricas.find(m => m.metricasensorid === metricaId);
            if (!metrica) return null;

            return selectedNodos.map(nodoId => {
              const nodo = nodos.find(n => n.nodoid === nodoId);
              if (!nodo) return null;

              return measurementData.map((day, index) => {
                const mediciones = day.mediciones[metricaId];
                if (mediciones) {
                  const medicion = mediciones.find(m => m.nodo === nodo.nodo);
                  if (medicion) {
                    const x = 40 + (index / (measurementData.length - 1)) * (window.innerWidth - 100);
                    const y = 240 - (medicion.valor / maxValue) * 200;
                    
                    return (
                      <circle
                        key={`${metricaId}-${nodoId}-${index}`}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={colors[(metricaId * nodos.length + nodoId) % colors.length]}
                        className="hover:r-4 transition-all cursor-pointer"
                      >
                        <title>{`${metrica.metrica} - ${nodo.nodo}: ${medicion.valor.toFixed(2)}`}</title>
                      </circle>
                    );
                  }
                }
                return null;
              });
            });
          })}
        </svg>
      </div>

      {/* Leyenda de Métricas */}
      <div className="mt-4">
        <h4 className="text-gray-300 text-sm font-medium mb-2">Métricas:</h4>
        <div className="flex flex-wrap gap-2">
          {metricas.map((metrica, metricaIndex) => (
            <button
              key={metrica.metricasensorid}
              onClick={() => toggleMetrica(metrica.metricasensorid)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedMetricas.includes(metrica.metricasensorid)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {metrica.metrica}
            </button>
          ))}
        </div>
      </div>

      {/* Información de selección */}
      <div className="mt-4 text-xs text-gray-400">
        <p>Métricas seleccionadas: {selectedMetricas.length}</p>
        <p>Nodos seleccionados: {selectedNodos.length}</p>
        <p>Período: {startDate} a {endDate}</p>
      </div>
    </div>
  );
};
