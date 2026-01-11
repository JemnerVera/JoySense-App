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
    // Limpiar todos los niveles hovered
    hoveredLevelsRef.current.clear();
    hoveredLevelRef.current = null;
    isComingFromContentRef.current = false;
    clearCloseTimeout();
    
    // Colapso en cascada inversa: main -> aux1 -> aux2 -> aux3 -> aux4
    setMainSidebarExpanded(false);
    setTimeout(() => {
      setAux1Expanded(false);
    }, 50);
    setTimeout(() => {
      setAux2Expanded(false);
    }, 100);
    setTimeout(() => {
      setAux3Expanded(false);
    }, 150);
    setTimeout(() => {
      setAux4Expanded(false);
    }, 200);
  }, [clearCloseTimeout]);

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
      
      // Si no hay ningún nivel siendo hovered, significa que el cursor salió completamente de los sidebars
      // En este caso, colapsar todo en cascada inversa inmediatamente
      if (remainingHoveredLevels.length === 0) {
        collapseAllSidebars();
        return;
      }
      
      // SOLUCIÓN ROBUSTA: Esperar un delay adicional para verificar si el cursor realmente está en los sidebars
      // o si salió hacia el contenido principal (y el evento onMouseEnter del contenido no se disparó)
      // Si después del delay no hay niveles hovered, colapsar TODO inmediatamente
      setTimeout(() => {
        // Verificar si el cursor realmente está en algún sidebar verificando los estados de expansión
        // Si todos los sidebars están colapsados, significa que el cursor salió completamente
        const anySidebarExpanded = mainSidebarExpanded || aux1Expanded || aux2Expanded || aux3Expanded || aux4Expanded;
        
        if (hoveredLevelsRef.current.size === 0) {
          collapseAllSidebars();
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
          collapseAllSidebars();
          return;
        }
      
        // Colapsar en cascada inversa solo los niveles más internos que el nivel más externo hovered
        // y que no están siendo hovered. Los niveles más externos siempre se mantienen expandidos.
        // Colapso en cascada inversa: main -> aux1 -> aux2 -> aux3 -> aux4
        if (maxHoveredLevel === 'aux4') {
        // Si aux4 está hovered, colapsar solo los que no están hovered (en cascada inversa)
        if (!currentHoveredLevels.has('main')) {
          setMainSidebarExpanded(false);
          setTimeout(() => {
            if (!currentHoveredLevels.has('aux1')) setAux1Expanded(false);
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) setAux2Expanded(false);
              setTimeout(() => {
                if (!currentHoveredLevels.has('aux3')) setAux3Expanded(false);
              }, 50);
            }, 50);
          }, 50);
        } else {
          if (!currentHoveredLevels.has('aux1')) {
            setAux1Expanded(false);
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) setAux2Expanded(false);
              setTimeout(() => {
                if (!currentHoveredLevels.has('aux3')) setAux3Expanded(false);
              }, 50);
            }, 50);
          } else if (!currentHoveredLevels.has('aux2')) {
            setAux2Expanded(false);
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
            if (!currentHoveredLevels.has('aux1')) setAux1Expanded(false);
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) setAux2Expanded(false);
            }, 50);
          }, 50);
        } else {
          if (!currentHoveredLevels.has('aux1')) {
            setAux1Expanded(false);
            setTimeout(() => {
              if (!currentHoveredLevels.has('aux2')) setAux2Expanded(false);
            }, 50);
          } else if (!currentHoveredLevels.has('aux2')) {
            setAux2Expanded(false);
          }
        }
      } else if (maxHoveredLevel === 'aux2') {
        // Si aux2 es el más externo hovered, mantener aux3 y aux4 expandidos
        setAux3Expanded(true);
        setAux4Expanded(true);
        if (!currentHoveredLevels.has('main')) {
          setMainSidebarExpanded(false);
          setTimeout(() => {
            if (!currentHoveredLevels.has('aux1')) setAux1Expanded(false);
          }, 50);
        } else if (!currentHoveredLevels.has('aux1')) {
          setAux1Expanded(false);
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
  }, [clearCloseTimeout, collapseAllSidebars]);
  
  // Función para expandir en cascada (desde el nivel más externo hacia el más interno)
  // EVENTO 2: Expansión en cascada cuando el cursor viene desde la ventana principal hacia los sidebars
  const expandCascade = useCallback((toLevel: SidebarLevel, fromContent: boolean = false) => {
    clearCloseTimeout();
    
    // Si viene desde el contenido, activar expansión en cascada
    if (fromContent) {
      isComingFromContentRef.current = true;
    }
    
    // Agregar el nivel al set de niveles hovered
    hoveredLevelsRef.current.add(toLevel);
    hoveredLevelRef.current = toLevel;
    
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
      if (toLevel === 'aux4') {
        setAux4Expanded(true);
      } else if (toLevel === 'aux3') {
        setAux4Expanded(true);
        setAux3Expanded(true);
      } else if (toLevel === 'aux2') {
        setAux4Expanded(true);
        setAux3Expanded(true);
        setAux2Expanded(true);
      } else if (toLevel === 'aux1') {
        setAux4Expanded(true);
        setAux3Expanded(true);
        setAux2Expanded(true);
        setAux1Expanded(true);
      } else if (toLevel === 'main') {
        setAux4Expanded(true);
        setAux3Expanded(true);
        setAux2Expanded(true);
        setAux1Expanded(true);
        setMainSidebarExpanded(true);
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
  }, [expandCascade]);

  const handleAux1MouseLeave = useCallback(() => {
    if (activeTab) {
      scheduleClose('aux1');
    }
  }, [scheduleClose, activeTab]);

  const handleAux2MouseEnter = useCallback(() => {
    // Si viene desde contenido, expandir en cascada; si no, expandir directamente (click en pestaña)
    expandCascade('aux2', isComingFromContentRef.current);
    // Una vez que el cursor entra a un sidebar, ya no viene desde contenido
    isComingFromContentRef.current = false;
  }, [expandCascade]);

  const handleAux2MouseLeave = useCallback(() => {
    if (activeTab) {
      scheduleClose('aux2');
    }
  }, [scheduleClose, activeTab]);

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
    if (activeTab) {
      // Cancelar cualquier timeout de cierre programado
      clearCloseTimeout();
      // Limpiar todos los niveles hovered inmediatamente para evitar que scheduleClose mantenga algunos sidebars expandidos
      hoveredLevelsRef.current.clear();
      hoveredLevelRef.current = null;
      // Usar la función de colapso para mantener consistencia
      collapseAllSidebars();
      // Marcar que viene desde el contenido para activar expansión en cascada cuando vuelva a los sidebars
      setTimeout(() => {
        isComingFromContentRef.current = true;
      }, 250);
    }
  }, [clearCloseTimeout, activeTab, collapseAllSidebars]);

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
