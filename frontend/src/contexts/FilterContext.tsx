import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  paisSeleccionado: string;
  empresaSeleccionada: string;
  fundoSeleccionado: string;
  entidadSeleccionada: any | null;
  ubicacionSeleccionada: any | null;
  setPaisSeleccionado: (pais: string) => void;
  setEmpresaSeleccionada: (empresa: string) => void;
  setFundoSeleccionado: (fundo: string) => void;
  setEntidadSeleccionada: (entidad: any | null) => void;
  setUbicacionSeleccionada: (ubicacion: any | null) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [paisSeleccionado, setPaisSeleccionado] = useState<string>('');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');
  const [fundoSeleccionado, setFundoSeleccionado] = useState<string>('');
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<any | null>(null);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<any | null>(null);

  const resetFilters = () => {
    setPaisSeleccionado('');
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setEntidadSeleccionada(null);
    setUbicacionSeleccionada(null);
  };

  const value: FilterContextType = {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    entidadSeleccionada,
    ubicacionSeleccionada,
    setPaisSeleccionado,
    setEmpresaSeleccionada,
    setFundoSeleccionado,
    setEntidadSeleccionada,
    setUbicacionSeleccionada,
    resetFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
