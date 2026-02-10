import React from 'react';
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

export interface MenuItemLevel2Props {
  subMenu: SubMenuLevel2;
  parentId: string;
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

export const MenuItemLevel2: React.FC<MenuItemLevel2Props> = ({
  subMenu,
  parentId,
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
  const isLevel3Open = openSubMenusLevel3.has(subMenuKey);

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
          color: isSubActive ? '#ffffff' : colors.textColor,
          backgroundColor: isSubActive
            ? 'rgba(222, 226, 236, 0.12)'
            : 'transparent',
          paddingLeft: isExpanded ? '40px' : '0px',
          paddingRight: isExpanded ? '20px' : '0px',
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff';
          if (!isSubActive)
            e.currentTarget.style.backgroundColor = 'rgba(222, 226, 236, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isSubActive
            ? '#ffffff'
            : colors.textColor;
          e.currentTarget.style.backgroundColor = isSubActive
            ? 'rgba(222, 226, 236, 0.12)'
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
