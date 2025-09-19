# Scripts de Migración - SystemParameters.tsx

## 📋 Descripción

Este directorio contiene scripts y herramientas para automatizar la migración del componente `SystemParameters.tsx` desde la versión original a la versión refactorizada.

## 🚀 Scripts Disponibles

### `migrate-system-parameters.js`

Script principal de migración que automatiza todo el proceso de migración.

#### Uso

```bash
# Ejecutar migración completa
node scripts/migrate-system-parameters.js

# Ejecutar con force (ignorar tests fallidos)
node scripts/migrate-system-parameters.js --force
```

#### Funcionalidades

- ✅ Verificación del directorio del proyecto
- ✅ Creación de backup del componente original
- ✅ Verificación del componente refactorizado
- ✅ Ejecución de tests
- ✅ Creación de componente de transición
- ✅ Actualización de imports
- ✅ Creación de tests de migración
- ✅ Generación de reporte de migración

### `migration-config.json`

Archivo de configuración que contiene toda la información sobre la migración.

#### Estructura

```json
{
  "migration": {
    "version": "1.0.0",
    "date": "2024-12-19",
    "description": "Migración de SystemParameters.tsx a versión refactorizada"
  },
  "components": {
    "original": {
      "path": "frontend/src/components/SystemParameters.tsx",
      "size": "~14,390 líneas"
    },
    "refactored": {
      "path": "frontend/src/components/SystemParametersRefactored.tsx",
      "size": "~500 líneas"
    }
  },
  "performance": {
    "before": { "loadTime": "~3.2s" },
    "after": { "loadTime": "~1.8s" },
    "improvements": { "loadTime": "-44%" }
  }
}
```

## 📁 Estructura de Archivos

```
scripts/
├── README.md                           # Este archivo
├── migrate-system-parameters.js        # Script principal de migración
├── migration-config.json              # Configuración de migración
└── backup/                            # Directorio de backups
    └── system-parameters/
        └── SystemParameters.tsx.backup
```

## 🔧 Configuración

### Requisitos Previos

1. **Node.js** >= 14.0.0
2. **npm** >= 6.0.0
3. **Git** configurado
4. **Proyecto** en estado limpio (sin cambios sin commit)

### Variables de Entorno

```bash
# Opcional: Forzar migración sin tests
REACT_APP_FORCE_MIGRATION=true

# Opcional: Usar versión refactorizada por defecto
REACT_APP_USE_REFACTORED=true
```

## 📋 Proceso de Migración

### 1. Preparación

```bash
# Verificar que estamos en el directorio correcto
cd /path/to/project

# Verificar estado de Git
git status

# Crear branch de migración
git checkout -b feature/migrate-system-parameters
```

### 2. Ejecución

```bash
# Ejecutar script de migración
node scripts/migrate-system-parameters.js
```

### 3. Verificación

```bash
# Ejecutar tests
npm test

# Verificar funcionalidad
npm run dev

# Revisar reporte de migración
cat docs/MIGRATION_REPORT.md
```

### 4. Commit

```bash
# Agregar cambios
git add .

# Commit de migración
git commit -m "feat: Migrar SystemParameters a versión refactorizada

- Crear componente de transición
- Actualizar imports
- Crear tests de migración
- Generar reporte de migración
- Mejorar performance y mantenibilidad"

# Push a branch
git push origin feature/migrate-system-parameters
```

## 🧪 Testing

### Tests Automatizados

```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Tests de migración
npm test -- --testPathPattern=SystemParametersTransition
```

### Tests Manuales

1. **Navegación**: Verificar que todas las rutas funcionan
2. **Funcionalidades**: Probar todas las funcionalidades del sistema
3. **Performance**: Verificar tiempos de carga y respuesta
4. **Responsive**: Probar en diferentes dispositivos
5. **Accesibilidad**: Verificar navegación por teclado

## 🔄 Rollback

### Rollback Automático

```bash
# Revertir cambios
git revert <commit-hash>

# Deploy
npm run deploy:production
```

### Rollback Manual

1. **Restaurar backup**:
   ```bash
   cp backup/system-parameters/SystemParameters.tsx.backup frontend/src/components/SystemParameters.tsx
   ```

2. **Revertir imports**:
   ```bash
   git checkout HEAD~1 -- frontend/src/App.tsx
   git checkout HEAD~1 -- frontend/src/components/Dashboard.tsx
   git checkout HEAD~1 -- frontend/src/components/Sidebar.tsx
   ```

3. **Deploy**:
   ```bash
   npm run deploy:production
   ```

## 📊 Monitoreo

### Métricas a Monitorear

- **Error rate**: < 0.1%
- **Response time**: < 500ms
- **Memory usage**: < 50MB
- **Bundle size**: < 1.5MB
- **Lighthouse score**: > 90

### Herramientas de Monitoreo

- **React DevTools**: Profiler y Components
- **Lighthouse**: Performance y accesibilidad
- **Bundle Analyzer**: Análisis de bundle
- **Performance API**: Métricas personalizadas

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Tests Fallidos

```bash
# Ver logs detallados
npm test -- --verbose

# Ejecutar con force
node scripts/migrate-system-parameters.js --force
```

#### 2. Imports No Actualizados

```bash
# Buscar imports manualmente
grep -r "SystemParameters" frontend/src/

# Actualizar manualmente
# Reemplazar en cada archivo encontrado
```

#### 3. Componente de Transición No Funciona

```bash
# Verificar que existe
ls -la frontend/src/components/SystemParametersTransition.tsx

# Verificar imports
grep -r "SystemParametersTransition" frontend/src/
```

#### 4. Performance Degradada

```bash
# Verificar bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Verificar memory leaks
# Usar React DevTools Profiler
```

### Logs y Debugging

```bash
# Habilitar logs detallados
DEBUG=migration:* node scripts/migrate-system-parameters.js

# Ver logs de migración
tail -f logs/migration.log
```

## 📚 Documentación Relacionada

- [Plan de Refactoring](../docs/REFACTORING_PLAN.md)
- [Documentación de Componentes Refactorizados](../docs/REFACTORED_COMPONENTS_DOCUMENTATION.md)
- [Optimizaciones de Rendimiento](../docs/PERFORMANCE_OPTIMIZATIONS.md)
- [Guía de Migración](../docs/MIGRATION_GUIDE.md)

## 🤝 Contribución

### Reportar Issues

1. Crear issue en el repositorio
2. Incluir logs y pasos para reproducir
3. Especificar versión de Node.js y npm
4. Adjuntar archivos de configuración relevantes

### Mejoras

1. Fork del repositorio
2. Crear branch para la mejora
3. Implementar cambios
4. Agregar tests
5. Crear pull request

## 📞 Soporte

Para dudas o problemas:

- **Equipo de Desarrollo**: [email]
- **Documentación**: [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/project/issues)

---

**Nota**: Este script está en desarrollo activo. Para la versión más reciente, consulta el repositorio del proyecto.
