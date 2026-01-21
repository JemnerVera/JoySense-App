# 📋 Carpeta de Diagnóstico RLS

Esta carpeta contiene todas las herramientas y scripts para diagnosticar problemas con las políticas RLS (Row Level Security) en las tablas geográficas de JoySense.

## 📁 Contenido

### 🗄️ **Scripts SQL**
- `diagnostico_rls_actual.sql` - Diagnóstico completo de políticas RLS actuales
- `diagnostico_usuario_demo.sql` - Diagnóstico específico para usuario demo
- `verificar_funciones_existentes.sql` - Verificación de existencia de funciones (creado pero no movido)

### 📊 **Análisis y Documentación**
- `analisis_rls_actual.md` - Análisis detallado de por qué empresa funciona pero otras no
- `jerarquia_geografica.md` - Documentación completa de jerarquía geográfica y permisos
- `README-diagnostico-rls.md` - Instrucciones para usar herramientas frontend

### 🖥️ **Herramientas Frontend**
- `diagnostico-rls.js` - Script JavaScript para diagnóstico desde navegador
- `DiagnosticoRLS.jsx` - Componente React con interfaz gráfica

### 📝 **Resultados**
- `resultados_diagnostico.txt` - Resultados de pruebas ejecutadas

## 🎯 Problema Diagnosticado

**¿Por qué empresa funciona pero fundo/ubicación/nodo no?**

1. **Empresa**: Política RLS simple y directa ✅
2. **Fundo/Ubicación/Nodo**: Políticas RLS complejas con múltiples JOINs y funciones ❌

### Causa Raíz
Las políticas RLS de las tablas geográficas usan lógica excesivamente compleja:
- Múltiples JOINs (ubicacion → fundo → usuario_empresa)
- Funciones interdependientes que pueden fallar
- Lógica de "permisos finos" + "subtree" que complica el acceso

## 🛠️ Solución Recomendada

**Unificar todas las políticas RLS** al patrón simple de empresa:

```sql
USING (
  fn_es_admin_global()
  OR fn_tiene_permiso_geo_objeto(FUENTE_ID, OBJETO_ID, op_ver())
  OR [permisos heredados de niveles superiores]
)
```

## 🚀 Cómo Usar

### 1. Diagnóstico SQL (Supabase)
```sql
-- Ejecutar en SQL Editor de Supabase
\i scripts/diagnostico/diagnostico_usuario_demo.sql
```

### 2. Diagnóstico JavaScript (Navegador)
```javascript
// Abrir consola del navegador en la app
diagnosticoRLS()  // Diagnóstico completo
diagnosticoTabla('fundo')  // Tabla específica
```

### 3. Componente React
```jsx
import DiagnosticoRLS from './scripts/diagnostico/DiagnosticoRLS'
// Usar en cualquier página para diagnóstico visual
```

## 📊 Resultados Esperados

### Usuario Demo Debería Ver:
- ✅ **País 1** (Perú) - permiso específico
- ✅ **Empresa 1** (Agrícola Andrea) - permiso específico
- ✅ **Fundo 1** (Elise) - permiso específico
- ✅ **TODAS las ubicaciones** - permisos globales (objetoid=NULL)
- ✅ **TODOS los nodos** - permisos globales (objetoid=NULL)
- ✅ **TODAS las localizaciones** - permisos globales (objetoid=NULL)

### Si NO ve estos datos:
- ❌ **Fundo 1 no accesible** → Política RLS compleja fallando
- ❌ **Ubicaciones no accesibles** → JOINs complejos fallando
- ❌ **Nodos no accesibles** → Dependencia de ubicación fallando

## 📈 Próximos Pasos

1. **Ejecutar diagnósticos** para confirmar problemas
2. **Aplicar solución**: Simplificar políticas RLS
3. **Re-ejecutar diagnósticos** para verificar corrección
4. **Documentar** cambios realizados

---

**Esta carpeta contiene todo lo necesario para diagnosticar y solucionar los problemas de permisos RLS en las tablas geográficas.** 🔍