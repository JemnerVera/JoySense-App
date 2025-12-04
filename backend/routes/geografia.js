/**
 * Rutas de Geografía: pais, empresa, fundo, ubicacion
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, pool } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const logger = require('../utils/logger');

// ============================================================================
// PAIS
// ============================================================================

router.get('/pais', async (req, res) => {
  try {
    const result = await paginateAndFilter('pais', { ...req.query, sortBy: 'paisid' });
    res.json(result);
  } catch (error) {
    logger.error('Error en GET /pais:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pais/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('pais');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /pais/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/pais', async (req, res) => {
  try {
    const { data, error } = await db.insert('pais', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /pais:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/pais/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('pais', req.body, { paisid: req.params.id });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /pais:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EMPRESA
// ============================================================================

router.get('/empresa', async (req, res) => {
  try {
    const { paisId } = req.query;
    
    let sql = `
      SELECT e.*, 
             json_build_object('paisid', p.paisid, 'pais', p.pais, 'paisabrev', p.paisabrev) as pais
      FROM ${dbSchema}.empresa e
      LEFT JOIN ${dbSchema}.pais p ON e.paisid = p.paisid
    `;
    
    const params = [];
    if (paisId) {
      sql += ` WHERE e.paisid = $1`;
      params.push(paisId);
    }
    
    sql += ` ORDER BY e.empresaid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/empresa/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('empresa');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /empresa/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/empresa', async (req, res) => {
  try {
    const { data, error } = await db.insert('empresa', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/empresa/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('empresa', req.body, { empresaid: req.params.id });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FUNDO
// ============================================================================

router.get('/fundo', async (req, res) => {
  try {
    const { empresaId } = req.query;
    
    let sql = `
      SELECT f.*,
             json_build_object(
               'empresaid', e.empresaid, 
               'empresa', e.empresa, 
               'empresabrev', e.empresabrev,
               'paisid', e.paisid,
               'pais', json_build_object('paisid', p.paisid, 'pais', p.pais, 'paisabrev', p.paisabrev)
             ) as empresa
      FROM ${dbSchema}.fundo f
      LEFT JOIN ${dbSchema}.empresa e ON f.empresaid = e.empresaid
      LEFT JOIN ${dbSchema}.pais p ON e.paisid = p.paisid
    `;
    
    const params = [];
    if (empresaId) {
      sql += ` WHERE f.empresaid = $1`;
      params.push(empresaId);
    }
    
    sql += ` ORDER BY f.fundoid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /fundo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/fundo/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('fundo');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /fundo/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/fundo', async (req, res) => {
  try {
    const { data, error } = await db.insert('fundo', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /fundo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/fundo/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('fundo', req.body, { fundoid: req.params.id });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /fundo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// UBICACION
// ============================================================================

router.get('/ubicacion', async (req, res) => {
  try {
    const { fundoId } = req.query;
    
    let sql = `
      SELECT u.*,
             json_build_object(
               'fundoid', f.fundoid,
               'fundo', f.fundo,
               'fundoabrev', f.fundoabrev,
               'empresaid', f.empresaid,
               'empresa', json_build_object(
                 'empresaid', e.empresaid,
                 'empresa', e.empresa,
                 'paisid', e.paisid,
                 'pais', json_build_object('paisid', p.paisid, 'pais', p.pais)
               )
             ) as fundo
      FROM ${dbSchema}.ubicacion u
      LEFT JOIN ${dbSchema}.fundo f ON u.fundoid = f.fundoid
      LEFT JOIN ${dbSchema}.empresa e ON f.empresaid = e.empresaid
      LEFT JOIN ${dbSchema}.pais p ON e.paisid = p.paisid
    `;
    
    const params = [];
    if (fundoId) {
      sql += ` WHERE u.fundoid = $1`;
      params.push(fundoId);
    }
    
    sql += ` ORDER BY u.ubicacionid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /ubicacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/ubicacion/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('ubicacion');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /ubicacion/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/ubicacion', async (req, res) => {
  try {
    const { data, error } = await db.insert('ubicacion', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /ubicacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/ubicacion/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('ubicacion', req.body, { ubicacionid: req.params.id });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /ubicacion:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENTIDAD
// ============================================================================

router.get('/entidad', async (req, res) => {
  try {
    const result = await paginateAndFilter('entidad', { ...req.query, sortBy: 'entidadid' });
    res.json(result);
  } catch (error) {
    logger.error('Error en GET /entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/entidad/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('entidad');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /entidad/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/entidad', async (req, res) => {
  try {
    const { data, error } = await db.insert('entidad', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/entidad/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('entidad', req.body, { entidadid: req.params.id });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENTIDAD_LOCALIZACION (tabla de relación)
// ============================================================================

router.get('/entidad_localizacion', async (req, res) => {
  try {
    const sql = `
      SELECT el.*,
             json_build_object('entidadid', e.entidadid, 'entidad', e.entidad) as entidad,
             json_build_object('localizacionid', l.localizacionid, 'localizacion', l.localizacion) as localizacion
      FROM ${dbSchema}.entidad_localizacion el
      LEFT JOIN ${dbSchema}.entidad e ON el.entidadid = e.entidadid
      LEFT JOIN ${dbSchema}.localizacion l ON el.localizacionid = l.localizacionid
      ORDER BY el.entidadid
    `;
    
    const result = await pool.query(sql);
    res.json(result.rows || []);
  } catch (error) {
    logger.error('Error en GET /entidad_localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/entidad_localizacion', async (req, res) => {
  try {
    const { data, error } = await db.insert('entidad_localizacion', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /entidad_localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
