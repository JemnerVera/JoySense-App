# 🔍 Análisis de Políticas RLS Actuales

## 📊 Panorama General del Sistema RLS

### ✅ **Empresa (FUNCIONA)**
**Política RLS Simple y Directa:**

```sql
ALTER POLICY "rls_empresa_sel_auth" ON "joysense"."empresa"
TO authenticated
USING (
  joysense.fn_es_admin_global()
  OR joysense.fn_tiene_permiso_geo_objeto(2::bigint, empresaid::bigint, joysense.op_ver())
  OR joysense.fn_tiene_permiso_geo_objeto(1::bigint, paisid::bigint, joysense.op_ver())
);
```

**Cómo funciona:**
1. **Admin Global**: ✅ Acceso ilimitado
2. **Permiso Directo**: Busca permiso específico en empresa (fuenteid=2)
3. **Permiso Heredado**: Busca permiso en país padre (fuenteid=1)
4. **Lógica**: Simple OR conditions, fácil de entender y debuggear

---

## ❌ **Fundo, Ubicación, Nodo (NO FUNCIONAN)**

### 🔴 **Problema Común: Lógica Excesivamente Compleja**

Todas estas tablas usan el mismo patrón problemático:

```sql
-- Patrón PROBLEMÁTICO usado en fundo, ubicacion, nodo:
EXISTS (
  SELECT 1 FROM [joins complejos]
  WHERE [condiciones complejas]
    AND (
      NOT fn_usuario_tiene_permisos_finos_en_empresa(...)
      OR [múltiples funciones de subtree]
    )
)
```

### 📋 **Análisis Detallado por Tabla:**

#### **1. Fundo (rls_fundo_sel_auth)**
```sql
USING (
  fn_es_admin_global()
  OR (
    EXISTS (SELECT 1 FROM usuario_empresa ue
           WHERE ue.usuarioid = fn_usuarioid_actual()
             AND ue.empresaid = fundo.empresaid
             AND ue.statusid = 1)
    AND (
      NOT fn_usuario_tiene_permisos_finos_en_empresa(auth.uid(), empresaid)
      OR fn_usuario_puede_ver_subtree_fundo(auth.uid(), fundoid)
    )
  )
);
```

**Problemas:**
- ❌ Requiere que el usuario esté asignado a la empresa (`usuario_empresa`)
- ❌ Lógica de permisos finos vs subtree es confusa
- ❌ No sigue el patrón simple de empresa
- ❌ No permite herencia directa de permisos

#### **2. Ubicación (rls_ubicacion_sel_auth)**
```sql
USING (
  fn_es_admin_global()
  OR EXISTS (
    SELECT 1 FROM (fundo f JOIN usuario_empresa ue ON ...)
    WHERE f.fundoid = ubicacion.fundoid
      AND (
        NOT fn_usuario_tiene_permisos_finos_en_empresa(...)
        OR fn_usuario_puede_ver_subtree_ubicacion(...)
        OR fn_usuario_puede_ver_subtree_fundo(...)
      )
  )
);
```

**Problemas:**
- ❌ JOIN triple complejo (ubicacion → fundo → usuario_empresa)
- ❌ Múltiples funciones de subtree que pueden fallar
- ❌ No hay permisos directos en ubicación

#### **3. Nodo (rls_nodo_sel_auth)**
```sql
USING (
  fn_es_admin_global()
  OR EXISTS (
    SELECT 1 FROM ((ubicacion ub JOIN fundo f ON ...)
                   JOIN usuario_empresa ue ON ...)
    WHERE ub.ubicacionid = nodo.ubicacionid
      AND (
        NOT fn_usuario_tiene_permisos_finos_en_empresa(...)
        OR [3 funciones diferentes de subtree]
      )
  )
);
```

**Problemas:**
- ❌ JOIN cuádruple ultra-complejo
- ❌ 3 funciones de subtree diferentes que deben evaluarse
- ❌ Extremadamente difícil de debuggear

---

## ✅ **Localización (FUNCIONA MEJOR)**

**Política RLS más simple:**

```sql
ALTER POLICY "rls_localizacion_sel_auth" ON "joysense"."localizacion"
TO authenticated
USING (
  fn_es_admin_global()
  OR fn_usuario_puede_operar_localizacion(localizacionid, nodoid, op_ver())
);
```

**Ventajas:**
- ✅ Usa una sola función centralizada
- ✅ Delega la lógica compleja a la función
- ✅ Más mantenible que las otras

---

## 🚨 **Diagnóstico del Problema Principal**

### **¿Por qué Empresa funciona y las otras no?**

| Aspecto | Empresa ✅ | Fundo/Ubicación/Nodo ❌ |
|---------|------------|-------------------------|
| **Complejidad** | Simple (3 OR conditions) | Ultra-compleja (JOINS múltiples) |
| **Permisos Directos** | ✅ Sí | ❌ No (solo heredados complejos) |
| **Herencia** | ✅ Simple (país → empresa) | ❌ Confusa (empresa → usuario_empresa → permisos finos → subtree) |
| **Dependencias** | ✅ Solo funciones core | ❌ 4-5 funciones interdependientes |
| **Debugging** | ✅ Fácil | ❌ Casi imposible |
| **Mantenimiento** | ✅ Simple | ❌ Muy complejo |

### **Raíz del Problema:**

1. **Enfoque Diferente**: Empresa usa permisos directos + herencia simple. Las otras usan lógica de "pertenencia a empresa" + "permisos finos" + "subtree"

2. **Sobre-ingeniería**: Las políticas de fundo/ubicacion/nodo intentan ser demasiado inteligentes, creando dependencias complejas que fallan

3. **Falta de Patrón Consistente**: Cada tabla tiene su propia lógica compleja en lugar de seguir el patrón simple de empresa

---

## 💡 **Solución Recomendada**

### **Volver al Patrón de Empresa:**

```sql
-- Para TODAS las tablas geográficas:
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(FUENTE_ID, OBJETO_ID, op_ver())
  OR [permisos heredados de niveles superiores]
)
```

### **Beneficios:**
- ✅ **Simple**: Fácil de entender y mantener
- ✅ **Consistente**: Mismo patrón en todas las tablas
- ✅ **Directo**: Permisos explícitos + herencia clara
- ✅ **Debuggable**: Fácil identificar problemas
- ✅ **Escalable**: Nuevo patrón para futuras tablas

---

## 🔧 **Plan de Implementación**

1. **Mantener Empresa** como está (funciona bien)
2. **Simplificar Fundo, Ubicación, Nodo** usando patrón de Empresa
3. **Mejorar Localización** si es necesario
4. **Crear script de diagnóstico** para validar cambios
5. **Documentar nuevo patrón** para futuras implementaciones