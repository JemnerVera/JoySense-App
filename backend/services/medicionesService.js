/**
 * Servicio para el módulo de Mediciones
 */
const { dbSchema } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Obtiene el conteo de mediciones con filtros
 */
exports.getMedicionesCount = async (supabase, { localizacionId, startDate, endDate }) => {
  let countQuery = supabase
    .schema(dbSchema)
    .from('medicion')
    .select('*', { count: 'exact', head: true });
  
  if (localizacionId) {
    countQuery = countQuery.eq('localizacionid', localizacionId);
  }
  if (startDate) {
    countQuery = countQuery.gte('fecha', startDate);
  }
  if (endDate) {
    countQuery = countQuery.lte('fecha', endDate);
  }
  
  const { count, error } = await countQuery;
  if (error) throw error;
  return count || 0;
};

/**
 * [METODO FALLBACK] Carga métricas y sensores manualmente para evitar errores de PGRST200.
 */
const _loadMedicionesDetailsFallback = async (supabase, data) => {
  if (!data || data.length === 0) return [];

  // Obtener IDs únicos para carga manual
  const metricaIds = [...new Set(data.map(m => m.localizacion?.metricaid).filter(id => id != null))];
  const sensorIds = [...new Set(data.map(m => m.localizacion?.sensorid).filter(id => id != null))];

  let metricasMap = new Map();
  if (metricaIds.length > 0) {
    const { data: metricas } = await supabase
      .schema(dbSchema)
      .from('metrica')
      .select('metricaid, metrica, unidad')
      .in('metricaid', metricaIds)
      .eq('statusid', 1);
    (metricas || []).forEach(m => metricasMap.set(m.metricaid, m));
  }

  let sensoresMap = new Map();
  if (sensorIds.length > 0) {
    const { data: sensores } = await supabase
      .schema(dbSchema)
      .from('sensor')
      .select('sensorid, tipoid')
      .in('sensorid', sensorIds)
      .eq('statusid', 1);
    (sensores || []).forEach(s => sensoresMap.set(s.sensorid, s));
  }

  return data.map(m => {
    const loc = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null;
    if (!loc) return { ...m, localizacion: null };

    return {
      ...m,
      localizacion: {
        ...loc,
        metrica: loc.metricaid ? metricasMap.get(loc.metricaid) : null,
        sensor: loc.sensorid ? sensoresMap.get(loc.sensorid) : null
      }
    };
  });
};

/**
 * Obtiene mediciones con filtros y carga datos relacionados.
 * Utiliza carga manual de detalles (Fallback) por defecto para máxima compatibilidad.
 */
exports.getMediciones = async (supabase, { localizacionId, startDate, endDate, limit = 1000, getAll = false }) => {
  let query = supabase
    .schema(dbSchema)
    .from('medicion')
    .select(`
      *,
      localizacion:localizacionid(
        localizacionid,
        localizacion,
        nodoid,
        metricaid,
        sensorid,
        nodo:nodoid(
          nodoid, 
          nodo, 
          ubicacionid,
          latitud,
          longitud,
          referencia
        )
      )
    `);

  if (localizacionId) {
    const ids = String(localizacionId).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length > 1) {
      query = query.in('localizacionid', ids);
    } else if (ids.length === 1) {
      query = query.eq('localizacionid', ids[0]);
    }
  }

  if (startDate) query = query.gte('fecha', startDate);
  if (endDate) query = query.lte('fecha', endDate);

  query = query.order('fecha', { ascending: false });

  const finalLimit = getAll ? 50000 : parseInt(limit);
  const CHUNK_SIZE = 1000;
  let allData = [];
  let currentOffset = 0;

  while (allData.length < finalLimit) {
    const remainingLimit = finalLimit - allData.length;
    const nextLimit = Math.min(CHUNK_SIZE, remainingLimit);
    const { data: chunk, error: chunkError } = await query.range(currentOffset, currentOffset + nextLimit - 1);

    if (chunkError) {
      logger.error(`[medicionesService] Error fetching chunk at offset ${currentOffset}:`, chunkError);
      throw chunkError;
    }

    if (!chunk || chunk.length === 0) break;
    allData = allData.concat(chunk);
    if (chunk.length < nextLimit) break;
    currentOffset += nextLimit;
    if (currentOffset >= 50000) break;
  }

  return await _loadMedicionesDetailsFallback(supabase, allData);
};

/**
 * Obtiene mediciones optimizadas para el dashboard.
 * Intenta usar RPC optimizado, si falla usa el Fallback manual.
 */
exports.getMedicionesDashboard = async (supabase, { nodoid, startDate, endDate, limit = 1000, getAll = false }) => {
  // [METODO RPC]
  try {
    const { data, error } = await supabase
      .schema('joysense')
      .rpc('fn_get_mediciones_dashboard', {
        p_nodoid: parseInt(nodoid),
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: getAll ? 50000 : parseInt(limit)
      });

    if (!error) return data || [];

    if (error.code === 'P0001' || error.code === 'PGRST202' || error.message?.includes('does not exist')) {
      logger.warn(`[medicionesService] RPC fn_get_mediciones_dashboard no disponible. Usando fallback.`);
    } else {
      throw error;
    }
  } catch (error) {
    logger.error('Error en getMedicionesDashboard (RPC), intentando fallback:', error);
  }

  // [METODO FALLBACK]
  return await this.getMedicionesWithDetails(supabase, { nodoid, startDate, endDate, limit, getAll });
};

/**
 * Obtiene mediciones con carga manual de métricas y sensores (Fallback manual).
 * Resuelve nodoid -> localizaciones si es necesario.
 */
exports.getMedicionesWithDetails = async (supabase, { localizacionId, nodoid, startDate, endDate, limit = 1000, getAll = false }) => {
  let finalLocalizacionIds = localizacionId;

  // Si no hay localizacionId pero sí nodoid, buscamos las localizaciones del nodo
  if (!finalLocalizacionIds && nodoid) {
    const { data: locs, error: locsError } = await supabase
      .schema(dbSchema)
      .from('localizacion')
      .select('localizacionid')
      .eq('nodoid', nodoid)
      .eq('statusid', 1);
    
    if (!locsError && locs) {
      finalLocalizacionIds = locs.map(l => l.localizacionid).join(',');
    }
  }

  if (nodoid && !finalLocalizacionIds) return [];

  let query = supabase
    .schema(dbSchema)
    .from('medicion')
    .select(`
      *,
      localizacion:localizacionid(
        localizacionid,
        localizacion,
        nodoid,
        metricaid,
        sensorid,
        nodo:nodoid(
          nodoid, 
          nodo,
          latitud,
          longitud,
          referencia
        )
      )
    `);

  if (finalLocalizacionIds) {
    const ids = String(finalLocalizacionIds).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length > 1) {
      query = query.in('localizacionid', ids);
    } else if (ids.length === 1) {
      query = query.eq('localizacionid', ids[0]);
    }
  }

  if (startDate) query = query.gte('fecha', startDate);
  if (endDate) query = query.lte('fecha', endDate);

  query = query.order('fecha', { ascending: false });

  const finalLimit = getAll ? 50000 : parseInt(limit);
  const CHUNK_SIZE = 1000;
  let allData = [];
  let currentOffset = 0;

  while (allData.length < finalLimit) {
    const remainingLimit = finalLimit - allData.length;
    const nextLimit = Math.min(CHUNK_SIZE, remainingLimit);
    const { data: chunk, error: chunkError } = await query.range(currentOffset, currentOffset + nextLimit - 1);

    if (chunkError) {
      logger.error(`[medicionesService] Error fetching chunk at offset ${currentOffset}:`, chunkError);
      throw chunkError;
    }

    if (!chunk || chunk.length === 0) break;
    allData = allData.concat(chunk);
    if (chunk.length < nextLimit) break;
    currentOffset += nextLimit;
    if (currentOffset >= 50000) break;
  }

  return await _loadMedicionesDetailsFallback(supabase, allData);
};

/**
 * Obtiene mediciones asociadas a una entidad
 */
exports.getMedicionesConEntidad = async (supabase, { entidadId, startDate, endDate, limit = 1000 }) => {
  const { data: entidadLocalizaciones, error: elError } = await supabase
    .schema(dbSchema)
    .from('entidad_localizacion')
    .select('localizacionid')
    .eq('entidadid', entidadId)
    .eq('statusid', 1);
  
  if (elError) throw elError;
  
  const locIds = (entidadLocalizaciones || []).map(el => el.localizacionid);
  if (locIds.length === 0) return [];
  
  let query = supabase
    .schema(dbSchema)
    .from('medicion')
    .select(`
      *,
      localizacion:localizacionid(
        localizacionid,
        localizacion,
        nodoid,
        metricaid,
        sensorid,
        nodo:nodoid(
          nodoid, 
          nodo,
          latitud,
          longitud,
          referencia
        )
      )
    `)
    .in('localizacionid', locIds);
  
  if (startDate) query = query.gte('fecha', startDate);
  if (endDate) query = query.lte('fecha', endDate);
  
  query = query.order('fecha', { ascending: false });

  const finalLimit = parseInt(limit);
  const CHUNK_SIZE = 1000;
  let allData = [];
  let currentOffset = 0;

  while (allData.length < finalLimit) {
    const remainingLimit = finalLimit - allData.length;
    const nextLimit = Math.min(CHUNK_SIZE, remainingLimit);
    const { data: chunk, error: chunkError } = await query.range(currentOffset, currentOffset + nextLimit - 1);

    if (chunkError) {
      logger.error(`[medicionesService] Error fetching chunk for entidad at offset ${currentOffset}:`, chunkError);
      throw chunkError;
    }

    if (!chunk || chunk.length === 0) break;
    allData = allData.concat(chunk);
    if (chunk.length < nextLimit) break;
    currentOffset += nextLimit;
    if (currentOffset > 50000) break; 
  }

  return await _loadMedicionesDetailsFallback(supabase, allData);
};

/**
 * Obtiene datos de sensor_valor
 */
exports.getSensorValor = async (supabase, { id_device, limit = 100 }) => {
  let query = supabase
    .schema(dbSchema)
    .from('sensor_valor')
    .select('*');
  
  if (id_device) query = query.eq('id_device', id_device);
  
  const { data, error } = await query.order('fecha', { ascending: false }).limit(parseInt(limit));
  if (error) throw error;
  return data || [];
};

/**
 * Crea un registro en sensor_valor
 */
exports.createSensorValor = async (supabase, sensorValorData) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('sensor_valor')
    .insert(sensorValorData)
    .select();
  
  if (error) throw error;
  return data;
};

/**
 * Obtiene errores de sensor_valor
 */
exports.getSensorValorError = async (supabase, { limit = 100 }) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('sensor_valor_error')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(parseInt(limit));
  
  if (error) throw error;
  return data || [];
};

/**
 * Obtiene las últimas mediciones por lote para un dashboard.
 * Utiliza carga manual de detalles (Fallback) para máxima compatibilidad.
 */
exports.getUltimasMedicionesPorLote = async (supabase, { fundoIds, metricaId, startDate, endDate }) => {
  const fundoIdArray = String(fundoIds).split(',').map(Number);
  
  const { data: ubicaciones, error: ubicError } = await supabase
    .schema(dbSchema)
    .from('ubicacion')
    .select('ubicacionid')
    .in('fundoid', fundoIdArray)
    .eq('statusid', 1);
  
  if (ubicError) throw ubicError;
  if (!ubicaciones || ubicaciones.length === 0) return [];
  
  const ubicacionIds = ubicaciones.map(u => u.ubicacionid);
  const { data: nodos, error: nodoError } = await supabase
    .schema(dbSchema)
    .from('nodo')
    .select('nodoid')
    .in('ubicacionid', ubicacionIds)
    .eq('statusid', 1);
  
  if (nodoError) throw nodoError;
  if (!nodos || nodos.length === 0) return [];
  
  const nodoIds = nodos.map(n => n.nodoid);
  let locQuery = supabase
    .schema(dbSchema)
    .from('localizacion')
    .select('localizacionid')
    .in('nodoid', nodoIds)
    .eq('statusid', 1);
  
  if (metricaId) locQuery = locQuery.eq('metricaid', metricaId);
  const { data: localizaciones, error: locError } = await locQuery;
  
  if (locError) throw locError;
  if (!localizaciones || localizaciones.length === 0) return [];
  
  const localizacionIds = localizaciones.map(l => l.localizacionid);
  let medicionQuery = supabase
    .schema(dbSchema)
    .from('medicion')
    .select(`
      *,
      localizacion:localizacionid(
        localizacionid,
        localizacion,
        nodoid,
        metricaid,
        sensorid,
        nodo:nodoid(
          nodoid, 
          nodo, 
          ubicacionid,
          latitud,
          longitud,
          referencia
        )
      )
    `)
    .in('localizacionid', localizacionIds);
  
  if (startDate) medicionQuery = medicionQuery.gte('fecha', startDate);
  if (endDate) medicionQuery = medicionQuery.lte('fecha', endDate);
  
  const { data: mediciones, error: medicionError } = await medicionQuery.order('fecha', { ascending: false }).limit(1000);
  if (medicionError) throw medicionError;
  
  return await _loadMedicionesDetailsFallback(supabase, mediciones);
};
