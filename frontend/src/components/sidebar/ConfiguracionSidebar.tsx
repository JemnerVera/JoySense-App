import React, { useMemo } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSectionPermissions } from '../../hooks/useSectionPermissions';

interface ConfiguracionSidebarProps {
  selectedSection: string;
  onSectionSelect: (section: string) => void;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ConfiguracionSidebar: React.FC<ConfiguracionSidebarProps> = ({
  selectedSection,
  onSectionSelect,
  isExpanded,
  onMouseEnter,
  onMouseLeave
}) => {
  const { t } = useLanguage();

  // Definir tablas por sección
  const sectionTables = {
    dispositivos: ['tipo', 'metrica', 'sensor', 'metricasensor'],
    usuarios: ['usuario', 'correo', 'codigotelefono', 'contacto', 'perfil', 'usuarioperfil', 'usuario_canal'],
    'parametros-geo': ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion', 'asociacion'],
    notificaciones: ['criticidad', 'umbral', 'regla'],
    permisos: ['permiso'], // PERMISOS siempre visible (se filtra por tipos internos)
    'reportes-administrador': ['msg_outbox', 'auth_outbox']
  };

  // Verificar permisos para cada sección
  const dispositivosPermissions = useSectionPermissions({ tableNames: sectionTables.dispositivos });
  const usuariosPermissions = useSectionPermissions({ tableNames: sectionTables.usuarios });
  const parametrosGeoPermissions = useSectionPermissions({ tableNames: sectionTables['parametros-geo'] });
  const notificacionesPermissions = useSectionPermissions({ tableNames: sectionTables.notificaciones });
  const permisosPermissions = useSectionPermissions({ tableNames: sectionTables.permisos });
  const reportesAdminPermissions = useSectionPermissions({ tableNames: sectionTables['reportes-administrador'] });

  // Secciones principales de CONFIGURACIÓN
  const allConfiguracionSections = [
    {
      id: 'dispositivos',
      label: 'DISPOSITIVOS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      hasAccess: dispositivosPermissions.hasAccess,
      loading: dispositivosPermissions.loading
    },
    {
      id: 'usuarios',
      label: 'USUARIOS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      hasAccess: usuariosPermissions.hasAccess,
      loading: usuariosPermissions.loading
    },
    {
      id: 'parametros-geo',
      label: 'PARÁMETROS GEO',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      hasAccess: parametrosGeoPermissions.hasAccess,
      loading: parametrosGeoPermissions.loading
    },
    {
      id: 'notificaciones',
      label: 'NOTIFICACIONES',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      hasAccess: notificacionesPermissions.hasAccess,
      loading: notificacionesPermissions.loading
    },
    {
      id: 'permisos',
      label: 'PERMISOS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      hasAccess: permisosPermissions.hasAccess,
      loading: permisosPermissions.loading
    },
    {
      id: 'reportes-administrador',
      label: 'REPORTES ADMINISTRADOR',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      hasAccess: reportesAdminPermissions.hasAccess,
      loading: reportesAdminPermissions.loading
    }
  ];

  // Filtrar secciones basándose en permisos
  const configuracionSections = useMemo(() => {
    return allConfiguracionSections.filter(section => {
      // Si aún se están cargando permisos, mostrar la sección (evita parpadeo)
      if (section.loading) return true;
      // Mostrar solo si tiene acceso
      return section.hasAccess;
    });
  }, [
    dispositivosPermissions.hasAccess,
    dispositivosPermissions.loading,
    usuariosPermissions.hasAccess,
    usuariosPermissions.loading,
    parametrosGeoPermissions.hasAccess,
    parametrosGeoPermissions.loading,
    notificacionesPermissions.hasAccess,
    notificacionesPermissions.loading,
    permisosPermissions.hasAccess,
    permisosPermissions.loading,
    reportesAdminPermissions.hasAccess,
    reportesAdminPermissions.loading
  ]);

  const configuracionIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="CONFIGURACIÓN"
      icon={configuracionIcon}
      color="orange"
      collapsedText="Joy"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {configuracionSections.map((section) => {
              const isActive = selectedSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionSelect(section.id)}
                  className={`w-full flex items-center p-3 rounded transition-colors ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  } ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {section.icon}
                  </div>
                  {isExpanded && (
                    <span className="text-sm font-medium tracking-wider">{section.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default ConfiguracionSidebar;

