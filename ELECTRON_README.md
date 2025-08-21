# 🖥️ JoySense Dashboard - Aplicación de Escritorio

## 📋 Resumen

Se ha convertido la aplicación web JoySense Dashboard en una aplicación de escritorio nativa usando **Electron**. Esto permite que la aplicación funcione como un programa independiente en Windows, macOS y Linux.

## 🚀 Características

### ✅ **Funcionalidades Implementadas**
- **Ventana nativa** - Se abre como aplicación de escritorio
- **Menú completo** - Menú nativo con opciones de archivo, editar, ver, etc.
- **Todas las funcionalidades web** - Mantiene autenticación, filtros, gráficos, etc.
- **Acceso al sistema** - Puede crear accesos directos, instalador, etc.
- **Desarrollo integrado** - Hot reload y DevTools en desarrollo

### 🎯 **Ventajas sobre Web Browser**
- ✅ **Ventana independiente** - No depende del navegador
- ✅ **Mejor rendimiento** - Optimizado para escritorio
- ✅ **Acceso nativo** - Menús del sistema operativo
- ✅ **Instalación** - Se puede instalar como programa normal
- ✅ **Distribución** - Archivo ejecutable único

## 🛠️ Instalación y Uso

### **Para Desarrollo**

1. **Ejecutar en modo desarrollo:**
   ```bash
   .\iniciar-electron.bat
   ```

2. **O manualmente:**
   ```bash
   cd frontend
   npm run electron-dev
   ```

### **Para Construir Ejecutable**

1. **Construir para Windows:**
   ```bash
   .\construir-electron.bat
   ```

2. **O manualmente:**
   ```bash
   cd frontend
   npm run dist-win
   ```

## 📁 Estructura de Archivos

```
frontend/
├── public/
│   ├── electron.js          # Archivo principal de Electron
│   └── assets/              # Iconos de la aplicación
├── package.json             # Configuración con scripts de Electron
└── dist/                    # Ejecutables construidos (se crea automáticamente)

Scripts:
├── iniciar-electron.bat     # Iniciar en modo desarrollo
└── construir-electron.bat   # Construir ejecutable
```

## 🔧 Configuración

### **Ventana Principal**
- **Tamaño:** 1400x900 píxeles
- **Tamaño mínimo:** 1200x800 píxeles
- **Título:** "JoySense Dashboard"
- **Seguridad:** Context isolation habilitado

### **Menú Personalizado**
- **Archivo:** Nueva ventana, Salir
- **Editar:** Cortar, Copiar, Pegar
- **Ver:** Recargar, DevTools, Zoom
- **Ventana:** Minimizar, Cerrar
- **Ayuda:** Acerca de

## 📦 Construcción

### **Comandos Disponibles**

```bash
# Desarrollo
npm run electron-dev          # Iniciar con hot reload

# Construcción
npm run dist                  # Construir para todas las plataformas
npm run dist-win             # Solo Windows (.exe)
npm run dist-mac             # Solo macOS (.dmg)
npm run dist-linux           # Solo Linux (.AppImage)
```

### **Configuración de Build**
- **Windows:** Instalador NSIS con acceso directo
- **macOS:** DMG con icono personalizado
- **Linux:** AppImage portable

## 🎯 Uso de la Aplicación

### **Inicio Rápido**
1. Ejecutar `.\iniciar-electron.bat`
2. La aplicación se abrirá en una ventana nativa
3. Usar `patricio.sandoval@migivagroup.com` para login
4. Todas las funcionalidades web están disponibles

### **Funcionalidades Específicas**
- **Menú nativo** - Usar menús del sistema operativo
- **Atajos de teclado** - Ctrl+N (nueva ventana), Ctrl+Q (salir)
- **DevTools** - F12 o menú Ver > Toggle DevTools
- **Pantalla completa** - F11 o menú Ver > Toggle Full Screen

## 🔒 Seguridad

### **Configuraciones de Seguridad**
- **Node Integration:** Deshabilitado
- **Context Isolation:** Habilitado
- **Web Security:** Habilitado
- **Remote Module:** Deshabilitado

### **Buenas Prácticas**
- ✅ No se expone Node.js al renderer
- ✅ Comunicación segura entre procesos
- ✅ Validación de URLs de carga
- ✅ Manejo de errores robusto

## 🐛 Solución de Problemas

### **Error: "Electron no encontrado"**
```bash
cd frontend
npm install --save-dev electron
```

### **Error: "Backend no disponible"**
1. Verificar que el backend esté ejecutándose en puerto 3001
2. Ejecutar `.\iniciar-dinamico.bat` primero

### **Error: "Puerto 3000 ocupado"**
```bash
# Cambiar puerto en package.json
"start": "set PORT=3001 && react-scripts start"
```

### **Error de Construcción**
```bash
# Limpiar cache
npm run build -- --reset-cache
rm -rf node_modules
npm install
```

## 📈 Rendimiento

### **Optimizaciones**
- **Lazy Loading** - Carga bajo demanda
- **Code Splitting** - División de bundles
- **Tree Shaking** - Eliminación de código no usado
- **Minificación** - Archivos optimizados

### **Tamaños de Archivo**
- **Desarrollo:** ~200MB (incluye DevTools)
- **Producción:** ~50MB (ejecutable final)
- **Instalador:** ~30MB (Windows NSIS)

## 🔮 Próximos Pasos

### **Mejoras Planificadas**
1. **Auto-updater** - Actualizaciones automáticas
2. **Tray icon** - Icono en bandeja del sistema
3. **Notificaciones** - Alertas del sistema
4. **Acceso directo** - Integración con escritorio
5. **Tema oscuro** - Modo oscuro nativo

### **Funcionalidades Avanzadas**
1. **Offline mode** - Funcionamiento sin internet
2. **Data export** - Exportar a Excel/PDF
3. **Print support** - Impresión de reportes
4. **Drag & drop** - Arrastrar archivos
5. **Global shortcuts** - Atajos globales

## 📝 Notas Técnicas

### **Tecnologías Utilizadas**
- **Electron:** Framework de aplicaciones de escritorio
- **React:** Interfaz de usuario
- **Node.js:** Backend y herramientas
- **TypeScript:** Type safety
- **Tailwind CSS:** Estilos

### **Compatibilidad**
- **Windows:** 10, 11 (x64)
- **macOS:** 10.15+ (Intel/Apple Silicon)
- **Linux:** Ubuntu 18.04+, CentOS 7+

### **Requisitos del Sistema**
- **RAM:** 4GB mínimo, 8GB recomendado
- **Disco:** 500MB espacio libre
- **Red:** Conexión a internet para datos
- **Backend:** Servidor Node.js ejecutándose
