import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface UseAppSidebarProps {
  showWelcome: boolean;
  activeTab?: string;
}

/**
 * Hook para estado del sidebar en App.
 * Con un solo sidebar (MainSidebar), la lógica se simplifica.
 */
export const useAppSidebar = ({ showWelcome, activeTab }: UseAppSidebarProps) => {
  const { t } = useLanguage();
  const [sidebarVisible, setSidebarVisible] = useState(showWelcome);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverLocation, setHoverLocation] = useState<'none' | 'main' | 'content'>('none');
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showWelcome) {
      setSidebarVisible(true);
    }
  }, [showWelcome]);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setSidebarVisible(false);
    }, 500);
  }, [clearCloseTimeout]);

  const handleMainSidebarMouseEnter = useCallback(() => {
    setHoverLocation('main');
    setSidebarVisible(true);
    clearCloseTimeout();
  }, [clearCloseTimeout]);

  const handleMainSidebarMouseLeave = useCallback(() => {
    setHoverLocation('none');
    if (activeTab) {
      scheduleClose();
    }
  }, [scheduleClose, activeTab]);

  const handleContentMouseEnter = useCallback(() => {
    setHoverLocation('content');
  }, []);

  const handleContentMouseLeave = useCallback(() => {
    setHoverLocation('none');
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    clearCloseTimeout();
  }, [clearCloseTimeout]);

  const getMainContentClasses = useCallback((_isVisible?: boolean) => {
    return 'flex-1 min-w-0';
  }, []);

  const getIndicatorClasses = useCallback((_isVisible?: boolean) => {
    return 'opacity-0';
  }, []);

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
    isHovering,
    hoverLocation,
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    openSidebar,
    getMainContentClasses,
    getIndicatorClasses,
    getTabName
  };
};
