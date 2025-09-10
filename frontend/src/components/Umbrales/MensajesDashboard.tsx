import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';

interface Mensaje {
  alertaid: number;
  contactoid: number;
  mensaje: string;
  fecha: string;
  usercreatedid: number;
  datecreated: string;
  statusid: number;
  // Datos relacionados
  contacto?: {
    usuarioid: number;
    celular?: string;
    correo?: string;
    medioid: number;
  };
  medio?: {
    nombre: string;
  };
  usuario?: {
    login: string;
    firstname?: string;
    lastname?: string;
  };
  alerta?: {
    umbralid: number;
    medicionid: number;
    fecha: string;
  };
  umbral?: {
    umbral: string;
    minimo: number;
    maximo: number;
    criticidadid: number;
  };
  criticidad?: {
    criticidad: string;
  };
  medicion?: {
    medicion: number;
    nodoid: number;
  };
}

interface EstadisticasMensajes {
  total: number;
  porMedio: {
    [key: string]: number;
  };
  porCriticidad: {
    [key: string]: number;
  };
  porEstado: {
    [key: string]: number;
  };
}

const MensajesDashboard: React.FC = () => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasMensajes>({
    total: 0,
    porMedio: {},
    porCriticidad: {},
    porEstado: {}
  });
  const [loading, setLoading] = useState(true);
  const [filtroMedio, setFiltroMedio] = useState<string>('todos');
  const [filtroCriticidad, setFiltroCriticidad] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMensajes();
  }, []);

  const loadMensajes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando mensajes reales del sistema...');

      // Cargar datos reales de mensajes y tablas relacionadas
      const [
        mensajesData,
        contactosData,
        mediosData,
        usuariosData,
        alertasData,
        umbralesData,
        criticidadesData,
        medicionesData
      ] = await Promise.all([
        JoySenseService.getTableData('mensaje', 1000),
        JoySenseService.getTableData('contacto', 1000),
        JoySenseService.getTableData('medio', 1000),
        JoySenseService.getTableData('usuario', 1000),
        JoySenseService.getTableData('alerta', 1000),
        JoySenseService.getTableData('umbral', 1000),
        JoySenseService.getTableData('criticidad', 1000),
        JoySenseService.getTableData('medicion', 1000)
      ]);

      console.log('📊 Datos cargados:', {
        mensajes: mensajesData?.length || 0,
        contactos: contactosData?.length || 0,
        medios: mediosData?.length || 0,
        usuarios: usuariosData?.length || 0,
        alertas: alertasData?.length || 0,
        umbrales: umbralesData?.length || 0,
        criticidades: criticidadesData?.length || 0,
        mediciones: medicionesData?.length || 0
      });

      // Procesar mensajes reales
      const mensajesReales: Mensaje[] = [];
      
      if (mensajesData && mensajesData.length > 0) {
        for (const mensaje of mensajesData) {
          try {
            // Buscar datos relacionados
            const contacto = contactosData?.find(c => c.contactoid === mensaje.contactoid);
            const medio = mediosData?.find(m => m.medioid === contacto?.medioid);
            const usuario = usuariosData?.find(u => u.usuarioid === contacto?.usuarioid);
            const alerta = alertasData?.find(a => a.alertaid === mensaje.alertaid);
            const umbral = umbralesData?.find(u => u.umbralid === alerta?.umbralid);
            const criticidad = criticidadesData?.find(c => c.criticidadid === umbral?.criticidadid);
            const medicion = medicionesData?.find(m => m.medicionid === alerta?.medicionid);

            // Crear el mensaje procesado
            const mensajeProcesado: Mensaje = {
              ...mensaje,
              contacto,
              medio,
              usuario,
              alerta,
              umbral,
              criticidad,
              medicion
            };

            mensajesReales.push(mensajeProcesado);
            console.log(`✅ Mensaje procesado: ${medio?.nombre || 'N/A'} - ${usuario?.login || 'N/A'} - ${criticidad?.criticidad || 'N/A'}`);

          } catch (error) {
            console.error(`❌ Error procesando mensaje ${mensaje.alertaid}:`, error);
          }
        }
      }

      console.log(`📋 Total mensajes procesados: ${mensajesReales.length}`);
      setMensajes(mensajesReales);
      calcularEstadisticas(mensajesReales);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error cargando mensajes:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (mensajesData: Mensaje[]) => {
    const stats: EstadisticasMensajes = {
      total: mensajesData.length,
      porMedio: {},
      porCriticidad: {},
      porEstado: {}
    };

    mensajesData.forEach(mensaje => {
      // Por medio
      const medio = mensaje.medio?.nombre || 'Desconocido';
      stats.porMedio[medio] = (stats.porMedio[medio] || 0) + 1;
      
      // Por criticidad
      const criticidad = mensaje.criticidad?.criticidad || 'Desconocida';
      stats.porCriticidad[criticidad] = (stats.porCriticidad[criticidad] || 0) + 1;
      
      // Por estado
      const estado = mensaje.statusid === -1 ? 'Pendiente' : 'Enviado';
      stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;
    });

    setEstadisticas(stats);
  };

  const handleMarkAsSent = async (alertaid: number) => {
    try {
      // Por ahora solo actualizar el estado local
      setMensajes(prev => prev.map(m => 
        m.alertaid === alertaid 
          ? { ...m, statusid: 1 } 
          : m
      ));
      console.log(`Mensaje ${alertaid} marcado como enviado`);
    } catch (error) {
      console.error('Error marcando mensaje:', error);
    }
  };

  const getEstadoColor = (statusid: number) => {
    return statusid === -1 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800';
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

  const mensajesFiltrados = mensajes.filter(mensaje => {
    if (filtroMedio !== 'todos' && mensaje.medio?.nombre !== filtroMedio) return false;
    if (filtroCriticidad !== 'todas' && mensaje.criticidad?.criticidad !== filtroCriticidad) return false;
    if (filtroEstado !== 'todos') {
      const estado = mensaje.statusid === -1 ? 'Pendiente' : 'Enviado';
      if (estado !== filtroEstado) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-white">Cargando mensajes...</span>
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
        <p className="text-red-500 text-lg">Error cargando mensajes</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total Mensajes</p>
              <p className="text-2xl font-bold text-white">{estadisticas.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Pendientes</p>
              <p className="text-2xl font-bold text-white">{estadisticas.porEstado['Pendiente'] || 0}</p>
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
              <p className="text-sm font-medium text-gray-300">Enviados</p>
              <p className="text-2xl font-bold text-white">{estadisticas.porEstado['Enviado'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">WhatsApp</p>
              <p className="text-2xl font-bold text-white">{estadisticas.porMedio['WhatsApp'] || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Medio
            </label>
            <select
              value={filtroMedio}
              onChange={(e) => setFiltroMedio(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="todos">Todos los medios</option>
              {Object.keys(estadisticas.porMedio).map(medio => (
                <option key={medio} value={medio}>
                  {medio} ({estadisticas.porMedio[medio]})
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
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Enviado">Enviados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de mensajes */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-600">
          <h3 className="text-lg font-medium text-white">
            Mensajes de Alerta ({mensajesFiltrados.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Medio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Criticidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Mensaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {mensajesFiltrados.map((mensaje) => (
                <tr key={`${mensaje.alertaid}-${mensaje.contactoid}`} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {mensaje.usuario?.firstname || mensaje.usuario?.login || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {mensaje.contacto?.celular || mensaje.contacto?.correo || 'Sin contacto'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {mensaje.medio?.nombre || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCriticidadColor(mensaje.criticidad?.criticidad || 'N/A')}`}>
                      {mensaje.criticidad?.criticidad || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white max-w-xs truncate">
                      {mensaje.mensaje}
                    </div>
                    {mensaje.medicion && (
                      <div className="text-xs text-gray-400">
                        Nodo {mensaje.medicion.nodoid} - Valor: {mensaje.medicion.medicion}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(mensaje.statusid)}`}>
                      {mensaje.statusid === -1 ? 'Pendiente' : 'Enviado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {new Date(mensaje.fecha).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(mensaje.fecha).toLocaleTimeString('es-ES')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {mensaje.statusid === -1 && (
                      <button
                        onClick={() => handleMarkAsSent(mensaje.alertaid)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Marcar Enviado
                      </button>
                    )}
                    <button
                      onClick={() => console.log('Ver detalles:', mensaje)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {mensajesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-300 text-lg">No hay mensajes que coincidan con los filtros</p>
              <p className="text-sm text-gray-400 mt-1">
                Ajusta los filtros para ver más mensajes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MensajesDashboard;
