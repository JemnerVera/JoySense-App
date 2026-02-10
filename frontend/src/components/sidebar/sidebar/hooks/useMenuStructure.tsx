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
  IconConfiguracion,
  IconDispositivos,
  IconUsuarios,
  IconPais,
  IconNotificaciones,
  IconPermisos,
  IconTable,
  IconAjustes,
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

  const createOps = (name: string) => createOperations(name, t);
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
              { id: 'mediciones', label: 'MEDICIONES', icon: <IconMetrica /> },
              { id: 'mapeo', label: 'MAPEO DE NODOS', icon: <IconMapeo /> },
              { id: 'status-nodos', label: 'STATUS DE NODOS', icon: <IconStatusNodos /> },
              { id: 'status-alertas', label: 'STATUS DE ALERTAS', icon: <IconCriticidad /> },
              { id: 'metrica', label: 'MÉTRICA POR LOCALIZACIÓN', icon: <IconMetrica /> },
              { id: 'umbrales', label: 'UMBRALES POR LOCALIZACIÓN', icon: <IconCriticidad /> },
            ],
          },
          {
            id: 'historial',
            label: 'HISTORIAL',
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
        label: 'AGRUPACIÓN',
        icon: <IconAgrupacion />,
        color: 'green',
        requiresPermission: true,
        requiredMenu: 'AGRUPACIÓN',
        subMenus: [
          {
            id: 'entidad',
            label: 'CARPETA',
            icon: <IconEntidad />,
            hasOperations: true,
            subMenus: createOps('agrupacion-entidad'),
          },
          {
            id: 'entidad_localizacion',
            label: 'LOCALIZACIÓN POR CARPETA',
            icon: <IconEntidadLocalizacion />,
            hasOperations: true,
            subMenus: createOps('agrupacion-entidad_localizacion'),
          },
        ],
      },
      {
        id: 'configuracion',
        label: 'CONFIGURACIÓN',
        icon: <IconConfiguracion />,
        color: 'orange',
        requiresPermission: true,
        requiredMenu: 'CONFIGURACIÓN',
        subMenus: [
          {
            id: 'dispositivos',
            label: 'DISPOSITIVOS',
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
            label: 'USUARIOS',
            icon: <IconUsuarios />,
            subMenus: createTablesLevel3(
              usuariosTables,
              'configuracion-usuarios',
              createOps,
              getTableIcon
            ),
          },
          {
            id: 'parametros-geo',
            label: 'PARÁMETROS GEO',
            icon: <IconPais />,
            subMenus: createTablesLevel3(
              parametrosGeoTables,
              'configuracion-parametros-geo',
              createOps,
              getTableIcon
            ),
          },
          {
            id: 'notificaciones',
            label: 'NOTIFICACIONES',
            icon: <IconNotificaciones />,
            subMenus: notificacionesTables.map((table): SubMenuLevel2 => {
              if (table.name === 'regla') {
                return {
                  id: 'regla',
                  label: 'REGLAS',
                  icon: getTableIcon(table.name),
                  subMenus: [
                    {
                      id: 'regla',
                      label: 'REGLA (REGLA & UMBRAL)',
                      icon: getTableIcon('regla'),
                      hasOperations: true,
                      subMenus: createOps('configuracion-notificaciones-regla-regla'),
                    },
                    {
                      id: 'regla_perfil',
                      label: 'REGLA PERFIL',
                      icon: getTableIcon('regla'),
                      hasOperations: true,
                      subMenus: createOps('configuracion-notificaciones-regla-regla_perfil'),
                    },
                    {
                      id: 'regla_objeto',
                      label: 'REGLA OBJETO',
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
                subMenus: createOps(`configuracion-notificaciones-${table.name}`),
              };
            }),
          },
          {
            id: 'permisos',
            label: 'PERMISOS',
            icon: <IconPermisos />,
            subMenus: [
              {
                id: 'permisos-geo',
                label: 'PERMISOS GEO',
                icon: <IconPais />,
                hasOperations: true,
                subMenus: createOps('configuracion-permisos-permisos-geo'),
              },
              {
                id: 'permisos-conf',
                label: 'PERMISOS CONF',
                icon: <IconTable />,
                hasOperations: true,
                subMenus: createOps('configuracion-permisos-permisos-conf'),
              },
            ],
          },
          {
            id: 'reportes-administrador',
            label: 'REPORTES ADMINISTRADOR',
            icon: <IconTable />,
          },
        ],
      },
      {
        id: 'ajustes',
        label: 'AJUSTES',
        icon: <IconAjustes />,
        color: 'gray',
        requiresPermission: true,
        requiredMenu: 'AJUSTES',
        subMenus: [
          {
            id: 'basicas',
            label: 'AJUSTES GENERALES',
            icon: <IconConfiguracion />,
          },
        ],
      },
    ];

    if (isLoadingPermissions) return [];

    const filteredTabs = tabs.filter((tab) => {
      if (!tab.requiresPermission) return true;
      if (tab.id === 'agrupacion') {
        return (
          hasAccessToMenu('AGRUPACIÓN') ||
          hasAccess('CARPETA') ||
          hasAccess('LOCALIZACIÓN POR CARPETA') ||
          hasAccess('ENTIDAD') ||
          hasAccess('ENTIDAD LOCALIZACION')
        );
      }
      if (tab.id === 'configuracion') return hasAccessToMenu('CONFIGURACIÓN');
      if (tab.id === 'reportes') return hasAccessToMenu('REPORTES');
      if (tab.id === 'ajustes') return hasAccessToMenu('AJUSTES');
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
