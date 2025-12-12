-- ============================================================================
-- VERIFICAR Y CREAR POLÍTICAS RLS PARA TABLA PAIS
-- ============================================================================
-- Este script verifica si existen políticas RLS para SELECT en la tabla pais
-- y las crea si no existen
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar si RLS está habilitado
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_habilitado
FROM pg_tables
WHERE schemaname = 'joysense'
  AND tablename = 'pais';

-- Si RLS no está habilitado, ejecutar:
-- ALTER TABLE joysense.pais ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 2: Verificar políticas existentes
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
  AND tablename = 'pais'
ORDER BY cmd, policyname;

-- ============================================================================
-- PASO 3: Habilitar RLS si no está habilitado
-- ============================================================================
ALTER TABLE joysense.pais ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 4: Eliminar políticas existentes (si es necesario recrearlas)
-- ============================================================================
-- Descomentar si necesitas recrear las políticas:
/*
DROP POLICY IF EXISTS rls_pais_select ON joysense.pais;
DROP POLICY IF EXISTS rls_pais_insert ON joysense.pais;
DROP POLICY IF EXISTS rls_pais_update ON joysense.pais;
DROP POLICY IF EXISTS rls_pais_delete ON joysense.pais;
*/

-- ============================================================================
-- PASO 5: Crear política RLS para SELECT
-- ============================================================================
-- Esta política permite ver países si el usuario tiene permiso en v_permiso_pais
CREATE POLICY IF NOT EXISTS rls_pais_select ON joysense.pais
FOR SELECT
USING (
    -- Verificar que el usuario tenga permiso de ver en v_permiso_pais
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_pais v 
        WHERE v.paisid = pais.paisid
          AND v.useruuid = auth.uid()
          AND v.puede_ver = true
    )
    OR
    -- Permitir si el usuario tiene el perfil de administrador (perfilid = 1)
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        INNER JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
);

-- ============================================================================
-- PASO 6: Crear política RLS para INSERT (si no existe)
-- ============================================================================
CREATE POLICY IF NOT EXISTS rls_pais_insert ON joysense.pais
FOR INSERT
WITH CHECK (
    -- Usuario tiene permiso de insertar en algún país
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_pais v 
        WHERE v.useruuid = auth.uid()
          AND v.puede_insertar = true
    )
    OR
    -- Usuario tiene el perfil de administrador
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        INNER JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
);

-- ============================================================================
-- PASO 7: Crear política RLS para UPDATE (si no existe)
-- ============================================================================
CREATE POLICY IF NOT EXISTS rls_pais_update ON joysense.pais
FOR UPDATE
USING (
    -- Verificar que el usuario tenga permiso de actualizar
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_pais v 
        WHERE v.paisid = pais.paisid
          AND v.useruuid = auth.uid()
          AND v.puede_actualizar = true
    )
    OR
    -- Usuario tiene el perfil de administrador
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        INNER JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
)
WITH CHECK (
    -- Misma verificación para WITH CHECK
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_pais v 
        WHERE v.paisid = pais.paisid
          AND v.useruuid = auth.uid()
          AND v.puede_actualizar = true
    )
    OR
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        INNER JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
);

-- ============================================================================
-- PASO 8: Crear política RLS para DELETE (si no existe)
-- ============================================================================
-- NOTA: Generalmente DELETE no se permite, pero si lo necesitas:
/*
CREATE POLICY IF NOT EXISTS rls_pais_delete ON joysense.pais
FOR DELETE
USING (
    -- Solo administradores pueden eliminar
    EXISTS (
        SELECT 1 
        FROM joysense.usuarioperfil up
        INNER JOIN joysense.usuario u ON u.usuarioid = up.usuarioid
        WHERE u.useruuid = auth.uid()
          AND up.perfilid = 1
          AND up.statusid = 1
    )
);
*/

-- ============================================================================
-- PASO 9: Verificar que las políticas se crearon correctamente
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
  AND tablename = 'pais'
ORDER BY cmd, policyname;

-- ============================================================================
-- PASO 10: Probar la política RLS (simular con un usuario)
-- ============================================================================
-- NOTA: Para probar, necesitas ejecutar esto como el usuario específico
-- Reemplaza 'UUID_DEL_USUARIO' con el UUID real del usuario
/*
SET LOCAL request.jwt.claim.sub = 'fbfeac53-de01-46f1-b5e3-d00d62111235';

SELECT 
    paisid,
    pais,
    paisabrev
FROM joysense.pais;
*/

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 1. Las políticas RLS se ejecutan automáticamente cuando se hace una query
-- 2. auth.uid() devuelve el UUID del usuario autenticado desde el token JWT
-- 3. Si el token no se pasa correctamente, auth.uid() será NULL y RLS bloqueará todo
-- 4. Verifica que el middleware esté pasando el token correctamente al cliente de Supabase
--
-- ============================================================================
