import React from 'react';
import { useSidebarState } from '../../hooks/useSidebarState';
import MainSidebar from './MainSidebar';

interface SidebarContainerProps {
  showWelcome: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  authToken: string;
  selectedTable?: string;
  activeSubTab?: string;
  dashboardSubTab?: 'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales';
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({
  showWelcome,
  activeTab,
  onTabChange,
  authToken,
  selectedTable,
  activeSubTab,
  dashboardSubTab
}) => {
  const {
    mainSidebarExpanded,
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    getMainSidebarClasses
  } = useSidebarState({ showWelcome, activeTab });

  return (
    <div className="flex h-full flex-shrink-0 relative">
      <div className={`${getMainSidebarClasses().replace('fixed', 'relative')} flex-shrink-0 z-10`}>
        <MainSidebar
          isExpanded={mainSidebarExpanded}
          onMouseEnter={handleMainSidebarMouseEnter}
          onMouseLeave={handleMainSidebarMouseLeave}
          onTabChange={onTabChange}
          activeTab={activeTab}
          authToken={authToken}
          selectedTable={selectedTable}
          activeSubTab={activeSubTab}
          dashboardSubTab={dashboardSubTab}
        />
      </div>
    </div>
  );
};

export default SidebarContainer;
