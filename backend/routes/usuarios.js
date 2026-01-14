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
    
    if (error) {
      // Si hay error de clave duplicada en usuarioid, la secuencia está desincronizada
      if (error.code === '23505' && error.message?.includes('usuario_pkey')) {
        logger.error('❌ Error: Secuencia de usuarioid desincronizada');
        logger.error('   Ejecuta el script: sql/SINCRONIZAR_SECUENCIA_USUARIOID.sql');
        return res.status(500).json({ 
          error: 'Error al crear usuario: la secuencia de IDs está desincronizada. Por favor, contacta al administrador.',
          hint: 'Ejecuta sql/SINCRONIZAR_SECUENCIA_USUARIOID.sql para sincronizar la secuencia'
        });
      }
      throw error;
    }
    
    // ========================================================================
    // SINCRONIZAR CON SUPABASE AUTH (Recomendación del DBA)
    // ========================================================================
    const newUsuario = data && data[0];
    if (newUsuario && newUsuario.usuarioid) {
      try {
        logger.info(`🔄 Sincronizando usuario ${newUsuario.usuarioid} con Supabase Auth...`);
        
        // Llamar a fn_sync_usuario_con_auth_wait según recomendación del DBA
        // IMPORTANTE: Especificar schema joysense explícitamente
        const { data: syncResult, error: syncError } = await userSupabase
          .schema('joysense')
          .rpc('fn_sync_usuario_con_auth_wait', {
            p_usuarioid: newUsuario.usuarioid,
            p_max_attempts: 6,
            p_sleep_ms: 250
          });

        if (syncResult && !syncError) {
          // La función fn_sync_usuario_con_auth_wait ya actualiza el useruuid automáticamente
          // Solo necesitamos obtener el usuario actualizado
          const { data: updatedData, error: updateError } = await userSupabase
            .schema(dbSchema)
            .from('usuario')
            .select('*')
            .eq('usuarioid', newUsuario.usuarioid)
            .single();

          if (!updateError && updatedData) {
            logger.info(`✅ Usuario sincronizado exitosamente. useruuid: ${syncResult}`);
            logger.info('   Usando funciones del DBA: fn_sync_usuario_con_auth_wait actualiza useruuid y password automáticamente');
            
            // Retornar con estado de sincronización exitosa
            return res.status(201).json({
              ...updatedData,
              syncStatus: 'success',
              syncMessage: 'Usuario creado y sincronizado exitosamente'
            });
          } else {
            logger.warn('⚠️ Usuario sincronizado pero no se pudo obtener datos actualizados:', updateError);
            // Retornar con estado pendiente aunque syncResult existe
            return res.status(201).json({
              ...data[0],
              syncStatus: 'pending',
              syncMessage: 'Usuario creado pero error al obtener datos actualizados'
            });
          }
        } else {
          // Si retorna NULL o hay error, retornar estado pendiente
          logger.warn('⚠️ Usuario creado pero sincronización pendiente:', {
            usuarioid: newUsuario.usuarioid,
            login: newUsuario.login,
            error: syncError ? syncError.message : 'Retornó NULL (puede ser normal si pg_net tarda)'
          });
          
          // Retornar con estado pendiente para que frontend pueda reintentar
          return res.status(201).json({
            ...data[0],
            syncStatus: 'pending',
            syncMessage: 'Usuario creado pero sincronización pendiente. Reintentando...',
            useruuid: null
          });
        }
      } catch (syncErr) {
        // Log error pero no fallar la creación - el trigger seguirá intentando sincronizar
        logger.error('❌ Error en sincronización automática (usuario se creó igualmente):', syncErr);
        
        // Retornar con estado de error en sincronización
        return res.status(201).json({
          ...data[0],
          syncStatus: 'error',
          syncMessage: 'Usuario creado pero error en sincronización. Puede reintentar más tarde.',
          syncError: syncErr.message
        });
      }
    }
    
    // Si no es usuario o no tiene usuarioid, retornar respuesta normal
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

// ============================================================================
// SINCRONIZAR USUARIO CON AUTH (Reintentar sincronización)
// ============================================================================

router.post('/usuario/:id/sync-auth', async (req, res) => {
  try {
    const usuarioid = parseInt(req.params.id);
    
    if (!usuarioid || isNaN(usuarioid)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    
    const userSupabase = req.supabase || baseSupabase;
    
    logger.info(`🔄 Reintentando sincronización de usuario ${usuarioid} con Supabase Auth...`);
    
    // Llamar a fn_sync_usuario_con_auth_wait (especificar schema joysense)
    const { data: syncResult, error: syncError } = await userSupabase
      .schema('joysense')
      .rpc('fn_sync_usuario_con_auth_wait', {
        p_usuarioid: usuarioid,
        p_max_attempts: 6,
        p_sleep_ms: 250
      });

    if (syncResult && !syncError) {
      // La función fn_sync_usuario_con_auth_wait ya actualiza el useruuid automáticamente
      // Solo necesitamos obtener el usuario actualizado
      const { data: updatedData, error: updateError } = await userSupabase
        .schema(dbSchema)
        .from('usuario')
        .select('*')
        .eq('usuarioid', usuarioid)
        .single();

      if (!updateError && updatedData) {
        logger.info(`✅ Usuario sincronizado exitosamente. useruuid: ${syncResult}`);
        logger.info('   Usando funciones del DBA: fn_sync_usuario_con_auth_wait actualiza useruuid y password automáticamente');
        return res.json({
          success: true,
          useruuid: syncResult,
          usuario: updatedData
        });
      } else {
        logger.warn('⚠️ Sincronización exitosa pero no se pudo obtener datos actualizados:', updateError);
        return res.status(500).json({ 
          error: 'Sincronización exitosa pero error al obtener datos actualizados',
          details: updateError 
        });
      }
    } else {
      // Retornó NULL o hubo error
      logger.warn('⚠️ Sincronización pendiente:', {
        usuarioid,
        error: syncError ? syncError.message : 'Retornó NULL (puede ser normal si pg_net tarda)'
      });
      
      return res.status(202).json({
        success: false,
        message: 'Sincronización pendiente. El proceso continuará en segundo plano.',
        error: syncError ? syncError.message : 'Retornó NULL - sincronización aún en proceso'
      });
    }
  } catch (error) {
    logger.error('❌ Error en sincronización manual:', error);
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
    const { correo, usuarioid } = req.body;
    
    if (!isValidEmail(correo)) {
      return res.status(400).json({ error: 'El correo debe ser un email válido' });
    }
    
    if (!usuarioid) {
      return res.status(400).json({ error: 'Debe especificar un usuario' });
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Insertar el nuevo correo
    // NOTA: El trigger trg_inactivar_correos_anteriores se ejecuta automáticamente
    // y inactiva todos los correos anteriores del mismo usuario cuando statusid = 1
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
// BÚSQUEDA DE USUARIOS
// ============================================================================

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    // Buscar usuarios por login, firstname o lastname
    // Hacer tres queries separadas y combinar resultados (más confiable que .or() con ilike)
    const searchTerm = `%${query}%`;
    
    const [result1, result2, result3] = await Promise.all([
      userSupabase
        .schema(dbSchema)
        .from('usuario')
        .select('usuarioid, login, firstname, lastname, statusid')
        .ilike('login', searchTerm)
        .eq('statusid', 1)
        .limit(50),
      userSupabase
        .schema(dbSchema)
        .from('usuario')
        .select('usuarioid, login, firstname, lastname, statusid')
        .ilike('firstname', searchTerm)
        .eq('statusid', 1)
        .limit(50),
      userSupabase
        .schema(dbSchema)
        .from('usuario')
        .select('usuarioid, login, firstname, lastname, statusid')
        .ilike('lastname', searchTerm)
        .eq('statusid', 1)
        .limit(50)
    ]);
    
    // Verificar errores
    if (result1.error) throw result1.error;
    if (result2.error) throw result2.error;
    if (result3.error) throw result3.error;
    
    // Combinar resultados y eliminar duplicados
    const allUsuarios = [...(result1.data || []), ...(result2.data || []), ...(result3.data || [])];
    const uniqueUsuarios = Array.from(
      new Map(allUsuarios.map(u => [u.usuarioid, u])).values()
    );
    
    // Ordenar por firstname
    const usuarios = uniqueUsuarios
      .sort((a, b) => {
        const nameA = (a.firstname || '').toLowerCase();
        const nameB = (b.firstname || '').toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .slice(0, 50); // Limitar a 50 resultados finales
    
    // Formatear resultados con label completo: "firstname lastname - login"
    const results = usuarios.map((u) => {
      const fullName = [u.firstname, u.lastname].filter(Boolean).join(' ') || 'Sin nombre';
      const label = `${fullName} - ${u.login}`;
      return {
        usuarioid: u.usuarioid,
        login: u.login,
        firstname: u.firstname,
        lastname: u.lastname,
        label: label,
        displayName: fullName // Para mostrar solo el nombre en el input
      };
    });
    
    res.json(results);
  } catch (error) {
    logger.error('Error en GET /usuarios/search:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BUSCAR USUARIOS CON EMPRESAS (para usuarioperfil)
// ============================================================================
// Busca usuarios por firstname, lastname o empresa usando función de Supabase
// que permite acceder a usuario_empresa sin permisos directos
router.get('/search-with-empresas', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const userSupabase = req.supabase || baseSupabase;
    const dbSchema = process.env.DB_SCHEMA || 'joysense';
    
    // Usar la función de Supabase que permite acceder a usuario_empresa
    // IMPORTANTE: Especificar schema joysense explícitamente
    const { data, error } = await userSupabase
      .schema('joysense')
      .rpc('fn_obtener_usuarios_con_empresas', {
        p_query: query
      });
    
    if (error) {
      logger.error('Error en RPC fn_obtener_usuarios_con_empresas:', error);
      logger.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    // Formatear resultados para el frontend
    const results = (data || []).map((u) => ({
      usuarioid: u.usuarioid,
      firstname: u.firstname,
      lastname: u.lastname,
      login: u.login,
      label: u.label || `${u.display_name || u.firstname || ''} ${u.lastname || ''} - ${u.empresas || 'Sin empresa'}`.trim(),
      displayName: u.display_name || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.login
    }));
    
    res.json(results);
  } catch (error) {
    logger.error('Error en GET /usuarios/search-with-empresas:', error);
    logger.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: error.details || null,
      hint: error.hint || null
    });
  }
});

module.exports = router;
