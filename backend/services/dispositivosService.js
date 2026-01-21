/**
 * Servicio de Dispositivos: sensor, metrica, tipo, metricasensor, asociacion
 * Maneja la lógica de negocio y el acceso a datos vía Supabase
 */

const { dbSchema } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const logger = require('../utils/logger');

/**
 * Obtener metadatos de columnas de una tabla
 */
const getColumns = async (tableName, supabase) => {
  const metadata = await getTableMetadata(tableName, supabase);
  return metadata.columns;
};

// ============================================================================
// SENSOR
// ============================================================================

/**
 * Obtener sensores con sus relaciones
 */
const getSensores = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('sensor')
    .select('*, tipo:tipoid(tipoid, tipo)')
    .order('sensorid', { ascending: true });

  if (error) throw error;

  return (data || []).map(s => ({
    ...s,
    tipo: s.tipo ? (Array.isArray(s.tipo) ? s.tipo[0] : s.tipo) : null
  }));
};

/**
 * Crear un nuevo sensor
 */
const createSensor = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('sensor')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Actualizar un sensor
 */
const updateSensor = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('sensor')
    .update(data)
    .eq('sensorid', id)
    .select();

  if (error) throw error;
  return result;
};

// ============================================================================
// TIPO
// ============================================================================

/**
 * Obtener tipos con paginación y filtros
 */
const getTipos = async (supabase, queryParams) => {
  return await paginateAndFilter('tipo', { ...queryParams, sortBy: 'tipoid' }, supabase);
};

/**
 * Obtener lista simple de tipos
 */
const getTiposSimple = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('tipo')
    .select('*')
    .order('tipoid', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Crear un nuevo tipo
 */
const createTipo = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('tipo')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Actualizar un tipo
 */
const updateTipo = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('tipo')
    .update(data)
    .eq('tipoid', id)
    .select();

  if (error) throw error;
  return result;
};

// ============================================================================
// METRICA
// ============================================================================

/**
 * Obtener métricas con paginación y filtros
 */
const getMetricas = async (supabase, queryParams) => {
  return await paginateAndFilter('metrica', { ...queryParams, sortBy: 'metricaid' }, supabase);
};

/**
 * Obtener lista simple de métricas
 */
const getMetricasSimple = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('metrica')
    .select('*')
    .order('metricaid', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Crear una nueva métrica
 */
const createMetrica = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('metrica')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Actualizar una métrica
 */
const updateMetrica = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('metrica')
    .update(data)
    .eq('metricaid', id)
    .select();

  if (error) throw error;
  return result;
};

// ============================================================================
// METRICASENSOR
// ============================================================================

/**
 * Obtener metricasensor con sus relaciones
 */
const getMetricaSensores = async (supabase, { sensorId }) => {
  let query = supabase
    .schema(dbSchema)
    .from('metricasensor')
    .select(`
      *,
      sensor:sensorid(sensorid, tipoid),
      metrica:metricaid(metricaid, metrica, unidad)
    `);

  if (sensorId) {
    query = query.eq('sensorid', sensorId);
  }

  query = query.order('sensorid', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(ms => ({
    ...ms,
    sensor: ms.sensor ? (Array.isArray(ms.sensor) ? ms.sensor[0] : ms.sensor) : null,
    metrica: ms.metrica ? (Array.isArray(ms.metrica) ? ms.metrica[0] : ms.metrica) : null
  }));
};

/**
 * Crear un nuevo metricasensor
 */
const createMetricaSensor = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('metricasensor')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Actualizar un metricasensor (compuesto)
 */
const updateMetricaSensorComposite = async (supabase, sensorid, metricaid, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('metricasensor')
    .update(data)
    .eq('sensorid', sensorid)
    .eq('metricaid', metricaid)
    .select();

  if (error) throw error;
  return result;
};

// ============================================================================
// ASOCIACION
// ============================================================================

/**
 * Obtener asociaciones con sus relaciones
 */
const getAsociaciones = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('asociacion')
    .select('*, localizacion:localizacionid(localizacionid, localizacion)')
    .order('asociacionid', { ascending: true });

  if (error) throw error;

  return (data || []).map(a => ({
    ...a,
    localizacion: a.localizacion ? (Array.isArray(a.localizacion) ? a.localizacion[0] : a.localizacion) : null
  }));
};

/**
 * Crear una nueva asociación
 */
const createAsociacion = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('asociacion')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Actualizar una asociación
 */
const updateAsociacion = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('asociacion')
    .update(data)
    .eq('asociacionid', id)
    .select();

  if (error) throw error;
  return result;
};

module.exports = {
  getColumns,
  getSensores,
  createSensor,
  updateSensor,
  getTipos,
  getTiposSimple,
  createTipo,
  updateTipo,
  getMetricas,
  getMetricasSimple,
  createMetrica,
  updateMetrica,
  getMetricaSensores,
  createMetricaSensor,
  updateMetricaSensorComposite,
  getAsociaciones,
  createAsociacion,
  updateAsociacion
};
