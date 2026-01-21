/**
 * Controlador de Usuarios
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */

const usuariosService = require('../services/usuariosService');
const { supabase: baseSupabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Obtener usuarios
 */
const getUsuarios = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.getUsuarios(userSupabase, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getUsuarios:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener columnas de usuario
 */
const getUsuarioColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await usuariosService.getColumns('usuario', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getUsuarioColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear usuario
 */
const postUsuario = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const newUsuario = await usuariosService.createUsuario(userSupabase, req.body);
    
    if (newUsuario && newUsuario.usuarioid) {
      const syncResult = await usuariosService.syncAuth(userSupabase, newUsuario.usuarioid);
      
      if (syncResult.success && syncResult.syncStatus === 'success') {
        return res.status(201).json({
          ...syncResult.usuario,
          syncStatus: 'success',
          syncMessage: 'Usuario creado y sincronizado exitosamente'
        });
      } else {
        return res.status(201).json({
          ...newUsuario,
          syncStatus: syncResult.syncStatus || 'pending',
          syncMessage: syncResult.error ? `Usuario creado pero error en sincronización: ${syncResult.error.message}` : 'Usuario creado pero sincronización pendiente',
          syncError: syncResult.error ? syncResult.error.message : null
        });
      }
    }
    
    res.status(201).json(newUsuario);
  } catch (error) {
    logger.error('Error en postUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar usuario
 */
const putUsuario = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.updateUsuario(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putUsuario:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Sincronizar usuario manualmente
 */
const syncAuth = async (req, res) => {
  try {
    const usuarioid = parseInt(req.params.id);
    if (!usuarioid || isNaN(usuarioid)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    
    const userSupabase = req.supabase || baseSupabase;
    const syncResult = await usuariosService.syncAuth(userSupabase, usuarioid);
    
    if (syncResult.success && syncResult.syncStatus === 'success') {
      res.json({
        success: true,
        useruuid: syncResult.useruuid,
        usuario: syncResult.usuario
      });
    } else {
      res.status(202).json({
        success: false,
        message: 'Sincronización pendiente. El proceso continuará en segundo plano.',
        error: syncResult.error ? syncResult.error.message : 'Sincronización aún en proceso'
      });
    }
  } catch (error) {
    logger.error('Error en syncAuth:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Login
 */
const login = async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await usuariosService.login(login, password);
    res.json({ user });
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(401).json({ error: error.message });
  }
};

/**
 * Obtener perfiles
 */
const getPerfiles = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.getPerfiles(userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en getPerfiles:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Columnas de perfil
 */
const getPerfilColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await usuariosService.getColumns('perfil', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getPerfilColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear perfil
 */
const postPerfil = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.createPerfil(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postPerfil:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar perfil
 */
const putPerfil = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.updatePerfil(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putPerfil:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener usuario-perfiles
 */
const getUsuarioPerfiles = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.getUsuarioPerfiles(userSupabase, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getUsuarioPerfiles:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Columnas de usuario-perfil
 */
const getUsuarioPerfilColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await usuariosService.getColumns('usuarioperfil', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getUsuarioPerfilColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear usuario-perfil
 */
const postUsuarioPerfil = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.createUsuarioPerfil(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postUsuarioPerfil:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar usuario-perfil (compuesto)
 */
const putUsuarioPerfilComposite = async (req, res) => {
  try {
    const { usuarioid, perfilid } = req.query;
    if (!usuarioid || !perfilid) {
      return res.status(400).json({ error: 'Se requieren usuarioid y perfilid' });
    }
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.updateUsuarioPerfilComposite(userSupabase, usuarioid, perfilid, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putUsuarioPerfilComposite:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener códigos de teléfono
 */
const getCodigosTelefono = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.getCodigosTelefono(userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en getCodigosTelefono:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Columnas de código de teléfono
 */
const getCodigoTelefonoColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await usuariosService.getColumns('codigotelefono', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getCodigoTelefonoColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear código de teléfono
 */
const postCodigoTelefono = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.createCodigoTelefono(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postCodigoTelefono:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar código de teléfono
 */
const putCodigoTelefono = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.updateCodigoTelefono(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putCodigoTelefono:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener contactos
 */
const getContactos = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.getContactos(userSupabase, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getContactos:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Columnas de contacto
 */
const getContactoColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await usuariosService.getColumns('contacto', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getContactoColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear contacto
 */
const postContacto = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.createContacto(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postContacto:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar contacto
 */
const putContacto = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.updateContacto(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putContacto:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener correos
 */
const getCorreos = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.getCorreos(userSupabase, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getCorreos:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Columnas de correo
 */
const getCorreoColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await usuariosService.getColumns('correo', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getCorreoColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear correo
 */
const postCorreo = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.createCorreo(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postCorreo:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar correo
 */
const putCorreo = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.updateCorreo(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putCorreo:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Búsqueda de usuarios
 */
const search = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await usuariosService.search(userSupabase, req.query.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en search:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Búsqueda de usuarios con empresas
 */
const searchWithEmpresas = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const { query, excludeWithProfiles } = req.query;
    const result = await usuariosService.searchWithEmpresas(userSupabase, query, excludeWithProfiles);
    res.json(result);
  } catch (error) {
    logger.error('Error en searchWithEmpresas:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsuarios,
  getUsuarioColumns,
  postUsuario,
  putUsuario,
  syncAuth,
  login,
  getPerfiles,
  getPerfilColumns,
  postPerfil,
  putPerfil,
  getUsuarioPerfiles,
  getUsuarioPerfilColumns,
  postUsuarioPerfil,
  putUsuarioPerfilComposite,
  getCodigosTelefono,
  getCodigoTelefonoColumns,
  postCodigoTelefono,
  putCodigoTelefono,
  getContactos,
  getContactoColumns,
  postContacto,
  putContacto,
  getCorreos,
  getCorreoColumns,
  postCorreo,
  putCorreo,
  search,
  searchWithEmpresas
};
