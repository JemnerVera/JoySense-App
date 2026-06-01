# 🌱 JoySense Dashboard - Sistema de Monitoreo Agrícola

## 📋 Descripción

JoySense Dashboard es una aplicación web moderna para el monitoreo y análisis de sensores agrícolas LoRaWAN. Proporciona una interfaz intuitiva para visualizar datos de humedad, temperatura y electroconductividad en tiempo real, con filtros jerárquicos, gráficos interactivos y sistema de alertas.

## 🚀 Características Principales

### ✅ **Funcionalidades Implementadas**
- **Autenticación de usuarios** - Sistema de login con Supabase Auth
- **Sistema de Parámetros** - Gestión completa de configuración del sistema
- **Dashboard Interactivo** - Visualización de datos en tiempo real
- **Filtros jerárquicos** - Navegación: País → Empresa → Fundo → Ubicación
- **Gráficos separados** - Humedad, Temperatura y Electroconductividad
- **Sistema de Umbrales** - Configuración de límites y alertas
- **Reportes de Alertas** - Visualización y gestión de notificaciones
- **Interfaz responsive** - Funciona en desktop, tablet y móvil
- **Multiidioma** - Soporte para Español e Inglés
- **Temas** - Modo claro y oscuro

### 🎯 **Tecnologías Utilizadas**
- **Frontend:** React 18, TypeScript, Tailwind CSS, Chart.js, Recharts, Leaflet
- **Backend:** Node.js, Express.js
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Despliegue:** Azure App Service

## 📁 Estructura del Proyecto

```
JoySense/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── services/         # Servicios API
│   │   ├── contexts/         # Contextos React
│   │   ├── hooks/            # Custom hooks
│   │   └── App.tsx           # Componente principal
│   ├── public/
│   └── package.json
├── backend/                  # Servidor Node.js
│   ├── server.js            # Servidor Express
│   ├── env-example.txt      # Ejemplo de variables de entorno
│   └── package.json
├── deployment/               # Scripts de deployment
│   └── iniciar-local.bat     # Iniciar aplicación local
└── docs/                     # Documentación
    └── AZURE_DEPLOYMENT_GUIDE.md  # Guía de despliegue Azure
```

## 🛠️ Instalación y Configuración

### **Requisitos Previos**
- Node.js (v16 o superior)
- npm (v8 o superior)
- Cuenta en Supabase con proyecto configurado

### **Instalación Local**

1. **Clonar el repositorio:**
   ```bash
   git clone [repository-url]
   cd JoySense
   ```

2. **Instalar dependencias:**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Configurar variables de entorno:**

   **Frontend** (`.env.local` o `.env` en carpeta `frontend/`):
   ```bash
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   REACT_APP_BACKEND_URL=http://localhost:3001/api
   ```

   **Backend** (`backend/env-example.txt` o `.env` en carpeta `backend/`):
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3001
   NODE_ENV=development
   ```

4. **Iniciar la aplicación:**
   ```bash
   # Desde la raíz del proyecto
   .\deployment\iniciar-local.bat
   ```

   O manualmente:
   ```bash
   # Terminal 1 - Backend
   cd backend
   node server.js
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## 🚀 Despliegue en Azure App Service

Para deployment en producción, consulta la guía completa:
- **[Guía de Deployment Azure](docs/AZURE_DEPLOYMENT_GUIDE.md)**

### Resumen rápido:
1. Crear App Services para Backend y Frontend
2. Configurar variables de entorno en Azure Portal
3. Deploy mediante GitHub Actions o Azure CLI
4. Configurar custom domain y SSL (opcional)

## 🔐 Seguridad

### **Claves Seguras de Publicar:**
- ✅ Supabase URL
- ✅ Supabase Anon/Publishable Key

### **Claves Privadas (NUNCA publicar):**
- ❌ Supabase Service Role Key
- ❌ Variables .env con credenciales

## 📱 Uso de la Aplicación

### **Acceso:**
- **URL Local:** http://localhost:3000
- **Usuario:** Configurado en Supabase
- **Autenticación:** Login con email/password

### **Navegación:**
1. **Dashboard:** Vista principal con gráficos y filtros
2. **Parámetros:** Gestión de configuración del sistema
3. **Reportes:** Visualización de alertas y mensajes
4. **Umbrales:** Configuración de límites y criticidad

## 🔧 Desarrollo

### **Scripts Disponibles**

```bash
# Desarrollo local
.\deployment\iniciar-local.bat     # Iniciar aplicación completa

# Frontend
npm start                          # Desarrollo
npm run build                      # Build producción
npm test                          # Tests

# Backend
node server.js                    # Iniciar servidor
```

### **Estructura de Componentes Principales**

- **SystemParameters** - Gestión de parámetros del sistema
- **Dashboard** - Visualización de datos y gráficos
- **Umbrales** - Configuración de alertas
- **Reportes** - Sistema de reportes y alertas
- **AuthContext** - Manejo de autenticación

## 📊 Base de Datos

El backend utiliza Supabase/PostgreSQL como persistencia y autenticación. 
La estructura interna de tablas y el schema se gestionan directamente en Supabase y no se documentan con detalle en este README.

La aplicación consulta los datos desde el backend y aplica la seguridad a través de Supabase y las reglas del proyecto.

## 🧪 Testing

```bash
# Ejecutar tests
cd frontend
npm test

# Tests con cobertura
npm test -- --coverage
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo licencia privada. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisar documentación en `/docs`
- Consultar la [Guía de Deployment Azure](docs/AZURE_DEPLOYMENT_GUIDE.md)
- Contactar al equipo de desarrollo

## 🔄 Changelog

### Versión Actual
- ✅ Migración de Vercel a Azure App Service
- ✅ Sistema de alertas consolidadas
- ✅ Dashboard con filtros jerárquicos
- ✅ Gestión completa de parámetros
- ✅ Sistema de umbrales y criticidad
- ✅ Reportes de alertas y mensajes
- ✅ Multiidioma (ES/EN)
- ✅ Temas claro/oscuro

---

**¡Monitorea tus sensores agrícolas con JoySense!** 🌱📊
