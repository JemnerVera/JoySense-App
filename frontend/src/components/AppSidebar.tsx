import React, { useState, useEffect } from 'react';
import { useFilterData } from '../hooks/useFilterData';
import { useCascadingFilters } from '../hooks/useCascadingFilters';
import CollapsibleGlobalFilters from './CollapsibleGlobalFilters';
import ParametersSidebar from './sidebar/ParametersSidebar';
import ReportesDashboardSidebar from './sidebar/ReportesDashboardSidebar';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  authToken: string;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  dashboardSubTab?: 'mapeo' | 'metrica' | 'umbrales';
  onDashboardSubTabChange?: (subTab: 'mapeo' | 'metrica' | 'umbrales') => void;
  isExpanded: boolean;
  auxiliarySidebarVisible: boolean;
  onMainSidebarMouseEnter: () => void;
  onMainSidebarMouseLeave: () => void;
  onAuxiliarySidebarMouseEnter: () => void;
  onAuxiliarySidebarMouseLeave: () => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onTabChange,
  authToken,
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange,
  dashboardSubTab,
  onDashboardSubTabChange,
  isExpanded,
  auxiliarySidebarVisible,
  onMainSidebarMouseEnter,
  onMainSidebarMouseLeave,
  onAuxiliarySidebarMouseEnter,
  onAuxiliarySidebarMouseLeave,
  formData = {},
  multipleData = [],
  massiveFormData = {}
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const { paises, empresas, fundos, loading, error } = useFilterData(authToken);
  const {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    handlePaisChange,
    handleEmpresaChange,
    handleFundoChange,
  } = useCascadingFilters();

  // Preparar datos para los filtros
  const paisesOptions = paises.map(pais => ({
    id: pais.paisid,
    name: pais.pais
  }));

  const empresasOptions = empresas
    .filter(empresa => !paisSeleccionado || empresa.paisid === parseInt(paisSeleccionado))
    .map(empresa => ({
      id: empresa.empresaid,
      name: empresa.empresa
    }));

  const fundosOptions = fundos
    .filter(fundo => !empresaSeleccionada || fundo.empresaid === parseInt(empresaSeleccionada))
    .map(fundo => ({
      id: fundo.fundoid,
      name: fundo.fundo
    }));

  // Pestañas principales con iconos minimalistas
  const mainTabs = [
    {
      id: 'reportes',
      label: 'Reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'green'
    },
    {
      id: 'parameters',
      label: 'Parámetros',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'blue'
    },
    {
      id: 'configuration',
      label: 'Configuración',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'gray'
    }
  ];

  // Subpestañas para cada pestaña principal
  const subTabs = {
    reportes: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      {
        id: 'alertas',
        label: 'Alertas',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      },
      {
        id: 'mensajes',
        label: 'Mensajes',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      }
    ],
    parameters: [
      {
        id: 'status',
        label: 'Estado',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      {
        id: 'insert',
        label: 'Crear',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      },
      {
        id: 'update',
        label: 'Actualizar',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      },
    ],
    configuration: [
      {
        id: 'users',
        label: 'Usuarios',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        )
      },
      {
        id: 'settings',
        label: 'Ajustes',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    ]
  };

  const getTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-400';
      case 'blue': return 'text-blue-400';
      case 'gray': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getActiveTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-600';
      case 'blue': return 'bg-blue-600';
      case 'gray': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const currentMainTab = mainTabs.find(tab => activeTab === tab.id || activeTab.startsWith(tab.id + '-'));
  const currentSubTabs = currentMainTab ? subTabs[currentMainTab.id as keyof typeof subTabs] || [] : [];

  // Debug para parámetros (solo cuando cambia)
  useEffect(() => {
    console.log('🔍 AppSidebar Debug:', {
      activeTab,
      selectedTable,
      onTableSelect: !!onTableSelect,
      isParameters: activeTab === 'parameters',
      auxiliarySidebarVisible,
      currentMainTab: currentMainTab?.id,
      currentSubTabs: currentSubTabs.length
    });
  }, [activeTab, selectedTable, auxiliarySidebarVisible, currentMainTab, currentSubTabs]);

  return (
    <div className="flex h-full">
      {/* Sidebar principal - Franja de iconos */}
      <div 
        className={`bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={onMainSidebarMouseEnter}
        onMouseLeave={onMainSidebarMouseLeave}
      >
        {/* Logo - Altura uniforme con header */}
        <div className="h-20 flex items-center justify-center border-b border-gray-300 dark:border-gray-700">
          {isExpanded ? (
            <div className="flex items-center space-x-3">
              <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
              <img src="/Logo - texto.png" alt="JoySense" className="h-6" />
            </div>
          ) : (
            <div className="flex justify-center">
              <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Filtros globales */}
        {isExpanded && (
          <CollapsibleGlobalFilters
            paisSeleccionado={paisSeleccionado}
            empresaSeleccionada={empresaSeleccionada}
            fundoSeleccionado={fundoSeleccionado}
            onPaisChange={handlePaisChange}
            onEmpresaChange={handleEmpresaChange}
            onFundoChange={handleFundoChange}
            paisesOptions={paisesOptions}
            empresasOptions={empresasOptions}
            fundosOptions={fundosOptions}
          />
        )}

        {/* Pestañas principales */}
        <div className="py-4">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id || activeTab.startsWith(tab.id + '-');
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 ${
                  isActive 
                    ? `${getActiveTabColor(tab.color)} text-white` 
                    : `${getTabColor(tab.color)} hover:bg-gray-200 dark:hover:bg-gray-800`
                }`}
              >
                <div className="flex-shrink-0">
                  {tab.icon}
                </div>
                {isExpanded && (
                  <span className="ml-3 font-medium">{tab.label}</span>
                )}
                {!isExpanded && hoveredTab === tab.id && (
                  <div className="absolute left-16 ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-md shadow-lg z-50 whitespace-nowrap">
                    {tab.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar auxiliar para subpestañas (excepto parámetros) */}
      {currentMainTab && currentSubTabs.length > 0 && currentMainTab.id !== 'parameters' && (
        <div 
          className={`bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 transition-all duration-300 ${
            auxiliarySidebarVisible ? 'w-64' : 'w-16'
          }`}
          onMouseEnter={onAuxiliarySidebarMouseEnter}
          onMouseLeave={onAuxiliarySidebarMouseLeave}
        >
          <div className="h-20 flex items-center justify-center border-b border-gray-300 dark:border-gray-700">
            {auxiliarySidebarVisible ? (
              <h3 className="text-gray-900 dark:text-white font-medium">{currentMainTab?.label}</h3>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center">
                {currentMainTab?.icon}
              </div>
            )}
          </div>
          <div className="py-4">
            {currentSubTabs.map((subTab) => {
              const isActive = activeTab === `${currentMainTab?.id}-${subTab.id}`;
              return (
                            <button
                              key={subTab.id}
                              onClick={() => onTabChange(`${currentMainTab?.id}-${subTab.id}`)}
                              className={`w-full flex items-center transition-all duration-200 ${
                                auxiliarySidebarVisible ? 'px-4 py-3 text-left' : 'px-4 py-3 justify-center'
                              } ${
                                isActive 
                                  ? 'bg-green-600 text-white' 
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                  <div className="flex-shrink-0">
                    {subTab.icon}
                  </div>
                  {auxiliarySidebarVisible && (
                    <span className="ml-3 font-medium">{subTab.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sidebar auxiliar para parámetros */}
      {(activeTab === 'parameters' || activeTab.startsWith('parameters-')) && (
        <ParametersSidebar
          selectedTable={selectedTable || 'pais'}
          onTableSelect={onTableSelect || (() => {})}
          activeSubTab={activeSubTab || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={auxiliarySidebarVisible}
          onMouseEnter={onAuxiliarySidebarMouseEnter}
          onMouseLeave={onAuxiliarySidebarMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      )}

      {/* Sidebar auxiliar para Dashboard (Reportes) */}
      {(activeTab === 'reportes-dashboard' || activeTab.startsWith('reportes-dashboard-')) && (
        <ReportesDashboardSidebar
          activeSubTab={dashboardSubTab || 'mapeo'}
          onSubTabChange={onDashboardSubTabChange || (() => {})}
          isExpanded={auxiliarySidebarVisible}
          onMouseEnter={onAuxiliarySidebarMouseEnter}
          onMouseLeave={onAuxiliarySidebarMouseLeave}
        />
      )}
    </div>
  );
};

export default AppSidebar;
