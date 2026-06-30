import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { JoySenseService } from '../services/backend-api';

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
  paises: any[];
  empresas: any[];
  fundos: any[];
  ubicaciones: any[];
  filterDataLoading: boolean;
  filterDataError: string | null;
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

  const [paises, setPaises] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [filterDataLoading, setFilterDataLoading] = useState(true);
  const [filterDataError, setFilterDataError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchFilterData = async () => {
      try {
        setFilterDataLoading(true);
        setFilterDataError(null);
        const data = await JoySenseService.getFiltersData();
        if (cancelled) return;
        setPaises(data?.paises || []);
        setEmpresas(data?.empresas || []);
        setFundos(data?.fundos || []);
        setUbicaciones(data?.ubicaciones || []);
      } catch (err: any) {
        if (cancelled) return;
        console.error('❌ Error cargando datos de filtros:', err);
        setFilterDataError(err.message || 'Error al cargar datos de filtros');
      } finally {
        if (!cancelled) setFilterDataLoading(false);
      }
    };
    fetchFilterData();
    return () => { cancelled = true; };
  }, []);

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
    paises,
    empresas,
    fundos,
    ubicaciones,
    filterDataLoading,
    filterDataError,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
