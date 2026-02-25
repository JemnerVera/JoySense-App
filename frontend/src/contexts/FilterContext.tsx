import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FiltersBatch {
  paisId?: string;
  empresaId?: string;
  fundoId?: string;
  ubicacion?: any | null;
}

interface FilterContextType {
  paisSeleccionado: string;
  empresaSeleccionada: string;
  fundoSeleccionado: string;
  ubicacionSeleccionada: any | null;
  showDetailedAnalysis: boolean;
  setPaisSeleccionado: (pais: string) => void;
  setEmpresaSeleccionada: (empresa: string) => void;
  setFundoSeleccionado: (fundo: string) => void;
  setUbicacionSeleccionada: (ubicacion: any | null) => void;
  setShowDetailedAnalysis: (show: boolean) => void;
  setFiltersBatch: (batch: FiltersBatch) => void;
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
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<any | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState<boolean>(false);

  const resetFilters = () => {
    setPaisSeleccionado('');
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
  };

  const setFiltersBatch = (batch: FiltersBatch) => {
    if (batch.paisId !== undefined) setPaisSeleccionado(batch.paisId);
    if (batch.empresaId !== undefined) setEmpresaSeleccionada(batch.empresaId);
    if (batch.fundoId !== undefined) setFundoSeleccionado(batch.fundoId);
    if (batch.ubicacion !== undefined) setUbicacionSeleccionada(batch.ubicacion);
  };

  const value: FilterContextType = {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    ubicacionSeleccionada,
    showDetailedAnalysis,
    setPaisSeleccionado,
    setEmpresaSeleccionada,
    setFundoSeleccionado,
    setUbicacionSeleccionada,
    setShowDetailedAnalysis,
    setFiltersBatch,
    resetFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
