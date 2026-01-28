import React, { useState, useEffect } from 'react';
import SupabaseRPCService, { UmbralConEstadisticas } from '../../services/supabase-rpc';
import { JoySenseService } from '../../services/backend-api';

interface DatosHistoricos extends UmbralConEstadisticas {
  nodo_nombre: string;
  metrica_nombre: string;
}

interface ResumenAlertas {
  criticidad: string;
  total_sensores: number;
  tiempo_promedio_alerta: number; // en horas
  tendencia: 'mejorando' | 'empeorando' | 'estable';
}

const DashboardUmbrales: React.FC = () => {
  const [datosHistoricos, setDatosHistoricos] = useState<DatosHistoricos[]>([]);
  const [resumenAlertas, setResumenAlertas] = useState<ResumenAlertas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCriticidad, setFiltroCriticidad] = useState<string>('todas');
  const [periodoAnalisis, setPeriodoAnalisis] = useState<string>('7dias');
  const [nodoSeleccionado, setNodoSeleccionado] = useState<string>('');
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<string>('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  // Seleccionar automáticamente el primer umbral disponible
  useEffect(() => {
    if (datosHistoricos.length > 0 && !nodoSeleccionado) {
      const primerUmbral = datosHistoricos[0];
      setNodoSeleccionado(`${primerUmbral.umbralid}`);
      setMetricaSeleccionada(primerUmbral.metrica_nombre);
    }
  }, [datosHistoricos, nodoSeleccionado]);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);


      // Cargar datos reales de alertas y tablas relacionadas
      const [
        alertasData,
        umbralesData,
        medicionesData,
        nodosData,
        metricasData,
        tiposData,
        ubicacionesData,
        criticidadesData
      ] = await Promise.all([
        // ⚠️ Actualizado: La tabla 'alerta' fue eliminada en SCHEMA_04.01.2025
        JoySenseService.getTableData('alerta_regla', 1000),
        JoySenseService.getTableData('umbral', 1000),
        JoySenseService.getTableData('medicion', 1000),
        JoySenseService.getTableData('nodo', 1000),
        JoySenseService.getTableData('metrica', 1000),
        JoySenseService.getTableData('tipo', 1000),
        JoySenseService.getTableData('ubicacion', 1000),
        JoySenseService.getTableData('criticidad', 1000)
      ]);

      console.log('📊 Datos cargados para dashboard:', {
        alertas: alertasData?.length || 0,
        umbrales: umbralesData?.length || 0,
        mediciones: medicionesData?.length || 0,
        nodos: nodosData?.length || 0,
        metricas: metricasData?.length || 0,
        tipos: tiposData?.length || 0,
        ubicaciones: ubicacionesData?.length || 0,
        criticidades: criticidadesData?.length || 0
      });

      // Procesar alertas reales para el dashboard
      const datosReales: DatosHistoricos[] = [];
      const resumenReal: ResumenAlertas[] = [];
      
      if (alertasData && alertasData.length > 0) {
        // Agrupar alertas por sensor (nodoid + metricaid + tipoid)
        const alertasPorSensor = new Map<string, any[]>();
        
        for (const alerta of alertasData) {
          const umbral = umbralesData?.find(u => u.umbralid === alerta.umbralid);
          if (!umbral) continue;
          
          const sensorKey = `${umbral.nodoid}-${umbral.metricaid}-${umbral.tipoid}`;
          if (!alertasPorSensor.has(sensorKey)) {
            alertasPorSensor.set(sensorKey, []);
          }
          alertasPorSensor.get(sensorKey)!.push({ alerta, umbral });
        }

        // Procesar cada sensor con alertas
        alertasPorSensor.forEach((alertasSensor, sensorKey) => {
          try {
            const primeraAlerta = alertasSensor[0];
            const umbral = primeraAlerta.umbral;
            
            // Obtener datos de referencia
            const nodo = nodosData?.find(n => n.nodoid === umbral.nodoid);
            const metrica = metricasData?.find(m => m.metricaid === umbral.metricaid);
            const tipo = tiposData?.find(t => t.tipoid === umbral.tipoid);
            const criticidad = criticidadesData?.find(c => c.criticidadid === umbral.criticidadid);

            // Crear datos históricos para este sensor
            const datosSensor = alertasSensor.map((item: { alerta: any; umbral: any }) => {
              const { alerta, umbral } = item;
              const medicion = medicionesData?.find(m => m.medicionid === alerta.medicionid);
              const valorActual = medicion ? medicion.medicion || 0 : 0;
              
              // Determinar estado
              let estado: 'normal' | 'bajo_umbral' | 'sobre_umbral' = 'normal';
              if (valorActual < umbral.minimo) {
                estado = 'bajo_umbral';
              } else if (valorActual > umbral.maximo) {
                estado = 'sobre_umbral';
              }

              return {
                fecha: alerta.fecha,
                valor: valorActual,
                umbral_minimo: umbral.minimo,
                umbral_maximo: umbral.maximo,
                estado
              };
            });

            // Crear entrada de datos históricos
            const datosHistoricos: DatosHistoricos = {
              umbralid: umbral.umbralid,
              nodoid: umbral.nodoid,
              metricaid: umbral.metricaid,
              minimo: umbral.minimo,
              maximo: umbral.maximo,
              criticidad: umbral.criticidad,
              total_alertas: alertasSensor.length,
              tiempo_promedio_alerta: 24, // TODO: Calcular tiempo real
              nodo_nombre: nodo?.nodo || `Nodo ${umbral.nodoid}`,
              metrica_nombre: metrica?.metrica || 'Desconocida'
            };

            datosReales.push(datosHistoricos);

          } catch (error) {
            console.error(`❌ Error procesando sensor ${sensorKey} para dashboard:`, error);
          }
        });

        // Crear resumen por criticidad
        const criticidadesSet = new Set(datosReales.map(d => d.criticidad));
        const criticidadesUnicas = Array.from(criticidadesSet);
        for (const criticidad of criticidadesUnicas) {
          const sensoresConCriticidad = datosReales.filter(d => d.criticidad === criticidad);
          const totalAlertas = sensoresConCriticidad.reduce((sum, s) => sum + s.total_alertas, 0);
          
          resumenReal.push({
            criticidad,
            total_sensores: sensoresConCriticidad.length,
            tiempo_promedio_alerta: 24, // TODO: Calcular tiempo real
            tendencia: 'estable' // TODO: Calcular tendencia real
          });
        }
      }

      setDatosHistoricos(datosReales);
      setResumenAlertas(resumenReal);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'mejorando': return 'bg-green-100 text-green-800';
      case 'empeorando': return 'bg-red-100 text-red-800';
      case 'estable': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTendenciaIcono = (tendencia: string) => {
    switch (tendencia) {
      case 'mejorando': return '↗️';
      case 'empeorando': return '↘️';
      case 'estable': return '→';
      default: return '?';
    }
  };

  const formatearTiempo = (horas: number) => {
    if (horas < 24) {
      return `${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias}d ${horasRestantes}h`;
    }
  };

  const datosFiltrados = datosHistoricos.filter(umbral => 
    filtroCriticidad === 'todas' || umbral.criticidad === filtroCriticidad
  );

  // Obtener umbrales únicos para el selector
  const umbralUnicos = datosHistoricos.map(umbral => ({
    id: `${umbral.umbralid}`,
    nombre: `${umbral.nodo_nombre} - ${umbral.metrica_nombre}`,
    criticidad: umbral.criticidad
  }));

  // Obtener el umbral seleccionado
  const umbralSeleccionado = datosHistoricos.find(umbral => 
    `${umbral.umbralid}` === nodoSeleccionado
  );

  // Función para renderizar el gráfico mejorado
  const renderGraficoMejorado = (umbral: DatosHistoricos) => {
    if (!umbral) return null;

    const minimo = umbral.minimo;
    const maximo = umbral.maximo;
    
    // Calcular el rango del gráfico con margen
    const margen = (maximo - minimo) * 0.1;
    const rangoMin = minimo - margen;
    const rangoMax = maximo + margen;
    const rangoTotal = rangoMax - rangoMin;

    // Función para convertir valor a posición Y
    const valorToY = (valor: number) => {
      return ((rangoMax - valor) / rangoTotal) * 100;
    };

    return (
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-2">
            {umbral.nodo_nombre} - {umbral.metrica_nombre}
          </h4>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              umbral.criticidad === 'Crítica' ? 'bg-red-100 text-red-800' :
              umbral.criticidad === 'Alta' ? 'bg-orange-100 text-orange-800' :
              umbral.criticidad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {umbral.criticidad}
            </span>
            <span className="text-gray-400">
              {umbral.total_alertas} alertas en el período
            </span>
          </div>
        </div>

        {/* Información de umbrales */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Umbral Mínimo</p>
            <p className="text-blue-400 text-xl font-bold">{minimo}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Rango Normal</p>
            <p className="text-green-400 text-xl font-bold">{(maximo - minimo).toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Umbral Máximo</p>
            <p className="text-red-400 text-xl font-bold">{maximo}</p>
          </div>
        </div>

        {/* Estadísticas de alertas */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total de Alertas</p>
            <p className="text-white text-lg font-semibold">{umbral.total_alertas}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Tiempo Promedio de Alerta</p>
            <p className="text-white text-lg font-semibold">
              {umbral.tiempo_promedio_alerta.toFixed(2)}h
            </p>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-400"></div>
            <span>Umbral mínimo: {minimo}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-400"></div>
            <span>Umbral máximo: {maximo}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-gray-900 min-h-screen">
        <div className="text-red-500 mb-2">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-500 text-lg">Error cargando dashboard</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen">
      {/* Resumen de alertas por criticidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {resumenAlertas.map((resumen) => (
          <div key={resumen.criticidad} className="bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{resumen.criticidad}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTendenciaColor(resumen.tendencia)}`}>
                {getTendenciaIcono(resumen.tendencia)} {resumen.tendencia}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Sensores con alertas:</span>
                <span className="text-white font-semibold">{resumen.total_sensores}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tiempo promedio:</span>
                <span className="text-white font-semibold">{formatearTiempo(resumen.tiempo_promedio_alerta)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Filtros de Análisis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Seleccionar Umbral
            </label>
            <select
              value={nodoSeleccionado}
              onChange={(e) => {
                setNodoSeleccionado(e.target.value);
                const umbral = datosHistoricos.find(u => `${u.umbralid}` === e.target.value);
                if (umbral) {
                  setMetricaSeleccionada(umbral.metrica_nombre);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
            >
              <option value="">Seleccionar umbral...</option>
              {umbralUnicos.map(umbral => (
                <option key={umbral.id} value={umbral.id}>
                  {umbral.nombre} ({umbral.criticidad})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Criticidad
            </label>
            <select
              value={filtroCriticidad}
              onChange={(e) => setFiltroCriticidad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
            >
              <option value="todas">Todas las criticidades</option>
              {resumenAlertas.map(resumen => (
                <option key={resumen.criticidad} value={resumen.criticidad}>
                  {resumen.criticidad}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Período de Análisis
            </label>
            <select
              value={periodoAnalisis}
              onChange={(e) => setPeriodoAnalisis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
            >
              <option value="7dias">Últimos 7 días</option>
              <option value="30dias">Últimos 30 días</option>
              <option value="90dias">Últimos 90 días</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gráfico del umbral seleccionado */}
      {umbralSeleccionado && renderGraficoMejorado(umbralSeleccionado)}

      {/* Tabla de datos del umbral seleccionado */}
      {umbralSeleccionado && (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-600">
            <h3 className="text-lg font-medium text-white">
              Resumen del Umbral - {umbralSeleccionado.nodo_nombre} - {umbralSeleccionado.metrica_nombre}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Parámetro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-600">
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    Nodo
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {umbralSeleccionado.nodo_nombre}
                  </td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    Métrica
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {umbralSeleccionado.metrica_nombre}
                  </td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    Criticidad
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      umbralSeleccionado.criticidad === 'Crítica' ? 'bg-red-100 text-red-800' :
                      umbralSeleccionado.criticidad === 'Alta' ? 'bg-orange-100 text-orange-800' :
                      umbralSeleccionado.criticidad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {umbralSeleccionado.criticidad}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    Rango Mínimo
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">
                    {umbralSeleccionado.minimo}
                  </td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    Rango Máximo
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-400">
                    {umbralSeleccionado.maximo}
                  </td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    Total de Alertas (Período)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {umbralSeleccionado.total_alertas}
                  </td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    Tiempo Promedio de Alerta
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {umbralSeleccionado.tiempo_promedio_alerta.toFixed(2)} horas
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!umbralSeleccionado && datosFiltrados.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg">No hay datos de umbrales disponibles</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajusta los filtros o verifica que haya umbrales configurados
          </p>
        </div>
      )}

      {!umbralSeleccionado && datosFiltrados.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg">Selecciona un umbral para ver los detalles</p>
          <p className="text-sm text-gray-400 mt-1">
            Usa el selector de umbral en los filtros para visualizar los datos
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardUmbrales;
