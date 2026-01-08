/**
 * Rutas de Alertas: umbral, alerta, alerta_regla_consolidado, criticidad, mensaje
 * Nota: perfilumbral fue eliminado - usar regla, regla_perfil, regla_umbral
 * Versión Supabase API con RLS
 */

const express = require('express');
const router = express.Router();
const { dbSchema, supabase: baseSupabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// CRITICIDAD
// ============================================================================

router.get('/criticidad', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('criticidad')
      .select('*')
      .order('grado', { ascending: true });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /criticidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/criticidad/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('criticidad');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /criticidad/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/criticidad', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('criticidad')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /criticidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/criticidad/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('criticidad')
      .update(req.body)
      .eq('criticidadid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /criticidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// UMBRAL
// ============================================================================

router.get('/umbral', async (req, res) => {
  try {
    const { localizacionId } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados profundos
    let query = userSupabase
      .schema(dbSchema)
      .from('umbral')
      .select(`
        *,
        criticidad:criticidadid(criticidadid, criticidad, grado),
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          nodo:nodoid(nodoid, nodo),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `);
    
    if (localizacionId) {
      query = query.eq('localizacionid', localizacionId);
    }
    
    query = query.order('umbralid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(u => ({
      ...u,
      criticidad: u.criticidad ? (Array.isArray(u.criticidad) ? u.criticidad[0] : u.criticidad) : null,
      localizacion: u.localizacion ? (Array.isArray(u.localizacion) ? u.localizacion[0] : u.localizacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/umbral/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('umbral');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /umbral/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/umbral', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('umbral')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/umbral/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('umbral')
      .update(req.body)
      .eq('umbralid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

// Umbrales por lote
router.get('/umbrales-por-lote', async (req, res) => {
  try {
    const { fundoIds, metricaId } = req.query;
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Iniciando', {
      fundoIds,
      metricaId,
      tieneToken: !!req.supabase
    });
    
    if (!fundoIds) {
      return res.status(400).json({ error: 'fundoIds es requerido' });
    }
    
    const fundoIdArray = fundoIds.split(',').map(Number);
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Convertir CTEs a múltiples queries con Supabase API
    // Paso 1: Obtener ubicaciones
    const { data: ubicaciones, error: ubicError } = await userSupabase
      .schema(dbSchema)
      .from('ubicacion')
      .select('ubicacionid')
      .in('fundoid', fundoIdArray)
      .eq('statusid', 1);
    
    if (ubicError) throw ubicError;
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 1 - Ubicaciones', {
      ubicacionesCount: ubicaciones?.length || 0,
      fundoIdArray,
      ubicacionIds: ubicaciones?.map(u => u.ubicacionid) || []
    });
    
    if (!ubicaciones || ubicaciones.length === 0) {
      logger.info('[DEBUG] GET /umbrales-por-lote: No hay ubicaciones, retornando []');
      return res.json([]);
    }
    
    const ubicacionIds = ubicaciones.map(u => u.ubicacionid);
    
    // Paso 2: Obtener nodos
    const { data: nodos, error: nodoError } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .select('nodoid')
      .in('ubicacionid', ubicacionIds)
      .eq('statusid', 1);
    
    if (nodoError) throw nodoError;
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 2 - Nodos', {
      nodosCount: nodos?.length || 0,
      ubicacionIds,
      nodoIds: nodos?.map(n => n.nodoid) || []
    });
    
    if (!nodos || nodos.length === 0) {
      logger.info('[DEBUG] GET /umbrales-por-lote: No hay nodos, retornando []');
      return res.json([]);
    }
    
    const nodoIds = nodos.map(n => n.nodoid);
    
    // Paso 3: Obtener localizaciones (necesitamos nodoid, metricaid, sensorid para mapear después)
    let locQuery = userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select('localizacionid, nodoid, metricaid, sensorid')
      .in('nodoid', nodoIds)
      .eq('statusid', 1);
    
    if (metricaId) {
      locQuery = locQuery.eq('metricaid', metricaId);
    }
    
    const { data: localizaciones, error: locError } = await locQuery;
    
    if (locError) throw locError;
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 3 - Localizaciones', {
      localizacionesCount: localizaciones?.length || 0,
      nodoIds,
      metricaId,
      localizacionIds: localizaciones?.map(l => l.localizacionid) || [],
      sampleLocalizacion: localizaciones?.[0]
    });
    
    if (!localizaciones || localizaciones.length === 0) {
      logger.info('[DEBUG] GET /umbrales-por-lote: No hay localizaciones, retornando []');
      return res.json([]);
    }
    
    const localizacionIds = localizaciones.map(l => l.localizacionid);
    
    // Paso 4: Obtener reglas que aplican a estas localizaciones
    // NOTA: En el schema actual, umbral NO tiene localizacionid directamente
    // La relación es: umbral → regla_umbral → regla → regla_objeto → localizaciones
    // O también: umbral → regla_umbral → regla → alerta_regla → localizaciones
    
    // Primero, obtener todas las reglas activas que tienen umbrales
    const { data: reglasConUmbrales, error: reglasError } = await userSupabase
      .schema(dbSchema)
      .from('regla_umbral')
      .select('reglaid, umbralid')
      .eq('statusid', 1);
    
    if (reglasError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo reglas con umbrales', reglasError);
      throw reglasError;
    }
    
    const reglaIds = [...new Set(reglasConUmbrales?.map(r => r.reglaid).filter(id => id != null) || [])];
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 4 - Reglas con umbrales', {
      reglasCount: reglaIds.length,
      sampleRegla: reglasConUmbrales?.[0]
    });
    
    if (reglaIds.length === 0) {
      logger.info('[DEBUG] GET /umbrales-por-lote: No hay reglas con umbrales, retornando []');
      return res.json([]);
    }
    
    // Paso 5: Verificar qué reglas aplican a las localizaciones encontradas
    // Usar regla_objeto para verificar si la regla aplica a alguna de nuestras localizaciones
    // Necesitamos obtener los IDs geográficos de nuestras localizaciones
    const { data: nodosParaReglas, error: nodosParaReglasError } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .select('nodoid, ubicacionid')
      .in('nodoid', nodoIds)
      .eq('statusid', 1);
    
    if (nodosParaReglasError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo nodos para reglas', nodosParaReglasError);
      throw nodosParaReglasError;
    }
    
    const ubicacionIdsParaReglas = [...new Set(nodosParaReglas?.map(n => n.ubicacionid).filter(id => id != null) || [])];
    
    // Obtener fundoids de las ubicaciones
    const { data: ubicacionesParaReglas, error: ubicacionesParaReglasError } = await userSupabase
      .schema(dbSchema)
      .from('ubicacion')
      .select('ubicacionid, fundoid')
      .in('ubicacionid', ubicacionIdsParaReglas)
      .eq('statusid', 1);
    
    if (ubicacionesParaReglasError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo ubicaciones para reglas', ubicacionesParaReglasError);
      throw ubicacionesParaReglasError;
    }
    
    const fundoIdsParaReglas = [...new Set(ubicacionesParaReglas?.map(u => u.fundoid).filter(id => id != null) || [])];
    
    // Obtener empresaid de los fundos
    const { data: fundosParaReglas, error: fundosParaReglasError } = await userSupabase
      .schema(dbSchema)
      .from('fundo')
      .select('fundoid, empresaid')
      .in('fundoid', fundoIdsParaReglas)
      .eq('statusid', 1);
    
    if (fundosParaReglasError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo fundos para reglas', fundosParaReglasError);
      throw fundosParaReglasError;
    }
    
    const empresaIdsParaReglas = [...new Set(fundosParaReglas?.map(f => f.empresaid).filter(id => id != null) || [])];
    
    // Obtener paisid de las empresas
    const { data: empresasParaReglas, error: empresasParaReglasError } = await userSupabase
      .schema(dbSchema)
      .from('empresa')
      .select('empresaid, paisid')
      .in('empresaid', empresaIdsParaReglas)
      .eq('statusid', 1);
    
    if (empresasParaReglasError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo empresas para reglas', empresasParaReglasError);
      throw empresasParaReglasError;
    }
    
    const paisIdsParaReglas = [...new Set(empresasParaReglas?.map(e => e.paisid).filter(id => id != null) || [])];
    
    // Obtener fuenteids para los diferentes niveles geográficos
    // Necesitamos obtener los fuenteid para 'pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'
    const { data: fuentes, error: fuentesError } = await userSupabase
      .schema(dbSchema)
      .from('fuente')
      .select('fuenteid, fuente')
      .in('fuente', ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'])
      .eq('statusid', 1);
    
    if (fuentesError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo fuentes', fuentesError);
      throw fuentesError;
    }
    
    const fuenteMap = new Map();
    if (fuentes) {
      fuentes.forEach(f => {
        fuenteMap.set(f.fuente, f.fuenteid);
      });
    }
    
    const fuentePais = fuenteMap.get('pais');
    const fuenteEmpresa = fuenteMap.get('empresa');
    const fuenteFundo = fuenteMap.get('fundo');
    const fuenteUbicacion = fuenteMap.get('ubicacion');
    const fuenteNodo = fuenteMap.get('nodo');
    const fuenteLocalizacion = fuenteMap.get('localizacion');
    
    // Obtener reglas que aplican a nuestras localizaciones a través de regla_objeto
    // Una regla aplica si tiene un regla_objeto con:
    // - objetoid IS NULL (global)
    // - fuenteid = fuentePais y objetoid = algun paisid
    // - fuenteid = fuenteEmpresa y objetoid = algun empresaid
    // - fuenteid = fuenteFundo y objetoid = algun fundoid
    // - fuenteid = fuenteUbicacion y objetoid = algun ubicacionid
    // - fuenteid = fuenteNodo y objetoid = algun nodoid
    // - fuenteid = fuenteLocalizacion y objetoid = algun localizacionid
    const { data: reglasObjeto, error: reglasObjetoError } = await userSupabase
      .schema(dbSchema)
      .from('regla_objeto')
      .select('reglaid, origenid, fuenteid, objetoid')
      .in('reglaid', reglaIds)
      .eq('statusid', 1)
      .eq('origenid', 1); // origenid = 1 es GEOGRAFIA
    
    if (reglasObjetoError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo regla_objeto', reglasObjetoError);
      throw reglasObjetoError;
    }
    
    // Filtrar reglas que aplican a nuestras localizaciones
    const reglasQueAplican = new Set();
    
    if (reglasObjeto) {
      reglasObjeto.forEach(ro => {
        let aplica = false;
        
        // Global (objetoid IS NULL)
        if (ro.objetoid == null) {
          aplica = true;
        }
        // País
        else if (ro.fuenteid === fuentePais && paisIdsParaReglas.includes(Number(ro.objetoid))) {
          aplica = true;
        }
        // Empresa
        else if (ro.fuenteid === fuenteEmpresa && empresaIdsParaReglas.includes(Number(ro.objetoid))) {
          aplica = true;
        }
        // Fundo
        else if (ro.fuenteid === fuenteFundo && fundoIdsParaReglas.includes(Number(ro.objetoid))) {
          aplica = true;
        }
        // Ubicación
        else if (ro.fuenteid === fuenteUbicacion && ubicacionIdsParaReglas.includes(Number(ro.objetoid))) {
          aplica = true;
        }
        // Nodo
        else if (ro.fuenteid === fuenteNodo && nodoIds.includes(Number(ro.objetoid))) {
          aplica = true;
        }
        // Localización
        else if (ro.fuenteid === fuenteLocalizacion && localizacionIds.includes(Number(ro.objetoid))) {
          aplica = true;
        }
        
        if (aplica) {
          reglasQueAplican.add(ro.reglaid);
        }
      });
    }
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 5 - Reglas que aplican', {
      reglasQueAplicanCount: reglasQueAplican.size,
      reglasQueAplican: Array.from(reglasQueAplican)
    });
    
    if (reglasQueAplican.size === 0) {
      logger.info('[DEBUG] GET /umbrales-por-lote: No hay reglas que apliquen, retornando []');
      return res.json([]);
    }
    
    // Paso 6: Obtener umbrales de las reglas que aplican
    const reglasQueAplicanArray = Array.from(reglasQueAplican);
    const { data: reglasUmbrales, error: reglasUmbralesError } = await userSupabase
      .schema(dbSchema)
      .from('regla_umbral')
      .select('reglaid, umbralid')
      .in('reglaid', reglasQueAplicanArray)
      .eq('statusid', 1);
    
    if (reglasUmbralesError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo regla_umbral', reglasUmbralesError);
      throw reglasUmbralesError;
    }
    
    const umbralIds = [...new Set(reglasUmbrales?.map(ru => ru.umbralid).filter(id => id != null) || [])];
    
    if (umbralIds.length === 0) {
      logger.info('[DEBUG] GET /umbrales-por-lote: No hay umbrales en reglas que aplican, retornando []');
      return res.json([]);
    }
    
    // Paso 7: Obtener umbrales
    let umbralQuery = userSupabase
      .schema(dbSchema)
      .from('umbral')
      .select('*')
      .in('umbralid', umbralIds)
      .eq('statusid', 1);
    
    if (metricaId) {
      umbralQuery = umbralQuery.eq('metricaid', metricaId);
    }
    
    const { data: umbrales, error: umbralError } = await umbralQuery;
    
    if (umbralError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error en query de umbrales', umbralError);
      throw umbralError;
    }
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 7 - Umbrales', {
      umbralesCount: umbrales?.length || 0,
      umbralIds,
      metricaId,
      sampleUmbral: umbrales?.[0]
    });
    
    if (!umbrales || umbrales.length === 0) {
      logger.info('[DEBUG] GET /umbrales-por-lote: No hay umbrales, retornando []');
      return res.json([]);
    }
    
    // Paso 8: Obtener localizaciones completas (ya las tenemos, pero las necesitamos para mapear)
    // NOTA: localizaciones viene del paso 3 y tiene estructura: { localizacionid, nodoid, metricaid, sensorid }
    const localizacionesData = localizaciones.map(l => ({
      localizacionid: l.localizacionid,
      nodoid: l.nodoid,
      metricaid: l.metricaid,
      sensorid: l.sensorid
    }));
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 8 - Localizaciones para mapear', {
      localizacionesDataLength: localizacionesData.length,
      localizacionesData: localizacionesData
    });
    
    const localizacionesMap = new Map();
    localizacionesData.forEach(loc => {
      localizacionesMap.set(loc.localizacionid, loc);
    });
    
    // Paso 6: Obtener nodos por separado (para obtener nombres y ubicacionid)
    const nodoIdsFromLocalizaciones = [...new Set(
      localizacionesData?.map(l => l.nodoid).filter(id => id != null) || []
    )];
    
    const { data: nodosData, error: nodosDataError } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .select('nodoid, nodo, ubicacionid')
      .in('nodoid', nodoIdsFromLocalizaciones)
      .eq('statusid', 1);
    
    if (nodosDataError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo nodos', nodosDataError);
      throw nodosDataError;
    }
    
    const nodosMap = new Map();
    if (nodosData) {
      nodosData.forEach(n => {
        nodosMap.set(n.nodoid, n);
      });
    }
    
    // Paso 7: Obtener ubicaciones por separado
    const ubicacionIdsFromNodos = [...new Set(
      nodosData?.map(n => n.ubicacionid).filter(id => id != null) || []
    )];
    
    const { data: ubicacionesData, error: ubicacionesDataError } = await userSupabase
      .schema(dbSchema)
      .from('ubicacion')
      .select('ubicacionid, ubicacion')
      .in('ubicacionid', ubicacionIdsFromNodos)
      .eq('statusid', 1);
    
    if (ubicacionesDataError) {
      logger.error('[DEBUG] GET /umbrales-por-lote: Error obteniendo ubicaciones', ubicacionesDataError);
      throw ubicacionesDataError;
    }
    
    const ubicacionesMap = new Map();
    if (ubicacionesData) {
      ubicacionesData.forEach(u => {
        ubicacionesMap.set(u.ubicacionid, u);
      });
    }
    
    // Paso 8: Obtener criticidades por separado
    const criticidadIds = [...new Set(
      umbrales.map(u => u.criticidadid).filter(id => id != null)
    )];
    
    let criticidadesMap = new Map();
    if (criticidadIds.length > 0) {
      const { data: criticidades, error: critError } = await userSupabase
        .schema(dbSchema)
        .from('criticidad')
        .select('criticidadid, criticidad, grado')
        .in('criticidadid', criticidadIds)
        .eq('statusid', 1);
      
      if (!critError && criticidades) {
        criticidades.forEach(c => {
          criticidadesMap.set(c.criticidadid, c);
        });
      }
    }
    
    // Paso 9: Obtener métricas por separado (desde umbrales y localizaciones)
    const metricaIdsFromUmbrales = [...new Set(umbrales.map(u => u.metricaid).filter(id => id != null))];
    const metricaIdsFromLocalizaciones = [...new Set(
      localizacionesData?.map(l => l.metricaid).filter(id => id != null) || []
    )];
    const todasLasMetricaIds = [...new Set([...metricaIdsFromUmbrales, ...metricaIdsFromLocalizaciones])];
    
    let metricasMap = new Map();
    if (todasLasMetricaIds.length > 0) {
      const { data: metricas, error: metError } = await userSupabase
        .schema(dbSchema)
        .from('metrica')
        .select('metricaid, metrica, unidad')
        .in('metricaid', todasLasMetricaIds)
        .eq('statusid', 1);
      
      if (!metError && metricas) {
        metricas.forEach(m => {
          metricasMap.set(m.metricaid, m);
        });
      }
    }
    
    // Paso 10: Obtener sensores por separado (para obtener tipoid)
    const sensorIdsFromLocalizaciones = [...new Set(
      localizacionesData?.map(l => l.sensorid).filter(id => id != null) || []
    )];
    
    let sensoresMap = new Map();
    if (sensorIdsFromLocalizaciones.length > 0) {
      const { data: sensores, error: senError } = await userSupabase
        .schema(dbSchema)
        .from('sensor')
        .select('sensorid, tipoid')
        .in('sensorid', sensorIdsFromLocalizaciones)
        .eq('statusid', 1);
      
      if (!senError && sensores) {
        sensores.forEach(s => {
          sensoresMap.set(s.sensorid, s);
        });
      }
    }
    
    // Paso 11: Crear un mapa de umbralid -> localizaciones que aplican
    // Para cada umbral, necesitamos determinar a qué localizaciones aplica
    // Esto se hace a través de las reglas que lo usan
    const umbralReglaMap = new Map(); // umbralid -> [reglaid]
    if (reglasUmbrales) {
      reglasUmbrales.forEach(ru => {
        if (!umbralReglaMap.has(ru.umbralid)) {
          umbralReglaMap.set(ru.umbralid, []);
        }
        umbralReglaMap.get(ru.umbralid).push(ru.reglaid);
      });
    }
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 11 - Umbral-Regla Map', {
      umbralReglaMapSize: umbralReglaMap.size,
      umbralReglaMapEntries: Array.from(umbralReglaMap.entries())
    });
    
    // Para cada umbral, obtener las localizaciones a las que aplica
    // a través de las reglas que lo usan
    const umbralLocalizacionMap = new Map(); // umbralid -> [localizacionid]
    
    umbrales.forEach(u => {
      const reglasDelUmbral = umbralReglaMap.get(u.umbralid) || [];
      const localizacionesDelUmbral = new Set();
      
      reglasDelUmbral.forEach(reglaid => {
        // Si la regla aplica a alguna de nuestras localizaciones, agregarla
        if (reglasQueAplican.has(reglaid)) {
          // La regla aplica a todas nuestras localizaciones (o a un subconjunto según regla_objeto)
          // Por simplicidad, asignamos todas las localizaciones que coinciden con la métrica
          localizaciones.forEach(loc => {
            // Si el umbral tiene metricaid, solo aplica a localizaciones con esa métrica
            if (!u.metricaid || loc.metricaid === u.metricaid) {
              localizacionesDelUmbral.add(loc.localizacionid);
            }
          });
        }
      });
      
      if (localizacionesDelUmbral.size > 0) {
        umbralLocalizacionMap.set(u.umbralid, Array.from(localizacionesDelUmbral));
      }
    });
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 11 - Umbral-Localizacion Map', {
      umbralLocalizacionMapSize: umbralLocalizacionMap.size,
      umbralLocalizacionMapEntries: Array.from(umbralLocalizacionMap.entries()).map(([umbralid, locIds]) => ({
        umbralid,
        localizacionIds: locIds
      }))
    });
    
    // Paso 12: Transformar datos - crear una entrada por cada combinación umbral-localizacion
    const transformed = [];
    
    umbrales.forEach(u => {
      const localizacionesDelUmbral = umbralLocalizacionMap.get(u.umbralid) || [];
      
      logger.info('[DEBUG] GET /umbrales-por-lote: Procesando umbral', {
        umbralid: u.umbralid,
        umbral: u.umbral,
        localizacionesDelUmbralCount: localizacionesDelUmbral.length,
        localizacionesDelUmbral: localizacionesDelUmbral
      });
      
      // Si no hay localizaciones, saltar este umbral
      if (localizacionesDelUmbral.length === 0) {
        logger.warn('[DEBUG] GET /umbrales-por-lote: Umbral sin localizaciones', {
          umbralid: u.umbralid,
          umbral: u.umbral
        });
        return;
      }
      
      // Para cada localización, crear una entrada
      localizacionesDelUmbral.forEach(localizacionId => {
        const localizacion = localizacionesMap.get(localizacionId);
        if (!localizacion) {
          logger.warn('[DEBUG] GET /umbrales-por-lote: Localizacion no encontrada en map', {
            localizacionId,
            localizacionesMapKeys: Array.from(localizacionesMap.keys())
          });
          return;
        }
        
        // Obtener nodo desde el map
        const nodo = localizacion?.nodoid ? nodosMap.get(localizacion.nodoid) : null;
        
        // Obtener ubicacion desde el map
        const ubicacion = nodo?.ubicacionid ? ubicacionesMap.get(nodo.ubicacionid) : null;
        
        // Obtener metrica desde el map
        const metrica = u.metricaid ? metricasMap.get(u.metricaid) : (localizacion?.metricaid ? metricasMap.get(localizacion.metricaid) : null);
        
        // Obtener sensor desde el map
        const sensor = localizacion?.sensorid ? sensoresMap.get(localizacion.sensorid) : null;
        
        // Validar que tenemos ubicacionid y tipoid (requeridos por el frontend)
        const ubicacionid = ubicacion?.ubicacionid || nodo?.ubicacionid || null;
        const tipoid = sensor?.tipoid || null;
        
        if (!ubicacionid || !tipoid) {
          logger.warn('[DEBUG] GET /umbrales-por-lote: Umbral sin ubicacionid o tipoid', {
            umbralid: u.umbralid,
            localizacionId,
            ubicacionid,
            tipoid,
            nodo: nodo ? { nodoid: nodo.nodoid, ubicacionid: nodo.ubicacionid } : null,
            sensor: sensor ? { sensorid: sensor.sensorid, tipoid: sensor.tipoid } : null
          });
          return;
        }
        
        // Construir objeto localizacion completo
        const localizacionCompleta = localizacion ? {
          localizacionid: localizacion.localizacionid,
          nodoid: localizacion.nodoid,
          metricaid: localizacion.metricaid,
          sensorid: localizacion.sensorid,
          nodo: nodo ? {
            ...nodo,
            ubicacion: ubicacion
          } : null,
          metrica: metrica,
          sensor: sensor
        } : null;
        
        transformed.push({
          ...u,
          localizacion: localizacionCompleta,
          // Agregar campos directos para facilitar el acceso en el frontend
          ubicacionid: ubicacionid,
          tipoid: tipoid,
          metricaid: u.metricaid || localizacion?.metricaid || null,
          localizacionid: localizacionId,
          // Agregar criticidadid si está disponible (aunque umbral no lo tiene directamente)
          criticidadid: null // El umbral no tiene criticidadid en el schema actual
        });
      });
    });
    
    logger.info('[DEBUG] GET /umbrales-por-lote: Paso 12 - Transformación completada', {
      transformedCount: transformed.length,
      sampleTransformed: transformed[0],
      transformedWithUbicacionid: transformed.filter(t => t.ubicacionid != null).length,
      transformedWithTipoid: transformed.filter(t => t.tipoid != null).length
    });
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /umbrales-por-lote:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ALERTA
// ============================================================================

router.get('/alerta', async (req, res) => {
  try {
    const { umbralId, startDate, endDate, limit = 100 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados profundos
    let query = userSupabase
      .schema(dbSchema)
      .from('alerta')
      .select(`
        *,
        umbral:umbralid(
          umbralid,
          umbral,
          minimo,
          maximo,
          localizacion:localizacionid(localizacionid, localizacion)
        ),
        medicion:medicionid(medicionid, medicion, fecha)
      `);
    
    if (umbralId) {
      query = query.eq('umbralid', umbralId);
    }
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    query = query.order('fecha', { ascending: false }).limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(a => ({
      ...a,
      umbral: a.umbral ? (Array.isArray(a.umbral) ? a.umbral[0] : a.umbral) : null,
      medicion: a.medicion ? (Array.isArray(a.medicion) ? a.medicion[0] : a.medicion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /alerta:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerta/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('alerta');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /alerta/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ALERTA_REGLA
// ============================================================================

router.get('/alerta_regla', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100, page = 1, pageSize = 20 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Paso 1: Obtener alerta_regla (sin joins directos para evitar errores PGRST200)
    let query = userSupabase
      .schema(dbSchema)
      .from('alerta_regla')
      .select('*');
    
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    query = query.order('fecha', { ascending: false });
    
    // Aplicar paginación si se proporciona
    if (page && pageSize) {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      query = query.range(offset, offset + parseInt(pageSize) - 1);
    } else {
      query = query.limit(parseInt(limit));
    }
    
    const { data: alertasRegla, error: alertasError } = await query;
    
    if (alertasError) {
      logger.error('[DEBUG] GET /alerta_regla: Error obteniendo alerta_regla', alertasError);
      throw alertasError;
    }
    
    if (!alertasRegla || alertasRegla.length === 0) {
      return res.json({
        data: [],
        pagination: page && pageSize ? {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: 0,
          totalPages: 0
        } : null
      });
    }
    
    logger.info('[DEBUG] GET /alerta_regla: Alertas obtenidas', {
      alertasCount: alertasRegla.length,
      sampleAlerta: alertasRegla[0]
    });
    
    // Paso 2: Obtener reglaids, localizacionids, medicionids únicos
    const reglaIds = [...new Set(alertasRegla.map(a => a.reglaid).filter(id => id != null))];
    const localizacionIds = [...new Set(alertasRegla.map(a => a.localizacionid).filter(id => id != null))];
    const medicionIds = [...new Set(alertasRegla.map(a => a.medicionid).filter(id => id != null))];
    
    // Paso 3: Obtener reglas
    let reglasMap = new Map();
    if (reglaIds.length > 0) {
      const { data: reglas, error: reglasError } = await userSupabase
        .schema(dbSchema)
        .from('regla')
        .select('reglaid, nombre, prioridad')
        .in('reglaid', reglaIds)
        .eq('statusid', 1);
      
      if (!reglasError && reglas) {
        reglas.forEach(r => {
          reglasMap.set(r.reglaid, r);
        });
      }
    }
    
    // Paso 4: Obtener localizaciones
    let localizacionesMap = new Map();
    if (localizacionIds.length > 0) {
      const { data: localizaciones, error: localizacionesError } = await userSupabase
        .schema(dbSchema)
        .from('localizacion')
        .select('localizacionid, localizacion, nodoid, metricaid, sensorid')
        .in('localizacionid', localizacionIds)
        .eq('statusid', 1);
      
      if (!localizacionesError && localizaciones) {
        localizaciones.forEach(l => {
          localizacionesMap.set(l.localizacionid, l);
        });
      }
    }
    
    // Paso 5: Obtener mediciones
    let medicionesMap = new Map();
    if (medicionIds.length > 0) {
      const { data: mediciones, error: medicionesError } = await userSupabase
        .schema(dbSchema)
        .from('medicion')
        .select('medicionid, medicion, fecha')
        .in('medicionid', medicionIds);
      
      if (!medicionesError && mediciones) {
        mediciones.forEach(m => {
          medicionesMap.set(m.medicionid, m);
        });
      }
    }
    
    // Paso 6: Obtener regla_umbral para estas reglas
    const { data: reglasUmbrales, error: reglasUmbralesError } = await userSupabase
      .schema(dbSchema)
      .from('regla_umbral')
      .select('reglaid, umbralid')
      .in('reglaid', reglaIds)
      .eq('statusid', 1);
    
    if (reglasUmbralesError) {
      logger.error('[DEBUG] GET /alerta_regla: Error obteniendo regla_umbral', reglasUmbralesError);
      throw reglasUmbralesError;
    }
    
    // Paso 7: Obtener umbralids únicos
    const umbralIds = [...new Set(reglasUmbrales?.map(ru => ru.umbralid).filter(id => id != null) || [])];
    
    // Paso 8: Obtener umbrales con criticidad
    let umbralesMap = new Map();
    if (umbralIds.length > 0) {
      const { data: umbrales, error: umbralesError } = await userSupabase
        .schema(dbSchema)
        .from('umbral')
        .select('umbralid, umbral, minimo, maximo, estandar, operador, inversion, metricaid, criticidadid')
        .in('umbralid', umbralIds)
        .eq('statusid', 1);
      
      if (!umbralesError && umbrales) {
        // Obtener criticidadids únicos
        const criticidadIds = [...new Set(umbrales.map(u => u.criticidadid).filter(id => id != null))];
        
        // Obtener criticidades
        let criticidadesMap = new Map();
        if (criticidadIds.length > 0) {
          const { data: criticidades, error: criticidadesError } = await userSupabase
            .schema(dbSchema)
            .from('criticidad')
            .select('criticidadid, criticidad, grado')
            .in('criticidadid', criticidadIds)
            .eq('statusid', 1);
          
          if (!criticidadesError && criticidades) {
            criticidades.forEach(c => {
              criticidadesMap.set(c.criticidadid, c);
            });
          }
        }
        
        // Combinar umbrales con criticidades
        umbrales.forEach(u => {
          const criticidad = u.criticidadid ? (criticidadesMap.get(u.criticidadid) || null) : null;
          umbralesMap.set(u.umbralid, {
            ...u,
            criticidad: criticidad
          });
        });
      }
    }
    
    // Paso 8b: Obtener nodos para las localizaciones
    const nodoIds = [...new Set(Array.from(localizacionesMap.values()).map(l => l.nodoid).filter(id => id != null))];
    let nodosMap = new Map();
    if (nodoIds.length > 0) {
      const { data: nodos, error: nodosError } = await userSupabase
        .schema(dbSchema)
        .from('nodo')
        .select('nodoid, nodo, ubicacionid')
        .in('nodoid', nodoIds)
        .eq('statusid', 1);
      
      if (!nodosError && nodos) {
        // Obtener ubicacionids únicos
        const ubicacionIds = [...new Set(nodos.map(n => n.ubicacionid).filter(id => id != null))];
        
        // Obtener ubicaciones
        let ubicacionesMap = new Map();
        if (ubicacionIds.length > 0) {
          const { data: ubicaciones, error: ubicacionesError } = await userSupabase
            .schema(dbSchema)
            .from('ubicacion')
            .select('ubicacionid, ubicacion')
            .in('ubicacionid', ubicacionIds)
            .eq('statusid', 1);
          
          if (!ubicacionesError && ubicaciones) {
            ubicaciones.forEach(u => {
              ubicacionesMap.set(u.ubicacionid, u);
            });
          }
        }
        
        // Combinar nodos con ubicaciones
        nodos.forEach(n => {
          const ubicacion = n.ubicacionid ? (ubicacionesMap.get(n.ubicacionid) || null) : null;
          nodosMap.set(n.nodoid, {
            ...n,
            ubicacion: ubicacion
          });
        });
      }
    }
    
    // Paso 9: Crear mapa de reglaid -> umbrales
    const reglaUmbralMap = new Map(); // reglaid -> [umbral]
    if (reglasUmbrales) {
      reglasUmbrales.forEach(ru => {
        const umbral = umbralesMap.get(ru.umbralid);
        if (umbral) {
          if (!reglaUmbralMap.has(ru.reglaid)) {
            reglaUmbralMap.set(ru.reglaid, []);
          }
          reglaUmbralMap.get(ru.reglaid).push(umbral);
        }
      });
    }
    
    // Paso 10: Obtener total para paginación
    let total = 0;
    if (page && pageSize) {
      const countQuery = userSupabase
        .schema(dbSchema)
        .from('alerta_regla')
        .select('uuid_alerta_reglaid', { count: 'exact', head: true });
      
      if (startDate) {
        countQuery.gte('fecha', startDate);
      }
      if (endDate) {
        countQuery.lte('fecha', endDate);
      }
      
      const { count, error: countError } = await countQuery;
      if (!countError && count != null) {
        total = count;
      }
    }
    
    // Paso 11: Transformar datos
    const transformed = alertasRegla.map(ar => {
      const regla = reglasMap.get(ar.reglaid) || null;
      const localizacionRaw = localizacionesMap.get(ar.localizacionid) || null;
      const medicion = ar.medicionid ? (medicionesMap.get(ar.medicionid) || null) : null;
      
      // Obtener nodo para la localización
      const nodo = localizacionRaw?.nodoid ? (nodosMap.get(localizacionRaw.nodoid) || null) : null;
      
      // Combinar localización con nodo
      const localizacion = localizacionRaw ? {
        ...localizacionRaw,
        nodo: nodo
      } : null;
      
      // Obtener umbrales de la regla (puede haber múltiples umbrales por regla)
      const umbralesDeRegla = regla ? (reglaUmbralMap.get(regla.reglaid) || []) : [];
      
      // Para compatibilidad con el frontend, usar el primer umbral o crear uno genérico
      const umbralPrincipal = umbralesDeRegla.length > 0 ? umbralesDeRegla[0] : null;
      
      return {
        // Campos principales
        alertaid: ar.uuid_alerta_reglaid, // Usar UUID como ID
        uuid_alerta_reglaid: ar.uuid_alerta_reglaid,
        reglaid: ar.reglaid,
        localizacionid: ar.localizacionid,
        medicionid: ar.medicionid,
        fecha: ar.fecha,
        valor: ar.valor, // Valor que activó la alerta
        statusid: ar.statusid,
        usercreatedid: ar.usercreatedid,
        datecreated: ar.datecreated,
        
        // Relaciones
        regla: regla,
        localizacion: localizacion,
        medicion: medicion,
        
        // Umbral (usar el primero si hay múltiples)
        umbral: umbralPrincipal ? {
          umbralid: umbralPrincipal.umbralid,
          umbral: umbralPrincipal.umbral,
          minimo: umbralPrincipal.minimo,
          maximo: umbralPrincipal.maximo,
          estandar: umbralPrincipal.estandar,
          operador: umbralPrincipal.operador,
          inversion: umbralPrincipal.inversion,
          metricaid: umbralPrincipal.metricaid,
          criticidad: umbralPrincipal.criticidad
        } : null,
        
        // Todos los umbrales de la regla (por si se necesitan)
        umbrales: umbralesDeRegla,
        
        // Campos calculados para facilitar el acceso
        umbral_intervalo: umbralPrincipal ? `${umbralPrincipal.minimo} - ${umbralPrincipal.maximo}` : null,
        valor_medido: ar.valor,
        umbral_minimo: umbralPrincipal?.minimo || null,
        umbral_maximo: umbralPrincipal?.maximo || null
      };
    });
    
    // Respuesta con paginación si se solicitó
    if (page && pageSize) {
      return res.json({
        data: transformed,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      });
    } else {
      return res.json(transformed);
    }
  } catch (error) {
    logger.error('Error en GET /alerta_regla:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerta_regla/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('alerta_regla');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /alerta_regla/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ALERTACONSOLIDADO
// ============================================================================

router.get('/alerta_regla_consolidado', async (req, res) => {
  try {
    const { statusid = 1, limit = 100 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados profundos
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('alerta_regla_consolidado')
      .select(`
        *,
        umbral:umbralid(
          umbralid,
          umbral,
          minimo,
          maximo,
          criticidad:criticidadid(criticidadid, criticidad),
          localizacion:localizacionid(
            localizacionid,
            localizacion,
            nodo:nodoid(nodoid, nodo),
            metrica:metricaid(metricaid, metrica)
          )
        )
      `)
      .eq('statusid', statusid)
      .order('fechaultimo', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(ac => ({
      ...ac,
      umbral: ac.umbral ? (Array.isArray(ac.umbral) ? ac.umbral[0] : ac.umbral) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /alerta_regla_consolidado:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerta_regla_consolidado/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('alerta_regla_consolidado');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /alerta_regla_consolidado/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MENSAJE
// ============================================================================

router.get('/mensaje', async (req, res) => {
  try {
    const { tipo_origen, limit = 100 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
      .schema(dbSchema)
      .from('mensaje')
      .select(`
        *,
        contacto:contactoid(
          contactoid,
          celular,
          usuario:usuarioid(usuarioid, login, firstname, lastname)
        )
      `);
    
    if (tipo_origen) {
      query = query.eq('tipo_origen', tipo_origen);
    }
    
    query = query.order('fecha', { ascending: false }).limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(msg => ({
      ...msg,
      contacto: msg.contacto ? (Array.isArray(msg.contacto) ? msg.contacto[0] : msg.contacto) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/mensaje/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('mensaje');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /mensaje/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REGLA_PERFIL y REGLA_UMBRAL (reemplazo de perfilumbral)
// ============================================================================
// Nota: perfilumbral fue reemplazado por el sistema de reglas
// Las relaciones ahora son: regla <-> regla_perfil <-> perfil
//                         regla <-> regla_umbral <-> umbral

// Las operaciones CRUD para regla, regla_perfil y regla_umbral
// se manejan a través de las rutas genéricas en routes/generic.js


// ============================================================================
// AUDIT_LOG_UMBRAL
// ============================================================================

router.get('/audit_log_umbral', async (req, res) => {
  try {
    const { umbralId, limit = 100 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con join anidado
    let query = userSupabase
      .schema(dbSchema)
      .from('audit_log_umbral')
      .select('*, umbral:umbralid(umbralid, umbral)');
    
    if (umbralId) {
      query = query.eq('umbralid', umbralId);
    }
    
    query = query.order('modified_at', { ascending: false }).limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(al => ({
      ...al,
      umbral: al.umbral ? (Array.isArray(al.umbral) ? al.umbral[0] : al.umbral) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /audit_log_umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit_log_umbral/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('audit_log_umbral');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /audit_log_umbral/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
