/**
 * Configuración centralizada de tablas para el schema joysense
 * Elimina la necesidad de switch/case statements en SystemParameters
 */

import { TableName, PRIMARY_KEY_MAP } from '../types';

// ============================================================================
// TIPOS
// ============================================================================

export interface TableFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'date' | 'datetime' | 'boolean' | 'textarea';
  required?: boolean;
  hidden?: boolean;
  readonly?: boolean;
  foreignKey?: {
    table: TableName;
    valueField: string;
    labelField: string | string[];
  };
  options?: Array<{ value: any; label: string }>;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

export interface TableConfig {
  name: TableName;
  displayName: string;
  description: string;
  icon: string;
  category: 'geografia' | 'dispositivos' | 'mediciones' | 'alertas' | 'usuarios' | 'sistema';
  primaryKey: string | string[];
  fields: TableFieldConfig[];
  allowInsert?: boolean;
  allowUpdate?: boolean;
  allowDelete?: boolean;
  allowMassive?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// CONFIGURACIÓN DE TABLAS
// ============================================================================

export const TABLES_CONFIG: Record<TableName, TableConfig> = {
  // --------------------------------------------------------------------------
  // GEOGRAFÍA
  // --------------------------------------------------------------------------
  pais: {
    name: 'pais',
    displayName: 'País',
    description: 'Países donde opera la empresa',
    icon: '🌎',
    category: 'geografia',
    primaryKey: 'paisid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'pais',
    fields: [
      { name: 'paisid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'pais', label: 'País', type: 'text', required: true, validation: { minLength: 2, maxLength: 100 } },
      { name: 'paisabrev', label: 'Abreviatura', type: 'text', required: true, validation: { minLength: 1, maxLength: 2 } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  empresa: {
    name: 'empresa',
    displayName: 'Empresa',
    description: 'Empresas registradas en el sistema',
    icon: '🏢',
    category: 'geografia',
    primaryKey: 'empresaid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'empresa',
    fields: [
      { name: 'empresaid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'paisid', label: 'País', type: 'select', required: true, foreignKey: { table: 'pais', valueField: 'paisid', labelField: 'pais' } },
      { name: 'empresa', label: 'Empresa', type: 'text', required: true },
      { name: 'empresabrev', label: 'Abreviatura', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  fundo: {
    name: 'fundo',
    displayName: 'Fundo',
    description: 'Fundos o predios agrícolas',
    icon: '🌾',
    category: 'geografia',
    primaryKey: 'fundoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'fundo',
    fields: [
      { name: 'fundoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'empresaid', label: 'Empresa', type: 'select', required: true, foreignKey: { table: 'empresa', valueField: 'empresaid', labelField: 'empresa' } },
      { name: 'fundo', label: 'Fundo', type: 'text', required: true },
      { name: 'fundoabrev', label: 'Abreviatura', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  ubicacion: {
    name: 'ubicacion',
    displayName: 'Ubicación',
    description: 'Ubicaciones dentro de los fundos',
    icon: '📍',
    category: 'geografia',
    primaryKey: 'ubicacionid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'ubicacion',
    fields: [
      { name: 'ubicacionid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'fundoid', label: 'Fundo', type: 'select', required: true, foreignKey: { table: 'fundo', valueField: 'fundoid', labelField: 'fundo' } },
      { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  entidad: {
    name: 'entidad',
    displayName: 'Carpeta',
    description: 'Carpetas o cultivos',
    icon: '🌱',
    category: 'geografia',
    primaryKey: 'entidadid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'entidad',
    fields: [
      { name: 'entidadid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'entidad', label: 'Carpeta', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  entidad_localizacion: {
    name: 'entidad_localizacion',
    displayName: 'Localización por Carpeta',
    description: 'Relación entre carpetas y localizaciones',
    icon: '🔗',
    category: 'geografia',
    primaryKey: ['entidadid', 'localizacionid'],
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      { name: 'entidadid', label: 'Carpeta', type: 'select', required: true, foreignKey: { table: 'entidad', valueField: 'entidadid', labelField: 'entidad' } },
      { name: 'localizacionid', label: 'Localización', type: 'select', required: true, foreignKey: { table: 'localizacion', valueField: 'localizacionid', labelField: 'localizacion' } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  // --------------------------------------------------------------------------
  // DISPOSITIVOS
  // --------------------------------------------------------------------------
  tipo: {
    name: 'tipo',
    displayName: 'Tipo',
    description: 'Tipos de sensores disponibles',
    icon: '🔧',
    category: 'dispositivos',
    primaryKey: 'tipoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'tipo',
    fields: [
      { name: 'tipoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'tipo', label: 'Tipo', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  metrica: {
    name: 'metrica',
    displayName: 'Métrica',
    description: 'Métricas medibles (temperatura, humedad, etc.)',
    icon: '📊',
    category: 'dispositivos',
    primaryKey: 'metricaid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'metrica',
    fields: [
      { name: 'metricaid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'metrica', label: 'Métrica', type: 'text', required: true },
      { name: 'unidad', label: 'Unidad', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  sensor: {
    name: 'sensor',
    displayName: 'Sensor',
    description: 'Sensores físicos',
    icon: '📡',
    category: 'dispositivos',
    primaryKey: 'sensorid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    allowMassive: false,
    fields: [
      { name: 'sensorid', label: 'ID del Sensor', type: 'number', hidden: true, readonly: true },
      { name: 'sensor', label: 'Sensor', type: 'text', required: true },
      { name: 'tipoid', label: 'Tipo', type: 'select', required: true, foreignKey: { table: 'tipo', valueField: 'tipoid', labelField: 'tipo' } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  metricasensor: {
    name: 'metricasensor',
    displayName: 'Métrica de Sensor',
    description: 'Métricas que puede medir cada sensor',
    icon: '📈',
    category: 'dispositivos',
    primaryKey: ['sensorid', 'metricaid'],
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    allowMassive: false,
    fields: [
      { name: 'sensorid', label: 'Sensor', type: 'select', required: true, foreignKey: { table: 'sensor', valueField: 'sensorid', labelField: 'sensor' } },
      { name: 'metricaid', label: 'Métrica', type: 'select', required: true, foreignKey: { table: 'metrica', valueField: 'metricaid', labelField: 'metrica' } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  nodo: {
    name: 'nodo',
    displayName: 'Nodo',
    description: 'Nodos o gateways de comunicación',
    icon: '📶',
    category: 'dispositivos',
    primaryKey: 'nodoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'nodo',
    fields: [
      { name: 'nodoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'ubicacionid', label: 'Ubicación', type: 'select', required: true, foreignKey: { table: 'ubicacion', valueField: 'ubicacionid', labelField: 'ubicacion' } },
      { name: 'nodo', label: 'Nombre', type: 'text', required: true },
      { name: 'latitud', label: 'Latitud', type: 'number' },
      { name: 'longitud', label: 'Longitud', type: 'number' },
      { name: 'referencia', label: 'Referencia', type: 'text' },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  localizacion: {
    name: 'localizacion',
    displayName: 'Localización',
    description: 'Punto de medición (nodo + sensor + métrica)',
    icon: '📌',
    category: 'dispositivos',
    primaryKey: 'localizacionid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    allowMassive: true,
    sortField: 'localizacion',
    fields: [
      { name: 'localizacionid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'nodoid', label: 'Nodo', type: 'select', required: true, foreignKey: { table: 'nodo', valueField: 'nodoid', labelField: 'nodo' } },
      { name: 'sensorid', label: 'Sensor', type: 'select', required: true, foreignKey: { table: 'sensor', valueField: 'sensorid', labelField: 'sensor' } },
      { name: 'metricaid', label: 'Métrica', type: 'select', required: true, foreignKey: { table: 'metrica', valueField: 'metricaid', labelField: 'metrica' } },
      { name: 'localizacion', label: 'Nombre', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  asociacion: {
    name: 'asociacion',
    displayName: 'Asociación',
    description: 'Mapeo de dispositivos LoRaWAN a localizaciones',
    icon: '🔌',
    category: 'dispositivos',
    primaryKey: 'asociacionid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      { name: 'asociacionid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'localizacionid', label: 'Localización', type: 'select', required: true, foreignKey: { table: 'localizacion', valueField: 'localizacionid', labelField: 'localizacion' } },
      { name: 'id_device', label: 'ID del Dispositivo', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  // --------------------------------------------------------------------------
  // MEDICIONES
  // --------------------------------------------------------------------------
  medicion: {
    name: 'medicion',
    displayName: 'Medición',
    description: 'Mediciones de sensores',
    icon: '📉',
    category: 'mediciones',
    primaryKey: 'medicionid',
    allowInsert: false,
    allowUpdate: false,
    allowDelete: false,
    sortField: 'fecha',
    sortOrder: 'desc',
    fields: [
      { name: 'medicionid', label: 'ID', type: 'number', readonly: true },
      { name: 'localizacionid', label: 'Localización', type: 'select', required: true, foreignKey: { table: 'localizacion', valueField: 'localizacionid', labelField: 'localizacion' } },
      { name: 'fecha', label: 'Fecha', type: 'datetime', required: true },
      { name: 'medicion', label: 'Valor', type: 'number', required: true }
    ]
  },

  sensor_valor: {
    name: 'sensor_valor',
    displayName: 'Valores Sensor (Staging)',
    description: 'Datos entrantes de LoRaWAN sin procesar',
    icon: '📥',
    category: 'mediciones',
    primaryKey: ['id_device', 'fecha'],
    allowInsert: false,
    allowUpdate: false,
    allowDelete: false,
    fields: [
      { name: 'id_device', label: 'ID del Dispositivo', type: 'text', readonly: true },
      { name: 'fecha', label: 'Fecha', type: 'datetime', readonly: true },
      { name: 'valor', label: 'Valor', type: 'number', readonly: true },
      { name: 'statusid', label: 'Estado', type: 'number', readonly: true }
    ]
  },

  sensor_valor_error: {
    name: 'sensor_valor_error',
    displayName: 'Errores de Sensor',
    description: 'Log de errores de procesamiento',
    icon: '⚠️',
    category: 'mediciones',
    primaryKey: 'sensorvalorerrorid',
    allowInsert: false,
    allowUpdate: false,
    allowDelete: false,
    fields: [
      { name: 'sensorvalorerrorid', label: 'ID', type: 'number', readonly: true },
      { name: 'id_device', label: 'ID del Dispositivo', type: 'text', readonly: true },
      { name: 'error', label: 'Error', type: 'text', readonly: true },
      { name: 'valor', label: 'Valor', type: 'number', readonly: true },
      { name: 'fecha', label: 'Fecha', type: 'datetime', readonly: true },
      { name: 'statusid', label: 'Estado', type: 'number', readonly: true }
    ]
  },

  // --------------------------------------------------------------------------
  // ALERTAS
  // --------------------------------------------------------------------------
  criticidad: {
    name: 'criticidad',
    displayName: 'Criticidad',
    description: 'Niveles de criticidad para alertas',
    icon: '🚨',
    category: 'alertas',
    primaryKey: 'criticidadid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'criticidad',
    fields: [
      { name: 'criticidadid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'criticidad', label: 'Criticidad', type: 'text', required: true },
      { name: 'escalamiento', label: 'Escalamiento (horas)', type: 'number', required: true, defaultValue: 2 },
      { name: 'escalon', label: 'Escalón', type: 'number', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  umbral: {
    name: 'umbral',
    displayName: 'Umbral',
    description: 'Umbrales de alerta por localización',
    icon: '⚡',
    category: 'alertas',
    primaryKey: 'umbralid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    allowMassive: true,
    fields: [
      { name: 'umbralid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'umbral', label: 'Nombre', type: 'text', required: true },
      { name: 'metricaid', label: 'Métrica', type: 'select', foreignKey: { table: 'metrica', valueField: 'metricaid', labelField: 'metrica' } },
      { name: 'operador', label: 'Operador', type: 'text', required: true },
      { name: 'minimo', label: 'Mínimo', type: 'number', required: true },
      { name: 'maximo', label: 'Máximo', type: 'number', required: true },
      { name: 'estandar', label: 'Estándar', type: 'number' },
      { name: 'inversion', label: 'Inversión', type: 'boolean', defaultValue: false },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },


  alerta_regla: {
    name: 'alerta_regla',
    displayName: 'Alerta Regla',
    description: 'Historial de alertas disparadas por reglas',
    icon: '📝',
    category: 'alertas',
    primaryKey: 'uuid_alerta_reglaid',
    allowInsert: false,
    allowUpdate: false,
    allowDelete: false,
    sortField: 'fecha',
    sortOrder: 'desc',
    fields: [
      { name: 'uuid_alerta_reglaid', label: 'UUID', type: 'text', readonly: true },
      { name: 'reglaid', label: 'Regla', type: 'select', readonly: true, foreignKey: { table: 'regla', valueField: 'reglaid', labelField: 'nombre' } },
      { name: 'localizacionid', label: 'Localización', type: 'select', readonly: true, foreignKey: { table: 'localizacion', valueField: 'localizacionid', labelField: 'localizacion' } },
      { name: 'medicionid', label: 'Medición', type: 'number', readonly: true },
      { name: 'fecha', label: 'Fecha', type: 'datetime', readonly: true },
      { name: 'valor', label: 'Valor', type: 'number', readonly: true },
      { name: 'statusid', label: 'Estado', type: 'number', readonly: true }
    ]
  },

  alerta_regla_consolidado: {
    name: 'alerta_regla_consolidado',
    displayName: 'Alerta Consolidada',
    description: 'Alertas agrupadas por regla para notificación',
    icon: '📋',
    category: 'alertas',
    primaryKey: 'uuid_consolidadoid',
    allowInsert: false,
    allowUpdate: true,
    allowDelete: false,
    fields: [
      { name: 'uuid_consolidadoid', label: 'UUID', type: 'text', readonly: true },
      { name: 'reglaid', label: 'Regla', type: 'select', readonly: true, foreignKey: { table: 'regla', valueField: 'reglaid', labelField: 'nombre' } },
      { name: 'localizacionid', label: 'Localización', type: 'select', readonly: true, foreignKey: { table: 'localizacion', valueField: 'localizacionid', labelField: 'localizacion' } },
      { name: 'fechainicio', label: 'Fecha Inicio', type: 'datetime', readonly: true },
      { name: 'fechaultimo', label: 'Última Alerta', type: 'datetime', readonly: true },
      { name: 'fechaultimacorrida', label: 'Fecha Última Corrida', type: 'datetime', readonly: true },
      { name: 'ultimovalor', label: 'Último Valor', type: 'number', readonly: true },
      { name: 'contador', label: 'Contador', type: 'number', readonly: true },
      { name: 'nivelnotificado', label: 'Nivel Notificado', type: 'number', readonly: true },
      { name: 'ultimoenvio', label: 'Último Envío', type: 'datetime', readonly: true },
      { name: 'ultimoescalamiento', label: 'Último Escalamiento', type: 'datetime', readonly: true },
      { name: 'nivelescalamiento', label: 'Nivel Escalamiento', type: 'number', readonly: true },
      { name: 'statusid', label: 'Estado', type: 'number' }
    ]
  },


  // perfilumbral ya no existe - reemplazado por regla_perfil y regla_umbral
  
  regla: {
    name: 'regla',
    displayName: 'Reglas',
    description: 'Reglas de negocio para alertas',
    icon: '📋',
    category: 'alertas',
    primaryKey: 'reglaid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    allowMassive: false,
    fields: [
      { name: 'reglaid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'nombre', label: 'REGLA', type: 'text', required: true },
      { name: 'prioridad', label: 'Prioridad', type: 'number', defaultValue: 1 },
      { name: 'ventana', label: 'Ventana', type: 'text', required: true, defaultValue: '00:10:00', validation: { pattern: /^(\d{2}:\d{2}:\d{2}|\d+\s+(day|days|hour|hours|minute|minutes|second|seconds))$/i } },
      { name: 'cooldown', label: 'Cooldown', type: 'text', required: true, defaultValue: '1 day', validation: { pattern: /^(\d{2}:\d{2}:\d{2}|\d+\s+(day|days|hour|hours|minute|minutes|second|seconds))$/i } },
      { name: 'criticidadid', label: 'Criticidad', type: 'select', required: true, foreignKey: { table: 'criticidad', valueField: 'criticidadid', labelField: 'criticidad' } },
      { name: 'requiere_escalamiento', label: 'ESCALA?', type: 'boolean', defaultValue: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  regla_perfil: {
    name: 'regla_perfil',
    displayName: 'Regla-Perfil',
    description: 'Asignación de reglas a perfiles',
    icon: '👤',
    category: 'alertas',
    primaryKey: 'regla_perfilid',
    allowInsert: false,
    allowUpdate: true,
    allowDelete: true,
    allowMassive: false,
    fields: [
      { name: 'regla_perfilid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'reglaid', label: 'Regla', type: 'select', required: true, foreignKey: { table: 'regla', valueField: 'reglaid', labelField: 'nombre' } },
      { name: 'perfilid', label: 'Perfil', type: 'select', required: true, foreignKey: { table: 'perfil', valueField: 'perfilid', labelField: 'perfil' } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  regla_umbral: {
    name: 'regla_umbral',
    displayName: 'Regla-Umbral',
    description: 'Asignación de umbrales a reglas',
    icon: '⚡',
    category: 'alertas',
    primaryKey: 'regla_umbralid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    allowMassive: false,
    fields: [
      { name: 'regla_umbralid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'reglaid', label: 'Regla', type: 'select', required: true, foreignKey: { table: 'regla', valueField: 'reglaid', labelField: 'nombre' } },
      { name: 'umbralid', label: 'Umbral', type: 'select', required: true, foreignKey: { table: 'umbral', valueField: 'umbralid', labelField: 'umbral' } },
      { name: 'operador_logico', label: 'Operador Lógico', type: 'select', required: true, defaultValue: 'AND' },
      { name: 'agrupador_inicio', label: 'Agrupador Inicio', type: 'boolean', defaultValue: false },
      { name: 'agrupador_fin', label: 'Agrupador Fin', type: 'boolean', defaultValue: false },
      { name: 'orden', label: 'Orden', type: 'number', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  regla_objeto: {
    name: 'regla_objeto',
    displayName: 'Regla-Objeto',
    description: 'Asignación de objetos (geográficos/funcionales) a reglas',
    icon: '🎯',
    category: 'alertas',
    primaryKey: 'regla_objetoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    allowMassive: false,
    fields: [
      { name: 'regla_objetoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'reglaid', label: 'Regla', type: 'select', required: true, foreignKey: { table: 'regla', valueField: 'reglaid', labelField: 'nombre' } },
      { name: 'origenid', label: 'Origen', type: 'select', required: true, foreignKey: { table: 'origen', valueField: 'origenid', labelField: 'origen' } },
      { name: 'fuenteid', label: 'Fuente', type: 'select', required: true, foreignKey: { table: 'fuente', valueField: 'fuenteid', labelField: 'fuente' } },
      { name: 'objetoid', label: 'ID de Objeto', type: 'number', required: false },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  audit_log_umbral: {
    name: 'audit_log_umbral',
    displayName: 'Auditoría de Umbral',
    description: 'Log de cambios en umbrales',
    icon: '📜',
    category: 'alertas',
    primaryKey: 'auditid',
    allowInsert: false,
    allowUpdate: false,
    allowDelete: false,
    fields: [
      { name: 'auditid', label: 'ID', type: 'number', readonly: true },
      { name: 'umbralid', label: 'Umbral', type: 'number', readonly: true },
      { name: 'accion', label: 'Acción', type: 'text', readonly: true },
      { name: 'old_minimo', label: 'Min Anterior', type: 'number', readonly: true },
      { name: 'new_minimo', label: 'Min Nuevo', type: 'number', readonly: true },
      { name: 'old_maximo', label: 'Max Anterior', type: 'number', readonly: true },
      { name: 'new_maximo', label: 'Max Nuevo', type: 'number', readonly: true },
      { name: 'datemodified', label: 'Fecha', type: 'datetime', readonly: true }
    ]
  },

  // --------------------------------------------------------------------------
  // USUARIOS
  // --------------------------------------------------------------------------
  usuario: {
    name: 'usuario',
    displayName: 'Usuario',
    description: 'Usuarios del sistema',
    icon: '👤',
    category: 'usuarios',
    primaryKey: 'usuarioid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'login',
    fields: [
      { name: 'usuarioid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'login', label: 'Login (Email)', type: 'email', required: true },
      { name: 'password_hash', label: 'Password Hash', type: 'text', required: true, hidden: true },
      { name: 'firstname', label: 'Nombre', type: 'text', required: true },
      { name: 'lastname', label: 'Apellido', type: 'text', required: true },
      { name: 'useruuid', label: 'UUID Usuario', type: 'text', readonly: true, hidden: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  perfil: {
    name: 'perfil',
    displayName: 'Perfil',
    description: 'Perfiles o roles de usuario',
    icon: '🎭',
    category: 'usuarios',
    primaryKey: 'perfilid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'nivel',
    fields: [
      { name: 'perfilid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'perfil', label: 'Perfil', type: 'text', required: true },
      { name: 'nivel', label: 'Nivel', type: 'number', required: true },
      { name: 'jefeid', label: 'Jefe', type: 'select', foreignKey: { table: 'perfil', valueField: 'perfilid', labelField: 'perfil' } },
      { name: 'is_admin_global', label: 'ES ADMIN GLOBAL?', type: 'boolean', defaultValue: false },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  usuarioperfil: {
    name: 'usuarioperfil',
    displayName: 'Perfil de Usuario',
    description: 'Asignación de perfiles a usuarios',
    icon: '🔐',
    category: 'usuarios',
    primaryKey: ['usuarioid', 'perfilid'],
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      { name: 'usuarioid', label: 'Usuario', type: 'select', required: true, foreignKey: { table: 'usuario', valueField: 'usuarioid', labelField: ['firstname', 'lastname'] } },
      { name: 'perfilid', label: 'Perfil', type: 'select', required: true, foreignKey: { table: 'perfil', valueField: 'perfilid', labelField: 'perfil' } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  codigotelefono: {
    name: 'codigotelefono',
    displayName: 'Código Telefónico',
    description: 'Códigos de país para teléfonos',
    icon: '📞',
    category: 'usuarios',
    primaryKey: 'codigotelefonoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    sortField: 'paistelefono',
    fields: [
      { name: 'codigotelefonoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'codigotelefono', label: 'Código', type: 'text', required: true },
      { name: 'paistelefono', label: 'País', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  contacto: {
    name: 'contacto',
    displayName: 'Contacto (Teléfono)',
    description: 'Números de teléfono de usuarios',
    icon: '📱',
    category: 'usuarios',
    primaryKey: 'contactoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      { name: 'contactoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'usuarioid', label: 'Usuario', type: 'select', required: true, foreignKey: { table: 'usuario', valueField: 'usuarioid', labelField: ['firstname', 'lastname'] } },
      { name: 'codigotelefonoid', label: 'Código País', type: 'select', required: true, foreignKey: { table: 'codigotelefono', valueField: 'codigotelefonoid', labelField: ['paistelefono'] } },
      { name: 'celular', label: 'Celular', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  correo: {
    name: 'correo',
    displayName: 'Correo',
    description: 'Correos electrónicos de usuarios',
    icon: '📧',
    category: 'usuarios',
    primaryKey: 'correoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      { name: 'correoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'usuarioid', label: 'Usuario', type: 'select', required: true, foreignKey: { table: 'usuario', valueField: 'usuarioid', labelField: ['firstname', 'lastname'] } },
      { name: 'correo', label: 'Correo', type: 'email', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  canal: {
    name: 'canal',
    displayName: 'Canal',
    description: 'Canales de comunicación (WhatsApp, Email, SMS, etc.)',
    icon: '📡',
    category: 'sistema',
    primaryKey: 'canalid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    sortField: 'canal',
    fields: [
      { name: 'canalid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'canal', label: 'Canal', type: 'text', required: true, validation: { minLength: 1, maxLength: 50 } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  usuario_canal: {
    name: 'usuario_canal',
    displayName: 'Usuario Canal',
    description: 'Relación entre usuarios y canales de comunicación',
    icon: '🔗',
    category: 'usuarios',
    primaryKey: 'usuario_canalid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      { name: 'usuario_canalid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'usuarioid', label: 'Usuario', type: 'select', required: true, foreignKey: { table: 'usuario', valueField: 'usuarioid', labelField: ['firstname', 'lastname'] } },
      { name: 'canalid', label: 'Canal', type: 'select', required: true, foreignKey: { table: 'canal', valueField: 'canalid', labelField: 'canal' } },
      { name: 'identificador', label: 'Identificador', type: 'text', required: true, validation: { minLength: 1, maxLength: 254 } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  permiso: {
    name: 'permiso',
    displayName: 'Permisos',
    description: 'Sistema de permisos unificado (GEOGRAFÍA y TABLA)',
    icon: '🔒',
    category: 'usuarios',
    primaryKey: 'permisoid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    fields: [
      { name: 'permisoid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'perfilid', label: 'Perfil', type: 'select', required: true, foreignKey: { table: 'perfil', valueField: 'perfilid', labelField: 'perfil' } },
      { name: 'origenid', label: 'Origen', type: 'select', required: true, foreignKey: { table: 'origen', valueField: 'origenid', labelField: 'origen' } },
      { name: 'fuenteid', label: 'Fuente', type: 'select', required: true, foreignKey: { table: 'fuente', valueField: 'fuenteid', labelField: 'fuente' } },
      { name: 'objetoid', label: 'Objeto ID', type: 'number', required: false },
      { name: 'puede_ver', label: 'Puede Ver', type: 'boolean', defaultValue: false },
      { name: 'puede_insertar', label: 'Puede Insertar', type: 'boolean', defaultValue: false },
      { name: 'puede_actualizar', label: 'Puede Actualizar', type: 'boolean', defaultValue: false },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  fuente: {
    name: 'fuente',
    displayName: 'Fuentes',
    description: 'Fuentes de permisos (tablas o niveles geográficos)',
    icon: '📋',
    category: 'sistema',
    primaryKey: 'fuenteid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    fields: [
      { name: 'fuenteid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'esquema', label: 'Esquema', type: 'text', required: true, defaultValue: 'joysense' },
      { name: 'fuente', label: 'Fuente', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  origen: {
    name: 'origen',
    displayName: 'Orígenes',
    description: 'Tipos de origen de permisos (GEOGRAFÍA o TABLA)',
    icon: '🎯',
    category: 'sistema',
    primaryKey: 'origenid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    fields: [
      { name: 'origenid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'origen', label: 'Origen', type: 'text', required: true },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  tipo_mensaje: {
    name: 'tipo_mensaje',
    displayName: 'Tipo Mensaje',
    description: 'Tipos de mensajes de notificación',
    icon: '✉️',
    category: 'sistema',
    primaryKey: 'tipo_mensajeid',
    allowInsert: true,
    allowUpdate: true,
    allowDelete: false,
    fields: [
      { name: 'tipo_mensajeid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'tipo_mensaje', label: 'Tipo Mensaje', type: 'text', required: true, validation: { minLength: 1, maxLength: 50 } },
      { name: 'statusid', label: 'Estado', type: 'number', defaultValue: 1, hidden: false }
    ]
  },

  // --------------------------------------------------------------------------
  // REPORTES ADMINISTRADOR (solo lectura)
  // --------------------------------------------------------------------------
  msg_outbox: {
    name: 'msg_outbox',
    displayName: 'Mensajes Outbox',
    description: 'Cola de mensajes pendientes de envío',
    icon: '📤',
    category: 'sistema',
    primaryKey: 'msg_outboxid',
    allowInsert: false,
    allowUpdate: false,
    allowDelete: false,
    fields: [
      { name: 'msg_outboxid', label: 'ID', type: 'number', hidden: true, readonly: true },
      { name: 'mensaje_bolsaid', label: 'Mensaje Bolsa ID', type: 'number', readonly: true },
      { name: 'usuarioid', label: 'Usuario', type: 'number', readonly: true },
      { name: 'canalid', label: 'Canal', type: 'number', readonly: true },
      { name: 'destino', label: 'Destino', type: 'text', readonly: true },
      { name: 'estado', label: 'Estado', type: 'text', readonly: true },
      { name: 'attempts', label: 'Intentos', type: 'number', readonly: true },
      { name: 'next_try_at', label: 'Próximo Intento', type: 'datetime', readonly: true },
      { name: 'last_error', label: 'Último Error', type: 'text', readonly: true },
      { name: 'datecreated', label: 'Fecha Creación', type: 'datetime', readonly: true }
    ]
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtener configuración de una tabla
 */
export function getTableConfig(tableName: TableName | string): TableConfig | undefined {
  return TABLES_CONFIG[tableName as TableName];
}

/**
 * Obtener tablas por categoría
 */
export function getTablesByCategory(category: TableConfig['category']): TableConfig[] {
  return Object.values(TABLES_CONFIG).filter(t => t.category === category);
}

/**
 * Obtener todas las tablas editables
 */
export function getEditableTables(): TableConfig[] {
  return Object.values(TABLES_CONFIG).filter(t => t.allowInsert || t.allowUpdate);
}

/**
 * Obtener tablas con operaciones masivas
 */
export function getMassiveTables(): TableConfig[] {
  return Object.values(TABLES_CONFIG).filter(t => t.allowMassive);
}

/**
 * Obtener campos visibles de una tabla
 */
export function getVisibleFields(tableName: TableName | string): TableFieldConfig[] {
  const config = getTableConfig(tableName);
  if (!config) return [];
  return config.fields.filter(f => !f.hidden);
}

/**
 * Obtener campos editables de una tabla
 */
export function getEditableFields(tableName: TableName | string): TableFieldConfig[] {
  const config = getTableConfig(tableName);
  if (!config) return [];
  return config.fields.filter(f => !f.hidden && !f.readonly);
}

/**
 * Obtener campos requeridos de una tabla
 */
export function getRequiredFields(tableName: TableName | string): TableFieldConfig[] {
  const config = getTableConfig(tableName);
  if (!config) return [];
  return config.fields.filter(f => f.required);
}

/**
 * Verificar si una tabla tiene clave compuesta
 */
export function hasCompositeKey(tableName: TableName | string): boolean {
  const config = getTableConfig(tableName);
  return Array.isArray(config?.primaryKey);
}

/**
 * Obtener primary key de una tabla
 */
export function getPrimaryKey(tableName: TableName | string): string | string[] {
  const config = getTableConfig(tableName);
  return config?.primaryKey || PRIMARY_KEY_MAP[tableName as TableName] || 'id';
}

/**
 * Categorías disponibles con sus nombres y iconos
 */
export const TABLE_CATEGORIES = {
  geografia: { name: 'Geografía', icon: '🌍' },
  dispositivos: { name: 'Dispositivos', icon: '📡' },
  mediciones: { name: 'Mediciones', icon: '📊' },
  alertas: { name: 'Alertas', icon: '🔔' },
  usuarios: { name: 'Usuarios', icon: '👥' },
  sistema: { name: 'Sistema', icon: '⚙️' }
} as const;

/**
 * Obtener tablas de GEOGRAFÍA
 * Incluye: pais, empresa, fundo, ubicacion, entidad, entidad_localizacion
 * NOTA: localizacion y nodo son dispositivos, no geografía
 */
export function getGeografiaTables(): TableConfig[] {
  const geografiaTableNames: TableName[] = [
    'pais',
    'empresa',
    'fundo',
    'ubicacion',
    'entidad',
    'entidad_localizacion'
  ];
  return geografiaTableNames.map(name => TABLES_CONFIG[name]).filter(Boolean);
}

/**
 * Obtener tablas de PARÁMETROS
 * Incluye: origen, fuente, criticidad, tipo, umbral
 * NOTA: asociacion es dispositivo, no parámetro
 */
export function getParametrosTables(): TableConfig[] {
  const parametrosTableNames: TableName[] = [
    'origen',
    'fuente',
    'criticidad',
    'tipo',
    'umbral'
  ];
  return parametrosTableNames.map(name => TABLES_CONFIG[name]).filter(Boolean);
}

/**
 * Obtener tablas de PERMISOS
 * Incluye: permiso, usuario, perfil, usuarioperfil, contacto, correo
 */
export function getPermisosTables(): TableConfig[] {
  const permisosTableNames: TableName[] = [
    'permiso',
    'usuario',
    'perfil',
    'usuarioperfil',
    'contacto',
    'correo'
  ];
  return permisosTableNames.map(name => TABLES_CONFIG[name]).filter(Boolean);
}

/**
 * Obtener tablas de NOTIFICACIONES
 * Incluye: criticidad, umbral, regla
 * NOTA: regla_objeto ahora es una sub-tabla dentro de GESTIÓN DE REGLAS
 * NOTA: canal y usuario_canal ahora están en USUARIOS
 * NOTA: 'destino' no existe como tabla, se usa 'mensaje_destino' que está en REPORTES ADMINISTRADOR
 */
export function getNotificacionesTables(): TableConfig[] {
  const notificacionesTableNames: TableName[] = [
    'criticidad',
    'umbral',
    'regla'
  ];
  const tables = notificacionesTableNames.map(name => {
    const config = TABLES_CONFIG[name];
    if (!config) {
      console.warn(`[getNotificacionesTables] Tabla '${name}' no encontrada en TABLES_CONFIG`);
    }
    return config;
  }).filter(Boolean) as TableConfig[];
  
  
  return tables;
}

/**
 * Obtener tablas de DISPOSITIVOS
 */
export function getDispositivosTables(): TableConfig[] {
  const dispositivosTableNames: TableName[] = [
    'tipo',
    'metrica',
    'sensor',
    'metricasensor'
  ];
  return dispositivosTableNames.map(name => TABLES_CONFIG[name]).filter(Boolean);
}

/**
 * Obtener tablas de USUARIOS
 * Incluye: usuario, correo, codigotelefono, contacto, perfil, usuarioperfil, usuario_canal
 */
export function getUsuariosTables(): TableConfig[] {
  const usuariosTableNames: TableName[] = [
    'usuario',
    'correo',
    'codigotelefono',
    'contacto',
    'perfil',
    'usuarioperfil',
    'usuario_canal'
  ];
  return usuariosTableNames.map(name => TABLES_CONFIG[name]).filter(Boolean);
}

/**
 * Obtener tablas de PARAMETROS GEO
 * Incluye: pais, empresa, fundo, ubicacion, nodo, localizacion, asociacion
 */
export function getParametrosGeoTables(): TableConfig[] {
  const parametrosGeoTablesNames: TableName[] = [
    'pais',
    'empresa',
    'fundo',
    'ubicacion',
    'nodo',
    'localizacion',
    'asociacion'
  ];
  return parametrosGeoTablesNames.map(name => TABLES_CONFIG[name]).filter(Boolean);
}

/**
 * Obtener tablas de TABLA (resto de tablas)
 * Incluye: dispositivos (metrica, sensor, metricasensor, nodo, localizacion, asociacion)
 * Excluye: mediciones, alertas, permisos, usuarios, tipo_mensaje, codigotelefono (auxiliar)
 */
export function getTablaTables(): TableConfig[] {
  const geografiaTableNames: TableName[] = ['pais', 'empresa', 'fundo', 'ubicacion', 'entidad', 'entidad_localizacion'];
  const parametrosTableNames: TableName[] = ['origen', 'fuente', 'criticidad', 'tipo', 'umbral'];
  const permisosTableNames: TableName[] = ['permiso', 'usuario', 'perfil', 'usuarioperfil', 'contacto', 'correo'];
  
  // Tablas de mediciones a excluir
  const medicionesTableNames: TableName[] = ['medicion', 'sensor_valor', 'sensor_valor_error'];
  
  // Tablas de alertas a excluir
  const alertasTableNames: TableName[] = [
    'alerta_regla',
    'alerta_regla_consolidado',
    'regla',
    'regla_perfil',
    'regla_umbral',
    'regla_objeto'
  ];
  
  // Tablas de sistema a excluir
  const sistemaExcludedTableNames: TableName[] = ['tipo_mensaje', 'codigotelefono'];
  
  const excludedTables = [
    ...geografiaTableNames,
    ...parametrosTableNames,
    ...permisosTableNames,
    ...medicionesTableNames,
    ...alertasTableNames,
    ...sistemaExcludedTableNames
  ];
  
  return Object.values(TABLES_CONFIG).filter(
    table => !excludedTables.includes(table.name as TableName)
  );
}

