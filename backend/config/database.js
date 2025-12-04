/**
 * Configuración de Base de Datos - PostgreSQL Directo
 * Schema: joysense
 * Usuario: backend_user
 */

require('dotenv').config();
const { Pool } = require('pg');

const dbSchema = process.env.DB_SCHEMA || 'joysense';

// Configuración de PostgreSQL
let pool;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL si está disponible
  console.log('📦 Usando DATABASE_URL para conexión');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else if (process.env.DB_HOST && process.env.DB_PASSWORD) {
  // Usar parámetros separados
  console.log('📦 Usando parámetros individuales para conexión');
  const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'backend_user',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
  pool = new Pool(dbConfig);
} else {
  console.error('❌ ERROR: Se requiere DATABASE_URL o (DB_HOST + DB_PASSWORD)');
  console.error('   Opción 1: DATABASE_URL=postgresql://user:pass@host:port/db');
  console.error('   Opción 2: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  process.exit(1);
}

// Establecer search_path al schema joysense por defecto
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${dbSchema}, public`);
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

console.log(`✅ Pool PostgreSQL configurado para schema: ${dbSchema}`);

// ============================================================================
// HELPERS PARA QUERIES (compatibilidad con estilo Supabase)
// ============================================================================

/**
 * Query helper - ejecuta una query SQL
 * @param {string} text - SQL query
 * @param {Array} params - Parámetros
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * SELECT helper
 * @param {string} table - Nombre de la tabla
 * @param {Object} options - Opciones de query
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function select(table, options = {}) {
  const {
    columns = '*',
    where = {},
    orderBy = null,
    limit = null,
    offset = null
  } = options;

  let sql = `SELECT ${columns} FROM ${dbSchema}.${table}`;
  const params = [];
  let paramIndex = 1;

  // WHERE clause
  const whereKeys = Object.keys(where);
  if (whereKeys.length > 0) {
    const whereClauses = whereKeys.map(key => {
      params.push(where[key]);
      return `${key} = $${paramIndex++}`;
    });
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // ORDER BY
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  // LIMIT
  if (limit) {
    sql += ` LIMIT ${parseInt(limit)}`;
  }

  // OFFSET
  if (offset) {
    sql += ` OFFSET ${parseInt(offset)}`;
  }

  return query(sql, params);
}

/**
 * INSERT helper
 * @param {string} table - Nombre de la tabla
 * @param {Object} data - Datos a insertar
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `INSERT INTO ${dbSchema}.${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  
  return query(sql, values);
}

/**
 * UPDATE helper
 * @param {string} table - Nombre de la tabla
 * @param {Object} data - Datos a actualizar
 * @param {Object} where - Condiciones WHERE
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function update(table, data, where) {
  const dataKeys = Object.keys(data);
  const whereKeys = Object.keys(where);
  
  let paramIndex = 1;
  const setClauses = dataKeys.map(key => `${key} = $${paramIndex++}`);
  const whereClauses = whereKeys.map(key => `${key} = $${paramIndex++}`);
  
  const sql = `UPDATE ${dbSchema}.${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
  const params = [...Object.values(data), ...Object.values(where)];
  
  return query(sql, params);
}

/**
 * DELETE helper
 * @param {string} table - Nombre de la tabla
 * @param {Object} where - Condiciones WHERE
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function remove(table, where) {
  const whereKeys = Object.keys(where);
  const whereClauses = whereKeys.map((key, i) => `${key} = $${i + 1}`);
  
  const sql = `DELETE FROM ${dbSchema}.${table} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
  
  return query(sql, Object.values(where));
}

/**
 * RPC helper - ejecuta una función almacenada
 * @param {string} functionName - Nombre de la función
 * @param {Object} params - Parámetros de la función
 * @returns {Promise<{data: any, error: Error|null}>}
 */
async function rpc(functionName, params = {}) {
  const paramKeys = Object.keys(params);
  const paramValues = Object.values(params);
  const placeholders = paramKeys.map((key, i) => `${key} := $${i + 1}`).join(', ');
  
  const sql = `SELECT ${dbSchema}.${functionName}(${placeholders})`;
  
  try {
    const result = await pool.query(sql, paramValues);
    // Las funciones retornan en la primera columna
    const data = result.rows[0] ? result.rows[0][functionName] : null;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * COUNT helper
 * @param {string} table - Nombre de la tabla
 * @param {Object} where - Condiciones WHERE opcionales
 * @returns {Promise<{count: number, error: Error|null}>}
 */
async function count(table, where = {}) {
  let sql = `SELECT COUNT(*) as count FROM ${dbSchema}.${table}`;
  const params = [];
  let paramIndex = 1;

  const whereKeys = Object.keys(where);
  if (whereKeys.length > 0) {
    const whereClauses = whereKeys.map(key => {
      params.push(where[key]);
      return `${key} = $${paramIndex++}`;
    });
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  try {
    const result = await pool.query(sql, params);
    return { count: parseInt(result.rows[0].count), error: null };
  } catch (error) {
    return { count: 0, error };
  }
}

// ============================================================================
// OBJETO DB PARA COMPATIBILIDAD
// ============================================================================

const db = {
  query,
  select,
  insert,
  update,
  delete: remove,
  rpc,
  count,
  pool,
  schema: dbSchema
};

module.exports = {
  pool,
  db,
  dbSchema,
  query,
  select,
  insert,
  update,
  delete: remove,
  rpc,
  count
};
