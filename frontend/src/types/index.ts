// Tipos para la nueva estructura del schema "sense"

export interface Pais {
  paisid: number;
  pais: string;
  paisabrev: string;
}

export interface Empresa {
  empresaid: number;
  empresa: string;
  empresabrev: string;
  paisid: number;
}

export interface Fundo {
  fundoid: number;
  fundo: string;
  empresaid: number;
  medicionesCount?: number;
}

export interface Ubicacion {
  ubicacionid: number;
  ubicacion: string;
  fundoid: number;
}

export interface Metrica {
  metricaid: number;
  metrica: string;
}

export interface Nodo {
  nodoid: number;
  nodo: string;
}

export interface Tipo {
  tipoid: number;
  tipo: string;
}

export interface Medicion {
  medicionid: number;
  medicion: number;
  fecha: string;
  ubicacionid: number;
  metricaid: number;
  nodoid: number;
  tipoid: number;
  metrica?: Metrica;
  nodo?: {
    nodoid: number;
    nodo: string;
  };
  tipo?: {
    tipoid: number;
    tipo: string;
  };
  ubicacion?: {
    ubicacionid: number;
    ubicacion: string;
  };
}

export interface MetricaSensor {
  nodoid: number;
  metricaid: number;
  primarykey: number;
  statustid: number;
}

export interface Sensor {
  nodoid: number;
  tipoid: number;
}

export interface Entidad {
  entidadid: number;
  entidad: string;
  statusid: number;
}

// Interfaces para el estado de filtros
export interface FilterState {
  paisId?: number;
  empresaId?: number;
  fundoId?: number;
  ubicacionId?: number;
  startDate?: string;
  endDate?: string;
}

// Interfaces para datos de gráficos
export interface ChartData {
  time: string;
  [key: string]: any; // Para diferentes métricas (Temperatura, Humedad, EC)
}

// Interfaces para estadísticas del dashboard
export interface DashboardStats {
  totalMediciones: number;
  promedioMedicion: number;
  ultimaMedicion: string;
  sensoresActivos: number;
}

// Interfaces para respuestas de API
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Interfaces para autenticación y usuario
export interface UserMetadata {
  full_name?: string;
  rol?: string;
  usuarioid?: number;
  auth_user_id?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

export interface AuthError {
  message: string;
}