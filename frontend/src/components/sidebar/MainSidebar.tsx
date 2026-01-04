import React, { useState, useEffect, useMemo } from 'react';
import SidebarFilters from '../SidebarFilters';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';

interface MainSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  authToken: string;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onTabChange,
  activeTab,
  authToken
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [userPerfilId, setUserPerfilId] = useState<number | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);

  // Obtener el perfil del usuario actual
  useEffect(() => {
    const fetchUserPerfil = async () => {
      if (!user) {
        setLoadingPerfil(false);
        return;
      }

      try {
        // Intentar obtener usuarioid de user_metadata primero
        let usuarioid = user.user_metadata?.usuarioid;
        
        // Si no está en user_metadata, buscar en la tabla usuario
        if (!usuarioid) {
          const usuariosData = await JoySenseService.getTableData('usuario', 100);
          const usuarios = Array.isArray(usuariosData) ? usuariosData : (usuariosData as any)?.data || [];
          
          // Buscar por useruuid primero (más preciso - coincide con user.id de Supabase Auth)
          if (user.id) {
            const usuarioByUuid = usuarios.find((u: any) => 
              u.useruuid && String(u.useruuid).toLowerCase() === String(user.id).toLowerCase()
            );
            if (usuarioByUuid?.usuarioid) {
              usuarioid = usuarioByUuid.usuarioid;
            }
          }
          
          // Si no se encuentra por UUID, buscar por email/login
          if (!usuarioid && user.email) {
            const usuarioByEmail = usuarios.find((u: any) => 
              u.login && u.login.toLowerCase() === user.email.toLowerCase()
            );
            if (usuarioByEmail?.usuarioid) {
              usuarioid = usuarioByEmail.usuarioid;
            }
          }
          
          if (!usuarioid) {
            setLoadingPerfil(false);
            return;
          }
        }

        // Buscar perfil en usuarioperfil
        const usuarioperfilData = await JoySenseService.getTableData('usuarioperfil', 100);
        const usuarioperfilArray = Array.isArray(usuarioperfilData) 
          ? usuarioperfilData 
          : (usuarioperfilData as any)?.data || [];
        
        const userPerfil = usuarioperfilArray.find((up: any) => 
          up.usuarioid === usuarioid && up.statusid === 1
        );
        
        if (userPerfil) {
          setUserPerfilId(userPerfil.perfilid);
        }
      } catch (error) {
        console.error('[MainSidebar] Error obteniendo perfil:', error);
      } finally {
        setLoadingPerfil(false);
      }
    };

    fetchUserPerfil();
  }, [user]);

  // Construir el array de pestañas de forma inmutable
  // NUEVA ESTRUCTURA: Solo 4 pestañas principales
  const mainTabs = useMemo(() => {
    const tabs = [
      {
        id: 'reportes',
        label: t('tabs.reports'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        color: 'brown'
      },
      {
        id: 'agrupacion',
        label: 'AGRUPACIÓN',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
        color: 'blue'
      },
      {
        id: 'configuracion',
        label: 'CONFIGURACIÓN',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        color: 'orange'
      },
      {
        id: 'ajustes',
        label: 'AJUSTES',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        ),
        color: 'gray'
      }
    ];

    console.log('[MainSidebar] mainTabs construido:', { 
      tabsCount: tabs.length, 
      tabIds: tabs.map(t => t.id),
      loadingPerfil,
      userPerfilId,
      hasPermisosTab: tabs.some(t => t.id === 'permisos')
    });
    return tabs;
  }, [loadingPerfil, userPerfilId, t]);

  const getTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-400';
      case 'blue': return 'text-blue-400';
      case 'orange': return 'text-orange-400';
      case 'red': return 'text-red-400';
      case 'gray': return 'text-gray-400';
      case 'purple': return 'text-purple-400';
      case 'brown': return 'text-amber-700';
      case 'cyan': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getActiveTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-600';
      case 'blue': return 'bg-blue-600';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      case 'gray': return 'bg-gray-600';
      case 'purple': return 'bg-purple-600';
      case 'brown': return 'bg-amber-800';
      case 'cyan': return 'bg-cyan-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div 
      className="bg-gray-100 dark:bg-neutral-900 border-r border-gray-300 dark:border-neutral-700 transition-all duration-300 h-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Logo - Tactical Style */}
      <div className="h-16 flex items-center justify-center border-b border-gray-300 dark:border-neutral-700 p-4">
        {isExpanded ? (
          <div className="flex items-center space-x-3">
            <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
            <img src="/Logo - texto.png" alt="JoySense" className="h-6 w-auto" />
          </div>
        ) : (
          <div className="flex justify-center">
            <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Filtros globales */}
      {isExpanded && (
        <div className="px-4 py-4 border-b border-gray-300 dark:border-neutral-700">
          <SidebarFilters authToken={authToken} />
        </div>
      )}

      {/* Pestañas principales - Tactical Style */}
      <div className="py-4">
        <nav className="space-y-2">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id || activeTab.startsWith(tab.id + '-');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('[MainSidebar] Click en pestaña:', { tabId: tab.id, tabLabel: tab.label });
                  onTabChange(tab.id);
                }}
                className={`w-full flex items-center p-3 rounded transition-colors ${
                  isExpanded ? 'gap-3' : 'justify-center'
                } ${
                  isActive
                    ? `${getActiveTabColor(tab.color)} text-white`
                    : "text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {tab.icon}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium tracking-wider">{tab.label.toUpperCase()}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status - Tactical Style */}
      {isExpanded && (
        <div className="mt-8 p-4 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded mx-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-800 dark:text-white font-mono">{t('system.online')}</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-neutral-500 font-mono">
            <div>{t('system.active_time')} 72:14:33</div>
            <div>{t('system.sensors')} 847 {t('system.active')}</div>
            <div>{t('system.alerts')} 23 {t('system.in_progress')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainSidebar;
