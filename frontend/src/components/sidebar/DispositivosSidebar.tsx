import React, { useState, useEffect, useMemo } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedParameterButton from '../ProtectedParameterButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';
import { getDispositivosTables, type TableConfig } from '../../config/tables.config';

interface DispositivosSidebarProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
  activeSubTab: string;
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const DispositivosSidebar: React.FC<DispositivosSidebarProps> = ({
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange,
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  formData = {},
  multipleData = [],
  massiveFormData = {}
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
        let usuarioid = user.user_metadata?.usuarioid;
        
        if (!usuarioid) {
          const usuariosData = await JoySenseService.getTableData('usuario', 100);
          const usuarios = Array.isArray(usuariosData) ? usuariosData : (usuariosData as any)?.data || [];
          
          if (user.id) {
            const usuarioByUuid = usuarios.find((u: any) => 
              u.useruuid && String(u.useruuid).toLowerCase() === String(user.id).toLowerCase()
            );
            if (usuarioByUuid?.usuarioid) {
              usuarioid = usuarioByUuid.usuarioid;
            }
          }
          
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
        console.error('[DispositivosSidebar] Error obteniendo perfil:', error);
      } finally {
        setLoadingPerfil(false);
      }
    };

    fetchUserPerfil();
  }, [user]);

  // Obtener las tablas de dispositivos
  const allDispositivosTables = getDispositivosTables();

  // Estado para permisos de dispositivos
  const [dispositivosPermissions, setDispositivosPermissions] = useState<Record<string, boolean>>({});

  // Verificar permisos para tablas de dispositivos usando el nuevo sistema
  useEffect(() => {
    const checkDispositivosPermissions = async () => {
      if (!user || loadingPerfil) return;

      const permissions: Record<string, boolean> = {};

      try {
        // Obtener acceso al menú del usuario actual usando el nuevo sistema
        const menuAccess = await JoySenseService.getUserMenuAccess();
        
        const accessibleMenuItems = menuAccess 
          ? menuAccess
              .filter(item => item.tiene_acceso)
              .map(item => item.menu.toLowerCase())
          : [];

        allDispositivosTables.forEach((table: TableConfig) => {
          // Verificar si el nombre de la tabla está en los elementos de menú accesibles
          const hasAccess = accessibleMenuItems.some(menuItem => 
            menuItem === table.name.toLowerCase() ||
            menuItem.includes(table.name.toLowerCase()) ||
            table.name.toLowerCase().includes(menuItem)
          );
          
          permissions[table.name] = hasAccess;
        });
      } catch (error) {
        console.error(`[DispositivosSidebar] Error verificando permisos del menú:`, error);
        // En caso de error, establecer todos los permisos como false
        allDispositivosTables.forEach((table: TableConfig) => {
          permissions[table.name] = false;
        });
      }

      setDispositivosPermissions(permissions);
    };

    checkDispositivosPermissions();
  }, [user, allDispositivosTables, loadingPerfil]);

  // También necesito tipar el parámetro en el useEffect de fetchUserPerfil

  // Estado de carga de permisos
  const loadingPermissions = loadingPerfil || Object.keys(dispositivosPermissions).length === 0;

  // Filtrar tablas según permisos
  const dispositivosTables = useMemo(() => {
    if (loadingPermissions) {
      return []; // No mostrar nada mientras carga
    }

    return allDispositivosTables.filter((table: TableConfig) => {
      return dispositivosPermissions[table.name] === true;
    });
  }, [allDispositivosTables, dispositivosPermissions, loadingPermissions]);

  // Mapear tablas a formato de sidebar con iconos
  const getTableIcon = (tableName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'tipo': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      'metrica': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'sensor': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      'metricasensor': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    };
    return iconMap[tableName] || (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const dispositivosIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );


  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="DISPOSITIVOS"
      icon={dispositivosIcon}
      color="orange"
      collapsedText="Sense"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          {/* Mostrar loading state mientras se verifican permisos */}
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : dispositivosTables.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-neutral-400">
              <p className="text-sm font-mono">No hay tablas disponibles</p>
            </div>
          ) : (
            <nav className="space-y-1">
              {dispositivosTables.map((table: TableConfig) => {
              // Solo marcar como activa si selectedTable no está vacío
              // Esto evita que se marque como activa cuando activeTab es exactamente 'configuracion-dispositivos'
              const isActive = selectedTable !== '' && selectedTable === table.name;
              return (
                <ProtectedParameterButton
                  key={table.name}
                  targetTable={table.name}
                  currentTable={selectedTable}
                  activeSubTab={activeSubTab as 'status' | 'insert' | 'update' | 'massive'}
                  formData={formData}
                  multipleData={multipleData}
                  massiveFormData={massiveFormData}
                  onTableChange={onTableSelect}
                  className={`w-full flex items-center p-3 rounded transition-colors ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  } ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getTableIcon(table.name)}
                  </div>
                  {isExpanded && (
                    <span className="text-sm font-medium tracking-wider">{table.displayName.toUpperCase()}</span>
                  )}
                </ProtectedParameterButton>
              );
            })}
            </nav>
          )}
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default DispositivosSidebar;

