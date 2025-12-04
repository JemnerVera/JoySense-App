/**
 * Rutas de Mediciones: medicion, sensor_valor
 * NUEVO MODELO: medicion solo tiene localizacionid
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { paginateAndFilter } = require('../utils/pagination');
const logger = require('../utils/logger');

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
    
    let query = supabase
      .from('medicion')
      .select(`
        *,
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          latitud,
          longitud,
          nodo:nodoid(nodoid, nodo, ubicacionid),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `, { count: countOnly ? 'exact' : undefined });
    
    // Filtros
    if (localizacionId) {
      query = query.eq('localizacionid', localizacionId);
    }
    
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    // Ordenar
    query = query.order('fecha', { ascending: false });
    
    // Limitar
    if (!getAll && !countOnly) {
      query = query.limit(parseInt(limit));
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    if (countOnly) {
      return res.json({ count: count || 0 });
    }
    
    res.json(data || []);
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
      metricaId,
      ubicacionId,
      startDate, 
      endDate, 
      limit = 1000,
      getAll,
      countOnly 
    } = req.query;
    
    // Si hay nodoid, necesitamos filtrar por localizaciones de ese nodo
    if (nodoid) {
      // Primero obtenemos las localizaciones del nodo
      const { data: localizaciones, error: locError } = await supabase
        .from('localizacion')
        .select('localizacionid')
        .eq('nodoid', nodoid)
        .eq('statusid', 1);
      
      if (locError) throw locError;
      
      const locIds = localizaciones.map(l => l.localizacionid);
      
      if (locIds.length === 0) {
        return res.json([]);
      }
      
      let query = supabase
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
        `)
        .in('localizacionid', locIds);
      
      if (startDate) query = query.gte('fecha', startDate);
      if (endDate) query = query.lte('fecha', endDate);
      
      query = query.order('fecha', { ascending: false });
      
      if (!getAll) {
        query = query.limit(parseInt(limit));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return res.json(data || []);
    }
    
    // Query normal
    let query = supabase
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
      `, { count: countOnly ? 'exact' : undefined });
    
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
    
    if (!getAll && !countOnly) {
      query = query.limit(parseInt(limit));
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    if (countOnly) {
      return res.json({ count: count || 0 });
    }
    
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /mediciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mediciones con entidad (filtra por entidad_localizacion)
router.get('/mediciones-con-entidad', async (req, res) => {
  try {
    const { entidadId, startDate, endDate, limit = 1000 } = req.query;
    
    if (!entidadId) {
      return res.status(400).json({ error: 'entidadId es requerido' });
    }
    
    // Obtener localizaciones de la entidad
    const { data: entidadLocs, error: elError } = await supabase
      .from('entidad_localizacion')
      .select('localizacionid')
      .eq('entidadid', entidadId)
      .eq('statusid', 1);
    
    if (elError) throw elError;
    
    const locIds = entidadLocs.map(el => el.localizacionid);
    
    if (locIds.length === 0) {
      return res.json([]);
    }
    
    let query = supabase
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
    
    if (startDate) query = query.gte('fecha', startDate);
    if (endDate) query = query.lte('fecha', endDate);
    
    query = query.order('fecha', { ascending: false }).limit(parseInt(limit));
    
    const { data, error } = await query;
    if (error) throw error;
    
    res.json(data || []);
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
    
    let query = supabase
      .from('sensor_valor')
      .select('*')
      .order('fecha', { ascending: false });
    
    if (id_device) {
      query = query.eq('id_device', id_device);
    }
    
    query = query.limit(parseInt(limit));
    
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
    // Este endpoint es para insertar datos de sensores
    // El trigger fn_insertar_medicion() procesará automáticamente
    const { data, error } = await supabase
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
    
    const { data, error } = await supabase
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
    
    // Obtener ubicaciones de los fundos
    const { data: ubicaciones, error: ubError } = await supabase
      .from('ubicacion')
      .select('ubicacionid')
      .in('fundoid', fundoIdArray)
      .eq('statusid', 1);
    
    if (ubError) throw ubError;
    
    const ubicacionIds = ubicaciones.map(u => u.ubicacionid);
    
    if (ubicacionIds.length === 0) {
      return res.json([]);
    }
    
    // Obtener nodos de esas ubicaciones
    const { data: nodos, error: nodoError } = await supabase
      .from('nodo')
      .select('nodoid')
      .in('ubicacionid', ubicacionIds)
      .eq('statusid', 1);
    
    if (nodoError) throw nodoError;
    
    const nodoIds = nodos.map(n => n.nodoid);
    
    if (nodoIds.length === 0) {
      return res.json([]);
    }
    
    // Obtener localizaciones
    let locQuery = supabase
      .from('localizacion')
      .select('localizacionid')
      .in('nodoid', nodoIds)
      .eq('statusid', 1);
    
    if (metricaId) {
      locQuery = locQuery.eq('metricaid', metricaId);
    }
    
    const { data: localizaciones, error: locError } = await locQuery;
    
    if (locError) throw locError;
    
    const locIds = localizaciones.map(l => l.localizacionid);
    
    if (locIds.length === 0) {
      return res.json([]);
    }
    
    // Obtener últimas mediciones
    let medQuery = supabase
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
    
    if (startDate) medQuery = medQuery.gte('fecha', startDate);
    if (endDate) medQuery = medQuery.lte('fecha', endDate);
    
    medQuery = medQuery.order('fecha', { ascending: false }).limit(1000);
    
    const { data, error } = await medQuery;
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /ultimas-mediciones-por-lote:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

