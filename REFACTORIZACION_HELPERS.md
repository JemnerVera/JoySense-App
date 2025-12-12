# 🔄 Plan de Refactorización: Eliminar Funciones Helper

## 📋 Resumen

Las funciones helper (`db.select`, `db.insert`, `db.update`, etc.) autentican automáticamente con el admin, lo que:
- ❌ Bypassa RLS (usa contexto del admin, no del usuario)
- ❌ Ignora permisos del usuario
- ❌ Es inseguro para producción

**Solución**: Refactorizar todas las rutas para usar directamente Supabase API con el token del usuario.

## 🎯 Objetivo

Eliminar las funciones helper y usar directamente `userSupabase` del request (como ya se hace en `geografia.js` y `generic.js`).

## 📝 Archivos a Refactorizar

### 1. `backend/routes/usuarios.js`
- ✅ Ya usa `userSupabase` en algunas rutas (perfil_geografia_permiso)
- ❌ Todavía usa `db.insert`, `db.update` en:
  - POST /usuario
  - PUT /usuario/:id
  - POST /perfil
  - PUT /perfil/:id
  - POST /usuarioperfil
  - POST /codigotelefono
  - PUT /codigotelefono/:id
  - POST /contacto
  - PUT /contacto/:id
  - POST /correo
  - PUT /correo/:id
- ❌ Usa `pool.query` directamente (SQL crudo) en:
  - GET /usuario
  - POST /usuario/login
  - GET /perfil
  - GET /usuarioperfil
  - GET /codigotelefono
  - GET /contacto
  - GET /correo

### 2. `backend/routes/index.js`
- ❌ Usa `db.select`, `db.insert`, `db.update`, `db.rpc` en:
  - GET /test (endpoints de prueba)
  - POST /auth/register
  - POST /auth/reset-password
  - GET /auth/check-email

### 3. `backend/routes/alertas.js`
- ❌ Usa `db.insert`, `db.update` en:
  - POST /criticidad
  - PUT /criticidad/:id
  - POST /umbral
  - PUT /umbral/:id
  - POST /perfilumbral
- ❌ Usa `pool.query` directamente en varias rutas

### 4. `backend/routes/mediciones.js`
- ❌ Usa `db.insert` en:
  - POST /sensor_valor
- ❌ Usa `pool.query` directamente en varias rutas

### 5. `backend/routes/dispositivos.js`
- ❌ Usa `db.select`, `db.insert`, `db.update` en:
  - GET /nodo
  - POST /nodo
  - PUT /nodo/:id
  - POST /sensor
  - PUT /sensor/:id
  - GET /tipo
  - POST /tipo
  - PUT /tipo/:id
  - GET /metrica
  - POST /metrica
  - PUT /metrica/:id
  - POST /metricasensor
  - POST /localizacion
  - PUT /localizacion/:id
  - POST /asociacion
  - PUT /asociacion/:id
- ❌ Usa `pool.query` directamente en varias rutas

## ✅ Archivos que Ya Están Correctos

- `backend/routes/geografia.js` - ✅ Usa `userSupabase` del request
- `backend/routes/generic.js` - ✅ Usa `userSupabase` del request

## 🔧 Pasos de Refactorización

### Paso 1: Agregar middleware `optionalAuth` a todas las rutas
```javascript
const { optionalAuth } = require('../middleware/auth');
router.use(optionalAuth);
```

### Paso 2: Reemplazar `db.*` con `userSupabase`
```javascript
// ANTES:
const { data, error } = await db.insert('tabla', data);

// DESPUÉS:
const userSupabase = req.supabase || baseSupabase;
const { data, error } = await userSupabase.schema(dbSchema).from('tabla').insert(data).select();
```

### Paso 3: Reemplazar `pool.query` con Supabase API
```javascript
// ANTES:
const result = await pool.query(`SELECT * FROM ${dbSchema}.tabla`);

// DESPUÉS:
const userSupabase = req.supabase || baseSupabase;
const { data, error } = await userSupabase.schema(dbSchema).from('tabla').select('*');
```

### Paso 4: Eliminar funciones helper y credenciales
- Eliminar `authenticateBackend()`, `ensureAuthenticated()`
- Eliminar `db.select`, `db.insert`, `db.update`, `db.delete`, `db.rpc`, `db.count`
- Eliminar `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`

## ⚠️ Consideraciones Especiales

1. **Rutas de autenticación** (`/auth/register`, `/auth/reset-password`):
   - Estas rutas NO deben usar token de usuario (son públicas)
   - Pueden usar `baseSupabase` sin autenticación o crear un cliente especial

2. **Rutas de test** (`/test`):
   - Pueden mantenerse con `baseSupabase` para pruebas
   - O eliminarse si no son necesarias en producción

3. **Rutas que usan `pool.query` directamente**:
   - Refactorizar a Supabase API para mantener consistencia
   - Si hay queries complejas, considerar crear funciones RPC en PostgreSQL

## 📊 Impacto

- **Seguridad**: ✅ Mejora significativa (RLS funciona correctamente)
- **Mantenibilidad**: ✅ Código más consistente y fácil de mantener
- **Performance**: ✅ Sin cambios significativos
- **Compatibilidad**: ⚠️ Requiere refactorización de múltiples archivos

## 🚀 Orden de Refactorización Recomendado

1. `backend/routes/usuarios.js` (más crítico - maneja usuarios)
2. `backend/routes/index.js` (rutas de auth y test)
3. `backend/routes/dispositivos.js`
4. `backend/routes/alertas.js`
5. `backend/routes/mediciones.js`
6. Eliminar funciones helper de `backend/config/database.js`
7. Eliminar credenciales de admin del `.env`
