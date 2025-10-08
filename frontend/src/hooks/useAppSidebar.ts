import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface UseAppSidebarProps {
  showWelcome: boolean;
  activeTab?: string;
}

export const useAppSidebar = ({ showWelcome, activeTab }: UseAppSidebarProps) => {
  const { t } = useLanguage();
  const [sidebarVisible, setSidebarVisible] = useState(showWelcome);
  const [auxiliarySidebarVisible, setAuxiliarySidebarVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverLocation, setHoverLocation] = useState<'none' | 'main' | 'auxiliary' | 'content'>('none');
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Función para calcular si hay sidebar auxiliar visible (función normal, no useCallback)
  const hasAuxiliarySidebar = (tab?: string) => {
    if (!tab) return false;
    return tab === 'parameters' || tab.startsWith('parameters-') || 
           tab === 'reportes' || tab.startsWith('reportes-');
  };

  // Efecto para mantener el sidebar expandido cuando se muestra la ventana de bienvenida
  useEffect(() => {
    if (showWelcome) {
      setSidebarVisible(true);
      setAuxiliarySidebarVisible(true);
    }
  }, [showWelcome]);

  // Efecto para expandir el sidebar auxiliar cuando hay una pestaña activa
  useEffect(() => {
    if (activeTab && hasAuxiliarySidebar(activeTab)) {
      setAuxiliarySidebarVisible(true);
    } else if (!activeTab) {
      setAuxiliarySidebarVisible(false);
    }
    // NO forzar colapso si hay pestaña activa - dejar que el hover lo maneje
  }, [activeTab]);

  // Función para limpiar el timeout de cierre
  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Función para programar el cierre del sidebar
  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setSidebarVisible(false);
      setAuxiliarySidebarVisible(false); // SIEMPRE colapsar el sidebar auxiliar
    }, 500); // 0.5 segundos después de salir del sidebar
  }, [clearCloseTimeout]);

  // Función para manejar hover en el sidebar principal
  const handleMainSidebarMouseEnter = useCallback(() => {
    setHoverLocation('main');
    setSidebarVisible(true);
    setAuxiliarySidebarVisible(true);
    clearCloseTimeout();
  }, [clearCloseTimeout]);

  const handleMainSidebarMouseLeave = useCallback(() => {
    setHoverLocation('none');
    // Solo colapsar si hay una pestaña seleccionada
    if (activeTab) {
      scheduleClose();
    }
  }, [scheduleClose, activeTab]);

  // Función para manejar hover en el sidebar auxiliar
  const handleAuxiliarySidebarMouseEnter = useCallback(() => {
    setHoverLocation('auxiliary');
    // Solo colapsar el sidebar principal si no estamos en la ventana de bienvenida
    if (activeTab && !showWelcome) {
      setSidebarVisible(false);
    }
    setAuxiliarySidebarVisible(true);
    clearCloseTimeout();
  }, [clearCloseTimeout, activeTab, showWelcome]);

  const handleAuxiliarySidebarMouseLeave = useCallback(() => {
    setHoverLocation('none');
    // Solo colapsar si no estamos en la ventana de bienvenida
    if (activeTab && !showWelcome) {
      scheduleClose();
    }
  }, [scheduleClose, activeTab, showWelcome]);

  // Función para manejar hover en el contenido principal
  const handleContentMouseEnter = useCallback(() => {
    setHoverLocation('content');
    // Colapsar ambos sidebars si hay una pestaña seleccionada
    if (activeTab) {
      setSidebarVisible(false);
      setAuxiliarySidebarVisible(false);
      clearCloseTimeout();
    }
  }, [clearCloseTimeout, activeTab]);

  const handleContentMouseLeave = useCallback(() => {
    setHoverLocation('none');
  }, []);

  // Función para abrir el sidebar manualmente
  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    setAuxiliarySidebarVisible(true);
    clearCloseTimeout();
  }, [clearCloseTimeout]);

  // Función para obtener las clases del contenido principal
  const getMainContentClasses = useCallback((isVisible: boolean) => {
    // No usar márgenes fijos, el flexbox se encargará del layout
    // El flexbox automáticamente ajustará el contenido cuando los sidebars cambien de tamaño
    return 'flex-1 min-w-0';
  }, []);

  // Función para obtener las clases del indicador
  const getIndicatorClasses = useCallback((isVisible: boolean) => {
    return isVisible ? 'opacity-100' : 'opacity-0';
  }, []);

  // Función para obtener el nombre de la pestaña
  const getTabName = useCallback((tabId: string) => {
    const tabNames: { [key: string]: string } = {
      'reportes': t('tabs.reports'),
      'reportes-dashboard': t('subtabs.dashboard'),
      'reportes-alertas': t('subtabs.alerts'),
      'reportes-mensajes': t('subtabs.messages'),
      'parameters': t('tabs.parameters'),
      'configuration': t('tabs.configuration'),
      'umbrales': t('tabs.configuration')
    };
    return tabNames[tabId] || tabId;
  }, [t]);

  return {
    sidebarVisible,
    auxiliarySidebarVisible,
    isHovering,
    hoverLocation,
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    openSidebar,
    getMainContentClasses,
    getIndicatorClasses,
    getTabName,
    hasAuxiliarySidebar
  };
};
