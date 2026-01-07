import React, { useState, useEffect } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedParameterButton from '../ProtectedParameterButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';

interface ReglaSidebarProps {
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

const ReglaSidebar: React.FC<ReglaSidebarProps> = ({
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
        console.error('[ReglaSidebar] Error obteniendo perfil:', error);
      } finally {
        setLoadingPerfil(false);
      }
    };

    fetchUserPerfil();
  }, [user]);

  // Tablas de regla disponibles
  const reglaTables = [
    { name: 'regla', displayName: 'REGLA' },
    { name: 'regla_perfil', displayName: 'REGLA_PERFIL' },
    { name: 'regla_umbral', displayName: 'REGLA_UMBRAL' }
  ];

  // Mapear tablas a formato de sidebar con iconos
  const getTableIcon = (tableName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'regla': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'regla_perfil': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'regla_umbral': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    };
    return iconMap[tableName] || (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const reglaIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="REGLA"
      icon={reglaIcon}
      color="orange"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {reglaTables.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-neutral-400">
                <p className="text-sm font-mono">No hay tablas disponibles</p>
              </div>
            ) : (
              reglaTables.map((table) => {
                const isActive = selectedTable === table.name;
                const handleTableChange = (tableName: string) => {
                  console.log('[ReglaSidebar] Tabla seleccionada:', { tableName, selectedTable, activeSubTab, onTableSelect: !!onTableSelect });
                  if (onTableSelect) {
                    console.log('[ReglaSidebar] Llamando a onTableSelect con:', tableName);
                    onTableSelect(tableName);
                  } else {
                    console.warn('[ReglaSidebar] onTableSelect no está definido');
                  }
                };
                return (
                  <ProtectedParameterButton
                    key={table.name}
                    targetTable={table.name}
                    currentTable={selectedTable}
                    activeSubTab={activeSubTab as 'status' | 'insert' | 'update' | 'massive'}
                    formData={formData}
                    multipleData={multipleData}
                    massiveFormData={massiveFormData}
                    onTableChange={handleTableChange}
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
                      <span className="text-sm font-medium tracking-wider">{table.displayName}</span>
                    )}
                  </ProtectedParameterButton>
                );
              })
            )}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default ReglaSidebar;

