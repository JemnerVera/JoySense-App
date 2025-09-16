import React from 'react';
import { Pais, Empresa } from '../types';
import { DashboardControls, UserControls } from './header';
import { DashboardControlsAdvanced } from './header/DashboardControlsAdvanced';
import { DashboardFilters } from './header/DashboardFilters';
import { useTheme } from '../contexts/ThemeContext';
import { useFilters } from '../contexts/FilterContext';
import { useFilterData } from '../hooks/useFilterData';

interface UserHeaderProps {
  activeTab?: string;
  authToken: string;
  paises?: Pais[];
  empresas?: Empresa[];
  selectedPais?: Pais | null;
  selectedEmpresa?: Empresa | null;
  onPaisChange?: (pais: Pais) => void;
  onEmpresaChange?: (empresa: Empresa) => void;
  onResetFilters?: () => void;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  // Nuevas props para el dashboard
  fundos?: any[];
  ubicaciones?: any[];
  entidades?: any[];
  selectedFundo?: any;
  selectedEntidad?: any;
  selectedUbicacion?: any;
  onFundoChange?: (fundo: any) => void;
  onEntidadChange?: (entidad: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
  startDate?: string;
  endDate?: string;
  onDateFilter?: (start: string, end: string) => void;
  // Callback para filtros del dashboard
  onDashboardFiltersChange?: (filters: {
    entidadId: number | null;
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  }) => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  activeTab = 'dashboard',
  authToken,
  paises = [],
  empresas = [],
  selectedPais,
  selectedEmpresa,
  onPaisChange,
  onEmpresaChange,
  onResetFilters,
  selectedTable,
  onTableSelect,
  // Nuevas props para el dashboard
  fundos = [],
  ubicaciones = [],
  entidades = [],
  selectedFundo,
  selectedEntidad,
  selectedUbicacion,
  onFundoChange,
  onEntidadChange,
  onUbicacionChange,
  startDate = '',
  endDate = '',
  onDateFilter,
  onDashboardFiltersChange
}) => {
  const { theme } = useTheme();
  
  // Usar filtros globales del contexto
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();
  
  // Cargar datos de filtros desde el contexto (mismo sistema que SidebarFilters)
  const { paises: contextPaises, empresas: contextEmpresas, fundos: contextFundos } = useFilterData(authToken);
  
  // Usar datos del contexto en lugar de props para evitar desconexión
  const paisesToUse = contextPaises.length > 0 ? contextPaises : paises;
  const empresasToUse = contextEmpresas.length > 0 ? contextEmpresas : empresas;
  const fundosToUse = contextFundos.length > 0 ? contextFundos : fundos;
  
  // Convertir IDs de filtros globales a objetos completos
  const globalSelectedPais = paisSeleccionado ? paisesToUse.find(p => p.paisid === parseInt(paisSeleccionado)) : null;
  const globalSelectedEmpresa = empresaSeleccionada ? empresasToUse.find(e => e.empresaid === parseInt(empresaSeleccionada)) : null;
  const globalSelectedFundo = fundoSeleccionado ? fundosToUse.find(f => f.fundoid === parseInt(fundoSeleccionado)) : null;
  
  // Debug: verificar si empresas está vacío
  if (empresasToUse.length === 0 && empresaSeleccionada) {
    console.warn('⚠️ UserHeader - empresas está vacío pero empresaSeleccionada existe:', empresaSeleccionada);
  }
  
  console.log('🔍 UserHeader - Objetos convertidos:', {
    globalSelectedPais,
    globalSelectedEmpresa,
    globalSelectedFundo,
    paises: paises.length,
    empresas: empresas.length,
    fundos: fundos.length
  });
  
  const renderTabControls = () => {
    // Mostrar controles del dashboard para la pestaña principal "Dashboard"
    if (activeTab === 'dashboard') {
      return (
        <DashboardFilters
          onFiltersChange={(filters) => {
            console.log('🔍 Dashboard filters changed:', filters);
            if (onDashboardFiltersChange) {
              onDashboardFiltersChange(filters);
            }
          }}
          showDateFilters={false} // No mostrar filtros de fecha en la vista inicial
        />
      );
    }

    // Mostrar controles del dashboard SOLO para la subpestaña "Dashboard"
    if (activeTab === 'reportes-dashboard') {
      return (
        <DashboardFilters
          onFiltersChange={(filters) => {
            console.log('🔍 Reportes Dashboard filters changed:', filters);
            if (onDashboardFiltersChange) {
              onDashboardFiltersChange(filters);
            }
          }}
          showDateFilters={false} // No mostrar filtros de fecha en la vista inicial
        />
      );
    }
    
    // Casos específicos para otras pestañas
    switch (activeTab) {
      case 'parameters':
        return null; // Los controles de parámetros ahora están en el sidebar auxiliar
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center">
      {renderTabControls()}
    </div>
  );
};
