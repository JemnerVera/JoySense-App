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
    const { nodoid, ubicacionId } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados profundos
    // NOTA: No podemos hacer join directo a sensor ni a metrica desde localizacion
    // La relación con metrica es a través de metricasensor, y sensor necesita obtenerse por separado
    let query = userSupabase
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
    }
    
    // Si se proporciona ubicacionId, filtrar por nodos de esa ubicación
    if (ubicacionId) {
      // Primero obtener nodos de esa ubicación
      const { data: nodos, error: nodosError } = await userSupabase
        .schema(dbSchema)
        .from('nodo')
        .select('nodoid')
        .eq('ubicacionid', ubicacionId);
      
      if (nodosError) throw nodosError;
      
      const nodoIds = (nodos || []).map(n => n.nodoid);
      if (nodoIds.length > 0) {
        query = query.in('nodoid', nodoIds);
      } else {
        // Si no hay nodos en esa ubicación, retornar array vacío
        return res.json([]);
      }
    }
    
    query = query.order('localizacionid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Obtener métricas por separado (ya que la relación es a través de metricasensor)
    const metricaIds = [...new Set(
      (data || [])
        .map(l => l.metricaid)
        .filter(id => id != null)
    )];
    
    let metricasMap = new Map();
    if (metricaIds.length > 0) {
      const { data: metricas, error: metError } = await userSupabase
        .schema(dbSchema)
        .from('metrica')
        .select('metricaid, metrica, unidad')
        .in('metricaid', metricaIds)
        .eq('statusid', 1);
      
      if (!metError && metricas) {
        metricas.forEach(m => {
          metricasMap.set(m.metricaid, m);
        });
      }
    }
    
    // Obtener sensores por separado (para obtener tipoid)
    const sensorIds = [...new Set(
      (data || [])
        .map(l => l.sensorid)
        .filter(id => id != null)
    )];
    
    let sensoresMap = new Map();
    if (sensorIds.length > 0) {
      const { data: sensores, error: senError } = await userSupabase
        .schema(dbSchema)
        .from('sensor')
        .select('sensorid, tipoid')
        .in('sensorid', sensorIds)
        .eq('statusid', 1);
      
      if (!senError && sensores) {
        sensores.forEach(s => {
          sensoresMap.set(s.sensorid, s);
        });
      }
    }
    
    // Transformar datos para mantener formato compatible y agregar métricas y sensores
    const transformed = (data || []).map(l => {
      const nodo = l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null;
      const metrica = l.metricaid ? metricasMap.get(l.metricaid) : null;
      const sensor = l.sensorid ? sensoresMap.get(l.sensorid) : null;
      
      return {
        ...l,
        nodo: nodo,
        metrica: metrica,
        sensor: sensor
      };
    });
    
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
        nodo:nodoid(
          nodoid, 
          nodo,
          latitud,
          longitud,
          referencia
        ),
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
    
    // Verificar si el usuario está autenticado
    if (req.supabase) {
      const { data: { user }, error: userError } = await req.supabase.auth.getUser();
      if (userError) {
        // No debug log
      }
    }
    
    // Primero, verificar si hay localizaciones sin filtros
    const { data: allLocalizaciones, error: allError } = await userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select('localizacionid, statusid, nodoid')
      .limit(10);
    
    if (allError) {
      // No debug log
    }
    
    // También probar con una consulta más simple a otra tabla para verificar conectividad
    const { data: nodosTest, error: nodosError } = await userSupabase
      .schema(dbSchema)
      .from('nodo')
      .select('nodoid, nodo')
      .limit(5);
    
    if (nodosError) {
      // No debug log
    }
    
    // Paso 1: Obtener localizaciones con nodos y coordenadas
    // Nota: localizacion tiene FK compuesta (sensorid, metricaid) -> metricasensor, no directa a metrica
    const { data: localizaciones, error: locError } = await userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select(`
        localizacionid,
        localizacion,
        nodoid,
        sensorid,
        metricaid,
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
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    // Filtrar localizaciones que tengan nodo con coordenadas
    const filteredLocalizaciones = (localizaciones || []).filter(l => {
      const nodo = l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null;
      return nodo && nodo.latitud != null && nodo.longitud != null;
    });

    if (locError) {
      throw locError;
    }
    
    // Paso 1.5: Obtener métricas por separado (ya que la relación es a través de metricasensor)
    const metricaIds = [...new Set(filteredLocalizaciones.map(l => l.metricaid).filter(id => id != null))];
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
    const localizacionIds = filteredLocalizaciones.map(l => l.localizacionid);
    
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
    const transformed = filteredLocalizaciones.map(l => {
      const nodo = l.nodo ? (Array.isArray(l.nodo) ? l.nodo[0] : l.nodo) : null;
      const metrica = metricasMap.get(l.metricaid) || null;
      const entidad = entidadesMap.get(l.localizacionid) || null;
      
      return {
        localizacionid: l.localizacionid,
        localizacion: l.localizacion,
        latitud: nodo?.latitud,
        longitud: nodo?.longitud,
        referencia: nodo?.referencia,
        nodo: nodo ? {
          ...nodo,
          entidad: entidad
        } : null,
        metrica: metrica
      };
    });
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /nodos-con-localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BÚSQUEDA GLOBAL DE LOCALIZACIONES
// ============================================================================

router.get('/locations/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Obtener todas las localizaciones con sus relaciones
    const { data: localizaciones, error: locError } = await userSupabase
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
    
    // Filtrar localizaciones que coincidan con el término de búsqueda
    const results = (localizaciones || []).filter(loc => {
      const nodo = loc.nodo ? (Array.isArray(loc.nodo) ? loc.nodo[0] : loc.nodo) : null;
      const ubicacion = nodo?.ubicacion ? (Array.isArray(nodo.ubicacion) ? nodo.ubicacion[0] : nodo.ubicacion) : null;
      const fundo = ubicacion?.fundo ? (Array.isArray(ubicacion.fundo) ? ubicacion.fundo[0] : ubicacion.fundo) : null;
      const empresa = fundo?.empresa ? (Array.isArray(fundo.empresa) ? fundo.empresa[0] : fundo.empresa) : null;
      const pais = empresa?.pais ? (Array.isArray(empresa.pais) ? empresa.pais[0] : empresa.pais) : null;
      
      const searchLower = query.toLowerCase();
      const matches = 
        (loc.localizacion?.toLowerCase().includes(searchLower)) ||
        (nodo?.nodo?.toLowerCase().includes(searchLower)) ||
        (ubicacion?.ubicacion?.toLowerCase().includes(searchLower)) ||
        (fundo?.fundo?.toLowerCase().includes(searchLower)) ||
        (empresa?.empresa?.toLowerCase().includes(searchLower)) ||
        (pais?.pais?.toLowerCase().includes(searchLower));
      
      return matches;
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
    
    res.json(results);
  } catch (error) {
    logger.error('Error en GET /locations/search:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
