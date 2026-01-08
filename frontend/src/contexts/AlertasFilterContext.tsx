import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ALERTAS_CONFIG, AlertasFilterContextType } from '../config/alertasConfig';

const AlertasFilterContext = createContext<AlertasFilterContextType | undefined>(undefined);

interface AlertasFilterProviderProps {
  children: ReactNode;
}

export const AlertasFilterProvider: React.FC<AlertasFilterProviderProps> = ({ children }) => {
  const [filtroCriticidad, setFiltroCriticidad] = useState<string>(ALERTAS_CONFIG.DEFAULT_FILTERS.CRITICIDAD);
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>(ALERTAS_CONFIG.DEFAULT_FILTERS.UBICACION);
  const [filtroLocalizacion, setFiltroLocalizacion] = useState<string>(ALERTAS_CONFIG.DEFAULT_FILTERS.LOCALIZACION || 'todas');
  const [criticidadesDisponibles, setCriticidadesDisponibles] = useState<string[]>([]);
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState<string[]>([]);
  const [localizacionesDisponibles, setLocalizacionesDisponibles] = useState<string[]>([]);

  return (
    <AlertasFilterContext.Provider value={{
      filtroCriticidad,
      setFiltroCriticidad,
      filtroUbicacion,
      setFiltroUbicacion,
      filtroLocalizacion,
      setFiltroLocalizacion,
      criticidadesDisponibles,
      setCriticidadesDisponibles,
      ubicacionesDisponibles,
      setUbicacionesDisponibles,
      localizacionesDisponibles,
      setLocalizacionesDisponibles
    } as any}>
      {children}
    </AlertasFilterContext.Provider>
  );
};

export const useAlertasFilter = () => {
  const context = useContext(AlertasFilterContext);
  if (context === undefined) {
    // En lugar de lanzar error, retornar valores por defecto
    console.warn('useAlertasFilter used outside of AlertasFilterProvider, using default values');
    return {
      filtroCriticidad: ALERTAS_CONFIG.DEFAULT_FILTERS.CRITICIDAD,
      setFiltroCriticidad: () => {},
      filtroUbicacion: ALERTAS_CONFIG.DEFAULT_FILTERS.UBICACION,
      setFiltroUbicacion: () => {},
      filtroLocalizacion: ALERTAS_CONFIG.DEFAULT_FILTERS.LOCALIZACION || 'todas',
      setFiltroLocalizacion: () => {},
      criticidadesDisponibles: [],
      setCriticidadesDisponibles: () => {},
      ubicacionesDisponibles: [],
      setUbicacionesDisponibles: () => {},
      localizacionesDisponibles: [],
      setLocalizacionesDisponibles: () => {}
    };
  }
  return context;
};

// Hook seguro que no lanza error si no hay contexto
export const useAlertasFilterSafe = () => {
  const context = useContext(AlertasFilterContext);
  return context; // Puede ser undefined
};
