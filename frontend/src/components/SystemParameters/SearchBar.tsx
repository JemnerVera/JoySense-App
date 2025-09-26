import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "🔍 Buscar en todos los campos..." 
}: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-neutral-400 font-mono"
      />
    </div>
  );
}
