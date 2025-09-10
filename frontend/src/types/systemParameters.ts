// Tipos para el sistema de parámetros

export interface TableInfo {
  tableName: string;
  displayName: string;
  description?: string;
  primaryKey: string | string[];
  hasCompositeKey: boolean;
  fields: ColumnInfo[];
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isIdentity: boolean;
  isPrimaryKey: boolean;
  maxLength?: number;
  defaultValue?: any;
  displayName?: string;
  description?: string;
  isForeignKey?: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

export interface TableConstraint {
  constraintName: string;
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columnName?: string;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface InsertResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface UpdateResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface TableDataResponse {
  data: any[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FilterOptions {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
  value2?: any; // Para operador 'between'
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface QueryOptions {
  filters?: FilterOptions[];
  sort?: SortOptions[];
  pagination?: PaginationOptions;
  include?: string[]; // Campos a incluir
  exclude?: string[]; // Campos a excluir
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'datetime' | 'time';
  required: boolean;
  placeholder?: string;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  dependsOn?: string[]; // Campos de los que depende
  conditional?: {
    field: string;
    value: any;
    show: boolean;
  };
}

export interface FormConfig {
  fields: FormField[];
  layout?: 'single' | 'two-column' | 'three-column';
  submitText?: string;
  cancelText?: string;
  resetText?: string;
}

export interface TableConfig {
  columns: ColumnInfo[];
  sortable: boolean;
  filterable: boolean;
  selectable: boolean;
  pagination: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  actions?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
    copy?: boolean;
  };
}

export interface BulkAction {
  name: string;
  label: string;
  icon?: string;
  action: (selectedRows: any[]) => Promise<void>;
  confirmMessage?: string;
  requiresSelection?: boolean;
}

export interface TableAction {
  name: string;
  label: string;
  icon?: string;
  action: (row: any) => Promise<void>;
  confirmMessage?: string;
  condition?: (row: any) => boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState {
  data: Record<string, any>;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface TableState {
  data: any[];
  loading: boolean;
  error: string | null;
  selectedRows: any[];
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
  totalCount: number;
  filters: Record<string, any>;
}

export interface ReferenceData {
  [tableName: string]: any[];
}

export interface IdToNameMapping {
  [tableName: string]: {
    [id: string]: string;
  };
}

export interface TableRelationship {
  table: string;
  field: string;
  referencedTable: string;
  referencedField: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
}

export interface TableSchema {
  tables: TableInfo[];
  relationships: TableRelationship[];
  constraints: TableConstraint[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResult<T = any> = SuccessResponse<T> | ErrorResponse;

// Tipos para operaciones específicas
export interface InsertOperation {
  table: string;
  data: Record<string, any>;
  returnData?: boolean;
}

export interface UpdateOperation {
  table: string;
  id: string | Record<string, any>; // Para claves compuestas
  data: Record<string, any>;
  returnData?: boolean;
}

export interface DeleteOperation {
  table: string;
  id: string | Record<string, any>; // Para claves compuestas
  cascade?: boolean;
}

export interface QueryOperation {
  table: string;
  options?: QueryOptions;
}

// Tipos para formularios dinámicos
export interface DynamicFormProps {
  table: string;
  mode: 'create' | 'edit' | 'view';
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  config?: FormConfig;
}

export interface DynamicTableProps {
  table: string;
  config?: TableConfig;
  actions?: TableAction[];
  bulkActions?: BulkAction[];
  onRowSelect?: (rows: any[]) => void;
  onRowAction?: (action: string, row: any) => void;
}

// Tipos para validación
export interface ValidationRule {
  field: string;
  rules: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any, formData: Record<string, any>) => string | null;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipos para filtros avanzados
export interface AdvancedFilter {
  id: string;
  field: string;
  operator: string;
  value: any;
  label: string;
}

export interface FilterGroup {
  id: string;
  operator: 'AND' | 'OR';
  filters: (AdvancedFilter | FilterGroup)[];
}

// Tipos para exportación
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  filename?: string;
  includeHeaders?: boolean;
  selectedColumns?: string[];
  filters?: FilterOptions[];
}

export interface ExportResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

// Tipos para importación
export interface ImportOptions {
  format: 'csv' | 'excel' | 'json';
  file: File;
  mapping?: Record<string, string>; // Mapeo de columnas del archivo a campos de la tabla
  skipFirstRow?: boolean;
  validateData?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ValidationError[];
  data?: any[];
}

// Tipos para auditoría
export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Tipos para configuración de tabla
export interface TableSettings {
  tableName: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  isVisible: boolean;
  isEditable: boolean;
  isDeletable: boolean;
  permissions: {
    view: string[];
    create: string[];
    update: string[];
    delete: string[];
  };
  customFields?: FormField[];
  customActions?: TableAction[];
  customBulkActions?: BulkAction[];
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// Tipos para configuración de usuario
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  tableSettings: Record<string, TableSettings>;
  dashboard: {
    widgets: string[];
    layout: Record<string, any>;
  };
}

// Tipos para métricas y estadísticas
export interface TableMetrics {
  tableName: string;
  totalRecords: number;
  lastUpdated: Date;
  growthRate: number;
  topFields: {
    field: string;
    count: number;
  }[];
  recentActivity: {
    action: string;
    count: number;
    timestamp: Date;
  }[];
}

// Tipos para búsqueda global
export interface SearchResult {
  table: string;
  id: string;
  title: string;
  description?: string;
  fields: Record<string, any>;
  relevance: number;
}

export interface GlobalSearchOptions {
  query: string;
  tables?: string[];
  limit?: number;
  includeFields?: string[];
  excludeFields?: string[];
}

// Tipos para caché
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'lfu';
}

// Tipos para sincronización
export interface SyncStatus {
  table: string;
  lastSync: Date;
  status: 'synced' | 'pending' | 'error';
  error?: string;
  pendingChanges: number;
}

export interface SyncOptions {
  tables?: string[];
  force?: boolean;
  incremental?: boolean;
}

// Tipos para backup y restore
export interface BackupOptions {
  tables?: string[];
  includeData?: boolean;
  includeSchema?: boolean;
  format?: 'sql' | 'json' | 'csv';
  compression?: boolean;
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  tables?: string[];
  error?: string;
}

export interface RestoreOptions {
  file: File;
  tables?: string[];
  mode?: 'replace' | 'merge' | 'append';
  validateData?: boolean;
}

export interface RestoreResult {
  success: boolean;
  restored: number;
  failed: number;
  errors: ValidationError[];
  tables?: string[];
}

