import { useEffect, useCallback } from 'react';
import { slideToggle } from '../../../../utils/sidebarAnimations';
import type { MainTab } from '../../types';

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

  // Cuando se contrae, eliminar todos los niveles 4+
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

  // Sincronizar apertura/cierre de menús cuando cambia activeTab
  useEffect(() => {
    if (!activeTab || !isExpanded) return;

    const parts = activeTab.split('-');
    const mainTabId = parts[0];
    const tab = mainTabs.find((t) => t.id === mainTabId);
    prevMainTabRef.current = mainTabId;

    if (!tab || !tab.subMenus || tab.subMenus.length === 0 || parts.length <= 1) {
      return;
    }

    // ============================================================
    // NIVEL 1: Abrir menú principal si es necesario
    // ============================================================
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

    // ============================================================
    // CONSTRUIR LA RUTA DE MENÚS QUE DEBEN ESTAR ABIERTOS
    // ============================================================
    
    const menuPathToOpen: string[] = [];
    let currentMenu: any = tab;

    // Recorrer cada nivel y construir la ruta
    for (let level = 1; level < parts.length; level++) {
      const currentId = parts[level];
      
      if (!currentMenu || !currentMenu.subMenus || currentMenu.subMenus.length === 0) {
        break;
      }

      // Encontrar el submenu actual
      currentMenu = currentMenu.subMenus.find((sm: any) => sm.id === currentId);

      if (!currentMenu) {
        break;
      }

      // Construir la clave del menú
      const menuKey = parts.slice(0, level + 1).join('-');
      menuPathToOpen.push(menuKey);
      
      // Si encontramos el menú actual y tiene submenús, agrégate a la ruta
      // (esto permite que se abra incluso si no hay sub-elementos seleccionados)
      if (currentMenu.subMenus && currentMenu.subMenus.length > 0 && level === parts.length - 1) {
        // Ya está en menuPathToOpen, no hacer nada adicional
      }
    }

    // ============================================================
    // ACTUALIZAR ESTADO Y DOM
    // ============================================================

    // Identificar qué debe cerrarse y qué debe abrirse
    const menusToClose: string[] = [];
    const menusToOpen: string[] = [];

    // Menús que están abiertos pero no están en la ruta actual
    openSubMenusLevel3.forEach((key) => {
      if (!menuPathToOpen.includes(key)) {
        menusToClose.push(key);
      }
    });

    // Menús que están en la ruta pero no están abiertos
    menuPathToOpen.forEach((key) => {
      if (!openSubMenusLevel3.has(key)) {
        menusToOpen.push(key);
      }
    });

    // Si no hay cambios, no hacer nada
    if (menusToClose.length === 0 && menusToOpen.length === 0) {
      return;
    }

    // Actualizar estado INMEDIATAMENTE: los componentes usan openSubMenusLevel3
    // para display. Sin esto, nivel 4 (ESTADO, CREAR, ACTUALIZAR) no se renderiza.
    setOpenSubMenusLevel3((prev) => {
      const newSet = new Set(prev);
      menusToClose.forEach((key) => newSet.delete(key));
      menusToOpen.forEach((key) => newSet.add(key));
      return newSet;
    });

    // Animar cierre de menús (antes del state update ya estaban visibles)
    // Ejecutar después para no bloquear; los elementos pueden estar ocultos por React
    // pero slideToggle en display:none hace slideDown - solo animar los que aún existan
    if (menusToClose.length > 0 || menusToOpen.length > 0) {
      // Usar requestAnimationFrame para asegurarse de que los elementos estén disponibles
      requestAnimationFrame(() => {
        (async () => {
          for (const key of menusToClose) {
            const element = subMenuRefsLevel3.current[key];
            if (element) {
              const style = window.getComputedStyle(element);
              if (style.display !== 'none') {
                await slideToggle(element);
              }
            }
          }
          for (const key of menusToOpen) {
            const element = subMenuRefsLevel3.current[key];
            if (element) {
              const style = window.getComputedStyle(element);
              if (style.display === 'none' || style.height === '0px') {
                await slideToggle(element);
              }
            }
          }
        })();
      });
    }

  }, [
    activeTab,
    isExpanded,
    mainTabs,
    openSubMenus,
    subMenuRefs,
    setOpenSubMenus,
    setOpenSubMenusLevel3,
  ]);
}
