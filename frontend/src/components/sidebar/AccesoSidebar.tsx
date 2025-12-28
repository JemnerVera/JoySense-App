import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import { useLanguage } from '../../contexts/LanguageContext';

interface AccesoSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const AccesoSidebar: React.FC<AccesoSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeTab,
  onTabChange
}) => {
  const { t } = useLanguage();

  // Icono para el sidebar de acceso
  const accesoIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={t('access.title')}
      icon={accesoIcon}
      color="purple"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            <button
              onClick={() => onTabChange?.('acceso-permiso-status')}
              className={`w-full flex items-center p-3 rounded transition-colors ${
                isExpanded ? 'gap-3' : 'justify-center'
              } ${
                activeTab?.startsWith('acceso-permiso')
                  ? 'bg-purple-500 text-white'
                  : 'text-purple-300 hover:text-white hover:bg-purple-600'
              }`}
            >
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {isExpanded && (
                <span className="text-sm font-medium tracking-wider">{t('access.permission').toUpperCase()}</span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default AccesoSidebar;

