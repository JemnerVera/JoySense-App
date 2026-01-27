import React from 'react';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useSectionPermissions } from '../../hooks/useSectionPermissions';
import MainSidebar from './MainSidebar';
import AuxiliarySidebar from './AuxiliarySidebar';
import ReglaOperationsSidebar from './ReglaOperationsSidebar';
import ConfiguracionSidebar from './ConfiguracionSidebar';
import AjustesSidebar from './AjustesSidebar';

interface SidebarContainerProps {
  showWelcome: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  authToken: string;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => void;
  dashboardSubTab?: 'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales';
  onDashboardSubTabChange?: (subTab: 'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales') => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
  onPermisosSubTabChangeFromProtectedButton?: (subTab: 'status' | 'insert' | 'update' | 'asignar' | 'massive') => void;
  onSubTabChangeFromProtectedButton?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({
  showWelcome,
  activeTab,
  onTabChange,
  authToken,
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange,
  dashboardSubTab,
  onDashboardSubTabChange,
  formData = {},
  multipleData = [],
  massiveFormData = {},
  onPermisosSubTabChangeFromProtectedButton,
  onSubTabChangeFromProtectedButton
}) => {
  // Verificar permisos para REPORTES ADMINISTRADOR antes de renderizar
  const reportesAdminPermissions = useSectionPermissions({ tableNames: ['msg_outbox'] });

  const {
    mainSidebarExpanded,
    auxiliarySidebarExpanded,
    aux1Expanded,
    aux2Expanded,
    aux3Expanded,
    aux4Expanded,
    hasAuxiliarySidebar,
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleAux1MouseEnter,
    handleAux1MouseLeave,
    handleAux2MouseEnter,
    handleAux2MouseLeave,
    handleAux3MouseEnter,
    handleAux3MouseLeave,
    handleAux4MouseEnter,
    handleAux4MouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    getMainContentMargin,
    getMainSidebarClasses,
    getAuxiliarySidebarClasses
  } = useSidebarState({ showWelcome, activeTab });

  return (
    <div className="flex h-full flex-shrink-0 relative">
      {/* Contenedor del sidebar principal - NO FIXED */}
      <div className={`${getMainSidebarClasses().replace('fixed', 'relative')} flex-shrink-0 z-10`}>
        <MainSidebar
          isExpanded={mainSidebarExpanded}
          onMouseEnter={handleMainSidebarMouseEnter}
          onMouseLeave={handleMainSidebarMouseLeave}
          onTabChange={onTabChange}
          activeTab={activeTab}
          authToken={authToken}
        />
      </div>

      {/* Sidebar auxiliar (excluir permisos, configuracion, agrupacion y ajustes - se manejan después) */}
      {hasAuxiliarySidebar(activeTab) && activeTab !== 'permisos' && !activeTab.startsWith('permisos-') && 
       activeTab !== 'configuracion' && !activeTab.startsWith('configuracion-') &&
       activeTab !== 'agrupacion' && !activeTab.startsWith('agrupacion-') &&
       activeTab !== 'ajustes' && !activeTab.startsWith('ajustes-') && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={aux2Expanded}
            onMouseEnter={handleAux2MouseEnter}
            onMouseLeave={handleAux2MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onExpandAllSidebars={() => {
              // Cuando se hace click en HISTORIAL, expandir tanto aux1 como aux2
              handleAux1MouseEnter();
              handleAux2MouseEnter();
            }}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
          />
        </div>
      )}

      {/* Sidebar Aux 1: CONFIGURACIÓN (SIEMPRE visible cuando está en configuracion o sus subsecciones) */}
      {(() => {
        const isConfiguracion = activeTab === 'configuracion' || activeTab.startsWith('configuracion-')
        // Mostrar siempre cuando estamos en configuracion (para seleccionar subsección) o en sus subsecciones
        const shouldShow = isConfiguracion && hasAuxiliarySidebar(activeTab)
        return shouldShow
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-10`}>
          <ConfiguracionSidebar
            selectedSection={(() => {
              if (!activeTab.startsWith('configuracion-')) return ''

              const rest = activeTab.replace('configuracion-', '')
              const parts = rest.split('-')

              // Manejar secciones compuestas como 'parametros-geo' y 'reportes-administrador'
              if (parts[0] === 'parametros' && parts[1] === 'geo') return 'parametros-geo'
              if (parts[0] === 'reportes' && parts[1] === 'administrador') return 'reportes-administrador'

              // Para secciones simples como 'dispositivos', 'usuarios', 'notificaciones', 'permisos'
              return parts[0] || ''
            })()}
            onSectionSelect={(section) => {
              if (onTabChange) {
                onTabChange(`configuracion-${section}`);
              }
            }}
            isExpanded={aux1Expanded}
            onMouseEnter={handleAux1MouseEnter}
            onMouseLeave={handleAux1MouseLeave}
          />
        </div>
      )}

      {/* Sidebar Aux 1: AJUSTES (SIEMPRE visible cuando está en ajustes o sus subsecciones) */}
      {(() => {
        const isAjustes = activeTab === 'ajustes' || activeTab.startsWith('ajustes-')
        const shouldShow = isAjustes && hasAuxiliarySidebar(activeTab)
        return shouldShow
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-10`}>
          <AjustesSidebar
            selectedSection={(() => {
              // Solo marcar como seleccionada si activeTab es 'ajustes-basicas' o empieza con 'ajustes-basicas-'
              // Si activeTab es exactamente 'ajustes', no marcar ninguna sección como seleccionada
              if (activeTab === 'ajustes-basicas' || activeTab.startsWith('ajustes-basicas-')) {
                return 'basicas';
              }
              return '' as any; // Retornar vacío para que no se marque ninguna pestaña como activa
            })()}
            onSectionSelect={(section) => {
              if (onTabChange) {
                onTabChange('ajustes-basicas');
              }
            }}
            isExpanded={aux1Expanded}
            onMouseEnter={handleAux1MouseEnter}
            onMouseLeave={handleAux1MouseLeave}
          />
        </div>
      )}

      {/* Sidebar Aux 2: NOTIFICACIONES (NotificacionesSidebar) - SIEMPRE visible cuando estamos en NOTIFICACIONES */}
      {(() => {
        const isNotificaciones = activeTab.startsWith('configuracion-notificaciones');
        // Sidebar Aux 2 debe SIEMPRE mostrarse cuando estamos en NOTIFICACIONES (los sidebars se acumulan)
        const shouldShow = isNotificaciones && hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className="flex-shrink-0 z-20">
          <AuxiliarySidebar
            isExpanded={aux2Expanded}
            onMouseEnter={handleAux2MouseEnter}
            onMouseLeave={handleAux2MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable || (activeTab.replace('configuracion-notificaciones', '').replace(/^-/, '') || '')}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={false}
            forceConfiguracionSidebar={false}
            isSidebarAux3={false}
          />
        </div>
      )}

      {/* Sidebar auxiliar para DISPOSITIVOS, USUARIOS, PARAMETROS GEO - Sidebar 2 (Tablas) */}
      {/* Mostrar siempre cuando estamos en esas secciones */}
      {(() => {
        const isDispositivos = activeTab.startsWith('configuracion-dispositivos');
        const isUsuarios = activeTab.startsWith('configuracion-usuarios');
        const isParametrosGeo = activeTab.startsWith('configuracion-parametros-geo');
        
        // Extraer la tabla del activeTab si no está en selectedTable
        let dispositivosTable = '';
        let usuariosTable = '';
        let parametrosGeoTable = '';
        
        if (isDispositivos) {
          const extractedTable = activeTab.replace('configuracion-dispositivos', '').replace(/^-/, '') || '';
          dispositivosTable = selectedTable || extractedTable;
        }
        if (isUsuarios) {
          const extractedTable = activeTab.replace('configuracion-usuarios', '').replace(/^-/, '') || '';
          usuariosTable = selectedTable || extractedTable;
        }
        if (isParametrosGeo) {
          const extractedTable = activeTab.replace('configuracion-parametros-geo', '').replace(/^-/, '') || '';
          parametrosGeoTable = selectedTable || extractedTable;
        }
        
        // Mostrar Sidebar 2 (tablas) siempre cuando estamos en esas secciones
        // No requerir hasAuxiliarySidebar porque estas secciones siempre tienen sidebar auxiliar
        const shouldShow = isDispositivos || isUsuarios || isParametrosGeo;
        
        if (!shouldShow) {
          return null;
        }
        
        return (
          <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
            <AuxiliarySidebar
              isExpanded={aux2Expanded}
              onMouseEnter={handleAux2MouseEnter}
              onMouseLeave={handleAux2MouseLeave}
              activeTab={activeTab}
              onTabChange={onTabChange}
              selectedTable={selectedTable || dispositivosTable || usuariosTable || parametrosGeoTable || ''}
              onTableSelect={onTableSelect}
              activeSubTab={activeSubTab}
              onSubTabChange={onSubTabChange}
              onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
              dashboardSubTab={dashboardSubTab}
              onDashboardSubTabChange={onDashboardSubTabChange}
              formData={formData}
              multipleData={multipleData}
              massiveFormData={massiveFormData}
              showThirdLevel={true}
              forceConfiguracionSidebar={false}
            />
          </div>
        );
      })()}

      {/* Sidebar auxiliar para PERMISOS - Sidebar 2 (Tipos: PERMISOS GEO, PERMISOS CONF) */}
      {/* Mostrar siempre cuando estamos en permisos */}
      {(() => {
        const isPermisos = activeTab.startsWith('configuracion-permisos');
        const shouldShow = isPermisos && hasAuxiliarySidebar(activeTab);
        
        if (!shouldShow) {
          return null;
        }
        
        return (
          <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
            <AuxiliarySidebar
              isExpanded={aux2Expanded}
              onMouseEnter={handleAux2MouseEnter}
              onMouseLeave={handleAux2MouseLeave}
              activeTab={activeTab}
              onTabChange={onTabChange}
              selectedTable={(() => {
                // Para PERMISOS: extraer tipo si no está en selectedTable
                if (activeTab.startsWith('configuracion-permisos-permisos-')) {
                  const permisosTipo = activeTab.replace('configuracion-permisos-permisos-', 'permisos-') || selectedTable || '';
                  if (permisosTipo && permisosTipo !== '') return permisosTipo;
                }
                return selectedTable || '';
              })()}
              onTableSelect={onTableSelect}
              activeSubTab={activeSubTab}
              onSubTabChange={onSubTabChange}
              onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
              dashboardSubTab={dashboardSubTab}
              onDashboardSubTabChange={onDashboardSubTabChange}
              formData={formData}
              multipleData={multipleData}
              massiveFormData={massiveFormData}
              showThirdLevel={true}
              forceConfiguracionSidebar={false}
            />
          </div>
        );
      })()}

      {/* Tercer sidebar para NOTIFICACIONES, DISPOSITIVOS, USUARIOS, PARAMETROS GEO - Operaciones (ESTADO, CREAR, ACTUALIZAR) */}
      {(() => {
        const isDispositivos = activeTab.startsWith('configuracion-dispositivos');
        const isUsuarios = activeTab.startsWith('configuracion-usuarios');
        const isParametrosGeo = activeTab.startsWith('configuracion-parametros-geo');
        const isNotificaciones = activeTab.startsWith('configuracion-notificaciones');
        const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
        const isPermisos = activeTab.startsWith('configuracion-permisos');
        const isPermisosTipoSelected = activeTab.startsWith('configuracion-permisos-permisos-');
        
        // Para NOTIFICACIONES: Extraer la tabla seleccionada
        let notificacionesTable = '';
        if (isNotificaciones) {
          const extractedTable = activeTab.replace('configuracion-notificaciones', '').replace(/^-/, '') || '';
          notificacionesTable = selectedTable || extractedTable;
        }
        
        // Para NOTIFICACIONES: Mostrar Sidebar 3 cuando hay una tabla seleccionada (CRITICIDAD, UMBRAL, o REGLA)
        const shouldShowNotificaciones = isNotificaciones && 
                                        hasAuxiliarySidebar(activeTab) && 
                                        notificacionesTable && 
                                        notificacionesTable !== '';
        
        // Extraer tablas para otras secciones
        let dispositivosTable = '';
        let usuariosTable = '';
        let parametrosGeoTable = '';
        
        if (isDispositivos) {
          const extractedTable = activeTab.replace('configuracion-dispositivos', '').replace(/^-/, '') || '';
          dispositivosTable = selectedTable || extractedTable;
        }
        if (isUsuarios) {
          const extractedTable = activeTab.replace('configuracion-usuarios', '').replace(/^-/, '') || '';
          usuariosTable = selectedTable || extractedTable;
        }
        if (isParametrosGeo) {
          const extractedTable = activeTab.replace('configuracion-parametros-geo', '').replace(/^-/, '') || '';
          parametrosGeoTable = selectedTable || extractedTable;
        }
        
        const shouldShow = hasAuxiliarySidebar(activeTab) && (
          activeTab === 'geografia' || activeTab.startsWith('geografia-') ||
          activeTab === 'parametros' || activeTab.startsWith('parametros-') ||
          activeTab === 'tabla' || activeTab.startsWith('tabla-') ||
          activeTab === 'notificaciones' || activeTab.startsWith('notificaciones-') ||
          activeTab === 'parameters' || activeTab.startsWith('parameters-') ||
          // Para DISPOSITIVOS, USUARIOS, PARAMETROS GEO: mostrar Sidebar 3 (operaciones) cuando hay tabla seleccionada
          (isDispositivos && dispositivosTable && dispositivosTable !== '' && activeTab !== 'configuracion-dispositivos') ||
          (isUsuarios && usuariosTable && usuariosTable !== '' && activeTab !== 'configuracion-usuarios') ||
          (isParametrosGeo && parametrosGeoTable && parametrosGeoTable !== '' && activeTab !== 'configuracion-parametros-geo') ||
          // Para NOTIFICACIONES: Mostrar Sidebar 3 cuando hay una tabla seleccionada
          shouldShowNotificaciones
          // NOTA: PERMISOS tiene su propio sidebar 3 más abajo (línea 459), no incluirlo aquí para evitar duplicación
          // NOTA: AGRUPACIÓN tiene su propio sidebar 3 más abajo, no incluirlo aquí para evitar duplicación
        );
        
        // Para NOTIFICACIONES: 
        // - showThirdLevel=true cuando estamos en REGLA (para mostrar ReglaSidebar)
        // - showThirdLevel=false cuando estamos en CRITICIDAD o UMBRAL (para mostrar NotificacionesOperationsSidebar)
        // Para DISPOSITIVOS, USUARIOS, PARAMETROS GEO: usar showThirdLevel=false para mostrar operaciones (aux3)
        // Para otras secciones, usar showThirdLevel=true por defecto
        const showThirdLevelValue = isNotificaciones 
          ? isReglaNotificaciones 
          : (isDispositivos || isUsuarios || isParametrosGeo) 
            ? false 
            : true;
        if (!shouldShow) {
          return null;
        }
        
        return (
          <div className="flex-shrink-0 z-30">
            <AuxiliarySidebar
              isExpanded={aux3Expanded}
              onMouseEnter={handleAux3MouseEnter}
              onMouseLeave={handleAux3MouseLeave}
              activeTab={activeTab}
              onTabChange={onTabChange}
              selectedTable={(() => {
                // Para NOTIFICACIONES: extraer tabla si no está en selectedTable
                // Si estamos en REGLA, NO usar 'regla' aquí, dejar que AuxiliarySidebar lo maneje
                if (activeTab.startsWith('configuracion-notificaciones')) {
                  if (!activeTab.startsWith('configuracion-notificaciones-regla')) {
                    const notificacionesTable = selectedTable || (activeTab.replace('configuracion-notificaciones', '').replace(/^-/, '') || '');
                    if (notificacionesTable && notificacionesTable !== '') return notificacionesTable;
                  }
                  // Si estamos en REGLA, pasar selectedTable tal cual (puede ser 'regla' o una tabla específica)
                  return selectedTable || '';
                }
                // Para PERMISOS: extraer tipo si no está en selectedTable
                if (activeTab.startsWith('configuracion-permisos-permisos-')) {
                  const permisosTipo = activeTab.replace('configuracion-permisos-permisos-', 'permisos-') || selectedTable || '';
                  if (permisosTipo && permisosTipo !== '') return permisosTipo;
                }
                // Para DISPOSITIVOS, USUARIOS, PARAMETROS GEO
                return selectedTable || dispositivosTable || usuariosTable || parametrosGeoTable || '';
              })()}
              onTableSelect={onTableSelect}
              activeSubTab={activeSubTab}
              onSubTabChange={onSubTabChange}
              dashboardSubTab={dashboardSubTab}
              onDashboardSubTabChange={onDashboardSubTabChange}
              formData={formData}
              multipleData={multipleData}
              massiveFormData={massiveFormData}
              showThirdLevel={showThirdLevelValue}
              forceConfiguracionSidebar={false}
              isSidebarAux3={!!(isNotificaciones && shouldShowNotificaciones)}
            />
          </div>
        );
      })()
      }

      {/* Sidebar auxiliar para REPORTES ADMINISTRADOR (cuando está en configuracion-reportes-administrador, mostrar a la derecha del ConfiguracionSidebar) */}
      {(() => {
        const shouldShow = activeTab.startsWith('configuracion-reportes-administrador') && hasAuxiliarySidebar(activeTab);
        // NO renderizar si aún se están cargando permisos o si no tiene acceso
        if (reportesAdminPermissions.loading || !reportesAdminPermissions.hasAccess) {
          return false;
        }
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={aux2Expanded}
            onMouseEnter={handleAux2MouseEnter}
            onMouseLeave={handleAux2MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={false}
            forceConfiguracionSidebar={false}
          />
        </div>
      )}

      {/* Sidebar auxiliar para PERMISOS - Sidebar 3 (Operaciones: ESTADO, CREAR, ASIGNAR) */}
      {/* Solo mostrar cuando hay un tipo seleccionado (permisos-geo o permisos-conf) */}
      {(() => {
        const isPermisos = activeTab.startsWith('configuracion-permisos');
        const isPermisosTipoSelected = activeTab.startsWith('configuracion-permisos-permisos-');
        // Solo mostrar Sidebar 3 (operaciones) cuando hay un tipo seleccionado
        const shouldShow = isPermisos && 
                          isPermisosTipoSelected &&
                          hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={aux3Expanded}
            onMouseEnter={handleAux3MouseEnter}
            onMouseLeave={handleAux3MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={false}
            forceConfiguracionSidebar={false}
          />
        </div>
      )}

      {/* Sidebar auxiliar para AGRUPACIÓN - Sidebar 2 (Tablas) */}
      {/* Mostrar cuando estamos en agrupacion (para seleccionar tabla) o cuando hay una tabla seleccionada */}
      {(() => {
        const isAgrupacion = activeTab === 'agrupacion' || activeTab.startsWith('agrupacion-');
        // Extraer la tabla del activeTab
        const agrupacionTable = activeTab === 'agrupacion' 
          ? '' 
          : (activeTab.replace('agrupacion-', '') || selectedTable || '');
        // Mostrar Sidebar 2 (tablas) siempre cuando estamos en agrupacion
        const shouldShow = isAgrupacion && hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={aux2Expanded}
            onMouseEnter={handleAux2MouseEnter}
            onMouseLeave={handleAux2MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={(() => {
              // Si activeTab es exactamente 'agrupacion', no hay tabla seleccionada (vacío)
              const agrupacionTable = activeTab === 'agrupacion' 
                ? '' 
                : (activeTab.replace('agrupacion-', '') || selectedTable || '');
              return agrupacionTable;
            })()}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={true}
            forceConfiguracionSidebar={false}
          />
        </div>
      )}

      {/* Sidebar auxiliar para AGRUPACIÓN - Sidebar 3 (Operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {/* Solo mostrar cuando hay una tabla seleccionada */}
      {(() => {
        const isAgrupacion = activeTab === 'agrupacion' || activeTab.startsWith('agrupacion-');
        // Extraer la tabla del activeTab
        const agrupacionTable = activeTab === 'agrupacion' 
          ? '' 
          : (activeTab.replace('agrupacion-', '') || selectedTable || '');
        // Solo mostrar Sidebar 3 (operaciones) cuando hay una tabla seleccionada
        const shouldShow = isAgrupacion && 
                          hasAuxiliarySidebar(activeTab) && 
                          agrupacionTable && 
                          agrupacionTable !== '' && 
                          activeTab !== 'agrupacion';
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-30`}>
          <AuxiliarySidebar
            isExpanded={aux3Expanded}
            onMouseEnter={handleAux3MouseEnter}
            onMouseLeave={handleAux3MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={(() => {
              const agrupacionTable = activeTab === 'agrupacion' 
                ? '' 
                : (activeTab.replace('agrupacion-', '') || selectedTable || '');
              return agrupacionTable;
            })()}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={false}
            forceConfiguracionSidebar={false}
          />
        </div>
      )}

      {/* Sidebar auxiliar para REGLA OPERATIONS (Sidebar Auxiliar 4) - cuando se selecciona una tabla de regla específica */}
      {(() => {
        const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
        // Verificar si se ha seleccionado una tabla de regla específica
        // IMPORTANTE: No confundir 'regla' en selectedTable (que viene del Sidebar 2) con una tabla específica seleccionada
        // Solo considerar que hay una tabla seleccionada si activeTab incluye el nombre de la tabla específica
        const check1 = activeTab.includes('-regla-') && !activeTab.endsWith('-regla') && activeTab !== 'configuracion-notificaciones-regla';
        const check2 = activeTab.includes('-regla_perfil-');
        const check4 = activeTab.includes('-regla_objeto-');
        const check5 = activeTab === 'configuracion-notificaciones-regla-regla';
        const check6 = activeTab === 'configuracion-notificaciones-regla-regla_perfil';
        const check8 = activeTab === 'configuracion-notificaciones-regla-regla_objeto';
        const check9 = (selectedTable === 'regla_perfil' || selectedTable === 'regla_objeto');
        const check10 = (selectedTable === 'regla' && activeTab !== 'configuracion-notificaciones-regla');
        const isReglaTableSelected = isReglaNotificaciones && (
          check1 || check2 || check4 || check5 || check6 || check8 || check9 || check10
        );
        const hasAux = hasAuxiliarySidebar(activeTab);
        const shouldShow = isReglaTableSelected && hasAux;
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-40`}>
          <ReglaOperationsSidebar
            selectedTable={selectedTable || ''}
            activeSubTab={((activeSubTab === 'status' || activeSubTab === 'insert' || activeSubTab === 'update') ? activeSubTab : 'status') as 'status' | 'insert' | 'update'}
            onSubTabChange={(onSubTabChange ? ((subTab: 'status' | 'insert' | 'update' | 'massive') => {
              if (subTab === 'status' || subTab === 'insert' || subTab === 'update') {
                onSubTabChange(subTab);
              }
            }) : (() => {})) as ((subTab: 'status' | 'insert' | 'update') => void)}
            isExpanded={aux4Expanded}
            onMouseEnter={handleAux4MouseEnter}
            onMouseLeave={handleAux4MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      )}

      {/* Segundo sidebar para permisos (PERMISO, ORIGEN, FUENTE) */}
      {(() => {
        const shouldShow = (activeTab === 'permisos' || activeTab.startsWith('permisos-')) && hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={aux2Expanded}
            onMouseEnter={handleAux2MouseEnter}
            onMouseLeave={handleAux2MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={false}
            permisosSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'asignar') || 'status'}
            onPermisosSubTabChange={(onSubTabChange as ((subTab: 'status' | 'insert' | 'update' | 'asignar') => void)) || (() => {})}
          />
        </div>
      )}

      {/* Tercer sidebar para permisos (ESTADO, CREAR, ACTUALIZAR, ASIGNAR) - cuando se selecciona cualquier tabla de permisos */}
      {(() => {
        const permisosTable = activeTab.startsWith('permisos-') ? activeTab.replace('permisos-', '') : null;
        const shouldShow = permisosTable && hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={aux3Expanded}
            onMouseEnter={handleAux3MouseEnter}
            onMouseLeave={handleAux3MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={true}
            permisosSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'asignar') || 'status'}
            onPermisosSubTabChange={(onSubTabChange as ((subTab: 'status' | 'insert' | 'update' | 'asignar') => void)) || (() => {})}
            onPermisosSubTabChangeFromProtectedButton={onPermisosSubTabChangeFromProtectedButton as ((subTab: 'status' | 'insert' | 'update' | 'asignar' | 'massive') => void) | undefined}
          />
        </div>
      )}


      {/* Tercer sidebar para ALERTAS (operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {hasAuxiliarySidebar(activeTab) && (
        (activeTab === 'alertas-regla' || activeTab.startsWith('alertas-regla-')) ||
        (activeTab === 'alertas-regla_objeto' || activeTab.startsWith('alertas-regla_objeto-')) ||
        (activeTab === 'alertas-regla_perfil' || activeTab.startsWith('alertas-regla_perfil-'))
      ) && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={aux3Expanded}
            onMouseEnter={handleAux3MouseEnter}
            onMouseLeave={handleAux3MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={true}
            reglaSubTab={(activeSubTab as 'status' | 'insert' | 'update') || 'status'}
            onReglaSubTabChange={(onSubTabChange as ((subTab: 'status' | 'insert' | 'update') => void)) || (() => {})}
          />
        </div>
      )}

      {/* Tercer sidebar para dashboards (solo cuando está en reportes-dashboard) */}
      {hasAuxiliarySidebar(activeTab) && (activeTab === 'reportes-dashboard' || activeTab.startsWith('reportes-dashboard-')) && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={aux3Expanded}
            onMouseEnter={handleAux3MouseEnter}
            onMouseLeave={handleAux3MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showDashboardThirdLevel={true}
          />
        </div>
      )}

      {/* Sidebar Aux 2 para HISTORIAL (solo cuando está en reportes-historial) - Similar a dashboard */}
      {hasAuxiliarySidebar(activeTab) && (activeTab === 'reportes-historial' || activeTab.startsWith('reportes-historial-')) && (
        <div className="flex-shrink-0 z-20">
          <AuxiliarySidebar
            isExpanded={aux2Expanded}
            onMouseEnter={handleAux2MouseEnter}
            onMouseLeave={handleAux2MouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            onSubTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton}
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showHistorialSecondLevel={true}
          />
        </div>
      )}

      {/* Exportar funciones para el contenido principal */}
      <div style={{ display: 'none' }}>
        <div 
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          data-margin={getMainContentMargin()}
        />
      </div>
    </div>
  );
};

export default SidebarContainer;
