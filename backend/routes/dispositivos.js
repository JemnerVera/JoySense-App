/**
 * Rutas de Dispositivos: nodo, sensor, metrica, tipo, localizacion, metricasensor
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const logger = require('../utils/logger');

// ============================================================================
// NODO (ahora tiene ubicacionid directamente)
// ============================================================================

router.get('/nodo', async (req, res) => {
  try {
    const { ubicacionId } = req.query;
    
    let query = supabase
      .from('nodo')
      .select(`
        *,
        ubicacion:ubicacionid(
          ubicacionid,
          ubicacion,
          fundoid,
          fundo:fundoid(fundoid, fundo, empresaid)
        )
      `)
      .order('nodoid');
    
    if (ubicacionId) {
      query = query.eq('ubicacionid', ubicacionId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /nodo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/nodos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('nodo')
      .select('*')
      .order('nodoid');
    
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('sensor')
      .select(`
        *,
        tipo:tipoid(tipoid, tipo)
      `)
      .order('sensorid');
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const result = await paginateAndFilter('tipo', { ...req.query, sortBy: 'tipoid' });
    res.json(result);
  } catch (error) {
    logger.error('Error en GET /tipo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/tipos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tipo')
      .select('*')
      .order('tipoid');
    
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('metrica')
      .select('*')
      .order('metricaid');
    
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    
    let query = supabase
      .from('metricasensor')
      .select(`
        *,
        sensor:sensorid(sensorid, tipoid),
        metrica:metricaid(metricaid, metrica, unidad)
      `)
      .order('sensorid');
    
    if (sensorId) {
      query = query.eq('sensorid', sensorId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    
    const { data, error } = await supabase
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
    
    let query = supabase
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
      `)
      .order('localizacionid');
    
    if (nodoid) {
      query = query.eq('nodoid', nodoid);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/localizaciones', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('localizacion')
      .select(`
        *,
        nodo:nodoid(nodoid, nodo),
        metrica:metricaid(metricaid, metrica)
      `)
      .order('localizacionid');
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('asociacion')
      .select(`
        *,
        localizacion:localizacionid(localizacionid, localizacion)
      `)
      .order('asociacionid');
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    
    const { data, error } = await supabase
      .from('localizacion')
      .select(`
        localizacionid,
        localizacion,
        latitud,
        longitud,
        referencia,
        nodo:nodoid(
          nodoid,
          nodo,
          descripcion,
          ubicacion:ubicacionid(
            ubicacionid,
            ubicacion,
            fundo:fundoid(fundoid, fundo)
          )
        ),
        metrica:metricaid(metricaid, metrica, unidad)
      `)
      .not('latitud', 'is', null)
      .not('longitud', 'is', null)
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /nodos-con-localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

