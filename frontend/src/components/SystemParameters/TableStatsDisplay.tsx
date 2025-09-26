import React from 'react';

interface TableStatsDisplayProps {
  tableData: any[];
  userData?: any[];
}

export function TableStatsDisplay({ tableData, userData }: TableStatsDisplayProps) {
  // Buscar el último registro modificado
  const lastModified = tableData
    ?.filter((row: any) => row.usermodifiedid || row.usercreatedid)
    ?.sort((a: any, b: any) => {
      const dateA = new Date(a.datemodified || a.datecreated || 0);
      const dateB = new Date(b.datemodified || b.datecreated || 0);
      return dateB.getTime() - dateA.getTime();
    })?.[0];

  const getLastUser = () => {
    if (!lastModified || !userData) return 'N/A';
    
    const userId = lastModified.usermodifiedid || lastModified.usercreatedid;
    const user = userData.find((u: any) => u.id === userId);
    return user ? `${user.firstname} ${user.lastname}`.trim() || user.login : 'N/A';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-neutral-400 text-sm mb-1 font-mono tracking-wider">REGISTROS</div>
        <div className="text-2xl font-bold text-orange-500 font-mono">{tableData.length}</div>
      </div>

      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-neutral-400 text-sm mb-1 font-mono tracking-wider">ÚLTIMA ACTUALIZACIÓN</div>
        <div className="text-2xl font-bold text-orange-500 font-mono">{new Date().toLocaleDateString('es-ES')}</div>
      </div>

      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 text-center">
        <div className="text-neutral-400 text-sm mb-1 font-mono tracking-wider">ÚLTIMO USUARIO</div>
        <div className="text-2xl font-bold text-orange-500 font-mono">
          {getLastUser()}
        </div>
      </div>
    </div>
  );
}
