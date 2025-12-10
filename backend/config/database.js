/**
 * Configuración de Base de Datos - Supabase API
 * Schema: joysense
 * Usuario: admin@joysense.com (autenticado vía Supabase Auth)
 * 
 * IMPORTANTE: Usa Supabase API directamente - RLS funciona automáticamente
 * según las indicaciones del DBA: "backend_user YA NO SIRVE"
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const dbSchema = process.env.DB_SCHEMA || 'joysense';

// ============================================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@joysense.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123*';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Se requiere SUPABASE_URL y SUPABASE_ANON_KEY');
  console.error('   Agrega estas variables a tu archivo .env:');
  console.error('   SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('   SUPABASE_ANON_KEY=tu-anon-key');
  process.exit(1);
}

// Crear cliente de Supabase
// NOTA: NO especificamos el schema aquí porque causa problemas en la autenticación
// El schema 'joysense' está expuesto en Supabase API Settings, así que las queries
// automáticamente usarán ese schema cuando las tablas estén ahí
// Si necesitamos especificar el schema explícitamente, usamos .schema() en las queries
let supabase = createClient(supabaseUrl, supabaseAnonKey);

// Variable para rastrear si estamos autenticados
let isAuthenticated = false;
let isAuthenticating = false; // Prevenir múltiples intentos simultáneos
let lastAuthAttempt = 0; // Timestamp del último intento
const AUTH_RETRY_DELAY = 5000; // Esperar 5 segundos entre intentos fallidos

/**
 * Autenticar backend con admin@joysense.com
 * Se ejecuta al iniciar el servidor
 */
async function authenticateBackend() {
  try {
    logger.info(`🔐 Autenticando backend con ${adminEmail}...`);
    
    // IMPORTANTE: La autenticación NO debe especificar el schema
    // El schema solo se usa en las queries de datos, no en auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (error) {
      // Log detallado del error
      logger.error(`❌ Error de Supabase Auth: ${error.message}`);
      if (error.status) logger.error(`   Status: ${error.status}`);
      if (error.code) logger.error(`   Code: ${error.code}`);
      
      // Si el error es sobre schema durante autenticación, puede ser un problema de configuración
      if (error.message && error.message.includes('schema')) {
        logger.error(`   ⚠️  Error de schema durante autenticación`);
        logger.error(`   💡 Esto puede indicar un problema con la configuración de Supabase`);
        logger.error(`   💡 Verifica que el usuario ${adminEmail} exista en auth.users`);
        logger.error(`   💡 Verifica que el schema '${dbSchema}' esté expuesto en API Settings`);
      }
      
      // No hacer throw, solo retornar false para permitir reintentos
      logger.warn(`⚠️  Autenticación falló, se reintentará en la próxima query`);
      return false;
    }

    if (!data || !data.user) {
      logger.error(`❌ No se recibió información del usuario después de autenticación`);
      return false;
    }

    isAuthenticated = true;
    logger.info(`✅ Backend autenticado como ${adminEmail}`);
    logger.info(`   User ID: ${data.user.id}`);
    logger.info(`   Email: ${data.user.email}`);
    
    return true;
  } catch (error) {
    logger.error(`❌ Error autenticando backend: ${error.message}`);
    logger.error(`   Stack: ${error.stack}`);
    // No hacer throw aquí para permitir que el servidor inicie
    // Las queries fallarán hasta que se autentique correctamente
    return false;
  }
}

/**
 * Verificar y re-autenticar si es necesario
 */
async function ensureAuthenticated() {
  if (isAuthenticated) {
    // Verificar que la sesión sigue activa
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        logger.warn('⚠️ Sesión expirada, re-autenticando...');
        isAuthenticated = false;
        return await authenticateBackend();
      }
      
      return true;
    } catch (error) {
      logger.warn('⚠️ Error verificando sesión, re-autenticando...');
      isAuthenticated = false;
      return await authenticateBackend();
    }
  }
  
  try {
    return await authenticateBackend();
  } catch (error) {
    logger.error('❌ Error en ensureAuthenticated:', error);
    return false;
  }
}

// NOTA: Ya NO autenticamos el backend al iniciar
// El backend usará el token de sesión del usuario que viene del frontend
// Esto permite que las políticas RLS usen auth.uid() correctamente
logger.info('ℹ️  Backend configurado para usar tokens de sesión del frontend');
logger.info('   Las queries usarán el contexto del usuario autenticado desde el frontend');

console.log(`✅ Cliente Supabase configurado para schema: ${dbSchema}`);

// ============================================================================
// HELPERS PARA QUERIES (compatibilidad con estilo anterior)
// ============================================================================

/**
 * Query helper - ejecuta una query usando Supabase API
 * @param {string} text - SQL query (para compatibilidad, pero se usa Supabase API)
 * @param {Array} params - Parámetros (para compatibilidad)
 * @returns {Promise<{data: Array, error: Error|null}>}
 * 
 * NOTA: Esta función mantiene la interfaz anterior pero internamente
 * debería refactorizarse para usar métodos específicos de Supabase
 */
async function query(text, params = []) {
  try {
    await ensureAuthenticated();
    
    // NOTA: Esta función mantiene compatibilidad pero idealmente
    // debería refactorizarse para usar métodos específicos de Supabase
    // Por ahora, usamos RPC para ejecutar SQL directo si es necesario
    
    // Intentar parsear SQL básico para convertir a Supabase API
    // Por ahora, usar RPC para queries complejas
    // Para queries SQL directas, usar RPC si está disponible
    // O refactorizar para usar métodos específicos de Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_text: text,
      sql_params: params
    }).catch(async () => {
      // Si no hay RPC, intentar parsear SQL básico
      // Por ahora, retornar error indicando que se debe refactorizar
      return {
        data: null,
        error: new Error('Query SQL directa no soportada. Use métodos específicos de Supabase (select, insert, update, delete)')
      };
    });
    
    if (error) {
      logger.error(`❌ [query] Error ejecutando query: ${error.message}`);
      return { data: null, error };
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    logger.error(`❌ [query] Error inesperado: ${error.message}`);
    return { data: null, error };
  }
}

/**
 * SELECT helper - usa Supabase API
 * @param {string} table - Nombre de la tabla (sin schema, Supabase lo maneja)
 * @param {Object} options - Opciones de query
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function select(table, options = {}) {
  try {
    // Intentar autenticar, pero continuar incluso si falla
    // (puede que ya estemos autenticados desde una query anterior)
    const authResult = await ensureAuthenticated();
    if (!authResult) {
      logger.warn(`⚠️ No se pudo autenticar, pero continuando con la query (puede que ya estemos autenticados)`);
    }
    
    const {
      columns = '*',
      where = {},
      orderBy = null,
      limit = null,
      offset = null
    } = options;

    // IMPORTANTE: Debemos usar .schema() explícitamente porque las tablas están en 'joysense'
    // Sin .schema(), Supabase busca en 'public' por defecto
    let query = supabase.schema(dbSchema).from(table).select(columns);

    // WHERE clauses
    Object.keys(where).forEach(key => {
      const value = where[key];
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value !== null) {
        // Soporte para operadores: { gt: 10 }, { like: '%text%' }, etc.
        Object.keys(value).forEach(op => {
          switch (op) {
            case 'gt': query = query.gt(key, value[op]); break;
            case 'gte': query = query.gte(key, value[op]); break;
            case 'lt': query = query.lt(key, value[op]); break;
            case 'lte': query = query.lte(key, value[op]); break;
            case 'like': query = query.like(key, value[op]); break;
            case 'ilike': query = query.ilike(key, value[op]); break;
            case 'neq': query = query.neq(key, value[op]); break;
            default: query = query.eq(key, value[op]);
          }
        });
      } else {
        query = query.eq(key, value);
      }
    });

    // ORDER BY
    if (orderBy) {
      const [column, direction] = orderBy.split(' ');
      query = query.order(column, { ascending: direction?.toLowerCase() !== 'desc' });
    }

    // LIMIT y OFFSET
    if (limit && offset !== null) {
      // Supabase range es inclusivo: range(offset, offset + limit - 1)
      query = query.range(offset, offset + parseInt(limit) - 1);
    } else if (limit) {
      query = query.limit(parseInt(limit));
    } else if (offset !== null) {
      query = query.range(offset, offset + 999); // Rango grande si solo hay offset
    }

    const { data, error } = await query;

    if (error) {
      logger.error(`❌ [select] Error en tabla ${table}: ${error.message}`);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    logger.error(`❌ [select] Error inesperado en tabla ${table}: ${error.message}`);
    return { data: null, error };
  }
}

/**
 * INSERT helper - usa Supabase API
 * @param {string} table - Nombre de la tabla
 * @param {Object} data - Datos a insertar
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function insert(table, data) {
  try {
    // Intentar autenticar, pero continuar incluso si falla
    // (puede que ya estemos autenticados desde una query anterior)
    const authResult = await ensureAuthenticated();
    if (!authResult) {
      logger.warn(`⚠️ No se pudo autenticar explícitamente, pero continuando con INSERT (puede que ya estemos autenticados)`);
    }
    
    const { data: insertedData, error } = await supabase
      .schema(dbSchema)
      .from(table)
      .insert(data)
      .select();

    if (error) {
      logger.error(`❌ [insert] Error insertando en ${table}: ${error.message}`);
      return { data: null, error };
    }

    return { data: insertedData || [], error: null };
  } catch (error) {
    logger.error(`❌ [insert] Error inesperado en tabla ${table}: ${error.message}`);
    return { data: null, error };
  }
}

/**
 * UPDATE helper - usa Supabase API
 * @param {string} table - Nombre de la tabla
 * @param {Object} data - Datos a actualizar
 * @param {Object} where - Condiciones WHERE
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function update(table, data, where) {
  try {
    // Intentar autenticar, pero continuar incluso si falla
    const authResult = await ensureAuthenticated();
    if (!authResult) {
      logger.warn(`⚠️ No se pudo autenticar explícitamente, pero continuando con UPDATE (puede que ya estemos autenticados)`);
    }
    
    let query = supabase.schema(dbSchema).from(table).update(data);

    // WHERE clauses
    Object.keys(where).forEach(key => {
      query = query.eq(key, where[key]);
    });

    const { data: updatedData, error } = await query.select();

    if (error) {
      logger.error(`❌ [update] Error actualizando ${table}: ${error.message}`);
      return { data: null, error };
    }

    return { data: updatedData || [], error: null };
  } catch (error) {
    logger.error(`❌ [update] Error inesperado en tabla ${table}: ${error.message}`);
    return { data: null, error };
  }
}

/**
 * DELETE helper - usa Supabase API
 * @param {string} table - Nombre de la tabla
 * @param {Object} where - Condiciones WHERE
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function remove(table, where) {
  try {
    // Intentar autenticar, pero continuar incluso si falla
    const authResult = await ensureAuthenticated();
    if (!authResult) {
      logger.warn(`⚠️ No se pudo autenticar explícitamente, pero continuando con DELETE (puede que ya estemos autenticados)`);
    }
    
    let query = supabase.schema(dbSchema).from(table).delete();

    // WHERE clauses
    Object.keys(where).forEach(key => {
      query = query.eq(key, where[key]);
    });

    const { data: deletedData, error } = await query.select();

    if (error) {
      logger.error(`❌ [delete] Error eliminando de ${table}: ${error.message}`);
      return { data: null, error };
    }

    return { data: deletedData || [], error: null };
  } catch (error) {
    logger.error(`❌ [delete] Error inesperado en tabla ${table}: ${error.message}`);
    return { data: null, error };
  }
}

/**
 * RPC helper - ejecuta una función almacenada
 * @param {string} functionName - Nombre de la función
 * @param {Object} params - Parámetros de la función
 * @returns {Promise<{data: any, error: Error|null}>}
 */
async function rpc(functionName, params = {}) {
  try {
    // Intentar autenticar, pero continuar incluso si falla
    const authResult = await ensureAuthenticated();
    if (!authResult) {
      logger.warn(`⚠️ No se pudo autenticar explícitamente, pero continuando con RPC (puede que ya estemos autenticados)`);
    }
    
    // Si la función está en joysense, usar .schema() para accederla directamente
    // Usamos acceso directo sin wrapper
    let result;
    if (functionName === 'fn_get_table_metadata') {
      // Acceso directo a la función en schema joysense
      result = await supabase.schema('joysense').rpc(functionName, params);
    } else {
      // Para otras funciones, usar el método estándar (busca en public)
      result = await supabase.rpc(functionName, params);
    }
    
    const { data, error } = result;

    if (error) {
      logger.error(`❌ [rpc] Error ejecutando ${functionName}: ${error.message}`);
      if (error.details) logger.error(`   Detalles: ${error.details}`);
      if (error.hint) logger.error(`   Hint: ${error.hint}`);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    logger.error(`❌ [rpc] Error inesperado en ${functionName}: ${error.message}`);
    return { data: null, error };
  }
}

/**
 * COUNT helper - usa Supabase API
 * @param {string} table - Nombre de la tabla
 * @param {Object} where - Condiciones WHERE opcionales
 * @returns {Promise<{count: number, error: Error|null}>}
 */
async function count(table, where = {}) {
  try {
    // Intentar autenticar, pero continuar incluso si falla
    const authResult = await ensureAuthenticated();
    if (!authResult) {
      logger.warn(`⚠️ No se pudo autenticar explícitamente, pero continuando con COUNT (puede que ya estemos autenticados)`);
    }
    
    let query = supabase.schema(dbSchema).from(table).select('*', { count: 'exact', head: true });

    // WHERE clauses
    Object.keys(where).forEach(key => {
      query = query.eq(key, where[key]);
    });

    const { count: resultCount, error } = await query;

    if (error) {
      logger.error(`❌ [count] Error contando ${table}: ${error.message}`);
      return { count: 0, error };
    }

    return { count: resultCount || 0, error: null };
  } catch (error) {
    logger.error(`❌ [count] Error inesperado contando ${table}: ${error.message}`);
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
  supabase, // Exportar cliente de Supabase para uso directo
  schema: dbSchema
};

module.exports = {
  db,
  dbSchema,
  supabase, // Cliente de Supabase autenticado
  authenticateBackend, // Función para re-autenticar si es necesario
  ensureAuthenticated, // Función para asegurar autenticación
  query,
  select,
  insert,
  update,
  delete: remove,
  rpc,
  count
};
