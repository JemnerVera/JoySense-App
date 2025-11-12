-- ============================================================================
-- SCRIPT PARA EJECUTAR fn_consolidar_alertas MANUALMENTE
-- ============================================================================
-- Este script ejecuta la función que consolida alertas y genera mensajes
-- 
-- IMPORTANTE: Esta función debe ejecutarse periódicamente (cada hora recomendado)
-- para consolidar alertas y generar mensajes basándose en perfiles y contactos
-- ============================================================================

-- Ejecutar la función de consolidación
SELECT * FROM sense.fn_consolidar_alertas();

-- ============================================================================
-- VERIFICACIONES POST-EJECUCIÓN
-- ============================================================================

-- 1. Verificar si se crearon alertas consolidadas
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
  u.minimo,
  u.maximo,
  c.criticidad,
  c.frecuencia,
  c.escalamiento
FROM sense.alertaconsolidado ac
JOIN sense.umbral u ON u.umbralid = ac.umbralid
JOIN sense.criticidad c ON c.criticidadid = u.criticidadid
WHERE ac.statusid = 1
ORDER BY ac.fechainicio DESC
LIMIT 10;

-- 2. Verificar si se generaron mensajes
SELECT 
  m.mensajeid,
  m.contactoid,
  m.consolidadoid,
  m.mensaje,
  m.fecha,
  m.statusid,
  c.contactoid,
  c.usuarioid,
  us.firstname,
  us.lastname
FROM sense.mensaje m
JOIN sense.contacto c ON c.contactoid = m.contactoid
JOIN sense.usuario us ON us.usuarioid = c.usuarioid
ORDER BY m.fecha DESC
LIMIT 10;

-- ============================================================================
-- DIAGNÓSTICO: Verificar configuración necesaria para generar mensajes
-- ============================================================================

-- 3. Verificar si los umbrales tienen perfiles asignados
SELECT 
  u.umbralid,
  u.umbral,
  COUNT(pu.perfilid) AS perfiles_asignados
FROM sense.umbral u
LEFT JOIN sense.perfilumbral pu ON pu.umbralid = u.umbralid AND pu.statusid = 1
WHERE u.statusid = 1
GROUP BY u.umbralid, u.umbral
HAVING COUNT(pu.perfilid) = 0
ORDER BY u.umbralid;

-- 4. Verificar si los perfiles tienen usuarios asignados
SELECT 
  p.perfilid,
  p.perfil,
  p.nivel,
  COUNT(up.usuarioid) AS usuarios_asignados
FROM sense.perfil p
LEFT JOIN sense.usuarioperfil up ON up.perfilid = p.perfilid AND up.statusid = 1
WHERE p.statusid = 1
GROUP BY p.perfilid, p.perfil, p.nivel
HAVING COUNT(up.usuarioid) = 0
ORDER BY p.perfilid;

-- 5. Verificar si los usuarios tienen contactos
SELECT 
  us.usuarioid,
  us.firstname,
  us.lastname,
  COUNT(c.contactoid) AS contactos
FROM sense.usuario us
LEFT JOIN sense.contacto c ON c.usuarioid = us.usuarioid AND c.statusid = 1
GROUP BY us.usuarioid, us.firstname, us.lastname
HAVING COUNT(c.contactoid) = 0
ORDER BY us.usuarioid;

-- 6. Verificar umbrales del NODO TEST 1 (nodoid: 297) y sus perfiles
SELECT 
  u.umbralid,
  u.umbral,
  u.minimo,
  u.maximo,
  c.criticidad,
  c.frecuencia,
  c.escalamiento,
  COUNT(DISTINCT pu.perfilid) AS perfiles_asignados,
  STRING_AGG(DISTINCT p.perfil, ', ') AS nombres_perfiles
FROM sense.umbral u
JOIN sense.criticidad c ON c.criticidadid = u.criticidadid
LEFT JOIN sense.perfilumbral pu ON pu.umbralid = u.umbralid AND pu.statusid = 1
LEFT JOIN sense.perfil p ON p.perfilid = pu.perfilid AND p.statusid = 1
WHERE u.nodoid = 297
  AND u.statusid = 1
GROUP BY u.umbralid, u.umbral, u.minimo, u.maximo, c.criticidad, c.frecuencia, c.escalamiento
ORDER BY u.umbralid;

