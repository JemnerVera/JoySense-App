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
      startDate, 
      endDate, 
      limit = 1000,
      getAll,
      countOnly 
    } = req.query;
    
    // Aceptar tanto localizacionId como localizacionid para compatibilidad
    const localizacionId = req.query.localizacionId || req.query.localizacionid;
    
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
          ),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `);
    
    if (localizacionId) {
      // Manejar múltiples IDs separados por coma
      const ids = String(localizacionId).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 1) {
        query = query.in('localizacionid', ids);
      } else if (ids.length === 1) {
        query = query.eq('localizacionid', ids[0]);
      }
    }
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    query = query.order('fecha', { ascending: false });
    
    if (!getAll) {
      const finalLimit = parseInt(limit);
      console.log(`[backend] Applying limit: ${finalLimit}`);
      query = query.limit(finalLimit);
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
      nodoid,
      startDate, 
      endDate, 
      limit = 1000,
      getAll
    } = req.query;
    
    console.log(`[backend] GET /mediciones - nodoid: ${nodoid}, limit: ${limit}, startDate: ${startDate}, endDate: ${endDate}`);
    
    // Aceptar tanto localizacionId como localizacionid para compatibilidad
    const localizacionId = req.query.localizacionId || req.query.localizacionid;
    
    let locIds = [];
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Si hay nodoid, obtener localizaciones de ese nodo
    if (nodoid) {
      console.log(`[backend] Fetching mediciones for nodoid: ${nodoid}`);
      const { data: localizaciones, error: locError } = await userSupabase
        .schema(dbSchema)
        .from('localizacion')
        .select('localizacionid')
        .eq('nodoid', nodoid)
        .eq('statusid', 1);
      
      if (locError) {
        console.error(`[backend] Error fetching localizaciones for nodoid ${nodoid}:`, locError);
        throw locError;
      }
      
      locIds = (localizaciones || []).map(l => l.localizacionid);
      console.log(`[backend] Found ${locIds.length} localizaciones for nodoid ${nodoid}:`, locIds);
      
      if (locIds.length === 0) {
        // Log if any localizations exist at all for this node
        const { data: anyLocs } = await userSupabase
          .schema(dbSchema)
          .from('localizacion')
          .select('localizacionid, statusid')
          .eq('nodoid', nodoid);
        console.log(`[backend] ALL localizaciones for nodoid ${nodoid}:`, anyLocs);
        return res.json([]);
      }
    }
    
    // Usar Supabase API con joins anidados
    // NOTA: localizacion no tiene FK directa a metrica, la relación es a través de metricasensor
    // Por ahora, no hacemos join a metrica desde localizacion, la obtendremos por separado si es necesario
    // Tampoco podemos hacer join directo a sensor desde localizacion, lo obtendremos por separado
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
    
    if (nodoid && locIds.length > 0) {
      query = query.in('localizacionid', locIds);
    } else if (localizacionId) {
      // Manejar múltiples IDs separados por coma
      const ids = String(localizacionId).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 1) {
        query = query.in('localizacionid', ids);
      } else if (ids.length === 1) {
        query = query.eq('localizacionid', ids[0]);
      }
    }
    
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    query = query.order('fecha', { ascending: false });
    
    // Si el límite es mayor a 1000, realizar peticiones paginadas para superar el límite de PostgREST
    let allData = [];
    const finalLimit = getAll ? 50000 : parseInt(limit);
    const CHUNK_SIZE = 1000;
    let currentOffset = 0;

    console.log(`[backend] Starting chunked fetch. finalLimit: ${finalLimit}`);

    while (allData.length < finalLimit) {
      const remainingLimit = finalLimit - allData.length;
      const nextLimit = Math.min(CHUNK_SIZE, remainingLimit);
      
      // IMPORTANTE: .range(from, to) es inclusivo en ambos extremos
      const { data: chunk, error: chunkError } = await query
        .range(currentOffset, currentOffset + nextLimit - 1);

      if (chunkError) {
        console.error(`[backend] Error fetching chunk at offset ${currentOffset}:`, chunkError);
        throw chunkError;
      }

      if (!chunk || chunk.length === 0) {
        console.log(`[backend] No more data found at offset ${currentOffset}`);
        break;
      }

      allData = allData.concat(chunk);
      console.log(`[backend] Fetched chunk: ${chunk.length} items. Total so far: ${allData.length}`);
      
      if (chunk.length < nextLimit) {
        console.log(`[backend] Chunk smaller than requested (${chunk.length} < ${nextLimit}), ending fetch`);
        break;
      }
      
      currentOffset += nextLimit;
      
      if (currentOffset >= 50000) {
        console.warn(`[backend] Safety limit reached (50000). Stopping fetch.`);
        break;
      }
    }

    const data = allData;
    console.log(`[backend] Found ${data?.length || 0} total mediciones for query`);
    
    // Obtener métricas por separado (ya que la relación es a través de metricasensor)
    const metricaIds = [...new Set(
      (data || [])
        .map(m => m.localizacion?.metricaid)
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
      
      if (metError) {
        // No debug log
      } else {
        (metricas || []).forEach(m => {
          metricasMap.set(m.metricaid, m);
        });
      }
    }
    
    // Obtener sensores por separado (para obtener tipoid)
    const sensorIds = [...new Set(
      (data || [])
        .map(m => {
          const loc = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null;
          return loc?.sensorid;
        })
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
      
      if (senError) {
        // No debug log
      } else {
        (sensores || []).forEach(s => {
          sensoresMap.set(s.sensorid, s);
        });
      }
    }
    
    // Transformar datos para mantener formato compatible y agregar métricas y sensores
    const transformed = (data || []).map(m => {
      const localizacion = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null;
      const metrica = localizacion?.metricaid ? metricasMap.get(localizacion.metricaid) : null;
      const sensor = localizacion?.sensorid ? sensoresMap.get(localizacion.sensorid) : null;
      
      return {
        ...m,
        localizacion: localizacion ? {
          ...localizacion,
          metrica: metrica,
          sensor: sensor
        } : null
      };
    });
    
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
    
    // Aceptar tanto localizacionId como localizacionid para compatibilidad
    const localizacionId = req.query.localizacionId || req.query.localizacionid;
    
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
          nodoid,
          metricaid,
          sensorid,
          nodo:nodoid(
            nodoid, 
            nodo,
            latitud,
            longitud,
            referencia
          ),
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
    
    query = query.order('fecha', { ascending: false });

    // Si el límite es mayor a 1000, realizar peticiones paginadas para superar el límite de PostgREST
    let allData = [];
    const finalLimit = parseInt(limit);
    const CHUNK_SIZE = 1000;
    let currentOffset = 0;

    while (allData.length < finalLimit) {
      const remainingLimit = finalLimit - allData.length;
      const nextLimit = Math.min(CHUNK_SIZE, remainingLimit);
      
      const { data: chunk, error: chunkError } = await query
        .range(currentOffset, currentOffset + nextLimit - 1);

      if (chunkError) {
        console.error(`[backend] Error fetching chunk for entidad at offset ${currentOffset}:`, chunkError);
        throw chunkError;
      }

      if (!chunk || chunk.length === 0) break;

      allData = allData.concat(chunk);
      if (chunk.length < nextLimit) break;
      currentOffset += nextLimit;
      if (currentOffset > 50000) break; 
    }

    const data = allData;
    
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
    // NOTA: Similar a /mediciones, no podemos hacer join directo a sensor desde localizacion
    let medicionQuery = userSupabase
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
    
    if (startDate) {
      medicionQuery = medicionQuery.gte('fecha', startDate);
    }
    if (endDate) {
      medicionQuery = medicionQuery.lte('fecha', endDate);
    }
    
    medicionQuery = medicionQuery.order('fecha', { ascending: false }).limit(1000);
    
    const { data: mediciones, error: medicionError } = await medicionQuery;
    
    if (medicionError) throw medicionError;
    
    // Obtener métricas por separado (ya que la relación es a través de metricasensor)
    const metricaIds = [...new Set(
      (mediciones || [])
        .map(m => {
          const loc = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null;
          return loc?.metricaid;
        })
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
      (mediciones || [])
        .map(m => {
          const loc = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null;
          return loc?.sensorid;
        })
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
    const transformed = (mediciones || []).map(m => {
      const localizacion = m.localizacion ? (Array.isArray(m.localizacion) ? m.localizacion[0] : m.localizacion) : null;
      const metrica = localizacion?.metricaid ? metricasMap.get(localizacion.metricaid) : null;
      const sensor = localizacion?.sensorid ? sensoresMap.get(localizacion.sensorid) : null;
      
      return {
        ...m,
        localizacion: localizacion ? {
          ...localizacion,
          metrica: metrica,
          sensor: sensor
        } : null
      };
    });
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /ultimas-mediciones-por-lote:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
