import React from 'react';
import type { SubMenuLevel4 } from '../../types';

const SUB_INDICATOR_STYLE = {
  width: '5px',
  height: '5px',
  borderRight: '2px solid currentcolor',
  borderBottom: '2px solid currentcolor',
  transition: 'transform 0.3s',
  marginLeft: 'auto',
  flexShrink: 0,
};

// Función para obtener los colores según el tipo de sección (versión más tenue para nivel 4)
const getColorBySection = (color?: string, level: 'level4' | 'level5' = 'level4') => {
  if (level === 'level4') {
    // Nivel 4: Mucho más claro
    switch (color) {
      case 'blue': // REPORTES
        return {
          active: `rgba(59, 130, 246, 0.5)`, // blue-500 muy tenue
          activeBg: `rgba(59, 130, 246, 0.05)`,
          hover: `rgba(96, 165, 250, 0.5)`, // blue-400 muy tenue
          hoverBg: `rgba(59, 130, 246, 0.02)`,
        };
      case 'green': // AGRUPACION
        return {
          active: `rgba(34, 197, 94, 0.5)`, // green-500 muy tenue
          activeBg: `rgba(34, 197, 94, 0.05)`,
          hover: `rgba(74, 222, 128, 0.5)`, // green-400 muy tenue
          hoverBg: `rgba(34, 197, 94, 0.02)`,
        };
      case 'orange': // CONFIGURACION
        return {
          active: `rgba(249, 115, 22, 0.5)`, // orange-500 muy tenue
          activeBg: `rgba(249, 115, 22, 0.05)`,
          hover: `rgba(251, 146, 60, 0.5)`, // orange-400 muy tenue
          hoverBg: `rgba(249, 115, 22, 0.02)`,
        };
      case 'gray': // AJUSTES
        return {
          active: `rgba(107, 114, 128, 0.5)`, // gray-500 muy tenue
          activeBg: `rgba(107, 114, 128, 0.05)`,
          hover: `rgba(156, 163, 175, 0.5)`, // gray-400 muy tenue
          hoverBg: `rgba(107, 114, 128, 0.02)`,
        };
      case 'red': // PLANTA PROC
        return {
          active: `rgba(239, 68, 68, 0.5)`, // red-500 muy tenue
          activeBg: `rgba(239, 68, 68, 0.05)`,
          hover: `rgba(248, 113, 113, 0.5)`, // red-400 muy tenue
          hoverBg: `rgba(239, 68, 68, 0.02)`,
        };
      case 'cyan': // RESERVORIOS
        return {
          active: `rgba(34, 211, 238, 0.5)`, // cyan-400 muy tenue
          activeBg: `rgba(34, 211, 238, 0.05)`,
          hover: `rgba(103, 232, 249, 0.5)`, // cyan-300 muy tenue
          hoverBg: `rgba(34, 211, 238, 0.02)`,
        };
      case 'yellow': // TRACTORES
        return {
          active: `rgba(250, 204, 21, 0.5)`, // yellow-400 muy tenue
          activeBg: `rgba(250, 204, 21, 0.05)`,
          hover: `rgba(253, 224, 71, 0.5)`, // yellow-300 muy tenue
          hoverBg: `rgba(250, 204, 21, 0.02)`,
        };
      case 'silver': // METEOROLOGIA
        return {
          active: `rgba(156, 163, 175, 0.5)`, // gray-400 muy tenue
          activeBg: `rgba(156, 163, 175, 0.05)`,
          hover: `rgba(209, 213, 219, 0.5)`, // gray-300 muy tenue
          hoverBg: `rgba(156, 163, 175, 0.02)`,
        };
      case 'brown': // OSMOSIS
        return {
          active: `rgba(180, 83, 9, 0.5)`, // amber-700 muy tenue
          activeBg: `rgba(180, 83, 9, 0.05)`,
          hover: `rgba(217, 119, 6, 0.5)`, // amber-600 muy tenue
          hoverBg: `rgba(180, 83, 9, 0.02)`,
        };
      default:
        return {
          active: '#ffffff',
          activeBg: 'rgba(222, 226, 236, 0.05)',
          hover: '#ffffff',
          hoverBg: 'rgba(222, 226, 236, 0.02)',
        };
    }
  } else {
    // Nivel 5: Casi imperceptible
    switch (color) {
      case 'blue': // REPORTES
        return {
          active: `rgba(59, 130, 246, 0.3)`, // blue-500 casi imperceptible
          activeBg: `rgba(59, 130, 246, 0.03)`,
          hover: `rgba(96, 165, 250, 0.3)`, // blue-400 casi imperceptible
          hoverBg: `rgba(59, 130, 246, 0.01)`,
        };
      case 'green': // AGRUPACION
        return {
          active: `rgba(34, 197, 94, 0.3)`, // green-500 casi imperceptible
          activeBg: `rgba(34, 197, 94, 0.03)`,
          hover: `rgba(74, 222, 128, 0.3)`, // green-400 casi imperceptible
          hoverBg: `rgba(34, 197, 94, 0.01)`,
        };
      case 'orange': // CONFIGURACION
        return {
          active: `rgba(249, 115, 22, 0.3)`, // orange-500 casi imperceptible
          activeBg: `rgba(249, 115, 22, 0.03)`,
          hover: `rgba(251, 146, 60, 0.3)`, // orange-400 casi imperceptible
          hoverBg: `rgba(249, 115, 22, 0.01)`,
        };
      case 'gray': // AJUSTES
        return {
          active: `rgba(107, 114, 128, 0.3)`, // gray-500 casi imperceptible
          activeBg: `rgba(107, 114, 128, 0.03)`,
          hover: `rgba(156, 163, 175, 0.3)`, // gray-400 casi imperceptible
          hoverBg: `rgba(107, 114, 128, 0.01)`,
        };
      case 'red': // PLANTA PROC
        return {
          active: `rgba(239, 68, 68, 0.3)`, // red-500 casi imperceptible
          activeBg: `rgba(239, 68, 68, 0.03)`,
          hover: `rgba(248, 113, 113, 0.3)`, // red-400 casi imperceptible
          hoverBg: `rgba(239, 68, 68, 0.01)`,
        };
      case 'cyan': // RESERVORIOS
        return {
          active: `rgba(34, 211, 238, 0.3)`, // cyan-400 casi imperceptible
          activeBg: `rgba(34, 211, 238, 0.03)`,
          hover: `rgba(103, 232, 249, 0.3)`, // cyan-300 casi imperceptible
          hoverBg: `rgba(34, 211, 238, 0.01)`,
        };
      case 'yellow': // TRACTORES
        return {
          active: `rgba(250, 204, 21, 0.3)`, // yellow-400 casi imperceptible
          activeBg: `rgba(250, 204, 21, 0.03)`,
          hover: `rgba(253, 224, 71, 0.3)`, // yellow-300 casi imperceptible
          hoverBg: `rgba(250, 204, 21, 0.01)`,
        };
      case 'silver': // METEOROLOGIA
        return {
          active: `rgba(156, 163, 175, 0.3)`, // gray-400 casi imperceptible
          activeBg: `rgba(156, 163, 175, 0.03)`,
          hover: `rgba(209, 213, 219, 0.3)`, // gray-300 casi imperceptible
          hoverBg: `rgba(156, 163, 175, 0.01)`,
        };
      case 'brown': // OSMOSIS
        return {
          active: `rgba(180, 83, 9, 0.3)`, // amber-700 casi imperceptible
          activeBg: `rgba(180, 83, 9, 0.03)`,
          hover: `rgba(217, 119, 6, 0.3)`, // amber-600 casi imperceptible
          hoverBg: `rgba(180, 83, 9, 0.01)`,
        };
      default:
        return {
          active: '#ffffff',
          activeBg: 'rgba(222, 226, 236, 0.03)',
          hover: '#ffffff',
          hoverBg: 'rgba(222, 226, 236, 0.01)',
        };
    }
  }
};

export interface MenuItemLevel4Props {
  level4Menu: SubMenuLevel4;
  parentId: string;
  parentColor?: string;
  level2Id: string;
  level3Id: string;
  isExpanded: boolean;
  activeTab: string;
  openSubMenusLevel3: Set<string>;
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

export const MenuItemLevel4: React.FC<MenuItemLevel4Props> = ({
  level4Menu,
  parentId,
  parentColor,
  level2Id,
  level3Id,
  isExpanded,
  activeTab,
  openSubMenusLevel3,
  onLevel4Click,
  onLevel4Nav,
  onTabChange,
  registerRef,
  colors,
}) => {
  const level4ActiveTab = `${parentId}-${level2Id}-${level3Id}-${level4Menu.id}`;
  const isLevel4Active =
    activeTab === level4ActiveTab || activeTab.startsWith(level4ActiveTab + '-');
  const hasLevel5Menus =
    level4Menu.subMenus && level4Menu.subMenus.length > 0;
  const level4MenuKey = level4ActiveTab;
  
  // 🔍 FIX: isLevel5Open debe ser true si algún nivel 5 hijo está abierto en openSubMenusLevel3
  // No solo si el nivel 4 está abierto
  const isLevel5Open = hasLevel5Menus &&
    level4Menu.subMenus!.some((level5Menu) => {
      const level5Key = `${level4ActiveTab}-${level5Menu.id}`;
      return openSubMenusLevel3.has(level5Key);
    });

  // 🔍 FIX: Verificar si algún nivel 5 dentro de este nivel 4 está abierto EN EL ESTADO
  // No solo en activeTab, sino también si alguno está en openSubMenusLevel3
  const hasActiveLevel5Child = hasLevel5Menus && 
    level4Menu.subMenus!.some((level5Menu) => {
      const level5Key = `${level4ActiveTab}-${level5Menu.id}`;
      // Verificar tanto en activeTab como en openSubMenusLevel3
      return activeTab.startsWith(level5Key) || openSubMenusLevel3.has(level5Key);
    });


  const handleClick = () => {
    if (hasLevel5Menus) {
      onLevel4Click(parentId, level2Id, level3Id, level4Menu.id, true);
    } else {
      onLevel4Nav(parentId, level2Id, level3Id, level4Menu.id);
    }
  };

  return (
    <li
      className={`menu-item ${isLevel4Active ? 'active' : ''} ${
        isExpanded && hasLevel5Menus ? 'sub-menu' : ''
      } ${isExpanded && isLevel5Open ? 'open' : ''}`}
    >
      <button
        onClick={handleClick}
        className={`flex items-center h-10 cursor-pointer transition-all duration-300 w-full text-left border-0 ${
          isExpanded ? 'justify-start' : 'justify-center'
        }`}
        style={{
          color: isLevel4Active ? getColorBySection(parentColor, 'level4').active : colors.textColor,
          backgroundColor: isLevel4Active
            ? getColorBySection(parentColor, 'level4').activeBg
            : 'transparent',
          paddingLeft: isExpanded ? '80px' : '20px',
          paddingRight: '20px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = getColorBySection(parentColor, 'level4').hover;
          if (!isLevel4Active)
            e.currentTarget.style.backgroundColor = getColorBySection(parentColor, 'level4').hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isLevel4Active
            ? getColorBySection(parentColor, 'level4').active
            : colors.textColor;
          e.currentTarget.style.backgroundColor = isLevel4Active
            ? getColorBySection(parentColor, 'level4').activeBg
            : 'transparent';
        }}
      >
        <span
          className="menu-icon flex-shrink-0 flex items-center justify-center"
          style={{
            fontSize: '0.85rem',
            width: '20px',
            minWidth: '20px',
            height: '20px',
            marginRight: '10px',
            borderRadius: '2px',
            transition: 'color 0.3s',
          }}
        >
          {level4Menu.icon}
        </span>
        {isExpanded && (
          <>
            <span
              className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
              style={{ fontSize: '0.75rem' }}
            >
              {level4Menu.label.toUpperCase()}
            </span>
            {hasLevel5Menus && (
              <span
                className="sub-menu-indicator"
                style={{
                  ...SUB_INDICATOR_STYLE,
                  transform: isLevel5Open ? 'rotate(45deg)' : 'rotate(-45deg)',
                }}
              />
            )}
          </>
        )}
      </button>
      {hasLevel5Menus && (isExpanded || isLevel4Active || hasActiveLevel5Child) && (
        <div
          ref={(el) => registerRef(level4MenuKey, el)}
          className="sub-menu-list"
          style={{
            display: isLevel5Open ? 'block' : 'none',
            paddingLeft: '20px',
            backgroundColor: '#0f0f0f',
          }}
        >
          <ul
            className="list-none p-0 m-0"
            style={{ marginLeft: '-20px', marginRight: '-20px' }}
          >
            {level4Menu.subMenus!.map((level5Menu) => {
              const level5ActiveTab = `${parentId}-${level2Id}-${level3Id}-${level4Menu.id}-${level5Menu.id}`;
              const isLevel5Active =
                activeTab === level5ActiveTab ||
                activeTab.startsWith(level5ActiveTab + '-');
              return (
                <li
                  key={level5Menu.id}
                  className={`menu-item ${isLevel5Active ? 'active' : ''}`}
                >
                  <button
                    onClick={() =>
                      onTabChange(
                        `${parentId}-${level2Id}-${level3Id}-${level4Menu.id}-${level5Menu.id}`
                      )
                    }
                    className="flex items-center h-10 cursor-pointer transition-all duration-300 w-full text-left border-0"
                    style={{
                      color: isLevel5Active
                        ? getColorBySection(parentColor, 'level5').active
                        : colors.textColor,
                      backgroundColor: isLevel5Active
                        ? getColorBySection(parentColor, 'level5').activeBg
                        : 'transparent',
                      paddingLeft: isExpanded ? '100px' : '20px',
                      paddingRight: '20px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = getColorBySection(parentColor, 'level5').hover;
                      if (!isLevel5Active)
                        e.currentTarget.style.backgroundColor = getColorBySection(parentColor, 'level5').hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isLevel5Active
                        ? getColorBySection(parentColor, 'level5').active
                        : colors.textColor;
                      e.currentTarget.style.backgroundColor = isLevel5Active
                        ? getColorBySection(parentColor, 'level5').activeBg
                        : 'transparent';
                    }}
                  >
                    <span
                      className="menu-icon flex-shrink-0 flex items-center justify-center"
                      style={{
                        fontSize: '0.8rem',
                        width: '18px',
                        minWidth: '18px',
                        height: '18px',
                        marginRight: '10px',
                        borderRadius: '2px',
                        transition: 'color 0.3s',
                      }}
                    >
                      {level5Menu.icon}
                    </span>
                    {isExpanded && (
                      <span
                        className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {level5Menu.label.toUpperCase()}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
};
