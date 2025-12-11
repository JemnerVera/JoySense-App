-- ============================================================================
-- SOLUCIÓN: ERROR 500 EN perfil_geografia_permiso
-- ============================================================================
-- Problema: La tabla perfil_geografia_permiso tiene RLS habilitado pero
-- no tiene políticas que permitan el acceso, causando error 500.
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar si RLS está habilitado
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'joysense'
  AND tablename = 'perfil_geografia_permiso';

-- ============================================================================
-- PASO 2: Verificar políticas RLS existentes
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename = 'perfil_geografia_permiso'
ORDER BY policyname;

-- ============================================================================
-- SOLUCIÓN 1: Crear políticas RLS para perfil_geografia_permiso
-- ============================================================================
-- Esta solución permite acceso completo a usuarios con perfil de administrador (perfilid = 1)
-- y acceso limitado a otros usuarios según sus permisos.

-- Política para SELECT: Permitir ver permisos si el usuario tiene perfil de administrador
-- o si el permiso pertenece a su perfil
CREATE POLICY IF NOT EXISTS rls_perfil_geografia_permiso_select
ON joysense.perfil_geografia_permiso
FOR SELECT
TO authenticated
USING (
    -- Usuario con perfil de administrador (perfilid = 1) puede ver todo
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
    OR
    -- Usuario puede ver permisos de su propio perfil
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = perfil_geografia_permiso.perfilid
          AND up.statusid = 1
    )
);

-- Política para INSERT: Solo administradores pueden insertar
CREATE POLICY IF NOT EXISTS rls_perfil_geografia_permiso_insert
ON joysense.perfil_geografia_permiso
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
);

-- Política para UPDATE: Solo administradores pueden actualizar
CREATE POLICY IF NOT EXISTS rls_perfil_geografia_permiso_update
ON joysense.perfil_geografia_permiso
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
);

-- Política para DELETE: Solo administradores pueden eliminar
CREATE POLICY IF NOT EXISTS rls_perfil_geografia_permiso_delete
ON joysense.perfil_geografia_permiso
FOR DELETE
TO authenticated
USING (
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
-- SOLUCIÓN 2 (ALTERNATIVA): Deshabilitar RLS temporalmente
-- ============================================================================
-- ⚠️ ADVERTENCIA: Esta solución deshabilita RLS completamente.
-- Solo usar si necesitas acceso sin restricciones (NO RECOMENDADO para producción).

-- ALTER TABLE joysense.perfil_geografia_permiso DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SOLUCIÓN 3 (ALTERNATIVA): Política más permisiva para desarrollo
-- ============================================================================
-- Esta política permite acceso a todos los usuarios autenticados.
-- Solo usar en desarrollo, NO en producción.

-- DROP POLICY IF EXISTS rls_perfil_geografia_permiso_select ON joysense.perfil_geografia_permiso;
-- CREATE POLICY rls_perfil_geografia_permiso_select_dev
-- ON joysense.perfil_geografia_permiso
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- ============================================================================
-- VERIFICACIÓN: Probar que las políticas funcionan
-- ============================================================================
-- Ejecutar como usuario autenticado para verificar que puede acceder a la tabla
SELECT COUNT(*) FROM joysense.perfil_geografia_permiso;
