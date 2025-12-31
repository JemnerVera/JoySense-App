import React, { useState, useEffect } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedParameterButton from '../ProtectedParameterButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';
import { getGeografiaTables } from '../../config/tables.config';

interface GeografiaSidebarProps {
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

const GeografiaSidebar: React.FC<GeografiaSidebarProps> = ({
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
        console.error('[GeografiaSidebar] Error obteniendo perfil:', error);
      } finally {
        setLoadingPerfil(false);
      }
    };

    fetchUserPerfil();
  }, [user]);

  // Obtener las tablas de geografía
  const geografiaTables = getGeografiaTables();

  // Mapear tablas a formato de sidebar con iconos
  const getTableIcon = (tableName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'pais': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'empresa': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      'fundo': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
        </svg>
      ),
      'ubicacion': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'localizacion': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      'entidad': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      'entidad_localizacion': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      'nodo': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    };
    return iconMap[tableName] || (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const geografiaIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={t('parameters.groups.location') || 'GEOGRAFÍA'}
      icon={geografiaIcon}
      color="blue"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {geografiaTables.map((table) => {
              const isActive = selectedTable === table.name;
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
                      ? "bg-blue-500 text-white"
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
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default GeografiaSidebar;

