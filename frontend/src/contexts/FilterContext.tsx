import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface FiltersBatch {
  paisId?: string;
  empresaId?: string;
  fundoId?: string;
  ubicacion?: any | null;
  localizacion?: any | null;
}

interface FilterContextType {
  paisSeleccionado: string;
  empresaSeleccionada: string;
  fundoSeleccionado: string;
  ubicacionSeleccionada: any | null;
  localizacionSeleccionada: any | null;
  showDetailedAnalysis: boolean;
  setPaisSeleccionado: (pais: string) => void;
  setEmpresaSeleccionada: (empresa: string) => void;
  setFundoSeleccionado: (fundo: string) => void;
  setUbicacionSeleccionada: (ubicacion: any | null) => void;
  setLocalizacionSeleccionada: (localizacion: any | null) => void;
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
  const [localizacionSeleccionada, setLocalizacionSeleccionada] = useState<any | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState<boolean>(false);

  const setPaisSeleccionadoCb = useCallback((pais: string) => {
    setPaisSeleccionado(pais);
  }, []);

  const setEmpresaSeleccionadaCb = useCallback((empresa: string) => {
    setEmpresaSeleccionada(empresa);
  }, []);

  const setFundoSeleccionadoCb = useCallback((fundo: string) => {
    setFundoSeleccionado(fundo);
  }, []);

  const setUbicacionSeleccionadaCb = useCallback((ubicacion: any | null) => {
    setUbicacionSeleccionada(ubicacion);
  }, []);

  const setLocalizacionSeleccionadaCb = useCallback((localizacion: any | null) => {
    setLocalizacionSeleccionada(localizacion);
  }, []);

  const setShowDetailedAnalysisCb = useCallback((show: boolean) => {
    setShowDetailedAnalysis(show);
  }, []);

  const resetFilters = useCallback(() => {
    setPaisSeleccionado('');
    setEmpresaSeleccionada('');
    setFundoSeleccionado('');
    setUbicacionSeleccionada(null);
    setLocalizacionSeleccionada(null);
  }, []);

  const setFiltersBatch = useCallback((batch: FiltersBatch) => {
    if (batch.paisId !== undefined) setPaisSeleccionado(batch.paisId);
    if (batch.empresaId !== undefined) setEmpresaSeleccionada(batch.empresaId);
    if (batch.fundoId !== undefined) setFundoSeleccionado(batch.fundoId);
    if (batch.ubicacion !== undefined) setUbicacionSeleccionada(batch.ubicacion);
    if (batch.localizacion !== undefined) setLocalizacionSeleccionada(batch.localizacion);
  }, []);

  const value: FilterContextType = {
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    ubicacionSeleccionada,
    localizacionSeleccionada,
    showDetailedAnalysis,
    setPaisSeleccionado: setPaisSeleccionadoCb,
    setEmpresaSeleccionada: setEmpresaSeleccionadaCb,
    setFundoSeleccionado: setFundoSeleccionadoCb,
    setUbicacionSeleccionada: setUbicacionSeleccionadaCb,
    setLocalizacionSeleccionada: setLocalizacionSeleccionadaCb,
    setShowDetailedAnalysis: setShowDetailedAnalysisCb,
    setFiltersBatch,
    resetFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
