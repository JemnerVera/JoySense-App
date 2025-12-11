# 📋 Instrucciones para Ejecutar test-simple.js

## Opción 1: Desde el directorio backend (RECOMENDADO)

```powershell
# 1. Ir al directorio backend (donde están las dependencias)
cd "C:\Users\jverac\Documents\Migiva\Proyecto\Apps\JoySense\backend"

# 2. Configurar variables de entorno (reemplaza con tu key real)
$env:SUPABASE_ANON_KEY="tu-anon-key-aqui"
$env:SUPABASE_URL="https://fagswxnjkcavchfrnrhs.supabase.co"

# 3. Ejecutar el script
node ../auth/test-simple.js
```

## Opción 2: Si tienes .env en backend

```powershell
# 1. Ir al directorio backend
cd "C:\Users\jverac\Documents\Migiva\Proyecto\Apps\JoySense\backend"

# 2. Verificar que existe .env
Test-Path .env

# 3. Ejecutar el script (cargará .env automáticamente)
node ../auth/test-simple.js
```

## Opción 3: Instalar dependencias en auth (si prefieres ejecutar desde ahí)

```powershell
# 1. Ir al directorio auth
cd "C:\Users\jverac\Documents\Migiva\Proyecto\Apps\JoySense\auth"

# 2. Inicializar npm (si no existe package.json)
npm init -y

# 3. Instalar dependencias
npm install dotenv @supabase/supabase-js

# 4. Configurar variables y ejecutar
$env:SUPABASE_ANON_KEY="tu-anon-key-aqui"
$env:SUPABASE_URL="https://fagswxnjkcavchfrnrhs.supabase.co"
node test-simple.js
```

## ⚠️ Nota Importante

El script necesita:
- `dotenv` (para cargar .env)
- `@supabase/supabase-js` (cliente de Supabase)

Estas dependencias ya están instaladas en `backend/node_modules`, por eso es mejor ejecutar desde ahí.

## 🔑 Obtener SUPABASE_ANON_KEY

1. Ve a tu proyecto en Supabase Dashboard
2. Settings → API
3. Copia la "anon public" key
4. Úsala en `$env:SUPABASE_ANON_KEY`

