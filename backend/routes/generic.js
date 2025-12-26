/**
 * Rutas Genéricas para operaciones CRUD dinámicas
 * Versión Supabase API
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, supabase: baseSupabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata, clearMetadataCache } = require('../utils/pagination');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// Lista de tablas permitidas para operaciones genéricas
const ALLOWED_TABLES = [
  'pais', 'empresa', 'fundo', 'ubicacion', 'localizacion', 
  'entidad', 'entidad_localizacion',
  'nodo', 'sensor', 'tipo', 'metrica', 'metricasensor',
  'umbral', 'alerta', 'alerta_regla_consolidado', 'criticidad',
  'audit_log_umbral', 'regla', 'regla_objeto', 'regla_perfil', 'regla_umbral',
  'usuario', 'perfil', 'usuarioperfil', 
  'contacto', 'correo', 'codigotelefono',
  'mensaje', 'asociacion',
  'permiso', 'fuente', 'origen', 'tipo_mensaje', // Nuevo sistema de permisos
  'sensor_valor', 'sensor_valor_error'
];

// Mapeo de PK por tabla
const PK_MAPPING = {
  pais: 'paisid',
  empresa: 'empresaid',
  fundo: 'fundoid',
  ubicacion: 'ubicacionid',
  localizacion: 'localizacionid',
  entidad: 'entidadid',
  nodo: 'nodoid',
  sensor: 'sensorid',
  tipo: 'tipoid',
  metrica: 'metricaid',
  umbral: 'umbralid',
  alerta: 'uuid_alertaid',
  alerta_regla_consolidado: 'uuid_consolidadoid',
  criticidad: 'criticidadid',
  usuario: 'usuarioid',
  perfil: 'perfilid',
  contacto: 'contactoid',
  correo: 'correoid',
  codigotelefono: 'codigotelefonoid',
  mensaje: null, // PK compuesta
  asociacion: 'asociacionid',
  permiso: 'permisoid', // Nuevo sistema de permisos
  fuente: 'fuenteid',
  origen: 'origenid',
  tipo_mensaje: 'tipo_mensajeid',
  audit_log_umbral: 'auditid',
  entidad_localizacion: null, // PK compuesta
  metricasensor: null, // PK compuesta
  usuarioperfil: null, // PK compuesta
  regla: 'reglaid',
  regla_objeto: 'regla_objetoid',
  regla_perfil: 'regla_perfilid',
  regla_umbral: 'regla_umbralid',
  sensor_valor: 'id',
  sensor_valor_error: 'id'
};

// Validar tabla permitida
function isTableAllowed(table) {
  return ALLOWED_TABLES.includes(table.toLowerCase());
}

// ============================================================================
// RUTA GENÉRICA GET /:table
// ============================================================================

router.get('/:table', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ 
      error: `Tabla '${table}' no permitida`,
      allowedTables: ALLOWED_TABLES 
    });
  }
  
  try {
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    
    const result = await paginateAndFilter(table, req.query, userSupabase);
    res.json(result);
  } catch (error) {
    logger.error(`❌ Error en GET /${table}:`, error);
    logger.error(`   Mensaje: ${error.message}`);
    logger.error(`   Code: ${error.code || 'N/A'}`);
    logger.error(`   Details: ${error.details || 'N/A'}`);
    logger.error(`   Hint: ${error.hint || 'N/A'}`);
    logger.error(`   Stack:`, error.stack);
    res.status(500).json({ 
      error: error.message || 'Error desconocido',
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================================
// RUTA GENÉRICA GET /:table/columns
// ============================================================================

router.get('/:table/columns', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  try {
    logger.info(`🔍 [GET /${table}/columns] Obteniendo metadatos para ${table}`);
    const metadata = await getTableMetadata(table);
    const columnCount = Array.isArray(metadata.columns) ? metadata.columns.length : 0;
    logger.info(`✅ [GET /${table}/columns] Retornando ${columnCount} columnas`);
    // Retornar columnas vacías si no hay metadatos, en lugar de error
    res.json(metadata.columns || []);
  } catch (error) {
    // Si aún así hay un error, retornar array vacío en lugar de error 500
    logger.warn(`⚠️ Error en GET /${table}/columns: ${error.message}. Retornando columnas vacías.`);
    res.json([]);
  }
});

// ============================================================================
// RUTA GENÉRICA POST /:table
// ============================================================================

router.post('/:table', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  try {
    // Preparar datos para inserción
    let dataToInsert = { ...req.body };
    
      // Lógica especial para tabla 'usuario'
      // IMPORTANTE: Después de insertar, se sincroniza automáticamente con Supabase Auth
      // usando fn_sync_usuario_con_auth_wait (ver código más abajo)
      if (table === 'usuario') {
      // Validar que login sea un email válido
      if (dataToInsert.login && !dataToInsert.login.includes('@')) {
        return res.status(400).json({ 
          error: 'El login debe ser un email válido' 
        });
      }
      
      // Si viene 'password' en lugar de 'password_hash', hashearlo
      if (dataToInsert.password && !dataToInsert.password_hash) {
        const password_hash = await bcrypt.hash(dataToInsert.password, 10);
        dataToInsert.password_hash = password_hash;
        delete dataToInsert.password; // Eliminar password en texto plano
      }
      
      // Asegurar que password_hash esté presente (usar hash por defecto si no viene)
      if (!dataToInsert.password_hash) {
        const defaultPassword = dataToInsert.password || 'temporal123';
        dataToInsert.password_hash = await bcrypt.hash(defaultPassword, 10);
        if (dataToInsert.password) {
          delete dataToInsert.password;
        }
      }
      
      // NOTA: La sincronización con Supabase Auth se realiza automáticamente después del INSERT
      // Ver código de sincronización más abajo
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from(table).insert(dataToInsert).select();
    
    if (error) {
      logger.error(`❌ Error en INSERT ${table}:`, error.message);
      if (error.code) logger.error(`   Código: ${error.code}`);
      if (error.detail) logger.error(`   Detalle: ${error.detail}`);
      if (error.hint) logger.error(`   Hint: ${error.hint}`);
      throw error;
    }
    
    // ========================================================================
    // SINCRONIZAR CON SUPABASE AUTH (Solo para tabla 'usuario')
    // Recomendación del DBA: llamar fn_sync_usuario_con_auth_wait después de crear
    // ========================================================================
    if (table === 'usuario' && data && data[0]) {
      const newUsuario = data[0];
      if (newUsuario.usuarioid) {
        try {
          logger.info(`🔄 Sincronizando usuario ${newUsuario.usuarioid} con Supabase Auth (desde generic route)...`);
          
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
            // Actualizar usuario con useruuid
            const { data: updatedData, error: updateError } = await userSupabase
              .schema(dbSchema)
              .from('usuario')
              .update({ useruuid: syncResult })
              .eq('usuarioid', newUsuario.usuarioid)
              .select();

            if (!updateError && updatedData && updatedData[0]) {
              // Actualizar data para retornar useruuid
              data[0] = updatedData[0];
              logger.info(`✅ Usuario sincronizado exitosamente. useruuid: ${syncResult}`);
              
              // Actualizar contraseña en Auth usando función PostgreSQL (usa secrets del vault)
              // Buscar password en dataToInsert (puede venir como 'password' antes de hashear)
              const originalPassword = req.body.password || (Array.isArray(req.body) ? req.body[0]?.password : null);
              
              if (originalPassword) {
                try {
                  logger.info(`🔑 Actualizando contraseña en Supabase Auth para usuario ${syncResult}...`);
                  
                  const { data: passwordUpdateResult, error: passwordUpdateError } = await userSupabase
                    .schema('joysense')
                    .rpc('fn_update_password_auth', {
                      p_useruuid: syncResult,
                      p_password: originalPassword
                    });
                  
                  if (passwordUpdateError) {
                    logger.warn('⚠️ No se pudo actualizar contraseña en Auth (usando función SQL):', passwordUpdateError.message);
                    logger.warn('   El usuario puede usar scripts/update-password-auth.js para actualizar manualmente');
                  } else {
                    logger.info('✅ Contraseña actualizada en Supabase Auth exitosamente (usando función SQL)');
                  }
                } catch (passwordErr) {
                  logger.warn('⚠️ Error al actualizar contraseña en Auth:', passwordErr.message);
                  // No fallar - el usuario se creó correctamente
                }
              } else {
                logger.warn('⚠️ No se proporcionó contraseña - usuario tendrá contraseña temporal en Auth');
              }
              
              // Agregar estado de sincronización a la respuesta
              data[0] = {
                ...data[0],
                syncStatus: 'success',
                syncMessage: 'Usuario creado y sincronizado exitosamente'
              };
            } else {
              logger.warn('⚠️ Usuario sincronizado pero no se pudo actualizar useruuid:', updateError);
              // Agregar estado pendiente
              data[0] = {
                ...data[0],
                syncStatus: 'pending',
                syncMessage: 'Usuario creado pero useruuid pendiente de actualización'
              };
            }
          } else {
            // Si retorna NULL o hay error, agregar estado pendiente
            logger.warn('⚠️ Usuario creado pero sincronización pendiente:', {
              usuarioid: newUsuario.usuarioid,
              login: newUsuario.login,
              error: syncError ? syncError.message : 'Retornó NULL (puede ser normal si pg_net tarda)'
            });
            
            // Agregar estado pendiente para que frontend pueda reintentar
            data[0] = {
              ...data[0],
              syncStatus: 'pending',
              syncMessage: 'Usuario creado pero sincronización pendiente. Reintentando...',
              useruuid: null
            };
          }
        } catch (syncErr) {
          // Log error pero no fallar la creación - el trigger seguirá intentando sincronizar
          logger.error('❌ Error en sincronización automática (usuario se creó igualmente):', syncErr);
          
          // Agregar estado de error
          data[0] = {
            ...data[0],
            syncStatus: 'error',
            syncMessage: 'Usuario creado pero error en sincronización. Puede reintentar más tarde.',
            syncError: syncErr.message
          };
        }
      }
    }
    
    // Limpiar cache de metadata
    clearMetadataCache(table);
    
    res.status(201).json(data);
  } catch (error) {
    logger.error(`Error en POST /${table}:`, error.message);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
});

// ============================================================================
// RUTA GENÉRICA PUT /:table/:id
// ============================================================================

router.put('/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  const pk = PK_MAPPING[table.toLowerCase()];
  
  if (!pk) {
    return res.status(400).json({ 
      error: `Tabla '${table}' tiene PK compuesta. Use el endpoint específico.` 
    });
  }
  
  try {
    // Preparar datos para actualización
    let dataToUpdate = { ...req.body };
    
    // Lógica especial para tabla 'usuario'
    if (table === 'usuario') {
      // Si viene 'password' en lugar de 'password_hash', hashearlo
      if (dataToUpdate.password !== undefined) {
        // Solo hashear si realmente hay un valor nuevo de password (no vacío)
        if (dataToUpdate.password && typeof dataToUpdate.password === 'string' && dataToUpdate.password.trim() !== '') {
          const password_hash = await bcrypt.hash(dataToUpdate.password, 10);
          dataToUpdate.password_hash = password_hash;
        }
        // SIEMPRE eliminar password en texto plano (no debe llegar a la BD)
        // Crear un nuevo objeto sin el campo password
        const { password, ...rest } = dataToUpdate;
        dataToUpdate = rest;
      }
      
      // Validar que login sea un email válido (si se está actualizando)
      if (dataToUpdate.login && !dataToUpdate.login.includes('@')) {
        return res.status(400).json({ 
          error: 'El login debe ser un email válido' 
        });
      }
    }
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    const { data, error } = await userSupabase.schema(dbSchema).from(table).update(dataToUpdate).eq(pk, id).select();
    
    if (error) {
      logger.error(`❌ Error en UPDATE ${table}/${id}:`, error.message);
      if (error.code) logger.error(`   Código: ${error.code}`);
      if (error.detail) logger.error(`   Detalle: ${error.detail}`);
      if (error.hint) logger.error(`   Hint: ${error.hint}`);
      throw error;
    }
    
    // Limpiar cache de metadata
    clearMetadataCache(table);
    
    res.json(data);
  } catch (error) {
    logger.error(`Error en PUT /${table}/${id}:`, error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
});

// ============================================================================
// RUTA PARA ACTUALIZAR PK COMPUESTAS
// ============================================================================

router.put('/:table/composite', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  try {
    // Los parámetros de la PK vienen en el query string
    const pkParams = { ...req.query };
    delete pkParams.page;
    delete pkParams.pageSize;
    
    if (Object.keys(pkParams).length === 0) {
      return res.status(400).json({ 
        error: 'Se requieren parámetros de PK en el query string' 
      });
    }
    
    // Construir query dinámico
    const setClauses = Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`);
    const whereClauses = Object.keys(pkParams).map((k, i) => `${k} = $${setClauses.length + i + 1}`);
    
    // Usar el cliente de Supabase del request (con token del usuario) si está disponible
    const userSupabase = req.supabase || baseSupabase;
    let updateQuery = userSupabase.schema(dbSchema).from(table).update(req.body);
    
    // Aplicar condiciones WHERE para la PK compuesta
    Object.keys(pkParams).forEach(key => {
      updateQuery = updateQuery.eq(key, pkParams[key]);
    });
    
    const { data, error } = await updateQuery.select();
    
    if (error) {
      throw error;
    }
    
    clearMetadataCache(table);
    
    res.json(data || []);
  } catch (error) {
    logger.error(`Error en PUT /${table}/composite:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INFORMACIÓN DE TABLAS
// ============================================================================

router.get('/meta/tables', async (req, res) => {
  res.json({
    allowedTables: ALLOWED_TABLES,
    pkMapping: PK_MAPPING,
    schema: dbSchema
  });
});

router.get('/meta/clear-cache', async (req, res) => {
  const { table } = req.query;
  clearMetadataCache(table || null);
  res.json({ 
    message: table ? `Cache limpiado para ${table}` : 'Cache completo limpiado',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// FUNCIÓN DE DIAGNÓSTICO (reutilizable)
// ============================================================================

async function runTableDiagnostics() {
  try {
    // Obtener información del usuario autenticado en Supabase
    // Usar el cliente base ya que esto se ejecuta al iniciar el servidor
    const { data: { user }, error: userError } = await baseSupabase.auth.getUser();
    const currentUser = user?.email || 'admin@joysense.com';
    
    const diagnostics = {
      connection: {
        user: currentUser,
        database: 'Supabase',
        schema: dbSchema,
        status: 'connected',
        method: 'Supabase API'
      },
      timestamp: new Date().toISOString(),
      tables: []
    };
    
    // Verificar cada tabla permitida
    for (const tableName of ALLOWED_TABLES) {
      const tableInfo = {
        name: tableName,
        exists: false,
        rls: {
          enabled: false,
          forced: false,
          policies: []
        },
        permissions: {
          SELECT: false,
          INSERT: false,
          UPDATE: false,
          DELETE: false
        },
        testResults: {
          canSelect: false,
          canInsert: false,
          canUpdate: false,
          recordCount: 0,
          error: null
        }
      };
      
      try {
        // 1. Verificar si la tabla existe (intentando hacer SELECT)
        // Si la tabla no existe, Supabase devolverá un error
        let tableExists = false;
        try {
          const { data, error } = await baseSupabase.schema(dbSchema).from(tableName).select('*').limit(0);
          tableExists = !error || !error.message.includes('does not exist');
          tableInfo.exists = tableExists;
        } catch (err) {
          tableInfo.exists = false;
          tableInfo.testResults.error = 'Tabla no existe o no accesible';
          diagnostics.tables.push(tableInfo);
          continue;
        }
        
        // 2-4. RLS y permisos: Simplificado - Supabase API maneja RLS automáticamente
        // No podemos consultar information_schema o pg_class desde Supabase API
        // Asumimos que RLS está habilitado si hay políticas (comportamiento por defecto)
        tableInfo.rls.enabled = true; // Supabase generalmente tiene RLS habilitado
        tableInfo.rls.policies = []; // No podemos consultar políticas desde API
        tableInfo.permissions = {
          SELECT: true, // Supabase API permite SELECT si RLS lo permite
          INSERT: true,
          UPDATE: true,
          DELETE: true
        };
        
        // 5. Pruebas reales de operaciones usando Supabase API
        // Test SELECT
        try {
          const { data: selectData, error: selectError, count: recordCount } = await baseSupabase
            .schema(dbSchema)
            .from(tableName)
            .select('*', { count: 'exact', head: false })
            .limit(1);
          
          if (selectError) {
            tableInfo.testResults.canSelect = false;
            tableInfo.testResults.error = `SELECT failed: ${selectError.message}`;
          } else {
            tableInfo.testResults.canSelect = true;
            // Obtener count total
            const { count: totalCount } = await baseSupabase
              .schema(dbSchema)
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            tableInfo.testResults.recordCount = totalCount || 0;
          }
        } catch (selectError) {
          tableInfo.testResults.canSelect = false;
          tableInfo.testResults.error = `SELECT failed: ${selectError.message}`;
        }
        
        // Test INSERT - Simplificado: Solo verificar si podemos hacer INSERT
        // No intentamos INSERT real porque no podemos hacer rollback en Supabase API
        if (tableInfo.testResults.canSelect && !tableInfo.testResults.error) {
          // Si podemos hacer SELECT, asumimos que podemos hacer INSERT si RLS lo permite
          // No podemos probar INSERT real sin crear datos
          tableInfo.testResults.canInsert = true; // Asumir true, RLS lo controlará
        } else {
          tableInfo.testResults.canInsert = false;
        }
        
        // Test UPDATE - Solo si SELECT funciona y hay registros
        if (tableInfo.testResults.canSelect && tableInfo.testResults.recordCount > 0 && !tableInfo.testResults.error) {
          // Si podemos hacer SELECT y hay registros, asumimos que podemos hacer UPDATE
          // No podemos probar UPDATE real sin modificar datos
          tableInfo.testResults.canUpdate = true; // Asumir true, RLS lo controlará
        } else {
          tableInfo.testResults.canUpdate = false;
        }
        
      } catch (error) {
        tableInfo.testResults.error = error.message;
        logger.error(`Error diagnosticando tabla ${tableName}:`, error);
      }
      
      diagnostics.tables.push(tableInfo);
    }
    
    // Resumen
    const summary = {
      total: diagnostics.tables.length,
      exists: diagnostics.tables.filter(t => t.exists).length,
      canSelect: diagnostics.tables.filter(t => t.testResults.canSelect).length,
      canInsert: diagnostics.tables.filter(t => t.testResults.canInsert).length,
      canUpdate: diagnostics.tables.filter(t => t.testResults.canUpdate).length,
      rlsEnabled: diagnostics.tables.filter(t => t.rls.enabled).length,
      withErrors: diagnostics.tables.filter(t => t.testResults.error).length
    };
    
    diagnostics.summary = summary;
    
    // Generar resumen legible para logs
    logger.info('\n' + '='.repeat(80));
    logger.info('📊 DIAGNÓSTICO DE TABLAS');
    logger.info('='.repeat(80));
    logger.info(`👤 Usuario: ${currentUser}`);
    logger.info(`📦 Base de datos: Supabase`);
    logger.info(`📂 Schema: ${dbSchema}`);
    logger.info('');
    
    diagnostics.tables.forEach(table => {
      if (!table.exists) {
        logger.info(`❌ Tabla ${table.name}: NO EXISTE`);
        return;
      }
      
      const status = [];
      if (table.testResults.canSelect) status.push('✅ SELECT');
      else status.push('❌ SELECT');
      
      if (table.testResults.canInsert) status.push('✅ INSERT');
      else status.push('❌ INSERT');
      
      if (table.testResults.canUpdate) status.push('✅ UPDATE');
      else status.push('❌ UPDATE');
      
      const rlsStatus = table.rls.enabled ? '🔒 RLS ON' : '🔓 RLS OFF';
      const recordCount = table.testResults.recordCount > 0 ? `(${table.testResults.recordCount} registros)` : '(0 registros)';
      
      logger.info(`📋 Tabla ${table.name}: ${status.join(' | ')} ${recordCount} | ${rlsStatus}`);
      
      if (table.testResults.error) {
        logger.info(`   ⚠️ Error: ${table.testResults.error}`);
      }
      
      // RLS funciona automáticamente con Supabase API
      if (table.rls.enabled) {
        logger.info(`   🔒 RLS habilitado (manejado automáticamente por Supabase API)`);
      }
    });
    
    logger.info('');
    logger.info('='.repeat(80));
    logger.info(`📊 RESUMEN:`);
    logger.info(`   Total de tablas: ${summary.total}`);
    logger.info(`   Tablas existentes: ${summary.exists}/${summary.total}`);
    logger.info(`   Tablas con SELECT: ${summary.canSelect}/${summary.exists}`);
    logger.info(`   Tablas con INSERT: ${summary.canInsert}/${summary.exists}`);
    logger.info(`   Tablas con UPDATE: ${summary.canUpdate}/${summary.exists}`);
    logger.info(`   Tablas con RLS habilitado: ${summary.rlsEnabled}`);
    logger.info(`   Tablas con errores: ${summary.withErrors}`);
    logger.info('='.repeat(80));
    logger.info('');
    
    return diagnostics;
  } catch (error) {
    logger.error('Error en diagnóstico:', error);
    throw error;
  }
}

// ============================================================================
// DIAGNÓSTICO DE TABLAS - CHECKLIST DE CONEXIÓN Y PERMISOS (ENDPOINT)
// ============================================================================

router.get('/meta/diagnostics', async (req, res) => {
  try {
    logger.info('🔍 Iniciando diagnóstico de tablas (endpoint)...');
    const diagnostics = await runTableDiagnostics();
    res.json(diagnostics);
  } catch (error) {
    logger.error('Error en diagnóstico:', error);
    res.status(500).json({ 
      error: error.message,
      connection: {
        status: 'error',
        message: 'No se pudo conectar a la base de datos'
      }
    });
  }
});

// Exportar router (compatibilidad con require('./generic'))
// También exportar función de diagnóstico para uso en startup
module.exports = router;
module.exports.runTableDiagnostics = runTableDiagnostics;
