import React from 'react';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import MainSidebar from './MainSidebar';
import AuxiliarySidebar from './AuxiliarySidebar';
import ReglaOperationsSidebar from './ReglaOperationsSidebar';

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
  onPermisosSubTabChangeFromProtectedButton
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
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={false}
          />
        </div>
      )}

      {/* Sidebar auxiliar para CONFIGURACIÓN (SIEMPRE PRIMERO cuando está en configuracion o sus subsecciones) */}
      {/* IMPORTANTE: Este debe renderizarse ANTES del Sidebar 3 para evitar que ParametersSidebar se renderice */}
      {(() => {
        const isConfiguracion = activeTab === 'configuracion' || activeTab.startsWith('configuracion-');
        const shouldShow = isConfiguracion && hasAuxiliarySidebar(activeTab);
        const forceConfig = activeTab.startsWith('configuracion-dispositivos') || 
                           activeTab.startsWith('configuracion-usuarios') || 
                           activeTab.startsWith('configuracion-parametros-geo') || 
                           activeTab.startsWith('configuracion-notificaciones') || 
                           activeTab.startsWith('configuracion-permisos') || 
                           activeTab.startsWith('configuracion-reportes-administrador');
        console.log('[SidebarContainer] 🔍 CONFIGURACIÓN (Sidebar 1):', {
          activeTab,
          isConfiguracion,
          hasAuxiliarySidebar: hasAuxiliarySidebar(activeTab),
          shouldShow,
          forceConfig,
          'Z-INDEX': 'z-20'
        });
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
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={false}
            forceConfiguracionSidebar={activeTab.startsWith('configuracion-dispositivos') || activeTab.startsWith('configuracion-usuarios') || activeTab.startsWith('configuracion-parametros-geo') || activeTab.startsWith('configuracion-notificaciones') || activeTab.startsWith('configuracion-permisos') || activeTab.startsWith('configuracion-reportes-administrador')}
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
            console.log('[SidebarContainer] DISPOSITIVOS Sidebar 3:', {
              activeTab,
              selectedTable,
              extractedTable,
              dispositivosTable,
              shouldShow: dispositivosTable && dispositivosTable !== ''
            });
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
            // Para DISPOSITIVOS: SIEMPRE mostrar Sidebar 3 (tablas) cuando estamos en dispositivos
            (isDispositivos && hasAuxiliarySidebar(activeTab)) ||
            (isUsuarios && usuariosTable && usuariosTable !== '' && activeTab !== 'configuracion-usuarios') ||
            (isParametrosGeo && parametrosGeoTable && parametrosGeoTable !== '' && activeTab !== 'configuracion-parametros-geo') ||
            (activeTab.startsWith('configuracion-notificaciones') && !activeTab.startsWith('configuracion-notificaciones-regla') && selectedTable) ||
            (activeTab.startsWith('configuracion-permisos-permisos-') && selectedTable)
          );
          console.log('[SidebarContainer] 🔍 SIDEBAR 3 (Tablas):', {
            activeTab,
            isDispositivos,
            dispositivosTable,
            shouldShow,
            condition: isDispositivos && hasAuxiliarySidebar(activeTab)
          });
          return shouldShow && (
            <div className="flex-shrink-0 z-30">
              <AuxiliarySidebar
                isExpanded={auxiliarySidebarExpanded}
                onMouseEnter={handleAuxiliarySidebarMouseEnter}
                onMouseLeave={handleAuxiliarySidebarMouseLeave}
                activeTab={activeTab}
                onTabChange={onTabChange}
                selectedTable={selectedTable || dispositivosTable || usuariosTable || parametrosGeoTable || ''}
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

      {/* Sidebar auxiliar para PERMISOS (cuando está en configuracion-permisos, mostrar a la derecha del ConfiguracionSidebar) */}
      {(() => {
        const shouldShow = activeTab.startsWith('configuracion-permisos') && hasAuxiliarySidebar(activeTab);
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
            dashboardSubTab={dashboardSubTab}
            onDashboardSubTabChange={onDashboardSubTabChange}
            formData={formData}
            multipleData={multipleData}
            massiveFormData={massiveFormData}
            showThirdLevel={activeTab.startsWith('configuracion-permisos-permisos-')}
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
        console.log('[SidebarContainer] DISPOSITIVOS Sidebar 2 (Operaciones):', {
          activeTab,
          selectedTable,
          dispositivosTable,
          shouldShow,
          isDispositivos,
          hasAuxiliarySidebar: hasAuxiliarySidebar(activeTab)
        });
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

      {/* Sidebar auxiliar para USUARIOS (cuando está en configuracion-usuarios, mostrar a la derecha del ConfiguracionSidebar) */}
      {/* Solo mostrar Sidebar 2 cuando NO hay tabla seleccionada */}
      {(() => {
        const isUsuarios = activeTab.startsWith('configuracion-usuarios');
        // Extraer la tabla del activeTab si no está en selectedTable
        const usuariosTable = selectedTable || (activeTab.replace('configuracion-usuarios', '').replace(/^-/, '') || '');
        // Solo mostrar Sidebar 2 si no hay tabla seleccionada (activeTab es exactamente 'configuracion-usuarios' o la tabla está vacía)
        const shouldShow = isUsuarios && hasAuxiliarySidebar(activeTab) && (!usuariosTable || usuariosTable === '' || activeTab === 'configuracion-usuarios');
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

      {/* Sidebar auxiliar para PARAMETROS GEO (cuando está en configuracion-parametros-geo, mostrar a la derecha del ConfiguracionSidebar) */}
      {/* Solo mostrar Sidebar 2 cuando NO hay tabla seleccionada */}
      {(() => {
        const isParametrosGeo = activeTab.startsWith('configuracion-parametros-geo');
        // Extraer la tabla del activeTab si no está en selectedTable
        const parametrosGeoTable = selectedTable || (activeTab.replace('configuracion-parametros-geo', '').replace(/^-/, '') || '');
        // Solo mostrar Sidebar 2 si no hay tabla seleccionada (activeTab es exactamente 'configuracion-parametros-geo' o la tabla está vacía)
        const shouldShow = isParametrosGeo && hasAuxiliarySidebar(activeTab) && (!parametrosGeoTable || parametrosGeoTable === '' || activeTab === 'configuracion-parametros-geo');
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

      {/* Sidebar auxiliar para NOTIFICACIONES (cuando está en configuracion-notificaciones, mostrar a la derecha del ConfiguracionSidebar) */}
      {/* Mostrar también cuando está en REGLA (configuracion-notificaciones-regla) para mantener el contexto */}
      {(() => {
        const isNotificaciones = activeTab.startsWith('configuracion-notificaciones');
        const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
        // Mostrar NOTIFICACIONES siempre que estemos en configuracion-notificaciones (incluyendo cuando estamos en REGLA)
        const shouldShow = isNotificaciones && hasAuxiliarySidebar(activeTab);
        // Si estamos en REGLA, usar 'configuracion-notificaciones' como activeTab y 'regla' como selectedTable para que se renderice NotificacionesSidebar correctamente
        const notificacionesTab = isReglaNotificaciones ? 'configuracion-notificaciones' : activeTab;
        const notificacionesSelectedTable = isReglaNotificaciones ? 'regla' : selectedTable;
        console.log('[SidebarContainer] NOTIFICACIONES (Sidebar 2):', {
          isNotificaciones,
          isReglaNotificaciones,
          notificacionesTab,
          notificacionesSelectedTable,
          shouldShow,
          activeTab,
          selectedTable
        });
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-20`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={(() => {
              const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
              return isReglaNotificaciones ? 'configuracion-notificaciones' : activeTab;
            })()}
            onTabChange={onTabChange}
            selectedTable={(() => {
              const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
              return isReglaNotificaciones ? 'regla' : selectedTable;
            })()}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
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

      {/* Sidebar auxiliar para REGLA (Sidebar Auxiliar 3) - cuando está en configuracion-notificaciones-regla sin tabla seleccionada */}
      {(() => {
        const isReglaNotificaciones = activeTab.startsWith('configuracion-notificaciones-regla');
        // Verificar si se ha seleccionado una tabla de regla (regla, regla_perfil, regla_umbral)
        // NOTA: No usar activeTab.includes('-regla-') sin verificar porque 'configuracion-notificaciones-regla' incluye 'regla' pero no tiene guion después
        const isReglaTableSelected = isReglaNotificaciones && (
          selectedTable === 'regla' ||
          selectedTable === 'regla_perfil' || 
          selectedTable === 'regla_umbral' ||
          (activeTab.includes('-regla-') && !activeTab.endsWith('-regla')) ||
          activeTab.includes('-regla_perfil-') ||
          activeTab.includes('-regla_umbral-')
        );
        // Mostrar Sidebar 3 solo si estamos en REGLA y NO hay una tabla seleccionada
        const shouldShow = isReglaNotificaciones && !isReglaTableSelected && hasAuxiliarySidebar(activeTab);
        console.log('[SidebarContainer] REGLA (Sidebar 3):', {
          isReglaNotificaciones,
          isReglaTableSelected,
          shouldShow,
          activeTab,
          selectedTable
        });
        return shouldShow;
      })() && (
        <div className={`${getAuxiliarySidebarClasses()} flex-shrink-0 z-30`}>
          <AuxiliarySidebar
            isExpanded={auxiliarySidebarExpanded}
            onMouseEnter={handleAuxiliarySidebarMouseEnter}
            onMouseLeave={handleAuxiliarySidebarMouseLeave}
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedTable={selectedTable || ''}
            onTableSelect={onTableSelect}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
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
        // Verificar si se ha seleccionado una tabla de regla específica (regla_perfil, regla_umbral)
        // NOTA: 'regla' no cuenta como tabla seleccionada porque es el selector principal
        const isReglaTableSelected = isReglaNotificaciones && (
          selectedTable === 'regla_perfil' || 
          selectedTable === 'regla_umbral' ||
          activeTab.includes('-regla_perfil-') ||
          activeTab.includes('-regla_umbral-')
        );
        const hasAux = hasAuxiliarySidebar(activeTab);
        const shouldShow = isReglaTableSelected && hasAux;
        console.log('[SidebarContainer] REGLA OPERATIONS (Sidebar 4):', {
          isReglaNotificaciones,
          isReglaTableSelected,
          hasAux,
          shouldShow,
          selectedTable,
          activeTab
        });
        console.log('[SidebarContainer] REGLA OPERATIONS - Renderizando Sidebar 4:', {
          shouldShow,
          selectedTable,
          activeTab,
          isReglaTableSelected,
          hasAux
        });
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
