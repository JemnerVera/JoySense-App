-- ============================================================================
-- DIAGNÓSTICO RÁPIDO: Por qué no se generó mensaje
-- ============================================================================
-- Ejecuta estas consultas para identificar rápidamente el problema
-- ============================================================================

-- PASO 1: Verificar si se generó alerta_regla (debe existir)
SELECT 
    ar.uuid_alerta_reglaid,
    ar.reglaid,
    ar.localizacionid,
    ar.fecha,
    r.nombre as regla_nombre
FROM joysense.alerta_regla ar
JOIN joysense.regla r ON r.reglaid = ar.reglaid
ORDER BY ar.datecreated DESC
LIMIT 5;

-- PASO 2: Verificar usuarios del perfil de la regla (REEMPLAZA 3 por tu reglaid)
SELECT 
    r.reglaid,
    r.nombre as regla_nombre,
    p.perfilid,
    p.perfil,
    p.nivel,
    u.usuarioid,
    u.login,
    u.firstname,
    u.useruuid,
    CASE 
        WHEN u.useruuid IS NULL THEN '❌ PROBLEMA: Falta useruuid'
        ELSE '✅ OK'
    END as estado_useruuid,
    c.contactoid,
    c.celular,
    CASE 
        WHEN c.contactoid IS NULL THEN '❌ PROBLEMA: Falta contacto'
        ELSE '✅ OK'
    END as estado_contacto
FROM joysense.regla r
JOIN joysense.regla_perfil rp ON rp.reglaid = r.reglaid AND rp.statusid = 1
JOIN joysense.perfil p ON p.perfilid = rp.perfilid AND p.statusid = 1
LEFT JOIN joysense.usuarioperfil up ON up.perfilid = p.perfilid AND up.statusid = 1
LEFT JOIN joysense.usuario u ON u.usuarioid = up.usuarioid AND u.statusid = 1
LEFT JOIN joysense.contacto c ON c.usuarioid = u.usuarioid AND c.statusid = 1
WHERE r.reglaid = 3  -- ⚠️ CAMBIAR por tu reglaid
ORDER BY p.perfilid, u.usuarioid;

-- PASO 3: Verificar permisos geográficos (REEMPLAZA 1 por tu localizacionid)
-- Esta consulta muestra si los usuarios tienen permiso para VER la localización
WITH localizacion_jerarquia AS (
    SELECT 
        l.localizacionid,
        n.nodoid,
        ub.ubicacionid,
        f.fundoid,
        e.empresaid,
        p.paisid
    FROM joysense.localizacion l
    JOIN joysense.nodo n ON n.nodoid = l.nodoid
    JOIN joysense.ubicacion ub ON ub.ubicacionid = n.ubicacionid
    JOIN joysense.fundo f ON f.fundoid = ub.fundoid
    JOIN joysense.empresa e ON e.empresaid = f.empresaid
    JOIN joysense.pais p ON p.paisid = e.paisid
    WHERE l.localizacionid = 1  -- ⚠️ CAMBIAR por tu localizacionid
)
SELECT 
    u.usuarioid,
    u.login,
    u.firstname,
    u.useruuid,
    p.perfil,
    c.celular,
    -- Verificar si tiene permiso
    EXISTS (
        SELECT 1
        FROM joysense.v_permiso_usuario vpu
        CROSS JOIN localizacion_jerarquia lj
        WHERE vpu.useruuid = u.useruuid
          AND vpu.origenid = 1
          AND vpu.puede_ver = true
          AND (
               (vpu.fuenteid = joysense.fn_fuenteid('localizacion') 
                AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.localizacionid::bigint))
            OR (vpu.fuenteid = joysense.fn_fuenteid('nodo') 
                AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.nodoid::bigint))
            OR (vpu.fuenteid = joysense.fn_fuenteid('ubicacion') 
                AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.ubicacionid::bigint))
            OR (vpu.fuenteid = joysense.fn_fuenteid('fundo') 
                AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.fundoid::bigint))
            OR (vpu.fuenteid = joysense.fn_fuenteid('empresa') 
                AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.empresaid::bigint))
            OR (vpu.fuenteid = joysense.fn_fuenteid('pais') 
                AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.paisid::bigint))
          )
    ) as tiene_permiso_ver,
    CASE 
        WHEN u.useruuid IS NULL THEN '❌ PROBLEMA: Falta useruuid'
        WHEN c.contactoid IS NULL THEN '❌ PROBLEMA: Falta contacto'
        WHEN NOT EXISTS (
            SELECT 1
            FROM joysense.v_permiso_usuario vpu
            CROSS JOIN localizacion_jerarquia lj
            WHERE vpu.useruuid = u.useruuid
              AND vpu.origenid = 1
              AND vpu.puede_ver = true
              AND (
                   (vpu.fuenteid = joysense.fn_fuenteid('localizacion') 
                    AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.localizacionid::bigint))
                OR (vpu.fuenteid = joysense.fn_fuenteid('nodo') 
                    AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.nodoid::bigint))
                OR (vpu.fuenteid = joysense.fn_fuenteid('ubicacion') 
                    AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.ubicacionid::bigint))
                OR (vpu.fuenteid = joysense.fn_fuenteid('fundo') 
                    AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.fundoid::bigint))
                OR (vpu.fuenteid = joysense.fn_fuenteid('empresa') 
                    AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.empresaid::bigint))
                OR (vpu.fuenteid = joysense.fn_fuenteid('pais') 
                    AND (vpu.objetoid IS NULL OR vpu.objetoid = lj.paisid::bigint))
              )
        ) THEN '❌ PROBLEMA: Falta permiso geográfico'
        ELSE '✅ TODO OK - Debería recibir mensaje'
    END as diagnostico
FROM joysense.regla r
JOIN joysense.regla_perfil rp ON rp.reglaid = r.reglaid AND rp.statusid = 1
JOIN joysense.perfil p ON p.perfilid = rp.perfilid AND p.statusid = 1
JOIN joysense.usuarioperfil up ON up.perfilid = p.perfilid AND up.statusid = 1
JOIN joysense.usuario u ON u.usuarioid = up.usuarioid AND u.statusid = 1
LEFT JOIN joysense.contacto c ON c.usuarioid = u.usuarioid AND c.statusid = 1
WHERE r.reglaid = 3  -- ⚠️ CAMBIAR por tu reglaid
ORDER BY u.usuarioid;

-- PASO 4: Verificar tipo_mensaje
SELECT 
    tipo_mensajeid,
    tipo_mensaje,
    statusid,
    CASE 
        WHEN tipo_mensaje = 'ALERTA_REGLA' AND statusid = 1 THEN '✅ OK'
        ELSE '❌ PROBLEMA: Falta tipo_mensaje ALERTA_REGLA activo'
    END as estado
FROM joysense.tipo_mensaje
WHERE tipo_mensaje = 'ALERTA_REGLA';

-- PASO 5: Verificar cooldown (si ya se envió antes)
SELECT 
    c.reglaid,
    c.localizacionid,
    c.ultimoenvio,
    r.cooldown,
    CASE 
        WHEN c.ultimoenvio IS NULL THEN '✅ Listo (primer envío)'
        WHEN NOW() - c.ultimoenvio < r.cooldown THEN '⚠️ En cooldown - espera más tiempo'
        ELSE '✅ Listo para enviar'
    END as estado_cooldown,
    NOW() - c.ultimoenvio as tiempo_desde_ultimo_envio
FROM joysense.alerta_regla_consolidado c
JOIN joysense.regla r ON r.reglaid = c.reglaid
WHERE c.statusid = 1
  AND c.reglaid = 3  -- ⚠️ CAMBIAR por tu reglaid
  AND c.localizacionid = 1  -- ⚠️ CAMBIAR por tu localizacionid
ORDER BY c.fechaultimo DESC
LIMIT 1;

