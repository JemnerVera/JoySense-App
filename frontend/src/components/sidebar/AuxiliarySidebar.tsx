import React from 'react';
import ParametersSidebar from './ParametersSidebar';
import ParametersOperationsSidebar from './ParametersOperationsSidebar';
import GeografiaSidebar from './GeografiaSidebar';
import GeografiaOperationsSidebar from './GeografiaOperationsSidebar';
import ParametrosSidebar from './ParametrosSidebar';
import ParametrosOperationsSidebar from './ParametrosOperationsSidebar';
import TablaSidebar from './TablaSidebar';
import TablaOperationsSidebar from './TablaOperationsSidebar';
import PermisosSidebar from './PermisosSidebar';
import PermisosOperationsSidebar from './PermisosOperationsSidebar';
import NotificacionesSidebar from './NotificacionesSidebar';
import NotificacionesOperationsSidebar from './NotificacionesOperationsSidebar';
import AlertasSidebar from './AlertasSidebar';
import ReglaOperationsSidebar from './ReglaOperationsSidebar';
import ReglaSidebar from './ReglaSidebar';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import AlertasFilters from './AlertasFilters';
import ReportesDashboardSidebar from './ReportesDashboardSidebar';
import ConfiguracionSidebar from './ConfiguracionSidebar';
import DispositivosSidebar from './DispositivosSidebar';
import DispositivosOperationsSidebar from './DispositivosOperationsSidebar';
import UsuariosSidebar from './UsuariosSidebar';
import UsuariosOperationsSidebar from './UsuariosOperationsSidebar';
import ParametrosGeoSidebar from './ParametrosGeoSidebar';
import ParametrosGeoOperationsSidebar from './ParametrosGeoOperationsSidebar';
import PermisosTipoSidebar from './PermisosTipoSidebar';
import PermisosTipoOperationsSidebar from './PermisosTipoOperationsSidebar';
import ReportesAdminSidebar from './ReportesAdminSidebar';
import AgrupacionSidebar from './AgrupacionSidebar';
import { useLanguage } from '../../contexts/LanguageContext';

interface AuxiliarySidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  dashboardSubTab?: 'mapeo' | 'metrica' | 'umbrales';
  onDashboardSubTabChange?: (subTab: 'mapeo' | 'metrica' | 'umbrales') => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
  showThirdLevel?: boolean;
  showDashboardThirdLevel?: boolean;
  permisosSubTab?: 'status' | 'insert' | 'update' | 'asignar';
  onPermisosSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'asignar') => void;
  onPermisosSubTabChangeFromProtectedButton?: (subTab: 'status' | 'insert' | 'update' | 'asignar' | 'massive') => void;
  reglaSubTab?: 'status' | 'insert' | 'update';
  forceConfiguracionSidebar?: boolean; // Forzar renderizado de ConfiguracionSidebar incluso si isDispositivos es true
  onReglaSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
}

const AuxiliarySidebar: React.FC<AuxiliarySidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeTab,
  onTabChange,
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange,
  dashboardSubTab,
  onDashboardSubTabChange,
  formData = {},
  multipleData = [],
  massiveFormData = {},
  showThirdLevel = false,
  showDashboardThirdLevel = false,
  permisosSubTab,
  onPermisosSubTabChange,
  onPermisosSubTabChangeFromProtectedButton,
  reglaSubTab,
  onReglaSubTabChange,
  forceConfiguracionSidebar = false
}) => {
  const { t } = useLanguage();
  
  // Subpestañas para Reportes
  const reportesSubTabs = [
    {
      id: 'dashboard',
      label: t('subtabs.dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'alertas',
      label: t('subtabs.alerts'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    {
      id: 'mensajes',
      label: t('subtabs.messages'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
  ];

  // Determinar qué sidebar auxiliar mostrar
  // IMPORTANTE: Evaluar primero las condiciones más específicas (configuracion-*) antes que las genéricas
  const isAgrupacion = activeTab === 'agrupacion' || activeTab.startsWith('agrupacion-');
  const isConfiguracion = activeTab === 'configuracion' || activeTab.startsWith('configuracion-');
  const isDispositivos = activeTab.startsWith('configuracion-dispositivos');
  const isUsuarios = activeTab.startsWith('configuracion-usuarios');
  const isParametrosGeo = activeTab.startsWith('configuracion-parametros-geo');
  const isNotificacionesConfig = activeTab.startsWith('configuracion-notificaciones');
  const isPermisosConfig = activeTab === 'configuracion-permisos' || activeTab.startsWith('configuracion-permisos-');
  const isPermisosTipoSelected = activeTab.startsWith('configuracion-permisos-permisos-');
  const isReportesAdmin = activeTab.startsWith('configuracion-reportes-administrador');
  const isGeografia = activeTab === 'geografia' || activeTab.startsWith('geografia-');
  const isParametros = activeTab === 'parametros' || activeTab.startsWith('parametros-');
  const isTabla = activeTab === 'tabla' || activeTab.startsWith('tabla-');
  const isNotificaciones = activeTab === 'notificaciones' || activeTab.startsWith('notificaciones-');
  const isParameters = activeTab === 'parameters' || activeTab.startsWith('parameters-');
  const isPermisos = activeTab === 'permisos' || activeTab.startsWith('permisos-');
  const isAlertas = activeTab === 'alertas' || activeTab.startsWith('alertas-');
  const isReportes = activeTab === 'reportes' || (activeTab.startsWith('reportes-') && activeTab !== 'reportes-dashboard' && !activeTab.startsWith('reportes-dashboard-'));
  const isDashboard = activeTab === 'reportes-dashboard' || activeTab.startsWith('reportes-dashboard-');
  
  // LOG DETALLADO DE TODAS LAS CONDICIONES
  console.log('[AuxiliarySidebar] 🔍 EVALUANDO CONDICIONES:', {
    activeTab,
    selectedTable,
    showThirdLevel,
    forceConfiguracionSidebar,
    isAgrupacion,
    isConfiguracion,
    isDispositivos,
    isUsuarios,
    isParametrosGeo,
    isNotificacionesConfig,
    isPermisosConfig,
    isReportesAdmin,
    isGeografia,
    isParametros,
    isTabla,
    isNotificaciones,
    isParameters,
    isPermisos,
    isAlertas,
    isReportes,
    isDashboard
  });
  // Caso especial: REGLA dentro de NOTIFICACIONES
  const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
  // Verificar si se ha seleccionado una tabla de regla (regla, regla_perfil, regla_umbral)
  // Puede estar en activeTab o en selectedTable
  // Verificar si se ha seleccionado una tabla de regla (regla, regla_perfil, regla_umbral)
  // Puede estar en activeTab o en selectedTable
  // NOTA: No usar activeTab.includes('-regla-') sin verificar porque 'configuracion-notificaciones-regla' incluye 'regla' pero no tiene guion después
  const isReglaTableSelected = isReglaNotificaciones && (
    activeTab.includes('-regla_perfil-') || 
    activeTab.includes('-regla_umbral-') ||
    selectedTable === 'regla' ||
    selectedTable === 'regla_perfil' ||
    selectedTable === 'regla_umbral'
  );

  // AGRUPACION - Sidebar Principal (debe ir antes de otros para que tenga prioridad)
  if (isAgrupacion) {
    return (
      <AgrupacionSidebar
        selectedTable={selectedTable || 'entidad'}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  if (isGeografia) {
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel) {
      return (
        <GeografiaOperationsSidebar
          selectedTable={selectedTable || ''}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
    return (
      <GeografiaSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  if (isParametros) {
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel) {
      return (
        <ParametrosOperationsSidebar
          selectedTable={selectedTable || ''}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
    return (
      <ParametrosSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  if (isTabla) {
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel) {
      return (
        <TablaOperationsSidebar
          selectedTable={selectedTable || ''}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
    return (
      <TablaSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  if (isNotificaciones) {
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel) {
      return (
        <NotificacionesOperationsSidebar
          selectedTable={selectedTable || ''}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
    return (
      <NotificacionesSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  // DISPOSITIVOS - Sidebar Auxiliar 2 y 3 (debe ir ANTES de isParameters para que tenga prioridad)
  // PERO: si forceConfiguracionSidebar es true, saltar este bloque para renderizar ConfiguracionSidebar
  console.log('[AuxiliarySidebar] 🔍 EVALUANDO DISPOSITIVOS:', {
    isDispositivos,
    forceConfiguracionSidebar,
    shouldEnter: isDispositivos && !forceConfiguracionSidebar,
    activeTab
  });
  if (isDispositivos && !forceConfiguracionSidebar) {
    // Extraer la tabla del activeTab si no está en selectedTable
    const extractedTable = activeTab.replace('configuracion-dispositivos', '').replace(/^-/, '') || '';
    const finalSelectedTable = selectedTable || extractedTable;
    
    console.log('[AuxiliarySidebar] DISPOSITIVOS:', {
      activeTab,
      selectedTable,
      extractedTable,
      finalSelectedTable,
      showThirdLevel,
      forceConfiguracionSidebar
    });
    
    // CORRECCIÓN: Sidebar 2 = Operaciones (ESTADO, CREAR, ACTUALIZAR)
    // Sidebar 3 = Tablas (TIPO, METRICA, SENSOR)
    // Si showThirdLevel es false, renderizar el segundo sidebar (operaciones)
    if (!showThirdLevel && finalSelectedTable && finalSelectedTable !== '') {
      console.log('[AuxiliarySidebar] ✅ Renderizando DispositivosOperationsSidebar (Sidebar 2 - Operaciones):', {
        showThirdLevel,
        finalSelectedTable,
        activeTab
      });
      return (
        <DispositivosOperationsSidebar
          selectedTable={finalSelectedTable}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si showThirdLevel es true, renderizar el tercer sidebar (tablas)
    // El Sidebar 3 siempre se muestra cuando estamos en dispositivos, incluso si hay una tabla seleccionada
    // Esto permite que el usuario pueda cambiar de tabla
    if (showThirdLevel) {
      console.log('[AuxiliarySidebar] ✅ Renderizando DispositivosSidebar (Sidebar 3 - Tablas):', {
        showThirdLevel,
        finalSelectedTable,
        activeTab
      });
      return (
        <DispositivosSidebar
          selectedTable={finalSelectedTable}
          onTableSelect={onTableSelect || (() => {})}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }
    
    // Si showThirdLevel es true pero no hay tabla seleccionada, no renderizar nada (debería mostrar Sidebar 2)
    console.warn('[AuxiliarySidebar] ⚠️ DISPOSITIVOS: Condición no manejada:', {
      showThirdLevel,
      finalSelectedTable,
      activeTab
    });
    
    // Si hay tabla seleccionada pero showThirdLevel es false, no renderizar nada aquí
    // El Sidebar 3 se renderizará en SidebarContainer
    console.log('[AuxiliarySidebar] Tabla seleccionada pero showThirdLevel es false, retornando null');
    return null;
  }

  // USUARIOS - Sidebar Auxiliar 2 y 3 (similar a DISPOSITIVOS)
  // CORRECCIÓN: Sidebar 2 = Operaciones (ESTADO, CREAR, ACTUALIZAR)
  // Sidebar 3 = Tablas (USUARIO, CORREO, etc.)
  if (isUsuarios && !forceConfiguracionSidebar) {
    // Extraer la tabla del activeTab si no está en selectedTable
    const extractedTable = activeTab.replace('configuracion-usuarios', '').replace(/^-/, '') || '';
    const finalSelectedTable = selectedTable || extractedTable;
    
    // Si showThirdLevel es false Y hay una tabla seleccionada, renderizar el segundo sidebar (operaciones)
    if (!showThirdLevel && finalSelectedTable && finalSelectedTable !== '') {
      console.log('[AuxiliarySidebar] ✅ Renderizando UsuariosOperationsSidebar (Sidebar 2 - Operaciones):', {
        showThirdLevel,
        finalSelectedTable,
        activeTab
      });
      return (
        <UsuariosOperationsSidebar
          selectedTable={finalSelectedTable}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si showThirdLevel es true, renderizar el tercer sidebar (tablas)
    // El Sidebar 3 siempre se muestra cuando estamos en usuarios, incluso si hay una tabla seleccionada
    if (showThirdLevel) {
      console.log('[AuxiliarySidebar] ✅ Renderizando UsuariosSidebar (Sidebar 3 - Tablas):', {
        showThirdLevel,
        finalSelectedTable,
        activeTab
      });
      return (
        <UsuariosSidebar
          selectedTable={finalSelectedTable}
          onTableSelect={onTableSelect || (() => {})}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }
    
    return null;
  }

  // PARAMETROS GEO - Sidebar Auxiliar 2 y 3 (similar a DISPOSITIVOS y USUARIOS)
  // CORRECCIÓN: Sidebar 2 = Operaciones (ESTADO, CREAR, ACTUALIZAR)
  // Sidebar 3 = Tablas (PAIS, EMPRESA, etc.)
  if (isParametrosGeo && !forceConfiguracionSidebar) {
    // Extraer la tabla del activeTab si no está en selectedTable
    const extractedTable = activeTab.replace('configuracion-parametros-geo', '').replace(/^-/, '') || '';
    const finalSelectedTable = selectedTable || extractedTable;
    
    // Si showThirdLevel es false Y hay una tabla seleccionada, renderizar el segundo sidebar (operaciones)
    if (!showThirdLevel && finalSelectedTable && finalSelectedTable !== '') {
      console.log('[AuxiliarySidebar] ✅ Renderizando ParametrosGeoOperationsSidebar (Sidebar 2 - Operaciones):', {
        showThirdLevel,
        finalSelectedTable,
        activeTab
      });
      return (
        <ParametrosGeoOperationsSidebar
          selectedTable={finalSelectedTable}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si showThirdLevel es true, renderizar el tercer sidebar (tablas)
    // El Sidebar 3 siempre se muestra cuando estamos en parametros-geo, incluso si hay una tabla seleccionada
    if (showThirdLevel) {
      console.log('[AuxiliarySidebar] ✅ Renderizando ParametrosGeoSidebar (Sidebar 3 - Tablas):', {
        showThirdLevel,
        finalSelectedTable,
        activeTab
      });
      return (
        <ParametrosGeoSidebar
          selectedTable={finalSelectedTable}
          onTableSelect={onTableSelect || (() => {})}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }
    
    return null;
  }

  console.log('[AuxiliarySidebar] 🔍 EVALUANDO PARAMETERS:', {
    isParameters,
    activeTab,
    shouldEnter: isParameters,
    isConfiguracion,
    isDispositivos,
    forceConfiguracionSidebar
  });
  if (isParameters) {
    console.error('[AuxiliarySidebar] ❌ ERROR: PARAMETERS (ANTIGUO) SE ESTÁ RENDERIZANDO!', {
      activeTab,
      selectedTable,
      showThirdLevel,
      forceConfiguracionSidebar,
      isConfiguracion,
      isDispositivos,
      isParameters,
      'STACK TRACE': new Error().stack
    });
    
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel) {
      return (
        <ParametersOperationsSidebar
          selectedTable={selectedTable || ''}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
    return (
      <ParametersSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  if (isAlertas) {
    // Determinar qué tabla de alertas está activa
    const isRegla = activeTab?.startsWith('alertas-regla') && !activeTab?.startsWith('alertas-regla_');
    const isReglaObjeto = activeTab?.startsWith('alertas-regla_objeto');
    const isReglaUmbral = activeTab?.startsWith('alertas-regla_umbral');
    const isReglaPerfil = activeTab?.startsWith('alertas-regla_perfil');
    
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel && (isRegla || isReglaObjeto || isReglaUmbral || isReglaPerfil)) {
      // Convertir activeSubTab a 'status' | 'insert' (ReglaOperationsSidebar solo acepta estos dos)
      const reglaActiveSubTabOld: 'status' | 'insert' = 
        (reglaSubTab === 'status' || reglaSubTab === 'insert') 
          ? reglaSubTab 
          : ((activeSubTab === 'status' || activeSubTab === 'insert') ? activeSubTab : 'status');
      
      // Wrapper para onSubTabChange que solo acepta 'status' | 'insert'
      const handleReglaSubTabChangeOld = (subTab: 'status' | 'insert') => {
        if (onReglaSubTabChange) {
          onReglaSubTabChange(subTab);
        } else if (onSubTabChange) {
          onSubTabChange(subTab as 'status' | 'insert' | 'update' | 'massive');
        }
      };
      
      return (
        <ReglaOperationsSidebar
          activeSubTab={reglaActiveSubTabOld}
          onSubTabChange={handleReglaSubTabChangeOld}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
    return (
      <AlertasSidebar
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    );
  }

  // PERMISOS - Sidebar Auxiliar 2 y 3 (similar a DISPOSITIVOS, USUARIOS, PARAMETROS GEO, NOTIFICACIONES)
  // CORRECCIÓN: Sidebar 2 = Operaciones (ESTADO, CREAR, ASIGNAR)
  // Sidebar 3 = Tipos (PERMISOS GEO, PERMISOS CONF)
  // PERO: si forceConfiguracionSidebar es true, saltar este bloque para renderizar ConfiguracionSidebar
  if (isPermisosConfig && !forceConfiguracionSidebar) {
    // Extraer el tipo de permisos (permisos-geo o permisos-conf)
    const permisosTipo = activeTab.startsWith('configuracion-permisos-permisos-') 
      ? activeTab.replace('configuracion-permisos-permisos-', 'permisos-')
      : selectedTable || '';
    
    // Si showThirdLevel es false Y hay un tipo seleccionado, renderizar el segundo sidebar (operaciones)
    if (!showThirdLevel && permisosTipo && permisosTipo !== '' && isPermisosTipoSelected) {
      console.log('[AuxiliarySidebar] ✅ Renderizando PermisosTipoOperationsSidebar (Sidebar 2 - Operaciones):', {
        showThirdLevel,
        permisosTipo,
        activeTab
      });
      return (
        <PermisosTipoOperationsSidebar
          selectedTipo={permisosTipo}
          activeSubTab={(activeSubTab === 'asignar' ? 'status' : (activeSubTab as 'status' | 'insert' | 'asignar')) || 'status'}
          onSubTabChange={(subTab: 'status' | 'insert' | 'asignar') => {
            if (onSubTabChange) {
              // Convertir 'asignar' a un tipo compatible si es necesario
              if (subTab === 'asignar') {
                onSubTabChange('update' as 'status' | 'insert' | 'update' | 'massive');
              } else {
                onSubTabChange(subTab as 'status' | 'insert' | 'update' | 'massive');
              }
            }
          }}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si showThirdLevel es true, renderizar el tercer sidebar (tipos)
    // El Sidebar 3 siempre se muestra cuando estamos en permisos, incluso si hay un tipo seleccionado
    if (showThirdLevel || !isPermisosTipoSelected) {
      console.log('[AuxiliarySidebar] ✅ Renderizando PermisosTipoSidebar (Sidebar 3 - Tipos):', {
        showThirdLevel,
        permisosTipo,
        activeTab,
        isPermisosTipoSelected
      });
      return (
        <PermisosTipoSidebar
          selectedTipo={permisosTipo}
          onTipoSelect={onTableSelect || (() => {})}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'asignar' | 'massive') || 'status'}
          onSubTabChange={(subTab: 'status' | 'insert' | 'update' | 'asignar' | 'massive') => {
            if (onSubTabChange) {
              onSubTabChange(subTab as 'status' | 'insert' | 'update' | 'massive');
            }
          }}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }
    
    return null;
  }

  if (isPermisos) {
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel) {
      return (
        <PermisosOperationsSidebar
          activeSubTab={permisosSubTab || (activeSubTab as 'status' | 'insert' | 'update' | 'asignar') || 'status'}
          onSubTabChange={onPermisosSubTabChange || ((onSubTabChange as ((subTab: 'status' | 'insert' | 'update' | 'asignar') => void)) || (() => {}))}
          onSubTabChangeFromProtectedButton={onPermisosSubTabChangeFromProtectedButton}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          activeTab={activeTab}
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
      return (
        <PermisosSidebar
          selectedTable={selectedTable || (activeTab.startsWith('permisos-') ? activeTab.replace('permisos-', '') : 'permiso')}
          onTableSelect={onTableSelect || ((table: string) => onTabChange?.(`permisos-${table}`))}
          activeSubTab={permisosSubTab || (activeSubTab as 'status' | 'insert' | 'update' | 'asignar') || 'status'}
          onSubTabChange={onPermisosSubTabChange || ((onSubTabChange as ((subTab: 'status' | 'insert' | 'update' | 'asignar') => void)) || (() => {}))}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
    );
  }

  // Lógica para dashboards
  if (isDashboard) {
    // Si showDashboardThirdLevel es true, renderizar el tercer sidebar de dashboards
    if (showDashboardThirdLevel) {
      return (
        <ReportesDashboardSidebar
          activeSubTab={dashboardSubTab || 'mapeo'}
          onSubTabChange={onDashboardSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      );
    }

    // Si no es showDashboardThirdLevel, renderizar el segundo sidebar de reportes
    const reportesIcon = (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );

    return (
      <BaseAuxiliarySidebar
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title={t('tabs.reports')}
        icon={reportesIcon}
        color="brown"
      >
        {/* Subpestañas de reportes */}
        <div className="py-4">
          {reportesSubTabs.map((subTab) => {
            // Para Dashboard, considerar activo si es reportes-dashboard o empieza con reportes-dashboard-
            const isActive = subTab.id === 'dashboard' 
              ? (activeTab === `reportes-${subTab.id}` || activeTab.startsWith(`reportes-${subTab.id}-`))
              : activeTab === `reportes-${subTab.id}`;
            return (
              <button
                key={subTab.id}
                onClick={() => onTabChange(`reportes-${subTab.id}`)}
                className={`w-full flex items-center p-3 rounded transition-colors ${
                  isExpanded ? 'gap-3' : 'justify-center'
                } ${
                  isActive
                    ? "bg-amber-800 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {subTab.icon}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium tracking-wider">{subTab.label.toUpperCase()}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filtros para Alertas */}
        {activeTab === 'reportes-alertas' && (
          <AlertasFilters isExpanded={isExpanded} />
        )}
      </BaseAuxiliarySidebar>
    );
  }

  if (isReportes) {
    const reportesIcon = (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );

    return (
      <BaseAuxiliarySidebar
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title={t('tabs.reports')}
        icon={reportesIcon}
        color="brown"
      >
        {/* Subpestañas de reportes */}
        <div className="py-4">
          {reportesSubTabs.map((subTab) => {
            // Para Dashboard, considerar activo si es reportes-dashboard o empieza con reportes-dashboard-
            const isActive = subTab.id === 'dashboard' 
              ? (activeTab === `reportes-${subTab.id}` || activeTab.startsWith(`reportes-${subTab.id}-`))
              : activeTab === `reportes-${subTab.id}`;
            return (
              <button
                key={subTab.id}
                onClick={() => onTabChange(`reportes-${subTab.id}`)}
                className={`w-full flex items-center p-3 rounded transition-colors ${
                  isExpanded ? 'gap-3' : 'justify-center'
                } ${
                  isActive
                    ? "bg-amber-800 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {subTab.icon}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium tracking-wider">{subTab.label.toUpperCase()}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filtros para Alertas */}
        {activeTab === 'reportes-alertas' && (
          <AlertasFilters isExpanded={isExpanded} />
        )}
      </BaseAuxiliarySidebar>
    );
  }

  // NOTIFICACIONES - Caso especial: REGLA (Sidebar Auxiliar 3 y 4)
  if (isReglaNotificaciones && !forceConfiguracionSidebar) {
    console.log('[AuxiliarySidebar] Renderizando REGLA (NOTIFICACIONES):', { 
      isReglaNotificaciones, 
      isReglaTableSelected,
      showThirdLevel,
      selectedTable,
      activeTab
    });
    
    // Si showThirdLevel es true, significa que SidebarContainer está manejando el renderizado del cuarto sidebar
    // En este caso, NO renderizar nada aquí, dejar que SidebarContainer lo maneje
    if (showThirdLevel) {
      return null;
    }
    
    // Si ya se seleccionó una tabla de regla (regla, regla_perfil, regla_umbral), NO renderizar nada aquí
    // Dejar que SidebarContainer maneje el renderizado del Sidebar 4 (ReglaOperationsSidebar)
    // Esto evita que se muestre ReglaOperationsSidebar en el Sidebar 3
    if (isReglaTableSelected) {
      console.log('[AuxiliarySidebar] Tabla de regla seleccionada, retornando null para que SidebarContainer maneje el Sidebar 4');
      return null;
    }

    // Si no se ha seleccionado una tabla, mostrar Sidebar Auxiliar 3 (tablas de regla)
    return (
      <ReglaSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  // NOTIFICACIONES - Sidebar Auxiliar 2 y 3 (similar a DISPOSITIVOS, USUARIOS y PARAMETROS GEO)
  // NOTIFICACIONES - Sidebar Auxiliar 2 y 3 (similar a DISPOSITIVOS, USUARIOS, PARAMETROS GEO)
  // CORRECCIÓN: Sidebar 2 = Operaciones (ESTADO, CREAR, ACTUALIZAR)
  // Sidebar 3 = Tablas (CRITICIDAD, UMBRAL, REGLA, REGLA_OBJETO)
  // NOTA: REGLA tiene un caso especial con Sidebar 4, pero la lógica base es la misma
  if (isNotificacionesConfig && !forceConfiguracionSidebar && !isReglaNotificaciones) {
    console.log('[AuxiliarySidebar] Renderizando NOTIFICACIONES:', { 
      isNotificacionesConfig, 
      forceConfiguracionSidebar, 
      showThirdLevel,
      selectedTable,
      isReglaNotificaciones
    });
    
    // Si showThirdLevel es false Y hay una tabla seleccionada, renderizar el segundo sidebar (operaciones)
    if (!showThirdLevel && selectedTable && selectedTable !== '' && selectedTable !== 'regla') {
      console.log('[AuxiliarySidebar] ✅ Renderizando NotificacionesOperationsSidebar (Sidebar 2 - Operaciones):', {
        showThirdLevel,
        selectedTable,
        activeTab
      });
      return (
        <NotificacionesOperationsSidebar
          selectedTable={selectedTable || ''}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }

    // Si showThirdLevel es true, renderizar el tercer sidebar (tablas)
    // El Sidebar 3 siempre se muestra cuando estamos en notificaciones, incluso si hay una tabla seleccionada
    if (showThirdLevel) {
      console.log('[AuxiliarySidebar] ✅ Renderizando NotificacionesSidebar (Sidebar 3 - Tablas):', {
        showThirdLevel,
        selectedTable,
        activeTab
      });
      return (
        <NotificacionesSidebar
          selectedTable={selectedTable || ''}
          onTableSelect={onTableSelect || (() => {})}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
        />
      );
    }
    
    return null;
  }

  // REPORTES ADMINISTRADOR - Sidebar Auxiliar 2 (debe ir antes de CONFIGURACIÓN para que tenga prioridad)
  if (isReportesAdmin) {
    return (
      <ReportesAdminSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        formData={formData}
        multipleData={multipleData}
        massiveFormData={massiveFormData}
      />
    );
  }

  // CONFIGURACIÓN - Sidebar Auxiliar 1 (siempre mostrar cuando está en configuracion o sus subsecciones)
  // NOTA: Cuando isDispositivos, isUsuarios, isParametrosGeo o isNotificacionesConfig es true y forceConfiguracionSidebar es true, este sidebar se renderiza primero
  const shouldShowConfiguracion = isConfiguracion && (forceConfiguracionSidebar || (!isDispositivos && !isUsuarios && !isParametrosGeo && !isNotificacionesConfig && !isReportesAdmin));
  console.log('[AuxiliarySidebar] 🔍 EVALUANDO CONFIGURACIÓN:', {
    isConfiguracion,
    forceConfiguracionSidebar,
    condition1: forceConfiguracionSidebar,
    condition2: (!isDispositivos && !isUsuarios && !isParametrosGeo && !isNotificacionesConfig && !isReportesAdmin),
    shouldShowConfiguracion,
    activeTab
  });
  if (shouldShowConfiguracion) {
    // Extraer la sección seleccionada (dispositivos, usuarios, etc.)
    const selectedSection = activeTab.startsWith('configuracion-') 
      ? activeTab.replace('configuracion-', '').split('-')[0] 
      : '';
    
    console.log('[AuxiliarySidebar] ✅ RENDERIZANDO CONFIGURACIÓN (Sidebar 1):', {
      activeTab,
      selectedSection,
      forceConfiguracionSidebar,
      isDispositivos,
      isUsuarios,
      isParametrosGeo,
      isNotificacionesConfig,
      isReportesAdmin,
      showThirdLevel
    });
    
    return (
      <ConfiguracionSidebar
        selectedSection={selectedSection}
        onSectionSelect={(section) => {
          if (onTabChange) {
            onTabChange(`configuracion-${section}`);
          }
        }}
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  console.warn('[AuxiliarySidebar] ⚠️ NO SE RENDERIZÓ NINGÚN SIDEBAR - retornando null', {
    activeTab,
    selectedTable,
    showThirdLevel,
    forceConfiguracionSidebar,
    isConfiguracion,
    isDispositivos,
    isUsuarios,
    isParametrosGeo
  });
  return null;
};

export default AuxiliarySidebar;
