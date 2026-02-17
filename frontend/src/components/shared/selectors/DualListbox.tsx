// ============================================================================
// DUAL LISTBOX
// ============================================================================
// Componente custom de dual list (transfer list) con React + Tailwind.
// Compatible con MultiSelectWithPlaceholder para migración fácil.
// Soporta options con _allIds para opciones agrupadas (ej. GrupoForm).

import React, { useState, useMemo } from 'react';

export interface DualListboxOption {
  value: any;
  label: string;
  _allIds?: number[];
}

export interface DualListboxProps {
  value: number[];
  onChange: (value: number[]) => void;
  options: DualListboxOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  canFilter?: boolean;
  themeColor?: 'green' | 'orange';
  availableLabel?: string;
  selectedLabel?: string;
}

// Obtener los IDs que representa una opción (para opciones con _allIds o simples)
const getOptionIds = (opt: DualListboxOption): number[] => {
  if (opt._allIds && Array.isArray(opt._allIds)) {
    return opt._allIds.map(Number);
  }
  const v = Number(opt.value);
  return isNaN(v) ? [] : [v];
};

// Verificar si una opción está seleccionada (algún ID de la opción está en value)
const isOptionSelected = (opt: DualListboxOption, value: number[]): boolean => {
  const ids = getOptionIds(opt);
  const valueSet = new Set(value.map(Number));
  return ids.some((id) => valueSet.has(id));
};

const DualListbox: React.FC<DualListboxProps> = ({
  value = [],
  onChange,
  options,
  placeholder = 'SELECCIONAR',
  disabled = false,
  className = '',
  canFilter = true,
  themeColor = 'green',
  availableLabel = 'DISPONIBLES',
  selectedLabel = 'SELECCIONADOS'
}) => {
  const [filterAvailable, setFilterAvailable] = useState('');
  const [filterSelected, setFilterSelected] = useState('');

  const valueNumbers = useMemo(() => value.map(Number), [value]);

  const availableOptions = useMemo(() => {
    return options.filter((opt) => !isOptionSelected(opt, valueNumbers));
  }, [options, valueNumbers]);

  const selectedOptions = useMemo(() => {
    return options.filter((opt) => isOptionSelected(opt, valueNumbers));
  }, [options, valueNumbers]);

  const filteredAvailable = useMemo(() => {
    if (!filterAvailable.trim()) return availableOptions;
    const term = filterAvailable.toLowerCase();
    return availableOptions.filter((opt) =>
      opt.label.toLowerCase().includes(term)
    );
  }, [availableOptions, filterAvailable]);

  const filteredSelected = useMemo(() => {
    if (!filterSelected.trim()) return selectedOptions;
    const term = filterSelected.toLowerCase();
    return selectedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(term)
    );
  }, [selectedOptions, filterSelected]);

  const addIds = (ids: number[]) => {
    const combined = new Set([...valueNumbers, ...ids]);
    onChange(Array.from(combined).sort((a, b) => a - b));
  };

  const removeIds = (ids: number[]) => {
    const toRemove = new Set(ids);
    onChange(valueNumbers.filter((id) => !toRemove.has(id)));
  };

  const moveRight = (opts: DualListboxOption[]) => {
    const ids = opts.flatMap(getOptionIds);
    addIds(ids);
  };

  const moveLeft = (opts: DualListboxOption[]) => {
    const ids = opts.flatMap(getOptionIds);
    removeIds(ids);
  };

  const moveAllRight = () => moveRight(availableOptions);
  const moveAllLeft = () => moveLeft(selectedOptions);

  const themeClasses = {
    green: {
      accent: 'text-green-500',
      button: 'bg-green-600 hover:bg-green-700',
      selected: 'bg-green-600/80'
    },
    orange: {
      accent: 'text-orange-500',
      button: 'bg-orange-600 hover:bg-orange-700',
      selected: 'bg-orange-600/80'
    }
  };

  const theme = themeClasses[themeColor];

  const listBase =
    'border border-neutral-600 rounded-lg bg-neutral-800 text-white font-mono text-sm min-h-[200px] max-h-[280px] overflow-y-auto custom-scrollbar';

  const itemBase =
    'px-3 py-2 cursor-pointer transition-colors flex items-center gap-2';

  const renderList = (
    items: DualListboxOption[],
    isAvailable: boolean,
    filter: string,
    onFilterChange: (v: string) => void
  ) => (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className={`font-bold font-mono tracking-wider ${theme.accent}`}>
        {isAvailable ? availableLabel : selectedLabel}
      </div>
      {canFilter && (
        <input
          type="text"
          placeholder="Buscar..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          disabled={disabled}
        />
      )}
      <div className={listBase}>
        {items.length > 0 ? (
          items.map((opt) => (
            <div
              key={String(opt.value)}
              onClick={() => {
                if (disabled) return;
                if (isAvailable) {
                  moveRight([opt]);
                } else {
                  moveLeft([opt]);
                }
              }}
              className={`${itemBase} ${
                isAvailable
                  ? 'hover:bg-neutral-700'
                  : `hover:bg-neutral-700 ${theme.selected}`
              }`}
            >
              <span className="truncate">{opt.label.toUpperCase()}</span>
            </div>
          ))
        ) : (
          <div className="px-3 py-4 text-neutral-500 text-sm font-mono text-center">
            {isAvailable ? 'NINGUNA DISPONIBLE' : 'NINGUNA SELECCIONADA'}
          </div>
        )}
      </div>
    </div>
  );

  const btn =
    'p-2 rounded border border-neutral-600 bg-neutral-700 hover:bg-neutral-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  return (
    <div
      className={`flex gap-4 items-stretch ${disabled ? 'opacity-60' : ''} ${className}`}
    >
      {renderList(
        filteredAvailable,
        true,
        filterAvailable,
        setFilterAvailable
      )}

      <div className="flex flex-col justify-center gap-2">
        <button
          type="button"
          onClick={() => moveRight(filteredAvailable)}
          disabled={disabled || filteredAvailable.length === 0}
          className={btn}
          title="Agregar seleccionados"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={moveAllRight}
          disabled={disabled || availableOptions.length === 0}
          className={btn}
          title="Agregar todos"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => moveLeft(filteredSelected)}
          disabled={disabled || filteredSelected.length === 0}
          className={btn}
          title="Quitar seleccionados"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={moveAllLeft}
          disabled={disabled || selectedOptions.length === 0}
          className={btn}
          title="Quitar todos"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {renderList(
        filteredSelected,
        false,
        filterSelected,
        setFilterSelected
      )}
    </div>
  );
};

export default DualListbox;
