-- 🔐 CONFIGURACIÓN DE RLS POLICIES PARA SCHEMA SENSE
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Habilitar RLS en todas las tablas del schema sense (si no está habilitado)
ALTER TABLE sense.pais ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.fundo ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.ubicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.medicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.nodo ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.tipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.entidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.metrica ENABLE ROW LEVEL SECURITY;
ALTER TABLE sense.localizacion ENABLE ROW LEVEL SECURITY;

-- 2. Crear policies para SELECT (lectura) - Dashboard
-- Policy para tabla pais
CREATE POLICY "Usuarios autenticados pueden leer pais" ON sense.pais
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla empresa
CREATE POLICY "Usuarios autenticados pueden leer empresa" ON sense.empresa
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla fundo
CREATE POLICY "Usuarios autenticados pueden leer fundo" ON sense.fundo
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla ubicacion
CREATE POLICY "Usuarios autenticados pueden leer ubicacion" ON sense.ubicacion
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla medicion
CREATE POLICY "Usuarios autenticados pueden leer medicion" ON sense.medicion
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla nodo
CREATE POLICY "Usuarios autenticados pueden leer nodo" ON sense.nodo
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla tipo
CREATE POLICY "Usuarios autenticados pueden leer tipo" ON sense.tipo
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla entidad
CREATE POLICY "Usuarios autenticados pueden leer entidad" ON sense.entidad
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla metrica
CREATE POLICY "Usuarios autenticados pueden leer metrica" ON sense.metrica
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para tabla localizacion
CREATE POLICY "Usuarios autenticados pueden leer localizacion" ON sense.localizacion
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Crear policies para INSERT (inserción) - Nueva funcionalidad
-- Policy para tabla pais
CREATE POLICY "Usuarios autenticados pueden insertar pais" ON sense.pais
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla empresa
CREATE POLICY "Usuarios autenticados pueden insertar empresa" ON sense.empresa
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla fundo
CREATE POLICY "Usuarios autenticados pueden insertar fundo" ON sense.fundo
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla ubicacion
CREATE POLICY "Usuarios autenticados pueden insertar ubicacion" ON sense.ubicacion
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla medicion
CREATE POLICY "Usuarios autenticados pueden insertar medicion" ON sense.medicion
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla nodo
CREATE POLICY "Usuarios autenticados pueden insertar nodo" ON sense.nodo
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla tipo
CREATE POLICY "Usuarios autenticados pueden insertar tipo" ON sense.tipo
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla entidad
CREATE POLICY "Usuarios autenticados pueden insertar entidad" ON sense.entidad
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla metrica
CREATE POLICY "Usuarios autenticados pueden insertar metrica" ON sense.metrica
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para tabla localizacion
CREATE POLICY "Usuarios autenticados pueden insertar localizacion" ON sense.localizacion
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Verificar que las policies se crearon correctamente
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
WHERE schemaname = 'sense'
ORDER BY tablename, cmd;
