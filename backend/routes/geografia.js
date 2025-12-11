/**
 * Rutas de Geografía: pais, empresa, fundo, ubicacion
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, supabase: baseSupabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// PAIS
// ============================================================================

router.get('/pais', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const result = await paginateAndFilter('pais', { ...req.query, sortBy: 'paisid' }, userSupabase);
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
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('pais').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /pais:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/pais/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('pais').update(req.body).eq('paisid', req.params.id).select();
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
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // DEBUG: Log detallado
    logger.info(`🔍 [GET /empresa] Schema: ${dbSchema}, PaisId: ${paisId || 'ninguno'}`);
    logger.info(`🔍 [GET /empresa] Usando token de usuario: ${userSupabase !== baseSupabase ? 'SÍ' : 'NO'}`);
    
    // Usar Supabase API con join usando RPC o queries separadas
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    let query = userSupabase
      .schema(dbSchema)
      .from('empresa')
      .select('*, pais:paisid(paisid, pais, paisabrev)');
    
    if (paisId) {
      query = query.eq('paisid', paisId);
    }
    
    query = query.order('empresaid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      logger.error(`❌ [GET /empresa] Error: ${error.message}`);
      logger.error(`❌ [GET /empresa] Code: ${error.code || 'N/A'}, Details: ${error.details || 'N/A'}, Hint: ${error.hint || 'N/A'}`);
      throw error;
    }
    
    logger.info(`🔍 [GET /empresa] Registros devueltos: ${(data || []).length}`);
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(emp => ({
      ...emp,
      pais: emp.pais ? (Array.isArray(emp.pais) ? emp.pais[0] : emp.pais) : null
    }));
    
    res.json(transformed);
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
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('empresa').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/empresa/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('empresa').update(req.body).eq('empresaid', req.params.id).select();
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
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // DEBUG: Log detallado
    logger.info(`🔍 [GET /fundo] Schema: ${dbSchema}, EmpresaId: ${empresaId || 'ninguno'}`);
    logger.info(`🔍 [GET /fundo] Usando token de usuario: ${userSupabase !== baseSupabase ? 'SÍ' : 'NO'}`);
    
    // Usar Supabase API con joins anidados
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    let query = userSupabase
      .schema(dbSchema)
      .from('fundo')
      .select('*, empresa:empresaid(empresaid, empresa, empresabrev, paisid, pais:paisid(paisid, pais, paisabrev))');
    
    if (empresaId) {
      query = query.eq('empresaid', empresaId);
    }
    
    query = query.order('fundoid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      logger.error(`❌ [GET /fundo] Error: ${error.message}`);
      logger.error(`❌ [GET /fundo] Code: ${error.code || 'N/A'}, Details: ${error.details || 'N/A'}, Hint: ${error.hint || 'N/A'}`);
      throw error;
    }
    
    logger.info(`🔍 [GET /fundo] Registros devueltos: ${(data || []).length}`);
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(fundo => ({
      ...fundo,
      empresa: fundo.empresa ? (Array.isArray(fundo.empresa) ? fundo.empresa[0] : fundo.empresa) : null
    }));
    
    res.json(transformed);
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
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('fundo').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /fundo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/fundo/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('fundo').update(req.body).eq('fundoid', req.params.id).select();
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
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    // Usar Supabase API con joins anidados
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    let query = userSupabase
      .schema(dbSchema)
      .from('ubicacion')
      .select('*, fundo:fundoid(fundoid, fundo, fundoabrev, empresaid, empresa:empresaid(empresaid, empresa, paisid, pais:paisid(paisid, pais)))');
    
    if (fundoId) {
      query = query.eq('fundoid', fundoId);
    }
    
    query = query.order('ubicacionid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(ubic => ({
      ...ubic,
      fundo: ubic.fundo ? (Array.isArray(ubic.fundo) ? ubic.fundo[0] : ubic.fundo) : null
    }));
    
    res.json(transformed);
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
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('ubicacion').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /ubicacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/ubicacion/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('ubicacion').update(req.body).eq('ubicacionid', req.params.id).select();
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
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const result = await paginateAndFilter('entidad', { ...req.query, sortBy: 'entidadid' }, userSupabase);
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
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('entidad').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/entidad/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('entidad').update(req.body).eq('entidadid', req.params.id).select();
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
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    // Usar Supabase API con joins
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('entidad_localizacion')
      .select('*, entidad:entidadid(entidadid, entidad), localizacion:localizacionid(localizacionid, localizacion)')
      .order('entidadid', { ascending: true });
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(el => ({
      ...el,
      entidad: el.entidad ? (Array.isArray(el.entidad) ? el.entidad[0] : el.entidad) : null,
      localizacion: el.localizacion ? (Array.isArray(el.localizacion) ? el.localizacion[0] : el.localizacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /entidad_localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/entidad_localizacion', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from('entidad_localizacion').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /entidad_localizacion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
