import React from 'react';
import { useFilterData } from '../../../hooks/useFilterData';
import { useCascadingFilters } from '../../../hooks/useCascadingFilters';
import CollapsibleGlobalFilters from './CollapsibleGlobalFilters';

interface SidebarFiltersProps {
  authToken: string;
}

const SidebarFilters: React.FC<SidebarFiltersProps> = ({ authToken }) => {
  const { paises, empresas, fundos, ubicaciones, loading, error } = useFilterData(authToken);
  const {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    ubicacionSeleccionada,
    hasActiveFilters,
    handlePaisChange,
    handleEmpresaChange,
    handleFundoChange,
    handleUbicacionChange,
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

  const ubicacionesOptions = ubicaciones
    .filter(ubicacion => !fundoSeleccionado || ubicacion.fundoid === parseInt(fundoSeleccionado))
    .map(ubicacion => ({
      id: ubicacion.ubicacionid,
      name: ubicacion.ubicacion
    }));

  if (loading) {
    return (
      <div className="p-4 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filtros Globales</h3>
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 rounded"></div>
          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 rounded"></div>
          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 rounded"></div>
          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filtros Globales</h3>
        <div className="text-red-500 dark:text-red-400 text-xs">
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
      ubicacionSeleccionada={ubicacionSeleccionada?.toString() || ''}
      onPaisChange={handlePaisChange}
      onEmpresaChange={handleEmpresaChange}
      onFundoChange={handleFundoChange}
      onUbicacionChange={handleUbicacionChange}
      paisesOptions={paisesOptions}
      empresasOptions={empresasOptions}
      fundosOptions={fundosOptions}
      ubicacionesOptions={ubicacionesOptions}
    />
  );
};

export default SidebarFilters;
