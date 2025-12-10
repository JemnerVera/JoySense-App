# 🔍 Resumen: Error 500 en perfil_geografia_permiso

## ❌ Problema

Al intentar acceder a la tabla `perfil_geografia_permiso` desde el frontend, se obtiene un error 500:

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
GET /api/joysense/generic/perfil_geografia_permiso?page=1&pageSize=25
```

## 🔑 Causa Raíz

**Row Level Security (RLS) está habilitado en la tabla pero:**
1. No hay políticas RLS creadas, O
2. Las políticas RLS existen pero no permiten el acceso al usuario actual

Cuando RLS está habilitado sin políticas, PostgreSQL rechaza todas las consultas con un error que se traduce en 500.

## ✅ Solución

### Opción 1: Crear Políticas RLS (RECOMENDADO)

Ejecutar el script SQL: `auth/SOLUCION_RLS_PERFIL_GEOGRAFIA_PERMISO.sql`

Este script crea políticas que:
- **SELECT**: Permiten ver permisos a usuarios con `perfilid = 1` (administrador) o permisos de su propio perfil
- **INSERT/UPDATE/DELETE**: Solo permiten a administradores (`perfilid = 1`)

**Pasos:**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar y ejecutar el contenido de `SOLUCION_RLS_PERFIL_GEOGRAFIA_PERMISO.sql`
3. Verificar que las políticas se crearon correctamente

### Opción 2: Deshabilitar RLS (NO RECOMENDADO para producción)

```sql
ALTER TABLE joysense.perfil_geografia_permiso DISABLE ROW LEVEL SECURITY;
```

⚠️ **Advertencia**: Esto deshabilita completamente RLS y permite acceso sin restricciones.

### Opción 3: Política Permisiva para Desarrollo

```sql
CREATE POLICY rls_perfil_geografia_permiso_all
ON joysense.perfil_geografia_permiso
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

⚠️ **Advertencia**: Solo usar en desarrollo, permite acceso completo a todos los usuarios autenticados.

## 🔍 Verificación

Después de aplicar la solución, verificar:

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'joysense' 
  AND tablename = 'perfil_geografia_permiso';

-- Verificar políticas creadas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename = 'perfil_geografia_permiso';

-- Probar acceso (como usuario autenticado)
SELECT COUNT(*) FROM joysense.perfil_geografia_permiso;
```

## 📝 Notas Importantes

1. **Las políticas RLS usan `auth.uid()`**: Requieren que el usuario esté autenticado en Supabase Auth
2. **El backend pasa el token del usuario**: El middleware `optionalAuth` crea un cliente de Supabase con el token del frontend
3. **La tabla debe tener `useruuid`**: Las políticas verifican que `usuario.useruuid = auth.uid()` para identificar al usuario

## 🚀 Estado Actual

- ✅ Backend configurado para pasar token del usuario
- ✅ Rutas específicas en `usuarios.js` para `perfil_geografia_permiso`
- ✅ Ruta genérica en `generic.js` con soporte para esta tabla
- ✅ Lógica especial en `pagination.js` para ordenamiento (usa `permisoid` en lugar de `datecreated`)
- ❌ **FALTA**: Ejecutar el script SQL para crear las políticas RLS

## 📋 Próximos Pasos

1. Ejecutar `SOLUCION_RLS_PERFIL_GEOGRAFIA_PERMISO.sql` en Supabase SQL Editor
2. Verificar que las políticas se crearon correctamente
3. Probar acceso desde el frontend
4. Si persiste el error, verificar logs del backend para el error específico
