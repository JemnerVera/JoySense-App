import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';

interface ReportesDashboardSidebarProps {
  activeSubTab: 'mapeo' | 'metrica';
  onSubTabChange: (subTab: 'mapeo' | 'metrica') => void;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ReportesDashboardSidebar: React.FC<ReportesDashboardSidebarProps> = ({
  activeSubTab,
  onSubTabChange,
  isExpanded,
  onMouseEnter,
  onMouseLeave
}) => {
  // Tabs disponibles para el Dashboard
  const dashboardTabs = [
    {
      id: 'mapeo' as const,
      label: 'MAPEO DE NODOS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      id: 'metrica' as const,
      label: 'MÉTRICA POR LOTE',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  // Icono para el sidebar de Dashboard
  const dashboardIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="DASHBOARD"
      icon={dashboardIcon}
      color="green"
      collapsedText="..."
    >
      {/* Tabs del Dashboard */}
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {dashboardTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSubTabChange(tab.id)}
                  className={`w-full flex items-center p-3 rounded transition-colors ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  } ${
                    isActive
                      ? "bg-green-500 text-white"
                      : "text-gray-600 dark:text-neutral-400 hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {tab.icon}
                  </div>
                  {isExpanded && (
                    <span className="text-sm font-medium tracking-wider">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default ReportesDashboardSidebar;

