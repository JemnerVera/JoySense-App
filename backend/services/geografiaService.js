const { dbSchema } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const logger = require('../utils/logger');

/**
 * PAIS
 */
const getPaises = async (supabase, queryParams) => {
  return await paginateAndFilter('pais', { ...queryParams, sortBy: 'paisid' }, supabase);
};

const getPaisColumns = async (supabase) => {
  const metadata = await getTableMetadata('pais', supabase);
  return metadata.columns;
};

const createPais = async (supabase, paisData) => {
  const { data, error } = await supabase.schema(dbSchema).from('pais').insert(paisData).select();
  if (error) throw error;
  return data;
};

const updatePais = async (supabase, id, paisData) => {
  const { data, error } = await supabase.schema(dbSchema).from('pais').update(paisData).eq('paisid', id).select();
  if (error) throw error;
  return data;
};

/**
 * EMPRESA
 */
const getEmpresas = async (supabase, paisId) => {
  let query = supabase
    .schema(dbSchema)
    .from('empresa')
    .select('*, pais:paisid(paisid, pais, paisabrev)');
  
  if (paisId) {
    query = query.eq('paisid', paisId);
  }
  
  query = query.order('empresaid', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    logger.error(`❌ [geografiaService.getEmpresas] Error: ${error.message}`);
    throw error;
  }
  
  return (data || []).map(emp => ({
    ...emp,
    pais: emp.pais ? (Array.isArray(emp.pais) ? emp.pais[0] : emp.pais) : null
  }));
};

const getEmpresaColumns = async (supabase) => {
  const metadata = await getTableMetadata('empresa', supabase);
  return metadata.columns;
};

const createEmpresa = async (supabase, empresaData) => {
  const { data, error } = await supabase.schema(dbSchema).from('empresa').insert(empresaData).select();
  if (error) throw error;
  return data;
};

const updateEmpresa = async (supabase, id, empresaData) => {
  const { data, error } = await supabase.schema(dbSchema).from('empresa').update(empresaData).eq('empresaid', id).select();
  if (error) throw error;
  return data;
};

/**
 * FUNDO
 */
const getFundos = async (supabase, empresaId) => {
  let query = supabase
    .schema(dbSchema)
    .from('fundo')
    .select('*');
  
  if (empresaId) {
    query = query.eq('empresaid', empresaId);
  }
  
  query = query.order('fundoid', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    logger.error(`❌ [geografiaService.getFundos] Error: ${error.message}`);
    throw error;
  }
  
  return (data || []).map(fundo => ({
    ...fundo,
    empresa: null
  }));
};

const getFundoColumns = async (supabase) => {
  const metadata = await getTableMetadata('fundo', supabase);
  return metadata.columns;
};

const createFundo = async (supabase, fundoData) => {
  const { data, error } = await supabase.schema(dbSchema).from('fundo').insert(fundoData).select();
  if (error) throw error;
  return data;
};

const updateFundo = async (supabase, id, fundoData) => {
  const { data, error } = await supabase.schema(dbSchema).from('fundo').update(fundoData).eq('fundoid', id).select();
  if (error) throw error;
  return data;
};

/**
 * UBICACION
 */
const getUbicaciones = async (supabase, fundoId) => {
  let query = supabase
    .schema(dbSchema)
    .from('ubicacion')
    .select('*');
  
  if (fundoId) {
    query = query.eq('fundoid', fundoId);
  }
  
  query = query.order('ubicacionid', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    logger.error(`❌ [geografiaService.getUbicaciones] Error: ${error.message}`);
    throw error;
  }
  
  return (data || []).map(ubic => ({
    ...ubic,
    fundo: null
  }));
};

const getUbicacionColumns = async (supabase) => {
  const metadata = await getTableMetadata('ubicacion', supabase);
  return metadata.columns;
};

const createUbicacion = async (supabase, ubicacionData) => {
  const { data, error } = await supabase.schema(dbSchema).from('ubicacion').insert(ubicacionData).select();
  if (error) throw error;
  return data;
};

const updateUbicacion = async (supabase, id, ubicacionData) => {
  const { data, error } = await supabase.schema(dbSchema).from('ubicacion').update(ubicacionData).eq('ubicacionid', id).select();
  if (error) throw error;
  return data;
};

/**
 * ENTIDAD
 */
const getEntidades = async (supabase, queryParams) => {
  return await paginateAndFilter('entidad', { ...queryParams, sortBy: 'entidadid' }, supabase);
};

const getEntidadColumns = async (supabase) => {
  const metadata = await getTableMetadata('entidad', supabase);
  return metadata.columns;
};

const createEntidad = async (supabase, entidadData) => {
  const { data, error } = await supabase.schema(dbSchema).from('entidad').insert(entidadData).select();
  if (error) throw error;
  return data;
};

const updateEntidad = async (supabase, id, entidadData) => {
  const { data, error } = await supabase.schema(dbSchema).from('entidad').update(entidadData).eq('entidadid', id).select();
  if (error) throw error;
  return data;
};

/**
 * ENTIDAD_LOCALIZACION
 */
const getEntidadLocalizaciones = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('entidad_localizacion')
    .select('*, entidad:entidadid(entidadid, entidad), localizacion:localizacionid(localizacionid, localizacion)')
    .order('entidadid', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(el => ({
    ...el,
    entidad: el.entidad ? (Array.isArray(el.entidad) ? el.entidad[0] : el.entidad) : null,
    localizacion: el.localizacion ? (Array.isArray(el.localizacion) ? el.localizacion[0] : el.localizacion) : null
  }));
};

const createEntidadLocalizacion = async (supabase, elData) => {
  const { data, error } = await supabase.schema(dbSchema).from('entidad_localizacion').insert(elData).select();
  if (error) throw error;
  return data;
};

// ============================================================================
// NODO
// ============================================================================

/**
 * Obtener nodos con sus relaciones
 */
const getNodos = async (supabase, { ubicacionId }) => {
  let query = supabase
    .schema(dbSchema)
    .from('nodo')
    .select(`
      *,
      ubicacion:ubicacionid(
        ubicacionid,
        ubicacion,
        fundoid,
        fundo:fundoid(fundoid, fundo, empresaid)
      )
    `);

  if (ubicacionId) {
    query = query.eq('ubicacionid', ubicacionId);
  }

  query = query.order('nodoid', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(n => ({
    ...n,
    ubicacion: n.ubicacion ? (Array.isArray(n.ubicacion) ? n.ubicacion[0] : n.ubicacion) : null
  }));
};

/**
 * Obtener lista simple de nodos (para compatibilidad)
 */
const getNodosSimple = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('nodo')
    .select('*')
    .order('nodoid', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Crear un nuevo nodo
 */
const createNodo = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('nodo')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Actualizar un nodo
 */
const updateNodo = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('nodo')
    .update(data)
    .eq('nodoid', id)
    .select();

  if (error) throw error;
  return result;
};

// ============================================================================
// LOCALIZACION
// ============================================================================

/**
 * [METODO FALLBACK] Reconstruye localizaciones cargando métricas y sensores manualmente.
 * Evita errores PGRST200 (relaciones no encontradas).
 */
const _getLocalizacionesFallback = async (supabase, { nodoid, ubicacionId }) => {
  logger.info(`[geografiaService] Ejecutando Fallback para getLocalizaciones (nodoid: ${nodoid || 'N/A'})`);
  
  let query = supabase
    .schema(dbSchema)
    .from('localizacion')
    .select(`
      *,
      nodo:nodoid(
        nodoid,
        nodo,
        latitud,
        longitud,
        referencia,
        ubicacionid,
        ubicacion:ubicacionid(
          ubicacionid,
          ubicacion,
          fundoid,
          fundo:fundoid(fundoid, fundo)
        )
      )
    `);

  if (nodoid) {
    query = query.eq('nodoid', nodoid);
  } else if (ubicacionId) {
    const { data: nodos, error: nodosError } = await supabase
      .schema(dbSchema)
      .from('nodo')
      .select('nodoid')
      .eq('ubicacionid', ubicacionId);
    
    if (nodosError) throw nodosError;
    
    const nodoIds = (nodos || []).map(n => n.nodoid);
    if (nodoIds.length > 0) {
      query = query.in('nodoid', nodoIds);
    } else {
      return [];
    }
  }

  const { data, error } = await query.order('localizacionid', { ascending: true });
  if (error) throw error;

  const metricaIds = [...new Set((data || []).map(l => l.metricaid).filter(id => id != null))];
  const sensorIds = [...new Set((data || []).map(l => l.sensorid).filter(id => id != null))];

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

  return (data || []).map(l => {
    const nodo = l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null;
    return {
      ...l,
      nodo,
      metrica: l.metricaid ? metricasMap.get(l.metricaid) : null,
      sensor: l.sensorid ? sensoresMap.get(l.sensorid) : null
    };
  });
};

/**
 * Obtener localizaciones con sus relaciones.
 * Intenta usar RPC optimizado, si falla usa el Fallback manual.
 */
const getLocalizaciones = async (supabase, { nodoid, ubicacionId }) => {
  // [METODO RPC]
  if (nodoid) {
    try {
      const { data, error } = await supabase
        .schema('joysense')
        .rpc('fn_get_localizaciones_detalle', { p_nodoid: parseInt(nodoid) });

      if (!error) return data || [];
      
      if (error.code !== 'P0001' && error.code !== 'PGRST202' && !error.message?.includes('does not exist')) {
        logger.error('Error en RPC fn_get_localizaciones_detalle:', error);
      } else {
        logger.warn(`[geografiaService] RPC fn_get_localizaciones_detalle no disponible. Usando fallback.`);
      }
    } catch (err) {
      logger.error('Excepción en RPC fn_get_localizaciones_detalle, usando fallback:', err);
    }
  }

  // [METODO FALLBACK]
  return await _getLocalizacionesFallback(supabase, { nodoid, ubicacionId });
};

/**
 * Obtener lista simple de localizaciones.
 */
const getLocalizacionesSimple = async (supabase) => {
  return await _getLocalizacionesFallback(supabase, {});
};

/**
 * Crear una nueva localización
 */
const createLocalizacion = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('localizacion')
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Actualizar una localización
 */
const updateLocalizacion = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('localizacion')
    .update(data)
    .eq('localizacionid', id)
    .select();

  if (error) throw error;
  return result;
};

/**
 * [METODO FALLBACK] Reconstruye manualmente la estructura compleja esperada por el dashboard.
 */
const _getNodosConLocalizacionDashboardFallback = async (supabase, { limit }) => {
  logger.info(`[geografiaService] Ejecutando Fallback para getNodosConLocalizacionDashboard (limit: ${limit})`);
  
  // 1. Obtener localizaciones con jerarquía geográfica completa (joins seguros)
  const { data: localizaciones, error: locError } = await supabase
    .schema(dbSchema)
    .from('localizacion')
    .select(`
      localizacionid,
      localizacion,
      metricaid,
      nodoid,
      nodo:nodoid(
        nodoid,
        nodo,
        latitud,
        longitud,
        referencia,
        ubicacionid,
        ubicacion:ubicacionid(
          ubicacionid,
          ubicacion,
          fundoid,
          fundo:fundoid(
            fundoid, 
            fundo, 
            fundoabrev, 
            empresaid,
            empresa:empresaid(
              empresaid, 
              empresa, 
              empresabrev, 
              paisid,
              pais:paisid(paisid, pais, paisabrev)
            )
          )
        )
      )
    `)
    .eq('statusid', 1)
    .order('localizacionid', { ascending: true })
    .limit(limit);

  if (locError) throw locError;

  // 2. Obtener métricas y entidades por separado
  const metricaIds = [...new Set(localizaciones.map(l => l.metricaid).filter(id => id != null))];
  const locIds = localizaciones.map(l => l.localizacionid);

  const [metricasRes, entidadesRes] = await Promise.all([
    metricaIds.length > 0 ? supabase.schema(dbSchema).from('metrica').select('metricaid, metrica, unidad').in('metricaid', metricaIds) : { data: [] },
    locIds.length > 0 ? supabase.schema(dbSchema).from('entidad_localizacion').select('localizacionid, entidad:entidadid(entidadid, entidad)').eq('statusid', 1).in('localizacionid', locIds) : { data: [] }
  ]);

  const metricasMap = new Map((metricasRes.data || []).map(m => [m.metricaid, m]));
  const entidadesMap = new Map((entidadesRes.data || []).map(e => [e.localizacionid, e.entidad ? (Array.isArray(e.entidad) ? e.entidad[0] : e.entidad) : null]));

  // 3. Formatear al estilo esperado por el frontend (idéntico al RPC)
  return localizaciones.map(l => {
    const nodoRaw = l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null;
    const ubicacionRaw = nodoRaw?.ubicacion ? (Array.isArray(nodoRaw.ubicacion) ? nodoRaw.ubicacion[0] : nodoRaw.ubicacion) : null;
    const fundoRaw = ubicacionRaw?.fundo ? (Array.isArray(ubicacionRaw.fundo) ? ubicacionRaw.fundo[0] : ubicacionRaw.fundo) : null;
    const empresaRaw = fundoRaw?.empresa ? (Array.isArray(fundoRaw.empresa) ? fundoRaw.empresa[0] : fundoRaw.empresa) : null;
    const paisRaw = empresaRaw?.pais ? (Array.isArray(empresaRaw.pais) ? empresaRaw.pais[0] : empresaRaw.pais) : null;

    const formattedNodo = nodoRaw ? {
      ...nodoRaw,
      ubicacion: ubicacionRaw ? {
        ...ubicacionRaw,
        fundo: fundoRaw ? {
          ...fundoRaw,
          empresa: empresaRaw ? {
            ...empresaRaw,
            pais: paisRaw
          } : null
        } : null
      } : null,
      entidad: entidadesMap.get(l.localizacionid) || null
    } : null;

    return {
      localizacionid: l.localizacionid,
      localizacion: l.localizacion,
      latitud: nodoRaw?.latitud,
      longitud: nodoRaw?.longitud,
      referencia: nodoRaw?.referencia,
      nodo: formattedNodo,
      metrica: l.metricaid ? metricasMap.get(l.metricaid) : null
    };
  });
};

/**
 * Obtener nodos con localización para el dashboard.
 * Intenta usar RPC optimizado, si falla usa el Fallback manual.
 */
const getNodosConLocalizacionDashboard = async (supabase, { limit = 1000 }) => {
  // [METODO RPC]
  try {
    const { data, error } = await supabase
      .schema('joysense')
      .rpc('fn_get_nodos_con_localizacion_dashboard', { p_limit: parseInt(limit) });

    if (!error) return data || [];

    if (error.code !== 'P0001' && error.code !== 'PGRST202' && !error.message?.includes('does not exist')) {
      logger.error('Error en RPC fn_get_nodos_con_localizacion_dashboard:', error);
    } else {
      logger.warn(`[geografiaService] RPC fn_get_nodos_con_localizacion_dashboard no disponible. Usando fallback.`);
    }
  } catch (error) {
    logger.error('Excepción en RPC getNodosConLocalizacionDashboard, usando fallback:', error);
  }

  // [METODO FALLBACK]
  return await _getNodosConLocalizacionDashboardFallback(supabase, { limit: parseInt(limit) });
};

/**
 * Búsqueda global de localizaciones
 */
const searchLocations = async (supabase, query) => {
  if (!query || query.length < 2) return [];
  
  const { data: localizaciones, error: locError } = await supabase
    .schema(dbSchema)
    .from('localizacion')
    .select(`
      localizacionid,
      localizacion,
      nodo:nodoid(
        nodoid,
        nodo,
        ubicacionid,
        ubicacion:ubicacionid(
          ubicacionid,
          ubicacion,
          fundoid,
          fundo:fundoid(
            fundoid,
            fundo,
            empresaid,
            empresa:empresaid(
              empresaid,
              empresa,
              paisid,
              pais:paisid(paisid, pais)
            )
          )
        )
      )
    `)
    .limit(1000);
  
  if (locError) throw locError;
  
  const searchLower = query.toLowerCase();
  
  return (localizaciones || []).filter(loc => {
    const nodo = loc.nodo ? (Array.isArray(loc.nodo) ? loc.nodo[0] : loc.nodo) : null;
    const ubicacion = nodo?.ubicacion ? (Array.isArray(nodo.ubicacion) ? nodo.ubicacion[0] : nodo.ubicacion) : null;
    const fundo = ubicacion?.fundo ? (Array.isArray(ubicacion.fundo) ? ubicacion.fundo[0] : ubicacion.fundo) : null;
    const empresa = fundo?.empresa ? (Array.isArray(fundo.empresa) ? fundo.empresa[0] : fundo.empresa) : null;
    const pais = empresa?.pais ? (Array.isArray(empresa.pais) ? empresa.pais[0] : empresa.pais) : null;
    
    return (
      (loc.localizacion?.toLowerCase().includes(searchLower)) ||
      (nodo?.nodo?.toLowerCase().includes(searchLower)) ||
      (ubicacion?.ubicacion?.toLowerCase().includes(searchLower)) ||
      (fundo?.fundo?.toLowerCase().includes(searchLower)) ||
      (empresa?.empresa?.toLowerCase().includes(searchLower)) ||
      (pais?.pais?.toLowerCase().includes(searchLower))
    );
  }).map(loc => {
    const nodo = loc.nodo ? (Array.isArray(loc.nodo) ? loc.nodo[0] : loc.nodo) : null;
    const ubicacion = nodo?.ubicacion ? (Array.isArray(nodo.ubicacion) ? nodo.ubicacion[0] : nodo.ubicacion) : null;
    const fundo = ubicacion?.fundo ? (Array.isArray(ubicacion.fundo) ? ubicacion.fundo[0] : ubicacion.fundo) : null;
    const empresa = fundo?.empresa ? (Array.isArray(fundo.empresa) ? fundo.empresa[0] : fundo.empresa) : null;
    const pais = empresa?.pais ? (Array.isArray(empresa.pais) ? empresa.pais[0] : empresa.pais) : null;
    
    const breadcrumb = [
      pais?.pais,
      empresa?.empresa,
      fundo?.fundo,
      ubicacion?.ubicacion,
      loc.localizacion
    ].filter(Boolean).join(' → ');
    
    return {
      localizacionid: loc.localizacionid,
      localizacion: loc.localizacion,
      breadcrumb: breadcrumb
    };
  });
};

module.exports = {
  getPaises,
  getPaisColumns,
  createPais,
  updatePais,
  getEmpresas,
  getEmpresaColumns,
  createEmpresa,
  updateEmpresa,
  getFundos,
  getFundoColumns,
  createFundo,
  updateFundo,
  getUbicaciones,
  getUbicacionColumns,
  createUbicacion,
  updateUbicacion,
  getEntidades,
  getEntidadColumns,
  createEntidad,
  updateEntidad,
  getEntidadLocalizaciones,
  createEntidadLocalizacion,
  getNodos,
  getNodosSimple,
  createNodo,
  updateNodo,
  getLocalizaciones,
  getLocalizacionesSimple,
  createLocalizacion,
  updateLocalizacion,
  getNodosConLocalizacionDashboard,
  searchLocations
};
