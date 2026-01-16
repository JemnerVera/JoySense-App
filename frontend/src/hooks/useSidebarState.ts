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
  
  // Efecto para expandir sidebars cuando se muestra welcome
  useEffect(() => {
    if (showWelcome) {
      // Usar un timeout para evitar loops infinitos
      const timer = setTimeout(() => {
        sidebar.openPanel('main', false)
        sidebar.openPanel('aux1', false)
        sidebar.openPanel('aux2', false)
        sidebar.openPanel('aux3', false)
        sidebar.openPanel('aux4', false)
        // Marcar que los sidebars están establecidos después de la activación inicial
        setTimeout(() => {
          isInitialActivationRef.current = false
        }, 500) // Dar tiempo para que se completen las animaciones
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [showWelcome]) // Remover sidebar de las dependencias para evitar loops
  
  // Efecto para detectar cuando se activa una pestaña (cambio de activeTab)
  useEffect(() => {
    if (activeTab) {
      // Cuando cambia la pestaña activa, marcar como activación inicial
      isInitialActivationRef.current = true
      // Después de un delay, marcar que los sidebars están establecidos
      const timer = setTimeout(() => {
        isInitialActivationRef.current = false
      }, 1000) // Delay para permitir que se completen las animaciones de expansión
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
    sidebar.openPanel('main', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleMainSidebarMouseLeave = useCallback(() => {
    if (activeTab) {
      // Programar verificación con delay para permitir movimiento entre sidebars
      closeTimeoutRef.current = setTimeout(() => {
        // Verificar si realmente no hay ningún sidebar hovered
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        // Si no hay sidebars hovered y hay paneles expandidos, colapsar todo en cascada inversa
        if (!hasHovered && expandedPanels.length > 0) {
          sidebar.collapseAll()
        }
      }, 150) // Delay reducido para respuesta más rápida
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux1
  const handleAux1MouseEnter = useCallback(() => {
    console.log('[SIDEBAR COLLAPSE] handleAux1MouseEnter')
    clearCloseTimeout()
    // No colapsar nada, solo expandir aux1
    sidebar.openPanel('aux1', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux1MouseLeave = useCallback(() => {
    if (activeTab) {
      console.log('[SIDEBAR COLLAPSE] handleAux1MouseLeave - Iniciando verificación')
      // Usar un delay más largo para permitir que los eventos de mouseEnter se registren
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        console.log('[SIDEBAR COLLAPSE] handleAux1MouseLeave - Verificación:', {
          expandedPanels,
          hasHovered,
          aux1Hovered: sidebar.isPanelHovered('aux1'),
          aux2Hovered: sidebar.isPanelHovered('aux2'),
          aux3Hovered: sidebar.isPanelHovered('aux3'),
          aux4Hovered: sidebar.isPanelHovered('aux4'),
          aux5Hovered: sidebar.isPanelHovered('aux5')
        })
        
        // Verificar primero si aux1 todavía está expandido
        // Si no está expandido, significa que ya fue colapsado por otro handler
        const aux1Expanded = sidebar.isPanelExpanded('aux1')
        if (!aux1Expanded) {
          console.log('[SIDEBAR COLLAPSE] handleAux1MouseLeave - aux1 ya fue colapsado, no hacer nada')
          return
        }
        
        // Si aux1 no está hovered pero hay sidebars más externos hovered, colapsar aux1
        // Esto significa que el cursor se movió a un sidebar más externo
        const aux1IsHovered = sidebar.isPanelHovered('aux1')
        const aux2IsHovered = sidebar.isPanelHovered('aux2')
        const aux3IsHovered = sidebar.isPanelHovered('aux3')
        const aux4IsHovered = sidebar.isPanelHovered('aux4')
        const aux5IsHovered = sidebar.isPanelHovered('aux5')
        
        if (!aux1IsHovered && (aux2IsHovered || aux3IsHovered || aux4IsHovered || aux5IsHovered)) {
          // El cursor está en un sidebar más externo, colapsar aux1
          console.log('[SIDEBAR COLLAPSE] handleAux1MouseLeave - Colapsando aux1 (cursor en sidebar más externo)')
          sidebar.closePanel('aux1')
        } else if (!hasHovered) {
          // No hay ningún sidebar hovered, colapsar todo
          console.log('[SIDEBAR COLLAPSE] handleAux1MouseLeave - Colapsando todo (no hay sidebars hovered)')
          sidebar.collapseAll()
        }
      }, 100) // Delay más largo para permitir que mouseEnter se registre completamente
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux2
  const handleAux2MouseEnter = useCallback(() => {
    console.log('[SIDEBAR COLLAPSE] handleAux2MouseEnter')
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave
    // Solo colapsar aux1 si NO es la activación inicial (los sidebars ya están establecidos)
    if (!isInitialActivationRef.current) {
      const aux1Expanded = sidebar.isPanelExpanded('aux1')
      console.log('[SIDEBAR COLLAPSE] handleAux2MouseEnter - aux1Expanded:', aux1Expanded, 'isInitialActivation:', isInitialActivationRef.current)
      if (aux1Expanded) {
        console.log('[SIDEBAR COLLAPSE] handleAux2MouseEnter - Colapsando aux1 inmediatamente')
        sidebar.closePanelImmediate('aux1')
      }
    } else {
      console.log('[SIDEBAR COLLAPSE] handleAux2MouseEnter - Activación inicial, no colapsar aux1')
    }
    sidebar.openPanel('aux2', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux2MouseLeave = useCallback(() => {
    if (activeTab) {
      console.log('[SIDEBAR COLLAPSE] handleAux2MouseLeave - Iniciando verificación')
      // Usar un delay más corto para verificación inicial
      closeTimeoutRef.current = setTimeout(() => {
        const aux2Expanded = sidebar.isPanelExpanded('aux2')
        const aux2IsHovered = sidebar.isPanelHovered('aux2')
        
        console.log('[SIDEBAR COLLAPSE] handleAux2MouseLeave - Verificación inicial:', {
          aux2Expanded,
          aux2IsHovered
        })
        
        // Si aux2 ya fue colapsado, no hacer nada
        if (!aux2Expanded) {
          console.log('[SIDEBAR COLLAPSE] handleAux2MouseLeave - aux2 ya fue colapsado')
          return
        }
        
        // Si aux2 está expandido pero no está hovered, significa que el cursor se movió
        // Colapsar aux2 inmediatamente
        if (!aux2IsHovered) {
          console.log('[SIDEBAR COLLAPSE] handleAux2MouseLeave - Colapsando aux2 (no está hovered)')
          sidebar.closePanel('aux2')
          return
        }
        
        // Si aux2 todavía está hovered, verificar nuevamente después de un delay más largo
        // para ver si el cursor se movió a un sidebar más externo
        setTimeout(() => {
          const aux2Expanded2 = sidebar.isPanelExpanded('aux2')
          const aux2IsHovered2 = sidebar.isPanelHovered('aux2')
          const expandedPanels = sidebar.getExpandedPanels()
          const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
          
          console.log('[SIDEBAR COLLAPSE] handleAux2MouseLeave - Verificación final:', {
            aux2Expanded2,
            aux2IsHovered2,
            hasHovered
          })
          
          // Si aux2 todavía está expandido pero no está hovered, colapsarlo
          if (aux2Expanded2 && !aux2IsHovered2) {
            console.log('[SIDEBAR COLLAPSE] handleAux2MouseLeave - Colapsando aux2 (verificación final)')
            sidebar.closePanel('aux2')
          } else if (!hasHovered) {
            // No hay ningún sidebar hovered, colapsar todo
            console.log('[SIDEBAR COLLAPSE] handleAux2MouseLeave - Colapsando todo')
            sidebar.collapseAll()
          }
        }, 150) // Delay adicional para verificación final
      }, 50) // Delay corto para verificación inicial
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux3
  const handleAux3MouseEnter = useCallback(() => {
    console.log('[SIDEBAR COLLAPSE] handleAux3MouseEnter')
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave (aux1, aux2)
    // Solo colapsar aux1 y aux2 si NO es la activación inicial
    if (!isInitialActivationRef.current) {
      const aux1Expanded = sidebar.isPanelExpanded('aux1')
      const aux2Expanded = sidebar.isPanelExpanded('aux2')
      console.log('[SIDEBAR COLLAPSE] handleAux3MouseEnter - Estados:', { aux1Expanded, aux2Expanded, isInitialActivation: isInitialActivationRef.current })
      if (aux1Expanded) {
        console.log('[SIDEBAR COLLAPSE] handleAux3MouseEnter - Colapsando aux1 inmediatamente')
        sidebar.closePanelImmediate('aux1')
      }
      if (aux2Expanded) {
        console.log('[SIDEBAR COLLAPSE] handleAux3MouseEnter - Colapsando aux2 inmediatamente')
        sidebar.closePanelImmediate('aux2')
      }
    } else {
      console.log('[SIDEBAR COLLAPSE] handleAux3MouseEnter - Activación inicial, no colapsar aux1/aux2')
    }
    sidebar.openPanel('aux3', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux3MouseLeave = useCallback(() => {
    if (activeTab) {
      console.log('[SIDEBAR COLLAPSE] handleAux3MouseLeave - Iniciando verificación')
      closeTimeoutRef.current = setTimeout(() => {
        const aux3Expanded = sidebar.isPanelExpanded('aux3')
        const aux3IsHovered = sidebar.isPanelHovered('aux3')
        
        if (!aux3Expanded) {
          console.log('[SIDEBAR COLLAPSE] handleAux3MouseLeave - aux3 ya fue colapsado, no hacer nada')
          return
        }
        
        // Si aux3 todavía está expandido pero no está hovered, colapsarlo
        if (!aux3IsHovered) {
          console.log('[SIDEBAR COLLAPSE] handleAux3MouseLeave - aux3 expandido pero no hovered, colapsando')
          sidebar.closePanel('aux3')
          return
        }
        
        // Si aux3 está hovered, verificar si hay otros sidebars hovered
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        if (!hasHovered) {
          console.log('[SIDEBAR COLLAPSE] handleAux3MouseLeave - Colapsando todo (no hay sidebars hovered)')
          sidebar.collapseAll()
        }
      }, 200)
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux4
  const handleAux4MouseEnter = useCallback(() => {
    console.log('[SIDEBAR COLLAPSE] handleAux4MouseEnter')
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave (aux1, aux2, aux3)
    // Solo colapsar aux1, aux2 y aux3 si NO es la activación inicial
    if (!isInitialActivationRef.current) {
      const aux1Expanded = sidebar.isPanelExpanded('aux1')
      const aux2Expanded = sidebar.isPanelExpanded('aux2')
      const aux3Expanded = sidebar.isPanelExpanded('aux3')
      console.log('[SIDEBAR COLLAPSE] handleAux4MouseEnter - Estados:', { aux1Expanded, aux2Expanded, aux3Expanded, isInitialActivation: isInitialActivationRef.current })
      if (aux1Expanded) {
        console.log('[SIDEBAR COLLAPSE] handleAux4MouseEnter - Colapsando aux1 inmediatamente')
        sidebar.closePanelImmediate('aux1')
      }
      if (aux2Expanded) {
        console.log('[SIDEBAR COLLAPSE] handleAux4MouseEnter - Colapsando aux2 inmediatamente')
        sidebar.closePanelImmediate('aux2')
      }
      if (aux3Expanded) {
        console.log('[SIDEBAR COLLAPSE] handleAux4MouseEnter - Colapsando aux3 inmediatamente')
        sidebar.closePanelImmediate('aux3')
      }
    } else {
      console.log('[SIDEBAR COLLAPSE] handleAux4MouseEnter - Activación inicial, no colapsar aux1/aux2/aux3')
    }
    sidebar.openPanel('aux4', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux4MouseLeave = useCallback(() => {
    if (activeTab) {
      console.log('[SIDEBAR COLLAPSE] handleAux4MouseLeave - Iniciando verificación')
      closeTimeoutRef.current = setTimeout(() => {
        const aux4Expanded = sidebar.isPanelExpanded('aux4')
        const aux4IsHovered = sidebar.isPanelHovered('aux4')
        
        if (!aux4Expanded) {
          console.log('[SIDEBAR COLLAPSE] handleAux4MouseLeave - aux4 ya fue colapsado, no hacer nada')
          return
        }
        
        // Si aux4 todavía está expandido pero no está hovered, colapsarlo
        if (!aux4IsHovered) {
          console.log('[SIDEBAR COLLAPSE] handleAux4MouseLeave - aux4 expandido pero no hovered, colapsando')
          sidebar.closePanel('aux4')
          return
        }
        
        // Si aux4 está hovered, verificar si hay otros sidebars hovered
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        if (!hasHovered) {
          console.log('[SIDEBAR COLLAPSE] handleAux4MouseLeave - Colapsando todo (no hay sidebars hovered)')
          sidebar.collapseAll()
        }
      }, 200)
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux5
  const handleAux5MouseEnter = useCallback(() => {
    console.log('[SIDEBAR COLLAPSE] handleAux5MouseEnter')
    clearCloseTimeout() // Cancelar cualquier timeout pendiente de mouseLeave (aux1, aux2, aux3, aux4)
    // Solo colapsar aux1, aux2, aux3 y aux4 si NO es la activación inicial
    if (!isInitialActivationRef.current) {
      if (sidebar.isPanelExpanded('aux1')) {
        sidebar.closePanelImmediate('aux1')
      }
      if (sidebar.isPanelExpanded('aux2')) {
        sidebar.closePanelImmediate('aux2')
      }
      if (sidebar.isPanelExpanded('aux3')) {
        sidebar.closePanelImmediate('aux3')
      }
      if (sidebar.isPanelExpanded('aux4')) {
        sidebar.closePanelImmediate('aux4')
      }
    } else {
      console.log('[SIDEBAR COLLAPSE] handleAux5MouseEnter - Activación inicial, no colapsar aux1/aux2/aux3/aux4')
    }
    sidebar.openPanel('aux5', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux5MouseLeave = useCallback(() => {
    if (activeTab) {
      console.log('[SIDEBAR COLLAPSE] handleAux5MouseLeave - Iniciando verificación')
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        if (!hasHovered) {
          console.log('[SIDEBAR COLLAPSE] handleAux5MouseLeave - Colapsando todo (no hay sidebars hovered)')
          sidebar.collapseAll()
        }
      }, 200)
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
  }, [activeTab, sidebar, clearCloseTimeout])
  
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
      isExpanded ? 'w-64' : 'w-16'
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

