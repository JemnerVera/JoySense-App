import React from 'react';
import NotificacionesSidebar from './NotificacionesSidebar';
import NotificacionesOperationsSidebar from './NotificacionesOperationsSidebar';
import ReglaOperationsSidebar from './ReglaOperationsSidebar';
import ReglaSidebar from './ReglaSidebar';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import AlertasFilters from './AlertasFilters';
import ReportesDashboardSidebar from './ReportesDashboardSidebar';
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
import AgrupacionOperationsSidebar from './AgrupacionOperationsSidebar';
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
  // onSubTabChange se usa en múltiples secciones; para PERMISOS también debe aceptar 'asignar'
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => void;
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
  onSubTabChangeFromProtectedButton?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  reglaSubTab?: 'status' | 'insert' | 'update';
  forceConfiguracionSidebar?: boolean; // Forzar renderizado de ConfiguracionSidebar incluso si isDispositivos es true
  onReglaSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  isSidebarAux3?: boolean; // Indica si estamos en Sidebar Aux 3 (para NOTIFICACIONES)
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
  isSidebarAux3 = false,
  onPermisosSubTabChangeFromProtectedButton,
  onSubTabChangeFromProtectedButton,
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
  const isAlertas = activeTab === 'alertas' || activeTab.startsWith('alertas-');
  const isReportes = activeTab === 'reportes' || (activeTab.startsWith('reportes-') && activeTab !== 'reportes-dashboard' && !activeTab.startsWith('reportes-dashboard-'));
  const isDashboard = activeTab === 'reportes-dashboard' || activeTab.startsWith('reportes-dashboard-');
  
  // Caso especial: REGLA dentro de NOTIFICACIONES
  const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
  // Verificar si se ha seleccionado una tabla de regla específica (regla, regla_perfil, regla_umbral)
  // IMPORTANTE: No confundir 'regla' en selectedTable (que viene del Sidebar 2) con una tabla específica seleccionada
  // Solo considerar que hay una tabla seleccionada si activeTab incluye el nombre de la tabla específica
  // Ej: 'configuracion-notificaciones-regla-regla' o 'configuracion-notificaciones-regla-regla_perfil'
  const check1 = activeTab.includes('-regla-') && !activeTab.endsWith('-regla') && activeTab !== 'configuracion-notificaciones-regla';
  const check2 = activeTab.includes('-regla_perfil-');
  const check3 = activeTab.includes('-regla_umbral-');
  const check4 = activeTab.includes('-regla_objeto-');
  const check5 = activeTab === 'configuracion-notificaciones-regla-regla';
  const check6 = activeTab === 'configuracion-notificaciones-regla-regla_perfil';
  const check7 = activeTab === 'configuracion-notificaciones-regla-regla_umbral';
  const check8 = activeTab === 'configuracion-notificaciones-regla-regla_objeto';
  const check9 = (selectedTable === 'regla_perfil' || selectedTable === 'regla_umbral' || selectedTable === 'regla_objeto');
  const isReglaTableSelected = isReglaNotificaciones && (
    check1 || check2 || check3 || check4 || check5 || check6 || check7 || check8 || check9
  );

  // AGRUPACION - Sidebar Auxiliar 1 y 2 (similar a DISPOSITIVOS, USUARIOS, PARAMETROS GEO)
  if (isAgrupacion) {
    // Extraer la tabla del activeTab
    // Si activeTab es exactamente 'agrupacion', no hay tabla seleccionada (vacío)
    const agrupacionTable = activeTab === 'agrupacion' 
      ? '' 
      : (activeTab.replace('agrupacion-', '') || selectedTable || '');
    
    // CORRECCIÓN: Sidebar 2 = Operaciones (ESTADO, CREAR, ACTUALIZAR)
    // Sidebar 3 = Tablas (ENTIDAD, LOCALIZACIÓN DE ENTIDAD)
    // Si showThirdLevel es false, renderizar el segundo sidebar (operaciones)
    if (!showThirdLevel && agrupacionTable && agrupacionTable !== '') {
      console.log('[DEBUG] AuxiliarySidebar: Mostrando AgrupacionOperationsSidebar', {
        agrupacionTable,
        activeTab,
        showThirdLevel
      });
      return (
        <AgrupacionOperationsSidebar
          selectedTable={agrupacionTable}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
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
    // El Sidebar 3 siempre se muestra cuando estamos en agrupacion, incluso si hay una tabla seleccionada
    // Esto permite que el usuario pueda cambiar de tabla
    if (showThirdLevel) {
      console.log('[DEBUG] AuxiliarySidebar: Mostrando AgrupacionSidebar', {
        agrupacionTable,
        activeTab,
        showThirdLevel
      });
      return (
        <AgrupacionSidebar
          selectedTable={agrupacionTable}
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
    
    // Si hay tabla seleccionada pero showThirdLevel es false, no renderizar nada aquí
    // (el Sidebar 2 se renderizará en la sección anterior)
    return null;
  }


  // DISPOSITIVOS - Sidebar Auxiliar 2 y 3 (debe ir ANTES de isParameters para que tenga prioridad)
  // PERO: si forceConfiguracionSidebar es true, saltar este bloque para renderizar ConfiguracionSidebar
  if (isDispositivos && !forceConfiguracionSidebar) {
    // Extraer la tabla del activeTab si no está en selectedTable
    const extractedTable = activeTab.replace('configuracion-dispositivos', '').replace(/^-/, '') || '';
    const finalSelectedTable = selectedTable || extractedTable;
    
    // CORRECCIÓN: Sidebar 2 = Operaciones (ESTADO, CREAR, ACTUALIZAR)
    // Sidebar 3 = Tablas (TIPO, METRICA, SENSOR)
    // Si showThirdLevel es false, renderizar el segundo sidebar (operaciones)
    if (!showThirdLevel && finalSelectedTable && finalSelectedTable !== '') {
      return (
        <DispositivosOperationsSidebar
          selectedTable={finalSelectedTable}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
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
    
    // Si hay tabla seleccionada pero showThirdLevel es false, no renderizar nada aquí
    // El Sidebar 3 se renderizará en SidebarContainer
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
      return (
        <PermisosTipoOperationsSidebar
          selectedTipo={permisosTipo}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'asignar') || 'status'}
          onSubTabChange={(subTab: 'status' | 'insert' | 'asignar') => {
            if (!onSubTabChange) return;
            // Pasar el subTab real al padre (incluyendo 'asignar')
            onSubTabChange(subTab as 'status' | 'insert' | 'update' | 'massive' | 'asignar');
          }}
          isExpanded={isExpanded}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          formData={formData}
          multipleData={multipleData}
          massiveFormData={massiveFormData}
          selectedTable={selectedTable || 'permiso'}
        />
      );
    }

    // Si showThirdLevel es true, renderizar el tercer sidebar (tipos)
    // El Sidebar 3 siempre se muestra cuando estamos en permisos, incluso si hay un tipo seleccionado
    if (showThirdLevel || !isPermisosTipoSelected) {
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
        color="blue"
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
                    ? "bg-blue-600 text-white"
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

  if (isReportes && !isDashboard) {
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
        color="blue"
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
                    ? "bg-blue-600 text-white"
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

  // NOTIFICACIONES - Sidebar Auxiliar 2 y 3 (similar a DISPOSITIVOS, USUARIOS y PARAMETROS GEO)
  // NOTIFICACIONES - Sidebar Auxiliar 2 (Tablas: CRITICIDAD, UMBRAL, REGLA, REGLA_OBJETO)
  // NOTA: REGLA tiene un caso especial con Sidebar 3 y 4, pero la lógica base es la misma
  // IMPORTANTE: Para REGLA, permitir que entre aquí incluso si forceConfiguracionSidebar es true
  // porque necesitamos mostrar NotificacionesSidebar (Sidebar Aux 2) cuando showThirdLevel=false
  if (isNotificacionesConfig && (!forceConfiguracionSidebar || isReglaNotificaciones)) {
    // Extraer la tabla del activeTab si no está en selectedTable
    const extractedTable = activeTab.replace('configuracion-notificaciones', '').replace(/^-/, '') || '';
    const finalSelectedTable = selectedTable || extractedTable;
    
    // CORRECCIÓN: Verificar si estamos en REGLA
    const isInReglaSection = activeTab === 'configuracion-notificaciones-regla' || 
                             activeTab.startsWith('configuracion-notificaciones-regla-');
    
    // CORRECCIÓN: 
    // Sidebar Aux 2 (showThirdLevel=false) = Tablas (CRITICIDAD, UMBRAL, REGLA, REGLA_OBJETO) = NotificacionesSidebar
    // Sidebar Aux 3 (showThirdLevel=true) = Tablas de regla (REGLA, REGLA_PERFIL, REGLA_UMBRAL, REGLA_OBJETO) = ReglaSidebar (solo cuando estamos en REGLA)
    // Sidebar Aux 4 = Operaciones (ESTADO, CREAR) = ReglaOperationsSidebar (solo cuando se selecciona una tabla de regla)
    
    // LÓGICA PARA NOTIFICACIONES (IGUAL A DISPOSITIVOS):
    // Sidebar Aux 2 (isSidebarAux3=false): SIEMPRE mostrar TABLAS (NotificacionesSidebar)
    // Sidebar Aux 3 (isSidebarAux3=true Y showThirdLevel=false): OPERACIONES (NotificacionesOperationsSidebar)
    // Sidebar Aux 3 (isSidebarAux3=true Y showThirdLevel=true): REGLA (ReglaSidebar)
    if (!showThirdLevel) {
      // Sidebar Aux 3: Mostrar OPERACIONES cuando hay tabla seleccionada (igual que DISPOSITIVOS)
      if (isSidebarAux3 && finalSelectedTable && finalSelectedTable !== '' && finalSelectedTable !== 'regla' && !isInReglaSection) {
        return (
          <NotificacionesOperationsSidebar
            selectedTable={finalSelectedTable}
            activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
            onSubTabChange={onSubTabChange || (() => {})}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            isExpanded={isExpanded}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
          />
        );
      }
      
      // Sidebar Aux 2: SIEMPRE mostrar TABLAS (NotificacionesSidebar)
      const tableToSelect = isInReglaSection ? 'regla' : finalSelectedTable;
      return (
        <NotificacionesSidebar
          selectedTable={tableToSelect}
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

    // Si showThirdLevel es true, renderizar Sidebar Aux 3 (ReglaSidebar con REGLA, REGLA_PERFIL, REGLA_UMBRAL, REGLA_OBJETO)
    // Solo cuando estamos en REGLA
    if (showThirdLevel) {
      
      // Si estamos en REGLA, mostrar ReglaSidebar (Sidebar Aux 3)
      // IMPORTANTE: Siempre mostrar ReglaSidebar cuando estamos en REGLA, incluso si hay una tabla seleccionada
      // Esto permite que el usuario pueda cambiar de tabla y ver todas las opciones disponibles
      if (isReglaNotificaciones) {
        // Extraer la tabla de regla específica del activeTab si existe
        // Ej: 'configuracion-notificaciones-regla-regla_perfil' -> 'regla_perfil'
        let reglaTableToSelect = '';
        if (activeTab.includes('-regla-') && !activeTab.endsWith('-regla')) {
          const parts = activeTab.split('-regla-');
          if (parts.length > 1) {
            reglaTableToSelect = parts[1].split('-')[0] || '';
          }
    }

        // Mostrar ReglaSidebar (Sidebar Aux 3) con REGLA, REGLA_PERFIL, REGLA_UMBRAL, REGLA_OBJETO
        // Si hay una tabla seleccionada, pasarla como selectedTable para que se muestre activa
    return (
      <ReglaSidebar
            selectedTable={reglaTableToSelect || selectedTable || ''}
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

      // Para otras tablas de notificaciones, no debería llegar aquí con showThirdLevel=true
      // Pero por si acaso, mostrar NotificacionesSidebar
      return (
        <NotificacionesSidebar
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
    
    // Si hay tabla seleccionada pero showThirdLevel es false, no renderizar nada aquí
    // El Sidebar 3 se renderizará en SidebarContainer
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

  // CONFIGURACIÓN - Sidebar Auxiliar 1
  // NOTA: ConfiguracionSidebar ahora se renderiza explícitamente en SidebarContainer (Sidebar Aux 1)
  // Por lo tanto, NO debemos renderizarlo aquí para evitar duplicación
  // Si estamos en configuración pero no en ninguna subsección específica, no renderizar nada
  // (el SidebarContainer manejará el renderizado de ConfiguracionSidebar)
  if (isConfiguracion && !isDispositivos && !isUsuarios && !isParametrosGeo && !isNotificacionesConfig && !isPermisosConfig && !isReportesAdmin) {
    return null;
  }

  return null;
};

export default AuxiliarySidebar;
