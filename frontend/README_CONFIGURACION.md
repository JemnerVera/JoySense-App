# 🔧 Configuración de Credenciales - JoySense Frontend

## 📋 Configuración Rápida

### **1. Crear archivo `.env`**

En la carpeta `frontend/`, crea un archivo `.env`:

```bash
cd frontend
copy env.example .env
```

### **2. Editar `.env` con tus credenciales**

```env
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=tu-anon-o-publishable-key
REACT_APP_BACKEND_URL=http://localhost:3001/api
```

### **3. Reiniciar el frontend**

```bash
npm start
```

---

## 🔐 Obtener Credenciales de Supabase

1. Ve a: https://supabase.com/dashboard/project/_/settings/api
2. Copia:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_PUBLISHABLE_KEY`

⚠️ **NUNCA usar Service Role Key en el frontend**

---

## 🏗️ Cómo Funciona

### **Prioridad de Configuración:**

```typescript
// 1. Primero intenta leer de process.env (del archivo .env)
const url = process.env.REACT_APP_SUPABASE_URL

// 2. Si no existe, usa el fallback en el código
|| 'fallback-value'
```

### **Archivos:**

| Archivo | Propósito | ¿Se commitea? |
|---------|-----------|---------------|
| `frontend/.env` | Credenciales locales | ❌ NO (en .gitignore) |
| `supabase-auth.ts` | Servicio sin credenciales | ✅ SÍ (no contiene keys) |
| `supabase-auth.example.ts` | Template de referencia | ✅ SÍ |
| `env.example` | Template del .env | ✅ SÍ |

---

## 🚀 Deployment en Producción (Azure)

En Azure App Service, configura las variables en:

**Configuration → Application settings:**

```
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=tu-key
REACT_APP_BACKEND_URL=https://tu-backend.azurewebsites.net/api
```

Azure inyecta estas variables en tiempo de compilación.

---

## ❓ Problemas Comunes

### **Error: "Usuario no encontrado"**

**Causa:** Estás usando un correo que no existe en la base de datos del entorno (PROD/DESA)

**Solución:** Verifica que estás usando el correo correcto para el entorno

### **Error: Variables undefined**

**Causa:** El archivo `.env` no existe o el frontend no se reinició

**Solución:**
1. Verifica que `.env` existe en `frontend/`
2. Detén completamente el frontend (Ctrl+C)
3. Reinicia: `npm start`

### **Login funciona pero muestra datos incorrectos**

**Causa:** Frontend/Backend apuntan a ambientes diferentes (uno PROD, otro DESA)

**Solución:** Verifica que ambos usan las mismas credenciales del mismo ambiente

---

## 🔒 Seguridad

### ✅ Qué está protegido:

- `.env` está en `.gitignore` (nunca se commitea)
- Solo se usan keys públicas (Publishable/Anon)
- El código valida que NO se use Service Role Key
- `supabase-auth.ts` NO contiene credenciales (se commitea de forma segura)

### ❌ Qué NO hacer:

- ❌ Commitear `.env` con credenciales reales
- ❌ Agregar credenciales directamente en el código
- ❌ Usar Service Role Key en el frontend
- ❌ Compartir credenciales en mensajes públicos

---

## 📚 Más Información

- [Documentación Principal](../README.md)
- [Guía de Deployment Azure](../docs/AZURE_DEPLOYMENT_GUIDE.md)
- [Configuración Backend](../backend/README.md)

---

**Última actualización:** 2025-11-17

