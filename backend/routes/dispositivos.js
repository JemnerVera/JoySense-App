/**
 * Rutas de Dispositivos: nodo, sensor, metrica, tipo, localizacion, metricasensor
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, pool } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const logger = require('../utils/logger');

// ============================================================================
// NODO (ahora tiene ubicacionid directamente)
// ============================================================================

router.get('/nodo', async (req, res) => {
  try {
    const { ubicacionId } = req.query;
    
    let sql = `
      SELECT n.*,
             json_build_object(
               'ubicacionid', u.ubicacionid,
               'ubicacion', u.ubicacion,
               'fundoid', u.fundoid,
               'fundo', json_build_object('fundoid', f.fundoid, 'fundo', f.fundo, 'empresaid', f.empresaid)
             ) as ubicacion
      FROM ${dbSchema}.nodo n
      LEFT JOIN ${dbSchema}.ubicacion u ON n.ubicacionid = u.ubicacionid
      LEFT JOIN ${dbSchema}.fundo f ON u.fundoid = f.fundoid
    `;
    
    const params = [];
    if (ubicacionId) {
      sql += ` WHERE n.ubicacionid = $1`;
      params.push(ubicacionId);
    }
    
    sql += ` ORDER BY n.nodoid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /nodo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/nodos', async (req, res) => {
  try {
    const { data, error } = await db.select('nodo', { orderBy: 'nodoid' });
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
    const { data, error } = await db.insert('nodo', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /nodo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/nodo/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('nodo', req.body, { nodoid: req.params.id });
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
    const sql = `
      SELECT s.*,
             json_build_object('tipoid', t.tipoid, 'tipo', t.tipo) as tipo
      FROM ${dbSchema}.sensor s
      LEFT JOIN ${dbSchema}.tipo t ON s.tipoid = t.tipoid
      ORDER BY s.sensorid
    `;
    
    const result = await pool.query(sql);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('sensor', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /sensor:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/sensor/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('sensor', req.body, { sensorid: req.params.id });
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
    const { data, error } = await db.select('tipo', { orderBy: 'tipoid' });
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
    const { data, error } = await db.insert('tipo', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /tipo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/tipo/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('tipo', req.body, { tipoid: req.params.id });
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
    const { data, error } = await db.select('metrica', { orderBy: 'metricaid' });
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
    const { data, error } = await db.insert('metrica', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /metrica:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/metrica/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('metrica', req.body, { metricaid: req.params.id });
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
    
    let sql = `
      SELECT ms.*,
             json_build_object('sensorid', s.sensorid, 'tipoid', s.tipoid) as sensor,
             json_build_object('metricaid', m.metricaid, 'metrica', m.metrica, 'unidad', m.unidad) as metrica
      FROM ${dbSchema}.metricasensor ms
      LEFT JOIN ${dbSchema}.sensor s ON ms.sensorid = s.sensorid
      LEFT JOIN ${dbSchema}.metrica m ON ms.metricaid = m.metricaid
    `;
    
    const params = [];
    if (sensorId) {
      sql += ` WHERE ms.sensorid = $1`;
      params.push(sensorId);
    }
    
    sql += ` ORDER BY ms.sensorid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('metricasensor', req.body);
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
    
    const result = await pool.query(
      `UPDATE ${dbSchema}.metricasensor SET ${Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ')} 
       WHERE sensorid = $${Object.keys(req.body).length + 1} AND metricaid = $${Object.keys(req.body).length + 2} 
       RETURNING *`,
      [...Object.values(req.body), sensorid, metricaid]
    );
    
    res.json(result.rows);
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
    
    let sql = `
      SELECT l.*,
             json_build_object(
               'nodoid', n.nodoid,
               'nodo', n.nodo,
               'descripcion', n.descripcion,
               'ubicacionid', n.ubicacionid,
               'ubicacion', json_build_object(
                 'ubicacionid', u.ubicacionid,
                 'ubicacion', u.ubicacion,
                 'fundoid', u.fundoid,
                 'fundo', json_build_object('fundoid', f.fundoid, 'fundo', f.fundo)
               )
             ) as nodo,
             json_build_object('metricaid', m.metricaid, 'metrica', m.metrica, 'unidad', m.unidad) as metrica,
             json_build_object('sensorid', s.sensorid, 'tipoid', s.tipoid) as sensor
      FROM ${dbSchema}.localizacion l
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.ubicacion u ON n.ubicacionid = u.ubicacionid
      LEFT JOIN ${dbSchema}.fundo f ON u.fundoid = f.fundoid
      LEFT JOIN ${dbSchema}.metrica m ON l.metricaid = m.metricaid
      LEFT JOIN ${dbSchema}.sensor s ON l.sensorid = s.sensorid
    `;
    
    const params = [];
    if (nodoid) {
      sql += ` WHERE l.nodoid = $1`;
      params.push(nodoid);
    }
    
    sql += ` ORDER BY l.localizacionid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para compatibilidad
router.get('/localizaciones', async (req, res) => {
  try {
    const sql = `
      SELECT l.*,
             json_build_object('nodoid', n.nodoid, 'nodo', n.nodo) as nodo,
             json_build_object('metricaid', m.metricaid, 'metrica', m.metrica) as metrica
      FROM ${dbSchema}.localizacion l
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica m ON l.metricaid = m.metricaid
      ORDER BY l.localizacionid
    `;
    
    const result = await pool.query(sql);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('localizacion', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/localizacion/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('localizacion', req.body, { localizacionid: req.params.id });
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
    const sql = `
      SELECT a.*,
             json_build_object('localizacionid', l.localizacionid, 'localizacion', l.localizacion) as localizacion
      FROM ${dbSchema}.asociacion a
      LEFT JOIN ${dbSchema}.localizacion l ON a.localizacionid = l.localizacionid
      ORDER BY a.asociacionid
    `;
    
    const result = await pool.query(sql);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('asociacion', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /asociacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/asociacion/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('asociacion', req.body, { asociacionid: req.params.id });
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
    
    const sql = `
      SELECT l.localizacionid, l.localizacion, l.latitud, l.longitud, l.referencia,
             json_build_object(
               'nodoid', n.nodoid,
               'nodo', n.nodo,
               'descripcion', n.descripcion,
               'ubicacion', json_build_object(
                 'ubicacionid', u.ubicacionid,
                 'ubicacion', u.ubicacion,
                 'fundo', json_build_object('fundoid', f.fundoid, 'fundo', f.fundo)
               )
             ) as nodo,
             json_build_object('metricaid', m.metricaid, 'metrica', m.metrica, 'unidad', m.unidad) as metrica
      FROM ${dbSchema}.localizacion l
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.ubicacion u ON n.ubicacionid = u.ubicacionid
      LEFT JOIN ${dbSchema}.fundo f ON u.fundoid = f.fundoid
      LEFT JOIN ${dbSchema}.metrica m ON l.metricaid = m.metricaid
      WHERE l.latitud IS NOT NULL AND l.longitud IS NOT NULL AND l.statusid = 1
      LIMIT $1
    `;
    
    const result = await pool.query(sql, [parseInt(limit)]);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /nodos-con-localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
