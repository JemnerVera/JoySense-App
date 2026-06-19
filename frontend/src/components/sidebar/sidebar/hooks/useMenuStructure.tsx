import { useMemo } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useMenuPermissions } from '../../../../hooks/useMenuPermissions';
import {
  getDispositivosTables,
  getUsuariosTables,
  getParametrosGeoTables,
  getNotificacionesTables,
} from '../../../../config/tables.config';
import { createOperations, getTableIcon, createTablesLevel3 } from '../utils/menuHelpers';
import type { MainTab, SubMenuLevel2 } from '../../types';
import {
  IconReportes,
  IconDashboard,
  IconMetrica,
  IconMapeo,
  IconStatusNodos,
  IconCriticidad,
  IconHistorial,
  IconAlertas,
  IconMensajes,
  IconAgrupacion,
  IconEntidad,
  IconEntidadLocalizacion,
  IconCarpeta,
  IconConfiguracion,
  IconDispositivos,
  IconUsuario,
  IconUsuarios,
  IconPais,
  IconNotificaciones,
  IconPermisos,
  IconTable,
  IconAjustes,
  IconSensor,
  IconMetricaSensor,
  IconFundo,
  IconCriticidad as IconUmbralAlt,
  IconWeather,
  IconWeatherConditions,
  IconWeatherDetails,
  IconWeatherHistory,
  IconWeatherResumen,
  IconPlantaProc,
} from '../utils/menuIcons';

export function useMenuStructure() {
  const { t } = useLanguage();
  const { menuAccess, loading: menuLoading, hasAccess } = useMenuPermissions();
  const isLoadingPermissions = menuLoading;

  const hasAccessToMenu = (menuName: string): boolean => {
    const hasDirectAccess = menuAccess.some(
      (item) => item.menu === menuName && item.tiene_acceso
    );
    if (hasDirectAccess) return true;

    const parentMenu = menuAccess.find((m) => m.menu === menuName);
    if (parentMenu) {
      const hasChildAccess = menuAccess.some(
        (item) => item.padreid === parentMenu.menuid && item.tiene_acceso
      );
      return hasChildAccess;
    }
    return false;
  };

  const createOps = (name: string, allowMassive?: boolean) => createOperations(name, t, allowMassive);
  const dispositivosTables = useMemo(() => getDispositivosTables(), []);
  const usuariosTables = useMemo(() => getUsuariosTables(), []);
  const parametrosGeoTables = useMemo(() => getParametrosGeoTables(), []);
  const notificacionesTables = useMemo(() => getNotificacionesTables(), []);

  const mainTabs = useMemo((): MainTab[] => {
    const tabs: MainTab[] = [
      {
        id: 'reportes',
        label: t('tabs.reports'),
        icon: <IconReportes />,
        color: 'blue',
        requiresPermission: true,
        requiredMenu: 'REPORTES',
        subMenus: [
          {
            id: 'dashboard',
            label: t('subtabs.dashboard'),
            icon: <IconDashboard />,
            subMenus: [
              { id: 'mediciones', label: t('menu.mediciones'), icon: <IconSensor /> },
              { id: 'mapeo', label: t('menu.mapeo'), icon: <IconMapeo /> },
              { id: 'status-nodos', label: t('menu.statusNodos'), icon: <IconStatusNodos /> },
              { id: 'status-alertas', label: t('menu.statusAlertas'), icon: <IconAlertas /> },
              { id: 'metrica', label: t('menu.metricaLocalizacion'), icon: <IconMetricaSensor /> },
              { id: 'umbrales', label: t('menu.umbralesLocalizacion'), icon: <IconUmbralAlt /> },
              // REMOVIDO: sensores-planta (PLC) se moverá a pestaña independiente
            ],
          },
      {
        id: 'historial',
        label: t('menu.historial'),
        icon: <IconHistorial />,
        subMenus: [
          { id: 'alertas', label: t('subtabs.alerts'), icon: <IconAlertas /> },
          { id: 'mensajes', label: t('subtabs.messages'), icon: <IconMensajes /> },
        ],
      },
        ],
      },
      {
        id: 'agrupacion',
        label: t('menu.carpeta'),
        icon: <IconAgrupacion />,
        color: 'green',
        requiresPermission: true,
        requiredMenu: 'CARPETA',
        subMenus: [
          {
            id: 'entidad',
            label: t('menu.personal'),
            icon: <IconUsuario />,
            hasOperations: true,
            subMenus: createOps('agrupacion-entidad'),
          },
          {
            id: 'carpeta',
            label: t('menu.compartida'),
            icon: <IconUsuarios />,
            hasOperations: true,
            subMenus: createOps('agrupacion-carpeta'),
          },
        ],
      },
      {
        id: 'configuracion',
        label: t('menu.configuracion'),
        icon: <IconConfiguracion />,
        color: 'orange',
        requiresPermission: true,
        requiredMenu: 'CONFIGURACIÓN',
        subMenus: [
          {
            id: 'parametros-geo',
            label: t('menu.parametrosGeo'),
            icon: <IconPais />,
            subMenus: createTablesLevel3(
              parametrosGeoTables,
              'configuracion-parametros-geo',
              createOps,
              getTableIcon
            ),
          },
          {
            id: 'dispositivos',
            label: t('menu.dispositivos'),
            icon: <IconDispositivos />,
            subMenus: createTablesLevel3(
              dispositivosTables,
              'configuracion-dispositivos',
              createOps,
              getTableIcon
            ),
          },
          {
            id: 'usuarios',
            label: t('menu.usuarios'),
            icon: <IconUsuarios />,
            subMenus: createTablesLevel3(
              usuariosTables,
              'configuracion-usuarios',
              createOps,
              getTableIcon
            ),
          },
          {
            id: 'notificaciones',
            label: t('menu.notificaciones'),
            icon: <IconNotificaciones />,
            subMenus: notificacionesTables.map((table): SubMenuLevel2 => {
              if (table.name === 'regla') {
                return {
                  id: 'regla',
                  label: t('menu.alertas'),
                  icon: getTableIcon(table.name),
                  subMenus: [
                    {
                      id: 'regla',
                      label: t('menu.alertas'),
                      icon: getTableIcon('regla'),
                      hasOperations: true,
                      subMenus: createOps('configuracion-notificaciones-regla-regla'),
                    },
                    {
                      id: 'regla_objeto',
                      label: t('menu.alcanceRegla'),
                      icon: getTableIcon('regla'),
                      hasOperations: true,
                      subMenus: createOps('configuracion-notificaciones-regla-regla_objeto'),
                    },
                  ],
                };
              }
              return {
                id: table.name,
                label: table.displayName.toUpperCase(),
                icon: getTableIcon(table.name),
                hasOperations: true,
                subMenus: createOps(`configuracion-notificaciones-${table.name}`, table.allowMassive),
              };
            }),
          },
          {
            id: 'permisos',
            label: t('menu.permisos'),
            icon: <IconPermisos />,
            subMenus: [
              {
                id: 'permisos-geo',
                label: t('menu.permisosGeo'),
                icon: <IconPais />,
                hasOperations: true,
                subMenus: createOps('configuracion-permisos-permisos-geo'),
              },
              {
                id: 'permisos-conf',
                label: t('menu.permisosConf'),
                icon: <IconTable />,
                hasOperations: true,
                subMenus: createOps('configuracion-permisos-permisos-conf'),
              },
            ],
          },
          {
            id: 'reportes-administrador',
            label: t('menu.reportesAdmin'),
            icon: <IconTable />,
            subMenus: [
              { id: 'sensor_valor_error', label: t('menu.sensorValorError'), icon: <IconSensor /> },
              { id: 'audit_log_umbral', label: t('menu.auditLogUmbral'), icon: <IconCriticidad /> },
              { id: 'msg_outbox', label: t('menu.msgOutbox'), icon: <IconMensajes /> },
              { id: 'auth_outbox', label: t('menu.authOutbox'), icon: <IconMensajes /> },
            ],
          },
        ],
      },
      {
        id: 'ajustes',
        label: t('menu.ajustes'),
        icon: <IconAjustes />,
        color: 'gray',
        requiresPermission: true,
        requiredMenu: 'AJUSTES',
        subMenus: [
          {
            id: 'basicas',
            label: t('menu.ajustesGenerales'),
            icon: <IconConfiguracion />,
          },
        ],
      },
      {
        id: 'planta-proc',
        label: t('tabs.plantaProc'),
        icon: <IconPlantaProc />,
        color: 'blue',
        subMenus: [
          {
            id: 'dashboard',
            label: 'DASHBOARD PLC',
            icon: <IconSensor />,
          },
        ],
      },
      {
        id: 'meteorologia',
        label: t('menu.meteorologia'),
        icon: <IconWeather />,
        color: 'gray',
        requiresPermission: true,
        requiredMenu: 'METEOROLOGÍA',
        subMenus: [
          {
            id: 'conditions',
            label: t('menu.condicionActual'),
            icon: <IconWeatherConditions />,
          },
          {
            id: 'details',
            label: t('menu.detalles'),
            icon: <IconWeatherDetails />,
          },
          {
            id: 'data-historica',
            label: t('menu.dataHistorica'),
            icon: <IconWeatherHistory />,
          },
          {
            id: 'resumen',
            label: t('menu.resumen'),
            icon: <IconWeatherResumen />,
          },
        ],
      },
    ];

    if (isLoadingPermissions) return [];

    const filteredTabs = tabs.filter((tab) => {
      if (!tab.requiresPermission) return true;
      if (tab.id === 'agrupacion') {
        const result = hasAccessToMenu('CARPETA');
        if (result) return true;
        return (
          hasAccess('GRUPO') ||
          hasAccess('LOCALIZACIÓN POR GRUPO') ||
          hasAccess('CARPETA') ||
          hasAccess('ENTIDAD') ||
          hasAccess('ENTIDAD LOCALIZACION')
        );
      }
      if (tab.id === 'configuracion') return hasAccessToMenu('CONFIGURACIÓN');
      if (tab.id === 'reportes') return hasAccessToMenu('REPORTES');
      if (tab.id === 'ajustes') return hasAccessToMenu('AJUSTES');
      if (tab.id === 'meteorologia') return hasAccessToMenu('METEOROLOGÍA');
      return false;
    });

    return filteredTabs;
  }, [
    t,
    hasAccess,
    hasAccessToMenu,
    isLoadingPermissions,
    menuAccess,
    dispositivosTables,
    usuariosTables,
    parametrosGeoTables,
    notificacionesTables,
  ]);

  return { mainTabs, isLoadingPermissions };
}
