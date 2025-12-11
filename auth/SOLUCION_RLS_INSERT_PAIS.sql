-- ============================================================================
-- SOLUCIÓN: Modificar Política RLS para INSERT en PAIS
-- ============================================================================
-- Este script modifica la política RLS de INSERT para permitir insertar
-- nuevos países sin verificar un paisid específico (que aún no existe)
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar política actual
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename = 'pais'
  AND cmd = 'INSERT';

-- ============================================================================
-- PASO 2: Eliminar política actual
-- ============================================================================

DROP POLICY IF EXISTS rls_pais_insert ON joysense.pais;

-- ============================================================================
-- PASO 3: Crear nueva política que permite insertar
-- ============================================================================
-- Esta política permite insertar si:
-- 1. El usuario tiene permiso de insertar en CUALQUIER país (v_permiso_pais)
-- 2. O tiene el perfil de administrador (perfilid = 1)

CREATE POLICY rls_pais_insert ON joysense.pais
FOR INSERT
WITH CHECK (
    -- Opción 1: Usuario tiene permiso de insertar en algún país
    -- (no verifica un paisid específico porque aún no existe)
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_pais v 
        WHERE v.useruuid = auth.uid()
          AND v.puede_insertar = true
    )
    OR
    -- Opción 2: Usuario tiene el perfil de administrador
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
);

-- ============================================================================
-- PASO 4: Verificar que la política se creó correctamente
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename = 'pais'
  AND cmd = 'INSERT';

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- 1. Esta política permite insertar nuevos países sin verificar un paisid
--    específico, porque el paisid aún no existe cuando se inserta
--
-- 2. El trigger AFTER INSERT (trg_auto_permiso_pais) creará automáticamente
--    el permiso para el nuevo país después de la inserción
--
-- 3. La política verifica que el usuario tenga:
--    - Permiso de insertar en algún país (v_permiso_pais)
--    - O el perfil de administrador (perfilid = 1)
--
-- 4. Esto mantiene la seguridad: solo usuarios con permisos pueden insertar
--
-- ============================================================================
