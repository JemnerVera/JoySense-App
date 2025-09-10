import React, { useState } from 'react';
import DynamicFilterSelector from './DynamicFilterSelector';

interface CollapsibleGlobalFiltersProps {
  paisSeleccionado: string;
  empresaSeleccionada: string;
  fundoSeleccionado: string;
  onPaisChange: (value: string) => void;
  onEmpresaChange: (value: string) => void;
  onFundoChange: (value: string) => void;
  paisesOptions: Array<{ id: string | number; name: string }>;
  empresasOptions: Array<{ id: string | number; name: string }>;
  fundosOptions: Array<{ id: string | number; name: string }>;
}

const CollapsibleGlobalFilters: React.FC<CollapsibleGlobalFiltersProps> = ({
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  onPaisChange,
  onEmpresaChange,
  onFundoChange,
  paisesOptions,
  empresasOptions,
  fundosOptions
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = paisSeleccionado || empresaSeleccionada || fundoSeleccionado;
  const hasAllFilters = paisSeleccionado && empresaSeleccionada && fundoSeleccionado;
  
  // Obtener nombres de las opciones seleccionadas
  const selectedPaisName = paisesOptions.find(p => p.id.toString() === paisSeleccionado)?.name || '';
  const selectedEmpresaName = empresasOptions.find(e => e.id.toString() === empresaSeleccionada)?.name || '';
  const selectedFundoName = fundosOptions.find(f => f.id.toString() === fundoSeleccionado)?.name || '';

  // Iconos minimalistas (SVG con líneas blancas)
  const iconos = {
    pais: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    empresa: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    fundo: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
      </svg>
    )
  };

  // Si no hay todos los filtros activos, mostrar siempre expandido
  if (!hasAllFilters) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          <DynamicFilterSelector
            value={paisSeleccionado}
            onChange={onPaisChange}
            options={paisesOptions}
            placeholder="País"
            icon={iconos.pais}
            className="w-full"
          />
          <DynamicFilterSelector
            value={empresaSeleccionada}
            onChange={onEmpresaChange}
            options={empresasOptions}
            disabled={!paisSeleccionado}
            placeholder="Empresa"
            icon={iconos.empresa}
            className="w-full"
          />
          <DynamicFilterSelector
            value={fundoSeleccionado}
            onChange={onFundoChange}
            options={fundosOptions}
            disabled={!empresaSeleccionada}
            placeholder="Fundo"
            icon={iconos.fundo}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // Si hay todos los filtros activos, mostrar versión colapsable
  return (
    <div>
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {/* Icono embudo */}
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          
          {/* Chips de filtros activos */}
          <div className="flex items-center space-x-2">
            {selectedPaisName && (
              <span className="bg-neutral-600 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap overflow-hidden max-w-[60px] truncate font-mono tracking-wider">
                {selectedPaisName.toUpperCase()}
              </span>
            )}
            {selectedEmpresaName && (
              <span className="bg-neutral-600 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap overflow-hidden max-w-[60px] truncate font-mono tracking-wider">
                {selectedEmpresaName.toUpperCase()}
              </span>
            )}
            {selectedFundoName && (
              <span className="bg-neutral-600 text-white px-1.5 py-0.5 rounded text-xs whitespace-nowrap overflow-hidden max-w-[60px] truncate font-mono tracking-wider">
                {selectedFundoName.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <DynamicFilterSelector
            value={paisSeleccionado}
            onChange={onPaisChange}
            options={paisesOptions}
            placeholder="País"
            icon={iconos.pais}
            className="w-full"
          />
          <DynamicFilterSelector
            value={empresaSeleccionada}
            onChange={onEmpresaChange}
            options={empresasOptions}
            disabled={!paisSeleccionado}
            placeholder="Empresa"
            icon={iconos.empresa}
            className="w-full"
          />
          <DynamicFilterSelector
            value={fundoSeleccionado}
            onChange={onFundoChange}
            options={fundosOptions}
            disabled={!empresaSeleccionada}
            placeholder="Fundo"
            icon={iconos.fundo}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default CollapsibleGlobalFilters;
