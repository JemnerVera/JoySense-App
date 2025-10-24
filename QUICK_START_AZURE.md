# ⚡ QUICK START - Deploy JoySense en Azure

## 🎯 TU APP SERVICE

```
✅ Nombre:  agromigiva-joysense-dev
✅ URL:     https://agromigiva-joysense-dev-cnc8evagdrbvbceb.eastus2-01.azurewebsites.net
✅ Plan:    Free (Node.js 22 LTS)
✅ Estado:  Running
```

---

## 🚀 3 PASOS PARA DEPLOYMENT

### 📍 PASO 1: Configurar Variables en Azure (10 min)

1. **Ir a**: https://portal.azure.com
2. **Buscar**: `agromigiva-joysense-dev`
3. **Ir a**: Configuration → Application settings → "+ New application setting"
4. **Agregar estas variables** (una por una):

```bash
SUPABASE_URL = https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY = [tu-service-role-key]
SUPABASE_PUBLISHABLE_KEY = [tu-publishable-key]
DB_SCHEMA = sense
NODE_ENV = production
PORT = 8080
WEBSITES_PORT = 8080
REACT_APP_SUPABASE_URL = https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY = [tu-publishable-key]
REACT_APP_BACKEND_URL = /api
```

5. **Click en "Save"** (arriba)
6. **Esperar 1-2 minutos**

✅ **Listo!** Variables configuradas

---

### 📍 PASO 2: Configurar GitHub Deployment (5 min)

1. **En Azure Portal** → Tu App Service → **Deployment Center**
2. **Source**: GitHub
3. **Authorize**: Conectar con GitHub
4. **Organization**: JemnerVera
5. **Repository**: lorawan-sense-app
6. **Branch**: main
7. **Build Provider**: App Service build service (Kudu)
8. **Click "Save"**

⏱️ Azure automáticamente hará el deployment (10-15 minutos)

✅ **Listo!** Deployment configurado

---

### 📍 PASO 3: Verificar que Funciona (2 min)

#### 3.1: Verificar API
Abrir: https://agromigiva-joysense-dev-cnc8evagdrbvbceb.eastus2-01.azurewebsites.net/api/sense/paises

**Debe mostrar JSON con datos**

#### 3.2: Verificar Frontend
Abrir: https://agromigiva-joysense-dev-cnc8evagdrbvbceb.eastus2-01.azurewebsites.net

**Debe mostrar pantalla de login**

#### 3.3: Verificar Login
- Email: `[tu-email-de-usuario]`
- Contraseña: `[tu-contraseña]`

**Debe entrar al dashboard**

✅ **DEPLOYMENT EXITOSO!** 🎉

---

## 📊 MONITOREO

### Ver Logs en Tiempo Real

**Azure Portal** → Tu App Service → **Log stream**

Deberías ver:
```
✅ Cliente Supabase configurado
🚀 JoySense Backend API running on port 8080
✅ Sirviendo frontend desde: /home/site/wwwroot/frontend/build
📡 Servidor listo para recibir conexiones...
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

### ❌ Error: "Application Error"

**Solución**: Ver logs
- Azure Portal → Log stream
- Verificar que las variables de entorno estén correctas

### ❌ Error: Frontend no carga

**Solución**: Verificar que el build se haya completado
- Azure Portal → Deployment Center → Logs
- Debe decir "Deployment successful ✅"

### ❌ Error: API no responde

**Solución**: Verificar SUPABASE_SERVICE_ROLE_KEY
- Configuration → Application settings
- Verificar que esté configurada correctamente

---

## 💰 COSTOS

- **Plan Free**: $0/mes ✅ (perfecto para testing)
- **Limitación**: App "duerme" después de 20 minutos sin uso

**Para Producción**: Upgrade a Basic B1 (~$13/mes) para Always On

---

## 📞 COMANDOS ÚTILES

### Ver Logs (si tienes Azure CLI)
```bash
az webapp log tail --name agromigiva-joysense-dev --resource-group JOYPRODUCE
```

### Reiniciar App
```bash
az webapp restart --name agromigiva-joysense-dev --resource-group JOYPRODUCE
```

---

## ✅ CHECKLIST FINAL

- [ ] Variables de entorno configuradas en Azure
- [ ] GitHub deployment configurado
- [ ] API responde correctamente
- [ ] Frontend carga sin errores
- [ ] Login funciona
- [ ] Dashboard muestra datos

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Completar estos 3 pasos**
2. ✅ **Verificar que todo funcione**
3. ✅ **Upgrade a Basic si necesitas Always On**

---

**¿Necesitas más detalles?** → Ver `PLAN_DEPLOY_AZURE.md`

**Creado**: Octubre 24, 2025  
**App**: agromigiva-joysense-dev  
**Estado**: ✅ Listo para deployment

