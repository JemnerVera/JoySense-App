# 📁 Carpeta Auth - Documentación de Autenticación y Permisos

Esta carpeta contiene documentación y scripts útiles relacionados con el sistema de autenticación y permisos de JoySense.

## 📋 Archivos Disponibles

### 📚 Documentación

- **`COMO_FUNCIONA_SISTEMA_PERMISOS.md`** - Explicación completa del sistema de permisos en 3 capas
- **`COMO_FUNCIONAN_VISTAS_PERMISOS.md`** - Cómo se llenan las vistas de permisos dinámicamente
- **`DIAGRAMA_SISTEMA_PERMISOS.md`** - Diagrama visual del flujo de permisos
- **`GESTION_PERMISOS_AUTOMATICA.md`** - Gestión automática de permisos al insertar empresas/fundos

### 🔧 Scripts SQL Útiles

- **`TRIGGERS_AUTO_PERMISOS.sql`** - Triggers para crear permisos automáticamente (pais, empresa, fundo)
- **`INSERTAR_PERMISOS_EMPRESA_FUNDO_SIMPLE.sql`** - Script para insertar permisos manualmente para empresas/fundos existentes
- **`CREAR_USUARIO_MANUAL.sql`** - Guía paso a paso para crear usuarios manualmente (método recomendado)
- **`CREAR_PERFIL_Y_ASIGNAR.sql`** - Script para crear un perfil y asignarlo a un usuario
- **`ASIGNAR_PERFIL_ADMIN.sql`** - Script para asignar perfil de administrador a un usuario

## 🚀 Uso Rápido

### Para crear un nuevo usuario:

1. **Crear usuario en `joysense.usuario`** (desde WebApp o SQL) con `useruuid = NULL`
2. **Crear usuario en Supabase Dashboard** → Authentication → Users
3. **Actualizar `useruuid`** en `joysense.usuario` con el UUID de Supabase
4. **Crear correo principal** (tabla `correo`)
5. **Asignar perfil y permisos geográficos** usando los scripts disponibles

Ver `CREAR_USUARIO_MANUAL.sql` para instrucciones detalladas.

### Para insertar permisos manualmente (empresa/fundo existentes):

```sql
-- Ejecutar: INSERTAR_PERMISOS_EMPRESA_FUNDO_SIMPLE.sql
```

### Para crear triggers automáticos:

```sql
-- Ejecutar: TRIGGERS_AUTO_PERMISOS.sql
```

## 📖 Conceptos Clave

- **RLS (Row Level Security)**: Políticas que controlan acceso a nivel de fila usando `auth.uid()`
- **Vistas de Permisos**: `v_permiso_pais`, `v_permiso_empresa`, `v_permiso_fundo`, `v_permiso_ubicacion`
- **Tabla Base**: `perfil_geografia_permiso` - Define permisos por perfil y nivel geográfico
- **Triggers**: Crean permisos automáticamente al insertar nuevos registros geográficos
- **UUID Matching**: El `useruuid` en `joysense.usuario` debe coincidir con `id` en `auth.users`

## ⚠️ Notas Importantes

- **Siempre crear usuarios en Supabase Dashboard**, no mediante INSERT directo en `auth.users`
- El backend ahora usa **RLS con tokens de sesión del frontend** (no credenciales de admin)
- Todas las queries respetan RLS automáticamente usando `userSupabase`
