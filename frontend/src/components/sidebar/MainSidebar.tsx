import React from 'react';
import SidebarFilters from '../SidebarFilters';
import { useLanguage } from '../../contexts/LanguageContext';

interface MainSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  authToken: string;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onTabChange,
  activeTab,
  authToken
}) => {
  const { t } = useLanguage();
  const mainTabs = [
    {
      id: 'reportes',
      label: t('tabs.reports'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'green'
    },
    {
      id: 'parameters',
      label: t('tabs.parameters'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'orange'
    },
    {
      id: 'umbrales',
      label: t('tabs.configuration'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" 
          strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'blue'
    }
  ];

  const getTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-400';
      case 'blue': return 'text-blue-400';
      case 'orange': return 'text-orange-400';
      case 'gray': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getActiveTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-600';
      case 'blue': return 'bg-blue-600';
      case 'orange': return 'bg-orange-500';
      case 'gray': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div 
      className="bg-gray-100 dark:bg-neutral-900 border-r border-gray-300 dark:border-neutral-700 transition-all duration-300 h-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Logo - Tactical Style */}
      <div className="h-16 flex items-center justify-center border-b border-gray-300 dark:border-neutral-700 p-4">
        {isExpanded ? (
          <div className="flex items-center space-x-3">
            <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
            <img src="/Logo - texto.png" alt="JoySense" className="h-6 w-auto" />
          </div>
        ) : (
          <div className="flex justify-center">
            <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Filtros globales */}
      {isExpanded && (
        <div className="px-4 py-4 border-b border-gray-300 dark:border-neutral-700">
          <SidebarFilters authToken={authToken} />
        </div>
      )}

      {/* Pestañas principales - Tactical Style */}
      <div className="py-4">
        <nav className="space-y-2">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id || activeTab.startsWith(tab.id + '-');
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center p-3 rounded transition-colors ${
                  isExpanded ? 'gap-3' : 'justify-center'
                } ${
                  isActive
                    ? `${getActiveTabColor(tab.color)} text-white`
                    : "text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {tab.icon}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium tracking-wider">{tab.label.toUpperCase()}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status - Tactical Style */}
      {isExpanded && (
        <div className="mt-8 p-4 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded mx-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-800 dark:text-white font-mono">SISTEMA EN LÍNEA</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-neutral-500 font-mono">
            <div>TIEMPO ACTIVO: 72:14:33</div>
            <div>SENSORES: 847 ACTIVOS</div>
            <div>ALERTAS: 23 EN CURSO</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainSidebar;
