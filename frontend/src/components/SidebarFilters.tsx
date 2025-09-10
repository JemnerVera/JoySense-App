import React from 'react';
import { useFilterData } from '../hooks/useFilterData';
import { useCascadingFilters } from '../hooks/useCascadingFilters';
import CollapsibleGlobalFilters from './CollapsibleGlobalFilters';

interface SidebarFiltersProps {
  authToken: string;
}

const SidebarFilters: React.FC<SidebarFiltersProps> = ({ authToken }) => {
  const { paises, empresas, fundos, loading, error } = useFilterData(authToken);
  const {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    hasActiveFilters,
    handlePaisChange,
    handleEmpresaChange,
    handleFundoChange,
  } = useCascadingFilters();

  // Preparar datos para los selectores
  const paisesOptions = paises.map(pais => ({
    id: pais.paisid,
    name: pais.pais
  }));

  const empresasOptions = empresas
    .filter(empresa => !paisSeleccionado || empresa.paisid === parseInt(paisSeleccionado))
    .map(empresa => ({
      id: empresa.empresaid,
      name: empresa.empresa
    }));

  const fundosOptions = fundos
    .filter(fundo => !empresaSeleccionada || fundo.empresaid === parseInt(empresaSeleccionada))
    .map(fundo => ({
      id: fundo.fundoid,
      name: fundo.fundo
    }));

  if (loading) {
    return (
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Filtros Globales</h3>
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-700 h-8 rounded"></div>
          <div className="animate-pulse bg-gray-700 h-8 rounded"></div>
          <div className="animate-pulse bg-gray-700 h-8 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Filtros Globales</h3>
        <div className="text-red-400 text-xs">
          ❌ Error: {error}
        </div>
      </div>
    );
  }

  return (
    <CollapsibleGlobalFilters
      paisSeleccionado={paisSeleccionado}
      empresaSeleccionada={empresaSeleccionada}
      fundoSeleccionado={fundoSeleccionado}
      onPaisChange={handlePaisChange}
      onEmpresaChange={handleEmpresaChange}
      onFundoChange={handleFundoChange}
      paisesOptions={paisesOptions}
      empresasOptions={empresasOptions}
      fundosOptions={fundosOptions}
    />
  );
};

export default SidebarFilters;
