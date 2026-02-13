import { useCallback } from 'react';
import { slideToggle } from '../../../../utils/sidebarAnimations';

type MenuState = {
  openSubMenus: Set<string>;
  setOpenSubMenus: React.Dispatch<React.SetStateAction<Set<string>>>;
  openSubMenusLevel3: Set<string>;
  setOpenSubMenusLevel3: React.Dispatch<React.SetStateAction<Set<string>>>;
  subMenuRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  subMenuRefsLevel3: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
};

export function useMenuActions(
  state: MenuState,
  onTabChange: (tab: string) => void
) {
  const {
    openSubMenus,
    setOpenSubMenus,
    openSubMenusLevel3,
    setOpenSubMenusLevel3,
    subMenuRefs,
    subMenuRefsLevel3,
  } = state;

  const closeAllMenus = useCallback(async () => {
    const otherOpenMenus = Array.from(openSubMenus);
    for (const otherMenuId of otherOpenMenus) {
      const otherElement = subMenuRefs.current[otherMenuId];
      if (otherElement) await slideToggle(otherElement);
    }
    const otherLevel3Menus = Array.from(openSubMenusLevel3);
    for (const otherMenuId of otherLevel3Menus) {
      const otherElement = subMenuRefsLevel3.current[otherMenuId];
      if (otherElement) await slideToggle(otherElement);
    }
    setOpenSubMenus(new Set());
    setOpenSubMenusLevel3(new Set());
  }, [
    openSubMenus,
    openSubMenusLevel3,
    subMenuRefs,
    subMenuRefsLevel3,
    setOpenSubMenus,
    setOpenSubMenusLevel3,
  ]);

  const handleMenuClick = useCallback(
    async (tabId: string, hasSubMenus: boolean) => {
      if (!hasSubMenus) {
        await closeAllMenus();
        onTabChange(tabId);
        return;
      }
      const subMenuElement = subMenuRefs.current[tabId];
      if (!subMenuElement) {
        onTabChange(tabId);
        return;
      }
      const isOpen = openSubMenus.has(tabId);
      onTabChange(tabId);
      if (!isOpen) {
        const otherOpenMenus = Array.from(openSubMenus);
        for (const otherMenuId of otherOpenMenus) {
          const otherElement = subMenuRefs.current[otherMenuId];
          if (otherElement) await slideToggle(otherElement);
        }
        await slideToggle(subMenuElement);
        setOpenSubMenus(new Set([tabId]));
        setOpenSubMenusLevel3(new Set());
      } else {
        await slideToggle(subMenuElement);
        setOpenSubMenus(new Set());
        setOpenSubMenusLevel3(new Set());
      }
    },
    [
      openSubMenus,
      closeAllMenus,
      onTabChange,
      subMenuRefs,
      setOpenSubMenus,
      setOpenSubMenusLevel3,
    ]
  );

  const handleSubMenuClick = useCallback(
    (parentId: string, subMenuId: string) => {
      onTabChange(`${parentId}-${subMenuId}`);
    },
    [onTabChange]
  );

  /**
   * Maneja clics en nivel 2 (2 partes: PARENT-LEVEL2)
   * Navega siempre; useMenuEffects sincroniza apertura/cierre de menús según activeTab
   */
  const handleLevel2MenuClick = useCallback(
    (parentId: string, subMenuId: string, hasLevel3Menus: boolean) => {
      const subMenuKey = `${parentId}-${subMenuId}`;
      // Navegar siempre al hacer clic
      onTabChange(subMenuKey);
    },
    [onTabChange]
  );

  /**
   * Maneja clics en nivel 3 (3 partes: PARENT-LEVEL2-LEVEL3)
   * Solo navega; useMenuEffects sincroniza apertura/cierre de menús según activeTab
   */
  const handleSubMenuLevel3Click = useCallback(
    (
      parentId: string,
      level2Id: string,
      level3Id: string,
      hasSubMenus: boolean
    ) => {
      const fullTabId = `${parentId}-${level2Id}-${level3Id}`;
      onTabChange(fullTabId);
    },
    [onTabChange, openSubMenusLevel3]
  );

  /**
   * Maneja clics en nivel 4 (4 partes: PARENT-LEVEL2-LEVEL3-LEVEL4) con submenús
   * Solo navega; useMenuEffects sincroniza apertura/cierre de menús según activeTab
   */
  const handleSubMenuLevel4ClickWithSubMenus = useCallback(
    (
      parentId: string,
      level2Id: string,
      level3Id: string,
      level4Id: string,
      hasLevel5Menus: boolean
    ) => {
      const level4MenuKey = `${parentId}-${level2Id}-${level3Id}-${level4Id}`;
      onTabChange(level4MenuKey);
    },
    [onTabChange]
  );

  const handleSubMenuLevel4Click = useCallback(
    (
      parentId: string,
      level2Id: string,
      level3Id: string,
      level4Id: string
    ) => {
      const fullKey = `${parentId}-${level2Id}-${level3Id}-${level4Id}`;
      onTabChange(fullKey);
    },
    [onTabChange]
  );

  return {
    closeAllMenus,
    handleMenuClick,
    handleSubMenuClick,
    handleLevel2MenuClick,
    handleSubMenuLevel3Click,
    handleSubMenuLevel4ClickWithSubMenus,
    handleSubMenuLevel4Click,
  };
}
