# 🌱 JoySense Dashboard - Sistema de Monitoreo Agrícola

## 📋 Descripción

JoySense Dashboard es una aplicación web moderna para el monitoreo y análisis de sensores agrícolas. Proporciona una interfaz intuitiva para visualizar datos de humedad, temperatura y electroconductividad en tiempo real, con filtros jerárquicos y gráficos interactivos.

## 🚀 Características Principales

### ✅ **Funcionalidades Implementadas**
- **Autenticación de usuarios** - Sistema de login con Supabase Auth
- **Filtros jerárquicos** - Navegación: País → Empresa → Fundo → Sector
- **Filtros avanzados** - Por fecha, entidad y ubicación
- **Gráficos separados** - Humedad, Temperatura y Electroconductividad
- **Diagnóstico de conexión** - Verificación de conectividad con base de datos
- **Interfaz responsive** - Funciona en desktop, tablet y móvil
- **Aplicación de escritorio** - Versión Electron disponible

### 🎯 **Tecnologías Utilizadas**
- **Frontend:** React.js, TypeScript, Tailwind CSS, Chart.js
- **Backend:** Node.js, Express.js
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Despliegue:** Vercel, Netlify, Electron

## 📁 Estructura del Proyecto

```
Sensores/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── services/         # Servicios API
│   │   ├── contexts/         # Contextos React
│   │   └── App.tsx          # Componente principal
│   ├── public/
│   │   └── electron.js      # Configuración Electron
│   └── package.json
├── backend/                  # Servidor Node.js
│   ├── server.js            # Servidor Express
│   ├── vercel.json          # Configuración Vercel
│   └── package.json
├── Scripts de Inicio/
│   ├── iniciar-dinamico.bat # Iniciar aplicación web
│   ├── iniciar-electron.bat # Iniciar aplicación desktop
│   └── detener.bat          # Detener servicios
├── Scripts de Despliegue/
│   ├── desplegar-web.bat    # Construir para web
│   ├── construir-electron.bat # Construir aplicación desktop
│   └── configurar-vercel.bat # Configurar Vercel
└── Documentación/
    ├── README.md            # Este archivo
    ├── DESPLIEGUE_WEB.md    # Guía de despliegue web
    ├── ELECTRON_README.md   # Guía de aplicación desktop
    └── AUTHENTICATION_README.md # Guía de autenticación
```

## 🛠️ Instalación y Configuración

### **Requisitos Previos**
- Node.js (v16 o superior)
- npm o yarn
- Cuenta en Supabase

### **Instalación Local**

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/joysense-dashboard.git
   cd joysense-dashboard
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
   ```bash
   # En frontend/env.example (copiar a .env)
   REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=tu-anon-key
   REACT_APP_BACKEND_URL=http://localhost:3001
   ```

4. **Iniciar la aplicación:**
   ```bash
   # Opción 1: Aplicación web
   .\iniciar-dinamico.bat
   
   # Opción 2: Aplicación desktop
   .\iniciar-electron.bat
   ```

## 🚀 Despliegue

### **Despliegue Web (Recomendado)**
```bash
# Construir para producción
.\desplegar-web.bat

# Seguir instrucciones en DESPLIEGUE_WEB.md
```

### **Aplicación Desktop**
```bash
# Construir ejecutable
.\construir-electron.bat
```

## 🔐 Seguridad

### **Claves Seguras de Publicar:**
- ✅ Supabase URL
- ✅ Supabase Anon Key

### **Claves Privadas (NUNCA publicar):**
- ❌ Supabase Service Role Key

## 📱 Uso de la Aplicación

### **Acceso:**
- **URL:** [Tu URL de despliegue]
- **Usuario:** usuario administrador
- **Contraseña:** Cualquier contraseña (temporal)

### **Navegación:**
1. **Seleccionar ubicación:** País → Empresa → Fundo → Sector
2. **Aplicar filtros:** Fecha, entidad
3. **Ver gráficos:** Humedad, Temperatura, Electroconductividad
4. **Diagnóstico:** Verificar conectividad

## 🔧 Desarrollo

### **Scripts Disponibles**

```bash
# Desarrollo
.\iniciar-dinamico.bat          # Aplicación web
.\iniciar-electron.bat          # Aplicación desktop

# Construcción
.\desplegar-web.bat             # Construir para web
.\construir-electron.bat        # Construir desktop

# Utilidades
.\detener.bat                   # Detener servicios
.\compartir-local.bat           # Compartir localmente
```

### **Estructura de Componentes**

- **DynamicHierarchy.tsx** - Componente principal con filtros
- **SeparateCharts.tsx** - Gráficos de sensores
- **ConnectionTest.tsx** - Diagnóstico de conexión
- **LoginForm.tsx** - Formulario de autenticación
- **AuthContext.tsx** - Contexto de autenticación

## 📊 Base de Datos

### **Esquema Supabase (sense)**
- `medicion` - Datos de sensores
- `ubicacion` - Ubicaciones de sensores
- `entidad` - Tipos de cultivos
- `localizacion` - Relación ubicación-entidad
- `pais`, `empresa`, `fundo` - Jerarquía organizacional
- `metrica`, `nodo`, `tipo` - Configuración de sensores

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisar documentación en `/docs`
- Abrir issue en GitHub
- Contactar al equipo de desarrollo

---

**¡Disfruta monitoreando tus sensores agrícolas!** 🌱📊
