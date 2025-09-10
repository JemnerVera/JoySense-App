import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';

interface DatosHistoricos {
  sensorid: number;
  nodo_nombre: string;
  metrica_nombre: string;
  criticidad: string;
  datos: {
    fecha: string;
    valor: number;
    umbral_minimo: number;
    umbral_maximo: number;
    estado: 'normal' | 'bajo_umbral' | 'sobre_umbral';
  }[];
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

  // Seleccionar automáticamente el primer nodo disponible
  useEffect(() => {
    if (datosHistoricos.length > 0 && !nodoSeleccionado) {
      const primerNodo = datosHistoricos[0];
      setNodoSeleccionado(`${primerNodo.sensorid}-${primerNodo.metrica_nombre}`);
      setMetricaSeleccionada(primerNodo.metrica_nombre);
    }
  }, [datosHistoricos, nodoSeleccionado]);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando dashboard con datos reales de alertas...');

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
        JoySenseService.getTableData('alerta', 1000),
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
              sensorid: parseInt(sensorKey.split('-')[0]), // Usar nodoid como sensorid
              nodo_nombre: nodo?.nodo || `Nodo ${umbral.nodoid}`,
              metrica_nombre: metrica?.metrica || 'Desconocida',
              criticidad: criticidad?.criticidad || 'Desconocida',
              datos: datosSensor
            };

            datosReales.push(datosHistoricos);
            console.log(`✅ Sensor procesado para dashboard: ${datosHistoricos.nodo_nombre} - ${datosHistoricos.metrica_nombre} - ${datosHistoricos.datos.length} alertas`);

          } catch (error) {
            console.error(`❌ Error procesando sensor ${sensorKey} para dashboard:`, error);
          }
        });

        // Crear resumen por criticidad
        const criticidadesSet = new Set(datosReales.map(d => d.criticidad));
        const criticidadesUnicas = Array.from(criticidadesSet);
        for (const criticidad of criticidadesUnicas) {
          const sensoresConCriticidad = datosReales.filter(d => d.criticidad === criticidad);
          const totalAlertas = sensoresConCriticidad.reduce((sum, s) => sum + s.datos.length, 0);
          
          resumenReal.push({
            criticidad,
            total_sensores: sensoresConCriticidad.length,
            tiempo_promedio_alerta: 24, // TODO: Calcular tiempo real
            tendencia: 'estable' // TODO: Calcular tendencia real
          });
        }
      }

      console.log(`📋 Dashboard procesado: ${datosReales.length} sensores con alertas, ${resumenReal.length} criticidades`);
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

  const datosFiltrados = datosHistoricos.filter(sensor => 
    filtroCriticidad === 'todas' || sensor.criticidad === filtroCriticidad
  );

  // Obtener nodos únicos para el selector
  const nodosUnicos = Array.from(new Set(datosHistoricos.map(sensor => ({
    id: `${sensor.sensorid}-${sensor.metrica_nombre}`,
    nombre: `${sensor.nodo_nombre} - ${sensor.metrica_nombre}`,
    criticidad: sensor.criticidad
  }))));

  // Obtener el sensor seleccionado
  const sensorSeleccionado = datosHistoricos.find(sensor => 
    `${sensor.sensorid}-${sensor.metrica_nombre}` === nodoSeleccionado
  );

  // Función para renderizar el gráfico mejorado
  const renderGraficoMejorado = (sensor: DatosHistoricos) => {
    if (!sensor || sensor.datos.length === 0) return null;

    const datos = sensor.datos;
    const valorMin = Math.min(...datos.map(d => d.valor));
    const valorMax = Math.max(...datos.map(d => d.valor));
    const umbralMin = datos[0].umbral_minimo;
    const umbralMax = datos[0].umbral_maximo;
    
    // Calcular el rango del gráfico con margen
    const margen = (valorMax - valorMin) * 0.1;
    const rangoMin = Math.min(valorMin - margen, umbralMin - margen);
    const rangoMax = Math.max(valorMax + margen, umbralMax + margen);
    const rangoTotal = rangoMax - rangoMin;

    // Función para convertir valor a posición Y
    const valorToY = (valor: number) => {
      return ((rangoMax - valor) / rangoTotal) * 100;
    };

    return (
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-2">
            {sensor.nodo_nombre} - {sensor.metrica_nombre}
          </h4>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              sensor.criticidad === 'Crítica' ? 'bg-red-100 text-red-800' :
              sensor.criticidad === 'Alta' ? 'bg-orange-100 text-orange-800' :
              sensor.criticidad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {sensor.criticidad}
            </span>
            <span className="text-gray-400">
              {sensor.datos.length} mediciones
            </span>
          </div>
        </div>

        {/* Gráfico */}
        <div className="relative h-80 bg-gray-800 rounded-lg p-4">
          {/* Eje Y con valores */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-400">
            <span>{rangoMax.toFixed(1)}</span>
            <span>{((rangoMax + rangoMin) / 2).toFixed(1)}</span>
            <span>{rangoMin.toFixed(1)}</span>
          </div>

          {/* Área del gráfico */}
          <div className="ml-12 mr-4 h-full relative">
            {/* Líneas de umbrales horizontales */}
            <div 
              className="absolute left-0 right-0 h-0.5 bg-blue-400 opacity-70"
              style={{ top: `${valorToY(umbralMin)}%` }}
            >
              <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 text-xs text-blue-400">
                Min: {umbralMin}
              </div>
            </div>
            <div 
              className="absolute left-0 right-0 h-0.5 bg-red-400 opacity-70"
              style={{ top: `${valorToY(umbralMax)}%` }}
            >
              <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 text-xs text-red-400">
                Max: {umbralMax}
              </div>
            </div>

            {/* Línea de datos */}
            <svg className="absolute inset-0 w-full h-full">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                points={datos.map((dato, index) => {
                  const x = (index / (datos.length - 1)) * 100;
                  const y = valorToY(dato.valor);
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Puntos de datos */}
              {datos.map((dato, index) => {
                const x = (index / (datos.length - 1)) * 100;
                const y = valorToY(dato.valor);
                const color = dato.estado === 'normal' ? '#10b981' : 
                             dato.estado === 'bajo_umbral' ? '#3b82f6' : '#ef4444';
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                    stroke="white"
                    strokeWidth="1"
                  >
                    <title>
                      {new Date(dato.fecha).toLocaleString()}: {dato.valor.toFixed(2)}
                    </title>
                  </circle>
                );
              })}
            </svg>

            {/* Eje X con fechas */}
            <div className="absolute bottom-0 left-0 right-0 h-8 flex justify-between items-end text-xs text-gray-400">
              {datos.filter((_, index) => index % Math.ceil(datos.length / 8) === 0).map((dato, index) => (
                <div key={index} className="text-center">
                  <div className="transform -rotate-45 origin-top-left">
                    {new Date(dato.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Bajo umbral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Sobre umbral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-400"></div>
            <span>Umbral mínimo: {umbralMin}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-400"></div>
            <span>Umbral máximo: {umbralMax}</span>
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
                <span className="text-gray-300">Sensores en alerta:</span>
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
              Seleccionar Nodo
            </label>
            <select
              value={nodoSeleccionado}
              onChange={(e) => {
                setNodoSeleccionado(e.target.value);
                const [sensorId, metrica] = e.target.value.split('-');
                setMetricaSeleccionada(metrica);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
            >
              <option value="">Seleccionar nodo...</option>
              {nodosUnicos.map(nodo => (
                <option key={nodo.id} value={nodo.id}>
                  {nodo.nombre} ({nodo.criticidad})
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

      {/* Gráfico del nodo seleccionado */}
      {sensorSeleccionado && renderGraficoMejorado(sensorSeleccionado)}

      {/* Tabla de datos del nodo seleccionado */}
      {sensorSeleccionado && (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-600">
            <h3 className="text-lg font-medium text-white">
              Datos Históricos - {sensorSeleccionado.nodo_nombre} - {sensorSeleccionado.metrica_nombre}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Umbrales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-600">
                {sensorSeleccionado.datos.map((dato, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {new Date(dato.fecha).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(dato.fecha).toLocaleTimeString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        dato.estado === 'normal' ? 'text-green-600' :
                        dato.estado === 'bajo_umbral' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {dato.valor.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <span className="text-red-400 font-medium">
                          {dato.umbral_minimo} - {dato.umbral_maximo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dato.estado === 'normal' ? 'bg-green-100 text-green-800' :
                        dato.estado === 'bajo_umbral' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {dato.estado === 'normal' ? 'Normal' :
                         dato.estado === 'bajo_umbral' ? 'Bajo Umbral' : 'Sobre Umbral'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!sensorSeleccionado && datosFiltrados.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg">No hay datos históricos disponibles</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajusta los filtros o verifica que haya sensores en alerta
          </p>
        </div>
      )}

      {!sensorSeleccionado && datosFiltrados.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg">Selecciona un nodo para ver el gráfico</p>
          <p className="text-sm text-gray-400 mt-1">
            Usa el selector de nodo en los filtros para visualizar los datos
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardUmbrales;
