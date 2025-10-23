# 🚀 Guía de Deployment - Azure App Service

## 📋 Resumen

Esta guía proporciona instrucciones detalladas para desplegar la aplicación **JoySense Dashboard** en **Azure App Service**, incluyendo la configuración del frontend (React), backend (Node.js/Express), y la integración con Supabase.

---

## 🏗️ Arquitectura de la Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure App Service                        │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Frontend       │         │    Backend       │         │
│  │   (React SPA)    │ ◄─────► │  (Node.js API)   │         │
│  │   Port: 80/443   │         │   Port: 3001     │         │
│  └──────────────────┘         └──────────────────┘         │
│           │                            │                     │
└───────────┼────────────────────────────┼─────────────────────┘
            │                            │
            └────────────┬───────────────┘
                         │
                         ▼
                 ┌────────────────┐
                 │   Supabase     │
                 │   (PostgreSQL) │
                 └────────────────┘
```

---

## 🔧 Prerequisitos

### 1. Cuenta de Azure
- Suscripción activa de Azure
- Acceso al Azure Portal (https://portal.azure.com)
- Azure CLI instalado (opcional, para deployment desde línea de comandos)

### 2. Recursos Necesarios
- **Supabase**: Proyecto configurado con el schema `sense`
- **Node.js**: v16.0.0 o superior
- **npm**: v8.0.0 o superior
- **Git**: Para control de versiones

### 3. Información de Supabase
```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

---

## 📦 Preparación del Proyecto

### 1. Estructura de Archivos

Asegúrate de que tu proyecto tenga la siguiente estructura:

```
Sensores/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.production
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
└── deployment/
    └── azure/
        ├── web.config          # Configuración IIS para frontend
        └── startup.sh          # Script de inicio (si aplica)
```

### 2. Configurar Variables de Entorno

#### Frontend (`.env.production`)
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://[your-project].supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=[your-anon-key]

# Backend API URL
REACT_APP_BACKEND_URL=https://joysense-backend.azurewebsites.net/api

# Environment
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

#### Backend (`.env`)
```bash
# Supabase Configuration
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Database Schema
DB_SCHEMA=sense
DEFAULT_LIMIT=100
LARGE_LIMIT=1000

# Server Configuration
PORT=3001
NODE_ENV=production

# Logging
LOG_LEVEL=info
```

### 3. Build del Frontend

```bash
cd frontend
npm ci --only=production
npm run build
```

Este comando genera la carpeta `build/` con la aplicación optimizada.

---

## 🌐 Deployment en Azure App Service

### Opción 1: Deployment mediante Azure Portal (Recomendado para principiantes)

#### **Paso 1: Crear App Service para Backend**

1. Ir al **Azure Portal** → **Create a resource** → **Web App**
2. Configurar:
   - **Name**: `joysense-backend`
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux (recomendado) o Windows
   - **Region**: Seleccionar región más cercana
   - **Pricing Plan**: B1 o superior (Basic o Standard)

3. En **Deployment** tab:
   - Habilitar **Continuous deployment** con GitHub (opcional)

4. Click **Review + Create** → **Create**

#### **Paso 2: Configurar Variables de Entorno para Backend**

1. Ir a tu App Service → **Configuration** → **Application settings**
2. Agregar las siguientes variables:

```
SUPABASE_URL = https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY = [your-service-role-key]
DB_SCHEMA = sense
PORT = 8080
NODE_ENV = production
LOG_LEVEL = info
WEBSITES_PORT = 8080
```

> ⚠️ **Importante**: Azure usa el puerto 8080 por defecto, no 3001

3. Click **Save** y reiniciar el App Service

#### **Paso 3: Crear App Service para Frontend**

1. Repetir el proceso de creación:
   - **Name**: `joysense-frontend`
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Pricing Plan**: B1 o superior

#### **Paso 4: Configurar Variables de Entorno para Frontend**

1. Ir a **Configuration** → **Application settings**
2. Agregar:

```
REACT_APP_SUPABASE_URL = https://[your-project].supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY = [your-anon-key]
REACT_APP_BACKEND_URL = https://joysense-backend.azurewebsites.net/api
NODE_ENV = production
```

3. **Save** y reiniciar

#### **Paso 5: Deploy del Código**

##### **Backend**

1. En Azure Portal → Tu Backend App Service → **Deployment Center**
2. Seleccionar método de deployment:
   - **GitHub**: Conectar repositorio (recomendado)
   - **Local Git**: Usar Git local
   - **FTP**: Subir archivos manualmente

**Opción GitHub (Recomendado):**
```bash
# En tu repositorio GitHub
1. Ir a Settings → Secrets
2. Agregar: AZURE_WEBAPP_PUBLISH_PROFILE
   (Descargarlo desde Azure Portal → App Service → Get publish profile)
```

**Opción Local Git:**
```bash
cd backend
git init
git add .
git commit -m "Initial backend deployment"

# Obtener URL de Git desde Azure Portal
git remote add azure [azure-git-url]
git push azure main:master
```

##### **Frontend**

Proceso similar al backend:

```bash
cd frontend
npm run build

# Opción 1: Deployment mediante Azure CLI
az webapp up --name joysense-frontend --resource-group [your-resource-group]

# Opción 2: FTP
# Subir contenido de la carpeta 'build/' via FTP
```

---

### Opción 2: Deployment con Azure CLI (Avanzado)

#### **1. Instalar Azure CLI**

```bash
# Windows
winget install Microsoft.AzureCLI

# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### **2. Login a Azure**

```bash
az login
```

#### **3. Crear Resource Group**

```bash
az group create --name joysense-rg --location eastus
```

#### **4. Crear App Service Plan**

```bash
az appservice plan create \
  --name joysense-plan \
  --resource-group joysense-rg \
  --sku B1 \
  --is-linux
```

#### **5. Crear Backend App Service**

```bash
az webapp create \
  --name joysense-backend \
  --resource-group joysense-rg \
  --plan joysense-plan \
  --runtime "NODE|18-lts"
```

#### **6. Configurar Variables de Entorno**

```bash
az webapp config appsettings set \
  --name joysense-backend \
  --resource-group joysense-rg \
  --settings \
    SUPABASE_URL="https://[your-project].supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="[your-key]" \
    DB_SCHEMA="sense" \
    PORT="8080" \
    NODE_ENV="production" \
    WEBSITES_PORT="8080"
```

#### **7. Deploy Backend**

```bash
cd backend
zip -r backend.zip .
az webapp deployment source config-zip \
  --name joysense-backend \
  --resource-group joysense-rg \
  --src backend.zip
```

#### **8. Crear y Deploy Frontend**

```bash
# Crear frontend app
az webapp create \
  --name joysense-frontend \
  --resource-group joysense-rg \
  --plan joysense-plan \
  --runtime "NODE|18-lts"

# Build frontend
cd ../frontend
npm run build

# Deploy frontend
cd build
zip -r frontend.zip .
az webapp deployment source config-zip \
  --name joysense-frontend \
  --resource-group joysense-rg \
  --src frontend.zip
```

---

## 🔄 CI/CD con GitHub Actions

### 1. Crear Workflow File

Crea `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'joysense-backend'
          publish-profile: ${{ secrets.AZURE_BACKEND_PUBLISH_PROFILE }}
          package: ./backend

  build-and-deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'joysense-frontend'
          publish-profile: ${{ secrets.AZURE_FRONTEND_PUBLISH_PROFILE }}
          package: ./frontend/build
```

### 2. Configurar Secrets en GitHub

1. Ir a tu repositorio → **Settings** → **Secrets and variables** → **Actions**
2. Agregar:
   - `AZURE_BACKEND_PUBLISH_PROFILE`
   - `AZURE_FRONTEND_PUBLISH_PROFILE`

Para obtener el publish profile:
- Azure Portal → App Service → **Get publish profile**

---

## 📝 Configuración Adicional

### 1. Configurar CORS en Backend

Actualizar `backend/server.js`:

```javascript
const cors = require('cors');

const allowedOrigins = [
  'https://joysense-frontend.azurewebsites.net',
  'http://localhost:3000' // Para desarrollo
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 2. Configurar Custom Domain (Opcional)

1. Azure Portal → App Service → **Custom domains**
2. Agregar dominio personalizado
3. Configurar DNS records:
   ```
   Type: CNAME
   Name: www
   Value: joysense-frontend.azurewebsites.net
   ```

### 3. Habilitar HTTPS/SSL

1. Azure Portal → App Service → **TLS/SSL settings**
2. **HTTPS Only**: ON
3. **Minimum TLS Version**: 1.2

### 4. Configurar Application Insights (Monitoreo)

```bash
az monitor app-insights component create \
  --app joysense-insights \
  --location eastus \
  --resource-group joysense-rg
```

---

## ✅ Verificación Post-Deployment

### 1. Verificar Backend

```bash
# Test API health
curl https://joysense-backend.azurewebsites.net/api/sense/paises

# Verificar logs
az webapp log tail --name joysense-backend --resource-group joysense-rg
```

### 2. Verificar Frontend

- Abrir: `https://joysense-frontend.azurewebsites.net`
- Verificar login
- Verificar navegación
- Verificar conexión con backend

### 3. Checklist de Verificación

- [ ] Backend responde correctamente
- [ ] Frontend carga sin errores
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] Filtros funcionan
- [ ] Formularios de parámetros funcionan
- [ ] No hay errores en consola del navegador
- [ ] SSL/HTTPS está habilitado

---

## 🛠️ Troubleshooting

### Problema: Error 500 en Backend

**Causa**: Variables de entorno mal configuradas

**Solución**:
```bash
# Verificar variables
az webapp config appsettings list --name joysense-backend --resource-group joysense-rg

# Ver logs
az webapp log tail --name joysense-backend --resource-group joysense-rg
```

### Problema: Frontend no conecta con Backend

**Causa**: CORS no configurado o URL incorrecta

**Solución**:
1. Verificar `REACT_APP_BACKEND_URL` en configuración
2. Verificar CORS en `backend/server.js`
3. Rebuild y redeploy frontend

### Problema: Error de Puerto

**Causa**: Azure usa puerto 8080, no 3001

**Solución**:
```javascript
// backend/server.js
const PORT = process.env.PORT || 8080;
```

Y agregar en Azure:
```
WEBSITES_PORT = 8080
```

### Problema: Build Timeout

**Causa**: Build tarda demasiado

**Solución**:
1. Usar plan de App Service más potente (S1 o superior)
2. Build localmente y subir solo la carpeta `build/`

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Backend
az webapp log tail --name joysense-backend --resource-group joysense-rg

# Frontend
az webapp log tail --name joysense-frontend --resource-group joysense-rg
```

### Configurar Log Stream en Azure Portal

1. App Service → **Log stream**
2. Ver logs en tiempo real

### Application Insights

1. Azure Portal → App Service → **Application Insights**
2. Ver métricas:
   - Tiempo de respuesta
   - Número de requests
   - Errores
   - Performance

---

## 💰 Estimación de Costos

### Plan Recomendado: B1 (Basic)
- **Costo aproximado**: $13-15 USD/mes por App Service
- **Total**: ~$30 USD/mes (Backend + Frontend)

### Plan de Producción: S1 (Standard)
- **Costo aproximado**: $70 USD/mes por App Service
- **Total**: ~$140 USD/mes (Backend + Frontend)
- **Incluye**: Auto-scaling, custom domains, SSL certificates

### Costos Adicionales
- **Supabase**: Plan gratuito hasta 500MB
- **Azure SQL** (si aplica): Según uso
- **Bandwidth**: Primer 5GB gratis, después $0.087/GB

---

## 🔐 Mejores Prácticas de Seguridad

### 1. Proteger Variables de Entorno
- ✅ Nunca commitear archivos `.env`
- ✅ Usar Azure Key Vault para secrets sensibles
- ✅ Rotar keys periódicamente

### 2. Configurar Red Virtual (Opcional)
```bash
az network vnet create \
  --name joysense-vnet \
  --resource-group joysense-rg \
  --subnet-name default
```

### 3. Habilitar Managed Identity
```bash
az webapp identity assign \
  --name joysense-backend \
  --resource-group joysense-rg
```

---

## 📞 Recursos y Soporte

### Documentación Oficial
- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
- [Supabase Docs](https://supabase.com/docs)

### Comandos Útiles

```bash
# Reiniciar App Service
az webapp restart --name [app-name] --resource-group [rg]

# Ver configuración
az webapp config show --name [app-name] --resource-group [rg]

# Escalar App Service
az appservice plan update --name [plan] --resource-group [rg] --sku S1

# Descargar logs
az webapp log download --name [app-name] --resource-group [rg]
```

---

## 📝 Notas Finales

- **Backup**: Configurar backup automático en Azure Portal
- **Staging**: Considerar usar deployment slots para testing
- **Monitoring**: Configurar alertas en Application Insights
- **Updates**: Mantener Node.js y dependencias actualizadas
- **Performance**: Habilitar Azure CDN para archivos estáticos

---

**📅 Última actualización**: Octubre 2024  
**✅ Estado**: Documentación completa y verificada  
**🎯 Versión**: 1.0

