import { useEffect } from 'react';
import { slideToggle } from '../../../../utils/sidebarAnimations';
import type { MainTab, SubMenuLevel2, SubMenuLevel3 } from '../../types';

type MenuState = {
  openSubMenus: Set<string>;
  setOpenSubMenus: React.Dispatch<React.SetStateAction<Set<string>>>;
  openSubMenusLevel3: Set<string>;
  setOpenSubMenusLevel3: React.Dispatch<React.SetStateAction<Set<string>>>;
  subMenuRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  subMenuRefsLevel3: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  prevMainTabRef: React.MutableRefObject<string | null>;
};

export function useMenuEffects(
  activeTab: string,
  isExpanded: boolean,
  mainTabs: MainTab[],
  state: MenuState
) {
  const {
    openSubMenus,
    setOpenSubMenus,
    openSubMenusLevel3,
    setOpenSubMenusLevel3,
    subMenuRefs,
    subMenuRefsLevel3,
    prevMainTabRef,
  } = state;

  useEffect(() => {
    if (!isExpanded) {
      setOpenSubMenusLevel3((prev) => {
        const newSet = new Set(prev);
        Array.from(prev).forEach((key) => {
          const parts = key.split('-');
          if (parts.length >= 4) newSet.delete(key);
        });
        return newSet;
      });
    }
  }, [isExpanded, setOpenSubMenusLevel3]);

  useEffect(() => {
    if (!activeTab || !isExpanded) return;

    const parts = activeTab.split('-');
    const mainTabId = parts[0];
    const tab = mainTabs.find((t) => t.id === mainTabId);
    prevMainTabRef.current = mainTabId;

    if (tab && tab.subMenus && tab.subMenus.length > 0 && parts.length > 1) {
      const shouldBeOpen = activeTab.startsWith(`${mainTabId}-`);

      if (shouldBeOpen && !openSubMenus.has(mainTabId)) {
        const subMenuElement = subMenuRefs.current[mainTabId];
        if (subMenuElement) {
          const computedStyle = window.getComputedStyle(subMenuElement);
          if (computedStyle.display === 'none' || computedStyle.height === '0px') {
            slideToggle(subMenuElement).then(() => {
              setOpenSubMenus((prev) => {
                const newSet = new Set(prev);
                newSet.add(mainTabId);
                return newSet;
              });
            });
          } else {
            setOpenSubMenus((prev) => {
              const newSet = new Set(prev);
              newSet.add(mainTabId);
              return newSet;
            });
          }
        }
      }

      if (parts.length >= 3) {
        const level2Id = parts[1];
        const level3Key = `${mainTabId}-${level2Id}`;
        const subMenus = tab.subMenus as SubMenuLevel2[] | undefined;
        const subMenu = subMenus?.find((sm: SubMenuLevel2) => sm.id === level2Id);

        if (subMenu && subMenu.subMenus && subMenu.subMenus.length > 0) {
          const otherLevel3Menus = Array.from(openSubMenusLevel3).filter(
            (key) =>
              key.split('-').length === 3 &&
              key.startsWith(`${mainTabId}-${level2Id}-`) &&
              key !== level3Key
          );

          for (const otherMenuKey of otherLevel3Menus) {
            const otherElement = subMenuRefsLevel3.current[otherMenuKey];
            if (otherElement && window.getComputedStyle(otherElement).display !== 'none') {
              slideToggle(otherElement);
            }
          }

          if (otherLevel3Menus.length > 0) {
            setOpenSubMenusLevel3((prev) => {
              const newSet = new Set(prev);
              otherLevel3Menus.forEach((key) => newSet.delete(key));
              return newSet;
            });
          }

          if (!openSubMenusLevel3.has(level3Key)) {
            const level3Element = subMenuRefsLevel3.current[level3Key];
            if (level3Element) {
              const computedStyle = window.getComputedStyle(level3Element);
              if (computedStyle.display === 'none' || computedStyle.height === '0px') {
                slideToggle(level3Element).then(() => {
                  setOpenSubMenusLevel3((prev) => {
                    const newSet = new Set(prev);
                    newSet.add(level3Key);
                    return newSet;
                  });
                });
              } else {
                setOpenSubMenusLevel3((prev) => {
                  const newSet = new Set(prev);
                  newSet.add(level3Key);
                  return newSet;
                });
              }
            }
          }

          if (parts.length >= 4) {
            const level3Id = parts[2];
            const level4Key = `${mainTabId}-${level2Id}-${level3Id}`;
            const level3Menu = (subMenu.subMenus as SubMenuLevel3[] | undefined)?.find(
              (sm) => sm.id === level3Id
            );

            if (
              level3Menu &&
              level3Menu.subMenus &&
              level3Menu.subMenus.length > 0
            ) {
              const otherLevel4Menus = Array.from(openSubMenusLevel3).filter(
                (key) =>
                  key.split('-').length === 4 &&
                  key.startsWith(`${mainTabId}-${level2Id}-${level3Id}-`) &&
                  key !== level4Key
              );

              for (const otherMenuKey of otherLevel4Menus) {
                const otherElement = subMenuRefsLevel3.current[otherMenuKey];
                if (
                  otherElement &&
                  window.getComputedStyle(otherElement).display !== 'none'
                ) {
                  slideToggle(otherElement);
                }
              }

              if (otherLevel4Menus.length > 0) {
                setOpenSubMenusLevel3((prev) => {
                  const newSet = new Set(prev);
                  otherLevel4Menus.forEach((key) => newSet.delete(key));
                  return newSet;
                });
              }

              if (!openSubMenusLevel3.has(level4Key)) {
                const level4Element = subMenuRefsLevel3.current[level4Key];
                if (level4Element) {
                  const computedStyle = window.getComputedStyle(level4Element);
                  if (
                    computedStyle.display === 'none' ||
                    computedStyle.height === '0px'
                  ) {
                    slideToggle(level4Element).then(() => {
                      setOpenSubMenusLevel3((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(level4Key);
                        return newSet;
                      });
                    });
                  } else {
                    setOpenSubMenusLevel3((prev) => {
                      const newSet = new Set(prev);
                      newSet.add(level4Key);
                      return newSet;
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [
    activeTab,
    isExpanded,
    mainTabs,
    openSubMenus,
    openSubMenusLevel3,
    subMenuRefs,
    subMenuRefsLevel3,
    setOpenSubMenus,
    setOpenSubMenusLevel3,
  ]);
}
