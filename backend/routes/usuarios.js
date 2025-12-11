/**
 * Rutas de Usuarios: usuario, perfil, contacto, correo, usuarioperfil, codigotelefono
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, pool } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const { isValidEmail } = require('../utils/validation');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

// ============================================================================
// USUARIO
// ============================================================================

router.get('/usuario', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${dbSchema}.usuario ORDER BY usuarioid`);
    res.json(result.rows || []);
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
    
    const { data, error } = await db.insert('usuario', { login, password_hash, ...otherData });
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
    
    const { data, error } = await db.update('usuario', updateData, { usuarioid: req.params.id });
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
    
    const result = await pool.query(
      `SELECT * FROM ${dbSchema}.usuario WHERE login = $1 AND statusid = 1 LIMIT 1`,
      [login]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    const usuario = result.rows[0];
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
    const sql = `
      SELECT p.*,
             json_build_object('perfilid', j.perfilid, 'perfil', j.perfil, 'nivel', j.nivel) as jefe
      FROM ${dbSchema}.perfil p
      LEFT JOIN ${dbSchema}.perfil j ON p.jefeid = j.perfilid
      ORDER BY p.nivel
    `;
    
    const result = await pool.query(sql);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('perfil', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/perfil/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('perfil', req.body, { perfilid: req.params.id });
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
    
    let sql = `
      SELECT up.*,
             json_build_object('usuarioid', u.usuarioid, 'login', u.login, 'firstname', u.firstname, 'lastname', u.lastname) as usuario,
             json_build_object('perfilid', p.perfilid, 'perfil', p.perfil, 'nivel', p.nivel) as perfil
      FROM ${dbSchema}.usuarioperfil up
      LEFT JOIN ${dbSchema}.usuario u ON up.usuarioid = u.usuarioid
      LEFT JOIN ${dbSchema}.perfil p ON up.perfilid = p.perfilid
    `;
    
    const params = [];
    const conditions = [];
    
    if (usuarioId) {
      conditions.push(`up.usuarioid = $${params.length + 1}`);
      params.push(usuarioId);
    }
    if (perfilId) {
      conditions.push(`up.perfilid = $${params.length + 1}`);
      params.push(perfilId);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY up.usuarioid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('usuarioperfil', req.body);
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
    
    const result = await pool.query(
      `UPDATE ${dbSchema}.usuarioperfil SET ${Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ')} 
       WHERE usuarioid = $${Object.keys(req.body).length + 1} AND perfilid = $${Object.keys(req.body).length + 2} 
       RETURNING *`,
      [...Object.values(req.body), usuarioid, perfilid]
    );
    
    res.json(result.rows);
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
    const result = await pool.query(`SELECT * FROM ${dbSchema}.codigotelefono ORDER BY paistelefono`);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('codigotelefono', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /codigotelefono:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/codigotelefono/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('codigotelefono', req.body, { codigotelefonoid: req.params.id });
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
    
    let sql = `
      SELECT c.*,
             json_build_object('usuarioid', u.usuarioid, 'login', u.login, 'firstname', u.firstname, 'lastname', u.lastname) as usuario,
             json_build_object('codigotelefonoid', ct.codigotelefonoid, 'codigotelefono', ct.codigotelefono, 'paistelefono', ct.paistelefono) as codigotelefono
      FROM ${dbSchema}.contacto c
      LEFT JOIN ${dbSchema}.usuario u ON c.usuarioid = u.usuarioid
      LEFT JOIN ${dbSchema}.codigotelefono ct ON c.codigotelefonoid = ct.codigotelefonoid
    `;
    
    const params = [];
    if (usuarioId) {
      sql += ` WHERE c.usuarioid = $1`;
      params.push(usuarioId);
    }
    
    sql += ` ORDER BY c.contactoid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    const { data, error } = await db.insert('contacto', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /contacto:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/contacto/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('contacto', req.body, { contactoid: req.params.id });
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
    
    let sql = `
      SELECT c.*,
             json_build_object('usuarioid', u.usuarioid, 'login', u.login, 'firstname', u.firstname, 'lastname', u.lastname) as usuario
      FROM ${dbSchema}.correo c
      LEFT JOIN ${dbSchema}.usuario u ON c.usuarioid = u.usuarioid
    `;
    
    const params = [];
    if (usuarioId) {
      sql += ` WHERE c.usuarioid = $1`;
      params.push(usuarioId);
    }
    
    sql += ` ORDER BY c.correoid`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
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
    
    const { data, error } = await db.insert('correo', req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /correo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/correo/:id', async (req, res) => {
  try {
    const { data, error } = await db.update('correo', req.body, { correoid: req.params.id });
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
    const userSupabase = req.supabase || require('../config/database').supabase;
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
    const userSupabase = req.supabase || require('../config/database').supabase;
    
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
    const userSupabase = req.supabase || require('../config/database').supabase;
    
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
