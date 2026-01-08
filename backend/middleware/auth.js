/**
 * Middleware de Autenticación
 * Versión Supabase API
 * 
 * IMPORTANTE: El frontend se autentica con Supabase Auth y envía el token de sesión.
 * El backend usa ese token para crear un cliente de Supabase con el contexto del usuario.
 * Esto permite que las políticas RLS usen auth.uid() correctamente.
 */

const { supabase: baseSupabase, dbSchema } = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Obtener configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Verifica autenticación usando token de Supabase
 * El token viene del frontend después de que el usuario se autentica con Supabase Auth
 */
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido' });
  }

  const token = authHeader.substring(7);
  
  try {
    // Crear cliente de Supabase con el token del usuario
    // IMPORTANTE: Usar global.headers para que RLS funcione correctamente
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Verificar que el token es válido obteniendo el usuario
    const { data: { user }, error: getUserError } = await userSupabase.auth.getUser();
    
    if (getUserError || !user) {
      logger.error(`❌ [verifyAuth] Token inválido: ${getUserError?.message || 'Usuario no encontrado'}`);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    
    // IMPORTANTE: Para que RLS funcione, el token debe estar en cada request
    // El cliente ya está configurado con global.headers, así que debería funcionar
    
    // Crear cliente de Supabase con el contexto del usuario para este request
    req.supabase = userSupabase;
    req.user = {
      id: user.id, // UUID del usuario en auth.users
      email: user.email,
      user_metadata: user.user_metadata || {}
    };
    
    next();
  } catch (error) {
    logger.error('Error verificando autenticación:', error);
    return res.status(401).json({ error: 'Error verificando autenticación' });
  }
}

/**
 * Middleware opcional - no falla si no hay token
 * Útil para endpoints que pueden funcionar con o sin autenticación
 * Si hay token, crea un cliente de Supabase con el contexto del usuario
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.info(`[DEBUG] optionalAuth: No hay header Authorization, usando cliente base`);
    req.user = null;
    req.supabase = baseSupabase; // Usar cliente base sin autenticación
    return next();
  }

  const token = authHeader.substring(7);
  
  if (!token || token.length === 0) {
    logger.warn(`[DEBUG] optionalAuth: Token vacío después de extraer Bearer`);
    req.user = null;
    req.supabase = baseSupabase;
    return next();
  }
  
  try {
    // Crear cliente de Supabase con el token del usuario
    // IMPORTANTE: Usar global.headers para que RLS funcione correctamente
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Verificar que el token es válido y obtener el usuario
    const { data: { user }, error: getUserError } = await userSupabase.auth.getUser();
    
    if (getUserError || !user) {
      logger.warn(`⚠️ [optionalAuth] Token inválido o sin usuario: ${getUserError?.message || 'Usuario no encontrado'}`);
      req.user = null;
      req.supabase = baseSupabase; // Usar cliente base sin autenticación
      return next();
    }
    
    // IMPORTANTE: Para que RLS funcione, el token debe estar en cada request
    // El cliente ya está configurado con global.headers, así que debería funcionar
    
    // Crear cliente de Supabase con el contexto del usuario para este request
    req.supabase = userSupabase;
    req.user = {
      id: user.id, // UUID del usuario en auth.users
      email: user.email,
      user_metadata: user.user_metadata || {}
    };
  } catch (error) {
    logger.error('Error en autenticación opcional:', error);
    req.user = null;
    req.supabase = baseSupabase; // Usar cliente base sin autenticación
  }
  
  next();
}

module.exports = {
  verifyAuth,
  optionalAuth
};
