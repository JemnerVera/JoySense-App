# 🔐 Gestión Automática de Permisos al Insertar Empresas/Fundos

## 📋 Problema Actual

**Situación**: Cuando insertas una nueva `empresa` o `fundo` desde la webapp, **NO se crea automáticamente** un permiso en `perfil_geografia_permiso`.

**Consecuencia**: 
- La nueva empresa/fundo se inserta correctamente en la base de datos
- Pero **NO aparecerá en el frontend** porque RLS bloquea el acceso
- Solo aparecerá si manualmente insertas un permiso en `perfil_geografia_permiso`

## 🔍 Cómo Funciona Actualmente

### Flujo Actual (SIN automatización):

```
1. Usuario inserta nueva empresa desde webapp
   ↓
2. POST /empresa → Inserta en joysense.empresa
   ↓
3. ✅ Empresa creada en BD
   ↓
4. ❌ NO se crea permiso en perfil_geografia_permiso
   ↓
5. v_permiso_empresa sigue vacía para esa empresa
   ↓
6. RLS Policy bloquea acceso → No aparece en frontend
```

### Ejemplo:

```javascript
// Usuario inserta empresa desde frontend
POST /api/joysense/empresa
{
  "paisid": 1,
  "empresa": "Nueva Empresa SA",
  "empresabrev": "NUEVA",
  "statusid": 1,
  "usercreatedid": 1
}

// ✅ Se inserta en joysense.empresa (empresaid = 2)
// ❌ NO se inserta en perfil_geografia_permiso
// ❌ Usuario NO puede ver la nueva empresa (RLS bloquea)
```

## ✅ Soluciones Propuestas

### Opción 1: Trigger en Base de Datos (RECOMENDADA)

**Ventajas:**
- Automático, no requiere cambios en el código
- Funciona siempre, incluso si se inserta desde SQL directo
- Centralizado en la base de datos

**Desventajas:**
- Requiere acceso a la base de datos para crear el trigger
- Necesita definir qué perfiles obtienen permisos automáticamente

**Implementación:**

```sql
-- Trigger para crear permisos automáticamente al insertar empresa
CREATE OR REPLACE FUNCTION joysense.fn_auto_permiso_empresa()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar permiso para el perfil 1 (Administrador) automáticamente
    INSERT INTO joysense.perfil_geografia_permiso (
        perfilid,
        empresaid,
        puede_ver,
        puede_insertar,
        puede_actualizar,
        statusid,
        usercreatedid
    )
    VALUES (
        1,                  -- Perfil Administrador
        NEW.empresaid,      -- Nueva empresa insertada
        true,               -- puede_ver
        true,               -- puede_insertar
        true,               -- puede_actualizar
        1,                  -- statusid activo
        NEW.usercreatedid   -- Usuario que creó la empresa
    )
    ON CONFLICT DO NOTHING; -- Evitar duplicados
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_permiso_empresa
    AFTER INSERT ON joysense.empresa
    FOR EACH ROW
    WHEN (NEW.statusid = 1)  -- Solo si está activa
    EXECUTE FUNCTION joysense.fn_auto_permiso_empresa();

-- Trigger para fundo (similar)
CREATE OR REPLACE FUNCTION joysense.fn_auto_permiso_fundo()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO joysense.perfil_geografia_permiso (
        perfilid,
        fundoid,
        puede_ver,
        puede_insertar,
        puede_actualizar,
        statusid,
        usercreatedid
    )
    VALUES (
        1,                  -- Perfil Administrador
        NEW.fundoid,        -- Nuevo fundo insertado
        true,               -- puede_ver
        true,               -- puede_insertar
        true,               -- puede_actualizar
        1,                  -- statusid activo
        NEW.usercreatedid   -- Usuario que creó el fundo
    )
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_permiso_fundo
    AFTER INSERT ON joysense.fundo
    FOR EACH ROW
    WHEN (NEW.statusid = 1)
    EXECUTE FUNCTION joysense.fn_auto_permiso_fundo();
```

**Nota**: Puedes modificar el trigger para dar permisos a **múltiples perfiles** o solo al perfil del usuario que inserta.

### Opción 2: Lógica en el Backend

**Ventajas:**
- Control total desde el código
- Puede incluir lógica de negocio más compleja
- No requiere acceso directo a la BD

**Desventajas:**
- Requiere modificar el código del backend
- Solo funciona si se inserta desde la API
- Si se inserta desde SQL directo, no funciona

**Implementación:**

Modificar `backend/routes/geografia.js`:

```javascript
router.post('/empresa', async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    
    // 1. Insertar la empresa
    const { data: empresaData, error: insertError } = await userSupabase
      .schema(dbSchema)
      .from('empresa')
      .insert(req.body)
      .select();
    
    if (insertError) throw insertError;
    
    // 2. Obtener el perfil del usuario que inserta
    const { data: userData } = await userSupabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener el perfilid del usuario
    const { data: usuarioData } = await userSupabase
      .schema(dbSchema)
      .from('usuario')
      .select('usuarioid')
      .eq('useruuid', userData.user.id)
      .single();
    
    if (usuarioData) {
      const { data: perfilData } = await userSupabase
        .schema(dbSchema)
        .from('usuarioperfil')
        .select('perfilid')
        .eq('usuarioid', usuarioData.usuarioid)
        .eq('statusid', 1)
        .single();
      
      if (perfilData) {
        // 3. Crear permiso automáticamente para el perfil del usuario
        await userSupabase
          .schema(dbSchema)
          .from('perfil_geografia_permiso')
          .insert({
            perfilid: perfilData.perfilid,
            empresaid: empresaData[0].empresaid,
            puede_ver: true,
            puede_insertar: true,
            puede_actualizar: true,
            statusid: 1,
            usercreatedid: req.body.usercreatedid || 1
          })
          .select();
      }
    }
    
    res.status(201).json(empresaData);
  } catch (error) {
    logger.error('Error en POST /empresa:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Opción 3: Permisos por Defecto (Solo para Administradores)

**Ventajas:**
- Simple, no requiere triggers ni código adicional
- Funciona si el administrador tiene permisos a nivel `pais`

**Desventajas:**
- Solo funciona si el administrador tiene permiso al `pais` padre
- No es automático, requiere configuración inicial

**Implementación:**

Modificar las políticas RLS para que si un usuario tiene permiso a nivel `pais`, automáticamente pueda ver todas las empresas de ese país:

```sql
-- Política RLS modificada para empresa
CREATE POLICY rls_empresa_select ON joysense.empresa
FOR SELECT
USING (
    -- Opción 1: Tiene permiso específico a la empresa
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_empresa v 
        WHERE v.empresaid = empresa.empresaid
          AND v.useruuid = auth.uid()
          AND v.puede_ver = true
    )
    OR
    -- Opción 2: Tiene permiso al país padre
    EXISTS (
        SELECT 1 
        FROM joysense.v_permiso_pais v 
        WHERE v.paisid = empresa.paisid
          AND v.useruuid = auth.uid()
          AND v.puede_ver = true
    )
);
```

**Nota**: Esto requiere modificar las políticas RLS existentes, lo cual puede afectar la seguridad si no se hace correctamente.

## 🎯 Recomendación

**Opción 1 (Trigger)** es la más recomendada porque:
- ✅ Automática y transparente
- ✅ Funciona siempre, incluso con inserts directos en SQL
- ✅ No requiere cambios en el código de la aplicación
- ✅ Centralizada en la base de datos

**Consideraciones:**
- ¿Qué perfiles deben obtener permisos automáticamente?
  - Solo Administrador (perfil 1)?
  - Todos los perfiles que tienen permiso al país padre?
  - Solo el perfil del usuario que inserta?

## 📝 Script para Implementar Opción 1

He creado `TRIGGERS_AUTO_PERMISOS.sql` con los triggers listos para ejecutar.
