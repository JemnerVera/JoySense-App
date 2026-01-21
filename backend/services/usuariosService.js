/**
 * Servicio de Usuarios: usuario, perfil, contacto, correo, usuarioperfil, codigotelefono
 * Maneja la lógica de negocio y el acceso a datos vía Supabase
 */

const { dbSchema, supabase: baseSupabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const { isValidEmail } = require('../utils/validation');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

/**
 * Obtener lista de usuarios con paginación y filtros
 */
const getUsuarios = async (supabase, queryParams) => {
  return await paginateAndFilter('usuario', { ...queryParams, sortBy: 'usuarioid' }, supabase);
};

/**
 * Obtener metadatos de columnas de una tabla
 */
const getColumns = async (tableName, supabase) => {
  const metadata = await getTableMetadata(tableName, supabase);
  return metadata.columns;
};

/**
 * Crear un nuevo usuario
 */
const createUsuario = async (supabase, userData) => {
  const { login, password, ...otherData } = userData;
  
  if (!isValidEmail(login)) {
    throw new Error('El login debe ser un email válido');
  }
  
  const password_hash = await bcrypt.hash(password || 'temporal123', 10);
  
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('usuario')
    .insert({ login, password_hash, ...otherData })
    .select();
  
  if (error) {
    // Si hay error de clave duplicada en usuarioid, la secuencia está desincronizada
    if (error.code === '23505' && error.message?.includes('usuario_pkey')) {
      logger.error('❌ Error: Secuencia de usuarioid desincronizada');
      throw new Error('Error al crear usuario: la secuencia de IDs está desincronizada. Por favor, contacta al administrador.');
    }
    throw error;
  }
  
  return data && data[0];
};

/**
 * Sincronizar usuario con Supabase Auth
 */
const syncAuth = async (supabase, usuarioid) => {
  logger.info(`🔄 Sincronizando usuario ${usuarioid} con Supabase Auth...`);
  
  const { data: syncResult, error: syncError } = await supabase
    .schema('joysense')
    .rpc('fn_sync_usuario_con_auth_wait', {
      p_usuarioid: usuarioid,
      p_max_attempts: 6,
      p_sleep_ms: 250
    });

  if (syncResult && !syncError) {
    const { data: updatedData, error: updateError } = await supabase
      .schema(dbSchema)
      .from('usuario')
      .select('*')
      .eq('usuarioid', usuarioid)
      .single();

    if (!updateError && updatedData) {
      logger.info(`✅ Usuario sincronizado exitosamente. useruuid: ${syncResult}`);
      return { 
        success: true, 
        useruuid: syncResult, 
        usuario: updatedData,
        syncStatus: 'success'
      };
    } else {
      logger.warn('⚠️ Usuario sincronizado pero no se pudo obtener datos actualizados:', updateError);
      return { 
        success: true, 
        useruuid: syncResult, 
        syncStatus: 'pending',
        error: updateError
      };
    }
  } else {
    logger.warn('⚠️ Sincronización pendiente o fallida:', syncError);
    return { 
      success: false, 
      syncStatus: 'pending', 
      error: syncError 
    };
  }
};

/**
 * Actualizar un usuario
 */
const updateUsuario = async (supabase, id, updateData) => {
  const { password, ...dataToUpdate } = updateData;
  
  if (password) {
    dataToUpdate.password_hash = await bcrypt.hash(password, 10);
  }
  
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('usuario')
    .update(dataToUpdate)
    .eq('usuarioid', id)
    .select();
  
  if (error) throw error;
  return data;
};

/**
 * Autenticación de usuario (Login)
 */
const login = async (loginName, password) => {
  const { data: usuarios, error } = await baseSupabase
    .schema(dbSchema)
    .from('usuario')
    .select('*')
    .eq('login', loginName)
    .eq('statusid', 1)
    .limit(1);
  
  if (error) throw error;
  
  if (!usuarios || usuarios.length === 0) {
    throw new Error('Usuario no encontrado');
  }
  
  const usuario = usuarios[0];
  const passwordValid = await bcrypt.compare(password, usuario.password_hash);
  
  if (!passwordValid) {
    throw new Error('Contraseña incorrecta');
  }
  
  const { password_hash, ...userWithoutPassword } = usuario;
  return userWithoutPassword;
};

/**
 * Obtener perfiles
 */
const getPerfiles = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('perfil')
    .select('*, jefe:jefeid(perfilid, perfil, nivel)')
    .order('nivel', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(p => ({
    ...p,
    jefe: p.jefe ? (Array.isArray(p.jefe) ? p.jefe[0] : p.jefe) : null
  }));
};

/**
 * Crear perfil
 */
const createPerfil = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('perfil')
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Actualizar perfil
 */
const updatePerfil = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('perfil')
    .update(data)
    .eq('perfilid', id)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Obtener usuario perfiles
 */
const getUsuarioPerfiles = async (supabase, { usuarioId, perfilId }) => {
  let query = supabase
    .schema(dbSchema)
    .from('usuarioperfil')
    .select(`
      *,
      usuario:usuarioid(usuarioid, login, firstname, lastname),
      perfil:perfilid(perfilid, perfil, nivel)
    `);
  
  if (usuarioId) query = query.eq('usuarioid', usuarioId);
  if (perfilId) query = query.eq('perfilid', perfilId);
  
  query = query.order('usuarioid', { ascending: true });
  
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map(up => ({
    ...up,
    usuario: up.usuario ? (Array.isArray(up.usuario) ? up.usuario[0] : up.usuario) : null,
    perfil: up.perfil ? (Array.isArray(up.perfil) ? up.perfil[0] : up.perfil) : null
  }));
};

/**
 * Crear usuario perfil
 */
const createUsuarioPerfil = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('usuarioperfil')
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Actualizar usuario perfil (compuesto)
 */
const updateUsuarioPerfilComposite = async (supabase, usuarioid, perfilid, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('usuarioperfil')
    .update(data)
    .eq('usuarioid', usuarioid)
    .eq('perfilid', perfilid)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Obtener códigos de teléfono
 */
const getCodigosTelefono = async (supabase) => {
  const { data, error } = await supabase
    .schema(dbSchema)
    .from('codigotelefono')
    .select('*')
    .order('paistelefono', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Crear código de teléfono
 */
const createCodigoTelefono = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('codigotelefono')
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Actualizar código de teléfono
 */
const updateCodigoTelefono = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('codigotelefono')
    .update(data)
    .eq('codigotelefonoid', id)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Obtener contactos
 */
const getContactos = async (supabase, { usuarioId }) => {
  let query = supabase
    .schema(dbSchema)
    .from('contacto')
    .select(`
      *,
      usuario:usuarioid(usuarioid, login, firstname, lastname),
      codigotelefono:codigotelefonoid(codigotelefonoid, codigotelefono, paistelefono)
    `);
  
  if (usuarioId) query = query.eq('usuarioid', usuarioId);
  
  query = query.order('contactoid', { ascending: true });
  
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map(c => ({
    ...c,
    usuario: c.usuario ? (Array.isArray(c.usuario) ? c.usuario[0] : c.usuario) : null,
    codigotelefono: c.codigotelefono ? (Array.isArray(c.codigotelefono) ? c.codigotelefono[0] : c.codigotelefono) : null
  }));
};

/**
 * Crear contacto
 */
const createContacto = async (supabase, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('contacto')
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Actualizar contacto
 */
const updateContacto = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('contacto')
    .update(data)
    .eq('contactoid', id)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Obtener correos
 */
const getCorreos = async (supabase, { usuarioId }) => {
  let query = supabase
    .schema(dbSchema)
    .from('correo')
    .select('*, usuario:usuarioid(usuarioid, login, firstname, lastname)');
  
  if (usuarioId) query = query.eq('usuarioid', usuarioId);
  
  query = query.order('correoid', { ascending: true });
  
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map(c => ({
    ...c,
    usuario: c.usuario ? (Array.isArray(c.usuario) ? c.usuario[0] : c.usuario) : null
  }));
};

/**
 * Crear correo
 */
const createCorreo = async (supabase, data) => {
  const { correo, usuarioid } = data;
  
  if (!isValidEmail(correo)) {
    throw new Error('El correo debe ser un email válido');
  }
  
  if (!usuarioid) {
    throw new Error('Debe especificar un usuario');
  }
  
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('correo')
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Actualizar correo
 */
const updateCorreo = async (supabase, id, data) => {
  const { data: result, error } = await supabase
    .schema(dbSchema)
    .from('correo')
    .update(data)
    .eq('correoid', id)
    .select();
  
  if (error) throw error;
  return result;
};

/**
 * Búsqueda general de usuarios
 */
const search = async (supabase, query) => {
  if (!query || query.length < 2) return [];
  
  const searchTerm = `%${query}%`;
  
  const [res1, res2, res3] = await Promise.all([
    supabase.schema(dbSchema).from('usuario').select('usuarioid, login, firstname, lastname, statusid').ilike('login', searchTerm).eq('statusid', 1).limit(50),
    supabase.schema(dbSchema).from('usuario').select('usuarioid, login, firstname, lastname, statusid').ilike('firstname', searchTerm).eq('statusid', 1).limit(50),
    supabase.schema(dbSchema).from('usuario').select('usuarioid, login, firstname, lastname, statusid').ilike('lastname', searchTerm).eq('statusid', 1).limit(50)
  ]);
  
  if (res1.error) throw res1.error;
  if (res2.error) throw res2.error;
  if (res3.error) throw res3.error;
  
  const all = [...(res1.data || []), ...(res2.data || []), ...(res3.data || [])];
  const unique = Array.from(new Map(all.map(u => [u.usuarioid, u])).values());
  
  return unique
    .sort((a, b) => (a.firstname || '').toLowerCase().localeCompare((b.firstname || '').toLowerCase()))
    .slice(0, 50)
    .map(u => {
      const fullName = [u.firstname, u.lastname].filter(Boolean).join(' ') || 'Sin nombre';
      return {
        usuarioid: u.usuarioid,
        login: u.login,
        firstname: u.firstname,
        lastname: u.lastname,
        label: `${fullName} - ${u.login}`,
        displayName: fullName
      };
    });
};

/**
 * Búsqueda de usuarios con información de empresas
 */
const searchWithEmpresas = async (supabase, query, excludeWithProfiles) => {
  if (!query || query.length < 2) return [];
  
  const { data, error } = await supabase
    .schema('joysense')
    .rpc('fn_obtener_usuarios_con_empresas', {
      p_query: query,
      p_exclude_with_profiles: excludeWithProfiles === 'true' || excludeWithProfiles === true
    });
  
  if (error) throw error;
  
  return (data || []).map(u => ({
    usuarioid: u.usuarioid,
    firstname: u.firstname,
    lastname: u.lastname,
    login: u.login,
    label: u.label || `${u.display_name || u.firstname || ''} ${u.lastname || ''} - ${u.empresas || 'Sin empresa'}`.trim(),
    displayName: u.display_name || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.login
  }));
};

module.exports = {
  getUsuarios,
  getColumns,
  createUsuario,
  syncAuth,
  updateUsuario,
  login,
  getPerfiles,
  createPerfil,
  updatePerfil,
  getUsuarioPerfiles,
  createUsuarioPerfil,
  updateUsuarioPerfilComposite,
  getCodigosTelefono,
  createCodigoTelefono,
  updateCodigoTelefono,
  getContactos,
  createContacto,
  updateContacto,
  getCorreos,
  createCorreo,
  updateCorreo,
  search,
  searchWithEmpresas
};
