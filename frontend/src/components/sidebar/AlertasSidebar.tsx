import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import { useLanguage } from '../../contexts/LanguageContext';

interface AlertasSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const AlertasSidebar: React.FC<AlertasSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeTab,
  onTabChange
}) => {
  const { t } = useLanguage();

  // Icono para el sidebar de alertas
  const alertasIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={t('alerts.title')}
      icon={alertasIcon}
      color="red"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {/* REGLA */}
            <button
              onClick={() => onTabChange?.('alertas-regla-status')}
              className={`w-full flex items-center p-3 rounded transition-colors ${
                isExpanded ? 'gap-3' : 'justify-center'
              } ${
                activeTab?.startsWith('alertas-regla') && !activeTab?.startsWith('alertas-regla_')
                  ? 'bg-red-500 text-white'
                  : 'text-red-300 hover:text-white hover:bg-red-600'
              }`}
            >
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {isExpanded && (
                <span className="text-sm font-medium tracking-wider">{t('alerts.rule').toUpperCase()}</span>
              )}
            </button>

            {/* REGLA_OBJETO */}
            <button
              onClick={() => onTabChange?.('alertas-regla_objeto-status')}
              className={`w-full flex items-center p-3 rounded transition-colors ${
                isExpanded ? 'gap-3' : 'justify-center'
              } ${
                activeTab?.startsWith('alertas-regla_objeto')
                  ? 'bg-red-500 text-white'
                  : 'text-red-300 hover:text-white hover:bg-red-600'
              }`}
            >
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {isExpanded && (
                <span className="text-sm font-medium tracking-wider">{t('alerts.rule_object').toUpperCase()}</span>
              )}
            </button>

            {/* REGLA_UMBRAL */}
            <button
              onClick={() => onTabChange?.('alertas-regla_umbral-status')}
              className={`w-full flex items-center p-3 rounded transition-colors ${
                isExpanded ? 'gap-3' : 'justify-center'
              } ${
                activeTab?.startsWith('alertas-regla_umbral')
                  ? 'bg-red-500 text-white'
                  : 'text-red-300 hover:text-white hover:bg-red-600'
              }`}
            >
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              {isExpanded && (
                <span className="text-sm font-medium tracking-wider">{t('alerts.rule_threshold').toUpperCase()}</span>
              )}
            </button>

            {/* REGLA_PERFIL */}
            <button
              onClick={() => onTabChange?.('alertas-regla_perfil-status')}
              className={`w-full flex items-center p-3 rounded transition-colors ${
                isExpanded ? 'gap-3' : 'justify-center'
              } ${
                activeTab?.startsWith('alertas-regla_perfil')
                  ? 'bg-red-500 text-white'
                  : 'text-red-300 hover:text-white hover:bg-red-600'
              }`}
            >
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {isExpanded && (
                <span className="text-sm font-medium tracking-wider">{t('alerts.rule_profile').toUpperCase()}</span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default AlertasSidebar;

