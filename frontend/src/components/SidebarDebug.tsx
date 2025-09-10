import React from 'react';

interface SidebarDebugProps {
  sidebarVisible: boolean;
  auxiliarySidebarVisible: boolean;
  activeTab: string;
  hasAuxiliarySidebar: boolean;
}

const SidebarDebug: React.FC<SidebarDebugProps> = ({
  sidebarVisible,
  auxiliarySidebarVisible,
  activeTab,
  hasAuxiliarySidebar
}) => {
  // Siempre mostrar en desarrollo para debug
  console.log('🔍 SidebarDebug renderizado:', {
    sidebarVisible,
    auxiliarySidebarVisible,
    activeTab,
    hasAuxiliarySidebar
  });

  return (
    <div className="fixed top-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs z-50">
      <div>Active Tab: {activeTab}</div>
      <div>Has Auxiliary: {hasAuxiliarySidebar ? 'Yes' : 'No'}</div>
      <div>Main Sidebar: {sidebarVisible ? 'Expanded' : 'Collapsed'}</div>
      <div>Auxiliary Sidebar: {auxiliarySidebarVisible ? 'Expanded' : 'Collapsed'}</div>
    </div>
  );
};

export default SidebarDebug;
