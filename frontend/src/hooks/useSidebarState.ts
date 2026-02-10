import { useCallback, useRef, useEffect } from 'react'
import { useSidebar, SidebarLevel } from '../contexts/SidebarContext'

interface UseSidebarStateProps {
  showWelcome?: boolean
  activeTab?: string
}

/**
 * Hook que reemplaza useSidebarLayout con la nueva arquitectura centralizada
 * Proporciona la misma API para compatibilidad con código existente
 */
// Ref compartido para cancelar todos los timeouts de mouseLeave
const globalCloseTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null }

export function useSidebarState({ showWelcome = false, activeTab }: UseSidebarStateProps = {}) {
  const sidebar = useSidebar()
  const isComingFromContentRef = useRef(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialActivationRef = useRef(true) // Flag para detectar si es la activación inicial de pestañas
  // Rastrear el último sidebar que fue hovered para determinar la dirección del movimiento
  const lastHoveredSidebarRef = useRef<SidebarLevel | null>(null)
  
  // Helper function para obtener el último sidebar hovered sin problemas de inferencia de tipos
  const getLastHoveredSidebar = useCallback((): SidebarLevel | null => {
    return lastHoveredSidebarRef.current
  }, [])
  
  // Helper function para verificar si un sidebar es más interno que otro
  // Esto evita problemas de type narrowing de TypeScript
  const isSidebarMoreInternal = useCallback((sidebar: SidebarLevel | null, ...internalLevels: SidebarLevel[]): boolean => {
    if (sidebar === null) return false
    return internalLevels.includes(sidebar)
  }, [])
  
  // Efecto para expandir sidebar principal cuando se muestra welcome
  useEffect(() => {
    if (showWelcome) {
      // Solo expandir el sidebar principal (main) cuando se muestra la pantalla de bienvenida
      // Debe permanecer expandido hasta que el usuario haga hover sobre él
      const timer = setTimeout(() => {
        sidebar.openPanel('main', false)
        // Marcar que los sidebars están establecidos después de la activación inicial
        setTimeout(() => {
          isInitialActivationRef.current = false
        }, 500) // Dar tiempo para que se completen las animaciones
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [showWelcome, sidebar]) // Incluir sidebar en dependencias para asegurar que se expanda
  
  // Efecto para detectar cuando se activa una pestaña (cambio de activeTab)
  useEffect(() => {
    if (activeTab) {
      // Cuando cambia la pestaña activa, marcar como activación inicial
      isInitialActivationRef.current = true
      // Después de un delay, marcar que los sidebars están establecidos
      // Aumentar delay a 1500ms para asegurar que todas las secciones (incluyendo AGRUPACIÓN) tengan tiempo suficiente
      const timer = setTimeout(() => {
        isInitialActivationRef.current = false
      }, 1500) // Delay para permitir que se completen las animaciones de expansión
      return () => clearTimeout(timer)
    }
  }, [activeTab])
  
  // Limpiar timeout local y global
  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    // También cancelar el timeout global (de otros handlers)
    if (globalCloseTimeoutRef.current) {
      clearTimeout(globalCloseTimeoutRef.current)
      globalCloseTimeoutRef.current = null
    }
  }, [])
  
  // Handlers para main sidebar
  const handleMainSidebarMouseEnter = useCallback(() => {
    clearCloseTimeout()
    // SIEMPRE llamar a openPanel para asegurar que el hover se actualice correctamente
    // Esto es crítico para detectar hover en sidebars colapsados cuando el mouse se mueve rápido
    sidebar.openPanel('main', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleMainSidebarMouseLeave = useCallback(() => {
    // Si estamos en la pantalla de bienvenida, NO colapsar el sidebar principal
    // Debe permanecer expandido hasta que el usuario interactúe con él
    if (showWelcome) {
      return
    }
    
    if (activeTab) {
      // Reducir delay para detectar más rápido cuando el mouse sale
      // Esto previene que los sidebars se queden expandidos cuando el mouse se mueve rápido
      closeTimeoutRef.current = setTimeout(() => {
        // Verificar si realmente no hay ningún sidebar hovered
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        const nextSidebar = getLastHoveredSidebar()
        
        // Si no hay sidebars hovered y hay paneles expandidos, y el siguiente sidebar no es un aux,
        // colapsar todo en cascada inversa (incluyendo main)
        const isMovingToInternal = isSidebarMoreInternal(nextSidebar, 'aux1', 'aux2', 'aux3', 'aux4', 'aux5', 'main')
        if (!hasHovered && expandedPanels.length > 0 && !isMovingToInternal) {
          sidebar.collapseAll()
        }
      }, 100) // Reducir delay para detectar más rápido
    }
  }, [showWelcome, activeTab, sidebar, getLastHoveredSidebar, isSidebarMoreInternal])
  
  // Handlers para aux1
  const handleAux1MouseEnter = useCallback(() => {
    clearCloseTimeout()
    // Actualizar el último sidebar hovered
    lastHoveredSidebarRef.current = 'aux1'
    // No colapsar nada, solo expandir aux1
    sidebar.openPanel('aux1', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux1MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const aux1Expanded = sidebar.isPanelExpanded('aux1')
        const aux1IsHovered = sidebar.isPanelHovered('aux1')
        // Verificar si el cursor se movió a un sidebar más interno (main)
        const mainIsHovered = sidebar.isPanelHovered('main')
        
        // Verificar si hay algún sidebar hovered (para saber si el cursor salió completamente)
        const aux2IsHovered = sidebar.isPanelHovered('aux2')
        const aux3IsHovered = sidebar.isPanelHovered('aux3')
        const aux4IsHovered = sidebar.isPanelHovered('aux4')
        const aux5IsHovered = sidebar.isPanelHovered('aux5')
        const anySidebarHovered = aux1IsHovered || aux2IsHovered || aux3IsHovered || aux4IsHovered || aux5IsHovered || mainIsHovered
        
        // Verificar el siguiente sidebar que será hovered
        // Usar función helper para evitar problemas de inferencia de tipos de TypeScript
        const nextSidebarValue = getLastHoveredSidebar()
        
        if (!aux1Expanded) {
          return
        }
        
        // Si el cursor se movió a un sidebar más interno (main o el siguiente sidebar es main)
        const movedToInternal = mainIsHovered || isSidebarMoreInternal(nextSidebarValue, 'main')
        
        if (movedToInternal) {
          return
        }
        
        // Si aux1 está expandido pero no está hovered y no hay sidebars más internos,
        // significa que el cursor se movió a un sidebar más externo o salió completamente
        if (!aux1IsHovered) {
          // Si hay sidebars más externos hovered, colapsar aux1
          if (aux2IsHovered || aux3IsHovered || aux4IsHovered || aux5IsHovered || 
              isSidebarMoreInternal(nextSidebarValue, 'aux2', 'aux3', 'aux4', 'aux5')) {
            sidebar.closePanel('aux1')
          } else if (!anySidebarHovered) {
            // Verificar si el siguiente sidebar es más interno usando una función helper
            const isMovingToInternal = (nextSidebarValue === 'main')
            if (!isMovingToInternal) {
              // No hay ningún sidebar hovered y el siguiente no es main, el cursor salió completamente - colapsar todo
              sidebar.collapseAll()
            }
          }
        }
      }, 100) // Reducir delay para detectar más rápido cuando el mouse sale
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar, getLastHoveredSidebar, isSidebarMoreInternal])
  
  // Handlers para aux2
  const handleAux2MouseEnter = useCallback(() => {
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave
    // Actualizar el último sidebar hovered
    const previousSidebar = lastHoveredSidebarRef.current
    lastHoveredSidebarRef.current = 'aux2'
    
    // Solo colapsar aux1 si NO es la activación inicial (los sidebars ya están establecidos)
    if (!isInitialActivationRef.current) {
      const aux1Expanded = sidebar.isPanelExpanded('aux1')
      // Verificar si el cursor viene de un sidebar más interno (aux1 o main)
      const aux1IsHovered = sidebar.isPanelHovered('aux1')
      const mainIsHovered = sidebar.isPanelHovered('main')
      
      // Solo colapsar si el cursor viene de un sidebar más interno (aux1 o main)
      // Usar el último sidebar hovered como referencia adicional
      const comesFromInternal = aux1IsHovered || mainIsHovered || previousSidebar === 'aux1' || previousSidebar === 'main'
      if (aux1Expanded && comesFromInternal) {
        sidebar.closePanelImmediate('aux1')
      }
    }
    // SIEMPRE llamar a openPanel para asegurar que el hover se actualice correctamente
    // Esto es crítico para detectar hover en sidebars colapsados cuando el mouse se mueve rápido
    sidebar.openPanel('aux2', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux2MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const aux2Expanded = sidebar.isPanelExpanded('aux2')
        const aux2IsHovered = sidebar.isPanelHovered('aux2')
        // Verificar si el cursor se movió a un sidebar más interno (aux1 o main)
        const aux1IsHovered = sidebar.isPanelHovered('aux1')
        const mainIsHovered = sidebar.isPanelHovered('main')
        const aux1Expanded = sidebar.isPanelExpanded('aux1')
        
        // Verificar si hay algún sidebar hovered (para saber si el cursor salió completamente)
        const aux3IsHovered = sidebar.isPanelHovered('aux3')
        const aux4IsHovered = sidebar.isPanelHovered('aux4')
        const aux5IsHovered = sidebar.isPanelHovered('aux5')
        const anySidebarHovered = aux1IsHovered || aux2IsHovered || aux3IsHovered || aux4IsHovered || aux5IsHovered || mainIsHovered
        
        // Verificar el siguiente sidebar que será hovered
        // Usar función helper para evitar problemas de inferencia de tipos de TypeScript
        const nextSidebar = getLastHoveredSidebar()
        
        // Si aux2 ya fue colapsado, no hacer nada
        if (!aux2Expanded) {
          return
        }
        
        // Si el cursor se movió a un sidebar más interno (hovered, expandido, o el siguiente sidebar es más interno)
        // IMPORTANTE: Solo verificar sidebars que realmente existen (están expandidos)
        let movedToInternal = mainIsHovered || isSidebarMoreInternal(nextSidebar, 'main')
        
        if (aux1Expanded) {
          movedToInternal = movedToInternal || aux1IsHovered || (aux1Expanded && !aux2IsHovered) || isSidebarMoreInternal(nextSidebar, 'aux1')
        }
        
        if (movedToInternal) {
          return
        }
        
        // Si aux2 está expandido pero no está hovered y no hay sidebars más internos,
        // significa que el cursor se movió a un sidebar más externo o salió completamente
        if (!aux2IsHovered) {
          // Si hay sidebars más externos hovered, colapsar aux2
          if (aux3IsHovered || aux4IsHovered || aux5IsHovered || isSidebarMoreInternal(nextSidebar, 'aux3', 'aux4', 'aux5')) {
            sidebar.closePanel('aux2')
          } else if (!anySidebarHovered) {
            // Verificar si el siguiente sidebar es más interno usando función helper
            // IMPORTANTE: Solo verificar sidebars que realmente existen (están expandidos)
            let isMovingToInternal = isSidebarMoreInternal(nextSidebar, 'main')
            if (aux1Expanded) {
              isMovingToInternal = isMovingToInternal || isSidebarMoreInternal(nextSidebar, 'aux1')
            }
            
            if (!isMovingToInternal) {
              // No hay ningún sidebar hovered y el siguiente no es más interno, el cursor salió completamente - colapsar todo
              sidebar.collapseAll()
            }
          }
        }
      }, 100) // Reducir delay para detectar más rápido cuando el mouse sale
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar, getLastHoveredSidebar, isSidebarMoreInternal])
  
  // Handlers para aux3
  const handleAux3MouseEnter = useCallback(() => {
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave (aux1, aux2)
    // Actualizar el último sidebar hovered
    const previousSidebar = lastHoveredSidebarRef.current
    lastHoveredSidebarRef.current = 'aux3'
    
    // Solo colapsar aux1 y aux2 si NO es la activación inicial Y si están realmente expandidos
    if (!isInitialActivationRef.current) {
      const aux1Expanded = sidebar.isPanelExpanded('aux1')
      const aux2Expanded = sidebar.isPanelExpanded('aux2')
      // Verificar si el cursor viene de un sidebar más interno (aux1 o aux2 están hovered)
      const aux1IsHovered = sidebar.isPanelHovered('aux1')
      const aux2IsHovered = sidebar.isPanelHovered('aux2')
      const mainIsHovered = sidebar.isPanelHovered('main')
      
      // Solo colapsar si el cursor viene de un sidebar más interno
      // IMPORTANTE: Solo colapsar si el sidebar está realmente expandido (existe)
      // Si aux1 no está expandido, significa que no existe en esta sección (ej: DISPOSITIVOS, USUARIOS)
      if (aux1Expanded) {
        const comesFromAux1 = aux1IsHovered || previousSidebar === 'aux1' || (previousSidebar === 'main' && !aux2Expanded)
        if (comesFromAux1) {
          sidebar.closePanelImmediate('aux1')
        }
      }
      
      if (aux2Expanded) {
        const comesFromAux2 = aux2IsHovered || previousSidebar === 'aux2' || (previousSidebar === 'aux1' && aux1Expanded)
        if (comesFromAux2) {
          sidebar.closePanelImmediate('aux2')
        }
      }
    }
    // SIEMPRE llamar a openPanel para asegurar que el hover se actualice correctamente
    // Esto es crítico para detectar hover en sidebars colapsados cuando el mouse se mueve rápido
    sidebar.openPanel('aux3', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux3MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const aux3Expanded = sidebar.isPanelExpanded('aux3')
        const aux3IsHovered = sidebar.isPanelHovered('aux3')
        // Verificar si el cursor se movió a un sidebar más interno (aux1, aux2 o main)
        const aux1IsHovered = sidebar.isPanelHovered('aux1')
        const aux2IsHovered = sidebar.isPanelHovered('aux2')
        const mainIsHovered = sidebar.isPanelHovered('main')
        const aux1Expanded = sidebar.isPanelExpanded('aux1')
        const aux2Expanded = sidebar.isPanelExpanded('aux2')
        
        // Verificar si hay algún sidebar hovered (para saber si el cursor salió completamente)
        const aux4IsHovered = sidebar.isPanelHovered('aux4')
        const aux5IsHovered = sidebar.isPanelHovered('aux5')
        const anySidebarHovered = aux1IsHovered || aux2IsHovered || aux3IsHovered || aux4IsHovered || aux5IsHovered || mainIsHovered
        
        // Verificar el siguiente sidebar que será hovered (si hay un mouseEnter pendiente)
        const nextSidebar = getLastHoveredSidebar()
        
        if (!aux3Expanded) {
          return
        }
        
        // Si el cursor se movió a un sidebar más interno (hovered, expandido, o el siguiente sidebar es más interno)
        // IMPORTANTE: Solo verificar sidebars que realmente existen (están expandidos)
        // Si aux1 o aux2 no están expandidos, significa que no existen en esta sección
        let movedToInternal = mainIsHovered || isSidebarMoreInternal(nextSidebar, 'main')
        
        if (aux1Expanded) {
          movedToInternal = movedToInternal || aux1IsHovered || (aux1Expanded && !aux3IsHovered) || isSidebarMoreInternal(nextSidebar, 'aux1')
        }
        
        if (aux2Expanded) {
          movedToInternal = movedToInternal || aux2IsHovered || (aux2Expanded && !aux3IsHovered) || isSidebarMoreInternal(nextSidebar, 'aux2')
        }
        
        if (movedToInternal) {
          return
        }
        
        // Si aux3 está expandido pero no está hovered y no hay sidebars más internos,
        // significa que el cursor se movió a un sidebar más externo o salió completamente
        if (!aux3IsHovered) {
          // Si hay sidebars más externos hovered, colapsar aux3
          if (aux4IsHovered || aux5IsHovered || isSidebarMoreInternal(nextSidebar, 'aux4', 'aux5')) {
            sidebar.closePanel('aux3')
          } else if (!anySidebarHovered) {
            // Verificar si el siguiente sidebar es más interno usando función helper
            // IMPORTANTE: Solo verificar sidebars que realmente existen (están expandidos)
            let isMovingToInternal = isSidebarMoreInternal(nextSidebar, 'main')
            if (aux1Expanded) {
              isMovingToInternal = isMovingToInternal || isSidebarMoreInternal(nextSidebar, 'aux1')
            }
            if (aux2Expanded) {
              isMovingToInternal = isMovingToInternal || isSidebarMoreInternal(nextSidebar, 'aux2')
            }
            
            if (!isMovingToInternal) {
              // No hay ningún sidebar hovered y el siguiente no es más interno, el cursor salió completamente - colapsar todo
              sidebar.collapseAll()
            }
          }
        }
      }, 100) // Reducir delay para detectar más rápido cuando el mouse sale
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar, getLastHoveredSidebar, isSidebarMoreInternal])
  
  // Handlers para aux4
  const handleAux4MouseEnter = useCallback(() => {
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave (aux1, aux2, aux3)
    // Actualizar el último sidebar hovered
    const previousSidebar = lastHoveredSidebarRef.current
    lastHoveredSidebarRef.current = 'aux4'
    
    // Solo colapsar aux1, aux2 y aux3 si NO es la activación inicial
    if (!isInitialActivationRef.current) {
      const aux1Expanded = sidebar.isPanelExpanded('aux1')
      const aux2Expanded = sidebar.isPanelExpanded('aux2')
      const aux3Expanded = sidebar.isPanelExpanded('aux3')
      // Verificar si el cursor viene de un sidebar más interno
      const aux1IsHovered = sidebar.isPanelHovered('aux1')
      const aux2IsHovered = sidebar.isPanelHovered('aux2')
      const aux3IsHovered = sidebar.isPanelHovered('aux3')
      const mainIsHovered = sidebar.isPanelHovered('main')
      
      // Solo colapsar si el cursor viene de un sidebar más interno
      // Usar el último sidebar hovered como referencia adicional
      const comesFromAux1 = aux1IsHovered || mainIsHovered || previousSidebar === 'aux1' || previousSidebar === 'main'
      const comesFromAux2 = aux2IsHovered || previousSidebar === 'aux2'
      const comesFromAux3 = aux3IsHovered || previousSidebar === 'aux3'
      
      if (aux1Expanded && comesFromAux1) {
        sidebar.closePanelImmediate('aux1')
      }
      if (aux2Expanded && comesFromAux2) {
        sidebar.closePanelImmediate('aux2')
      }
      if (aux3Expanded && comesFromAux3) {
        sidebar.closePanelImmediate('aux3')
      }
    }
    // SIEMPRE llamar a openPanel para asegurar que el hover se actualice correctamente
    // Esto es crítico para detectar hover en sidebars colapsados cuando el mouse se mueve rápido
    sidebar.openPanel('aux4', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux4MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const aux4Expanded = sidebar.isPanelExpanded('aux4')
        const aux4IsHovered = sidebar.isPanelHovered('aux4')
        // Verificar si el cursor se movió a un sidebar más interno
        const aux1IsHovered = sidebar.isPanelHovered('aux1')
        const aux2IsHovered = sidebar.isPanelHovered('aux2')
        const aux3IsHovered = sidebar.isPanelHovered('aux3')
        const mainIsHovered = sidebar.isPanelHovered('main')
        const aux1Expanded = sidebar.isPanelExpanded('aux1')
        const aux2Expanded = sidebar.isPanelExpanded('aux2')
        const aux3Expanded = sidebar.isPanelExpanded('aux3')
        
        // Verificar si hay algún sidebar hovered (para saber si el cursor salió completamente)
        const aux5IsHovered = sidebar.isPanelHovered('aux5')
        const anySidebarHovered = aux1IsHovered || aux2IsHovered || aux3IsHovered || aux4IsHovered || aux5IsHovered || mainIsHovered
        
        // Verificar el siguiente sidebar que será hovered
        // Usar función helper para evitar problemas de inferencia de tipos de TypeScript
        const nextSidebar = getLastHoveredSidebar()
        
        if (!aux4Expanded) {
          return
        }
        
        // Si el cursor se movió a un sidebar más interno (hovered, expandido, o el siguiente sidebar es más interno)
        const movedToInternal = aux1IsHovered || aux2IsHovered || aux3IsHovered || mainIsHovered ||
                               (aux1Expanded && !aux4IsHovered) || (aux2Expanded && !aux4IsHovered) || (aux3Expanded && !aux4IsHovered) ||
                               isSidebarMoreInternal(nextSidebar, 'aux1', 'aux2', 'aux3', 'main')
        
        if (movedToInternal) {
          return
        }
        
        // Si aux4 está expandido pero no está hovered y no hay sidebars más internos,
        // significa que el cursor se movió a un sidebar más externo o salió completamente
        if (!aux4IsHovered) {
          // Si hay sidebars más externos hovered, colapsar aux4
          if (aux5IsHovered || isSidebarMoreInternal(nextSidebar, 'aux5')) {
            sidebar.closePanel('aux4')
          } else if (!anySidebarHovered) {
            // Verificar si el siguiente sidebar es más interno usando función helper
            const isMovingToInternal = isSidebarMoreInternal(nextSidebar, 'aux1', 'aux2', 'aux3', 'main')
            if (!isMovingToInternal) {
              // No hay ningún sidebar hovered y el siguiente no es más interno, el cursor salió completamente - colapsar todo
              sidebar.collapseAll()
            }
          }
        }
      }, 100) // Reducir delay para detectar más rápido cuando el mouse sale
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar, getLastHoveredSidebar, isSidebarMoreInternal])
  
  // Handlers para aux5
  const handleAux5MouseEnter = useCallback(() => {
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave (aux1, aux2, aux3, aux4)
    // Solo colapsar aux1, aux2, aux3 y aux4 si NO es la activación inicial
    if (!isInitialActivationRef.current) {
      // Verificar si el cursor viene de un sidebar más interno
      const aux1IsHovered = sidebar.isPanelHovered('aux1')
      const aux2IsHovered = sidebar.isPanelHovered('aux2')
      const aux3IsHovered = sidebar.isPanelHovered('aux3')
      const aux4IsHovered = sidebar.isPanelHovered('aux4')
      const mainIsHovered = sidebar.isPanelHovered('main')
      
      // Solo colapsar si el cursor viene de un sidebar más interno
      if (sidebar.isPanelExpanded('aux1') && (aux1IsHovered || mainIsHovered)) {
        sidebar.closePanelImmediate('aux1')
      }
      if (sidebar.isPanelExpanded('aux2') && aux2IsHovered) {
        sidebar.closePanelImmediate('aux2')
      }
      if (sidebar.isPanelExpanded('aux3') && aux3IsHovered) {
        sidebar.closePanelImmediate('aux3')
      }
      if (sidebar.isPanelExpanded('aux4') && aux4IsHovered) {
        sidebar.closePanelImmediate('aux4')
      }
    }
    // SIEMPRE llamar a openPanel para asegurar que el hover se actualice correctamente
    // Esto es crítico para detectar hover en sidebars colapsados cuando el mouse se mueve rápido
    sidebar.openPanel('aux5', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux5MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        if (!hasHovered) {
          sidebar.collapseAll()
        }
      }, 100) // Reducir delay para detectar más rápido cuando el mouse sale
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar])
  
  // Handler genérico para compatibilidad
  const handleAuxiliarySidebarMouseEnter = useCallback(() => {
    handleAux1MouseEnter()
  }, [handleAux1MouseEnter])
  
  const handleAuxiliarySidebarMouseLeave = useCallback(() => {
    handleAux1MouseLeave()
  }, [handleAux1MouseLeave])
  
  // Handler para cuando el cursor entra al contenido
  const handleContentMouseEnter = useCallback(() => {
    // Si estamos en la pantalla de bienvenida, NO colapsar el sidebar principal
    // Debe permanecer expandido para que el usuario vea las opciones disponibles
    if (showWelcome) {
      return
    }
    
    if (activeTab) {
      // Limpiar cualquier timeout pendiente
      clearCloseTimeout()
      
      // Verificar si hay paneles expandidos
      const expandedPanels = sidebar.getExpandedPanels()
      
      if (expandedPanels.length === 0) {
        // Si no hay paneles expandidos, activar expansión en cascada para cuando vuelva
        isComingFromContentRef.current = true
        return
      }
      
      // Colapsar inmediatamente cuando el cursor entra al contenido
      // El colapso se maneja directamente en SidebarContext.handleContentMouseEnter
      // que ya limpia hoveredLevelsRef y colapsa inmediatamente
      sidebar.handleContentMouseEnter()
      
      // Activar expansión en cascada cuando vuelva
      isComingFromContentRef.current = true
    }
  }, [showWelcome, activeTab, sidebar, clearCloseTimeout])
  
  // Handler para cuando el cursor sale del contenido
  const handleContentMouseLeave = useCallback(() => {
    clearCloseTimeout()
    // Activar expansión en cascada cuando el cursor salga del contenido hacia los sidebars
    // Esto permite que cuando el cursor entre a un sidebar, se expanda en cascada
    isComingFromContentRef.current = true
  }, [clearCloseTimeout])
  
  // Función para determinar si hay sidebar auxiliar
  const hasAuxiliarySidebar = useCallback((tab?: string) => {
    if (!tab) return false
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
           tab === 'ajustes' || tab.startsWith('ajustes-')
  }, [])
  
  // Función para calcular margen del contenido
  const getMainContentMargin = useCallback(() => {
    return ''
  }, [])
  
  // Función para obtener clases del sidebar principal
  const getMainSidebarClasses = useCallback(() => {
    const isExpanded = sidebar.isPanelExpanded('main')
    return `fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
      isExpanded ? 'w-72' : 'w-16'
    }`
  }, [sidebar])
  
  // Función para obtener clases del sidebar auxiliar
  const getAuxiliarySidebarClasses = useCallback(() => {
    return 'transition-all duration-300 flex-shrink-0 h-full'
  }, [])
  
  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      clearCloseTimeout()
    }
  }, [clearCloseTimeout])
  
  return {
    // Estados (compatibilidad con useSidebarLayout)
    mainSidebarExpanded: sidebar.isPanelExpanded('main'),
    auxiliarySidebarExpanded: sidebar.isPanelExpanded('aux1') || 
                              sidebar.isPanelExpanded('aux2') || 
                              sidebar.isPanelExpanded('aux3') || 
                              sidebar.isPanelExpanded('aux4') ||
                              sidebar.isPanelExpanded('aux5'),
    aux1Expanded: sidebar.isPanelExpanded('aux1'),
    aux2Expanded: sidebar.isPanelExpanded('aux2'),
    aux3Expanded: sidebar.isPanelExpanded('aux3'),
    aux4Expanded: sidebar.isPanelExpanded('aux4'),
    aux5Expanded: sidebar.isPanelExpanded('aux5'),
    
    // Funciones
    hasAuxiliarySidebar,
    
    // Handlers
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleAux1MouseEnter,
    handleAux1MouseLeave,
    handleAux2MouseEnter,
    handleAux2MouseLeave,
    handleAux3MouseEnter,
    handleAux3MouseLeave,
    handleAux4MouseEnter,
    handleAux4MouseLeave,
    handleAux5MouseEnter,
    handleAux5MouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    
    // Clases
    getMainContentMargin,
    getMainSidebarClasses,
    getAuxiliarySidebarClasses,
    
    // Acceso directo al contexto (para nuevas funcionalidades)
    sidebar
  }
}

