import React, { useState, useEffect, startTransition } from 'react';
import { JoySenseService } from '../../services/backend-api';

interface MensajeData {
  alertaid: number;
  contactoid: number;
  mensaje: string;
  fecha: string;
  usercreatedid: number;
  datecreated: string;
  statusid: number;
  // Campos relacionados (se obtendrán de joins)
  contacto?: string;
  alerta?: string;
}

const MensajesTable: React.FC = () => {
  const [mensajes, setMensajes] = useState<MensajeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const loadMensajes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar startTransition para evitar el error de Suspense
      startTransition(() => {
        JoySenseService.getTableData('mensaje', 1000)
          .then(data => {
            if (Array.isArray(data)) {
              setMensajes(data);
            } else {
              setMensajes([]);
            }
          })
          .catch(err => {
            console.error('Error cargando mensajes:', err);
            setError('Error al cargar los mensajes');
            setMensajes([]);
          })
          .finally(() => {
            setLoading(false);
          });
      });
    } catch (err) {
      console.error('Error en loadMensajes:', err);
      setError('Error al cargar los mensajes');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMensajes();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statusid: number) => {
    switch (statusid) {
      case 1:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-900 text-green-300 border border-green-700 font-mono tracking-wider">
            ACTIVO
          </span>
        );
      case 0:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-900 text-red-300 border border-red-700 font-mono tracking-wider">
            INACTIVO
          </span>
        );
      case -1:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-900 text-yellow-300 border border-yellow-700 font-mono tracking-wider">
            PROCESADO
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-900 text-gray-300 border border-gray-700 font-mono tracking-wider">
            DESCONOCIDO
          </span>
        );
    }
  };

  // Paginación
  const totalPages = Math.ceil(mensajes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMensajes = mensajes.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-neutral-400 font-mono tracking-wider">CARGANDO MENSAJES...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-500 mb-2 font-mono tracking-wider">ERROR</h3>
          <p className="text-neutral-400 mb-4">{error}</p>
          <button
            onClick={loadMensajes}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-mono tracking-wider"
          >
            REINTENTAR
          </button>
        </div>
      </div>
    );
  }

  if (mensajes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-white mb-2 font-mono tracking-wider">NO HAY MENSAJES</h3>
          <p className="text-neutral-400 font-mono tracking-wider">No se encontraron registros de mensajes en la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-orange-500 font-mono tracking-wider">
          REGISTRO DE MENSAJES
        </h2>
        <div className="text-sm text-neutral-400 font-mono">
          {mensajes.length} MENSAJE(S) TOTAL
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left py-3 px-4 font-bold text-orange-500 font-mono tracking-wider">ALERTA ID</th>
              <th className="text-left py-3 px-4 font-bold text-orange-500 font-mono tracking-wider">CONTACTO ID</th>
              <th className="text-left py-3 px-4 font-bold text-orange-500 font-mono tracking-wider">MENSAJE</th>
              <th className="text-left py-3 px-4 font-bold text-orange-500 font-mono tracking-wider">FECHA</th>
              <th className="text-left py-3 px-4 font-bold text-orange-500 font-mono tracking-wider">USUARIO CREADOR</th>
              <th className="text-left py-3 px-4 font-bold text-orange-500 font-mono tracking-wider">FECHA CREACIÓN</th>
              <th className="text-left py-3 px-4 font-bold text-orange-500 font-mono tracking-wider">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {currentMensajes.map((mensaje, index) => (
              <tr key={`${mensaje.alertaid}-${mensaje.contactoid}-${index}`} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                <td className="py-3 px-4 text-white font-mono">{mensaje.alertaid}</td>
                <td className="py-3 px-4 text-white font-mono">{mensaje.contactoid}</td>
                <td className="py-3 px-4 text-white font-mono max-w-md truncate" title={mensaje.mensaje}>
                  {mensaje.mensaje}
                </td>
                <td className="py-3 px-4 text-white font-mono">
                  {formatDate(mensaje.fecha)}
                </td>
                <td className="py-3 px-4 text-white font-mono">{mensaje.usercreatedid || 'N/A'}</td>
                <td className="py-3 px-4 text-white font-mono">
                  {formatDate(mensaje.datecreated)}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(mensaje.statusid)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-neutral-400 font-mono">
            PÁGINA {currentPage} DE {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors font-mono tracking-wider"
            >
              ANTERIOR
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-neutral-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors font-mono tracking-wider"
            >
              SIGUIENTE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MensajesTable;
