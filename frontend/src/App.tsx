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
import SystemParameters from './components/SystemParameters';
import AlertasMain from './components/Reportes/AlertasMain';
import MensajesMain from './components/Reportes/MensajesMain';
import MensajesDashboard from './components/Umbrales/MensajesDashboard';
import { JoySenseService } from './services/backend-api';
import { Pais, Empresa } from './types';
// import { SkipLink } from './components/Accessibility';
import { ResponsiveContainer } from './components/ResponsiveDesign';
import { STYLES_CONFIG } from './config/styles';
import { UserHeader } from './components/UserHeader';
import { UserControls } from './components/header/UserControls';
import { useAppSidebar } from './hooks/useAppSidebar';
import { useDataLossProtection } from './hooks/useDataLossProtection';
import DataLossModal from './components/DataLossModal';
import { useChangeInterceptor } from './hooks/useChangeInterceptor';
import ChangeConfirmationModal from './components/ChangeConfirmationModal';

// Wrapper para SystemParameters con Suspense
const SystemParametersWithSuspense: React.FC<{
  selectedTable: string;
  onTableSelect: (table: string) => void;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  activeTab: string;
  onFormDataChange: (formData: Record<string, any>, multipleData: any[]) => void;
  clearFormData?: boolean;
}> = (props) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Cargando...</span>
    </div>
  }>
    <SystemParameters {...props} />
  </Suspense>
);

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

  // Estados para datos del formulario (para protección de datos)
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>({});
  const [currentMultipleData, setCurrentMultipleData] = useState<any[]>([]);
  const [clearFormData, setClearFormData] = useState<boolean>(false);

  // Hook para protección de datos (debe estar antes de cualquier return condicional)
  const {
    modalState,
    checkTabChange,
    confirmAction,
    cancelAction: cancelDataLossAction
  } = useDataLossProtection();

  // Hook para interceptación de cambios
  const {
    registerChangeDetector,
    interceptSubTabChange,
    interceptParameterChange,
    interceptTabChange,
    getPendingChangeInfo
  } = useChangeInterceptor();

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
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update' | 'massive'>('status');

  // Función para convertir nombre de tabla a español
  const getTableNameInSpanish = (tableName: string): string => {
    const tableNames: { [key: string]: string } = {
      'pais': 'PAÍS',
      'empresa': 'EMPRESA',
      'fundo': 'FUNDO',
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
      'medio': 'MEDIO',
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

  // Registrar la función de detección de cambios
  useEffect(() => {
    registerChangeDetector(() => {
      // Función específica para detectar cambios según la tabla actual
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
      
      console.log('🔍 App: Change detection:', {
        currentTable,
        significantFields,
        currentFormData,
        hasFormDataChanges,
        hasMultipleDataChanges,
        result: hasFormDataChanges || hasMultipleDataChanges
      });
      
      return hasFormDataChanges || hasMultipleDataChanges;
    });
  }, [registerChangeDetector, currentFormData, currentMultipleData, activeTab]);

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

  // Handlers para cambios de pestaña
  const handleTabChange = (tab: string) => {
    console.log('🔄 App: Tab change requested:', { from: activeTab, to: tab });
    
    // Verificar si hay cambios sin guardar usando el hook
    const shouldBlock = checkTabChange({
      formData: getCurrentFormData(),
      selectedTable: activeTab.startsWith('parameters-') ? activeTab.replace('parameters-', '') : '',
      activeSubTab: 'status', // App no maneja subpestañas directamente
      multipleData: getCurrentMultipleData(),
      onConfirmAction: () => {
        console.log('🔄 App: Confirming tab change to:', tab);
        setActiveTab(tab);
        setShowWelcomeIntegrated(false);
      },
      onCancelAction: () => console.log('App: Tab change cancelled')
    }, tab);
    
    if (shouldBlock) {
      console.log('🔄 App: Tab change blocked, showing modal');
      return;
    }
    
    // Si no hay cambios sin guardar, proceder normalmente
    console.log('🔄 App: No changes, proceeding with tab change');
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

  const handleSubTabChange = (subTab: 'status' | 'insert' | 'update' | 'massive') => {
    console.log('🔄 App: SubTab change requested:', { from: activeSubTab, to: subTab });
    
    // Solo verificar cambios si estamos saliendo de 'insert' o 'massive'
    const shouldCheckChanges = activeSubTab === 'insert' || activeSubTab === 'massive';
    
    if (shouldCheckChanges) {
      // Interceptar el cambio usando el nuevo sistema
      const shouldBlock = interceptSubTabChange(subTab, {
        formData: getCurrentFormData(),
        selectedTable: activeTab.startsWith('parameters-') ? activeTab.replace('parameters-', '') : '',
        activeSubTab: activeSubTab,
        multipleData: getCurrentMultipleData(),
        onConfirmAction: () => {
          console.log('🔄 App: Confirming sub-tab change to:', subTab);
          // Limpiar los datos del formulario antes de cambiar
          setCurrentFormData({});
          setCurrentMultipleData([]);
          setClearFormData(true); // Activar limpieza en SystemParameters
          setActiveSubTab(subTab as 'status' | 'insert' | 'update' | 'massive');
        },
        onCancelAction: () => {
          console.log('🔄 App: Sub-tab change cancelled, staying in:', activeSubTab);
          // No hacer nada, quedarse en la subpestaña actual
        }
      });
      
      if (shouldBlock) {
        console.log('🔄 App: Sub-tab change blocked, showing modal');
        return;
      }
    }
    
    // Si no hay cambios sin guardar o no necesitamos verificar, proceder normalmente
    console.log('🔄 App: No changes, proceeding with sub-tab change');
    setActiveSubTab(subTab as 'status' | 'insert' | 'update' | 'massive');
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
              selectedTable={parameterTab}
              onTableSelect={handleTableSelect}
              activeSubTab={activeSubTab}
              onSubTabChange={handleSubTabChange}
              activeTab={activeTab}
              onFormDataChange={handleFormDataChange}
              clearFormData={clearFormData}
            />
          );
        default:
          return (
            <SystemParametersWithSuspense 
              selectedTable={parameterTab}
              onTableSelect={handleTableSelect}
              activeSubTab={activeSubTab}
              onSubTabChange={handleSubTabChange}
              activeTab={activeTab}
              onFormDataChange={handleFormDataChange}
              clearFormData={clearFormData}
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
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono tracking-wider">REPORTES</h2>
              <p className="text-neutral-300 font-mono tracking-wider">SELECCIONA UNA SUBPESTAÑA PARA CONTINUAR</p>
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
                <h2 className="text-2xl font-bold text-orange-500 font-mono tracking-wider">SELECCIONAR PARÁMETRO</h2>
              </div>
              <p className="text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DEL MENÚ LATERAL PARA CONTINUAR</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'umbrales') {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-blue-500 mb-4 font-mono tracking-wider">CONFIGURACIÓN</h2>
              <p className="text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DEL MENÚ LATERAL PARA CONTINUAR</p>
            </div>
          </div>
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
            <h2 className="text-2xl font-bold text-white mb-4 font-mono tracking-wider">SISTEMA DE MONITOREO</h2>
            <p className="text-neutral-300 font-mono tracking-wider">SELECCIONA UNA PESTAÑA DEL MENÚ LATERAL PARA COMENZAR</p>
          </div>
        </div>
      </div>
    );
  };

  const layoutContent = (
    <div className="h-screen bg-black overflow-hidden">
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
          className={`${getMainContentClasses(sidebarVisible)} bg-black flex-1`}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
        >
        {/* Header fijo (freeze pane) - Solo mostrar si no es ventana de bienvenida */}
        {!showWelcomeIntegrated && (
          <div className="flex-shrink-0">
            {/* Tactical Header */}
            <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="text-sm text-neutral-400 font-mono">
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
                      ? (selectedTable ? `PARÁMETROS / ${getTableNameInSpanish(selectedTable)}` : 'PARÁMETROS')
                      : activeTab === 'reportes' || activeTab?.startsWith('reportes-')
                      ? (() => {
                          if (activeTab === 'reportes') {
                            return 'REPORTES';
                          }
                          const reporteTab = activeTab.replace('reportes-', '');
                          const reporteNames: { [key: string]: string } = {
                            'dashboard': 'DASHBOARD',
                            'alertas': 'ALERTAS',
                            'mensajes': 'MENSAJES'
                          };
                          return `REPORTES / ${reporteNames[reporteTab] || reporteTab.toUpperCase()}`;
                        })()
                      : activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')
                      ? 'CONFIGURACIÓN'
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
                  ÚLTIMA ACTUALIZACIÓN: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES')}
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
          className="flex-1 overflow-y-auto"
          style={{ 
            maxHeight: showWelcomeIntegrated ? '100vh' : 'calc(100vh - 56px)',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Contenido de bienvenida o contenido dinámico */}
              {showWelcomeIntegrated ? (
                <div className="flex items-center justify-center h-full min-h-screen bg-black">
                  <div className="text-center max-w-2xl mx-auto px-6">
                    {/* Logo táctico */}
                    <div className="mb-12">
                      <div className="w-32 h-32 bg-neutral-900 border-2 border-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <img src="/Logo - icono.png" alt="JoySense" className="w-16 h-16" />
                      </div>
                      
                      <h1 className="text-5xl font-bold text-orange-500 mb-4 leading-tight font-mono tracking-wider">
                        BIENVENIDO A JOYSENSE APP
                      </h1>
                      
                      <p className="text-2xl text-neutral-300 mb-12 font-mono tracking-wider">
                        SISTEMA DE MONITOREO INTELIGENTE
                      </p>
                      
                      {/* Instrucción con diseño táctico */}
                      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-xl text-white font-mono tracking-wider">
                            SELECCIONA UNA PESTAÑA DEL MENÚ LATERAL PARA COMENZAR
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
        {/* Modal de protección de datos */}
        {modalState && (
          <DataLossModal
            isOpen={modalState.isOpen}
            onConfirm={confirmAction}
            onCancel={cancelDataLossAction}
            currentContext={modalState.currentContext}
            targetContext={modalState.targetContext}
            contextType={modalState.contextType}
          />
        )}
        
        {/* Modal de confirmación de cambios */}
        {(() => {
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
        })()}
      </ReportesAlertasWrapper>
    );
  }

  return (
    <>
      {layoutContent}
      {/* Modal de protección de datos */}
      {modalState && (
        <DataLossModal
          isOpen={modalState.isOpen}
          onConfirm={confirmAction}
          onCancel={cancelDataLossAction}
          currentContext={modalState.currentContext}
          targetContext={modalState.targetContext}
          contextType={modalState.contextType}
        />
      )}
      
      {/* Modal de confirmación de cambios */}
      {(() => {
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
      })()}
    </>
  );
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
