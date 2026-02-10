import React from 'react';
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

type Level3Item = SubMenuLevel3 | SubMenuLevel4;

export interface MenuItemLevel3Props {
  level3Menu: Level3Item;
  parentId: string;
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

export const MenuItemLevel3: React.FC<MenuItemLevel3Props> = ({
  level3Menu,
  parentId,
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
        className="flex items-center justify-center h-14 cursor-pointer transition-all duration-300 border-0"
        style={{
          color: isLevel3Active ? '#ffffff' : colors.textColor,
          backgroundColor: isLevel3Active
            ? 'rgba(222, 226, 236, 0.1)'
            : 'transparent',
          paddingLeft: isExpanded ? '60px' : '0px',
          paddingRight: isExpanded ? '20px' : '0px',
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff';
          if (!isLevel3Active)
            e.currentTarget.style.backgroundColor = 'rgba(222, 226, 236, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isLevel3Active
            ? '#ffffff'
            : colors.textColor;
          e.currentTarget.style.backgroundColor = isLevel3Active
            ? 'rgba(222, 226, 236, 0.1)'
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
