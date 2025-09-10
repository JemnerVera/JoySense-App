import React from 'react';
import { useFilterData } from '../hooks/useFilterData';
import { useCascadingFilters } from '../hooks/useCascadingFilters';
import FilterSelector from './FilterSelector';

interface GlobalFiltersProps {
  authToken: string;
}

const GlobalFilters: React.FC<GlobalFiltersProps> = ({ authToken }) => {
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
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="animate-pulse bg-gray-700 h-10 w-32 rounded"></div>
          <div className="animate-pulse bg-gray-700 h-10 w-32 rounded"></div>
          <div className="animate-pulse bg-gray-700 h-10 w-32 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-2 text-red-400">
          <span>❌ Error cargando filtros: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center space-x-6">
        {/* Filtro País */}
        <FilterSelector
          label="País"
          icon="🌍"
          value={paisSeleccionado}
          onChange={handlePaisChange}
          options={paisesOptions}
          placeholder="Seleccionar país"
        />

        {/* Filtro Empresa */}
        <FilterSelector
          label="Empresa"
          icon="🏢"
          value={empresaSeleccionada}
          onChange={handleEmpresaChange}
          options={empresasOptions}
          disabled={!paisSeleccionado}
          placeholder="Seleccionar empresa"
        />

        {/* Filtro Fundo */}
        <FilterSelector
          label="Fundo"
          icon="🌾"
          value={fundoSeleccionado}
          onChange={handleFundoChange}
          options={fundosOptions}
          disabled={!empresaSeleccionada}
          placeholder="Seleccionar fundo"
        />

        {/* Indicador de filtros activos */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-2 text-green-400 text-sm">
            <span>✅ Filtros activos</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalFilters;
