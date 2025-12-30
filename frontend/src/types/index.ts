/**
 * Tipos para el schema "joysense"
 * Actualizado para el nuevo modelo de datos
 */

// ============================================================================
// GEOGRAFÍA
// ============================================================================

export interface Pais {
  paisid: number;
  pais: string;
  paisabrev: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

export interface Empresa {
  empresaid: number;
  paisid: number;
  empresa: string;
  empresabrev: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  pais?: Pais;
}

export interface Fundo {
  fundoid: number;
  empresaid: number;
  fundo: string;
  fundoabrev: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  empresa?: Empresa;
  // Calculado
  medicionesCount?: number;
}

export interface Ubicacion {
  ubicacionid: number;
  fundoid: number;
  ubicacion: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  fundo?: Fundo;
}

export interface Entidad {
  entidadid: number;
  entidad: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

export interface EntidadLocalizacion {
  entidadid: number;
  localizacionid: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  entidad?: Entidad;
  localizacion?: Localizacion;
}

// ============================================================================
// DISPOSITIVOS
// ============================================================================

export interface Tipo {
  tipoid: number;
  tipo: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

export interface Metrica {
  metricaid: number;
  metrica: string;
  unidad: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

/**
 * Sensor - NUEVO MODELO
 * PK simple: sensorid
 * Relación con tipo vía tipoid
 */
export interface Sensor {
  sensorid: number;
  tipoid: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  tipo?: Tipo;
}

/**
 * MetricaSensor - NUEVO MODELO
 * PK compuesta: (sensorid, metricaid)
 */
export interface MetricaSensor {
  sensorid: number;
  metricaid: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  sensor?: Sensor;
  metrica?: Metrica;
}

/**
 * Nodo - NUEVO MODELO
 * Ahora tiene ubicacionid directamente
 */
export interface Nodo {
  nodoid: number;
  ubicacionid: number;
  nodo: string;
  descripcion?: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  ubicacion?: Ubicacion;
}

/**
 * Localizacion - NUEVO MODELO (CRÍTICO)
 * Punto central que conecta: nodo + sensor + métrica + coordenadas
 */
export interface Localizacion {
  localizacionid: number;
  nodoid: number;
  sensorid: number;
  metricaid: number;
  localizacion: string;
  latitud?: number;
  longitud?: number;
  referencia?: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  nodo?: Nodo;
  sensor?: Sensor;
  metrica?: Metrica;
}

/**
 * Asociacion - NUEVA TABLA
 * Mapea id_device (LoRaWAN) con localizacionid
 */
export interface Asociacion {
  asociacionid: number;
  localizacionid: number;
  id_device: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  localizacion?: Localizacion;
}

// ============================================================================
// MEDICIONES
// ============================================================================

/**
 * Medicion - SIMPLIFICADO
 * Solo referencia localizacionid (toda la info está en localizacion)
 */
export interface Medicion {
  medicionid: number;
  localizacionid: number;
  fecha: string;
  medicion: number;
  usercreatedid: number;
  datecreated: string;
  // Relación
  localizacion?: Localizacion;
}

/**
 * SensorValor - NUEVA TABLA
 * Staging table para datos entrantes de LoRaWAN
 */
export interface SensorValor {
  id_device: string;
  fecha: string;
  valor: number;
  statusid: number;
}

/**
 * SensorValorError - NUEVA TABLA
 * Log de errores de procesamiento
 */
export interface SensorValorError {
  sensorvalorerrorid: number;
  id_device: string;
  error: string;
  valor: number;
  fecha: string;
  statusid: number;
}

// ============================================================================
// ALERTAS
// ============================================================================

export interface Criticidad {
  criticidadid: number;
  criticidad: string;
  escalamiento: number;
  escalon: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

/**
 * Umbral - Configuración de umbrales por localización
 * NOTA: La tabla SÍ tiene criticidadid (verificado en BD real)
 */
export interface Umbral {
  umbralid: number;
  localizacionid: number;
  criticidadid: number;
  umbral: string;
  minimo: number;
  maximo: number;
  estandar?: number;
  operador: string;
  inversion: boolean;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  localizacion?: Localizacion;
  criticidad?: Criticidad;
}

/**
 * Alerta - NUEVO MODELO
 * PK es UUID ahora
 */
export interface Alerta {
  uuid_alertaid: string;
  medicionid: number;
  umbralid: number;
  fecha: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  // Relaciones
  medicion?: Medicion;
  umbral?: Umbral;
}

/**
 * AlertaConsolidado - NUEVO MODELO
 * PK es UUID ahora
 */
export interface AlertaConsolidado {
  uuid_consolidadoid: string;
  umbralid: number;
  fechainicio: string;
  fechaultimo: string;
  fechaultimacorrida?: string;
  ultimamedicion: number;
  contador: number;
  nivelnotificado?: number;
  ultimoenvio?: string;
  ultimoescalamiento?: string;
  nivelescalamiento?: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  umbral?: Umbral;
}

/**
 * Mensaje - NUEVO MODELO
 * PK compuesta: (uuid_origen, contactoid)
 */
export interface Mensaje {
  uuid_origen: string;
  contactoid: number;
  tipo_origen: 'ALERTA_FRECUENCIA' | 'ALERTA_ESCALAMIENTO' | string;
  mensaje: string;
  fecha: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  // Relación
  contacto?: Contacto;
}

// perfilumbral ya no existe - reemplazado por regla_perfil y regla_umbral

export interface Regla {
  reglaid: number;
  nombre: string;
  prioridad: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

export interface ReglaPerfil {
  regla_perfilid: number;
  reglaid: number;
  perfilid: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  regla?: Regla;
  perfil?: Perfil;
}

export interface ReglaUmbral {
  regla_umbralid: number;
  reglaid: number;
  umbralid: number;
  operador_logico: string;
  agrupador_inicio: boolean;
  agrupador_fin: boolean;
  orden: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  regla?: Regla;
  umbral?: Umbral;
}

export interface AuditLogUmbral {
  auditid: number;
  umbralid: number;
  old_minimo?: number;
  new_minimo?: number;
  old_maximo?: number;
  new_maximo?: number;
  old_criticidadid?: number;
  new_criticidadid?: number;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  modified_by: number;
  modified_at: string;
  // Relación
  umbral?: Umbral;
}

// ============================================================================
// USUARIOS
// ============================================================================

/**
 * Usuario - NUEVO MODELO
 * Incluye password_hash y useruuid
 */
export interface Usuario {
  usuarioid: number;
  usuariouuid?: string;
  login: string;
  lastname: string;
  firstname: string;
  // password_hash no se expone al frontend
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  useruuid?: string;
}

/**
 * Perfil - NUEVO MODELO
 * Incluye jefeid para jerarquía
 */
export interface Perfil {
  perfilid: number;
  perfil: string;
  nivel: number;
  jefeid?: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  jefe?: Perfil;
}

export interface UsuarioPerfil {
  usuarioid: number;
  perfilid: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  usuario?: Usuario;
  perfil?: Perfil;
}

/**
 * CodigoTelefono - NUEVA TABLA
 * Códigos de país para teléfonos
 */
export interface CodigoTelefono {
  codigotelefonoid: number;
  codigotelefono: string;
  paistelefono: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

/**
 * Contacto - SIMPLIFICADO
 * Solo para teléfonos ahora
 */
export interface Contacto {
  contactoid: number;
  usuarioid: number;
  codigotelefonoid: number;
  celular: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relaciones
  usuario?: Usuario;
  codigotelefono?: CodigoTelefono;
}

/**
 * Correo - NUEVA TABLA
 * Emails separados de contacto
 */
export interface Correo {
  correoid: number;
  usuarioid: number;
  correo: string;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
  // Relación
  usuario?: Usuario;
}

/**
 * Permiso - Sistema de permisos unificado
 * origenid: 1 = GEOGRAFÍA, 2 = TABLA
 */
export interface Permiso {
  permisoid: number;
  perfilid: number;
  origenid: number; // 1 = GEOGRAFÍA, 2 = TABLA
  fuenteid: number;
  objetoid?: number; // NULL = global, valor = puntual
  puede_ver: boolean;
  puede_insertar: boolean;
  puede_actualizar: boolean;
  puede_eliminar: boolean;
  statusid: number;
  usercreatedid: number;
  usermodifiedid: number;
  datecreated: string;
  datemodified: string;
  // Relaciones
  perfil?: Perfil;
  origen?: Origen;
  fuente?: Fuente;
}

/**
 * Fuente - Objeto lógico (tabla o nivel geográfico)
 */
export interface Fuente {
  fuenteid: number;
  esquema: string;
  fuente: string; // Nombre de tabla o nivel geográfico
  statusid: number;
  usercreatedid: number;
  usermodifiedid: number;
  datecreated: string;
  datemodified: string;
}

/**
 * Origen - Tipo de permiso
 * origenid: 1 = GEOGRAFÍA, 2 = TABLA
 */
export interface Origen {
  origenid: number;
  origen: string;
  statusid: number;
  usercreatedid: number;
  usermodifiedid: number;
  datecreated: string;
  datemodified: string;
}

// ============================================================================
// INTERFACES DE APLICACIÓN
// ============================================================================

// Estado de filtros
export interface FilterState {
  paisId?: number;
  empresaId?: number;
  fundoId?: number;
  ubicacionId?: number;
  localizacionId?: number;
  startDate?: string;
  endDate?: string;
}

// Datos de gráficos
export interface ChartData {
  time: string;
  [key: string]: any;
}

// Estadísticas del dashboard
export interface DashboardStats {
  totalMediciones: number;
  promedioMedicion: number;
  ultimaMedicion: string;
  sensoresActivos: number;
}

// Respuesta de API
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

export interface UserMetadata {
  full_name?: string;
  rol?: string;
  usuarioid?: number;
  auth_user_id?: string;
  login?: string;
  firstname?: string;
  lastname?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

export interface AuthError {
  message: string;
}

// ============================================================================
// UTILIDADES DE TIPOS
// ============================================================================

// Campos de auditoría comunes
export interface AuditFields {
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid: number;
  datemodified: string;
}

// Base para todas las entidades
export interface BaseEntity extends AuditFields {
  [key: string]: any;
}

// Tipos de tablas disponibles
export type TableName = 
  | 'pais' | 'empresa' | 'fundo' | 'ubicacion' | 'entidad' | 'entidad_localizacion'
  | 'tipo' | 'metrica' | 'sensor' | 'metricasensor' | 'nodo' | 'localizacion' | 'asociacion'
  | 'medicion' | 'sensor_valor' | 'sensor_valor_error'
  | 'criticidad' | 'umbral' | 'alerta' | 'alerta_regla' | 'alerta_regla_consolidado' | 'mensaje' | 'audit_log_umbral'
  | 'regla' | 'regla_objeto' | 'regla_perfil' | 'regla_umbral'
  | 'usuario' | 'perfil' | 'usuarioperfil' | 'contacto' | 'correo' | 'codigotelefono'
  | 'permiso' | 'fuente' | 'origen' | 'tipo_mensaje'; // Nuevo sistema de permisos

// Mapeo de PK por tabla
export const PRIMARY_KEY_MAP: Record<TableName, string | string[]> = {
  pais: 'paisid',
  empresa: 'empresaid',
  fundo: 'fundoid',
  ubicacion: 'ubicacionid',
  entidad: 'entidadid',
  entidad_localizacion: ['entidadid', 'localizacionid'],
  tipo: 'tipoid',
  metrica: 'metricaid',
  sensor: 'sensorid',
  metricasensor: ['sensorid', 'metricaid'],
  nodo: 'nodoid',
  localizacion: 'localizacionid',
  asociacion: 'asociacionid',
  medicion: 'medicionid',
  sensor_valor: ['id_device', 'fecha'],
  sensor_valor_error: 'sensorvalorerrorid',
  criticidad: 'criticidadid',
  umbral: 'umbralid',
  alerta: 'alertaid',
  alerta_regla: 'uuid_alerta_reglaid',
  alerta_regla_consolidado: 'uuid_consolidadoid',
  mensaje: ['uuid_origen', 'contactoid', 'tipo_mensajeid'],
  audit_log_umbral: 'auditid',
  regla: 'reglaid',
  regla_objeto: 'regla_objetoid',
  regla_perfil: 'regla_perfilid',
  regla_umbral: 'regla_umbralid',
  usuario: 'usuarioid',
  perfil: 'perfilid',
  usuarioperfil: ['usuarioid', 'perfilid'],
  contacto: 'contactoid',
  correo: 'correoid',
  codigotelefono: 'codigotelefonoid',
  permiso: 'permisoid', // Nuevo sistema de permisos
  fuente: 'fuenteid',
  origen: 'origenid',
  tipo_mensaje: 'tipo_mensajeid'
};
