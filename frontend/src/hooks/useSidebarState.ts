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
export function useSidebarState({ showWelcome = false, activeTab }: UseSidebarStateProps = {}) {
  const sidebar = useSidebar()
  const isComingFromContentRef = useRef(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
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
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [showWelcome]) // Remover sidebar de las dependencias para evitar loops
  
  // Limpiar timeout
  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
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
    clearCloseTimeout()
    sidebar.openPanel('aux1', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux1MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        if (expandedPanels.length === 0) return
        
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        // Si no hay sidebars hovered, colapsar todo en cascada inversa
        if (!hasHovered) {
          sidebar.collapseAll()
        }
      }, 150)
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux2
  const handleAux2MouseEnter = useCallback(() => {
    clearCloseTimeout()
    sidebar.openPanel('aux2', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux2MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        if (expandedPanels.length === 0) return
        
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        // Si no hay sidebars hovered, colapsar todo en cascada inversa
        if (!hasHovered) {
          sidebar.collapseAll()
        }
      }, 150)
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux3
  const handleAux3MouseEnter = useCallback(() => {
    clearCloseTimeout()
    sidebar.openPanel('aux3', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux3MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        if (expandedPanels.length === 0) return
        
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        // Si no hay sidebars hovered, colapsar todo en cascada inversa
        if (!hasHovered) {
          sidebar.collapseAll()
        }
      }, 150)
    }
  }, [activeTab, sidebar])
  
  // Handlers para aux4
  const handleAux4MouseEnter = useCallback(() => {
    clearCloseTimeout()
    sidebar.openPanel('aux4', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])
  
  const handleAux4MouseLeave = useCallback(() => {
    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        if (expandedPanels.length === 0) return
        
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        
        // Si no hay sidebars hovered, colapsar todo en cascada inversa
        if (!hasHovered) {
          sidebar.collapseAll()
        }
      }, 150)
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
                              sidebar.isPanelExpanded('aux4'),
    aux1Expanded: sidebar.isPanelExpanded('aux1'),
    aux2Expanded: sidebar.isPanelExpanded('aux2'),
    aux3Expanded: sidebar.isPanelExpanded('aux3'),
    aux4Expanded: sidebar.isPanelExpanded('aux4'),
    
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

