// ============================================================================
// TYPES & INTERFACES FOR MASSIVE LOCALIZACION FORM
// ============================================================================

export interface MassiveLocalizacionFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  onApply: (data: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName?: (paisId: string) => string;
  getEmpresaName?: (empresaId: string) => string;
  getFundoName?: (fundoId: string) => string;
  onFormDataChange?: (formData: any) => void;
  nodosData?: any[];
}

export interface SelectedNodo {
  nodoid: number;
  nodo: string;
  selected: boolean;
  datecreated?: string;
  ubicacionid?: number;
}

export interface SelectedLocalizacion {
  localizacionid: number;
  localizacion: string;
  selected: boolean;
}

export interface SensorMetricaData {
  sensorid: number;
  sensor: string;
  metricaid: number;
  metrica: string;
  selected: boolean;
}

export interface FormData {
  nodoid: number | null;
  localizacionid: number | null;
  sensoresMetricasData: SensorMetricaData[];
}

export interface LocalizacionDataToApply {
  nodoid: number;
  localizacionid: number;
  sensorid: number;
  metricaid: number;
  localizacion: string;
  statusid: number;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
}
