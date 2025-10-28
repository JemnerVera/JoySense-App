# 🚀 PASOS PARA DEPLOY A JOYSENSE PRODUCCIÓN

## ✅ INFORMACIÓN DEL APP SERVICE (Confirmado)

- **Nombre del App Service:** `joysense`
- **Resource Group:** `JOYPRODUCE`
- **Subscription:** `MIGIVA SAP`
- **Subscription ID:** `20cde20f-3a7d-4997-b6ea-5d307fa1cbf3`
- **Ubicación:** `East US 2`
- **Plan:** `ASP-JOYSENSE (B1: 1)` ✅ Producción ready
- **URL:** `https://joysense-h5ffg0ambqbsbvf6.eastus2-01.azurewebsites.net`
- **Sistema Operativo:** Linux
- **Variables de entorno:** ✅ Ya configuradas

---

## 📝 PASO 1: DESCARGAR PUBLISH PROFILE

### En Azure Portal:

1. Ir a: `App Services → joysense`
2. En la barra superior, click en **"Get publish profile"** (o "Descargar perfil de publicación")
3. Se descargará un archivo: `joysense.publishsettings`

![Ubicación del botón](https://docs.microsoft.com/en-us/azure/app-service/media/app-service-deployment-credentials/publish-profile-button.png)

**Ubicación exacta del botón:**
```
Overview → [Barra superior] → ... → Get publish profile
```

---

## 📝 PASO 2: AGREGAR PUBLISH PROFILE A GITHUB SECRETS

### 2.1 Abrir el archivo descargado

- Abrir `joysense.publishsettings` con un editor de texto
- Copiar TODO el contenido (es un archivo XML)

**Ejemplo del contenido:**
```xml
<publishData>
  <publishProfile 
    profileName="joysense - Web Deploy"
    publishMethod="MSDeploy"
    publishUrl="joysense.scm.azurewebsites.net:443"
    ...
  >
  </publishProfile>
</publishData>
```

### 2.2 Ir a GitHub Secrets

```
https://github.com/JemnerVera/lorawan-sense-app/settings/secrets/actions
```

### 2.3 Actualizar el secret existente

1. Buscar: `AZUREAPPSERVICE_PUBLISHPROFILE_7AA786BA2F1447089D46719055F4FFA3`
2. Click en **"Update"**
3. Pegar el contenido completo del archivo `.publishsettings`
4. Click en **"Update secret"**

**¿Por qué actualizar en vez de crear nuevo?**
- Mantiene la referencia en el workflow actual
- No necesitas modificar el workflow YAML

---

## 📝 PASO 3: ACTUALIZAR WORKFLOW DE GITHUB ACTIONS

### 3.1 Abrir archivo de workflow

Archivo: `.github/workflows/main_agromigiva-joysense-dev.yml`

### 3.2 Cambiar SOLO la línea 91

**ANTES:**
```yaml
app-name: 'agromigiva-joysense-dev'
```

**DESPUÉS:**
```yaml
app-name: 'joysense'
```

### 3.3 (Opcional) Cambiar nombre del workflow (línea 4)

**ANTES:**
```yaml
name: Build and deploy Node.js app to Azure Web App - agromigiva-joysense-dev
```

**DESPUÉS:**
```yaml
name: Build and deploy Node.js app to Azure Web App - JoySense Production
```

---

## 📝 PASO 4: COMMIT Y PUSH

```bash
# Verificar cambios
git status

# Ver diferencias
git diff .github/workflows/main_agromigiva-joysense-dev.yml

# Agregar cambios
git add .github/workflows/main_agromigiva-joysense-dev.yml

# Commit
git commit -m "chore: Configurar deploy a Azure MIGIVA SAP (joysense production)"

# Push (esto iniciará el deploy automático)
git push origin main
```

⚠️ **IMPORTANTE:** El push iniciará el deploy automáticamente a Azure.

---

## 📝 PASO 5: MONITOREAR EL DEPLOY

### 5.1 Ver GitHub Actions

```
https://github.com/JemnerVera/lorawan-sense-app/actions
```

**Verás:**
- ✅ **Build job:** Compila frontend + prepara backend (2-4 min)
- ✅ **Deploy job:** Sube a Azure (2-3 min)

### 5.2 Logs del deploy

Click en el workflow que se está ejecutando → Ver cada step:
- Set up Node.js version
- Install backend dependencies
- Install and build frontend
- Verify build output
- Prepare deployment package
- Upload artifact
- Download artifact
- Deploy to Azure Web App ← **Este es el crítico**

### 5.3 Verificar en Azure Portal

```
App Services → joysense → Deployment Center → Logs
```

Deberías ver:
- ✅ Deployment Status: Success
- ✅ Commit ID del último deploy
- ✅ Timestamp reciente

---

## 📝 PASO 6: VERIFICAR QUE LA APP FUNCIONA

### 6.1 Abrir la aplicación

```
https://joysense-h5ffg0ambqbsbvf6.eastus2-01.azurewebsites.net
```

⏳ **Primera carga puede tardar 30-60 segundos** (cold start)

### 6.2 Checklist de verificación

- [ ] Página carga (no "Application Error")
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] Filtros funcionan
- [ ] Tablas cargan correctamente
- [ ] Paginación funciona (1000+ registros)
- [ ] Crear/Actualizar funciona
- [ ] No hay errores en consola (F12)

### 6.3 Si hay errores

**Ver logs en tiempo real:**

**Opción A - Azure Portal:**
```
App Services → joysense → Monitoring → Log stream
```

**Opción B - Azure CLI:**
```bash
az webapp log tail --name joysense --resource-group JOYPRODUCE
```

---

## 🔧 TROUBLESHOOTING

### Error: "Application Error"

**Causa:** Variables de entorno faltantes o incorrectas

**Solución:**
1. Ir a: `App Services → joysense → Configuration → Application settings`
2. Verificar que TODAS estas variables existan:

```
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ REACT_APP_SUPABASE_URL
✅ REACT_APP_SUPABASE_PUBLISHABLE_KEY
✅ REACT_APP_BACKEND_URL = /api
✅ NODE_ENV = production
✅ PORT = 8080
✅ WEBSITES_PORT = 8080
```

3. Click **"Save"** → App Service se reiniciará

---

### Error: "Cannot find module"

**Causa:** npm install no se ejecutó correctamente

**Solución:**
1. Verificar logs de GitHub Actions
2. Ver step "Install backend dependencies"
3. Si hay error, verificar `backend/package.json`

---

### Error: Página en blanco

**Causa:** Frontend no se compiló o rutas incorrectas

**Solución:**
1. Abrir consola del navegador (F12)
2. Ver errores en Console y Network
3. Verificar que `REACT_APP_BACKEND_URL=/api` esté configurado
4. Verificar que el build del frontend fue exitoso en GitHub Actions

---

### Error: 500 en API calls

**Causa:** Backend no puede conectar con Supabase

**Solución:**
1. Verificar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
2. Ver logs del backend en Log stream
3. Verificar que Supabase acepta conexiones desde Azure IP

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

| Aspecto | Azure FREE (Anterior) | Azure MIGIVA SAP (Actual) |
|---------|----------------------|---------------------------|
| **App Service** | agromigiva-joysense-dev | joysense |
| **Plan** | Free (F1) | Basic (B1) |
| **Memoria** | 1 GB | 1.75 GB |
| **CPU** | Compartido | Dedicado (1 core) |
| **Límite diario** | 60 min/día | ∞ Sin límites |
| **Always On** | ❌ No disponible | ✅ Disponible |
| **Custom Domain** | ❌ No | ✅ Sí |
| **SSL** | Compartido | Dedicado SNI |
| **Costo** | Gratis | ~$13 USD/mes |
| **URL** | .eastus2-01.azurewebsites.net | .eastus2-01.azurewebsites.net |

---

## ✅ POST-DEPLOYMENT

### Configurar Always On (Recomendado)

Evita cold starts:

```
App Services → joysense → Configuration → General settings → Always On = ON
```

### Configurar Custom Domain (Opcional)

Si tienes dominio propio:

```
App Services → joysense → Custom domains → Add custom domain
Ejemplo: joysense.migivagroup.com
```

### Configurar SSL Certificate (Opcional)

```
App Services → joysense → TLS/SSL settings → Private Key Certificates
```

### Habilitar Application Insights (Ya está configurado)

Variables ya presentes:
- ✅ `APPLICATIONINSIGHTS_CONNECTION_STRING`
- ✅ `ApplicationInsightsAgent_EXTENSION_VERSION`

Para ver métricas:
```
App Services → joysense → Application Insights → View Application Insights data
```

### Configurar Alertas

```
App Services → joysense → Alerts → New alert rule

Ejemplo:
- HTTP 5xx errors > 10 en 5 minutos
- Response time > 5 segundos
- CPU usage > 80%
```

---

## 🔒 SEGURIDAD

### Variables de entorno ya configuradas ✅

Has configurado correctamente:
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - SECRET (backend only)
- ✅ `SUPABASE_URL` - Pública pero necesaria
- ✅ `REACT_APP_*` - Variables del frontend

### Recomendaciones adicionales:

1. **Rotar Service Role Key periódicamente**
   - Cada 90 días
   - Generar nueva en Supabase → Settings → API

2. **Revisar RLS Policies en Supabase**
   - Asegurar que todas las tablas tengan RLS
   - Verificar políticas restrictivas

3. **Configurar IP Restrictions (Opcional)**
   - Si solo usuarios internos acceden
   - App Services → Networking → Access restrictions

4. **Habilitar HTTPS Only**
   - App Services → TLS/SSL settings → HTTPS Only = ON

---

## 📞 INFORMACIÓN DE CONTACTO

**Azure Production:**
- **App Service:** joysense
- **Resource Group:** JOYPRODUCE
- **Subscription:** MIGIVA SAP
- **Subscription ID:** 20cde20f-3a7d-4997-b6ea-5d307fa1cbf3
- **URL:** https://joysense-h5ffg0ambqbsbvf6.eastus2-01.azurewebsites.net

**Azure Development (Anterior):**
- **App Service:** agromigiva-joysense-dev
- **Status:** ⚠️ Ya no recibe deploys automáticos (puede eliminarse)

**GitHub:**
- **Repo:** https://github.com/JemnerVera/lorawan-sense-app
- **Branch:** main → Deploy automático a joysense

**Supabase:**
- **URL:** (Configurado en variables de entorno)
- **Schema:** sense

---

## 🎉 CHECKLIST FINAL

Marcar cuando completes cada paso:

- [ ] **Paso 1:** Descargar publish profile de Azure
- [ ] **Paso 2:** Actualizar secret en GitHub
- [ ] **Paso 3:** Modificar workflow YAML (línea 91)
- [ ] **Paso 4:** Commit y push a main
- [ ] **Paso 5:** Monitorear deploy en GitHub Actions
- [ ] **Paso 6:** Verificar app funciona en nueva URL
- [ ] **Post:** Configurar Always On
- [ ] **Post:** Verificar Application Insights
- [ ] **Post:** Notificar a usuarios la nueva URL
- [ ] **Post:** (Opcional) Eliminar agromigiva-joysense-dev

---

**Fecha:** Octubre 2025  
**Status:** ✅ Ambiente creado, listo para deploy  
**Próximo paso:** Descargar publish profile y configurar GitHub

