/**
 * Rutas de Geografía: pais, empresa, fundo, ubicacion
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
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
    const { data, error } = await supabase
      .from('pais')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /pais:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/pais/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pais')
      .update(req.body)
      .eq('paisid', req.params.id)
      .select();
    
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
    const { paisId, ...otherParams } = req.query;
    const params = { ...otherParams, sortBy: 'empresaid' };
    
    if (paisId) {
      params.paisid = paisId;
    }
    
    // Query con relación a pais
    const { data, error } = await supabase
      .from('empresa')
      .select(`
        *,
        pais:paisid(paisid, pais, paisabrev)
      `)
      .order('empresaid');
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
      .from('empresa')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/empresa/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('empresa')
      .update(req.body)
      .eq('empresaid', req.params.id)
      .select();
    
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
    
    let query = supabase
      .from('fundo')
      .select(`
        *,
        empresa:empresaid(
          empresaid,
          empresa,
          empresabrev,
          paisid,
          pais:paisid(paisid, pais, paisabrev)
        )
      `)
      .order('fundoid');
    
    if (empresaId) {
      query = query.eq('empresaid', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
      .from('fundo')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /fundo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/fundo/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fundo')
      .update(req.body)
      .eq('fundoid', req.params.id)
      .select();
    
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
    
    let query = supabase
      .from('ubicacion')
      .select(`
        *,
        fundo:fundoid(
          fundoid,
          fundo,
          fundoabrev,
          empresaid,
          empresa:empresaid(
            empresaid,
            empresa,
            paisid,
            pais:paisid(paisid, pais)
          )
        )
      `)
      .order('ubicacionid');
    
    if (fundoId) {
      query = query.eq('fundoid', fundoId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
      .from('ubicacion')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /ubicacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/ubicacion/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ubicacion')
      .update(req.body)
      .eq('ubicacionid', req.params.id)
      .select();
    
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
    const { data, error } = await supabase
      .from('entidad')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/entidad/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('entidad')
      .update(req.body)
      .eq('entidadid', req.params.id)
      .select();
    
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
    const { data, error } = await supabase
      .from('entidad_localizacion')
      .select(`
        *,
        entidad:entidadid(entidadid, entidad),
        localizacion:localizacionid(localizacionid, localizacion)
      `)
      .order('entidadid');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /entidad_localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/entidad_localizacion', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('entidad_localizacion')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /entidad_localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

