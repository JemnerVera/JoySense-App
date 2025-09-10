import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';

interface Alerta {
  alertaid: number;
  umbral_nombre: string;
  nodo_id: number;
  nodo_nombre: string;
  ubicacion_nombre: string;
  fundo_nombre: string;
  empresa_nombre: string;
  valor_actual: number;
  valor_minimo: number;
  valor_maximo: number;
  metrica_nombre: string;
  tipo_nombre: string;
  criticidad: string;
  fecha_generada: string;
  usuarios_notificados: string[];
}

interface EstadisticasAlertas {
  total: number;
  porCriticidad: {
    [key: string]: number;
  };
  porUbicacion: {
    [key: string]: number;
  };
  porMetrica: {
    [key: string]: number;
  };
}

const AlertasDashboard: React.FC = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAlertas>({
    total: 0,
    porCriticidad: {},
    porUbicacion: {},
    porMetrica: {}
  });
  const [loading, setLoading] = useState(true);
  const [filtroCriticidad, setFiltroCriticidad] = useState<string>('todas');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todas');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlertas();
  }, []);

  const loadAlertas = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando alertas reales del sistema...');

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

      console.log('📊 Datos cargados:', {
        alertas: alertasData?.length || 0,
        umbrales: umbralesData?.length || 0,
        mediciones: medicionesData?.length || 0,
        nodos: nodosData?.length || 0,
        metricas: metricasData?.length || 0,
        tipos: tiposData?.length || 0,
        ubicaciones: ubicacionesData?.length || 0,
        criticidades: criticidadesData?.length || 0
      });

      // Procesar alertas reales
      const alertasReales: Alerta[] = [];
      
      if (alertasData && alertasData.length > 0) {
        for (const alerta of alertasData) {
          try {
            // Buscar el umbral de esta alerta
            const umbral = umbralesData?.find(u => u.umbralid === alerta.umbralid);
            if (!umbral) continue;

            // Obtener el valor real de la medición
            const medicion = medicionesData?.find(m => m.medicionid === alerta.medicionid);
            const valorActual = medicion ? medicion.medicion || 0 : 0;

            // Obtener datos de referencia
            const nodo = nodosData?.find(n => n.nodoid === umbral.nodoid);
            const metrica = metricasData?.find(m => m.metricaid === umbral.metricaid);
            const tipo = tiposData?.find(t => t.tipoid === umbral.tipoid);
            const ubicacion = ubicacionesData?.find(u => u.ubicacionid === umbral.ubicacionid);
            const criticidad = criticidadesData?.find(c => c.criticidadid === umbral.criticidadid);

            // Crear la alerta procesada
            const alertaProcesada: Alerta = {
              alertaid: alerta.alertaid,
              umbral_nombre: umbral.umbral || 'Umbral',
              nodo_id: umbral.nodoid,
              nodo_nombre: nodo?.nodo || `Nodo ${umbral.nodoid}`,
              ubicacion_nombre: ubicacion?.ubicacion || 'Desconocida',
              fundo_nombre: 'Fundo', // TODO: Obtener de tabla fundo si existe
              empresa_nombre: 'Empresa', // TODO: Obtener de tabla empresa si existe
              valor_actual: valorActual,
              valor_minimo: umbral.minimo,
              valor_maximo: umbral.maximo,
              metrica_nombre: metrica?.metrica || 'Desconocida',
              tipo_nombre: tipo?.tipo || 'Desconocido',
              criticidad: criticidad?.criticidad || 'Desconocida',
              fecha_generada: alerta.fecha,
              usuarios_notificados: [] // TODO: Implementar notificaciones
            };

            alertasReales.push(alertaProcesada);
            console.log(`✅ Alerta procesada: ${alertaProcesada.metrica_nombre} - Nodo ${alertaProcesada.nodo_id} - Valor: ${alertaProcesada.valor_actual}`);

          } catch (error) {
            console.error(`❌ Error procesando alerta ${alerta.alertaid}:`, error);
          }
        }
      }

      console.log(`📋 Total alertas procesadas: ${alertasReales.length}`);
      setAlertas(alertasReales);
      calcularEstadisticas(alertasReales);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error cargando alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (alertasData: Alerta[]) => {
    const stats: EstadisticasAlertas = {
      total: alertasData.length,
      porCriticidad: {},
      porUbicacion: {},
      porMetrica: {}
    };

    alertasData.forEach(alerta => {
      // Por criticidad
      stats.porCriticidad[alerta.criticidad] = (stats.porCriticidad[alerta.criticidad] || 0) + 1;
      
      // Por ubicación
      const ubicacionKey = `${alerta.empresa_nombre} - ${alerta.fundo_nombre}`;
      stats.porUbicacion[ubicacionKey] = (stats.porUbicacion[ubicacionKey] || 0) + 1;
      
      // Por métrica
      stats.porMetrica[alerta.metrica_nombre] = (stats.porMetrica[alerta.metrica_nombre] || 0) + 1;
    });

    setEstadisticas(stats);
  };

  const handleResolveAlert = async (alertaid: number) => {
    try {
      // Por ahora solo actualizar el estado local
      setAlertas(prev => prev.filter(a => a.alertaid !== alertaid));
      console.log(`Alerta ${alertaid} resuelta`);
    } catch (error) {
      console.error('Error resolviendo alerta:', error);
    }
  };

  const getCriticidadColor = (criticidad: string) => {
    switch (criticidad.toLowerCase()) {
      case 'baja': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'crítica': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getValorStatus = (valor: number, minimo: number, maximo: number) => {
    if (valor < minimo) return 'text-blue-600';
    if (valor > maximo) return 'text-red-600';
    return 'text-green-600';
  };

  const alertasFiltradas = alertas.filter(alerta => {
    if (filtroCriticidad !== 'todas' && alerta.criticidad !== filtroCriticidad) return false;
    if (filtroUbicacion !== 'todas' && !alerta.ubicacion_nombre.includes(filtroUbicacion)) return false;
    return true;
  });

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
        <p className="text-red-500 text-lg">Error cargando alertas</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen">
      {/* El título se muestra en el sidebar, no es necesario aquí */}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total Alertas</p>
              <p className="text-2xl font-bold text-white">{estadisticas.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Críticas</p>
              <p className="text-2xl font-bold text-white">{estadisticas.porCriticidad['Crítica'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Altas</p>
              <p className="text-2xl font-bold text-white">{estadisticas.porCriticidad['Alta'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Resueltas Hoy</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Criticidad
            </label>
            <select
              value={filtroCriticidad}
              onChange={(e) => setFiltroCriticidad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="todas">Todas las criticidades</option>
              {Object.keys(estadisticas.porCriticidad).map(criticidad => (
                <option key={criticidad} value={criticidad}>
                  {criticidad} ({estadisticas.porCriticidad[criticidad]})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ubicación
            </label>
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="todas">Todas las ubicaciones</option>
              {Object.keys(estadisticas.porUbicacion).map(ubicacion => (
                <option key={ubicacion} value={ubicacion}>
                  {ubicacion} ({estadisticas.porUbicacion[ubicacion]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de alertas */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-600">
          <h3 className="text-lg font-medium text-white">
            Alertas Activas ({alertasFiltradas.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Alerta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sensor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Límites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criticidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {alertasFiltradas.map((alerta) => (
                                  <tr key={alerta.alertaid} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {alerta.umbral_nombre}
                    </div>
                    <div className="text-sm text-gray-500">
                      {alerta.metrica_nombre} - {alerta.tipo_nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {alerta.empresa_nombre}
                    </div>
                    <div className="text-sm text-gray-400">
                      {alerta.fundo_nombre} - {alerta.ubicacion_nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {alerta.nodo_nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getValorStatus(alerta.valor_actual, alerta.valor_minimo, alerta.valor_maximo)}`}>
                      {alerta.valor_actual.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      <span className="text-red-400 font-medium">
                        {alerta.valor_minimo} - {alerta.valor_maximo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCriticidadColor(alerta.criticidad)}`}>
                      {alerta.criticidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {new Date(alerta.fecha_generada).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(alerta.fecha_generada).toLocaleTimeString('es-ES')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleResolveAlert(alerta.alertaid)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Resolver
                    </button>
                    <button
                      onClick={() => window.open(`/umbrales?edit=${alerta.alertaid}`, '_blank')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Umbral
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {alertasFiltradas.length === 0 && (
            <div className="text-center py-8">
              <div className="text-green-500 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-300 text-lg">¡Excelente! No hay alertas activas</p>
              <p className="text-sm text-gray-400 mt-1">
                Todos los sensores están funcionando dentro de los parámetros normales
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertasDashboard;
