/**
 * Rutas de Dispositivos: nodo, sensor, metrica, tipo, localizacion, metricasensor
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
// NODO (ahora tiene ubicacionid directamente)
// ============================================================================

router.get('/nodo', async (req, res) => {
  try {
    const { ubicacionId } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
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
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(n => ({
      ...n,
      ubicacion: n.ubicacion ? (Array.isArray(n.ubicacion) ? n.ubicacion[0] : n.ubicacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /nodo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/nodos', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .select('*')
      .order('nodoid', { ascending: true });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /nodos:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/nodo/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('nodo');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /nodo/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/nodo', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /nodo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/nodo/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .update(req.body)
      .eq('nodoid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /nodo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SENSOR (ahora PK simple: sensorid)
// ============================================================================

router.get('/sensor', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con join anidado
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('sensor')
      .select('*, tipo:tipoid(tipoid, tipo)')
      .order('sensorid', { ascending: true });
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(s => ({
      ...s,
      tipo: s.tipo ? (Array.isArray(s.tipo) ? s.tipo[0] : s.tipo) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /sensor:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/sensor/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('sensor');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /sensor/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sensor', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('sensor')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /sensor:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/sensor/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('sensor')
      .update(req.body)
      .eq('sensorid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /sensor:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TIPO
// ============================================================================

router.get('/tipo', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const result = await paginateAndFilter('tipo', { ...req.query, sortBy: 'tipoid' }, userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en GET /tipo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/tipos', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('tipo')
      .select('*')
      .order('tipoid', { ascending: true });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /tipos:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/tipo/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('tipo');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /tipo/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/tipo', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('tipo')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /tipo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/tipo/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('tipo')
      .update(req.body)
      .eq('tipoid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /tipo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// METRICA
// ============================================================================

router.get('/metrica', async (req, res) => {
  try {
    const result = await paginateAndFilter('metrica', { ...req.query, sortBy: 'metricaid' });
    res.json(result);
  } catch (error) {
    logger.error('Error en GET /metrica:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/metricas', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('metrica')
      .select('*')
      .order('metricaid', { ascending: true });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /metricas:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrica/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('metrica');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /metrica/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/metrica', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('metrica')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /metrica:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/metrica/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('metrica')
      .update(req.body)
      .eq('metricaid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /metrica:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// METRICASENSOR (PK: sensorid, metricaid)
// ============================================================================

router.get('/metricasensor', async (req, res) => {
  try {
    const { sensorId } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
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
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(ms => ({
      ...ms,
      sensor: ms.sensor ? (Array.isArray(ms.sensor) ? ms.sensor[0] : ms.sensor) : null,
      metrica: ms.metrica ? (Array.isArray(ms.metrica) ? ms.metrica[0] : ms.metrica) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /metricasensor:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/metricasensor/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('metricasensor');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /metricasensor/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/metricasensor', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('metricasensor')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /metricasensor:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/metricasensor/composite', async (req, res) => {
  try {
    const { sensorid, metricaid } = req.query;
    
    if (!sensorid || !metricaid) {
      return res.status(400).json({ error: 'Se requieren sensorid y metricaid en el query string' });
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('metricasensor')
      .update(req.body)
      .eq('sensorid', sensorid)
      .eq('metricaid', metricaid)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /metricasensor/composite:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LOCALIZACION (NUEVO MODELO: nodoid, sensorid, metricaid + coords)
// ============================================================================

router.get('/localizacion', async (req, res) => {
  try {
    const { nodoid } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados profundos
    let query = userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select(`
        *,
        nodo:nodoid(
          nodoid,
          nodo,
          descripcion,
          ubicacionid,
          ubicacion:ubicacionid(
            ubicacionid,
            ubicacion,
            fundoid,
            fundo:fundoid(fundoid, fundo)
          )
        ),
        metrica:metricaid(metricaid, metrica, unidad),
        sensor:sensorid(sensorid, tipoid)
      `);
    
    if (nodoid) {
      query = query.eq('nodoid', nodoid);
    }
    
    query = query.order('localizacionid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(l => ({
      ...l,
      nodo: l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null,
      metrica: l.metrica ? (Array.isArray(l.metrica) ? l.metrica[0] : l.metrica) : null,
      sensor: l.sensor ? (Array.isArray(l.sensor) ? l.sensor[0] : l.sensor) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/localizaciones', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select(`
        *,
        nodo:nodoid(nodoid, nodo),
        metrica:metricaid(metricaid, metrica)
      `)
      .order('localizacionid', { ascending: true });
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(l => ({
      ...l,
      nodo: l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null,
      metrica: l.metrica ? (Array.isArray(l.metrica) ? l.metrica[0] : l.metrica) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /localizaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/localizacion/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('localizacion');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /localizacion/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/localizacion', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/localizacion/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .update(req.body)
      .eq('localizacionid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ASOCIACION (mapeo id_device <-> localizacionid)
// ============================================================================

router.get('/asociacion', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con join anidado
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('asociacion')
      .select('*, localizacion:localizacionid(localizacionid, localizacion)')
      .order('asociacionid', { ascending: true });
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(a => ({
      ...a,
      localizacion: a.localizacion ? (Array.isArray(a.localizacion) ? a.localizacion[0] : a.localizacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /asociacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/asociacion/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('asociacion');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /asociacion/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/asociacion', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('asociacion')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /asociacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/asociacion/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('asociacion')
      .update(req.body)
      .eq('asociacionid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /asociacion:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// NODOS CON LOCALIZACION (para mapa)
// ============================================================================

router.get('/nodos-con-localizacion', async (req, res) => {
  try {
    const { limit = 1000 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    logger.info(`[DEBUG] GET /nodos-con-localizacion: Iniciando consulta con schema: ${dbSchema}`);
    logger.info(`[DEBUG] GET /nodos-con-localizacion: Usando userSupabase: ${!!userSupabase}, tiene token: ${!!req.supabase}`);
    
    // Verificar si el usuario está autenticado
    if (req.supabase) {
      const { data: { user }, error: userError } = await req.supabase.auth.getUser();
      logger.info(`[DEBUG] GET /nodos-con-localizacion: Usuario autenticado: ${user?.id || 'NO'}, email: ${user?.email || 'NO'}`);
      if (userError) {
        logger.error(`[DEBUG] GET /nodos-con-localizacion: Error obteniendo usuario:`, userError);
      }
    }
    
    // Primero, verificar si hay localizaciones sin filtros
    const { data: allLocalizaciones, error: allError } = await userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select('localizacionid, latitud, longitud, statusid, nodoid')
      .limit(10);
    
    logger.info(`[DEBUG] GET /nodos-con-localizacion: Total localizaciones (sin filtros): ${(allLocalizaciones || []).length}`);
    if ((allLocalizaciones || []).length > 0) {
      logger.info(`[DEBUG] GET /nodos-con-localizacion: Sample sin filtros:`, JSON.stringify(allLocalizaciones[0]));
    }
    if (allError) {
      logger.error(`[DEBUG] GET /nodos-con-localizacion: Error en consulta sin filtros:`, JSON.stringify({
        code: allError.code,
        message: allError.message,
        details: allError.details,
        hint: allError.hint
      }));
    }
    
    // También probar con una consulta más simple a otra tabla para verificar conectividad
    const { data: nodosTest, error: nodosError } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .select('nodoid, nodo')
      .limit(5);
    
    logger.info(`[DEBUG] GET /nodos-con-localizacion: Test nodos (para verificar RLS): ${(nodosTest || []).length} nodos`);
    if (nodosError) {
      logger.error(`[DEBUG] GET /nodos-con-localizacion: Error en test nodos:`, JSON.stringify({
        code: nodosError.code,
        message: nodosError.message,
        details: nodosError.details
      }));
    }
    
    // Paso 1: Obtener localizaciones con nodos y coordenadas
    // Nota: localizacion tiene FK compuesta (sensorid, metricaid) -> metricasensor, no directa a metrica
    const { data: localizaciones, error: locError } = await userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select(`
        localizacionid,
        localizacion,
        latitud,
        longitud,
        referencia,
        nodoid,
        sensorid,
        metricaid,
        nodo:nodoid(
          nodoid,
          nodo,
          descripcion,
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
                pais:paisid(
                  paisid,
                  pais,
                  paisabrev
                )
              )
            )
          )
        )
      `)
      .not('latitud', 'is', null)
      .not('longitud', 'is', null)
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (locError) {
      logger.error(`[DEBUG] GET /nodos-con-localizacion: Error en consulta principal:`, locError);
      throw locError;
    }
    
    logger.info(`[DEBUG] GET /nodos-con-localizacion: Se obtuvieron ${(localizaciones || []).length} localizaciones`);
    if ((localizaciones || []).length > 0) {
      logger.info(`[DEBUG] Primera localizacion sample:`, JSON.stringify({
        localizacionid: localizaciones[0].localizacionid,
        latitud: localizaciones[0].latitud,
        longitud: localizaciones[0].longitud,
        tieneNodo: !!localizaciones[0].nodo,
        nodoid: localizaciones[0].nodo?.nodoid
      }));
    }
    
    // Paso 1.5: Obtener métricas por separado (ya que la relación es a través de metricasensor)
    const metricaIds = [...new Set((localizaciones || []).map(l => l.metricaid).filter(id => id != null))];
    let metricasMap = new Map();
    if (metricaIds.length > 0) {
      const { data: metricas, error: metError } = await userSupabase
        .schema(dbSchema)
        .from('metrica')
        .select('metricaid, metrica, unidad')
        .in('metricaid', metricaIds)
        .eq('statusid', 1);
      
      if (metError) throw metError;
      
      (metricas || []).forEach(m => {
        metricasMap.set(m.metricaid, m);
      });
    }
    
    // Paso 2: Obtener entidades por localizacionid desde entidad_localizacion
    const localizacionIds = (localizaciones || []).map(l => l.localizacionid);
    
    let entidadesMap = new Map();
    if (localizacionIds.length > 0) {
      const { data: entidadLocalizaciones, error: elError } = await userSupabase
        .schema(dbSchema)
        .from('entidad_localizacion')
        .select(`
          localizacionid,
          entidad:entidadid(
            entidadid,
            entidad
          )
        `)
        .in('localizacionid', localizacionIds)
        .eq('statusid', 1);
      
      if (elError) throw elError;
      
      // Crear mapa de localizacionid -> entidad
      (entidadLocalizaciones || []).forEach(el => {
        const entidad = el.entidad ? (Array.isArray(el.entidad) ? el.entidad[0] : el.entidad) : null;
        if (entidad) {
          entidadesMap.set(el.localizacionid, entidad);
        }
      });
    }
    
    // Paso 3: Combinar datos
    const transformed = (localizaciones || []).map(l => {
      const nodo = l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null;
      const metrica = metricasMap.get(l.metricaid) || null;
      const entidad = entidadesMap.get(l.localizacionid) || null;
      
      return {
        localizacionid: l.localizacionid,
        localizacion: l.localizacion,
        latitud: l.latitud,
        longitud: l.longitud,
        referencia: l.referencia,
        nodo: nodo ? {
          ...nodo,
          entidad: entidad
        } : null,
        metrica: metrica
      };
    });
    
    logger.info(`[DEBUG] GET /nodos-con-localizacion: Retornando ${transformed.length} localizaciones transformadas`);
    if (transformed.length > 0) {
      logger.info(`[DEBUG] Primera transformada sample:`, JSON.stringify({
        localizacionid: transformed[0].localizacionid,
        latitud: transformed[0].latitud,
        longitud: transformed[0].longitud,
        tieneNodo: !!transformed[0].nodo,
        nodoid: transformed[0].nodo?.nodoid
      }));
    }
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /nodos-con-localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
