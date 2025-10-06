import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSidebarLayoutProps {
  showWelcome: boolean;
  activeTab?: string;
}

export const useSidebarLayout = ({ showWelcome, activeTab }: UseSidebarLayoutProps) => {
  const [mainSidebarExpanded, setMainSidebarExpanded] = useState(showWelcome);
  const [auxiliarySidebarExpanded, setAuxiliarySidebarExpanded] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para determinar si hay sidebar auxiliar
  const hasAuxiliarySidebar = useCallback((tab?: string) => {
    if (!tab) return false;
    return tab === 'parameters' || tab.startsWith('parameters-') || 
           tab === 'reportes' || tab.startsWith('reportes-');
  }, []);

  // Efecto para manejar el estado inicial
  useEffect(() => {
    if (showWelcome) {
      setMainSidebarExpanded(true);
      setAuxiliarySidebarExpanded(true);
    }
  }, [showWelcome]);

  // Efecto para expandir sidebar auxiliar cuando hay pestaña activa
  useEffect(() => {
    if (activeTab && hasAuxiliarySidebar(activeTab)) {
      setAuxiliarySidebarExpanded(true);
    }
  }, [activeTab, hasAuxiliarySidebar]);

  // Función para limpiar timeout
  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Función para programar cierre
  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setMainSidebarExpanded(false);
      setAuxiliarySidebarExpanded(false);
    }, 500);
  }, [clearCloseTimeout]);

  // Handlers de hover
  const handleMainSidebarMouseEnter = useCallback(() => {
    setMainSidebarExpanded(true);
    if (activeTab && hasAuxiliarySidebar(activeTab)) {
      setAuxiliarySidebarExpanded(true);
    }
    clearCloseTimeout();
  }, [clearCloseTimeout, activeTab, hasAuxiliarySidebar]);

  const handleMainSidebarMouseLeave = useCallback(() => {
    if (activeTab) {
      scheduleClose();
    }
  }, [scheduleClose, activeTab]);

  const handleAuxiliarySidebarMouseEnter = useCallback(() => {
    if (activeTab && hasAuxiliarySidebar(activeTab)) {
      // Transición más suave: primero expandir el auxiliar, luego colapsar el principal
      setAuxiliarySidebarExpanded(true);
      setTimeout(() => {
        setMainSidebarExpanded(false);
      }, 150); // Pequeño delay para transición más fluida
      clearCloseTimeout();
    }
  }, [clearCloseTimeout, activeTab, hasAuxiliarySidebar]);

  const handleAuxiliarySidebarMouseLeave = useCallback(() => {
    if (activeTab) {
      scheduleClose();
    }
  }, [scheduleClose, activeTab]);

  const handleContentMouseEnter = useCallback(() => {
    if (activeTab) {
      setMainSidebarExpanded(false);
      setAuxiliarySidebarExpanded(false);
      clearCloseTimeout();
    }
  }, [clearCloseTimeout, activeTab]);

  const handleContentMouseLeave = useCallback(() => {
    // No hacer nada
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
  const getAuxiliarySidebarClasses = useCallback(() => {
    return `bg-gray-800 border-r border-gray-700 transition-all duration-300 flex-shrink-0 h-full ${
      auxiliarySidebarExpanded ? 'w-64' : 'w-16'
    }`;
  }, [auxiliarySidebarExpanded]);

  return {
    // Estados
    mainSidebarExpanded,
    auxiliarySidebarExpanded,
    hasAuxiliarySidebar: hasAuxiliarySidebar(activeTab),
    
    // Handlers
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    
    // Clases
    getMainContentMargin,
    getMainSidebarClasses,
    getAuxiliarySidebarClasses
  };
};
