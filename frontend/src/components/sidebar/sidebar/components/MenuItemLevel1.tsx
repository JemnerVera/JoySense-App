import React, { memo } from 'react';
import type { MainTab } from '../../types';
import { MenuItemLevel2 } from './MenuItemLevel2';

const SUB_INDICATOR_STYLE = {
  width: '5px',
  height: '5px',
  borderRight: '2px solid currentcolor',
  borderBottom: '2px solid currentcolor',
  transform: 'rotate(-45deg)',
  transition: 'transform 0.3s',
  marginLeft: 'auto',
  marginRight: '20px',
  flexShrink: 0,
};

// Función para obtener los colores según el tipo de sección
const getColorBySection = (color?: string) => {
  switch (color) {
    case 'blue': // REPORTES
      return {
        active: '#2563eb', // blue-600 más oscuro
        activeBg: 'rgba(37, 99, 235, 0.25)',
        hover: '#3b82f6', // blue-500
        hoverBg: 'rgba(59, 130, 246, 0.15)',
      };
    case 'green': // AGRUPACION
      return {
        active: '#16a34a', // green-600 más oscuro
        activeBg: 'rgba(22, 163, 74, 0.25)',
        hover: '#22c55e', // green-500
        hoverBg: 'rgba(34, 197, 94, 0.15)',
      };
    case 'orange': // CONFIGURACION
      return {
        active: '#ea580c', // orange-600 más oscuro
        activeBg: 'rgba(234, 88, 12, 0.25)',
        hover: '#f97316', // orange-500
        hoverBg: 'rgba(249, 115, 22, 0.15)',
      };
    case 'gray': // AJUSTES
      return {
        active: '#4b5563', // gray-600 más oscuro
        activeBg: 'rgba(75, 85, 99, 0.25)',
        hover: '#6b7280', // gray-500
        hoverBg: 'rgba(107, 114, 128, 0.15)',
      };
    default:
      return {
        active: '#ffffff',
        activeBg: 'rgba(222, 226, 236, 0.15)',
        hover: '#ffffff',
        hoverBg: 'rgba(222, 226, 236, 0.08)',
      };
  }
};

export interface MenuItemLevel1Props {
  tab: MainTab;
  isExpanded: boolean;
  activeTab: string;
  openSubMenus: Set<string>;
  openSubMenusLevel3: Set<string>;
  onMenuClick: (tabId: string, hasSubMenus: boolean) => void;
  onLevel2Click: (
    parentId: string,
    subMenuId: string,
    hasLevel3Menus: boolean
  ) => void;
  onLevel3Click: (
    parentId: string,
    level2Id: string,
    level3Id: string,
    hasSubMenus: boolean
  ) => void;
  onLevel4Click: (
    parentId: string,
    level2Id: string,
    level3Id: string,
    level4Id: string,
    hasLevel5: boolean
  ) => void;
  onLevel4Nav: (
    parentId: string,
    level2Id: string,
    level3Id: string,
    level4Id: string
  ) => void;
  onTabChange: (tab: string) => void;
  registerSubMenuRef: (key: string, el: HTMLDivElement | null) => void;
  registerLevel3Ref: (key: string, el: HTMLDivElement | null) => void;
  colors: { textColor: string; secondaryTextColor: string; secondaryBgColor: string };
}

const MenuItemLevel1Component: React.FC<MenuItemLevel1Props> = ({
  tab,
  isExpanded,
  activeTab,
  openSubMenus,
  openSubMenusLevel3,
  onMenuClick,
  onLevel2Click,
  onLevel3Click,
  onLevel4Click,
  onLevel4Nav,
  onTabChange,
  registerSubMenuRef,
  registerLevel3Ref,
  colors,
}) => {
  const isActive = activeTab === tab.id || activeTab.startsWith(tab.id + '-');
  const hasSubMenus = tab.subMenus && tab.subMenus.length > 0;
  const isSubMenuOpen = openSubMenus.has(tab.id);

  const handleRegisterRef = (key: string, el: HTMLDivElement | null) => {
    registerLevel3Ref(key, el);
  };

  return (
    <li
      className={`menu-item transition-colors ${isActive ? 'active' : ''} ${
        isExpanded && hasSubMenus ? 'sub-menu' : ''
      } ${isSubMenuOpen ? 'open' : ''}`}
    >
      <button
        onClick={() => onMenuClick(tab.id, hasSubMenus || false)}
        className="flex items-center justify-center h-14 cursor-pointer transition-all duration-300 border-0 relative"
        style={{
          color: isActive ? getColorBySection(tab.color).active : colors.textColor,
          backgroundColor: isActive
            ? getColorBySection(tab.color).activeBg
            : 'transparent',
          paddingLeft: isExpanded ? '30px' : '0px',
          paddingRight: isExpanded ? '10px' : '0px',
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = getColorBySection(tab.color).hover;
          if (!isActive)
            e.currentTarget.style.backgroundColor = getColorBySection(tab.color).hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isActive
            ? getColorBySection(tab.color).active
            : colors.textColor;
          e.currentTarget.style.backgroundColor = isActive
            ? getColorBySection(tab.color).activeBg
            : 'transparent';
        }}
      >
        <span
          className="menu-icon flex-shrink-0 flex items-center justify-center"
          style={{
            fontSize: '1.1rem',
            width: '32px',
            minWidth: '32px',
            height: '32px',
            marginRight: isExpanded ? '12px' : '0px',
            borderRadius: '2px',
            transition: 'color 0.3s',
          }}
        >
          {tab.icon}
        </span>
        {isExpanded && (
          <>
            <span
              className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
              style={{ fontSize: '0.9rem' }}
            >
              {tab.label.toUpperCase()}
            </span>
            {hasSubMenus && (
              <span
                className="sub-menu-indicator"
                style={{
                  ...SUB_INDICATOR_STYLE,
                  transform: isSubMenuOpen ? 'rotate(45deg)' : 'rotate(-45deg)',
                  color: '#ffffff',
                  borderColor: '#ffffff',
                }}
              />
            )}
          </>
        )}
      </button>
      {hasSubMenus && tab.subMenus && (
        <div
          ref={(el) => registerSubMenuRef(tab.id, el)}
          className="sub-menu-list"
          style={{
            display: isSubMenuOpen ? 'block' : 'none',
            paddingLeft: isExpanded ? '20px' : '0px',
            backgroundColor: colors.secondaryBgColor,
          }}
        >
          <ul
            className="list-none p-0 m-0"
            style={{
              marginLeft: isExpanded ? '-20px' : '0px',
              marginRight: isExpanded ? '-20px' : '0px',
            }}
          >
            {tab.subMenus.map((subMenu) => (
              <MenuItemLevel2
                key={subMenu.id}
                subMenu={subMenu}
                parentId={tab.id}
                parentColor={tab.color}
                isExpanded={isExpanded}
                activeTab={activeTab}
                openSubMenusLevel3={openSubMenusLevel3}
                onLevel2Click={onLevel2Click}
                onLevel3Click={onLevel3Click}
                onLevel4Click={onLevel4Click}
                onLevel4Nav={onLevel4Nav}
                onTabChange={onTabChange}
                registerRef={handleRegisterRef}
                colors={colors}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

// Comparación custom para memo que maneja Sets correctamente
const arePropsEqual = (prevProps: MenuItemLevel1Props, nextProps: MenuItemLevel1Props) => {
  // Comparar propiedades simples
  if (
    prevProps.tab.id !== nextProps.tab.id ||
    prevProps.isExpanded !== nextProps.isExpanded ||
    prevProps.activeTab !== nextProps.activeTab ||
    prevProps.colors.textColor !== nextProps.colors.textColor ||
    prevProps.colors.secondaryTextColor !== nextProps.colors.secondaryTextColor ||
    prevProps.colors.secondaryBgColor !== nextProps.colors.secondaryBgColor
  ) {
    return false;
  }

  // Comparar Sets - PERO solo si afecta a ESTE elemento específico
  // openSubMenus: verifica si este tab está abierto o cerrado
  const prevSubMenuOpen = prevProps.openSubMenus.has(prevProps.tab.id);
  const nextSubMenuOpen = nextProps.openSubMenus.has(nextProps.tab.id);
  if (prevSubMenuOpen !== nextSubMenuOpen) {
    return false;
  }

  // openSubMenusLevel3: verifica si ALGUNO de los submenus DE ESTE ELEMENTO cambió
  // Esto es importante para detectar si se abrió/cerró algo dentro
  const prevLevel3Keys = Array.from(prevProps.openSubMenusLevel3).filter(key => key.startsWith(`${prevProps.tab.id}-`));
  const nextLevel3Keys = Array.from(nextProps.openSubMenusLevel3).filter(key => key.startsWith(`${nextProps.tab.id}-`));
  
  if (prevLevel3Keys.length !== nextLevel3Keys.length) {
    return false;
  }
  for (const key of prevLevel3Keys) {
    if (!nextProps.openSubMenusLevel3.has(key)) {
      return false;
    }
  }

  return true;
};

export const MenuItemLevel1 = memo(MenuItemLevel1Component, arePropsEqual);
