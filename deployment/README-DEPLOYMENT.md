# 🚀 Guía de Deployment - JoySense Dashboard

## 📋 Scripts Disponibles

### 1. `iniciar-local.bat` - Desarrollo Local
- **Propósito:** Ejecutar la aplicación localmente con variables de desarrollo
- **Variables:** Usa las keys de Supabase DESARROLLO
- **Uso:** Para desarrollo y testing local

### 2. `iniciar-local-post-deploy.bat` - Post Deploy Local
- **Propósito:** Ejecutar localmente después del deploy en Vercel
- **Variables:** Usa las variables de entorno de PRODUCCIÓN
- **Uso:** Para verificar que la aplicación funciona con las keys de producción

## 🔧 Configuración de Variables de Entorno

### Para Desarrollo Local
Los archivos `.env` deben contener las keys de **DESARROLLO**:

**`backend/.env`:**
```
SUPABASE_URL=https://fagswxnjkcavchfrnrhs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3N3eG5qa2NhdmNoZnJucmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzE1NDMyNywiZXhwIjoyMDYyNzMwMzI3fQ.ioeluR-iTWJ7-w_7UAuMl_aPXHJM6nlhv6Nh4hohBjw
```

**`frontend/.env`:**
```
REACT_APP_SUPABASE_URL=https://fagswxnjkcavchfrnrhs.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3N3eG5qa2NhdmNoZnJucmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTQzMjcsImV4cCI6MjA2MjczMDMyN30.13bSx7s-r9jt7ZmIKOYsqTreAwGxqFB8_c5A1XrQBqc
REACT_APP_BACKEND_URL=http://localhost:3001/api
```

### Para Producción (Vercel)
Las variables de entorno en Vercel deben contener las keys de **PRODUCCIÓN**:

**Variables de Backend:**
- `SUPABASE_URL` = URL de Supabase PRODUCCIÓN
- `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key de PRODUCCIÓN

**Variables de Frontend (Build):**
- `REACT_APP_SUPABASE_URL` = URL de Supabase PRODUCCIÓN
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY` = Anon Key de PRODUCCIÓN
- `REACT_APP_BACKEND_URL` = URL del backend en Vercel

## 🔄 Proceso de Deploy

### 1. Preparar Variables de Producción
1. Obtener las keys de Supabase PRODUCCIÓN
2. Actualizar `vercel.env.example` con las keys de producción
3. Configurar las variables en el dashboard de Vercel

### 2. Hacer Deploy
1. Hacer commit de los cambios
2. Hacer push al repositorio
3. Vercel detectará los cambios y hará deploy automáticamente

### 3. Verificar Post Deploy
1. Actualizar los archivos `.env` locales con las keys de producción
2. Ejecutar `iniciar-local-post-deploy.bat`
3. Verificar que la aplicación funcione correctamente

## ⚠️ Importante

- **NUNCA** commitees archivos `.env` con keys de producción
- **SIEMPRE** usa las keys de desarrollo para desarrollo local
- **VERIFICA** que las variables de entorno estén configuradas correctamente en Vercel
- **TESTEA** localmente con las keys de producción antes de confirmar el deploy

## 🆘 Troubleshooting

### Error: "supabaseUrl is required"
- Verificar que las variables de entorno estén configuradas
- Verificar que el archivo `.env` exista y tenga el formato correcto

### Error: "Cannot find name 'process'"
- Verificar que `declare const process: any;` esté en `supabase-auth.ts`

### Error: "Invalid URL"
- Verificar que no haya espacios extra en las URLs
- Verificar que las URLs estén completas y correctas
