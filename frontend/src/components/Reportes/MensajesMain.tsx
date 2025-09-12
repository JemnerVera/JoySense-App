import React, { Suspense } from 'react';
import MensajesTable from './MensajesTable';

const MensajesMain: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Contenido principal con Suspense */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-neutral-400 font-mono tracking-wider">CARGANDO MENSAJES...</p>
              </div>
            </div>
          }
        >
          <MensajesTable />
        </Suspense>
      </div>
    </div>
  );
};

export default MensajesMain;
