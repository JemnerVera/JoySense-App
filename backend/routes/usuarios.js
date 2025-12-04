/**
 * Rutas de Usuarios: usuario, perfil, contacto, correo, usuarioperfil, codigotelefono
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const { isValidEmail } = require('../utils/validation');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

// ============================================================================
// USUARIO
// ============================================================================

router.get('/usuario', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .order('usuarioid');
    
    if (error) throw error;
    res.json(data || []);
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
    
    // Validar email
    if (!isValidEmail(login)) {
      return res.status(400).json({ error: 'El login debe ser un email válido' });
    }
    
    // Hashear password
    const password_hash = await bcrypt.hash(password || 'temporal123', 10);
    
    const { data, error } = await supabase
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
    
    // Si hay password nuevo, hashearlo
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }
    
    const { data, error } = await supabase
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

// Login de usuario
router.post('/usuario/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    // Buscar usuario
    const { data: usuarios, error } = await supabase
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
    
    // Verificar password
    const passwordValid = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // No devolver el hash
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
    const { data, error } = await supabase
      .from('perfil')
      .select(`
        *,
        jefe:jefeid(perfilid, perfil, nivel)
      `)
      .order('nivel');
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    
    let query = supabase
      .from('usuarioperfil')
      .select(`
        *,
        usuario:usuarioid(usuarioid, login, firstname, lastname),
        perfil:perfilid(perfilid, perfil, nivel)
      `)
      .order('usuarioid');
    
    if (usuarioId) query = query.eq('usuarioid', usuarioId);
    if (perfilId) query = query.eq('perfilid', perfilId);
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('codigotelefono')
      .select('*')
      .order('paistelefono');
    
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
// CONTACTO (ahora solo teléfonos)
// ============================================================================

router.get('/contacto', async (req, res) => {
  try {
    const { usuarioId } = req.query;
    
    let query = supabase
      .from('contacto')
      .select(`
        *,
        usuario:usuarioid(usuarioid, login, firstname, lastname),
        codigotelefono:codigotelefonoid(codigotelefonoid, codigotelefono, paistelefono)
      `)
      .order('contactoid');
    
    if (usuarioId) {
      query = query.eq('usuarioid', usuarioId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
// CORREO (nueva tabla separada)
// ============================================================================

router.get('/correo', async (req, res) => {
  try {
    const { usuarioId } = req.query;
    
    let query = supabase
      .from('correo')
      .select(`
        *,
        usuario:usuarioid(usuarioid, login, firstname, lastname)
      `)
      .order('correoid');
    
    if (usuarioId) {
      query = query.eq('usuarioid', usuarioId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
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
    
    // Validar email
    if (!isValidEmail(correo)) {
      return res.status(400).json({ error: 'El correo debe ser un email válido' });
    }
    
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { perfilId } = req.query;
    
    let query = supabase
      .from('perfil_geografia_permiso')
      .select(`
        *,
        perfil:perfilid(perfilid, perfil),
        pais:paisid(paisid, pais),
        empresa:empresaid(empresaid, empresa),
        fundo:fundoid(fundoid, fundo),
        ubicacion:ubicacionid(ubicacionid, ubicacion)
      `)
      .order('permisoid');
    
    if (perfilId) {
      query = query.eq('perfilid', perfilId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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

