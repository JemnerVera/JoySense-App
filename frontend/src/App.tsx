// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect, startTransition, Suspense, forwardRef, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FilterProvider, useFilters } from './contexts/FilterContext';
import ReportesAlertasWrapper from './components/ReportesAlertasWrapper';
import LoginForm from './components/LoginForm';
import SidebarContainer from './components/sidebar/SidebarContainer';
import { useMainContentLayout } from './hooks/useMainContentLayout';
// import { DynamicHierarchy } from './components/Dashboard';
import { DashboardLazy, SystemParametersLazyWithBoundary, MetricaPorLoteLazy, UmbralesPorLoteLazy, usePreloadCriticalComponents } from './components/LazyComponents';
import AlertasMain from './components/Reportes/AlertasMain';
import MensajesMain from './components/Reportes/MensajesMain';
import PermisosMain from './components/PermisosMain';
import ReglasMain from './components/ReglasMain';
import AlertasTableMain from './components/AlertasTableMain';
import { JoySenseService } from './services/backend-api';
import { Pais, Empresa } from './types';
// import { SkipLink } from './components/Accessibility';
import { UserHeader } from './components/UserHeader';
import { UserControls } from './components/header/UserControls';
import ConfigurationPanel from './components/ConfigurationPanel';
import { useAppSidebar } from './hooks/useAppSidebar';
import { useDataLossProtection } from './hooks/useDataLossProtection';
import { ModalProvider } from './contexts/ModalContext';
import SimpleAlertModal from './components/SimpleAlertModal';

// ============================================================================
// COMPONENT WRAPPERS
// ============================================================================

// Wrapper para SystemParameters con lazy loading
const SystemParametersWithSuspense = React.forwardRef<
  { handleTableChange: (table: string) => void; hasUnsavedChanges: () => boolean; handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void },
  {
    selectedTable: string;
    onTableSelect: (table: string) => void;
    activeSubTab: 'status' | 'insert' | 'update' | 'massive';
    onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
    activeTab: string;
    onFormDataChange: (formData: Record<string, any>, multipleData: any[]) => void;
    onMassiveFormDataChange?: (massiveFormData: Record<string, any>) => void;
    clearFormData?: boolean;
    themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple';
  }
>((props, ref) => (
  <SystemParametersLazyWithBoundary {...props} ref={ref} />
));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AppContentInternal: React.FC = () => {

  // ============================================================================
  // HOOKS & CONTEXTS
  // ============================================================================

  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { } = useFilters();

  // Preload componentes críticos
  usePreloadCriticalComponents();

  // Ref para SystemParameters
  const systemParametersRef = useRef<{ 
    handleTableChange: (table: string) => void; 
    hasUnsavedChanges: () => boolean; 
    handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
    handleSubTabChangeFromProtectedButton?: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  }>(null);
  
  // Ref para PermisosMain
  const permisosMainRef = useRef<{ hasUnsavedChanges: () => boolean; handleTabChange: (tab: 'status' | 'insert' | 'update') => void } | null>(null);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Estados para el dashboard
  const [dashboardSelectedFundo, setDashboardSelectedFundo] = useState<any>(null);
  const [dashboardSelectedEntidad, setDashboardSelectedEntidad] = useState<any>(null);
  const [dashboardSelectedUbicacion, setDashboardSelectedUbicacion] = useState<any>(null);
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');

  // Estados para datos del formulario (para protección de datos)
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>({});
  const [currentMultipleData, setCurrentMultipleData] = useState<any[]>([]);
  const [currentMassiveFormData, setCurrentMassiveFormData] = useState<Record<string, any>>({});
  const [clearFormData, setClearFormData] = useState<boolean>(false);

  // Hook para protección de datos (debe estar antes de cualquier return condicional)
  // Hook para protección de datos - DESACTIVADO TEMPORALMENTE
  // const {
  //   modalState,
  //   checkTabChange,
  //   confirmAction,
  //   cancelAction: cancelDataLossAction
  // } = useDataLossProtection();

  // Hook para interceptación de cambios - DESACTIVADO TEMPORALMENTE
  // const {
  //   registerChangeDetector,
  //   interceptSubTabChange,
  //   interceptParameterChange,
  //   interceptTabChange,
  //   getPendingChangeInfo
  // } = useChangeInterceptor();

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Handler para filtros del dashboard desde DashboardFilters
  const handleDashboardFiltersChange = (filters: {
    entidadId: number | null;
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  }) => {
    
    // Encontrar la entidad y ubicación por ID
    const entidad = entidades.find(e => e.entidadid === filters.entidadId);
    const ubicacion = ubicaciones.find(u => u.ubicacionid === filters.ubicacionId);
    
    setDashboardSelectedEntidad(entidad || null);
    setDashboardSelectedUbicacion(ubicacion || null);
    setDashboardStartDate(filters.startDate);
    setDashboardEndDate(filters.endDate);
  };

  // Estados para parámetros
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update' | 'massive'>('status');
  
  // Estados para Dashboard (Reportes)
  const [dashboardSubTab, setDashboardSubTab] = useState<'mapeo' | 'metrica' | 'umbrales'>('mapeo');

  // Función para convertir nombre de tabla a español (usa configuración centralizada)
  const getTableNameInSpanish = (tableName: string): string => {
    // Importar dinámicamente desde config si disponible
    try {
      const { TABLES_CONFIG } = require('./config/tables.config');
      const config = TABLES_CONFIG[tableName];
      return config?.displayName?.toUpperCase() || tableName.toUpperCase();
    } catch {
      return tableName.toUpperCase();
    }
  };

  // Estados para datos
  const [paises, setPaises] = useState<Pais[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [entidades, setEntidades] = useState<any[]>([]);

  // Estados para la aplicación
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showWelcomeIntegrated, setShowWelcomeIntegrated] = useState<boolean>(true);

  // Sincronizar dashboardSubTab con activeTab
  useEffect(() => {
    if (activeTab.startsWith('reportes-dashboard-')) {
      const subTab = activeTab.replace('reportes-dashboard-', '') as 'mapeo' | 'metrica' | 'umbrales';
      if (subTab === 'mapeo' || subTab === 'metrica' || subTab === 'umbrales') {
        setDashboardSubTab(subTab);
      }
    } else if (activeTab === 'reportes-dashboard') {
      // Si solo es 'reportes-dashboard' sin subTab, establecer 'mapeo' por defecto
      setDashboardSubTab('mapeo');
    }
  }, [activeTab]);

  // Hook para el layout del sidebar
  const {
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
    getMainContentClasses,
    getIndicatorClasses,
    hasAuxiliarySidebar
  } = useAppSidebar({ showWelcome: showWelcomeIntegrated, activeTab });

  // Hook para el layout del contenido principal
  const { } = useMainContentLayout({ 
    showWelcome: showWelcomeIntegrated, 
    activeTab 
  });

  // Cargar todos los datos iniciales en un solo useEffect
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [paisesData, empresasData, fundosData, ubicacionesData, entidadesData] = await Promise.all([
          JoySenseService.getPaises(),
          JoySenseService.getEmpresas(),
          JoySenseService.getFundos(),
          JoySenseService.getUbicaciones(),
          JoySenseService.getEntidades()
        ]);

        if (paisesData) setPaises(paisesData);
        if (empresasData) setEmpresas(empresasData);
        if (fundosData) setFundos(fundosData);
        if (ubicacionesData) setUbicaciones(ubicacionesData);
        if (entidadesData) setEntidades(entidadesData);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      }
    };

    loadAllData();
  }, []);

  // Función para verificar si hay cambios significativos en el formulario actual
  const hasSignificantChanges = () => {
    // Solo verificar cambios si estamos en parámetros
    if (!activeTab.startsWith('parameters-')) return false;
    
    // Verificar si hay datos en el formulario (excluyendo campos de sistema)
    const systemFields = ['statusid', 'usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'];
    const hasFormDataChanges = Object.entries(currentFormData).some(([key, value]) => 
      !systemFields.includes(key) && value !== null && value !== undefined && value !== ''
    );
    
    // Verificar si hay datos múltiples
    const hasMultipleDataChanges = currentMultipleData.length > 0;

    return hasFormDataChanges || hasMultipleDataChanges;
  };

  // Registrar la función de detección de cambios - DESACTIVADO TEMPORALMENTE
  // useEffect(() => {
  //   registerChangeDetector(() => {
  //     return hasSignificantChanges();
  //   });
  // }, [registerChangeDetector, hasSignificantChanges]);

  // Resetear el flag de limpieza después de usarlo
  useEffect(() => {
    if (clearFormData) {
      setClearFormData(false);
    }
  }, [clearFormData]);

  // Handler para recibir datos del formulario desde SystemParameters
  // IMPORTANTE: useCallback debe estar ANTES de cualquier return condicional
  // Usar useCallback para evitar recreaciones que causen loops infinitos
  const handleFormDataChange = useCallback((formData: Record<string, any>, multipleData: any[]) => {
    setCurrentFormData(formData);
    setCurrentMultipleData(multipleData);
  }, []);

  // Handler para recibir datos de formularios masivos desde SystemParameters
  const handleMassiveFormDataChange = useCallback((massiveFormData: Record<string, any>) => {
    setCurrentMassiveFormData(massiveFormData);
  }, []);


  // Handler para cambios de pestaña de ALERTAS
  const handleAlertasReglaChange = (subTab: 'status' | 'insert' | 'update') => {
    setActiveSubTab(subTab);
    startTransition(() => {
      setActiveTab(`alertas-regla-${subTab}`);
    });
  };

  // Función para obtener datos del formulario actual (si estamos en parámetros)
  const getCurrentFormData = () => {
    return currentFormData;
  };

  // Función para obtener datos múltiples actuales (si estamos en parámetros)
  const getCurrentMultipleData = () => {
    return currentMultipleData;
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar login si no hay usuario autenticado
  if (!user) {
    return <LoginForm activeTab={activeTab} />;
  }


// Handlers para cambios de pestaña
  const handleTabChange = (tab: string) => {
    console.log('[App] handleTabChange llamado:', { tab, activeTab });
    
    // Si cambiamos a permisos, inicializar activeSubTab a 'status'
    if (tab === 'permisos' && activeTab !== 'permisos') {
      setActiveSubTab('status');
    }
    
    // Navegación simple sin interceptores
    setActiveTab(tab);
    setShowWelcomeIntegrated(false);
    console.log('[App] activeTab actualizado a:', tab);
  };

  const handleTableSelect = (table: string) => {
    
    // Cambio directo sin validación (la validación se hace en ProtectedParameterButton)
    setSelectedTable(table);
    setActiveSubTab('status');
    startTransition(() => {
      setActiveTab(`parameters-${table}`);
    });
  };

  const handleSubTabChange = (subTab: 'status' | 'insert' | 'update' | 'massive') => {
    setActiveSubTab(subTab as 'status' | 'insert' | 'update' | 'massive');
  };

  // Handler para cambiar el subTab del Dashboard
  const handleDashboardSubTabChange = (subTab: 'mapeo' | 'metrica' | 'umbrales') => {
    setDashboardSubTab(subTab);
    startTransition(() => {
      setActiveTab(`reportes-dashboard-${subTab}`);
    });
  };

  // Handlers para el dashboard
  const handleDashboardFundoChange = (fundo: any) => {
    setDashboardSelectedFundo(fundo);
    setDashboardSelectedEntidad(null);
    setDashboardSelectedUbicacion(null);
  };

  const handleDashboardEntidadChange = (entidad: any) => {
    setDashboardSelectedEntidad(entidad);
  };

  const handleDashboardUbicacionChange = (ubicacion: any) => {
    setDashboardSelectedUbicacion(ubicacion);
  };

  const handleDashboardDateFilter = (startDate: string, endDate: string) => {
    setDashboardStartDate(startDate);
    setDashboardEndDate(endDate);
  };

  const handleDashboardReset = () => {
    setDashboardSelectedFundo(null);
    setDashboardSelectedEntidad(null);
    setDashboardSelectedUbicacion(null);
    setDashboardStartDate('');
    setDashboardEndDate('');
  };

  // Handlers para filtros globales
  const handlePaisChange = (pais: Pais) => {
    // Implementar lógica de cambio de país
  };

  const handleEmpresaChange = (empresa: Empresa) => {
    // Implementar lógica de cambio de empresa
  };

  const renderContent = () => {
    // Manejar sub-rutas de configuración (parámetros del sistema)
    if (activeTab.startsWith('parameters-')) {
      const parameterTab = activeTab.replace('parameters-', '');
      return (
        <SystemParametersWithSuspense 
          ref={systemParametersRef}
          selectedTable={parameterTab}
          onTableSelect={handleTableSelect}
          activeSubTab={activeSubTab}
          onSubTabChange={handleSubTabChange}
          activeTab={activeTab}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
          clearFormData={clearFormData}
        />
      );
    }

    // Manejar sub-rutas de reportes
    if (activeTab.startsWith('reportes-')) {
      const reporteTab = activeTab.replace('reportes-', '');
      
      // Manejar sub-tabs del Dashboard
      if (reporteTab.startsWith('dashboard-')) {
        const dashboardSubTab = reporteTab.replace('dashboard-', '');
        switch (dashboardSubTab) {
          case 'mapeo':
          return (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando Mapeo de Nodos...</p>
                </div>
              </div>
            }>
              <DashboardLazy
                selectedPais={null}
                selectedEmpresa={null}
                selectedFundo={dashboardSelectedFundo}
                selectedEntidad={dashboardSelectedEntidad}
                selectedUbicacion={dashboardSelectedUbicacion}
                startDate={dashboardStartDate}
                endDate={dashboardEndDate}
                onFundoChange={handleDashboardFundoChange}
                onEntidadChange={handleDashboardEntidadChange}
                onUbicacionChange={handleDashboardUbicacionChange}
                onDateFilter={handleDashboardDateFilter}
                onResetFilters={handleDashboardReset}
              />
            </Suspense>
          );
          case 'metrica':
            return (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando Métrica por Lote...</p>
                  </div>
                </div>
              }>
                <MetricaPorLoteLazy />
              </Suspense>
            );
          case 'umbrales':
            return (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando Umbrales por Lote...</p>
                  </div>
                </div>
              }>
                <UmbralesPorLoteLazy />
              </Suspense>
            );
          default:
            // Si solo es 'dashboard' sin subTab, redirigir a 'mapeo' por defecto
            if (reporteTab === 'dashboard') {
              startTransition(() => {
                setActiveTab('reportes-dashboard-mapeo');
              });
              return null;
            }
        }
      }
      
      switch (reporteTab) {
        case 'dashboard':
          // Redirigir a mapeo por defecto
          startTransition(() => {
            setActiveTab('reportes-dashboard-mapeo');
          });
          return null;
        case 'alertas':
          return <AlertasMain />;
        case 'mensajes':
          return <MensajesMain />;
        default:
          return (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Reporte</h2>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-300">Reporte component - Funcionalidad en desarrollo</p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Fundo seleccionado: {dashboardSelectedFundo?.nombre || 'Ninguno'}</p>
                  <p>Entidad seleccionada: {dashboardSelectedEntidad?.nombre || 'Ninguna'}</p>
                  <p>Ubicación seleccionada: {dashboardSelectedUbicacion?.nombre || 'Ninguna'}</p>
                  <p>Rango de fechas: {dashboardStartDate} - {dashboardEndDate}</p>
                </div>
              </div>
            </div>
          );
      }
    }
    
    if (activeTab === 'reportes') {
  return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono tracking-wider">{t('tabs.reports')}</h2>
              <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">{t('forms.select_subtab')}</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'parameters') {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h2 className="text-2xl font-bold text-orange-500 font-mono tracking-wider">{t('tabs.parameters')}</h2>
              </div>
              <p className="text-neutral-300 font-mono tracking-wider">{t('forms.select_option')}</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'umbrales') {
      return (
        <div className="p-6 bg-gray-50 dark:bg-black min-h-screen">
          <ConfigurationPanel />
        </div>
      );
    }


    // Manejar sub-rutas de ALERTAS
    if (activeTab.startsWith('alertas-regla-') && !activeTab.startsWith('alertas-regla_')) {
      const alertasSubTab = activeTab.replace('alertas-regla-', '') as 'status' | 'insert' | 'update';
      return (
        <ReglasMain
          activeSubTab={alertasSubTab || 'status'}
          onSubTabChange={handleAlertasReglaChange}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    // Manejar sub-rutas de ALERTAS para tablas relacionadas (regla_objeto, regla_umbral, regla_perfil)
    if (activeTab.startsWith('alertas-regla_objeto-')) {
      const alertasSubTab = activeTab.replace('alertas-regla_objeto-', '') as 'status' | 'insert' | 'update';
      return (
        <AlertasTableMain
          tableName="regla_objeto"
          activeSubTab={alertasSubTab || 'status'}
          onSubTabChange={handleAlertasReglaChange}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    if (activeTab.startsWith('alertas-regla_umbral-')) {
      const alertasSubTab = activeTab.replace('alertas-regla_umbral-', '') as 'status' | 'insert' | 'update';
      return (
        <AlertasTableMain
          tableName="regla_umbral"
          activeSubTab={alertasSubTab || 'status'}
          onSubTabChange={handleAlertasReglaChange}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    if (activeTab.startsWith('alertas-regla_perfil-')) {
      const alertasSubTab = activeTab.replace('alertas-regla_perfil-', '') as 'status' | 'insert' | 'update';
      return (
        <AlertasTableMain
          tableName="regla_perfil"
          activeSubTab={alertasSubTab || 'status'}
          onSubTabChange={handleAlertasReglaChange}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    if (activeTab.startsWith('alertas-alerta_regla-')) {
      const alertasSubTab = activeTab.replace('alertas-alerta_regla-', '') as 'status' | 'insert' | 'update';
      return (
        <AlertasTableMain
          tableName="alerta_regla"
          activeSubTab={alertasSubTab || 'status'}
          onSubTabChange={handleAlertasReglaChange}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    if (activeTab === 'alertas') {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h2 className="text-2xl font-bold text-red-500 font-mono tracking-wider">{t('tabs.alerts')}</h2>
              </div>
              <p className="text-neutral-300 font-mono tracking-wider">{t('forms.select_option')}</p>
            </div>
          </div>
        </div>
      );
    }

    // Mostrar mensaje de selección cuando solo está en 'permisos' sin sub-tab
    if (activeTab === 'permisos') {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="text-2xl font-bold text-purple-500 font-mono tracking-wider">{t('tabs.permissions')}</h2>
              </div>
              <p className="text-neutral-300 font-mono tracking-wider">{t('forms.select_option')}</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'permisos-permiso') {
      return (
        <PermisosMain
          ref={permisosMainRef}
          activeSubTab={activeSubTab as 'status' | 'insert' | 'update'}
          onSubTabChange={(tab) => {
            setActiveSubTab(tab);
          }}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    // Manejar sub-rutas de PERMISOS (origen, fuente)
    if (activeTab.startsWith('permisos-')) {
      const permisosTable = activeTab.replace('permisos-', '');
      // Solo mostrar SystemParameters para origen y fuente
      if (permisosTable === 'origen' || permisosTable === 'fuente') {
        return (
          <SystemParametersWithSuspense 
            ref={systemParametersRef}
            selectedTable={permisosTable}
            onTableSelect={handleTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={handleSubTabChange}
            activeTab={activeTab}
            onFormDataChange={handleFormDataChange}
            onMassiveFormDataChange={handleMassiveFormDataChange}
            clearFormData={clearFormData}
            themeColor="purple"
          />
        );
      }
    }

    if (activeTab === 'dashboard') {
      return (
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Cargando Dashboard...</p>
            </div>
          </div>
        }>
          <DashboardLazy
            selectedPais={null}
            selectedEmpresa={null}
            selectedFundo={dashboardSelectedFundo}
            selectedEntidad={dashboardSelectedEntidad}
            selectedUbicacion={dashboardSelectedUbicacion}
            startDate={dashboardStartDate}
            endDate={dashboardEndDate}
            onFundoChange={handleDashboardFundoChange}
            onEntidadChange={handleDashboardEntidadChange}
            onUbicacionChange={handleDashboardUbicacionChange}
            onDateFilter={handleDashboardDateFilter}
            onResetFilters={handleDashboardReset}
          />
        </Suspense>
      );
    }

    // Contenido por defecto
  return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 font-mono tracking-wider">{t('welcome.subtitle')}</h2>
            <p className="text-neutral-300 font-mono tracking-wider">{t('welcome.instruction')}</p>
          </div>
        </div>
      </div>
    );
  };

  // Determinar el tema según la pestaña activa
  const getThemeClass = () => {
    if (activeTab === 'parameters' || activeTab?.startsWith('parameters-')) {
      return 'theme-orange';
    } else if (activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')) {
      return 'theme-blue';
    } else if (activeTab === 'permisos' || activeTab?.startsWith('permisos-')) {
      return 'theme-purple';
    } else if (activeTab === 'alertas' || activeTab?.startsWith('alertas-')) {
      return 'theme-red';
    } else {
      // Reportes/Dashboard - verde por defecto
      return 'theme-green';
    }
  };

  const layoutContent = (
    <div className={`h-screen bg-gray-50 dark:bg-black overflow-hidden ${getThemeClass()}`}>
      {/* Skip Link para accesibilidad */}
      {/* <SkipLink targetId="main-content">Saltar al contenido principal</SkipLink> */}
      
      <div className="flex h-full">
        
        {/* Sidebar colapsable */}
        <SidebarContainer
          showWelcome={showWelcomeIntegrated}
          activeTab={activeTab}
              onTabChange={handleTabChange}
          authToken={localStorage.getItem('authToken') || localStorage.getItem('userEmail') || ''}
              selectedTable={selectedTable}
              onTableSelect={handleTableSelect}
          activeSubTab={activeSubTab}
          onSubTabChange={handleSubTabChange}
          dashboardSubTab={dashboardSubTab}
          onDashboardSubTabChange={handleDashboardSubTabChange}
          formData={currentFormData}
          multipleData={currentMultipleData}
          massiveFormData={currentMassiveFormData}
          onPermisosSubTabChangeFromProtectedButton={
            // Solo pasar la función si estamos en permisos-origen o permisos-fuente
            (activeTab.startsWith('permisos-origen') || activeTab.startsWith('permisos-fuente'))
              ? systemParametersRef.current?.handleSubTabChangeFromProtectedButton
              : undefined
          }
        />

        {/* Área principal con header fijo y contenido scrolleable */}
        <div 
          className={`${getMainContentClasses(sidebarVisible)} bg-gray-50 dark:bg-black flex-1`}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
        >
        {/* Header fijo (freeze pane) - Solo mostrar si no es ventana de bienvenida */}
        {!showWelcomeIntegrated && (
          <div className="flex-shrink-0">
            {/* Tactical Header */}
            <div className={`h-16 bg-white dark:bg-neutral-800 border-b flex items-center justify-between px-6 ${
              activeTab === 'permisos' || activeTab?.startsWith('permisos-')
                ? 'border-purple-500 dark:border-purple-500'
                : activeTab === 'alertas' || activeTab?.startsWith('alertas-')
                ? 'border-red-500 dark:border-red-500'
                : activeTab === 'reportes' || activeTab?.startsWith('reportes-')
                ? 'border-green-500 dark:border-green-500'
                : activeTab === 'parameters' || activeTab?.startsWith('parameters-')
                ? 'border-orange-500 dark:border-orange-500'
                : activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')
                ? 'border-blue-500 dark:border-blue-500'
                : 'border-gray-200 dark:border-neutral-700'
            }`}>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-neutral-400 font-mono">
                  JOYSENSE APP / <span className={
                    activeTab === 'parameters' || activeTab?.startsWith('parameters-')
                      ? 'text-orange-500' // Naranja para Parámetros
                      : activeTab === 'reportes' || activeTab?.startsWith('reportes-')
                      ? 'text-green-500' // Verde para Reportes
                      : activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')
                      ? 'text-blue-500' // Azul para Configuración
                      : activeTab === 'permisos' || activeTab?.startsWith('permisos-')
                      ? 'text-purple-500' // Púrpura para Permisos
                      : activeTab === 'alertas' || activeTab?.startsWith('alertas-')
                      ? 'text-red-500' // Rojo para Alertas
                      : 'text-orange-500' // Naranja por defecto
                  }>
                    {activeTab === 'parameters' || activeTab?.startsWith('parameters-')
                      ? (() => {
                          let breadcrumb = t('tabs.parameters');
                          if (selectedTable) {
                            breadcrumb += ` / ${getTableNameInSpanish(selectedTable)}`;
                          }
                          if (activeSubTab) {
                            const subTabNames: { [key: string]: string } = {
                              'status': t('subtabs.status'),
                              'insert': t('subtabs.insert'),
                              'update': t('subtabs.update'),
                              'massive': t('subtabs.massive')
                            };
                            breadcrumb += ` / ${subTabNames[activeSubTab] || activeSubTab.toUpperCase()}`;
                          }
                          return breadcrumb;
                        })()
                      : activeTab === 'reportes' || activeTab?.startsWith('reportes-')
                      ? (() => {
                          if (activeTab === 'reportes') {
                            return t('tabs.reports');
                          }
                          // Manejar sub-tabs de dashboard (mapeo, metrica, umbrales)
                          if (activeTab.startsWith('reportes-dashboard-')) {
                            const subTab = activeTab.replace('reportes-dashboard-', '');
                            const subTabNames: { [key: string]: string } = {
                              'mapeo': 'MAPEO',
                              'metrica': 'MÉTRICA POR LOTE',
                              'umbrales': 'UMBRALES POR LOTE'
                            };
                            return `${t('tabs.reports')} / ${t('subtabs.dashboard')} / ${subTabNames[subTab] || subTab.toUpperCase()}`;
                          }
                          const reporteTab = activeTab.replace('reportes-', '');
                          const reporteNames: { [key: string]: string } = {
                            'dashboard': t('subtabs.dashboard'),
                            'alertas': t('subtabs.alerts'),
                            'mensajes': t('subtabs.messages')
                          };
                          return `${t('tabs.reports')} / ${reporteNames[reporteTab] || reporteTab.toUpperCase()}`;
                        })()
                      : activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')
                      ? ''
                      : activeTab === 'permisos' || activeTab?.startsWith('permisos-')
                      ? (() => {
                          let breadcrumb = `${t('tabs.permissions').toUpperCase()}`;
                          if (activeTab.startsWith('permisos-')) {
                            const permisosTable = activeTab.replace('permisos-', '');
                            if (permisosTable === 'permiso') {
                              breadcrumb += ` / ${t('parameters.tables.geography_permission').toUpperCase()}`;
                              if (activeSubTab) {
                                const subTabNames: { [key: string]: string } = {
                                  'status': t('subtabs.status'),
                                  'insert': t('subtabs.insert'),
                                  'update': t('subtabs.update')
                                };
                                breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                              }
                            } else if (permisosTable === 'origen') {
                              breadcrumb += ` / ${t('parameters.tables.origin').toUpperCase()}`;
                              if (activeSubTab) {
                                const subTabNames: { [key: string]: string } = {
                                  'status': t('subtabs.status'),
                                  'insert': t('subtabs.insert'),
                                  'update': t('subtabs.update')
                                };
                                breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                              }
                            } else if (permisosTable === 'fuente') {
                              breadcrumb += ` / ${t('parameters.tables.source').toUpperCase()}`;
                              if (activeSubTab) {
                                const subTabNames: { [key: string]: string } = {
                                  'status': t('subtabs.status'),
                                  'insert': t('subtabs.insert'),
                                  'update': t('subtabs.update')
                                };
                                breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                              }
                            }
                          }
                          return breadcrumb;
                        })()
                      : activeTab === 'alertas' || activeTab?.startsWith('alertas-')
                      ? (() => {
                          let breadcrumb = `${t('tabs.alerts').toUpperCase()}`;
                          // Determinar qué tabla de alertas está activa
                          if (activeTab.startsWith('alertas-regla-') && !activeTab.startsWith('alertas-regla_')) {
                            breadcrumb += ` / ${t('alerts.rule').toUpperCase()}`;
                            const subTab = activeTab.replace('alertas-regla-', '');
                            if (subTab) {
                              const subTabNames: { [key: string]: string } = {
                                'status': t('subtabs.status'),
                                'insert': t('subtabs.insert'),
                                'update': t('subtabs.update')
                              };
                              breadcrumb += ` / ${subTabNames[subTab]?.toUpperCase() || subTab.toUpperCase()}`;
                            }
                          } else if (activeTab.startsWith('alertas-regla_objeto-')) {
                            breadcrumb += ` / ${t('alerts.rule_object').toUpperCase()}`;
                            const subTab = activeTab.replace('alertas-regla_objeto-', '');
                            if (subTab) {
                              const subTabNames: { [key: string]: string } = {
                                'status': t('subtabs.status'),
                                'insert': t('subtabs.insert'),
                                'update': t('subtabs.update')
                              };
                              breadcrumb += ` / ${subTabNames[subTab]?.toUpperCase() || subTab.toUpperCase()}`;
                            }
                          } else if (activeTab.startsWith('alertas-regla_umbral-')) {
                            breadcrumb += ` / ${t('alerts.rule_threshold').toUpperCase()}`;
                            const subTab = activeTab.replace('alertas-regla_umbral-', '');
                            if (subTab) {
                              const subTabNames: { [key: string]: string } = {
                                'status': t('subtabs.status'),
                                'insert': t('subtabs.insert'),
                                'update': t('subtabs.update')
                              };
                              breadcrumb += ` / ${subTabNames[subTab]?.toUpperCase() || subTab.toUpperCase()}`;
                            }
                          } else if (activeTab.startsWith('alertas-regla_perfil-')) {
                            breadcrumb += ` / ${t('alerts.rule_profile').toUpperCase()}`;
                            const subTab = activeTab.replace('alertas-regla_perfil-', '');
                            if (subTab) {
                              const subTabNames: { [key: string]: string } = {
                                'status': t('subtabs.status'),
                                'insert': t('subtabs.insert'),
                                'update': t('subtabs.update')
                              };
                              breadcrumb += ` / ${subTabNames[subTab]?.toUpperCase() || subTab.toUpperCase()}`;
                            }
                          } else if (activeTab.startsWith('alertas-alerta_regla-')) {
                            breadcrumb += ` / ${t('alerts.rule_alert').toUpperCase()}`;
                            const subTab = activeTab.replace('alertas-alerta_regla-', '');
                            if (subTab) {
                              const subTabNames: { [key: string]: string } = {
                                'status': t('subtabs.status'),
                                'insert': t('subtabs.insert'),
                                'update': t('subtabs.update')
                              };
                              breadcrumb += ` / ${subTabNames[subTab]?.toUpperCase() || subTab.toUpperCase()}`;
                            }
                          }
                          return breadcrumb;
                        })()
                      : activeTab?.toUpperCase() || 'OVERVIEW'
                    }
                  </span>
                </div>
                
                {/* Dashboard Filters - Solo mostrar en Dashboard y Mapeo de Nodos */}
                {(activeTab === 'dashboard' || activeTab === 'reportes-dashboard' || activeTab === 'reportes-dashboard-mapeo') && (
                  <div className="flex items-center gap-4 ml-8">
                    <UserHeader 
                      activeTab={activeTab}
                      authToken={localStorage.getItem('authToken') || localStorage.getItem('userEmail') || ''}
                      paises={paises}
                      empresas={empresas}
                      selectedPais={null}
                      selectedEmpresa={null}
                      onPaisChange={handlePaisChange}
                      onEmpresaChange={handleEmpresaChange}
                      onResetFilters={handleDashboardReset}
                      selectedTable={selectedTable}
                      onTableSelect={handleTableSelect}
                      // Props para el dashboard
                      fundos={fundos}
                      ubicaciones={ubicaciones}
                      entidades={entidades}
                      selectedFundo={dashboardSelectedFundo}
                      selectedEntidad={dashboardSelectedEntidad}
                      selectedUbicacion={dashboardSelectedUbicacion}
                      onFundoChange={handleDashboardFundoChange}
                      onEntidadChange={handleDashboardEntidadChange}
                      onUbicacionChange={handleDashboardUbicacionChange}
                      startDate={dashboardStartDate}
                      endDate={dashboardEndDate}
                      onDateFilter={handleDashboardDateFilter}
                      onDashboardFiltersChange={handleDashboardFiltersChange}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-xs text-neutral-500 font-mono">
                  {t('header.last_update')} {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES')}
                </div>
                
                {/* User Controls - Siempre visibles */}
                <UserControls activeTab={activeTab} />
              </div>
            </div>
            </div>
        )}

        {/* Contenido principal scrolleable */}
        <main 
          id="main-content"
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ 
            maxHeight: showWelcomeIntegrated ? '100vh' : 'calc(100vh - 56px)',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Contenido de bienvenida o contenido dinámico */}
              {showWelcomeIntegrated ? (
                <div className="flex items-center justify-center h-full min-h-screen bg-white dark:bg-black">
                  <div className="text-center max-w-2xl mx-auto px-6">
                    {/* Logo táctico */}
                    <div className="mb-12">
                      <div className="w-32 h-32 bg-gray-200 dark:bg-neutral-900 border-2 border-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <img src="/Logo - icono.png" alt="JoySense" className="w-16 h-16" />
                      </div>
                      
                      <h1 className="text-5xl font-bold text-orange-500 mb-4 leading-tight font-mono tracking-wider">
                        {t('welcome.title')}
                      </h1>
                      
                      <p className="text-2xl text-gray-600 dark:text-neutral-300 mb-12 font-mono tracking-wider">
                        {t('welcome.subtitle')}
                      </p>
                      
                      {/* Instrucción con diseño táctico */}
                      <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-2xl p-8">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-xl text-gray-900 dark:text-white font-mono tracking-wider">
                            {t('welcome.instruction')}
                          </p>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                renderContent()
        )}
      </main>
          </div>
        </div>
      </div>
  );

  // Envolver con ReportesAlertasWrapper si estamos en reportes-alertas
  if (activeTab === 'reportes-alertas') {
    return (
      <ReportesAlertasWrapper>
        {layoutContent}
        {/* Modal de protección de datos - DESACTIVADO TEMPORALMENTE */}
        {/* {modalState && (
          <DataLossModal
            isOpen={modalState.isOpen}
            onConfirm={confirmAction}
            onCancel={cancelDataLossAction}
            currentContext={modalState.currentContext}
            targetContext={modalState.targetContext}
            contextType={modalState.contextType}
          />
        )} */}
        
        {/* Modal de confirmación de cambios - DESACTIVADO TEMPORALMENTE */}
        {/* {(() => {
          const changeInfo = getPendingChangeInfo();
          if (!changeInfo) return null;
          
          return (
            <ChangeConfirmationModal
              isOpen={changeInfo.isOpen}
              onConfirm={changeInfo.onConfirm}
              onCancel={changeInfo.onCancel}
              contextType={changeInfo.contextType}
              currentContext={changeInfo.currentContext}
              targetContext={changeInfo.targetContext}
            />
          );
        })()} */}
      </ReportesAlertasWrapper>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {layoutContent}
      {/* Modal de protección de datos - DESACTIVADO TEMPORALMENTE */}
      {/* {modalState && (
        <DataLossModal
          isOpen={modalState.isOpen}
          onConfirm={confirmAction}
          onCancel={cancelDataLossAction}
          currentContext={modalState.currentContext}
          targetContext={modalState.targetContext}
          contextType={modalState.contextType}
        />
      )} */}
      
      {/* Modal de confirmación de cambios - DESACTIVADO TEMPORALMENTE */}
      {/* {(() => {
        const changeInfo = getPendingChangeInfo();
        if (!changeInfo) return null;
        
        return (
          <ChangeConfirmationModal
            isOpen={changeInfo.isOpen}
            onConfirm={changeInfo.onConfirm}
            onCancel={changeInfo.onCancel}
            contextType={changeInfo.contextType}
            currentContext={changeInfo.currentContext}
            targetContext={changeInfo.targetContext}
          />
        );
      })()} */}
    </>
  );
};

// ============================================================================
// COMPONENT WRAPPERS
// ============================================================================

const AppContent: React.FC = () => {
  return (
    <FilterProvider>
      <AppContentInternal />
    </FilterProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <ModalProvider>
              <AppContent />
              <SimpleAlertModal />
            </ModalProvider>
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
