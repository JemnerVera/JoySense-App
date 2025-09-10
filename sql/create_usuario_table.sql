-- 🔐 CREAR TABLA SENSE.USUARIO Y ACTUALIZAR PERMISOS
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Crear tabla sense.usuario
CREATE TABLE IF NOT EXISTS sense.usuario (
    usuarioid SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar usuario administrador por defecto
INSERT INTO sense.usuario (email, nombre, apellido, rol) 
VALUES ('patricio.sandoval@migivagroup.com', 'Patricio', 'Sandoval', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 3. Agregar campos de auditoría a todas las tablas existentes
-- Tabla pais
ALTER TABLE sense.pais 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla empresa
ALTER TABLE sense.empresa 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla fundo
ALTER TABLE sense.fundo 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla nodo
ALTER TABLE sense.nodo 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla tipo
ALTER TABLE sense.tipo 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla ubicacion
ALTER TABLE sense.ubicacion 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla localizacion
ALTER TABLE sense.localizacion 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla entidad
ALTER TABLE sense.entidad 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla metrica
ALTER TABLE sense.metrica 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES sense.usuario(usuarioid),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Otorgar permisos a service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sense.usuario TO service_role;
GRANT USAGE, SELECT ON SEQUENCE sense.usuario_usuarioid_seq TO service_role;

-- 5. Verificar que todos los permisos se otorgaron correctamente
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'sense' 
AND grantee = 'service_role'
AND table_name = 'usuario'
ORDER BY table_name;
