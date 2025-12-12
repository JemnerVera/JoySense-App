// ============================================================================
// TYPES & INTERFACES FOR MASSIVE UMBRAL FORM
// ============================================================================

export interface MassiveUmbralFormProps {
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
  localizacionesData?: any[];
}

export interface SelectedNode {
  nodoid: number;
  nodo: string;
  selected: boolean;
  datecreated?: string;
  ubicacionid?: number;
}

export interface SelectedTipo {
  tipoid: number;
  tipo: string;
  selected: boolean;
}

export interface MetricaData {
  metricaid: number;
  metrica: string;
  unidad: string;
  selected: boolean;
  expanded: boolean;
  umbralesPorTipo: {
    [tipoid: number]: {
      minimo: string;
      maximo: string;
      criticidadid: number | null;
      umbral: string;
    } | undefined;
  };
}

export interface FormData {
  fundoid: number | null;
  entidadid: number | null;
  metricasData: MetricaData[];
}

export interface UmbralDataToApply {
  ubicacionid: number;
  nodoid: number;
  tipoid: number;
  metricaid: number;
  criticidadid: number;
  umbral: string;
  minimo: number;
  maximo: number;
  statusid: number;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  groupedNodes: {[key: string]: {count: number, types: string[], nodos: any[]}};
  nodoAnalysis: Array<{
    nodoid: number;
    nodo: string;
    types: string[];
    count: number;
    typesKey: string;
  }>;
}

