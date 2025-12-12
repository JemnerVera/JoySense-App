/**
 * Rutas de Usuarios: usuario, perfil, contacto, correo, usuarioperfil, codigotelefono
 * Versión Supabase API con RLS
 */

const express = require('express');
const router = express.Router();
const { dbSchema, supabase: baseSupabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const { isValidEmail } = require('../utils/validation');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// USUARIO
// ============================================================================

router.get('/usuario', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const result = await paginateAndFilter('usuario', { ...req.query, sortBy: 'usuarioid' }, userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en GET /usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/usuario/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('usuario');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /usuario/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/usuario', async (req, res) => {
  try {
    const { login, password, ...otherData } = req.body;
    
    if (!isValidEmail(login)) {
      return res.status(400).json({ error: 'El login debe ser un email válido' });
    }
    
    const password_hash = await bcrypt.hash(password || 'temporal123', 10);
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('usuario')
      .insert({ login, password_hash, ...otherData })
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/usuario/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('usuario')
      .update(updateData)
      .eq('usuarioid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/usuario/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    // Esta ruta es pública (no requiere token), usar baseSupabase
    const { data: usuarios, error } = await baseSupabase
      .schema(dbSchema)
      .from('usuario')
      .select('*')
      .eq('login', login)
      .eq('statusid', 1)
      .limit(1);
    
    if (error) throw error;
    
    if (!usuarios || usuarios.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    const usuario = usuarios[0];
    const passwordValid = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    delete usuario.password_hash;
    res.json({ user: usuario });
  } catch (error) {
    logger.error('Error en POST /usuario/login:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PERFIL
// ============================================================================

router.get('/perfil', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con join anidado para obtener el jefe
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('perfil')
      .select('*, jefe:jefeid(perfilid, perfil, nivel)')
      .order('nivel', { ascending: true });
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(p => ({
      ...p,
      jefe: p.jefe ? (Array.isArray(p.jefe) ? p.jefe[0] : p.jefe) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/perfil/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('perfil');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /perfil/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/perfil', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('perfil')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/perfil/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('perfil')
      .update(req.body)
      .eq('perfilid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USUARIOPERFIL
// ============================================================================

router.get('/usuarioperfil', async (req, res) => {
  try {
    const { usuarioId, perfilId } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
      .schema(dbSchema)
      .from('usuarioperfil')
      .select(`
        *,
        usuario:usuarioid(usuarioid, login, firstname, lastname),
        perfil:perfilid(perfilid, perfil, nivel)
      `);
    
    if (usuarioId) {
      query = query.eq('usuarioid', usuarioId);
    }
    if (perfilId) {
      query = query.eq('perfilid', perfilId);
    }
    
    query = query.order('usuarioid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(up => ({
      ...up,
      usuario: up.usuario ? (Array.isArray(up.usuario) ? up.usuario[0] : up.usuario) : null,
      perfil: up.perfil ? (Array.isArray(up.perfil) ? up.perfil[0] : up.perfil) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /usuarioperfil:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/usuarioperfil/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('usuarioperfil');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /usuarioperfil/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/usuarioperfil', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('usuarioperfil')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /usuarioperfil:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/usuarioperfil/composite', async (req, res) => {
  try {
    const { usuarioid, perfilid } = req.query;
    
    if (!usuarioid || !perfilid) {
      return res.status(400).json({ error: 'Se requieren usuarioid y perfilid en el query string' });
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('usuarioperfil')
      .update(req.body)
      .eq('usuarioid', usuarioid)
      .eq('perfilid', perfilid)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /usuarioperfil/composite:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CODIGOTELEFONO
// ============================================================================

router.get('/codigotelefono', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('codigotelefono')
      .select('*')
      .order('paistelefono', { ascending: true });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /codigotelefono:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/codigotelefono/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('codigotelefono');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /codigotelefono/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/codigotelefono', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('codigotelefono')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /codigotelefono:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/codigotelefono/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('codigotelefono')
      .update(req.body)
      .eq('codigotelefonoid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /codigotelefono:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CONTACTO
// ============================================================================

router.get('/contacto', async (req, res) => {
  try {
    const { usuarioId } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con joins anidados
    let query = userSupabase
      .schema(dbSchema)
      .from('contacto')
      .select(`
        *,
        usuario:usuarioid(usuarioid, login, firstname, lastname),
        codigotelefono:codigotelefonoid(codigotelefonoid, codigotelefono, paistelefono)
      `);
    
    if (usuarioId) {
      query = query.eq('usuarioid', usuarioId);
    }
    
    query = query.order('contactoid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(c => ({
      ...c,
      usuario: c.usuario ? (Array.isArray(c.usuario) ? c.usuario[0] : c.usuario) : null,
      codigotelefono: c.codigotelefono ? (Array.isArray(c.codigotelefono) ? c.codigotelefono[0] : c.codigotelefono) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /contacto:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/contacto/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('contacto');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /contacto/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/contacto', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('contacto')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /contacto:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/contacto/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('contacto')
      .update(req.body)
      .eq('contactoid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /contacto:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CORREO
// ============================================================================

router.get('/correo', async (req, res) => {
  try {
    const { usuarioId } = req.query;
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Usar Supabase API con join anidado
    let query = userSupabase
      .schema(dbSchema)
      .from('correo')
      .select('*, usuario:usuarioid(usuarioid, login, firstname, lastname)');
    
    if (usuarioId) {
      query = query.eq('usuarioid', usuarioId);
    }
    
    query = query.order('correoid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(c => ({
      ...c,
      usuario: c.usuario ? (Array.isArray(c.usuario) ? c.usuario[0] : c.usuario) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /correo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/correo/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('correo');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /correo/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/correo', async (req, res) => {
  try {
    const { correo } = req.body;
    
    if (!isValidEmail(correo)) {
      return res.status(400).json({ error: 'El correo debe ser un email válido' });
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('correo')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /correo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/correo/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('correo')
      .update(req.body)
      .eq('correoid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /correo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PERFIL_GEOGRAFIA_PERMISO
// ============================================================================

router.get('/perfil_geografia_permiso', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { perfilId } = req.query;
    
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    let query = userSupabase
      .schema(dbSchema)
      .from('perfil_geografia_permiso')
      .select(`
        *,
        perfil:perfilid(perfilid, perfil),
        pais:paisid(paisid, pais),
        empresa:empresaid(empresaid, empresa),
        fundo:fundoid(fundoid, fundo),
        ubicacion:ubicacionid(ubicacionid, ubicacion)
      `);
    
    if (perfilId) {
      query = query.eq('perfilid', perfilId);
    }
    
    query = query.order('permisoid', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transformar datos para mantener formato compatible
    const transformed = (data || []).map(el => ({
      ...el,
      perfil: el.perfil ? (Array.isArray(el.perfil) ? el.perfil[0] : el.perfil) : null,
      pais: el.pais ? (Array.isArray(el.pais) ? el.pais[0] : el.pais) : null,
      empresa: el.empresa ? (Array.isArray(el.empresa) ? el.empresa[0] : el.empresa) : null,
      fundo: el.fundo ? (Array.isArray(el.fundo) ? el.fundo[0] : el.fundo) : null,
      ubicacion: el.ubicacion ? (Array.isArray(el.ubicacion) ? el.ubicacion[0] : el.ubicacion) : null
    }));
    
    res.json(transformed);
  } catch (error) {
    logger.error('Error en GET /perfil_geografia_permiso:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/perfil_geografia_permiso/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('perfil_geografia_permiso');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /perfil_geografia_permiso/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/perfil_geografia_permiso', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('perfil_geografia_permiso')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /perfil_geografia_permiso:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/perfil_geografia_permiso/:id', async (req, res) => {
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    const { data, error } = await userSupabase
      .schema(dbSchema)
      .from('perfil_geografia_permiso')
      .update(req.body)
      .eq('permisoid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /perfil_geografia_permiso:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
