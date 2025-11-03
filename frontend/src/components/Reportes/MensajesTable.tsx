import React, { useState, useEffect, startTransition } from 'react';
import { JoySenseService } from '../../services/backend-api';
import { useLanguage } from '../../contexts/LanguageContext';

interface MensajeData {
  mensajeid: number;
  contactoid: number;
  mensaje: string;
  fecha: string;
  usercreatedid: number;
  datecreated: string;
  statusid: number;
  consolidadoid: number;
  // Campos relacionados (se obtendrán de joins)
  contacto?: {
    contactoid: number;
    celular: string;
    codigotelefonoid: number;
    usuarioid: number;
    usuario?: {
      login: string;
      firstname: string;
      lastname: string;
    };
  };
  alerta?: string;
}

const MensajesTable: React.FC = () => {
  const { t } = useLanguage();
  const [mensajes, setMensajes] = useState<MensajeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadMensajes = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Usar paginación del servidor en lugar de cargar todos los mensajes
      startTransition(() => {
        JoySenseService.getTableDataPaginated('mensaje', {
          page,
          pageSize: itemsPerPage,
          sortBy: 'datecreated',
          sortOrder: 'desc'
        })
          .then(result => {
            if (result.pagination) {
              // Respuesta con paginación
              setMensajes(Array.isArray(result.data) ? result.data : []);
              setTotalRecords(result.pagination.total);
            } else {
              // Modo legacy (fallback)
              const data = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
              setMensajes(data);
              setTotalRecords(data.length);
            }
          })
          .catch(err => {
            console.error('Error cargando mensajes:', err);
            setError('Error al cargar los mensajes');
            setMensajes([]);
            setTotalRecords(0);
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
    loadMensajes(currentPage);
  }, [currentPage]);

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
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-mono tracking-wider">
            DESCONOCIDO
          </span>
        );
    }
  };

  // Paginación - Los datos ya vienen paginados del servidor
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-neutral-400 font-mono tracking-wider">{t('reports.messages.loading')}</p>
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
          <p className="text-gray-600 dark:text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => loadMensajes(currentPage)}
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
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 font-mono tracking-wider">{t('reports.messages.no_data')}</h3>
          <p className="text-gray-600 dark:text-neutral-400 font-mono tracking-wider">No se encontraron registros de mensajes en la base de datos</p>
        </div>
      </div>
    );
  }

  return (
      <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6 border border-gray-300 dark:border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-500 font-mono tracking-wider">
          {t('reports.messages.title')}
        </h2>
          <div className="text-sm text-gray-600 dark:text-neutral-400 font-mono">
            {totalRecords} {t('reports.messages.total')}
          </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 dark:border-neutral-700">
                <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.message_id')}</th>
                <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.contact')}</th>
                <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.message')}</th>
                <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.date')}</th>
                <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.creation_date')}</th>
                <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.status')}</th>
              </tr>
            </thead>
          <tbody>
            {mensajes.map((mensaje, index) => (
              <tr key={`${mensaje.mensajeid}-${mensaje.contactoid}-${index}`} className="border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-800/50">
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">{mensaje.mensajeid}</td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {mensaje.contacto?.usuario ? 
                    `${mensaje.contacto.usuario.firstname || ''} ${mensaje.contacto.usuario.lastname || ''}`.trim() || mensaje.contacto.usuario.login :
                    `Contacto ${mensaje.contactoid}`
                  }
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono max-w-md truncate" title={mensaje.mensaje}>
                  {mensaje.mensaje}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {formatDate(mensaje.fecha)}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
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
          <div className="text-sm text-gray-600 dark:text-neutral-400 font-mono">
            PÁGINA {currentPage} DE {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Primera página"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1)
                setCurrentPage(newPage)
              }}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Página anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1)
                setCurrentPage(newPage)
              }}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Página siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center"
              title="Última página"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MensajesTable;
