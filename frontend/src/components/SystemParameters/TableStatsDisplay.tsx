
import { useLanguage } from '../../contexts/LanguageContext';

interface TableStatsDisplayProps {
  tableData: any[];
  userData?: any[];
}

export function TableStatsDisplay({ tableData, userData }: TableStatsDisplayProps) {
  const { t } = useLanguage();
  // Buscar el último registro modificado
  const lastModified = tableData
    ?.filter((row: any) => row.usermodifiedid || row.usercreatedid)
    ?.sort((a: any, b: any) => {
      const dateA = new Date(a.datemodified || a.datecreated || 0);
      const dateB = new Date(b.datemodified || b.datecreated || 0);
      return dateB.getTime() - dateA.getTime();
    })?.[0];

  const getLastUser = () => {
    if (!lastModified || !userData) {
      return 'N/A';
    }
    
    const userId = lastModified.usermodifiedid || lastModified.usercreatedid;
    // Buscar por usuarioid (campo correcto en la BD) o por id (fallback)
    const user = userData.find((u: any) => u.usuarioid === userId || u.id === userId);
    
    if (user) {
      return `${user.firstname} ${user.lastname}`.trim() || user.login || `Usuario ${userId}`;
    } else {
      // Si no se encuentra el usuario, mostrar el ID como fallback
      return `Usuario ${userId}`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-gray-600 dark:text-neutral-400 text-sm mb-1 font-mono tracking-wider">{t('status.records')}</div>
        <div className="text-2xl font-bold text-orange-500 font-mono">{tableData.length}</div>
      </div>

      <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-gray-600 dark:text-neutral-400 text-sm mb-1 font-mono tracking-wider">{t('status.last_update')}</div>
        <div className="text-2xl font-bold text-orange-500 font-mono">{new Date().toLocaleDateString('es-ES')}</div>
      </div>

      <div className="bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-gray-600 dark:text-neutral-400 text-sm mb-1 font-mono tracking-wider">{t('status.last_user')}</div>
        <div className="text-2xl font-bold text-orange-500 font-mono">
          {getLastUser()}
        </div>
      </div>
    </div>
  );
}
