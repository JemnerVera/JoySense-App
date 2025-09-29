// Configuración para el sistema de alertas
export const ALERTAS_CONFIG = {
  // Valores por defecto para los filtros
  DEFAULT_FILTERS: {
    CRITICIDAD: 'todas',
    UBICACION: 'todas'
  },
  
  // Configuración del sidebar
  SIDEBAR: {
    FILTERS_SECTION_TITLE: 'Filtros',
    CRITICIDAD_LABEL: 'Criticidad',
    UBICACION_LABEL: 'Ubicación',
    TODAS_OPTION: 'Todas'
  },
  
  // Configuración de estilos
  STYLES: {
    FILTER_CONTAINER: 'px-4 py-4 border-t border-neutral-700',
    FILTER_TITLE: 'text-sm font-bold text-orange-500 font-mono tracking-wider mb-3',
    FILTER_LABEL: 'block text-xs font-bold text-orange-500 font-mono tracking-wider mb-1',
    FILTER_SELECT: 'w-full bg-neutral-800 text-white border border-neutral-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
    FILTER_OPTION: 'text-white font-mono'
  }
};

// Tipos para el sistema de alertas
export interface AlertasFilterState {
  filtroCriticidad: string;
  filtroUbicacion: string;
  criticidadesDisponibles: string[];
  ubicacionesDisponibles: string[];
}

export interface AlertasFilterActions {
  setFiltroCriticidad: (value: string) => void;
  setFiltroUbicacion: (value: string) => void;
  setCriticidadesDisponibles: (value: string[]) => void;
  setUbicacionesDisponibles: (value: string[]) => void;
}

export type AlertasFilterContextType = AlertasFilterState & AlertasFilterActions;
