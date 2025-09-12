import React, { Suspense } from 'react';
import AlertasTable from './AlertasTable';

const AlertasMain: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-500 font-mono tracking-wider mb-2">
            REPORTES - ALERTAS
          </h1>
          <p className="text-neutral-400 font-mono tracking-wider">
            Gestión y visualización de alertas del sistema de monitoreo
          </p>
        </div>

        {/* Contenido principal con Suspense */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-neutral-400 font-mono tracking-wider">CARGANDO ALERTAS...</p>
              </div>
            </div>
          }
        >
          <AlertasTable />
        </Suspense>
      </div>
    </div>
  );
};

export default AlertasMain;
