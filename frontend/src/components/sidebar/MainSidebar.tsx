import React, { useState, useCallback } from 'react';
import SidebarFilters from '../SidebarFilters';
import { useMenuStructure } from './sidebar/hooks/useMenuStructure';
import { useMenuState } from './sidebar/hooks/useMenuState';
import { useMenuActions } from './sidebar/hooks/useMenuActions';
import { useMenuEffects } from './sidebar/hooks/useMenuEffects';
import { MenuItemLevel1 } from './sidebar/components/MenuItemLevel1';
import type { MainSidebarProps } from './types';
import '../../styles/sidebar-template.css';

const TEMPLATE_COLORS = {
  textColor: '#a0a0a0',
  secondaryTextColor: '#ffffff',
  bgColor: '#1a1a1a',
  secondaryBgColor: '#0f0f0f',
  borderColor: 'rgba(255, 255, 255, 0.1)',
};

const MainSidebar: React.FC<MainSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onTabChange,
  activeTab,
  authToken,
}) => {
  const [isCollapsed] = useState(false);
  const menuState = useMenuState();
  const { mainTabs, isLoadingPermissions } = useMenuStructure();
  const menuActions = useMenuActions(menuState, onTabChange);

  useMenuEffects(activeTab, isExpanded, mainTabs, menuState);

  const registerSubMenuRef = useCallback(
    (key: string, el: HTMLDivElement | null) => {
      menuState.subMenuRefs.current[key] = el;
    },
    [menuState.subMenuRefs]
  );

  const registerLevel3Ref = useCallback(
    (key: string, el: HTMLDivElement | null) => {
      menuState.subMenuRefsLevel3.current[key] = el;
    },
    [menuState.subMenuRefsLevel3]
  );

  const colors = {
    textColor: TEMPLATE_COLORS.textColor,
    secondaryTextColor: TEMPLATE_COLORS.secondaryTextColor,
    secondaryBgColor: TEMPLATE_COLORS.secondaryBgColor,
  };

  return (
    <aside
      className={`sidebar h-full w-full overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? 'collapsed' : ''
      }`}
      style={{
        backgroundColor: TEMPLATE_COLORS.bgColor,
        color: TEMPLATE_COLORS.textColor,
        borderRight: `1px solid ${TEMPLATE_COLORS.borderColor}`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!isExpanded && (
        <>
          <div
            className="absolute -right-4 top-0 bottom-0 w-8 z-50 cursor-pointer"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ pointerEvents: 'auto' }}
          />
          <div
            className="absolute -left-4 top-0 bottom-0 w-8 z-50 cursor-pointer"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ pointerEvents: 'auto' }}
          />
        </>
      )}

      <div className="sidebar-layout h-full flex flex-col relative z-20">
        <div
          className="sidebar-header flex items-center px-5 flex-shrink-0 border-b transition-all duration-300"
          style={{
            height: '64px',
            minHeight: '64px',
            borderBottomColor: TEMPLATE_COLORS.borderColor,
          }}
        >
          {isExpanded ? (
            <div className="flex items-center space-x-3">
              <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
              <img
                src="/Logo - texto.png"
                alt="JoySense"
                className="h-6 w-auto overflow-hidden text-ellipsis whitespace-nowrap"
              />
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
            </div>
          )}
        </div>

        <div
          className="sidebar-content flex-grow overflow-y-auto transition-all duration-300"
          style={{ padding: '10px 0' }}
        >
          {isExpanded && !isLoadingPermissions && (
            <>
              <div
                className="filters-section px-5 py-4 transition-all duration-300"
                style={{
                  borderBottom: `1px solid ${TEMPLATE_COLORS.borderColor}`,
                }}
              >
                <SidebarFilters authToken={authToken} />
              </div>
              <div
                style={{
                  height: '1px',
                  backgroundColor: TEMPLATE_COLORS.borderColor,
                  margin: '8px 0',
                  opacity: 0.5,
                }}
              />
            </>
          )}

          {isLoadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{
                  borderBottomColor: TEMPLATE_COLORS.secondaryTextColor,
                }}
              />
            </div>
          ) : (
            <nav
              className="menu open-current-submenu"
              style={{
                marginLeft: isExpanded ? '-20px' : '0px',
                marginRight: isExpanded ? '-20px' : '0px',
              }}
            >
              <ul className="list-none p-0 m-0">
                {mainTabs.map((tab) => (
                  <MenuItemLevel1
                    key={tab.id}
                    tab={tab}
                    isExpanded={isExpanded}
                    activeTab={activeTab}
                    openSubMenus={menuState.openSubMenus}
                    openSubMenusLevel3={menuState.openSubMenusLevel3}
                    onMenuClick={menuActions.handleMenuClick}
                    onLevel2Click={menuActions.handleLevel2MenuClick}
                    onLevel3Click={menuActions.handleSubMenuLevel3Click}
                    onLevel4Click={menuActions.handleSubMenuLevel4ClickWithSubMenus}
                    onLevel4Nav={menuActions.handleSubMenuLevel4Click}
                    onTabChange={onTabChange}
                    registerSubMenuRef={registerSubMenuRef}
                    registerLevel3Ref={registerLevel3Ref}
                    colors={colors}
                  />
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </aside>
  );
};

export default MainSidebar;
