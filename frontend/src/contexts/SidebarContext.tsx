import React, { createContext, useContext, useCallback, useRef, useState, useMemo, useEffect, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type SidebarLevel = 'main'

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
  pendingTransition: { type: 'navigate' | 'push' | 'pop' | 'subtab'; payload?: any; onConfirm?: () => void } | null
  showModal: boolean
  activeTab: string
  
  // Acciones
  openPanel: (level: SidebarLevel, fromContent?: boolean) => void
  closePanel: (level: SidebarLevel) => void
  closePanelImmediate: (level: SidebarLevel) => void // Colapsa sin delays para colapso dinámico
  collapseAll: () => void
  toggleCollapse: () => void
  markDirty: (panelId: string, value: boolean) => void
  navigate: (to: string, subtab?: string) => void
  pushPanel: (level: SidebarLevel, panelId: string) => void
  popPanel: () => void
  requestLeave: (target: string, currentTab?: string, onRevert?: () => void, onConfirm?: () => void) => void
  requestSubTabChange: (targetSubTab: string, onConfirm: () => void) => void
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
  activeTab?: string
}

export function SidebarProvider({ 
  children, 
  initialCollapsed = false,
  onNavigate,
  activeTab = ''
}: SidebarProviderProps) {
  // Estados - solo panel main (sidebar único)
  const [panels, setPanels] = useState<Map<SidebarLevel, SidebarPanel>>(() => {
    const initialPanels = new Map<SidebarLevel, SidebarPanel>()
    initialPanels.set('main', {
      id: '',
      level: 'main',
      isExpanded: false,
      isHovered: false
    })
    return initialPanels
  })
  
  const [state, setState] = useState<SidebarState>('closed')
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({})
  const [pendingTransition, setPendingTransition] = useState<{ type: 'navigate' | 'push' | 'pop' | 'subtab'; payload?: any; onConfirm?: () => void } | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Ref para el failsafe de colapso automático
  const failsafeTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
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
  
  // Solo el sidebar principal
  const getAllLevels = useCallback((): SidebarLevel[] => {
    return ['main']
  }, [])
  
  // Obtener solo los sidebars que están activos (expandidos)
  const getActiveLevels = useCallback((): SidebarLevel[] => {
    const allLevels = getAllLevels()
    const active: SidebarLevel[] = []
    
    // Recorrer desde main hacia los internos
    for (const level of allLevels) {
      const panel = panels.get(level)
      const isExpanded = panel?.isExpanded ?? false
      
      // Si el panel está expandido, agregarlo a activos
      if (isExpanded) {
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
    if (levelIndex === -1) {
      console.warn(`[OPEN PANEL] Nivel ${level} no encontrado en allLevels`)
      return
    }
    
    // Verificar si el nivel solicitado ya está expandido
    const panel = panels.get(level)
    
    if (panel?.isExpanded) {
      // SIEMPRE actualizar hover cuando se hace hover sobre un panel expandido
      // Esto asegura que la detección de hover funcione correctamente
      hoveredLevelsRef.current.add(level)
      if (!panel.isHovered) {
        setPanels(prev => {
          const newPanels = new Map(prev)
          const panelToUpdate = newPanels.get(level)
          if (panelToUpdate) {
            newPanels.set(level, { ...panelToUpdate, isHovered: true })
          }
          return newPanels
        })
      }
      return // No expandir si ya está expandido, solo actualizar hover
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
  }, [clearTimeouts, state, getAllLevels, panels])
  
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
  
  // Cerrar panel inmediatamente (sin delays) para colapso dinámico cuando el cursor se mueve a un sidebar más externo
  const closePanelImmediate = useCallback((level: SidebarLevel) => {
    const panel = panels.get(level)
    if (!panel?.isExpanded) return
    
    // Remover nivel de hovered inmediatamente
    hoveredLevelsRef.current.delete(level)
    
    // Actualizar estado de hover y expansión inmediatamente
    setPanels(prev => {
      const newPanels = new Map(prev)
      const panelToUpdate = newPanels.get(level)
      if (panelToUpdate) {
        newPanels.set(level, { ...panelToUpdate, isExpanded: false, isHovered: false })
      }
      return newPanels
    })
  }, [panels])
  
  // Colapsar todos los paneles en cascada inversa (desde el más interno hacia el externo)
  const collapseAll = useCallback(() => {
    clearTimeouts()
    hoveredLevelsRef.current.clear()
    
    // Verificar DIRECTAMENTE el estado de cada panel (no usar getActiveLevels que requiere secuencia continua)
    // Esto asegura que main se incluya si está expandido, incluso si no hay otros sidebars expandidos
    const allLevels = getAllLevels()
    const directlyExpandedPanels: SidebarLevel[] = []
    allLevels.forEach(level => {
      const panel = panels.get(level)
      const isExpanded = panel?.isExpanded ?? false
      if (isExpanded) {
        directlyExpandedPanels.push(level)
      }
    })
    
    // Si no hay paneles expandidos, no hacer nada
    if (directlyExpandedPanels.length === 0) {
      setState('closed')
      return
    }
    
    setState('closing')
    isTransitioningRef.current = true
    
    // Colapsar en cascada inversa: desde el más interno hacia el más externo
    // Orden inverso: aux5 -> aux4 -> aux3 -> aux2 -> aux1 -> main
    // IMPORTANTE: Usar directamenteExpandedPanels que incluye main si está expandido
    const reverseOrder = [...allLevels].reverse()
    const panelsToCollapse = reverseOrder.filter(lvl => directlyExpandedPanels.includes(lvl))
    
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
          } else {
            console.warn(`[COLLAPSE ALL] No se encontró panel para ${lvl}`)
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
  }, [clearTimeouts, panels, getAllLevels])
  
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
  
  // Request leave (mostrar modal para cambio de pestaña principal)
  const requestLeave = useCallback((target: string, currentTab?: string, onRevert?: () => void, onConfirm?: () => void) => {
    // Si ya hay una transición pendiente, no hacer nada (evita múltiples modales)
    if (pendingTransition) {
      return
    }
    
    const hasDirty = Object.values(hasUnsavedChanges).some(v => v === true)
    
    if (hasDirty) {
      // CRÍTICO: Revertir activeTab inmediatamente si se proporciona onRevert
      // Esto previene que el cambio se ejecute antes de que el usuario confirme
      if (onRevert) {
        onRevert()
      }
      
      // Guardar la transición pendiente y mostrar modal
      // Si hay onConfirm, guardarlo en el payload para ejecutarlo cuando se confirme
      setPendingTransition({ 
        type: 'navigate', 
        payload: { to: target },
        onConfirm: onConfirm // Guardar callback personalizado si existe
      })
      setShowModal(true)
      // NO ejecutar onNavigate aquí - solo se ejecuta si el usuario confirma
    } else {
      // No hay cambios, ejecutar callback personalizado o navegar directamente
      if (onConfirm) {
        onConfirm()
      } else {
        onNavigate?.(target)
      }
    }
  }, [hasUnsavedChanges, onNavigate, pendingTransition])
  
  // Request subTab change (mostrar modal para cambio de subpestaña)
  const requestSubTabChange = useCallback((targetSubTab: string, onConfirm: () => void) => {
    // Si ya hay una transición pendiente, no hacer nada (evita múltiples modales)
    if (pendingTransition) {
      return
    }
    
    const hasDirty = Object.values(hasUnsavedChanges).some(v => v === true)
    
    if (hasDirty) {
      // Guardar la transición pendiente y mostrar modal
      setPendingTransition({ type: 'subtab', payload: { to: targetSubTab }, onConfirm })
      setShowModal(true)
      // NO ejecutar onConfirm aquí - solo se ejecuta si el usuario confirma
    } else {
      // No hay cambios, ejecutar callback directamente
      onConfirm()
    }
  }, [hasUnsavedChanges, pendingTransition])
  
  // Confirm leave
  const confirmLeave = useCallback(() => {
    if (!pendingTransition) return
    
    // Ejecutar transición pendiente ANTES de limpiar cambios
    if (pendingTransition.type === 'subtab' && pendingTransition.onConfirm) {
      // Cambio de subpestaña: ejecutar callback de confirmación
      setHasUnsavedChanges({})
      setShowModal(false)
      const onConfirm = pendingTransition.onConfirm
      setPendingTransition(null)
      // Ejecutar callback de confirmación (esto cambiará la subpestaña)
      onConfirm()
    } else if (pendingTransition.type === 'navigate' && pendingTransition.payload) {
      const targetTab = pendingTransition.payload.to
      // Limpiar cambios sin guardar antes de navegar
      setHasUnsavedChanges({})
      setShowModal(false)
      const customOnConfirm = pendingTransition.onConfirm
      setPendingTransition(null)
      // Ejecutar callback personalizado si existe, sino usar onNavigate
      if (customOnConfirm) {
        customOnConfirm()
      } else {
        // Ejecutar navegación estándar
        onNavigate?.(targetTab, pendingTransition.payload.subtab)
      }
    } else if (pendingTransition.type === 'push' && pendingTransition.payload) {
      const { level, panelId } = pendingTransition.payload
      // Limpiar cambios sin guardar
      setHasUnsavedChanges({})
      setShowModal(false)
      setPendingTransition(null)
      // Actualizar panel
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
      // Limpiar cambios sin guardar
      setHasUnsavedChanges({})
      setShowModal(false)
      setPendingTransition(null)
      // Cerrar panel
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
  }, [pendingTransition, panels, openPanel, closePanel, onNavigate, getAllLevels])
  
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
    
    // Verificar DIRECTAMENTE si hay paneles expandidos (no usar getExpandedPanels que requiere secuencia continua)
    // Esto asegura que main se incluya si está expandido, incluso si otros sidebars están colapsados
    const allLevels = getAllLevels()
    const hasExpandedPanels = allLevels.some(level => {
      const panel = panels.get(level)
      return panel?.isExpanded === true
    })
    
    if (hasExpandedPanels) {
      // Colapsar inmediatamente sin delays de verificación
      collapseAll()
    }
  }, [collapseAll, getAllLevels, panels])
  
  // Handler para cuando el cursor sale del contenido
  // NOTA: Este handler se llama desde useSidebarState, no directamente
  const handleContentMouseLeave = useCallback(() => {
    // Activar expansión en cascada cuando vuelva a los sidebars
    // Esto se maneja en openPanel con fromContent=true
  }, [])
  
  // FAILSAFE: Monitorear periódicamente si hay sidebars expandidos pero el mouse no está sobre ninguno
  // Esto previene que los sidebars se queden expandidos si hay algún problema con los event handlers
  useEffect(() => {
    // Limpiar cualquier intervalo previo
    if (failsafeTimeoutRef.current) {
      clearInterval(failsafeTimeoutRef.current)
    }
    
    // Configurar el failsafe para verificar cada 500ms
    failsafeTimeoutRef.current = setInterval(() => {
      const expandedPanels = getExpandedPanels()
      
      // Si hay paneles expandidos, verificar si alguno está siendo hovered
      if (expandedPanels.length > 0) {
        const hasAnyHovered = expandedPanels.some(level => isPanelHovered(level))
        
        // Si no hay ningún panel hovered y hay paneles expandidos, colapsar todo
        // EXCEPTO: Si solo está expandido 'main' y no hay activeTab, probablemente estamos en la pantalla de bienvenida
        // En ese caso, NO colapsar para que el usuario vea las opciones disponibles
        const isOnlyMainExpanded = expandedPanels.length === 1 && expandedPanels[0] === 'main'
        const isWelcomeScreen = isOnlyMainExpanded && !activeTab
        
        if (!hasAnyHovered && !isWelcomeScreen) {
          console.warn('[SIDEBAR FAILSAFE] Detectados sidebars expandidos sin hover, colapsando automáticamente')
          collapseAll()
        }
      }
    }, 500) // Verificar cada 500ms
    
    // Limpiar el intervalo al desmontar
    return () => {
      if (failsafeTimeoutRef.current) {
        clearInterval(failsafeTimeoutRef.current)
        failsafeTimeoutRef.current = null
      }
    }
  }, [getExpandedPanels, isPanelHovered, collapseAll, activeTab])
  
  // Valor del contexto
  const value = useMemo<SidebarContextValue>(() => {
    const contextValue: SidebarContextValue = {
      panels,
      state,
      isCollapsed,
      hasUnsavedChanges,
      pendingTransition,
      showModal,
      activeTab,
      openPanel,
      closePanel,
      closePanelImmediate,
      collapseAll,
      toggleCollapse,
      markDirty,
      navigate,
      pushPanel,
      popPanel,
      requestLeave,
      requestSubTabChange,
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
    activeTab,
    openPanel,
    closePanel,
    closePanelImmediate,
    collapseAll,
    toggleCollapse,
    markDirty,
    navigate,
    pushPanel,
    popPanel,
    requestLeave,
    requestSubTabChange,
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

