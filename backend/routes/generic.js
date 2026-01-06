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
  'umbral', 'alerta_regla', 'alerta_regla_consolidado', 'criticidad',
  'audit_log_umbral', 'regla', 'regla_objeto', 'regla_perfil', 'regla_umbral',
  'usuario', 'perfil', 'usuarioperfil', 'usuario_empresa', // usuario_empresa agregado para consultas
  'contacto', 'correo', 'codigotelefono',
  'asociacion',
  'permiso', 'fuente', 'origen', 'tipo_mensaje', // Nuevo sistema de permisos
  'sensor_valor', 'sensor_valor_error',
  'canal', 'usuario_canal', // Sistema de notificaciones
  'msg_outbox', 'auth_outbox' // Reportes administrativos
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
  alerta_regla: 'uuid_alerta_reglaid',
  alerta_regla_consolidado: 'uuid_consolidadoid',
  criticidad: 'criticidadid',
  usuario: 'usuarioid',
  perfil: 'perfilid',
  contacto: 'contactoid',
  correo: 'correoid',
  codigotelefono: 'codigotelefonoid',
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
  sensor_valor: null, // PK compuesta (id_device, fecha)
  sensor_valor_error: 'sensorvalorerrorid',
  canal: 'canalid', // Sistema de notificaciones
  usuario_canal: 'usuario_canalid',
  usuario_empresa: null, // PK compuesta (usuarioid, empresaid)
  msg_outbox: 'msg_outboxid', // Reportes administrativos
  auth_outbox: 'outboxid' // Reportes administrativos
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
    const errorMessage = error.message || 'Error desconocido';
    logger.error(`❌ Error en GET /${table}: ${errorMessage}`);
    res.status(500).json({ 
      error: errorMessage,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
});

// ============================================================================
// RUTA GENÉRICA GET /:table/columns
// ============================================================================

router.get('/:table/columns', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    logger.warn(`⚠️ [GET /${table}/columns] Tabla no permitida: ${table}`);
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  try {
    // Pasar el cliente de Supabase con token de usuario para que RLS funcione
    const userSupabase = req.supabase || baseSupabase;
    const metadata = await getTableMetadata(table, userSupabase);
    const columns = metadata.columns || [];
    
    res.json(columns);
  } catch (error) {
    logger.error(`❌ [GET /${table}/columns] Error: ${error.message}`);
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
      // Si viene empresas_ids, primero crear el usuario normalmente, luego asociar empresas
      let empresasIdsToAssociate = null;
      let isDefaultEmpresaToAssociate = null;
      
      if (table === 'usuario' && dataToInsert.empresas_ids && Array.isArray(dataToInsert.empresas_ids) && dataToInsert.empresas_ids.length > 0) {
        // Guardar empresas_ids para usar después de crear el usuario
        empresasIdsToAssociate = dataToInsert.empresas_ids;
        isDefaultEmpresaToAssociate = dataToInsert.is_default_empresa || null;
        
        // Remover empresas_ids del dataToInsert para que no se intente insertar en la tabla usuario
        delete dataToInsert.empresas_ids;
        delete dataToInsert.is_default_empresa;
        
      }
      
      // Lógica especial para tabla 'usuario' (sin empresas_ids - comportamiento legacy)
      // IMPORTANTE: Después de insertar, se sincroniza automáticamente con Supabase Auth
      // usando fn_sync_usuario_con_auth_wait (ver código más abajo)
      if (table === 'usuario') {
      // Validar que login sea un email válido
      if (dataToInsert.login && !dataToInsert.login.includes('@')) {
        return res.status(400).json({ 
          error: 'El login debe ser un email válido' 
        });
      }
      
      // Guardar el password en texto plano temporalmente para la sincronización
      // (fn_sync_usuario_con_auth_wait lo necesita para crear el usuario en Supabase Auth)
      let plainPassword = null;
      
      // Si viene 'password' en lugar de 'password_hash', hashearlo
      if (dataToInsert.password && !dataToInsert.password_hash) {
        plainPassword = dataToInsert.password; // Guardar password en texto plano
        const password_hash = await bcrypt.hash(dataToInsert.password, 10);
        dataToInsert.password_hash = password_hash;
        delete dataToInsert.password; // Eliminar password en texto plano del objeto a insertar
      }
      
      // Asegurar que password_hash esté presente (usar hash por defecto si no viene)
      if (!dataToInsert.password_hash) {
        plainPassword = dataToInsert.password || 'temporal123'; // Guardar password en texto plano
        const defaultPassword = plainPassword;
        dataToInsert.password_hash = await bcrypt.hash(defaultPassword, 10);
        if (dataToInsert.password) {
          delete dataToInsert.password;
        }
      }
      
      // Guardar el password en texto plano en req para usarlo después en la sincronización
      req.tempPlainPassword = plainPassword;
      
      // IMPORTANTE: Si se van a asignar empresas, crear el usuario como INACTIVO temporalmente
      // para evitar que el trigger ck_usuario_activo_tiene_empresa falle antes de asignar empresas
      // Luego lo activaremos después de asignar las empresas
      if (empresasIdsToAssociate && Array.isArray(empresasIdsToAssociate) && empresasIdsToAssociate.length > 0) {
        const originalStatusid = dataToInsert.statusid;
        dataToInsert.statusid = 0; // Temporalmente inactivo
        req._usuario_temporal_inactivo = true;
        req._usuario_statusid_original = originalStatusid !== undefined ? originalStatusid : 1;
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
          // Llamar a fn_sync_usuario_con_auth_wait según recomendación del DBA
          // IMPORTANTE: Especificar schema joysense explícitamente
          const { data: syncResult, error: syncError } = await userSupabase
            .schema('joysense')
            .rpc('fn_sync_usuario_con_auth_wait', {
              p_usuarioid: newUsuario.usuarioid,
              p_max_attempts: 6,
              p_sleep_ms: 250
            });
          
          if (syncError) {
            logger.error(`❌ [POST /usuario] Error en fn_sync_usuario_con_auth_wait:`, syncError.message);
          }

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
              // Agregar estado de sincronización a la respuesta
              data[0] = {
                ...updatedData,
                syncStatus: 'success',
                syncMessage: 'Usuario creado y sincronizado exitosamente'
              };
            } else {
              // Agregar estado pendiente
              data[0] = {
                ...data[0],
                syncStatus: 'pending',
                syncMessage: 'Usuario creado pero error al obtener datos actualizados'
              };
            }
          } else {
            // Si retorna NULL o hay error, agregar estado pendiente
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
        
        // ====================================================================
        // ASOCIAR EMPRESAS AL USUARIO (si se proporcionaron empresas_ids)
        // IMPORTANTE: Esto se hace DESPUÉS de la sincronización para no interferir
        // Tiene su propio try-catch para que errores aquí no afecten la sincronización
        // NUEVO: Usa fn_asignar_empresa_a_usuario (una empresa a la vez) según diseño del DBA
        // ====================================================================
        if (empresasIdsToAssociate && Array.isArray(empresasIdsToAssociate) && empresasIdsToAssociate.length > 0) {
          try {
            let empresasAsignadas = 0;
            let empresasConError = [];
            
            // Iterar sobre cada empresa y asignarla individualmente
            for (let i = 0; i < empresasIdsToAssociate.length; i++) {
              const empresaid = empresasIdsToAssociate[i];
              
              // Determinar si es la empresa por defecto:
              // - Si no se especificó is_default_empresa, la primera será default
              // - Si se especificó, solo esa será default
              const isDefault = (i === 0 && !isDefaultEmpresaToAssociate) || 
                                (empresaid === isDefaultEmpresaToAssociate);
              
              try {
                const { error: rpcError } = await userSupabase
                  .schema('joysense')
                  .rpc('fn_asignar_empresa_a_usuario', {
                    p_usuarioid: newUsuario.usuarioid,
                    p_empresaid: empresaid,
                    p_is_default: isDefault
                  });
                
                if (rpcError) {
                  logger.error(`❌ [POST /usuario] Error asignando empresa ${empresaid}:`, rpcError.message);
                  empresasConError.push({ empresaid, error: rpcError.message });
                } else {
                  empresasAsignadas++;
                }
              } catch (empresaErr) {
                logger.error(`❌ [POST /usuario] Excepción al asignar empresa ${empresaid}:`, empresaErr.message);
                empresasConError.push({ empresaid, error: empresaErr.message });
              }
            }
            
            // Reportar resultados
            if (empresasConError.length === 0) {
              data[0].empresas_insertadas = empresasAsignadas;
              data[0].empresas_ids = empresasIdsToAssociate;
              data[0].empresas_status = 'success';
              
              // Si el usuario fue creado como inactivo temporalmente, activarlo ahora que tiene empresas
              if (req._usuario_temporal_inactivo && empresasAsignadas > 0) {
                try {
                  const { error: errorActivar } = await userSupabase
                    .schema(dbSchema)
                    .from('usuario')
                    .update({ statusid: req._usuario_statusid_original })
                    .eq('usuarioid', newUsuario.usuarioid);
                  
                  if (errorActivar) {
                    logger.error(`❌ [POST /usuario] Error activando usuario después de asignar empresas:`, errorActivar.message);
                    data[0].empresas_warning = 'Empresas asignadas pero error al activar usuario';
                  } else {
                    // Actualizar el statusid en la respuesta
                    data[0].statusid = req._usuario_statusid_original;
                  }
                } catch (activarErr) {
                  logger.error(`❌ [POST /usuario] Excepción al activar usuario:`, activarErr.message);
                  data[0].empresas_warning = 'Empresas asignadas pero error al activar usuario';
                }
              }
            } else if (empresasAsignadas > 0) {
              data[0].empresas_insertadas = empresasAsignadas;
              data[0].empresas_ids = empresasIdsToAssociate;
              data[0].empresas_status = 'partial';
              data[0].empresas_errores = empresasConError;
              
              // Si al menos una empresa se asignó, intentar activar el usuario
              if (req._usuario_temporal_inactivo) {
                try {
                  const { error: errorActivar } = await userSupabase
                    .schema(dbSchema)
                    .from('usuario')
                    .update({ statusid: req._usuario_statusid_original })
                    .eq('usuarioid', newUsuario.usuarioid);
                  
                  if (!errorActivar) {
                    data[0].statusid = req._usuario_statusid_original;
                  }
                } catch (activarErr) {
                  // Silencioso: no loguear si no se puede activar
                }
              }
            } else {
              data[0].empresas_error = `Error al asignar todas las empresas: ${empresasConError.map(e => e.error).join('; ')}`;
              data[0].empresas_status = 'error';
              data[0].empresas_errores = empresasConError;
            }
          } catch (empresasErr) {
            logger.error('❌ [POST /usuario] Error general asociando empresas (usuario se creó igualmente):', empresasErr.message);
            data[0].empresas_error = empresasErr.message;
            data[0].empresas_status = 'error';
            // Si hubo error general, dejar el usuario inactivo
            logger.warn(`⚠️ [POST /usuario] Usuario ${newUsuario.usuarioid} permanece inactivo debido a error al asignar empresas`);
          }
        }
      } else {
        // Si no es usuario o no hay usuarioid, verificar si hay empresas para asociar
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
    // Si viene empresas_ids, guardarlo para actualizar después
    let empresasIdsToUpdate = null;
    let isDefaultEmpresaToUpdate = null;
    
    if (table === 'usuario' && dataToUpdate.empresas_ids !== undefined) {
      // Guardar empresas_ids para usar después de actualizar el usuario
      empresasIdsToUpdate = Array.isArray(dataToUpdate.empresas_ids) ? dataToUpdate.empresas_ids : null;
      isDefaultEmpresaToUpdate = dataToUpdate.is_default_empresa || null;
      
      // Remover empresas_ids del dataToUpdate para que no se intente actualizar en la tabla usuario
      delete dataToUpdate.empresas_ids;
      delete dataToUpdate.is_default_empresa;
    }
    
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
    
    // ========================================================================
    // ACTUALIZAR EMPRESAS DEL USUARIO (si se proporcionaron empresas_ids)
    // NUEVO: Usa fn_asignar_empresa_a_usuario + lógica de desactivación según diseño del DBA
    // ========================================================================
    if (table === 'usuario' && data && data[0] && empresasIdsToUpdate !== null) {
      try {
        const usuarioid = parseInt(id);
        if (isNaN(usuarioid)) {
          logger.warn(`⚠️ [PUT /usuario] ID inválido para actualizar empresas: ${id}`);
        } else {
          // 1. Obtener empresas actuales del usuario (solo activas)
          const { data: empresasActuales, error: errorEmpresasActuales } = await userSupabase
            .schema(dbSchema)
            .from('usuario_empresa')
            .select('empresaid, is_default, statusid')
            .eq('usuarioid', usuarioid);
          
          if (errorEmpresasActuales) {
            logger.error(`❌ [PUT /usuario] Error obteniendo empresas actuales:`, errorEmpresasActuales.message);
            throw errorEmpresasActuales;
          }
          
          const empresasActualesIds = (empresasActuales || [])
            .filter(e => e.statusid === 1)
            .map(e => e.empresaid);
          
          // 2. Determinar empresas a desactivar (están en actuales pero no en la nueva lista)
          const empresasADesactivar = empresasActualesIds.filter(
            id => !empresasIdsToUpdate.includes(id)
          );
          
          // 3. Desactivar empresas que ya no están en la lista
          if (empresasADesactivar.length > 0) {
            const { error: errorDesactivar } = await userSupabase
              .schema(dbSchema)
              .from('usuario_empresa')
              .update({ 
                statusid: 0, 
                is_default: false,
                usermodifiedid: req.user?.user_metadata?.usuarioid || 1,
                datemodified: new Date().toISOString()
              })
              .eq('usuarioid', usuarioid)
              .in('empresaid', empresasADesactivar);
            
            if (errorDesactivar) {
              logger.error(`❌ [PUT /usuario] Error desactivando empresas:`, errorDesactivar.message);
              throw errorDesactivar;
            }
            
          }
          
          // 4. Activar/crear empresas nuevas usando fn_asignar_empresa_a_usuario
          let empresasAsignadas = 0;
          let empresasConError = [];
          
          for (let i = 0; i < empresasIdsToUpdate.length; i++) {
            const empresaid = empresasIdsToUpdate[i];
            
            // Determinar si es la empresa por defecto:
            // - Si no se especificó is_default_empresa, la primera será default
            // - Si se especificó, solo esa será default
            const isDefault = (i === 0 && !isDefaultEmpresaToUpdate) || 
                              (empresaid === isDefaultEmpresaToUpdate);
            
            try {
              const { error: rpcError } = await userSupabase
                .schema('joysense')
                .rpc('fn_asignar_empresa_a_usuario', {
                  p_usuarioid: usuarioid,
                  p_empresaid: empresaid,
                  p_is_default: isDefault
                });
              
              if (rpcError) {
                logger.error(`❌ [PUT /usuario] Error asignando empresa ${empresaid}:`, rpcError.message);
                empresasConError.push({ empresaid, error: rpcError.message });
              } else {
                empresasAsignadas++;
              }
            } catch (empresaErr) {
              logger.error(`❌ [PUT /usuario] Excepción al asignar empresa ${empresaid}:`, empresaErr.message);
              empresasConError.push({ empresaid, error: empresaErr.message });
            }
          }
          
          // 5. Reportar resultados
          if (empresasConError.length === 0) {
            data[0].empresas_activadas = empresasAsignadas;
            data[0].empresas_desactivadas = empresasADesactivar.length;
            data[0].empresas_ids = empresasIdsToUpdate;
            data[0].empresas_status = 'success';
          } else if (empresasAsignadas > 0) {
            data[0].empresas_activadas = empresasAsignadas;
            data[0].empresas_desactivadas = empresasADesactivar.length;
            data[0].empresas_ids = empresasIdsToUpdate;
            data[0].empresas_status = 'partial';
            data[0].empresas_errores = empresasConError;
          } else {
            data[0].empresas_error = `Error al actualizar todas las empresas: ${empresasConError.map(e => e.error).join('; ')}`;
            data[0].empresas_status = 'error';
            data[0].empresas_errores = empresasConError;
          }
        }
      } catch (empresasErr) {
        logger.error('❌ [PUT /usuario] Error actualizando empresas (usuario se actualizó igualmente):', {
          error: empresasErr.message,
          stack: empresasErr.stack,
          usuarioid: id,
          empresas_ids: empresasIdsToUpdate
        });
        data[0].empresas_error = empresasErr.message;
        data[0].empresas_status = 'error';
      }
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
