import React from 'react';
import { useAppSidebar } from '../hooks/useAppSidebar';
import AppSidebar from './AppSidebar';
import SidebarDebug from './SidebarDebug';

interface AppSidebarContainerProps {
  showWelcome: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  authToken: string;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const AppSidebarContainer: React.FC<AppSidebarContainerProps> = ({
  showWelcome,
  activeTab,
  onTabChange,
  authToken,
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange,
  formData = {},
  multipleData = [],
  massiveFormData = {}
}) => {
  const {
    sidebarVisible,
    auxiliarySidebarVisible,
    isHovering,
    hoverLocation,
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    getMainContentClasses,
    getIndicatorClasses,
    hasAuxiliarySidebar
  } = useAppSidebar({ showWelcome, activeTab });

  return (
    <div
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
        sidebarVisible ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={handleMainSidebarMouseEnter}
      onMouseLeave={handleMainSidebarMouseLeave}
    >
      
      {/* Contenido del sidebar */}
      <div className="relative z-10 h-full">
        <AppSidebar
          onTabChange={onTabChange}
          activeTab={activeTab}
          authToken={authToken}
          selectedTable={selectedTable}
          onTableSelect={onTableSelect}
          activeSubTab={activeSubTab}
          onSubTabChange={onSubTabChange}
          isExpanded={sidebarVisible}
          auxiliarySidebarVisible={auxiliarySidebarVisible}
          onMainSidebarMouseEnter={handleMainSidebarMouseEnter}
          onMainSidebarMouseLeave={handleMainSidebarMouseLeave}
          onAuxiliarySidebarMouseEnter={handleAuxiliarySidebarMouseEnter}
          onAuxiliarySidebarMouseLeave={handleAuxiliarySidebarMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      </div>
      
      {/* Indicador visual sutil */}
      <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-16 rounded-l-full sidebar-indicator transition-opacity duration-300 ${getIndicatorClasses(sidebarVisible)}`} />
      
      {/* Debug info - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <SidebarDebug
          sidebarVisible={sidebarVisible}
          auxiliarySidebarVisible={auxiliarySidebarVisible}
          activeTab={activeTab}
          hasAuxiliarySidebar={hasAuxiliarySidebar(activeTab)}
        />
      )}
    </div>
  );
};

export default AppSidebarContainer;
