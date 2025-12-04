/**
 * Rutas de Mediciones: medicion, sensor_valor
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, pool } = require('../config/database');
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
    
    if (countOnly) {
      let countSql = `SELECT COUNT(*) as count FROM ${dbSchema}.medicion`;
      const params = [];
      const conditions = [];
      
      if (localizacionId) {
        conditions.push(`localizacionid = $${params.length + 1}`);
        params.push(localizacionId);
      }
      if (startDate) {
        conditions.push(`fecha >= $${params.length + 1}`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`fecha <= $${params.length + 1}`);
        params.push(endDate);
      }
      
      if (conditions.length > 0) {
        countSql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const result = await pool.query(countSql, params);
      return res.json({ count: parseInt(result.rows[0].count) });
    }
    
    let sql = `
      SELECT m.*,
             json_build_object(
               'localizacionid', l.localizacionid,
               'localizacion', l.localizacion,
               'latitud', l.latitud,
               'longitud', l.longitud,
               'nodoid', l.nodoid,
               'metricaid', l.metricaid,
               'nodo', json_build_object('nodoid', n.nodoid, 'nodo', n.nodo, 'ubicacionid', n.ubicacionid),
               'metrica', json_build_object('metricaid', me.metricaid, 'metrica', me.metrica, 'unidad', me.unidad)
             ) as localizacion
      FROM ${dbSchema}.medicion m
      LEFT JOIN ${dbSchema}.localizacion l ON m.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica me ON l.metricaid = me.metricaid
    `;
    
    const params = [];
    const conditions = [];
    
    if (localizacionId) {
      conditions.push(`m.localizacionid = $${params.length + 1}`);
      params.push(localizacionId);
    }
    if (startDate) {
      conditions.push(`m.fecha >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`m.fecha <= $${params.length + 1}`);
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY m.fecha DESC`;
    
    if (!getAll) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    
    // Si hay nodoid, obtener localizaciones de ese nodo
    if (nodoid) {
      const locResult = await pool.query(
        `SELECT localizacionid FROM ${dbSchema}.localizacion WHERE nodoid = $1 AND statusid = 1`,
        [nodoid]
      );
      locIds = locResult.rows.map(l => l.localizacionid);
      
      if (locIds.length === 0) {
        return res.json([]);
      }
    }
    
    let sql = `
      SELECT m.*,
             json_build_object(
               'localizacionid', l.localizacionid,
               'localizacion', l.localizacion,
               'nodoid', l.nodoid,
               'metricaid', l.metricaid,
               'nodo', json_build_object('nodoid', n.nodoid, 'nodo', n.nodo),
               'metrica', json_build_object('metricaid', me.metricaid, 'metrica', me.metrica, 'unidad', me.unidad)
             ) as localizacion
      FROM ${dbSchema}.medicion m
      LEFT JOIN ${dbSchema}.localizacion l ON m.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica me ON l.metricaid = me.metricaid
    `;
    
    const params = [];
    const conditions = [];
    
    if (nodoid && locIds.length > 0) {
      conditions.push(`m.localizacionid = ANY($${params.length + 1})`);
      params.push(locIds);
    } else if (localizacionId) {
      conditions.push(`m.localizacionid = $${params.length + 1}`);
      params.push(localizacionId);
    }
    
    if (startDate) {
      conditions.push(`m.fecha >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`m.fecha <= $${params.length + 1}`);
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY m.fecha DESC`;
    
    if (!getAll) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    
    // Obtener localizaciones de la entidad
    const locResult = await pool.query(
      `SELECT localizacionid FROM ${dbSchema}.entidad_localizacion WHERE entidadid = $1 AND statusid = 1`,
      [entidadId]
    );
    
    const locIds = locResult.rows.map(el => el.localizacionid);
    
    if (locIds.length === 0) {
      return res.json([]);
    }
    
    let sql = `
      SELECT m.*,
             json_build_object(
               'localizacionid', l.localizacionid,
               'localizacion', l.localizacion,
               'nodo', json_build_object('nodoid', n.nodoid, 'nodo', n.nodo),
               'metrica', json_build_object('metricaid', me.metricaid, 'metrica', me.metrica, 'unidad', me.unidad)
             ) as localizacion
      FROM ${dbSchema}.medicion m
      LEFT JOIN ${dbSchema}.localizacion l ON m.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica me ON l.metricaid = me.metricaid
      WHERE m.localizacionid = ANY($1)
    `;
    
    const params = [locIds];
    
    if (startDate) {
      sql += ` AND m.fecha >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND m.fecha <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY m.fecha DESC LIMIT ${parseInt(limit)}`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    
    let sql = `SELECT * FROM ${dbSchema}.sensor_valor`;
    const params = [];
    
    if (id_device) {
      sql += ` WHERE id_device = $1`;
      params.push(id_device);
    }
    
    sql += ` ORDER BY fecha DESC LIMIT ${parseInt(limit)}`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /sensor_valor:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sensor_valor', async (req, res) => {
  try {
    const { data, error } = await db.insert('sensor_valor', req.body);
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
    
    const result = await pool.query(
      `SELECT * FROM ${dbSchema}.sensor_valor_error ORDER BY fecha DESC LIMIT ${parseInt(limit)}`
    );
    res.json(result.rows || []);
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
    
    // Query complejo con CTEs
    let sql = `
      WITH ubicaciones AS (
        SELECT ubicacionid FROM ${dbSchema}.ubicacion WHERE fundoid = ANY($1) AND statusid = 1
      ),
      nodos AS (
        SELECT nodoid FROM ${dbSchema}.nodo WHERE ubicacionid IN (SELECT ubicacionid FROM ubicaciones) AND statusid = 1
      ),
      locs AS (
        SELECT localizacionid FROM ${dbSchema}.localizacion 
        WHERE nodoid IN (SELECT nodoid FROM nodos) AND statusid = 1
        ${metricaId ? 'AND metricaid = $2' : ''}
      )
      SELECT m.*,
             json_build_object(
               'localizacionid', l.localizacionid,
               'localizacion', l.localizacion,
               'nodo', json_build_object('nodoid', n.nodoid, 'nodo', n.nodo),
               'metrica', json_build_object('metricaid', me.metricaid, 'metrica', me.metrica, 'unidad', me.unidad)
             ) as localizacion
      FROM ${dbSchema}.medicion m
      JOIN ${dbSchema}.localizacion l ON m.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica me ON l.metricaid = me.metricaid
      WHERE m.localizacionid IN (SELECT localizacionid FROM locs)
    `;
    
    const params = [fundoIdArray];
    let paramIdx = 2;
    
    if (metricaId) {
      params.push(metricaId);
      paramIdx++;
    }
    
    if (startDate) {
      sql += ` AND m.fecha >= $${paramIdx}`;
      params.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      sql += ` AND m.fecha <= $${paramIdx}`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY m.fecha DESC LIMIT 1000`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /ultimas-mediciones-por-lote:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
