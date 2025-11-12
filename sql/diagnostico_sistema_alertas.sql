-- ============================================================================
-- DIAGNÓSTICO DEL SISTEMA DE ALERTAS
-- ============================================================================
-- Este script verifica la configuración necesaria para que el sistema de alertas
-- funcione correctamente y genere mensajes
-- ============================================================================

-- 1. Verificar si existe la función fn_consolidar_alertas
SELECT 
  p.proname AS nombre_funcion,
  pg_get_functiondef(p.oid) AS definicion_funcion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'sense'
  AND p.proname = 'fn_consolidar_alertas';

-- 2. Verificar alertas generadas para NODO TEST 1 (nodoid: 297)
SELECT 
  a.alertaid,
  a.umbralid,
  a.medicionid,
  a.fecha,
  a.statusid,
  u.umbral,
  u.minimo,
  u.maximo,
  m.medicion,
  m.fecha AS fecha_medicion
FROM sense.alerta a
JOIN sense.umbral u ON u.umbralid = a.umbralid
JOIN sense.medicion m ON m.medicionid = a.medicionid
WHERE u.nodoid = 297
  AND a.statusid = 1
ORDER BY a.fecha DESC
LIMIT 20;

-- 3. Verificar alertas consolidadas para NODO TEST 1
SELECT 
  ac.consolidadoid,
  ac.umbralid,
  ac.fechainicio,
  ac.fechaultimo,
  ac.contador,
  ac.ultimamedicion,
  ac.statusid,
  ac.ultimoenvio,
  ac.nivelnotificado,
  u.umbral,
  u.nodoid
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON u.umbralid = ac.umbralid
WHERE u.nodoid = 297
ORDER BY ac.fechainicio DESC
LIMIT 10;

-- 4. Verificar mensajes generados
SELECT 
  m.mensajeid,
  m.contactoid,
  m.consolidadoid,
  m.mensaje,
  m.fecha,
  m.statusid
FROM sense.mensaje m
ORDER BY m.fecha DESC
LIMIT 10;

-- 5. Verificar configuración de perfiles para umbrales del NODO TEST 1
SELECT 
  u.umbralid,
  u.umbral,
  u.nodoid,
  pu.perfilid,
  p.perfil,
  p.nivel,
  pu.statusid AS perfilumbral_status
FROM sense.umbral u
LEFT JOIN sense.perfilumbral pu ON pu.umbralid = u.umbralid
LEFT JOIN sense.perfil p ON p.perfilid = pu.perfilid
WHERE u.nodoid = 297
  AND u.statusid = 1
ORDER BY u.umbralid, p.nivel DESC;

-- 6. Verificar usuarios con perfiles
SELECT 
  up.usuarioid,
  us.firstname,
  us.lastname,
  up.perfilid,
  p.perfil,
  p.nivel,
  up.statusid AS usuarioperfil_status
FROM sense.usuarioperfil up
JOIN sense.usuario us ON us.usuarioid = up.usuarioid
JOIN sense.perfil p ON p.perfilid = up.perfilid
WHERE up.statusid = 1
  AND p.statusid = 1
ORDER BY p.nivel DESC, us.usuarioid;

-- 7. Verificar contactos de usuarios
SELECT 
  c.contactoid,
  c.usuarioid,
  us.firstname,
  us.lastname,
  c.statusid AS contacto_status
FROM sense.contacto c
JOIN sense.usuario us ON us.usuarioid = c.usuarioid
WHERE c.statusid = 1
ORDER BY c.usuarioid;

-- 8. Verificar criticidad de los umbrales del NODO TEST 1
SELECT 
  u.umbralid,
  u.umbral,
  c.criticidadid,
  c.criticidad,
  c.frecuencia,
  c.escalamiento,
  c.escalon
FROM sense.umbral u
JOIN sense.criticidad c ON c.criticidadid = u.criticidadid
WHERE u.nodoid = 297
  AND u.statusid = 1
ORDER BY u.umbralid;

-- 9. RESUMEN: Verificar cadena completa para generar mensajes
-- Umbral -> Perfil -> Usuario -> Contacto
SELECT 
  u.umbralid,
  u.umbral,
  COUNT(DISTINCT pu.perfilid) AS perfiles_asignados,
  COUNT(DISTINCT up.usuarioid) AS usuarios_con_perfil,
  COUNT(DISTINCT c.contactoid) AS contactos_disponibles
FROM sense.umbral u
LEFT JOIN sense.perfilumbral pu ON pu.umbralid = u.umbralid AND pu.statusid = 1
LEFT JOIN sense.perfil p ON p.perfilid = pu.perfilid AND p.statusid = 1
LEFT JOIN sense.usuarioperfil up ON up.perfilid = p.perfilid AND up.statusid = 1
LEFT JOIN sense.contacto c ON c.usuarioid = up.usuarioid AND c.statusid = 1
WHERE u.nodoid = 297
  AND u.statusid = 1
GROUP BY u.umbralid, u.umbral
ORDER BY u.umbralid;

