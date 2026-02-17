// ============================================================================
// CASCADING LISTBOX (Cuádruple)
// ============================================================================
// Componente para cascada de 4 niveles geográficos (País -> Empresa -> Fundo -> Ubicación)
// Muestra hasta 4 columnas dinámicamente según la selección

import React, { useState, useMemo } from 'react';

export interface CascadingLevel {
  id: number;
  label: string;
  parentId?: number;
}

export interface CascadingListboxProps {
  // Datos
  paises: CascadingLevel[];
  empresas: CascadingLevel[];
  fundos: CascadingLevel[];
  ubicaciones: CascadingLevel[];

  // Estado
  selectedPaises: number[];
  selectedEmpresas: number[];
  selectedFundos: number[];
  selectedUbicaciones: number[];

  // Handlers
  onPaisesChange: (ids: number[]) => void;
  onEmpresasChange: (ids: number[]) => void;
  onFundosChange: (ids: number[]) => void;
  onUbicacionesChange: (ids: number[]) => void;

  // Opciones
  disabled?: boolean;
  themeColor?: 'green' | 'orange';
}

const CascadingListbox: React.FC<CascadingListboxProps> = ({
  paises,
  empresas,
  fundos,
  ubicaciones,
  selectedPaises,
  selectedEmpresas,
  selectedFundos,
  selectedUbicaciones,
  onPaisesChange,
  onEmpresasChange,
  onFundosChange,
  onUbicacionesChange,
  disabled = false,
  themeColor = 'orange'
}) => {
  // Estados para filtros
  const [filterPais, setFilterPais] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterFundo, setFilterFundo] = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('');

  // Listas filtradas por búsqueda y selección en cascada
  const filteredPaises = useMemo(() => {
    if (!filterPais.trim()) return paises;
    return paises.filter(p => p.label.toLowerCase().includes(filterPais.toLowerCase()));
  }, [paises, filterPais]);

  const empresasDisponibles = useMemo(() => {
    if (selectedPaises.length === 0) return [];
    return empresas.filter(e => selectedPaises.includes(e.parentId || 0));
  }, [empresas, selectedPaises]);

  const filteredEmpresas = useMemo(() => {
    if (!filterEmpresa.trim()) return empresasDisponibles;
    return empresasDisponibles.filter(e => e.label.toLowerCase().includes(filterEmpresa.toLowerCase()));
  }, [empresasDisponibles, filterEmpresa]);

  const fundosDisponibles = useMemo(() => {
    if (selectedEmpresas.length === 0) return [];
    return fundos.filter(f => selectedEmpresas.includes(f.parentId || 0));
  }, [fundos, selectedEmpresas]);

  const filteredFundos = useMemo(() => {
    if (!filterFundo.trim()) return fundosDisponibles;
    return fundosDisponibles.filter(f => f.label.toLowerCase().includes(filterFundo.toLowerCase()));
  }, [fundosDisponibles, filterFundo]);

  const ubicacionesDisponibles = useMemo(() => {
    if (selectedFundos.length === 0) return [];
    return ubicaciones.filter(u => selectedFundos.includes(u.parentId || 0));
  }, [ubicaciones, selectedFundos]);

  const filteredUbicaciones = useMemo(() => {
    if (!filterUbicacion.trim()) return ubicacionesDisponibles;
    return ubicacionesDisponibles.filter(u => u.label.toLowerCase().includes(filterUbicacion.toLowerCase()));
  }, [ubicacionesDisponibles, filterUbicacion]);

  // Manejadores de toggle
  const togglePais = (id: number) => {
    const updated = new Set(selectedPaises);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onPaisesChange(Array.from(updated).sort((a, b) => a - b));
    onEmpresasChange([]);
    onFundosChange([]);
    onUbicacionesChange([]);
  };

  const toggleEmpresa = (id: number) => {
    const updated = new Set(selectedEmpresas);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onEmpresasChange(Array.from(updated).sort((a, b) => a - b));
    onFundosChange([]);
    onUbicacionesChange([]);
  };

  const toggleFundo = (id: number) => {
    const updated = new Set(selectedFundos);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onFundosChange(Array.from(updated).sort((a, b) => a - b));
    onUbicacionesChange([]);
  };

  const toggleUbicacion = (id: number) => {
    const updated = new Set(selectedUbicaciones);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onUbicacionesChange(Array.from(updated).sort((a, b) => a - b));
  };

  // Estilos de tema
  const themeClasses = {
    green: {
      accent: 'text-green-500',
      header: 'text-green-400',
      highlight: 'bg-green-600/80',
      selectedBg: 'bg-green-600/20',
      borderFocus: 'focus:ring-green-500',
      hoverBg: 'hover:bg-neutral-700'
    },
    orange: {
      accent: 'text-orange-500',
      header: 'text-orange-400',
      highlight: 'bg-orange-600/80',
      selectedBg: 'bg-orange-600/20',
      borderFocus: 'focus:ring-orange-500',
      hoverBg: 'hover:bg-neutral-700'
    }
  };

  const theme = themeClasses[themeColor];

  // Componente para una columna
  const ColumnLevel = ({
    title,
    items,
    selectedIds,
    onToggle,
    disabled: colDisabled,
    filter,
    onFilterChange,
    showColumn
  }: {
    title: string;
    items: CascadingLevel[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    disabled: boolean;
    filter: string;
    onFilterChange: (val: string) => void;
    showColumn: boolean;
  }) => {
    if (!showColumn) return null;

    const selectedSet = new Set(selectedIds);

    return (
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className={`font-bold font-mono tracking-wider ${theme.header} text-opacity-70 flex justify-between items-center`}>
          <span>{title.toUpperCase()}</span>
          <span className={`text-sm ${theme.accent}`}>({selectedIds.length})</span>
        </div>

        <input
          type="text"
          placeholder="Buscar..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className={`w-full px-2 py-1.5 bg-neutral-900 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-500 focus:outline-none focus:ring-1 ${theme.borderFocus}`}
          disabled={colDisabled}
        />

        <div className="border border-neutral-600 rounded-lg bg-neutral-800 text-white font-mono text-sm h-[250px] overflow-y-auto custom-scrollbar flex flex-col">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 border-b border-neutral-700 last:border-b-0 ${
                  selectedSet.has(item.id)
                    ? `${theme.highlight} ${theme.selectedBg}`
                    : theme.hoverBg
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(item.id)}
                  onChange={() => onToggle(item.id)}
                  disabled={colDisabled}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="truncate text-xs">{item.label.toUpperCase()}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-neutral-500 text-xs font-mono text-center flex items-center justify-center h-full">
              NINGUNO DISPONIBLE
            </div>
          )}
        </div>

        <div className="text-xs font-mono text-neutral-400 text-center px-2 py-1">
          Total: <span className={theme.accent}>{items.length}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex gap-3 items-stretch ${disabled ? 'opacity-60' : ''}`}>
      <ColumnLevel
        title="País"
        items={filteredPaises}
        selectedIds={selectedPaises}
        onToggle={togglePais}
        disabled={disabled}
        filter={filterPais}
        onFilterChange={setFilterPais}
        showColumn={true}
      />

      {selectedPaises.length > 0 && (
        <ColumnLevel
          title="Empresa"
          items={filteredEmpresas}
          selectedIds={selectedEmpresas}
          onToggle={toggleEmpresa}
          disabled={disabled || empresasDisponibles.length === 0}
          filter={filterEmpresa}
          onFilterChange={setFilterEmpresa}
          showColumn={true}
        />
      )}

      {selectedEmpresas.length > 0 && (
        <ColumnLevel
          title="Fundo"
          items={filteredFundos}
          selectedIds={selectedFundos}
          onToggle={toggleFundo}
          disabled={disabled || fundosDisponibles.length === 0}
          filter={filterFundo}
          onFilterChange={setFilterFundo}
          showColumn={true}
        />
      )}

      {selectedFundos.length > 0 && (
        <ColumnLevel
          title="Ubicación"
          items={filteredUbicaciones}
          selectedIds={selectedUbicaciones}
          onToggle={toggleUbicacion}
          disabled={disabled || ubicacionesDisponibles.length === 0}
          filter={filterUbicacion}
          onFilterChange={setFilterUbicacion}
          showColumn={true}
        />
      )}
    </div>
  );
};

export default CascadingListbox;
