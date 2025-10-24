# 🚀 PLAN DE DEPLOYMENT - JOYSENSE EN AZURE

## 📊 INFORMACIÓN DEL APP SERVICE

```json
Nombre:     agromigiva-joysense-dev
URL:        https://agromigiva-joysense-dev-cnc8evagdrbvbceb.eastus2-01.azurewebsites.net
Region:     East US 2
Plan:       Free tier
Runtime:    Node.js 22 LTS
OS:         Linux
Estado:     Running ✅
```

---

## 🏗️ ARQUITECTURA DE JOYSENSE

```
┌─────────────────────────────────────────────────────────────────┐
│          Azure App Service (agromigiva-joysense-dev)            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Backend (Node.js)                      │  │
│  │                      Port: 8080                           │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  API Endpoints                                   │    │  │
│  │  │  - /api/sense/paises                            │    │  │
│  │  │  - /api/sense/empresas                          │    │  │
│  │  │  - /api/auth/login                              │    │  │
│  │  │  - etc...                                       │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Static Files (Frontend Build)                  │    │  │
│  │  │  - Servidos desde carpeta build/                │    │  │
│  │  │  - React SPA                                     │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   Supabase     │
              │  (PostgreSQL)  │
              │  Schema: sense │
              └────────────────┘
```

**Estrategia**: Usar UN solo App Service donde el backend Node.js sirve la API y el frontend compilado.

---

## 📋 PLAN DE DEPLOYMENT - PASO A PASO

### 🎯 FASE 1: PREPARACIÓN LOCAL (15 minutos)

#### ✅ Paso 1.1: Verificar Credenciales de Supabase
```bash
# Necesitas tener estas 3 credenciales:
# 1. SUPABASE_URL (ej: https://tu-proyecto.supabase.co)
# 2. SUPABASE_PUBLISHABLE_KEY (para frontend)
# 3. SUPABASE_SERVICE_ROLE_KEY (para backend)
```

**Acción**: Confirma que tienes estas 3 credenciales disponibles.

---

#### ✅ Paso 1.2: Crear Archivo de Configuración para Azure

Vamos a crear un archivo que le diga a Azure cómo ejecutar la aplicación:

**Archivo: `package.json` (en la raíz del proyecto)**
```json
{
  "name": "joysense-azure",
  "version": "1.0.0",
  "scripts": {
    "install-all": "cd backend && npm install && cd ../frontend && npm install",
    "build-frontend": "cd frontend && npm run build",
    "start": "cd backend && node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Archivo: `startup.sh` (en la raíz del proyecto)**
```bash
#!/bin/bash

echo "🚀 Iniciando JoySense en Azure..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd /home/site/wwwroot/backend
npm install --production

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd /home/site/wwwroot/frontend
npm install --production

# Build del frontend
echo "🏗️ Compilando frontend..."
npm run build

# Iniciar backend
echo "🚀 Iniciando servidor backend..."
cd /home/site/wwwroot/backend
node server.js
```

---

#### ✅ Paso 1.3: Modificar Backend para Servir Frontend

Necesitamos que el backend sirva los archivos del frontend compilado.

**Actualizar `backend/server.js`** - Agregar al final, antes de `app.listen()`:

```javascript
// ==========================================
// SERVIR FRONTEND EN PRODUCCIÓN
// ==========================================
if (process.env.NODE_ENV === 'production') {
  const path = require('path')
  
  // Servir archivos estáticos del frontend
  const frontendBuildPath = path.join(__dirname, '../frontend/build')
  app.use(express.static(frontendBuildPath))
  
  // Todas las rutas no-API deben servir index.html (SPA)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'))
    }
  })
  
  console.log('✅ Sirviendo frontend desde:', frontendBuildPath)
}
```

---

#### ✅ Paso 1.4: Actualizar Frontend para URL de Producción

**Actualizar `frontend/src/services/backend-api.ts`**:

```typescript
// Detectar si estamos en Azure
const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? '/api'  // En Azure, el backend está en el mismo dominio
                     : 'http://localhost:3001/api')

console.log('🌐 Backend API - URL:', backendUrl)
```

---

### 🎯 FASE 2: CONFIGURAR AZURE (10 minutos)

#### ✅ Paso 2.1: Configurar Variables de Entorno en Azure

1. **Ir al Azure Portal**: https://portal.azure.com
2. **Buscar tu App Service**: `agromigiva-joysense-dev`
3. **Ir a**: Configuration → Application settings
4. **Agregar las siguientes variables** (click en "+ New application setting"):

```
Nombre: SUPABASE_URL
Valor: https://tu-proyecto.supabase.co

Nombre: SUPABASE_SERVICE_ROLE_KEY
Valor: [tu-service-role-key]

Nombre: SUPABASE_PUBLISHABLE_KEY
Valor: [tu-publishable-key]

Nombre: DB_SCHEMA
Valor: sense

Nombre: NODE_ENV
Valor: production

Nombre: PORT
Valor: 8080

Nombre: WEBSITES_PORT
Valor: 8080

Nombre: REACT_APP_SUPABASE_URL
Valor: https://tu-proyecto.supabase.co

Nombre: REACT_APP_SUPABASE_PUBLISHABLE_KEY
Valor: [tu-publishable-key]

Nombre: REACT_APP_BACKEND_URL
Valor: /api
```

5. **Click en "Save"** (arriba)
6. **Click en "Continue"** cuando pregunte si quieres reiniciar

⏱️ **Esperar 1-2 minutos** para que Azure aplique los cambios.

---

#### ✅ Paso 2.2: Configurar Startup Command

1. En Azure Portal → Tu App Service
2. **Ir a**: Configuration → General settings
3. **Startup Command**: Agregar:
   ```bash
   cd backend && npm install && cd ../frontend && npm install && npm run build && cd ../backend && node server.js
   ```
4. **Click en "Save"**

---

### 🎯 FASE 3: DEPLOYMENT (15-20 minutos)

Tienes 3 opciones. Te recomiendo la **Opción 1** (GitHub) porque es más simple.

---

#### 🔵 OPCIÓN 1: Deployment desde GitHub (RECOMENDADO)

##### Paso 3.1.1: Configurar GitHub Deployment

1. **Azure Portal** → Tu App Service → **Deployment Center**
2. **Source**: Seleccionar **GitHub**
3. **Autorizar**: Click en "Authorize" para conectar con GitHub
4. **Organization**: Seleccionar tu usuario (JemnerVera)
5. **Repository**: Seleccionar `lorawan-sense-app`
6. **Branch**: Seleccionar `main`
7. **Build Provider**: Seleccionar "App Service build service (Kudu)"
8. **Click en "Save"**

Azure automáticamente:
- Creará un webhook en GitHub
- Descargará el código
- Ejecutará el build
- Desplegará la aplicación

⏱️ **Tiempo estimado**: 10-15 minutos

---

##### Paso 3.1.2: Verificar Deployment

1. **Ir a**: Deployment Center → Logs
2. **Ver el progreso** del deployment
3. **Esperar** hasta que el status sea "Success ✅"

**Logs esperados**:
```
🔄 Cloning repository...
📦 Installing dependencies...
🏗️ Building frontend...
✅ Deployment successful
```

---

#### 🟡 OPCIÓN 2: Deployment con Azure CLI

```bash
# Paso 1: Instalar Azure CLI (si no lo tienes)
# Windows:
winget install Microsoft.AzureCLI

# Paso 2: Login a Azure
az login

# Paso 3: Build del frontend
cd frontend
npm run build
cd ..

# Paso 4: Crear archivo ZIP con todo el código
# Windows PowerShell:
Compress-Archive -Path backend,frontend -DestinationPath joysense-deploy.zip

# Paso 5: Deploy a Azure
az webapp deployment source config-zip \
  --resource-group JOYPRODUCE \
  --name agromigiva-joysense-dev \
  --src joysense-deploy.zip
```

⏱️ **Tiempo estimado**: 5-10 minutos

---

#### 🟢 OPCIÓN 3: Deployment con Git Local

```bash
# Paso 1: Configurar Git remoto de Azure
# Obtener URL de Git desde Azure Portal:
# Deployment Center → FTPS credentials → Git Clone Uri

# Paso 2: Agregar remote
git remote add azure https://agromigiva-joysense-dev:PASSWORD@agromigiva-joysense-dev.scm.azurewebsites.net/agromigiva-joysense-dev.git

# Paso 3: Push a Azure
git push azure main:master

# Azure automáticamente:
# - Detectará Node.js
# - Ejecutará npm install
# - Iniciará la aplicación
```

⏱️ **Tiempo estimado**: 5-10 minutos

---

### 🎯 FASE 4: VERIFICACIÓN (5 minutos)

#### ✅ Paso 4.1: Verificar que el Backend esté corriendo

1. **Abrir**: https://agromigiva-joysense-dev-cnc8evagdrbvbceb.eastus2-01.azurewebsites.net/api/sense/paises

**Respuesta esperada**:
```json
{
  "success": true,
  "data": [
    {
      "paisid": 1,
      "nombre": "Perú",
      ...
    }
  ]
}
```

---

#### ✅ Paso 4.2: Verificar que el Frontend esté accesible

1. **Abrir**: https://agromigiva-joysense-dev-cnc8evagdrbvbceb.eastus2-01.azurewebsites.net

**Debería mostrar**:
- ✅ Pantalla de login
- ✅ Sin errores en consola
- ✅ Logo de JoySense

---

#### ✅ Paso 4.3: Probar Login

1. Usar credenciales de un usuario válido en tu base de datos
2. **Debería**:
   - ✅ Autenticar correctamente
   - ✅ Redirigir al dashboard
   - ✅ Mostrar datos

---

#### ✅ Paso 4.4: Ver Logs en Azure

1. **Azure Portal** → Tu App Service → **Log stream**
2. **Ver logs en tiempo real**:
   ```
   ✅ Cliente Supabase configurado
   🚀 JoySense Backend API running on port 8080
   📡 Servidor listo para recibir conexiones...
   ✅ Schema "sense" detectado y disponible
   ✅ Sirviendo frontend desde: /home/site/wwwroot/frontend/build
   ```

---

### 🎯 FASE 5: TROUBLESHOOTING (Si algo falla)

#### ❌ Problema 1: "Application Error" o 503

**Causa**: La aplicación no inició correctamente

**Solución**:
```bash
# Ver logs detallados
1. Azure Portal → Tu App Service → Diagnose and solve problems
2. Buscar: "Application Logs"
3. Revisar errores

# O ver logs en tiempo real:
Azure Portal → Log stream
```

**Verificar**:
- ✅ Variables de entorno configuradas
- ✅ Puerto 8080 configurado
- ✅ Startup command correcto

---

#### ❌ Problema 2: Frontend carga pero no conecta con Backend

**Causa**: REACT_APP_BACKEND_URL mal configurada

**Solución**:
```bash
# Verificar variable en Azure:
Configuration → Application settings → REACT_APP_BACKEND_URL

# Debe ser: /api (sin https, relativa)
```

---

#### ❌ Problema 3: Error 500 en API

**Causa**: Variables de Supabase mal configuradas

**Solución**:
```bash
# Verificar en Azure Portal:
Configuration → Application settings

# Verificar que existan:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
```

---

#### ❌ Problema 4: Build Timeout (Free tier)

**Causa**: El plan Free tiene limitaciones de memoria/CPU

**Solución**: Build localmente y subir solo archivos compilados

```bash
# Paso 1: Build local
cd frontend
npm run build

# Paso 2: Commit y push
git add frontend/build
git commit -m "Add pre-built frontend"
git push

# Azure usará el build pre-compilado
```

---

### 🎯 FASE 6: OPTIMIZACIÓN (Opcional)

#### 🔧 Optimización 1: Habilitar Always On

**Problema**: En plan Free, la app "duerme" después de 20 min de inactividad

**Solución** (requiere upgrade a Basic):
1. Azure Portal → Configuration → General settings
2. **Always On**: ON

---

#### 🔧 Optimización 2: Configurar Health Check

1. Azure Portal → Configuration → General settings
2. **Health check path**: `/api/sense/detect`
3. Azure reiniciará automáticamente si la app falla

---

#### 🔧 Optimización 3: Upgrade de Plan (si es necesario)

```bash
# Upgrade a Basic (recomendado para producción)
az appservice plan update \
  --name ASP-JOYPRODUCE-954c \
  --resource-group JOYPRODUCE \
  --sku B1

# Costo: ~$13 USD/mes
# Beneficios:
# - Always On
# - Más memoria/CPU
# - No hay "sleep"
# - Custom domains
```

---

## 📊 CHECKLIST FINAL

Antes de considerar el deployment como exitoso, verifica:

### Backend
- [ ] API responde en `/api/sense/paises`
- [ ] No hay errores en logs
- [ ] Variables de entorno configuradas
- [ ] Puerto 8080 funcionando

### Frontend
- [ ] Login carga correctamente
- [ ] No hay errores en consola del navegador
- [ ] Assets (CSS, JS, imágenes) cargan
- [ ] Favicon e imágenes visibles

### Funcionalidad
- [ ] Login funciona con usuario válido
- [ ] Dashboard muestra datos
- [ ] Filtros funcionan (País, Empresa, Fundo)
- [ ] Parámetros del Sistema accesibles
- [ ] Reportes de Alertas funcionan

### Seguridad
- [ ] HTTPS habilitado (Azure lo hace automáticamente)
- [ ] Variables de entorno en Azure (no en código)
- [ ] Service Role Key solo en backend

---

## 💡 PRÓXIMOS PASOS POST-DEPLOYMENT

### 1. Configurar Monitoreo
- Habilitar Application Insights
- Configurar alertas de errores

### 2. Configurar Backup
- Azure Portal → Backups → Configure

### 3. Configurar Custom Domain (Opcional)
- Comprar dominio (ej: joysense.migivagroup.com)
- Configurar en Azure Portal

### 4. CI/CD Automático
- Ya configurado si usaste GitHub deployment
- Cada push a `main` = deployment automático

---

## 📞 COMANDOS ÚTILES DE AZURE CLI

```bash
# Ver logs en tiempo real
az webapp log tail \
  --name agromigiva-joysense-dev \
  --resource-group JOYPRODUCE

# Reiniciar app
az webapp restart \
  --name agromigiva-joysense-dev \
  --resource-group JOYPRODUCE

# Ver configuración actual
az webapp config appsettings list \
  --name agromigiva-joysense-dev \
  --resource-group JOYPRODUCE

# Descargar logs
az webapp log download \
  --name agromigiva-joysense-dev \
  --resource-group JOYPRODUCE \
  --log-file logs.zip
```

---

## 🎯 RESUMEN EJECUTIVO

### ⏱️ Tiempo Total Estimado: 45-60 minutos

| Fase | Tiempo | Complejidad |
|------|--------|-------------|
| 1. Preparación | 15 min | 🟢 Fácil |
| 2. Configurar Azure | 10 min | 🟢 Fácil |
| 3. Deployment | 20 min | 🟡 Media |
| 4. Verificación | 5 min | 🟢 Fácil |
| 5. Troubleshooting | 0-30 min | 🔴 Variable |

### 💰 Costos

| Plan | Costo/Mes | Recomendado Para |
|------|-----------|------------------|
| **Free** | $0 | ✅ Testing/Dev |
| **Basic B1** | ~$13 | ✅ Producción |
| **Standard S1** | ~$70 | Producción Alta |

---

## 🎉 ¿LISTO PARA EMPEZAR?

### Plan Recomendado para Primera Vez:

1. ✅ **Usa GitHub Deployment** (Opción 1) - Es lo más simple
2. ✅ **Mantén plan Free** para empezar - Costo $0
3. ✅ **Upgrade a Basic** si necesitas Always On

### Orden Sugerido:

```
Fase 1 (Preparación) 
  ↓
Fase 2 (Configurar Azure)
  ↓
Fase 3 - Opción 1 (GitHub)
  ↓
Fase 4 (Verificación)
  ↓
🎉 ¡DEPLOYMENT EXITOSO!
```

---

**📅 Creado**: Octubre 24, 2025  
**✅ Estado**: Plan listo para ejecutar  
**🎯 App Service**: agromigiva-joysense-dev  
**🌐 URL**: https://agromigiva-joysense-dev-cnc8evagdrbvbceb.eastus2-01.azurewebsites.net

---

## 📝 NOTAS IMPORTANTES

⚠️ **IMPORTANTE**: El plan Free tiene limitaciones:
- App "duerme" después de 20 minutos de inactividad
- CPU/memoria limitada
- NO tiene "Always On"

Para producción real, se recomienda **Basic B1** ($13/mes)

---

**¿Dudas? ¿Errores? ¿Necesitas ayuda?**
👉 Revisa la sección de Troubleshooting (Fase 5)
👉 Consulta los logs en Azure Portal → Log stream
👉 Usa los comandos útiles de Azure CLI

🚀 **¡Éxito con tu deployment!**

