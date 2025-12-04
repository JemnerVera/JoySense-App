-- ============================================================================
-- PERMISOS PARA SCHEMA JOYSENSE
-- Ejecutar UNO A LA VEZ para ver cuál hace efecto
-- ============================================================================

-- ============================================================================
-- PASO 1: ACCESO AL SCHEMA (OBLIGATORIO - EJECUTAR PRIMERO)
-- ============================================================================

GRANT USAGE ON SCHEMA joysense TO service_role;

-- ============================================================================
-- PASO 2: SECUENCIAS (para que funcionen los auto-increment)
-- ============================================================================

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA joysense TO service_role;

-- ============================================================================
-- PASO 3: PERMISOS POR TABLA (SELECT, INSERT, UPDATE - sin DELETE)
-- Ejecutar uno a la vez
-- ============================================================================

-- TABLA: pais
GRANT SELECT, INSERT, UPDATE ON joysense.pais TO service_role;

-- TABLA: empresa
GRANT SELECT, INSERT, UPDATE ON joysense.empresa TO service_role;

-- TABLA: fundo
GRANT SELECT, INSERT, UPDATE ON joysense.fundo TO service_role;

-- TABLA: ubicacion
GRANT SELECT, INSERT, UPDATE ON joysense.ubicacion TO service_role;

-- TABLA: localizacion
GRANT SELECT, INSERT, UPDATE ON joysense.localizacion TO service_role;

-- TABLA: entidad
GRANT SELECT, INSERT, UPDATE ON joysense.entidad TO service_role;

-- TABLA: entidad_localizacion
GRANT SELECT, INSERT, UPDATE ON joysense.entidad_localizacion TO service_role;

-- TABLA: nodo
GRANT SELECT, INSERT, UPDATE ON joysense.nodo TO service_role;

-- TABLA: sensor
GRANT SELECT, INSERT, UPDATE ON joysense.sensor TO service_role;

-- TABLA: tipo
GRANT SELECT, INSERT, UPDATE ON joysense.tipo TO service_role;

-- TABLA: metrica
GRANT SELECT, INSERT, UPDATE ON joysense.metrica TO service_role;

-- TABLA: metricasensor
GRANT SELECT, INSERT, UPDATE ON joysense.metricasensor TO service_role;

-- TABLA: medicion
GRANT SELECT, INSERT, UPDATE ON joysense.medicion TO service_role;

-- TABLA: umbral
GRANT SELECT, INSERT, UPDATE ON joysense.umbral TO service_role;

-- TABLA: alerta
GRANT SELECT, INSERT, UPDATE ON joysense.alerta TO service_role;

-- TABLA: alertaconsolidado
GRANT SELECT, INSERT, UPDATE ON joysense.alertaconsolidado TO service_role;

-- TABLA: criticidad
GRANT SELECT, INSERT, UPDATE ON joysense.criticidad TO service_role;

-- TABLA: perfilumbral
GRANT SELECT, INSERT, UPDATE ON joysense.perfilumbral TO service_role;

-- TABLA: audit_log_umbral
GRANT SELECT, INSERT, UPDATE ON joysense.audit_log_umbral TO service_role;

-- TABLA: usuario
GRANT SELECT, INSERT, UPDATE ON joysense.usuario TO service_role;

-- TABLA: perfil
GRANT SELECT, INSERT, UPDATE ON joysense.perfil TO service_role;

-- TABLA: usuarioperfil
GRANT SELECT, INSERT, UPDATE ON joysense.usuarioperfil TO service_role;

-- TABLA: contacto
GRANT SELECT, INSERT, UPDATE ON joysense.contacto TO service_role;

-- TABLA: correo
GRANT SELECT, INSERT, UPDATE ON joysense.correo TO service_role;

-- TABLA: codigotelefono
GRANT SELECT, INSERT, UPDATE ON joysense.codigotelefono TO service_role;

-- TABLA: mensaje
GRANT SELECT, INSERT, UPDATE ON joysense.mensaje TO service_role;

-- TABLA: asociacion
GRANT SELECT, INSERT, UPDATE ON joysense.asociacion TO service_role;

-- TABLA: perfil_geografia_permiso
GRANT SELECT, INSERT, UPDATE ON joysense.perfil_geografia_permiso TO service_role;

-- ============================================================================
-- PASO 4: FUNCION RPC (solo la que usa el backend)
-- ============================================================================

-- Solo esta función se llama desde el backend
GRANT EXECUTE ON FUNCTION joysense.fn_get_table_metadata(text) TO service_role;

-- Las demás funciones son triggers o internas, no necesitan GRANT

-- ============================================================================
-- NOTA: Las tablas sensor_valor y sensor_valor_error NO tienen permisos
-- según lo solicitado
-- ============================================================================

