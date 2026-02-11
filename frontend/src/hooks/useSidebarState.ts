import { useCallback, useRef, useEffect } from 'react'
import { useSidebar } from '../contexts/SidebarContext'

interface UseSidebarStateProps {
  showWelcome?: boolean
  activeTab?: string
}

/**
 * Hook para el sidebar principal (único sidebar).
 * Proporciona estado y handlers para expandir/colapsar el MainSidebar.
 */
const globalCloseTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null }

export function useSidebarState({ showWelcome = false, activeTab }: UseSidebarStateProps = {}) {
  const sidebar = useSidebar()
  const isComingFromContentRef = useRef(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Efecto para expandir sidebar principal cuando se muestra welcome
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        sidebar.openPanel('main', false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [showWelcome, sidebar])

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (globalCloseTimeoutRef.current) {
      clearTimeout(globalCloseTimeoutRef.current)
      globalCloseTimeoutRef.current = null
    }
  }, [])

  const handleMainSidebarMouseEnter = useCallback(() => {
    clearCloseTimeout()
    sidebar.openPanel('main', isComingFromContentRef.current)
    isComingFromContentRef.current = false
  }, [sidebar, clearCloseTimeout])

  const handleMainSidebarMouseLeave = useCallback(() => {
    if (showWelcome) return

    if (activeTab) {
      closeTimeoutRef.current = setTimeout(() => {
        const expandedPanels = sidebar.getExpandedPanels()
        const hasHovered = expandedPanels.some(level => sidebar.isPanelHovered(level))
        if (!hasHovered && expandedPanels.length > 0) {
          sidebar.collapseAll()
        }
      }, 100)
      globalCloseTimeoutRef.current = closeTimeoutRef.current
    }
  }, [showWelcome, activeTab, sidebar])

  const handleContentMouseEnter = useCallback(() => {
    if (showWelcome) return

    if (activeTab) {
      clearCloseTimeout()
      const expandedPanels = sidebar.getExpandedPanels()
      if (expandedPanels.length === 0) {
        isComingFromContentRef.current = true
        return
      }
      sidebar.handleContentMouseEnter()
      isComingFromContentRef.current = true
    }
  }, [showWelcome, activeTab, sidebar, clearCloseTimeout])

  const handleContentMouseLeave = useCallback(() => {
    clearCloseTimeout()
    isComingFromContentRef.current = true
  }, [clearCloseTimeout])

  const getMainContentMargin = useCallback(() => '', [])

  const getMainSidebarClasses = useCallback(() => {
    const isExpanded = sidebar.isPanelExpanded('main')
    return `fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
      isExpanded ? 'w-72' : 'w-16'
    }`
  }, [sidebar])

  useEffect(() => {
    return () => clearCloseTimeout()
  }, [clearCloseTimeout])

  return {
    mainSidebarExpanded: sidebar.isPanelExpanded('main'),
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    getMainContentMargin,
    getMainSidebarClasses,
    sidebar
  }
}
