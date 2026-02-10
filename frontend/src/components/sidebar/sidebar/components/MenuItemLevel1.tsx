import React from 'react';
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

export const MenuItemLevel1: React.FC<MenuItemLevel1Props> = ({
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
          color: isActive ? '#ffffff' : colors.textColor,
          backgroundColor: isActive
            ? 'rgba(222, 226, 236, 0.15)'
            : 'transparent',
          paddingLeft: isExpanded ? '30px' : '0px',
          paddingRight: isExpanded ? '10px' : '0px',
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff';
          if (!isActive)
            e.currentTarget.style.backgroundColor = 'rgba(222, 226, 236, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isActive
            ? '#ffffff'
            : colors.textColor;
          e.currentTarget.style.backgroundColor = isActive
            ? 'rgba(222, 226, 236, 0.15)'
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
