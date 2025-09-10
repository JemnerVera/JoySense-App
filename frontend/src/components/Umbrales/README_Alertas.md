# Sistema de Filtros de Alertas

## Descripción
Sistema modular para manejar filtros de Criticidad y Ubicación en el sidebar auxiliar de Reportes - Alertas.

## Arquitectura

### 1. Contexto de Filtros
- **Archivo**: `contexts/AlertasFilterContext.tsx`
- **Funcionalidad**: Maneja el estado global de los filtros
- **Hooks**:
  - `useAlertasFilter()`: Hook principal (lanza error si no hay contexto)
  - `useAlertasFilterSafe()`: Hook seguro (retorna undefined si no hay contexto)

### 2. Configuración
- **Archivo**: `config/alertasConfig.ts`
- **Funcionalidad**: Centraliza configuración, estilos y tipos
- **Beneficios**: Fácil mantenimiento y consistencia

### 3. Componentes

#### ReportesAlertasWrapper
- **Archivo**: `components/ReportesAlertasWrapper.tsx`
- **Funcionalidad**: Envuelve el contenido con el provider de contexto
- **Uso**: Se activa automáticamente cuando `activeTab === 'reportes-alertas'`

#### AlertasFilters
- **Archivo**: `components/sidebar/AlertasFilters.tsx`
- **Funcionalidad**: Renderiza los filtros en el sidebar auxiliar
- **Características**:
  - Hook seguro que no crashea la app
  - Validaciones robustas
  - Estilos centralizados

#### AlertasWithSidebar
- **Archivo**: `components/Umbrales/AlertasWithSidebar.tsx`
- **Funcionalidad**: Conecta el componente de alertas con el contexto
- **Características**:
  - Manejo de errores con fallback
  - Comunicación bidireccional con el sidebar

## Flujo de Datos

```
App.tsx (ReportesAlertasWrapper cuando activeTab === 'reportes-alertas')
├── SidebarContainer
│   └── AuxiliarySidebar
│       └── AlertasFilters (usa useAlertasFilterSafe)
└── UmbralesMain
    └── AlertasWithSidebar (usa useAlertasFilter)
        └── EstadoActualSensores
```

## Características de Seguridad

### 1. Manejo de Errores
- **Hook seguro**: `useAlertasFilterSafe()` no lanza errores
- **Fallbacks**: Componentes funcionan sin contexto
- **Validaciones**: Verificación de funciones y arrays

### 2. Robustez
- **Valores por defecto**: Configuración centralizada
- **Verificaciones**: Arrays y funciones disponibles
- **Try-catch**: Manejo de errores en componentes críticos

### 3. Modularidad
- **Separación de responsabilidades**: Cada componente tiene una función específica
- **Configuración centralizada**: Fácil mantenimiento
- **Reutilización**: Componentes independientes

## Uso

### Activación Automática
El sistema se activa automáticamente cuando el usuario navega a "Reportes - Alertas".

### Filtros Disponibles
1. **Criticidad**: Filtra por nivel de criticidad
2. **Ubicación**: Filtra por ubicación específica

### Comportamiento
- Los filtros aparecen en el sidebar auxiliar
- Se posicionan debajo de las subpestañas
- Empujan el contenido hacia abajo
- Se sincronizan con la tabla principal

## Mantenimiento

### Agregar Nuevos Filtros
1. Actualizar `alertasConfig.ts` con nuevos valores
2. Modificar el contexto para incluir el nuevo estado
3. Actualizar `AlertasFilters.tsx` para renderizar el nuevo filtro
4. Modificar `EstadoActualSensores.tsx` para usar el nuevo filtro

### Cambiar Estilos
1. Modificar `ALERTAS_CONFIG.STYLES` en `alertasConfig.ts`
2. Los cambios se aplicarán automáticamente a todos los componentes

### Debugging
- Usar `console.warn` en lugar de `console.error` para evitar crashes
- Verificar que el contexto esté disponible antes de usarlo
- Usar el hook seguro `useAlertasFilterSafe()` en componentes del sidebar
