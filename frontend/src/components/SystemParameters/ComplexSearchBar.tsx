import React from 'react';

interface ComplexSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  placeholder?: string;
}

export function ComplexSearchBar({ 
  searchTerm, 
  onSearchChange, 
  filteredCount, 
  totalCount, 
  placeholder = "🔍 Buscar en todos los campos..." 
}: ComplexSearchBarProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
      <div className="space-y-4">
        {/* Barra de búsqueda simple como en "Estado" - Tactical Style */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-neutral-400 font-mono"
          />
        </div>

        {searchTerm && (
          <div className="mt-2 text-sm text-neutral-400 font-mono">
            Mostrando {filteredCount} de {totalCount} registros
          </div>
        )}
      </div>
    </div>
  );
}
