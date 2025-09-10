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
    FILTER_CONTAINER: 'px-4 py-4 border-t border-gray-700',
    FILTER_TITLE: 'text-sm font-medium text-gray-300 mb-3',
    FILTER_LABEL: 'block text-xs font-medium text-gray-400 mb-1',
    FILTER_SELECT: 'w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500',
    FILTER_OPTION: 'text-white'
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
