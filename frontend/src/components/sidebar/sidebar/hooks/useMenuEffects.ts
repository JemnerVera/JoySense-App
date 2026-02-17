import { useEffect, useCallback, useRef } from 'react';
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

  // Rastrear el activeTab anterior para detectar cambios reales
  const prevActiveTabRef = useRef<string>('');
  const lastStateUpdateRef = useRef<string>('');

  // 🔍 FIX: Mantener el estado de openSubMenusLevel3 incluso cuando colapsa
  // El condicional de renderizado en MenuItemLevel4 se encarga de mostrar/ocultar
  // No eliminar nada del estado para que cuando se expanda, todo se muestre correctamente
  // useEffect(() => {
  //   if (!isExpanded) {
  //     // No hacer nada - mantener el estado intacto
  //   }
  // }, [isExpanded]);

  // Sincronizar apertura/cierre de menús cuando cambia activeTab
  useEffect(() => {
    if (!activeTab || !isExpanded) return;

    // ✅ IMPORTANTE: Solo ejecutar si activeTab REALMENTE cambió
    if (prevActiveTabRef.current === activeTab) {
      return;
    }
    prevActiveTabRef.current = activeTab;

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

    // ✅ Construir el nuevo estado como string para comparación
    const newOpenSubMenusLevel3 = new Set(openSubMenusLevel3);
    menusToClose.forEach((key) => newOpenSubMenusLevel3.delete(key));
    menusToOpen.forEach((key) => newOpenSubMenusLevel3.add(key));
    
    const newStateStr = Array.from(newOpenSubMenusLevel3).sort().join('|');
    
    // ✅ Verificar si realmente cambió antes de actualizar estado
    if (newStateStr === lastStateUpdateRef.current) {
      return;
    }

    lastStateUpdateRef.current = newStateStr;

    // Actualizar estado INMEDIATAMENTE: los componentes usan openSubMenusLevel3
    // para display. Sin esto, nivel 4 (ESTADO, CREAR, ACTUALIZAR) no se renderiza.
    setOpenSubMenusLevel3(newOpenSubMenusLevel3);

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
    openSubMenusLevel3,
    subMenuRefs,
    setOpenSubMenus,
    setOpenSubMenusLevel3,
  ]);
}
