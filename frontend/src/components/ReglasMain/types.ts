// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ReglasMainProps {
  activeSubTab?: 'status' | 'insert' | 'update';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
}

export interface ReglasMainRef {
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: 'status' | 'insert' | 'update') => void;
}

export interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

export interface ReglaUmbralRow {
  umbralid: number | null;
  operador_logico: 'AND' | 'OR';
  agrupador_inicio: boolean;
  agrupador_fin: boolean;
  orden: number;
  tempId?: string;
}

export interface ReglaUpdateData extends Record<string, any> {
  _reglaUmbralRows?: ReglaUmbralRow[];
}

export interface RelatedData {
  paisesData: any[];
  empresasData: any[];
  fundosData: any[];
  ubicacionesData: any[];
  perfilesData: any[];
  criticidadesData: any[];
  userData: any[];
}

export interface OperationResult {
  success: boolean;
  error?: string;
}

export interface UmbralData {
  regla_umbralid: number | null;
  umbralid: number;
  operador_logico: 'AND' | 'OR';
  agrupador_inicio: boolean;
  agrupador_fin: boolean;
  orden: number;
}