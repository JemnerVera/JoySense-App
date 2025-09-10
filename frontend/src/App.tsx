import React, { useState, useEffect, startTransition, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FilterProvider, useFilters } from './contexts/FilterContext';
import { AlertasFilterProvider } from './contexts/AlertasFilterContext';
import ReportesAlertasWrapper from './components/ReportesAlertasWrapper';
import LoginForm from './components/LoginForm';
import SidebarContainer from './components/sidebar/SidebarContainer';
import { useMainContentLayout } from './hooks/useMainContentLayout';
// import { DynamicHierarchy } from './components/Dashboard';
import { SystemParametersLazy, ConfigurationLazy, UmbralesMainLazy, DashboardLazy } from './components/LazyComponents';
import MensajesDashboard from './components/Umbrales/MensajesDashboard';
import { JoySenseService } from './services/backend-api';
import { Pais, Empresa } from './types';
// import { SkipLink } from './components/Accessibility';
import { ResponsiveContainer } from './components/ResponsiveDesign';
import { STYLES_CONFIG } from './config/styles';
import { UserHeader } from './components/UserHeader';
import { useAppSidebar } from './hooks/useAppSidebar';

const AppContentInternal: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { } = useFilters();

  // Estados para el dashboard
  const [dashboardSelectedFundo, setDashboardSelectedFundo] = useState<any>(null);
  const [dashboardSelectedEntidad, setDashboardSelectedEntidad] = useState<any>(null);
  const [dashboardSelectedUbicacion, setDashboardSelectedUbicacion] = useState<any>(null);
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');

  // Handler para filtros del dashboard desde DashboardFilters
  const handleDashboardFiltersChange = (filters: {
    entidadId: number | null;
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  }) => {
    console.log('🔍 App: Dashboard filters changed:', filters);
    
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
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update'>('status');

  // Estados para datos
  const [paises, setPaises] = useState<Pais[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [entidades, setEntidades] = useState<any[]>([]);

  // Estados para la aplicación
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showWelcomeIntegrated, setShowWelcomeIntegrated] = useState<boolean>(true);

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

  // Handlers para cambios de pestaña
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowWelcomeIntegrated(false);
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    // Cambiar el activeTab para que incluya el prefijo parameters-
    // Usar startTransition para evitar el error de Suspense
    startTransition(() => {
      setActiveTab(`parameters-${table}`);
    });
  };

  const handleSubTabChange = (subTab: 'status' | 'insert' | 'update' | 'copy') => {
    setActiveSubTab(subTab as 'status' | 'insert' | 'update');
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
            <SystemParametersLazy 
              selectedTable={parameterTab}
              onTableSelect={handleTableSelect}
              activeSubTab={activeSubTab}
              onSubTabChange={handleSubTabChange}
              activeTab={activeTab}
            />
          );
        default:
          return (
            <SystemParametersLazy 
              selectedTable={parameterTab}
              onTableSelect={handleTableSelect}
              activeSubTab={activeSubTab}
              onSubTabChange={handleSubTabChange}
              activeTab={activeTab}
            />
          );
      }
    }

    // Manejar sub-rutas de reportes
    if (activeTab.startsWith('reportes-')) {
      const reporteTab = activeTab.replace('reportes-', '');
      switch (reporteTab) {
        case 'dashboard':
          return (
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
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
        case 'alertas':
          return <UmbralesMainLazy />;
        case 'mensajes':
          return <MensajesDashboard />;
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Reportes</h2>
            <p className="text-gray-300">Selecciona una subpestaña para continuar</p>
          </div>
        </div>
      );
    }

    if (activeTab === 'parameters') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-2xl font-bold text-white">Seleccionar parametro</h2>
            </div>
            <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-gray-300">Selecciona una tabla del menú lateral para continuar</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
          <p className="text-gray-300">Bienvenido al sistema de monitoreo</p>
        </div>
      </div>
    );
  };

  const layoutContent = (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
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
        />

        {/* Área principal con header fijo y contenido scrolleable */}
        <div 
          className={`${getMainContentClasses(sidebarVisible)} bg-gray-900 flex-1`}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
        >
        {/* Header fijo (freeze pane) - Solo mostrar si no es ventana de bienvenida */}
        {!showWelcomeIntegrated && (
          <div className="flex-shrink-0">
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
              activeSubTab={activeSubTab}
              onSubTabChange={handleSubTabChange}
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

        {/* Contenido principal scrolleable */}
        <main 
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{ 
            maxHeight: showWelcomeIntegrated ? '100vh' : 'calc(100vh - 56px)',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Contenido de bienvenida o contenido dinámico */}
              {showWelcomeIntegrated ? (
                <div className="flex items-center justify-center h-full min-h-screen">
                  <div className="text-center max-w-2xl mx-auto px-6">
                    {/* Logo o icono de la aplicación */}
                    <div className="mb-12">
                      <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75S7 14 17 8z"/>
                        </svg>
                      </div>
                      
                      <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                        {t('welcome.title')}
                      </h1>
                      
                      <p className="text-2xl text-green-100 mb-12 font-light">
                        {t('welcome.subtitle')}
                      </p>
                      
                      {/* Instrucción con mejor diseño */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                        <div className="flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-green-300 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xl text-white font-semibold">
                            Selecciona una pestaña del menú lateral para comenzar
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
      </ReportesAlertasWrapper>
    );
  }

  return layoutContent;
};

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
            <AppContent />
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
