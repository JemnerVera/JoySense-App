/**
 * Rutas de Alertas: umbral, alerta, alertaconsolidado, criticidad, mensaje, perfilumbral
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, pool } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const logger = require('../utils/logger');

// ============================================================================
// CRITICIDAD
// ============================================================================

router.get('/criticidad', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${dbSchema}.criticidad ORDER BY grado`);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('criticidad', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /criticidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/criticidad/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('criticidad', req.body, { criticidadid: req.params.id });
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
    
    let sql = `
      SELECT u.*,
             json_build_object('criticidadid', c.criticidadid, 'criticidad', c.criticidad, 'grado', c.grado) as criticidad,
             json_build_object(
               'localizacionid', l.localizacionid,
               'localizacion', l.localizacion,
               'nodo', json_build_object('nodoid', n.nodoid, 'nodo', n.nodo),
               'metrica', json_build_object('metricaid', m.metricaid, 'metrica', m.metrica, 'unidad', m.unidad)
             ) as localizacion
      FROM ${dbSchema}.umbral u
      LEFT JOIN ${dbSchema}.criticidad c ON u.criticidadid = c.criticidadid
      LEFT JOIN ${dbSchema}.localizacion l ON u.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica m ON l.metricaid = m.metricaid
    `;
    
    const params = [];
    if (localizacionId) {
      sql += ` WHERE u.localizacionid = $1`;
      params.push(localizacionId);
    }
    
    sql += ` ORDER BY u.umbralid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('umbral', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/umbral/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('umbral', req.body, { umbralid: req.params.id });
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
    
    if (!fundoIds) {
      return res.status(400).json({ error: 'fundoIds es requerido' });
    }
    
    const fundoIdArray = fundoIds.split(',').map(Number);
    
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
      SELECT u.*,
             json_build_object('criticidadid', c.criticidadid, 'criticidad', c.criticidad) as criticidad,
             json_build_object(
               'localizacionid', l.localizacionid,
               'localizacion', l.localizacion,
               'nodo', json_build_object('nodoid', n.nodoid, 'nodo', n.nodo),
               'metrica', json_build_object('metricaid', m.metricaid, 'metrica', m.metrica)
             ) as localizacion
      FROM ${dbSchema}.umbral u
      JOIN ${dbSchema}.localizacion l ON u.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.criticidad c ON u.criticidadid = c.criticidadid
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica m ON l.metricaid = m.metricaid
      WHERE u.localizacionid IN (SELECT localizacionid FROM locs) AND u.statusid = 1
    `;
    
    const params = [fundoIdArray];
    if (metricaId) {
      params.push(metricaId);
    }
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    
    let sql = `
      SELECT a.*,
             json_build_object(
               'umbralid', u.umbralid,
               'umbral', u.umbral,
               'minimo', u.minimo,
               'maximo', u.maximo,
               'localizacion', json_build_object('localizacionid', l.localizacionid, 'localizacion', l.localizacion)
             ) as umbral,
             json_build_object('medicionid', m.medicionid, 'medicion', m.medicion, 'fecha', m.fecha) as medicion
      FROM ${dbSchema}.alerta a
      LEFT JOIN ${dbSchema}.umbral u ON a.umbralid = u.umbralid
      LEFT JOIN ${dbSchema}.localizacion l ON u.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.medicion m ON a.medicionid = m.medicionid
    `;
    
    const params = [];
    const conditions = [];
    
    if (umbralId) {
      conditions.push(`a.umbralid = $${params.length + 1}`);
      params.push(umbralId);
    }
    if (startDate) {
      conditions.push(`a.fecha >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`a.fecha <= $${params.length + 1}`);
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY a.fecha DESC LIMIT ${parseInt(limit)}`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
// ALERTACONSOLIDADO
// ============================================================================

router.get('/alertaconsolidado', async (req, res) => {
  try {
    const { statusid = 1, limit = 100 } = req.query;
    
    let sql = `
      SELECT ac.*,
             json_build_object(
               'umbralid', u.umbralid,
               'umbral', u.umbral,
               'minimo', u.minimo,
               'maximo', u.maximo,
               'criticidad', json_build_object('criticidadid', c.criticidadid, 'criticidad', c.criticidad),
               'localizacion', json_build_object(
                 'localizacionid', l.localizacionid,
                 'localizacion', l.localizacion,
                 'nodo', json_build_object('nodoid', n.nodoid, 'nodo', n.nodo),
                 'metrica', json_build_object('metricaid', m.metricaid, 'metrica', m.metrica)
               )
             ) as umbral
      FROM ${dbSchema}.alertaconsolidado ac
      LEFT JOIN ${dbSchema}.umbral u ON ac.umbralid = u.umbralid
      LEFT JOIN ${dbSchema}.criticidad c ON u.criticidadid = c.criticidadid
      LEFT JOIN ${dbSchema}.localizacion l ON u.localizacionid = l.localizacionid
      LEFT JOIN ${dbSchema}.nodo n ON l.nodoid = n.nodoid
      LEFT JOIN ${dbSchema}.metrica m ON l.metricaid = m.metricaid
      WHERE ac.statusid = $1
      ORDER BY ac.fechaultimo DESC
      LIMIT ${parseInt(limit)}
    `;
    
    const result = await pool.query(sql, [statusid]);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /alertaconsolidado:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/alertaconsolidado/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('alertaconsolidado');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /alertaconsolidado/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MENSAJE
// ============================================================================

router.get('/mensaje', async (req, res) => {
  try {
    const { tipo_origen, limit = 100 } = req.query;
    
    let sql = `
      SELECT msg.*,
             json_build_object(
               'contactoid', ct.contactoid,
               'celular', ct.celular,
               'usuario', json_build_object('usuarioid', u.usuarioid, 'login', u.login, 'firstname', u.firstname, 'lastname', u.lastname)
             ) as contacto
      FROM ${dbSchema}.mensaje msg
      LEFT JOIN ${dbSchema}.contacto ct ON msg.contactoid = ct.contactoid
      LEFT JOIN ${dbSchema}.usuario u ON ct.usuarioid = u.usuarioid
    `;
    
    const params = [];
    if (tipo_origen) {
      sql += ` WHERE msg.tipo_origen = $1`;
      params.push(tipo_origen);
    }
    
    sql += ` ORDER BY msg.fecha DESC LIMIT ${parseInt(limit)}`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
// PERFILUMBRAL
// ============================================================================

router.get('/perfilumbral', async (req, res) => {
  try {
    const { perfilId, umbralId } = req.query;
    
    let sql = `
      SELECT pu.*,
             json_build_object('perfilid', p.perfilid, 'perfil', p.perfil, 'nivel', p.nivel) as perfil,
             json_build_object('umbralid', u.umbralid, 'umbral', u.umbral) as umbral
      FROM ${dbSchema}.perfilumbral pu
      LEFT JOIN ${dbSchema}.perfil p ON pu.perfilid = p.perfilid
      LEFT JOIN ${dbSchema}.umbral u ON pu.umbralid = u.umbralid
    `;
    
    const params = [];
    const conditions = [];
    
    if (perfilId) {
      conditions.push(`pu.perfilid = $${params.length + 1}`);
      params.push(perfilId);
    }
    if (umbralId) {
      conditions.push(`pu.umbralid = $${params.length + 1}`);
      params.push(umbralId);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY pu.perfilid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /perfilumbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/perfilumbral/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('perfilumbral');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /perfilumbral/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/perfilumbral', async (req, res) => {
  try {
    const { data, error } = await db.insert('perfilumbral', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /perfilumbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/perfilumbral/composite', async (req, res) => {
  try {
    const { perfilid, umbralid } = req.query;
    
    const result = await pool.query(
      `UPDATE ${dbSchema}.perfilumbral SET ${Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ')} 
       WHERE perfilid = $${Object.keys(req.body).length + 1} AND umbralid = $${Object.keys(req.body).length + 2} 
       RETURNING *`,
      [...Object.values(req.body), perfilid, umbralid]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error en PUT /perfilumbral/composite:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AUDIT_LOG_UMBRAL
// ============================================================================

router.get('/audit_log_umbral', async (req, res) => {
  try {
    const { umbralId, limit = 100 } = req.query;
    
    let sql = `
      SELECT al.*,
             json_build_object('umbralid', u.umbralid, 'umbral', u.umbral) as umbral
      FROM ${dbSchema}.audit_log_umbral al
      LEFT JOIN ${dbSchema}.umbral u ON al.umbralid = u.umbralid
    `;
    
    const params = [];
    if (umbralId) {
      sql += ` WHERE al.umbralid = $1`;
      params.push(umbralId);
    }
    
    sql += ` ORDER BY al.modified_at DESC LIMIT ${parseInt(limit)}`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
