import React from 'react';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import MainSidebar from './MainSidebar';
import AuxiliarySidebar from './AuxiliarySidebar';
import ReglaOperationsSidebar from './ReglaOperationsSidebar';
import ConfiguracionSidebar from './ConfiguracionSidebar';

interface SidebarContainerProps {
  showWelcome: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  authToken: string;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => void;
  dashboardSubTab?: 'mapeo' | 'metrica' | 'umbrales';
  onDashboardSubTabChange?: (subTab: 'mapeo' | 'metrica' | 'umbrales') => void;
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
  const {
    mainSidebarExpanded,
    auxiliarySidebarExpanded,
    hasAuxiliarySidebar,
    handleMainSidebarMouseEnter,
    handleMainSidebarMouseLeave,
    handleAuxiliarySidebarMouseEnter,
    handleAuxiliarySidebarMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
    getMainContentMargin,
    getMainSidebarClasses,
    getAuxiliarySidebarClasses
  } = useSidebarLayout({ showWelcome, activeTab });

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

      {/* Sidebar auxiliar (excluir permisos, configuracion y agrupacion - se manejan después) */}
      {hasAuxiliarySidebar(activeTab) && activeTab !== 'permisos' && !activeTab.startsWith('permisos-') && 
       activeTab !== 'configuracion' && !activeTab.startsWith('configuracion-') &&
       activeTab !== 'agrupacion' && !activeTab.startsWith('agrupacion-') && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
          />
        </div>
      )}

      {/* Sidebar auxiliar para AGRUPACION (cuando está en agrupacion, mostrar a la derecha del MainSidebar) */}
      {(() => {
        const shouldShow = (activeTab === 'agrupacion' || activeTab.startsWith('agrupacion-')) && hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
          />
        </div>
      )}

      {/* Sidebar Aux 1: CONFIGURACIÓN (SIEMPRE visible cuando está en configuracion o sus subsecciones) */}
      {(() => {
        const isConfiguracion = activeTab === 'configuracion' || activeTab.startsWith('configuracion-');
        const shouldShow = isConfiguracion && hasAuxiliarySidebar(activeTab);
        // Extraer la sección seleccionada (dispositivos, usuarios, notificaciones, etc.)
        const selectedSection = activeTab.startsWith('configuracion-') 
          ? activeTab.replace('configuracion-', '').split('-')[0] 
          : '';
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-10`}>
          <ConfiguracionSidebar
            selectedSection={(() => {
              const section = activeTab.startsWith('configuracion-') 
                ? activeTab.replace('configuracion-', '').split('-')[0] 
                : '';
              return section;
            })()}
            onSectionSelect={(section) => {
              if (onTabChange) {
                onTabChange(`configuracion-${section}`);
              }
            }}
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
          />
        </div>
      )}

      {/* Sidebar Aux 2: NOTIFICACIONES, DISPOSITIVOS, USUARIOS, etc. (visible cuando hay una subsección seleccionada) */}
      {(() => {
        const isConfiguracion = activeTab === 'configuracion' || activeTab.startsWith('configuracion-');
        const shouldShow = isConfiguracion && hasAuxiliarySidebar(activeTab);
        const computedSelectedTable = (() => {
          // Para NOTIFICACIONES: si estamos en REGLA, usar 'regla' como tabla seleccionada para mostrar NotificacionesSidebar
          if (activeTab.startsWith('configuracion-notificaciones-regla')) {
            return 'regla';
          }
          return selectedTable;
        })();
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={(() => {
              // Para NOTIFICACIONES: si estamos en REGLA, usar 'regla' como tabla seleccionada para mostrar NotificacionesSidebar
              if (activeTab.startsWith('configuracion-notificaciones-regla')) {
                return 'regla';
              }
              return selectedTable;
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

      {/* Tercer sidebar para geografía, parámetros, tabla, notificaciones, parameters y dispositivos (solo cuando hay tabla seleccionada) */}
      {hasAuxiliarySidebar(activeTab) && (
        (() => {
          const isDispositivos = activeTab.startsWith('configuracion-dispositivos');
          const isUsuarios = activeTab.startsWith('configuracion-usuarios');
          const isParametrosGeo = activeTab.startsWith('configuracion-parametros-geo');
          // Extraer la tabla del activeTab si no está en selectedTable para dispositivos, usuarios y parametros-geo
          let dispositivosTable = '';
          let usuariosTable = '';
          let parametrosGeoTable = '';
          if (isDispositivos) {
            // Extraer tabla del activeTab: 'configuracion-dispositivos-tipo' -> 'tipo'
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
          const shouldShow = (
            activeTab === 'geografia' || activeTab.startsWith('geografia-') ||
            activeTab === 'parametros' || activeTab.startsWith('parametros-') ||
            activeTab === 'tabla' || activeTab.startsWith('tabla-') ||
            activeTab === 'notificaciones' || activeTab.startsWith('notificaciones-') ||
            activeTab === 'parameters' || activeTab.startsWith('parameters-') ||
            // Para DISPOSITIVOS, USUARIOS y PARAMETROS GEO: SIEMPRE mostrar Sidebar 3 (tablas) cuando estamos en esas secciones
            (isDispositivos && hasAuxiliarySidebar(activeTab)) ||
            (isUsuarios && hasAuxiliarySidebar(activeTab)) ||
            (isParametrosGeo && hasAuxiliarySidebar(activeTab)) ||
            // Para NOTIFICACIONES: SIEMPRE mostrar Sidebar 3 (tablas) cuando estamos en notificaciones (incluyendo REGLA)
            (activeTab.startsWith('configuracion-notificaciones') && hasAuxiliarySidebar(activeTab)) ||
            // Para PERMISOS: SIEMPRE mostrar Sidebar 3 (tipos) cuando estamos en permisos
            (activeTab.startsWith('configuracion-permisos') && hasAuxiliarySidebar(activeTab))
          );
          const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
          return shouldShow && (
            <div className="flex-shrink-0 z-30">
              <AuxiliarySidebar
                isExpanded={auxiliarySidebarExpanded}
                onMouseEnter={handleAuxiliarySidebarMouseEnter}
                onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
                showThirdLevel={true}
                forceConfiguracionSidebar={false}
              />
            </div>
          );
        })()
      )}

      {/* Sidebar auxiliar para REPORTES ADMINISTRADOR (cuando está en configuracion-reportes-administrador, mostrar a la derecha del ConfiguracionSidebar) */}
      {(() => {
        const shouldShow = activeTab.startsWith('configuracion-reportes-administrador') && hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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

      {/* Sidebar auxiliar para PERMISOS - Sidebar 2 (Operaciones: ESTADO, CREAR, ASIGNAR) */}
      {/* Solo mostrar cuando hay un tipo seleccionado (permisos-geo o permisos-conf) */}
      {(() => {
        const isPermisos = activeTab.startsWith('configuracion-permisos');
        const isPermisosTipoSelected = activeTab.startsWith('configuracion-permisos-permisos-');
        // Solo mostrar Sidebar 2 (operaciones) cuando hay un tipo seleccionado
        const shouldShow = isPermisos && 
                          isPermisosTipoSelected &&
                          hasAuxiliarySidebar(activeTab);
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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

      {/* Sidebar auxiliar para DISPOSITIVOS - Sidebar 2 (Operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {/* Solo mostrar cuando hay una tabla seleccionada */}
      {(() => {
        const isDispositivos = activeTab.startsWith('configuracion-dispositivos');
        // Extraer la tabla del activeTab si no está en selectedTable
        const dispositivosTable = selectedTable || (activeTab.replace('configuracion-dispositivos', '').replace(/^-/, '') || '');
        // Solo mostrar Sidebar 2 (operaciones) cuando hay una tabla seleccionada
        const shouldShow = isDispositivos && 
                          hasAuxiliarySidebar(activeTab) && 
                          dispositivosTable && 
                          dispositivosTable !== '' && 
                          activeTab !== 'configuracion-dispositivos';
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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

      {/* Sidebar auxiliar para USUARIOS - Sidebar 2 (Operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {/* Solo mostrar cuando hay una tabla seleccionada */}
      {(() => {
        const isUsuarios = activeTab.startsWith('configuracion-usuarios');
        // Extraer la tabla del activeTab si no está en selectedTable
        const usuariosTable = selectedTable || (activeTab.replace('configuracion-usuarios', '').replace(/^-/, '') || '');
        // Solo mostrar Sidebar 2 (operaciones) cuando hay una tabla seleccionada
        const shouldShow = isUsuarios && 
                          hasAuxiliarySidebar(activeTab) && 
                          usuariosTable && 
                          usuariosTable !== '' && 
                          activeTab !== 'configuracion-usuarios';
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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

      {/* Sidebar auxiliar para PARAMETROS GEO - Sidebar 2 (Operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {/* Solo mostrar cuando hay una tabla seleccionada */}
      {(() => {
        const isParametrosGeo = activeTab.startsWith('configuracion-parametros-geo');
        // Extraer la tabla del activeTab si no está en selectedTable
        const parametrosGeoTable = selectedTable || (activeTab.replace('configuracion-parametros-geo', '').replace(/^-/, '') || '');
        // Solo mostrar Sidebar 2 (operaciones) cuando hay una tabla seleccionada
        const shouldShow = isParametrosGeo && 
                          hasAuxiliarySidebar(activeTab) && 
                          parametrosGeoTable && 
                          parametrosGeoTable !== '' && 
                          activeTab !== 'configuracion-parametros-geo';
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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

      {/* Sidebar auxiliar para NOTIFICACIONES - Sidebar 2 (Operaciones: ESTADO, CREAR, ACTUALIZAR) */}
      {/* Solo mostrar cuando hay una tabla seleccionada (excepto REGLA que tiene su propia lógica) */}
      {(() => {
        const isNotificaciones = activeTab.startsWith('configuracion-notificaciones');
        const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
        // Solo mostrar Sidebar 2 (operaciones) cuando hay una tabla seleccionada y NO estamos en REGLA
        const notificacionesTable = selectedTable || (activeTab.replace('configuracion-notificaciones', '').replace(/^-/, '') || '');
        const shouldShow = isNotificaciones && 
                          !isReglaNotificaciones &&
                          hasAuxiliarySidebar(activeTab) && 
                          notificacionesTable && 
                          notificacionesTable !== '' && 
                          notificacionesTable !== 'regla' &&
                          activeTab !== 'configuracion-notificaciones';
        return shouldShow;
      })() && (
            <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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

      {/* Sidebar auxiliar para REGLA OPERATIONS (Sidebar Auxiliar 4) - cuando se selecciona una tabla de regla específica */}
      {(() => {
        const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
        // Verificar si se ha seleccionado una tabla de regla específica
        // IMPORTANTE: No confundir 'regla' en selectedTable (que viene del Sidebar 2) con una tabla específica seleccionada
        // Solo considerar que hay una tabla seleccionada si activeTab incluye el nombre de la tabla específica
        const check1 = activeTab.includes('-regla-') && !activeTab.endsWith('-regla') && activeTab !== 'configuracion-notificaciones-regla';
        const check2 = activeTab.includes('-regla_perfil-');
        const check3 = activeTab.includes('-regla_umbral-');
        const check4 = activeTab === 'configuracion-notificaciones-regla-regla';
        const check5 = activeTab === 'configuracion-notificaciones-regla-regla_perfil';
        const check6 = activeTab === 'configuracion-notificaciones-regla-regla_umbral';
        const check7 = (selectedTable === 'regla_perfil' || selectedTable === 'regla_umbral');
        const check8 = (selectedTable === 'regla' && activeTab !== 'configuracion-notificaciones-regla');
        const isReglaTableSelected = isReglaNotificaciones && (
          check1 || check2 || check3 || check4 || check5 || check6 || check7 || check8
        );
        const hasAux = hasAuxiliarySidebar(activeTab);
        const shouldShow = isReglaTableSelected && hasAux;
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-40`}>
          <ReglaOperationsSidebar
            selectedTable={selectedTable || ''}
            activeSubTab={((activeSubTab === 'status' || activeSubTab === 'insert') ? activeSubTab : 'status') as 'status' | 'insert'}
            onSubTabChange={(onSubTabChange ? ((subTab: 'status' | 'insert' | 'update' | 'massive') => {
              if (subTab === 'status' || subTab === 'insert') {
                onSubTabChange(subTab);
              }
            }) : (() => {})) as ((subTab: 'status' | 'insert') => void)}
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
        (activeTab === 'alertas-regla_umbral' || activeTab.startsWith('alertas-regla_umbral-')) ||
        (activeTab === 'alertas-regla_perfil' || activeTab.startsWith('alertas-regla_perfil-'))
      ) && (
        <div className="flex-shrink-0 z-30">
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
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
