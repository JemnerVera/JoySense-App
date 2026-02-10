import React from 'react';

export interface MainSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  authToken: string;
  selectedTable?: string;
  activeSubTab?: string;
  dashboardSubTab?: 'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales';
}

export interface SubMenuLevel4 {
  id: 'status' | 'insert' | 'update' | 'massive' | 'asignar' | string;
  label: string;
  icon: React.ReactNode;
  subMenus?: SubMenuLevel4[];
  hasOperations?: boolean;
}

export interface SubMenuLevel3 {
  id: string;
  label: string;
  icon: React.ReactNode;
  subMenus?: SubMenuLevel4[];
  hasOperations?: boolean;
}

export interface SubMenuLevel2 {
  id: string;
  label: string;
  icon: React.ReactNode;
  subMenus?: SubMenuLevel3[] | SubMenuLevel4[];
  hasOperations?: boolean;
}

export interface MainTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
  requiresPermission?: boolean;
  requiredMenu?: string;
  subMenus?: SubMenuLevel2[];
}
