import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSidebarLayoutProps {
  showWelcome: boolean;
  activeTab?: string;
}

// Niveles de sidebar: aux4 (z-40), aux3 (z-30), aux2 (z-20), aux1 (z-10), main (z-10)
type SidebarLevel = 'main' | 'aux1' | 'aux2' | 'aux3' | 'aux4';

export const useSidebarLayout = ({ showWelcome, activeTab }: UseSidebarLayoutProps) => {
  // Estados individuales para cada nivel de sidebar
  const [mainSidebarExpanded, setMainSidebarExpanded] = useState(showWelcome);
  const [aux1Expanded, setAux1Expanded] = useState(false);
  const [aux2Expanded, setAux2Expanded] = useState(false);
  const [aux3Expanded, setAux3Expanded] = useState(false);
  const [aux4Expanded, setAux4Expanded] = useState(false);
  
  // Mantener compatibilidad con código existente
  const auxiliarySidebarExpanded = aux1Expanded || aux2Expanded || aux3Expanded || aux4Expanded;
  
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredLevelRef = useRef<SidebarLevel | null>(null);
  // Rastrear qué niveles están siendo hovered actualmente
  const hoveredLevelsRef = useRef<Set<SidebarLevel>>(new Set());
  // Rastrear si el cursor viene desde la ventana principal (para expansión en cascada)
  const isComingFromContentRef = useRef<boolean>(false);
  // Rastrear si hay algún sidebar hovered para evitar colapsar cuando se cambia de tab desde el sidebar
  const hasSidebarHoveredRef = useRef<boolean>(false);

  // Función para determinar si hay sidebar auxiliar
  const hasAuxiliarySidebar = useCallback((tab?: string) => {
    if (!tab) return false;
    return tab === 'geografia' || tab.startsWith('geografia-') ||
           tab === 'parametros' || tab.startsWith('parametros-') ||
           tab === 'tabla' || tab.startsWith('tabla-') ||
           tab === 'notificaciones' || tab.startsWith('notificaciones-') ||
           tab === 'parameters' || tab.startsWith('parameters-') || 
           tab === 'reportes' || tab.startsWith('reportes-') ||
           tab === 'permisos' || tab.startsWith('permisos-') ||
           tab === 'alertas' || tab.startsWith('alertas-') ||
           tab === 'configuracion' || tab.startsWith('configuracion-') ||
           tab === 'agrupacion' || tab.startsWith('agrupacion-') ||
           tab === 'ajustes' || tab.startsWith('ajustes-');
  }, []);

  // Función para limpiar timeout
  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Efecto para manejar el estado inicial
  useEffect(() => {
    if (showWelcome) {
      setMainSidebarExpanded(true);
      setAux1Expanded(true);
      setAux2Expanded(true);
      setAux3Expanded(true);
      setAux4Expanded(true);
    }
  }, [showWelcome]);

  // Efecto para colapsar sidebars cuando el cursor entra a la ventana principal (después de click en pestaña)
  // EVENTO 1: Cuando se hace click en una pestaña, los sidebars NO se colapsan automáticamente.
  // Solo se colapsan cuando el cursor sale a la ventana principal.
  // Esta lógica está manejada por handleContentMouseEnter

  // Función para colapsar todos los sidebars en cascada inversa
  const collapseAllSidebars = useCallback(() => {
    // Log removido para reducir verbosidad
    
    // SOLUCIÓN ROBUSTA: Prevenir colapso si estamos en HISTORIAL y los sidebars están expandidos
    // Esto previene que cualquier código colapse los sidebars cuando estamos en HISTORIAL
    const isHistorial = activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial');
    if (isHistorial && (aux1Expanded || aux2Expanded)) {
      // Log removido para reducir verbosidad
      // NO colapsar los sidebars si estamos en HISTORIAL y están expandidos
      return;
    }
    
    // Limpiar todos los niveles hovered
    hoveredLevelsRef.current.clear();
    hoveredLevelRef.current = null;
    hasSidebarHoveredRef.current = false;
    isComingFromContentRef.current = false;
    clearCloseTimeout();
    
    // Colapso en cascada inversa: main -> aux1 -> aux2 -> aux3 -> aux4
    setMainSidebarExpanded(false);
    setTimeout(() => {
      // Verificar nuevamente antes de colapsar aux1
      const isHistorialNow = activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial');
      if (!isHistorialNow || !aux1Expanded) {
        setAux1Expanded(false);
      }
    }, 50);
    setTimeout(() => {
      // Verificar nuevamente antes de colapsar aux2
      const isHistorialNow = activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial');
      if (!isHistorialNow || !aux2Expanded) {
        setAux2Expanded(false);
      }
    }, 100);
    setTimeout(() => {
      setAux3Expanded(false);
    }, 150);
    setTimeout(() => {
      setAux4Expanded(false);
    }, 200);
  }, [clearCloseTimeout, activeTab, aux1Expanded, aux2Expanded]);

  // Función para programar cierre en cascada inversa
  // EVENTO 3: Colapso en cascada inversa cuando se sale de los sidebars
  const scheduleClose = useCallback((fromLevel: SidebarLevel) => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      const levelToRemove = fromLevel; // Guardar el nivel en una constante para usarlo en el timeout
      // Remover el nivel del que se salió Y TODOS los niveles más internos del set de niveles hovered
      // Porque si salimos de aux2, también salimos de aux1 y main
      // Orden de más externo a más interno: aux4 > aux3 > aux2 > aux1 > main
      const levelsToRemove: SidebarLevel[] = [levelToRemove];
      if (levelToRemove === 'aux4') {
        // Si salimos de aux4, también salimos de todos los demás
        levelsToRemove.push('aux3', 'aux2', 'aux1', 'main');
      } else if (levelToRemove === 'aux3') {
        // Si salimos de aux3, también salimos de aux2, aux1, main
        levelsToRemove.push('aux2', 'aux1', 'main');
      } else if (levelToRemove === 'aux2') {
        // Si salimos de aux2, también salimos de aux1, main
        levelsToRemove.push('aux1', 'main');
      } else if (levelToRemove === 'aux1') {
        // Si salimos de aux1, también salimos de main
        levelsToRemove.push('main');
      }
      // Remover todos los niveles internos
      levelsToRemove.forEach(level => hoveredLevelsRef.current.delete(level));
      const remainingHoveredLevels = Array.from(hoveredLevelsRef.current);
      
      // Si no hay ningún nivel siendo hovered, verificar si los sidebars están expandidos
      // Si están expandidos, no colapsar (podrían estar expandidos por click en pestaña, como HISTORIAL)
      const anySidebarExpanded = mainSidebarExpanded || aux1Expanded || aux2Expanded || aux3Expanded || aux4Expanded;
      if (remainingHoveredLevels.length === 0) {
        // Si no hay niveles hovered pero los sidebars están expandidos, verificar si estamos en un tab que necesita mantener los sidebars expandidos
        const isHistorial = activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial');
        if (isHistorial && (aux1Expanded || aux2Expanded)) {
          // Para HISTORIAL, mantener los sidebars expandidos incluso si no hay niveles hovered
          // porque se expandieron por click en pestaña
          // Log removido para reducir verbosidad
          return;
        }
        // Si los sidebars no están expandidos, colapsar todo
        if (!anySidebarExpanded) {
          collapseAllSidebars();
          return;
        }
      }
      
      // SOLUCIÓN ROBUSTA: Esperar un delay adicional para verificar si el cursor realmente está en los sidebars
      // o si salió hacia el contenido principal (y el evento onMouseEnter del contenido no se disparó)
      // Si después del delay no hay niveles hovered, colapsar TODO inmediatamente
      setTimeout(() => {
        // SOLUCIÓN ROBUSTA: Verificar si estamos en HISTORIAL una vez al inicio del timeout
        const isHistorial = activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial');
        
        // Verificar si el cursor realmente está en algún sidebar verificando los estados de expansión
        // Si todos los sidebars están colapsados, significa que el cursor salió completamente
        const anySidebarExpandedNow = mainSidebarExpanded || aux1Expanded || aux2Expanded || aux3Expanded || aux4Expanded;
        
        // Verificar si estamos en un tab que necesita mantener los sidebars expandidos
        if (isHistorial && (aux1Expanded || aux2Expanded)) {
          // Para HISTORIAL, mantener los sidebars expandidos incluso si los refs están vacíos
          // Log removido para reducir verbosidad
          return;
        }
        
        if (hoveredLevelsRef.current.size === 0) {
          // Si no hay niveles hovered y los sidebars no están expandidos, colapsar todo
          if (!anySidebarExpandedNow) {
            collapseAllSidebars();
            return;
          }
          // Si los sidebars están expandidos pero no hay niveles hovered, mantenerlos expandidos
          // (podrían estar expandidos por click en pestaña)
          return;
        }
        
        // Si hay niveles hovered pero NO hay ningún sidebar expandido, significa que el cursor salió completamente
        // Esto es un fallback para cuando los niveles hovered no se limpian correctamente
        if (!anySidebarExpanded && hoveredLevelsRef.current.size > 0) {
          hoveredLevelsRef.current.clear();
          hoveredLevelRef.current = null;
          collapseAllSidebars();
          return;
        }
        
        // VERIFICACIÓN ADICIONAL: Si hay niveles hovered pero el nivel más externo que está siendo hovered
        // no tiene su sidebar expandido, significa que los niveles hovered son "fantasma" (obsoletos)
        // En este caso, limpiar todo y colapsar
        const currentHoveredLevels = hoveredLevelsRef.current;
        let maxHoveredLevel: SidebarLevel | null = null;
        if (currentHoveredLevels.has('aux4')) maxHoveredLevel = 'aux4';
        else if (currentHoveredLevels.has('aux3')) maxHoveredLevel = 'aux3';
        else if (currentHoveredLevels.has('aux2')) maxHoveredLevel = 'aux2';
        else if (currentHoveredLevels.has('aux1')) maxHoveredLevel = 'aux1';
        else if (currentHoveredLevels.has('main')) maxHoveredLevel = 'main';
        
        // Verificar si el nivel más externo hovered tiene su sidebar expandido
        const maxLevelExpanded = maxHoveredLevel === 'aux4' ? aux4Expanded :
                                 maxHoveredLevel === 'aux3' ? aux3Expanded :
                                 maxHoveredLevel === 'aux2' ? aux2Expanded :
                                 maxHoveredLevel === 'aux1' ? aux1Expanded :
                                 maxHoveredLevel === 'main' ? mainSidebarExpanded : false;
        
        // SOLUCIÓN ROBUSTA: Verificar si estamos en HISTORIAL antes de colapsar (reutilizar isHistorial declarado arriba)
        if (isHistorial && (aux1Expanded || aux2Expanded)) {
          // Si estamos en HISTORIAL y los sidebars están expandidos, NO colapsar
          // Log removido para reducir verbosidad
          return;
        }
        
        if (maxHoveredLevel && !maxLevelExpanded) {
          hoveredLevelsRef.current.clear();
          hoveredLevelRef.current = null;
          collapseAllSidebars();
          return;
        }
        
        // Si todavía hay niveles hovered Y hay sidebars expandidos, significa que el cursor realmente está moviéndose entre sidebars
        // En este caso, mantener los sidebars más externos expandidos y colapsar solo los internos que no están hovered
        
        // maxHoveredLevel ya fue calculado arriba, reutilizarlo
        if (!maxHoveredLevel) {
          // Verificar nuevamente antes de colapsar todo
          if (isHistorial && (aux1Expanded || aux2Expanded)) {
            return;
          }
          collapseAllSidebars();
          return;
        }
      
        // Colapsar en cascada inversa solo los niveles más internos que el nivel más externo hovered
        // y que no están siendo hovered. Los niveles más externos siempre se mantienen expandidos.
        // Colapso en cascada inversa: main -> aux1 -> aux2 -> aux3 -> aux4
        // NOTA: isHistorial ya está definido arriba
        if (maxHoveredLevel === 'aux4') {
        // Si aux4 está hovered, colapsar solo los que no están hovered (en cascada inversa)
        if (!currentHoveredLevels.has('main')) {
          setMainSidebarExpanded(false);
          setTimeout(() => {
            if (!currentHoveredLevels.has('aux1')) {
              // NO colapsar aux1 si estamos en HISTORIAL
              if (!isHistorial || !aux1Expanded) {
                setAux1Expanded(false);
              }
            }
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) {
                // NO colapsar aux2 si estamos en HISTORIAL
                if (!isHistorial || !aux2Expanded) {
                  setAux2Expanded(false);
                }
              }
              setTimeout(() => {
                if (!currentHoveredLevels.has('aux3')) setAux3Expanded(false);
              }, 50);
            }, 50);
          }, 50);
        } else {
          if (!currentHoveredLevels.has('aux1')) {
            // NO colapsar aux1 si estamos en HISTORIAL
            if (!isHistorial || !aux1Expanded) {
              setAux1Expanded(false);
            }
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) {
                // NO colapsar aux2 si estamos en HISTORIAL
                if (!isHistorial || !aux2Expanded) {
                  setAux2Expanded(false);
                }
              }
              setTimeout(() => {
                if (!currentHoveredLevels.has('aux3')) setAux3Expanded(false);
              }, 50);
            }, 50);
          } else if (!currentHoveredLevels.has('aux2')) {
            // NO colapsar aux2 si estamos en HISTORIAL
            if (!isHistorial || !aux2Expanded) {
              setAux2Expanded(false);
            }
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux3')) setAux3Expanded(false);
            }, 50);
          } else if (!currentHoveredLevels.has('aux3')) {
            setAux3Expanded(false);
          }
        }
      } else if (maxHoveredLevel === 'aux3') {
        // Si aux3 es el más externo hovered, mantener aux4 expandido y colapsar los internos en cascada inversa
        setAux4Expanded(true);
        if (!currentHoveredLevels.has('main')) {
          setMainSidebarExpanded(false);
          setTimeout(() => {
            if (!currentHoveredLevels.has('aux1')) {
              // NO colapsar aux1 si estamos en HISTORIAL
              if (!isHistorial || !aux1Expanded) {
                setAux1Expanded(false);
              }
            }
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) {
                // NO colapsar aux2 si estamos en HISTORIAL
                if (!isHistorial || !aux2Expanded) {
                  setAux2Expanded(false);
                }
              }
            }, 50);
          }, 50);
        } else {
          if (!currentHoveredLevels.has('aux1')) {
            // NO colapsar aux1 si estamos en HISTORIAL
            if (!isHistorial || !aux1Expanded) {
              setAux1Expanded(false);
            }
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) {
                // NO colapsar aux2 si estamos en HISTORIAL
                if (!isHistorial || !aux2Expanded) {
                  setAux2Expanded(false);
                }
              }
            }, 50);
          } else if (!currentHoveredLevels.has('aux2')) {
            // NO colapsar aux2 si estamos en HISTORIAL
            if (!isHistorial || !aux2Expanded) {
              setAux2Expanded(false);
            }
          }
        }
      } else if (maxHoveredLevel === 'aux2') {
        // Si aux2 es el más externo hovered, mantener aux3 y aux4 expandidos
        setAux3Expanded(true);
        setAux4Expanded(true);
        // IMPORTANTE: Para HISTORIAL, siempre mantener aux1 expandido cuando aux2 está hovered
        // porque aux1 contiene DASHBOARD e HISTORIAL, y aux2 contiene ALERTAS y MENSAJES
        // Similar a cómo funciona DASHBOARD con aux3 (aux1 contiene DASHBOARD e HISTORIAL, aux3 contiene MAPEO, STATUS, etc.)
        // NO colapsar aux1 cuando aux2 está hovered si estamos en reportes-historial
        if (!currentHoveredLevels.has('main')) {
          setMainSidebarExpanded(false);
          // Verificar si estamos en reportes-historial para no colapsar aux1
          if (activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial')) {
            // Mantener aux1 expandido para HISTORIAL
            setAux1Expanded(true);
          } else {
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux1')) setAux1Expanded(false);
            }, 50);
          }
        } else if (!currentHoveredLevels.has('aux1')) {
          // Verificar si estamos en reportes-historial para no colapsar aux1
          if (activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial')) {
            // Mantener aux1 expandido para HISTORIAL
            setAux1Expanded(true);
          } else {
            setAux1Expanded(false);
          }
        }
      } else if (maxHoveredLevel === 'aux1') {
        // Si aux1 es el más externo hovered, mantener aux2, aux3, aux4 expandidos
        setAux2Expanded(true);
        setAux3Expanded(true);
        setAux4Expanded(true);
        if (!currentHoveredLevels.has('main')) {
          setMainSidebarExpanded(false);
        }
      } else if (maxHoveredLevel === 'main') {
        // Si main es el más externo hovered, mantener todo expandido
        setAux1Expanded(true);
        setAux2Expanded(true);
        setAux3Expanded(true);
        setAux4Expanded(true);
      }
      
      // Actualizar hoveredLevelRef al nivel más externo hovered
      hoveredLevelRef.current = maxHoveredLevel;
      }, 150); // Delay de 150ms para verificar si el cursor realmente está en los sidebars
    }, 200); // Reducido a 200ms para respuesta más rápida
  }, [clearCloseTimeout, collapseAllSidebars, mainSidebarExpanded, aux1Expanded, aux2Expanded, aux3Expanded, aux4Expanded, activeTab]);
  
  // Función para expandir en cascada (desde el nivel más externo hacia el más interno)
  // EVENTO 2: Expansión en cascada cuando el cursor viene desde la ventana principal hacia los sidebars
  const expandCascade = useCallback((toLevel: SidebarLevel, fromContent: boolean = false) => {
    // Log removido para reducir verbosidad
    clearCloseTimeout();
    
    // Si viene desde el contenido, activar expansión en cascada
    if (fromContent) {
      isComingFromContentRef.current = true;
    }
    
    // IMPORTANTE: Solo actualizar los refs aquí si fromContent es true
    // Si fromContent es false (click en pestaña), los refs se actualizarán en el bloque else
    // para incluir todos los niveles intermedios
    if (fromContent || isComingFromContentRef.current) {
      // Agregar el nivel al set de niveles hovered
      hoveredLevelsRef.current.add(toLevel);
      hoveredLevelRef.current = toLevel;
      // Marcar que hay un sidebar hovered
      hasSidebarHoveredRef.current = true;
    }
    
    // Si viene desde el contenido, expandir en cascada desde el nivel más externo hacia el especificado
    if (fromContent || isComingFromContentRef.current) {
      // Expandir desde aux4 hacia el nivel especificado
      if (toLevel === 'aux4') {
        setAux4Expanded(true);
      } else if (toLevel === 'aux3') {
        setAux4Expanded(true);
        setTimeout(() => setAux3Expanded(true), 50);
      } else if (toLevel === 'aux2') {
        setAux4Expanded(true);
        setTimeout(() => {
          setAux3Expanded(true);
          setTimeout(() => setAux2Expanded(true), 50);
        }, 50);
      } else if (toLevel === 'aux1') {
        setAux4Expanded(true);
        setTimeout(() => {
          setAux3Expanded(true);
          setTimeout(() => {
            setAux2Expanded(true);
            setTimeout(() => setAux1Expanded(true), 50);
          }, 50);
        }, 50);
      } else if (toLevel === 'main') {
        setAux4Expanded(true);
        setTimeout(() => {
          setAux3Expanded(true);
          setTimeout(() => {
            setAux2Expanded(true);
            setTimeout(() => {
              setAux1Expanded(true);
              setTimeout(() => setMainSidebarExpanded(true), 50);
            }, 50);
          }, 50);
        }, 50);
      }
    } else {
      // Si NO viene desde el contenido, expandir directamente sin cascada (click en pestaña)
      // IMPORTANTE: También actualizar los refs cuando se expande por click en pestaña
      // para que handleContentMouseEnter no colapse los sidebars inmediatamente
      if (toLevel === 'aux4') {
        setAux4Expanded(true);
        // Agregar el nivel al set de niveles hovered
        hoveredLevelsRef.current.add(toLevel);
        hoveredLevelRef.current = toLevel;
        hasSidebarHoveredRef.current = true;
      } else if (toLevel === 'aux3') {
        setAux4Expanded(true);
        setAux3Expanded(true);
        // Agregar ambos niveles al set
        hoveredLevelsRef.current.add('aux4');
        hoveredLevelsRef.current.add(toLevel);
        hoveredLevelRef.current = toLevel;
        hasSidebarHoveredRef.current = true;
      } else if (toLevel === 'aux2') {
        setAux4Expanded(true);
        setAux3Expanded(true);
        setAux2Expanded(true);
        // Agregar todos los niveles al set
        hoveredLevelsRef.current.add('aux4');
        hoveredLevelsRef.current.add('aux3');
        hoveredLevelsRef.current.add(toLevel);
        hoveredLevelRef.current = toLevel;
        hasSidebarHoveredRef.current = true;
      } else if (toLevel === 'aux1') {
        setAux4Expanded(true);
        setAux3Expanded(true);
        setAux2Expanded(true);
        setAux1Expanded(true);
        // Agregar todos los niveles al set
        hoveredLevelsRef.current.add('aux4');
        hoveredLevelsRef.current.add('aux3');
        hoveredLevelsRef.current.add('aux2');
        hoveredLevelsRef.current.add(toLevel);
        hoveredLevelRef.current = toLevel;
        hasSidebarHoveredRef.current = true;
      } else if (toLevel === 'main') {
        setAux4Expanded(true);
        setAux3Expanded(true);
        setAux2Expanded(true);
        setAux1Expanded(true);
        setMainSidebarExpanded(true);
        // Agregar todos los niveles al set
        hoveredLevelsRef.current.add('aux4');
        hoveredLevelsRef.current.add('aux3');
        hoveredLevelsRef.current.add('aux2');
        hoveredLevelsRef.current.add('aux1');
        hoveredLevelsRef.current.add(toLevel);
        hoveredLevelRef.current = toLevel;
        hasSidebarHoveredRef.current = true;
      }
    }
  }, [clearCloseTimeout]);

  // Handlers de hover para cada nivel de sidebar
  const handleMainSidebarMouseEnter = useCallback(() => {
    // Si viene desde contenido, expandir en cascada; si no, expandir directamente (click en pestaña)
    expandCascade('main', isComingFromContentRef.current);
    // Una vez que el cursor entra a un sidebar, ya no viene desde contenido
    isComingFromContentRef.current = false;
  }, [expandCascade]);

  const handleMainSidebarMouseLeave = useCallback(() => {
    if (activeTab) {
      scheduleClose('main');
    }
  }, [scheduleClose, activeTab]);

  const handleAux1MouseEnter = useCallback(() => {
    // Si viene desde contenido, expandir en cascada; si no, expandir directamente (click en pestaña)
    expandCascade('aux1', isComingFromContentRef.current);
    // Una vez que el cursor entra a un sidebar, ya no viene desde contenido
    isComingFromContentRef.current = false;
  }, [expandCascade, activeTab]);

  const handleAux1MouseLeave = useCallback(() => {
    // Log removido para reducir verbosidad
    // Remover del set de niveles hovered
    hoveredLevelsRef.current.delete('aux1');
    // Si no hay más niveles hovered, marcar que no hay sidebars hovered
    if (hoveredLevelsRef.current.size === 0) {
      hasSidebarHoveredRef.current = false;
    }
    if (activeTab) {
      scheduleClose('aux1');
    }
  }, [scheduleClose, activeTab]);

  const handleAux2MouseEnter = useCallback(() => {
    // Si viene desde contenido, expandir en cascada; si no, expandir directamente (click en pestaña)
    expandCascade('aux2', isComingFromContentRef.current);
    // Una vez que el cursor entra a un sidebar, ya no viene desde contenido
    isComingFromContentRef.current = false;
  }, [expandCascade, activeTab]);

  const handleAux2MouseLeave = useCallback(() => {
    // SOLUCIÓN ROBUSTA: NO programar cierre si estamos en HISTORIAL y los sidebars están expandidos
    const isHistorial = activeTab && (activeTab.startsWith('reportes-historial') || activeTab === 'reportes-historial');
    if (isHistorial && (aux1Expanded || aux2Expanded)) {
      // Log removido para reducir verbosidad
      // NO remover de los niveles hovered ni programar cierre si estamos en HISTORIAL
      return;
    }
    
    // Remover del set de niveles hovered
    hoveredLevelsRef.current.delete('aux2');
    // Si no hay más niveles hovered, marcar que no hay sidebars hovered
    if (hoveredLevelsRef.current.size === 0) {
      hasSidebarHoveredRef.current = false;
    }
    if (activeTab) {
      scheduleClose('aux2');
    }
  }, [scheduleClose, activeTab, aux1Expanded, aux2Expanded]);

  const handleAux3MouseEnter = useCallback(() => {
    // Si viene desde contenido, expandir en cascada; si no, expandir directamente (click en pestaña)
    expandCascade('aux3', isComingFromContentRef.current);
    // Una vez que el cursor entra a un sidebar, ya no viene desde contenido
    isComingFromContentRef.current = false;
  }, [expandCascade]);

  const handleAux3MouseLeave = useCallback(() => {
    if (activeTab) {
      scheduleClose('aux3');
    }
  }, [scheduleClose, activeTab]);

  const handleAux4MouseEnter = useCallback(() => {
    // Si viene desde contenido, expandir en cascada; si no, expandir directamente (click en pestaña)
    expandCascade('aux4', isComingFromContentRef.current);
    // Una vez que el cursor entra a un sidebar, ya no viene desde contenido
    isComingFromContentRef.current = false;
  }, [expandCascade]);

  const handleAux4MouseLeave = useCallback(() => {
    if (activeTab) {
      scheduleClose('aux4');
    }
  }, [scheduleClose, activeTab]);

  // Handler genérico para compatibilidad (usa aux1)
  const handleAuxiliarySidebarMouseEnter = useCallback(() => {
    handleAux1MouseEnter();
  }, [handleAux1MouseEnter]);

  const handleAuxiliarySidebarMouseLeave = useCallback(() => {
    handleAux1MouseLeave();
  }, [handleAux1MouseLeave]);

  // EVENTO 1: Cuando el cursor entra a la ventana principal, colapsar TODOS los sidebars en cascada inversa
  const handleContentMouseEnter = useCallback(() => {
    // Log removido para reducir verbosidad
    if (activeTab) {
      // Si hay algún sidebar hovered, NO colapsar (el cursor aún está en los sidebars)
      // Esto previene que se colapsen cuando se cambia de tab desde el sidebar
      // También verificar si los sidebars están expandidos (lo cual indica que están siendo hovered)
      if (hasSidebarHoveredRef.current || hoveredLevelsRef.current.size > 0 || aux2Expanded || aux1Expanded) {
        // Log removido para reducir verbosidad
        return;
      }
      
      // Cancelar cualquier timeout de cierre programado
      clearCloseTimeout();
      // Limpiar todos los niveles hovered inmediatamente para evitar que scheduleClose mantenga algunos sidebars expandidos
      hoveredLevelsRef.current.clear();
      hoveredLevelRef.current = null;
      // Usar la función de colapso para mantener consistencia
      // Log removido para reducir verbosidad
      collapseAllSidebars();
      // Marcar que viene desde el contenido para activar expansión en cascada cuando vuelva a los sidebars
      setTimeout(() => {
        isComingFromContentRef.current = true;
      }, 250);
    }
  }, [clearCloseTimeout, activeTab, collapseAllSidebars, aux2Expanded, aux1Expanded]);

  // EVENTO 2: Cuando el cursor sale del contenido, activar expansión en cascada
  const handleContentMouseLeave = useCallback(() => {
    isComingFromContentRef.current = true;
  }, []);

  // Función para calcular el margen del contenido principal
  const getMainContentMargin = useCallback(() => {
    // No usar márgenes fijos, el flexbox se encargará del layout
    return '';
  }, []);

  // Función para obtener clases del contenedor principal
  const getMainSidebarClasses = useCallback(() => {
    return `fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
      mainSidebarExpanded ? 'w-64' : 'w-16'
    }`;
  }, [mainSidebarExpanded]);

  // Función para obtener clases del sidebar auxiliar
  // Nota: El ancho ahora lo controla cada sidebar mediante BaseAuxiliarySidebar (w-56 / w-14),
  // para evitar franjas vacías adicionales. El borde lo maneja BaseAuxiliarySidebar, no el contenedor.
  const getAuxiliarySidebarClasses = useCallback(() => {
    return 'transition-all duration-300 flex-shrink-0 h-full'
  }, []);

  return {
    // Estados
    mainSidebarExpanded,
    auxiliarySidebarExpanded, // Para compatibilidad
    aux1Expanded,
    aux2Expanded,
    aux3Expanded,
    aux4Expanded,
    hasAuxiliarySidebar, // Retornar la función, no el resultado
    
    // Handlers genéricos (para compatibilidad)
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    
    // Handlers específicos por nivel
    handleAux1MouseEnter,
    handleAux1MouseLeave,
    handleAux2MouseEnter,
    handleAux2MouseLeave,
    handleAux3MouseEnter,
    handleAux3MouseLeave,
    handleAux4MouseEnter,
    handleAux4MouseLeave,
    
    // Clases
    getMainContentMargin,
    getMainSidebarClasses,
    getAuxiliarySidebarClasses
  };
};
