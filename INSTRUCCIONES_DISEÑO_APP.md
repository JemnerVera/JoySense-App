# 🎯 INSTRUCCIONES DE DISEÑO - JoySense Dashboard

## 📋 **RESUMEN DEL PROYECTO**

**JoySense Dashboard** es una aplicación de monitoreo de sensores con:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Supabase
- **Base de datos**: PostgreSQL con schema `sense`
- **Autenticación**: Supabase Auth + fallback con tabla `sense.usuario`

---

## 🏗️ **ARQUITECTURA DE COMPONENTES**

### **1. ESTRUCTURA PRINCIPAL**
```
App.tsx
├── AuthContext (autenticación)
├── LanguageContext (idiomas)
├── FiltersContext (filtros globales)
├── LoginForm (pantalla de login)
└── MainLayout
    ├── AppSidebar (sidebar principal)
    ├── AuxiliarySidebar (sidebar auxiliar)
    ├── UserHeader (header con controles)
    └── MainContent
        ├── Dashboard
        ├── SystemParameters
        ├── Umbrales
        ├── Reportes
        └── Configuración
```

### **2. HOOKS PERSONALIZADOS**
- `useAuth()` - Gestión de autenticación
- `useLanguage()` - Traducciones
- `useFilters()` - Filtros globales
- `useAppSidebar()` - Control de sidebars
- `useMainContentLayout()` - Layout del contenido principal
- `useUmbrales()` - Gestión de umbrales
- `useDashboard()` - Datos del dashboard

---

## 🎨 **DISEÑO DE INTERFAZ**

### **1. SIDEBAR PRINCIPAL (AppSidebar)**
```typescript
// Estructura del sidebar principal
const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/dashboard'
  },
  {
    id: 'parameters',
    label: 'Parámetros',
    icon: '⚙️',
    path: '/parameters',
    subItems: [
      { id: 'pais', label: 'Países' },
      { id: 'empresa', label: 'Empresas' },
      { id: 'fundo', label: 'Fundos' },
      { id: 'ubicacion', label: 'Ubicaciones' },
      { id: 'entidad', label: 'Entidades' },
      { id: 'usuario', label: 'Usuarios' },
      { id: 'contacto', label: 'Contactos' },
      { id: 'umbral', label: 'Umbrales' },
      { id: 'perfilumbral', label: 'Perfil Umbral' },
      { id: 'contactoumbral', label: 'Contacto Umbral' }
    ]
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: '📈',
    path: '/reports',
    subItems: [
      { id: 'alertas', label: 'Alertas' },
      { id: 'mensajes', label: 'Mensajes' }
    ]
  }
];
```

**Características del Sidebar Principal:**
- **Ancho**: 280px cuando está expandido, 60px cuando está colapsado
- **Comportamiento**: Hover para expandir temporalmente
- **Indicador visual**: Línea azul en el borde izquierdo del item activo
- **Sub-items**: Se muestran con indentación cuando el item padre está activo
- **Responsive**: Se oculta en móviles, se muestra como overlay

### **2. SIDEBAR AUXILIAR (AuxiliarySidebar)**
```typescript
// Aparece solo en ciertas secciones
const auxiliarySidebarConfig = {
  parameters: {
    show: true,
    component: 'ParametersSidebar',
    width: '320px'
  },
  reports: {
    show: true,
    component: 'ReportsSidebar',
    width: '300px'
  },
  dashboard: {
    show: false
  }
};
```

**Características del Sidebar Auxiliar:**
- **Ancho**: 320px para parámetros, 300px para reportes
- **Posición**: Entre el sidebar principal y el contenido
- **Contenido dinámico**: Cambia según la sección activa
- **Filtros**: Contiene filtros específicos de cada sección

### **3. HEADER (UserHeader)**
```typescript
// Estructura del header
const headerConfig = {
  height: 'h-16', // 64px
  background: 'bg-gray-800',
  padding: 'px-6',
  content: {
    left: 'Logo + Título dinámico',
    center: 'Controles específicos de la sección',
    right: 'Usuario + Configuración'
  }
};
```

**Características del Header:**
- **Altura**: 64px (h-16)
- **Fondo**: Gris oscuro (bg-gray-800)
- **Título dinámico**: Cambia según la sección activa
- **Controles específicos**: 
  - Dashboard: Filtros de fecha, fundo, entidad
  - Parámetros: Botones de crear, actualizar, estado
  - Reportes: Filtros de fecha, ubicación, tipo
- **Usuario**: Avatar + nombre + menú desplegable

---

## 📊 **DISEÑO DE FORMULARIOS**

### **1. FORMULARIO DE UMBRAL**
```typescript
// Estructura del formulario de umbral
const umbralFormLayout = {
  row1: [
    { field: 'nombre', width: 'w-1/2', label: 'Nombre del Umbral' },
    { field: 'descripcion', width: 'w-1/2', label: 'Descripción' }
  ],
  row2: [
    { field: 'criticidadid', width: 'w-1/3', label: 'Criticidad' },
    { field: 'metricasensorid', width: 'w-1/3', label: 'Métrica Sensor' },
    { field: 'statusid', width: 'w-1/3', label: 'Estado' }
  ],
  row3: [
    { 
      container: 'valores-container',
      background: 'bg-gray-100',
      padding: 'p-4',
      rounded: 'rounded-lg',
      fields: [
        { field: 'valorminimo', width: 'w-1/2', label: 'Valor Mínimo' },
        { field: 'valormaximo', width: 'w-1/2', label: 'Valor Máximo' }
      ]
    }
  ]
};
```

**Características del Formulario de Umbral:**
- **Reordenamiento**: Valores mínimo/máximo en contenedor más oscuro
- **Agrupación visual**: Los valores están en un contenedor con fondo gris claro
- **Layout responsive**: 3 filas con distribución lógica
- **Validación**: Valores numéricos, validación de rangos

### **2. FORMULARIO DE LOCALIZACIÓN**
```typescript
// Estructura del formulario de localización
const localizacionFormLayout = {
  row1: [
    { field: 'nombre', width: 'w-1/3', label: 'Nombre' },
    { field: 'direccion', width: 'w-1/3', label: 'Dirección' },
    { field: 'telefono', width: 'w-1/3', label: 'Teléfono' }
  ],
  row2: [
    { field: 'statusid', width: 'w-1/4', label: 'Estado', align: 'text-right' }
  ]
};
```

**Características del Formulario de Localización:**
- **Labels en singular**: "Nombre", "Dirección", "Teléfono" (no "Nombres", "Direcciones")
- **Layout optimizado**: 3 campos en la primera fila, estado en la segunda fila a la derecha
- **Espaciado**: Padding consistente entre campos

---

## 📋 **DISEÑO DE TABLAS**

### **1. TABLA DE UMBRALES**
```typescript
// Columnas de la tabla de umbrales
const umbralColumns = [
  { key: 'nombre', label: 'Nombre', width: 'w-1/4' },
  { key: 'descripcion', label: 'Descripción', width: 'w-1/4' },
  { key: 'criticidad', label: 'Criticidad', width: 'w-1/6' }, // Mostrar nombre, no ID
  { key: 'metricasensor', label: 'Métrica', width: 'w-1/6' },
  { key: 'valorminimo', label: 'Mínimo', width: 'w-1/12' },
  { key: 'valormaximo', label: 'Máximo', width: 'w-1/12' },
  { key: 'status', label: 'Estado', width: 'w-1/12' }
];
```

**Características de las Tablas:**
- **Mostrar nombres**: En lugar de IDs, mostrar nombres descriptivos
- **Umbral**: Mostrar "Criticidad" (nombre) en lugar de "criticidadid"
- **Perfil Umbral**: Mostrar "Perfil" y "Umbral" (nombres) en lugar de IDs
- **Contacto**: Mostrar "Usuario" y "Medio" (nombres) en lugar de IDs
- **Responsive**: Columnas se adaptan al ancho disponible
- **Ordenamiento**: Click en headers para ordenar
- **Filtrado**: Filtros en el sidebar auxiliar

### **2. TABLA DE ALERTAS (Reportes)**
```typescript
// Columnas de la tabla de alertas
const alertasColumns = [
  { key: 'fecha', label: 'Fecha', width: 'w-1/6' },
  { key: 'ubicacion', label: 'Ubicación', width: 'w-1/6' },
  { key: 'umbral', label: 'Umbral', width: 'w-1/6' },
  { key: 'valor_actual', label: 'Valor Actual', width: 'w-1/6' },
  { key: 'valor_umbral', label: 'Valor Umbral', width: 'w-1/6' },
  { key: 'diferencia', label: 'Diferencia', width: 'w-1/6' } // NUEVA COLUMNA
];
```

**Características de la Tabla de Alertas:**
- **Columna "Diferencia"**: Nueva columna que muestra la diferencia entre valor actual y umbral
- **Filtros en sidebar**: Filtro de ubicación, fecha, tipo de alerta
- **Colores**: Alertas críticas en rojo, advertencias en amarillo

---

## 🔧 **FUNCIONALIDADES ESPECÍFICAS**

### **1. SISTEMA DE PARÁMETROS**
```typescript
// Funcionalidad de parámetros
const parametersFeatures = {
  subTabs: ['status', 'insert', 'update', 'delete'],
  tableSelection: 'dropdown en sidebar auxiliar',
  dataDisplay: 'tabla con paginación',
  operations: {
    create: 'formulario modal',
    update: 'formulario inline o modal',
    delete: 'confirmación modal',
    status: 'toggle switch'
  }
};
```

**Características de Parámetros:**
- **Sub-pestañas**: Status, Crear, Actualizar, Eliminar
- **Selección de tabla**: Dropdown en sidebar auxiliar
- **Operaciones CRUD**: Formularios modales o inline
- **Validación**: Validación en tiempo real
- **Feedback**: Mensajes de éxito/error

### **2. SISTEMA DE REPORTES**
```typescript
// Funcionalidad de reportes
const reportsFeatures = {
  alertas: {
    filters: ['ubicacion', 'fecha', 'tipo', 'criticidad'],
    columns: ['fecha', 'ubicacion', 'umbral', 'valor_actual', 'valor_umbral', 'diferencia'],
    export: 'PDF, Excel, CSV'
  },
  mensajes: {
    filters: ['fecha', 'tipo', 'estado'],
    columns: ['fecha', 'tipo', 'mensaje', 'estado'],
    export: 'PDF, Excel, CSV'
  }
};
```

**Características de Reportes:**
- **Filtros avanzados**: En sidebar auxiliar
- **Exportación**: Múltiples formatos
- **Gráficos**: Visualizaciones de datos
- **Tiempo real**: Actualización automática

---

## 🎨 **ESTILOS Y TEMAS**

### **1. COLORES PRINCIPALES**
```css
:root {
  --primary: #3B82F6;      /* Azul */
  --secondary: #6B7280;    /* Gris */
  --success: #10B981;      /* Verde */
  --warning: #F59E0B;      /* Amarillo */
  --error: #EF4444;        /* Rojo */
  --background: #F9FAFB;   /* Fondo claro */
  --surface: #FFFFFF;      /* Superficie */
  --text: #111827;         /* Texto principal */
  --text-secondary: #6B7280; /* Texto secundario */
}
```

### **2. ESPACIADO**
```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
}
```

### **3. TIPOGRAFÍA**
```css
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
}
```

---

## 🔐 **SISTEMA DE AUTENTICACIÓN**

### **1. FLUJO DE AUTENTICACIÓN**
```typescript
// Flujo de autenticación
const authFlow = {
  1: 'Usuario ingresa credenciales',
  2: 'Verificar en Supabase Auth',
  3: 'Si falla, verificar en tabla sense.usuario',
  4: 'Si existe en sense.usuario, aceptar cualquier contraseña (desarrollo)',
  5: 'Crear sesión y redirigir al dashboard'
};
```

### **2. CREDENCIALES DE DESARROLLO**
```typescript
// Credenciales temporales para desarrollo
const devCredentials = {
  email: 'admin@test.com',
  password: 'admin123',
  fallback: 'Cualquier email de sense.usuario con cualquier contraseña'
};
```

---

## 📱 **RESPONSIVE DESIGN**

### **1. BREAKPOINTS**
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### **2. COMPORTAMIENTO RESPONSIVE**
- **Mobile**: Sidebar como overlay, header compacto
- **Tablet**: Sidebar colapsable, contenido adaptado
- **Desktop**: Sidebar expandible, layout completo

---

## 🚀 **INSTRUCCIONES DE IMPLEMENTACIÓN**

### **1. ORDEN DE IMPLEMENTACIÓN**
1. **Estructura base**: App.tsx, contextos, hooks
2. **Autenticación**: Login, AuthContext, rutas protegidas
3. **Layout**: Sidebars, header, contenido principal
4. **Dashboard**: Componentes básicos, datos mock
5. **Parámetros**: Tablas, formularios, operaciones CRUD
6. **Reportes**: Alertas, mensajes, filtros
7. **Estilos**: Temas, responsive, animaciones
8. **Testing**: Pruebas de funcionalidad

### **2. ARCHIVOS CLAVE**
- `App.tsx` - Componente principal
- `contexts/AuthContext.tsx` - Autenticación
- `components/AppSidebar.tsx` - Sidebar principal
- `components/AuxiliarySidebar.tsx` - Sidebar auxiliar
- `components/UserHeader.tsx` - Header
- `components/SystemParameters.tsx` - Parámetros
- `components/Dashboard/index.tsx` - Dashboard
- `services/backend-api.ts` - API del backend
- `hooks/useAppSidebar.ts` - Hook del sidebar

### **3. DEPENDENCIAS PRINCIPALES**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.0",
    "tailwindcss": "^3.3.0",
    "@supabase/supabase-js": "^2.38.0",
    "react-router-dom": "^6.8.0"
  }
}
```

---

## ✅ **CHECKLIST DE FUNCIONALIDADES**

### **Autenticación**
- [ ] Login con Supabase Auth
- [ ] Fallback con tabla sense.usuario
- [ ] Credenciales de desarrollo
- [ ] Protección de rutas
- [ ] Logout funcional

### **Layout**
- [ ] Sidebar principal expandible/colapsable
- [ ] Sidebar auxiliar dinámico
- [ ] Header con controles específicos
- [ ] Contenido principal responsive
- [ ] Navegación entre secciones

### **Dashboard**
- [ ] Widgets de estadísticas
- [ ] Gráficos de datos
- [ ] Filtros de fecha/ubicación
- [ ] Datos en tiempo real
- [ ] Exportación de reportes

### **Parámetros**
- [ ] Selección de tabla
- [ ] Sub-pestañas funcionales
- [ ] Operaciones CRUD
- [ ] Formularios validados
- [ ] Mensajes de feedback

### **Reportes**
- [ ] Tabla de alertas
- [ ] Tabla de mensajes
- [ ] Filtros avanzados
- [ ] Columna de diferencia
- [ ] Exportación múltiple

### **Estilos**
- [ ] Tema consistente
- [ ] Responsive design
- [ ] Animaciones suaves
- [ ] Accesibilidad
- [ ] Iconografía coherente

---

## 🎯 **OBJETIVO FINAL**

Crear una aplicación de monitoreo de sensores completamente funcional con:
- **Interfaz moderna** y responsive
- **Navegación intuitiva** con sidebars dinámicos
- **Formularios optimizados** con validación
- **Tablas informativas** con datos relevantes
- **Reportes completos** con filtros y exportación
- **Autenticación robusta** con fallbacks
- **Código modular** y mantenible

**¡La aplicación debe estar lista para producción!** 🚀
