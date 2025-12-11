# 🔍 Diagnóstico: Problema con RLS en empresa y fundo

## 📋 Resumen del Problema

- ✅ `pais` funciona correctamente (muestra 1 registro)
- ❌ `empresa` muestra 0 registros (aunque hay datos insertados)
- ❌ `fundo` muestra 0 registros (aunque hay datos insertados)

## 🔎 Análisis de las Queries

### Query 1: Políticas RLS
**Resultado:** Las políticas RLS son **idénticas** en estructura entre `pais`, `empresa` y `fundo`.

Todas usan el mismo patrón:
- `rls_*_select`: Verifica permisos en `v_permiso_*`
- `rls_*_insert`: Verifica permisos en `v_permiso_*`
- `rls_*_update`: Verifica permisos en `v_permiso_*`

### Query 2: Comparación
**Resultado:** No hay diferencias estructurales entre las políticas.

### Query 3: RLS Habilitado
**Resultado:** 
- ✅ `pais`: RLS habilitado
- ✅ `empresa`: RLS habilitado
- ✅ `fundo`: RLS habilitado
- ❌ `entidad`: RLS deshabilitado (por eso funciona sin problemas)

### Query 4: Permisos GRANT
**Resultado:** Los permisos GRANT son **idénticos** para todas las tablas:
- `anon`: SELECT
- `authenticated`: SELECT, INSERT, UPDATE

## 🎯 Causa Raíz Identificada

El problema **NO** está en:
- ❌ Las políticas RLS (son idénticas)
- ❌ Los permisos GRANT (son idénticos)
- ❌ La estructura de las tablas

El problema **SÍ** está en:
- ✅ **Las vistas de permisos** (`v_permiso_empresa`, `v_permiso_fundo`)
- ✅ Probablemente estas vistas **no tienen registros** para el usuario autenticado
- ✅ Mientras que `v_permiso_pais` **sí tiene registros** para el usuario

## 🔍 Política RLS de SELECT (ejemplo empresa)

```sql
EXISTS (
  SELECT 1 
  FROM joysense.v_permiso_empresa v 
  WHERE v.empresaid = empresa.empresaid 
    AND v.useruuid = auth.uid() 
    AND v.puede_ver
)
```

**Esto significa:**
- El usuario solo puede ver empresas donde existe un registro en `v_permiso_empresa`
- Con su `useruuid` (`auth.uid()`)
- Y con `puede_ver = true`

## 📝 Próximos Pasos

1. **Ejecutar las queries en `QUERIES_VERIFICAR_VISTAS_PERMISOS.sql`**
   - Obtener el UUID del usuario autenticado
   - Verificar si hay registros en `v_permiso_empresa` y `v_permiso_fundo` para ese usuario
   - Comparar con `v_permiso_pais` (que funciona)

2. **Verificar la estructura de las vistas**
   - Ver de dónde obtienen los datos
   - Verificar si hay diferencias en la lógica

3. **Solución probable:**
   - Insertar registros en las tablas base que alimentan las vistas
   - O modificar las vistas para que incluyan al usuario administrador
   - O crear registros de permisos para el usuario en las tablas de permisos

## 🛠️ Queries a Ejecutar

Ejecuta las queries en `QUERIES_VERIFICAR_VISTAS_PERMISOS.sql` y comparte los resultados.
