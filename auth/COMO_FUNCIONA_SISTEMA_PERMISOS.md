# 🔐 Cómo Funciona el Sistema de Permisos JoySense

## 📋 Resumen

El sistema de permisos funciona en **3 capas**:

1. **Tabla base**: `perfil_geografia_permiso` - Define qué puede hacer cada perfil en cada nivel geográfico
2. **Vistas**: Calculan dinámicamente qué puede hacer cada usuario según su perfil
3. **Políticas RLS**: Verifican los permisos antes de permitir acceso a los datos

## 🔗 Flujo Completo

```
Usuario tiene Perfil
    ↓
Perfil tiene Permisos en perfil_geografia_permiso
    ↓
Vistas calculan permisos del usuario (v_permiso_*)
    ↓
RLS Policy verifica permisos antes de mostrar datos
```

## 📊 Capa 1: Tabla Base - `perfil_geografia_permiso`

Esta tabla define **qué puede hacer cada perfil** en cada nivel geográfico.

### Estructura:

```sql
perfil_geografia_permiso
├── perfilid          → Qué perfil tiene el permiso
├── paisid            → Permiso a nivel PAÍS (solo uno puede estar lleno)
├── empresaid         → Permiso a nivel EMPRESA (solo uno puede estar lleno)
├── fundoid           → Permiso a nivel FUNDO (solo uno puede estar lleno)
├── ubicacionid       → Permiso a nivel UBICACIÓN (solo uno puede estar lleno)
├── puede_ver         → ¿Puede ver los datos?
├── puede_insertar    → ¿Puede insertar datos?
└── puede_actualizar  → ¿Puede actualizar datos?
```

### Ejemplo de Registro:

```sql
INSERT INTO perfil_geografia_permiso (
    perfilid: 1,           -- Perfil "Administrador"
    paisid: 1,             -- Permiso para el país con ID 1
    empresaid: NULL,       -- No tiene permiso específico a nivel empresa
    fundoid: NULL,         -- No tiene permiso específico a nivel fundo
    puede_ver: true,       -- ✅ Puede ver
    puede_insertar: true,  -- ✅ Puede insertar
    puede_actualizar: true -- ✅ Puede actualizar
);
```

**Constraint importante**: Solo UNO de los campos geográficos (`paisid`, `empresaid`, `fundoid`, `ubicacionid`) puede estar lleno por registro.

## 📊 Capa 2: Vistas - Calculan Permisos del Usuario

Las vistas toman los permisos del perfil y los asocian con el `useruuid` del usuario.

### Vista Intermedia: `v_perfiles_geografia_final`

```sql
SELECT 
    u.useruuid,              -- UUID del usuario (de auth.users)
    pgp.paisid,              -- Nivel geográfico
    pgp.empresaid,
    pgp.fundoid,
    pgp.puede_ver,           -- Permisos del perfil
    pgp.puede_insertar,
    pgp.puede_actualizar
FROM usuarioperfil pu        -- Usuario tiene perfil
JOIN usuario u ON u.usuarioid = pu.usuarioid
JOIN perfil_geografia_permiso pgp ON pgp.perfilid = pu.perfilid
```

**Esta vista dice**: "El usuario con UUID X tiene permisos Y en el nivel geográfico Z porque tiene el perfil P que tiene esos permisos".

### Vistas Específicas

#### `v_permiso_pais`
```sql
SELECT useruuid, paisid, puede_ver, puede_insertar, puede_actualizar
FROM v_perfiles_geografia_final
WHERE paisid IS NOT NULL;
```
**Resultado**: Lista de países que el usuario puede ver/insertar/actualizar.

#### `v_permiso_empresa`
```sql
SELECT useruuid, empresaid, puede_ver, puede_insertar, puede_actualizar
FROM v_perfiles_geografia_final
WHERE empresaid IS NOT NULL;
```
**Resultado**: Lista de empresas que el usuario puede ver/insertar/actualizar.

#### `v_permiso_fundo`
```sql
SELECT useruuid, fundoid, puede_ver, puede_insertar, puede_actualizar
FROM v_perfiles_geografia_final
WHERE fundoid IS NOT NULL;
```
**Resultado**: Lista de fundos que el usuario puede ver/insertar/actualizar.

## 📊 Capa 3: Políticas RLS - Verifican Permisos

Las políticas RLS se ejecutan **automáticamente** antes de cada query y verifican si el usuario tiene permiso.

### Política RLS de SELECT (ejemplo empresa):

```sql
CREATE POLICY rls_empresa_select ON joysense.empresa
FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_empresa v 
        WHERE v.empresaid = empresa.empresaid      -- ¿Esta empresa?
          AND v.useruuid = auth.uid()              -- ¿Este usuario?
          AND v.puede_ver = true                   -- ¿Tiene permiso de ver?
    )
);
```

**Cómo funciona:**
1. Usuario ejecuta: `SELECT * FROM empresa`
2. PostgreSQL ejecuta la política RLS **antes** de mostrar los datos
3. Para cada fila de `empresa`, verifica:
   - ¿Existe un registro en `v_permiso_empresa` con `empresaid = empresa.empresaid`?
   - ¿Y con `useruuid = auth.uid()` (UUID del usuario autenticado)?
   - ¿Y con `puede_ver = true`?
4. Si **SÍ existe** → Muestra la fila
5. Si **NO existe** → Oculta la fila

### Política RLS de INSERT (ejemplo empresa):

```sql
CREATE POLICY rls_empresa_insert ON joysense.empresa
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_empresa v 
        WHERE v.empresaid = empresa.empresaid
          AND v.useruuid = auth.uid()
          AND v.puede_insertar = true
    )
);
```

**Cómo funciona:**
1. Usuario intenta: `INSERT INTO empresa (...) VALUES (...)`
2. PostgreSQL verifica la política RLS **antes** de insertar
3. Verifica si existe permiso de `puede_insertar` para esa empresa
4. Si **SÍ existe** → Permite la inserción
5. Si **NO existe** → Rechaza la inserción

## 🎯 Ejemplo Completo

### Escenario: Usuario quiere ver empresas

1. **Usuario autenticado**: `administrador@joysense.com` (UUID: `abc-123`)
2. **Usuario tiene perfil**: Perfil ID 1 (Administrador)
3. **Perfil tiene permisos**:
   - ✅ `perfil_geografia_permiso` con `paisid=1` → Funciona
   - ❌ NO hay `perfil_geografia_permiso` con `empresaid` → No funciona
   - ❌ NO hay `perfil_geografia_permiso` con `fundoid` → No funciona

4. **Vista `v_permiso_pais`**:
   ```sql
   useruuid: abc-123, paisid: 1, puede_ver: true
   ```
   ✅ Tiene datos

5. **Vista `v_permiso_empresa`**:
   ```sql
   (vacía - no hay registros)
   ```
   ❌ No tiene datos

6. **Query**: `SELECT * FROM empresa`
7. **RLS Policy verifica**:
   - Para cada empresa, busca en `v_permiso_empresa`
   - No encuentra registros con `useruuid = abc-123`
   - **Resultado**: Retorna 0 filas (todas bloqueadas)

## 🔍 Por Qué `pais` Funciona y `empresa`/`fundo` No

### `v_permiso_pais` tiene datos porque:

1. Existe registro en `perfil_geografia_permiso`:
   ```sql
   perfilid: 1, paisid: 1, puede_ver: true
   ```

2. El usuario tiene ese perfil asignado en `usuarioperfil`

3. La vista `v_perfiles_geografia_final` encuentra el registro y lo asocia con el `useruuid`

4. `v_permiso_pais` filtra y muestra:
   ```sql
   useruuid: abc-123, paisid: 1, puede_ver: true
   ```

5. La política RLS encuentra el registro y permite ver el país

### `v_permiso_empresa` está vacía porque:

1. **NO existe** registro en `perfil_geografia_permiso` con `empresaid` lleno

2. La vista `v_perfiles_geografia_final` no encuentra ningún registro con `empresaid`

3. `v_permiso_empresa` filtra y muestra:
   ```sql
   (vacía - no hay registros)
   ```

4. La política RLS no encuentra registros y bloquea todas las empresas

## ✅ Solución

Para que `empresa` y `fundo` funcionen, necesitas insertar registros en `perfil_geografia_permiso` con `empresaid` y `fundoid` para el perfil del administrador.

**Ejemplo:**
```sql
-- Dar permiso al perfil del administrador para TODAS las empresas
INSERT INTO perfil_geografia_permiso (perfilid, empresaid, puede_ver, puede_insertar, puede_actualizar, statusid, usercreatedid)
SELECT 
    up.perfilid,        -- Perfil del administrador
    e.empresaid,        -- Cada empresa
    true, true, true,   -- Todos los permisos
    1, 1                -- Activo
FROM usuarioperfil up
JOIN usuario u ON u.usuarioid = up.usuarioid
CROSS JOIN empresa e
WHERE u.login = 'administrador@joysense.com'
  AND e.statusid = 1;
```

Después de esto:
- `v_permiso_empresa` tendrá datos
- Las políticas RLS encontrarán los permisos
- El usuario podrá ver las empresas
