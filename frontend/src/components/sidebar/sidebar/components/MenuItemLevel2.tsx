import React, { memo } from 'react';
import type { SubMenuLevel2, SubMenuLevel3, SubMenuLevel4 } from '../../types';
import { MenuItemLevel3 } from './MenuItemLevel3';

const SUB_INDICATOR_STYLE = {
  width: '5px',
  height: '5px',
  borderRight: '2px solid currentcolor',
  borderBottom: '2px solid currentcolor',
  transition: 'transform 0.3s',
  marginLeft: 'auto',
  flexShrink: 0,
};

// Función para obtener los colores según el tipo de sección (versión más tenue para nivel 2)
const getColorBySection = (color?: string, level: 'level2' | 'level3' = 'level2') => {
  if (level === 'level2') {
    // Nivel 2: Intermediario - menos oscuro que nivel 1
    switch (color) {
      case 'blue': // REPORTES
        return {
          active: '#3b82f6', // blue-500
          activeBg: 'rgba(59, 130, 246, 0.15)',
          hover: '#60a5fa', // blue-400
          hoverBg: 'rgba(59, 130, 246, 0.08)',
        };
      case 'green': // AGRUPACION
        return {
          active: '#22c55e', // green-500
          activeBg: 'rgba(34, 197, 94, 0.15)',
          hover: '#4ade80', // green-400
          hoverBg: 'rgba(34, 197, 94, 0.08)',
        };
      case 'orange': // CONFIGURACION
        return {
          active: '#f97316', // orange-500
          activeBg: 'rgba(249, 115, 22, 0.15)',
          hover: '#fb923c', // orange-400
          hoverBg: 'rgba(249, 115, 22, 0.08)',
        };
      case 'gray': // AJUSTES
        return {
          active: '#6b7280', // gray-500
          activeBg: 'rgba(107, 114, 128, 0.15)',
          hover: '#9ca3af', // gray-400
          hoverBg: 'rgba(107, 114, 128, 0.08)',
        };
      default:
        return {
          active: '#ffffff',
          activeBg: 'rgba(222, 226, 236, 0.12)',
          hover: '#ffffff',
          hoverBg: 'rgba(222, 226, 236, 0.06)',
        };
    }
  } else {
    // Nivel 3: Más claro aún
    switch (color) {
      case 'blue': // REPORTES
        return {
          active: `rgba(59, 130, 246, 0.8)`, // blue-500 más tenue
          activeBg: `rgba(59, 130, 246, 0.1)`,
          hover: `rgba(96, 165, 250, 0.8)`, // blue-400 más tenue
          hoverBg: `rgba(59, 130, 246, 0.05)`,
        };
      case 'green': // AGRUPACION
        return {
          active: `rgba(34, 197, 94, 0.8)`, // green-500 más tenue
          activeBg: `rgba(34, 197, 94, 0.1)`,
          hover: `rgba(74, 222, 128, 0.8)`, // green-400 más tenue
          hoverBg: `rgba(34, 197, 94, 0.05)`,
        };
      case 'orange': // CONFIGURACION
        return {
          active: `rgba(249, 115, 22, 0.8)`, // orange-500 más tenue
          activeBg: `rgba(249, 115, 22, 0.1)`,
          hover: `rgba(251, 146, 60, 0.8)`, // orange-400 más tenue
          hoverBg: `rgba(249, 115, 22, 0.05)`,
        };
      case 'gray': // AJUSTES
        return {
          active: `rgba(107, 114, 128, 0.8)`, // gray-500 más tenue
          activeBg: `rgba(107, 114, 128, 0.1)`,
          hover: `rgba(156, 163, 175, 0.8)`, // gray-400 más tenue
          hoverBg: `rgba(107, 114, 128, 0.05)`,
        };
      default:
        return {
          active: '#ffffff',
          activeBg: 'rgba(222, 226, 236, 0.1)',
          hover: '#ffffff',
          hoverBg: 'rgba(222, 226, 236, 0.05)',
        };
    }
  }
};

export interface MenuItemLevel2Props {
  subMenu: SubMenuLevel2;
  parentId: string;
  parentColor?: string;
  isExpanded: boolean;
  activeTab: string;
  openSubMenusLevel3: Set<string>;
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
  registerRef: (key: string, el: HTMLDivElement | null) => void;
  colors: { textColor: string; secondaryTextColor: string };
}

const MenuItemLevel2Component: React.FC<MenuItemLevel2Props> = ({
  subMenu,
  parentId,
  parentColor,
  isExpanded,
  activeTab,
  openSubMenusLevel3,
  onLevel2Click,
  onLevel3Click,
  onLevel4Click,
  onLevel4Nav,
  onTabChange,
  registerRef,
  colors,
}) => {
  const subMenuActiveTab = `${parentId}-${subMenu.id}`;
  const isSubActive =
    activeTab === subMenuActiveTab || activeTab.startsWith(subMenuActiveTab + '-');
  const hasLevel3Menus = subMenu.subMenus && subMenu.subMenus.length > 0;
  const subMenuKey = subMenuActiveTab;
  
  // Para nivel 2: El menú está abierto si:
  // 1. Está en openSubMenusLevel3, O
  // 2. El activeTab corresponde a este elemento
  const isLevel3Open = openSubMenusLevel3.has(subMenuKey) || isSubActive;

  if (!isExpanded && !isSubActive) return null;

  const handleClick = () => {
    onLevel2Click(parentId, subMenu.id, hasLevel3Menus || false);
  };

  const subMenus = subMenu.subMenus as (SubMenuLevel3 | SubMenuLevel4)[] | undefined;

  return (
    <li
      className={`menu-item ${isSubActive ? 'active' : ''} ${
        isExpanded && hasLevel3Menus ? 'sub-menu' : ''
      } ${isLevel3Open ? 'open' : ''}`}
    >
      <button
        onClick={handleClick}
        className="flex items-center justify-center h-14 cursor-pointer transition-all duration-300 border-0"
        style={{
          color: isSubActive ? getColorBySection(parentColor, 'level2').active : colors.textColor,
          backgroundColor: isSubActive
            ? getColorBySection(parentColor, 'level2').activeBg
            : 'transparent',
          paddingLeft: isExpanded ? '40px' : '0px',
          paddingRight: isExpanded ? '20px' : '0px',
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = getColorBySection(parentColor, 'level2').hover;
          if (!isSubActive)
            e.currentTarget.style.backgroundColor = getColorBySection(parentColor, 'level2').hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isSubActive
            ? getColorBySection(parentColor, 'level2').active
            : colors.textColor;
          e.currentTarget.style.backgroundColor = isSubActive
            ? getColorBySection(parentColor, 'level2').activeBg
            : 'transparent';
        }}
      >
        <span
          className="menu-icon flex-shrink-0 flex items-center justify-center"
          style={{
            fontSize: '1rem',
            width: '32px',
            minWidth: '32px',
            height: '32px',
            marginRight: isExpanded ? '12px' : '0px',
            borderRadius: '2px',
            transition: 'color 0.3s',
          }}
        >
          {subMenu.icon}
        </span>
        {isExpanded && (
          <>
            <span
              className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
              style={{ fontSize: '0.85rem' }}
            >
              {subMenu.label.toUpperCase()}
            </span>
            {hasLevel3Menus && (
              <span
                className="sub-menu-indicator"
                style={{
                  ...SUB_INDICATOR_STYLE,
                  transform: isLevel3Open ? 'rotate(45deg)' : 'rotate(-45deg)',
                }}
              />
            )}
          </>
        )}
      </button>
      {hasLevel3Menus && subMenus && (
        <div
          ref={(el) => registerRef(subMenuKey, el)}
          className="sub-menu-list"
          style={{
            display: isLevel3Open ? 'block' : 'none',
            paddingLeft: isExpanded ? '20px' : '0px',
            backgroundColor: '#0f0f0f',
          }}
        >
          <ul
            className="list-none p-0 m-0"
            style={{
              marginLeft: isExpanded ? '-20px' : '0px',
              marginRight: isExpanded ? '-20px' : '0px',
            }}
          >
            {subMenus.map((level3Menu) => {
              const hasLevel4Menus =
                level3Menu.subMenus && level3Menu.subMenus.length > 0;
              if (hasLevel4Menus && !isExpanded) return null;
              return (
                <MenuItemLevel3
                  key={level3Menu.id}
                  level3Menu={level3Menu}
                  parentId={parentId}
                  parentColor={parentColor}
                  level2Id={subMenu.id}
                  isExpanded={isExpanded}
                  activeTab={activeTab}
                  openSubMenusLevel3={openSubMenusLevel3}
                  onLevel3Click={onLevel3Click}
                  onLevel4Click={onLevel4Click}
                  onLevel4Nav={onLevel4Nav}
                  onTabChange={onTabChange}
                  registerRef={registerRef}
                  colors={colors}
                />
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
};

// Comparación custom para memo que maneja Sets correctamente
const arePropsEqual = (prevProps: MenuItemLevel2Props, nextProps: MenuItemLevel2Props) => {
  // Comparar propiedades simples
  if (
    prevProps.subMenu.id !== nextProps.subMenu.id ||
    prevProps.parentId !== nextProps.parentId ||
    prevProps.parentColor !== nextProps.parentColor ||
    prevProps.isExpanded !== nextProps.isExpanded ||
    prevProps.activeTab !== nextProps.activeTab ||
    prevProps.colors.textColor !== nextProps.colors.textColor ||
    prevProps.colors.secondaryTextColor !== nextProps.colors.secondaryTextColor
  ) {
    return false;
  }

  // Comparar Sets - PERO solo si afecta a ESTE elemento específico
  // openSubMenusLevel3: verifica si ALGUNO de los submenus DE ESTE ELEMENTO cambió
  const subMenuKey = `${prevProps.parentId}-${prevProps.subMenu.id}`;
  
  const prevSubMenuOpen = prevProps.openSubMenusLevel3.has(subMenuKey);
  const nextSubMenuOpen = nextProps.openSubMenusLevel3.has(subMenuKey);
  if (prevSubMenuOpen !== nextSubMenuOpen) {
    return false;
  }

  // Verificar si hay cambios en nivel 3+ de ESTE subMenu
  const prevLevel3Keys = Array.from(prevProps.openSubMenusLevel3).filter(key => key.startsWith(`${subMenuKey}-`));
  const nextLevel3Keys = Array.from(nextProps.openSubMenusLevel3).filter(key => key.startsWith(`${subMenuKey}-`));
  
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

export const MenuItemLevel2 = memo(MenuItemLevel2Component, arePropsEqual);
