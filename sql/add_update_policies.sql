-- 🔐 AGREGAR POLÍTICAS RLS PARA UPDATE EN TABLAS SENSE
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Crear policies para UPDATE (actualización) - Funcionalidad faltante
-- Policy para tabla pais
CREATE POLICY "Usuarios autenticados pueden actualizar pais" ON sense.pais
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla empresa
CREATE POLICY "Usuarios autenticados pueden actualizar empresa" ON sense.empresa
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla fundo
CREATE POLICY "Usuarios autenticados pueden actualizar fundo" ON sense.fundo
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla ubicacion
CREATE POLICY "Usuarios autenticados pueden actualizar ubicacion" ON sense.ubicacion
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla medicion
CREATE POLICY "Usuarios autenticados pueden actualizar medicion" ON sense.medicion
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla nodo
CREATE POLICY "Usuarios autenticados pueden actualizar nodo" ON sense.nodo
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla tipo
CREATE POLICY "Usuarios autenticados pueden actualizar tipo" ON sense.tipo
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla entidad
CREATE POLICY "Usuarios autenticados pueden actualizar entidad" ON sense.entidad
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla metrica
CREATE POLICY "Usuarios autenticados pueden actualizar metrica" ON sense.metrica
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla localizacion (ESTA ES LA QUE FALTABA)
CREATE POLICY "Usuarios autenticados pueden actualizar localizacion" ON sense.localizacion
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 2. Verificar que las policies se crearon correctamente
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
WHERE schemaname = 'sense' AND cmd = 'UPDATE'
ORDER BY tablename;
