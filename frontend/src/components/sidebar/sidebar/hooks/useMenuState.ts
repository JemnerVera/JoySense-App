import { useState, useRef } from 'react';

export function useMenuState() {
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [openSubMenusLevel3, setOpenSubMenusLevel3] = useState<Set<string>>(new Set());
  const subMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const subMenuRefsLevel3 = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const prevMainTabRef = useRef<string | null>(null);

  return {
    openSubMenus,
    setOpenSubMenus,
    openSubMenusLevel3,
    setOpenSubMenusLevel3,
    subMenuRefs,
    subMenuRefsLevel3,
    prevMainTabRef,
  };
}
