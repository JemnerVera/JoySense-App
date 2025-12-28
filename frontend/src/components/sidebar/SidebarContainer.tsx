import React from 'react';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import MainSidebar from './MainSidebar';
import AuxiliarySidebar from './AuxiliarySidebar';

interface SidebarContainerProps {
  showWelcome: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  authToken: string;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  dashboardSubTab?: 'mapeo' | 'metrica' | 'umbrales';
  onDashboardSubTabChange?: (subTab: 'mapeo' | 'metrica' | 'umbrales') => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({
  showWelcome,
  activeTab,
  onTabChange,
  authToken,
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange,
  dashboardSubTab,
  onDashboardSubTabChange,
  formData = {},
  multipleData = [],
  massiveFormData = {}
}) => {
  const {
    mainSidebarExpanded,
    auxiliarySidebarExpanded,
    hasAuxiliarySidebar,
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    getMainContentMargin,
    getMainSidebarClasses,
    getAuxiliarySidebarClasses
  } = useSidebarLayout({ showWelcome, activeTab });

  return (
    <div className="flex h-full flex-shrink-0 relative">
      {/* Contenedor del sidebar principal - NO FIXED */}
      <div className={`${getMainSidebarClasses().replace('fixed', 'relative')} flex-shrink-0 z-10`}>
        <MainSidebar
          isExpanded={mainSidebarExpanded}
          onMouseEnter={handleMainSidebarMouseEnter}
          onMouseLeave={handleMainSidebarMouseLeave}
          onTabChange={onTabChange}
          activeTab={activeTab}
          authToken={authToken}
        />
      </div>

      {/* Sidebar auxiliar */}
      {hasAuxiliarySidebar && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
          />
        </div>
      )}

      {/* Tercer sidebar para parámetros (solo cuando hay tabla seleccionada) */}
      {hasAuxiliarySidebar && (activeTab === 'parameters' || activeTab.startsWith('parameters-')) && selectedTable && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={true}
          />
        </div>
      )}

      {/* Tercer sidebar para permisos (siempre visible cuando está en permisos) */}
      {hasAuxiliarySidebar && activeTab === 'permisos' && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={true}
            permisosSubTab={(activeSubTab as 'status' | 'insert' | 'update') || 'status'}
            onPermisosSubTabChange={(onSubTabChange as ((subTab: 'status' | 'insert' | 'update') => void)) || (() => {})}
          />
        </div>
      )}

      {/* Tercer sidebar para ACCESO-PERMISO (operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {hasAuxiliarySidebar && (activeTab === 'acceso-permiso' || activeTab.startsWith('acceso-permiso-')) && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={true}
          />
        </div>
      )}

      {/* Tercer sidebar para ALERTAS (operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {hasAuxiliarySidebar && (
        (activeTab === 'alertas-regla' || activeTab.startsWith('alertas-regla-')) ||
        (activeTab === 'alertas-regla_objeto' || activeTab.startsWith('alertas-regla_objeto-')) ||
        (activeTab === 'alertas-regla_umbral' || activeTab.startsWith('alertas-regla_umbral-')) ||
        (activeTab === 'alertas-regla_perfil' || activeTab.startsWith('alertas-regla_perfil-'))
      ) && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={true}
            reglaSubTab={(activeSubTab as 'status' | 'insert' | 'update') || 'status'}
            onReglaSubTabChange={(onSubTabChange as ((subTab: 'status' | 'insert' | 'update') => void)) || (() => {})}
          />
        </div>
      )}

      {/* Tercer sidebar para dashboards (solo cuando está en reportes-dashboard) */}
      {hasAuxiliarySidebar && (activeTab === 'reportes-dashboard' || activeTab.startsWith('reportes-dashboard-')) && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showDashboardThirdLevel={true}
          />
        </div>
      )}

      {/* Exportar funciones para el contenido principal */}
      <div style={{ display: 'none' }}>
        <div 
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          data-margin={getMainContentMargin()}
        />
      </div>
    </div>
  );
};

export default SidebarContainer;
