/**
 * Rutas de Mediciones: medicion, sensor_valor
 * Versión Supabase API con RLS
 */

const express = require('express');
const router = express.Router();
const { dbSchema, supabase: baseSupabase } = require('../config/database');
const { paginateAndFilter } = require('../utils/pagination');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// MEDICION (simplificado: solo localizacionid)
// ============================================================================

router.get('/medicion', async (req, res) => {
  try {
    const { 
      localizacionId, 
      startDate, 
      endDate, 
      limit = 1000,
      getAll,
      countOnly 
    } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    if (countOnly) {
      // Construir query de count con Supabase API
      let countQuery = userSupabase
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
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      return res.json({ count: count || 0 });
    }
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
      .schema(dbSchema)
      .from('medicion')
      .select(`
        *,
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          latitud,
          longitud,
          nodoid,
          metricaid,
          nodo:nodoid(nodoid, nodo, ubicacionid),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `);
    
    if (localizacionId) {
      query = query.eq('localizacionid', localizacionId);
    }
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    query = query.order('fecha', { ascending: false });
    
    if (!getAll) {
      query = query.limit(parseInt(limit));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(m => ({
      ...m,
      localizacion: m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /medicion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/mediciones', async (req, res) => {
  try {
    const { 
      localizacionId,
      nodoid,
      startDate, 
      endDate, 
      limit = 1000,
      getAll
    } = req.query;
    
    let locIds = [];
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Si hay nodoid, obtener localizaciones de ese nodo
    if (nodoid) {
      const { data: localizaciones, error: locError } = await userSupabase
        .schema(dbSchema)
        .from('localizacion')
        .select('localizacionid')
        .eq('nodoid', nodoid)
        .eq('statusid', 1);
      
      if (locError) throw locError;
      locIds = (localizaciones || []).map(l => l.localizacionid);
      
      if (locIds.length === 0) {
        return res.json([]);
      }
    }
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
      .schema(dbSchema)
      .from('medicion')
      .select(`
        *,
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          nodoid,
          metricaid,
          nodo:nodoid(nodoid, nodo),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `);
    
    if (nodoid && locIds.length > 0) {
      query = query.in('localizacionid', locIds);
    } else if (localizacionId) {
      query = query.eq('localizacionid', localizacionId);
    }
    
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    query = query.order('fecha', { ascending: false });
    
    if (!getAll) {
      query = query.limit(parseInt(limit));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(m => ({
      ...m,
      localizacion: m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /mediciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mediciones con entidad
router.get('/mediciones-con-entidad', async (req, res) => {
  try {
    const { entidadId, startDate, endDate, limit = 1000 } = req.query;
    
    if (!entidadId) {
      return res.status(400).json({ error: 'entidadId es requerido' });
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Obtener localizaciones de la entidad
    const { data: entidadLocalizaciones, error: elError } = await userSupabase
      .schema(dbSchema)
      .from('entidad_localizacion')
      .select('localizacionid')
      .eq('entidadid', entidadId)
      .eq('statusid', 1);
    
    if (elError) throw elError;
    
    const locIds = (entidadLocalizaciones || []).map(el => el.localizacionid);
    
    if (locIds.length === 0) {
      return res.json([]);
    }
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
      .schema(dbSchema)
      .from('medicion')
      .select(`
        *,
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          nodo:nodoid(nodoid, nodo),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `)
      .in('localizacionid', locIds);
    
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
    const transformed = (data || []).map(m => ({
      ...m,
      localizacion: m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /mediciones-con-entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SENSOR_VALOR (staging table para datos LoRaWAN)
// ============================================================================

router.get('/sensor_valor', async (req, res) => {
  try {
    const { id_device, limit = 100 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    let query = userSupabase
      .schema(dbSchema)
      .from('sensor_valor')
      .select('*');
    
    if (id_device) {
      query = query.eq('id_device', id_device);
    }
    
    query = query.order('fecha', { ascending: false }).limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /sensor_valor:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sensor_valor', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('sensor_valor')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /sensor_valor:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SENSOR_VALOR_ERROR (log de errores)
// ============================================================================

router.get('/sensor_valor_error', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('sensor_valor_error')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /sensor_valor_error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ÚLTIMAS MEDICIONES POR LOTE (optimizado para dashboard)
// ============================================================================

router.get('/ultimas-mediciones-por-lote', async (req, res) => {
  try {
    const { fundoIds, metricaId, startDate, endDate } = req.query;
    
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
    if (!ubicaciones || ubicaciones.length === 0) {
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
    if (!nodos || nodos.length === 0) {
      return res.json([]);
    }
    
    const nodoIds = nodos.map(n => n.nodoid);
    
    // Paso 3: Obtener localizaciones
    let locQuery = userSupabase
      .schema(dbSchema)
      .from('localizacion')
      .select('localizacionid')
      .in('nodoid', nodoIds)
      .eq('statusid', 1);
    
    if (metricaId) {
      locQuery = locQuery.eq('metricaid', metricaId);
    }
    
    const { data: localizaciones, error: locError } = await locQuery;
    
    if (locError) throw locError;
    if (!localizaciones || localizaciones.length === 0) {
      return res.json([]);
    }
    
    const localizacionIds = localizaciones.map(l => l.localizacionid);
    
    // Paso 4: Obtener mediciones con joins
    let medicionQuery = userSupabase
      .schema(dbSchema)
      .from('medicion')
      .select(`
        *,
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          nodo:nodoid(nodoid, nodo),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `)
      .in('localizacionid', localizacionIds);
    
    if (startDate) {
      medicionQuery = medicionQuery.gte('fecha', startDate);
    }
    if (endDate) {
      medicionQuery = medicionQuery.lte('fecha', endDate);
    }
    
    medicionQuery = medicionQuery.order('fecha', { ascending: false }).limit(1000);
    
    const { data: mediciones, error: medicionError } = await medicionQuery;
    
    if (medicionError) throw medicionError;
    
    // Transformar datos para mantener formato compatible
    const transformed = (mediciones || []).map(m => ({
      ...m,
      localizacion: m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /ultimas-mediciones-por-lote:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
