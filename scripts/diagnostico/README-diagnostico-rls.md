# 🔍 Diagnóstico de Políticas RLS

Scripts de JavaScript para diagnosticar problemas con las políticas RLS (Row Level Security) en las tablas geográficas.

## 📋 Archivos

### `diagnostico-rls.js`
Script principal con funciones de diagnóstico que se pueden usar desde la consola del navegador o importar en componentes.

### `DiagnosticoRLS.jsx`
Componente React que proporciona una interfaz gráfica para ejecutar los diagnósticos.

## 🚀 Uso desde la Consola del Navegador

### 1. Abrir la aplicación en el navegador
### 2. Abrir la consola del desarrollador (F12)
### 3. Ejecutar diagnóstico completo:

```javascript
// Diagnóstico completo de todas las tablas
diagnosticoRLS()

// Diagnóstico de una tabla específica
diagnosticoTabla('fundo')
diagnosticoTabla('ubicacion')
diagnosticoTabla('nodo')
```

## 🎯 Uso desde Componente React

### 1. Importar el componente:

```jsx
import DiagnosticoRLS from '../components/DiagnosticoRLS'
```

### 2. Usar en cualquier página:

```jsx
function PaginaDiagnostico() {
  return (
    <div>
      <h1>Diagnóstico RLS</h1>
      <DiagnosticoRLS />
    </div>
  )
}
```

## 📊 Qué Diagnostica

### 🔐 Autenticación
- Verifica si el usuario está autenticado
- Confirma que existe en la base de datos
- Valida el UUID del usuario

### 👤 Configuración de Permisos
- Verifica el perfil asignado
- Lista las empresas asignadas
- Muestra todos los permisos específicos del usuario

### 📋 Acceso a Tablas
- **País**: Solo País 1 (Perú) debería ser accesible
- **Empresa**: Solo Empresa 1 (Agrícola Andrea) debería ser accesible
- **Fundo**: Solo Fundo 1 (Elise) debería ser accesible
- **Ubicación**: TODAS las ubicaciones deberían ser accesibles (permiso global)
- **Nodo**: TODOS los nodos deberían ser accesibles (permiso global)
- **Localización**: TODAS las localizaciones deberían ser accesibles (permiso global)

## 🎯 Resultados Esperados

### Para Usuario Demo (`demo@migivagroup.com`):

```
✅ País 1 (Perú) - accesible
✅ Empresa 1 (Agrícola Andrea) - accesible
✅ Fundo 1 (Elise) - accesible
✅ Ubicaciones: todas - accesibles
✅ Nodos: todos - accesibles
✅ Localizaciones: todas - accesibles
```

### Si NO ves estos resultados:

| Problema | Causa | Solución |
|----------|-------|----------|
| ❌ Fundo 1 no accesible | Política RLS compleja falla | Simplificar política como empresa |
| ❌ Ubicaciones no accesibles | JOINs complejos fallan | Usar patrón simple |
| ❌ Nodos no accesibles | Dependencia de ubicación | Simplificar política |
| ❌ Empresa funciona pero otras no | Políticas diferentes | Unificar patrón |

## 🛠️ Debugging Avanzado

### Desde la Consola:

```javascript
// Ver usuario actual
const { data } = await supabase.auth.getUser()
console.log('Usuario:', data.user)

// Ver permisos
const { data: permisos } = await supabase.from('v_permiso_usuario').select('*')
console.log('Permisos:', permisos)

// Probar tabla específica
const { data: fundos } = await supabase.from('fundo').select('*')
console.log('Fundos accesibles:', fundos)
```

### Verificar Políticas RLS en Supabase:

```sql
-- Ver políticas activas
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'joysense'
  AND tablename IN ('fundo', 'ubicacion', 'nodo', 'localizacion');
```

## ⚠️ Notas Importantes

- **Solo SELECT**: Estos scripts solo ejecutan consultas de lectura
- **Producción Safe**: No modifica datos ni configuración
- **Usuario Demo**: Los resultados esperados son para el usuario demo configurado
- **Consola del Navegador**: Debe ejecutarse con el usuario autenticado en la aplicación

## 🔧 Solución del Problema

Si el diagnóstico muestra que las tablas no son accesibles, la solución es:

1. **Simplificar las políticas RLS** de `fundo`, `ubicacion`, `nodo` para usar el mismo patrón que `empresa`
2. **Eliminar la lógica compleja** de permisos finos + subtree
3. **Usar únicamente** `fn_tiene_permiso_geo_objeto()` con herencia

### Patrón Correcto (como empresa):

```sql
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(FUENTE_ID, OBJETO_ID, op_ver())
  OR [permisos heredados de niveles superiores]
)
```

¡Este diagnóstico te permitirá identificar exactamente dónde fallan las políticas RLS! 🎯