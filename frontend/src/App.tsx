// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect, startTransition, Suspense, forwardRef, useRef } from 'react';
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
  const systemParametersRef = useRef<{ handleTableChange: (table: string) => void; hasUnsavedChanges: () => boolean; handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void }>(null);

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

  // Función para convertir nombre de tabla a español
  const getTableNameInSpanish = (tableName: string): string => {
    const tableNames: { [key: string]: string } = {
      'pais': 'PAÍS',
      'empresa': 'EMPRESA',
      'fundo': 'FARM',
      'ubicacion': 'UBICACIÓN',
      'localizacion': 'LOCALIZACIÓN',
      'entidad': 'ENTIDAD',
      'tipo': 'TIPO',
      'nodo': 'NODO',
      'sensor': 'SENSOR',
      'metricasensor': 'MÉTRICA SENSOR',
      'metrica': 'MÉTRICA',
      'umbral': 'UMBRAL',
      'perfilumbral': 'PERFIL UMBRAL',
      'audit_log_umbral': 'AUDIT LOG UMBRAL',
      'criticidad': 'CRITICIDAD',
      'contacto': 'CONTACTO',
      'usuario': 'USUARIO',
      'usuarioperfil': 'USUARIO PERFIL',
      'perfil': 'PERFIL'
    };
    return tableNames[tableName] || tableName.toUpperCase();
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

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [paisesData, empresasData] = await Promise.all([
          JoySenseService.getPaises(),
          JoySenseService.getEmpresas()
        ]);

        if (paisesData) setPaises(paisesData);
        if (empresasData) setEmpresas(empresasData);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      }
    };

    loadInitialData();
  }, []);

  // Cargar datos dependientes cuando cambian los filtros
  useEffect(() => {
    const loadDependentData = async () => {
      // Implementar lógica de filtros dependientes si es necesario
    };

    loadDependentData();
  }, []);

  useEffect(() => {
    const loadFundos = async () => {
      try {
        const fundosData = await JoySenseService.getFundos();
        setFundos(fundosData || []);
      } catch (error) {
        console.error('Error cargando fundos:', error);
      }
    };

    loadFundos();
  }, []);

  useEffect(() => {
    const loadUbicaciones = async () => {
      try {
        const ubicacionesData = await JoySenseService.getUbicaciones();
        setUbicaciones(ubicacionesData || []);
      } catch (error) {
        console.error('Error cargando ubicaciones:', error);
      }
    };

    loadUbicaciones();
  }, []);

  useEffect(() => {
    const loadEntidades = async () => {
      try {
        const entidadesData = await JoySenseService.getEntidades();
        setEntidades(entidadesData || []);
      } catch (error) {
        console.error('Error cargando entidades:', error);
      }
    };

    loadEntidades();
  }, []);

// Función para verificar si hay cambios significativos en el formulario actual
  const hasSignificantChanges = () => {
    const currentTable = activeTab.startsWith('parameters-') ? activeTab.replace('parameters-', '') : '';
    
    // Solo verificar cambios si estamos en parámetros
    if (!currentTable || !activeTab.startsWith('parameters-')) {
      return false;
    }
    
    // Definir campos específicos para cada tabla que deben considerarse como "cambios"
    const getSignificantFields = (table: string): string[] => {
      switch (table) {
        case 'pais':
          return ['pais', 'paisabrev']; // Solo PAIS y ABREVIATURA
        case 'empresa':
          return ['empresa', 'empresaabrev'];
        case 'fundo':
          return ['fundo', 'fundoabrev'];
        case 'ubicacion':
          return ['ubicacion', 'ubicacionabrev'];
        case 'localizacion':
          return ['localizacion', 'localizacionabrev'];
        case 'entidad':
          return ['entidad', 'entidadabrev'];
        case 'nodo':
          return ['nodo', 'nodoabrev'];
        case 'sensor':
          return ['sensor', 'sensorabrev'];
        case 'metrica':
          return ['metrica', 'metricaabrev'];
        case 'tipo':
          return ['tipo', 'tipoabrev'];
        case 'medicion':
          return ['medicion', 'medicionabrev'];
        case 'umbral':
          return ['umbral', 'umbralabrev'];
        case 'alerta':
          return ['alerta', 'alertaabrev'];
        case 'usuario':
          return ['usuario', 'usuarioabrev'];
        case 'medio':
          return ['medio', 'medioabrev'];
        case 'contacto':
          return ['contacto', 'contactoabrev'];
        case 'metricasensor':
          return ['metricasensor', 'metricasensorabrev'];
        case 'perfilumbral':
          return ['perfilumbral', 'perfilumbralabrev'];
        case 'auditlogumbral':
          return ['auditlogumbral', 'auditlogumbralabrev'];
        case 'criticidad':
          return ['criticidad', 'criticidadabrev'];
        case 'status':
          return ['status', 'statusabrev'];
        default:
          return [];
      }
    };
    
    const significantFields = getSignificantFields(currentTable);
    
    // Verificar si hay cambios en los campos significativos
    const hasFormDataChanges = significantFields.some(field => {
      const value = currentFormData[field];
      return value !== null && value !== undefined && value !== '';
    });
    
    // Para formularios múltiples, verificar si hay datos
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
    return <LoginForm />;
  }

  // Función para obtener datos del formulario actual (si estamos en parámetros)
  const getCurrentFormData = () => {
    return currentFormData;
  };

  // Función para obtener datos múltiples actuales (si estamos en parámetros)
  const getCurrentMultipleData = () => {
    return currentMultipleData;
  };

  // Handler para recibir datos del formulario desde SystemParameters
  const handleFormDataChange = (formData: Record<string, any>, multipleData: any[]) => {
    setCurrentFormData(formData);
    setCurrentMultipleData(multipleData);
  };

  // Handler para recibir datos de formularios masivos desde SystemParameters
  const handleMassiveFormDataChange = (massiveFormData: Record<string, any>) => {
    setCurrentMassiveFormData(massiveFormData);
  };

// Handlers para cambios de pestaña
  const handleTabChange = (tab: string) => {
    
    // Navegación simple sin interceptores
    setActiveTab(tab);
    setShowWelcomeIntegrated(false);
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
    // Manejar sub-rutas de configuración - orden específico primero
    if (activeTab.startsWith('parameters-')) {
      const parameterTab = activeTab.replace('parameters-', '');
      switch (parameterTab) {
        case 'pais':
        case 'empresa':
        case 'fundo':
        case 'ubicacion':
        case 'entidad':
        case 'nodo':
        case 'sensor':
        case 'metrica':
        case 'tipo':
        case 'medicion':
        case 'umbral':
        case 'alerta':
        case 'usuario':
        case 'medio':
        case 'contacto':
        case 'localizacion':
        case 'metricasensor':
        case 'perfilumbral':
        case 'auditlogumbral':
        case 'criticidad':
        case 'status':
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
        default:
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

  const layoutContent = (
    <div className="h-screen bg-gray-50 dark:bg-black overflow-hidden">
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
            <div className="h-16 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-neutral-400 font-mono">
                  JOYSENSE APP / <span className={
                    activeTab === 'parameters' || activeTab?.startsWith('parameters-')
                      ? 'text-orange-500' // Naranja para Parámetros
                      : activeTab === 'reportes' || activeTab?.startsWith('reportes-')
                      ? 'text-green-500' // Verde para Reportes
                      : activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')
                      ? 'text-blue-500' // Azul para Configuración
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
                          const reporteTab = activeTab.replace('reportes-', '');
                          const reporteNames: { [key: string]: string } = {
                            'dashboard': t('subtabs.dashboard'),
                            'alertas': t('subtabs.alerts'),
                            'mensajes': t('subtabs.messages')
                          };
                          return `${t('tabs.reports')} / ${reporteNames[reporteTab] || reporteTab.toUpperCase()}`;
                        })()
                      : activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')
                      ? t('tabs.configuration')
                      : activeTab?.toUpperCase() || 'OVERVIEW'
                    }
                  </span>
                </div>
                
                {/* Dashboard Filters - Solo mostrar en Dashboard */}
                {(activeTab === 'dashboard' || activeTab === 'reportes-dashboard') && (
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
                <UserControls />
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
