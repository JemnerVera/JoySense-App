import { useState, useCallback, useRef, useEffect } from 'react';

export const useSidebar = (initialOpen: boolean = false, activeTab?: string) => {
  const [sidebarVisible, setSidebarVisible] = useState(initialOpen); // Expandido si se muestra ventana de bienvenida
  const [isHovering, setIsHovering] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null); // Para manejar el timeout de cierre

  // Efecto para mantener el sidebar expandido cuando se muestra la ventana de bienvenida
  useEffect(() => {
    if (initialOpen) {
      setSidebarVisible(true);
    }
  }, [initialOpen]);

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
    }, 1000); // 1 segundo después de salir del sidebar
  }, [clearCloseTimeout]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setSidebarVisible(true);
    clearCloseTimeout(); // Cancelar cualquier cierre programado
  }, [clearCloseTimeout]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    // No programar cierre automático desde el área de detección
  }, []);

  const handleSidebarMouseEnter = useCallback(() => {
    setSidebarVisible(true);
    clearCloseTimeout(); // Cancelar cualquier cierre programado
  }, [clearCloseTimeout]);

  const handleSidebarMouseLeave = useCallback(() => {
    // Solo colapsar cuando se sale del sidebar Y hay una pestaña seleccionada
    if (activeTab) {
      scheduleClose();
    }
  }, [scheduleClose, activeTab]);

  // Función para abrir el sidebar manualmente
  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    clearCloseTimeout();
  }, [clearCloseTimeout]);

  // Función para obtener las clases CSS del contenido principal
  const getMainContentClasses = useCallback((sidebarVisible: boolean) => {
    const baseClasses = "transition-all duration-300 ease-in-out";
    
    // Sidebar siempre visible, ajustar según el estado de expansión
    if (sidebarVisible) {
      return `${baseClasses} ml-80`; // 20rem = 320px cuando expandido
    }
    return `${baseClasses} ml-16`; // 4rem = 64px cuando colapsado
  }, []);

  // Función para obtener las clases CSS del indicador
  const getIndicatorClasses = useCallback((sidebarVisible: boolean, activeTab: string) => {
    // Si no hay pestaña seleccionada, no mostrar indicador
    if (!activeTab) {
      return 'opacity-0';
    }
    
    // Si es una subpestaña, extraer la pestaña principal
    const mainTab = activeTab.split('-')[0];
    
    // Colores por pestaña
    const colorMap: { [key: string]: string } = {
      'reportes': 'bg-green-500',
      'parameters': 'bg-blue-500',
      'configuration': 'bg-gray-500'
    };
    
    const color = colorMap[mainTab] || 'bg-gray-500';
    
    if (sidebarVisible) {
      return `${color} opacity-0`;
    }
    return `${color} opacity-100`;
  }, []);

  // Función para obtener el nombre de la pestaña
  const getTabName = useCallback((activeTab: string) => {
    // Si es una subpestaña, extraer la pestaña principal
    const mainTab = activeTab.split('-')[0];
    
    const tabNames: { [key: string]: string } = {
      'reportes': 'Reportes',
      'parameters': 'Parámetros',
      'configuration': 'Configuración'
    };
    
    return tabNames[mainTab] || '';
  }, []);

  return {
    sidebarVisible,
    isHovering,
    handleMouseEnter,
    handleMouseLeave,
    handleSidebarMouseEnter,
    handleSidebarMouseLeave,
    openSidebar, // Agregar la nueva función a la lista de retorno
    getMainContentClasses,
    getIndicatorClasses,
    getTabName
  };
};
