import React, { Suspense } from 'react';
import MensajesTable from './MensajesTable';
import { useLanguage } from '../../contexts/LanguageContext';

const MensajesMain: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Contenido principal con Suspense */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-neutral-400 font-mono tracking-wider">{t('status.loading')} {t('tabs.messages')}...</p>
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
