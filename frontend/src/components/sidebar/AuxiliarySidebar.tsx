import React from 'react';
import ParametersSidebar from './ParametersSidebar';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import AlertasFilters from './AlertasFilters';

interface AuxiliarySidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
}

const AuxiliarySidebar: React.FC<AuxiliarySidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeTab,
  onTabChange,
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange
}) => {
  // Subpestañas para Reportes
  const reportesSubTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'alertas',
      label: 'Alertas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    {
      id: 'mensajes',
      label: 'Mensajes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
  ];

  // Determinar qué sidebar auxiliar mostrar
  const isParameters = activeTab === 'parameters' || activeTab.startsWith('parameters-');
  const isReportes = activeTab === 'reportes' || activeTab.startsWith('reportes-');

  if (isParameters) {
    return (
      <ParametersSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={activeSubTab || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  if (isReportes) {
    const reportesIcon = (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );

    return (
      <BaseAuxiliarySidebar
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title="Reportes"
        icon={reportesIcon}
        color="green"
      >
        {/* Subpestañas de reportes */}
        <div className="py-4">
          {reportesSubTabs.map((subTab) => {
            const isActive = activeTab === `reportes-${subTab.id}`;
            return (
              <button
                key={subTab.id}
                onClick={() => onTabChange(`reportes-${subTab.id}`)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {subTab.icon}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium tracking-wider">{subTab.label.toUpperCase()}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filtros para Alertas */}
        {activeTab === 'reportes-alertas' && (
          <AlertasFilters isExpanded={isExpanded} />
        )}
      </BaseAuxiliarySidebar>
    );
  }

  return null;
};

export default AuxiliarySidebar;
