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

export interface MenuItemLevel4Props {
  level4Menu: SubMenuLevel4;
  parentId: string;
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
  const isLevel5Open = openSubMenusLevel3.has(level4MenuKey);

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
        className="flex items-center h-10 cursor-pointer transition-all duration-300 w-full text-left border-0 bg-transparent"
        style={{
          color: isLevel4Active ? colors.secondaryTextColor : colors.textColor,
          paddingLeft: isExpanded ? '80px' : '20px',
          paddingRight: '20px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.secondaryTextColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isLevel4Active
            ? colors.secondaryTextColor
            : colors.textColor;
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
      {hasLevel5Menus && isExpanded && (
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
                    className="flex items-center h-10 cursor-pointer transition-all duration-300 w-full text-left border-0 bg-transparent"
                    style={{
                      color: isLevel5Active
                        ? colors.secondaryTextColor
                        : colors.textColor,
                      paddingLeft: isExpanded ? '100px' : '20px',
                      paddingRight: '20px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.secondaryTextColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isLevel5Active
                        ? colors.secondaryTextColor
                        : colors.textColor;
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
