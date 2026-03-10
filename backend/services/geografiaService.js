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
 * Obtiene localizaciones con métricas y sensores relacionados.
 */
const _getLocalizacionesWithMetrics = async (supabase, { nodoid, ubicacionId }) => {
  logger.info(`[geografiaService] Obteniendo localizaciones con métricas (nodoid: ${nodoid || 'N/A'})`);
  
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
 * Obtiene localizaciones con sus relaciones.
 */
const getLocalizaciones = async (supabase, { nodoid, ubicacionId }) => {
  return await _getLocalizacionesWithMetrics(supabase, { nodoid, ubicacionId });
};

/**
 * Obtiene lista simple de localizaciones.
 */
const getLocalizacionesSimple = async (supabase) => {
  return await _getLocalizacionesWithMetrics(supabase, {});
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
 * Resuelve los nodoid que pertenecen al fundo/empresa/país indicado.
 */
const _resolveNodoidsByGeografia = async (supabase, { fundoId, empresaId, paisId }) => {
  const fid = fundoId != null && fundoId !== '' ? parseInt(fundoId, 10) : null;
  const eid = empresaId != null && empresaId !== '' ? parseInt(empresaId, 10) : null;
  const pid = paisId != null && paisId !== '' ? parseInt(paisId, 10) : null;
  logger.info(`[_resolveNodoidsByGeografia] fundoId=${fundoId} (parsed: ${fid}), empresaId=${empresaId} (parsed: ${eid}), paisId=${paisId} (parsed: ${pid})`);
  if (!Number.isFinite(fid) && !Number.isFinite(eid) && !Number.isFinite(pid)) {
    logger.info(`[_resolveNodoidsByGeografia] No hay filtro de geografía, retornando null`);
    return null;
  }

  let ubicacionIds = [];
  if (Number.isFinite(fid)) {
    logger.info(`[_resolveNodoidsByGeografia] Buscando ubicaciones para fundoId=${fid}`);
    const { data: u, error } = await supabase.schema(dbSchema).from('ubicacion').select('ubicacionid').eq('fundoid', fid);
    if (error) throw error;
    ubicacionIds = (u || []).map((x) => x.ubicacionid);
    logger.info(`[_resolveNodoidsByGeografia] Encontradas ${ubicacionIds.length} ubicaciones para fundoId=${fid}`);
  } else if (Number.isFinite(eid)) {
    const { data: fundos, error: fe } = await supabase.schema(dbSchema).from('fundo').select('fundoid').eq('empresaid', eid);
    if (fe) throw fe;
    const fundoids = (fundos || []).map((x) => x.fundoid);
    if (fundoids.length === 0) return [];
    const { data: u, error } = await supabase.schema(dbSchema).from('ubicacion').select('ubicacionid').in('fundoid', fundoids);
    if (error) throw error;
    ubicacionIds = (u || []).map((x) => x.ubicacionid);
  } else if (Number.isFinite(pid)) {
    const { data: empresas, error: pe } = await supabase.schema(dbSchema).from('empresa').select('empresaid').eq('paisid', pid);
    if (pe) throw pe;
    const empresaidList = (empresas || []).map((x) => x.empresaid);
    if (empresaidList.length === 0) return [];
    const { data: fundos, error: fe } = await supabase.schema(dbSchema).from('fundo').select('fundoid').in('empresaid', empresaidList);
    if (fe) throw fe;
    const fundoids = (fundos || []).map((x) => x.fundoid);
    if (fundoids.length === 0) return [];
    const { data: u, error } = await supabase.schema(dbSchema).from('ubicacion').select('ubicacionid').in('fundoid', fundoids);
    if (error) throw error;
    ubicacionIds = (u || []).map((x) => x.ubicacionid);
  }

  if (ubicacionIds.length === 0) {
    logger.info(`[_resolveNodoidsByGeografia] No hay ubicaciones, retornando array vacío`);
    return [];
  }
  const { data: nodos, error } = await supabase.schema(dbSchema).from('nodo').select('nodoid').in('ubicacionid', ubicacionIds);
  if (error) throw error;
  const nodoidList = (nodos || []).map((n) => n.nodoid);
  logger.info(`[_resolveNodoidsByGeografia] Encontrados ${nodoidList.length} nodos para geografía: ${nodoidList.slice(0, 10).join(',')}`);
  return nodoidList;
};

/**
 * [METODO PRINCIPAL] Consulta NODO directamente en lugar de localizacion.
 * Esto garantiza que el limit se aplique sobre nodos (no localizaciones).
 * Si se envían fundoId/empresaId/paisId, primero se resuelven los nodoids y se filtra por ellos.
 */
const _getNodosConLocalizacionDashboardPrincipal = async (supabase, { limit, fundoId, empresaId, paisId }) => {
  logger.info(`[getNodosConLocalizacionDashboardPrincipal] Iniciando con limit=${limit}, fundoId=${fundoId}, empresaId=${empresaId}, paisId=${paisId}`);
  const nodoids = await _resolveNodoidsByGeografia(supabase, { fundoId, empresaId, paisId });
  const hasFilter = Array.isArray(nodoids);
  if (hasFilter && nodoids.length === 0) {
    logger.info(`[getNodosConLocalizacionDashboardPrincipal] Filtro geográfico sin resultados`);
    return [];
  }

  logger.info(`[getNodosConLocalizacionDashboardPrincipal] Consultando nodos (limit: ${limit}, filtro: ${hasFilter ? 'sí (' + nodoids?.length + ' nodos)' : 'no'})`);

  // Consultar nodos activos (aplica limit a nodos, no a localizaciones)
  let query = supabase
    .schema(dbSchema)
    .from('nodo')
    .select(`
      nodoid,
      nodo,
      latitud,
      longitud,
      referencia,
      ubicacionid,
      statusid,
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
    `)
    .eq('statusid', 1)
    .order('nodoid', { ascending: true })
    .limit(parseInt(limit, 10) || 1000);

  if (hasFilter) {
    query = query.in('nodoid', nodoids);
  }

  const { data: nodos, error: nodError } = await query;

  if (nodError) {
    logger.error(`[getNodosConLocalizacionDashboardPrincipal] Error en query de nodos:`, nodError);
    throw nodError;
  }
  logger.info(`[getNodosConLocalizacionDashboardPrincipal] Query devolvió ${(nodos || []).length} nodos (statusid=1)`);
   
  if (!nodos || nodos.length === 0) {
    logger.info(`[getNodosConLocalizacionDashboardPrincipal] Sin nodos, retornando []`);
    return [];
  }

  // Obtener todas las localizaciones para los nodos obtenidos
  const nodoidList = nodos.map(n => n.nodoid);
  logger.info(`[getNodosConLocalizacionDashboardPrincipal] Obteniendo localizaciones para ${nodoidList.length} nodos`);
  
  const { data: localizacionesData, error: locError } = await supabase
    .schema(dbSchema)
    .from('localizacion')
    .select('localizacionid, localizacion, metricaid, nodoid')
    .in('nodoid', nodoidList)
    .eq('statusid', 1);

  if (locError) {
    logger.error(`[getNodosConLocalizacionDashboardPrincipal] Error obteniendo localizaciones:`, locError);
    throw locError;
  }

  if (!localizacionesData || localizacionesData.length === 0) {
    logger.info(`[getNodosConLocalizacionDashboardPrincipal] Sin localizaciones, retornando []`);
    return [];
  }

  logger.info(`[getNodosConLocalizacionDashboardPrincipal] Obtenidas ${localizacionesData.length} localizaciones`);

  // Obtener entidades_localizacion
  const locIds = localizacionesData.map(l => l.localizacionid);
  let entidadesRes = { data: [] };
  if (locIds.length > 0) {
    entidadesRes = await supabase
      .schema(dbSchema)
      .from('entidad_localizacion')
      .select('localizacionid, entidad:entidadid(entidadid, entidad)')
      .eq('statusid', 1)
      .in('localizacionid', locIds);
  }

  if (entidadesRes.error) throw entidadesRes.error;

  // Construir mapas
  const localizacionesMap = new Map(localizacionesData.map(l => [l.localizacionid, l]));
  const entidadesMap = new Map((entidadesRes.data || []).map(e => [e.localizacionid, e.entidad ? (Array.isArray(e.entidad) ? e.entidad[0] : e.entidad) : null]));

  // Obtener métricas
  const metricaIds = [...new Set(localizacionesData.map(l => l.metricaid).filter(id => id != null))];
  let metricasMap = new Map();
  if (metricaIds.length > 0) {
    const metricasRes = await supabase.schema(dbSchema).from('metrica').select('metricaid, metrica, unidad').in('metricaid', metricaIds);
    if (metricasRes.error) throw metricasRes.error;
    metricasMap = new Map((metricasRes.data || []).map(m => [m.metricaid, m]));
  }

  // Filtrar localizaciones que pertenecen a nodos válidos
  const nodoidSet = new Set(nodoidList);
  const localizacionesValidas = localizacionesData.filter(loc => nodoidSet.has(loc.nodoid));

  // Formatear respuesta
  const nodosMap = new Map(nodos.map(n => [n.nodoid, n]));
  const resultado = [];
  const nodosSinLocalizaciones = new Set(nodoidList); // Trackear nodos que no tienen localizaciones
  
  localizacionesValidas.forEach(loc => {
    const nodoRaw = nodosMap.get(loc.nodoid);
    
    // Verificar que el nodo existe
    if (!nodoRaw) {
      logger.error(`[getNodosConLocalizacionDashboardPrincipal] Localización ${loc.localizacionid} con nodoid inválido: ${loc.nodoid}`);
      return;
    }
    
    // Marcar que este nodo tiene al menos una localización
    nodosSinLocalizaciones.delete(loc.nodoid);

    const ubicacionRaw = nodoRaw?.ubicacion ? (Array.isArray(nodoRaw.ubicacion) ? nodoRaw.ubicacion[0] : nodoRaw.ubicacion) : null;
    const fundoRaw = ubicacionRaw?.fundo ? (Array.isArray(ubicacionRaw.fundo) ? ubicacionRaw.fundo[0] : ubicacionRaw.fundo) : null;
    const empresaRaw = fundoRaw?.empresa ? (Array.isArray(fundoRaw.empresa) ? fundoRaw.empresa[0] : fundoRaw.empresa) : null;
    const paisRaw = empresaRaw?.pais ? (Array.isArray(empresaRaw.pais) ? empresaRaw.pais[0] : empresaRaw.pais) : null;

    // Estructurar datos del nodo
    const formattedNodo = {
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
      entidad: entidadesMap.get(loc.localizacionid) || null
    };

    // VALIDACIÓN FINAL: Solo agregar si formattedNodo es válido
    if (!formattedNodo || !formattedNodo.nodoid) {
      logger.error(`[getNodosConLocalizacionDashboardPrincipal] ERROR: formattedNodo inválido para localización ${loc.localizacionid}`);
      return;
    }

    resultado.push({
      localizacionid: loc.localizacionid,
      localizacion: loc.localizacion,
      latitud: nodoRaw?.latitud,
      longitud: nodoRaw?.longitud,
      referencia: nodoRaw?.referencia,
      nodo: formattedNodo, // SIEMPRE tiene objeto nodo válido
      metrica: loc.metricaid ? metricasMap.get(loc.metricaid) : null
    });
  });

  const localizacionesSinNodo = resultado.filter(r => !r.nodo || !r.nodo.nodoid);
  if (localizacionesSinNodo.length > 0) {
    logger.error(`[getNodosConLocalizacionDashboardPrincipal] ${localizacionesSinNodo.length} localizaciones sin nodo válido`);
  }
  
  logger.info(`[getNodosConLocalizacionDashboardPrincipal] Retornando ${resultado.length} localizaciones (de ${nodos.length} nodos)`);
  return resultado;
};

/**
 * Obtiene nodos con sus localizaciones para el dashboard.
 * Acepta filtros opcionales: fundoId, empresaId, paisId.
 */
const getNodosConLocalizacionDashboard = async (supabase, query = {}) => {
  const limit = query.limit != null ? parseInt(query.limit, 10) : 1000;
  const fundoId = query.fundoId ?? query.fundoid ?? null;
  const empresaId = query.empresaId ?? query.empresaid ?? null;
  const paisId = query.paisId ?? query.paisid ?? null;
  const params = {
    limit: Number.isFinite(limit) ? limit : 1000,
    fundoId: fundoId != null ? String(fundoId) : null,
    empresaId: empresaId != null ? String(empresaId) : null,
    paisId: paisId != null ? String(paisId) : null
  };

  try {
    logger.info(`[getNodosConLocalizacionDashboard] Ejecutando método principal`);
    return await _getNodosConLocalizacionDashboardPrincipal(supabase, params);
  } catch (error) {
    logger.warn(`[getNodosConLocalizacionDashboard] Método principal falló: ${error.message}. Usando fallback...`);
    try {
      return await _getNodosConLocalizacionDashboardFallback(supabase, params);
    } catch (fallbackError) {
      logger.error(`[getNodosConLocalizacionDashboard] Fallback también falló: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
};

/**
 * Fallback: Consulta básica de nodos con localizaciones (sin paginación).
 */
const _getNodosConLocalizacionDashboardFallback = async (supabase, { limit, fundoId, empresaId, paisId }) => {
  logger.info(`[getNodosConLocalizacionDashboardFallback] Ejecutando fallback simple (limit=${limit})`);
  const nodoids = await _resolveNodoidsByGeografia(supabase, { fundoId, empresaId, paisId });
  const hasFilter = Array.isArray(nodoids);

  let query = supabase
    .schema(dbSchema)
    .from('nodo')
    .select(`
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
        fundo:fundoid(fundoid, fundo, empresaid, empresa:empresaid(empresaid, empresa, paisid, pais:paisid(paisid, pais)))
      )
    `)
    .eq('statusid', 1)
    .order('nodoid', { ascending: true })
    .limit(parseInt(limit, 10) || 1000);

  if (hasFilter && nodoids.length > 0) {
    query = query.in('nodoid', nodoids);
  }

  const { data: nodos, error: nodError } = await query;
  if (nodError) throw nodError;
  if (!nodos || nodos.length === 0) return [];

  const nodoidList = nodos.map(n => n.nodoid);
  const { data: localizaciones, error: locError } = await supabase
    .schema(dbSchema)
    .from('localizacion')
    .select('localizacionid, localizacion, nodoid, metricaid')
    .in('nodoid', nodoidList)
    .eq('statusid', 1);

  if (locError) throw locError;

  const nodosMap = new Map(nodos.map(n => [n.nodoid, n]));
  const resultado = (localizaciones || []).map(loc => {
    const nodoRaw = nodosMap.get(loc.nodoid);
    return {
      localizacionid: loc.localizacionid,
      localizacion: loc.localizacion,
      nodoid: loc.nodoid,
      latitud: nodoRaw?.latitud,
      longitud: nodoRaw?.longitud,
      referencia: nodoRaw?.referencia,
      nodo: nodoRaw,
      metricaid: loc.metricaid
    };
  });

  logger.info(`[getNodosConLocalizacionDashboardFallback] Retornando ${resultado.length} localizaciones (de ${nodos.length} nodos)`);
  return resultado;
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
    .eq('statusid', 1)
    .limit(5000);
  
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
  })
  // Deduplicar por nombre de localización (queda solo el primero encontrado)
  .filter((loc, index, self) => 
    index === self.findIndex((t) => t.localizacion === loc.localizacion)
  );
};

/**
 * Obtiene todas las localizaciones con el mismo nombre, incluyendo sensor, tipo y métrica
 * Útil para mostrar en el grid de asociación cuando se selecciona una localización
 * Sin usar FK relationships (ya que no existen en la BD)
 */
const getLocalizacionesByName = async (supabase, nombre) => {
  if (!nombre) return [];
  
  try {
    logger.info(`[getLocalizacionesByName] Buscando localizaciones con nombre: "${nombre}"`);
    
    const { data: localizaciones, error: locError } = await supabase
      .schema(dbSchema)
      .from('localizacion')
      .select('localizacionid, localizacion, sensorid, metricaid')
      .eq('localizacion', nombre)
      .eq('statusid', 1)
      .order('localizacionid', { ascending: true });
    
    if (locError) {
      logger.error(`[getLocalizacionesByName] Error obteniendo localizaciones:`, locError);
      throw locError;
    }
    
    if (!localizaciones || localizaciones.length === 0) {
      logger.info(`[getLocalizacionesByName] No se encontraron localizaciones con nombre: "${nombre}"`);
      return [];
    }
    
    logger.info(`[getLocalizacionesByName] Encontradas ${localizaciones.length} localizaciones`);
    
    const sensorIds = [...new Set(localizaciones.map(l => l.sensorid).filter(id => id != null))];
    const metricaIds = [...new Set(localizaciones.map(l => l.metricaid).filter(id => id != null))];
    
    logger.info(`[getLocalizacionesByName] Obteniendo datos de ${sensorIds.length} sensores y ${metricaIds.length} métricas`);
    
    let sensoresMap = new Map();
    let metricasMap = new Map();
    
    if (sensorIds.length > 0) {
      const { data: sensores, error: sensoresError } = await supabase
        .schema(dbSchema)
        .from('sensor')
        .select('sensorid, sensor, tipoid')
        .in('sensorid', sensorIds)
        .eq('statusid', 1);
      
      if (sensoresError) {
        logger.error(`[getLocalizacionesByName] Error obteniendo sensores:`, sensoresError);
        throw sensoresError;
      }
      
      const tipoIds = [...new Set((sensores || []).map(s => s.tipoid).filter(id => id != null))];
      let tiposMap = new Map();
      
      if (tipoIds.length > 0) {
        const { data: tipos, error: tiposError } = await supabase
          .schema(dbSchema)
          .from('tipo')
          .select('tipoid, tipo')
          .in('tipoid', tipoIds)
          .eq('statusid', 1);
        
        if (tiposError) {
          logger.error(`[getLocalizacionesByName] Error obteniendo tipos:`, tiposError);
          throw tiposError;
        }
        
        (tipos || []).forEach(t => tiposMap.set(t.tipoid, t));
      }
      
      (sensores || []).forEach(s => {
        const tipo = tiposMap.get(s.tipoid);
        sensoresMap.set(s.sensorid, {
          sensorid: s.sensorid,
          sensor: s.sensor,
          tipoid: s.tipoid,
          tipoNombre: tipo?.tipo || null
        });
      });
    }
    
    if (metricaIds.length > 0) {
      const { data: metricas, error: metricasError } = await supabase
        .schema(dbSchema)
        .from('metrica')
        .select('metricaid, metrica, unidad')
        .in('metricaid', metricaIds)
        .eq('statusid', 1);
      
      if (metricasError) {
        logger.error(`[getLocalizacionesByName] Error obteniendo métricas:`, metricasError);
        throw metricasError;
      }
      
      (metricas || []).forEach(m => metricasMap.set(m.metricaid, m));
    }
    
    const resultado = localizaciones.map(loc => {
      const sensorData = sensoresMap.get(loc.sensorid);
      const metricaData = metricasMap.get(loc.metricaid);
      
      return {
        localizacionid: loc.localizacionid,
        localizacion: loc.localizacion,
        sensorid: loc.sensorid,
        sensorNombre: sensorData?.sensor || null,
        tipoid: sensorData?.tipoid || null,
        tipoNombre: sensorData?.tipoNombre || null,
        metricaid: loc.metricaid,
        metricaNombre: metricaData?.metrica || null,
        metricaUnidad: metricaData?.unidad || null
      };
    });
    
    logger.info(`[getLocalizacionesByName] Retornando ${resultado.length} localizaciones con datos completos`);
    return resultado;
  } catch (error) {
    logger.error(`[getLocalizacionesByName] Error en getLocalizacionesByName:`, error);
    throw error;
  }
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
  searchLocations,
  getLocalizacionesByName
};
