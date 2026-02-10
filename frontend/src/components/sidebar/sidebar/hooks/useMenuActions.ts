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

  const handleLevel2MenuClick = useCallback(
    async (parentId: string, subMenuId: string, hasLevel3Menus: boolean) => {
      const subMenuKey = `${parentId}-${subMenuId}`;
      if (!hasLevel3Menus) {
        onTabChange(subMenuKey);
        return;
      }
      const subMenuElement = subMenuRefsLevel3.current[subMenuKey];
      if (!subMenuElement) return;
      const isOpen = openSubMenusLevel3.has(subMenuKey);
      if (!isOpen) {
        const otherOpenMenus = Array.from(openSubMenusLevel3).filter(
          (key) =>
            key.split('-').length === 2 &&
            key.startsWith(`${parentId}-`) &&
            key !== subMenuKey
        );
        for (const otherMenuKey of otherOpenMenus) {
          const otherElement = subMenuRefsLevel3.current[otherMenuKey];
          if (otherElement) await slideToggle(otherElement);
        }
        await slideToggle(subMenuElement);
        const newOpenMenus = new Set(openSubMenusLevel3);
        otherOpenMenus.forEach((key) => newOpenMenus.delete(key));
        newOpenMenus.add(subMenuKey);
        setOpenSubMenusLevel3(newOpenMenus);
      } else {
        await slideToggle(subMenuElement);
        const newOpenMenus = new Set(openSubMenusLevel3);
        newOpenMenus.delete(subMenuKey);
        setOpenSubMenusLevel3(newOpenMenus);
      }
    },
    [
      openSubMenusLevel3,
      onTabChange,
      subMenuRefsLevel3,
      setOpenSubMenusLevel3,
    ]
  );

  const handleSubMenuLevel3Click = useCallback(
    async (
      parentId: string,
      level2Id: string,
      level3Id: string,
      hasSubMenus: boolean
    ) => {
      const fullTabId = `${parentId}-${level2Id}-${level3Id}`;
      if (!hasSubMenus) {
        onTabChange(fullTabId);
        return;
      }
      const subMenuKey = `${parentId}-${level2Id}-${level3Id}`;
      const subMenuElement = subMenuRefsLevel3.current[subMenuKey];
      if (!subMenuElement) {
        onTabChange(fullTabId);
        return;
      }
      const isOpen = openSubMenusLevel3.has(subMenuKey);
      const level2Prefix = `${parentId}-${level2Id}`;
      if (!isOpen) {
        const otherOpenMenus = Array.from(openSubMenusLevel3).filter(
          (key) =>
            key !== level2Prefix &&
            key.startsWith(`${level2Prefix}-`) &&
            key !== subMenuKey
        );
        for (const otherMenuKey of otherOpenMenus) {
          const otherElement = subMenuRefsLevel3.current[otherMenuKey];
          if (otherElement) await slideToggle(otherElement);
        }
        setOpenSubMenusLevel3((prev) => {
          const newSet = new Set(prev);
          otherOpenMenus.forEach((key) => newSet.delete(key));
          newSet.add(subMenuKey);
          return newSet;
        });
      } else {
        await slideToggle(subMenuElement);
        setOpenSubMenusLevel3((prev) => {
          const newSet = new Set(prev);
          newSet.delete(subMenuKey);
          return newSet;
        });
      }
    },
    [
      openSubMenusLevel3,
      onTabChange,
      subMenuRefsLevel3,
      setOpenSubMenusLevel3,
    ]
  );

  const handleSubMenuLevel4ClickWithSubMenus = useCallback(
    async (
      parentId: string,
      level2Id: string,
      level3Id: string,
      level4Id: string,
      hasLevel5Menus: boolean
    ) => {
      const level4MenuKey = `${parentId}-${level2Id}-${level3Id}-${level4Id}`;
      if (!hasLevel5Menus) {
        onTabChange(level4MenuKey);
        return;
      }
      const subMenuElement = subMenuRefsLevel3.current[level4MenuKey];
      if (!subMenuElement) {
        onTabChange(level4MenuKey);
        return;
      }
      const isOpen = openSubMenusLevel3.has(level4MenuKey);
      const level3Prefix = `${parentId}-${level2Id}-${level3Id}`;
      if (!isOpen) {
        const otherOpenMenus = Array.from(openSubMenusLevel3).filter(
          (key) =>
            key.startsWith(`${level3Prefix}-`) && key !== level4MenuKey
        );
        for (const otherMenuKey of otherOpenMenus) {
          const otherElement = subMenuRefsLevel3.current[otherMenuKey];
          if (otherElement) await slideToggle(otherElement);
        }
        setOpenSubMenusLevel3((prev) => {
          const newSet = new Set(prev);
          otherOpenMenus.forEach((key) => newSet.delete(key));
          newSet.add(level4MenuKey);
          return newSet;
        });
        await slideToggle(subMenuElement);
      } else {
        await slideToggle(subMenuElement);
        setOpenSubMenusLevel3((prev) => {
          const newSet = new Set(prev);
          newSet.delete(level4MenuKey);
          return newSet;
        });
      }
    },
    [
      openSubMenusLevel3,
      onTabChange,
      subMenuRefsLevel3,
      setOpenSubMenusLevel3,
    ]
  );

  const handleSubMenuLevel4Click = useCallback(
    (
      parentId: string,
      level2Id: string,
      level3Id: string,
      level4Id: string
    ) => {
      onTabChange(`${parentId}-${level2Id}-${level3Id}-${level4Id}`);
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
