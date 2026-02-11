import React, { memo } from 'react';
import type { SubMenuLevel3, SubMenuLevel4 } from '../../types';
import { MenuItemLevel4 } from './MenuItemLevel4';

const SUB_INDICATOR_STYLE = {
  width: '5px',
  height: '5px',
  borderRight: '2px solid currentcolor',
  borderBottom: '2px solid currentcolor',
  transition: 'transform 0.3s',
  marginLeft: 'auto',
  flexShrink: 0,
};

// Función para obtener los colores según el tipo de sección (versión más tenue para nivel 3)
const getColorBySection = (color?: string, level: 'level3' | 'level4' = 'level3') => {
  if (level === 'level3') {
    // Nivel 3: Más claro que nivel 2
    switch (color) {
      case 'blue': // REPORTES
        return {
          active: `rgba(59, 130, 246, 0.7)`, // blue-500 más tenue
          activeBg: `rgba(59, 130, 246, 0.1)`,
          hover: `rgba(96, 165, 250, 0.7)`, // blue-400 más tenue
          hoverBg: `rgba(59, 130, 246, 0.05)`,
        };
      case 'green': // AGRUPACION
        return {
          active: `rgba(34, 197, 94, 0.7)`, // green-500 más tenue
          activeBg: `rgba(34, 197, 94, 0.1)`,
          hover: `rgba(74, 222, 128, 0.7)`, // green-400 más tenue
          hoverBg: `rgba(34, 197, 94, 0.05)`,
        };
      case 'orange': // CONFIGURACION
        return {
          active: `rgba(249, 115, 22, 0.7)`, // orange-500 más tenue
          activeBg: `rgba(249, 115, 22, 0.1)`,
          hover: `rgba(251, 146, 60, 0.7)`, // orange-400 más tenue
          hoverBg: `rgba(249, 115, 22, 0.05)`,
        };
      case 'gray': // AJUSTES
        return {
          active: `rgba(107, 114, 128, 0.7)`, // gray-500 más tenue
          activeBg: `rgba(107, 114, 128, 0.1)`,
          hover: `rgba(156, 163, 175, 0.7)`, // gray-400 más tenue
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
  } else {
    // Nivel 4: Aún más claro
    switch (color) {
      case 'blue': // REPORTES
        return {
          active: `rgba(59, 130, 246, 0.5)`, // blue-500 más tenue
          activeBg: `rgba(59, 130, 246, 0.05)`,
          hover: `rgba(96, 165, 250, 0.5)`, // blue-400 más tenue
          hoverBg: `rgba(59, 130, 246, 0.02)`,
        };
      case 'green': // AGRUPACION
        return {
          active: `rgba(34, 197, 94, 0.5)`, // green-500 más tenue
          activeBg: `rgba(34, 197, 94, 0.05)`,
          hover: `rgba(74, 222, 128, 0.5)`, // green-400 más tenue
          hoverBg: `rgba(34, 197, 94, 0.02)`,
        };
      case 'orange': // CONFIGURACION
        return {
          active: `rgba(249, 115, 22, 0.5)`, // orange-500 más tenue
          activeBg: `rgba(249, 115, 22, 0.05)`,
          hover: `rgba(251, 146, 60, 0.5)`, // orange-400 más tenue
          hoverBg: `rgba(249, 115, 22, 0.02)`,
        };
      case 'gray': // AJUSTES
        return {
          active: `rgba(107, 114, 128, 0.5)`, // gray-500 más tenue
          activeBg: `rgba(107, 114, 128, 0.05)`,
          hover: `rgba(156, 163, 175, 0.5)`, // gray-400 más tenue
          hoverBg: `rgba(107, 114, 128, 0.02)`,
        };
      default:
        return {
          active: '#ffffff',
          activeBg: 'rgba(222, 226, 236, 0.05)',
          hover: '#ffffff',
          hoverBg: 'rgba(222, 226, 236, 0.02)',
        };
    }
  }
};

type Level3Item = SubMenuLevel3 | SubMenuLevel4;

export interface MenuItemLevel3Props {
  level3Menu: Level3Item;
  parentId: string;
  parentColor?: string;
  level2Id: string;
  isExpanded: boolean;
  activeTab: string;
  openSubMenusLevel3: Set<string>;
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

const MenuItemLevel3Component: React.FC<MenuItemLevel3Props> = ({
  level3Menu,
  parentId,
  parentColor,
  level2Id,
  isExpanded,
  activeTab,
  openSubMenusLevel3,
  onLevel3Click,
  onLevel4Click,
  onLevel4Nav,
  onTabChange,
  registerRef,
  colors,
}) => {
  const level3ActiveTab = `${parentId}-${level2Id}-${level3Menu.id}`;
  const isLevel3Active =
    activeTab === level3ActiveTab || activeTab.startsWith(level3ActiveTab + '-');
  const hasLevel4Menus =
    level3Menu.subMenus && level3Menu.subMenus.length > 0;
  const level3MenuKey = level3ActiveTab;
  
  // Para nivel 3: El menú está abierto si:
  // 1. Está en openSubMenusLevel3, O
  // 2. El activeTab corresponde a este elemento
  const isLevel4Open = openSubMenusLevel3.has(level3MenuKey) || isLevel3Active;

  const handleClick = () => {
    onLevel3Click(parentId, level2Id, level3Menu.id, hasLevel4Menus || false);
  };

  return (
    <li
      key={level3Menu.id}
      className={`menu-item ${isLevel3Active ? 'active' : ''} ${
        isExpanded && hasLevel4Menus ? 'sub-menu' : ''
      } ${isExpanded && isLevel4Open ? 'open' : ''}`}
    >
      <button
        onClick={handleClick}
        className={`flex items-center h-14 cursor-pointer transition-all duration-300 border-0 ${
          isExpanded ? 'justify-start' : 'justify-center'
        }`}
        style={{
          color: isLevel3Active ? getColorBySection(parentColor, 'level3').active : colors.textColor,
          backgroundColor: isLevel3Active
            ? getColorBySection(parentColor, 'level3').activeBg
            : 'transparent',
          paddingLeft: isExpanded ? '60px' : '0px',
          paddingRight: isExpanded ? '20px' : '0px',
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = getColorBySection(parentColor, 'level3').hover;
          if (!isLevel3Active)
            e.currentTarget.style.backgroundColor = getColorBySection(parentColor, 'level3').hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isLevel3Active
            ? getColorBySection(parentColor, 'level3').active
            : colors.textColor;
          e.currentTarget.style.backgroundColor = isLevel3Active
            ? getColorBySection(parentColor, 'level3').activeBg
            : 'transparent';
        }}
      >
        <span
          className="menu-icon flex-shrink-0 flex items-center justify-center"
          style={{
            fontSize: '0.95rem',
            width: '32px',
            minWidth: '32px',
            height: '32px',
            marginRight: isExpanded ? '12px' : '0px',
            borderRadius: '2px',
            transition: 'color 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {level3Menu.icon}
        </span>
        {isExpanded && (
          <>
            <span
              className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
              style={{ fontSize: '0.8rem' }}
            >
              {level3Menu.label.toUpperCase()}
            </span>
            {hasLevel4Menus && (
              <span
                className="sub-menu-indicator"
                style={{
                  ...SUB_INDICATOR_STYLE,
                  transform: isLevel4Open ? 'rotate(45deg)' : 'rotate(-45deg)',
                }}
              />
            )}
          </>
        )}
      </button>
      {hasLevel4Menus && isExpanded && (
        <div
          ref={(el) => registerRef(level3MenuKey, el)}
          className="sub-menu-list"
          style={{
            display: isLevel4Open ? 'block' : 'none',
            paddingLeft: '20px',
            backgroundColor: '#0f0f0f',
          }}
        >
          <ul
            className="list-none p-0 m-0"
            style={{ marginLeft: '-20px', marginRight: '-20px' }}
          >
            {level3Menu.subMenus!.map((level4Menu) => (
              <MenuItemLevel4
                key={level4Menu.id}
                level4Menu={level4Menu}
                parentId={parentId}
                parentColor={parentColor}
                level2Id={level2Id}
                level3Id={level3Menu.id}
                isExpanded={isExpanded}
                activeTab={activeTab}
                openSubMenusLevel3={openSubMenusLevel3}
                onLevel4Click={onLevel4Click}
                onLevel4Nav={onLevel4Nav}
                onTabChange={onTabChange}
                registerRef={registerRef}
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
const arePropsEqual = (prevProps: MenuItemLevel3Props, nextProps: MenuItemLevel3Props) => {
  // Comparar propiedades simples
  if (
    prevProps.level3Menu.id !== nextProps.level3Menu.id ||
    prevProps.parentId !== nextProps.parentId ||
    prevProps.parentColor !== nextProps.parentColor ||
    prevProps.level2Id !== nextProps.level2Id ||
    prevProps.isExpanded !== nextProps.isExpanded ||
    prevProps.activeTab !== nextProps.activeTab ||
    prevProps.colors.textColor !== nextProps.colors.textColor ||
    prevProps.colors.secondaryTextColor !== nextProps.colors.secondaryTextColor
  ) {
    return false;
  }

  // Comparar Sets - PERO solo si afecta a ESTE elemento específico
  const level3MenuKey = `${prevProps.parentId}-${prevProps.level2Id}-${prevProps.level3Menu.id}`;
  
  const prevIsOpen = prevProps.openSubMenusLevel3.has(level3MenuKey);
  const nextIsOpen = nextProps.openSubMenusLevel3.has(level3MenuKey);
  if (prevIsOpen !== nextIsOpen) {
    return false;
  }

  // Verificar si hay cambios en nivel 4+ de ESTE menú
  const prevLevel4Keys = Array.from(prevProps.openSubMenusLevel3).filter(key => key.startsWith(`${level3MenuKey}-`));
  const nextLevel4Keys = Array.from(nextProps.openSubMenusLevel3).filter(key => key.startsWith(`${level3MenuKey}-`));
  
  if (prevLevel4Keys.length !== nextLevel4Keys.length) {
    return false;
  }
  for (const key of prevLevel4Keys) {
    if (!nextProps.openSubMenusLevel3.has(key)) {
      return false;
    }
  }

  return true;
};

export const MenuItemLevel3 = memo(MenuItemLevel3Component, arePropsEqual);
