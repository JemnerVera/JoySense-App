/**
 * Tipos compartidos para ModernDashboard
 */

export interface MedicionData {
  medicionid: number;
  localizacionid: number;
  fecha: string;
  medicion: number;
  usercreatedid?: number;
  datecreated?: string;
  // Datos expandidos desde localizacion
  localizacion?: {
    localizacionid: number;
    localizacion: string;
    nodoid: number;
    metricaid: number;
    sensorid: number;
    latitud?: number;
    longitud?: number;
    nodo?: { nodoid: number; nodo: string };
    metrica?: { metricaid: number; metrica: string; unidad: string };
    sensor?: {
      sensorid: number;
      sensor: string;
      nombre: string;
      tipoid: number;
      tipo?: { tipoid: number; tipo: string };
    };
  };
  // Campos legacy para compatibilidad
  metricaid: number;
  nodoid: number;
  sensorid: number;
  tipoid: number;
  ubicacionid: number;
}

export interface MetricConfig {
  id: string;
  title: string;
  color: string;
  unit: string;
  dataKey: string;
  description: string;
  ranges: {
    min: number;
    max: number;
    optimal: [number, number];
  };
}

export interface ModernDashboardProps {
  filters: {
    entidadId: number | null;
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  };
  onFiltersChange: (filters: any) => void;
  onEntidadChange?: (entidad: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
}
