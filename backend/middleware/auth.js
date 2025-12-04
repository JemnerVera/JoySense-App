/**
 * Middleware de Autenticación
 * Compatible con PostgreSQL directo (sin Supabase client)
 */

const { pool, dbSchema } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Verifica autenticación básica
 * Por ahora solo verifica que el header existe
 * TODO: Implementar JWT si se requiere autenticación stateless
 */
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido' });
  }

  const token = authHeader.substring(7);
  
  try {
    // Por ahora, el token es el email del usuario
    // En producción, implementar JWT
    const result = await pool.query(
      `SELECT usuarioid, login, firstname, lastname 
       FROM ${dbSchema}.usuario 
       WHERE login = $1 AND statusid = 1`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    req.user = {
      id: result.rows[0].usuarioid,
      email: result.rows[0].login,
      user_metadata: {
        firstname: result.rows[0].firstname,
        lastname: result.rows[0].lastname
      }
    };
    next();
  } catch (error) {
    logger.error('Error verificando autenticación:', error);
    return res.status(401).json({ error: 'Error verificando autenticación' });
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
    const result = await pool.query(
      `SELECT usuarioid, login, firstname, lastname 
       FROM ${dbSchema}.usuario 
       WHERE login = $1 AND statusid = 1`,
      [token]
    );
    
    if (result.rows.length > 0) {
      req.user = {
        id: result.rows[0].usuarioid,
        email: result.rows[0].login,
        user_metadata: {
          firstname: result.rows[0].firstname,
          lastname: result.rows[0].lastname
        }
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    logger.error('Error en autenticación opcional:', error);
    req.user = null;
  }
  
  next();
}

module.exports = {
  verifyAuth,
  optionalAuth
};
