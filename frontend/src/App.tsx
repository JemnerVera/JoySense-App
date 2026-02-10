// ============================================================================
// IMPORTS
// ============================================================================
// Organized imports by category for better maintainability

// 1. React & Core
import React, { useState, useEffect, startTransition, Suspense, forwardRef, useRef, useCallback } from 'react';

// 2. Contexts (Providers & State Management)
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FilterProvider, useFilters } from './contexts/FilterContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { ModalProvider } from './contexts/ModalContext';

// 3. Features (Main business logic modules)
import { 
  // Reporting: Alertas, Mensajes, Umbrales
  AlertasMain, MensajesMain,
  // Rules: Gestión de reglas
  ReglasMain,
  // Permissions: Gestión de permisos
  PermisosMain, PermisosMainRef
} from './features';

// 4. Core Components (Essential UI)
import LoginForm from './components/core/LoginForm';
import ConfigurationPanel from './components/core/ConfigurationPanel';

// 5. Shared Components (Reusable UI)
import SimpleAlertModal from './components/shared/ui/modals/SimpleAlertModal';

// 6. Layout Components (Navigation & Structure)
import SidebarContainer from './components/sidebar/SidebarContainer';
import { SidebarConfirmModal } from './components/sidebar/SidebarConfirmModal';
import { UserHeader } from './components/UserHeader';
import { UserControls } from './components/header/UserControls';

// 7. Main Components (Page-level components)
import AlertasTableMain from './components/MainComponents/AlertasTableMain';
import ReportesAdminMain, { ReportesAdminMainRef } from './components/MainComponents/ReportesAdminMain';
import AgrupacionMain, { AgrupacionMainRef } from './components/MainComponents/AgrupacionMain';
import AjustesMain, { AjustesMainRef } from './components/MainComponents/AjustesMain';
import ReportesAlertasWrapper from './components/ReportesAlertasWrapper';

// 8. Lazy Loading & Utilities (from LazyComponents)
import { 
  // Lazy-loaded components with error boundaries
  SystemParametersLazyWithBoundary,
  NotificacionesMainLazyWithBoundary,
  UmbralesMainLazyWithBoundary,
  // Dashboards
  DashboardLazy,
  NodeStatusDashboardLazy, 
  AlertStatusDashboardLazy, 
  MedicionesDashboardLazy,
  // Lazy reporting utilities
  MetricaPorLoteLazy,
  UmbralesPorLoteLazy,
  // Utility hook for preloading
  usePreloadCriticalComponents 
} from './components/LazyComponents';

// 9. Hooks
import { useMainContentLayout } from './hooks/useMainContentLayout';
import { useAppSidebar } from './hooks/useAppSidebar';
import { useDataLossProtection } from './hooks/useDataLossProtection';

// 10. Services & Types
import { JoySenseService } from './services/backend-api';
import { Pais, Empresa } from './types';

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

const AppContentInternal: React.FC<{ 
  executeTabChangeRef?: React.MutableRefObject<((tab: string) => void) | null>
  activeTabRefShared?: React.MutableRefObject<string>
}> = ({ executeTabChangeRef, activeTabRefShared }) => {

  // ============================================================================
  // HOOKS & CONTEXTS
  // ============================================================================

  const { user, loading } = useAuth();
  const { t } = useLanguage();
  useFilters(); // Usar el hook aunque no necesitemos sus valores

  // Preload componentes críticos
  usePreloadCriticalComponents();
  
  // Ref para SystemParameters
  const systemParametersRef = useRef<{ 
    handleTableChange: (table: string) => void; 
    hasUnsavedChanges: () => boolean; 
    handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
    handleSubTabChangeFromProtectedButton?: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  }>(null);


  const notificacionesMainRef = useRef<{ 
    handleTableChange: (table: string) => void; 
    hasUnsavedChanges: () => boolean; 
    handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
    handleSubTabChangeFromProtectedButton?: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  }>(null);
  
  // Ref para PermisosMain
  const permisosMainRef = useRef<PermisosMainRef | null>(null);
  // Ref para ReportesAdminMain
  const reportesAdminMainRef = useRef<ReportesAdminMainRef | null>(null);
  // Ref para AgrupacionMain
  const agrupacionMainRef = useRef<AgrupacionMainRef | null>(null);
  // Ref para AjustesMain
  const ajustesMainRef = useRef<AjustesMainRef | null>(null);

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
  
  // Ref para rastrear si el cambio viene de handleTableSelect (para evitar que useEffect lo revierta)
  // Usar un timestamp para rastrear cuándo se hizo el cambio
  const tableChangeFromHandlerRef = useRef<{ table: string; timestamp: number } | null>(null);

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
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update' | 'massive' | 'asignar'>('status');
  
  // Ref para almacenar el selectedTable más reciente para REGLA
  // Esto evita problemas de closure cuando handleSubTabChange se llama después de un cambio de tabla
  const selectedTableRef = useRef<string>(selectedTable);
  
  // Actualizar el ref cuando selectedTable cambia
  useEffect(() => {
    selectedTableRef.current = selectedTable;
  }, [selectedTable]);
  
  // Estados para Dashboard (Reportes)
  const [dashboardSubTab, setDashboardSubTab] = useState<'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales'>('mediciones');

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
      const subTab = activeTab.replace('reportes-dashboard-', '') as 'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales';
      if (subTab === 'mediciones' || subTab === 'mapeo' || subTab === 'status-nodos' || subTab === 'status-alertas' || subTab === 'metrica' || subTab === 'umbrales') {
        setDashboardSubTab(subTab);
      }
    }
    // No setear automáticamente 'mediciones' cuando solo es 'reportes-dashboard'
    // Permitir que el usuario seleccione una opción
  }, [activeTab]);

  // Sincronizar selectedTable con activeTab para diferentes secciones
  useEffect(() => {
    // CRÍTICO: Para REGLA, NUNCA ejecutar este useEffect
    // handleTableSelect es la única fuente de verdad para REGLA
    if (activeTab.startsWith('configuracion-notificaciones-regla-')) {
      return;
    }
    
    // Extraer tabla de activeTab para diferentes secciones
    if (activeTab.startsWith('geografia-')) {
      const table = activeTab.replace('geografia-', '');
      if (table && table !== selectedTable) {
        setSelectedTable(table);
      }
    } else if (activeTab.startsWith('parametros-')) {
      const table = activeTab.replace('parametros-', '');
      if (table && table !== selectedTable) {
        setSelectedTable(table);
      }
    } else if (activeTab.startsWith('tabla-')) {
      const table = activeTab.replace('tabla-', '');
      if (table && table !== selectedTable) {
        setSelectedTable(table);
      }
    } else if (activeTab.startsWith('notificaciones-')) {
      const table = activeTab.replace('notificaciones-', '');
      if (table && table !== selectedTable) {
        setSelectedTable(table);
      }
    } else if (activeTab.startsWith('configuracion-dispositivos-')) {
      // Dividir en partes: ['configuracion', 'dispositivos', 'tipo', 'status']
      const parts = activeTab.split('-');
      // Operaciones válidas: status, insert, update, massive
      const validOperations = ['status', 'insert', 'update', 'massive'];
      // Si hay más de 3 partes y la última es una operación válida, excluirla
      if (parts.length > 3 && validOperations.includes(parts[parts.length - 1])) {
        const table = parts.slice(2, -1).join('-'); // 'tipo' (puede ser multi-palabra)
        if (table && table !== selectedTable) {
          setSelectedTable(table);
        }
      } else {
        // Sin operación, solo tabla
        const table = activeTab.replace('configuracion-dispositivos-', '');
        if (table && table !== selectedTable) {
          setSelectedTable(table);
        }
      }
    } else if (activeTab === 'configuracion-dispositivos') {
      // Si solo es 'configuracion-dispositivos' sin tabla, limpiar selectedTable
      if (selectedTable) {
        setSelectedTable('');
      }
    } else if (activeTab.startsWith('configuracion-usuarios-')) {
      // Dividir en partes: ['configuracion', 'usuarios', 'usuario', 'status']
      const parts = activeTab.split('-');
      // Operaciones válidas: status, insert, update, massive
      const validOperations = ['status', 'insert', 'update', 'massive'];
      // Si hay más de 3 partes y la última es una operación válida, excluirla
      if (parts.length > 3 && validOperations.includes(parts[parts.length - 1])) {
        const table = parts.slice(2, -1).join('-'); // 'usuario' (puede ser multi-palabra)
        if (table && table !== selectedTable) {
          setSelectedTable(table);
        }
      } else {
        // Sin operación, solo tabla
        const table = activeTab.replace('configuracion-usuarios-', '');
        if (table && table !== selectedTable) {
          setSelectedTable(table);
        }
      }
    } else if (activeTab === 'configuracion-usuarios') {
      // Si solo es 'configuracion-usuarios' sin tabla, limpiar selectedTable
      if (selectedTable) {
        setSelectedTable('');
      }
    } else if (activeTab.startsWith('configuracion-parametros-geo-')) {
      // Dividir en partes: ['configuracion', 'parametros', 'geo', 'pais', 'status']
      const parts = activeTab.split('-');
      // Operaciones válidas: status, insert, update, massive
      const validOperations = ['status', 'insert', 'update', 'massive'];
      // Si hay más de 4 partes (parametros-geo tiene 3 palabras) y la última es una operación válida, excluirla
      if (parts.length > 4 && validOperations.includes(parts[parts.length - 1])) {
        const table = parts.slice(3, -1).join('-'); // 'pais' (puede ser multi-palabra)
        if (table && table !== selectedTable) {
          setSelectedTable(table);
        }
      } else {
        // Sin operación, solo tabla
        const table = activeTab.replace('configuracion-parametros-geo-', '');
        if (table && table !== selectedTable) {
          setSelectedTable(table);
        }
      }
    } else if (activeTab === 'configuracion-parametros-geo') {
      // Si solo es 'configuracion-parametros-geo' sin tabla, limpiar selectedTable
      if (selectedTable) {
        setSelectedTable('');
      }
    } else if (activeTab.startsWith('configuracion-notificaciones-')) {
      // Caso especial: REGLA tiene un flujo especial con Sidebar 3 y 4
      // SOLUCIÓN RADICAL: Para REGLA, NUNCA sincronizar desde useEffect
      // handleTableSelect es la ÚNICA fuente de verdad para REGLA
      // Esto evita TODOS los conflictos con los 4 niveles de sidebars
      if (activeTab.startsWith('configuracion-notificaciones-regla-')) {
        // NO HACER NADA - handleTableSelect maneja TODO para REGLA
        // El useEffect NO debe interferir con REGLA en absoluto
        return;
      } else if (activeTab === 'configuracion-notificaciones-regla') {
        // Si solo es 'configuracion-notificaciones-regla' sin tabla específica, NO establecer selectedTable
        // Esto permite que se muestre ReglaSidebar (Sidebar 3) en lugar de ReglaOperationsSidebar (Sidebar 4)
        // Si selectedTable es una tabla de regla válida (regla, regla_perfil, regla_umbral, regla_objeto), mantenerla
        // Esto permite que cuando se hace clic en REGLA desde ReglaSidebar, se muestre el contenido principal
        if (selectedTable && (selectedTable === 'regla' || selectedTable === 'regla_perfil' || selectedTable === 'regla_umbral' || selectedTable === 'regla_objeto')) {
          // Mantener selectedTable para mostrar el contenido principal o ReglaOperationsSidebar
        } else if (selectedTable && selectedTable !== 'regla' && selectedTable !== 'regla_perfil' && selectedTable !== 'regla_umbral' && selectedTable !== 'regla_objeto') {
          // Limpiar selectedTable si no es una tabla de regla válida
          setSelectedTable('');
        }
      } else {
        // Para otras tablas de notificaciones, establecer selectedTable normalmente
        // Remover la operación si está incluida (status, insert, update, massive)
        const validOperations = ['status', 'insert', 'update', 'massive'];
        let table = activeTab.replace('configuracion-notificaciones-', '');
        
        // Si termina con una operación válida, removerla
        for (const op of validOperations) {
          if (table.endsWith(`-${op}`)) {
            table = table.replace(`-${op}`, '');
            break;
          }
        }
        
        if (table && table !== selectedTable) {
          setSelectedTable(table);
        }
      }
    } else if (activeTab === 'configuracion-notificaciones') {
      // Si solo es 'configuracion-notificaciones' sin tabla, limpiar selectedTable
      if (selectedTable) {
        setSelectedTable('');
      }
    } else if (activeTab.startsWith('configuracion-permisos-')) {
      const table = activeTab.replace('configuracion-permisos-', '');
      if (table && table !== selectedTable) {
        setSelectedTable(table);
      }
    } else if (activeTab === 'configuracion-permisos') {
      // Si solo es 'configuracion-permisos' sin tipo, limpiar selectedTable
      if (selectedTable) {
        setSelectedTable('');
      }
    } else if (activeTab.startsWith('permisos-')) {
      const table = activeTab.replace('permisos-', '');
      if (table && table !== selectedTable) {
        setSelectedTable(table);
      }
    }
  }, [activeTab, selectedTable]);

  // Sincronizar activeSubTab con activeTab para tablas de alertas
  // NO procesar si es de permisos-permiso, ya que permisos maneja su propio estado
  useEffect(() => {
    // Solo procesar alertas, NO permisos
    if ((activeTab.startsWith('alertas-regla-') || activeTab.startsWith('alertas-regla_') || activeTab.startsWith('alertas-alerta_regla-')) && !activeTab.startsWith('permisos-')) {
      // Extraer el subTab del activeTab
      let subTab: 'status' | 'insert' | 'update' | undefined;
      
      if (activeTab.startsWith('alertas-regla-') && !activeTab.startsWith('alertas-regla_')) {
        // Para alertas-regla-xxx
        subTab = activeTab.replace('alertas-regla-', '') as 'status' | 'insert' | 'update';
      } else if (activeTab.startsWith('alertas-regla_objeto-')) {
        // Para alertas-regla_objeto-xxx
        subTab = activeTab.replace('alertas-regla_objeto-', '') as 'status' | 'insert' | 'update';
      } else if (activeTab.startsWith('alertas-regla_umbral-')) {
        // Para alertas-regla_umbral-xxx
        subTab = activeTab.replace('alertas-regla_umbral-', '') as 'status' | 'insert' | 'update';
      } else if (activeTab.startsWith('alertas-regla_perfil-')) {
        // Para alertas-regla_perfil-xxx
        subTab = activeTab.replace('alertas-regla_perfil-', '') as 'status' | 'insert' | 'update';
      } else if (activeTab.startsWith('alertas-alerta_regla-')) {
        // Para alertas-alerta_regla-xxx
        subTab = activeTab.replace('alertas-alerta_regla-', '') as 'status' | 'insert' | 'update';
      }
      
      // Si se encontró un subTab válido, actualizar activeSubTab
      if (subTab && (subTab === 'status' || subTab === 'insert' || subTab === 'update')) {
        setActiveSubTab(subTab);
      } else {
        // Si no hay subTab, resetear a 'status'
        setActiveSubTab('status');
      }
    }
    
    // Manejar operaciones de REGLA (configuracion-notificaciones-regla-[tabla]-[operacion])
    // Solo procesar si NO es de alertas (ya se maneja arriba)
    if (activeTab.startsWith('configuracion-notificaciones-regla-') && !activeTab.startsWith('alertas-')) {
      // Extraer la operación del activeTab
      const afterRegla = activeTab.replace('configuracion-notificaciones-regla-', '');
      const parts = afterRegla.split('-');
      
      // Si hay una segunda parte, es la operación (status, insert, update, massive)
      if (parts.length > 1) {
        const reglaOperation = parts[1];
        if (reglaOperation && (reglaOperation === 'status' || reglaOperation === 'insert' || reglaOperation === 'update' || reglaOperation === 'massive')) {
          // Usar forma funcional para evitar loops - no incluir activeSubTab en dependencias
          setActiveSubTab((currentSubTab) => {
            if (currentSubTab !== reglaOperation) {
              return reglaOperation as 'status' | 'insert' | 'update' | 'massive';
            }
            return currentSubTab;
          });
        }
      }
    }
    
    // Manejar operaciones de AGRUPACIÓN
    // Ruta: agrupacion-[tabla]-[operacion] (ej: agrupacion-entidad-status)
    if (activeTab.startsWith('agrupacion-')) {
      const afterAgrupacion = activeTab.replace('agrupacion-', '');
      const parts = afterAgrupacion.split('-');
      const validOperations = ['status', 'insert', 'update', 'massive'];
      
      // Si hay más de una parte y la última es una operación válida, extraer operación
      if (parts.length > 1 && validOperations.includes(parts[parts.length - 1])) {
        const operation = parts[parts.length - 1] as 'status' | 'insert' | 'update' | 'massive';
        setActiveSubTab((currentSubTab) => {
          if (currentSubTab !== operation) {
            return operation;
          }
          return currentSubTab;
        });
      } else if (parts.length === 1) {
        // Si solo hay tabla, resetear a 'status'
        setActiveSubTab('status');
      }
    }
    
    // Manejar operaciones de DISPOSITIVOS, USUARIOS, PARAMETROS GEO
    // Rutas: configuracion-dispositivos-[tabla]-[operacion], configuracion-usuarios-[tabla]-[operacion], configuracion-parametros-geo-[tabla]-[operacion]
    if (activeTab.startsWith('configuracion-dispositivos-') || 
        activeTab.startsWith('configuracion-usuarios-') || 
        activeTab.startsWith('configuracion-parametros-geo-')) {
      const parts = activeTab.split('-');
      // Operaciones válidas: status, insert, update, massive
      const validOperations = ['status', 'insert', 'update', 'massive'];
      
      // Para dispositivos y usuarios: ['configuracion', 'dispositivos', 'tipo', 'status'] -> 4 partes, última es operación
      // Para parametros-geo: ['configuracion', 'parametros', 'geo', 'pais', 'status'] -> 5 partes, última es operación
      const minPartsForOperation = activeTab.startsWith('configuracion-parametros-geo-') ? 5 : 4;
      
      if (parts.length >= minPartsForOperation && validOperations.includes(parts[parts.length - 1])) {
        const operation = parts[parts.length - 1] as 'status' | 'insert' | 'update' | 'massive';
        setActiveSubTab((currentSubTab) => {
          if (currentSubTab !== operation) {
            return operation;
          }
          return currentSubTab;
        });
      } else {
        // Sin operación en la ruta, resetear a 'status' solo si no hay una operación válida ya establecida
        setActiveSubTab((currentSubTab) => {
          // Si ya hay una operación válida establecida y no hay operación en la ruta, mantenerla
          // Esto permite que cuando se selecciona solo la tabla, se mantenga la operación anterior
          if (validOperations.includes(currentSubTab)) {
            return currentSubTab;
          }
          return 'status';
        });
      }
    }
    
    // Si es permisos-permiso, NO resetear el activeSubTab aquí - dejarlo que se maneje por el callback onSubTabChange
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

  // Hook para el layout del contenido principal (obtiene handleContentMouseEnter de useSidebarLayout)
  // NOTA: Este hook se mantiene para compatibilidad, pero el nuevo sistema usa useSidebar directamente
  const { handleContentMouseEnter: handleContentMouseEnterFromLayout, handleContentMouseLeave: handleContentMouseLeaveFromLayout } = useMainContentLayout({ 
    showWelcome: showWelcomeIntegrated, 
    activeTab 
  });
  
  // Obtener el handler del nuevo sistema de sidebars
  const sidebar = useSidebar()

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

  // Handler interno para ejecutar el cambio de tab después de confirmar
  // IMPORTANTE: Debe estar ANTES de cualquier return condicional
  const executeTabChange = useCallback((tab: string) => {
    // Si cambiamos a permisos, inicializar activeSubTab a 'status'
    if (tab === 'permisos' && activeTab !== 'permisos') {
      setActiveSubTab('status');
    }
    
    // Si cambiamos entre tablas de alertas (regla, regla_objeto, regla_umbral, regla_perfil, alerta_regla)
    // y el tab ya incluye '-status', '-insert', o '-update', extraer el subTab
    // Si no incluye ninguno, resetear a 'status'
    if (tab.startsWith('alertas-regla') || tab.startsWith('alertas-alerta_regla')) {
      if (tab.endsWith('-status') || tab.endsWith('-insert') || tab.endsWith('-update')) {
        // El tab ya incluye el subTab, extraerlo
        const subTab = tab.split('-').pop() as 'status' | 'insert' | 'update';
        setActiveSubTab(subTab);
      } else {
        // El tab no incluye subTab, resetear a 'status'
        setActiveSubTab('status');
        // Si el tab no termina con '-status', agregarlo
        if (!tab.endsWith('-status')) {
          tab = `${tab}-status`;
        }
      }
    }
    
    // Navegación simple sin interceptores
    setActiveTab(tab);
    setShowWelcomeIntegrated(false);
  }, [activeTab]);
  
  // Exponer executeTabChange al ref para que SidebarProvider pueda usarlo
  // IMPORTANTE: Debe estar ANTES de cualquier return condicional
  useEffect(() => {
    if (executeTabChangeRef) {
      executeTabChangeRef.current = executeTabChange;
    }
  }, [executeTabChange, executeTabChangeRef]);

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

  // Ref para mantener el activeTab actual (para reversión cuando se cancela el modal)
  const activeTabRef = useRef(activeTab);
  
  // Actualizar ref cuando activeTab cambia
  useEffect(() => {
    activeTabRef.current = activeTab;
    // Sincronizar con el ref compartido si existe
    if (activeTabRefShared) {
      activeTabRefShared.current = activeTab;
    }
  }, [activeTab, activeTabRefShared]);

  // Handlers para cambios de pestaña
  const handleTabChange = (tab: string) => {
    // Guardar el activeTab actual antes de cualquier cambio
    const currentTab = activeTabRef.current;
    
    // Usar el sistema del sidebar para verificar cambios sin guardar
    // requestLeave muestra modal si hay cambios. Pasamos:
    // - tab: destino de la navegación
    // - currentTab: tab actual para comparar
    // - onRevert: callback si hay cambios (mantener en tab actual)
    // - onConfirm: callback cuando usuario confirma (ejecutar cambio real)
    sidebar.requestLeave(
      tab,
      currentTab,
      // onRevert: Si hay cambios, revertir activeTab al valor actual (no hacer nada, ya está en currentTab)
      () => {
        setActiveTab(currentTab);
        activeTabRef.current = currentTab;
        if (activeTabRefShared) {
          activeTabRefShared.current = currentTab;
        }
      },
      // onConfirm: Callback que se ejecuta cuando usuario confirma el cambio en el modal
      // o cuando no hay cambios. Ejecuta la navegación real.
      () => {
        setActiveTab(tab);
        activeTabRef.current = tab;
        if (activeTabRefShared) {
          activeTabRefShared.current = tab;
        }
        setShowWelcomeIntegrated(false);
      }
    );
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

  const handleTableSelect = (table: string) => {
    // Guardar el activeTab actual antes de cualquier cambio
    const currentTab = activeTabRef.current;
    
    // Calcular el nuevo activeTab que se generaría
    const geografiaTables = ['pais', 'empresa', 'fundo', 'ubicacion', 'entidad', 'entidad_localizacion'];
    const parametrosTables = ['origen', 'fuente', 'criticidad', 'tipo', 'umbral'];
    const permisosTables = ['permiso', 'usuario', 'perfil', 'usuarioperfil', 'contacto', 'correo'];
    const dispositivosTables = ['tipo', 'metrica', 'sensor', 'metricasensor'];
    const usuariosTables = ['usuario', 'correo', 'codigotelefono', 'contacto', 'perfil', 'usuarioperfil', 'usuario_canal'];
    const parametrosGeoTables = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion', 'asociacion'];
    const notificacionesTables = ['criticidad', 'umbral', 'regla'];
    
    let newActiveTab = '';
    if (activeTab.startsWith('configuracion-dispositivos') && dispositivosTables.includes(table)) {
      newActiveTab = `configuracion-dispositivos-${table}`;
    } else if (activeTab.startsWith('configuracion-usuarios') && usuariosTables.includes(table)) {
      newActiveTab = `configuracion-usuarios-${table}`;
    } else if (activeTab.startsWith('configuracion-parametros-geo') && parametrosGeoTables.includes(table)) {
      newActiveTab = `configuracion-parametros-geo-${table}`;
    } else if (activeTab.startsWith('configuracion-notificaciones') && notificacionesTables.includes(table)) {
      if (table === 'regla' && activeTab.startsWith('configuracion-notificaciones-regla')) {
        newActiveTab = 'configuracion-notificaciones-regla-regla';
      } else if (table === 'regla') {
        newActiveTab = 'configuracion-notificaciones-regla';
      } else {
        newActiveTab = `configuracion-notificaciones-${table}`;
      }
    } else if (table === 'entidad' || table === 'entidad_localizacion') {
      newActiveTab = `agrupacion-${table}`;
    } else if (geografiaTables.includes(table)) {
      newActiveTab = `geografia-${table}`;
    } else if (dispositivosTables.includes(table)) {
      newActiveTab = `configuracion-dispositivos-${table}`;
    } else if (usuariosTables.includes(table)) {
      newActiveTab = `configuracion-usuarios-${table}`;
    } else if (parametrosGeoTables.includes(table)) {
      newActiveTab = `configuracion-parametros-geo-${table}`;
    } else if (parametrosTables.includes(table)) {
      newActiveTab = `parametros-${table}`;
    } else if (permisosTables.includes(table)) {
      newActiveTab = `permisos-${table}`;
    } else if (notificacionesTables.includes(table)) {
      if (table === 'regla') {
        newActiveTab = 'configuracion-notificaciones-regla';
      } else {
        newActiveTab = `configuracion-notificaciones-${table}`;
      }
    } else if (table === 'regla' || table === 'regla_perfil' || table === 'regla_umbral' || table === 'regla_objeto') {
      newActiveTab = `configuracion-notificaciones-regla-${table}`;
    } else if (table === 'permisos-geo' || table === 'permisos-conf') {
      newActiveTab = `configuracion-permisos-${table}`;
    } else if (['sensor_valor_error', 'audit_log_umbral', 'msg_outbox'].includes(table)) {
      newActiveTab = `configuracion-reportes-administrador-${table}`;
    } else {
      newActiveTab = `tabla-${table}`;
    }
    
    // Función para ejecutar el cambio de tabla después de confirmar
    const executeTableChange = () => {
      setActiveSubTab('status');
      
      startTransition(() => {
      // PRIORIDAD: Verificar primero el contexto actual (activeTab) para determinar la sección
      // Esto evita conflictos cuando una tabla está en múltiples listas (ej: 'tipo' está en parametrosTables y dispositivosTables)
      if (activeTab.startsWith('configuracion-dispositivos') && dispositivosTables.includes(table)) {
        // Tabla de dispositivos seleccionada desde DispositivosSidebar
        setSelectedTable(table);
        setActiveTab(`configuracion-dispositivos-${table}`);
      } else if (activeTab.startsWith('configuracion-usuarios') && usuariosTables.includes(table)) {
        // Tabla de usuarios seleccionada desde UsuariosSidebar
        setSelectedTable(table);
        setActiveTab(`configuracion-usuarios-${table}`);
      } else if (activeTab.startsWith('configuracion-parametros-geo') && parametrosGeoTables.includes(table)) {
        // Tabla de parámetros geo seleccionada desde ParametrosGeoSidebar
        setSelectedTable(table);
        setActiveTab(`configuracion-parametros-geo-${table}`);
      } else if (activeTab.startsWith('configuracion-notificaciones') && notificacionesTables.includes(table)) {
        // Tabla de notificaciones seleccionada desde NotificacionesSidebar
        // Manejar caso especial de REGLA
        // IMPORTANTE: Si ya estamos en 'configuracion-notificaciones-regla' y se selecciona 'regla' desde ReglaSidebar,
        // actualizar a 'configuracion-notificaciones-regla-regla' para mostrar el contenido
        if (table === 'regla' && activeTab.startsWith('configuracion-notificaciones-regla')) {
          // Ya estamos en REGLA, actualizar para mostrar el contenido de la tabla 'regla'
          setSelectedTable('regla');
          setActiveTab('configuracion-notificaciones-regla-regla');
          setActiveSubTab('status');
        } else if (table === 'regla') {
          // Primera vez que se selecciona REGLA desde NotificacionesSidebar
          setSelectedTable('');
          setActiveTab('configuracion-notificaciones-regla');
          setActiveSubTab('status');
        } else {
          setSelectedTable(table);
          setActiveTab(`configuracion-notificaciones-${table}`);
          setActiveSubTab('status');
        }
      } else if (table === 'entidad' || table === 'entidad_localizacion') {
        // Tablas de agrupación
        setSelectedTable(table);
        setActiveTab(`agrupacion-${table}`);
      } else if (geografiaTables.includes(table)) {
        setSelectedTable(table);
        setActiveTab(`geografia-${table}`);
      } else if (dispositivosTables.includes(table)) {
        // Tabla de dispositivos (sin contexto previo)
        setSelectedTable(table);
        setActiveTab(`configuracion-dispositivos-${table}`);
      } else if (usuariosTables.includes(table)) {
        // Tabla de usuarios (sin contexto previo)
        setSelectedTable(table);
        setActiveTab(`configuracion-usuarios-${table}`);
      } else if (parametrosGeoTables.includes(table)) {
        // Tabla de parámetros geo (sin contexto previo)
        setSelectedTable(table);
        setActiveTab(`configuracion-parametros-geo-${table}`);
      } else if (parametrosTables.includes(table)) {
        // Tablas de parámetros (solo si NO está en dispositivosTables)
        setSelectedTable(table);
        setActiveTab(`parametros-${table}`);
      } else if (permisosTables.includes(table)) {
        setSelectedTable(table);
        setActiveTab(`permisos-${table}`);
      } else if (notificacionesTables.includes(table)) {
        // Tabla de notificaciones (sin contexto previo o desde otro lugar)
        if (table === 'regla') {
          setSelectedTable('');
          setActiveTab('configuracion-notificaciones-regla');
          setActiveSubTab('status');
        } else {
          setSelectedTable(table);
          setActiveTab(`configuracion-notificaciones-${table}`);
          setActiveSubTab('status');
        }
      } else if (table === 'regla' || table === 'regla_perfil' || table === 'regla_umbral' || table === 'regla_objeto') {
        // Tablas de regla seleccionadas desde ReglaSidebar
        // IMPORTANTE: Para REGLA, handleTableSelect es la ÚNICA fuente de verdad
        // NO depende del useEffect de sincronización (igual que DISPOSITIVOS pero con 4 niveles)
        
        // CRÍTICO: Establecer el ref ANTES de actualizar cualquier estado
        // Esto asegura que el useEffect vea el ref cuando se ejecute
        tableChangeFromHandlerRef.current = { table, timestamp: Date.now() };
        
        // Resetear activeSubTab a 'status' cuando cambia la tabla (similar a DISPOSITIVOS)
        setActiveSubTab('status');
        
        // Limpiar formData cuando cambia la tabla de regla (igual que DISPOSITIVOS)
        setCurrentFormData({});
        setCurrentMultipleData([]);
        
        // Actualizar selectedTable y activeTab simultáneamente
        // IMPORTANTE: Estos son los únicos lugares donde se actualizan para REGLA
        setSelectedTable(table);
        const newActiveTab = `configuracion-notificaciones-regla-${table}`;
        setActiveTab(newActiveTab);
        
        // Limpiar el ref después de un delay para permitir futuros cambios
        // IMPORTANTE: El delay debe ser suficiente para que cualquier useEffect pendiente vea el ref
        // Usar un delay más largo para REGLA debido a los 4 niveles de sidebars
        setTimeout(() => {
          tableChangeFromHandlerRef.current = null;
        }, 3000);
      } else if (table === 'permisos-geo' || table === 'permisos-conf') {
        // Tipos de permisos seleccionados desde PermisosTipoSidebar
        setSelectedTable(table);
        setActiveSubTab('status'); // Resetear a status cuando cambia el tipo
        setActiveTab(`configuracion-permisos-${table}`);
      } else if (['sensor_valor_error', 'audit_log_umbral', 'msg_outbox'].includes(table)) {
        // Tablas de reportes administrativos
        setSelectedTable(table);
        setActiveSubTab('status'); // Solo status para reportes administrativos
        setActiveTab(`configuracion-reportes-administrador-${table}`);
      } else {
        // Resto de tablas van a 'tabla'
        setSelectedTable(table);
        setActiveTab(`tabla-${table}`);
      }
      });
    };
    
    // Usar el sistema del sidebar para verificar cambios sin guardar
    // IMPORTANTE: requestLeave solo muestra el modal si hay cambios, no ejecuta el cambio inmediatamente
    // Pasar el nuevo activeTab como target, currentTab para revertir, y executeTableChange como onConfirm
    sidebar.requestLeave(newActiveTab, currentTab, () => {
      console.log('[App] onRevert ejecutado en handleTableSelect, revirtiendo activeTab a', currentTab);
      // Revertir activeTab al valor que tenía antes del click
      setActiveTab(currentTab);
      activeTabRef.current = currentTab;
      if (activeTabRefShared) {
        activeTabRefShared.current = currentTab;
      }
    }, executeTableChange);
  };

  const handleSubTabChange = (subTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => {
    setActiveSubTab(subTab as 'status' | 'insert' | 'update' | 'massive' | 'asignar');
    
    // Si estamos en una tabla de regla, actualizar el activeTab para incluir la operación
    // IMPORTANTE: Usar selectedTableRef.current para obtener el valor más reciente
    // porque selectedTable puede tener el valor del closure anterior cuando se cambia de tabla
    if (activeTab.startsWith('configuracion-notificaciones-regla-')) {
      // Determinar la tabla de regla: usar selectedTableRef.current si está disponible y es una tabla de regla válida,
      // de lo contrario extraer de activeTab
      let reglaTable: string | null = null;
      
      // Priorizar selectedTableRef.current (valor más reciente) si es una tabla de regla válida
      const currentSelectedTable = selectedTableRef.current;
      if (currentSelectedTable && (currentSelectedTable === 'regla' || currentSelectedTable === 'regla_perfil' || currentSelectedTable === 'regla_umbral' || currentSelectedTable === 'regla_objeto')) {
        reglaTable = currentSelectedTable;
      } else {
        // Fallback: extraer de activeTab
        // El formato es: 'configuracion-notificaciones-regla-regla_perfil-insert'
        // Necesitamos extraer todo hasta el primer guion después de 'regla'
        const reglaPrefix = 'configuracion-notificaciones-regla-';
        if (activeTab.startsWith(reglaPrefix)) {
          const afterPrefix = activeTab.substring(reglaPrefix.length);
          // Dividir por '-' y tomar la primera parte (que es la tabla)
          const parts = afterPrefix.split('-');
          const extractedTable = parts[0];
          // Validar que sea una tabla de regla válida
          if (extractedTable === 'regla' || extractedTable === 'regla_perfil' || extractedTable === 'regla_umbral' || extractedTable === 'regla_objeto') {
            reglaTable = extractedTable;
          }
        }
      }
      
      if (reglaTable && (subTab === 'status' || subTab === 'insert' || subTab === 'update' || subTab === 'massive')) {
        const newActiveTab = `configuracion-notificaciones-regla-${reglaTable}-${subTab}`;
        setActiveTab(newActiveTab);
      }
    }
  };

  // Handler para cambiar el subTab del Dashboard
  const handleDashboardSubTabChange = (subTab: 'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales') => {
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

    // Manejar sub-rutas de NOTIFICACIONES
    if (activeTab.startsWith('notificaciones-')) {
      const notificacionesTab = activeTab.replace('notificaciones-', '');
      return (
        <NotificacionesMainLazyWithBoundary 
          ref={notificacionesMainRef}
          selectedTable={notificacionesTab}
          onTableSelect={handleTableSelect}
          activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
          onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
            handleSubTabChange(tab);
          }}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
          themeColor="cyan"
        />
      );
    }

    // Manejar CONFIGURACIÓN principal (sin subsección)
    if (activeTab === 'configuracion') {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">CONFIGURACIÓN</h2>
              <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DE CONFIGURACIÓN PARA CONTINUAR</p>
            </div>
          </div>
        </div>
      );
    }

    // Manejar sub-rutas de CONFIGURACIÓN - DISPOSITIVOS
    if (activeTab.startsWith('configuracion-dispositivos')) {
      // Extraer el nombre de la tabla (ej: 'configuracion-dispositivos-tipo-status' -> 'tipo')
      // Excluir la operación si está presente
      const parts = activeTab.split('-');
      const validOperations = ['status', 'insert', 'update', 'massive'];
      const dispositivosTab = parts.length > 3 && validOperations.includes(parts[parts.length - 1])
        ? parts.slice(2, -1).join('-') // Excluir la operación
        : activeTab.replace('configuracion-dispositivos', '').replace(/^-/, '');
      
      // Si no hay tabla seleccionada, mostrar mensaje
      if (!dispositivosTab || dispositivosTab === '') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">DISPOSITIVOS</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }

      // Si tabla está seleccionada pero no hay operación (status/insert/update/massive), mostrar placeholder
      if (parts.length === 3 || (parts.length > 3 && !validOperations.includes(parts[parts.length - 1]))) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">OPERACIONES</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una opción</p>
              </div>
            </div>
          </div>
        );
      }

      // Usar SystemParameters para las tablas de dispositivos (tipo, metrica, sensor, metricasensor)
      return (
        <SystemParametersWithSuspense 
          ref={systemParametersRef}
          selectedTable={dispositivosTab}
          onTableSelect={handleTableSelect}
          activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
          onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
            handleSubTabChange(tab);
          }}
          activeTab={activeTab}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
          clearFormData={clearFormData}
        />
      );
    }

    // Manejar sub-rutas de configuración (parámetros del sistema) - mantener para compatibilidad
    if (activeTab.startsWith('parameters-')) {
      const parameterTab = activeTab.replace('parameters-', '');
      return (
        <SystemParametersWithSuspense 
          ref={systemParametersRef}
          selectedTable={parameterTab}
          onTableSelect={handleTableSelect}
          activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
          onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
            handleSubTabChange(tab);
          }}
          activeTab={activeTab}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
          clearFormData={clearFormData}
        />
      );
    }

    // Manejar sub-rutas de CONFIGURACIÓN - USUARIOS
    if (activeTab.startsWith('configuracion-usuarios')) {
      // Extraer el nombre de la tabla (ej: 'configuracion-usuarios-usuario-status' -> 'usuario')
      // Excluir la operación si está presente
      const parts = activeTab.split('-');
      const validOperations = ['status', 'insert', 'update', 'massive'];
      const usuariosTab = parts.length > 3 && validOperations.includes(parts[parts.length - 1])
        ? parts.slice(2, -1).join('-') // Excluir la operación
        : activeTab.replace('configuracion-usuarios', '').replace(/^-/, '');
      
      // Si no hay tabla seleccionada, mostrar mensaje
      if (!usuariosTab || usuariosTab === '') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">USUARIOS</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }

      // Si tabla está seleccionada pero no hay operación, mostrar placeholder
      if (parts.length === 3 || (parts.length > 3 && !validOperations.includes(parts[parts.length - 1]))) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">OPERACIONES</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una opción</p>
              </div>
            </div>
          </div>
        );
      }

      // Usar SystemParameters para las tablas de usuarios
      return (
        <SystemParametersWithSuspense 
          ref={systemParametersRef}
          selectedTable={usuariosTab}
          onTableSelect={handleTableSelect}
          activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
          onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
            handleSubTabChange(tab);
          }}
          activeTab={activeTab}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
          clearFormData={clearFormData}
        />
      );
    }

    // Manejar sub-rutas de CONFIGURACIÓN - PARAMETROS GEO
    if (activeTab.startsWith('configuracion-parametros-geo')) {
      // Extraer el nombre de la tabla (ej: 'configuracion-parametros-geo-pais-status' -> 'pais')
      // Excluir la operación si está presente
      const parts = activeTab.split('-');
      const validOperations = ['status', 'insert', 'update', 'massive'];
      const parametrosGeoTab = parts.length > 4 && validOperations.includes(parts[parts.length - 1])
        ? parts.slice(3, -1).join('-') // Excluir la operación (parametros-geo tiene 3 palabras)
        : activeTab.replace('configuracion-parametros-geo', '').replace(/^-/, '');
      
      // Si no hay tabla seleccionada, mostrar mensaje
      if (!parametrosGeoTab || parametrosGeoTab === '') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">PARAMETROS GEO</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }

      // Si tabla está seleccionada pero no hay operación, mostrar placeholder
      if (parts.length === 4 || (parts.length > 4 && !validOperations.includes(parts[parts.length - 1]))) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">OPERACIONES</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una opción</p>
              </div>
            </div>
          </div>
        );
      }

      // Usar SystemParameters para las tablas de parámetros geo
      return (
        <SystemParametersWithSuspense 
          ref={systemParametersRef}
          selectedTable={parametrosGeoTab}
          onTableSelect={handleTableSelect}
          activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
          onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
            handleSubTabChange(tab);
          }}
          activeTab={activeTab}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
          clearFormData={clearFormData}
        />
      );
    }

    // Manejar sub-rutas de CONFIGURACIÓN - NOTIFICACIONES
    if (activeTab.startsWith('configuracion-notificaciones')) {
      // Caso especial: REGLA (configuracion-notificaciones-regla o configuracion-notificaciones-regla-[tabla])
      if (activeTab.startsWith('configuracion-notificaciones-regla')) {
        // Extraer el nombre de la tabla de regla
        // CRÍTICO: Para REGLA, selectedTable es la fuente de verdad (handleTableSelect lo establece)
        // Solo usar activeTab como fallback si selectedTable no está disponible
        let reglaTab = '';
        
        // PRIORIDAD 1: Usar selectedTable si es una tabla de regla válida
        if (selectedTable && (selectedTable === 'regla' || selectedTable === 'regla_perfil' || selectedTable === 'regla_umbral' || selectedTable === 'regla_objeto')) {
          reglaTab = selectedTable;
        } else if (activeTab.startsWith('configuracion-notificaciones-regla-')) {
          // PRIORIDAD 2: Extraer de activeTab solo si selectedTable no está disponible
          const afterRegla = activeTab.replace('configuracion-notificaciones-regla-', '');
          reglaTab = afterRegla.split('-')[0];
        }
        
        
        // Si no hay tabla seleccionada, mostrar mensaje
        if (!reglaTab || reglaTab === '') {
          return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center">
                <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                  <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">REGLA</h2>
                  <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
                </div>
              </div>
            </div>
          );
        }
        
        // Extraer la operación del activeTab completo
        // Formato: 'configuracion-notificaciones-regla-regla_perfil-status'
        // O: 'configuracion-notificaciones-regla-regla_perfil'
        // CRÍTICO: Usar reglaTab (que viene de selectedTable) como fuente de verdad
        const reglaTableName = reglaTab; // reglaTab ya viene de selectedTable (fuente de verdad)
        let reglaOperation = '';
        
        // Si activeTab tiene más partes después de la tabla, extraer la operación
        if (activeTab.startsWith('configuracion-notificaciones-regla-')) {
          const afterRegla = activeTab.replace('configuracion-notificaciones-regla-', '');
          const parts = afterRegla.split('-');
          
          // La segunda parte (si existe) es la operación (status, insert)
          if (parts.length > 1) {
            reglaOperation = parts[1];
          }
        }
        
        // Caso especial: Si la tabla es 'regla', usar ReglasMain en lugar de SystemParameters
        if (reglaTableName === 'regla') {
          // Si no hay operación seleccionada, mostrar placeholder
          if (!reglaOperation) {
            return (
              <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center">
                  <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">OPERACIONES</h2>
                    <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una opción</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <ReglasMain
              activeSubTab={reglaOperation as 'status' | 'insert' | 'update' || 'status'}
              onSubTabChange={(tab: 'status' | 'insert' | 'update') => {
                // Actualizar activeTab cuando cambia el subTab
                const newActiveTab = `configuracion-notificaciones-regla-regla-${tab}`;
                setActiveTab(newActiveTab);
              }}
              onFormDataChange={handleFormDataChange}
            />
          );
        }
        
        // Para otras tablas de regla (regla_perfil, regla_umbral, regla_objeto), mostrar placeholder si no hay operación
        if (!reglaOperation) {
          return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center">
                <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                  <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">OPERACIONES</h2>
                  <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una opción</p>
                </div>
              </div>
            </div>
          );
        }
        
        // Usar SystemParameters para las otras tablas de regla (regla_perfil, regla_umbral, regla_objeto)
        // IMPORTANTE: reglaTableName viene de selectedTable (fuente de verdad para REGLA)
        return (
          <SystemParametersWithSuspense 
            ref={systemParametersRef}
            selectedTable={reglaTableName}
            onTableSelect={handleTableSelect}
            activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
            onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
              handleSubTabChange(tab);
            }}
            activeTab={activeTab}
            onFormDataChange={handleFormDataChange}
            onMassiveFormDataChange={handleMassiveFormDataChange}
            clearFormData={clearFormData}
          />
        );
      }
      
      // Otras tablas de notificaciones (criticidad, umbral)
      // Extraer el nombre de la tabla (ej: 'configuracion-notificaciones-criticidad' -> 'criticidad')
      // Excluir la operación si está presente
      const parts = activeTab.replace('configuracion-notificaciones', '').replace(/^-/, '').split('-');
      const validOperations = ['status', 'insert', 'update', 'massive'];
      const notificacionesTab = parts.length > 1 && validOperations.includes(parts[parts.length - 1])
        ? parts.slice(0, -1).join('-') // Excluir la operación
        : activeTab.replace('configuracion-notificaciones', '').replace(/^-/, '');
      
      // Si no hay tabla seleccionada, mostrar mensaje
      if (!notificacionesTab || notificacionesTab === '') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">NOTIFICACIONES</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }

      // Si tabla está seleccionada pero no hay operación, mostrar placeholder
      if (parts.length === 1 || (parts.length > 1 && !validOperations.includes(parts[parts.length - 1]))) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">OPERACIONES</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una opción</p>
              </div>
            </div>
          </div>
        );
      }

      // Usar SystemParameters para las tablas de notificaciones
      return (
        <SystemParametersWithSuspense 
          ref={systemParametersRef}
          selectedTable={notificacionesTab}
          onTableSelect={handleTableSelect}
          activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
          onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
            handleSubTabChange(tab);
          }}
          activeTab={activeTab}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
          clearFormData={clearFormData}
        />
      );
    }

    // Manejar configuracion-permisos
    if (activeTab.startsWith('configuracion-permisos')) {
      // Extraer el tipo de permisos (permisos-geo o permisos-conf)
      const permisosTipo = activeTab.replace('configuracion-permisos', '').replace(/^-/, '');
      
      // Si no hay tipo seleccionado, mostrar mensaje
      if (!permisosTipo || permisosTipo === '') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">PERMISOS</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }
      
      // Si hay tipo seleccionado, mostrar PermisosMain con la tabla 'permiso'
      // El filtro por origen se manejará dentro de PermisosMain
      return (
        <PermisosMain
          ref={permisosMainRef}
          selectedTable="permiso"
          onTableSelect={(table) => {
            // Mantener el tipo de permisos en el activeTab
            setActiveTab(`configuracion-permisos-${permisosTipo}`);
          }}
          activeSubTab={activeSubTab as 'status' | 'insert' | 'update' | 'asignar'}
          onSubTabChange={(tab) => {
            handleSubTabChange(tab as 'status' | 'insert' | 'update' | 'massive' | 'asignar');
          }}
          onFormDataChange={handleFormDataChange}
          permisosTipo={permisosTipo as 'permisos-geo' | 'permisos-conf'}
        />
      );
    }

    // Manejar configuracion-reportes-administrador
    if (activeTab.startsWith('configuracion-reportes-administrador')) {
      // Si activeTab es exactamente "configuracion-reportes-administrador" (sin tabla), mostrar mensaje
      if (activeTab === 'configuracion-reportes-administrador') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">REPORTES ADMINISTRADOR</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }
      
      // Extraer el nombre de la tabla (ej: 'configuracion-reportes-administrador-sensor_valor_error' -> 'sensor_valor_error')
      const reportesAdminTable = activeTab.replace('configuracion-reportes-administrador-', '');
      
      // Si no hay tabla seleccionada (por si acaso), mostrar mensaje
      if (!reportesAdminTable || reportesAdminTable === '') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-orange-500 mb-4 font-mono tracking-wider">REPORTES ADMINISTRADOR</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }
      
      // Mostrar ReportesAdminMain con la tabla seleccionada (solo modo lectura)
      return (
        <ReportesAdminMain
          ref={reportesAdminMainRef}
          selectedTable={reportesAdminTable}
          onTableSelect={(table) => {
            setActiveTab(`configuracion-reportes-administrador-${table}`);
          }}
          activeSubTab="status"
          onSubTabChange={(tab) => {
            // Solo permitir 'status' para reportes administrativos
            if (tab === 'status') {
              handleSubTabChange('status');
            }
          }}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    // Manejar agrupacion
    if (activeTab === 'agrupacion' || activeTab.startsWith('agrupacion-')) {
      // Si activeTab es exactamente 'agrupacion', mostrar mensaje de selección
      if (activeTab === 'agrupacion') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono tracking-wider">AGRUPACIÓN</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DE AGRUPACIÓN PARA CONTINUAR</p>
              </div>
            </div>
          </div>
        );
      }

      // Extraer el nombre de la tabla (ej: 'agrupacion-entidad' -> 'entidad')
      // Excluir la operación si está presente (ej: 'agrupacion-entidad-status' -> 'entidad')
      const parts = activeTab.replace('agrupacion-', '').split('-');
      const validOperations = ['status', 'insert', 'update', 'massive'];
      const agrupacionTable = parts.length > 1 && validOperations.includes(parts[parts.length - 1])
        ? parts.slice(0, -1).join('-')
        : parts.join('-');

      // Si tabla está seleccionada pero no hay operación, mostrar placeholder
      if (!agrupacionTable || agrupacionTable === '') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono tracking-wider">AGRUPACIÓN</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una tabla del sidebar</p>
              </div>
            </div>
          </div>
        );
      }

      // Si tabla está seleccionada pero no hay operación, mostrar placeholder
      if (parts.length === 1 || (parts.length > 1 && !validOperations.includes(parts[parts.length - 1]))) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono tracking-wider">OPERACIONES</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">Selecciona una opción</p>
              </div>
            </div>
          </div>
        );
      }

      // Mostrar AgrupacionMain con la tabla seleccionada
      return (
        <AgrupacionMain
          ref={agrupacionMainRef}
          selectedTable={agrupacionTable}
          onTableSelect={(table) => {
            setActiveTab(`agrupacion-${table}`);
          }}
          activeSubTab={activeSubTab as 'status' | 'insert' | 'update' | 'massive'}
          onSubTabChange={(tab) => {
            handleSubTabChange(tab);
          }}
          onFormDataChange={handleFormDataChange}
          onMassiveFormDataChange={handleMassiveFormDataChange}
        />
      );
    }

    // Manejar ajustes
    if (activeTab === 'ajustes' || activeTab.startsWith('ajustes-')) {
      // Si activeTab es exactamente 'ajustes', mostrar mensaje de selección
      if (activeTab === 'ajustes') {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-500 mb-4 font-mono tracking-wider">AJUSTES</h2>
                <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DE AJUSTES PARA CONTINUAR</p>
              </div>
            </div>
          </div>
        );
      }

      // Siempre mostrar configuración básica
      return (
        <AjustesMain
          ref={ajustesMainRef}
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
          case 'mediciones':
            return (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando Mediciones...</p>
                  </div>
                </div>
              }>
                <MedicionesDashboardLazy />
              </Suspense>
            );
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
          case 'status-nodos':
            return (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando Status de Nodos...</p>
                  </div>
                </div>
              }>
                <NodeStatusDashboardLazy />
              </Suspense>
            );
          case 'status-alertas':
            return (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando Status de Alertas...</p>
                  </div>
                </div>
              }>
                <AlertStatusDashboardLazy />
              </Suspense>
            );
          case 'metrica':
            return (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando Métrica por Localización...</p>
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
            // NO redirigir automáticamente - permitir que el usuario seleccione una opción
            // Si solo es 'dashboard' sin subTab, mostrar el mensaje de selección
            if (reporteTab === 'dashboard') {
              // Retornar null para no renderizar nada aún (esperar selección del usuario)
              return null;
            }
        }
      }
      
      switch (reporteTab) {
        case 'dashboard':
          // NO redirigir automáticamente - mostrar selección
          return null;
        case 'historial':
          // NO redirigir automáticamente - mostrar selección
          return null;
        case 'historial-alertas':
          return <AlertasMain />;
        case 'historial-mensajes':
          return <MensajesMain />;
        // Mantener compatibilidad con rutas antiguas
        case 'alertas':
          // Redirigir a historial-alertas
          startTransition(() => {
            setActiveTab('reportes-historial-alertas');
          });
          return null;
        case 'mensajes':
          // Redirigir a historial-mensajes
          startTransition(() => {
            setActiveTab('reportes-historial-mensajes');
          });
          return null;
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
              <h2 className="text-2xl font-bold text-blue-500 mb-4 font-mono tracking-wider">{t('tabs.reports')}</h2>
              <p className="text-gray-600 dark:text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DE REPORTES PARA CONTINUAR</p>
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

    // Manejar todas las tablas de PERMISOS
    if (activeTab.startsWith('permisos-')) {
      const permisosTable = activeTab.replace('permisos-', '');
      return (
        <PermisosMain
          ref={permisosMainRef}
          selectedTable={permisosTable}
          onTableSelect={(table) => {
            setActiveTab(`permisos-${table}`);
          }}
          activeSubTab={activeSubTab as 'status' | 'insert' | 'update' | 'asignar'}
          onSubTabChange={(tab) => {
            setActiveSubTab(tab as 'status' | 'insert' | 'update' | 'massive' | 'asignar');
          }}
          onFormDataChange={handleFormDataChange}
        />
      );
    }

    // Manejar sub-rutas de PARÁMETROS (origen, fuente)
    if (activeTab.startsWith('parametros-')) {
      const parametrosTable = activeTab.replace('parametros-', '');
      // Solo mostrar SystemParameters para origen y fuente
      if (parametrosTable === 'origen' || parametrosTable === 'fuente') {
        return (
          <SystemParametersWithSuspense 
            ref={systemParametersRef}
            selectedTable={parametrosTable}
            onTableSelect={handleTableSelect}
            activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
            onSubTabChange={(tab: 'status' | 'insert' | 'update' | 'massive') => {
              handleSubTabChange(tab);
            }}
            activeTab={activeTab}
            onFormDataChange={handleFormDataChange}
            onMassiveFormDataChange={handleMassiveFormDataChange}
            clearFormData={clearFormData}
            themeColor="orange"
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
    if (activeTab === 'geografia' || activeTab?.startsWith('geografia-')) {
      return 'theme-blue';
    } else if (activeTab === 'parametros' || activeTab?.startsWith('parametros-')) {
      return 'theme-orange';
    } else if (activeTab === 'tabla' || activeTab?.startsWith('tabla-')) {
      return 'theme-green';
    } else if (activeTab === 'notificaciones' || activeTab?.startsWith('notificaciones-')) {
      return 'theme-cyan';
    } else if (activeTab === 'parameters' || activeTab?.startsWith('parameters-')) {
      return 'theme-orange';
    } else if (activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')) {
      return 'theme-gray';
    } else if (activeTab === 'permisos' || activeTab?.startsWith('permisos-')) {
      return 'theme-purple';
    } else if (activeTab === 'alertas' || activeTab?.startsWith('alertas-')) {
      return 'theme-red';
    } else if (activeTab === 'reportes' || activeTab?.startsWith('reportes-')) {
      return 'theme-gray';
    } else {
      // Por defecto
      return 'theme-gray';
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
          activeSubTab={(
            activeTab.startsWith('permisos-') || activeTab.startsWith('configuracion-permisos-')
              ? activeSubTab
              : (activeSubTab === 'asignar' ? 'status' : activeSubTab)
          )}
          onSubTabChange={(tab) => {
            if (activeTab.startsWith('permisos-') || activeTab.startsWith('configuracion-permisos-')) {
              // Para todas las vistas de permisos (dashboard y configuración), permitir todos los tabs incluyendo 'asignar'
              setActiveSubTab(tab as 'status' | 'insert' | 'update' | 'massive' | 'asignar');
            } else if (tab !== 'asignar') {
              handleSubTabChange(tab);
            }
          }}
          dashboardSubTab={dashboardSubTab}
          onDashboardSubTabChange={handleDashboardSubTabChange}
          formData={currentFormData}
          multipleData={currentMultipleData}
          massiveFormData={currentMassiveFormData}
          onPermisosSubTabChangeFromProtectedButton={
            // Pasar la función según el tab activo (permisos dashboard o configuración)
            (activeTab.startsWith('permisos-') || activeTab.startsWith('configuracion-permisos-'))
              ? permisosMainRef.current?.handleSubTabChangeFromProtectedButton
                ? (tab: 'status' | 'insert' | 'update' | 'asignar' | 'massive') => {
                    // Filtrar 'massive' ya que PermisosMain no lo soporta
                    if (tab !== 'massive') {
                      permisosMainRef.current?.handleSubTabChangeFromProtectedButton?.(tab as 'status' | 'insert' | 'update' | 'asignar');
                    }
                  }
                : undefined
              : undefined
          }
          onSubTabChangeFromProtectedButton={
            // Pasar la función según el tab activo
            activeTab.startsWith('configuracion-dispositivos') || activeTab.startsWith('configuracion-usuarios') || activeTab.startsWith('configuracion-parametros-geo')
              ? systemParametersRef.current?.handleSubTabChangeFromProtectedButton
              : activeTab.startsWith('notificaciones-') || activeTab.startsWith('configuracion-notificaciones')
              ? notificacionesMainRef.current?.handleSubTabChangeFromProtectedButton
              : undefined
          }
        />

        {/* Área principal con header fijo y contenido scrolleable */}
        <div 
          className={`${getMainContentClasses(sidebarVisible)} bg-gray-50 dark:bg-black flex-1`}
          onMouseEnter={(e) => {
            // Usar el nuevo sistema de sidebars para colapsar cuando el cursor entra al contenido
            // Verificar que la función exista antes de llamarla
            if (sidebar && typeof sidebar.handleContentMouseEnter === 'function') {
              sidebar.handleContentMouseEnter()
            } else {
              console.error('[SIDEBAR ERROR] handleContentMouseEnter no está disponible en sidebar:', {
                sidebar: sidebar,
                hasHandleContentMouseEnter: sidebar && 'handleContentMouseEnter' in sidebar,
                type: sidebar && typeof sidebar.handleContentMouseEnter
              })
            }
            
            // También llamar los handlers antiguos para compatibilidad
            if (handleContentMouseEnterFromLayout) {
              handleContentMouseEnterFromLayout();
            }
            handleContentMouseEnter();
          }}
          onMouseLeave={(e) => {
            // Usar el handleContentMouseLeave de useSidebarLayout
            if (handleContentMouseLeaveFromLayout) {
              handleContentMouseLeaveFromLayout();
            }
            handleContentMouseLeave();
          }}
        >
        {/* Header fijo (freeze pane) - Solo mostrar si no es ventana de bienvenida */}
        {!showWelcomeIntegrated && (
          <div className="flex-shrink-0">
            {/* Tactical Header */}
            <div className="h-16 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="text-sm font-mono">
                  <span className={
                    // Determinar color según la pestaña principal
                    activeTab === 'reportes' || activeTab?.startsWith('reportes-')
                      ? 'text-blue-500' // Azul para Reportes
                      : activeTab === 'agrupacion' || activeTab?.startsWith('agrupacion-')
                      ? 'text-green-500' // Verde para Agrupación
                      : activeTab === 'configuracion' || activeTab?.startsWith('configuracion-')
                      ? 'text-orange-500' // Naranja para Configuración
                      : activeTab === 'ajustes' || activeTab?.startsWith('ajustes-')
                      ? 'text-gray-500' // Gris para Ajustes
                      : 'text-gray-500' // Gris por defecto
                  }>
                    {activeTab === 'geografia' || activeTab?.startsWith('geografia-')
                      ? (() => {
                          let breadcrumb = 'GEOGRAFÍA';
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
                      : activeTab === 'parametros' || activeTab?.startsWith('parametros-')
                      ? (() => {
                          let breadcrumb = 'PARÁMETROS';
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
                      : activeTab === 'tabla' || activeTab?.startsWith('tabla-')
                      ? (() => {
                          let breadcrumb = 'TABLA';
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
                      : activeTab === 'notificaciones' || activeTab?.startsWith('notificaciones-')
                      ? (() => {
                          let breadcrumb = 'NOTIFICACIONES';
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
                      : activeTab === 'parameters' || activeTab?.startsWith('parameters-')
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
                              'status-nodos': 'STATUS DE NODOS',
                              'metrica': 'MÉTRICA POR LOCALIZACIÓN',
                              'umbrales': 'UMBRALES POR LOCALIZACIÓN'
                            };
                            return `${t('tabs.reports')} / ${t('subtabs.dashboard')} / ${subTabNames[subTab] || subTab.toUpperCase()}`;
                          }
                          const reporteTab = activeTab.replace('reportes-', '');
                          const reporteNames: { [key: string]: string } = {
                            'dashboard': t('subtabs.dashboard'),
                            'historial': 'HISTORIAL',
                            'historial-alertas': t('subtabs.alerts'),
                            'historial-mensajes': t('subtabs.messages'),
                            'alertas': t('subtabs.alerts'), // Compatibilidad
                            'mensajes': t('subtabs.messages') // Compatibilidad
                          };
                          // Si es historial-alertas o historial-mensajes, mostrar "HISTORIAL / ALERTAS" o "HISTORIAL / MENSAJES"
                          if (reporteTab.startsWith('historial-')) {
                            const historialSubTab = reporteTab.replace('historial-', '');
                            return `${t('tabs.reports')} / HISTORIAL / ${reporteNames[`historial-${historialSubTab}`] || historialSubTab.toUpperCase()}`;
                          }
                          return `${t('tabs.reports')} / ${reporteNames[reporteTab] || reporteTab.toUpperCase()}`;
                        })()
                      : activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')
                      ? ''
                      : activeTab === 'permisos' || activeTab?.startsWith('permisos-')
                      ? (() => {
                          let breadcrumb = `${t('tabs.permissions').toUpperCase()}`;
                          if (activeTab.startsWith('permisos-')) {
                            const permisosTable = activeTab.replace('permisos-', '');
                            const tableNames: Record<string, string> = {
                              'permiso': t('parameters.tables.geography_permission') || 'PERMISO',
                              'usuario': 'USUARIO',
                              'perfil': 'PERFIL',
                              'usuarioperfil': 'PERFIL DE USUARIO',
                              'contacto': 'CONTACTO',
                              'correo': 'CORREO'
                            };
                            breadcrumb += ` / ${tableNames[permisosTable]?.toUpperCase() || permisosTable.toUpperCase()}`;
                            if (activeSubTab) {
                              const subTabNames: { [key: string]: string } = {
                                'status': t('subtabs.status'),
                                'insert': t('subtabs.insert'),
                                'update': t('subtabs.update'),
                                'asignar': 'ASIGNAR'
                              };
                              breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                            }
                          }
                          return breadcrumb;
                        })()
                      : activeTab === 'parametros' || activeTab?.startsWith('parametros-')
                      ? (() => {
                          let breadcrumb = `${t('tabs.parameters')?.toUpperCase() || 'PARÁMETROS'}`;
                          if (activeTab.startsWith('parametros-')) {
                            const parametrosTable = activeTab.replace('parametros-', '');
                            if (parametrosTable === 'origen') {
                              breadcrumb += ` / ${t('parameters.tables.origin').toUpperCase()}`;
                              if (activeSubTab) {
                                const subTabNames: { [key: string]: string } = {
                                  'status': t('subtabs.status'),
                                  'insert': t('subtabs.insert'),
                                  'update': t('subtabs.update')
                                };
                                breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                              }
                            } else if (parametrosTable === 'fuente') {
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
                      : activeTab === 'agrupacion' || activeTab?.startsWith('agrupacion-')
                      ? (() => {
                          let breadcrumb = 'AGRUPACIÓN';
                          if (activeTab.startsWith('agrupacion-')) {
                            const agrupacionTable = activeTab.replace('agrupacion-', '');
                            const tableNames: Record<string, string> = {
                              'entidad': 'CARPETA',
                              'entidad_localizacion': 'LOCALIZACIÓN POR CARPETA'
                            };
                            breadcrumb += ` / ${tableNames[agrupacionTable]?.toUpperCase() || agrupacionTable.toUpperCase()}`;
                            if (activeSubTab) {
                              const subTabNames: { [key: string]: string } = {
                                'status': t('subtabs.status'),
                                'insert': t('subtabs.insert'),
                                'update': t('subtabs.update'),
                                'massive': t('subtabs.massive')
                              };
                              breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                            }
                          }
                          return breadcrumb;
                        })()
                      : activeTab === 'configuracion' || activeTab?.startsWith('configuracion-')
                      ? (() => {
                          let breadcrumb = 'CONFIGURACIÓN';
                          if (activeTab.startsWith('configuracion-')) {
                            const configPart = activeTab.replace('configuracion-', '');
                            // Determinar la sección de configuración
                            if (configPart.startsWith('dispositivos-')) {
                              breadcrumb += ' / DISPOSITIVOS';
                              const table = configPart.replace('dispositivos-', '').split('-')[0];
                              if (table) {
                                breadcrumb += ` / ${getTableNameInSpanish(table)}`;
                                // Usar activeSubTab directamente - no agregar "OPERACIONES" ya que es un header de sidebar
                                if (activeSubTab && (activeSubTab === 'status' || activeSubTab === 'insert' || activeSubTab === 'update')) {
                                  const subTabNames: { [key: string]: string } = {
                                    'status': 'ESTADO',
                                    'insert': 'CREAR',
                                    'update': 'ACTUALIZAR'
                                  };
                                  breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                                }
                              }
                            } else if (configPart.startsWith('usuarios-')) {
                              breadcrumb += ' / USUARIOS';
                              const table = configPart.replace('usuarios-', '').split('-')[0];
                              if (table) {
                                breadcrumb += ` / ${getTableNameInSpanish(table)}`;
                                // Usar activeSubTab directamente - no agregar "OPERACIONES" ya que es un header de sidebar
                                if (activeSubTab && (activeSubTab === 'status' || activeSubTab === 'insert' || activeSubTab === 'update')) {
                                  const subTabNames: { [key: string]: string } = {
                                    'status': 'ESTADO',
                                    'insert': 'CREAR',
                                    'update': 'ACTUALIZAR'
                                  };
                                  breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                                }
                              }
                            } else if (configPart.startsWith('parametros-geo-')) {
                              breadcrumb += ' / PARÁMETROS GEO';
                              const table = configPart.replace('parametros-geo-', '').split('-')[0];
                              if (table) {
                                breadcrumb += ` / ${getTableNameInSpanish(table)}`;
                                // Usar activeSubTab directamente - no agregar "OPERACIONES" ya que es un header de sidebar
                                if (activeSubTab && (activeSubTab === 'status' || activeSubTab === 'insert' || activeSubTab === 'update' || activeSubTab === 'massive')) {
                                  const subTabNames: { [key: string]: string } = {
                                    'status': 'ESTADO',
                                    'insert': 'CREAR',
                                    'update': 'ACTUALIZAR',
                                    'massive': 'MASIVO'
                                  };
                                  breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                                }
                              }
                            } else if (configPart.startsWith('notificaciones-')) {
                              breadcrumb += ' / NOTIFICACIONES';
                              if (configPart.startsWith('notificaciones-regla-')) {
                                const reglaPart = configPart.replace('notificaciones-regla-', '');
                                const reglaTable = reglaPart.split('-')[0];
                                if (reglaTable) {
                                  const reglaTableNames: Record<string, string> = {
                                    'regla': 'REGLA & UMBRAL',
                                    'regla_perfil': 'REGLA DE PERFIL',
                                    'regla_objeto': 'REGLA DE OBJETO'
                                  };
                                  breadcrumb += ` / ${reglaTableNames[reglaTable]?.toUpperCase() || reglaTable.toUpperCase()}`;
                                  // Usar activeSubTab directamente - no agregar "OPERACIONES" ya que es un header de sidebar
                                  if (activeSubTab && (activeSubTab === 'status' || activeSubTab === 'insert' || activeSubTab === 'update')) {
                                    const subTabNames: { [key: string]: string } = {
                                      'status': 'ESTADO',
                                      'insert': 'CREAR',
                                      'update': 'ACTUALIZAR'
                                    };
                                    breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                                  }
                                }
                              } else {
                                // Para otras tablas de notificaciones (criticidad, umbral)
                                const table = configPart.replace('notificaciones-', '').split('-')[0];
                                if (table && table !== 'regla') {
                                  breadcrumb += ` / ${getTableNameInSpanish(table)}`;
                                  // Usar activeSubTab directamente - no agregar "OPERACIONES" ya que es un header de sidebar
                                  if (activeSubTab && (activeSubTab === 'status' || activeSubTab === 'insert' || activeSubTab === 'update' || activeSubTab === 'massive')) {
                                    const subTabNames: { [key: string]: string } = {
                                      'status': 'ESTADO',
                                      'insert': 'CREAR',
                                      'update': 'ACTUALIZAR',
                                      'massive': 'MASIVO'
                                    };
                                    breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                                  }
                                }
                              }
                            } else if (configPart.startsWith('permisos-')) {
                              breadcrumb += ' / PERMISOS';
                              if (configPart.startsWith('permisos-permisos-')) {
                                const permisosTipo = configPart.replace('permisos-permisos-', '').split('-')[0];
                                breadcrumb += ` / ${permisosTipo.toUpperCase()}`;
                                // Usar activeSubTab directamente - no agregar "OPERACIONES" ya que es un header de sidebar
                                if (activeSubTab && (activeSubTab === 'status' || activeSubTab === 'insert' || activeSubTab === 'update' || activeSubTab === 'asignar')) {
                                  const subTabNames: { [key: string]: string } = {
                                    'status': 'ESTADO',
                                    'insert': 'CREAR',
                                    'update': 'ACTUALIZAR',
                                    'asignar': 'ASIGNAR'
                                  };
                                  breadcrumb += ` / ${subTabNames[activeSubTab]?.toUpperCase() || activeSubTab.toUpperCase()}`;
                                }
                              }
                            } else if (configPart.startsWith('reportes-administrador-')) {
                              breadcrumb += ' / REPORTES ADMINISTRADOR';
                              const table = configPart.replace('reportes-administrador-', '');
                              if (table) {
                                breadcrumb += ` / ${getTableNameInSpanish(table)}`;
                              }
                            }
                          }
                          return breadcrumb;
                        })()
                      : activeTab === 'ajustes' || activeTab?.startsWith('ajustes-')
                      ? (() => {
                          let breadcrumb = 'AJUSTES';
                          if (activeTab.startsWith('ajustes-')) {
                            const ajustesSection = activeTab.replace('ajustes-', '');
                            if (ajustesSection === 'basicas') {
                              breadcrumb += ' / CONF. BÁSICAS';
                            } else if (ajustesSection === 'avanzadas') {
                              breadcrumb += ' / CONF. AVANZADAS';
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

  // Envolver con ReportesAlertasWrapper si estamos en reportes-alertas o reportes-historial-alertas
  if (activeTab === 'reportes-alertas' || activeTab === 'reportes-historial-alertas') {
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

const AppContent: React.FC<{ 
  executeTabChangeRef?: React.MutableRefObject<((tab: string) => void) | null>
  activeTabRef?: React.MutableRefObject<string>
}> = ({ executeTabChangeRef, activeTabRef }) => {
  return (
    <FilterProvider>
      <AppContentInternal executeTabChangeRef={executeTabChangeRef} activeTabRefShared={activeTabRef} />
    </FilterProvider>
  );
};

// Wrapper para conectar SidebarProvider con AppContentInternal
// Necesitamos pasar handleTabChange al SidebarProvider
const AppWithSidebar: React.FC = () => {
  // Ref para almacenar la función executeTabChange desde AppContentInternal
  const executeTabChangeRef = useRef<((tab: string) => void) | null>(null);
  // Ref para compartir activeTab con SidebarProvider
  const activeTabRef = useRef<string>('dashboard');
  
  // Handler para navegación desde el sidebar
  const handleNavigate = useCallback((tab: string, subtab?: string) => {
    if (executeTabChangeRef.current) {
      executeTabChangeRef.current(tab);
    }
  }, []);
  
  // Estado para sincronizar activeTab con SidebarProvider
  const [currentActiveTab, setCurrentActiveTab] = React.useState<string>('dashboard');
  
  // Efecto para actualizar currentActiveTab cuando activeTabRef cambia
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (activeTabRef.current !== currentActiveTab) {
        setCurrentActiveTab(activeTabRef.current);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [currentActiveTab]);
  
  return (
    <SidebarProvider onNavigate={handleNavigate} activeTab={currentActiveTab}>
      <AppContent executeTabChangeRef={executeTabChangeRef} activeTabRef={activeTabRef} />
      <SimpleAlertModal />
      <SidebarConfirmModal />
    </SidebarProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <ModalProvider>
              <AppWithSidebar />
            </ModalProvider>
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
