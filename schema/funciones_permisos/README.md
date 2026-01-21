# Funciones de Permisos - JoySense

Este directorio contiene todas las funciones relacionadas con el sistema de permisos y RLS (Row Level Security) de JoySense.

## 📁 Archivos organizados:

### 🔧 Funciones Core de Permisos:
- `fn_es_admin_global.sql` - Verifica si usuario es administrador global
- `fn_usuarioid_actual.sql` - Obtiene ID del usuario actual
- `fn_permiso_aplica.sql` - Verifica si operación está permitida según flags
- `fn_tiene_permiso_geo_objeto.sql` - Verifica permisos sobre objetos geográficos
- `fn_tiene_permiso_tabla_id.sql` - Verifica permisos sobre tablas
- `operaciones.sql` - Constantes de operaciones (op_ver, op_insertar, etc.)

### 🌍 Funciones de Geografía y Localización:
- `fn_usuario_tiene_permisos_finos_en_empresa.sql` - Verifica permisos finos en empresa
- `fn_usuario_puede_ver_subtree_fundo.sql` - Verifica acceso a subárbol de fundo
- `fn_usuario_puede_operar_localizacion.sql` - Verifica permisos en localización (completa)
- `fn_usuario_puede_operar_localizacion_sobrecargada.sql` - Verifica permisos en localización (simplificada)

### 🔧 Soluciones y Fixes:
- `fix_rls_fundo.sql` - Corrección para políticas RLS de tablas geográficas
- `diagnostico_permisos.sql` - Script de diagnóstico para problemas de permisos

## 🚨 Problema identificado:

Las tablas de geografía (`fundo`, `ubicacion`, `localizacion`) no funcionan correctamente con RLS porque:

1. **Tabla `empresa` funciona** ✅
   - Política RLS simple y directa
   - Usa `fn_tiene_permiso_geo_objeto` correctamente

2. **Tablas de geografía NO funcionan** ❌
   - Políticas RLS demasiado complejas
   - Lógica de `fn_usuario_tiene_permisos_finos_en_empresa` + `fn_usuario_puede_ver_subtree_fundo` es restrictiva
   - No siguen el patrón consistente de `empresa`

## 💡 Solución propuesta:

Aplicar el patrón de `empresa` a todas las tablas geográficas:

```sql
-- Patrón consistente para TODAS las tablas geográficas:
USING (
  joysense.fn_es_admin_global()
  OR joysense.fn_tiene_permiso_geo_objeto(FUENTE_ID, OBJETO_ID, joysense.op_ver())
  OR [permisos heredados de niveles superiores]
)
```

## 🛠️ Aplicación de fix:

1. Ejecutar `fix_rls_fundo.sql` en la base de datos
2. Usar `diagnostico_permisos.sql` para verificar el funcionamiento
3. Probar consultas a `fundo`, `ubicacion`, `localizacion`

## 📋 Jerarquía Geográfica y Fuentes de Objetos:

### 🔗 **Jerarquía Completa:**
```
País (1) → Empresa (2) → Fundo (3) → Ubicación (4) → Nodo (5) → Localización (6)
```

### 📍 **Detalles de cada nivel:**

- **`1` = País**: Nivel más alto, contiene empresas
- **`2` = Empresa**: Contiene fundos, hereda permisos de países
- **`3` = Fundo**: Contiene ubicaciones, hereda permisos de empresas
- **`4` = Ubicación**: Contiene nodos, hereda permisos de fundos
- **`5` = Nodo**: Contiene localizaciones, hereda permisos de ubicaciones
- **`6` = Localización**: Nivel más bajo, hereda permisos de nodos

### 🎯 **Reglas de Herencia de Permisos:**

1. **Permisos Explícitos**: Si tienes permiso directo sobre un objeto, puedes acceder a él
2. **Permisos Heredados**: Si tienes permiso sobre un nivel superior, puedes acceder a todos los niveles inferiores
3. **Permisos Globales**: Los permisos con `objetoid = NULL` aplican a todos los objetos de ese tipo

### 📊 **Ejemplos de Herencia:**

- ✅ **Permiso en Empresa (2)** → Acceso a todos sus Fundos (3), Ubicaciones (4), Nodos (5), Localizaciones (6)
- ✅ **Permiso en Fundo (3)** → Acceso a todas sus Ubicaciones (4), Nodos (5), Localizaciones (6)
- ✅ **Permiso en Ubicación (4)** → Acceso a todos sus Nodos (5), Localizaciones (6)
- ✅ **Permiso en Nodo (5)** → Acceso a todas sus Localizaciones (6)

## 🔍 Debugging:

Si los permisos siguen sin funcionar, usar el script de diagnóstico para:

1. Verificar usuario actual y empresas asignadas
2. Comprobar permisos específicos por objeto
3. Revisar políticas RLS activas
4. Identificar dónde falla la cadena de permisos