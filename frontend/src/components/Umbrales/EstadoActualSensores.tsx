import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';

// Tipos para el estado de los sensores
interface SensorEstado {
  nodoid: number;
  metricaid: number;
  tipoid: number;
  ubicacionid: number;
  valor_actual: number;
  estado: 'normal' | 'bajo_umbral' | 'sobre_umbral';
  umbral_minimo: number;
  umbral_maximo: number;
  ultima_medicion: string;
  criticidad: string;
  metrica: string;
  tipo: string;
  ubicacion: string;
}

interface EstadoPorCriticidad {
  [criticidad: string]: {
    sensores: SensorEstado[];
    total: number;
    alertas: number;
  };
}

// Hook personalizado para cargar datos
const useSensorData = () => {
  const [data, setData] = useState<{
    metricasensores: any[];
    umbrales: any[];
    alertas: any[];
    mediciones: any[];
    nodos: any[];
    metricas: any[];
    tipos: any[];
    ubicaciones: any[];
    criticidades: any[];
  }>({
    metricasensores: [],
    umbrales: [],
    alertas: [],
    mediciones: [],
    nodos: [],
    metricas: [],
    tipos: [],
    ubicaciones: [],
    criticidades: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);


      // Cargar todos los datos necesarios en paralelo
      const [
        metricasensores,
        umbrales,
        alertas,
        mediciones,
        nodos,
        metricas,
        tipos,
        ubicaciones,
        criticidades
      ] = await Promise.all([
        JoySenseService.getTableData('metricasensor', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('umbral', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('alerta', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('medicion', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('nodo', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('metrica', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('tipo', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('ubicacion', 1000).then(data => {
          return data;
        }),
        JoySenseService.getTableData('criticidad', 1000).then(data => {
          return data;
        })
      ]);

      setData({
        metricasensores: Array.isArray(metricasensores) ? metricasensores : [],
        umbrales: Array.isArray(umbrales) ? umbrales : [],
        alertas: Array.isArray(alertas) ? alertas : [],
        mediciones: Array.isArray(mediciones) ? mediciones : [],
        nodos: Array.isArray(nodos) ? nodos : [],
        metricas: Array.isArray(metricas) ? metricas : [],
        tipos: Array.isArray(tipos) ? tipos : [],
        ubicaciones: Array.isArray(ubicaciones) ? ubicaciones : [],
        criticidades: Array.isArray(criticidades) ? criticidades : []
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, loadData };
};

// Función para procesar alertas y generar estados de sensores
const processSensorStates = (
  alertas: any[],
  umbrales: any[],
  metricasensores: any[],
  mediciones: any[],
  nodos: any[],
  metricas: any[],
  tipos: any[],
  ubicaciones: any[],
  criticidades: any[]
): EstadoPorCriticidad => {
  const estadosPorCriticidad: EstadoPorCriticidad = {};

  console.log('📊 Datos recibidos:', {
    alertas: alertas.length,
    umbrales: umbrales.length,
    metricasensores: metricasensores.length,
    mediciones: mediciones.length,
    nodos: nodos.length,
    metricas: metricas.length,
    tipos: tipos.length,
    ubicaciones: ubicaciones.length,
    criticidades: criticidades.length
  });

  // Procesar desde alertas existentes
  if (alertas.length > 0) {
    console.log('📋 Alertas encontradas:', alertas.map(a => ({
      alertaid: a.alertaid,
      umbralid: a.umbralid,
      medicionid: a.medicionid,
      fecha: a.fecha
    })));
    
    for (const alerta of alertas) {
      try {
        // Buscar el umbral de esta alerta
        const umbral = umbrales.find(u => u.umbralid === alerta.umbralid);
        if (!umbral) {
          continue;
        }

        // Buscar el metricasensor correspondiente
        const metricasensor = metricasensores.find(ms => 
          ms.nodoid === umbral.nodoid && 
          ms.metricaid === umbral.metricaid &&
          ms.tipoid === umbral.tipoid
        );
        
        if (!metricasensor) {
          continue;
        }

        // Obtener el valor real de la medición
        const medicion = mediciones.find(m => m.medicionid === alerta.medicionid);
        const valorActual = medicion ? medicion.medicion || 0 : 0;

        // Determinar el estado basado en el valor real
        let estado: 'bajo_umbral' | 'sobre_umbral' = 'sobre_umbral';
        if (valorActual < umbral.minimo) {
          estado = 'bajo_umbral';
        } else if (valorActual > umbral.maximo) {
          estado = 'sobre_umbral';
        }

        // Obtener datos de referencia
        const nodo = nodos.find(n => n.nodoid === umbral.nodoid);
        const metrica = metricas.find(m => m.metricaid === umbral.metricaid);
        const tipo = tipos.find(t => t.tipoid === umbral.tipoid);
        const ubicacion = ubicaciones.find(u => u.ubicacionid === umbral.ubicacionid);
        const criticidad = criticidades.find(c => c.criticidadid === umbral.criticidadid);

        // Crear el estado del sensor
        const sensorEstado: SensorEstado = {
          nodoid: umbral.nodoid,
          metricaid: umbral.metricaid,
          tipoid: umbral.tipoid,
          ubicacionid: umbral.ubicacionid,
          valor_actual: valorActual,
          estado,
          umbral_minimo: umbral.minimo,
          umbral_maximo: umbral.maximo,
          ultima_medicion: alerta.fecha,
          criticidad: criticidad?.criticidad || 'Desconocida',
          metrica: metrica?.metrica || 'Desconocida',
          tipo: tipo?.tipo || 'Desconocido',
          ubicacion: ubicacion?.ubicacion || 'Desconocida'
        };

        // Agrupar por criticidad
        const criticidadNombre = criticidad?.criticidad || 'Desconocida';
        if (!estadosPorCriticidad[criticidadNombre]) {
          estadosPorCriticidad[criticidadNombre] = {
            sensores: [],
            total: 0,
            alertas: 0
          };
        }

        estadosPorCriticidad[criticidadNombre].sensores.push(sensorEstado);
        estadosPorCriticidad[criticidadNombre].total++;
        estadosPorCriticidad[criticidadNombre].alertas++;


      } catch (error) {
        console.error(`❌ Error procesando alerta ${alerta.alertaid}:`, error);
      }
    }
  }

  // Procesar sensores sin alertas (estado normal) - SOLO si no hay alertas
  // En "Registro de Alertas" solo queremos mostrar sensores con alertas activas
  if (alertas.length === 0) {
    
    for (const metricasensor of metricasensores) {
      try {

      // Buscar el umbral correspondiente
      const umbral = umbrales.find(u => 
        u.nodoid === metricasensor.nodoid && 
        u.metricaid === metricasensor.metricaid &&
        u.tipoid === metricasensor.tipoid
      );

      if (!umbral) continue; // No hay umbral configurado

      // Buscar la última medición
      const medicionesSensor = mediciones.filter(m => 
        m.nodoid === metricasensor.nodoid && 
        m.metricaid === metricasensor.metricaid && 
        m.tipoid === metricasensor.tipoid
      );

      if (medicionesSensor.length === 0) continue; // No hay mediciones

      // Obtener la medición más reciente
      const ultimaMedicion = medicionesSensor.reduce((latest, current) => {
        return new Date(current.fecha) > new Date(latest.fecha) ? current : latest;
      });

      const valorActual = ultimaMedicion.medicion || 0;

      // Determinar el estado
      let estado: 'normal' | 'bajo_umbral' | 'sobre_umbral' = 'normal';
      if (valorActual < umbral.minimo) {
        estado = 'bajo_umbral';
      } else if (valorActual > umbral.maximo) {
        estado = 'sobre_umbral';
      }

      // Obtener datos de referencia
      const nodo = nodos.find(n => n.nodoid === metricasensor.nodoid);
      const metrica = metricas.find(m => m.metricaid === metricasensor.metricaid);
      const tipo = tipos.find(t => t.tipoid === metricasensor.tipoid);
      const ubicacion = ubicaciones.find(u => u.ubicacionid === umbral.ubicacionid);
      const criticidad = criticidades.find(c => c.criticidadid === umbral.criticidadid);

      // Crear el estado del sensor
      const sensorEstado: SensorEstado = {
        nodoid: metricasensor.nodoid,
        metricaid: metricasensor.metricaid,
        tipoid: metricasensor.tipoid,
        ubicacionid: umbral.ubicacionid,
        valor_actual: valorActual,
        estado,
        umbral_minimo: umbral.minimo,
        umbral_maximo: umbral.maximo,
        ultima_medicion: ultimaMedicion.fecha,
        criticidad: criticidad?.criticidad || 'Desconocida',
        metrica: metrica?.metrica || 'Desconocida',
        tipo: tipo?.tipo || 'Desconocido',
        ubicacion: ubicacion?.ubicacion || 'Desconocida'
      };

      // Agrupar por criticidad
      const criticidadNombre = criticidad?.criticidad || 'Desconocida';
      if (!estadosPorCriticidad[criticidadNombre]) {
        estadosPorCriticidad[criticidadNombre] = {
          sensores: [],
          total: 0,
          alertas: 0
        };
      }

      estadosPorCriticidad[criticidadNombre].sensores.push(sensorEstado);
      estadosPorCriticidad[criticidadNombre].total++;
      if (estado !== 'normal') {
        estadosPorCriticidad[criticidadNombre].alertas++;
      }

    } catch (error) {
      console.error(`❌ Error procesando metricasensor ${metricasensor.nodoid}-${metricasensor.metricaid}-${metricasensor.tipoid}:`, error);
    }
  }
  } // Cerrar el if (alertas.length === 0)

  return estadosPorCriticidad;
};

// Props para el componente
interface EstadoActualSensoresProps {
  filtroCriticidad?: string;
  setFiltroCriticidad?: (value: string) => void;
  filtroUbicacion?: string;
  setFiltroUbicacion?: (value: string) => void;
  onDataLoaded?: (criticidades: string[], ubicaciones: string[]) => void;
}

// Componente principal
const EstadoActualSensores: React.FC<EstadoActualSensoresProps> = ({
  filtroCriticidad: externalFiltroCriticidad,
  setFiltroCriticidad: externalSetFiltroCriticidad,
  filtroUbicacion: externalFiltroUbicacion,
  setFiltroUbicacion: externalSetFiltroUbicacion,
  onDataLoaded
}) => {
  const { data, loading, error, loadData } = useSensorData();
  const [estadosSensores, setEstadosSensores] = useState<EstadoPorCriticidad>({});
  const [internalFiltroCriticidad, setInternalFiltroCriticidad] = useState<string>('todas');
  const [internalFiltroUbicacion, setInternalFiltroUbicacion] = useState<string>('todas');

  // Usar filtros externos si están disponibles, sino usar internos
  const filtroCriticidad = externalFiltroCriticidad ?? internalFiltroCriticidad;
  const setFiltroCriticidad = externalSetFiltroCriticidad ?? setInternalFiltroCriticidad;
  const filtroUbicacion = externalFiltroUbicacion ?? internalFiltroUbicacion;
  const setFiltroUbicacion = externalSetFiltroUbicacion ?? setInternalFiltroUbicacion;

  useEffect(() => {
    loadData();
  }, []);

  // Notificar cuando los datos estén cargados
  useEffect(() => {
    if (Object.keys(estadosSensores).length > 0 && onDataLoaded) {
      const criticidades = Object.keys(estadosSensores);
      const ubicaciones = Array.from(new Set(
        Object.values(estadosSensores).flatMap(data => data.sensores.map(s => s.ubicacion))
      ));
      onDataLoaded(criticidades, ubicaciones);
    }
  }, [estadosSensores, onDataLoaded]);

  useEffect(() => {
    console.log('🔄 useEffect triggered with data:', {
      metricasensores: data.metricasensores.length,
      umbrales: data.umbrales.length,
      alertas: data.alertas.length,
      mediciones: data.mediciones.length,
      nodos: data.nodos.length,
      metricas: data.metricas.length,
      tipos: data.tipos.length,
      ubicaciones: data.ubicaciones.length,
      criticidades: data.criticidades.length
    });

    if (data.metricasensores.length > 0) {
      const estados = processSensorStates(
        data.alertas,
        data.umbrales,
        data.metricasensores,
        data.mediciones,
        data.nodos,
        data.metricas,
        data.tipos,
        data.ubicaciones,
        data.criticidades
      );
      setEstadosSensores(estados);
    } else {
    }
  }, [data]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'bajo_umbral': return 'bg-blue-100 text-blue-800';
      case 'sobre_umbral': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiferenciaUmbral = (sensor: SensorEstado) => {
    if (sensor.estado === 'normal') {
      return '0.00';
    } else if (sensor.estado === 'bajo_umbral') {
      const diferencia = sensor.umbral_minimo - sensor.valor_actual;
      return `-${diferencia.toFixed(2)}`;
    } else if (sensor.estado === 'sobre_umbral') {
      const diferencia = sensor.valor_actual - sensor.umbral_maximo;
      return `+${diferencia.toFixed(2)}`;
    }
    return '0.00';
  };

  const sensoresFiltrados = Object.entries(estadosSensores).reduce((acc, [criticidad, data]) => {
    if (filtroCriticidad !== 'todas' && criticidad !== filtroCriticidad) return acc;
    
    const sensoresFiltrados = data.sensores.filter(sensor => {
      if (filtroUbicacion !== 'todas' && sensor.ubicacion !== filtroUbicacion) return false;
      return true;
    });

    if (sensoresFiltrados.length > 0) {
      acc[criticidad] = {
        ...data,
        sensores: sensoresFiltrados,
        total: sensoresFiltrados.length
      };
    }
    return acc;
  }, {} as EstadoPorCriticidad);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-white">Cargando estado de sensores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-gray-900 min-h-screen">
        <div className="text-red-500 mb-2">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Error al cargar datos</h3>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">


        {/* Resumen por criticidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(estadosSensores).map(([criticidad, data]) => (
            <div key={criticidad} className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">{criticidad}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Total sensores:</span>
                  <span className="text-white font-medium">{data.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Con alertas:</span>
                  <span className="text-red-400 font-medium">{data.alertas}</span>
                </div>
                                 {data.total > data.alertas && (
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-300">Normales:</span>
                     <span className="text-green-400 font-medium">{data.total - data.alertas}</span>
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de sensores */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sensor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Valor Actual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Umbrales
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Última Medición
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {Object.entries(sensoresFiltrados).map(([criticidad, data]) => (
                  <React.Fragment key={criticidad}>
                    {data.sensores.map((sensor, index) => (
                      <tr key={`${sensor.nodoid}-${sensor.metricaid}-${sensor.tipoid}-${index}`} className="hover:bg-gray-700">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            Nodo {sensor.nodoid}
                          </div>
                          <div className="text-sm text-gray-300">
                            {sensor.metrica} - {sensor.tipo}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {sensor.ubicacion}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-medium">
                          {sensor.valor_actual.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {sensor.umbral_minimo} - {sensor.umbral_maximo}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(sensor.estado)}`}>
                            {sensor.estado === 'normal' ? 'Normal' : 
                             sensor.estado === 'bajo_umbral' ? 'Bajo Umbral' : 'Sobre Umbral'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={`${sensor.estado === 'normal' ? 'text-gray-400' : 
                                           sensor.estado === 'bajo_umbral' ? 'text-blue-400' : 'text-red-400'}`}>
                            {getDiferenciaUmbral(sensor)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(sensor.ultima_medicion).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {Object.keys(sensoresFiltrados).length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <i className="fas fa-info-circle text-2xl"></i>
            </div>
            <p className="text-gray-300">No hay sensores que coincidan con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadoActualSensores;
