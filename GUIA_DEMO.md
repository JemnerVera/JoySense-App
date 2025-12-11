# Guía de Demo - JoySense App

Esta guía te ayudará a realizar una demostración completa del sistema, desde la creación de usuarios hasta la configuración de permisos y geografía.

## 📋 Requisitos Previos

- Acceso al sistema con usuario administrador (perfilid = 1)
- Navegador web actualizado
- Conexión a internet estable

---

## 🚀 Pasos de la Demo

### 1. Iniciar Sesión

1. Abrir la aplicación en el navegador
2. Ingresar con credenciales de administrador:
   - **Email**: `administrador@joysense.com`
   - **Password**: (tu contraseña de administrador)
3. Verificar que se muestre el dashboard principal

---

### 2. Crear Perfil (si no existe)

**Ubicación**: `PARÁMETROS` → `Usuarios` → `Perfil`

1. Navegar a **PARÁMETROS** en el sidebar principal
2. Seleccionar **Usuarios** en el segundo sidebar
3. Seleccionar **Perfil** en el tercer sidebar
4. Ir a la pestaña **CREAR**
5. Completar el formulario:
   - **PERFIL**: `Operador` (o el nombre que desees)
   - **STATUS**: ✅ Activo (checkbox marcado)
6. Hacer clic en **GUARDAR**
7. Verificar que aparezca en la pestaña **ESTADO**

> **Nota**: Si ya existe el perfil "Administrador" (perfilid = 1), puedes saltar este paso.

---

### 3. Crear Usuario

**Ubicación**: `PARÁMETROS` → `Usuarios` → `Usuario`

1. Navegar a **PARÁMETROS** → **Usuarios** → **Usuario**
2. Ir a la pestaña **CREAR**
3. Completar el formulario:
   - **LOGIN**: `demo@joysense.com` (debe ser un email válido)
   - **PASSWORD**: `demo123` (o la contraseña que desees)
   - **NOMBRE**: `Demo`
   - **APELLIDO**: `Usuario`
4. Hacer clic en **CREAR**
5. Verificar que el usuario aparezca en la pestaña **ESTADO** con un `useruuid` asignado

> **⚠️ IMPORTANTE**: Después de crear el usuario, debes asignarle un perfil para que pueda iniciar sesión.

---

### 4. Asignar Perfil al Usuario

**Opción A: Desde la WebApp**

1. Navegar a **PARÁMETROS** → **Usuarios** → **Usuario-Perfil**
2. Ir a la pestaña **CREAR**
3. Completar el formulario:
   - **USUARIO**: Seleccionar el usuario creado (ej: `Demo Usuario`)
   - **PERFIL**: Seleccionar "Administrador" (o el perfil que desees)
4. Hacer clic en **CREAR**

**Opción B: Desde SQL (Más rápido para demo)**

Ejecuta el script `auth/ASIGNAR_PERFIL_ADMIN.sql` en Supabase SQL Editor, cambiando el `usuarioid` en el script por el ID del usuario que acabas de crear.

---

### 5. Verificar que el Usuario Puede Iniciar Sesión

1. Cerrar sesión del usuario actual
2. Intentar iniciar sesión con las credenciales del nuevo usuario:
   - **Email**: El login que usaste (ej: `demo@joysense.com`)
   - **Password**: La contraseña que configuraste
3. Verificar que inicie sesión correctamente

---

### 6. Crear Geografía (País, Empresa, Fundo, Ubicación)
   - **PASSWORD**: `Demo123!` (o la contraseña que desees)
   - **FIRSTNAME**: `Demo`
   - **LASTNAME**: `Usuario`
   - **PERFIL**: Seleccionar el perfil creado en el paso anterior (o "Administrador")
   - **STATUS**: ✅ Activo
4. Hacer clic en **GUARDAR**
5. Verificar en **ESTADO** que el usuario se haya creado correctamente

> **Importante**: El sistema creará automáticamente el usuario en Supabase Auth cuando se guarde.

---

### 4. Crear País

**Ubicación**: `PARÁMETROS` → `Ubicación` → `País`

1. Navegar a **PARÁMETROS** → **Ubicación** → **País**
2. Ir a la pestaña **CREAR**
3. Completar el formulario:
   - **PAÍS**: `Perú`
   - **ABREVIATURA**: `PE`
   - **STATUS**: ✅ Activo
4. Hacer clic en **GUARDAR**
5. Verificar en **ESTADO** que el país aparezca en la lista

---

### 5. Crear Empresa

**Ubicación**: `PARÁMETROS` → `Ubicación` → `Empresa`

1. Navegar a **PARÁMETROS** → **Ubicación** → **Empresa**
2. Ir a la pestaña **CREAR**
3. Completar el formulario:
   - **PAÍS**: Seleccionar "Perú" (creado en el paso anterior)
   - **EMPRESA**: `Agrícola Demo S.A.C.`
   - **ABREVIATURA**: `ADEMO`
   - **STATUS**: ✅ Activo
4. Hacer clic en **GUARDAR**
5. Verificar en **ESTADO** que la empresa aparezca correctamente

---

### 6. Crear Fundo

**Ubicación**: `PARÁMETROS` → `Ubicación` → `Fundo`

1. Navegar a **PARÁMETROS** → **Ubicación** → **Fundo**
2. Ir a la pestaña **CREAR**
3. Completar el formulario:
   - **PAÍS**: Seleccionar "Perú"
   - **EMPRESA**: Seleccionar "Agrícola Demo S.A.C."
   - **FUNDO**: `Fundo Norte`
   - **ABREVIATURA**: `FNORTE`
   - **STATUS**: ✅ Activo
4. Hacer clic en **GUARDAR**
5. Verificar en **ESTADO** que el fundo aparezca correctamente

---

### 7. Crear Ubicación

**Ubicación**: `PARÁMETROS` → `Ubicación` → `Ubicación`

1. Navegar a **PARÁMETROS** → **Ubicación** → **Ubicación**
2. Ir a la pestaña **CREAR**
3. Completar el formulario:
   - **PAÍS**: Seleccionar "Perú"
   - **EMPRESA**: Seleccionar "Agrícola Demo S.A.C."
   - **FUNDO**: Seleccionar "Fundo Norte"
   - **UBICACIÓN**: `Campo 1 - Sector A`
   - **ABREVIATURA**: `C1SA`
   - **STATUS**: ✅ Activo
4. Hacer clic en **GUARDAR**
5. Verificar en **ESTADO** que la ubicación aparezca correctamente

---

### 8. Configurar Permisos Geográficos

**Ubicación**: `PERMISOS` → `GESTIÓN DE PERMISOS`

> **Importante**: Esta sección solo es visible para usuarios con perfil Administrador (perfilid = 1)

1. Navegar a **PERMISOS** en el sidebar principal
2. Seleccionar **GESTIÓN DE PERMISOS** en el segundo sidebar
3. Ir a la pestaña **CREAR**
4. Completar el formulario:
   - **PERFIL**: Seleccionar el perfil del usuario demo (ej: "Operador")
   - **GEOGRAFÍA**: Seleccionar el tipo de geografía:
     - `País` - Para dar acceso a nivel país
     - `Empresa` - Para dar acceso a nivel empresa
     - `Fundo` - Para dar acceso a nivel fundo
     - `Ubicación` - Para dar acceso a nivel ubicación específica
   - **GEOGRAFÍA ESPECÍFICA**: Seleccionar el valor correspondiente según el tipo elegido
     - Si elegiste "País": Seleccionar "Perú"
     - Si elegiste "Empresa": Seleccionar "Agrícola Demo S.A.C."
     - Si elegiste "Fundo": Seleccionar "Fundo Norte"
     - Si elegiste "Ubicación": Seleccionar "Campo 1 - Sector A"
   - **PERMISOS**:
     - ✅ **PUEDE VER**: Marcar (permite ver datos)
     - ✅ **PUEDE INSERTAR**: Marcar (permite crear registros)
     - ✅ **PUEDE ACTUALIZAR**: Marcar (permite modificar registros)
   - **STATUS**: ✅ Activo
5. Hacer clic en **Crear**
6. Verificar en **ESTADO** que el permiso se haya creado correctamente

> **Ejemplo de Permisos**:
> - **Permiso 1**: Perfil "Operador" → País "Perú" → Ver, Insertar, Actualizar
> - **Permiso 2**: Perfil "Operador" → Empresa "Agrícola Demo S.A.C." → Ver, Insertar, Actualizar
> - **Permiso 3**: Perfil "Operador" → Fundo "Fundo Norte" → Solo Ver

---

### 9. Verificar Permisos Creados

**Ubicación**: `PERMISOS` → `GESTIÓN DE PERMISOS` → `ESTADO`

1. Navegar a **PERMISOS** → **GESTIÓN DE PERMISOS** → **ESTADO**
2. Verificar que todos los permisos creados aparezcan en la tabla
3. Verificar que se muestren correctamente:
   - El nombre del perfil (no el ID)
   - El nombre de la geografía (no el ID)
   - Los permisos (PUEDE VER, PUEDE INSERTAR, PUEDE ACTUALIZAR)
   - El usuario que creó/modificó (nombre completo, no "Usuario 1")
   - Las fechas de creación/modificación

---

### 10. Actualizar un Permiso (Opcional)

**Ubicación**: `PERMISOS` → `GESTIÓN DE PERMISOS` → `ACTUALIZAR`

1. Navegar a **PERMISOS** → **GESTIÓN DE PERMISOS** → **ACTUALIZAR**
2. Seleccionar un permiso de la tabla marcando el checkbox
3. Hacer clic en **🔧 Actualizar**
4. Modificar los permisos (marcar/desmarcar checkboxes):
   - **PUEDE VER**
   - **PUEDE INSERTAR**
   - **PUEDE ACTUALIZAR**
5. Hacer clic en **🔧 Actualizar** en el formulario
6. Verificar que los cambios se hayan guardado correctamente

---

## 📝 Notas Importantes

### Orden de Creación
El orden recomendado es:
1. **Perfil** (si no existe)
2. **Usuario**
3. **País**
4. **Empresa** (requiere País)
5. **Fundo** (requiere País y Empresa)
6. **Ubicación** (requiere País, Empresa y Fundo)
7. **Permisos Geográficos** (requiere Perfil y Geografía)

### Validaciones
- Los emails deben ser válidos (formato: `usuario@dominio.com`)
- Las abreviaturas deben ser únicas
- No se pueden eliminar registros (solo desactivar con STATUS)
- Los permisos geográficos solo pueden tener UN tipo de geografía por registro (País O Empresa O Fundo O Ubicación)

### Permisos de Usuario
- Solo usuarios con **perfilid = 1** (Administrador) pueden ver y gestionar la sección **PERMISOS**
- Los permisos geográficos controlan qué datos puede ver/crear/modificar cada usuario según su perfil

---

## 🎯 Flujo Completo de Demo

Para una demo completa, sigue este orden:

```
1. Login como Administrador
   ↓
2. Crear Perfil "Operador"
   ↓
3. Crear Usuario "demo@joysense.com" con perfil "Operador"
   ↓
4. Crear País "Perú"
   ↓
5. Crear Empresa "Agrícola Demo S.A.C." en Perú
   ↓
6. Crear Fundo "Fundo Norte" en la empresa
   ↓
7. Crear Ubicación "Campo 1 - Sector A" en el fundo
   ↓
8. Configurar Permisos:
   - Operador → País Perú → Ver, Insertar, Actualizar
   - Operador → Empresa Agrícola Demo → Ver, Insertar, Actualizar
   ↓
9. Verificar en ESTADO que todo esté correcto
   ↓
10. (Opcional) Actualizar un permiso para demostrar la funcionalidad
```

---

## ✅ Checklist de Verificación

Antes de finalizar la demo, verifica:

- [ ] Usuario creado y visible en ESTADO
- [ ] País creado y visible en ESTADO
- [ ] Empresa creada y visible en ESTADO
- [ ] Fundo creado y visible en ESTADO
- [ ] Ubicación creada y visible en ESTADO
- [ ] Permisos geográficos creados y visibles en ESTADO
- [ ] Los nombres se muestran correctamente (no IDs) en las tablas
- [ ] Los usuarios se muestran con nombre completo (no "Usuario 1")
- [ ] Los permisos muestran "PUEDE VER", "PUEDE INSERTAR", "PUEDE ACTUALIZAR" (sin guiones bajos)
- [ ] El tema rojo se aplica correctamente en la sección PERMISOS

---

## 🐛 Solución de Problemas

### El formulario de CREAR no muestra opciones
- Verificar que los datos relacionados estén cargados
- Recargar la página
- Verificar la conexión a la base de datos

### No puedo ver la sección PERMISOS
- Verificar que el usuario tenga perfilid = 1 (Administrador)
- Cerrar sesión y volver a iniciar sesión

### Los permisos no se guardan
- Verificar que se haya seleccionado un perfil
- Verificar que se haya seleccionado un tipo de geografía y su valor
- Revisar la consola del navegador para errores

### Los nombres no se muestran (solo IDs)
- Verificar que los datos relacionados estén cargados
- Verificar que las tablas relacionadas tengan datos

---

## 📞 Soporte

Si encuentras problemas durante la demo:
1. Revisar la consola del navegador (F12)
2. Verificar los logs del backend
3. Revisar que todos los servicios estén corriendo

---

**Última actualización**: Diciembre 2024
