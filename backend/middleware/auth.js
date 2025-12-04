/**
 * Middleware de Autenticación
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Verifica token de autenticación
 */
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido' });
  }

  const token = authHeader.substring(7);
    
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Error verificando token:', error);
    return res.status(401).json({ error: 'Error verificando token' });
  }
}

/**
 * Middleware opcional - no falla si no hay token
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);
    
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }
  
  next();
}

module.exports = {
  verifyAuth,
  optionalAuth
};

