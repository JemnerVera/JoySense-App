# Flujo de Autenticación JoySense - Diagrama para Eraser.io

## Código para Eraser.io

Copia y pega este código en Eraser.io para generar el diagrama:

```
# Flujo de Autenticación JoySense

## 1. CREACIÓN DE USUARIO (Sincronización Automática)

[Usuario] -->|INSERT| [joysense.usuario]
[joysense.usuario] -->|Trigger: trg_sync_usuario_con_auth| [fn_sync_usuario_con_auth()]
[fn_sync_usuario_con_auth()] -->|1. Validar email| [Validación]
[Validación] -->|2. Crear correo| [joysense.correo]
[joysense.correo] -->|3. Generar UUID| [UUID]
[UUID] -->|4. Insertar| [auth.users]
[auth.users] -->|5. Insertar| [auth.identities]
[auth.identities] -->|6. Actualizar| [joysense.usuario.useruuid]
[joysense.usuario.useruuid] -->|Usuario sincronizado| [✅ Usuario Listo]

## 2. LOGIN (Frontend)

[Usuario] -->|Ingresa email/password| [Frontend: signInWithPassword()]
[Frontend: signInWithPassword()] -->|Publishable Key| [Supabase Auth API]
[Supabase Auth API] -->|Valida contra| [auth.users]
[auth.users] -->|Password válida?| {¿Válida?}
{¿Válida?} -->|Sí| [Genera JWT Token]
{¿Válida?} -->|No| [❌ Error: Credenciales inválidas]
[Genera JWT Token] -->|Token con UUID| [✅ Usuario Autenticado]

## 3. REQUEST AL BACKEND

[Frontend] -->|Envía token en header| [Backend: optionalAuth middleware]
[Backend: optionalAuth middleware] -->|Valida token| [Supabase Auth]
[Supabase Auth] -->|Token válido?| {¿Válido?}
{¿Válido?} -->|Sí| [Crea req.supabase con contexto usuario]
{¿Válido?} -->|No| [Usa baseSupabase sin contexto]
[Crea req.supabase con contexto usuario] -->|Ejecuta query| [SELECT * FROM empresa]

## 4. ROW LEVEL SECURITY (RLS)

[SELECT * FROM empresa] -->|RLS Policy activa| [Verifica v_permiso_empresa]
[Verifica v_permiso_empresa] -->|Busca registro con| [useruuid = auth.uid() AND puede_ver = true]
[useruuid = auth.uid() AND puede_ver = true] -->|¿Existe?| {¿Tiene permiso?}
{¿Tiene permiso?} -->|Sí| [✅ Retorna datos]
{¿Tiene permiso?} -->|No| [❌ Retorna 0 registros]

## 5. PROBLEMA ACTUAL

[v_permiso_pais] -->|Tiene datos| [✅ Funciona]
[v_permiso_empresa] -->|Vacía| [❌ No funciona]
[v_permiso_fundo] -->|Vacía| [❌ No funciona]
```

## Diagrama Simplificado (Versión Visual)

```
┌─────────────────────────────────────────────────────────────┐
│                    CREACIÓN DE USUARIO                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ INSERT en             │
              │ joysense.usuario      │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ TRIGGER se dispara:   │
              │ trg_sync_usuario_     │
              │ con_auth              │
              └───────────────────────┘
                          │
                          ▼
    ┌───────────────────────────────────────┐
    │ fn_sync_usuario_con_auth() ejecuta:  │
    │ 1. Validar login es email            │
    │ 2. Crear joysense.correo             │
    │ 3. Generar UUID                      │
    │ 4. Insertar auth.users               │
    │ 5. Insertar auth.identities         │
    │ 6. Actualizar useruuid               │
    └───────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ ✅ Usuario Sincronizado│
              └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        LOGIN                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Frontend:             │
              │ signInWithPassword()  │
              │ (Publishable Key)     │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Supabase Auth API     │
              │ Valida contra         │
              │ auth.users            │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ ✅ JWT Token          │
              │ (con UUID usuario)    │
              └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    REQUEST AL BACKEND                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Backend recibe token  │
              │ en Authorization      │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ optionalAuth          │
              │ middleware            │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Crea req.supabase     │
              │ con contexto usuario  │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Ejecuta query:        │
              │ SELECT * FROM empresa │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ RLS Policy verifica:  │
              │ v_permiso_empresa     │
              └───────────────────────┘
                          │
                          ▼
        ┌─────────────────┴─────────────────┐
        │                                     │
        ▼                                     ▼
┌───────────────┐                    ┌───────────────┐
│ ¿Tiene        │                    │ ❌ No tiene   │
│ permisos?     │                    │ permisos      │
└───────────────┘                    └───────────────┘
        │                                     │
        ▼                                     ▼
┌───────────────┐                    ┌───────────────┐
│ ✅ Retorna    │                    │ ❌ Retorna    │
│ datos         │                    │ 0 registros   │
└───────────────┘                    └───────────────┘
```

## Componentes Clave

### Trigger de Sincronización
- **Nombre**: `trg_sync_usuario_con_auth`
- **Tabla**: `joysense.usuario`
- **Evento**: AFTER INSERT
- **Función**: `fn_sync_usuario_con_auth()`

### Función de Sincronización
- **Valida**: Login debe ser email
- **Crea**: Registro en `joysense.correo`
- **Genera**: UUID único
- **Inserta**: Usuario en `auth.users` y `auth.identities`
- **Actualiza**: `joysense.usuario.useruuid`

### Autenticación Frontend
- **Método**: `supabaseAuth.auth.signInWithPassword()`
- **Key**: Publishable Key (anon key)
- **Resultado**: JWT Token con UUID del usuario

### Autenticación Backend
- **Middleware**: `optionalAuth`
- **Función**: Valida token y crea `req.supabase` con contexto del usuario
- **Cliente**: Usa token para todas las queries

### Row Level Security
- **Políticas**: Verifican permisos en vistas `v_permiso_*`
- **Ejemplo**: `v_permiso_empresa` debe tener registro con:
  - `useruuid = auth.uid()`
  - `puede_ver = true`
- **Problema**: `v_permiso_empresa` y `v_permiso_fundo` están vacías

## Solución al Problema Actual

Para que `empresa` y `fundo` funcionen, necesitas:

1. **Poblar las vistas de permisos** `v_permiso_empresa` y `v_permiso_fundo`
2. **O modificar las políticas RLS** para que permitan acceso al usuario administrador
3. **O insertar registros** en las tablas base que alimentan las vistas
