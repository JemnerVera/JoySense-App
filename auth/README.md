# 📁 Carpeta Auth - Documentación de Autenticación y Permisos

Esta carpeta contiene toda la documentación y scripts relacionados con el sistema de autenticación y permisos de JoySense.

## 📋 Archivos

### 📚 Documentación

- **`COMO_FUNCIONA_SISTEMA_PERMISOS.md`** - Explicación completa del sistema de permisos en 3 capas
- **`COMO_FUNCIONAN_VISTAS_PERMISOS.md`** - Cómo se llenan las vistas de permisos dinámicamente
- **`DIAGRAMA_SISTEMA_PERMISOS.md`** - Diagrama visual del flujo de permisos
- **`GESTION_PERMISOS_AUTOMATICA.md`** - Gestión automática de permisos al insertar empresas/fundos
- **`PROBLEMA_INSERT_PAIS.md`** - Explicación del problema RLS al insertar países
- **`DIAGNOSTICO_RLS.md`** - Diagnóstico de problemas RLS
- **`SOLUCION_LOGIN_Y_TABLAS.md`** - Solución de problemas de login y tablas
- **`FLUJO_AUTH_ERASER.md`** - Documentación del flujo de autenticación
- **`FLUJO_AUTENTICACION.eraser`** - Diagrama de flujo para Eraser.io

### 🔧 Scripts SQL

- **`TRIGGERS_AUTO_PERMISOS.sql`** - Triggers para crear permisos automáticamente (pais, empresa, fundo)
- **`SOLUCION_RLS_INSERT_PAIS.sql`** - Solución para el problema RLS al insertar países
- **`INSERTAR_PERMISOS_EMPRESA_FUNDO.sql`** - Script para insertar permisos manualmente
- **`QUERIES_SOLUCION_PERMISOS.sql`** - Queries para diagnosticar y solucionar permisos
- **`QUERIES_VERIFICAR_RLS.sql`** - Queries para verificar políticas RLS
- **`QUERIES_VERIFICAR_VISTAS_PERMISOS.sql`** - Queries para verificar vistas de permisos

### 📊 Resultados

- **`resultado_queries.txt`** - Resultados de queries de diagnóstico

## 🚀 Uso Rápido

### Para insertar permisos manualmente (empresa/fundo existentes):

```sql
-- Ejecutar: INSERTAR_PERMISOS_EMPRESA_FUNDO.sql
```

### Para crear triggers automáticos:

```sql
-- Ejecutar: TRIGGERS_AUTO_PERMISOS.sql
```

### Para solucionar problema de INSERT en pais:

```sql
-- Ejecutar: SOLUCION_RLS_INSERT_PAIS.sql
```

## 🔗 Flujo de Trabajo

1. **Primera vez**: Ejecutar `INSERTAR_PERMISOS_EMPRESA_FUNDO.sql` para dar permisos a empresas/fundos existentes
2. **Configurar triggers**: Ejecutar `TRIGGERS_AUTO_PERMISOS.sql` para permisos automáticos
3. **Solucionar INSERT**: Ejecutar `SOLUCION_RLS_INSERT_PAIS.sql` si hay problemas al insertar países

## 📖 Conceptos Clave

- **RLS (Row Level Security)**: Políticas que controlan acceso a nivel de fila
- **Vistas de Permisos**: `v_permiso_pais`, `v_permiso_empresa`, `v_permiso_fundo`
- **Tabla Base**: `perfil_geografia_permiso` - Define permisos por perfil y nivel geográfico
- **Triggers**: Crean permisos automáticamente al insertar nuevos registros
