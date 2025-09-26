import React from 'react';

interface SearchBarWithCounterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  placeholder?: string;
}

export function SearchBarWithCounter({ 
  searchTerm, 
  onSearchChange, 
  filteredCount, 
  totalCount, 
  placeholder = "🔍 Buscar en todos los campos..." 
}: SearchBarWithCounterProps) {
  return (
    <div className="mb-6">
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
  );
}
