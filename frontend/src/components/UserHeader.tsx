import React from 'react';
import { Pais, Empresa } from '../types';
import { DashboardFilters } from './header/DashboardFilters';
import { useTheme } from '../contexts/ThemeContext';
import { useFilters } from '../contexts/FilterContext';

interface UserHeaderProps {
  activeTab?: string;
  paises?: Pais[];
  empresas?: Empresa[];
  selectedPais?: Pais | null;
  selectedEmpresa?: Empresa | null;
  onPaisChange?: (pais: Pais) => void;
  onEmpresaChange?: (empresa: Empresa) => void;
  onResetFilters?: () => void;
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  fundos?: any[];
  ubicaciones?: any[];
  entidades?: any[];
  selectedFundo?: any;
  selectedUbicacion?: any;
  onFundoChange?: (fundo: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
  startDate?: string;
  endDate?: string;
  onDateFilter?: (start: string, end: string) => void;
  onDashboardFiltersChange?: (filters: {
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  }) => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  activeTab = 'dashboard',
  paises = [],
  empresas = [],
  selectedPais,
  selectedEmpresa,
  onPaisChange,
  onEmpresaChange,
  onResetFilters,
  selectedTable,
  onTableSelect,
  fundos = [],
  ubicaciones = [],
  selectedFundo,
  selectedUbicacion,
  onFundoChange,
  onUbicacionChange,
  startDate = '',
  endDate = '',
  onDateFilter,
  onDashboardFiltersChange
}) => {
  const { theme } = useTheme();
  
  const { 
    paisSeleccionado, 
    empresaSeleccionada, 
    fundoSeleccionado,
    ubicacionSeleccionada,
    paises: contextPaises,
    empresas: contextEmpresas,
    fundos: contextFundos,
  } = useFilters();
  
  const paisesToUse = contextPaises.length > 0 ? contextPaises : paises;
  const empresasToUse = contextEmpresas.length > 0 ? contextEmpresas : empresas;
  const fundosToUse = contextFundos.length > 0 ? contextFundos : fundos;
  
  const globalSelectedPais = paisSeleccionado ? paisesToUse.find(p => p.paisid === parseInt(paisSeleccionado)) : null;
  const globalSelectedEmpresa = empresaSeleccionada ? empresasToUse.find(e => e.empresaid === parseInt(empresaSeleccionada)) : null;
  const globalSelectedFundo = fundoSeleccionado ? fundosToUse.find(f => f.fundoid === parseInt(fundoSeleccionado)) : null;
  
  const globalSelectedUbicacion = ubicacionSeleccionada || selectedUbicacion;
  
  const renderTabControls = () => {
    if (activeTab === 'dashboard') {
      return (
        <DashboardFilters
          onFiltersChange={(filters) => {
            if (onDashboardFiltersChange) {
              onDashboardFiltersChange(filters);
            }
          }}
          showDateFilters={false}
        />
      );
    }

    if (activeTab === 'reportes-dashboard' || activeTab === 'reportes-dashboard-mapeo') {
      return (
        <DashboardFilters
          onFiltersChange={(filters) => {
            if (onDashboardFiltersChange) {
              onDashboardFiltersChange(filters);
            }
          }}
          showDateFilters={false}
        />
      );
    }
    
    switch (activeTab) {
      case 'parameters':
        return null;
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
