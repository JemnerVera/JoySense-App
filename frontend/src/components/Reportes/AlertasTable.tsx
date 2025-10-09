import React, { useState, useEffect, startTransition } from 'react';
import { JoySenseService } from '../../services/backend-api';
import { useLanguage } from '../../contexts/LanguageContext';

interface AlertaData {
  alertaid: number;
  umbralid: number;
  medicionid: number;
  fecha: string;
  usercreatedid: number;
  datecreated: string;
  statusid: number;
  // Campos relacionados (se obtendrán de joins)
  umbral?: {
    umbralid: number;
    umbral: string;
    minimo: number;
    maximo: number;
    nodoid: number;
    tipoid: number;
    metricaid: number;
    ubicacionid: number;
    criticidadid: number;
  };
  medicion?: {
    medicionid: number;
    valor: number;
    fecha: string;
    nodoid: number;
    tipoid: number;
    metricaid: number;
  };
  nodo?: string;
  metrica?: string;
  tipo?: string;
  criticidad?: string;
  ubicacion?: string;
  valor_medido?: number;
  umbral_minimo?: number;
  umbral_maximo?: number;
  mensaje?: string;
}

const AlertasTable: React.FC = () => {
  const { t } = useLanguage();
  const [alertas, setAlertas] = useState<AlertaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const loadAlertas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar startTransition para evitar el error de Suspense
      startTransition(() => {
        JoySenseService.getTableData('alerta', 1000)
          .then(data => {
            console.log('🔍 Frontend - Datos recibidos de alerta:', data);
            if (Array.isArray(data)) {
              if (data.length > 0) {
                console.log('🔍 Frontend - Primera alerta:', JSON.stringify(data[0], null, 2));
              }
              setAlertas(data);
            } else {
              setAlertas([]);
            }
          })
          .catch(err => {
            console.error('Error cargando alertas:', err);
            setError('Error al cargar las alertas');
            setAlertas([]);
          })
          .finally(() => {
            setLoading(false);
          });
      });
    } catch (err) {
      console.error('Error en loadAlertas:', err);
      setError('Error al cargar las alertas');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertas();
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
              {t('status.active')}
            </span>
        );
      case 0:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-900 text-red-300 border border-red-700 font-mono tracking-wider">
            {t('status.inactive')}
          </span>
        );
      case -1:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-900 text-yellow-300 border border-yellow-700 font-mono tracking-wider">
            PROCESADA
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


  // Paginación
  const totalPages = Math.ceil(alertas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlertas = alertas.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-neutral-400 font-mono tracking-wider">{t('status.loading')} {t('tabs.alerts')}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-500 mb-2 font-mono tracking-wider">{t('status.error')}</h3>
          <p className="text-gray-600 dark:text-neutral-400 mb-4">{error}</p>
          <button
            onClick={loadAlertas}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-mono tracking-wider"
          >
{t('buttons.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 font-mono tracking-wider">{t('reports.alerts.no_data')}</h3>
          <p className="text-gray-600 dark:text-neutral-400 font-mono tracking-wider">No se encontraron registros de alertas en la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-6 border border-gray-300 dark:border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-500 font-mono tracking-wider">
          {t('reports.alerts.title')}
        </h2>
        <div className="text-sm text-gray-600 dark:text-neutral-400 font-mono">
          {alertas.length} {t('reports.alerts.total')}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 dark:border-neutral-700">
              <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.id_alert')}</th>
              <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.threshold')}</th>
              <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.measurement')}</th>
              <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.alert_date')}</th>
              <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.creation_date')}</th>
              <th className="text-left py-3 px-4 font-bold text-green-500 font-mono tracking-wider">{t('reports.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {currentAlertas.map((alerta) => (
              <tr key={alerta.alertaid} className="border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-800/50">
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">{alerta.alertaid}</td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {alerta.umbral?.umbral || `Umbral ${alerta.umbralid}`}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {alerta.medicion ? 
                    `Valor: ${alerta.medicion.valor}` : 
                    `Medición ${alerta.medicionid}`
                  }
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {formatDate(alerta.fecha)}
                </td>
                <td className="py-3 px-4 text-gray-800 dark:text-white font-mono">
                  {formatDate(alerta.datecreated)}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(alerta.statusid)}
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

export default AlertasTable;
