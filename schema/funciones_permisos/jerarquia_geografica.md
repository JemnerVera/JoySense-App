# Jerarquía Geográfica - Reglas de Permisos

## 📍 Jerarquía Completa del Sistema

```
País (1) → Empresa (2) → Fundo (3) → Ubicación (4) → Nodo (5) → Localización (6)
```

## 🎯 Reglas Fundamentales de Herencia

### 1. **Permisos Explícitos vs Heredados**
- **Explícito**: Permiso directo sobre un objeto específico
- **Heredado**: Permiso obtenido de un nivel superior en la jerarquía

### 2. **Principio de Herencia Descendente**
Si tienes permiso en un nivel **superior**, automáticamente tienes acceso a todos los niveles **inferiores**:

- ✅ **País** → Puede acceder a todas sus Empresas, Fundos, Ubicaciones, Nodos, Localizaciones
- ✅ **Empresa** → Puede acceder a todos sus Fundos, Ubicaciones, Nodos, Localizaciones
- ✅ **Fundo** → Puede acceder a todas sus Ubicaciones, Nodos, Localizaciones
- ✅ **Ubicación** → Puede acceder a todos sus Nodos, Localizaciones
- ✅ **Nodo** → Puede acceder a todas sus Localizaciones

### 3. **Permisos Globales vs Específicos**
- **Global**: `objetoid = NULL` → Aplica a todos los objetos de ese tipo
- **Específico**: `objetoid = ID` → Aplica solo a ese objeto específico

## 📊 Ejemplos Prácticos

### Usuario con permiso global en Empresa (2):
```sql
-- Tiene acceso a TODOS los fundos, ubicaciones, nodos y localizaciones
-- de TODAS las empresas donde tiene permiso
```

### Usuario con permiso específico en Fundo (3) ID=123:
```sql
-- Tiene acceso SOLO al fundo 123 y todos sus hijos:
-- - Todas las ubicaciones del fundo 123
-- - Todos los nodos de esas ubicaciones
-- - Todas las localizaciones de esos nodos
```

### Usuario con permiso específico en Ubicación (4) ID=456:
```sql
-- Tiene acceso SOLO a la ubicación 456 y sus hijos:
-- - Todos los nodos de la ubicación 456
-- - Todas las localizaciones de esos nodos
-- NO tiene acceso a otros ubicaciones del mismo fundo
```

## 🔍 Lógica de Evaluación de Permisos

### Para cada tabla, se evalúa en orden:

1. **¿Es admin global?** → ✅ Permitir acceso completo
2. **¿Tiene permiso explícito en este objeto?** → ✅ Permitir
3. **¿Tiene permiso heredado de niveles superiores?** → ✅ Permitir
4. **¿No tiene ningún permiso aplicable?** → ❌ Denegar

## 📋 Políticas RLS por Tabla

### País (1)
```sql
USING (fn_es_admin_global() OR fn_tiene_permiso_geo_objeto(1, paisid, op_ver()))
```

### Empresa (2)
```sql
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(2, empresaid, op_ver())
  OR fn_tiene_permiso_geo_objeto(1, paisid, op_ver())
)
```

### Fundo (3)
```sql
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(3, fundoid, op_ver())
  OR fn_tiene_permiso_geo_objeto(2, empresaid, op_ver())
  OR fn_tiene_permiso_geo_objeto(1, [pais del fundo], op_ver())
)
```

### Ubicación (4)
```sql
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(4, ubicacionid, op_ver())
  OR fn_tiene_permiso_geo_objeto(3, fundoid, op_ver())
  OR [permisos heredados de empresa/pais]
)
```

### Nodo (5)
```sql
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(5, nodoid, op_ver())
  OR fn_tiene_permiso_geo_objeto(4, ubicacionid, op_ver())
  OR [permisos heredados de fundo/empresa/pais]
)
```

### Localización (6)
```sql
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(6, localizacionid, op_ver())
  OR fn_tiene_permiso_geo_objeto(5, nodoid, op_ver())
  OR [permisos heredados de ubicacion/fundo/empresa/pais]
)
```

## 🚨 Notas Importantes

1. **La jerarquía es estricta**: No se permiten "saltos" en la herencia
2. **Los permisos son acumulativos**: Múltiples permisos pueden otorgar acceso
3. **El primer permiso que aplica permite el acceso**: Se evalúa en orden de prioridad
4. **Los admins globales tienen acceso ilimitado**: Saltan todas las validaciones

## 🔧 Solución al Problema Original

**¿Por qué empresa funcionaba y fundo no?**

- **Empresa**: Política simple, directa, sin lógica compleja
- **Fundo**: Política con lógica de `usuario_empresa` + `permisos_finos` + `subtree` que era demasiado restrictiva

**Solución**: Simplificar todas las políticas para seguir el patrón consistente de herencia jerárquica.