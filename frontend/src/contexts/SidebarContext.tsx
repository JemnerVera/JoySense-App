import React, { createContext, useContext, useCallback, useRef, useState, useMemo, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type SidebarLevel = 'main' | 'aux1' | 'aux2' | 'aux3' | 'aux4' | 'aux5'

export type SidebarState = 'closed' | 'opening' | 'open' | 'closing'

export interface SidebarPanel {
  id: string
  level: SidebarLevel
  isExpanded: boolean
  isHovered: boolean
}

export interface SidebarContextValue {
  // Estado actual
  panels: Map<SidebarLevel, SidebarPanel>
  state: SidebarState
  isCollapsed: boolean
  
  // Flags de control
  hasUnsavedChanges: Record<string, boolean>
  pendingTransition: { type: 'navigate' | 'push' | 'pop'; payload?: any } | null
  showModal: boolean
  
  // Acciones
  openPanel: (level: SidebarLevel, fromContent?: boolean) => void
  closePanel: (level: SidebarLevel) => void
  collapseAll: () => void
  toggleCollapse: () => void
  markDirty: (panelId: string, value: boolean) => void
  navigate: (to: string, subtab?: string) => void
  pushPanel: (level: SidebarLevel, panelId: string) => void
  popPanel: () => void
  requestLeave: (target: string) => void
  confirmLeave: () => void
  cancelLeave: () => void
  onAnimationEnd: (level: SidebarLevel) => void
  
  // Helpers
  isPanelExpanded: (level: SidebarLevel) => boolean
  isPanelHovered: (level: SidebarLevel) => boolean
  getExpandedPanels: () => SidebarLevel[]
  
  // Content mouse handlers
  handleContentMouseEnter: () => void
  handleContentMouseLeave: () => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const SidebarContext = createContext<SidebarContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface SidebarProviderProps {
  children: ReactNode
  initialCollapsed?: boolean
  onNavigate?: (tab: string, subtab?: string) => void
}

export function SidebarProvider({ 
  children, 
  initialCollapsed = false,
  onNavigate 
}: SidebarProviderProps) {
  // Estados
  const [panels, setPanels] = useState<Map<SidebarLevel, SidebarPanel>>(() => {
    const initialPanels = new Map<SidebarLevel, SidebarPanel>()
    const levels: SidebarLevel[] = ['main', 'aux1', 'aux2', 'aux3', 'aux4', 'aux5']
    levels.forEach(level => {
      initialPanels.set(level, {
        id: '',
        level,
        isExpanded: false,
        isHovered: false
      })
    })
    return initialPanels
  })
  
  const [state, setState] = useState<SidebarState>('closed')
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({})
  const [pendingTransition, setPendingTransition] = useState<{ type: 'navigate' | 'push' | 'pop'; payload?: any } | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Refs para control de animaciones y hover
  const animationTimeoutsRef = useRef<Map<SidebarLevel, ReturnType<typeof setTimeout>>>(new Map())
  const hoveredLevelsRef = useRef<Set<SidebarLevel>>(new Set())
  const isTransitioningRef = useRef(false)
  
  // Limpiar timeouts
  const clearTimeouts = useCallback(() => {
    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    animationTimeoutsRef.current.clear()
  }, [])
  
  // Verificar si hay cambios sin guardar
  const checkUnsavedChanges = useCallback((panelId: string): boolean => {
    return hasUnsavedChanges[panelId] === true
  }, [hasUnsavedChanges])
  
  // Obtener orden completo de sidebars
  const getAllLevels = useCallback((): SidebarLevel[] => {
    return ['main', 'aux1', 'aux2', 'aux3', 'aux4', 'aux5']
  }, [])
  
  // Obtener solo los sidebars que están activos (expandidos)
  const getActiveLevels = useCallback((): SidebarLevel[] => {
    const allLevels = getAllLevels()
    const active: SidebarLevel[] = []
    
    // Recorrer desde main hacia los internos
    for (const level of allLevels) {
      const panel = panels.get(level)
      // Si el panel está expandido, agregarlo a activos
      if (panel?.isExpanded) {
        active.push(level)
      } else if (active.length > 0) {
        // Si ya encontramos un sidebar activo pero este no lo está, parar
        // (los sidebars deben estar en secuencia continua)
        break
      }
    }
    
    return active
  }, [panels, getAllLevels])
  
  // Abrir panel con expansión en cascada
  const openPanel = useCallback((level: SidebarLevel, fromContent: boolean = false) => {
    // Si hay una transición de cierre en curso, cancelarla primero
    if (isTransitioningRef.current && state === 'closing') {
      clearTimeouts()
      isTransitioningRef.current = false
    }
    
    // Si hay una transición de apertura en curso y no viene del contenido, solo actualizar hover sin setState
    // para evitar loops infinitos
    if (isTransitioningRef.current && state === 'opening' && !fromContent) {
      hoveredLevelsRef.current.add(level)
      // Solo actualizar el estado de hover sin causar re-render
      const panel = panels.get(level)
      if (panel && !panel.isHovered) {
        setPanels(prev => {
          const newPanels = new Map(prev)
          const panelToUpdate = newPanels.get(level)
          if (panelToUpdate) {
            newPanels.set(level, { ...panelToUpdate, isHovered: true })
          }
          return newPanels
        })
      }
      return
    }
    
    clearTimeouts()
    
    // Agregar nivel a hovered
    hoveredLevelsRef.current.add(level)
    
    // Obtener orden completo y encontrar índice
    const allLevels = getAllLevels()
    const levelIndex = allLevels.indexOf(level)
    
    // Si el nivel no está en el orden, no hacer nada
    if (levelIndex === -1) return
    
    // Verificar si el nivel solicitado ya está expandido
    const panel = panels.get(level)
    if (panel?.isExpanded) {
      // Solo actualizar hover si es necesario, sin causar re-render innecesario
      if (!panel.isHovered) {
        hoveredLevelsRef.current.add(level)
        setPanels(prev => {
          const newPanels = new Map(prev)
          const panelToUpdate = newPanels.get(level)
          if (panelToUpdate) {
            newPanels.set(level, { ...panelToUpdate, isHovered: true })
          }
          return newPanels
        })
      }
      return // No expandir si ya está expandido
    }
    
    // Si viene del contenido, expandir solo el nivel específico sobre el cual se hace hover
    // Los niveles anteriores se expandirán cuando el cursor haga hover sobre ellos
    if (fromContent) {
      setState('opening')
      isTransitioningRef.current = true
      
      // Expandir solo el nivel específico, no todos los anteriores
      hoveredLevelsRef.current.add(level)
      setPanels(prev => {
        const newPanels = new Map(prev)
        const panel = newPanels.get(level)
        if (panel) {
          newPanels.set(level, { ...panel, isExpanded: true, isHovered: true })
        }
        return newPanels
      })
      
      // Marcar como abierto después de un pequeño delay
      setTimeout(() => {
        setState('open')
        isTransitioningRef.current = false
      }, 50)
    } else {
      // Expansión gradual (hover entre sidebars)
      // Solo expandir el nivel específico sobre el cual se hace hover
      // NO expandir todos los niveles anteriores automáticamente
      setState('opening')
      isTransitioningRef.current = true
      
      // Solo expandir el nivel específico
      hoveredLevelsRef.current.add(level)
      setPanels(prev => {
        const newPanels = new Map(prev)
        const panel = newPanels.get(level)
        if (panel) {
          newPanels.set(level, { ...panel, isExpanded: true, isHovered: true })
        }
        return newPanels
      })
      
      // Marcar como abierto después de un pequeño delay
      setTimeout(() => {
        setState('open')
        isTransitioningRef.current = false
      }, 50)
    }
  }, [clearTimeouts, state, getAllLevels, getActiveLevels, panels])
  
  // Cerrar panel con colapso en cascada inversa
  const closePanel = useCallback((level: SidebarLevel) => {
    // Verificar si el panel realmente está expandido
    const panel = panels.get(level)
    if (!panel?.isExpanded) return
    
    // Si hay una transición de apertura en curso, no cerrar
    if (isTransitioningRef.current && state === 'opening') {
      return
    }
    
    clearTimeouts()
    
    // Obtener orden completo y encontrar índice
    const allLevels = getAllLevels()
    const levelIndex = allLevels.indexOf(level)
    
    // Remover nivel de hovered inmediatamente y todos los niveles internos
    if (levelIndex !== -1) {
      const levelsToClean = allLevels.slice(levelIndex)
      levelsToClean.forEach(lvl => {
        hoveredLevelsRef.current.delete(lvl)
      })
    } else {
      hoveredLevelsRef.current.delete(level)
    }
    
    // Actualizar estado de hover inmediatamente para este nivel y todos los niveles internos
    setPanels(prev => {
      const newPanels = new Map(prev)
      if (levelIndex !== -1) {
        const levelsToUpdate = allLevels.slice(levelIndex)
        levelsToUpdate.forEach(lvl => {
          const panelToUpdate = newPanels.get(lvl)
          if (panelToUpdate) {
            newPanels.set(lvl, { ...panelToUpdate, isHovered: false })
          }
        })
      } else {
        const panelToUpdate = newPanels.get(level)
        if (panelToUpdate) {
          newPanels.set(level, { ...panelToUpdate, isHovered: false })
        }
      }
      return newPanels
    })
    
    // Si el nivel no está en el orden, no hacer nada
    if (levelIndex === -1) return
    
    setState('closing')
    isTransitioningRef.current = true
    
    // Colapsar en cascada inversa: desde el nivel especificado hacia los más internos
    // Por ejemplo, si cerramos aux2, debemos colapsar: aux2 -> aux3 -> aux4 -> aux5
    const levelsToCollapse = allLevels.slice(levelIndex)
    
    // Revertir para colapsar desde el más interno hacia el externo
    levelsToCollapse.reverse().forEach((lvl, idx) => {
      const delay = idx * 20 // Delay progresivo para colapso en cascada visible
      const timeout = setTimeout(() => {
        // Verificar si el panel todavía está expandido antes de colapsar
        setPanels(prev => {
          const newPanels = new Map(prev)
          const panelToUpdate = newPanels.get(lvl)
          if (panelToUpdate?.isExpanded) {
            newPanels.set(lvl, { ...panelToUpdate, isExpanded: false, isHovered: false })
          }
          return newPanels
        })
        
        if (idx === levelsToCollapse.length - 1) {
          setState('closed')
          isTransitioningRef.current = false
        }
      }, delay)
      animationTimeoutsRef.current.set(lvl, timeout)
    })
  }, [clearTimeouts, panels, state, getAllLevels])
  
  // Colapsar todos los paneles en cascada inversa (desde el más interno hacia el externo)
  const collapseAll = useCallback(() => {
    clearTimeouts()
    hoveredLevelsRef.current.clear()
    
    // Obtener solo los paneles que están expandidos (dinámicamente)
    const expandedPanels = getActiveLevels()
    
    // Si no hay paneles expandidos, no hacer nada
    if (expandedPanels.length === 0) {
      setState('closed')
      return
    }
    
    setState('closing')
    isTransitioningRef.current = true
    
    // Colapsar en cascada inversa: desde el más interno hacia el más externo
    // Orden inverso: aux5 -> aux4 -> aux3 -> aux2 -> aux1 -> main
    const allLevels = getAllLevels()
    const reverseOrder = [...allLevels].reverse()
    const panelsToCollapse = reverseOrder.filter(lvl => expandedPanels.includes(lvl))
    
    if (panelsToCollapse.length === 0) {
      setState('closed')
      isTransitioningRef.current = false
      return
    }
    
    panelsToCollapse.forEach((lvl, idx) => {
      const delay = idx * 10 // Delay mínimo para colapso en cascada visible pero rápido
      const timeout = setTimeout(() => {
        setPanels(prev => {
          const newPanels = new Map(prev)
          const panel = newPanels.get(lvl)
          if (panel) {
            newPanels.set(lvl, { ...panel, isExpanded: false, isHovered: false })
          }
          return newPanels
        })
        
        if (idx === panelsToCollapse.length - 1) {
          setState('closed')
          isTransitioningRef.current = false
        }
      }, delay)
      animationTimeoutsRef.current.set(lvl, timeout)
    })
  }, [clearTimeouts, panels, getActiveLevels, getAllLevels])
  
  // Toggle colapso
  const toggleCollapse = useCallback(() => {
    if (isTransitioningRef.current) return
    setIsCollapsed(prev => !prev)
  }, [])
  
  // Marcar panel como dirty
  const markDirty = useCallback((panelId: string, value: boolean) => {
    setHasUnsavedChanges(prev => ({
      ...prev,
      [panelId]: value
    }))
  }, [])
  
  // Navegar (con verificación de cambios sin guardar)
  const navigate = useCallback((to: string, subtab?: string) => {
    // Verificar si hay cambios sin guardar en algún panel
    const hasDirty = Object.values(hasUnsavedChanges).some(v => v === true)
    
    if (hasDirty) {
      // Bloquear navegación y mostrar modal
      setPendingTransition({ type: 'navigate', payload: { to, subtab } })
      setShowModal(true)
      return
    }
    
    // Navegar directamente
    onNavigate?.(to, subtab)
  }, [hasUnsavedChanges, onNavigate])
  
  // Push panel
  const pushPanel = useCallback((level: SidebarLevel, panelId: string) => {
    // Verificar cambios sin guardar
    const hasDirty = checkUnsavedChanges(panelId)
    
    if (hasDirty) {
      setPendingTransition({ type: 'push', payload: { level, panelId } })
      setShowModal(true)
      return
    }
    
    // Actualizar panel
    setPanels(prev => {
      const newPanels = new Map(prev)
      const panel = newPanels.get(level)
      if (panel) {
        newPanels.set(level, { ...panel, id: panelId })
      }
      return newPanels
    })
    
    // Abrir panel si no está abierto
    if (!panels.get(level)?.isExpanded) {
      openPanel(level, false)
    }
  }, [checkUnsavedChanges, panels, openPanel])
  
  // Pop panel
  const popPanel = useCallback(() => {
    // Verificar cambios sin guardar
    const hasDirty = Object.values(hasUnsavedChanges).some(v => v === true)
    
    if (hasDirty) {
      setPendingTransition({ type: 'pop', payload: {} })
      setShowModal(true)
      return
    }
    
    // Cerrar el panel más interno
    const allLevels = getAllLevels()
    const reverseOrder = [...allLevels].reverse()
    for (const level of reverseOrder) {
      const panel = panels.get(level)
      if (panel?.isExpanded) {
        closePanel(level)
        break
      }
    }
  }, [hasUnsavedChanges, panels, closePanel, getAllLevels])
  
  // Request leave (mostrar modal)
  const requestLeave = useCallback((target: string) => {
    const hasDirty = Object.values(hasUnsavedChanges).some(v => v === true)
    
    if (hasDirty) {
      setPendingTransition({ type: 'navigate', payload: { to: target } })
      setShowModal(true)
    } else {
      onNavigate?.(target)
    }
  }, [hasUnsavedChanges, onNavigate])
  
  // Confirm leave
  const confirmLeave = useCallback(() => {
    if (!pendingTransition) return
    
    // Limpiar cambios sin guardar
    setHasUnsavedChanges({})
    setShowModal(false)
    
    // Ejecutar transición pendiente
    if (pendingTransition.type === 'navigate' && pendingTransition.payload) {
      onNavigate?.(pendingTransition.payload.to, pendingTransition.payload.subtab)
    } else if (pendingTransition.type === 'push' && pendingTransition.payload) {
      const { level, panelId } = pendingTransition.payload
      setPanels(prev => {
        const newPanels = new Map(prev)
        const panel = newPanels.get(level)
        if (panel) {
          newPanels.set(level, { ...panel, id: panelId })
        }
        return newPanels
      })
      if (!panels.get(level)?.isExpanded) {
        openPanel(level, false)
      }
    } else if (pendingTransition.type === 'pop') {
      const allLevels = getAllLevels()
      const reverseOrder = [...allLevels].reverse()
      for (const level of reverseOrder) {
        const panel = panels.get(level)
        if (panel?.isExpanded) {
          closePanel(level)
          break
        }
      }
    }
    
    setPendingTransition(null)
  }, [pendingTransition, panels, openPanel, closePanel, onNavigate])
  
  // Cancel leave
  const cancelLeave = useCallback(() => {
    setPendingTransition(null)
    setShowModal(false)
  }, [])
  
  // Animation end handler
  const onAnimationEnd = useCallback((level: SidebarLevel) => {
    // Limpiar timeout si existe
    const timeout = animationTimeoutsRef.current.get(level)
    if (timeout) {
      clearTimeout(timeout)
      animationTimeoutsRef.current.delete(level)
    }
  }, [])
  
  // Helpers
  const isPanelExpanded = useCallback((level: SidebarLevel) => {
    return panels.get(level)?.isExpanded ?? false
  }, [panels])
  
  const isPanelHovered = useCallback((level: SidebarLevel) => {
    // Verificar tanto el estado del panel como el ref de hoveredLevels
    // El ref es más confiable porque se actualiza inmediatamente
    const isHoveredInRef = hoveredLevelsRef.current.has(level)
    const panel = panels.get(level)
    const isHoveredInState = panel?.isHovered ?? false
    return isHoveredInRef || isHoveredInState
  }, [panels])
  
  const getExpandedPanels = useCallback(() => {
    return getActiveLevels()
  }, [getActiveLevels])
  
  // Handler para cuando el cursor entra al contenido principal
  // NOTA: Este handler se llama desde useSidebarState, no directamente
  const handleContentMouseEnter = useCallback(() => {
    // Limpiar todos los hovered levels cuando el cursor entra al contenido
    // Esto asegura que isPanelHovered retorne false
    hoveredLevelsRef.current.clear()
    
    // Actualizar el estado de hover de todos los paneles a false
    setPanels(prev => {
      const newPanels = new Map(prev)
      newPanels.forEach((panel, level) => {
        if (panel.isHovered) {
          newPanels.set(level, { ...panel, isHovered: false })
        }
      })
      return newPanels
    })
    
    // Si hay paneles expandidos, colapsar inmediatamente en cascada
    const expandedPanels = getExpandedPanels()
    if (expandedPanels.length > 0) {
      // Colapsar inmediatamente sin delays de verificación
      collapseAll()
    }
  }, [collapseAll, getExpandedPanels])
  
  // Handler para cuando el cursor sale del contenido
  // NOTA: Este handler se llama desde useSidebarState, no directamente
  const handleContentMouseLeave = useCallback(() => {
    // Activar expansión en cascada cuando vuelva a los sidebars
    // Esto se maneja en openPanel con fromContent=true
  }, [])
  
  // Valor del contexto
  const value = useMemo<SidebarContextValue>(() => {
    const contextValue: SidebarContextValue = {
      panels,
      state,
      isCollapsed,
      hasUnsavedChanges,
      pendingTransition,
      showModal,
      openPanel,
      closePanel,
      collapseAll,
      toggleCollapse,
      markDirty,
      navigate,
      pushPanel,
      popPanel,
      requestLeave,
      confirmLeave,
      cancelLeave,
      onAnimationEnd,
      isPanelExpanded,
      isPanelHovered,
      getExpandedPanels,
      handleContentMouseEnter,
      handleContentMouseLeave
    }
    
    // Debug: verificar que las funciones estén definidas
    if (typeof handleContentMouseEnter !== 'function') {
      console.error('[SIDEBAR ERROR] handleContentMouseEnter is not a function:', typeof handleContentMouseEnter)
    }
    if (typeof handleContentMouseLeave !== 'function') {
      console.error('[SIDEBAR ERROR] handleContentMouseLeave is not a function:', typeof handleContentMouseLeave)
    }
    
    return contextValue
  }, [
    panels,
    state,
    isCollapsed,
    hasUnsavedChanges,
    pendingTransition,
    showModal,
    openPanel,
    closePanel,
    collapseAll,
    toggleCollapse,
    markDirty,
    navigate,
    pushPanel,
    popPanel,
    requestLeave,
    confirmLeave,
    cancelLeave,
    onAnimationEnd,
    isPanelExpanded,
    isPanelHovered,
    getExpandedPanels,
    handleContentMouseEnter,
    handleContentMouseLeave
  ])
  
  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

